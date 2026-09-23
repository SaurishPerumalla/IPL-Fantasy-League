import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { OFFICIAL_BOOSTERS, getBoosterById } from '../data/boosters';
import { BoosterId } from '../types/fantasy';

export const BoosterHubModal: React.FC = () => {
  const {
    state,
    boostersState,
    activateBooster,
    deactivateBooster,
    getBoosterAdviceWithAI,
    closeModals
  } = useGame();

  const [selectedBoosterId, setSelectedBoosterId] = useState<BoosterId | null>(
    boostersState.activeBoosterForNextMatch || 'triple_captain'
  );
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const activeBoosterDef = boostersState.activeBoosterForNextMatch
    ? getBoosterById(boostersState.activeBoosterForNextMatch)
    : null;

  const handleActivate = (id: BoosterId) => {
    const res = activateBooster(id);
    setToastMsg(res.message);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleDeactivate = () => {
    deactivateBooster();
    setToastMsg('Active booster removed. You can pick another one before the match begins.');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleGetAiAdvice = async () => {
    setLoadingAi(true);
    setAiAdvice(null);
    try {
      const res = await getBoosterAdviceWithAI();
      if (res.success && res.advice) {
        setAiAdvice(res.advice);
      } else {
        setAiAdvice(res.error || 'Could not retrieve AI tactical booster advice at this time.');
      }
    } catch {
      setAiAdvice('Network error while requesting AI advice.');
    } finally {
      setLoadingAi(false);
    }
  };

  const selectedBooster = selectedBoosterId ? getBoosterById(selectedBoosterId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0f172a] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#1e1b4b] via-[#0f172a] to-[#1e1b4b] border-b border-amber-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow-lg shadow-amber-500/20">
              ⚡
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black tracking-tight text-white uppercase">
                  TATA IPL Official Boosters
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  10 Powerups
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Unlock official fantasy multipliers & squad tools for Matchday {state.league_meta.current_matchday}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleGetAiAdvice}
              disabled={loadingAi}
              className="flex items-center space-x-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition disabled:opacity-50"
            >
              <span>{loadingAi ? '🤖 Analyzing...' : '✨ Ask AI Booster Scout'}</span>
            </button>
            <button
              onClick={closeModals}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Toast / Notification Banner */}
        {toastMsg && (
          <div className="bg-amber-500/10 border-b border-amber-500/30 px-6 py-2.5 text-xs text-amber-300 flex items-center justify-between animate-fadeIn">
            <span>{toastMsg}</span>
            <button onClick={() => setToastMsg(null)} className="text-amber-400 hover:text-white font-bold ml-4">
              ✕
            </button>
          </div>
        )}

        {/* Active Booster Banner */}
        {activeBoosterDef ? (
          <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-indigo-950/60 border-b border-emerald-500/30 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{activeBoosterDef.icon}</span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs uppercase font-extrabold text-emerald-400 tracking-wider">
                    LOCKED FOR MATCHDAY {state.league_meta.current_matchday}
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {activeBoosterDef.multiplierText}
                  </span>
                </div>
                <div className="text-sm font-bold text-white">
                  {activeBoosterDef.name}: <span className="font-normal text-slate-300 text-xs">{activeBoosterDef.description}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleDeactivate}
              className="px-3 py-1.5 text-xs font-semibold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/40 rounded-lg transition"
            >
              Cancel / Switch Booster
            </button>
          </div>
        ) : (
          <div className="bg-slate-900/60 border-b border-slate-800 px-6 py-2.5 flex items-center justify-between text-xs text-slate-400">
            <span>⚡ No booster currently active for Matchday {state.league_meta.current_matchday}. Select one below to activate!</span>
            <span className="text-slate-500 font-mono">1 booster per matchday limit</span>
          </div>
        )}

        {/* AI Advisor Panel (collapsible/visible when requested) */}
        {aiAdvice && (
          <div className="bg-gradient-to-r from-indigo-950/90 to-purple-950/90 border-b border-indigo-500/30 p-4 sm:p-5 relative animate-fadeIn">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 text-indigo-300 font-bold text-xs uppercase tracking-wider mb-2">
                <span>🤖</span>
                <span>Gemini Fantasy Booster Strategy Recommendation</span>
              </div>
              <button onClick={() => setAiAdvice(null)} className="text-xs text-slate-400 hover:text-white">
                ✕ Close
              </button>
            </div>
            <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line bg-slate-950/40 p-3 rounded-lg border border-indigo-500/20 max-h-48 overflow-y-auto">
              {aiAdvice}
            </div>
          </div>
        )}

        {/* Main Content Area: Booster Grid & Details Sidebar */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Booster Cards List (2 cols on desktop) */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Select a Booster ({OFFICIAL_BOOSTERS.length} Available)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {OFFICIAL_BOOSTERS.map(b => {
                const usesLeft = boostersState.remainingUses[b.id] ?? 0;
                const isCurrentActive = boostersState.activeBoosterForNextMatch === b.id;
                const isSelected = selectedBoosterId === b.id;

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBoosterId(b.id)}
                    className={`relative p-3.5 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col justify-between ${
                      isCurrentActive
                        ? 'bg-emerald-950/40 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500'
                        : isSelected
                        ? 'bg-slate-800/90 border-amber-500/80 ring-1 ring-amber-500/40'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    {/* Top Row: Icon, Name, Uses Badge */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2.5">
                        <span className="text-2xl">{b.icon}</span>
                        <div>
                          <h4 className="text-sm font-bold text-white leading-snug">{b.name}</h4>
                          <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                            {b.multiplierText}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            usesLeft > 0
                              ? 'bg-slate-800 text-slate-300 border border-slate-700'
                              : 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                          }`}
                        >
                          {usesLeft} / {b.maxUses} left
                        </span>
                      </div>
                    </div>

                    {/* Middle: Short Description */}
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {b.description}
                    </p>

                    {/* Bottom Status / Indicator */}
                    <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 capitalize">{b.category}</span>
                      {isCurrentActive ? (
                        <span className="text-emerald-400 font-bold flex items-center space-x-1">
                          <span>✓ Active</span>
                        </span>
                      ) : usesLeft === 0 ? (
                        <span className="text-rose-400 font-semibold">Exhausted</span>
                      ) : (
                        <span className="text-amber-400 font-semibold group-hover:text-amber-300">
                          {isSelected ? 'Selected' : 'View →'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar: Selected Booster Details & Action */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Powerup Tactical Brief
            </h3>

            {selectedBooster ? (
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between h-full">
                <div>
                  <div className="flex items-center space-x-3 mb-4">
                    <span className="text-4xl p-2.5 rounded-xl bg-slate-800 border border-slate-700">
                      {selectedBooster.icon}
                    </span>
                    <div>
                      <h4 className="text-base font-extrabold text-white">{selectedBooster.name}</h4>
                      <p className="text-xs text-amber-400 font-semibold">{selectedBooster.multiplierText}</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs text-slate-300">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Effect</span>
                      <p className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80 leading-relaxed text-slate-200">
                        {selectedBooster.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-center pt-1">
                      <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Season Allowance</span>
                        <span className="text-sm font-bold text-white">{selectedBooster.maxUses} Total</span>
                      </div>
                      <div className="bg-slate-950/50 p-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] text-slate-500 block">Remaining</span>
                        <span
                          className={`text-sm font-bold ${
                            (boostersState.remainingUses[selectedBooster.id] ?? 0) > 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {boostersState.remainingUses[selectedBooster.id] ?? 0} uses
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                        Tactical Strategy
                      </span>
                      <p className="text-slate-400 leading-relaxed text-[11px]">
                        {selectedBooster.id === 'triple_captain' &&
                          'Deploy when your captain has a high-scoring matchup (e.g. explosive batter on a flat track or strike bowler against fragile top order).'}
                        {selectedBooster.id === 'double_power' &&
                          'Best saved for a double matchday or when your entire XI has favorable head-to-head fixtures.'}
                        {selectedBooster.id === 'indian_warrior' &&
                          'Maximize when your squad features 7 elite Indian performers (e.g. Kohli, Bumrah, Gill, Pant).'}
                        {selectedBooster.id === 'foreign_stars' &&
                          'Ideal when overseas powerhitters like Klaasen, Pooran, Head, or Russell are in peak form.'}
                        {selectedBooster.id === 'power_striker' &&
                          'Play on high-scoring venues like Chinnaswamy or Wankhede with small boundaries.'}
                        {selectedBooster.id === 'strike_force' &&
                          'Deploy on dry turning surfaces (Chepauk, Ekana) or green pitches where wickets tumble.'}
                        {selectedBooster.id === 'allround_marvel' &&
                          'Unlocks immense returns if your team fields premier all-rounders (Hardik, Russell, Axar, Jadeja).'}
                        {selectedBooster.id === 'super_sub' &&
                          'Select when your tactical impact player is scheduled to bowl a full 4 overs or bat high.'}
                        {selectedBooster.id === 'free_hit' &&
                          'Make unlimited transfers for this matchday only. Great for navigating blank matchdays or heavy rotation.'}
                        {selectedBooster.id === 'wild_card' &&
                          'Completely restructure your team with zero transfer deduction. Best used mid-season after player roles solidify.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Activation Button */}
                <div className="pt-5 mt-4 border-t border-slate-800">
                  {boostersState.activeBoosterForNextMatch === selectedBooster.id ? (
                    <div className="space-y-2">
                      <div className="text-center text-xs font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 py-2 rounded-lg">
                        ✓ Activated for Matchday {state.league_meta.current_matchday}
                      </div>
                      <button
                        onClick={handleDeactivate}
                        className="w-full py-2 text-xs font-semibold text-rose-300 hover:text-white bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/30 rounded-lg transition"
                      >
                        Remove Booster
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleActivate(selectedBooster.id)}
                      disabled={(boostersState.remainingUses[selectedBooster.id] ?? 0) <= 0}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed shadow-lg shadow-amber-500/20 transition"
                    >
                      {(boostersState.remainingUses[selectedBooster.id] ?? 0) > 0
                        ? `Activate "${selectedBooster.name}"`
                        : 'No Uses Remaining'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                Select a booster from the left to view tactical insights and activate it.
              </div>
            )}
          </div>
        </div>

        {/* Footer: Booster Usage History */}
        {boostersState.history.length > 0 && (
          <div className="bg-slate-950/80 border-t border-slate-800 px-6 py-2.5 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-300">Season Booster History:</span>
              <div className="flex items-center space-x-2 overflow-x-auto max-w-xl">
                {boostersState.history.map(h => (
                  <span
                    key={h.id}
                    className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 whitespace-nowrap"
                  >
                    MD{h.matchday}: {h.boosterName}
                  </span>
                ))}
              </div>
            </div>
            <span className="text-slate-500">Official TATA IPL Rules</span>
          </div>
        )}
      </div>
    </div>
  );
};
