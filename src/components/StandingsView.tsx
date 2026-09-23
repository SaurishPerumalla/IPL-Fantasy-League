import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ALL_PLAYERS } from '../data/players';
import { Trophy, Award, TrendingUp, Sparkles, Shield, Flame } from 'lucide-react';

export const StandingsView: React.FC = () => {
  const { state, allTeams, humanTeam } = useGame();
  const [activeSubTab, setActiveSubTab] = useState<'ipl' | 'fantasy' | 'mvp'>('ipl');

  // Compute tournament player statistics for MVP / Cap races
  const playerStatsMap: {
    [pId: string]: {
      runs: number;
      balls: number;
      fours: number;
      sixes: number;
      wickets: number;
      overs: number;
      runsConceded: number;
      fantasyPoints: number;
    };
  } = {};

  // Aggregate stats across all completed fixtures
  state.fixtures.forEach(fix => {
    if (!fix.isCompleted || !fix.result) return;
    const { innings1, innings2, fantasyScores } = fix.result;

    [innings1, innings2].forEach(inn => {
      inn.batters.forEach(b => {
        if (!playerStatsMap[b.playerId]) {
          playerStatsMap[b.playerId] = { runs: 0, balls: 0, fours: 0, sixes: 0, wickets: 0, overs: 0, runsConceded: 0, fantasyPoints: 0 };
        }
        playerStatsMap[b.playerId].runs += b.runs;
        playerStatsMap[b.playerId].balls += b.balls;
        playerStatsMap[b.playerId].fours += b.fours;
        playerStatsMap[b.playerId].sixes += b.sixes;
      });

      inn.bowlers.forEach(bw => {
        if (!playerStatsMap[bw.playerId]) {
          playerStatsMap[bw.playerId] = { runs: 0, balls: 0, fours: 0, sixes: 0, wickets: 0, overs: 0, runsConceded: 0, fantasyPoints: 0 };
        }
        playerStatsMap[bw.playerId].wickets += bw.wickets;
        playerStatsMap[bw.playerId].overs += bw.overs;
        playerStatsMap[bw.playerId].runsConceded += bw.runs;
      });
    });

    Object.values(fantasyScores).forEach(fb => {
      if (!playerStatsMap[fb.playerId]) {
        playerStatsMap[fb.playerId] = { runs: 0, balls: 0, fours: 0, sixes: 0, wickets: 0, overs: 0, runsConceded: 0, fantasyPoints: 0 };
      }
      playerStatsMap[fb.playerId].fantasyPoints += fb.finalPoints;
    });
  });

  // Top run getters (Orange Cap)
  const topBatters = Object.entries(playerStatsMap)
    .map(([pId, s]) => ({ player: ALL_PLAYERS.find(p => p.id === pId), ...s }))
    .filter(item => item.player && item.runs > 0)
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 5);

  // Top wicket takers (Purple Cap)
  const topBowlers = Object.entries(playerStatsMap)
    .map(([pId, s]) => ({ player: ALL_PLAYERS.find(p => p.id === pId), ...s }))
    .filter(item => item.player && item.wickets > 0)
    .sort((a, b) => b.wickets - a.wickets)
    .slice(0, 5);

  // Top Fantasy Scorers (MVP)
  const topFantasyMVPs = Object.entries(playerStatsMap)
    .map(([pId, s]) => ({ player: ALL_PLAYERS.find(p => p.id === pId), ...s }))
    .filter(item => item.player && item.fantasyPoints > 0)
    .sort((a, b) => b.fantasyPoints - a.fantasyPoints)
    .slice(0, 5);

  // Fantasy Leaderboard sorted by total fantasy points
  const fantasyLeaderboard = [...state.leaderboard].sort(
    (a, b) => b.totalFantasyPoints - a.totalFantasyPoints
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header & Tabs */}
      <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              IPL 2026 Standings & Leaderboard
            </h3>
            <p className="text-xs text-slate-400">
              Top 4 qualify for Playoffs (Qualifier 1 & Eliminator)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveSubTab('ipl')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeSubTab === 'ipl'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Points Table
          </button>
          <button
            onClick={() => setActiveSubTab('fantasy')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'fantasy'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" /> Fantasy Leaderboard
          </button>
          <button
            onClick={() => setActiveSubTab('mvp')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'mvp'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3 h-3" /> Caps & MVPs
          </button>
        </div>
      </div>

      {/* Subtab 1: Official IPL Points Table */}
      {activeSubTab === 'ipl' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold text-center w-12">Pos</th>
                <th className="py-3 px-4 font-semibold font-sans">Team</th>
                <th className="py-3 px-2 text-center font-semibold">P</th>
                <th className="py-3 px-2 text-center font-semibold">W</th>
                <th className="py-3 px-2 text-center font-semibold">L</th>
                <th className="py-3 px-2 text-center font-semibold">T</th>
                <th className="py-3 px-4 text-right font-semibold">NRR</th>
                <th className="py-3 px-4 text-right font-bold text-amber-400">Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {state.leaderboard.map((entry, idx) => {
                const teamObj = allTeams.find(t => t.id === entry.teamId);
                const isTop4 = idx < 4;

                return (
                  <tr
                    key={entry.teamId}
                    className={`transition hover:bg-slate-950/60 ${
                      entry.isHuman ? 'bg-amber-500/10' : ''
                    } ${isTop4 ? 'border-l-2 border-l-emerald-500' : ''}`}
                  >
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                        idx === 0
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : isTop4
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans font-bold text-white flex items-center space-x-2.5">
                      <span className="text-base">{teamObj?.logoEmoji || '🏏'}</span>
                      <span className="truncate max-w-[180px]">{entry.teamName}</span>
                      {entry.isHuman && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500 text-slate-950 font-bold uppercase font-mono">
                          YOU
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-2 text-center text-slate-300">{entry.matchesPlayed}</td>
                    <td className="py-3 px-2 text-center font-semibold text-emerald-400">{teamObj?.stats.won || 0}</td>
                    <td className="py-3 px-2 text-center font-semibold text-rose-400">{teamObj?.stats.lost || 0}</td>
                    <td className="py-3 px-2 text-center text-slate-500">{teamObj?.stats.tied || 0}</td>

                    <td className={`py-3 px-4 text-right font-semibold ${
                      entry.netRunRate >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {entry.netRunRate >= 0 ? `+${entry.netRunRate.toFixed(3)}` : entry.netRunRate.toFixed(3)}
                    </td>

                    <td className="py-3 px-4 text-right font-black text-amber-400 text-sm">
                      {entry.matchPoints}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Positions 1-4 qualify for IPL 2026 Playoffs</span>
            </div>
            <div className="font-mono">
              Matchday {state.league_meta.current_matchday} of {state.league_meta.total_matchdays}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Fantasy Leaderboard */}
      {activeSubTab === 'fantasy' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold text-center w-12">Rank</th>
                <th className="py-3 px-4 font-semibold font-sans">Franchise</th>
                <th className="py-3 px-3 text-center font-semibold">Manager</th>
                <th className="py-3 px-3 text-right font-semibold">Matches</th>
                <th className="py-3 px-3 text-right font-semibold">Avg / Match</th>
                <th className="py-3 px-4 text-right font-bold text-amber-400">Total Fantasy Pts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {fantasyLeaderboard.map((entry, idx) => {
                const teamObj = allTeams.find(t => t.id === entry.teamId);
                const avgPts = entry.matchesPlayed > 0
                  ? Math.round((entry.totalFantasyPoints / entry.matchesPlayed) * 10) / 10
                  : 0;

                return (
                  <tr
                    key={entry.teamId}
                    className={`transition hover:bg-slate-950/60 ${
                      entry.isHuman ? 'bg-amber-500/10 border-l-2 border-l-amber-500' : ''
                    }`}
                  >
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs ${
                        idx === 0
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-950 font-black'
                          : idx === 2
                          ? 'bg-amber-700 text-white font-black'
                          : 'text-slate-500'
                      }`}>
                        {idx + 1}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans font-bold text-white flex items-center space-x-2.5">
                      <span className="text-base">{teamObj?.logoEmoji || '🏏'}</span>
                      <span>{entry.teamName}</span>
                    </td>

                    <td className="py-3 px-3 text-center">
                      {entry.isHuman ? (
                        <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                          Human Manager
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">AI Engine</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right text-slate-300">{entry.matchesPlayed}</td>
                    <td className="py-3 px-3 text-right text-slate-400 font-semibold">{avgPts}</td>

                    <td className="py-3 px-4 text-right font-black text-amber-400 text-sm">
                      {entry.totalFantasyPoints}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Subtab 3: Orange & Purple Caps + MVP */}
      {activeSubTab === 'mvp' && (
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Orange Cap (Runs) */}
          <div className="bg-slate-950 rounded-xl border border-orange-500/30 p-4 space-y-3 shadow-lg shadow-orange-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-orange-400 flex items-center gap-1.5">
                🧢 Orange Cap (Most Runs)
              </span>
            </div>

            {topBatters.length > 0 ? (
              <div className="space-y-2">
                {topBatters.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 font-mono w-4 font-bold">{idx + 1}</span>
                      <div>
                        <div className="font-bold text-white">{item.player?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.balls} balls • {item.fours}x4 • {item.sixes}x6
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-orange-400 font-mono text-sm">{item.runs}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        SR {item.balls > 0 ? ((item.runs / item.balls) * 100).toFixed(1) : 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-4 text-center">
                Simulate matchdays to see the Orange Cap race begin!
              </div>
            )}
          </div>

          {/* Purple Cap (Wickets) */}
          <div className="bg-slate-950 rounded-xl border border-purple-500/30 p-4 space-y-3 shadow-lg shadow-purple-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                🧢 Purple Cap (Most Wickets)
              </span>
            </div>

            {topBowlers.length > 0 ? (
              <div className="space-y-2">
                {topBowlers.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 font-mono w-4 font-bold">{idx + 1}</span>
                      <div>
                        <div className="font-bold text-white">{item.player?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.overs} ov • {item.runsConceded} runs
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-purple-400 font-mono text-sm">{item.wickets} wkt</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Econ {item.overs > 0 ? (item.runsConceded / item.overs).toFixed(2) : 0}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-4 text-center">
                Simulate matchdays to see the Purple Cap race begin!
              </div>
            )}
          </div>

          {/* Fantasy MVP */}
          <div className="bg-slate-950 rounded-xl border border-amber-500/30 p-4 space-y-3 shadow-lg shadow-amber-500/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                🏆 Fantasy MVP Leaderboard
              </span>
            </div>

            {topFantasyMVPs.length > 0 ? (
              <div className="space-y-2">
                {topFantasyMVPs.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 font-mono w-4 font-bold">{idx + 1}</span>
                      <div>
                        <div className="font-bold text-white">{item.player?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.player?.role} • Tier {item.player?.tier}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-amber-400 font-mono text-sm">{item.fantasyPoints}</div>
                      <div className="text-[10px] text-slate-400 font-mono">Total Pts</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic p-4 text-center">
                Simulate matches to see the overall Fantasy MVP rankings!
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
