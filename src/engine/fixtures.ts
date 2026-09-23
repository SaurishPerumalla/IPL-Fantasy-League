import { Fixture, LeaderboardEntry, PlayoffsStage, Team } from '../types/fantasy';
import { VENUES } from '../data/iplTeams';

export function generateLeagueFixtures(teams: Team[], totalMatchdays: number = 14): Fixture[] {
  const fixtures: Fixture[] = [];
  const teamCount = teams.length;
  let fixtureIdCounter = 1;

  if (teamCount < 2) return fixtures;

  // Round robin generation algorithm
  // Create pairings across 14 matchdays
  for (let matchday = 1; matchday <= totalMatchdays; matchday++) {
    // Generate matches for this matchday
    // Ensure all teams play or rotating matchups
    const shuffledTeams = [...teams];
    const matchesInDay = Math.floor(teamCount / 2);

    for (let m = 0; m < matchesInDay; m++) {
      const t1Idx = (m + matchday - 1) % teamCount;
      const t2Idx = (teamCount - 1 - m + matchday - 1) % teamCount;

      if (t1Idx === t2Idx) continue;

      const team1 = shuffledTeams[t1Idx];
      const team2 = shuffledTeams[t2Idx];
      const venueObj = VENUES[(matchday + m) % VENUES.length];

      fixtures.push({
        id: `fix_m${matchday}_${fixtureIdCounter++}`,
        matchday,
        team1Id: team1.id,
        team2Id: team2.id,
        venue: venueObj.name + ', ' + venueObj.city,
        isCompleted: false
      });
    }
  }

  return fixtures;
}

export function updateTeamStatsAndStandings(
  teams: Team[],
  completedFixtures: Fixture[]
): { updatedTeams: Team[]; leaderboard: LeaderboardEntry[] } {
  // Clone teams and reset stats
  const teamMap: { [id: string]: Team } = {};
  teams.forEach(t => {
    teamMap[t.id] = {
      ...t,
      stats: {
        played: 0,
        won: 0,
        lost: 0,
        tied: 0,
        points: 0,
        runsScored: 0,
        oversFaced: 0,
        runsConceded: 0,
        oversBowled: 0,
        nrr: 0,
        totalFantasyPoints: 0
      }
    };
  });

  completedFixtures.forEach(fix => {
    if (!fix.result) return;
    const { innings1, innings2, winnerTeamId, teamFantasyTotals } = fix.result;

    const t1 = teamMap[fix.team1Id];
    const t2 = teamMap[fix.team2Id];
    if (!t1 || !t2) return;

    t1.stats.played += 1;
    t2.stats.played += 1;

    // Match outcome
    if (winnerTeamId === t1.id) {
      t1.stats.won += 1;
      t1.stats.points += 2;
      t2.stats.lost += 1;
    } else if (winnerTeamId === t2.id) {
      t2.stats.won += 1;
      t2.stats.points += 2;
      t1.stats.lost += 1;
    } else {
      t1.stats.tied += 1;
      t2.stats.tied += 1;
      t1.stats.points += 1;
      t2.stats.points += 1;
    }

    // Runs & Overs for NRR calculation
    // Standard T20 rule: if all out, overs count as 20.0
    const t1BatInnings = innings1.teamId === t1.id ? innings1 : innings2;
    const t2BatInnings = innings1.teamId === t2.id ? innings1 : innings2;

    const t1OversFaced = t1BatInnings.wickets >= 10 ? 20.0 : t1BatInnings.overs;
    const t2OversFaced = t2BatInnings.wickets >= 10 ? 20.0 : t2BatInnings.overs;

    t1.stats.runsScored += t1BatInnings.totalRuns;
    t1.stats.oversFaced += t1OversFaced;
    t1.stats.runsConceded += t2BatInnings.totalRuns;
    t1.stats.oversBowled += t2OversFaced;

    t2.stats.runsScored += t2BatInnings.totalRuns;
    t2.stats.oversFaced += t2OversFaced;
    t2.stats.runsConceded += t1BatInnings.totalRuns;
    t2.stats.oversBowled += t1OversFaced;

    // Fantasy points
    if (!t1.is_human && teamFantasyTotals[t1.id]) {
      t1.stats.totalFantasyPoints += teamFantasyTotals[t1.id];
    }
    if (!t2.is_human && teamFantasyTotals[t2.id]) {
      t2.stats.totalFantasyPoints += teamFantasyTotals[t2.id];
    }

    // For human Dream11 team: score points for any player in human XI who played in this fixture
    const humanTeam = Object.values(teamMap).find(t => t.is_human);
    if (humanTeam && fix.result && fix.result.fantasyScores) {
      humanTeam.playing_xi.forEach(pId => {
        const pScore = fix.result?.fantasyScores[pId];
        if (pScore) {
          const mult = humanTeam.captain === pId ? 2.0 : humanTeam.vice_captain === pId ? 1.5 : 1.0;
          humanTeam.stats.totalFantasyPoints += Math.round(pScore.rawTotal * mult * 10) / 10;
        }
      });
    }
  });

  // Calculate NRR
  Object.values(teamMap).forEach(t => {
    if (t.stats.oversFaced > 0 && t.stats.oversBowled > 0) {
      const batRate = t.stats.runsScored / t.stats.oversFaced;
      const bowlRate = t.stats.runsConceded / t.stats.oversBowled;
      t.stats.nrr = Math.round((batRate - bowlRate) * 1000) / 1000;
    } else {
      t.stats.nrr = 0;
    }
    t.stats.totalFantasyPoints = Math.round(t.stats.totalFantasyPoints * 10) / 10;
  });

  // Sort leaderboard by Match Points (desc), then NRR (desc), then Total Fantasy Points (desc)
  const sortedTeams = Object.values(teamMap).sort((a, b) => {
    if (b.stats.points !== a.stats.points) {
      return b.stats.points - a.stats.points;
    }
    if (b.stats.nrr !== a.stats.nrr) {
      return b.stats.nrr - a.stats.nrr;
    }
    return b.stats.totalFantasyPoints - a.stats.totalFantasyPoints;
  });

  const leaderboard: LeaderboardEntry[] = sortedTeams.map((t, index) => ({
    teamId: t.id,
    teamName: t.name,
    isHuman: t.is_human,
    rank: index + 1,
    matchesPlayed: t.stats.played,
    matchPoints: t.stats.points,
    netRunRate: t.stats.nrr,
    totalFantasyPoints: t.stats.totalFantasyPoints
  }));

  return {
    updatedTeams: sortedTeams,
    leaderboard
  };
}

export function generatePlayoffFixtures(
  leaderboard: LeaderboardEntry[],
  currentStage: PlayoffsStage
): Fixture[] {
  if (leaderboard.length < 4) return [];

  const q1Venue = 'MA Chidambaram Stadium, Chepauk, Chennai';
  const elimVenue = 'Narendra Modi Stadium, Ahmedabad';

  if (currentStage === 'Qualifier 1') {
    return [
      {
        id: 'fix_playoff_q1',
        matchday: 15,
        team1Id: leaderboard[0].teamId, // Rank 1
        team2Id: leaderboard[1].teamId, // Rank 2
        venue: q1Venue,
        isCompleted: false,
        playoffLabel: 'Qualifier 1'
      },
      {
        id: 'fix_playoff_elim',
        matchday: 15,
        team1Id: leaderboard[2].teamId, // Rank 3
        team2Id: leaderboard[3].teamId, // Rank 4
        venue: elimVenue,
        isCompleted: false,
        playoffLabel: 'Eliminator'
      }
    ];
  }

  return [];
}
