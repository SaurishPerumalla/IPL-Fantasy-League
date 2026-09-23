import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { getPlayerById } from '../data/players';
import { VENUES, IPL_FRANCHISES_PRESET } from '../data/iplTeams';
import { Fixture, Player, Team } from '../types/fantasy';
import {
  Calendar,
  ArrowRightLeft,
  Shield,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Search,
  Filter,
  Flame,
  Trophy,
  ChevronRight,
  MapPin,
  Clock,
  Sparkles,
  BarChart3,
  Layers,
  Award,
  TrendingUp,
  Eye,
  Check,
  Info
} from 'lucide-react';

const FRANCHISES = [
  { code: 'ALL', name: 'All 10 Franchises', color: '#6366f1', emoji: '🏏' },
  { code: 'CSK', name: 'Chennai Super Kings', color: '#eab308', emoji: '🦁' },
  { code: 'MI', name: 'Mumbai Indians', color: '#0284c7', emoji: '⚡' },
  { code: 'RCB', name: 'Royal Challengers Bengaluru', color: '#dc2626', emoji: '👑' },
  { code: 'KKR', name: 'Kolkata Knight Riders', color: '#7c3aed', emoji: '⚔️' },
  { code: 'SRH', name: 'Sunrisers Hyderabad', color: '#f97316', emoji: '🦅' },
  { code: 'RR', name: 'Rajasthan Royals', color: '#ec4899', emoji: '👑' },
  { code: 'DC', name: 'Delhi Capitals', color: '#2563eb', emoji: '🐯' },
  { code: 'PBKS', name: 'Punjab Kings', color: '#b91c1c', emoji: '🦁' },
  { code: 'GT', name: 'Gujarat Titans', color: '#0f766e', emoji: '⚡' },
  { code: 'LSG', name: 'Lucknow Super Giants', color: '#06b6d4', emoji: '🦅' }
];

export const SchedulePlannerView: React.FC<{ onNavigateToTransfers?: () => void }> = ({
  onNavigateToTransfers
}) => {
  const {
    state,
    humanTeam,
    allTeams,
    openTransferModal,
    openLineupModal,
    openScorecardModal
  } = useGame();

  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'matrix' | 'planner'>('schedule');
  const [selectedMatchday, setSelectedMatchday] = useState<number>(state.league_meta.current_matchday);
  const [selectedFranchiseFilter, setSelectedFranchiseFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UPCOMING' | 'COMPLETED' | 'MY_PLAYERS'>('ALL');

  const currentMatchday = state.league_meta.current_matchday;
  const totalMatchdays = state.league_meta.total_matchdays;
  const transfersRemaining = state.transfers_state?.league_transfers_remaining ?? 100;
  const matchdaysRemaining = Math.max(1, totalMatchdays - currentMatchday + 1);
  const recommendedPace = (transfersRemaining / matchdaysRemaining).toFixed(1);

  // Map of team ID to Team object
  const teamMap = useMemo(() => {
    const map: { [id: string]: Team } = {};
    allTeams.forEach(t => { map[t.id] = t; });
    return map;
  }, [allTeams]);

  // Player objects in Human XI
  const myXIPlayers = useMemo(() => {
    return humanTeam.playing_xi
      .map(id => getPlayerById(id))
      .filter((p): p is Player => p !== undefined);
  }, [humanTeam.playing_xi]);

  // Breakdown of user players by franchise
  const myPlayersByFranchise = useMemo(() => {
    const counts: { [franchise: string]: Player[] } = {};
    myXIPlayers.forEach(p => {
      const aff = p.teamAffiliation || 'OTHER';
      if (!counts[aff]) counts[aff] = [];
      counts[aff].push(p);
    });
    return counts;
  }, [myXIPlayers]);

  // Helper to determine if a fixture involves a franchise
  const fixtureInvolvesFranchise = (fixture: Fixture, franchiseCode: string): boolean => {
    if (franchiseCode === 'ALL') return true;
    const t1 = teamMap[fixture.team1Id];
    const t2 = teamMap[fixture.team2Id];
    return (
      t1?.shortCode === franchiseCode ||
      t1?.id === franchiseCode ||
      (franchiseCode === 'CSK' && (t1?.is_human || t2?.is_human)) || // Base preset alignment
      t2?.shortCode === franchiseCode ||
      t2?.id === franchiseCode
    );
  };

  // Helper to get players in user's XI who are playing in a specific fixture
  const getMyPlayersInFixture = (fixture: Fixture): Player[] => {
    const t1 = teamMap[fixture.team1Id];
    const t2 = teamMap[fixture.team2Id];

    return myXIPlayers.filter(p => {
      if (t1?.is_human && t1.playing_xi?.includes(p.id)) return true;
      if (t2?.is_human && t2.playing_xi?.includes(p.id)) return true;
      return (
        p.teamAffiliation === t1?.shortCode ||
        p.teamAffiliation === t1?.id ||
        p.teamAffiliation === t2?.shortCode ||
        p.teamAffiliation === t2?.id
      );
    });
  };

  // Calculate user squad coverage for any given matchday (1 to 14)
  const getMatchdayCoverage = (md: number) => {
    const mdFixtures = state.fixtures.filter(f => f.matchday === md);
    const activePlayerSet = new Set<string>();

    mdFixtures.forEach(f => {
      const myPlayers = getMyPlayersInFixture(f);
      myPlayers.forEach(p => activePlayerSet.add(p.id));
    });

    const activePlayers = myXIPlayers.filter(p => activePlayerSet.has(p.id));
    const benchedPlayers = myXIPlayers.filter(p => !activePlayerSet.has(p.id));

    return {
      matchday: md,
      fixturesCount: mdFixtures.length,
      activeCount: activePlayers.length,
      totalCount: myXIPlayers.length,
      activePlayers,
      benchedPlayers,
      coveragePercent: myXIPlayers.length > 0 ? Math.round((activePlayers.length / myXIPlayers.length) * 100) : 0
    };
  };

  // Calculate upcoming 5-matchday roadmap
  const upcomingRoadmap = useMemo(() => {
    const roadmap = [];
    const startMD = currentMatchday;
    const endMD = Math.min(totalMatchdays, currentMatchday + 4);

    for (let md = startMD; md <= endMD; md++) {
      roadmap.push(getMatchdayCoverage(md));
    }
    return roadmap;
  }, [currentMatchday, totalMatchdays, state.fixtures, myXIPlayers]);

  // Filtered fixtures for the "Schedule" subtab
  const filteredFixtures = useMemo(() => {
    return state.fixtures.filter(fixture => {
      // Matchday filter
      if (selectedMatchday !== 0 && fixture.matchday !== selectedMatchday) {
        return false;
      }

      // Franchise filter
      if (selectedFranchiseFilter !== 'ALL' && !fixtureInvolvesFranchise(fixture, selectedFranchiseFilter)) {
        return false;
      }

      // Status filter
      if (statusFilter === 'UPCOMING' && fixture.isCompleted) return false;
      if (statusFilter === 'COMPLETED' && !fixture.isCompleted) return false;
      if (statusFilter === 'MY_PLAYERS') {
        const myPlayers = getMyPlayersInFixture(fixture);
        if (myPlayers.length === 0) return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const t1 = teamMap[fixture.team1Id];
        const t2 = teamMap[fixture.team2Id];
        const myPlayers = getMyPlayersInFixture(fixture);
        const matchVenue = fixture.venue.toLowerCase();
        const matchTeams = `${t1?.name || ''} ${t1?.shortCode || ''} ${t2?.name || ''} ${t2?.shortCode || ''}`.toLowerCase();
        const matchPlayers = myPlayers.map(p => p.name.toLowerCase()).join(' ');

        if (!matchVenue.includes(q) && !matchTeams.includes(q) && !matchPlayers.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [
    state.fixtures,
    selectedMatchday,
    selectedFranchiseFilter,
    statusFilter,
    searchQuery,
    teamMap,
    myXIPlayers
  ]);

  // Pitch detail lookup helper
  const getVenuePitchInfo = (venueStr: string) => {
    const found = VENUES.find(v => venueStr.toLowerCase().includes(v.name.toLowerCase()) || venueStr.toLowerCase().includes(v.city.toLowerCase()));
    return found ? found.defaultPitch : 'Balanced Surface';
  };

  return (
    <div className="space-y-6">
      {/* Hero Header & Transfer Conservation HUD */}
      <div className="bg-gradient-to-r from-[#091436] via-[#0e1e4a] to-[#091436] border border-indigo-900/60 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md shadow-indigo-500/20 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Season Fixture &amp; Transfer Planner</span>
              </span>
              <span className="bg-[#050c1e] text-slate-300 border border-indigo-900/60 text-xs font-mono px-2.5 py-0.5 rounded-full">
                70 League Matches • 14 Matchdays
              </span>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full">
                MD {currentMatchday} Active
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              TATA IPL 2026 Match Schedule &amp; Transfer Optimizer
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Plan your 11 ahead of time to conserve your <strong>100 League Transfers</strong>.
              Identify back-to-back runs, pitch conditions, and multi-game franchises so you make minimal transfers while fielding a full scoring XI every matchday.
            </p>
          </div>

          {/* Quick Transfer Budget Meter */}
          <div className="bg-[#060e24] p-4 rounded-2xl border border-indigo-900/70 flex flex-col sm:flex-row lg:flex-col gap-3 min-w-[260px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-300">Transfer Budget</span>
              </div>
              <span className="font-mono text-sm font-black text-cyan-300">
                {transfersRemaining} / 100 Left
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-indigo-950">
              <div
                className={`h-full transition-all duration-500 ${
                  transfersRemaining > 50
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                    : transfersRemaining > 20
                    ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                    : 'bg-gradient-to-r from-rose-500 to-red-600'
                }`}
                style={{ width: `${(transfersRemaining / 100) * 100}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>Rec. Burn Rate:</span>
              <span className="text-emerald-400 font-bold">~{recommendedPace} per MD</span>
            </div>

            <button
              onClick={openTransferModal}
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 cursor-pointer active:scale-95"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              <span>Make Transfers</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#081230] p-1.5 rounded-2xl border border-indigo-900/60">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab('schedule')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              activeSubTab === 'schedule'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-300 hover:text-white hover:bg-indigo-950/60'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>All Fixtures ({state.fixtures.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              activeSubTab === 'matrix'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-300 hover:text-white hover:bg-indigo-950/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Franchise Matrix Grid</span>
          </button>

          <button
            onClick={() => setActiveSubTab('planner')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
              activeSubTab === 'planner'
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-300 hover:text-white hover:bg-indigo-950/60'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Transfer Saver Planner</span>
          </button>
        </div>

        {/* Quick Squad Status Tag */}
        <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-slate-300 px-3">
          <span className="text-slate-400">My 11:</span>
          <span className="text-amber-400 font-bold">{myXIPlayers.length} Players</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">
            {getMatchdayCoverage(currentMatchday).activeCount}/11 Active This MD
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: ALL FIXTURES (MATCHDAY-BY-MATCHDAY BROWSER)                     */}
      {/* ========================================================================= */}
      {activeSubTab === 'schedule' && (
        <div className="space-y-5">
          {/* Matchday Selector Pills (MD 1 to 14 + ALL) */}
          <div className="bg-[#091436] p-3 rounded-2xl border border-indigo-900/50 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-bold">
              <span>SELECT MATCHDAY ROUND:</span>
              <span className="text-violet-400 font-mono">
                {selectedMatchday === 0 ? 'Viewing All Rounds' : `Viewing Matchday ${selectedMatchday}`}
              </span>
            </div>

            <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setSelectedMatchday(0)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition shrink-0 cursor-pointer ${
                  selectedMatchday === 0
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'bg-[#050c1e] text-slate-300 hover:bg-indigo-950 border border-indigo-950'
                }`}
              >
                All 14 MDs
              </button>

              {Array.from({ length: totalMatchdays }, (_, i) => i + 1).map(md => {
                const isCurrent = md === currentMatchday;
                const isPast = md < currentMatchday;
                const coverage = getMatchdayCoverage(md);

                return (
                  <button
                    key={md}
                    onClick={() => setSelectedMatchday(md)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center space-x-1.5 cursor-pointer relative ${
                      selectedMatchday === md
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30 font-black'
                        : isCurrent
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                        : isPast
                        ? 'bg-[#050c1e] text-slate-400 hover:text-slate-200 border border-indigo-950/70'
                        : 'bg-[#050c1e] text-slate-300 hover:bg-indigo-950 border border-indigo-900/40'
                    }`}
                  >
                    <span>MD {md}</span>
                    {isCurrent && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    )}
                    {/* Active players pill */}
                    <span className={`text-[10px] px-1 rounded font-mono ${
                      selectedMatchday === md
                        ? 'bg-white/20 text-white'
                        : coverage.activeCount >= 10
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}>
                      {coverage.activeCount}/11
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters & Search Row */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#081230] p-3 rounded-2xl border border-indigo-900/50">
            {/* Franchise Pills */}
            <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar py-1">
              {FRANCHISES.map(f => (
                <button
                  key={f.code}
                  onClick={() => setSelectedFranchiseFilter(f.code)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1 ${
                    selectedFranchiseFilter === f.code
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-[#050c1e] text-slate-400 hover:text-white border border-indigo-950'
                  }`}
                >
                  <span>{f.emoji}</span>
                  <span>{f.code}</span>
                  {f.code !== 'ALL' && myPlayersByFranchise[f.code] && (
                    <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1 rounded-full font-mono">
                      {myPlayersByFranchise[f.code].length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Status & Search */}
            <div className="flex items-center space-x-2 shrink-0">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
                className="bg-[#050c1e] text-xs font-bold text-slate-300 border border-indigo-950 rounded-xl px-2.5 py-1.5 cursor-pointer outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="UPCOMING">Upcoming Only</option>
                <option value="COMPLETED">Completed Only</option>
                <option value="MY_PLAYERS">Matches with My Players</option>
              </select>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search venue or team..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="bg-[#050c1e] text-xs text-white placeholder-slate-500 border border-indigo-950 rounded-xl pl-8 pr-3 py-1.5 outline-none focus:border-indigo-600 w-44"
                />
              </div>
            </div>
          </div>

          {/* Fixtures List */}
          {filteredFixtures.length === 0 ? (
            <div className="bg-[#091436] rounded-2xl border border-indigo-900/50 p-12 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-slate-300 font-bold text-sm">No matches found for the selected filter.</p>
              <button
                onClick={() => {
                  setSelectedFranchiseFilter('ALL');
                  setStatusFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-bold cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredFixtures.map(fixture => {
                const t1 = teamMap[fixture.team1Id];
                const t2 = teamMap[fixture.team2Id];
                const myPlayers = getMyPlayersInFixture(fixture);
                const pitch = getVenuePitchInfo(fixture.venue);
                const isCurrentRound = fixture.matchday === currentMatchday;

                return (
                  <div
                    key={fixture.id}
                    className={`rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                      fixture.isCompleted
                        ? 'bg-[#081230]/90 border-indigo-950 shadow-md'
                        : isCurrentRound
                        ? 'bg-gradient-to-br from-[#09153a] to-[#0d1e52] border-amber-500/40 shadow-xl ring-1 ring-amber-500/20'
                        : 'bg-[#091436] border-indigo-900/60 hover:border-indigo-700/80 shadow-lg'
                    }`}
                  >
                    {/* Header: MD, Venue, Pitch */}
                    <div className="space-y-2 pb-3 border-b border-indigo-950/80">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-black ${
                            isCurrentRound
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-indigo-950 text-indigo-300 border border-indigo-800/40'
                          }`}>
                            MATCHDAY {fixture.matchday}
                          </span>

                          <span className="text-slate-400 font-mono text-[11px]">
                            #{fixture.id.replace('fix_', '')}
                          </span>
                        </div>

                        <div className="flex items-center space-x-1.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            fixture.isCompleted
                              ? 'bg-slate-900 text-slate-400 border-slate-800'
                              : isCurrentRound
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                              : 'bg-indigo-950/70 text-indigo-300 border-indigo-800/30'
                          }`}>
                            {fixture.isCompleted ? '✓ Completed' : isCurrentRound ? '⚡ Live Round' : 'Scheduled'}
                          </span>
                        </div>
                      </div>

                      {/* Venue & Pitch */}
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <div className="flex items-center space-x-1.5 truncate max-w-[260px]">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="truncate">{fixture.venue}</span>
                        </div>
                        <span className="bg-[#050c1e] text-slate-300 border border-indigo-950 text-[10px] px-2 py-0.5 rounded-md font-medium">
                          {pitch}
                        </span>
                      </div>
                    </div>

                    {/* Team Matchup Banner */}
                    <div className="py-4 space-y-3">
                      {/* Team 1 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{t1?.logoEmoji || '🏏'}</span>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span>{t1?.name}</span>
                              {t1?.is_human && (
                                <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded font-mono">
                                  YOUR 11
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {t1?.shortCode}
                            </div>
                          </div>
                        </div>

                        {fixture.isCompleted && fixture.result && (
                          <div className="text-right font-mono">
                            <div className="text-base font-black text-white">
                              {fixture.result.innings1.teamId === t1?.id
                                ? `${fixture.result.innings1.totalRuns}/${fixture.result.innings1.wickets}`
                                : `${fixture.result.innings2.totalRuns}/${fixture.result.innings2.wickets}`}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {fixture.result.innings1.teamId === t1?.id
                                ? `(${fixture.result.innings1.overs} ov)`
                                : `(${fixture.result.innings2.overs} ov)`}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Team 2 */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{t2?.logoEmoji || '🏏'}</span>
                          <div>
                            <div className="text-sm font-bold text-white flex items-center gap-1.5">
                              <span>{t2?.name}</span>
                              {t2?.is_human && (
                                <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded font-mono">
                                  YOUR 11
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              {t2?.shortCode}
                            </div>
                          </div>
                        </div>

                        {fixture.isCompleted && fixture.result && (
                          <div className="text-right font-mono">
                            <div className="text-base font-black text-white">
                              {fixture.result.innings1.teamId === t2?.id
                                ? `${fixture.result.innings1.totalRuns}/${fixture.result.innings1.wickets}`
                                : `${fixture.result.innings2.totalRuns}/${fixture.result.innings2.wickets}`}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {fixture.result.innings1.teamId === t2?.id
                                ? `(${fixture.result.innings1.overs} ov)`
                                : `(${fixture.result.innings2.overs} ov)`}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Match Winner Summary if completed */}
                      {fixture.isCompleted && fixture.result && (
                        <div className="pt-2 border-t border-indigo-950/80 flex items-center justify-between text-xs">
                          <span className="text-amber-400 font-bold">
                            {fixture.result.margin || 'Match Completed'}
                          </span>
                          <button
                            onClick={() => openScorecardModal(fixture)}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-mono font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Scorecard</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Footer: Your Players in this Match */}
                    <div className="pt-3 border-t border-indigo-950/80">
                      {myPlayers.length > 0 ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-emerald-400 font-bold flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              <span>{myPlayers.length} of your players in action:</span>
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {myPlayers.map(p => (
                              <span
                                key={p.id}
                                className="bg-[#050c1e] text-slate-200 border border-indigo-900/60 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                <span>{p.name}</span>
                                <span className="text-[9px] text-slate-400 font-mono">({p.role})</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 italic">
                          No players from your current 11 playing in this clash.
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: FRANCHISE MATRIX GRID (HEATMAP PLANNER)                         */}
      {/* ========================================================================= */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-4">
          <div className="bg-[#091436] p-4 rounded-2xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-violet-400" />
                <span>Season 2026 Franchise Fixture Matrix</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Horizontal view of all 10 franchises across Matchdays 1 to 14.
                Rows marked with <span className="text-amber-400 font-bold">👑</span> indicate franchises where you have active players!
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/30 border border-emerald-500" />
                <span className="text-slate-300">Batting Track</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-amber-500/30 border border-amber-500" />
                <span className="text-slate-300">Dry Turner</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-indigo-500/30 border border-indigo-500" />
                <span className="text-slate-300">Balanced</span>
              </div>
            </div>
          </div>

          {/* Matrix Table Container with Horizontal Scroll */}
          <div className="bg-[#081230] rounded-2xl border border-indigo-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-[#060e26] border-b border-indigo-950 text-slate-400 font-mono">
                    <th className="py-3 px-3 sticky left-0 z-20 bg-[#060e26] border-r border-indigo-950 min-w-[130px]">
                      FRANCHISE
                    </th>
                    {Array.from({ length: totalMatchdays }, (_, i) => i + 1).map(md => (
                      <th
                        key={md}
                        className={`py-3 px-2 text-center min-w-[75px] ${
                          md === currentMatchday ? 'bg-amber-500/10 text-amber-300 font-black' : ''
                        }`}
                      >
                        MD {md}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-indigo-950/70">
                  {FRANCHISES.filter(f => f.code !== 'ALL').map(franchise => {
                    const myCount = myPlayersByFranchise[franchise.code]?.length || 0;
                    const hasMyPlayers = myCount > 0;

                    return (
                      <tr
                        key={franchise.code}
                        className={`hover:bg-indigo-950/40 transition ${
                          hasMyPlayers ? 'bg-indigo-950/20' : ''
                        }`}
                      >
                        {/* Sticky Franchise Column */}
                        <td className="py-3 px-3 sticky left-0 z-10 bg-[#07102a] border-r border-indigo-950 font-bold">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-1.5">
                              <span>{franchise.emoji}</span>
                              <span className="text-white">{franchise.code}</span>
                            </div>
                            {hasMyPlayers && (
                              <span className="bg-amber-400 text-slate-950 font-mono font-black text-[9px] px-1.5 py-0.2 rounded-full">
                                {myCount}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* MD 1 to 14 Cells */}
                        {Array.from({ length: totalMatchdays }, (_, i) => i + 1).map(md => {
                          const fixture = state.fixtures.find(
                            f => f.matchday === md && fixtureInvolvesFranchise(f, franchise.code)
                          );

                          if (!fixture) {
                            return (
                              <td key={md} className="py-2.5 px-1 text-center font-mono text-slate-600">
                                -
                              </td>
                            );
                          }

                          const t1 = teamMap[fixture.team1Id];
                          const t2 = teamMap[fixture.team2Id];
                          const isHome = t1?.shortCode === franchise.code || t1?.id === franchise.code;
                          const opponent = isHome ? (t2?.shortCode || 'OPP') : (t1?.shortCode || 'OPP');
                          const pitch = getVenuePitchInfo(fixture.venue);
                          const isCompleted = fixture.isCompleted;
                          const isCurrent = md === currentMatchday;

                          return (
                            <td
                              key={md}
                              className={`py-2 px-1 text-center ${
                                isCurrent ? 'bg-amber-500/5' : ''
                              }`}
                            >
                              <div className={`p-1.5 rounded-lg border text-[10px] font-mono font-bold transition flex flex-col items-center justify-center ${
                                isCompleted
                                  ? 'bg-slate-950/50 border-slate-900 text-slate-400'
                                  : pitch === 'Flat Track'
                                  ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300'
                                  : pitch === 'Dry Turner'
                                  ? 'bg-amber-950/40 border-amber-800/40 text-amber-300'
                                  : 'bg-indigo-950/40 border-indigo-800/40 text-indigo-300'
                              }`}>
                                <span>{isHome ? `vs ${opponent}` : `@${opponent}`}</span>
                                <span className="text-[8px] opacity-75 truncate max-w-[65px]">
                                  {pitch.split(' ')[0]}
                                </span>
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: TRANSFER SAVER & MINIMIZATION PLANNER                           */}
      {/* ========================================================================= */}
      {activeSubTab === 'planner' && (
        <div className="space-y-6">
          {/* Top Advice Card */}
          <div className="bg-gradient-to-r from-emerald-950/50 via-[#0a1844] to-[#0a1844] border border-emerald-500/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Official Transfer Conservation Engine</span>
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Budget Health: {transfersRemaining >= 70 ? '🟢 Excellent' : transfersRemaining >= 35 ? '🟡 Moderate' : '🔴 Low'}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white">
                  Strategy: How to Use Minimum Transfers Throughout the Season
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
                  Fantasy champions win leagues by keeping transfers in reserve for the final rounds and playoffs.
                  Below is your squad's match coverage roadmap across the upcoming 5 matchdays, highlighting when you can safely <strong>HOLD transfers (0 used)</strong> versus when targeted swaps are optimal.
                </p>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={openTransferModal}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs flex items-center justify-center space-x-2 shadow-lg cursor-pointer transition active:scale-95"
                >
                  <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
                  <span>Execute Planned Transfer</span>
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming 5-Matchday Squad Coverage Forecast Cards */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-violet-400" />
              <span>Upcoming 5-Matchday Squad Coverage Forecast</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {upcomingRoadmap.map(cov => {
                const isCurrent = cov.matchday === currentMatchday;
                const isOptimal = cov.activeCount >= 10;

                return (
                  <div
                    key={cov.matchday}
                    className={`rounded-2xl border p-4 flex flex-col justify-between transition ${
                      isCurrent
                        ? 'bg-[#09153a] border-amber-500/50 ring-1 ring-amber-500/30 shadow-lg'
                        : isOptimal
                        ? 'bg-[#081230] border-emerald-500/40'
                        : 'bg-[#081230] border-indigo-900/60'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className={`font-mono font-black px-2 py-0.5 rounded ${
                          isCurrent ? 'bg-amber-500 text-slate-950' : 'bg-indigo-950 text-indigo-300'
                        }`}>
                          MD {cov.matchday}
                        </span>

                        <span className={`text-[10px] font-bold ${
                          isOptimal ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          {cov.coveragePercent}% Active
                        </span>
                      </div>

                      {/* Active Count */}
                      <div className="text-2xl font-black text-white font-mono">
                        {cov.activeCount} <span className="text-xs text-slate-400 font-normal">/ 11 Players</span>
                      </div>

                      <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                        {cov.activeCount === 11
                          ? '✨ 100% Full Squad in action! Zero transfers needed.'
                          : cov.activeCount >= 9
                          ? '🟢 Strong coverage. Safe to HOLD transfers.'
                          : '⚠️ 3+ players idle. Plan 1-2 tactical transfers.'}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-indigo-950">
                      <div className="text-[10px] text-slate-400 font-mono">
                        {cov.benchedPlayers.length === 0 ? (
                          <span className="text-emerald-400 font-bold">All 11 scheduled to play</span>
                        ) : (
                          <span className="text-amber-300">
                            Idle: {cov.benchedPlayers.slice(0, 2).map(p => p.shortName).join(', ')}
                            {cov.benchedPlayers.length > 2 && ` +${cov.benchedPlayers.length - 2}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Golden Rules for Minimizing Transfers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#091436] p-5 rounded-2xl border border-indigo-900/60 space-y-2">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                <Shield className="w-4 h-4" />
                <span>1. The "Anchor Core" Rule</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Retain <strong>5-6 premium all-rounders and top-order stars</strong> (e.g. Kohli, Klaasen, Bumrah, Narine) who play consistently across every venue. Never waste transfers cycling these elite pillars in and out.
              </p>
            </div>

            <div className="bg-[#091436] p-5 rounded-2xl border border-indigo-900/60 space-y-2">
              <div className="flex items-center space-x-2 text-cyan-400 font-bold text-sm">
                <Layers className="w-4 h-4" />
                <span>2. The "Multi-Match Runway"</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Before transferring in a player, inspect their <strong>next 3 matchdays</strong> in the Franchise Matrix. Only buy players whose team has at least 2 favorable fixtures in the upcoming 3 rounds.
              </p>
            </div>

            <div className="bg-[#091436] p-5 rounded-2xl border border-indigo-900/60 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>3. Boosters Replace Transfers</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Use your official TATA IPL boosters strategically. Activating the <strong>Free Hit booster</strong> lets you overhaul your entire 11 for a single high-impact round without consuming a single transfer!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
