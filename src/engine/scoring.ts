import {
  BatterScore,
  BowlerScore,
  FieldingEvent,
  PlayerFantasyBreakdown,
  PlayerRole
} from '../types/fantasy';

export interface PlayerMatchStatsInput {
  playerId: string;
  playerName: string;
  teamId: string;
  role: PlayerRole;
  isCaptain: boolean;
  isViceCaptain: boolean;
  isImpactSub?: boolean;
  nationality?: string;
  boosterMultiplier?: number;
  batterScore?: BatterScore;
  bowlerScore?: BowlerScore;
  fielding?: FieldingEvent;
}

export function calculateFantasyBreakdown(input: PlayerMatchStatsInput): PlayerFantasyBreakdown {
  const {
    playerId,
    playerName,
    teamId,
    role,
    isCaptain,
    isViceCaptain,
    boosterMultiplier = 1.0,
    batterScore,
    bowlerScore,
    fielding = { catches: 0, stumpings: 0, runOutDirect: 0, runOutShared: 0 }
  } = input;

  // 1. Batting Points
  let runsPts = 0;
  let foursPts = 0;
  let sixesPts = 0;
  let milestoneBonus = 0;
  let duckPenalty = 0;
  let strikeRatePoints = 0;

  if (batterScore) {
    const { runs, balls, fours, sixes, dismissal, isOut, battingPosition } = batterScore;

    // Base: +1 point per run
    runsPts = runs;

    // Boundary bonuses: +1 for four, +2 for six
    foursPts = fours * 1;
    sixesPts = sixes * 2;

    // Milestone bonuses: +4 for 30 runs, +8 for 50 runs, +16 for 100 runs
    if (runs >= 100) {
      milestoneBonus = 16;
    } else if (runs >= 50) {
      milestoneBonus = 8;
    } else if (runs >= 30) {
      milestoneBonus = 4;
    }

    // Duck penalty: -2 points (dismissed for 0, applicable to top 7 batters)
    if (isOut && runs === 0 && battingPosition <= 7) {
      duckPenalty = -2;
    }

    // Strike rate (min. 10 balls faced)
    if (balls >= 10) {
      const sr = (runs / balls) * 100;
      if (sr > 170) {
        strikeRatePoints = 6;
      } else if (sr > 150) {
        strikeRatePoints = 4;
      } else if (sr >= 130) {
        strikeRatePoints = 2;
      } else if (sr >= 60 && sr <= 70) {
        strikeRatePoints = -2;
      } else if (sr < 60) {
        strikeRatePoints = -4;
      }
    }
  }

  const battingTotal = runsPts + foursPts + sixesPts + milestoneBonus + duckPenalty + strikeRatePoints;

  // 2. Bowling Points
  let wicketsPts = 0;
  let bowledLbwBonus = 0;
  let bowlMilestoneBonus = 0;
  let maidenBonus = 0;
  let economyPoints = 0;

  if (bowlerScore) {
    const { overs, maidens, runs, wickets, bowledOrLbwCount } = bowlerScore;

    // Base: +25 points per wicket (excluding run-outs)
    wicketsPts = wickets * 25;

    // Dismissal bonuses: +8 points for LBW or Bowled
    bowledLbwBonus = bowledOrLbwCount * 8;

    // Milestone bonuses: +4 for 3 wickets; +8 for 4 wickets; +16 for 5+ wickets
    if (wickets >= 5) {
      bowlMilestoneBonus = 16;
    } else if (wickets === 4) {
      bowlMilestoneBonus = 8;
    } else if (wickets === 3) {
      bowlMilestoneBonus = 4;
    }

    // Maiden over: +12 points per maiden
    maidenBonus = maidens * 12;

    // Economy rate (min. 2 overs bowled)
    if (overs >= 2.0) {
      const eco = runs / overs;
      if (eco < 5.0) {
        economyPoints = 6;
      } else if (eco <= 6.0) {
        economyPoints = 4;
      } else if (eco <= 7.0) {
        economyPoints = 2;
      } else if (eco > 10.0 && eco <= 11.0) {
        economyPoints = -2;
      } else if (eco > 11.0) {
        economyPoints = -4;
      }
    }
  }

  const bowlingTotal = wicketsPts + bowledLbwBonus + bowlMilestoneBonus + maidenBonus + economyPoints;

  // 3. Fielding Points
  const { catches, stumpings, runOutDirect, runOutShared } = fielding;
  const catchPts = catches * 8;
  const catchMilestoneBonus = catches >= 3 ? 4 : 0;
  const stumpingsPts = stumpings * 12;
  const roDirectPts = runOutDirect * 12;
  const roSharedPts = runOutShared * 6;

  const fieldingTotal = catchPts + catchMilestoneBonus + stumpingsPts + roDirectPts + roSharedPts;

  // Raw Total
  const rawTotal = battingTotal + bowlingTotal + fieldingTotal;

  // Multipliers: Captain = 2.0x | Vice-Captain = 1.5x, combined with active booster
  let multiplier = 1.0;
  if (isCaptain) multiplier = 2.0;
  else if (isViceCaptain) multiplier = 1.5;

  if (boosterMultiplier && boosterMultiplier > 0) {
    multiplier = Math.round(multiplier * boosterMultiplier * 10) / 10;
  }

  const finalPoints = Math.round(rawTotal * multiplier * 10) / 10;

  return {
    playerId,
    playerName,
    teamId,
    role,
    isCaptain,
    isViceCaptain,
    multiplier,
    battingPoints: {
      runs: runsPts,
      fours: foursPts,
      sixes: sixesPts,
      milestoneBonus,
      duckPenalty,
      strikeRatePoints,
      total: battingTotal
    },
    bowlingPoints: {
      wickets: wicketsPts,
      bowledLbwBonus,
      milestoneBonus: bowlMilestoneBonus,
      maidenBonus,
      economyPoints,
      total: bowlingTotal
    },
    fieldingPoints: {
      catches: catchPts,
      catchMilestoneBonus,
      stumpings: stumpingsPts,
      runOutDirect: roDirectPts,
      runOutShared: roSharedPts,
      total: fieldingTotal
    },
    rawTotal,
    finalPoints
  };
}
