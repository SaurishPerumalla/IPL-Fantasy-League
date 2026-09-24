import { UserFantasyTeam, FantasyManagerEntry, Fixture, BoosterId } from '../types/fantasy';
import { INITIAL_AI_FANTASY_MANAGERS } from '../data/fantasyManagers';
import { getPlayerById } from '../data/players';

export function calculateBoosterMultiplier(
  boosterId: BoosterId | null | undefined,
  playerId: string,
  captainId: string,
  impactSubId: string
): number {
  if (!boosterId) return 1.0;
  const player = getPlayerById(playerId);
  if (!player) return 1.0;

  switch (boosterId) {
    case 'triple_captain':
      return playerId === captainId ? 1.5 : 1.0; // 2.0x base captain * 1.5 = 3.0x
    case 'double_power':
      return 2.0; // 2x for all 11 players
    case 'indian_warrior':
      return player.nationality === 'IND' ? 2.0 : 1.0;
    case 'foreign_stars':
      return player.nationality === 'OVERSEAS' ? 2.0 : 1.0;
    case 'power_striker':
      return player.role === 'BAT' || player.role === 'WK' ? 2.0 : 1.0;
    case 'strike_force':
      return player.role === 'BOWL' ? 2.0 : 1.0;
    case 'allround_marvel':
      return player.role === 'AR' ? 2.0 : 1.0;
    case 'super_sub':
      return playerId === impactSubId ? 2.0 : 1.0;
    default:
      return 1.0;
  }
}

export function computeFantasyLeaderboard(
  userTeam: UserFantasyTeam,
  completedFixtures: Fixture[],
  activeBoosterForNextMatch?: BoosterId | null
): {
  updatedUserTeam: UserFantasyTeam;
  fantasyLeaderboard: FantasyManagerEntry[];
} {
  // 1. Calculate user points across all completed fixtures
  let userTotalPoints = 0;
  const userMatchdayPoints: { [matchday: number]: number } = {};

  // Clone AI managers
  const aiManagers: FantasyManagerEntry[] = INITIAL_AI_FANTASY_MANAGERS.map(ai => ({
    ...ai,
    rank: 0,
    totalFantasyPoints: 0,
    matchdayPoints: {},
    transfersCount: 0
  }));

  completedFixtures.forEach(fix => {
    if (!fix.result || !fix.result.fantasyScores) return;
    const scores = fix.result.fantasyScores;
    const md = fix.matchday;

    // User's players
    userTeam.playing_xi.forEach(pId => {
      const pScore = scores[pId];
      if (pScore) {
        let mult = userTeam.captain === pId ? 2.0 : userTeam.vice_captain === pId ? 1.5 : 1.0;
        const boosterMult = calculateBoosterMultiplier(
          activeBoosterForNextMatch,
          pId,
          userTeam.captain,
          userTeam.impact_sub
        );
        mult *= boosterMult;

        const earned = Math.round(pScore.rawTotal * mult * 10) / 10;
        userTotalPoints += earned;
        userMatchdayPoints[md] = (userMatchdayPoints[md] || 0) + earned;
      }
    });

    // AI Managers' players
    aiManagers.forEach(ai => {
      ai.playing_xi.forEach(pId => {
        const pScore = scores[pId];
        if (pScore) {
          const mult = ai.captain === pId ? 2.0 : ai.vice_captain === pId ? 1.5 : 1.0;
          const earned = Math.round(pScore.rawTotal * mult * 10) / 10;
          ai.totalFantasyPoints += earned;
          ai.matchdayPoints[md] = (ai.matchdayPoints[md] || 0) + earned;
        }
      });
    });
  });

  const updatedUserTeam: UserFantasyTeam = {
    ...userTeam,
    totalFantasyPoints: Math.round(userTotalPoints * 10) / 10,
    matchdayPoints: userMatchdayPoints
  };

  const userEntry: FantasyManagerEntry = {
    id: userTeam.id,
    teamName: userTeam.name,
    managerName: 'You (Manager)',
    isHuman: true,
    rank: 1,
    logoEmoji: userTeam.logoEmoji || '🔥',
    playing_xi: [...userTeam.playing_xi],
    captain: userTeam.captain,
    vice_captain: userTeam.vice_captain,
    totalFantasyPoints: updatedUserTeam.totalFantasyPoints,
    matchdayPoints: userMatchdayPoints,
    transfersCount: 0
  };

  const allEntries: FantasyManagerEntry[] = [
    userEntry,
    ...aiManagers.map(ai => ({
      ...ai,
      totalFantasyPoints: Math.round(ai.totalFantasyPoints * 10) / 10
    }))
  ];

  allEntries.sort((a, b) => b.totalFantasyPoints - a.totalFantasyPoints);

  allEntries.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return {
    updatedUserTeam,
    fantasyLeaderboard: allEntries
  };
}
