import React from 'react';
import { useGame } from '../context/GameContext';
import { getBoosterById } from '../data/boosters';
import {
  Trophy,
  Play,
  RotateCcw,
  Terminal,
  ArrowRightLeft,
  DollarSign,
  Sparkles,
  Zap,
  History,
  Calendar
} from 'lucide-react';

interface HeaderProps {
  onToggleConsole: () => void;
  isConsoleOpen: boolean;
  onOpenManagerDashboard?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleConsole, isConsoleOpen, onOpenManagerDashboard }) => {
  const {
    state,
    humanTeam,
    transfersState,
    boostersState,
    openBoostersModal,
    simulateCurrentMatchday,
    openNewSeasonModal,
    openSeasonArchiveModal,
    openSeasonEndModal
  } = useGame();

  const isPlayoffs = state.league_meta.playoffs_stage !== 'League';
  const isFinalCompleted = state.fixtures.some(f => f.playoffLabel === 'Final' && f.isCompleted);
  const isSeasonOver = isFinalCompleted || state.league_meta.playoffs_stage === 'Completed';

  const transfers = transfersState || state.transfers_state;
  const isUnlimited = transfers?.is_unlimited_window ?? false;
  const isPlayoffsStarted = transfers?.playoffs_started ?? false;

  const activeBooster = boostersState.activeBoosterForNextMatch
    ? getBoosterById(boostersState.activeBoosterForNextMatch)
    : null;

  // Rank in leaderboard
  const userRank = state.leaderboard.findIndex(e => e.teamId === humanTeam.id) + 1 || 1;
  const historyCount = state.season_history?.length || 0;

  return (
    <header className="sticky top-0 z-40 w-full max-w-full overflow-x-hidden bg-[#0a1538]/95 backdrop-blur-md border-b border-indigo-900/60 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-1.5 sm:gap-4">
          {/* Logo & Stage */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-1 ring-amber-400/40 shrink-0">
              <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1 sm:space-x-2">
                <span className="font-black text-sm sm:text-lg tracking-tight text-white flex items-center shrink-0">
                  IPL <span className="text-amber-400 ml-1 font-bold">FANTASY</span>
                </span>
                <span className="bg-amber-500/20 text-amber-300 text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-500/30 truncate">
                  {state.league_meta.playoffs_stage === 'League'
                    ? `MD ${state.league_meta.current_matchday}/${state.league_meta.total_matchdays}`
                    : state.league_meta.playoffs_stage}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block truncate">
                {state.league_meta.season} · 70 League Matches + Playoffs
              </p>
            </div>
          </div>

          {/* User Team Snapshot Bar (Interactive Manager HQ Drawer Trigger) */}
          <button
            type="button"
            onClick={onOpenManagerDashboard}
            className="hidden md:flex items-center space-x-4 bg-[#050c1e] hover:bg-indigo-950/80 px-4 py-2 rounded-2xl border border-indigo-950 hover:border-amber-500/40 transition cursor-pointer text-left group shrink-0"
            title="Click to open Manager Dashboard"
          >
            {/* Team Identity */}
            <div className="flex items-center space-x-2">
              <span className="text-xl group-hover:scale-110 transition">{humanTeam.logoEmoji || '⚡'}</span>
              <div>
                <div className="text-xs font-black text-white flex items-center space-x-1.5">
                  <span className="group-hover:text-amber-300 transition">{humanTeam.name}</span>
                  <span className="text-[10px] text-amber-400 font-mono">#{userRank}</span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center space-x-2 font-mono">
                  <span>Score: <strong className="text-cyan-400 font-bold">{humanTeam.stats.totalFantasyPoints} pts</strong></span>
                </div>
              </div>
            </div>

            <div className="h-6 w-px bg-indigo-900/60" />

            {/* Transfers counter */}
            <div className="flex items-center space-x-1.5 text-xs font-mono">
              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400 text-[11px]">Transfers:</span>
              <span className="font-bold text-cyan-300">
                {isUnlimited
                  ? '∞ Free'
                  : isPlayoffsStarted
                  ? `${transfers?.playoffs_transfers_remaining ?? 10}/10`
                  : `${transfers?.league_transfers_remaining ?? 100}/100`}
              </span>
            </div>

            <div className="h-6 w-px bg-indigo-900/60" />

            {/* Purse */}
            <div className="flex items-center space-x-1.5 text-xs font-mono">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400 text-[11px]">Purse:</span>
              <span className="font-bold text-amber-300">₹{humanTeam.budget_remaining.toFixed(1)} Cr</span>
            </div>
          </button>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* Season Concluded Call-to-Action */}
            {isSeasonOver && (
              <button
                onClick={openSeasonEndModal}
                className="flex items-center space-x-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs transition shadow-lg shadow-emerald-500/25 animate-pulse cursor-pointer"
                title="Review Championship & Start Next Season"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Start New Year</span>
                <span className="xs:hidden">Reset</span>
              </button>
            )}

            {/* Boosters Pill */}
            <button
              onClick={openBoostersModal}
              className={`flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition cursor-pointer border shrink-0 ${
                activeBooster
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/20 ring-1 ring-amber-500/40'
                  : 'bg-[#050c1e] text-slate-300 border-indigo-950 hover:border-amber-500/50 hover:text-white'
              }`}
              title="Official TATA IPL Boosters Hub"
            >
              <Zap className={`w-3.5 h-3.5 ${activeBooster ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
              <span className="hidden md:inline font-mono">Booster:</span>
              <span className={`text-[11px] sm:text-xs ${activeBooster ? 'text-amber-300 font-extrabold' : 'text-slate-400'}`}>
                {activeBooster ? activeBooster.name.split(' ')[0] : 'Booster'}
              </span>
            </button>

            {/* Simulate Button */}
            {!isSeasonOver && (
              <button
                onClick={() => simulateCurrentMatchday()}
                className="flex items-center space-x-1 sm:space-x-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs transition shadow-md shadow-amber-500/10 active:scale-95 cursor-pointer shrink-0"
                title="Simulate Current Matchday"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span className="hidden xs:inline">Simulate</span>
                <span className="xs:hidden">Sim</span>
              </button>
            )}

            {/* Trophy Cabinet / History (Tablet & Desktop) */}
            <button
              onClick={openSeasonArchiveModal}
              className={`hidden sm:flex p-2 rounded-xl text-xs font-mono border transition cursor-pointer relative shrink-0 ${
                historyCount > 0
                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
                  : 'bg-[#050c1e] text-slate-400 hover:text-white border-indigo-900/60 hover:bg-indigo-950'
              }`}
              title="Trophy Cabinet & Season History"
            >
              <History className="w-4 h-4" />
              {historyCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                  {historyCount}
                </span>
              )}
            </button>

            {/* Terminal CLI Toggle (Tablet & Desktop) */}
            <button
              onClick={onToggleConsole}
              className={`hidden md:flex p-2 rounded-xl text-xs font-mono border transition cursor-pointer shrink-0 ${
                isConsoleOpen
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-[#050c1e] text-slate-400 hover:text-white border-indigo-900/60 hover:bg-indigo-950'
              }`}
              title="Toggle FLAME Command Console"
            >
              <Terminal className="w-4 h-4" />
            </button>

            {/* New Season / Reset Modal Button (Tablet & Desktop) */}
            <button
              onClick={openNewSeasonModal}
              className="hidden sm:flex p-2 rounded-xl text-xs text-slate-400 hover:text-emerald-400 hover:bg-emerald-950/40 border border-indigo-900/60 hover:border-emerald-900 transition cursor-pointer shrink-0"
              title="Start New Year & New Team / Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

