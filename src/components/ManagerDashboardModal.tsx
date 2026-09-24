import React from 'react';
import { useGame } from '../context/GameContext';
import { getBoosterById } from '../data/boosters';
import {
  Shield,
  Trophy,
  Users,
  TrendingUp,
  DollarSign,
  ArrowRightLeft,
  Calendar,
  Sparkles,
  Zap,
  Play,
  RotateCcw,
  FastForward,
  X,
  MapPin,
  Flame,
  CheckCircle2,
  Crown
} from 'lucide-react';

interface ManagerDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLineup: () => void;
  onOpenTransfers: () => void;
  onOpenSchedule: () => void;
  onOpenStandings: () => void;
}

export const ManagerDashboardModal: React.FC<ManagerDashboardModalProps> = ({
  isOpen,
  onClose,
  onOpenLineup,
  onOpenTransfers,
  onOpenSchedule,
  onOpenStandings
}) => {
  const {
    state,
    humanTeam,
    allTeams,
    transfersState,
    boostersState,
    simulateCurrentMatchday,
    fastForwardMatchdays,
    openBoostersModal,
    openSeasonArchiveModal,
    openNewSeasonModal,
    openSeasonEndModal
  } = useGame();

  if (!isOpen) return null;

  const humanRank = state.leaderboard.findIndex(l => l.teamId === humanTeam.id) + 1 || 1;
  const humanEntry = state.leaderboard.find(l => l.teamId === humanTeam.id);

  // Next fixture for human team
  const nextHumanFixture = state.fixtures.find(
    f => !f.isCompleted && (f.team1Id === humanTeam.id || f.team2Id === humanTeam.id)
  );
  const opponentId = nextHumanFixture
    ? (nextHumanFixture.team1Id === humanTeam.id ? nextHumanFixture.team2Id : nextHumanFixture.team1Id)
    : null;
  const opponentTeam = opponentId ? allTeams.find(t => t.id === opponentId) : null;

  const transfers = transfersState || state.transfers_state;
  const isPlayoffs = state.league_meta.playoffs_stage !== 'League';
  const isFinalCompleted = state.fixtures.some(f => f.playoffLabel === 'Final' && f.isCompleted);
  const isSeasonOver = isFinalCompleted || state.league_meta.playoffs_stage === 'Completed';

  const activeBooster = boostersState?.activeBoosterForNextMatch
    ? getBoosterById(boostersState.activeBoosterForNextMatch)
    : null;

  const recentTransfers = transfers?.history?.slice(0, 3) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#091436] border border-indigo-900/70 rounded-3xl shadow-2xl text-white overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-indigo-950 bg-[#050c1e]">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20">
              {humanTeam.logoEmoji || '⚡'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">{humanTeam.name}</h3>
                <span className="bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Manager HQ
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                {state.league_meta.season} • Round {state.league_meta.current_matchday} of {state.league_meta.total_matchdays}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white transition cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            title="Close Manager Dashboard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Top KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Rank */}
            <div className="bg-[#050c1e] p-3.5 rounded-2xl border border-indigo-950/80 flex flex-col justify-between">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center justify-between">
                <span>League Rank</span>
                <Crown className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-1">
                #{humanRank}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {humanEntry?.matchPoints || 0} pts • NRR {humanEntry?.netRunRate && humanEntry.netRunRate >= 0 ? `+${humanEntry.netRunRate.toFixed(2)}` : (humanEntry?.netRunRate?.toFixed(2) || '0.00')}
              </div>
            </div>

            {/* Total Fantasy Points */}
            <div className="bg-[#050c1e] p-3.5 rounded-2xl border border-indigo-950/80 flex flex-col justify-between">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center justify-between">
                <span>Fantasy Pts</span>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-1">
                {humanTeam.stats.totalFantasyPoints.toLocaleString()}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">Overall Score</div>
            </div>

            {/* Transfers Remaining */}
            <div className="bg-[#050c1e] p-3.5 rounded-2xl border border-indigo-950/80 flex flex-col justify-between">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center justify-between">
                <span>Transfers</span>
                <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-cyan-400 font-mono mt-1">
                {transfers?.is_unlimited_window
                  ? '∞'
                  : isPlayoffs
                  ? `${transfers?.playoffs_transfers_remaining ?? 10}`
                  : `${transfers?.league_transfers_remaining ?? 100}`}
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                {transfers?.is_unlimited_window
                  ? 'Free Window'
                  : isPlayoffs
                  ? 'of 10 Playoffs'
                  : 'of 100 League'}
              </div>
            </div>

            {/* Purse Remaining */}
            <div className="bg-[#050c1e] p-3.5 rounded-2xl border border-indigo-950/80 flex flex-col justify-between">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold flex items-center justify-between">
                <span>Purse Left</span>
                <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono mt-1">
                ₹{humanTeam.budget_remaining.toFixed(1)} Cr
              </div>
              <div className="text-[10px] text-slate-400 font-mono">of ₹100.0 Cr</div>
            </div>
          </div>

          {/* Next Opponent & Matchup Card */}
          <div className="bg-[#050c1e] p-4 rounded-2xl border border-indigo-950/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-indigo-950">
              <span className="font-bold font-mono text-amber-400 uppercase">Upcoming Fixture</span>
              {nextHumanFixture && (
                <span className="text-[11px] font-mono">
                  Round {nextHumanFixture.matchday} • Match #{nextHumanFixture.id.replace('fix_', '')}
                </span>
              )}
            </div>

            {nextHumanFixture && opponentTeam ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{humanTeam.logoEmoji || '⚡'}</span>
                  <div>
                    <div className="text-sm font-bold text-white">{humanTeam.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">Playing 11 Locked</div>
                  </div>
                </div>

                <div className="text-center px-3">
                  <span className="text-xs font-black text-amber-400 font-mono">VS</span>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {nextHumanFixture.venue.split(',')[0]}
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-right">
                  <div>
                    <div className="text-sm font-bold text-white">{opponentTeam.name}</div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Rank #{state.leaderboard.findIndex(l => l.teamId === opponentTeam.id) + 1}
                    </div>
                  </div>
                  <span className="text-2xl">{opponentTeam.logoEmoji || '🏏'}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 text-center py-2 italic">
                {isSeasonOver ? 'All matches for this season have concluded!' : 'No upcoming fixtures pending for this round.'}
              </div>
            )}
          </div>

          {/* Active Booster & Boosters Hub Quick Access */}
          <div className="bg-gradient-to-r from-amber-950/20 via-slate-900 to-indigo-950/30 p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-amber-300">Active TATA IPL Booster</div>
                <div className="text-sm font-black text-white">
                  {activeBooster ? activeBooster.name : 'No Booster Active For Next Round'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {activeBooster ? activeBooster.multiplierText : 'Pick 1 of 10 boosters to boost your points!'}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onClose();
                openBoostersModal();
              }}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer shrink-0 min-h-[44px]"
            >
              Boosters Hub
            </button>
          </div>

          {/* Direct GUI Actions (Replaces CLI Commands) */}
          <div className="space-y-2">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase">
              Franchise Controls &amp; Quick Actions
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {/* My 11 Lineup */}
              <button
                onClick={() => {
                  onClose();
                  onOpenLineup();
                }}
                className="p-3 rounded-xl bg-[#050c1e] hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer min-h-[44px] flex items-center space-x-2"
              >
                <span className="text-base">🏟️</span>
                <div>
                  <div className="text-xs font-bold text-white">Lineup Pitch</div>
                  <div className="text-[10px] text-slate-400">View XI &amp; Captain</div>
                </div>
              </button>

              {/* Transfer Market */}
              <button
                onClick={() => {
                  onClose();
                  onOpenTransfers();
                }}
                className="p-3 rounded-xl bg-[#050c1e] hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer min-h-[44px] flex items-center space-x-2"
              >
                <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-bold text-white">Transfers Hub</div>
                  <div className="text-[10px] text-slate-400">Swap &amp; Scout</div>
                </div>
              </button>

              {/* 70-Match Schedule */}
              <button
                onClick={() => {
                  onClose();
                  onOpenSchedule();
                }}
                className="p-3 rounded-xl bg-[#050c1e] hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer min-h-[44px] flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4 text-violet-400" />
                <div>
                  <div className="text-xs font-bold text-white">Full Schedule</div>
                  <div className="text-[10px] text-slate-400">70 Matches Plan</div>
                </div>
              </button>

              {/* Standings & NRR */}
              <button
                onClick={() => {
                  onClose();
                  onOpenStandings();
                }}
                className="p-3 rounded-xl bg-[#050c1e] hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer min-h-[44px] flex items-center space-x-2"
              >
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-white">Points Table</div>
                  <div className="text-[10px] text-slate-400">NRR &amp; Standings</div>
                </div>
              </button>

              {/* Fast Forward 1 Matchday */}
              <button
                onClick={() => {
                  fastForwardMatchdays(1);
                  onClose();
                }}
                className="p-3 rounded-xl bg-[#050c1e] hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer min-h-[44px] flex items-center space-x-2"
              >
                <FastForward className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-bold text-white">+1 Matchday</div>
                  <div className="text-[10px] text-slate-400">Simulate 1 Round</div>
                </div>
              </button>

              {/* Trophy Cabinet */}
              <button
                onClick={() => {
                  onClose();
                  openSeasonArchiveModal();
                }}
                className="p-3 rounded-xl bg-[#050c1e] hover:bg-slate-800 border border-slate-800 text-left transition cursor-pointer min-h-[44px] flex items-center space-x-2"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-white">Trophy Cabinet</div>
                  <div className="text-[10px] text-slate-400">Past Seasons</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-indigo-950 bg-[#050c1e] flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] text-slate-400 font-mono">
            Status: <strong className="text-emerald-400">Active</strong> • Season {state.league_meta.season}
          </div>

          <div className="flex items-center space-x-2">
            {isSeasonOver ? (
              <button
                onClick={() => {
                  onClose();
                  openSeasonEndModal();
                }}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 min-h-[44px]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start Next Year</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onClose();
                  openNewSeasonModal();
                }}
                className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs transition cursor-pointer border border-slate-800 flex items-center gap-1.5 min-h-[44px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Season / Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
