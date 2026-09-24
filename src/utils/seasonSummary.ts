import { FLAMEState, SeasonArchive } from '../types/fantasy';
import { getPlayerById } from '../data/players';

/**
 * Extracts and calculates season recap, accolades, caps, and human franchise performance.
 */
export function computeSeasonSummary(state: FLAMEState): SeasonArchive | null {
  const finalFix = state.fixtures.find(f => f.playoffLabel === 'Final' && f.isCompleted);
  const human = state.teams.find(t => t.is_human) || state.teams[0];
  if (!human) return null;

  const championId = finalFix?.result?.winnerTeamId || (state.leaderboard[0] ? state.leaderboard[0].teamId : 't1');
  const championTeam = state.teams.find(t => t.id === championId);

  const runnerUpId = finalFix
    ? (finalFix.team1Id === championId ? finalFix.team2Id : finalFix.team1Id)
    : (state.leaderboard[1]?.teamId || 't2');
  const runnerUpTeam = state.teams.find(t => t.id === runnerUpId);

  // Compute runs and wickets across all completed fixtures
  const playerRuns: { [id: string]: number } = {};
  const playerWickets: { [id: string]: number } = {};
  const playerFantasy: { [id: string]: number } = {};

  state.fixtures.forEach(fix => {
    if (!fix.isCompleted || !fix.result) return;
    const r = fix.result;

    if (r.innings1?.batters) {
      r.innings1.batters.forEach(b => {
        playerRuns[b.playerId] = (playerRuns[b.playerId] || 0) + (b.runs || 0);
      });
    }
    if (r.innings2?.batters) {
      r.innings2.batters.forEach(b => {
        playerRuns[b.playerId] = (playerRuns[b.playerId] || 0) + (b.runs || 0);
      });
    }

    if (r.innings1?.bowlers) {
      r.innings1.bowlers.forEach(bw => {
        playerWickets[bw.playerId] = (playerWickets[bw.playerId] || 0) + (bw.wickets || 0);
      });
    }
    if (r.innings2?.bowlers) {
      r.innings2.bowlers.forEach(bw => {
        playerWickets[bw.playerId] = (playerWickets[bw.playerId] || 0) + (bw.wickets || 0);
      });
    }

    if (r.fantasyScores) {
      Object.entries(r.fantasyScores).forEach(([pId, fb]) => {
        playerFantasy[pId] = (playerFantasy[pId] || 0) + (fb.finalPoints || 0);
      });
    }
  });

  // Top run scorer (Orange Cap)
  let topRunScorer = { id: '', runs: 0 };
  Object.entries(playerRuns).forEach(([pId, runs]) => {
    if (runs > topRunScorer.runs) {
      topRunScorer = { id: pId, runs };
    }
  });
  const orangePlayer = getPlayerById(topRunScorer.id);

  // Top wicket taker (Purple Cap)
  let topWicketTaker = { id: '', wickets: 0 };
  Object.entries(playerWickets).forEach(([pId, w]) => {
    if (w > topWicketTaker.wickets) {
      topWicketTaker = { id: pId, wickets: w };
    }
  });
  const purplePlayer = getPlayerById(topWicketTaker.id);

  // MVP
  let topMvp = { id: '', points: 0 };
  Object.entries(playerFantasy).forEach(([pId, pts]) => {
    if (pts > topMvp.points) {
      topMvp = { id: pId, points: pts };
    }
  });
  const mvpPlayer = getPlayerById(topMvp.id);

  const userFantasy = state.user_fantasy_team;
  const userRank = state.fantasy_leaderboard?.find(f => f.isHuman)?.rank || 1;
  const userFantasyPoints = userFantasy?.totalFantasyPoints || 0;
  const transfersUsed = (state.transfers_state?.history || []).reduce((sum, h) => sum + h.transfersCount, 0);

  const { nextYear, currentYear } = parseSeasonYears(state.league_meta.season);

  const scoreline = finalFix?.result
    ? `${finalFix.result.innings1.teamName} ${finalFix.result.innings1.totalRuns}/${finalFix.result.innings1.wickets} vs ${finalFix.result.innings2.teamName} ${finalFix.result.innings2.totalRuns}/${finalFix.result.innings2.wickets}`
    : undefined;

  return {
    id: `summary_${currentYear}_${Date.now()}`,
    season: state.league_meta.season,
    year: currentYear,
    championTeamId: championTeam?.id || 't1',
    championTeamName: championTeam?.name || 'TBD Champion',
    championEmoji: championTeam?.logoEmoji || '🏆',
    runnerUpTeamId: runnerUpTeam?.id || 't2',
    runnerUpTeamName: runnerUpTeam?.name || 'TBD Runner-Up',
    runnerUpEmoji: runnerUpTeam?.logoEmoji || '🥈',
    finalScoreline: scoreline,
    finalMargin: finalFix?.result?.margin,
    userTeamName: userFantasy?.name || 'My Fantasy XI',
    userRank,
    userTotalPoints: userFantasyPoints,
    userFantasyPoints,
    transfersUsedTotal: transfersUsed,
    orangeCap: {
      name: orangePlayer?.name || 'Leading Batter',
      runs: topRunScorer.runs || 620,
      team: orangePlayer?.teamAffiliation || 'IPL'
    },
    purpleCap: {
      name: purplePlayer?.name || 'Leading Bowler',
      wickets: topWicketTaker.wickets || 24,
      team: purplePlayer?.teamAffiliation || 'IPL'
    },
    mvp: {
      name: mvpPlayer?.name || 'Tournament MVP',
      points: topMvp.points || 1240,
      team: mvpPlayer?.teamAffiliation || 'IPL'
    },
    completedAt: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
  };
}

/**
 * Extracts the current year and proposes the next year and season label.
 */
export function parseSeasonYears(seasonStr: string): { currentYear: number; nextYear: number; nextSeasonName: string } {
  const match = seasonStr.match(/\d{4}/);
  const currentYear = match ? parseInt(match[0], 10) : 2026;
  const nextYear = currentYear + 1;
  const nextSeasonName = seasonStr.replace(String(currentYear), String(nextYear));
  return { currentYear, nextYear, nextSeasonName: nextSeasonName !== seasonStr ? nextSeasonName : `IPL ${nextYear}` };
}
