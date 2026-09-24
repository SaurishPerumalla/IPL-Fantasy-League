import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { Fixture, MatchPitchReport, Player } from '../types/fantasy';
import { getPlayerById } from '../data/players';
import { LiveMatchRoom } from './LiveMatchRoom';
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
  Trophy,
  Flame,
  Tv
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
    openSeasonEndModal,
    openNewSeasonModal,
    openSeasonArchiveModal,
    advancePlayoffStage,
    commitLiveMatchResult
  } = useGame();

  const [fastForwardCount, setFastForwardCount] = useState<number>(1);
  const [isSimulating, setIsSimulating] = useState(false);
  const [liveMatchFixture, setLiveMatchFixture] = useState<Fixture | null>(null);

  const isPlayoffs = state.league_meta.playoffs_stage !== 'League';
  const finalFix = state.fixtures.find(f => f.playoffLabel === 'Final');
  const isFinalCompleted = state.fixtures.some(f => f.playoffLabel === 'Final' && f.isCompleted);
  const isSeasonOver = isFinalCompleted || state.league_meta.playoffs_stage === 'Completed';
  const championTeam = finalFix?.isCompleted && finalFix.result
    ? allTeams.find(t => t.id === finalFix.result?.winnerTeamId)
    : null;

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

            {/* Start New Year Button if Season is Over */}
            {isSeasonOver ? (
              <button
                type="button"
                onClick={openSeasonEndModal}
                className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-sm transition shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Start New Year &amp; Team</span>
              </button>
            ) : (
              <>
                {/* Enter Next Live Match Button */}
                {currentMatchdayFixtures.find(f => !f.isCompleted) && (
                  <button
                    type="button"
                    onClick={() => {
                      const pending = currentMatchdayFixtures.find(f => !f.isCompleted);
                      if (pending) setLiveMatchFixture(pending);
                    }}
                    className="flex items-center space-x-2 bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-slate-950 font-black px-5 py-2.5 rounded-xl text-sm transition shadow-lg shadow-rose-500/25 active:scale-95 cursor-pointer ring-2 ring-rose-400/40"
                  >
                    <Flame className="w-4 h-4 fill-current animate-pulse text-slate-950" />
                    <span>Watch Match Live (/live)</span>
                  </button>
                )}

                {/* Simulate Button */}
                <button
                  type="button"
                  onClick={handleSimulateDay}
                  disabled={isSimulating}
                  className="flex items-center space-x-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-sm transition shadow-lg shadow-orange-500/20 active:scale-95 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isSimulating ? 'Simulating Matches...' : 'Simulate Round (/simulate)'}</span>
                </button>
              </>
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

                {/* Visual Indicator: Your Fantasy Players active in this match */}
                {(() => {
                  const fantasyPlayersInMatch = (humanTeam.playing_xi || [])
                    .map(id => getPlayerById(id))
                    .filter((p): p is Player => {
                      if (!p) return false;
                      return Boolean(
                        (t1?.shortCode && p.teamAffiliation === t1.shortCode) ||
                        (t2?.shortCode && p.teamAffiliation === t2.shortCode) ||
                        (t1?.roster && t1.roster.includes(p.id)) ||
                        (t2?.roster && t2.roster.includes(p.id))
                      );
                    });

                  return (
                    <div className="mt-1 mb-2 px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-900/60 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5 truncate">
                        <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-slate-300 font-medium truncate text-[11px] sm:text-xs">
                          {fantasyPlayersInMatch.length > 0 ? (
                            <span>
                              <strong className="text-amber-400">{fantasyPlayersInMatch.length}</strong> of your Fantasy XI in this match
                            </span>
                          ) : (
                            <span className="text-slate-500">0 of your Fantasy XI playing</span>
                          )}
                        </span>
                      </div>
                      {fantasyPlayersInMatch.length > 0 && (
                        <div className="flex items-center -space-x-1 shrink-0 ml-2">
                          {fantasyPlayersInMatch.slice(0, 3).map(p => (
                            <div
                              key={p.id}
                              title={`${p.name} (${p.role} • ${p.teamAffiliation})`}
                              className="w-5 h-5 rounded-full border border-slate-900 flex items-center justify-center text-[9px] font-bold text-white shadow-sm"
                              style={{ backgroundColor: p.avatarColor || '#3b82f6' }}
                            >
                              {p.shortName.slice(0, 1)}
                            </div>
                          ))}
                          {fantasyPlayersInMatch.length > 3 && (
                            <span className="text-[10px] text-amber-400 font-mono ml-1">+{fantasyPlayersInMatch.length - 3}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Card Footer: Pitch conditions, Live Match Entry, or Box Scorecard trigger */}
              <div className="pt-3 border-t border-slate-800/80">
                {hasResult && fixture.result ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-emerald-400">
                        {fixture.result.margin}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        POTM: {fixture.result.playerOfTheMatch.name}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setLiveMatchFixture(fixture)}
                        className="flex items-center space-x-1.5 bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white font-bold px-2.5 py-1.5 rounded-lg text-xs transition cursor-pointer border border-slate-700 active:scale-95"
                        title="Replay ball-by-ball simulated match"
                      >
                        <Play className="w-3 h-3 text-amber-400 fill-current" />
                        <span>Replay</span>
                      </button>

                      <button
                        onClick={() => openScorecardModal(fixture)}
                        className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer border border-slate-700 active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Scorecard</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <CloudSun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">Pitch Belter & Dew</span>
                    </div>

                    <button
                      onClick={() => setLiveMatchFixture(fixture)}
                      className="flex items-center justify-center space-x-1.5 bg-gradient-to-r from-rose-500 via-amber-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-xs transition shadow-md shadow-rose-500/20 active:scale-95 cursor-pointer ring-1 ring-rose-400/40"
                    >
                      <Flame className="w-3.5 h-3.5 fill-current animate-pulse text-slate-950" />
                      <span>Watch Live / Enter Match</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Season Concluded Banner */}
      {isSeasonOver ? (
        <div className="p-8 sm:p-10 text-center bg-gradient-to-r from-amber-950/30 via-slate-900 to-emerald-950/30 border border-amber-500/40 rounded-3xl text-slate-300 shadow-2xl space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30 shadow-lg">
            <Trophy className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-mono font-black text-amber-400 tracking-widest uppercase">
              {state.league_meta.season} Concluded
            </div>
            <h4 className="text-2xl sm:text-3xl font-black text-white">
              {championTeam ? `${championTeam.name} Crowned Champions!` : 'Tournament Completed!'}
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
              All league fixtures and playoffs matches have finished. Ready for the next championship chase? Begin a brand-new year with 100 new transfers, restored boosters, and a clean player draft!
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={openSeasonEndModal}
              className="flex items-center space-x-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black px-6 py-3 rounded-xl text-sm transition shadow-lg shadow-emerald-500/25 active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Start New Year &amp; Pick 11</span>
            </button>

            <button
              type="button"
              onClick={openSeasonEndModal}
              className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold px-4 py-3 rounded-xl text-xs transition border border-slate-700 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Season Awards &amp; Caps</span>
            </button>

            <button
              type="button"
              onClick={openSeasonArchiveModal}
              className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-bold px-4 py-3 rounded-xl text-xs transition border border-slate-800 cursor-pointer"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Trophy Cabinet</span>
            </button>
          </div>
        </div>
      ) : currentMatchdayFixtures.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-white">All Fixtures Completed for This Stage</h4>
          <p className="text-xs mt-1">Review the final tournament standings or reset for a new season.</p>
        </div>
      ) : null}

      {/* Live Match Viewer Room Modal */}
      {liveMatchFixture && (
        <LiveMatchRoom
          fixture={liveMatchFixture}
          onClose={() => setLiveMatchFixture(null)}
          onMatchCompleted={(result) => {
            commitLiveMatchResult(liveMatchFixture.id, result);
          }}
        />
      )}
    </div>
  );
};
