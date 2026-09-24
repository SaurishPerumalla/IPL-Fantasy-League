import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { parseSeasonYears } from '../utils/seasonSummary';
import {
  Trophy,
  Sparkles,
  ArrowRight,
  RotateCcw,
  X,
  Calendar,
  CheckCircle2,
  Shield,
  HelpCircle
} from 'lucide-react';

export const NewSeasonModal: React.FC = () => {
  const { state, startNewSeason, resetTournament, closeModals } = useGame();

  const isModalOpen = state.activeModal === 'new_season';
  const { nextYear, nextSeasonName: defaultNextName } = parseSeasonYears(state.league_meta.season);

  const [seasonName, setSeasonName] = useState(defaultNextName);
  const [keepTeamName, setKeepTeamName] = useState(false);
  const [archiveStats, setArchiveStats] = useState(true);
  const [actionType, setActionType] = useState<'next_year' | 'restart_current'>('next_year');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isModalOpen) return null;

  const handleConfirm = () => {
    setIsProcessing(true);
    setTimeout(() => {
      if (actionType === 'next_year') {
        startNewSeason({
          nextYear,
          seasonName: seasonName.trim() || `IPL ${nextYear}`,
          keepSameTeamName: keepTeamName
        });
      } else {
        // Complete reset of current season
        resetTournament();
      }
      setIsProcessing(false);
      closeModals();
    }, 300);
  };

  const human = state.teams.find(t => t.is_human);
  const isFinalCompleted = state.fixtures.some(f => f.playoffLabel === 'Final' && f.isCompleted);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#091436] border border-indigo-900/60 rounded-3xl shadow-2xl text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-indigo-900/50 bg-[#050c1e]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Start New Season &amp; New Team</h3>
              <p className="text-xs text-slate-400">
                Current active campaign: <strong className="text-amber-400">{state.league_meta.season}</strong> ({state.league_meta.current_matchday}/{state.league_meta.total_matchdays} rounds)
              </p>
            </div>
          </div>

          <button
            onClick={closeModals}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Action Choice */}
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setActionType('next_year')}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                actionType === 'next_year'
                  ? 'bg-emerald-950/30 border-emerald-500/60 text-white shadow-md shadow-emerald-500/10'
                  : 'bg-[#050c1e] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-emerald-400 uppercase">Recommended</span>
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-sm font-black text-white">Advance to Next Year</div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Archives current season &amp; advances calendar to {defaultNextName}.
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setActionType('restart_current')}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
                actionType === 'restart_current'
                  ? 'bg-rose-950/30 border-rose-500/60 text-white shadow-md shadow-rose-500/10'
                  : 'bg-[#050c1e] border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-mono font-bold text-rose-400 uppercase">Restart</span>
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-sm font-black text-white">Restart Current Year</div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Wipes and restarts {state.league_meta.season} from Round 1.
                </div>
              </div>
            </button>
          </div>

          {actionType === 'next_year' && (
            <div className="space-y-4 pt-1">
              {/* Year Name Input */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1 font-bold">
                  Next Season Title:
                </label>
                <input
                  type="text"
                  value={seasonName}
                  onChange={e => setSeasonName(e.target.value)}
                  className="w-full bg-[#050c1e] border border-slate-700 focus:border-amber-400 rounded-xl px-3.5 py-2 text-sm text-white font-mono outline-none"
                  placeholder={`e.g. IPL ${nextYear}`}
                />
              </div>

              {/* Checkboxes */}
              <div className="space-y-2">
                <label className="flex items-center space-x-2.5 bg-[#050c1e] p-3 rounded-xl border border-slate-800 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={keepTeamName}
                    onChange={e => setKeepTeamName(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-0"
                  />
                  <span>
                    Keep existing team name (<strong>{human?.name || 'User XI'}</strong>) for the new year
                  </span>
                </label>

                <label className="flex items-center space-x-2.5 bg-[#050c1e] p-3 rounded-xl border border-slate-800 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={archiveStats}
                    onChange={e => setArchiveStats(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700 focus:ring-0"
                  />
                  <span>
                    Save {state.league_meta.season} recap &amp; awards to Trophy Cabinet
                  </span>
                </label>
              </div>

              {/* Feature Highlights */}
              <div className="bg-indigo-950/40 border border-indigo-900/50 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-300">
                <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>What happens when you begin the new year:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px] pl-1 font-mono">
                  <li>Full 70-match league schedule generated for all 10 franchises</li>
                  <li>100 fresh transfers credited for the regular season</li>
                  <li>All 10 official TATA IPL boosters replenished to full quota</li>
                  <li>Launches official Team Creator to draft your new 11 players &amp; captain</li>
                </ul>
              </div>
            </div>
          )}

          {actionType === 'restart_current' && (
            <div className="bg-rose-950/20 border border-rose-900/40 rounded-xl p-4 text-xs text-rose-200">
              ⚠️ Restarting will clear all match results and scores for {state.league_meta.season}. You will be able to pick a new team name and 11 players for Matchday 1.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={closeModals}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing}
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isProcessing
                  ? 'Initializing...'
                  : actionType === 'next_year'
                  ? `Start ${seasonName || `IPL ${nextYear}`} & Pick 11`
                  : 'Confirm Reset'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
