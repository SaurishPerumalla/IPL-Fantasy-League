import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Fixture, MatchPitchReport } from '../types/fantasy';
import {
  Play,
  Award,
  FastForward,
  Eye,
  CloudSun,
  Droplets,
  Zap,
  MapPin,
  CheckCircle2,
  Calendar,
  Sparkles,
  Trophy
} from 'lucide-react';

interface MatchCenterProps {
  onOpenSchedule?: () => void;
}

export const MatchCenter: React.FC<MatchCenterProps> = ({ onOpenSchedule }) => {
  const {
    state,
    allTeams,
    humanTeam,
    currentMatchdayFixtures,
    simulateCurrentMatchday,
    fastForwardMatchdays,
    openScorecardModal,
    openLineupModal,
    advancePlayoffStage
  } = useGame();

  const [fastForwardCount, setFastForwardCount] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState(false);

  const isPlayoffs = state.league_meta.playoffs_stage !== 'League';
  const isFinalCompleted = state.fixtures.some(f => f.playoffLabel === 'Final' && f.isCompleted);

  const handleSimulateDay = () => {
    setIsSimulating(true);
    setTimeout(() => {
      simulateCurrentMatchday();
      setIsSimulating(false);
    }, 400);
  };

  const handleFastForward = (n: number) => {
    setIsSimulating(true);
    setTimeout(() => {
      fastForwardMatchdays(n);
      setIsSimulating(false);
    }, 500);
  };

  return (
    <div className="space-y-6">
      {/* Matchday Control Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-mono text-amber-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>{isPlayoffs ? 'IPL 2026 PLAYOFFS' : `SEASON 2026 • MATCHDAY ${state.league_meta.current_matchday} OF ${state.league_meta.total_matchdays}`}</span>
            </div>
            <h2 className="text-2xl font-black text-white mt-1">
              {isPlayoffs ? state.league_meta.playoffs_stage : `Matchday ${state.league_meta.current_matchday} Fixtures`}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {currentMatchdayFixtures.filter(f => f.isCompleted).length} of {currentMatchdayFixtures.length} matches completed in this round
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Full Schedule Button */}
            {onOpenSchedule && (
              <button
                type="button"
                onClick={onOpenSchedule}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-violet-200" />
                <span>Full Season Schedule (70 M)</span>
              </button>
            )}

            {/* Dream11 Lineup Button */}
            <button
              type="button"
              onClick={openLineupModal}
              className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-md cursor-pointer"
            >
              <span>🏟️</span>
              <span>Dream11 Lineup</span>
            </button>

            {/* Simulate Button */}
            {!isFinalCompleted && (
              <button
                type="button"
                onClick={handleSimulateDay}
                disabled={isSimulating}
                className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{isSimulating ? 'Simulating Matches...' : 'Simulate Round (/simulate)'}</span>
              </button>
            )}

            {/* Fast-Forward Controls */}
            {!isPlayoffs && state.league_meta.current_matchday < 14 && (
              <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => handleFastForward(1)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition cursor-pointer"
                  title="Simulate 1 Matchday"
                >
                  +1 Day
                </button>
                <button
                  type="button"
                  onClick={() => handleFastForward(3)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-300 hover:bg-slate-800 hover:text-amber-400 transition cursor-pointer"
                  title="Fast Forward 3 Matchdays"
                >
                  +3 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleFastForward(14)}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold text-amber-300 hover:bg-amber-500/20 transition cursor-pointer flex items-center gap-1"
                  title="Fast Forward to Playoffs"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>To Playoffs</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixtures Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentMatchdayFixtures.map(fixture => {
          const t1 = allTeams.find(t => t.id === fixture.team1Id);
          const t2 = allTeams.find(t => t.id === fixture.team2Id);
          const hasResult = !!fixture.result;

          return (
            <div
              key={fixture.id}
              className={`rounded-2xl border transition-all p-5 flex flex-col justify-between ${
                hasResult
                  ? 'bg-slate-900/90 border-slate-800 shadow-md'
                  : 'bg-slate-900 border-slate-700/80 hover:border-slate-600 shadow-lg'
              }`}
            >
              {/* Card Header: Venue & Pitch */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-400 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center space-x-1.5 truncate max-w-[240px]">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{fixture.venue}</span>
                  </div>

                  {fixture.playoffLabel ? (
                    <span className="bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded text-[10px] font-mono border border-amber-500/30">
                      {fixture.playoffLabel}
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] text-slate-500">
                      Match #{fixture.id.replace('fix_', '')}
                    </span>
                  )}
                </div>

                {/* Team Matchup Banner */}
                <div className="py-4 space-y-3">
                  {/* Team 1 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{t1?.logoEmoji || '🏏'}</span>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{t1?.name}</span>
                          {t1?.is_human && (
                            <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded font-mono">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {t1?.shortCode} • Rank #{state.leaderboard.findIndex(l => l.teamId === t1?.id) + 1}
                        </div>
                      </div>
                    </div>

                    {hasResult && fixture.result && (
                      <div className="text-right font-mono">
                        <div className="text-lg font-black text-white">
                          {fixture.result.innings1.teamId === t1?.id
                            ? `${fixture.result.innings1.totalRuns}/${fixture.result.innings1.wickets}`
                            : `${fixture.result.innings2.totalRuns}/${fixture.result.innings2.wickets}`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {fixture.result.innings1.teamId === t1?.id
                            ? `(${fixture.result.innings1.overs} ov)`
                            : `(${fixture.result.innings2.overs} ov)`}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-center">
                    <span className="text-[10px] font-mono font-bold text-slate-600 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                      VS
                    </span>
                  </div>

                  {/* Team 2 */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{t2?.logoEmoji || '🏏'}</span>
                      <div>
                        <div className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span>{t2?.name}</span>
                          {t2?.is_human && (
                            <span className="bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded font-mono">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {t2?.shortCode} • Rank #{state.leaderboard.findIndex(l => l.teamId === t2?.id) + 1}
                        </div>
                      </div>
                    </div>

                    {hasResult && fixture.result && (
                      <div className="text-right font-mono">
                        <div className="text-lg font-black text-white">
                          {fixture.result.innings1.teamId === t2?.id
                            ? `${fixture.result.innings1.totalRuns}/${fixture.result.innings1.wickets}`
                            : `${fixture.result.innings2.totalRuns}/${fixture.result.innings2.wickets}`}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {fixture.result.innings1.teamId === t2?.id
                            ? `(${fixture.result.innings1.overs} ov)`
                            : `(${fixture.result.innings2.overs} ov)`}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer: Pitch conditions or Box Scorecard trigger */}
              <div className="pt-3 border-t border-slate-800/80">
                {hasResult && fixture.result ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-emerald-400">
                        {fixture.result.margin}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        POTM: {fixture.result.playerOfTheMatch.name}
                      </div>
                    </div>

                    <button
                      onClick={() => openScorecardModal(fixture)}
                      className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer border border-slate-700"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Box Scorecard</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <div className="flex items-center space-x-2">
                      <CloudSun className="w-3.5 h-3.5 text-amber-400" />
                      <span>Conditions: Pitch Belter & Dew</span>
                    </div>
                    <span className="text-[11px] text-amber-400">Pending Toss</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {currentMatchdayFixtures.length === 0 && (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-white">All Fixtures Completed for This Stage</h4>
          <p className="text-xs mt-1">Review the final tournament standings or reset for a new season.</p>
        </div>
      )}
    </div>
  );
};
