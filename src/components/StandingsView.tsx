import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { ALL_PLAYERS } from '../data/players';
import { Trophy, Award, TrendingUp, Sparkles, Shield, Flame, History, Crown, ArrowRight } from 'lucide-react';

export const StandingsView: React.FC = () => {
  const { state, allTeams, humanTeam, openSeasonEndModal, openNewSeasonModal, openSeasonArchiveModal } = useGame();
  const [activeSubTab, setActiveSubTab] = useState<'ipl' | 'fantasy' | 'mvp' | 'history'>('ipl');

  const isFinalCompleted = state.fixtures.some(f => f.playoffLabel === 'Final' && f.isCompleted);
  const isSeasonOver = isFinalCompleted || state.league_meta.playoffs_stage === 'Completed';
  const history = state.season_history || [];

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

  // Fantasy Leaderboard from state or fallback
  const fantasyLeaderboard = (state.fantasy_leaderboard && state.fantasy_leaderboard.length > 0)
    ? state.fantasy_leaderboard
    : [...state.leaderboard].sort((a, b) => b.totalFantasyPoints - a.totalFantasyPoints).map((l, i) => ({
        id: l.teamId,
        teamName: l.teamName,
        managerName: l.isHuman ? 'You (Manager)' : 'AI Engine',
        isHuman: l.isHuman,
        rank: i + 1,
        logoEmoji: '🏏',
        playing_xi: [],
        captain: '',
        vice_captain: '',
        totalFantasyPoints: l.totalFantasyPoints,
        matchdayPoints: {},
        transfersCount: 0
      }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      {/* Header & Tabs */}
      <div className="px-4 sm:px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              {state.league_meta.season} Standings &amp; Leaderboard
            </h3>
            <p className="text-xs text-slate-400">
              Top 4 qualify for Playoffs (Qualifier 1 &amp; Eliminator)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('ipl')}
            className={`text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer text-center ${
              activeSubTab === 'ipl'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Points Table
          </button>
          <button
            onClick={() => setActiveSubTab('fantasy')}
            className={`text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
              activeSubTab === 'fantasy'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Fantasy</span>
          </button>
          <button
            onClick={() => setActiveSubTab('mvp')}
            className={`text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
              activeSubTab === 'mvp'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Award className="w-3 h-3" />
            <span>Caps / MVP</span>
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`text-xs font-bold px-2.5 sm:px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center justify-center gap-1 ${
              activeSubTab === 'history'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3 h-3" />
            <span>Archive {history.length > 0 && `(${history.length})`}</span>
          </button>
        </div>
      </div>

      {/* Season Concluded Bar in Standings */}
      {isSeasonOver && (
        <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-950 font-bold text-xs shadow-inner">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🏆</span>
            <span>{state.league_meta.season} season is concluded! Final standings &amp; points locked.</span>
          </div>
          <button
            onClick={openSeasonEndModal}
            className="bg-slate-950 hover:bg-slate-900 text-amber-400 hover:text-amber-300 px-4 py-1.5 rounded-xl font-black transition cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Start Next Year &amp; Team</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Subtab 1: Official IPL Points Table */}
      {activeSubTab === 'ipl' && (
        <div className="w-full max-w-full overflow-hidden">
          {/* Mobile Zero-Scroll Points Table (< 640px) */}
          <div className="sm:hidden divide-y divide-slate-800/60 font-mono text-xs">
            <div className="bg-slate-950 text-slate-400 px-3 py-2 flex items-center justify-between text-[11px] font-semibold">
              <div className="flex items-center space-x-2">
                <span className="w-6 text-center">Pos</span>
                <span>Team</span>
              </div>
              <div className="flex items-center space-x-4">
                <span className="w-10 text-center">W-L</span>
                <span className="w-12 text-right">NRR</span>
                <span className="w-8 text-right text-amber-400 font-bold">Pts</span>
              </div>
            </div>
            {state.leaderboard.map((entry, idx) => {
              const teamObj = allTeams.find(t => t.id === entry.teamId);
              const isTop4 = idx < 4;
              const won = teamObj?.stats.won || 0;
              const lost = teamObj?.stats.lost || 0;

              return (
                <div
                  key={entry.teamId}
                  className={`px-3 py-2.5 flex items-center justify-between transition ${
                    entry.isHuman ? 'bg-amber-500/10' : ''
                  } ${isTop4 ? 'border-l-2 border-l-emerald-500' : ''}`}
                >
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-black shrink-0 ${
                      idx === 0
                        ? 'bg-amber-500 text-slate-950'
                        : isTop4
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-sm shrink-0">{teamObj?.logoEmoji || '🏏'}</span>
                    <div className="min-w-0 truncate font-sans font-bold text-white text-xs">
                      <span className="truncate">{entry.teamName}</span>
                      {entry.isHuman && (
                        <span className="ml-1 px-1 py-0.2 rounded text-[9px] bg-amber-500 text-slate-950 font-bold uppercase font-mono">
                          YOU
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 shrink-0 text-xs">
                    <span className="w-10 text-center text-slate-300 font-mono text-[11px]">
                      {won}-{lost}
                    </span>
                    <span className={`w-12 text-right text-[11px] font-mono font-semibold ${
                      entry.netRunRate >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {entry.netRunRate >= 0 ? `+${entry.netRunRate.toFixed(2)}` : entry.netRunRate.toFixed(2)}
                    </span>
                    <span className="w-8 text-right font-black text-amber-400 text-sm font-mono">
                      {entry.matchPoints}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tablet & Desktop Full Table (>= 640px) */}
          <div className="hidden sm:block overflow-x-auto">
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
          </div>

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
        <div className="w-full max-w-full overflow-hidden">
          {/* Mobile Zero-Scroll Fantasy Table (< 640px) */}
          <div className="sm:hidden divide-y divide-slate-800/60 font-mono text-xs">
            <div className="bg-slate-950 text-slate-400 px-3 py-2 flex items-center justify-between text-[11px] font-semibold">
              <div className="flex items-center space-x-2">
                <span className="w-6 text-center">Rank</span>
                <span>Franchise &amp; Manager</span>
              </div>
              <span className="text-right text-amber-400 font-bold">Fantasy Pts</span>
            </div>
            {fantasyLeaderboard.map((entry, idx) => {
              const played = Object.keys(entry.matchdayPoints || {}).length;
              const avgPts = played > 0
                ? Math.round((entry.totalFantasyPoints / played) * 10) / 10
                : 0;

              return (
                <div
                  key={entry.id || entry.teamName}
                  className={`px-3 py-2.5 flex items-center justify-between transition ${
                    entry.isHuman ? 'bg-amber-500/10 border-l-2 border-l-amber-500' : ''
                  }`}
                >
                  <div className="flex items-center space-x-2 min-w-0 pr-2">
                    <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[11px] font-black shrink-0 ${
                      idx === 0
                        ? 'bg-amber-500 text-slate-950'
                        : idx === 1
                        ? 'bg-slate-300 text-slate-950'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'text-slate-500'
                    }`}>
                      {idx + 1}
                    </span>
                    <span className="text-sm shrink-0">{entry.logoEmoji || '🏏'}</span>
                    <div className="min-w-0">
                      <div className="font-sans font-bold text-white text-xs truncate flex items-center gap-1.5">
                        <span className="truncate">{entry.teamName}</span>
                        {entry.isHuman && (
                          <span className="px-1 py-0.2 rounded text-[9px] bg-amber-500 text-slate-950 font-bold uppercase font-mono">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono truncate">
                        <span className="truncate">{entry.managerName || (entry.isHuman ? 'You' : 'AI')}</span>
                        <span>•</span>
                        <span>{played}M (avg {avgPts})</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-black text-amber-400 text-sm font-mono">
                      {entry.totalFantasyPoints}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono">PTS</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tablet & Desktop Full Fantasy Table (>= 640px) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold text-center w-12">Rank</th>
                  <th className="py-3 px-4 font-semibold font-sans">Fantasy Team</th>
                  <th className="py-3 px-3 text-center font-semibold">Manager</th>
                  <th className="py-3 px-3 text-right font-semibold">Matches</th>
                  <th className="py-3 px-3 text-right font-semibold">Avg / Match</th>
                  <th className="py-3 px-4 text-right font-bold text-amber-400">Total Fantasy Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {fantasyLeaderboard.map((entry, idx) => {
                  const played = Object.keys(entry.matchdayPoints || {}).length;
                  const avgPts = played > 0
                    ? Math.round((entry.totalFantasyPoints / played) * 10) / 10
                    : 0;

                  return (
                    <tr
                      key={entry.id || entry.teamName}
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
                        <span className="text-base">{entry.logoEmoji || '🏏'}</span>
                        <span>{entry.teamName}</span>
                        {entry.isHuman && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500 text-slate-950 font-bold uppercase font-mono">
                            YOU
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {entry.isHuman ? (
                          <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-500/30">
                            {entry.managerName || 'Human Manager'}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">{entry.managerName}</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-300">{played}</td>
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

      {/* Subtab 4: Franchise Trophy Cabinet & Historical Archive */}
      {activeSubTab === 'history' && (
        <div className="p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h4 className="text-base font-black text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Franchise Trophy Cabinet &amp; Past Campaigns</span>
              </h4>
              <p className="text-xs text-slate-400">
                Permanent archive of every concluded IPL season and your manager records
              </p>
            </div>

            <button
              onClick={openNewSeasonModal}
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow-md self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Start New Year &amp; Team</span>
            </button>
          </div>

          {history.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-2.5">
              <Trophy className="w-10 h-10 text-amber-400 mx-auto" />
              <div className="text-sm font-bold text-white">Current season ({state.league_meta.season}) is ongoing!</div>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Once the 70 league matches and the Grand Final conclude, this Trophy Cabinet will preserve the season's champion, cap holders, and your team's final rank forever.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {history.map(item => (
                <div
                  key={item.id}
                  className="bg-slate-950/80 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{item.championEmoji || '🏆'}</span>
                      <div>
                        <span className="text-sm font-black text-white">{item.season}</span>
                        <div className="text-[10px] text-slate-400">Concluded {item.completedAt}</div>
                      </div>
                    </div>
                    <div className="text-right text-xs">
                      <div className="font-bold text-amber-400">{item.championTeamName}</div>
                      <div className="text-[10px] text-slate-400">Champion</div>
                    </div>
                  </div>

                  <div className="bg-slate-900/90 rounded-xl p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <Crown className="w-3.5 h-3.5 text-amber-400" />
                        <span>{item.userTeamName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Rank #{item.userRank} • {item.userFantasyPoints.toLocaleString()} pts
                      </div>
                    </div>
                    <span className="font-mono font-bold text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                      {item.userRank === 1 ? '🏆 CHAMPION' : `TOP #${item.userRank}`}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                    <div className="bg-orange-950/20 border border-orange-500/20 rounded-lg p-2">
                      <div className="text-[10px] text-orange-400 font-bold">🧡 ORANGE CAP</div>
                      <div className="truncate text-white font-bold">{item.orangeCap.name}</div>
                      <div className="text-[10px] text-slate-400">{item.orangeCap.runs} runs</div>
                    </div>
                    <div className="bg-purple-950/20 border border-purple-500/20 rounded-lg p-2">
                      <div className="text-[10px] text-purple-400 font-bold">💜 PURPLE CAP</div>
                      <div className="truncate text-white font-bold">{item.purpleCap.name}</div>
                      <div className="text-[10px] text-slate-400">{item.purpleCap.wickets} wkts</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
