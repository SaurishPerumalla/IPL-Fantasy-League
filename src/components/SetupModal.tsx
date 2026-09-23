import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { IPL_FRANCHISES_PRESET } from '../data/iplTeams';
import { Flame, Trophy, Users, Gavel, Sparkles, CheckCircle2, Shield } from 'lucide-react';

export const SetupModal: React.FC = () => {
  const { state, initTournament, closeModals } = useGame();
  const isOpen = state.activeModal === 'setup';

  const [franchiseName, setFranchiseName] = useState('User XI');
  const [leagueSize, setLeagueSize] = useState<number>(8);
  const [format, setFormat] = useState<'auction' | 'snake' | 'baseline'>('baseline');
  const [selectedFranchiseId, setSelectedFranchiseId] = useState<string>('RCB');

  if (!isOpen) return null;

  const handleStartTournament = () => {
    initTournament({
      franchiseName: franchiseName.trim() || 'User XI',
      leagueSize,
      format,
      chosenBaseFranchiseId: selectedFranchiseId
    });
  };

  const selectedPreset = IPL_FRANCHISES_PRESET.find(p => p.id === selectedFranchiseId) || IPL_FRANCHISES_PRESET[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Banner */}
        <div className="relative px-6 py-6 bg-gradient-to-r from-amber-600 via-orange-600 to-red-700 text-white overflow-hidden">
          <div className="absolute -right-10 -bottom-10 opacity-15">
            <Trophy className="w-56 h-56" />
          </div>
          <div className="relative z-10 flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-slate-950/30 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg">
              <Flame className="w-7 h-7 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                FLAME <span className="text-amber-200 text-base font-semibold">| IPL 2026 Engine</span>
              </h2>
              <p className="text-xs text-amber-100 font-medium mt-0.5">
                Fantasy League Architect & Simulation Master Control
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Step 1: Franchise Identity */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Shield className="w-4 h-4" /> 1. Name Your Fantasy Franchise
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  value={franchiseName}
                  onChange={e => setFranchiseName(e.target.value)}
                  placeholder="e.g. Bangalore Strikers, User XI"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-medium transition"
                  maxLength={28}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This franchise will compete against AI squads for the IPL 2026 Championship.
                </p>
              </div>

              {/* Franchise Template & Colors */}
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Adopt Base Franchise Identity:</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {IPL_FRANCHISES_PRESET.slice(0, 10).map(preset => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedFranchiseId(preset.id)}
                      className={`p-2 rounded-lg border text-center transition cursor-pointer flex flex-col items-center gap-0.5 ${
                        selectedFranchiseId === preset.id
                          ? 'border-amber-400 bg-amber-500/20 text-white ring-1 ring-amber-400'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-sm">{preset.logoEmoji}</span>
                      <span className="text-[10px] font-bold font-mono">{preset.shortCode}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: League Size */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Users className="w-4 h-4" /> 2. Select League Size
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { size: 4, title: '4 Teams', desc: 'Fast Blitz Tournament' },
                { size: 8, title: '8 Teams', desc: 'Classic IPL Format (14 Days)' },
                { size: 10, title: '10 Teams', desc: 'Full Mega League' }
              ].map(opt => (
                <button
                  key={opt.size}
                  type="button"
                  onClick={() => setLeagueSize(opt.size)}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                    leagueSize === opt.size
                      ? 'border-amber-500 bg-amber-500/10 text-white'
                      : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{opt.title}</span>
                    {leagueSize === opt.size && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 3: Draft Format */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Gavel className="w-4 h-4" /> 3. Choose Roster Acquisition Format
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option A: Baseline Rosters */}
              <button
                type="button"
                onClick={() => setFormat('baseline')}
                className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  format === 'baseline'
                    ? 'border-amber-500 bg-amber-500/10 text-white shadow-lg shadow-amber-500/5'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" /> 2026 Baseline
                    </span>
                    {format === 'baseline' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Instant start with official 2026 team rosters (Kohli, Rohit, Bumrah, Klaasen, Russell).
                  </p>
                </div>
                <div className="mt-3 text-[10px] text-emerald-400 font-medium">Recommended for instant play</div>
              </button>

              {/* Option B: Mini-Auction */}
              <button
                type="button"
                onClick={() => setFormat('auction')}
                className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  format === 'auction'
                    ? 'border-amber-500 bg-amber-500/10 text-white shadow-lg shadow-amber-500/5'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-white flex items-center gap-1.5">
                      <Gavel className="w-4 h-4 text-amber-400" /> Mini-Auction
                    </span>
                    {format === 'auction' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    ₹100 Cr purse. Bid against AI franchises with gavel countdowns and bidding wars.
                  </p>
                </div>
                <div className="mt-3 text-[10px] text-amber-400 font-medium">Interactive live auction</div>
              </button>

              {/* Option C: Snake Draft */}
              <button
                type="button"
                onClick={() => setFormat('snake')}
                className={`p-4 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                  format === 'snake'
                    ? 'border-amber-500 bg-amber-500/10 text-white shadow-lg shadow-amber-500/5'
                    : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-white flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-amber-400" /> Snake Draft
                    </span>
                    {format === 'snake' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Turn-based snake draft from Tier 1, 2, and 3 pool with reversing pick orders.
                  </p>
                </div>
                <div className="mt-3 text-[10px] text-cyan-400 font-medium">Equal opportunity draft</div>
              </button>
            </div>
          </div>

          {/* Rules Summary Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-slate-400 space-y-1.5 font-mono">
            <div className="text-amber-300 font-bold flex items-center gap-1.5">
              <span>📋 Official Tournament Rules (FLAME v1):</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div>• Squad: 15–18 players | Playing XI: exactly 11</div>
              <div>• XI Roles: Min 3 BAT, 1 WK, 1 AR, 3 BOWL</div>
              <div>• Max 4 Overseas players in Playing XI</div>
              <div>• Captain 2.0x | Vice-Captain 1.5x Fantasy Multiplier</div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Home Venue: <strong className="text-white">{selectedPreset.homeVenue}</strong>
          </div>

          <button
            type="button"
            onClick={handleStartTournament}
            className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
          >
            <span>Launch IPL 2026 Season</span>
            <Flame className="w-4 h-4 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
