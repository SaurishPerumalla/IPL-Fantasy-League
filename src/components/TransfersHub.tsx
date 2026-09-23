import React from 'react';
import { useGame } from '../context/GameContext';
import { getPlayerById } from '../data/players';
import {
  ArrowRightLeft,
  Sparkles,
  Trophy,
  History,
  CheckCircle2,
  Calendar,
  AlertCircle,
  HelpCircle,
  Clock,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface TransfersHubProps {
  onOpenSchedule?: () => void;
}

export const TransfersHub: React.FC<TransfersHubProps> = ({ onOpenSchedule }) => {
  const { state, humanTeam, openTransferModal } = useGame();
  const transfers = state.transfers_state;

  const isUnlimited = transfers?.is_unlimited_window ?? false;
  const isPlayoffs = transfers?.playoffs_started ?? false;

  const leagueRemaining = transfers?.league_transfers_remaining ?? 100;
  const leagueTotal = transfers?.league_transfers_total ?? 100;
  const playoffsRemaining = transfers?.playoffs_transfers_remaining ?? 10;
  const playoffsTotal = transfers?.playoffs_transfers_total ?? 10;

  const currentMatchday = state.league_meta.current_matchday;
  const totalMatchdays = state.league_meta.total_matchdays;

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <div className="bg-gradient-to-r from-[#091436] via-[#0c1c4d] to-[#091436] border border-indigo-900/60 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="bg-amber-500/20 text-amber-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wider">
                Official Dream11 Transfer Policy
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Matchday {currentMatchday} of {totalMatchdays} (70 Matches)
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              IPL Fantasy Transfers &amp; Booster Center
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Plan your strategy across the season. You have <strong>100 transfers</strong> for the 70 league matches.
              Once your team enters the playoffs, unlock <strong>unlimited transfers</strong> before the playoff stage begins,
              and receive <strong>10 exclusive transfers</strong> for the knockout rounds.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {onOpenSchedule && (
              <button
                onClick={onOpenSchedule}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/20 cursor-pointer transition active:scale-95"
              >
                <Calendar className="w-4 h-4 text-violet-200" />
                <span>Season Schedule Matrix</span>
              </button>
            )}

            <button
              onClick={openTransferModal}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/10 cursor-pointer transition active:scale-95"
            >
              <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Make a Transfer</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3 Phases Visual Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Phase 1: League Stage */}
        <div className={`p-5 rounded-2xl border transition ${
          !isPlayoffs && !isUnlimited
            ? 'bg-[#0a1844] border-amber-500/50 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/30'
            : 'bg-[#07112d] border-indigo-950/70 opacity-80'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Phase 1: League Matches
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              !isPlayoffs && !isUnlimited ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {!isPlayoffs && !isUnlimited ? 'Active Now' : 'Complete'}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black font-mono text-white">
                {leagueRemaining}
              </span>
              <span className="text-xs font-mono text-slate-400">
                / {leagueTotal} Transfers Left
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, (leagueRemaining / leagueTotal) * 100))}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
              Covers all 70 league matches. Transfers refresh only on confirmed player swaps. Captain &amp; Vice-Captain changes are always <strong>free</strong>.
            </p>
          </div>
        </div>

        {/* Phase 2: Unlimited Free Window */}
        <div className={`p-5 rounded-2xl border transition ${
          isUnlimited
            ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30'
            : 'bg-[#07112d] border-indigo-950/70'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> Phase 2: Playoffs Window
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isUnlimited ? 'bg-emerald-400 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {isUnlimited ? 'Unlocked' : 'After Match 70'}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black font-mono text-emerald-300">
                Unlimited
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                0 Cost Swaps
              </span>
            </div>

            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isUnlimited ? 'bg-emerald-400 w-full animate-pulse' : 'bg-slate-700 w-0'
                }`}
              />
            </div>

            <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
              When the tournament enters the playoffs stage, rebuild your entire XI freely to retain only players from the 4 qualifying teams.
            </p>
          </div>
        </div>

        {/* Phase 3: Knockout Rounds */}
        <div className={`p-5 rounded-2xl border transition ${
          isPlayoffs
            ? 'bg-cyan-950/30 border-cyan-500/50 shadow-lg ring-1 ring-cyan-500/30'
            : 'bg-[#07112d] border-indigo-950/70'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Trophy className="w-4 h-4" /> Phase 3: Playoffs Stage
            </span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isPlayoffs ? 'bg-cyan-400 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}>
              {isPlayoffs ? 'Knockouts Active' : 'Finals Stage'}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black font-mono text-white">
                {playoffsRemaining}
              </span>
              <span className="text-xs font-mono text-slate-400">
                / {playoffsTotal} Transfers Left
              </span>
            </div>

            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, (playoffsRemaining / playoffsTotal) * 100))}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 pt-1 leading-relaxed">
              Used across Qualifier 1, Eliminator, Qualifier 2, and the Grand Final. Use them strategically as teams get eliminated.
            </p>
          </div>
        </div>
      </div>

      {/* Transfer History Table */}
      <div className="bg-[#091436] rounded-2xl border border-indigo-900/50 overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-[#0b1842] border-b border-indigo-900/60 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-black uppercase tracking-wider text-white">
              Official Transfer Logs ({transfers?.history.length || 0})
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {transfers?.history.length === 0 ? 'No transfers made yet' : 'Logged transactions'}
          </span>
        </div>

        {(!transfers?.history || transfers.history.length === 0) ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ArrowRightLeft className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium text-slate-300">You haven't made any transfers yet.</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your initial 11 players are locked. When you want to swap a player for an upcoming match, click "Make a Transfer" above!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-[#050c1e] text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                <tr>
                  <th className="px-6 py-3">Matchday</th>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Player In</th>
                  <th className="px-6 py-3">Player Out</th>
                  <th className="px-6 py-3">Stage</th>
                  <th className="px-6 py-3 text-right">Transfers Remaining</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-950/80 font-mono">
                {transfers.history.map(record => {
                  const playerIn = getPlayerById(record.playersIn[0]);
                  const playerOut = getPlayerById(record.playersOut[0]);

                  return (
                    <tr key={record.id} className="hover:bg-indigo-950/40 transition">
                      <td className="px-6 py-3 text-slate-300 font-bold">
                        MD {record.matchday}
                      </td>
                      <td className="px-6 py-3 text-slate-400 text-[11px]">
                        {record.timestamp}
                      </td>
                      <td className="px-6 py-3 text-emerald-400 font-bold flex items-center gap-1.5">
                        <span className="text-xs">+</span>
                        <span>{playerIn ? playerIn.name : record.playersIn[0]}</span>
                        <span className="text-[10px] font-normal text-slate-400 font-mono">
                          (₹{playerIn?.currentPrice} Cr)
                        </span>
                      </td>
                      <td className="px-6 py-3 text-rose-400 font-bold">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-xs">-</span>
                          <span>{playerOut ? playerOut.name : record.playersOut[0]}</span>
                          <span className="text-[10px] font-normal text-slate-400 font-mono">
                            (₹{playerOut?.currentPrice} Cr)
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className="bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-2 py-0.5 rounded text-[10px] uppercase font-bold">
                          {record.stage}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-bold text-amber-300">
                        {record.remainingAfter}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
