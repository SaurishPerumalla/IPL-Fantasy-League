import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { computeSeasonSummary, parseSeasonYears } from '../utils/seasonSummary';
import {
  Trophy,
  Award,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Flame,
  Calendar,
  Shield,
  X,
  TrendingUp,
  ArrowRightLeft,
  Crown,
  History
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const SeasonEndModal: React.FC = () => {
  const { state, startNewSeason, closeSeasonEndModal, openSeasonArchiveModal } = useGame();

  const isFinalCompleted = state.fixtures.some(f => f.playoffLabel === 'Final' && f.isCompleted);
  const isSeasonOver = isFinalCompleted || state.league_meta.playoffs_stage === 'Completed';

  const summary = computeSeasonSummary(state);
  const { nextYear, nextSeasonName: defaultNextName } = parseSeasonYears(state.league_meta.season);

  const [customSeasonName, setCustomSeasonName] = useState(defaultNextName);
  const [keepTeamName, setKeepTeamName] = useState(false);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (state.show_season_end_modal) {
      try {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 }
        });
      } catch (e) {}
    }
  }, [state.show_season_end_modal]);

  if (!state.show_season_end_modal || !summary) {
    return null;
  }

  const handleStartNextSeason = () => {
    setIsStarting(true);
    setTimeout(() => {
      startNewSeason({
        nextYear,
        seasonName: customSeasonName.trim() || `IPL ${nextYear}`,
        keepSameTeamName: keepTeamName
      });
      setIsStarting(false);
    }, 300);
  };

  const isChampion = summary.championTeamId === state.teams.find(t => t.is_human)?.id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#091436] border-2 border-amber-500/50 rounded-3xl shadow-2xl shadow-amber-500/20 text-white overflow-hidden my-6">
        {/* Close Button */}
        <button
          onClick={closeSeasonEndModal}
          className="absolute top-4 right-4 z-20 p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Golden Celebration Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10 space-y-2">
            <span className="inline-flex p-3 rounded-2xl bg-slate-950 text-amber-400 text-3xl shadow-xl">
              🏆
            </span>
            <div className="text-[11px] font-mono font-black tracking-widest uppercase text-slate-950">
              {summary.season} CHAMPIONSHIP CEREMONY
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-950">
              {summary.championTeamName} Crowned Champions!
            </h2>
            {summary.finalMargin && (
              <p className="text-xs sm:text-sm font-bold text-amber-950 max-w-lg mx-auto bg-amber-400/50 px-3 py-1 rounded-full border border-amber-500">
                Final Result: {summary.finalMargin}
              </p>
            )}
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* User Performance Badge */}
          <div className="bg-[#050c1e] border border-indigo-900/60 rounded-2xl p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center space-x-2 text-xs font-mono text-amber-400">
                  <Crown className="w-4 h-4" />
                  <span>YOUR FRANCHISE REPORT • {summary.userTeamName}</span>
                </div>
                <h3 className="text-xl font-black text-white mt-1">
                  Finished #{summary.userRank} in {summary.season}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isChampion
                    ? '🎉 Glory achieved! You took home the championship trophy!'
                    : `Solid campaign! You scored ${summary.userFantasyPoints.toLocaleString()} fantasy points over the season.`}
                </p>
              </div>

              <div className="flex items-center space-x-3 text-center">
                <div className="bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Points</div>
                  <div className="text-base font-black text-amber-400">{summary.userTotalPoints} pts</div>
                </div>
                <div className="bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Fantasy</div>
                  <div className="text-base font-black text-emerald-400">{summary.userFantasyPoints.toLocaleString()}</div>
                </div>
                <div className="bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Transfers</div>
                  <div className="text-base font-black text-cyan-400">{summary.transfersUsedTotal}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tournament Honors (Orange & Purple Caps, MVP) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Orange Cap */}
            <div className="bg-gradient-to-br from-orange-950/40 to-slate-900 border border-orange-500/30 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-orange-400 mb-1">
                  <span>ORANGE CAP</span>
                  <span>🧡</span>
                </div>
                <div className="text-sm font-black text-white">{summary.orangeCap.name}</div>
                <div className="text-[11px] text-slate-400">{summary.orangeCap.team}</div>
              </div>
              <div className="text-lg font-black text-orange-400 mt-2 font-mono">
                {summary.orangeCap.runs} runs
              </div>
            </div>

            {/* Purple Cap */}
            <div className="bg-gradient-to-br from-purple-950/40 to-slate-900 border border-purple-500/30 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-purple-400 mb-1">
                  <span>PURPLE CAP</span>
                  <span>💜</span>
                </div>
                <div className="text-sm font-black text-white">{summary.purpleCap.name}</div>
                <div className="text-[11px] text-slate-400">{summary.purpleCap.team}</div>
              </div>
              <div className="text-lg font-black text-purple-400 mt-2 font-mono">
                {summary.purpleCap.wickets} wickets
              </div>
            </div>

            {/* MVP */}
            <div className="bg-gradient-to-br from-yellow-950/40 to-slate-900 border border-yellow-500/30 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-yellow-400 mb-1">
                  <span>TOURNAMENT MVP</span>
                  <span>⭐</span>
                </div>
                <div className="text-sm font-black text-white">{summary.mvp?.name || 'Tournament MVP'}</div>
                <div className="text-[11px] text-slate-400">{summary.mvp?.team || ''}</div>
              </div>
              <div className="text-lg font-black text-yellow-400 mt-2 font-mono">
                {summary.mvp?.points || 0} pts
              </div>
            </div>
          </div>

          {/* Start New Year & New Team Section */}
          <div className="bg-gradient-to-r from-emerald-950/30 via-slate-900 to-indigo-950/30 border border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="inline-flex items-center space-x-1.5 bg-emerald-500/20 text-emerald-300 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>NEXT CAMPAIGN READY</span>
                </div>
                <h4 className="text-xl font-black text-white mt-1.5 flex items-center gap-2">
                  <span>Start a New Year &amp; Draft a New Team</span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
                  Ready to turn the calendar? Starting the new year archives {summary.season} permanently into your Franchise Trophy Cabinet, resets the 70 league matches fixture matrix, restores your 100 transfers, replenishes all 10 boosters, and lets you craft your brand-new dream playing 11!
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1 font-bold">
                  Next Year / Season Label:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={customSeasonName}
                    onChange={e => setCustomSeasonName(e.target.value)}
                    className="w-full bg-[#050c1e] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2 text-sm text-white font-mono outline-none"
                    placeholder={`e.g. IPL ${nextYear}`}
                  />
                  <button
                    type="button"
                    onClick={() => setCustomSeasonName(`IPL ${nextYear}`)}
                    className="shrink-0 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-2 rounded-xl transition cursor-pointer"
                    title="Reset to default"
                  >
                    Default
                  </button>
                </div>
              </div>

              <div className="flex items-end">
                <label className="flex items-center space-x-2 bg-[#050c1e] border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl cursor-pointer w-full text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={keepTeamName}
                    onChange={e => setKeepTeamName(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 focus:ring-0 bg-slate-900 border-slate-700"
                  />
                  <span>Keep existing franchise name (<strong>{summary.userTeamName}</strong>)</span>
                </label>
              </div>
            </div>

            {/* Launch Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={handleStartNextSeason}
                disabled={isStarting}
                className="w-full sm:w-auto flex-1 flex items-center justify-center space-x-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-6 py-3.5 rounded-xl text-sm transition shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isStarting ? 'Preparing Next Year...' : `Begin ${customSeasonName || `IPL ${nextYear}`} & Pick New 11`}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  closeSeasonEndModal();
                  openSeasonArchiveModal();
                }}
                className="w-full sm:w-auto flex items-center justify-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold px-4 py-3.5 rounded-xl text-xs transition border border-slate-800 cursor-pointer"
              >
                <History className="w-4 h-4 text-amber-400" />
                <span>View Trophy Cabinet</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
