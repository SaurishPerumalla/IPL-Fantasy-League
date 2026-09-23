import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Fixture, InningsScorecard, PlayerFantasyBreakdown } from '../types/fantasy';
import {
  Trophy,
  X,
  Award,
  Zap,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info
} from 'lucide-react';

export const ScorecardModal: React.FC = () => {
  const { state, closeModals } = useGame();
  const isOpen = state.activeModal === 'scorecard';
  const fixture = state.selectedFixtureForScorecard;

  const [activeTab, setActiveTab] = useState<'scorecard' | 'fantasy'>('scorecard');
  const [inningsTab, setInningsTab] = useState<1 | 2>(1);
  const [selectedBreakdownPlayerId, setSelectedBreakdownPlayerId] = useState<string | null>(null);

  if (!isOpen || !fixture || !fixture.result) return null;

  const { result } = fixture;
  const currentInnings: InningsScorecard = inningsTab === 1 ? result.innings1 : result.innings2;

  const fantasyList: PlayerFantasyBreakdown[] = Object.values(result.fantasyScores).sort(
    (a, b) => b.finalPoints - a.finalPoints
  );

  const selectedBreakdown = selectedBreakdownPlayerId ? result.fantasyScores[selectedBreakdownPlayerId] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Header Banner */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono text-amber-400">
              <span>MATCHDAY {fixture.matchday}</span>
              <span>•</span>
              <span>{result.venue}</span>
              <span>•</span>
              <span className="text-slate-300">{result.pitchReport.condition} ({result.pitchReport.dew})</span>
            </div>

            <button
              onClick={closeModals}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scores Overview */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            {/* Innings 1 */}
            <div className={`p-4 rounded-xl border ${
              result.winnerTeamId === result.innings1.teamId
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg text-white">{result.innings1.teamName}</span>
                <span className="text-2xl font-black text-amber-400 font-mono">
                  {result.innings1.totalRuns}/{result.innings1.wickets}
                  <span className="text-xs text-slate-400 font-normal ml-1.5">({result.innings1.overs} ov)</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Run Rate: {Math.round((result.innings1.totalRuns / Math.max(1, result.innings1.overs)) * 100) / 100} RPO
              </div>
            </div>

            {/* Innings 2 */}
            <div className={`p-4 rounded-xl border ${
              result.winnerTeamId === result.innings2.teamId
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-slate-950 border-slate-800'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg text-white">{result.innings2.teamName}</span>
                <span className="text-2xl font-black text-amber-400 font-mono">
                  {result.innings2.totalRuns}/{result.innings2.wickets}
                  <span className="text-xs text-slate-400 font-normal ml-1.5">({result.innings2.overs} ov)</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-mono">
                Run Rate: {Math.round((result.innings2.totalRuns / Math.max(1, result.innings2.overs)) * 100) / 100} RPO
              </div>
            </div>
          </div>

          {/* Result Margin & POTM */}
          <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{result.margin}</span>
            </div>

            <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800 font-mono text-[11px]">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">Player of the Match:</span>
              <strong className="text-white">{result.playerOfTheMatch.name}</strong>
              <span className="text-amber-300">({result.playerOfTheMatch.summary})</span>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center space-x-4">
          <button
            onClick={() => setActiveTab('scorecard')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === 'scorecard'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Official Box Scorecard
          </button>
          <button
            onClick={() => setActiveTab('fantasy')}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'fantasy'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>IPL Fantasy Points Audit ({fantasyList.length} Players)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'scorecard' ? (
            <>
              {/* Innings Selector Sub-tabs */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setInningsTab(1)}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                    inningsTab === 1
                      ? 'bg-slate-800 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  1st Innings: {result.innings1.teamName} ({result.innings1.totalRuns}/{result.innings1.wickets})
                </button>
                <button
                  onClick={() => setInningsTab(2)}
                  className={`text-xs font-bold px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
                    inningsTab === 2
                      ? 'bg-slate-800 text-amber-300 border border-amber-500/30'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  2nd Innings: {result.innings2.teamName} ({result.innings2.totalRuns}/{result.innings2.wickets})
                </button>
              </div>

              {/* Batting Card */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 font-bold text-xs text-white">
                  Batting - {currentInnings.teamName}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-4 font-semibold">Batter</th>
                        <th className="py-2 px-4 font-semibold">Dismissal</th>
                        <th className="py-2 px-2 text-right font-semibold">R</th>
                        <th className="py-2 px-2 text-right font-semibold">B</th>
                        <th className="py-2 px-2 text-right font-semibold">4s</th>
                        <th className="py-2 px-2 text-right font-semibold">6s</th>
                        <th className="py-2 px-4 text-right font-semibold">SR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {currentInnings.batters.map((b, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-4 font-sans font-bold text-white flex items-center gap-1.5">
                            <span>{b.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({b.role})</span>
                          </td>
                          <td className="py-2.5 px-4 text-slate-400 text-[11px] italic font-sans">{b.dismissal}</td>
                          <td className="py-2.5 px-2 text-right font-bold text-amber-400 text-sm">{b.runs}</td>
                          <td className="py-2.5 px-2 text-right text-slate-400">{b.balls}</td>
                          <td className="py-2.5 px-2 text-right text-slate-300">{b.fours}</td>
                          <td className="py-2.5 px-2 text-right text-slate-300">{b.sixes}</td>
                          <td className="py-2.5 px-4 text-right text-slate-300 font-semibold">{b.strikeRate.toFixed(1)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-900/30 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-slate-400">
                  <div>Extras: <strong className="text-white">{currentInnings.extras}</strong> (w 2, nb 1, b 1)</div>
                  <div>
                    Total: <strong className="text-amber-400 text-sm font-black">{currentInnings.totalRuns}/{currentInnings.wickets}</strong> ({currentInnings.overs} overs)
                  </div>
                </div>
              </div>

              {/* Fall of Wickets */}
              {currentInnings.fallOfWickets.length > 0 && (
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
                  <div className="text-slate-400 font-bold mb-1">Fall of Wickets:</div>
                  <div className="text-slate-300 font-mono text-[11px] leading-relaxed">
                    {currentInnings.fallOfWickets.join(', ')}
                  </div>
                </div>
              )}

              {/* Bowling Card */}
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800 font-bold text-xs text-white">
                  Bowling
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-4 font-semibold">Bowler</th>
                        <th className="py-2 px-2 text-right font-semibold">O</th>
                        <th className="py-2 px-2 text-right font-semibold">M</th>
                        <th className="py-2 px-2 text-right font-semibold">R</th>
                        <th className="py-2 px-2 text-right font-semibold">W</th>
                        <th className="py-2 px-4 text-right font-semibold">ECON</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {currentInnings.bowlers.map((bw, idx) => (
                        <tr key={idx} className="hover:bg-slate-900/40">
                          <td className="py-2.5 px-4 font-sans font-bold text-white flex items-center gap-1.5">
                            <span>{bw.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">({bw.role})</span>
                          </td>
                          <td className="py-2.5 px-2 text-right text-slate-300">{bw.overs}</td>
                          <td className="py-2.5 px-2 text-right text-slate-400">{bw.maidens}</td>
                          <td className="py-2.5 px-2 text-right text-slate-300">{bw.runs}</td>
                          <td className="py-2.5 px-2 text-right font-bold text-emerald-400 text-sm">{bw.wickets}</td>
                          <td className="py-2.5 px-4 text-right text-slate-300 font-semibold">{bw.economy.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Key Match Moments / Highlight Reel */}
              {currentInnings.keyMoments.length > 0 && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 fill-current" /> Key Innings Moments & Milestones
                  </h5>
                  <div className="space-y-1.5 font-mono text-[11px] max-h-40 overflow-y-auto pr-1">
                    {currentInnings.keyMoments.map((km, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-lg flex items-start space-x-2 ${
                          km.type === 'wicket'
                            ? 'bg-rose-950/40 text-rose-300 border border-rose-900/40'
                            : km.type === 'milestone'
                            ? 'bg-amber-950/40 text-amber-300 border border-amber-900/40'
                            : 'bg-slate-900 text-slate-300'
                        }`}
                      >
                        <span className="font-bold text-slate-400 w-10 shrink-0">{km.over} ov</span>
                        <span className="font-sans">{km.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Fantasy Audit Breakdown Tab */
            <div className="space-y-4">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400 flex items-center justify-between">
                <span>
                  Exact point calculations governed by the <strong>Standard IPL Fantasy Scoring Matrix</strong>. Click on any player row for itemized audit receipt.
                </span>
                <span className="text-[11px] font-mono text-amber-400">Captain 2.0x | Vice-Captain 1.5x</span>
              </div>

              <div className="overflow-x-auto bg-slate-950 rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold font-sans">Player</th>
                      <th className="py-2.5 px-2 text-center font-semibold">Role</th>
                      <th className="py-2.5 px-2 text-center font-semibold">Mult.</th>
                      <th className="py-2.5 px-3 text-right font-semibold">Bat Pts</th>
                      <th className="py-2.5 px-3 text-right font-semibold">Bowl Pts</th>
                      <th className="py-2.5 px-3 text-right font-semibold">Field Pts</th>
                      <th className="py-2.5 px-3 text-right font-semibold">Raw Pts</th>
                      <th className="py-2.5 px-4 text-right font-bold text-amber-400">Total Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {fantasyList.map(fb => {
                      const isSelected = selectedBreakdownPlayerId === fb.playerId;

                      return (
                        <React.Fragment key={fb.playerId}>
                          <tr
                            onClick={() => setSelectedBreakdownPlayerId(isSelected ? null : fb.playerId)}
                            className={`cursor-pointer transition hover:bg-slate-900/60 ${
                              isSelected ? 'bg-amber-500/10' : ''
                            }`}
                          >
                            <td className="py-2.5 px-4 font-sans font-bold text-white flex items-center gap-2">
                              <span>{fb.playerName}</span>
                              {fb.isCaptain && (
                                <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                                  C (2x)
                                </span>
                              )}
                              {fb.isViceCaptain && (
                                <span className="bg-cyan-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                                  VC (1.5x)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center text-slate-400">{fb.role}</td>
                            <td className="py-2.5 px-2 text-center font-bold text-slate-300">
                              {fb.multiplier}x
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-300 font-semibold">
                              {fb.battingPoints.total}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-300 font-semibold">
                              {fb.bowlingPoints.total}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-300 font-semibold">
                              {fb.fieldingPoints.total}
                            </td>
                            <td className="py-2.5 px-3 text-right text-slate-400">{fb.rawTotal}</td>
                            <td className="py-2.5 px-4 text-right font-black text-amber-400 text-sm">
                              {fb.finalPoints}
                            </td>
                          </tr>

                          {/* Expanded Audit Receipt */}
                          {isSelected && (
                            <tr className="bg-slate-900/90 text-xs">
                              <td colSpan={8} className="p-4 border-t border-b border-amber-500/30">
                                <div className="space-y-3 font-sans">
                                  <div className="font-bold text-amber-300 text-sm flex items-center justify-between">
                                    <span>Detailed Scoring Receipt for {fb.playerName}</span>
                                    <span className="font-mono text-xs">
                                      Raw: {fb.rawTotal} × {fb.multiplier}x = {fb.finalPoints} Pts
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                                    {/* Batting breakdown */}
                                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                                      <div className="font-bold text-amber-400 mb-1 font-sans">Batting: {fb.battingPoints.total} pts</div>
                                      <div>• Runs: +{fb.battingPoints.runs}</div>
                                      <div>• Boundaries (4s): +{fb.battingPoints.fours}</div>
                                      <div>• Boundaries (6s): +{fb.battingPoints.sixes}</div>
                                      <div>• Milestone (30/50/100): +{fb.battingPoints.milestoneBonus}</div>
                                      {fb.battingPoints.duckPenalty !== 0 && (
                                        <div className="text-rose-400">• Duck Penalty: {fb.battingPoints.duckPenalty}</div>
                                      )}
                                      <div>• Strike Rate Bonus: {fb.battingPoints.strikeRatePoints > 0 ? `+${fb.battingPoints.strikeRatePoints}` : fb.battingPoints.strikeRatePoints}</div>
                                    </div>

                                    {/* Bowling breakdown */}
                                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                                      <div className="font-bold text-cyan-400 mb-1 font-sans">Bowling: {fb.bowlingPoints.total} pts</div>
                                      <div>• Wickets: +{fb.bowlingPoints.wickets}</div>
                                      <div>• Bowled / LBW Bonus: +{fb.bowlingPoints.bowledLbwBonus}</div>
                                      <div>• Milestone (3/4/5w): +{fb.bowlingPoints.milestoneBonus}</div>
                                      <div>• Maiden Overs: +{fb.bowlingPoints.maidenBonus}</div>
                                      <div>• Economy Bonus: {fb.bowlingPoints.economyPoints > 0 ? `+${fb.bowlingPoints.economyPoints}` : fb.bowlingPoints.economyPoints}</div>
                                    </div>

                                    {/* Fielding breakdown */}
                                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800">
                                      <div className="font-bold text-emerald-400 mb-1 font-sans">Fielding: {fb.fieldingPoints.total} pts</div>
                                      <div>• Catches: +{fb.fieldingPoints.catches}</div>
                                      {fb.fieldingPoints.catchMilestoneBonus > 0 && (
                                        <div>• 3+ Catches Bonus: +{fb.fieldingPoints.catchMilestoneBonus}</div>
                                      )}
                                      <div>• Stumpings: +{fb.fieldingPoints.stumpings}</div>
                                      <div>• Direct Run Outs: +{fb.fieldingPoints.runOutDirect}</div>
                                      <div>• Shared Run Outs: +{fb.fieldingPoints.runOutShared}</div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Matchday {fixture.matchday} Result recorded in tournament standings & fantasy leaderboard.
          </div>
          <button
            onClick={closeModals}
            className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-1.5 rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
