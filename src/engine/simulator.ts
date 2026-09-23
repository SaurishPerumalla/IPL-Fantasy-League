import {
  BatterScore,
  BoosterId,
  BowlerScore,
  DewFactor,
  FieldingEvent,
  Fixture,
  InningsScorecard,
  MatchPitchReport,
  MatchSimulationResult,
  PitchCondition,
  Player,
  PlayerFantasyBreakdown,
  Team,
  TossDecision
} from '../types/fantasy';
import { ALL_PLAYERS, getPlayerById } from '../data/players';
import { calculateFantasyBreakdown } from './scoring';

export const PITCH_TYPES: { condition: PitchCondition; desc: string; baseScore: number; spinModifier: number; paceModifier: number; batModifier: number }[] = [
  {
    condition: 'Flat Track',
    desc: 'True bounce, short boundaries, highway wicket. High scoring belter.',
    baseScore: 205,
    spinModifier: 0.9,
    paceModifier: 0.95,
    batModifier: 1.25
  },
  {
    condition: 'Sticky Wicket',
    desc: 'Two-paced surface holding up off the deck. Variable bounce and cutters grip.',
    baseScore: 155,
    spinModifier: 1.2,
    paceModifier: 1.15,
    batModifier: 0.8
  },
  {
    condition: 'Dry Turner',
    desc: 'Dry, abrasive crust with generous turn and puff of dust. Spin heaven.',
    baseScore: 165,
    spinModifier: 1.35,
    paceModifier: 0.9,
    batModifier: 0.85
  },
  {
    condition: 'Green Seamer',
    desc: 'Lush grass covering providing prodigious nip and early swing under lights.',
    baseScore: 160,
    spinModifier: 0.8,
    paceModifier: 1.35,
    batModifier: 0.85
  },
  {
    condition: 'Balanced Surface',
    desc: 'Fair contest between bat and ball with steady carry and even bounce.',
    baseScore: 180,
    spinModifier: 1.0,
    paceModifier: 1.0,
    batModifier: 1.0
  }
];

export const DEW_FACTORS: DewFactor[] = ['Heavy Dew', 'Moderate Dew', 'No Dew'];

export function generatePitchReport(venue: string): MatchPitchReport {
  const chosenPitch = PITCH_TYPES[Math.floor(Math.random() * PITCH_TYPES.length)];
  const dew = DEW_FACTORS[Math.floor(Math.random() * DEW_FACTORS.length)];

  let avgScore = chosenPitch.baseScore;
  if (venue.includes('Chinnaswamy') || venue.includes('Wankhede')) avgScore += 15;
  if (venue.includes('Ekana') || venue.includes('Chepauk')) avgScore -= 10;
  if (dew === 'Heavy Dew') avgScore += 10;

  return {
    venue,
    city: venue.split(',')[1]?.trim() || 'India',
    condition: chosenPitch.condition,
    dew,
    avgFirstInningsScore: avgScore,
    pitchDescription: chosenPitch.desc
  };
}

interface SimulatedOverSummary {
  overNumber: number;
  runs: number;
  wickets: number;
  bowlerId: string;
  batterOnStrikeId: string;
  isMaiden: boolean;
  commentaryNotes: string[];
}

export function simulateT20Match(
  fixture: Fixture,
  team1: Team,
  team2: Team,
  customPitchReport?: MatchPitchReport,
  activeBooster?: BoosterId | null
): MatchSimulationResult {
  const pitchReport = customPitchReport || generatePitchReport(fixture.venue);

  // 1. Toss
  const tossWinner = Math.random() > 0.5 ? team1 : team2;
  const tossLoser = tossWinner.id === team1.id ? team2 : team1;

  // Toss decision logic
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

  // Impact Player dynamic designation/swap
  const impactSubUsed: MatchSimulationResult['impactSubUsed'] = {};

  // For Batting team 1st innings: swap in a designated batter or top sub if needed
  const team1SubId = battingFirstTeam.impact_sub || battingFirstTeam.substitutes[0] || battingFirstTeam.roster[11];
  const team2SubId = bowlingFirstTeam.impact_sub || bowlingFirstTeam.substitutes[0] || bowlingFirstTeam.roster[11];

  impactSubUsed[battingFirstTeam.id] = {
    inPlayerId: team1SubId,
    outPlayerId: battingFirstTeam.playing_xi[10] || battingFirstTeam.playing_xi[9],
    reason: 'Tactical batting reinforcement for middle/death overs'
  };

  impactSubUsed[bowlingFirstTeam.id] = {
    inPlayerId: team2SubId,
    outPlayerId: bowlingFirstTeam.playing_xi[10] || bowlingFirstTeam.playing_xi[9],
    reason: 'Specialist bowling reinforcement'
  };

  // 2. Simulate Innings 1
  const innings1 = simulateInnings({
    battingTeam: battingFirstTeam,
    bowlingTeam: bowlingFirstTeam,
    pitchReport,
    target: null,
    isSecondInnings: false
  });

  // 3. Simulate Innings 2 (Chasing innings1.totalRuns + 1)
  const target = innings1.totalRuns + 1;
  const innings2 = simulateInnings({
    battingTeam: bowlingFirstTeam,
    bowlingTeam: battingFirstTeam,
    pitchReport,
    target,
    isSecondInnings: true
  });

  // 4. Determine Match Result & Margin
  let winnerTeamId = '';
  let margin = '';

  if (innings2.totalRuns >= target) {
    winnerTeamId = bowlingFirstTeam.id;
    const wicketsLeft = 10 - innings2.wickets;
    margin = `${bowlingFirstTeam.name} won by ${wicketsLeft} wicket${wicketsLeft > 1 ? 's' : ''}`;
  } else if (innings2.totalRuns === innings1.totalRuns) {
    // Super Over tie-breaker simulation
    winnerTeamId = Math.random() > 0.5 ? battingFirstTeam.id : bowlingFirstTeam.id;
    const superWinnerName = winnerTeamId === battingFirstTeam.id ? battingFirstTeam.name : bowlingFirstTeam.name;
    margin = `Match Tied! ${superWinnerName} won via dramatic Super Over`;
  } else {
    winnerTeamId = battingFirstTeam.id;
    const runMargin = innings1.totalRuns - innings2.totalRuns;
    margin = `${battingFirstTeam.name} won by ${runMargin} run${runMargin > 1 ? 's' : ''}`;
  }

  // 5. Compute Fielding Events from Scorecard dismissals
  const fieldingEvents: { [playerId: string]: FieldingEvent } = {};

  const recordFielding = (pId: string, type: 'catch' | 'stumping' | 'roDirect' | 'roShared') => {
    if (!fieldingEvents[pId]) {
      fieldingEvents[pId] = { catches: 0, stumpings: 0, runOutDirect: 0, runOutShared: 0 };
    }
    if (type === 'catch') fieldingEvents[pId].catches += 1;
    if (type === 'stumping') fieldingEvents[pId].stumpings += 1;
    if (type === 'roDirect') fieldingEvents[pId].runOutDirect += 1;
    if (type === 'roShared') fieldingEvents[pId].runOutShared += 1;
  };

  [innings1, innings2].forEach(inn => {
    inn.batters.forEach(b => {
      if (b.dismissal.startsWith('c ')) {
        // e.g. "c Kohli b Bumrah"
        const fielderPart = b.dismissal.split(' b ')[0].replace('c ', '').trim();
        const fielderPlayer = ALL_PLAYERS.find(p => p.name.includes(fielderPart) || p.shortName === fielderPart);
        if (fielderPlayer) recordFielding(fielderPlayer.id, 'catch');
      } else if (b.dismissal.startsWith('st ')) {
        const wkPart = b.dismissal.split(' b ')[0].replace('st ', '').trim();
        const wkPlayer = ALL_PLAYERS.find(p => p.name.includes(wkPart) || p.shortName === wkPart);
        if (wkPlayer) recordFielding(wkPlayer.id, 'stumping');
      } else if (b.dismissal.includes('run out')) {
        const roPart = b.dismissal.replace('run out (', '').replace(')', '').trim();
        const roPlayer = ALL_PLAYERS.find(p => p.name.includes(roPart) || p.shortName === roPart);
        if (roPlayer) recordFielding(roPlayer.id, 'roDirect');
      }
    });
  });

  // 6. Calculate Complete Fantasy Points Breakdown for all participants
  const fantasyScores: { [playerId: string]: PlayerFantasyBreakdown } = {};
  const teamFantasyTotals: { [teamId: string]: number } = {
    [team1.id]: 0,
    [team2.id]: 0
  };

  const calculateForTeam = (team: Team, oppTeam: Team) => {
    const isTeamBatFirst = team.id === battingFirstTeam.id;
    const batInnings = isTeamBatFirst ? innings1 : innings2;
    const bowlInnings = isTeamBatFirst ? innings2 : innings1;

    // Combined active players in playing XI + impact sub
    const allActiveIds = Array.from(new Set([...team.playing_xi, team.impact_sub]));

    allActiveIds.forEach(pId => {
      const player = getPlayerById(pId);
      if (!player) return;

      const batterScore = batInnings.batters.find(b => b.playerId === pId);
      const bowlerScore = bowlInnings.bowlers.find(b => b.playerId === pId);
      const fielding = fieldingEvents[pId] || { catches: 0, stumpings: 0, runOutDirect: 0, runOutShared: 0 };

      // Calculate official booster multiplier if team is human
      let boosterMult = 1.0;
      if (team.is_human && activeBooster) {
        if (activeBooster === 'triple_captain' && team.captain === pId) {
          boosterMult = 1.5; // (2.0x base captain * 1.5 = 3.0x captain points)
        } else if (activeBooster === 'double_power') {
          boosterMult = 2.0; // 2x points for all 11 players
        } else if (activeBooster === 'indian_warrior' && player.nationality === 'IND') {
          boosterMult = 2.0; // 2x points for all Indian players
        } else if (activeBooster === 'foreign_stars' && player.nationality === 'OVERSEAS') {
          boosterMult = 2.0; // 2x points for all Overseas players
        } else if (activeBooster === 'power_striker' && (player.role === 'BAT' || player.role === 'WK')) {
          boosterMult = 2.0; // 2x points for Batters & WKs
        } else if (activeBooster === 'strike_force' && player.role === 'BOWL') {
          boosterMult = 2.0; // 2x points for Bowlers
        } else if (activeBooster === 'allround_marvel' && player.role === 'AR') {
          boosterMult = 2.0; // 2x points for All-Rounders
        } else if (activeBooster === 'super_sub' && team.impact_sub === pId) {
          boosterMult = 2.0; // 2x points for Impact Player
        }
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

      fantasyScores[pId] = breakdown;
      teamFantasyTotals[team.id] = Math.round((teamFantasyTotals[team.id] + breakdown.finalPoints) * 10) / 10;
    });
  };

  calculateForTeam(team1, team2);
  calculateForTeam(team2, team1);

  // 7. Select Player of the Match (highest raw fantasy points or match winner impact)
  let bestPlayerId = '';
  let highestScore = -999;
  Object.values(fantasyScores).forEach(fb => {
    if (fb.rawTotal > highestScore) {
      highestScore = fb.rawTotal;
      bestPlayerId = fb.playerId;
    }
  });

  const potmPlayer = getPlayerById(bestPlayerId) || ALL_PLAYERS[0];
  const potmBreakdown = fantasyScores[bestPlayerId];
  let potmSummary = '';
  if (potmBreakdown?.battingPoints.runs >= 50 && potmBreakdown?.bowlingPoints.wickets >= 2) {
    potmSummary = `${potmBreakdown.battingPoints.runs} runs & ${potmBreakdown.bowlingPoints.wickets / 25} wickets`;
  } else if (potmBreakdown?.battingPoints.runs >= 40) {
    potmSummary = `${potmBreakdown.battingPoints.runs} runs (${potmBreakdown.battingPoints.fours}x4, ${potmBreakdown.battingPoints.sixes}x6)`;
  } else if (potmBreakdown?.bowlingPoints.wickets >= 2) {
    potmSummary = `${potmBreakdown.bowlingPoints.wickets / 25} wickets haul`;
  } else {
    potmSummary = `Clutch match-winning performance`;
  }

  return {
    fixtureId: fixture.id,
    matchday: fixture.matchday,
    venue: fixture.venue,
    pitchReport,
    tossWinnerId: tossWinner.id,
    tossDecision,
    team1Id: team1.id,
    team2Id: team2.id,
    innings1,
    innings2,
    winnerTeamId,
    margin,
    playerOfTheMatch: {
      playerId: potmPlayer.id,
      name: potmPlayer.name,
      summary: potmSummary
    },
    impactSubUsed,
    fantasyScores,
    teamFantasyTotals
  };
}

interface SimulateInningsParams {
  battingTeam: Team;
  bowlingTeam: Team;
  pitchReport: MatchPitchReport;
  target: number | null;
  isSecondInnings: boolean;
}

function simulateInnings(params: SimulateInningsParams): InningsScorecard {
  const { battingTeam, bowlingTeam, pitchReport, target, isSecondInnings } = params;

  // Get batter lineup
  const battingPlayers: Player[] = battingTeam.playing_xi
    .map(id => getPlayerById(id))
    .filter((p): p is Player => p !== undefined);

  // If squad missing, fallback
  if (battingPlayers.length < 11) {
    const filler = ALL_PLAYERS.slice(0, 11);
    battingPlayers.push(...filler.slice(battingPlayers.length));
  }

  // Get bowling lineup (pure bowlers + all-rounders)
  const bowlingCandidates: Player[] = bowlingTeam.playing_xi
    .map(id => getPlayerById(id))
    .filter((p): p is Player => p !== undefined && (p.role === 'BOWL' || p.role === 'AR'));

  const primaryBowlers = bowlingCandidates.length >= 5 ? bowlingCandidates : ALL_PLAYERS.filter(p => p.role === 'BOWL').slice(0, 5);

  // Pitch modifiers
  let runRateBoost = 1.0;
  let wicketRiskBoost = 1.0;

  if (pitchReport.condition === 'Flat Track') {
    runRateBoost = 1.2;
    wicketRiskBoost = 0.85;
  } else if (pitchReport.condition === 'Sticky Wicket') {
    runRateBoost = 0.85;
    wicketRiskBoost = 1.25;
  } else if (pitchReport.condition === 'Dry Turner') {
    runRateBoost = 0.9;
    wicketRiskBoost = 1.2;
  } else if (pitchReport.condition === 'Green Seamer') {
    runRateBoost = 0.88;
    wicketRiskBoost = 1.3;
  }

  if (isSecondInnings && pitchReport.dew === 'Heavy Dew') {
    runRateBoost *= 1.15;
    wicketRiskBoost *= 0.85;
  }

  // Innings tracking
  let totalRuns = 0;
  let wicketsFallen = 0;
  let legalBalls = 0;
  let currentBatter1Idx = 0;
  let currentBatter2Idx = 1;
  let nextBatterIdx = 2;

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

  const fallOfWickets: string[] = [];
  const keyMoments: InningsScorecard['keyMoments'] = [];

  // Bowler allocation (5 bowlers, 4 overs each)
  const activeBowlers = primaryBowlers.slice(0, 5);
  const bowlerQuota: { [bId: string]: number } = {};
  activeBowlers.forEach(b => { bowlerQuota[b.id] = 4; });

  // Simulate 20 overs ball-by-ball / over-by-over
  for (let over = 1; over <= 20; over++) {
    if (wicketsFallen >= 10) break;
    if (target !== null && totalRuns >= target) break;

    // Phase identification
    const isPowerplay = over <= 6;
    const isDeath = over >= 16;
    const isMiddle = !isPowerplay && !isDeath;

    // Pick bowler for this over
    const availableBowlers = activeBowlers.filter(b => bowlerQuota[b.id] > 0);
    if (availableBowlers.length === 0) break;

    let chosenBowler = availableBowlers[0];
    if (isPowerplay) {
      // Pick best pacer/swing bowler
      chosenBowler = availableBowlers.find(b => b.bowlingRating > 88) || availableBowlers[0];
    } else if (isMiddle) {
      // Pick spinner if dry turner or high spin
      chosenBowler = availableBowlers.find(b => b.role === 'BOWL' || b.role === 'AR') || availableBowlers[0];
    } else if (isDeath) {
      // Death specialist
      chosenBowler = availableBowlers.find(b => b.clutchFactor >= 8) || availableBowlers[availableBowlers.length - 1];
    }

    bowlerQuota[chosenBowler.id] -= 1;
    const bowlerStat = bowlersScores[chosenBowler.id];

    let overRuns = 0;
    let overWickets = 0;

    // Simulate 6 balls in this over
    for (let ball = 1; ball <= 6; ball++) {
      if (wicketsFallen >= 10) break;
      if (target !== null && totalRuns >= target) break;

      legalBalls++;
      const currentStrikerPlayer = battingPlayers[currentBatter1Idx];
      const strikerStat = battersScores[currentStrikerPlayer.id];
      strikerStat.balls += 1;

      // Probability model
      const batRating = currentStrikerPlayer.battingRating;
      const bowlRating = chosenBowler.bowlingRating;
      const netEdge = (batRating - bowlRating) / 100; // -0.5 to +0.5

      let pDot = 0.35 - netEdge * 0.15;
      let pSingle = 0.32 + netEdge * 0.05;
      let pTwoThree = 0.08;
      let pFour = 0.12 + (currentStrikerPlayer.strikeRateRating > 90 ? 0.04 : 0);
      let pSix = 0.06 + (currentStrikerPlayer.strikeRateRating > 92 ? 0.03 : 0);
      let pWicket = 0.07 * wicketRiskBoost - netEdge * 0.03;

      // Phase adjustments
      if (isPowerplay) {
        pFour += 0.04;
        pDot += 0.03;
      } else if (isDeath) {
        pSix += 0.05;
        pFour += 0.03;
        pWicket += 0.04;
        pDot -= 0.05;
      }

      // Roll random event
      const roll = Math.random();
      let outcomeRuns = 0;

      if (roll < pWicket) {
        // Wicket fallen!
        wicketsFallen++;
        overWickets++;
        bowlerStat.wickets += 1;
        strikerStat.isOut = true;

        // Dismissal type
        const dRoll = Math.random();
        let dismissalDesc = '';
        if (dRoll < 0.25) {
          // Bowled
          dismissalDesc = `b ${chosenBowler.shortName}`;
          bowlerStat.bowledOrLbwCount += 1;
        } else if (dRoll < 0.40) {
          // LBW
          dismissalDesc = `lbw b ${chosenBowler.shortName}`;
          bowlerStat.bowledOrLbwCount += 1;
        } else if (dRoll < 0.90) {
          // Caught
          const catchers = bowlingTeam.playing_xi
            .map(id => getPlayerById(id))
            .filter((p): p is Player => p !== undefined && p.id !== chosenBowler.id);
          const catcher = catchers[Math.floor(Math.random() * catchers.length)] || chosenBowler;
          dismissalDesc = `c ${catcher.shortName} b ${chosenBowler.shortName}`;
        } else {
          // Run out
          const roPlayer = bowlingCandidates[Math.floor(Math.random() * bowlingCandidates.length)] || chosenBowler;
          dismissalDesc = `run out (${roPlayer.shortName})`;
        }

        strikerStat.dismissal = dismissalDesc;

        // Record fall of wicket
        const currentOverFormat = `${Math.floor((legalBalls - 1) / 6)}.${(legalBalls - 1) % 6 + 1}`;
        fallOfWickets.push(`${wicketsFallen}-${totalRuns} (${currentStrikerPlayer.shortName}, ${currentOverFormat} ov)`);

        keyMoments.push({
          over: currentOverFormat,
          description: `WICKET! ${currentStrikerPlayer.name} dismissed (${dismissalDesc}) for ${strikerStat.runs} (${strikerStat.balls}b)`,
          type: 'wicket'
        });

        // Bring in next batter
        if (nextBatterIdx < battingPlayers.length) {
          currentBatter1Idx = nextBatterIdx;
          nextBatterIdx++;
        }
      } else if (roll < pWicket + pSix) {
        outcomeRuns = 6;
        strikerStat.runs += 6;
        strikerStat.sixes += 1;
        overRuns += 6;
        totalRuns += 6;

        if (isDeath || strikerStat.runs >= 45) {
          const currentOverFormat = `${Math.floor((legalBalls - 1) / 6)}.${(legalBalls - 1) % 6 + 1}`;
          keyMoments.push({
            over: currentOverFormat,
            description: `MAXIMUM! ${currentStrikerPlayer.shortName} lofts ${chosenBowler.shortName} over deep midwicket for a 95m SIX!`,
            type: 'boundary'
          });
        }
      } else if (roll < pWicket + pSix + pFour) {
        outcomeRuns = 4;
        strikerStat.runs += 4;
        strikerStat.fours += 1;
        overRuns += 4;
        totalRuns += 4;
      } else if (roll < pWicket + pSix + pFour + pTwoThree) {
        outcomeRuns = 2;
        strikerStat.runs += 2;
        overRuns += 2;
        totalRuns += 2;
      } else if (roll < pWicket + pSix + pFour + pTwoThree + pSingle) {
        outcomeRuns = 1;
        strikerStat.runs += 1;
        overRuns += 1;
        totalRuns += 1;
        // Strike rotates
        const temp = currentBatter1Idx;
        currentBatter1Idx = currentBatter2Idx;
        currentBatter2Idx = temp;
      } else {
        // Dot ball
        outcomeRuns = 0;
      }

      // Check milestones
      if (strikerStat.runs >= 50 && strikerStat.runs - outcomeRuns < 50) {
        const currentOverFormat = `${Math.floor((legalBalls - 1) / 6)}.${(legalBalls - 1) % 6 + 1}`;
        keyMoments.push({
          over: currentOverFormat,
          description: `FIFTY! Sensational half-century for ${currentStrikerPlayer.name} in ${strikerStat.balls} balls!`,
          type: 'milestone'
        });
      } else if (strikerStat.runs >= 100 && strikerStat.runs - outcomeRuns < 100) {
        const currentOverFormat = `${Math.floor((legalBalls - 1) / 6)}.${(legalBalls - 1) % 6 + 1}`;
        keyMoments.push({
          over: currentOverFormat,
          description: `HUNDRED! Masterclass Century for ${currentStrikerPlayer.name}! Helmets off to thunderous applause!`,
          type: 'milestone'
        });
      }
    }

    // End of over: maiden check, update overs
    bowlerStat.runs += overRuns;
    bowlerStat.overs += 1;
    if (overRuns === 0) {
      bowlerStat.maidens += 1;
      keyMoments.push({
        over: `${over}.0`,
        description: `MAIDEN OVER! Stellar discipline by ${chosenBowler.name} conceding 0 runs!`,
        type: 'impact'
      });
    }

    // Rotate strike at end of over
    const temp = currentBatter1Idx;
    currentBatter1Idx = currentBatter2Idx;
    currentBatter2Idx = temp;
  }

  // Calculate final strike rates and economies
  Object.values(battersScores).forEach(b => {
    b.strikeRate = b.balls > 0 ? Math.round((b.runs / b.balls) * 1000) / 10 : 0;
  });

  Object.values(bowlersScores).forEach(b => {
    b.economy = b.overs > 0 ? Math.round((b.runs / b.overs) * 100) / 100 : 0;
  });

  // Calculate decimal overs played
  const completedOvers = Math.floor(legalBalls / 6);
  const remainingBalls = legalBalls % 6;
  const decimalOvers = completedOvers + remainingBalls / 10;

  // Extras calculation (approx 3-7% of runs)
  const extras = Math.floor(totalRuns * 0.04) + 4;
  totalRuns += extras;

  // Order batters by batting position
  const sortedBatters = Object.values(battersScores).sort((a, b) => a.battingPosition - b.battingPosition);
  const sortedBowlers = Object.values(bowlersScores).filter(b => b.overs > 0).sort((a, b) => b.wickets - a.wickets || a.economy - b.economy);

  return {
    teamId: battingTeam.id,
    teamName: battingTeam.name,
    totalRuns,
    wickets: wicketsFallen,
    overs: decimalOvers,
    batters: sortedBatters,
    bowlers: sortedBowlers,
    extras,
    fallOfWickets,
    keyMoments
  };
}
