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
  Zap
} from 'lucide-react';

interface HeaderProps {
  onToggleConsole: () => void;
  isConsoleOpen: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onToggleConsole, isConsoleOpen }) => {
  const {
    state,
    humanTeam,
    transfersState,
    boostersState,
    openBoostersModal,
    simulateCurrentMatchday,
    resetTournament
  } = useGame();

  const isPlayoffs = state.league_meta.playoffs_stage !== 'League';
  const transfers = transfersState || state.transfers_state;
  const isUnlimited = transfers?.is_unlimited_window ?? false;
  const isPlayoffsStarted = transfers?.playoffs_started ?? false;

  const activeBooster = boostersState.activeBoosterForNextMatch
    ? getBoosterById(boostersState.activeBoosterForNextMatch)
    : null;

  // Rank in leaderboard
  const userRank = state.leaderboard.findIndex(e => e.teamId === humanTeam.id) + 1 || 1;

  return (
    <header className="sticky top-0 z-40 bg-[#0a1538]/95 backdrop-blur-md border-b border-indigo-900/60 text-white shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Stage */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-orange-500/20 ring-1 ring-amber-400/40">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-lg tracking-tight text-white flex items-center">
                  IPL <span className="text-amber-400 ml-1 font-bold">FANTASY</span>
                </span>
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  {state.league_meta.playoffs_stage === 'League'
                    ? `Matchday ${state.league_meta.current_matchday}/${state.league_meta.total_matchdays}`
                    : state.league_meta.playoffs_stage}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
                Official 2026 Season · 70 League Matches
              </p>
            </div>
          </div>

          {/* User Team Snapshot Bar (Clean & Uncluttered) */}
          <div className="hidden md:flex items-center space-x-4 bg-[#050c1e] px-4 py-2 rounded-2xl border border-indigo-950">
            {/* Team Identity */}
            <div className="flex items-center space-x-2">
              <span className="text-xl">{humanTeam.logoEmoji || '⚡'}</span>
              <div>
                <div className="text-xs font-black text-white flex items-center space-x-1.5">
                  <span>{humanTeam.name}</span>
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
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2">
            {/* Boosters Pill */}
            <button
              onClick={openBoostersModal}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                activeBooster
                  ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/20 ring-1 ring-amber-500/40'
                  : 'bg-[#050c1e] text-slate-300 border-indigo-950 hover:border-amber-500/50 hover:text-white'
              }`}
              title="Official TATA IPL Boosters Hub"
            >
              <Zap className={`w-3.5 h-3.5 ${activeBooster ? 'text-amber-400 fill-amber-400' : 'text-slate-400'}`} />
              <span className="hidden sm:inline font-mono">Booster:</span>
              <span className={activeBooster ? 'text-amber-300 font-extrabold' : 'text-slate-400'}>
                {activeBooster ? activeBooster.name : 'Pick'}
              </span>
            </button>

            {/* Simulate Button */}
            <button
              onClick={() => simulateCurrentMatchday()}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition shadow-md shadow-amber-500/10 active:scale-95 cursor-pointer"
              title="Simulate Current Matchday"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Simulate Day</span>
            </button>

            {/* Terminal CLI Toggle */}
            <button
              onClick={onToggleConsole}
              className={`p-2 rounded-xl text-xs font-mono border transition cursor-pointer ${
                isConsoleOpen
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                  : 'bg-[#050c1e] text-slate-400 hover:text-white border-indigo-900/60 hover:bg-indigo-950'
              }`}
              title="Toggle FLAME Command Console"
            >
              <Terminal className="w-4 h-4" />
            </button>

            {/* Reset / New Team */}
            <button
              onClick={() => {
                if (window.confirm('Reset this fantasy season and choose a new team name and 11 players?')) {
                  resetTournament();
                }
              }}
              className="p-2 rounded-xl text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-indigo-900/60 hover:border-rose-900 transition cursor-pointer"
              title="Reset Season & Pick New Team"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

