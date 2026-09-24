import React from 'react';
import { useGame } from '../context/GameContext';
import {
  Trophy,
  Calendar,
  X,
  Crown,
  Award,
  TrendingUp,
  ArrowRightLeft,
  Sparkles,
  History,
  Shield
} from 'lucide-react';

export const SeasonArchiveModal: React.FC = () => {
  const { state, closeModals, openNewSeasonModal, openSeasonEndModal } = useGame();

  const isModalOpen = state.activeModal === 'season_archive';
  if (!isModalOpen) return null;

  const history = state.season_history || [];
  const isFinalCompleted = state.fixtures.some(f => f.playoffLabel === 'Final' && f.isCompleted);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#091436] border border-indigo-900/60 rounded-3xl shadow-2xl text-white overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-indigo-900/50 bg-[#050c1e]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white">Trophy Cabinet &amp; Season Archive</h3>
              <p className="text-xs text-slate-400">
                Historical record of all concluded IPL campaigns &amp; your managerial legacy
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

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center py-12 px-4 bg-[#050c1e] rounded-2xl border border-indigo-950/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
                <Trophy className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-white">No Concluded Seasons Yet</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Once you complete the 70 league matches and the Grand Final, your championship recap, Orange Cap, Purple Cap, and personal manager rank will be permanently enshrined here.
              </p>
              <div className="pt-2">
                <span className="text-xs font-mono text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  Currently playing: {state.league_meta.season} (Matchday {state.league_meta.current_matchday})
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map(item => (
                <div
                  key={item.id}
                  className="bg-[#050c1e] border border-indigo-900/60 hover:border-amber-500/40 rounded-2xl p-5 shadow-lg space-y-4 transition"
                >
                  {/* Top Bar: Season Name + Completed Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-indigo-950 gap-2">
                    <div className="flex items-center space-x-2.5">
                      <span className="text-2xl">{item.championEmoji || '🏆'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-black text-white">{item.season}</span>
                          <span className="bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                            Archived
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Completed on {item.completedAt}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-mono font-black text-amber-400">
                        Champion: {item.championTeamName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Runner-Up: {item.runnerUpTeamName}
                      </div>
                    </div>
                  </div>

                  {/* Final Margin if exists */}
                  {item.finalMargin && (
                    <div className="text-xs text-amber-300/90 font-mono bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                      Final Scoreline: {item.finalMargin}
                    </div>
                  )}

                  {/* Manager Performance */}
                  <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-slate-300 flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>Franchise: {item.userTeamName}</span>
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">
                        Final Rank: #{item.userRank}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-[#050c1e] p-2 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">League Pts</div>
                        <div className="text-xs font-black text-amber-400">{item.userTotalPoints}</div>
                      </div>
                      <div className="bg-[#050c1e] p-2 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Fantasy Pts</div>
                        <div className="text-xs font-black text-emerald-400">{item.userFantasyPoints.toLocaleString()}</div>
                      </div>
                      <div className="bg-[#050c1e] p-2 rounded-lg border border-slate-800">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">Transfers</div>
                        <div className="text-xs font-black text-cyan-400">{item.transfersUsedTotal}</div>
                      </div>
                    </div>
                  </div>

                  {/* Caps Breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="bg-orange-950/20 border border-orange-500/20 rounded-xl p-2.5 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>🧡</span>
                        <div>
                          <div className="font-bold text-white">{item.orangeCap.name}</div>
                          <div className="text-[10px] text-slate-400">{item.orangeCap.team}</div>
                        </div>
                      </div>
                      <span className="font-mono font-black text-orange-400">{item.orangeCap.runs} runs</span>
                    </div>

                    <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-2.5 flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span>💜</span>
                        <div>
                          <div className="font-bold text-white">{item.purpleCap.name}</div>
                          <div className="text-[10px] text-slate-400">{item.purpleCap.team}</div>
                        </div>
                      </div>
                      <span className="font-mono font-black text-purple-400">{item.purpleCap.wickets} wickets</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-indigo-950">
            <div className="text-xs text-slate-400 font-mono">
              Total Recorded Campaigns: <strong className="text-white">{history.length}</strong>
            </div>

            <button
              type="button"
              onClick={() => {
                closeModals();
                openNewSeasonModal();
              }}
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start New Year &amp; New Team</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
