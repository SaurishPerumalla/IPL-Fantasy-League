import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { Fixture, MatchSimulationResult, Player, PlayerRole } from '../types/fantasy';
import { generateLiveMatchSimulation, LiveBallSnapshot } from '../engine/liveMatchSimulator';
import { getPlayerById } from '../data/players';
import {
  Play,
  Pause,
  FastForward,
  RotateCcw,
  X,
  Trophy,
  Award,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Flame,
  Zap,
  TrendingUp,
  MapPin,
  ChevronRight,
  Shield,
  Star,
  Users
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface LiveMatchRoomProps {
  fixture: Fixture;
  onClose: () => void;
  onMatchCompleted?: (result: MatchSimulationResult) => void;
}

export const LiveMatchRoom: React.FC<LiveMatchRoomProps> = ({
  fixture,
  onClose,
  onMatchCompleted
}) => {
  const { state, allTeams, humanTeam, boostersState, openScorecardModal } = useGame();

  const t1 = allTeams.find(t => t.id === fixture.team1Id) || allTeams[0];
  const t2 = allTeams.find(t => t.id === fixture.team2Id) || allTeams[1];

  // Generate the match simulation sequence
  const simDataRef = useRef<ReturnType<typeof generateLiveMatchSimulation> | null>(null);
  if (!simDataRef.current) {
    simDataRef.current = generateLiveMatchSimulation(
      fixture,
      t1,
      t2,
      undefined,
      boostersState?.activeBoosterForNextMatch
    );
  }

  const { snapshots, finalResult, pitchReport, tossWinner, tossDecision } = simDataRef.current;

  // Playback state
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMs, setSpeedMs] = useState<number>(500); // 500ms default
  const [hasNotifiedCompletion, setHasNotifiedCompletion] = useState<boolean>(false);

  const commentaryEndRef = useRef<HTMLDivElement>(null);

  const activeSnapshot = snapshots[currentStep] || snapshots[snapshots.length - 1];
  const isFinished = currentStep >= snapshots.length - 1;

  // Automatic playback timer
  useEffect(() => {
    if (!isPlaying || isFinished) return;

    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < snapshots.length - 1) {
          return prev + 1;
        } else {
          setIsPlaying(false);
          return prev;
        }
      });
    }, speedMs);

    return () => clearInterval(timer);
  }, [isPlaying, isFinished, speedMs, snapshots.length]);

  // Trigger match completion callback and confetti when match completes
  useEffect(() => {
    if (isFinished && !hasNotifiedCompletion) {
      setHasNotifiedCompletion(true);
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {}
      if (onMatchCompleted) {
        onMatchCompleted(finalResult);
      }
    }
  }, [isFinished, hasNotifiedCompletion, onMatchCompleted, finalResult]);

  // Auto-scroll commentary
  useEffect(() => {
    if (commentaryEndRef.current) {
      commentaryEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentStep]);

  // Stepping actions
  const handleStepNextBall = () => {
    setIsPlaying(false);
    if (currentStep < snapshots.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleStepNextOver = () => {
    setIsPlaying(false);
    const currentOver = activeSnapshot.overNumber;
    const currentInn = activeSnapshot.innings;
    // Find first ball of next over
    const nextOverIdx = snapshots.findIndex(
      (s, idx) => idx > currentStep && (s.overNumber > currentOver || s.innings > currentInn)
    );
    if (nextOverIdx !== -1) {
      setCurrentStep(nextOverIdx);
    } else {
      setCurrentStep(snapshots.length - 1);
    }
  };

  const handleFastSimulateToEnd = () => {
    setIsPlaying(false);
    setCurrentStep(snapshots.length - 1);
  };

  const handleResetPlayback = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setHasNotifiedCompletion(false);
  };

  // Identify user-owned players participating in this match
  const userXIIds = humanTeam.playing_xi || [];
  const activeUserPlayersInMatch = userXIIds
    .filter(id => {
      const p = getPlayerById(id);
      return p && (p.teamAffiliation === t1.shortCode || p.teamAffiliation === t2.shortCode);
    })
    .map(id => getPlayerById(id))
    .filter((p): p is Player => p !== undefined);

  // Calculate live fantasy total for user XI
  const userLiveMatchPoints = activeUserPlayersInMatch.reduce((sum, p) => {
    return sum + (activeSnapshot.liveFantasyPoints[p.id] || 0);
  }, 0);

  // Batting and bowling team names
  const battingTeam = activeSnapshot.battingTeamId === t1.id ? t1 : t2;
  const bowlingTeam = activeSnapshot.bowlingTeamId === t1.id ? t1 : t2;

  // Phase
  const overNum = activeSnapshot.overNumber + 1;
  const matchPhase = overNum <= 6 ? 'Powerplay (1-6)' : overNum >= 16 ? 'Death Overs (16-20)' : 'Middle Overs (7-15)';

  // Recent 6 balls commentary slice
  const recentEvents = snapshots.slice(Math.max(0, currentStep - 7), currentStep + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#091436] border border-indigo-900/80 rounded-3xl shadow-2xl text-white overflow-hidden my-auto flex flex-col max-h-[95vh]">
        {/* Top App Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-indigo-950 bg-[#050c1e] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="relative flex h-3 w-3">
                {!isFinished ? (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                  </>
                ) : (
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                )}
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400">
                {!isFinished ? 'LIVE MATCH ROOM' : 'MATCH CONCLUDED'}
              </span>
            </div>
            <span className="text-slate-500">•</span>
            <div className="text-xs text-slate-300 font-mono hidden sm:block">
              {fixture.venue.split(',')[0]}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white transition cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
              title="Close Match Room"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Scoreboard Hero */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-950 via-[#071026] to-slate-950 border-b border-indigo-950 shrink-0">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Team 1 vs Team 2 Score Header */}
            <div className="flex items-center justify-between sm:justify-start sm:space-x-8">
              {/* Batting Team */}
              <div className="flex items-center space-x-3">
                <span className="text-3xl">{battingTeam.logoEmoji || '🏏'}</span>
                <div>
                  <div className="text-xs font-mono text-amber-400 font-bold uppercase flex items-center gap-1.5">
                    <span>{battingTeam.name}</span>
                    <span className="bg-amber-500/20 text-amber-300 text-[9px] px-1.5 py-0.2 rounded font-mono">
                      BATTING
                    </span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
                    {activeSnapshot.currentRuns}/{activeSnapshot.currentWickets}
                    <span className="text-sm sm:text-base font-normal text-slate-400 ml-2">
                      ({activeSnapshot.oversFormatted} ov)
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-slate-600 font-black text-xl hidden sm:block">VS</div>

              {/* Bowling Team */}
              <div className="flex items-center space-x-3 text-right sm:text-left">
                <div>
                  <div className="text-xs font-mono text-slate-400 uppercase font-bold">
                    {bowlingTeam.name}
                  </div>
                  <div className="text-sm font-mono text-slate-300">
                    {activeSnapshot.innings === 2 ? (
                      <span>
                        Target: <strong className="text-amber-400">{activeSnapshot.targetRuns}</strong>
                      </span>
                    ) : (
                      <span>Bowling 1st Inn</span>
                    )}
                  </div>
                </div>
                <span className="text-3xl">{bowlingTeam.logoEmoji || '🏏'}</span>
              </div>
            </div>

            {/* Run Rates & Match Phase */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-[#050c1e] p-2.5 sm:p-3 rounded-2xl border border-indigo-950 self-start md:self-auto text-xs font-mono">
              <div className="px-2.5 py-1 bg-slate-900 rounded-lg">
                <span className="text-slate-400">CRR: </span>
                <span className="text-emerald-400 font-bold">{activeSnapshot.currentRunRate}</span>
              </div>

              {activeSnapshot.requiredRunRate !== null && (
                <div className="px-2.5 py-1 bg-slate-900 rounded-lg">
                  <span className="text-slate-400">RRR: </span>
                  <span className="text-amber-400 font-bold">{activeSnapshot.requiredRunRate}</span>
                </div>
              )}

              {activeSnapshot.requiredRuns !== null && (
                <div className="px-2.5 py-1 bg-amber-500/10 text-amber-300 rounded-lg border border-amber-500/20 font-bold">
                  Need {activeSnapshot.requiredRuns} in {activeSnapshot.ballsRemaining}b
                </div>
              )}

              <div className="px-2.5 py-1 bg-indigo-950 text-indigo-300 rounded-lg border border-indigo-900/50">
                {matchPhase}
              </div>
            </div>
          </div>

          {/* Over Ball-by-Ball Bubbles Ticker */}
          <div className="mt-4 pt-3 border-t border-indigo-950/80 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-slate-400 font-bold">This Over ({activeSnapshot.overNumber + 1}):</span>
              <div className="flex items-center space-x-1.5">
                {activeSnapshot.recentBallsInOver.length === 0 ? (
                  <span className="text-xs text-slate-500 font-mono italic">Start of over...</span>
                ) : (
                  activeSnapshot.recentBallsInOver.map((ballVal, bIdx) => (
                    <span
                      key={bIdx}
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black font-mono transition-transform scale-100 shadow-sm ${
                        ballVal === '6'
                          ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                          : ballVal === '4'
                          ? 'bg-emerald-500 text-slate-950 ring-1 ring-emerald-300'
                          : ballVal === 'W'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : ballVal === '•'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-indigo-600 text-white'
                      }`}
                    >
                      {ballVal}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Live Fantasy Points Ping in Bar */}
            <div className="flex items-center space-x-2 bg-emerald-950/40 border border-emerald-500/30 px-3 py-1 rounded-xl text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-300">My XI Match Points:</span>
              <strong className="text-emerald-400 text-sm">{userLiveMatchPoints} pts</strong>
            </div>
          </div>
        </div>

        {/* Playback Controls Bar */}
        <div className="px-3 sm:px-6 py-2.5 bg-[#050c1e] border-b border-indigo-950 flex flex-wrap items-center justify-between gap-2.5 shrink-0 max-w-full">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {/* Play / Pause Toggle */}
            <button
              onClick={() => setIsPlaying(prev => !prev)}
              disabled={isFinished}
              className={`flex items-center space-x-1.5 font-bold px-3 sm:px-4 py-2 rounded-xl text-xs transition cursor-pointer min-h-[42px] ${
                isPlaying
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Play Live'}</span>
            </button>

            {/* Step Next Ball */}
            <button
              onClick={handleStepNextBall}
              disabled={isFinished}
              className="flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 sm:px-3 py-2 rounded-xl text-xs font-mono font-bold transition border border-slate-800 disabled:opacity-40 min-h-[42px] cursor-pointer"
              title="Simulate Next Single Ball"
            >
              <span>+1 Ball</span>
            </button>

            {/* Step Next Over */}
            <button
              onClick={handleStepNextOver}
              disabled={isFinished}
              className="flex items-center space-x-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 sm:px-3 py-2 rounded-xl text-xs font-mono font-bold transition border border-slate-800 disabled:opacity-40 min-h-[42px] cursor-pointer"
              title="Simulate to Next Over"
            >
              <span>+1 Over</span>
            </button>

            {/* Fast-Simulate to End */}
            <button
              onClick={handleFastSimulateToEnd}
              disabled={isFinished}
              className="flex items-center space-x-1.5 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition border border-indigo-700/50 min-h-[42px] cursor-pointer"
              title="Instantly Finish Match"
            >
              <FastForward className="w-3.5 h-3.5 text-amber-400" />
              <span>Finish Match</span>
            </button>

            {isFinished && (
              <button
                onClick={handleResetPlayback}
                className="flex items-center space-x-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-2 rounded-xl text-xs font-bold transition border border-slate-700 min-h-[42px] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Replay</span>
              </button>
            )}
          </div>

          {/* Speed Selector Buttons */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono shrink-0">
            <span className="text-slate-500 text-[10px] px-1 hidden sm:inline">SPEED:</span>
            {[
              { label: '1x', ms: 750 },
              { label: '2x', ms: 400 },
              { label: '4x', ms: 120 }
            ].map(spd => (
              <button
                key={spd.label}
                onClick={() => setSpeedMs(spd.ms)}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer min-h-[36px] ${
                  speedMs === spd.ms
                    ? 'bg-amber-500 text-slate-950'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Body Grid: Crease Stats & Commentary & Live Fantasy Tracker */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5 overflow-y-auto flex-1">
          {/* Left Column (2 Cols wide on desktop): Crease Action & Commentary Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* On-Crease Duel Card */}
            <div className="bg-[#050c1e] rounded-2xl border border-indigo-950 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-indigo-950">
                <span className="font-bold uppercase font-mono text-amber-400">Current Batsmen &amp; Bowler</span>
                <span className="text-[11px] font-mono text-slate-500">Innings {activeSnapshot.innings}</span>
              </div>

              {/* Striker & Non-Striker Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Striker */}
                {(() => {
                  const isUserPlayer = userXIIds.includes(activeSnapshot.striker.playerId);
                  const isC = humanTeam.captain === activeSnapshot.striker.playerId;
                  const isVC = humanTeam.vice_captain === activeSnapshot.striker.playerId;

                  return (
                    <div className="bg-slate-900/90 rounded-xl p-3 border border-amber-500/40 relative overflow-hidden">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-amber-400 font-bold font-mono">STRIKER *</span>
                          {isUserPlayer && (
                            <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black px-1.5 py-0.2 rounded font-mono border border-emerald-500/30">
                              MY XI {isC ? '(C 2x)' : isVC ? '(VC 1.5x)' : ''}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {activeSnapshot.liveFantasyPoints[activeSnapshot.striker.playerId] || 0} pts
                        </span>
                      </div>
                      <div className="text-sm font-black text-white mt-1 truncate">
                        {activeSnapshot.striker.name}
                      </div>
                      <div className="text-lg font-black text-white font-mono mt-0.5">
                        {activeSnapshot.striker.runs} <span className="text-xs font-normal text-slate-400">({activeSnapshot.striker.balls}b, {activeSnapshot.striker.fours}x4, {activeSnapshot.striker.sixes}x6)</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        SR: {activeSnapshot.striker.strikeRate}
                      </div>
                    </div>
                  );
                })()}

                {/* Non-Striker */}
                {(() => {
                  const isUserPlayer = userXIIds.includes(activeSnapshot.nonStriker.playerId);
                  const isC = humanTeam.captain === activeSnapshot.nonStriker.playerId;
                  const isVC = humanTeam.vice_captain === activeSnapshot.nonStriker.playerId;

                  return (
                    <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-400 font-mono">NON-STRIKER</span>
                          {isUserPlayer && (
                            <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black px-1.5 py-0.2 rounded font-mono border border-emerald-500/30">
                              MY XI {isC ? '(C 2x)' : isVC ? '(VC 1.5x)' : ''}
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          {activeSnapshot.liveFantasyPoints[activeSnapshot.nonStriker.playerId] || 0} pts
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white mt-1 truncate">
                        {activeSnapshot.nonStriker.name}
                      </div>
                      <div className="text-base font-black text-slate-200 font-mono mt-0.5">
                        {activeSnapshot.nonStriker.runs} <span className="text-xs font-normal text-slate-400">({activeSnapshot.nonStriker.balls}b)</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        SR: {activeSnapshot.nonStriker.strikeRate}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Bowler Card */}
              {(() => {
                const isUserPlayer = userXIIds.includes(activeSnapshot.bowler.playerId);
                const isC = humanTeam.captain === activeSnapshot.bowler.playerId;
                const isVC = humanTeam.vice_captain === activeSnapshot.bowler.playerId;

                return (
                  <div className="bg-slate-900/90 rounded-xl p-3 border border-indigo-900/60 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-indigo-400 font-mono font-bold">BOWLING</span>
                        {isUserPlayer && (
                          <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-black px-1.5 py-0.2 rounded font-mono border border-emerald-500/30">
                            MY XI {isC ? '(C 2x)' : isVC ? '(VC 1.5x)' : ''}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-black text-white">{activeSnapshot.bowler.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        Economy: {activeSnapshot.bowler.economy} rpo
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-black text-white font-mono">
                        {activeSnapshot.bowler.wickets}/{activeSnapshot.bowler.runs}
                        <span className="text-xs font-normal text-slate-400 ml-1.5">
                          ({activeSnapshot.bowler.overs} ov)
                        </span>
                      </div>
                      <div className="text-xs font-mono text-emerald-400 font-bold">
                        {activeSnapshot.liveFantasyPoints[activeSnapshot.bowler.playerId] || 0} pts
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Ball Commentary Feed */}
            <div className="bg-[#050c1e] rounded-2xl border border-indigo-950 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-indigo-950">
                <span className="font-bold uppercase font-mono text-amber-400">Live Ball Commentary</span>
                <span className="text-[10px] text-slate-500 font-mono">Ball {currentStep + 1} of {snapshots.length}</span>
              </div>

              <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1 text-xs">
                {recentEvents.map((snap, idx) => (
                  <div
                    key={snap.ballIndex}
                    className={`p-2.5 rounded-xl border transition ${
                      snap.ballIndex === activeSnapshot.ballIndex
                        ? 'bg-slate-900 border-amber-500/40 shadow-sm'
                        : 'bg-slate-950/40 border-slate-900 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[11px] mb-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-amber-400">{snap.oversFormatted} ov</span>
                        <span className="text-slate-500">·</span>
                        <span className="text-slate-300 font-sans">{snap.bowler.shortName} to {snap.striker.shortName}</span>
                      </div>

                      {snap.outcome.isWicket ? (
                        <span className="bg-rose-500 text-white px-2 py-0.5 rounded font-black text-[10px]">
                          🔴 WICKET
                        </span>
                      ) : snap.outcome.isSix ? (
                        <span className="bg-purple-600 text-white px-2 py-0.5 rounded font-black text-[10px]">
                          🔥 SIX
                        </span>
                      ) : snap.outcome.isFour ? (
                        <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded font-black text-[10px]">
                          ⚡ FOUR
                        </span>
                      ) : (
                        <span className="font-bold text-slate-400">
                          {snap.outcome.runs} run{snap.outcome.runs === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-200 font-medium leading-relaxed">
                      {snap.outcome.commentary}
                    </p>
                  </div>
                ))}
                <div ref={commentaryEndRef} />
              </div>
            </div>
          </div>

          {/* Right Column: Live Fantasy Points Tracker */}
          <div className="space-y-4">
            <div className="bg-[#050c1e] rounded-2xl border border-indigo-950 p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-indigo-950">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold font-mono text-emerald-400 uppercase">
                    Live Fantasy Tracker
                  </span>
                </div>
                <span className="bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  {activeUserPlayersInMatch.length} of your players
                </span>
              </div>

              {/* Total User Score Highlight Card */}
              <div className="bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 rounded-xl p-3.5 text-center">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Your XI Match Total</div>
                <div className="text-3xl font-black text-emerald-400 font-mono mt-0.5">
                  {userLiveMatchPoints} <span className="text-xs font-normal text-slate-400">pts</span>
                </div>
                <div className="text-[11px] text-slate-300 mt-1">
                  Points calculate and update with every ball bowled!
                </div>
              </div>

              {/* Player by Player Breakdown */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {activeUserPlayersInMatch.length === 0 ? (
                  <div className="text-xs text-slate-500 p-4 text-center italic">
                    None of your starting 11 are playing in this match. You can still watch the live simulation and enjoy the matchday action!
                  </div>
                ) : (
                  activeUserPlayersInMatch.map(p => {
                    const isC = humanTeam.captain === p.id;
                    const isVC = humanTeam.vice_captain === p.id;
                    const livePts = activeSnapshot.liveFantasyPoints[p.id] || 0;

                    return (
                      <div
                        key={p.id}
                        className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5 truncate max-w-[140px]">
                          <div className="font-bold text-white truncate flex items-center gap-1.5">
                            <span className="truncate">{p.name}</span>
                            {isC && (
                              <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-1 rounded font-mono">
                                C
                              </span>
                            )}
                            {isVC && (
                              <span className="bg-cyan-500 text-slate-950 font-black text-[9px] px-1 rounded font-mono">
                                VC
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {p.role} • {p.teamAffiliation}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-black text-emerald-400 font-mono text-sm">
                            {livePts} pts
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Pitch & Weather Info Card */}
            <div className="bg-[#050c1e] rounded-2xl border border-indigo-950 p-4 text-xs font-mono space-y-2">
              <div className="font-bold text-slate-300 flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-400" />
                <span>Surface: {pitchReport.condition}</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                {pitchReport.pitchDescription}
              </p>
              <div className="text-[10px] text-slate-500">
                Toss: {tossWinner.name} won &amp; elected to {tossDecision}
              </div>
            </div>
          </div>
        </div>

        {/* Finished Game Overlay Banner / Action */}
        {isFinished && (
          <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 shadow-2xl">
            <div>
              <div className="text-xs font-mono font-black uppercase tracking-wider">
                MATCH CONCLUDED
              </div>
              <div className="text-base sm:text-lg font-black">
                {finalResult.margin} • POTM: {finalResult.playerOfTheMatch.name}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => openScorecardModal(fixture)}
                className="bg-slate-950 hover:bg-slate-900 text-amber-300 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer min-h-[44px]"
              >
                Official Scorecard
              </button>
              <button
                onClick={onClose}
                className="bg-slate-950 hover:bg-slate-900 text-white font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer min-h-[44px]"
              >
                Return to Matches
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
