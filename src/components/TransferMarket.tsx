import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ALL_PLAYERS, getPlayerById } from '../data/players';
import { Player, PlayerRole } from '../types/fantasy';
import {
  ArrowRightLeft,
  X,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Plane,
  Sparkles
} from 'lucide-react';

export const TransferMarket: React.FC = () => {
  const { state, humanTeam, transferPlayer, closeModals } = useGame();
  const isOpen = state.activeModal === 'transfer';

  const [selectedDropId, setSelectedDropId] = useState<string>('');
  const [selectedAddId, setSelectedAddId] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  if (!isOpen) return null;

  const dropPlayer = getPlayerById(selectedDropId);
  const addPlayer = getPlayerById(selectedAddId);

  const priceDiff = (addPlayer?.currentPrice || 0) - (dropPlayer?.currentPrice || 0);
  const projectedPurse = Math.round((humanTeam.budget_remaining - priceDiff) * 100) / 100;
  const isAffordable = projectedPurse >= 0;

  // Filter available players (not currently in human roster)
  const availableFreeAgents = ALL_PLAYERS.filter(p => {
    if (humanTeam.roster.includes(p.id)) return false;
    if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;
    if (searchQuery.trim() && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleExecuteTransfer = () => {
    if (!selectedDropId || !selectedAddId) {
      setFeedback({ message: 'Select both a player to drop and a replacement player to acquire.', type: 'error' });
      return;
    }

    const res = transferPlayer(selectedDropId, selectedAddId);
    if (!res.success) {
      setFeedback({ message: res.message, type: 'error' });
    } else {
      setFeedback({ message: res.message, type: 'success' });
      setSelectedDropId('');
      setSelectedAddId('');
      setTimeout(() => {
        closeModals();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/20 text-cyan-400 rounded-xl border border-cyan-500/30">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Transfer Market & Waiver Wire
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  Purse: ₹{humanTeam.budget_remaining.toFixed(2)} Cr
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Execute squad transfers within budget limits (`/transfer [Drop] for [Add]`)
              </p>
            </div>
          </div>

          <button
            onClick={closeModals}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transfer Workspace Preview */}
        <div className="bg-slate-950/90 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-col xs:flex-row items-center gap-2 sm:space-x-4 w-full sm:w-auto">
            {/* Outgoing Player */}
            <div className="w-full xs:flex-1 sm:w-56 p-2.5 sm:p-3 rounded-xl border border-rose-500/30 bg-rose-950/20">
              <div className="text-[10px] font-bold uppercase text-rose-400">OUTGOING (RELEASE)</div>
              {dropPlayer ? (
                <div className="mt-1">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span className="truncate max-w-[120px]">{dropPlayer.name}</span>
                    <span className="text-emerald-400 font-mono shrink-0">+₹{dropPlayer.currentPrice} Cr</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{dropPlayer.role} • Tier {dropPlayer.tier}</div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic mt-1">Select player to drop</div>
              )}
            </div>

            <div className="p-1.5 rounded-full bg-slate-800 text-slate-300 shrink-0 rotate-90 xs:rotate-0">
              <ArrowRightLeft className="w-3.5 h-3.5" />
            </div>

            {/* Incoming Player */}
            <div className="w-full xs:flex-1 sm:w-56 p-2.5 sm:p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20">
              <div className="text-[10px] font-bold uppercase text-emerald-400">INCOMING (SIGN)</div>
              {addPlayer ? (
                <div className="mt-1">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span className="truncate max-w-[120px]">{addPlayer.name}</span>
                    <span className="text-rose-400 font-mono shrink-0">-₹{addPlayer.currentPrice} Cr</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{addPlayer.role} • Tier {addPlayer.tier}</div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic mt-1">Select player to sign</div>
              )}
            </div>
          </div>

          {/* Balance & Action */}
          <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
            <div className="text-left sm:text-right font-mono text-xs">
              <div className="text-slate-400 text-[10px]">Projected Purse:</div>
              <div className={`font-black text-sm ${isAffordable ? 'text-amber-400' : 'text-rose-400'}`}>
                ₹{projectedPurse.toFixed(2)} Cr
              </div>
            </div>

            <button
              onClick={handleExecuteTransfer}
              disabled={!dropPlayer || !addPlayer || !isAffordable}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 font-bold px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs transition shadow-md cursor-pointer shrink-0"
            >
              Confirm Transfer
            </button>
          </div>
        </div>

        {/* Feedback alert */}
        {feedback && (
          <div className={`px-6 py-2 text-xs flex items-center gap-2 ${
            feedback.type === 'success' ? 'bg-emerald-950/60 text-emerald-300' : 'bg-rose-950/60 text-rose-300'
          }`}>
            {feedback.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Two-Pane Selector */}
        <div className="p-3 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 overflow-y-auto max-w-full">
          {/* Pane 1: Human Squad (Drop candidate) */}
          <div className="space-y-3 min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center justify-between">
              <span>Your Current Squad ({humanTeam.roster.length} Players)</span>
              <span className="text-[10px] sm:text-xs text-slate-400 font-normal">Tap to drop</span>
            </h4>

            <div className="space-y-2 max-h-[40vh] md:max-h-[50vh] overflow-y-auto pr-1">
              {humanTeam.roster.map(pId => {
                const p = getPlayerById(pId);
                if (!p) return null;
                const isSelected = selectedDropId === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedDropId(p.id)}
                    className={`p-2.5 sm:p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-rose-950/30 border-rose-500 text-white ring-1 ring-rose-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                        style={{ backgroundColor: p.avatarColor || '#3b82f6' }}
                      >
                        {p.shortName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold flex items-center gap-1 truncate">
                          <span className="truncate">{p.name}</span>
                          {p.nationality === 'OVERSEAS' && <span className="text-[10px] shrink-0">✈️</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {p.role} • Tier {p.tier} • Rating {Math.max(p.battingRating, p.bowlingRating)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <div className="text-xs font-bold text-amber-400">₹{p.currentPrice} Cr</div>
                      <div className="text-[9px] text-slate-400">Value</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pane 2: Free Agent Market Pool (Add candidate) */}
          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate">Target Replacement Pool</h4>
              <span className="text-[10px] sm:text-xs text-slate-400 font-normal shrink-0">{availableFreeAgents.length} Available</span>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 min-w-0">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search player name..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <select
                value={roleFilter}
                onChange={e => setRoleFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-300 focus:outline-none shrink-0"
              >
                <option value="ALL">All Roles</option>
                <option value="BAT">Batters</option>
                <option value="WK">WKs</option>
                <option value="AR">All-Rounders</option>
                <option value="BOWL">Bowlers</option>
              </select>
            </div>

            <div className="space-y-2 max-h-[40vh] md:max-h-[44vh] overflow-y-auto pr-1">
              {availableFreeAgents.map(p => {
                const isSelected = selectedAddId === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedAddId(p.id)}
                    className={`p-2.5 sm:p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500 text-white ring-1 ring-emerald-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                        style={{ backgroundColor: p.avatarColor || '#3b82f6' }}
                      >
                        {p.shortName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold flex items-center gap-1 truncate">
                          <span className="truncate">{p.name}</span>
                          {p.nationality === 'OVERSEAS' && <span className="text-[10px] shrink-0">✈️</span>}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {p.role} • Tier {p.tier} • Bat: {p.battingRating} | Bowl: {p.bowlingRating}
                        </div>
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <div className="text-xs font-bold text-emerald-400">₹{p.currentPrice} Cr</div>
                      <div className="text-[9px] text-slate-400">Base: ₹{p.basePrice} Cr</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
