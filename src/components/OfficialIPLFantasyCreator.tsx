import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { ALL_PLAYERS, getPlayerById } from '../data/players';
import { Player, PlayerRole } from '../types/fantasy';
import {
  Shield,
  Sparkles,
  Plane,
  X,
  Crown,
  Star,
  Check,
  Search,
  RotateCcw,
  Trophy,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Users
} from 'lucide-react';

const IPL_TEAMS = ['ALL', 'CSK', 'MI', 'RCB', 'KKR', 'SRH', 'RR', 'DC', 'GT', 'LSG', 'PBKS'] as const;

const TEAM_EMOJIS = ['⚡', '🦁', '👑', '🦅', '🐅', '🔥', '🏏', '🌪️', '🛡️', '⚔️'];

export const OfficialIPLFantasyCreator: React.FC = () => {
  const { state, humanTeam, createInitialFantasyTeam, syncSquadsWithAI } = useGame();

  const [teamName, setTeamName] = useState(humanTeam?.name && humanTeam.name !== 'User XI' ? humanTeam.name : 'My IPL XI');
  const [selectedEmoji, setSelectedEmoji] = useState(humanTeam?.logoEmoji || '⚡');
  const [selectedRoleTab, setSelectedRoleTab] = useState<PlayerRole | 'ALL'>('ALL');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTeamFilter, setShowTeamFilter] = useState(false);

  // AI 2026 Squad Intelligence
  const [aiSyncReport, setAiSyncReport] = useState<string | null>(null);
  const [loadingAiSync, setLoadingAiSync] = useState(false);

  // 11 chosen players
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [captainId, setCaptainId] = useState<string>('');
  const [viceCaptainId, setViceCaptainId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRunAiSync = async () => {
    setLoadingAiSync(true);
    setAiSyncReport(null);
    try {
      const res = await syncSquadsWithAI(selectedRoleTab === 'ALL' ? 'ALL' : selectedRoleTab);
      if (res.success && res.report) {
        setAiSyncReport(res.report);
      } else {
        setAiSyncReport(res.error || 'Unable to fetch AI squad verification at this time.');
      }
    } catch {
      setAiSyncReport('Network error communicating with AI scout.');
    } finally {
      setLoadingAiSync(false);
    }
  };

  // Derived selected player objects
  const selectedPlayers = useMemo(() => {
    return selectedPlayerIds
      .map(id => getPlayerById(id))
      .filter((p): p is Player => p !== undefined);
  }, [selectedPlayerIds]);

  // Role counts
  const wkCount = selectedPlayers.filter(p => p.role === 'WK').length;
  const batCount = selectedPlayers.filter(p => p.role === 'BAT').length;
  const arCount = selectedPlayers.filter(p => p.role === 'AR').length;
  const bowlCount = selectedPlayers.filter(p => p.role === 'BOWL').length;
  const overseasCount = selectedPlayers.filter(p => p.nationality === 'OVERSEAS').length;

  // Budget calculations (100.0 Cr starting purse, max player price 11.0 Cr)
  const totalCost = selectedPlayers.reduce((sum, p) => sum + p.currentPrice, 0);
  const roundedCost = Math.round(totalCost * 10) / 10;
  const creditsRemaining = Math.max(0, Math.round((100.0 - roundedCost) * 10) / 10);
  const isOverBudget = roundedCost > 100.0;

  // Filtered player pool for the active role tab & team
  const availablePlayersForRole = useMemo(() => {
    return ALL_PLAYERS.filter(p => {
      // If user is searching by text, search globally across all roles
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q) || p.shortName.toLowerCase().includes(q);
        const matchesTeam = p.teamAffiliation?.toLowerCase().includes(q);
        const matchesRole = p.role.toLowerCase() === q;
        if (!matchesName && !matchesTeam && !matchesRole) return false;
      } else {
        // If not searching text, filter by role tab unless 'ALL' is selected
        if (selectedRoleTab !== 'ALL' && p.role !== selectedRoleTab) return false;
      }

      if (selectedTeamFilter !== 'ALL' && p.teamAffiliation !== selectedTeamFilter) return false;

      return true;
    }).sort((a, b) => b.currentPrice - a.currentPrice);
  }, [selectedRoleTab, selectedTeamFilter, searchQuery]);

  // Toggle player selection
  const handleTogglePlayer = (player: Player) => {
    setErrorMessage(null);
    const isSelected = selectedPlayerIds.includes(player.id);

    if (isSelected) {
      // Remove
      setSelectedPlayerIds(prev => prev.filter(id => id !== player.id));
      if (captainId === player.id) setCaptainId('');
      if (viceCaptainId === player.id) setViceCaptainId('');
    } else {
      // Add check limits
      if (selectedPlayerIds.length >= 11) {
        setErrorMessage('You can only select exactly 11 players for your starting lineup.');
        return;
      }

      if (player.nationality === 'OVERSEAS' && overseasCount >= 4) {
        setErrorMessage('Maximum 4 overseas players allowed in your 11.');
        return;
      }

      // Check role upper bounds
      if (player.role === 'WK' && wkCount >= 4) {
        setErrorMessage('Maximum 4 Wicket-Keepers allowed.');
        return;
      }
      if (player.role === 'BAT' && batCount >= 6) {
        setErrorMessage('Maximum 6 Batters allowed.');
        return;
      }
      if (player.role === 'AR' && arCount >= 4) {
        setErrorMessage('Maximum 4 All-Rounders allowed.');
        return;
      }
      if (player.role === 'BOWL' && bowlCount >= 6) {
        setErrorMessage('Maximum 6 Bowlers allowed.');
        return;
      }

      // Check budget
      if (roundedCost + player.currentPrice > 100.0) {
        setErrorMessage(`Cannot afford ${player.name} (₹${player.currentPrice} Cr). Remaining purse is only ₹${creditsRemaining} Cr.`);
        return;
      }

      const nextXI = [...selectedPlayerIds, player.id];
      setSelectedPlayerIds(nextXI);

      // Auto-assign Captain and VC if not set yet
      if (!captainId) {
        setCaptainId(player.id);
      } else if (!viceCaptainId && player.id !== captainId) {
        setViceCaptainId(player.id);
      }
    }
  };

  // Auto-pick optimal balanced XI within 100 Cr and official rules
  const handleAutoPickOptimalXI = () => {
    setErrorMessage(null);
    // 2 WK, 3 BAT, 2 AR, 4 BOWL = 11 players
    // All prices <= 11 Cr
    const optimalWKs = ALL_PLAYERS.filter(p => p.role === 'WK');
    const optimalBATs = ALL_PLAYERS.filter(p => p.role === 'BAT');
    const optimalARs = ALL_PLAYERS.filter(p => p.role === 'AR');
    const optimalBOWLs = ALL_PLAYERS.filter(p => p.role === 'BOWL');

    // Pick top balanced picks
    const picked: Player[] = [];

    // 1-2 WK: Klaasen (11.0, OS), Samson (10.5)
    picked.push(optimalWKs.find(p => p.id === 'p_klaasen') || optimalWKs[0]);
    picked.push(optimalWKs.find(p => p.id === 'p_samson') || optimalWKs[1]);

    // 3 BAT: Kohli (11.0), Ruturaj (9.5), Tilak (8.5)
    picked.push(optimalBATs.find(p => p.id === 'p_kohli') || optimalBATs[0]);
    picked.push(optimalBATs.find(p => p.id === 'p_ruturaj') || optimalBATs[1]);
    picked.push(optimalBATs.find(p => p.id === 'p_tilak') || optimalBATs[2]);

    // 2 AR: Russell (10.5, OS), Jadeja (10.0)
    picked.push(optimalARs.find(p => p.id === 'p_russell') || optimalARs[0]);
    picked.push(optimalARs.find(p => p.id === 'p_jadeja') || optimalARs[1]);

    // 4 BOWL: Bumrah (11.0), Boult (9.5, OS), Chahal (9.0), Harshit Rana (7.5)
    picked.push(optimalBOWLs.find(p => p.id === 'p_bumrah') || optimalBOWLs[0]);
    picked.push(optimalBOWLs.find(p => p.id === 'p_boult') || optimalBOWLs[1]);
    picked.push(optimalBOWLs.find(p => p.id === 'p_chahal') || optimalBOWLs[2]);
    picked.push(optimalBOWLs.find(p => p.id === 'p_harshit') || optimalBOWLs[3]);

    const ids = picked.map(p => p.id);
    setSelectedPlayerIds(ids);
    setCaptainId('p_bumrah');
    setViceCaptainId('p_kohli');
  };

  const handleClearAll = () => {
    setSelectedPlayerIds([]);
    setCaptainId('');
    setViceCaptainId('');
    setErrorMessage(null);
  };

  // Validation checks
  const isWkValid = wkCount >= 1 && wkCount <= 4;
  const isBatValid = batCount >= 3 && batCount <= 6;
  const isArValid = arCount >= 1 && arCount <= 4;
  const isBowlValid = bowlCount >= 3 && bowlCount <= 6;
  const isOverseasValid = overseasCount <= 4;
  const isCountValid = selectedPlayerIds.length === 11;
  const isBudgetValid = roundedCost <= 100.0;
  const isCaptainsValid = captainId && viceCaptainId && captainId !== viceCaptainId;
  const isTeamNameValid = teamName.trim().length >= 2;

  const isReadyToLock =
    isWkValid &&
    isBatValid &&
    isArValid &&
    isBowlValid &&
    isOverseasValid &&
    isCountValid &&
    isBudgetValid &&
    isCaptainsValid &&
    isTeamNameValid;

  const handleConfirmAndLock = () => {
    if (!isReadyToLock) {
      if (!isTeamNameValid) setErrorMessage('Please enter a team name (at least 2 letters).');
      else if (!isCountValid) setErrorMessage(`Select exactly 11 players (currently ${selectedPlayerIds.length}/11).`);
      else if (!isBudgetValid) setErrorMessage(`Purse exceeded! Cost is ₹${roundedCost} Cr (Max ₹100.0 Cr).`);
      else if (!isWkValid) setErrorMessage('You must select between 1 and 4 Wicket-Keepers.');
      else if (!isBatValid) setErrorMessage('You must select between 3 and 6 Batters.');
      else if (!isArValid) setErrorMessage('You must select between 1 and 4 All-Rounders.');
      else if (!isBowlValid) setErrorMessage('You must select between 3 and 6 Bowlers.');
      else if (!isOverseasValid) setErrorMessage('Maximum 4 Overseas players allowed.');
      else if (!isCaptainsValid) setErrorMessage('Please nominate both Captain (C) and Vice-Captain (VC).');
      return;
    }

    const res = createInitialFantasyTeam({
      teamName: teamName.trim(),
      playingXI: selectedPlayerIds,
      captain: captainId,
      viceCaptain: viceCaptainId,
      logoEmoji: selectedEmoji
    });

    if (!res.success) {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#071026] text-white flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top IPL Fantasy Header */}
      <header className="sticky top-0 z-40 bg-[#0a1538]/95 backdrop-blur-md border-b border-indigo-900/60 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Brand Logo & Title */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-1 ring-amber-400/40">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                    TATA {state.league_meta.season}
                  </span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Official Fantasy
                  </span>
                  {state.season_history && state.season_history.length > 0 && (
                    <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-indigo-500/30">
                      Year {state.season_history.length + 1} Campaign
                    </span>
                  )}
                </div>
                <h1 className="text-lg font-black tracking-tight text-white">
                  Draft Your Fantasy 11
                </h1>
              </div>
            </div>

            {/* Team Name Input & Emoji Selector */}
            <div className="flex items-center space-x-2 bg-[#050c1e] px-3 py-1.5 rounded-xl border border-indigo-950/80">
              <div className="flex items-center space-x-1">
                <div className="relative group">
                  <button
                    type="button"
                    className="text-xl p-1 bg-indigo-950/60 rounded-lg hover:bg-indigo-900 transition"
                    title="Change team avatar emoji"
                  >
                    {selectedEmoji}
                  </button>
                  <div className="absolute left-0 top-full mt-1 hidden group-hover:flex bg-[#0d1b3e] border border-indigo-800 rounded-xl p-1.5 gap-1 shadow-2xl z-50">
                    {TEAM_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedEmoji(emoji)}
                        className="text-lg p-1 hover:scale-125 transition"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Fantasy Team Name
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={e => setTeamName(e.target.value)}
                    placeholder="Enter Team Name..."
                    className="bg-transparent text-sm font-bold text-white placeholder-slate-500 focus:outline-none w-44 sm:w-56"
                    maxLength={25}
                  />
                </div>
              </div>
            </div>

            {/* Live Stats Indicators */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Players Counter */}
              <div className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 text-xs font-mono ${
                isCountValid
                  ? 'bg-emerald-950/50 border-emerald-600/40 text-emerald-300'
                  : 'bg-indigo-950/60 border-indigo-800/60 text-slate-300'
              }`}>
                <Users className="w-3.5 h-3.5" />
                <span className="text-slate-400 text-[11px]">Players:</span>
                <span className="font-bold text-sm">{selectedPlayerIds.length} / 11</span>
              </div>

              {/* Purse Indicator */}
              <div className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 text-xs font-mono ${
                isOverBudget
                  ? 'bg-rose-950/60 border-rose-600/60 text-rose-300 animate-pulse'
                  : 'bg-amber-950/40 border-amber-600/40 text-amber-300'
              }`}>
                <span className="text-slate-400 text-[11px]">Purse:</span>
                <span className="font-bold text-sm">
                  {isOverBudget ? `₹${roundedCost} Cr (Exceeded)` : `₹${creditsRemaining} Cr Left`}
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">/ 100 Cr</span>
              </div>

              {/* Overseas Indicator */}
              <div className={`px-2.5 py-1.5 rounded-xl border flex items-center space-x-1 text-xs font-mono ${
                overseasCount > 4
                  ? 'bg-rose-950/60 border-rose-600 text-rose-300'
                  : 'bg-indigo-950/60 border-indigo-800 text-slate-300'
              }`}>
                <Plane className="w-3 h-3 text-cyan-400" />
                <span className="text-[11px] text-slate-400">OS:</span>
                <span className="font-bold">{overseasCount}/4</span>
              </div>

              {/* Quick Actions */}
              <button
                onClick={handleAutoPickOptimalXI}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-amber-500/10 cursor-pointer active:scale-95 transition"
                title="Automatically choose a balanced 11 players within ₹100 Cr"
              >
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Auto-Pick 11</span>
              </button>

              {selectedPlayerIds.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="p-1.5 bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition"
                  title="Clear all selected players"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Role Requirements Checklist Bar */}
          <div className="mt-3 pt-3 border-t border-indigo-900/40 flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Required:</span>

              <span className={`flex items-center space-x-1 font-mono px-2 py-0.5 rounded-md ${
                isWkValid ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' : 'bg-slate-900/70 text-slate-400'
              }`}>
                <span>WK:</span>
                <strong className={isWkValid ? 'text-white' : 'text-amber-400'}>{wkCount}</strong>
                <span className="text-[10px] text-slate-400">(1-4)</span>
                {isWkValid && <Check className="w-3 h-3 text-emerald-400 ml-0.5" />}
              </span>

              <span className={`flex items-center space-x-1 font-mono px-2 py-0.5 rounded-md ${
                isBatValid ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' : 'bg-slate-900/70 text-slate-400'
              }`}>
                <span>BAT:</span>
                <strong className={isBatValid ? 'text-white' : 'text-amber-400'}>{batCount}</strong>
                <span className="text-[10px] text-slate-400">(3-6)</span>
                {isBatValid && <Check className="w-3 h-3 text-emerald-400 ml-0.5" />}
              </span>

              <span className={`flex items-center space-x-1 font-mono px-2 py-0.5 rounded-md ${
                isArValid ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' : 'bg-slate-900/70 text-slate-400'
              }`}>
                <span>AR:</span>
                <strong className={isArValid ? 'text-white' : 'text-amber-400'}>{arCount}</strong>
                <span className="text-[10px] text-slate-400">(1-4)</span>
                {isArValid && <Check className="w-3 h-3 text-emerald-400 ml-0.5" />}
              </span>

              <span className={`flex items-center space-x-1 font-mono px-2 py-0.5 rounded-md ${
                isBowlValid ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40' : 'bg-slate-900/70 text-slate-400'
              }`}>
                <span>BOWL:</span>
                <strong className={isBowlValid ? 'text-white' : 'text-amber-400'}>{bowlCount}</strong>
                <span className="text-[10px] text-slate-400">(3-6)</span>
                {isBowlValid && <Check className="w-3 h-3 text-emerald-400 ml-0.5" />}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center space-x-2">
              <span className="flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-400" /> Captain (2x pts)
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 text-cyan-400" /> Vice-Captain (1.5x pts)
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Error / Alert banner */}
      {errorMessage && (
        <div className="bg-rose-950/80 border-b border-rose-800/60 px-4 py-2 flex items-center justify-between text-xs text-rose-200">
          <div className="flex items-center space-x-2 max-w-7xl mx-auto w-full">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Workspace (Split View: Left Player Pool, Right Live Cricket Ground) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Player Selector (7 cols) */}
        <section className="lg:col-span-7 flex flex-col space-y-4">
          {/* Role Tabs */}
          <div className="grid grid-cols-5 gap-1 bg-[#091436] p-1.5 rounded-2xl border border-indigo-900/50">
            {(['ALL', 'WK', 'BAT', 'AR', 'BOWL'] as (PlayerRole | 'ALL')[]).map(role => {
              const count = role === 'ALL'
                ? selectedPlayers.length
                : selectedPlayers.filter(p => p.role === role).length;
              const isActive = selectedRoleTab === role;
              return (
                <button
                  key={role}
                  onClick={() => setSelectedRoleTab(role)}
                  className={`py-2 px-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center space-x-1 transition cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/10'
                      : 'text-slate-300 hover:bg-indigo-950 hover:text-white'
                  }`}
                >
                  <span>{role}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-indigo-950 text-amber-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Clean Role Search & AI 2026 Squad Scout Bar */}
          <div className="space-y-2 bg-[#091436] p-3 rounded-2xl border border-indigo-900/50">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Search Bar (Pure Name Search by Role) */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={`Search ${selectedRoleTab}s by player name...`}
                  className="w-full bg-[#050c1e] border border-indigo-900/70 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* AI 2026 Squad Scout Button */}
              <button
                type="button"
                onClick={handleRunAiSync}
                disabled={loadingAiSync}
                className="flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 active:scale-95 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-bold transition disabled:opacity-50 shrink-0 cursor-pointer"
                title="Use Gemini AI to retrieve latest 2026 squad status for this role"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>{loadingAiSync ? 'AI Verifying...' : `AI Scout 2026 ${selectedRoleTab}s`}</span>
              </button>

              {/* Optional Team Filter Toggle (Kept subtle to avoid clutter) */}
              <button
                type="button"
                onClick={() => setShowTeamFilter(prev => !prev)}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold border transition shrink-0 ${
                  showTeamFilter || selectedTeamFilter !== 'ALL'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-[#050c1e] text-slate-400 border-indigo-900/70 hover:text-white'
                }`}
                title="Filter by franchise (optional)"
              >
                {selectedTeamFilter !== 'ALL' ? selectedTeamFilter : 'Teams ▾'}
              </button>
            </div>

            {/* AI Verification Report Banner (when generated) */}
            {aiSyncReport && (
              <div className="bg-gradient-to-r from-indigo-950/90 to-purple-950/90 border border-indigo-500/40 rounded-xl p-3 text-xs animate-fadeIn">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Gemini AI 2026 Squad Intelligence: {selectedRoleTab} Pool
                  </span>
                  <button
                    onClick={() => setAiSyncReport(null)}
                    className="text-slate-400 hover:text-white text-xs"
                  >
                    ✕ Dismiss
                  </button>
                </div>
                <div className="text-slate-200 text-[11px] leading-relaxed max-h-36 overflow-y-auto whitespace-pre-line bg-slate-950/60 p-2.5 rounded-lg border border-indigo-500/20">
                  {aiSyncReport}
                </div>
              </div>
            )}

            {/* Optional Collapsible Franchise Filter Bar */}
            {showTeamFilter && (
              <div className="pt-2 border-t border-indigo-900/40 flex items-center space-x-1 overflow-x-auto pb-1 text-[11px] font-mono no-scrollbar">
                <span className="text-[10px] text-slate-500 uppercase font-bold mr-1 shrink-0">Team:</span>
                {IPL_TEAMS.map(team => (
                  <button
                    key={team}
                    type="button"
                    onClick={() => setSelectedTeamFilter(team)}
                    className={`px-2.5 py-1 rounded-lg shrink-0 font-bold transition cursor-pointer ${
                      selectedTeamFilter === team
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-[#050c1e] text-slate-400 hover:text-white hover:bg-indigo-950'
                    }`}
                  >
                    {team}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Player Cards List */}
          <div className="flex-1 bg-[#091436] rounded-2xl border border-indigo-900/50 overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 bg-[#0b1842] border-b border-indigo-900/60 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Player Info</span>
              <div className="flex items-center space-x-6">
                <span>Rating</span>
                <span className="w-16 text-right">Price</span>
                <span className="w-16 text-center">Action</span>
              </div>
            </div>

            <div className="overflow-y-auto divide-y divide-indigo-950/80 max-h-[520px]">
              {availablePlayersForRole.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No players found matching your search and filter criteria.
                </div>
              ) : (
                availablePlayersForRole.map(player => {
                  const isSelected = selectedPlayerIds.includes(player.id);
                  const isCaptain = captainId === player.id;
                  const isVC = viceCaptainId === player.id;
                  const canAfford = roundedCost + player.currentPrice <= 100.0;

                  return (
                    <div
                      key={player.id}
                      onClick={() => handleTogglePlayer(player)}
                      className={`px-4 py-3 flex items-center justify-between transition cursor-pointer hover:bg-indigo-950/60 ${
                        isSelected ? 'bg-amber-500/10 border-l-4 border-amber-500' : ''
                      }`}
                    >
                      {/* Player identity */}
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-md relative"
                          style={{ backgroundColor: player.avatarColor || '#3b82f6' }}
                        >
                          {player.shortName.slice(0, 2).toUpperCase()}
                          {player.nationality === 'OVERSEAS' && (
                            <span className="absolute -bottom-1 -right-1 bg-cyan-500 text-slate-950 p-0.5 rounded-full" title="Overseas Player">
                              <Plane className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-sm font-bold text-white group-hover:text-amber-400">
                              {player.name}
                            </span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#050c1e] text-amber-300 font-mono">
                              {player.teamAffiliation}
                            </span>
                            {isCaptain && (
                              <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-1 py-0.2 rounded font-mono">
                                C (2x)
                              </span>
                            )}
                            {isVC && (
                              <span className="bg-cyan-400 text-slate-950 font-black text-[9px] px-1 py-0.2 rounded font-mono">
                                VC (1.5x)
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                            <span>{player.role}</span>
                            <span>•</span>
                            <span>{player.country}</span>
                          </div>
                        </div>
                      </div>

                      {/* Right ratings & price */}
                      <div className="flex items-center space-x-2 sm:space-x-4 shrink-0">
                        <div className="text-right hidden xs:block">
                          <span className="text-xs font-mono font-bold text-slate-300">
                            {player.battingRating > player.bowlingRating ? player.battingRating : player.bowlingRating}
                          </span>
                          <span className="text-[10px] text-slate-500 block">Skill</span>
                        </div>

                        <div className="text-right min-w-[44px]">
                          <span className={`text-xs sm:text-sm font-mono font-extrabold ${
                            player.currentPrice >= 10.5 ? 'text-amber-400' : 'text-slate-200'
                          }`}>
                            ₹{player.currentPrice.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-slate-400 block">Cr</span>
                        </div>

                        <div className="w-10 text-center">
                          {isSelected ? (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleTogglePlayer(player);
                              }}
                              className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center hover:bg-rose-500 hover:text-white transition mx-auto cursor-pointer"
                              title="Remove player"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={!canAfford && selectedPlayerIds.length < 11}
                              onClick={e => {
                                e.stopPropagation();
                                handleTogglePlayer(player);
                              }}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition mx-auto cursor-pointer ${
                                canAfford
                                  ? 'bg-[#050c1e] text-amber-400 border border-amber-500/40 hover:bg-amber-500 hover:text-slate-950'
                                  : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                              }`}
                              title={canAfford ? 'Add to team' : 'Cannot afford'}
                            >
                              +
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Right Column: Live Cricket Pitch View & C/VC Controls (5 cols) */}
        <section className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-[#091436] p-4 rounded-2xl border border-indigo-900/50 flex items-center justify-between">
            <h2 className="text-sm font-black tracking-tight text-white flex items-center gap-2">
              <span>🏟️</span>
              <span>Your Pitch Lineup ({selectedPlayerIds.length}/11)</span>
            </h2>
            <span className="text-xs text-amber-400 font-mono font-bold">
              ₹{roundedCost} / 100.0 Cr
            </span>
          </div>

          {/* Interactive Cricket Ground */}
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-emerald-900/60 bg-gradient-to-b from-emerald-800 via-green-800 to-emerald-900 p-4 min-h-[500px] flex flex-col justify-between">
            {/* Pitch Markings */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-72 border-2 border-white rounded-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-48 bg-amber-100/20 border border-amber-200/40" />
            </div>

            {/* 1. Wicket Keepers (Top) */}
            <div className="relative z-10 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 text-center block">
                Wicket-Keeper ({wkCount})
              </span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {selectedPlayers.filter(p => p.role === 'WK').length === 0 ? (
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-emerald-500/40 flex items-center justify-center text-[10px] text-emerald-200/60 font-medium">
                    + WK
                  </div>
                ) : (
                  selectedPlayers.filter(p => p.role === 'WK').map(p => (
                    <PitchPlayerBadge
                      key={p.id}
                      player={p}
                      isCaptain={captainId === p.id}
                      isVC={viceCaptainId === p.id}
                      onSelectC={() => setCaptainId(p.id)}
                      onSelectVC={() => setViceCaptainId(p.id)}
                      onRemove={() => handleTogglePlayer(p)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* 2. Batters (Upper Mid) */}
            <div className="relative z-10 space-y-1 my-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 text-center block">
                Batters ({batCount})
              </span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {selectedPlayers.filter(p => p.role === 'BAT').length === 0 ? (
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-emerald-500/40 flex items-center justify-center text-[10px] text-emerald-200/60 font-medium">
                    + BAT
                  </div>
                ) : (
                  selectedPlayers.filter(p => p.role === 'BAT').map(p => (
                    <PitchPlayerBadge
                      key={p.id}
                      player={p}
                      isCaptain={captainId === p.id}
                      isVC={viceCaptainId === p.id}
                      onSelectC={() => setCaptainId(p.id)}
                      onSelectVC={() => setViceCaptainId(p.id)}
                      onRemove={() => handleTogglePlayer(p)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* 3. All-Rounders (Lower Mid) */}
            <div className="relative z-10 space-y-1 my-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 text-center block">
                All-Rounders ({arCount})
              </span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {selectedPlayers.filter(p => p.role === 'AR').length === 0 ? (
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-emerald-500/40 flex items-center justify-center text-[10px] text-emerald-200/60 font-medium">
                    + AR
                  </div>
                ) : (
                  selectedPlayers.filter(p => p.role === 'AR').map(p => (
                    <PitchPlayerBadge
                      key={p.id}
                      player={p}
                      isCaptain={captainId === p.id}
                      isVC={viceCaptainId === p.id}
                      onSelectC={() => setCaptainId(p.id)}
                      onSelectVC={() => setViceCaptainId(p.id)}
                      onRemove={() => handleTogglePlayer(p)}
                    />
                  ))
                )}
              </div>
            </div>

            {/* 4. Bowlers (Bottom) */}
            <div className="relative z-10 space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-200 text-center block">
                Bowlers ({bowlCount})
              </span>
              <div className="flex flex-wrap items-center justify-center gap-3">
                {selectedPlayers.filter(p => p.role === 'BOWL').length === 0 ? (
                  <div className="w-16 h-16 rounded-xl border-2 border-dashed border-emerald-500/40 flex items-center justify-center text-[10px] text-emerald-200/60 font-medium">
                    + BOWL
                  </div>
                ) : (
                  selectedPlayers.filter(p => p.role === 'BOWL').map(p => (
                    <PitchPlayerBadge
                      key={p.id}
                      player={p}
                      isCaptain={captainId === p.id}
                      isVC={viceCaptainId === p.id}
                      onSelectC={() => setCaptainId(p.id)}
                      onSelectVC={() => setViceCaptainId(p.id)}
                      onRemove={() => handleTogglePlayer(p)}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Captaincy Instructions & Tip */}
          <div className="bg-[#091436] p-3 rounded-2xl border border-indigo-900/50 text-xs text-slate-300 space-y-1">
            <div className="flex items-center justify-between font-bold">
              <span className="text-amber-400 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" /> Captain & Vice-Captain:
              </span>
              <span className="text-[11px] text-slate-400">Click C or VC on any card</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Your <strong>Captain</strong> earns <strong>2.0x points</strong> and <strong>Vice-Captain</strong> earns <strong>1.5x points</strong> in every match.
            </p>
          </div>
        </section>
      </main>

      {/* Sticky Bottom Confirmation Bar */}
      <footer className="sticky bottom-0 z-40 bg-[#0a1538]/95 backdrop-blur-md border-t border-indigo-900/60 shadow-2xl py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{selectedEmoji}</span>
            <div>
              <div className="text-sm font-black text-white flex items-center space-x-2">
                <span>{teamName || 'Untitled Team'}</span>
                <span className="text-xs font-mono text-slate-400">({selectedPlayerIds.length}/11 Players)</span>
              </div>
              <div className="text-[11px] text-slate-400">
                Purse: <strong className={isOverBudget ? 'text-rose-400' : 'text-amber-400'}>₹{roundedCost} Cr</strong>
                {' '}/ ₹100.0 Cr
                {captainId && (
                  <span className="ml-2 text-slate-300 font-mono">
                    C: <strong>{getPlayerById(captainId)?.shortName}</strong>
                  </span>
                )}
                {viceCaptainId && (
                  <span className="ml-1 text-slate-300 font-mono">
                    VC: <strong>{getPlayerById(viceCaptainId)?.shortName}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {!isReadyToLock && (
              <span className="text-xs text-amber-400 hidden md:inline">
                {selectedPlayerIds.length < 11
                  ? `Select ${11 - selectedPlayerIds.length} more player${11 - selectedPlayerIds.length > 1 ? 's' : ''}`
                  : !isCaptainsValid
                  ? 'Nominate Captain and Vice-Captain'
                  : 'Adjust lineup to satisfy all rules'}
              </span>
            )}

            <button
              onClick={handleConfirmAndLock}
              disabled={!isReadyToLock}
              className={`px-6 py-3 rounded-xl font-black text-sm tracking-wide transition shadow-xl cursor-pointer flex items-center space-x-2 ${
                isReadyToLock
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 shadow-emerald-500/20 active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Lock Fantasy 11 &amp; Start IPL Season</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Compact Player Card on the Cricket Pitch
interface PitchPlayerBadgeProps {
  player: Player;
  isCaptain: boolean;
  isVC: boolean;
  onSelectC: () => void;
  onSelectVC: () => void;
  onRemove: () => void;
}

const PitchPlayerBadge: React.FC<PitchPlayerBadgeProps> = ({
  player,
  isCaptain,
  isVC,
  onSelectC,
  onSelectVC,
  onRemove
}) => {
  return (
    <div className="relative group flex flex-col items-center">
      {/* Remove button on hover */}
      <button
        onClick={e => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute -top-1 -right-1 z-20 w-4 h-4 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow cursor-pointer text-[10px]"
        title="Remove player"
      >
        ×
      </button>

      {/* Jersey Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-lg border border-white/20 transition group-hover:scale-105 relative cursor-pointer"
        style={{ backgroundColor: player.avatarColor || '#3b82f6' }}
      >
        {player.shortName.slice(0, 2).toUpperCase()}

        {/* C badge */}
        {isCaptain && (
          <span className="absolute -top-1.5 -left-1.5 bg-amber-400 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center ring-1 ring-slate-950 shadow">
            C
          </span>
        )}
        {/* VC badge */}
        {isVC && (
          <span className="absolute -top-1.5 -left-1.5 bg-cyan-400 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center ring-1 ring-slate-950 shadow">
            V
          </span>
        )}
      </div>

      {/* Player Short Name & Price */}
      <div className="text-center mt-1">
        <span className="block text-[11px] font-bold text-white max-w-[70px] truncate leading-tight drop-shadow">
          {player.shortName}
        </span>
        <span className="block text-[9px] font-mono text-amber-300 drop-shadow">
          ₹{player.currentPrice} Cr
        </span>
      </div>

      {/* Popover buttons to select Captain or Vice-Captain */}
      <div className="flex items-center space-x-1 mt-1">
        <button
          onClick={e => {
            e.stopPropagation();
            onSelectC();
          }}
          className={`text-[9px] font-black px-1.5 py-0.2 rounded transition cursor-pointer ${
            isCaptain
              ? 'bg-amber-400 text-slate-950 ring-1 ring-white'
              : 'bg-slate-950/70 text-slate-300 hover:bg-amber-400 hover:text-slate-950'
          }`}
          title="Make Captain (2x points)"
        >
          C
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            onSelectVC();
          }}
          className={`text-[9px] font-black px-1.5 py-0.2 rounded transition cursor-pointer ${
            isVC
              ? 'bg-cyan-400 text-slate-950 ring-1 ring-white'
              : 'bg-slate-950/70 text-slate-300 hover:bg-cyan-400 hover:text-slate-950'
          }`}
          title="Make Vice-Captain (1.5x points)"
        >
          VC
        </button>
      </div>
    </div>
  );
};
