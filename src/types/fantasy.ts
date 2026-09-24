/**
 * FLAME - Core Type Definitions & Schemas
 * Standard IPL Fantasy League Architect & Simulation Engine
 */

export type PlayerRole = 'BAT' | 'WK' | 'AR' | 'BOWL';
export type PlayerTier = 1 | 2 | 3;
export type Nationality = 'IND' | 'OVERSEAS';

export interface Player {
  id: string;
  name: string;
  shortName: string;
  role: PlayerRole;
  tier: PlayerTier;
  nationality: Nationality;
  country: string;
  teamAffiliation?: string; // e.g. "RCB", "MI"
  basePrice: number; // in Crores INR, e.g. 2.0
  currentPrice: number;
  battingRating: number; // 50 - 99
  bowlingRating: number; // 30 - 99
  economyRating: number; // 40 - 95
  strikeRateRating: number; // 50 - 99
  clutchFactor: number; // 1 - 10
  avatarColor?: string;
  bio?: string;
}

export interface Team {
  id: string;
  name: string;
  shortCode: string;
  is_human: boolean;
  budget_remaining: number; // in Crores, e.g. 100.0
  roster: string[]; // Player IDs (15 to 18 players)
  playing_xi: string[]; // 11 Player IDs
  captain: string; // Player ID (2.0x multiplier)
  vice_captain: string; // Player ID (1.5x multiplier)
  impact_sub: string; // Player ID (active impact player)
  substitutes: string[]; // 4 nominated substitutes
  color: string;
  secondaryColor?: string;
  logoEmoji: string;
  stats: {
    played: number;
    won: number;
    lost: number;
    tied: number;
    points: number;
    runsScored: number;
    oversFaced: number; // decimal e.g. 19.4 -> calculated for NRR
    runsConceded: number;
    oversBowled: number;
    nrr: number;
    totalFantasyPoints: number;
  };
}

export type PitchCondition = 'Flat Track' | 'Sticky Wicket' | 'Dry Turner' | 'Green Seamer' | 'Balanced Surface';
export type DewFactor = 'Heavy Dew' | 'Moderate Dew' | 'No Dew';
export type TossDecision = 'Bat' | 'Bowl';

export interface MatchPitchReport {
  venue: string;
  city: string;
  condition: PitchCondition;
  dew: DewFactor;
  avgFirstInningsScore: number;
  pitchDescription: string;
}

export interface BatterScore {
  playerId: string;
  name: string;
  shortName: string;
  role: PlayerRole;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  dismissal: string; // "not out", "b Bumrah", "c Kohli b Rashid", "lbw b Starc", "run out (Jadeja)"
  isOut: boolean;
  battingPosition: number;
}

export interface BowlerScore {
  playerId: string;
  name: string;
  shortName: string;
  role: PlayerRole;
  overs: number; // e.g. 4.0
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  bowledOrLbwCount: number;
}

export interface FieldingEvent {
  catches: number;
  stumpings: number;
  runOutDirect: number;
  runOutShared: number;
}

export interface PlayerFantasyBreakdown {
  playerId: string;
  playerName: string;
  teamId: string;
  role: PlayerRole;
  isCaptain: boolean;
  isViceCaptain: boolean;
  multiplier: number; // 2.0, 1.5, or 1.0
  battingPoints: {
    runs: number; // +1 per run
    fours: number; // +1 per 4
    sixes: number; // +2 per 6
    milestoneBonus: number; // +4 for 30, +8 for 50, +16 for 100
    duckPenalty: number; // -2 for top 7 dismissed at 0
    strikeRatePoints: number; // >170: +6, 150-170: +4, 130-150: +2, 60-70: -2, <60: -4 (min 10 balls)
    total: number;
  };
  bowlingPoints: {
    wickets: number; // +25 per wicket
    bowledLbwBonus: number; // +8 per bowled/lbw
    milestoneBonus: number; // +4 for 3w, +8 for 4w, +16 for 5+w
    maidenBonus: number; // +12 per maiden
    economyPoints: number; // <5: +6, 5-6: +4, 6.01-7: +2, 10.01-11: -2, >11: -4 (min 2 ov)
    total: number;
  };
  fieldingPoints: {
    catches: number; // +8 per catch
    catchMilestoneBonus: number; // +4 for 3+ catches
    stumpings: number; // +12 per stumping
    runOutDirect: number; // +12 per direct run out
    runOutShared: number; // +6 per shared run out
    total: number;
  };
  rawTotal: number;
  finalPoints: number; // rawTotal * multiplier
}

export interface InningsScorecard {
  teamId: string;
  teamName: string;
  totalRuns: number;
  wickets: number;
  overs: number; // e.g. 20.0
  batters: BatterScore[];
  bowlers: BowlerScore[];
  extras: number;
  fallOfWickets: string[];
  keyMoments: {
    over: string;
    description: string;
    type: 'wicket' | 'boundary' | 'milestone' | 'impact';
  }[];
}

export interface MatchSimulationResult {
  fixtureId: string;
  matchday: number;
  venue: string;
  pitchReport: MatchPitchReport;
  tossWinnerId: string;
  tossDecision: TossDecision;
  team1Id: string;
  team2Id: string;
  innings1: InningsScorecard;
  innings2: InningsScorecard;
  winnerTeamId: string;
  margin: string; // e.g. "User XI won by 18 runs" or "MI won by 5 wickets"
  playerOfTheMatch: {
    playerId: string;
    name: string;
    summary: string;
  };
  impactSubUsed: {
    [teamId: string]: {
      inPlayerId: string;
      outPlayerId: string;
      reason: string;
    };
  };
  fantasyScores: { [playerId: string]: PlayerFantasyBreakdown };
  teamFantasyTotals: { [teamId: string]: number };
}

export interface Fixture {
  id: string;
  matchday: number;
  team1Id: string;
  team2Id: string;
  venue: string;
  isCompleted: boolean;
  result?: MatchSimulationResult;
  playoffLabel?: 'Qualifier 1' | 'Eliminator' | 'Qualifier 2' | 'Final';
}

export type PlayoffsStage = 'League' | 'Qualifier 1' | 'Eliminator' | 'Qualifier 2' | 'Final' | 'Completed';

export interface LeagueMeta {
  season: string;
  current_matchday: number;
  total_matchdays: number;
  playoffs_stage: PlayoffsStage;
  draft_type: 'auction' | 'snake' | 'baseline';
  league_size: number;
}

export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  isHuman: boolean;
  rank: number;
  matchesPlayed: number;
  matchPoints: number;
  netRunRate: number;
  totalFantasyPoints: number;
}

export interface UserFantasyTeam {
  id: string; // 'user_fantasy_team'
  name: string;
  shortCode: string;
  logoEmoji: string;
  color: string;
  secondaryColor?: string;
  budget_remaining: number; // 100.0 Cr
  playing_xi: string[]; // 11 selected player IDs
  roster: string[];
  captain: string;
  vice_captain: string;
  impact_sub: string;
  substitutes: string[];
  totalFantasyPoints: number;
  matchdayPoints: { [matchday: number]: number };
}

export interface FantasyManagerEntry {
  id: string;
  teamName: string;
  managerName: string;
  isHuman: boolean;
  rank: number;
  logoEmoji: string;
  playing_xi: string[];
  captain: string;
  vice_captain: string;
  totalFantasyPoints: number;
  matchdayPoints: { [matchday: number]: number };
  transfersCount: number;
}

export interface FantasyTransferRecord {
  id: string;
  matchday: number;
  transfersCount: number;
  playersIn: string[];
  playersOut: string[];
  timestamp: string;
  stage: 'league' | 'playoffs_prep' | 'playoffs';
  remainingAfter: number | 'Unlimited';
}

export interface FantasyTransfersState {
  league_transfers_remaining: number; // 100 for 70 league matches
  league_transfers_total: number; // 100
  playoffs_transfers_remaining: number; // 10 for playoffs
  playoffs_transfers_total: number; // 10
  is_unlimited_window: boolean; // true when 70 league matches complete before playoffs start
  playoffs_started: boolean; // true once first playoff match is simulated
  history: FantasyTransferRecord[];
}

export type BoosterId =
  | 'triple_captain'
  | 'double_power'
  | 'indian_warrior'
  | 'foreign_stars'
  | 'free_hit'
  | 'wild_card'
  | 'power_striker'
  | 'strike_force'
  | 'allround_marvel'
  | 'super_sub';

export interface BoosterDef {
  id: BoosterId;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  badgeColor: string;
  maxUses: number;
  multiplierText: string;
  category: 'multiplier' | 'transfers' | 'role';
}

export interface BoosterHistoryEntry {
  id: string;
  matchday: number;
  boosterId: BoosterId;
  boosterName: string;
  timestamp: string;
  bonusPointsEarned: number;
}

export interface BoosterUsageState {
  remainingUses: { [key in BoosterId]: number };
  activeBoosterForNextMatch: BoosterId | null;
  history: BoosterHistoryEntry[];
  // For Free Hit: snapshot of playing_xi to restore after match
  savedFreeHitLineup?: string[] | null;
}

export interface SeasonArchive {
  id: string;
  season: string; // e.g. "IPL 2026"
  year: number; // e.g. 2026
  championTeamId: string;
  championTeamName: string;
  championEmoji?: string;
  runnerUpTeamId: string;
  runnerUpTeamName: string;
  runnerUpEmoji?: string;
  finalScoreline?: string;
  finalMargin?: string;
  userTeamName: string;
  userRank: number;
  userTotalPoints: number;
  userFantasyPoints: number;
  transfersUsedTotal: number;
  orangeCap: { name: string; runs: number; team: string };
  purpleCap: { name: string; wickets: number; team: string };
  mvp?: { name: string; points: number; team: string };
  completedAt: string;
}

export interface FLAMEState {
  is_team_created?: boolean;
  league_meta: LeagueMeta;
  transfers_state: FantasyTransfersState;
  boosters_state: BoosterUsageState;
  season_history?: SeasonArchive[];
  show_season_end_modal?: boolean;
  teams: Team[];
  leaderboard: LeaderboardEntry[];
  user_fantasy_team?: UserFantasyTeam;
  fantasy_leaderboard?: FantasyManagerEntry[];
  current_fixture: Fixture | null;
  fixtures: Fixture[];
  allPlayers: Player[];
  activeModal: 'setup' | 'lineup' | 'scorecard' | 'auction' | 'transfer' | 'boosters' | 'new_season' | 'season_archive' | 'none';
  selectedFixtureForScorecard: Fixture | null;
  selectedPlayerForDetails: Player | null;
  commandHistory: {
    id: string;
    timestamp: string;
    command: string;
    output: string;
    isError?: boolean;
  }[];
}
