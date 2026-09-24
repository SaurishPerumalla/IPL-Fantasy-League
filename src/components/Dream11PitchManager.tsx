import React, { useState, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import { ALL_PLAYERS, getPlayerById } from '../data/players';
import { getBoosterById } from '../data/boosters';
import { Player, PlayerRole } from '../types/fantasy';
import {
  Users,
  Shield,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Plane,
  X,
  RotateCcw,
  Crown,
  Star,
  ArrowRightLeft,
  Info,
  LayoutGrid,
  Eye,
  Plus,
  Shirt,
  Search,
  History,
  BookOpen,
  Filter,
  Check,
  Flame,
  Trophy
} from 'lucide-react';

interface Dream11PitchManagerProps {
  onSaved?: () => void;
  compactMode?: boolean;
}

const IPL_TEAMS_LIST = ['ALL', 'CSK', 'MI', 'RCB', 'KKR', 'SRH', 'RR', 'DC', 'GT', 'LSG', 'PBKS'] as const;

export const Dream11PitchManager: React.FC<Dream11PitchManagerProps> = ({
  onSaved,
  compactMode = false
}) => {
  const {
    state,
    humanTeam,
    updateUserLineup,
    validateLineupRules,
    transfersState,
    boostersState,
    openBoostersModal
  } = useGame();

  const activeBooster = boostersState.activeBoosterForNextMatch
    ? getBoosterById(boostersState.activeBoosterForNextMatch)
    : null;

  const getBoosterBadgeForPlayer = (player: Player, isCap: boolean, isSub: boolean): string | null => {
    const active = boostersState.activeBoosterForNextMatch;
    if (!active) return null;
    if (active === 'triple_captain' && isCap) return '3x Cap';
    if (active === 'double_power') return '2x All';
    if (active === 'indian_warrior' && player.nationality === 'IND') return '2x IND';
    if (active === 'foreign_stars' && player.nationality === 'OVERSEAS') return '2x OS';
    if (active === 'power_striker' && (player.role === 'BAT' || player.role === 'WK')) return '2x Bat';
    if (active === 'strike_force' && player.role === 'BOWL') return '2x Bowl';
    if (active === 'allround_marvel' && player.role === 'AR') return '2x AR';
    if (active === 'super_sub' && isSub) return '2x Sub';
    return null;
  };

  // Local working state so user can draft/edit before committing
  const [selectedXI, setSelectedXI] = useState<string[]>([...humanTeam.playing_xi]);
  const [captainId, setCaptainId] = useState<string>(humanTeam.captain || humanTeam.playing_xi[0] || '');
  const [vcId, setVcId] = useState<string>(humanTeam.vice_captain || humanTeam.playing_xi[1] || '');
  const [impactSubId, setImpactSubId] = useState<string>(humanTeam.impact_sub || humanTeam.substitutes[0] || '');

  // UI View & Filters
  const [viewMode, setViewMode] = useState<'pitch' | 'list'>('pitch');
  const [listRoleTab, setListRoleTab] = useState<PlayerRole>('WK');
  const [selectedFranchiseFilter, setSelectedFranchiseFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [poolScope, setPoolScope] = useState<'all' | 'squad'>('all'); // Browse all 10 IPL franchises or user squad

  // Modals & Drawers
  const [swappingPlayerId, setSwappingPlayerId] = useState<string | null>(null);
  const [inspectingPlayer, setInspectingPlayer] = useState<Player | null>(null);
  const [showRulesModal, setShowRulesModal] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sync when humanTeam updates externally
  React.useEffect(() => {
    setSelectedXI([...humanTeam.playing_xi]);
    setCaptainId(humanTeam.captain || humanTeam.playing_xi[0] || '');
    setVcId(humanTeam.vice_captain || humanTeam.playing_xi[1] || '');
    setImpactSubId(humanTeam.impact_sub || humanTeam.substitutes[0] || '');
  }, [humanTeam.playing_xi, humanTeam.captain, humanTeam.vice_captain, humanTeam.impact_sub]);

  // Derived squads
  const rosterPlayers = useMemo(() => {
    return humanTeam.roster
      .map(id => getPlayerById(id))
      .filter((p): p is Player => p !== undefined);
  }, [humanTeam.roster]);

  const xiPlayers = useMemo(() => {
    return selectedXI
      .map(id => getPlayerById(id))
      .filter((p): p is Player => p !== undefined);
  }, [selectedXI]);

  const benchPlayers = useMemo(() => {
    return rosterPlayers.filter(p => !selectedXI.includes(p.id));
  }, [rosterPlayers, selectedXI]);

  // Categorized XI by roles
  const wkPlayers = useMemo(() => xiPlayers.filter(p => p.role === 'WK'), [xiPlayers]);
  const batPlayers = useMemo(() => xiPlayers.filter(p => p.role === 'BAT'), [xiPlayers]);
  const arPlayers = useMemo(() => xiPlayers.filter(p => p.role === 'AR'), [xiPlayers]);
  const bowlPlayers = useMemo(() => xiPlayers.filter(p => p.role === 'BOWL'), [xiPlayers]);

  // Budget calculations (100.0 Credits rule)
  const overseasCount = xiPlayers.filter(p => p.nationality === 'OVERSEAS').length;
  const totalCost = xiPlayers.reduce((sum, p) => sum + p.currentPrice, 0);
  const roundedCost = Math.round(totalCost * 10) / 10;
  const creditsRemaining = Math.max(0, Math.round((100.0 - roundedCost) * 10) / 10);
  const isOverBudget = roundedCost > 100.0;

  // Dream11 Transfers System:
  // 1. 100 transfers throughout the 70 league matches
  // 2. Unlimited transfers when reaching the playoffs
  // 3. 10 transfers when playoffs start
  const previousXI = humanTeam.playing_xi || [];
  const isInitialDraft = previousXI.length === 0;
  const playersIn = selectedXI.filter(id => !previousXI.includes(id));
  const playersOut = previousXI.filter(id => !selectedXI.includes(id));
  const pendingTransfersCount = isInitialDraft ? 0 : playersIn.length;

  const transfers = transfersState || state.transfers_state;
  const isUnlimitedWindow = transfers?.is_unlimited_window ?? false;
  const isPlayoffsStarted = transfers?.playoffs_started ?? false;
  const isLeagueStage = !isPlayoffsStarted && !isUnlimitedWindow;

  const remainingTransfers = isUnlimitedWindow
    ? 'Unlimited'
    : isPlayoffsStarted
    ? transfers?.playoffs_transfers_remaining ?? 10
    : transfers?.league_transfers_remaining ?? 100;

  const isOverTransfers = !isUnlimitedWindow && typeof remainingTransfers === 'number' && pendingTransfersCount > remainingTransfers;

  // Team distribution count
  const teamDist = useMemo(() => {
    const map: { [key: string]: number } = {};
    xiPlayers.forEach(p => {
      const code = p.teamAffiliation || humanTeam.shortCode;
      map[code] = (map[code] || 0) + 1;
    });
    return map;
  }, [xiPlayers, humanTeam.shortCode]);

  // Lineup validation
  const validation = validateLineupRules(selectedXI);

  // Filtered player pool for selector / swap
  const filteredPlayerPool = useMemo(() => {
    const source = poolScope === 'all' ? ALL_PLAYERS : rosterPlayers;
    return source.filter(p => {
      // Role filter
      if (p.role !== listRoleTab) return false;
      // Team filter
      if (selectedFranchiseFilter !== 'ALL' && p.teamAffiliation !== selectedFranchiseFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q) || p.shortName.toLowerCase().includes(q);
        const matchesTeam = p.teamAffiliation?.toLowerCase().includes(q);
        if (!matchesName && !matchesTeam) return false;
      }
      return true;
    }).sort((a, b) => b.currentPrice - a.currentPrice);
  }, [poolScope, listRoleTab, selectedFranchiseFilter, searchQuery, rosterPlayers]);

  // Handlers
  const handleTogglePlayer = (player: Player) => {
    if (selectedXI.includes(player.id)) {
      if (selectedXI.length <= 1) return;
      const next = selectedXI.filter(id => id !== player.id);
      setSelectedXI(next);
      if (captainId === player.id) setCaptainId(next[0] || '');
      if (vcId === player.id) setVcId(next[1] || next[0] || '');
      if (impactSubId === player.id) setImpactSubId(benchPlayers[0]?.id || '');
    } else {
      if (selectedXI.length >= 11) {
        setFeedback({ message: 'Maximum 11 players allowed in Playing XI. Drop or swap a player first.', type: 'error' });
        return;
      }

      // Check if adding this player exceeds credits
      const newTotal = roundedCost + player.currentPrice;
      if (newTotal > 100.0) {
        setFeedback({
          message: `Adding ${player.shortName} (₹${player.currentPrice} Cr) would exceed the 100.0 Cr budget limit (total: ₹${newTotal.toFixed(1)} Cr).`,
          type: 'error'
        });
        return;
      }

      setSelectedXI([...selectedXI, player.id]);
    }
    setFeedback(null);
  };

  const handleMakeCaptain = (playerId: string) => {
    if (!selectedXI.includes(playerId)) return;
    if (vcId === playerId) {
      setVcId(captainId);
    }
    setCaptainId(playerId);
    setFeedback({ message: `👑 ${getPlayerById(playerId)?.name} selected as Captain (2.0x pts)! (Free change - 0 transfers used)`, type: 'success' });
  };

  const handleMakeVC = (playerId: string) => {
    if (!selectedXI.includes(playerId)) return;
    if (captainId === playerId) {
      setCaptainId(vcId);
    }
    setVcId(playerId);
    setFeedback({ message: `⭐ ${getPlayerById(playerId)?.name} selected as Vice-Captain (1.5x pts)! (Free change - 0 transfers used)`, type: 'success' });
  };

  const handleSetImpact = (playerId: string) => {
    setImpactSubId(playerId);
    setFeedback({ message: `⚡ ${getPlayerById(playerId)?.name} nominated as Impact Player!`, type: 'success' });
  };

  const handleExecuteSwap = (dropId: string, addId: string) => {
    const dropP = getPlayerById(dropId);
    const addP = getPlayerById(addId);
    if (!dropP || !addP) return;

    // Budget check
    const costDiff = addP.currentPrice - dropP.currentPrice;
    if (roundedCost + costDiff > 100.0) {
      setFeedback({
        message: `Swap would exceed ₹100.0 Cr budget! (Total: ₹${(roundedCost + costDiff).toFixed(1)} Cr)`,
        type: 'error'
      });
      return;
    }

    const next = selectedXI.map(id => (id === dropId ? addId : id));
    setSelectedXI(next);
    if (captainId === dropId) setCaptainId(addId);
    if (vcId === dropId) setVcId(addId);
    if (impactSubId === dropId) setImpactSubId(benchPlayers[0]?.id || addId);
    setSwappingPlayerId(null);

    setFeedback({
      message: `Substituted ${dropP.shortName} for ${addP.shortName} (${addP.teamAffiliation})!`,
      type: 'success'
    });
  };

  // Auto-Pick Optimal Lineup within 100 Credits & Roles
  const handleAutoPickOptimal = () => {
    const pool = ALL_PLAYERS;
    const wks = pool.filter(p => p.role === 'WK').sort((a, b) => (b.battingRating + b.clutchFactor) - (a.battingRating + a.clutchFactor));
    const bats = pool.filter(p => p.role === 'BAT').sort((a, b) => (b.battingRating + b.strikeRateRating) - (a.battingRating + a.strikeRateRating));
    const ars = pool.filter(p => p.role === 'AR').sort((a, b) => (b.battingRating + b.bowlingRating) - (a.battingRating + a.bowlingRating));
    const bowls = pool.filter(p => p.role === 'BOWL').sort((a, b) => (b.bowlingRating + b.economyRating) - (a.bowlingRating + a.economyRating));

    const optimal: Player[] = [];
    let overseasPicked = 0;
    let currentPurse = 0;

    const tryAdd = (p: Player) => {
      if (optimal.some(x => x.id === p.id)) return false;
      if (p.nationality === 'OVERSEAS' && overseasPicked >= 4) return false;
      if (currentPurse + p.currentPrice > 100.0) return false;
      optimal.push(p);
      currentPurse += p.currentPrice;
      if (p.nationality === 'OVERSEAS') overseasPicked++;
      return true;
    };

    // 1-2 WK
    if (wks[0]) tryAdd(wks[0]);
    if (wks[1] && wks[1].currentPrice <= 9.0) tryAdd(wks[1]);

    // 3-4 Batters
    bats.slice(0, 8).forEach(b => {
      if (optimal.filter(p => p.role === 'BAT').length < 3) tryAdd(b);
    });

    // 2 All-Rounders
    ars.slice(0, 8).forEach(ar => {
      if (optimal.filter(p => p.role === 'AR').length < 2) tryAdd(ar);
    });

    // 3-4 Bowlers
    bowls.slice(0, 10).forEach(bw => {
      if (optimal.filter(p => p.role === 'BOWL').length < 3) tryAdd(bw);
    });

    // Fill remaining up to 11 with value picks
    const remainingPool = [...ars, ...bowls, ...bats].sort((a, b) => a.currentPrice - b.currentPrice);
    remainingPool.forEach(p => {
      if (optimal.length < 11) tryAdd(p);
    });

    if (optimal.length === 11) {
      const newXiIds = optimal.map(p => p.id);
      setSelectedXI(newXiIds);
      setCaptainId(newXiIds[0] || '');
      setVcId(newXiIds[1] || '');
      setFeedback({ message: 'Optimal 11 generated within ₹100.0 Cr budget and Dream11 role rules!', type: 'success' });
    } else {
      setFeedback({ message: 'Auto-pick made selections. Please review and finalize your 11.', type: 'error' });
    }
  };

  // Reset to saved human team
  const handleResetXI = () => {
    setSelectedXI([...humanTeam.playing_xi]);
    setCaptainId(humanTeam.captain || humanTeam.playing_xi[0] || '');
    setVcId(humanTeam.vice_captain || humanTeam.playing_xi[1] || '');
    setImpactSubId(humanTeam.impact_sub || humanTeam.substitutes[0] || '');
    setFeedback({ message: 'Reverted lineup back to last confirmed team.', type: 'success' });
  };

  // Save changes
  const handleSaveTeam = () => {
    if (selectedXI.length !== 11) {
      setFeedback({
        message: `Lineup incomplete! You must choose exactly 11 players (${selectedXI.length}/11 selected).`,
        type: 'error'
      });
      return;
    }

    if (isOverBudget) {
      setFeedback({
        message: `Budget exceeded! Total credits is ₹${roundedCost} Cr. Must be within ₹100.0 Cr.`,
        type: 'error'
      });
      return;
    }

    if (isOverTransfers) {
      setFeedback({
        message: `Exceeds transfers limit! You have ${remainingTransfers} transfers left, but are attempting ${pendingTransfersCount} swaps.`,
        type: 'error'
      });
      return;
    }

    const res = updateUserLineup(selectedXI, captainId, vcId, impactSubId);
    if (!res.success) {
      setFeedback({ message: res.message, type: 'error' });
    } else {
      setFeedback({ message: res.message, type: 'success' });
      if (onSaved) {
        setTimeout(onSaved, 500);
      }
    }
  };

  return (
    <div className="w-full space-y-4 font-sans">
      {/* ============================================================== */}
      {/* 1. DREAM11 HEADER BANNER (Season, Stage, & Matchday) */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0b1739] via-[#091129] to-[#040817] border border-blue-900/40 p-4 sm:p-6 shadow-2xl flex flex-col items-center text-center">
        {/* Subtle background stadium glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-600/25 via-transparent to-transparent pointer-events-none" />

        {/* Top Badges */}
        <div className="flex items-center gap-2 mb-1">
          <span className="bg-gradient-to-r from-[#e11d48] to-[#f43f5e] text-white font-black tracking-widest text-[11px] sm:text-xs py-1 px-4 rounded-full shadow-lg shadow-rose-900/40 uppercase">
            DREAM11 FANTASY LEAGUE
          </span>
          <button
            onClick={() => setShowRulesModal(true)}
            className="bg-slate-800/80 hover:bg-slate-700 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5 transition cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Rules &amp; Limits</span>
          </button>
        </div>

        {/* Big Bold IPL Season Typography */}
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tighter uppercase drop-shadow-md select-none">
          {state.league_meta.season || 'IPL 2026'}
        </h1>

        {/* Match Day / Playoff Stage Pill */}
        <div className="mt-2 bg-white text-slate-950 font-black px-3.5 sm:px-6 py-1.5 rounded-2xl sm:rounded-full text-xs sm:text-sm tracking-wider shadow-lg flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-full text-center">
          <span>
            {state.league_meta.playoffs_stage === 'League'
              ? `MATCHDAY ${state.league_meta.current_matchday} OF 14`
              : `PLAYOFFS: ${state.league_meta.playoffs_stage.toUpperCase()}`}
          </span>
          <span className="text-slate-400 font-normal hidden xs:inline">|</span>
          <span className="text-blue-900 font-bold text-xs uppercase tracking-normal">
            {humanTeam.name}
          </span>
        </div>

        {/* Special Notification for Playoffs Unlimited Window */}
        {isUnlimitedWindow && (
          <div className="mt-3 w-full max-w-2xl bg-gradient-to-r from-emerald-600/30 via-emerald-500/20 to-emerald-600/30 border border-emerald-400/50 rounded-2xl p-2.5 text-emerald-200 text-xs flex items-center justify-center gap-2 shadow-lg">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-pulse" />
            <span className="font-bold">
              🎉 70 LEAGUE MATCHES COMPLETED! REACHED PLAYOFFS: UNLIMITED TRANSFERS ACTIVATED! Rebuild your 11 from the 4 qualified playoff teams for free!
            </span>
          </div>
        )}

        {/* Stats & Rules Summary Bar */}
        <div className="w-full max-w-4xl mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          {/* 1. Players Count */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-slate-400 text-[11px]">Selected Players</span>
            <div className="flex items-center space-x-1.5 mt-0.5 font-mono">
              <span
                className={`font-black px-2.5 py-0.5 rounded-full text-xs ${
                  selectedXI.length === 11
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}
              >
                {selectedXI.length} / 11
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 font-mono">
              Overseas: {overseasCount}/4
            </span>
          </div>

          {/* 2. 100 Credits Purse Meter */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-slate-400 text-[11px]">Credits Remaining</span>
            <div className="flex items-center space-x-1 mt-0.5 font-mono">
              <span
                className={`font-black text-sm ${
                  isOverBudget ? 'text-rose-400 animate-pulse' : 'text-amber-300'
                }`}
              >
                ₹{creditsRemaining.toFixed(1)} Cr
              </span>
              <span className="text-slate-500 text-[11px]">/ 100 Cr</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
              <div
                className={`h-full transition-all duration-300 ${
                  isOverBudget ? 'bg-rose-500' : 'bg-amber-400'
                }`}
                style={{ width: `${Math.min(100, (roundedCost / 100) * 100)}%` }}
              />
            </div>
          </div>

          {/* 3. Transfers Remaining Counter */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-slate-400 text-[11px]">Transfers Remaining</span>
            <div className="flex items-center space-x-1.5 mt-0.5 font-mono">
              {isUnlimitedWindow ? (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-black px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> ∞ UNLIMITED
                </span>
              ) : isPlayoffsStarted ? (
                <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 font-black px-2 py-0.5 rounded-full text-xs">
                  {transfers?.playoffs_transfers_remaining ?? 10} / 10 Left
                </span>
              ) : (
                <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 font-black px-2 py-0.5 rounded-full text-xs">
                  {transfers?.league_transfers_remaining ?? 100} / 100 Left
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 font-mono">
              {isPlayoffsStarted ? 'Playoffs Stage' : isUnlimitedWindow ? 'Playoffs Prep' : '70 League Matches'}
            </span>
          </div>

          {/* 4. Pending Transfers Diff */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
            <span className="text-slate-400 text-[11px]">Pending Swaps</span>
            <div className="flex items-center space-x-1 mt-0.5 font-mono">
              <span
                className={`font-black text-xs px-2 py-0.5 rounded-full ${
                  isOverTransfers
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : pendingTransfersCount > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isInitialDraft
                  ? '0 (Initial XI)'
                  : isUnlimitedWindow
                  ? `${pendingTransfersCount} (0 cost)`
                  : `${pendingTransfersCount} will be used`}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 mt-0.5 font-mono truncate max-w-[140px]">
              C: {getPlayerById(captainId)?.shortName || 'None'} · VC: {getPlayerById(vcId)?.shortName || 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Official TATA IPL Booster Status Banner */}
      <div
        onClick={openBoostersModal}
        className={`w-full p-3 sm:p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition shadow-lg ${
          activeBooster
            ? 'bg-gradient-to-r from-amber-950/70 via-slate-900 to-orange-950/70 border-amber-500/50 hover:border-amber-400 ring-1 ring-amber-500/30'
            : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40 hover:bg-slate-850'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-xl shrink-0 shadow-md shadow-amber-500/20">
            {activeBooster ? activeBooster.icon : '⚡'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                {activeBooster ? `Active Powerup: ${activeBooster.name}` : 'TATA IPL Official Boosters'}
              </span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {activeBooster ? activeBooster.multiplierText : '10 Powerups'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">
              {activeBooster
                ? `${activeBooster.description} (Active for Matchday ${state.league_meta.current_matchday})`
                : 'Triple Captain (3x), Double Power (2x XI), Indian Warrior, Free Hit, and more available for your 11.'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={e => {
              e.stopPropagation();
              openBoostersModal();
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 transition shadow-md shadow-amber-500/10 cursor-pointer"
          >
            {activeBooster ? 'Manage Powerup ⚡' : 'Deploy Booster →'}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. TOOLBAR: Auto-Pick, Reset, Save, View Switcher */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-2.5 sm:p-3 shadow-md w-full max-w-full overflow-hidden">
        {/* View Switcher: Pitch View vs List View */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('pitch')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'pitch'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>🏟️ Pitch</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'list'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>List <span className="hidden sm:inline">(All IPL)</span></span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleAutoPickOptimal}
            className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            title="Auto-picks optimal XI within 100 credits"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Auto-Pick</span>
          </button>

          <button
            onClick={handleResetXI}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Reset
          </button>

          <button
            onClick={handleSaveTeam}
            disabled={isOverBudget || isOverTransfers || selectedXI.length !== 11}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 px-3.5 sm:px-4 py-1.5 rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Save Team</span>
          </button>
        </div>
      </div>

      {/* Validation / Feedback Alerts */}
      {feedback && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between shadow-md ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isOverBudget && (
        <div className="p-3 bg-rose-950/60 border border-rose-800/70 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>BUDGET EXCEEDED:</strong> Your team credits total ₹{roundedCost} Cr. Dream11 limit is ₹100.0 Cr. Replace high-priced players to proceed.
          </span>
        </div>
      )}

      {isOverTransfers && (
        <div className="p-3 bg-rose-950/60 border border-rose-800/70 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>TRANSFERS LIMIT EXCEEDED:</strong> You are attempting {pendingTransfersCount} player swaps, but only have {remainingTransfers} transfers remaining.
          </span>
        </div>
      )}

      {!validation.valid && (
        <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Rules check: {validation.errors.join(' • ')}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. PITCH VIEW (Iconic Dream11 Cricket Ground from Screenshot) */}
      {/* ============================================================== */}
      {viewMode === 'pitch' && (
        <div className="space-y-4">
          {/* The Cricket Stadium Ground */}
          <div
            className="relative w-full max-w-full rounded-2xl sm:rounded-3xl overflow-hidden border-2 border-emerald-900/60 shadow-2xl p-2.5 sm:p-6"
            style={{
              background: `
                radial-gradient(ellipse at center, #1b7a3e 0%, #15803d 45%, #14532d 100%)
              `
            }}
          >
            {/* Lawn mowing vertical turf stripes pattern */}
            <div
              className="absolute inset-0 pointer-events-none opacity-25"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  to right,
                  rgba(255, 255, 255, 0.08) 0px,
                  rgba(255, 255, 255, 0.08) 48px,
                  transparent 48px,
                  transparent 96px
                )`
              }}
            />

            {/* Stadium 30-Yard Circle & Boundary Markings */}
            <div className="absolute inset-4 sm:inset-8 border border-white/20 rounded-full pointer-events-none" />
            <div className="absolute inset-8 sm:inset-16 border border-dashed border-white/20 rounded-full pointer-events-none" />

            {/* Central Cricket Pitch (Clay/Tan strip) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-28 sm:w-36 h-[72%] bg-gradient-to-b from-[#c2a265]/40 via-[#b99452]/40 to-[#c2a265]/40 rounded-sm border border-amber-200/30 pointer-events-none flex flex-col justify-between py-2 items-center">
              {/* Top Crease & Stumps */}
              <div className="w-full flex flex-col items-center">
                <div className="flex space-x-1 mb-1">
                  <div className="w-1 h-3 bg-amber-100 rounded-t-sm" />
                  <div className="w-1 h-3 bg-amber-100 rounded-t-sm" />
                  <div className="w-1 h-3 bg-amber-100 rounded-t-sm" />
                </div>
                <div className="w-16 h-0.5 bg-white/70" />
              </div>

              {/* Watermark in center of pitch */}
              <div className="text-center opacity-25 select-none font-black tracking-widest text-[9px] text-white">
                <div>IPL FANTASY</div>
                <div className="text-[7px]">100 CREDITS · 100 TRANSFERS</div>
              </div>

              {/* Bottom Crease & Stumps */}
              <div className="w-full flex flex-col items-center">
                <div className="w-16 h-0.5 bg-white/70 mb-1" />
                <div className="flex space-x-1">
                  <div className="w-1 h-3 bg-amber-100 rounded-b-sm" />
                  <div className="w-1 h-3 bg-amber-100 rounded-b-sm" />
                  <div className="w-1 h-3 bg-amber-100 rounded-b-sm" />
                </div>
              </div>
            </div>

            {/* Tactical Grid / Sections */}
            <div className="relative z-10 space-y-5 sm:space-y-8 my-2">
              {/* ---------------- SECTION 1: WICKET-KEEPERS ---------------- */}
              <div className="space-y-2">
                <div className="text-center">
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-emerald-100/90 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/20 backdrop-blur-sm">
                    Wicket-Keepers ({wkPlayers.length})
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 min-h-[85px]">
                  {wkPlayers.map(player => (
                    <PitchPlayerCard
                      key={player.id}
                      player={player}
                      isCaptain={captainId === player.id}
                      isVC={vcId === player.id}
                      isImpact={impactSubId === player.id}
                      isSwapping={swappingPlayerId === player.id}
                      boosterMultiplierBadge={getBoosterBadgeForPlayer(player, captainId === player.id, impactSubId === player.id)}
                      onSelectCaptain={() => handleMakeCaptain(player.id)}
                      onSelectVC={() => handleMakeVC(player.id)}
                      onSelectImpact={() => handleSetImpact(player.id)}
                      onStartSwap={() => setSwappingPlayerId(player.id)}
                      onRemove={() => handleTogglePlayer(player)}
                      onInspect={() => setInspectingPlayer(player)}
                    />
                  ))}
                  {wkPlayers.length === 0 && (
                    <EmptyRoleSlot
                      role="WK"
                      label="+ Add Keeper"
                      onClick={() => {
                        setViewMode('list');
                        setListRoleTab('WK');
                      }}
                    />
                  )}
                </div>
              </div>

              {/* ---------------- SECTION 2: BATSMEN ---------------- */}
              <div className="space-y-2">
                <div className="text-center">
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-emerald-100/90 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/20 backdrop-blur-sm">
                    Batsmen ({batPlayers.length})
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 min-h-[85px]">
                  {batPlayers.map(player => (
                    <PitchPlayerCard
                      key={player.id}
                      player={player}
                      isCaptain={captainId === player.id}
                      isVC={vcId === player.id}
                      isImpact={impactSubId === player.id}
                      isSwapping={swappingPlayerId === player.id}
                      boosterMultiplierBadge={getBoosterBadgeForPlayer(player, captainId === player.id, impactSubId === player.id)}
                      onSelectCaptain={() => handleMakeCaptain(player.id)}
                      onSelectVC={() => handleMakeVC(player.id)}
                      onSelectImpact={() => handleSetImpact(player.id)}
                      onStartSwap={() => setSwappingPlayerId(player.id)}
                      onRemove={() => handleTogglePlayer(player)}
                      onInspect={() => setInspectingPlayer(player)}
                    />
                  ))}
                  {batPlayers.length < 3 && (
                    <EmptyRoleSlot
                      role="BAT"
                      label="+ Add Batter"
                      onClick={() => {
                        setViewMode('list');
                        setListRoleTab('BAT');
                      }}
                    />
                  )}
                </div>
              </div>

              {/* ---------------- SECTION 3: ALL-ROUNDERS ---------------- */}
              <div className="space-y-2">
                <div className="text-center">
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-emerald-100/90 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/20 backdrop-blur-sm">
                    All-Rounders ({arPlayers.length})
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 min-h-[85px]">
                  {arPlayers.map(player => (
                    <PitchPlayerCard
                      key={player.id}
                      player={player}
                      isCaptain={captainId === player.id}
                      isVC={vcId === player.id}
                      isImpact={impactSubId === player.id}
                      isSwapping={swappingPlayerId === player.id}
                      boosterMultiplierBadge={getBoosterBadgeForPlayer(player, captainId === player.id, impactSubId === player.id)}
                      onSelectCaptain={() => handleMakeCaptain(player.id)}
                      onSelectVC={() => handleMakeVC(player.id)}
                      onSelectImpact={() => handleSetImpact(player.id)}
                      onStartSwap={() => setSwappingPlayerId(player.id)}
                      onRemove={() => handleTogglePlayer(player)}
                      onInspect={() => setInspectingPlayer(player)}
                    />
                  ))}
                  {arPlayers.length < 1 && (
                    <EmptyRoleSlot
                      role="AR"
                      label="+ Add All-Rounder"
                      onClick={() => {
                        setViewMode('list');
                        setListRoleTab('AR');
                      }}
                    />
                  )}
                </div>
              </div>

              {/* ---------------- SECTION 4: BOWLERS ---------------- */}
              <div className="space-y-2">
                <div className="text-center">
                  <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-emerald-100/90 bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-500/20 backdrop-blur-sm">
                    Bowlers ({bowlPlayers.length})
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 min-h-[85px]">
                  {bowlPlayers.map(player => (
                    <PitchPlayerCard
                      key={player.id}
                      player={player}
                      isCaptain={captainId === player.id}
                      isVC={vcId === player.id}
                      isImpact={impactSubId === player.id}
                      isSwapping={swappingPlayerId === player.id}
                      boosterMultiplierBadge={getBoosterBadgeForPlayer(player, captainId === player.id, impactSubId === player.id)}
                      onSelectCaptain={() => handleMakeCaptain(player.id)}
                      onSelectVC={() => handleMakeVC(player.id)}
                      onSelectImpact={() => handleSetImpact(player.id)}
                      onStartSwap={() => setSwappingPlayerId(player.id)}
                      onRemove={() => handleTogglePlayer(player)}
                      onInspect={() => setInspectingPlayer(player)}
                    />
                  ))}
                  {bowlPlayers.length < 3 && (
                    <EmptyRoleSlot
                      role="BOWL"
                      label="+ Add Bowler"
                      onClick={() => {
                        setViewMode('list');
                        setListRoleTab('BOWL');
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 4. SWAP DRAWER / SELECTION PANEL */}
          {/* ============================================================== */}
          {swappingPlayerId && (
            <div className="bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <ArrowRightLeft className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Swap / Replace: <span className="text-amber-300">{getPlayerById(swappingPlayerId)?.name}</span> ({getPlayerById(swappingPlayerId)?.role} · ₹{getPlayerById(swappingPlayerId)?.currentPrice} Cr)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Pick a replacement from your squad or the entire IPL Player Pool.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Pool Scope Switch */}
                  <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                    <button
                      onClick={() => setPoolScope('all')}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer transition ${
                        poolScope === 'all' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All IPL Pool
                    </button>
                    <button
                      onClick={() => setPoolScope('squad')}
                      className={`px-2.5 py-1 rounded font-bold cursor-pointer transition ${
                        poolScope === 'squad' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      My Bench ({benchPlayers.length})
                    </button>
                  </div>

                  <button
                    onClick={() => setSwappingPlayerId(null)}
                    className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Franchise Quick Filters */}
              {poolScope === 'all' && (
                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
                  {IPL_TEAMS_LIST.map(teamCode => (
                    <button
                      key={teamCode}
                      onClick={() => setSelectedFranchiseFilter(teamCode)}
                      className={`px-2.5 py-1 rounded-lg font-mono font-bold shrink-0 transition cursor-pointer ${
                        selectedFranchiseFilter === teamCode
                          ? 'bg-amber-500 text-slate-950 shadow'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {teamCode}
                    </button>
                  ))}
                </div>
              )}

              {/* Candidate Swap Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto pr-1">
                {(poolScope === 'squad'
                  ? benchPlayers
                  : ALL_PLAYERS.filter(p => !selectedXI.includes(p.id))
                )
                  .filter(p => {
                    const currentSwapping = getPlayerById(swappingPlayerId);
                    if (!currentSwapping) return true;
                    // Match role or allow flexible
                    if (p.role !== currentSwapping.role && poolScope === 'all') {
                      // Allow matching role preferred
                      return false;
                    }
                    if (selectedFranchiseFilter !== 'ALL' && p.teamAffiliation !== selectedFranchiseFilter) {
                      return false;
                    }
                    return true;
                  })
                  .slice(0, 36)
                  .map(candidate => {
                    const currentSwapping = getPlayerById(swappingPlayerId);
                    const costDiff = currentSwapping ? candidate.currentPrice - currentSwapping.currentPrice : 0;
                    const resultingCredits = roundedCost + costDiff;
                    const canAfford = resultingCredits <= 100.0;

                    return (
                      <div
                        key={candidate.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                          canAfford
                            ? 'bg-slate-950/80 hover:bg-slate-800/60 border-slate-800 hover:border-amber-500/40'
                            : 'bg-rose-950/20 border-rose-900/30 opacity-60'
                        }`}
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                            style={{ backgroundColor: candidate.avatarColor || '#3b82f6' }}
                          >
                            {candidate.shortName.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-white truncate flex items-center gap-1">
                              <span>{candidate.shortName}</span>
                              {candidate.nationality === 'OVERSEAS' && <span className="text-[10px]">✈</span>}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              <span className="text-amber-400 font-semibold">{candidate.teamAffiliation || 'IPL'}</span> · ₹{candidate.currentPrice} Cr
                            </div>
                          </div>
                        </div>

                        <button
                          disabled={!canAfford}
                          onClick={() => handleExecuteSwap(swappingPlayerId, candidate.id)}
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg shrink-0 transition flex items-center gap-1 cursor-pointer ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow'
                              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          }`}
                        >
                          <ArrowRightLeft className="w-3 h-3" />
                          <span>Swap</span>
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. LIST & SQUAD SELECTOR VIEW (Dream11 Style Table) */}
      {/* ============================================================== */}
      {viewMode === 'list' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-3 p-4">
          {/* Controls Bar: Role Tabs, Franchise Filter, and Search */}
          <div className="space-y-3">
            {/* Role Navigation Tabs (WK, BAT, AR, BOWL) */}
            <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
              {(['WK', 'BAT', 'AR', 'BOWL'] as PlayerRole[]).map(role => {
                const roleCount = xiPlayers.filter(p => p.role === role).length;
                const roleTitle =
                  role === 'WK'
                    ? 'Wicket-Keeper'
                    : role === 'BAT'
                    ? 'Batsmen'
                    : role === 'AR'
                    ? 'All-Rounders'
                    : 'Bowlers';

                return (
                  <button
                    key={role}
                    onClick={() => setListRoleTab(role)}
                    className={`py-2 px-1 text-center text-xs font-bold rounded-lg transition flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                      listRoleTab === role
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <span>{roleTitle}</span>
                    <span className="text-[10px] font-mono opacity-80">
                      Selected: <strong>{roleCount}</strong>
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Franchise Filters & Search */}
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Franchise Chips */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-xs">
                {IPL_TEAMS_LIST.map(teamCode => (
                  <button
                    key={teamCode}
                    onClick={() => setSelectedFranchiseFilter(teamCode)}
                    className={`px-2.5 py-1 rounded-lg font-mono font-bold shrink-0 transition cursor-pointer ${
                      selectedFranchiseFilter === teamCode
                        ? 'bg-amber-500 text-slate-950 shadow'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {teamCode}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search player name..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Player Selection Table */}
          <div className="divide-y divide-slate-800 max-h-[480px] overflow-y-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
            {filteredPlayerPool.map(player => {
              const inXI = selectedXI.includes(player.id);
              const isC = captainId === player.id;
              const isVC = vcId === player.id;
              const canAfford = inXI || (roundedCost + player.currentPrice <= 100.0);

              return (
                <div
                  key={player.id}
                  className={`p-3 sm:p-3.5 flex items-center justify-between gap-3 transition ${
                    inXI
                      ? 'bg-emerald-950/20 border-l-4 border-l-emerald-500'
                      : 'hover:bg-slate-800/40'
                  }`}
                >
                  {/* Player Info */}
                  <div className="flex items-center space-x-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0 ring-1 ring-white/10"
                      style={{ backgroundColor: player.avatarColor || '#3b82f6' }}
                    >
                      {player.shortName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-sm font-bold text-white truncate">
                          {player.name}
                        </span>
                        {player.nationality === 'OVERSEAS' && (
                          <span className="text-xs text-sky-400" title="Overseas Player">
                            ✈
                          </span>
                        )}
                        {inXI && (
                          <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                            IN XI
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-mono flex items-center space-x-2 mt-0.5">
                        <span className="text-amber-400 font-semibold">
                          {player.teamAffiliation || 'IPL'}
                        </span>
                        <span>·</span>
                        <span>Tier {player.tier}</span>
                        <span>·</span>
                        <span>Bat: {player.battingRating}</span>
                        <span>·</span>
                        <span>Bowl: {player.bowlingRating}</span>
                      </div>
                    </div>
                  </div>

                  {/* Credits & Action Buttons */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="text-right font-mono pr-2">
                      <div className="text-xs font-bold text-amber-300">
                        ₹{player.currentPrice} Cr
                      </div>
                      <div className="text-[10px] text-slate-500">Credits</div>
                    </div>

                    {inXI ? (
                      <div className="flex items-center space-x-1">
                        {/* Captain Button */}
                        <button
                          onClick={() => handleMakeCaptain(player.id)}
                          className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                            isC
                              ? 'bg-amber-500 text-slate-950 shadow'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                          title="Set as Captain (2x points)"
                        >
                          {isC ? '👑 C (2x)' : 'C'}
                        </button>

                        {/* VC Button */}
                        <button
                          onClick={() => handleMakeVC(player.id)}
                          className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                            isVC
                              ? 'bg-cyan-500 text-slate-950 shadow'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                          title="Set as Vice-Captain (1.5x points)"
                        >
                          {isVC ? '⭐ VC (1.5x)' : 'VC'}
                        </button>

                        {/* Remove from XI */}
                        <button
                          onClick={() => handleTogglePlayer(player)}
                          className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 p-1.5 rounded-lg border border-rose-500/30 transition cursor-pointer"
                          title="Remove from XI"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        disabled={!canAfford || selectedXI.length >= 11}
                        onClick={() => handleTogglePlayer(player)}
                        className={`font-bold text-xs px-3 py-1.5 rounded-lg transition shadow-md flex items-center gap-1 cursor-pointer ${
                          !canAfford
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. DREAM11 RULES & TRANSFER HISTORY MODAL */}
      {/* ============================================================== */}
      {showRulesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  Dream11 Rules &amp; Fantasy Transfers
                </h3>
              </div>
              <button
                onClick={() => setShowRulesModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* The 4 Core Dream11 Fantasy Rules Requested */}
            <div className="space-y-3">
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-start space-x-3">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs shrink-0">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">100 Credits &amp; 11 Players</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Build your team of 11 players across all IPL franchises without exceeding 100.0 credits. Maximum 4 overseas players allowed in the Playing XI.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-start space-x-3">
                <div className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-xs shrink-0">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">100 Transfers for 70 League Matches</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    You have exactly 100 transfers to use strategically throughout all 70 round-robin league matches (14 matchdays).
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-start space-x-3">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs shrink-0">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Unlimited Transfers on Reaching Playoffs</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Once the 70 league matches conclude and the top 4 teams qualify for the playoffs, an unlimited free transfer window opens! Reconstruct your entire 11 from the playoff qualifiers without using any transfers.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex items-start space-x-3">
                <div className="w-7 h-7 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-xs shrink-0">
                  4
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">10 Transfers When Playoffs Start</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    When the first playoff match (Qualifier 1) commences, the unlimited window closes and you are granted 10 transfers for the entire playoff stage (Qualifier 1, Eliminator, Qualifier 2, Final).
                  </p>
                </div>
              </div>
            </div>

            {/* Transfers History Table */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-amber-400" />
                  Transfer Transaction History
                </span>
                <span className="text-slate-500 font-mono">
                  Total Swaps: {transfers?.history?.reduce((sum, h) => sum + h.transfersCount, 0) || 0}
                </span>
              </div>

              {(!transfers?.history || transfers.history.length === 0) ? (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center text-xs text-slate-500 italic">
                  No transfer transactions recorded yet. Swaps made between matches will be logged here.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80 max-h-48 overflow-y-auto bg-slate-950 rounded-xl border border-slate-800 text-xs">
                  {transfers.history.map(record => (
                    <div key={record.id} className="p-2.5 flex items-center justify-between gap-2">
                      <div>
                        <div className="font-mono font-bold text-white flex items-center gap-1.5">
                          <span className="text-amber-400">MD {record.matchday}</span>
                          <span className="text-slate-500">·</span>
                          <span className="text-[11px] text-slate-300">
                            {record.transfersCount} swap{record.transfersCount === 1 ? '' : 's'} ({record.stage})
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          In: <strong className="text-emerald-400">{record.playersIn.map(id => getPlayerById(id)?.shortName).join(', ') || 'None'}</strong> · Out: <strong className="text-rose-400">{record.playersOut.map(id => getPlayerById(id)?.shortName).join(', ') || 'None'}</strong>
                        </div>
                      </div>
                      <div className="text-right font-mono text-[10px] text-slate-400">
                        <div>{record.timestamp}</div>
                        <div className="text-cyan-400 font-bold">Bal: {record.remainingAfter}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowRulesModal(false)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Close &amp; Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. PLAYER PROFILE & STATS MODAL */}
      {/* ============================================================== */}
      {inspectingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md"
                  style={{ backgroundColor: inspectingPlayer.avatarColor || '#3b82f6' }}
                >
                  {inspectingPlayer.shortName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-1.5">
                    <span>{inspectingPlayer.name}</span>
                    {inspectingPlayer.nationality === 'OVERSEAS' && <span>✈</span>}
                  </h3>
                  <div className="text-xs text-amber-400 font-mono font-semibold">
                    {inspectingPlayer.teamAffiliation || 'IPL'} · {inspectingPlayer.role} · Tier {inspectingPlayer.tier}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectingPlayer(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 italic">{inspectingPlayer.bio}</p>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div>
                Batting Rating: <strong className="text-white">{inspectingPlayer.battingRating}</strong>
              </div>
              <div>
                Bowling Rating: <strong className="text-white">{inspectingPlayer.bowlingRating}</strong>
              </div>
              <div>
                Economy: <strong className="text-white">{inspectingPlayer.economyRating}</strong>
              </div>
              <div>
                Strike Rate: <strong className="text-white">{inspectingPlayer.strikeRateRating}</strong>
              </div>
              <div>
                Clutch Factor: <strong className="text-amber-400">{inspectingPlayer.clutchFactor}/10</strong>
              </div>
              <div>
                Value: <strong className="text-amber-300">₹{inspectingPlayer.currentPrice} Cr</strong>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  handleMakeCaptain(inspectingPlayer.id);
                  setInspectingPlayer(null);
                }}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs"
              >
                👑 Make Captain (2x)
              </button>
              <button
                onClick={() => {
                  handleMakeVC(inspectingPlayer.id);
                  setInspectingPlayer(null);
                }}
                className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs"
              >
                ⭐ VC (1.5x)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==============================================================
// PITCH PLAYER CARD COMPONENT
// Exactly replicates the visual style of Dream11 players on the pitch:
// - Circular headshot with jersey
// - Team affiliation pill on left
// - Overseas '✈' icon top left
// - 'C' or 'VC' badge top right
// - Dark navy rounded name pill
// - Credits below name pill
// ==============================================================
interface PitchPlayerCardProps {
  player: Player;
  isCaptain: boolean;
  isVC: boolean;
  isImpact: boolean;
  isSwapping: boolean;
  boosterMultiplierBadge?: string | null;
  onSelectCaptain: () => void;
  onSelectVC: () => void;
  onSelectImpact: () => void;
  onStartSwap: () => void;
  onRemove: () => void;
  onInspect: () => void;
}

const PitchPlayerCard: React.FC<PitchPlayerCardProps> = ({
  player,
  isCaptain,
  isVC,
  isImpact,
  isSwapping,
  boosterMultiplierBadge,
  onSelectCaptain,
  onSelectVC,
  onSelectImpact,
  onStartSwap,
  onRemove,
  onInspect
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const teamTag = player.teamAffiliation || 'IPL';

  return (
    <div className="relative group flex flex-col items-center">
      {/* Top action popover trigger */}
      <div
        onClick={() => setShowMenu(prev => !prev)}
        className="relative flex flex-col items-center cursor-pointer transition transform hover:scale-105 active:scale-95"
      >
        {/* Avatar Ring */}
        <div className="relative flex items-center justify-center">
          {/* Circular Headshot Container */}
          <div
            className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-xl ring-2 ${
              isCaptain
                ? 'ring-amber-400 bg-gradient-to-tr from-amber-600 to-amber-400'
                : isVC
                ? 'ring-cyan-400 bg-gradient-to-tr from-cyan-600 to-cyan-400'
                : isSwapping
                ? 'ring-rose-400 animate-pulse'
                : 'ring-white/40'
            }`}
            style={{
              backgroundColor: player.avatarColor || '#1e293b'
            }}
          >
            <div className="flex flex-col items-center justify-center">
              <span className="text-[11px] sm:text-xs font-black tracking-tight drop-shadow">
                {player.shortName.slice(0, 2).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Left Team Badge Tag */}
          <span className="absolute -left-2 top-2 bg-slate-950/90 text-white font-mono font-bold text-[9px] px-1 py-0.2 rounded border border-white/20 shadow">
            {teamTag}
          </span>

          {/* Overseas Flight Icon top-left */}
          {player.nationality === 'OVERSEAS' && (
            <span
              className="absolute -top-1 -left-1 text-[11px] leading-none drop-shadow"
              title="Overseas Player"
            >
              ✈️
            </span>
          )}

          {/* Captain / Vice-Captain Circular Badge top-right */}
          {isCaptain && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-lg ring-1 ring-white">
              C
            </div>
          )}
          {isVC && !isCaptain && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white text-slate-950 font-black text-[9px] flex items-center justify-center shadow-lg ring-1 ring-cyan-500">
              VC
            </div>
          )}

          {/* Impact Player ⚡ icon */}
          {isImpact && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center shadow ring-1 ring-white">
              ⚡
            </div>
          )}

          {/* Active Booster Multiplier Tag */}
          {boosterMultiplierBadge && (
            <div className="absolute -bottom-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-slate-950 font-black text-[8px] sm:text-[9px] px-1.5 py-0.2 rounded-full shadow-lg ring-1 ring-white tracking-tight animate-bounce z-20">
              {boosterMultiplierBadge}
            </div>
          )}
        </div>

        {/* Player Name Pill (Dark Navy capsule) */}
        <div className="mt-1 bg-[#091129] border border-blue-900/60 text-white font-bold text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full shadow-md truncate max-w-[72px] sm:max-w-[100px] text-center">
          {player.shortName}
        </div>

        {/* Price Tag (Cr) below name */}
        <div className="text-white font-bold text-[10px] sm:text-[11px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mt-0.5">
          {player.currentPrice} <span className="font-normal text-[9px]">Cr</span>
        </div>
      </div>

      {/* Floating Context Action Menu when tapped / clicked */}
      {showMenu && (
        <div className="absolute top-full mt-1 z-30 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl p-2 w-36 space-y-1 text-left">
          <button
            onClick={() => {
              onSelectCaptain();
              setShowMenu(false);
            }}
            className="w-full text-left px-2 py-1 text-[11px] text-amber-300 hover:bg-slate-800 rounded font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Crown className="w-3 h-3 text-amber-400" /> Make C (2x)
          </button>

          <button
            onClick={() => {
              onSelectVC();
              setShowMenu(false);
            }}
            className="w-full text-left px-2 py-1 text-[11px] text-cyan-300 hover:bg-slate-800 rounded font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Star className="w-3 h-3 text-cyan-400" /> Make VC (1.5x)
          </button>

          <button
            onClick={() => {
              onSelectImpact();
              setShowMenu(false);
            }}
            className="w-full text-left px-2 py-1 text-[11px] text-amber-400 hover:bg-slate-800 rounded font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Zap className="w-3 h-3 text-amber-400" /> Impact Sub
          </button>

          <button
            onClick={() => {
              onStartSwap();
              setShowMenu(false);
            }}
            className="w-full text-left px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-800 rounded flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRightLeft className="w-3 h-3 text-slate-400" /> Swap / Sub
          </button>

          <button
            onClick={() => {
              onInspect();
              setShowMenu(false);
            }}
            className="w-full text-left px-2 py-1 text-[11px] text-slate-300 hover:bg-slate-800 rounded flex items-center gap-1.5 cursor-pointer"
          >
            <Info className="w-3 h-3 text-slate-400" /> View Stats
          </button>

          <button
            onClick={() => {
              onRemove();
              setShowMenu(false);
            }}
            className="w-full text-left px-2 py-1 text-[11px] text-rose-400 hover:bg-rose-950/40 rounded font-bold flex items-center gap-1.5 border-t border-slate-800 mt-1 pt-1 cursor-pointer"
          >
            <X className="w-3 h-3 text-rose-400" /> Drop from XI
          </button>
        </div>
      )}
    </div>
  );
};

// Empty Role Slot placeholder on the field
interface EmptyRoleSlotProps {
  role: PlayerRole;
  label: string;
  onClick: () => void;
}

const EmptyRoleSlot: React.FC<EmptyRoleSlotProps> = ({ label, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-2 rounded-2xl border-2 border-dashed border-white/30 hover:border-white/60 bg-emerald-950/20 hover:bg-emerald-900/30 transition cursor-pointer group"
    >
      <div className="w-12 h-12 rounded-full border border-dashed border-white/40 flex items-center justify-center text-white/60 group-hover:text-white group-hover:scale-110 transition">
        <Plus className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-bold text-white/80 group-hover:text-white mt-1">
        {label}
      </span>
    </button>
  );
};
