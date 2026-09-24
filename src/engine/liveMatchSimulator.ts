import {
  BatterScore,
  BoosterId,
  BowlerScore,
  Fixture,
  InningsScorecard,
  MatchPitchReport,
  MatchSimulationResult,
  Player,
  PlayerFantasyBreakdown,
  Team,
  TossDecision
} from '../types/fantasy';
import { ALL_PLAYERS, getPlayerById } from '../data/players';
import { calculateFantasyBreakdown } from './scoring';
import { generatePitchReport } from './simulator';

export interface LiveBallOutcome {
  runs: number;
  isWicket: boolean;
  wicketType?: 'bowled' | 'lbw' | 'caught' | 'runout';
  wicketDesc?: string;
  isFour: boolean;
  isSix: boolean;
  isDot: boolean;
  commentary: string;
}

export interface LiveBatterState extends BatterScore {
  isStriker: boolean;
}

export interface LiveBallSnapshot {
  ballIndex: number;
  innings: 1 | 2;
  battingTeamId: string;
  bowlingTeamId: string;
  battingTeamName: string;
  bowlingTeamName: string;
  overNumber: number; // 0 to 19
  ballInOver: number; // 1 to 6
  oversFormatted: string; // e.g. "14.3"
  currentRuns: number;
  currentWickets: number;
  targetRuns: number | null;
  requiredRuns: number | null;
  ballsRemaining: number;
  currentRunRate: number;
  requiredRunRate: number | null;
  striker: LiveBatterState;
  nonStriker: LiveBatterState;
  bowler: BowlerScore;
  outcome: LiveBallOutcome;
  recentBallsInOver: string[]; // e.g. ["1", "4", "•", "W", "6"]
  fallOfWickets: string[];
  keyMoments: { over: string; description: string; type: string }[];
  liveFantasyPoints: { [playerId: string]: number };
  fantasyDeltas: { playerId: string; points: number; reason: string }[];
  isMatchFinished: boolean;
  finalResult?: MatchSimulationResult;
}

export function generateLiveMatchSimulation(
  fixture: Fixture,
  team1: Team,
  team2: Team,
  customPitchReport?: MatchPitchReport,
  activeBooster?: BoosterId | null
): {
  pitchReport: MatchPitchReport;
  tossWinner: Team;
  tossDecision: TossDecision;
  battingFirstTeam: Team;
  bowlingFirstTeam: Team;
  snapshots: LiveBallSnapshot[];
  finalResult: MatchSimulationResult;
} {
  const pitchReport = customPitchReport || generatePitchReport(fixture.venue);

  // 1. Toss
  const tossWinner = Math.random() > 0.5 ? team1 : team2;
  const tossLoser = tossWinner.id === team1.id ? team2 : team1;

  let tossDecision: TossDecision = 'Bowl';
  if (pitchReport.dew === 'No Dew' && pitchReport.condition === 'Dry Turner') {
    tossDecision = Math.random() > 0.35 ? 'Bat' : 'Bowl';
  } else if (pitchReport.dew === 'Heavy Dew') {
    tossDecision = 'Bowl';
  } else {
    tossDecision = Math.random() > 0.25 ? 'Bowl' : 'Bat';
  }

  const battingFirstTeam = tossDecision === 'Bat' ? tossWinner : tossLoser;
  const bowlingFirstTeam = battingFirstTeam.id === team1.id ? team2 : team1;

  // Impact Player dynamic designation
  const team1SubId = battingFirstTeam.impact_sub || battingFirstTeam.substitutes[0] || battingFirstTeam.roster[11];
  const team2SubId = bowlingFirstTeam.impact_sub || bowlingFirstTeam.substitutes[0] || bowlingFirstTeam.roster[11];

  const impactSubUsed: MatchSimulationResult['impactSubUsed'] = {
    [battingFirstTeam.id]: {
      inPlayerId: team1SubId,
      outPlayerId: battingFirstTeam.playing_xi[10] || battingFirstTeam.playing_xi[9],
      reason: 'Tactical batting reinforcement for middle/death overs'
    },
    [bowlingFirstTeam.id]: {
      inPlayerId: team2SubId,
      outPlayerId: bowlingFirstTeam.playing_xi[10] || bowlingFirstTeam.playing_xi[9],
      reason: 'Specialist bowling reinforcement'
    }
  };

  const snapshots: LiveBallSnapshot[] = [];
  const fieldingEvents: { [playerId: string]: { catches: number; stumpings: number; runOutDirect: number; runOutShared: number } } = {};

  const recordFielding = (pId: string, type: 'catch' | 'stumping' | 'roDirect') => {
    if (!fieldingEvents[pId]) {
      fieldingEvents[pId] = { catches: 0, stumpings: 0, runOutDirect: 0, runOutShared: 0 };
    }
    if (type === 'catch') fieldingEvents[pId].catches += 1;
    if (type === 'stumping') fieldingEvents[pId].stumpings += 1;
    if (type === 'roDirect') fieldingEvents[pId].runOutDirect += 1;
  };

  // Helper to get fantasy points snapshot
  const computeLiveFantasyMap = (
    battersMap1: { [pId: string]: BatterScore },
    bowlersMap1: { [pId: string]: BowlerScore },
    battersMap2: { [pId: string]: BatterScore },
    bowlersMap2: { [pId: string]: BowlerScore }
  ): { [pId: string]: number } => {
    const pts: { [pId: string]: number } = {};

    [team1, team2].forEach(team => {
      const isTeamBatFirst = team.id === battingFirstTeam.id;
      const batScores = isTeamBatFirst ? battersMap1 : battersMap2;
      const bowlScores = isTeamBatFirst ? bowlersMap2 : bowlersMap1;

      const activeIds = Array.from(new Set([...team.playing_xi, team.impact_sub]));
      activeIds.forEach(pId => {
        const player = getPlayerById(pId);
        if (!player) return;

        let boosterMult = 1.0;
        if (team.is_human && activeBooster) {
          if (activeBooster === 'triple_captain' && team.captain === pId) boosterMult = 1.5;
          else if (activeBooster === 'double_power') boosterMult = 2.0;
          else if (activeBooster === 'indian_warrior' && player.nationality === 'IND') boosterMult = 2.0;
          else if (activeBooster === 'foreign_stars' && player.nationality === 'OVERSEAS') boosterMult = 2.0;
          else if (activeBooster === 'power_striker' && player.role === 'BAT') boosterMult = 2.0;
          else if (activeBooster === 'strike_force' && player.role === 'BOWL') boosterMult = 2.0;
          else if (activeBooster === 'allround_marvel' && player.role === 'AR') boosterMult = 2.0;
        }

        const breakdown = calculateFantasyBreakdown({
          playerId: pId,
          playerName: player.name,
          teamId: team.id,
          role: player.role,
          isCaptain: team.captain === pId,
          isViceCaptain: team.vice_captain === pId,
          boosterMultiplier: boosterMult,
          batterScore: batScores[pId],
          bowlerScore: bowlScores[pId],
          fielding: fieldingEvents[pId]
        });

        pts[pId] = breakdown.finalPoints;
      });
    });

    return pts;
  };

  // Helper to simulate an innings ball-by-ball
  function simulateLiveInnings(params: {
    inningsNum: 1 | 2;
    battingTeam: Team;
    bowlingTeam: Team;
    target: number | null;
    battersScoresInnings1?: { [pId: string]: BatterScore };
    bowlersScoresInnings1?: { [pId: string]: BowlerScore };
  }): {
    scorecard: InningsScorecard;
    battersMap: { [pId: string]: BatterScore };
    bowlersMap: { [pId: string]: BowlerScore };
    fallOfWickets: string[];
    keyMoments: InningsScorecard['keyMoments'];
  } {
    const { inningsNum, battingTeam, bowlingTeam, target, battersScoresInnings1, bowlersScoresInnings1 } = params;

    const battingPlayers = battingTeam.playing_xi
      .map(id => getPlayerById(id))
      .filter((p): p is Player => p !== undefined);

    const bowlingCandidates = bowlingTeam.playing_xi
      .map(id => getPlayerById(id))
      .filter((p): p is Player => p !== undefined);

    const primaryBowlers = bowlingCandidates
      .filter(p => p.role === 'BOWL' || p.role === 'AR')
      .sort((a, b) => b.bowlingRating - a.bowlingRating);

    while (primaryBowlers.length < 5 && bowlingCandidates.length > primaryBowlers.length) {
      const fallback = bowlingCandidates.find(c => !primaryBowlers.some(pb => pb.id === c.id));
      if (fallback) primaryBowlers.push(fallback);
      else break;
    }

    const battersScores: { [playerId: string]: BatterScore } = {};
    battingPlayers.forEach((p, idx) => {
      battersScores[p.id] = {
        playerId: p.id,
        name: p.name,
        shortName: p.shortName,
        role: p.role,
        runs: 0,
        balls: 0,
        fours: 0,
        sixes: 0,
        strikeRate: 0,
        dismissal: 'not out',
        isOut: false,
        battingPosition: idx + 1
      };
    });

    const bowlersScores: { [playerId: string]: BowlerScore } = {};
    primaryBowlers.slice(0, 5).forEach(b => {
      bowlersScores[b.id] = {
        playerId: b.id,
        name: b.name,
        shortName: b.shortName,
        role: b.role,
        overs: 0,
        maidens: 0,
        runs: 0,
        wickets: 0,
        economy: 0,
        bowledOrLbwCount: 0
      };
    });

    const activeBowlers = primaryBowlers.slice(0, 5);
    const bowlerQuota: { [bId: string]: number } = {};
    activeBowlers.forEach(b => { bowlerQuota[b.id] = 4; });

    let totalRuns = 0;
    let wicketsFallen = 0;
    let legalBalls = 0;
    let currentBatter1Idx = 0;
    let currentBatter2Idx = 1;
    let nextBatterIdx = 2;

    const fallOfWickets: string[] = [];
    const keyMoments: InningsScorecard['keyMoments'] = [];

    // Over loop
    for (let over = 1; over <= 20; over++) {
      if (wicketsFallen >= 10) break;
      if (target !== null && totalRuns >= target) break;

      const isPowerplay = over <= 6;
      const isDeath = over >= 16;
      const isMiddle = !isPowerplay && !isDeath;

      const availableBowlers = activeBowlers.filter(b => bowlerQuota[b.id] > 0);
      if (availableBowlers.length === 0) break;

      let chosenBowler = availableBowlers[0];
      if (isPowerplay) {
        chosenBowler = availableBowlers.find(b => b.bowlingRating > 88) || availableBowlers[0];
      } else if (isMiddle) {
        chosenBowler = availableBowlers.find(b => b.role === 'BOWL' || b.role === 'AR') || availableBowlers[0];
      } else if (isDeath) {
        chosenBowler = availableBowlers.find(b => b.clutchFactor >= 8) || availableBowlers[availableBowlers.length - 1];
      }

      bowlerQuota[chosenBowler.id] -= 1;
      const bowlerStat = bowlersScores[chosenBowler.id];
      let overRuns = 0;
      const recentBallsInThisOver: string[] = [];

      for (let ball = 1; ball <= 6; ball++) {
        if (wicketsFallen >= 10) break;
        if (target !== null && totalRuns >= target) break;

        legalBalls++;
        const currentStrikerPlayer = battingPlayers[currentBatter1Idx] || battingPlayers[0];
        const strikerStat = battersScores[currentStrikerPlayer.id];
        strikerStat.balls += 1;

        const currentNonStrikerPlayer = battingPlayers[currentBatter2Idx] || battingPlayers[1];
        const nonStrikerStat = battersScores[currentNonStrikerPlayer.id];

        const batRating = currentStrikerPlayer.battingRating;
        const bowlRating = chosenBowler.bowlingRating;
        const netEdge = (batRating - bowlRating) / 100;

        let pDot = 0.35 - netEdge * 0.15;
        let pSingle = 0.32 + netEdge * 0.05;
        let pTwoThree = 0.08;
        let pFour = 0.12 + (currentStrikerPlayer.strikeRateRating > 90 ? 0.04 : 0);
        let pSix = 0.06 + (currentStrikerPlayer.strikeRateRating > 92 ? 0.03 : 0);
        let pWicket = 0.07 - netEdge * 0.03;

        if (isPowerplay) {
          pFour += 0.04;
          pDot += 0.03;
        } else if (isDeath) {
          pSix += 0.05;
          pFour += 0.03;
          pWicket += 0.04;
          pDot -= 0.05;
        }

        const roll = Math.random();
        let outcomeRuns = 0;
        let isWicket = false;
        let isFour = false;
        let isSix = false;
        let isDot = false;
        let commentary = '';
        const fantasyDeltas: { playerId: string; points: number; reason: string }[] = [];

        const overFormatted = `${over - 1}.${ball}`;

        if (roll < pWicket) {
          // WICKET
          isWicket = true;
          wicketsFallen++;
          bowlerStat.wickets += 1;
          strikerStat.isOut = true;

          const dRoll = Math.random();
          let dismissalDesc = '';
          if (dRoll < 0.25) {
            dismissalDesc = `b ${chosenBowler.shortName}`;
            bowlerStat.bowledOrLbwCount += 1;
            commentary = `OUT! Clean bowled! ${chosenBowler.shortName} breaches the defence with a scorching delivery!`;
            fantasyDeltas.push({ playerId: chosenBowler.id, points: 33, reason: 'Wicket + Bowled Bonus' });
          } else if (dRoll < 0.45) {
            dismissalDesc = `lbw b ${chosenBowler.shortName}`;
            bowlerStat.bowledOrLbwCount += 1;
            commentary = `OUT! Trapped right in front! Big appeal from ${chosenBowler.shortName} and the umpire raises the finger!`;
            fantasyDeltas.push({ playerId: chosenBowler.id, points: 33, reason: 'Wicket + LBW Bonus' });
          } else {
            const catchers = bowlingTeam.playing_xi
              .map(id => getPlayerById(id))
              .filter((p): p is Player => p !== undefined && p.id !== chosenBowler.id);
            const catcher = catchers[Math.floor(Math.random() * catchers.length)] || chosenBowler;
            dismissalDesc = `c ${catcher.shortName} b ${chosenBowler.shortName}`;
            recordFielding(catcher.id, 'catch');
            commentary = `OUT! Sliced in the air and taken! ${catcher.shortName} holds on cleanly off ${chosenBowler.shortName}'s bowling!`;
            fantasyDeltas.push({ playerId: chosenBowler.id, points: 25, reason: 'Wicket (+25)' });
            fantasyDeltas.push({ playerId: catcher.id, points: 8, reason: 'Catch (+8)' });
          }

          strikerStat.dismissal = dismissalDesc;
          fallOfWickets.push(`${wicketsFallen}-${totalRuns} (${currentStrikerPlayer.shortName}, ${overFormatted} ov)`);
          recentBallsInThisOver.push('W');

          keyMoments.push({
            over: overFormatted,
            description: `WICKET! ${currentStrikerPlayer.name} (${strikerStat.runs} runs) ${dismissalDesc}`,
            type: 'wicket'
          });

          // Next batter in
          if (nextBatterIdx < battingPlayers.length) {
            currentBatter1Idx = nextBatterIdx;
            nextBatterIdx++;
          }
        } else if (roll < pWicket + pSix) {
          // SIX
          isSix = true;
          outcomeRuns = 6;
          strikerStat.runs += 6;
          strikerStat.sixes += 1;
          overRuns += 6;
          totalRuns += 6;
          recentBallsInThisOver.push('6');
          commentary = `🔥 SIX! ${currentStrikerPlayer.shortName} hammers ${chosenBowler.shortName} over deep mid-wicket into the stands!`;
          fantasyDeltas.push({ playerId: currentStrikerPlayer.id, points: 8, reason: '+6 runs, +2 six bonus' });
        } else if (roll < pWicket + pSix + pFour) {
          // FOUR
          isFour = true;
          outcomeRuns = 4;
          strikerStat.runs += 4;
          strikerStat.fours += 1;
          overRuns += 4;
          totalRuns += 4;
          recentBallsInThisOver.push('4');
          commentary = `⚡ FOUR! Cracking shot through extra cover by ${currentStrikerPlayer.shortName}! Beats the diving fielder.`;
          fantasyDeltas.push({ playerId: currentStrikerPlayer.id, points: 5, reason: '+4 runs, +1 boundary bonus' });
        } else if (roll < pWicket + pSix + pFour + pTwoThree) {
          // TWO
          outcomeRuns = 2;
          strikerStat.runs += 2;
          overRuns += 2;
          totalRuns += 2;
          recentBallsInThisOver.push('2');
          commentary = `Good running between wickets! ${currentStrikerPlayer.shortName} pushes into the deep for two.`;
          fantasyDeltas.push({ playerId: currentStrikerPlayer.id, points: 2, reason: '+2 runs' });
        } else if (roll < pWicket + pSix + pFour + pTwoThree + pSingle) {
          // SINGLE
          outcomeRuns = 1;
          strikerStat.runs += 1;
          overRuns += 1;
          totalRuns += 1;
          recentBallsInThisOver.push('1');
          commentary = `Tucked away towards mid-on for a brisk single by ${currentStrikerPlayer.shortName}.`;
          fantasyDeltas.push({ playerId: currentStrikerPlayer.id, points: 1, reason: '+1 run' });

          // Rotate strike
          const temp = currentBatter1Idx;
          currentBatter1Idx = currentBatter2Idx;
          currentBatter2Idx = temp;
        } else {
          // DOT
          isDot = true;
          outcomeRuns = 0;
          recentBallsInThisOver.push('•');
          commentary = `No run. Good length ball from ${chosenBowler.shortName}, solid defensive stroke.`;
        }

        // Update strike rate
        strikerStat.strikeRate = strikerStat.balls > 0 ? Math.round((strikerStat.runs / strikerStat.balls) * 1000) / 10 : 0;
        nonStrikerStat.strikeRate = nonStrikerStat.balls > 0 ? Math.round((nonStrikerStat.runs / nonStrikerStat.balls) * 1000) / 10 : 0;

        bowlerStat.runs += outcomeRuns;
        const ballsBowled = (bowlerStat.overs * 6) + ball;
        bowlerStat.economy = ballsBowled > 0 ? Math.round((bowlerStat.runs / (ballsBowled / 6)) * 100) / 100 : 0;

        // Cumulative fantasy map for snapshot
        const b1 = inningsNum === 1 ? battersScores : (battersScoresInnings1 || {});
        const bw1 = inningsNum === 1 ? bowlersScores : (bowlersScoresInnings1 || {});
        const b2 = inningsNum === 2 ? battersScores : {};
        const bw2 = inningsNum === 2 ? bowlersScores : {};
        const livePts = computeLiveFantasyMap(b1, bw1, b2, bw2);

        const ballsRemaining = Math.max(0, 120 - legalBalls);
        const crr = legalBalls > 0 ? Math.round((totalRuns / (legalBalls / 6)) * 100) / 100 : 0;
        const reqRuns = target !== null ? Math.max(0, target - totalRuns) : null;
        const rrr = target !== null && ballsRemaining > 0 ? Math.round((reqRuns! / (ballsRemaining / 6)) * 100) / 100 : null;

        snapshots.push({
          ballIndex: snapshots.length,
          innings: inningsNum,
          battingTeamId: battingTeam.id,
          bowlingTeamId: bowlingTeam.id,
          battingTeamName: battingTeam.name,
          bowlingTeamName: bowlingTeam.name,
          overNumber: over - 1,
          ballInOver: ball,
          oversFormatted: overFormatted,
          currentRuns: totalRuns,
          currentWickets: wicketsFallen,
          targetRuns: target,
          requiredRuns: reqRuns,
          ballsRemaining,
          currentRunRate: crr,
          requiredRunRate: rrr,
          striker: { ...strikerStat, isStriker: true },
          nonStriker: { ...nonStrikerStat, isStriker: false },
          bowler: { ...bowlerStat },
          outcome: {
            runs: outcomeRuns,
            isWicket,
            isFour,
            isSix,
            isDot,
            commentary
          },
          recentBallsInOver: [...recentBallsInThisOver],
          fallOfWickets: [...fallOfWickets],
          keyMoments: [...keyMoments],
          liveFantasyPoints: livePts,
          fantasyDeltas,
          isMatchFinished: false
        });
      }

      // Conclude over: maidens & over counter
      bowlerStat.overs += 1;
      if (overRuns === 0) {
        bowlerStat.maidens += 1;
      }

      // End of over strike rotation
      const swap = currentBatter1Idx;
      currentBatter1Idx = currentBatter2Idx;
      currentBatter2Idx = swap;
    }

    const completedOvers = Math.floor(legalBalls / 6) + (legalBalls % 6) / 10;

    return {
      scorecard: {
        teamId: battingTeam.id,
        teamName: battingTeam.name,
        totalRuns,
        wickets: wicketsFallen,
        overs: completedOvers,
        batters: Object.values(battersScores),
        bowlers: Object.values(bowlersScores),
        extras: Math.floor(totalRuns * 0.04),
        fallOfWickets,
        keyMoments
      },
      battersMap: battersScores,
      bowlersMap: bowlersScores,
      fallOfWickets,
      keyMoments
    };
  }

  // Simulate Innings 1
  const inn1Result = simulateLiveInnings({
    inningsNum: 1,
    battingTeam: battingFirstTeam,
    bowlingTeam: bowlingFirstTeam,
    target: null
  });

  // Simulate Innings 2 (Chasing innings1 total + 1)
  const target = inn1Result.scorecard.totalRuns + 1;
  const inn2Result = simulateLiveInnings({
    inningsNum: 2,
    battingTeam: bowlingFirstTeam,
    bowlingTeam: battingFirstTeam,
    target,
    battersScoresInnings1: inn1Result.battersMap,
    bowlersScoresInnings1: inn1Result.bowlersMap
  });

  // Determine winner and margin
  let winnerTeamId = '';
  let margin = '';

  if (inn2Result.scorecard.totalRuns >= target) {
    winnerTeamId = bowlingFirstTeam.id;
    const wicketsLeft = 10 - inn2Result.scorecard.wickets;
    margin = `${bowlingFirstTeam.name} won by ${wicketsLeft} wicket${wicketsLeft > 1 ? 's' : ''}`;
  } else if (inn2Result.scorecard.totalRuns === inn1Result.scorecard.totalRuns) {
    winnerTeamId = Math.random() > 0.5 ? battingFirstTeam.id : bowlingFirstTeam.id;
    const superWinnerName = winnerTeamId === battingFirstTeam.id ? battingFirstTeam.name : bowlingFirstTeam.name;
    margin = `Match Tied! ${superWinnerName} won via Super Over`;
  } else {
    winnerTeamId = battingFirstTeam.id;
    const runMargin = inn1Result.scorecard.totalRuns - inn2Result.scorecard.totalRuns;
    margin = `${battingFirstTeam.name} won by ${runMargin} run${runMargin > 1 ? 's' : ''}`;
  }

  // Calculate final official fantasy points
  const finalFantasyScores: { [pId: string]: PlayerFantasyBreakdown } = {};
  const teamFantasyTotals: { [teamId: string]: number } = {
    [team1.id]: 0,
    [team2.id]: 0
  };

  [team1, team2].forEach(team => {
    const isTeamBatFirst = team.id === battingFirstTeam.id;
    const batInnings = isTeamBatFirst ? inn1Result.scorecard : inn2Result.scorecard;
    const bowlInnings = isTeamBatFirst ? inn2Result.scorecard : inn1Result.scorecard;

    const allActiveIds = Array.from(new Set([...team.playing_xi, team.impact_sub]));
    allActiveIds.forEach(pId => {
      const player = getPlayerById(pId);
      if (!player) return;

      const batterScore = batInnings.batters.find(b => b.playerId === pId);
      const bowlerScore = bowlInnings.bowlers.find(b => b.playerId === pId);
      const fielding = fieldingEvents[pId] || { catches: 0, stumpings: 0, runOutDirect: 0, runOutShared: 0 };

      let boosterMult = 1.0;
      if (team.is_human && activeBooster) {
        if (activeBooster === 'triple_captain' && team.captain === pId) boosterMult = 1.5;
        else if (activeBooster === 'double_power') boosterMult = 2.0;
        else if (activeBooster === 'indian_warrior' && player.nationality === 'IND') boosterMult = 2.0;
        else if (activeBooster === 'foreign_stars' && player.nationality === 'OVERSEAS') boosterMult = 2.0;
        else if (activeBooster === 'power_striker' && player.role === 'BAT') boosterMult = 2.0;
        else if (activeBooster === 'strike_force' && player.role === 'BOWL') boosterMult = 2.0;
        else if (activeBooster === 'allround_marvel' && player.role === 'AR') boosterMult = 2.0;
      }

      const breakdown = calculateFantasyBreakdown({
        playerId: pId,
        playerName: player.name,
        teamId: team.id,
        role: player.role,
        isCaptain: team.captain === pId,
        isViceCaptain: team.vice_captain === pId,
        boosterMultiplier: boosterMult,
        batterScore,
        bowlerScore,
        fielding
      });

      finalFantasyScores[pId] = breakdown;
      teamFantasyTotals[team.id] += breakdown.finalPoints;
    });
  });

  // Pick Player of the Match
  let potmId = '';
  let highestRaw = -999;
  Object.values(finalFantasyScores).forEach(fb => {
    if (fb.rawTotal > highestRaw) {
      highestRaw = fb.rawTotal;
      potmId = fb.playerId;
    }
  });
  const potmPlayer = getPlayerById(potmId) || ALL_PLAYERS[0];
  const potmBreakdown = finalFantasyScores[potmId];

  let potmSummary = 'All-round match winning performance';
  if (potmBreakdown?.battingPoints.runs >= 50 && potmBreakdown?.bowlingPoints.wickets >= 2) {
    potmSummary = `${potmBreakdown.battingPoints.runs} runs & ${potmBreakdown.bowlingPoints.wickets / 25} wickets`;
  } else if (potmBreakdown?.battingPoints.runs >= 40) {
    potmSummary = `${potmBreakdown.battingPoints.runs} runs (${potmBreakdown.battingPoints.fours}x4, ${potmBreakdown.battingPoints.sixes}x6)`;
  } else if (potmBreakdown?.bowlingPoints.wickets >= 3) {
    potmSummary = `${potmBreakdown.bowlingPoints.wickets / 25} wickets haul`;
  }

  const finalResult: MatchSimulationResult = {
    fixtureId: fixture.id,
    matchday: fixture.matchday,
    venue: fixture.venue,
    pitchReport,
    tossWinnerId: tossWinner.id,
    tossDecision,
    team1Id: team1.id,
    team2Id: team2.id,
    innings1: inn1Result.scorecard,
    innings2: inn2Result.scorecard,
    winnerTeamId,
    margin,
    playerOfTheMatch: {
      playerId: potmPlayer.id,
      name: potmPlayer.name,
      summary: potmSummary
    },
    impactSubUsed,
    fantasyScores: finalFantasyScores,
    teamFantasyTotals
  };

  // Mark the final snapshot as finished with finalResult
  if (snapshots.length > 0) {
    snapshots[snapshots.length - 1].isMatchFinished = true;
    snapshots[snapshots.length - 1].finalResult = finalResult;
  }

  return {
    pitchReport,
    tossWinner,
    tossDecision,
    battingFirstTeam,
    bowlingFirstTeam,
    snapshots,
    finalResult
  };
}
