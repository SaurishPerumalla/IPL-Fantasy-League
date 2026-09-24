import React, { useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Trophy, Award, Sparkles, CheckCircle2, Flame, ArrowRight, Shield } from 'lucide-react';
import confetti from 'canvas-confetti';

export const PlayoffsView: React.FC = () => {
  const {
    state,
    allTeams,
    simulateCurrentMatchday,
    advancePlayoffStage,
    openScorecardModal,
    openSeasonEndModal,
    openNewSeasonModal,
    openSeasonArchiveModal
  } = useGame();

  const q1Fix = state.fixtures.find(f => f.playoffLabel === 'Qualifier 1');
  const elimFix = state.fixtures.find(f => f.playoffLabel === 'Eliminator');
  const q2Fix = state.fixtures.find(f => f.playoffLabel === 'Qualifier 2');
  const finalFix = state.fixtures.find(f => f.playoffLabel === 'Final');

  const championTeam = finalFix?.isCompleted && finalFix.result
    ? allTeams.find(t => t.id === finalFix.result?.winnerTeamId)
    : null;

  useEffect(() => {
    if (championTeam) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch (e) {}
    }
  }, [championTeam]);

  const getTeamName = (teamId?: string) => {
    if (!teamId) return 'TBD';
    const t = allTeams.find(tm => tm.id === teamId);
    return t ? t.name : 'TBD';
  };

  const getTeamEmoji = (teamId?: string) => {
    if (!teamId) return '🏏';
    const t = allTeams.find(tm => tm.id === teamId);
    return t ? t.logoEmoji : '🏏';
  };

  return (
    <div className="space-y-6">
      {/* Championship Trophy Banner if Final Won */}
      {championTeam && (
        <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 p-8 rounded-3xl text-slate-950 text-center shadow-2xl relative overflow-hidden border-2 border-yellow-300">
          <div className="relative z-10 space-y-3">
            <span className="inline-flex p-3 rounded-2xl bg-slate-950 text-amber-400 text-3xl shadow-xl">
              🏆
            </span>
            <div className="text-xs font-mono font-black tracking-widest uppercase text-slate-950">
              {state.league_meta.season} CHAMPIONS
            </div>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-950">
              {championTeam.name}
            </h2>
            <p className="text-sm font-bold text-amber-950 max-w-md mx-auto">
              Crowned champions of {state.league_meta.season}! A historic tournament run sealed in glory.
            </p>

            {/* Action Buttons right in Championship Banner */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                type="button"
                onClick={openSeasonEndModal}
                className="flex items-center space-x-2 bg-slate-950 hover:bg-slate-900 text-amber-400 hover:text-amber-300 font-black px-6 py-3 rounded-2xl text-sm transition shadow-xl cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Start New Year &amp; Pick 11</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={openSeasonEndModal}
                className="flex items-center space-x-1.5 bg-yellow-400/80 hover:bg-yellow-400 text-slate-950 font-bold px-4 py-3 rounded-2xl text-xs transition cursor-pointer border border-yellow-300"
              >
                <Award className="w-4 h-4" />
                <span>Season Awards &amp; Caps</span>
              </button>

              <button
                type="button"
                onClick={openSeasonArchiveModal}
                className="flex items-center space-x-1.5 bg-yellow-400/80 hover:bg-yellow-400 text-slate-950 font-bold px-4 py-3 rounded-2xl text-xs transition cursor-pointer border border-yellow-300"
              >
                <Trophy className="w-4 h-4" />
                <span>Trophy Cabinet</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bracket Tree */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              {state.league_meta.season} Playoffs Bracket
            </h3>
            <p className="text-xs text-slate-400">
              The road to the championship trophy at Chepauk
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Start New Year Quick Action if final won */}
            {championTeam && (
              <button
                type="button"
                onClick={openSeasonEndModal}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Start Next Year</span>
              </button>
            )}

            {/* Advance button if Q1 and Eliminator are done but Q2 isn't created */}
            {q1Fix?.isCompleted && elimFix?.isCompleted && !q2Fix && (
              <button
                onClick={advancePlayoffStage}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Set Up Qualifier 2</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Advance to Final if Q2 is done but Final isn't created */}
            {q2Fix?.isCompleted && !finalFix && (
              <button
                onClick={advancePlayoffStage}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <span>Set Up Grand Final</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tree Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Round 1: Q1 & Eliminator */}
          <div className="space-y-4">
            <div className="text-xs font-mono font-bold uppercase text-amber-400">Playoffs Round 1</div>

            {/* Qualifier 1 Card */}
            <div className={`p-4 rounded-xl border ${
              q1Fix?.isCompleted ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-amber-500/40'
            }`}>
              <div className="text-[10px] font-bold text-amber-400 font-mono mb-2">QUALIFIER 1 (1st vs 2nd)</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-white">
                  <span>{getTeamEmoji(q1Fix?.team1Id)} {getTeamName(q1Fix?.team1Id)}</span>
                  {q1Fix?.result && (
                    <span className="font-mono text-amber-400">
                      {q1Fix.result.innings1.teamId === q1Fix.team1Id ? q1Fix.result.innings1.totalRuns : q1Fix.result.innings2.totalRuns}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between font-bold text-white">
                  <span>{getTeamEmoji(q1Fix?.team2Id)} {getTeamName(q1Fix?.team2Id)}</span>
                  {q1Fix?.result && (
                    <span className="font-mono text-amber-400">
                      {q1Fix.result.innings1.teamId === q1Fix.team2Id ? q1Fix.result.innings1.totalRuns : q1Fix.result.innings2.totalRuns}
                    </span>
                  )}
                </div>
              </div>
              {q1Fix?.isCompleted && q1Fix.result && (
                <div className="mt-2 text-[10px] text-emerald-400 font-semibold border-t border-slate-800/80 pt-1.5">
                  Winner to Final: {getTeamName(q1Fix.result.winnerTeamId)}
                </div>
              )}
            </div>

            {/* Eliminator Card */}
            <div className={`p-4 rounded-xl border ${
              elimFix?.isCompleted ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-amber-500/40'
            }`}>
              <div className="text-[10px] font-bold text-amber-400 font-mono mb-2">ELIMINATOR (3rd vs 4th)</div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold text-white">
                  <span>{getTeamEmoji(elimFix?.team1Id)} {getTeamName(elimFix?.team1Id)}</span>
                  {elimFix?.result && (
                    <span className="font-mono text-amber-400">
                      {elimFix.result.innings1.teamId === elimFix.team1Id ? elimFix.result.innings1.totalRuns : elimFix.result.innings2.totalRuns}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between font-bold text-white">
                  <span>{getTeamEmoji(elimFix?.team2Id)} {getTeamName(elimFix?.team2Id)}</span>
                  {elimFix?.result && (
                    <span className="font-mono text-amber-400">
                      {elimFix.result.innings1.teamId === elimFix.team2Id ? elimFix.result.innings1.totalRuns : elimFix.result.innings2.totalRuns}
                    </span>
                  )}
                </div>
              </div>
              {elimFix?.isCompleted && elimFix.result && (
                <div className="mt-2 text-[10px] text-emerald-400 font-semibold border-t border-slate-800/80 pt-1.5">
                  Advances to Q2: {getTeamName(elimFix.result.winnerTeamId)}
                </div>
              )}
            </div>
          </div>

          {/* Round 2: Qualifier 2 */}
          <div className="space-y-4">
            <div className="text-xs font-mono font-bold uppercase text-amber-400">Semi-Final</div>

            <div className={`p-4 rounded-xl border ${
              q2Fix?.isCompleted ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-amber-500/40'
            }`}>
              <div className="text-[10px] font-bold text-amber-400 font-mono mb-2">
                QUALIFIER 2 (Loser Q1 vs Winner Elim)
              </div>
              {q2Fix ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>{getTeamEmoji(q2Fix.team1Id)} {getTeamName(q2Fix.team1Id)}</span>
                    {q2Fix.result && (
                      <span className="font-mono text-amber-400">
                        {q2Fix.result.innings1.teamId === q2Fix.team1Id ? q2Fix.result.innings1.totalRuns : q2Fix.result.innings2.totalRuns}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>{getTeamEmoji(q2Fix.team2Id)} {getTeamName(q2Fix.team2Id)}</span>
                    {q2Fix.result && (
                      <span className="font-mono text-amber-400">
                        {q2Fix.result.innings1.teamId === q2Fix.team2Id ? q2Fix.result.innings1.totalRuns : q2Fix.result.innings2.totalRuns}
                      </span>
                    )}
                  </div>
                  {q2Fix.isCompleted && q2Fix.result && (
                    <div className="mt-2 text-[10px] text-emerald-400 font-semibold border-t border-slate-800/80 pt-1.5">
                      Advances to Final: {getTeamName(q2Fix.result.winnerTeamId)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-4 text-center">
                  Awaiting completion of Qualifier 1 & Eliminator
                </div>
              )}
            </div>
          </div>

          {/* Round 3: Grand Final */}
          <div className="space-y-4">
            <div className="text-xs font-mono font-bold uppercase text-amber-400">Championship Match</div>

            <div className={`p-5 rounded-2xl border-2 ${
              championTeam
                ? 'bg-amber-500/10 border-amber-500 shadow-xl shadow-amber-500/10'
                : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="text-xs font-bold text-amber-400 font-mono mb-2 flex items-center justify-between">
                <span>GRAND FINAL</span>
                <Trophy className="w-4 h-4 text-amber-400" />
              </div>
              {finalFix ? (
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between font-bold text-white text-sm">
                    <span>{getTeamEmoji(finalFix.team1Id)} {getTeamName(finalFix.team1Id)}</span>
                    {finalFix.result && (
                      <span className="font-mono text-amber-400 font-black">
                        {finalFix.result.innings1.teamId === finalFix.team1Id ? finalFix.result.innings1.totalRuns : finalFix.result.innings2.totalRuns}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between font-bold text-white text-sm">
                    <span>{getTeamEmoji(finalFix.team2Id)} {getTeamName(finalFix.team2Id)}</span>
                    {finalFix.result && (
                      <span className="font-mono text-amber-400 font-black">
                        {finalFix.result.innings1.teamId === finalFix.team2Id ? finalFix.result.innings1.totalRuns : finalFix.result.innings2.totalRuns}
                      </span>
                    )}
                  </div>
                  {finalFix.isCompleted && finalFix.result && (
                    <div className="mt-3 text-xs text-amber-400 font-black border-t border-slate-800/80 pt-2 text-center">
                      🏆 CHAMPION: {getTeamName(finalFix.result.winnerTeamId)}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic py-6 text-center">
                  Awaiting finalists
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
