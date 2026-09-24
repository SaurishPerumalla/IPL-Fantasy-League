import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  FLAMEState,
  Fixture,
  LeaderboardEntry,
  LeagueMeta,
  MatchSimulationResult,
  Player,
  PlayoffsStage,
  Team,
  FantasyTransferRecord,
  FantasyTransfersState,
  BoosterId,
  BoosterUsageState,
  SeasonArchive,
  UserFantasyTeam,
  FantasyManagerEntry
} from '../types/fantasy';
import { ALL_PLAYERS, getPlayerById } from '../data/players';
import { IPL_FRANCHISES_PRESET, createInitialTeamFromPreset } from '../data/iplTeams';
import { defaultBoosterState, getBoosterById, OFFICIAL_BOOSTERS } from '../data/boosters';
import { generateLeagueFixtures, updateTeamStatsAndStandings, generatePlayoffFixtures } from '../engine/fixtures';
import { computeFantasyLeaderboard } from '../engine/fantasyEngine';
import { simulateT20Match } from '../engine/simulator';
import { computeSeasonSummary, parseSeasonYears } from '../utils/seasonSummary';

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export const DEFAULT_USER_FANTASY_XI = [
  'p_kohli', 'p_rohit', 'p_ruturaj', 'p_pant', 'p_hardik',
  'p_jadeja', 'p_russell', 'p_bumrah', 'p_kuldeep', 'p_chahal', 'p_arshdeep'
];

export const createDefaultUserFantasyTeam = (name: string = 'My Fantasy XI', emoji: string = '🔥'): UserFantasyTeam => {
  return {
    id: 'user_fantasy_team',
    name,
    shortCode: (name.replace(/[^a-zA-Z]/g, '').slice(0, 3) || 'MYF').toUpperCase(),
    logoEmoji: emoji,
    color: '#0284c7',
    secondaryColor: '#f59e0b',
    budget_remaining: 11.5,
    playing_xi: [...DEFAULT_USER_FANTASY_XI],
    roster: [...DEFAULT_USER_FANTASY_XI],
    captain: 'p_kohli',
    vice_captain: 'p_bumrah',
    impact_sub: 'p_hardik',
    substitutes: [],
    totalFantasyPoints: 0,
    matchdayPoints: {}
  };
};

interface GameContextType {
  state: FLAMEState;
  humanTeam: Team;
  userFantasyTeam: UserFantasyTeam;
  fantasyLeaderboard: FantasyManagerEntry[];
  allTeams: Team[];
  currentMatchdayFixtures: Fixture[];
  lastCompletedFixture: Fixture | null;
  transfersState: FantasyTransfersState;
  boostersState: BoosterUsageState;
  executeCommand: (cmd: string) => string;
  simulateCurrentMatchday: () => MatchSimulationResult[];
  fastForwardMatchdays: (n: number) => void;
  activateBooster: (boosterId: BoosterId) => { success: boolean; message: string };
  deactivateBooster: () => void;
  syncSquadsWithAI: (role?: string) => Promise<{ success: boolean; report?: string; error?: string }>;
  getBoosterAdviceWithAI: () => Promise<{ success: boolean; advice?: string; error?: string }>;
  updateUserLineup: (
    playingXI: string[],
    captain: string,
    viceCaptain: string,
    impactSub: string,
    substitutes?: string[]
  ) => { success: boolean; message: string; transfersUsed: number };
  transferPlayer: (dropPlayerId: string, addPlayerId: string) => { success: boolean; message: string };
  validateLineupRules: (xiIds: string[]) => ValidationResult;
  createInitialFantasyTeam: (params: {
    teamName: string;
    playingXI: string[];
    captain: string;
    viceCaptain: string;
    logoEmoji?: string;
    baseColor?: string;
  }) => { success: boolean; message: string };
  initTournament: (params: {
    franchiseName: string;
    leagueSize: number;
    format: 'auction' | 'snake' | 'baseline';
    chosenBaseFranchiseId?: string;
  }) => void;
  resetTournament: () => void;
  startNewSeason: (params?: {
    nextYear?: number;
    seasonName?: string;
    keepSameTeamName?: boolean;
  }) => void;
  openSeasonEndModal: () => void;
  closeSeasonEndModal: () => void;
  openNewSeasonModal: () => void;
  openSeasonArchiveModal: () => void;
  getSeasonSummary: () => SeasonArchive | null;
  openScorecardModal: (fixture: Fixture) => void;
  openLineupModal: () => void;
  openTransferModal: () => void;
  openAuctionModal: () => void;
  openBoostersModal: () => void;
  closeModals: () => void;
  setSelectedPlayer: (player: Player | null) => void;
  addPlayerToHumanRoster: (player: Player, cost: number) => void;
  advancePlayoffStage: () => void;
  commitLiveMatchResult: (fixtureId: string, result: MatchSimulationResult) => void;
}

const STORAGE_KEY = 'FLAME_IPL_FANTASY_STATE_V1';

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default Initial State (10 Official IPL Teams * 7 rounds / 14 matchdays = 70 League Matches)
  const defaultMeta: LeagueMeta = {
    season: 'IPL 2026',
    current_matchday: 1,
    total_matchdays: 14,
    playoffs_stage: 'League',
    draft_type: 'baseline',
    league_size: 10
  };

  const defaultTransfersState: FantasyTransfersState = {
    league_transfers_remaining: 100,
    league_transfers_total: 100,
    playoffs_transfers_remaining: 10,
    playoffs_transfers_total: 10,
    is_unlimited_window: false,
    playoffs_started: false,
    history: []
  };

  const defaultFantasyTeam = createDefaultUserFantasyTeam();

  const [state, setState] = useState<FLAMEState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.league_meta && parsed.teams && parsed.teams.length > 0) {
          // Guarantee all 10 real IPL teams exist and are not overwritten by a human team
          const hasHumanInTeams = parsed.teams.some((t: Team) => t.is_human || t.id === 'human_team' || t.name === 'User XI');
          if (hasHumanInTeams || parsed.teams.length !== 10) {
            const initialPresets = IPL_FRANCHISES_PRESET.slice(0, 10);
            parsed.teams = initialPresets.map(preset => createInitialTeamFromPreset(preset, false));
            const completed = (parsed.fixtures || []).filter((f: Fixture) => f.isCompleted);
            const { updatedTeams, leaderboard } = updateTeamStatsAndStandings(parsed.teams, completed);
            parsed.teams = updatedTeams;
            parsed.leaderboard = leaderboard;
          }
          if (!parsed.user_fantasy_team) {
            parsed.user_fantasy_team = defaultFantasyTeam;
          }
          if (!parsed.fantasy_leaderboard) {
            const completed = (parsed.fixtures || []).filter((f: Fixture) => f.isCompleted);
            const { updatedUserTeam, fantasyLeaderboard } = computeFantasyLeaderboard(
              parsed.user_fantasy_team,
              completed
            );
            parsed.user_fantasy_team = updatedUserTeam;
            parsed.fantasy_leaderboard = fantasyLeaderboard;
          }
          if (!parsed.transfers_state) {
            parsed.transfers_state = defaultTransfersState;
          }
          if (!parsed.boosters_state) {
            parsed.boosters_state = defaultBoosterState;
          }
          if (!parsed.season_history) {
            parsed.season_history = [];
          }
          if (parsed.show_season_end_modal === undefined) {
            parsed.show_season_end_modal = false;
          }
          // Always ensure master player database is synced with the latest verified player roster
          parsed.allPlayers = ALL_PLAYERS;
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved FLAME state', e);
      }
    }

    // Default bootstrap with all 10 IPL franchises (70 league matches)
    const initialPresets = IPL_FRANCHISES_PRESET.slice(0, 10);
    const initialTeams = initialPresets.map(preset => createInitialTeamFromPreset(preset, false));

    const initialFixtures = generateLeagueFixtures(initialTeams, 14);
    const { updatedTeams, leaderboard } = updateTeamStatsAndStandings(initialTeams, []);
    const { updatedUserTeam, fantasyLeaderboard } = computeFantasyLeaderboard(defaultFantasyTeam, []);

    return {
      is_team_created: false,
      league_meta: defaultMeta,
      transfers_state: defaultTransfersState,
      boosters_state: defaultBoosterState,
      season_history: [],
      show_season_end_modal: false,
      teams: updatedTeams,
      leaderboard,
      user_fantasy_team: updatedUserTeam,
      fantasy_leaderboard: fantasyLeaderboard,
      current_fixture: initialFixtures[0] || null,
      fixtures: initialFixtures,
      allPlayers: ALL_PLAYERS,
      activeModal: 'none',
      selectedFixtureForScorecard: null,
      selectedPlayerForDetails: null,
      commandHistory: [
        {
          id: 'init_welcome',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          command: 'SYSTEM_BOOT',
          output: '🔥 Official IPL 2026 Fantasy Engine loaded. Create your team name, select your 11 players (₹100 Cr purse), and start the 70-match season!'
        }
      ]
    };
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [state]);

  const humanTeam: Team = useMemo(() => {
    const ft = state.user_fantasy_team || defaultFantasyTeam;
    return {
      id: ft.id,
      name: ft.name,
      shortCode: ft.shortCode,
      is_human: true,
      budget_remaining: ft.budget_remaining,
      roster: [...ft.roster],
      playing_xi: [...ft.playing_xi],
      captain: ft.captain,
      vice_captain: ft.vice_captain,
      impact_sub: ft.impact_sub || (ft.playing_xi.length > 0 ? ft.playing_xi[0] : ''),
      substitutes: [...ft.substitutes],
      color: ft.color,
      secondaryColor: ft.secondaryColor,
      logoEmoji: ft.logoEmoji,
      stats: {
        played: Object.keys(ft.matchdayPoints || {}).length,
        won: 0,
        lost: 0,
        tied: 0,
        points: 0,
        runsScored: 0,
        oversFaced: 0,
        runsConceded: 0,
        oversBowled: 0,
        nrr: 0,
        totalFantasyPoints: ft.totalFantasyPoints
      }
    };
  }, [state.user_fantasy_team, defaultFantasyTeam]);

  const currentMatchdayFixtures = useMemo(() => {
    return state.fixtures.filter(f => f.matchday === state.league_meta.current_matchday);
  }, [state.fixtures, state.league_meta.current_matchday]);

  const lastCompletedFixture = useMemo(() => {
    const completed = state.fixtures.filter(f => f.isCompleted);
    return completed.length > 0 ? completed[completed.length - 1] : null;
  }, [state.fixtures]);

  // Squad & Lineup Validation Rules:
  // - Squad Size: 15 to 18 players per team.
  // - Playing XI: Minimum 3 pure batters, 1 wicket-keeper, 1–2 all-rounders, 3–4 pure bowlers (total 11).
  // - Overseas Limit: Maximum 4 overseas players in the Playing XI.
  const validateLineupRules = (xiIds: string[]): ValidationResult => {
    const errors: string[] = [];
    if (xiIds.length !== 11) {
      errors.push(`Playing XI must contain exactly 11 players (currently ${xiIds.length}).`);
    }

    const players = xiIds.map(id => getPlayerById(id)).filter((p): p is Player => p !== undefined);

    let pureBatters = 0;
    let wks = 0;
    let allRounders = 0;
    let pureBowlers = 0;
    let overseas = 0;

    players.forEach(p => {
      if (p.role === 'BAT') pureBatters++;
      else if (p.role === 'WK') wks++;
      else if (p.role === 'AR') allRounders++;
      else if (p.role === 'BOWL') pureBowlers++;

      if (p.nationality === 'OVERSEAS') overseas++;
    });

    if (pureBatters < 3) {
      errors.push(`Must include at least 3 pure batters (selected: ${pureBatters}).`);
    }
    if (wks < 1) {
      errors.push(`Must include at least 1 wicket-keeper (selected: ${wks}).`);
    }
    if (allRounders < 1) {
      errors.push(`Must include at least 1 all-rounder (selected: ${allRounders}).`);
    }
    if (pureBowlers < 3) {
      errors.push(`Must include at least 3 pure bowlers (selected: ${pureBowlers}).`);
    }
    if (overseas > 4) {
      errors.push(`Overseas limit exceeded! Maximum 4 overseas players allowed (selected: ${overseas}).`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  // Official IPL Fantasy Initial Team Creator (Choose Team Name & Choose 11 Players, 100 Cr Purse)
  const createInitialFantasyTeam = (params: {
    teamName: string;
    playingXI: string[];
    captain: string;
    viceCaptain: string;
    logoEmoji?: string;
    baseColor?: string;
  }): { success: boolean; message: string } => {
    const { teamName, playingXI, captain, viceCaptain, logoEmoji, baseColor } = params;

    // 1. Must select exactly 11 players
    if (playingXI.length !== 11) {
      return { success: false, message: `You must select exactly 11 players (currently ${playingXI.length}).` };
    }

    // 2. Validate roles & overseas limits
    const validation = validateLineupRules(playingXI);
    if (!validation.valid) {
      return { success: false, message: validation.errors.join(' ') };
    }

    // 3. Validate Captain & Vice-Captain
    if (!playingXI.includes(captain)) {
      return { success: false, message: 'Captain must be one of your 11 selected players.' };
    }
    if (!playingXI.includes(viceCaptain)) {
      return { success: false, message: 'Vice-Captain must be one of your 11 selected players.' };
    }
    if (captain === viceCaptain) {
      return { success: false, message: 'Captain and Vice-Captain cannot be the same player.' };
    }

    // 4. Validate 100.0 Cr Budget Limit (No player > 11 Cr)
    const totalCost = playingXI.reduce((sum, id) => {
      const p = getPlayerById(id);
      return sum + (p ? p.currentPrice : 0);
    }, 0);
    const roundedCost = Math.round(totalCost * 10) / 10;
    if (roundedCost > 100.0) {
      return {
        success: false,
        message: `Total cost exceeds ₹100.0 Cr budget! (Selected cost: ₹${roundedCost} Cr). Please adjust your 11 players.`
      };
    }

    // 5. Build Human Fantasy Team with ONLY these 11 players across any of the 10 IPL franchises
    const availablePresets = IPL_FRANCHISES_PRESET.slice(0, 10);
    const updated10Teams: Team[] = availablePresets.map(preset =>
      createInitialTeamFromPreset(preset, false)
    );

    const newUserFantasyTeam: UserFantasyTeam = {
      id: 'user_fantasy_team',
      name: teamName.trim() || 'My Fantasy XI',
      shortCode: (teamName.trim().replace(/[^a-zA-Z]/g, '').slice(0, 3) || 'MYF').toUpperCase(),
      logoEmoji: logoEmoji || '🔥',
      color: baseColor || '#0284c7',
      secondaryColor: '#f59e0b',
      budget_remaining: Math.max(0, Math.round((100.0 - roundedCost) * 10) / 10),
      playing_xi: [...playingXI],
      roster: [...playingXI],
      captain,
      vice_captain: viceCaptain,
      impact_sub: playingXI[0],
      substitutes: [],
      totalFantasyPoints: 0,
      matchdayPoints: {}
    };

    const newFixtures = generateLeagueFixtures(updated10Teams, 14);
    const { updatedTeams: standingTeams, leaderboard } = updateTeamStatsAndStandings(updated10Teams, []);
    const { updatedUserTeam, fantasyLeaderboard } = computeFantasyLeaderboard(newUserFantasyTeam, []);

    const newTransfers: FantasyTransfersState = {
      league_transfers_remaining: 100,
      league_transfers_total: 100,
      playoffs_transfers_remaining: 10,
      playoffs_transfers_total: 10,
      is_unlimited_window: false,
      playoffs_started: false,
      history: []
    };

    setState(prev => ({
      ...prev,
      is_team_created: true,
      teams: standingTeams,
      leaderboard,
      user_fantasy_team: updatedUserTeam,
      fantasy_leaderboard: fantasyLeaderboard,
      fixtures: newFixtures,
      current_fixture: newFixtures[0] || null,
      transfers_state: newTransfers,
      boosters_state: defaultBoosterState,
      activeModal: 'none',
      league_meta: {
        season: 'IPL 2026',
        current_matchday: 1,
        total_matchdays: 14,
        playoffs_stage: 'League',
        draft_type: 'baseline',
        league_size: 10
      },
      commandHistory: [
        ...prev.commandHistory,
        {
          id: `team_created_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          command: `/create_team "${teamName}"`,
          output: `🎉 Official IPL Fantasy Team "${teamName}" locked with 11 players (₹${roundedCost} Cr spent / ₹100.0 Cr). 100 League Transfers initialized for 70 Matches.`
        }
      ]
    }));

    return {
      success: true,
      message: `🎉 Team "${teamName}" created! 11 players locked with 100 Transfers for the 70 league matches.`
    };
  };

  // Tournament Initialization
  const initTournament = (params: {
    franchiseName: string;
    leagueSize: number;
    format: 'auction' | 'snake' | 'baseline';
    chosenBaseFranchiseId?: string;
  }) => {
    const { franchiseName, leagueSize, format, chosenBaseFranchiseId } = params;

    const availablePresets = [...IPL_FRANCHISES_PRESET];
    // Take leagueSize presets
    const selectedPresets = availablePresets.slice(0, leagueSize);

    // If custom base franchise chosen for human
    let humanPreset = selectedPresets[0];
    if (chosenBaseFranchiseId) {
      const found = availablePresets.find(p => p.id === chosenBaseFranchiseId);
      if (found) humanPreset = found;
    }

    const teams: Team[] = selectedPresets.map(preset => {
      const isHuman = preset.id === humanPreset.id;
      const initial = createInitialTeamFromPreset(preset, isHuman);
      if (isHuman) {
        initial.name = franchiseName || 'User XI';
        initial.shortCode = franchiseName.slice(0, 3).toUpperCase() || 'UXI';
        if (format === 'auction') {
          // In auction mode, teams start with empty rosters and ₹100 Cr purse
          initial.roster = [];
          initial.playing_xi = [];
          initial.captain = '';
          initial.vice_captain = '';
          initial.impact_sub = '';
          initial.substitutes = [];
          initial.budget_remaining = 100.0;
        }
      }
      return initial;
    });

    const newFixtures = generateLeagueFixtures(teams, 14);
    const { updatedTeams, leaderboard } = updateTeamStatsAndStandings(teams, []);

    const newMeta: LeagueMeta = {
      season: 'IPL 2026',
      current_matchday: 1,
      total_matchdays: 14,
      playoffs_stage: 'League',
      draft_type: format,
      league_size: leagueSize
    };

    setState(prev => ({
      ...prev,
      league_meta: newMeta,
      teams: updatedTeams,
      leaderboard,
      fixtures: newFixtures,
      current_fixture: newFixtures[0] || null,
      activeModal: format === 'auction' ? 'auction' : 'none',
      commandHistory: [
        ...prev.commandHistory,
        {
          id: `init_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          command: `/init [${franchiseName}, ${leagueSize} teams, ${format}]`,
          output: `✅ Franchise "${franchiseName}" registered. Tournament initialized with ${leagueSize} teams in ${format.toUpperCase()} mode.`
        }
      ]
    }));
  };

  // Reset Tournament
  const resetTournament = () => {
    localStorage.removeItem(STORAGE_KEY);
    const initialPresets = IPL_FRANCHISES_PRESET.slice(0, 10);
    const initialTeams = initialPresets.map(preset => createInitialTeamFromPreset(preset, false));

    const initialFixtures = generateLeagueFixtures(initialTeams, 14);
    const { updatedTeams, leaderboard } = updateTeamStatsAndStandings(initialTeams, []);
    const { updatedUserTeam, fantasyLeaderboard } = computeFantasyLeaderboard(defaultFantasyTeam, []);

    setState(prev => ({
      is_team_created: false,
      league_meta: defaultMeta,
      transfers_state: defaultTransfersState,
      boosters_state: defaultBoosterState,
      season_history: prev.season_history || [],
      show_season_end_modal: false,
      teams: updatedTeams,
      leaderboard,
      user_fantasy_team: updatedUserTeam,
      fantasy_leaderboard: fantasyLeaderboard,
      current_fixture: initialFixtures[0] || null,
      fixtures: initialFixtures,
      allPlayers: ALL_PLAYERS,
      activeModal: 'none',
      selectedFixtureForScorecard: null,
      selectedPlayerForDetails: null,
      commandHistory: [
        {
          id: `reset_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          command: '/reset',
          output: '🔄 League state reset. Create your team name and pick your 11 players!'
        }
      ]
    }));
  };

  // Compute Current Season Summary / Accolades
  const getSeasonSummary = (): SeasonArchive | null => {
    return computeSeasonSummary(state);
  };

  // Start New Season & Pick New Team for Next Year
  const startNewSeason = (params?: {
    nextYear?: number;
    seasonName?: string;
    keepSameTeamName?: boolean;
  }) => {
    const summary = computeSeasonSummary(state);
    const { nextYear, nextSeasonName: defaultNextName } = parseSeasonYears(state.league_meta.season);
    const resolvedNextYear = params?.nextYear || nextYear;
    const resolvedSeasonName = params?.seasonName?.trim() || `IPL ${resolvedNextYear}`;

    // Archive current completed season to Franchise Trophy Cabinet if summary exists & matches were played
    let updatedHistory = state.season_history || [];
    const completedMatches = state.fixtures.filter(f => f.isCompleted).length;

    if (summary && completedMatches > 0) {
      updatedHistory = [
        summary,
        ...updatedHistory.filter(h => h.season !== state.league_meta.season)
      ];
    }

    const initialPresets = IPL_FRANCHISES_PRESET.slice(0, 10);
    const freshTeams = initialPresets.map(preset => createInitialTeamFromPreset(preset, false));

    const prevTeamName = params?.keepSameTeamName ? humanTeam.name : 'My Fantasy XI';
    const freshUserFantasyTeam: UserFantasyTeam = {
      id: 'user_fantasy_team',
      name: prevTeamName,
      shortCode: (prevTeamName.replace(/[^a-zA-Z]/g, '').slice(0, 3) || 'MYF').toUpperCase(),
      logoEmoji: humanTeam.logoEmoji || '🔥',
      color: humanTeam.color || '#0284c7',
      secondaryColor: '#f59e0b',
      budget_remaining: 100.0,
      playing_xi: [],
      roster: [],
      captain: '',
      vice_captain: '',
      impact_sub: '',
      substitutes: [],
      totalFantasyPoints: 0,
      matchdayPoints: {}
    };

    const freshFixtures = generateLeagueFixtures(freshTeams, 14);
    const { updatedTeams, leaderboard } = updateTeamStatsAndStandings(freshTeams, []);
    const { updatedUserTeam, fantasyLeaderboard } = computeFantasyLeaderboard(freshUserFantasyTeam, []);

    const newLeagueMeta: LeagueMeta = {
      season: resolvedSeasonName,
      current_matchday: 1,
      total_matchdays: 14,
      playoffs_stage: 'League',
      draft_type: 'baseline',
      league_size: 10
    };

    const newTransfersState: FantasyTransfersState = {
      league_transfers_remaining: 100,
      league_transfers_total: 100,
      playoffs_transfers_remaining: 10,
      playoffs_transfers_total: 10,
      is_unlimited_window: false,
      playoffs_started: false,
      history: []
    };

    const nextState: FLAMEState = {
      is_team_created: false, // Opens team creator so user can draft brand new 11 & pick team name for the new year!
      league_meta: newLeagueMeta,
      transfers_state: newTransfersState,
      boosters_state: defaultBoosterState,
      season_history: updatedHistory,
      show_season_end_modal: false,
      teams: updatedTeams,
      leaderboard,
      user_fantasy_team: updatedUserTeam,
      fantasy_leaderboard: fantasyLeaderboard,
      current_fixture: freshFixtures[0] || null,
      fixtures: freshFixtures,
      allPlayers: ALL_PLAYERS,
      activeModal: 'none',
      selectedFixtureForScorecard: null,
      selectedPlayerForDetails: null,
      commandHistory: [
        {
          id: `new_season_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          command: `/new-season [${resolvedSeasonName}]`,
          output: `🎆 Welcome to ${resolvedSeasonName}! Brand new 70-match league schedule generated with 100 fresh transfers and all 10 boosters restored. Pick your team name and 11 players to begin your title campaign!`
        }
      ]
    };

    setState(nextState);
  };

  // Update Lineup (Dream11 Rule Engine: 100 Credits, 11 Players, 100 League Transfers for 70 Matches, Unlimited Playoffs Window, 10 Playoff Transfers)
  const updateUserLineup = (
    playingXI: string[],
    captain: string,
    viceCaptain: string,
    impactSub: string,
    substitutes?: string[]
  ): { success: boolean; message: string; transfersUsed: number } => {
    // 1. Validation of squad composition rules
    const validation = validateLineupRules(playingXI);
    if (!validation.valid) {
      return { success: false, message: validation.errors.join(' '), transfersUsed: 0 };
    }

    if (!playingXI.includes(captain)) {
      return { success: false, message: 'Captain must be part of the Playing XI.', transfersUsed: 0 };
    }
    if (!playingXI.includes(viceCaptain)) {
      return { success: false, message: 'Vice-Captain must be part of the Playing XI.', transfersUsed: 0 };
    }
    if (captain === viceCaptain) {
      return { success: false, message: 'Captain and Vice-Captain cannot be the same player.', transfersUsed: 0 };
    }

    // 2. 100 Credits Limit Enforcement
    const totalCredits = playingXI.reduce((sum, pId) => {
      const p = getPlayerById(pId);
      return sum + (p ? p.currentPrice : 0);
    }, 0);
    const roundedCredits = Math.round(totalCredits * 10) / 10;

    if (roundedCredits > 100.0) {
      return {
        success: false,
        message: `Lineup exceeds 100.0 credits! Your team cost is ₹${roundedCredits} Cr (Budget: ₹100.0 Cr). Please replace expensive players to stay within 100 credits.`,
        transfersUsed: 0
      };
    }

    // 3. Transfers Calculation:
    // How many players in playingXI are NEW compared to previously saved humanTeam.playing_xi?
    const previousXI = humanTeam.playing_xi || [];
    const isInitialDraft = previousXI.length === 0;

    const playersIn = playingXI.filter(id => !previousXI.includes(id));
    const playersOut = previousXI.filter(id => !playingXI.includes(id));
    const transfersCount = isInitialDraft ? 0 : playersIn.length;

    const transfers = state.transfers_state || defaultTransfersState;
    const isUnlimited = transfers.is_unlimited_window;
    let newLeagueRemaining = transfers.league_transfers_remaining;
    let newPlayoffsRemaining = transfers.playoffs_transfers_remaining;
    let remainingAfter: number | 'Unlimited' = 'Unlimited';

    if (!isUnlimited && !isInitialDraft && transfersCount > 0) {
      if (transfers.playoffs_started) {
        // Playoff stage: user only has 10 transfers total
        if (transfersCount > transfers.playoffs_transfers_remaining) {
          return {
            success: false,
            message: `Exceeded playoff transfers limit! You have ${transfers.playoffs_transfers_remaining} of 10 transfers remaining for the playoffs, but need ${transfersCount}.`,
            transfersUsed: 0
          };
        }
        newPlayoffsRemaining -= transfersCount;
        remainingAfter = newPlayoffsRemaining;
      } else {
        // League stage: user has 100 transfers across the 70 matches
        if (transfersCount > transfers.league_transfers_remaining) {
          return {
            success: false,
            message: `Exceeded league transfers limit! You have ${transfers.league_transfers_remaining} of 100 transfers remaining for the 70 league matches, but need ${transfersCount}.`,
            transfersUsed: 0
          };
        }
        newLeagueRemaining -= transfersCount;
        remainingAfter = newLeagueRemaining;
      }
    }

    const transferRecord: FantasyTransferRecord | null = (!isInitialDraft && transfersCount > 0) ? {
      id: `tr_${Date.now()}`,
      matchday: state.league_meta.current_matchday,
      transfersCount,
      playersIn,
      playersOut,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stage: isUnlimited ? 'playoffs_prep' : transfers.playoffs_started ? 'playoffs' : 'league',
      remainingAfter
    } : null;

    setState(prev => {
      const currentFantasy = prev.user_fantasy_team || defaultFantasyTeam;
      const updatedRoster = Array.from(new Set([...(currentFantasy.roster || []), ...playingXI]));
      const finalSubs = substitutes || currentFantasy.substitutes || [];

      const updatedUserFantasyTeam: UserFantasyTeam = {
        ...currentFantasy,
        roster: updatedRoster,
        playing_xi: [...playingXI],
        captain,
        vice_captain: viceCaptain,
        impact_sub: impactSub || finalSubs[0] || playingXI[0],
        substitutes: finalSubs,
        budget_remaining: Math.round((100.0 - roundedCredits) * 10) / 10
      };

      const completed = prev.fixtures.filter(f => f.isCompleted);
      const { updatedUserTeam, fantasyLeaderboard } = computeFantasyLeaderboard(
        updatedUserFantasyTeam,
        completed,
        prev.boosters_state?.activeBoosterForNextMatch
      );

      const updatedTransfers: FantasyTransfersState = {
        ...(prev.transfers_state || defaultTransfersState),
        league_transfers_remaining: newLeagueRemaining,
        playoffs_transfers_remaining: newPlayoffsRemaining,
        history: transferRecord
          ? [transferRecord, ...(prev.transfers_state?.history || [])]
          : (prev.transfers_state?.history || [])
      };

      const transferNotice = isInitialDraft
        ? 'Initial Dream11 Starting XI saved (Free).'
        : isUnlimited
        ? `Playoffs Prep: ${transfersCount} swaps made under Unlimited Free Transfers!`
        : transfers.playoffs_started
        ? `Playoff Transfers: ${transfersCount} used (${newPlayoffsRemaining}/10 remaining).`
        : `League Transfers: ${transfersCount} used (${newLeagueRemaining}/100 remaining for 70 matches).`;

      return {
        ...prev,
        user_fantasy_team: updatedUserTeam,
        fantasy_leaderboard: fantasyLeaderboard,
        transfers_state: updatedTransfers,
        commandHistory: [
          ...prev.commandHistory,
          {
            id: `lineup_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            command: `/lineup [C: ${getPlayerById(captain)?.shortName}, VC: ${getPlayerById(viceCaptain)?.shortName}]`,
            output: `✅ Dream11 Team updated. ${transferNotice} Total: ₹${roundedCredits}/100.0 Credits.`
          }
        ]
      };
    });

    const successSummary = isUnlimited
      ? 'Team updated with Unlimited Free Transfers!'
      : isInitialDraft
      ? 'Initial Dream11 Team locked (0 transfers used).'
      : `${transfersCount} transfer${transfersCount === 1 ? '' : 's'} used successfully.`;

    return {
      success: true,
      message: successSummary,
      transfersUsed: transfersCount
    };
  };

  // Transfer Player
  const transferPlayer = (dropPlayerId: string, addPlayerId: string) => {
    const dropP = getPlayerById(dropPlayerId);
    const addP = getPlayerById(addPlayerId);

    if (!dropP || !addP) {
      return { success: false, message: 'Player not found in database.' };
    }

    const currentRoster = humanTeam.roster;
    if (!currentRoster.includes(dropPlayerId)) {
      return { success: false, message: `${dropP.name} is not in your squad.` };
    }
    if (currentRoster.includes(addPlayerId)) {
      return { success: false, message: `${addP.name} is already in your squad.` };
    }

    // Budget check
    const costDiff = addP.currentPrice - dropP.currentPrice;
    if (humanTeam.budget_remaining - costDiff < 0) {
      return {
        success: false,
        message: `Insufficient budget! Need ₹${costDiff.toFixed(2)} Cr more. Current purse: ₹${humanTeam.budget_remaining.toFixed(2)} Cr.`
      };
    }

    // Check transfer limit & boosters (Free Hit / Wild Card grant unlimited free transfers)
    const transfers = state.transfers_state || defaultTransfersState;
    const isUnlimited = transfers.is_unlimited_window;
    const activeBooster = state.boosters_state?.activeBoosterForNextMatch;
    const isFreeHit = activeBooster === 'free_hit';
    const isWildCard = activeBooster === 'wild_card';
    const isFreeTransfers = isUnlimited || isFreeHit || isWildCard;

    let newLeagueRemaining = transfers.league_transfers_remaining;
    let newPlayoffsRemaining = transfers.playoffs_transfers_remaining;
    let remainingAfter: number | 'Unlimited' = 'Unlimited';

    if (!isFreeTransfers) {
      if (transfers.playoffs_started) {
        if (transfers.playoffs_transfers_remaining <= 0) {
          return {
            success: false,
            message: 'You have used all 10 playoff transfers!'
          };
        }
        newPlayoffsRemaining -= 1;
        remainingAfter = newPlayoffsRemaining;
      } else {
        if (transfers.league_transfers_remaining <= 0) {
          return {
            success: false,
            message: 'You have used all 100 league transfers for the 70 matches!'
          };
        }
        newLeagueRemaining -= 1;
        remainingAfter = newLeagueRemaining;
      }
    } else {
      remainingAfter = transfers.playoffs_started ? newPlayoffsRemaining : newLeagueRemaining;
    }

    const transferRecord: FantasyTransferRecord = {
      id: `tr_${Date.now()}`,
      matchday: state.league_meta.current_matchday,
      transfersCount: 1,
      playersIn: [addPlayerId],
      playersOut: [dropPlayerId],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      stage: isUnlimited ? 'playoffs_prep' : transfers.playoffs_started ? 'playoffs' : 'league',
      remainingAfter
    };

    // Update roster
    const newRoster = currentRoster.map(id => (id === dropPlayerId ? addPlayerId : id));
    let newXI = humanTeam.playing_xi.map(id => (id === dropPlayerId ? addPlayerId : id));
    let newCaptain = humanTeam.captain === dropPlayerId ? addPlayerId : humanTeam.captain;
    let newVC = humanTeam.vice_captain === dropPlayerId ? addPlayerId : humanTeam.vice_captain;
    let newImpact = humanTeam.impact_sub === dropPlayerId ? addPlayerId : humanTeam.impact_sub;
    let newSubs = humanTeam.substitutes.map(id => (id === dropPlayerId ? addPlayerId : id));

    setState(prev => {
      const currentFantasy = prev.user_fantasy_team || defaultFantasyTeam;
      const updatedUserFantasyTeam: UserFantasyTeam = {
        ...currentFantasy,
        roster: newRoster,
        playing_xi: newXI,
        captain: newCaptain,
        vice_captain: newVC,
        impact_sub: newImpact,
        substitutes: newSubs,
        budget_remaining: Math.round((currentFantasy.budget_remaining - costDiff) * 100) / 100
      };

      const completed = prev.fixtures.filter(f => f.isCompleted);
      const { updatedUserTeam, fantasyLeaderboard } = computeFantasyLeaderboard(
        updatedUserFantasyTeam,
        completed,
        prev.boosters_state?.activeBoosterForNextMatch
      );

      const updatedTransfers: FantasyTransfersState = {
        ...(prev.transfers_state || defaultTransfersState),
        league_transfers_remaining: newLeagueRemaining,
        playoffs_transfers_remaining: newPlayoffsRemaining,
        history: [transferRecord, ...(prev.transfers_state?.history || [])]
      };

      // If Free Hit, save original playing XI to restore after match
      let updatedBoosters = prev.boosters_state || defaultBoosterState;
      if (isFreeHit && !updatedBoosters.savedFreeHitLineup) {
        updatedBoosters = {
          ...updatedBoosters,
          savedFreeHitLineup: [...humanTeam.playing_xi]
        };
      }

      const transferMsg = isFreeHit
        ? '✨ FREE HIT ACTIVE: 0 transfers deducted (Squad reverts after match).'
        : isWildCard
        ? '🔄 WILD CARD ACTIVE: 0 transfers deducted (Permanent rebuild).'
        : isUnlimited
        ? 'Free Transfer used (Playoffs Prep Window).'
        : transfers.playoffs_started
        ? `1 Playoff Transfer used (${newPlayoffsRemaining}/10 remaining).`
        : `1 League Transfer used (${newLeagueRemaining}/100 remaining for 70 matches).`;

      return {
        ...prev,
        user_fantasy_team: updatedUserTeam,
        fantasy_leaderboard: fantasyLeaderboard,
        transfers_state: updatedTransfers,
        boosters_state: updatedBoosters,
        commandHistory: [
          ...prev.commandHistory,
          {
            id: `transfer_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            command: `/transfer [${dropP.name}] for [${addP.name}]`,
            output: `🔄 Transfer executed: Dropped ${dropP.name} & Added ${addP.name}. ${transferMsg} Remaining purse: ₹${(humanTeam.budget_remaining - costDiff).toFixed(2)} Cr.`
          }
        ]
      };
    });

    return {
      success: true,
      message: `Successfully transferred ${dropP.name} for ${addP.name}.`
    };
  };

  // Add player to roster during auction
  const addPlayerToHumanRoster = (player: Player, cost: number) => {
    setState(prev => {
      const currentFantasy = prev.user_fantasy_team || defaultFantasyTeam;
      const newRoster = [...currentFantasy.roster, player.id];
      let newXI = [...currentFantasy.playing_xi];
      if (newXI.length < 11) newXI.push(player.id);
      const newCaptain = currentFantasy.captain || (newXI.length > 0 ? newXI[0] : '');
      const newVC = currentFantasy.vice_captain || (newXI.length > 1 ? newXI[1] : '');
      const newImpact = currentFantasy.impact_sub || (newXI.length > 0 ? newXI[0] : '');

      const updatedUserFantasyTeam: UserFantasyTeam = {
        ...currentFantasy,
        roster: newRoster,
        playing_xi: newXI,
        captain: newCaptain,
        vice_captain: newVC,
        impact_sub: newImpact,
        budget_remaining: Math.round((currentFantasy.budget_remaining - cost) * 100) / 100
      };

      const completed = prev.fixtures.filter(f => f.isCompleted);
      const { updatedUserTeam, fantasyLeaderboard } = computeFantasyLeaderboard(
        updatedUserFantasyTeam,
        completed,
        prev.boosters_state?.activeBoosterForNextMatch
      );

      return {
        ...prev,
        user_fantasy_team: updatedUserTeam,
        fantasy_leaderboard: fantasyLeaderboard
      };
    });
  };

  // Commit result from Live Match Viewer Room
  const commitLiveMatchResult = (fixtureId: string, result: MatchSimulationResult) => {
    setState(prev => {
      const updatedFixtures = prev.fixtures.map(f => {
        if (f.id === fixtureId) {
          return {
            ...f,
            isCompleted: true,
            result
          };
        }
        return f;
      });

      const allCompleted = updatedFixtures.filter(f => f.isCompleted);
      const { updatedTeams, leaderboard } = updateTeamStatsAndStandings(prev.teams, allCompleted);
      const currentFantasy = prev.user_fantasy_team || defaultFantasyTeam;
      const { updatedUserTeam, fantasyLeaderboard } = computeFantasyLeaderboard(
        currentFantasy,
        allCompleted,
        prev.boosters_state?.activeBoosterForNextMatch
      );

      // Check if all fixtures for current round are now done
      const currentDayFixtures = updatedFixtures.filter(f => f.matchday === prev.league_meta.current_matchday);
      const allCurrentDayDone = currentDayFixtures.length > 0 && currentDayFixtures.every(f => f.isCompleted);

      let nextMatchday = prev.league_meta.current_matchday;
      let nextStage = prev.league_meta.playoffs_stage;
      let finalFixtures = updatedFixtures;
      let updatedTransfersState = { ...(prev.transfers_state || defaultTransfersState) };

      if (allCurrentDayDone) {
        if (prev.league_meta.current_matchday >= prev.league_meta.total_matchdays && prev.league_meta.playoffs_stage === 'League') {
          nextStage = 'Qualifier 1';
          nextMatchday = 15;
          const playoffFixtures = generatePlayoffFixtures(leaderboard, 'Qualifier 1');
          finalFixtures = [...updatedFixtures, ...playoffFixtures];
          updatedTransfersState.is_unlimited_window = true;
          updatedTransfersState.playoffs_started = false;
        } else if (prev.league_meta.playoffs_stage === 'League') {
          nextMatchday += 1;
        }
      }

      const isFinalJustCompleted = finalFixtures.some(f => f.playoffLabel === 'Final' && f.isCompleted);
      if (isFinalJustCompleted) {
        nextStage = 'Completed';
      }

      return {
        ...prev,
        league_meta: {
          ...prev.league_meta,
          current_matchday: nextMatchday,
          playoffs_stage: nextStage
        },
        transfers_state: updatedTransfersState,
        show_season_end_modal: isFinalJustCompleted ? true : prev.show_season_end_modal,
        teams: updatedTeams,
        leaderboard,
        user_fantasy_team: updatedUserTeam,
        fantasy_leaderboard: fantasyLeaderboard,
        fixtures: finalFixtures,
        current_fixture: finalFixtures.find(f => f.matchday === nextMatchday && !f.isCompleted) || null,
        selectedFixtureForScorecard: updatedFixtures.find(f => f.id === fixtureId) || null,
        commandHistory: [
          ...prev.commandHistory,
          {
            id: `live_${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            command: `/live [Match #${fixtureId.replace('fix_', '')}]`,
            output: `🏏 Live match completed: ${result.margin}. POTM: ${result.playerOfTheMatch.name}. Standings and fantasy scores synchronized!`
          }
        ]
      };
    });
  };

  // Simulate Current Matchday
  const simulateCurrentMatchday = (): MatchSimulationResult[] => {
    const currentFixtures = state.fixtures.filter(
      f => f.matchday === state.league_meta.current_matchday && !f.isCompleted
    );

    if (currentFixtures.length === 0) {
      return [];
    }

    const teamMap: { [id: string]: Team } = {};
    state.teams.forEach(t => { teamMap[t.id] = t; });

    const activeBooster = state.boosters_state?.activeBoosterForNextMatch;

    const results: MatchSimulationResult[] = [];
    const updatedFixtures = state.fixtures.map(f => {
      if (f.matchday === state.league_meta.current_matchday && !f.isCompleted) {
        const t1 = teamMap[f.team1Id];
        const t2 = teamMap[f.team2Id];
        if (t1 && t2) {
          const simResult = simulateT20Match(f, t1, t2, undefined, activeBooster);
          results.push(simResult);
          return {
            ...f,
            isCompleted: true,
            result: simResult
          };
        }
      }
      return f;
    });

    const allCompleted = updatedFixtures.filter(f => f.isCompleted);
    let { updatedTeams, leaderboard } = updateTeamStatsAndStandings(state.teams, allCompleted);

    // Process booster consequences (quota decrement, history log, Free Hit reversion)
    let nextBoostersState: BoosterUsageState = {
      ...(state.boosters_state || defaultBoosterState),
      activeBoosterForNextMatch: null
    };

    let boosterSummaryMsg = '';
    const currentFantasy = state.user_fantasy_team || defaultFantasyTeam;
    let nextUserFantasy = { ...currentFantasy };

    if (activeBooster) {
      const boosterDef = getBoosterById(activeBooster);
      const remaining = Math.max(0, (nextBoostersState.remainingUses[activeBooster] ?? 1) - 1);
      nextBoostersState.remainingUses = {
        ...nextBoostersState.remainingUses,
        [activeBooster]: remaining
      };

      nextBoostersState.history = [
        {
          id: `bh_${Date.now()}`,
          matchday: state.league_meta.current_matchday,
          boosterId: activeBooster,
          boosterName: boosterDef?.name || activeBooster,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          bonusPointsEarned: 0
        },
        ...nextBoostersState.history
      ];

      boosterSummaryMsg = ` ⚡ Booster "${boosterDef?.name || activeBooster}" was applied! (${remaining} use${remaining === 1 ? '' : 's'} remaining).`;

      // If Free Hit was used, restore the pre-Free Hit playing XI
      if (activeBooster === 'free_hit' && nextBoostersState.savedFreeHitLineup) {
        nextUserFantasy.playing_xi = [...nextBoostersState.savedFreeHitLineup];
        nextBoostersState.savedFreeHitLineup = null;
        boosterSummaryMsg += ' Free Hit concluded: Original starting 11 restored!';
      }
    }

    const { updatedUserTeam, fantasyLeaderboard } = computeFantasyLeaderboard(
      nextUserFantasy,
      allCompleted,
      activeBooster
    );

    const isLastLeagueDay = state.league_meta.current_matchday >= state.league_meta.total_matchdays;
    let nextStage: PlayoffsStage = state.league_meta.playoffs_stage;
    let nextMatchday = state.league_meta.current_matchday;
    let finalFixtures = updatedFixtures;

    const currentTransfers = state.transfers_state || defaultTransfersState;
    let updatedTransfersState: FantasyTransfersState = { ...currentTransfers };
    let playoffNotice = '';

    if (isLastLeagueDay && state.league_meta.playoffs_stage === 'League') {
      // 70 League Matches Completed! Reached Playoffs!
      nextStage = 'Qualifier 1';
      nextMatchday = 15;
      const playoffFixtures = generatePlayoffFixtures(leaderboard, 'Qualifier 1');
      finalFixtures = [...updatedFixtures, ...playoffFixtures];

      // Unlimited transfers window activated for playoffs prep!
      updatedTransfersState.is_unlimited_window = true;
      updatedTransfersState.playoffs_started = false;
      playoffNotice = ' 🎉 70 LEAGUE MATCHES COMPLETE! REACHED PLAYOFFS! Unlimited Transfers Window is now OPEN. Rebuild your 11 from the 4 qualified playoff teams!';
    } else if (state.league_meta.playoffs_stage === 'League') {
      nextMatchday += 1;
    } else {
      // Playoff match has commenced - close unlimited window and grant 10 playoff transfers
      if (!currentTransfers.playoffs_started) {
        updatedTransfersState.is_unlimited_window = false;
        updatedTransfersState.playoffs_started = true;
        updatedTransfersState.playoffs_transfers_remaining = 10;
        updatedTransfersState.playoffs_transfers_total = 10;
        playoffNotice = ' 🏆 PLAYOFFS HAVE STARTED! Unlimited transfers window closed. You now have 10 TRANSFERS for the entire playoff stage (Q1, Eliminator, Q2, Final).';
      }
    }

    const isFinalJustCompleted = finalFixtures.some(f => f.playoffLabel === 'Final' && f.isCompleted);
    let triggerSeasonEndModal = false;
    if (isFinalJustCompleted) {
      nextStage = 'Completed';
      triggerSeasonEndModal = true;
      playoffNotice += ' 🏆 TATA IPL FINAL IS COMPLETE! CHAMPIONS CROWNED! Season is wrapped up. Review awards, or start a new year and draft a new team!';
    }

    setState(prev => ({
      ...prev,
      league_meta: {
        ...prev.league_meta,
        current_matchday: nextMatchday,
        playoffs_stage: nextStage
      },
      transfers_state: updatedTransfersState,
      boosters_state: nextBoostersState,
      show_season_end_modal: triggerSeasonEndModal ? true : prev.show_season_end_modal,
      teams: updatedTeams,
      leaderboard,
      user_fantasy_team: updatedUserTeam,
      fantasy_leaderboard: fantasyLeaderboard,
      fixtures: finalFixtures,
      current_fixture: finalFixtures.find(f => f.matchday === nextMatchday && !f.isCompleted) || null,
      selectedFixtureForScorecard: results[0] ? finalFixtures.find(f => f.id === results[0].fixtureId) || null : null,
      commandHistory: [
        ...prev.commandHistory,
        {
          id: `sim_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          command: '/simulate',
          output: `🏏 Matchday ${state.league_meta.current_matchday} simulated (${results.length} matches completed). ${results.map(r => r.margin).join(' | ')}${boosterSummaryMsg}${playoffNotice}`
        }
      ]
    }));

    return results;
  };

  // Fast Forward Matchdays
  const fastForwardMatchdays = (n: number) => {
    let count = Math.max(1, Math.min(n, 14));
    let lastResults: MatchSimulationResult[] = [];

    let currentFixtures = [...state.fixtures];
    let currentTeams = [...state.teams];
    let currentMatchday = state.league_meta.current_matchday;
    let currentStage = state.league_meta.playoffs_stage;

    for (let step = 0; step < count; step++) {
      if (currentMatchday > 14 && currentStage !== 'League') break;

      const teamMap: { [id: string]: Team } = {};
      currentTeams.forEach(t => { teamMap[t.id] = t; });

      const dayFixtures = currentFixtures.filter(f => f.matchday === currentMatchday && !f.isCompleted);
      if (dayFixtures.length === 0) break;

      currentFixtures = currentFixtures.map(f => {
        if (f.matchday === currentMatchday && !f.isCompleted) {
          const t1 = teamMap[f.team1Id];
          const t2 = teamMap[f.team2Id];
          if (t1 && t2) {
            const simResult = simulateT20Match(f, t1, t2);
            lastResults.push(simResult);
            return {
              ...f,
              isCompleted: true,
              result: simResult
            };
          }
        }
        return f;
      });

      const completed = currentFixtures.filter(f => f.isCompleted);
      const res = updateTeamStatsAndStandings(currentTeams, completed);
      currentTeams = res.updatedTeams;

      if (currentMatchday >= 14 && currentStage === 'League') {
        currentStage = 'Qualifier 1';
        currentMatchday = 15;
        const playoffFix = generatePlayoffFixtures(res.leaderboard, 'Qualifier 1');
        currentFixtures = [...currentFixtures, ...playoffFix];
        break;
      } else {
        currentMatchday++;
      }
    }

    const finalCompleted = currentFixtures.filter(f => f.isCompleted);
    const { updatedTeams, leaderboard } = updateTeamStatsAndStandings(currentTeams, finalCompleted);
    const currentFantasy = state.user_fantasy_team || defaultFantasyTeam;
    const { updatedUserTeam, fantasyLeaderboard } = computeFantasyLeaderboard(
      currentFantasy,
      finalCompleted
    );

    const isFinalDone = currentFixtures.some(f => f.playoffLabel === 'Final' && f.isCompleted);
    if (isFinalDone) {
      currentStage = 'Completed';
    }

    const reachedPlayoffsNow = currentMatchday >= 15 && state.league_meta.playoffs_stage === 'League';
    const updatedTransfers: FantasyTransfersState = reachedPlayoffsNow
      ? {
          ...(state.transfers_state || defaultTransfersState),
          is_unlimited_window: true,
          playoffs_started: false
        }
      : (state.transfers_state || defaultTransfersState);

    setState(prev => ({
      ...prev,
      league_meta: {
        ...prev.league_meta,
        current_matchday: currentMatchday,
        playoffs_stage: currentStage
      },
      transfers_state: updatedTransfers,
      show_season_end_modal: isFinalDone ? true : prev.show_season_end_modal,
      teams: updatedTeams,
      leaderboard,
      user_fantasy_team: updatedUserTeam,
      fantasy_leaderboard: fantasyLeaderboard,
      fixtures: currentFixtures,
      current_fixture: currentFixtures.find(f => f.matchday === currentMatchday && !f.isCompleted) || null,
      selectedFixtureForScorecard: lastResults.length > 0 ? currentFixtures.find(f => f.id === lastResults[lastResults.length - 1].fixtureId) || null : null,
      commandHistory: [
        ...prev.commandHistory,
        {
          id: `ff_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          command: `/fast-forward ${n}`,
          output: `⚡ Fast-forwarded ${count} matchdays. League is now at Matchday ${currentMatchday} (${currentStage}). Standings consolidated.${
            reachedPlayoffsNow ? ' 🎉 Reached playoffs! Unlimited transfers window activated!' : ''
          }${isFinalDone ? ' 🏆 Season Completed! Champions crowned!' : ''}`
        }
      ]
    }));
  };

  // Advance playoff stage
  const advancePlayoffStage = () => {
    // Qualifier 1 & Eliminator -> Qualifier 2 -> Final -> Completed
    const q1Fix = state.fixtures.find(f => f.playoffLabel === 'Qualifier 1');
    const elimFix = state.fixtures.find(f => f.playoffLabel === 'Eliminator');

    if (!q1Fix?.isCompleted || !elimFix?.isCompleted) {
      simulateCurrentMatchday();
      return;
    }

    if (state.league_meta.playoffs_stage === 'Qualifier 1') {
      const q1Loser = q1Fix.result?.winnerTeamId === q1Fix.team1Id ? q1Fix.team2Id : q1Fix.team1Id;
      const elimWinner = elimFix.result?.winnerTeamId;

      if (q1Loser && elimWinner) {
        const q2Fix: Fixture = {
          id: 'fix_playoff_q2',
          matchday: 16,
          team1Id: q1Loser,
          team2Id: elimWinner,
          venue: 'Narendra Modi Stadium, Ahmedabad',
          isCompleted: false,
          playoffLabel: 'Qualifier 2'
        };

        setState(prev => ({
          ...prev,
          league_meta: {
            ...prev.league_meta,
            current_matchday: 16,
            playoffs_stage: 'Qualifier 2'
          },
          fixtures: [...prev.fixtures, q2Fix]
        }));
      }
    } else if (state.league_meta.playoffs_stage === 'Qualifier 2') {
      const q2Fix = state.fixtures.find(f => f.playoffLabel === 'Qualifier 2');
      const q1Winner = q1Fix.result?.winnerTeamId;
      const q2Winner = q2Fix?.result?.winnerTeamId;

      if (q1Winner && q2Winner) {
        const finalFix: Fixture = {
          id: 'fix_playoff_final',
          matchday: 17,
          team1Id: q1Winner,
          team2Id: q2Winner,
          venue: 'MA Chidambaram Stadium, Chepauk, Chennai',
          isCompleted: false,
          playoffLabel: 'Final'
        };

        setState(prev => ({
          ...prev,
          league_meta: {
            ...prev.league_meta,
            current_matchday: 17,
            playoffs_stage: 'Final'
          },
          fixtures: [...prev.fixtures, finalFix]
        }));
      }
    } else if (state.league_meta.playoffs_stage === 'Final') {
      simulateCurrentMatchday();
    }
  };

  // Command Execution Engine for CLI & Text Input
  const executeCommand = (cmdStr: string): string => {
    const raw = cmdStr.trim();
    if (!raw) return '';

    const parts = raw.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = raw.slice(cmd.length).trim();

    let output = '';
    let isError = false;

    switch (cmd) {
      case '/status': {
        const human = humanTeam;
        const leaderPos = state.leaderboard.findIndex(l => l.teamId === human.id) + 1;
        output = `📊 STATUS: ${human.name} | Budget: ₹${human.budget_remaining.toFixed(2)} Cr | Roster: ${human.roster.length}/18 | Rank: #${leaderPos} (Pts: ${human.stats.points}, NRR: ${human.stats.nrr > 0 ? '+' : ''}${human.stats.nrr}, Fantasy Pts: ${human.stats.totalFantasyPoints}) | Current Matchday: ${state.league_meta.current_matchday}/${state.league_meta.total_matchdays}`;
        break;
      }

      case '/simulate':
      case '/sim-next': {
        const res = simulateCurrentMatchday();
        if (res.length > 0) {
          output = `🏏 Simulated Matchday ${state.league_meta.current_matchday - 1}: ${res.map(r => r.margin).join('; ')}`;
        } else {
          output = '⚠️ No upcoming unplayed fixtures found for the current matchday.';
          isError = true;
        }
        break;
      }

      case '/scorecard': {
        const lastFix = lastCompletedFixture;
        if (!lastFix || !lastFix.result) {
          output = '⚠️ No matches have been simulated yet. Run /simulate first.';
          isError = true;
        } else {
          const r = lastFix.result;
          output = `📋 BOX SCORE [${r.venue}]:\n` +
            `1st Inn: ${r.innings1.teamName} ${r.innings1.totalRuns}/${r.innings1.wickets} (${r.innings1.overs} ov)\n` +
            `2nd Inn: ${r.innings2.teamName} ${r.innings2.totalRuns}/${r.innings2.wickets} (${r.innings2.overs} ov)\n` +
            `Result: ${r.margin}\n` +
            `Player of the Match: ${r.playerOfTheMatch.name} (${r.playerOfTheMatch.summary})`;
          setState(prev => ({
            ...prev,
            selectedFixtureForScorecard: lastFix,
            activeModal: 'scorecard'
          }));
        }
        break;
      }

      case '/fast-forward': {
        const count = parseInt(args, 10) || 1;
        fastForwardMatchdays(count);
        output = `⚡ Fast-forwarded ${count} matchdays. Standings table updated.`;
        break;
      }

      case '/transfer': {
        // Syntax: /transfer [Drop Player] for [Add Player]
        // or /transfer Drop Name for Add Name
        let dropName = '';
        let addName = '';

        if (args.includes(' for ')) {
          const tParts = args.split(' for ');
          dropName = tParts[0].replace(/\[|\]/g, '').trim();
          addName = tParts[1].replace(/\[|\]/g, '').trim();
        }

        if (!dropName || !addName) {
          output = '⚠️ Invalid syntax. Usage: /transfer [Drop Player Name] for [Add Player Name]';
          isError = true;
        } else {
          const dropP = ALL_PLAYERS.find(p => p.name.toLowerCase().includes(dropName.toLowerCase()) || p.shortName.toLowerCase().includes(dropName.toLowerCase()));
          const addP = ALL_PLAYERS.find(p => p.name.toLowerCase().includes(addName.toLowerCase()) || p.shortName.toLowerCase().includes(addName.toLowerCase()));

          if (!dropP) {
            output = `⚠️ Could not find player to drop matching "${dropName}".`;
            isError = true;
          } else if (!addP) {
            output = `⚠️ Could not find player to add matching "${addName}".`;
            isError = true;
          } else {
            const result = transferPlayer(dropP.id, addP.id);
            output = result.message;
            isError = !result.success;
          }
        }
        break;
      }

      case '/lineup': {
        // e.g. /lineup [Player 1, Player 2, ... C: Name, VC: Name, Sub: Name]
        // or open lineup modal
        if (!args) {
          setState(prev => ({ ...prev, activeModal: 'lineup' }));
          output = '📋 Lineup Builder GUI opened. You can arrange your 11, Captain, VC, and Impact Sub visually.';
        } else {
          // Parse string
          output = '📋 Lineup command parsed. Check Lineup Builder modal for confirmation.';
          setState(prev => ({ ...prev, activeModal: 'lineup' }));
        }
        break;
      }

      case '/reset': {
        resetTournament();
        output = '🔄 Tournament reset successfully.';
        break;
      }

      case '/new-season': {
        const nextName = args.trim() || undefined;
        startNewSeason({ seasonName: nextName });
        output = `🎆 Starting new season ${nextName || 'next year'}! Team creator opened.`;
        break;
      }

      case '/history':
      case '/trophies': {
        setState(prev => ({ ...prev, activeModal: 'season_archive' }));
        output = `📜 Opening Trophy Cabinet (${state.season_history?.length || 0} archived seasons).`;
        break;
      }

      case '/transfers': {
        const tr = state.transfers_state || defaultTransfersState;
        const isPl = tr.playoffs_started;
        const isUnl = tr.is_unlimited_window;
        output = `🔄 FANTASY TRANSFERS STATUS:\n` +
          `• Stage: ${isUnl ? 'Playoffs Prep Window (UNLIMITED TRANSFERS)' : isPl ? 'Playoffs Stage' : 'League Stage (70 Matches)'}\n` +
          `• Transfers Remaining: ${isUnl ? '∞ UNLIMITED' : isPl ? `${tr.playoffs_transfers_remaining} / 10` : `${tr.league_transfers_remaining} / 100`}\n` +
          `• Transfers Used Total: ${tr.history.reduce((sum, h) => sum + h.transfersCount, 0)}\n` +
          `• Recent Transactions: ${tr.history.length > 0 ? tr.history.slice(0, 3).map(h => `MD${h.matchday}: ${h.transfersCount} swaps (${h.playersIn.length} in)`).join('; ') : 'None yet'}`;
        break;
      }

      case '/help': {
        output = '📖 FLAME COMMAND REFERENCE:\n' +
          '• /status : Display current squad, remaining budget, and overall points table\n' +
          '• /transfers : Check transfers remaining (100 League, Unlimited Prep, 10 Playoffs)\n' +
          '• /lineup : Open Lineup Builder or specify [Player 1... C: Name, VC: Name, Sub: Name]\n' +
          '• /simulate : Run simulation for current matchday\n' +
          '• /scorecard : Display official box score and fantasy breakdown of last completed match\n' +
          '• /transfer [Drop Player] for [Add Player] : Swap players within purse limits\n' +
          '• /fast-forward [N] : Simulate N matchdays automatically and consolidate standings\n' +
          '• /new-season [Name] : Advance to next year and draft a new fantasy squad\n' +
          '• /history : View Trophy Cabinet & past season champions\n' +
          '• /reset : Reset tournament and start a new season';
        break;
      }

      default: {
        output = `⚠️ Unknown command "${cmd}". Type /help to view all available commands.`;
        isError = true;
      }
    }

    setState(prev => ({
      ...prev,
      commandHistory: [
        ...prev.commandHistory,
        {
          id: `cmd_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          command: raw,
          output,
          isError
        }
      ]
    }));

    return output;
  };

  const openScorecardModal = (fixture: Fixture) => {
    setState(prev => ({
      ...prev,
      selectedFixtureForScorecard: fixture,
      activeModal: 'scorecard'
    }));
  };

  const openLineupModal = () => setState(prev => ({ ...prev, activeModal: 'lineup' }));
  const openTransferModal = () => setState(prev => ({ ...prev, activeModal: 'transfer' }));
  const openAuctionModal = () => setState(prev => ({ ...prev, activeModal: 'auction' }));
  const openBoostersModal = () => setState(prev => ({ ...prev, activeModal: 'boosters' }));
  const openNewSeasonModal = () => setState(prev => ({ ...prev, activeModal: 'new_season' }));
  const openSeasonArchiveModal = () => setState(prev => ({ ...prev, activeModal: 'season_archive' }));
  const openSeasonEndModal = () => setState(prev => ({ ...prev, show_season_end_modal: true }));
  const closeSeasonEndModal = () => setState(prev => ({ ...prev, show_season_end_modal: false }));
  const closeModals = () => setState(prev => ({ ...prev, activeModal: 'none', show_season_end_modal: false }));
  const setSelectedPlayer = (player: Player | null) => setState(prev => ({ ...prev, selectedPlayerForDetails: player }));

  const activateBooster = (boosterId: BoosterId): { success: boolean; message: string } => {
    const booster = getBoosterById(boosterId);
    if (!booster) return { success: false, message: 'Invalid booster identifier.' };

    const remaining = state.boosters_state?.remainingUses[boosterId] ?? 0;
    if (remaining <= 0) {
      return { success: false, message: `No uses remaining for ${booster.name} this season.` };
    }

    if (state.boosters_state?.activeBoosterForNextMatch === boosterId) {
      return { success: true, message: `${booster.name} is already active for Matchday ${state.league_meta.current_matchday}!` };
    }

    setState(prev => ({
      ...prev,
      boosters_state: {
        ...(prev.boosters_state || defaultBoosterState),
        activeBoosterForNextMatch: boosterId
      },
      commandHistory: [
        ...prev.commandHistory,
        {
          id: `booster_${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          command: `/booster activate ${booster.name}`,
          output: `⚡ BOOSTER ACTIVATED: "${booster.name}" (${booster.multiplierText}). Effect will be active during Matchday ${prev.league_meta.current_matchday}!`
        }
      ]
    }));

    return {
      success: true,
      message: `🎉 "${booster.name}" activated for Matchday ${state.league_meta.current_matchday}! (${remaining} use${remaining === 1 ? '' : 's'} remaining)`
    };
  };

  const deactivateBooster = () => {
    setState(prev => ({
      ...prev,
      boosters_state: {
        ...(prev.boosters_state || defaultBoosterState),
        activeBoosterForNextMatch: null
      }
    }));
  };

  const syncSquadsWithAI = async (role?: string): Promise<{ success: boolean; report?: string; error?: string }> => {
    try {
      const res = await fetch('/api/gemini/sync-squads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: role || 'ALL' })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to sync squads with AI.');
      }
      return {
        success: true,
        report: data.report
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error communicating with AI squad scout.'
      };
    }
  };

  const getBoosterAdviceWithAI = async (): Promise<{ success: boolean; advice?: string; error?: string }> => {
    try {
      const currentFixture = state.fixtures.find(
        f => f.matchday === state.league_meta.current_matchday && !f.isCompleted
      );
      const res = await fetch('/api/gemini/booster-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchday: state.league_meta.current_matchday,
          venue: currentFixture?.venue || 'Wankhede Stadium, Mumbai',
          pitchCondition: 'Balanced Surface',
          teamComposition: {
            playingXI: humanTeam.playing_xi,
            captain: humanTeam.captain,
            remainingBoosters: state.boosters_state?.remainingUses || defaultBoosterState.remainingUses
          }
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to get booster recommendation from AI.');
      }
      return {
        success: true,
        advice: data.advice
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error communicating with AI booster advisor.'
      };
    }
  };

  return (
    <GameContext.Provider
      value={{
        state,
        humanTeam,
        userFantasyTeam: state.user_fantasy_team || defaultFantasyTeam,
        fantasyLeaderboard: state.fantasy_leaderboard || [],
        allTeams: state.teams,
        currentMatchdayFixtures,
        lastCompletedFixture,
        transfersState: state.transfers_state || defaultTransfersState,
        boostersState: state.boosters_state || defaultBoosterState,
        executeCommand,
        simulateCurrentMatchday,
        fastForwardMatchdays,
        activateBooster,
        deactivateBooster,
        syncSquadsWithAI,
        getBoosterAdviceWithAI,
        updateUserLineup,
        transferPlayer,
        validateLineupRules,
        createInitialFantasyTeam,
        initTournament,
        resetTournament,
        startNewSeason,
        openSeasonEndModal,
        closeSeasonEndModal,
        openNewSeasonModal,
        openSeasonArchiveModal,
        getSeasonSummary,
        openScorecardModal,
        openLineupModal,
        openTransferModal,
        openAuctionModal,
        openBoostersModal,
        closeModals,
        setSelectedPlayer,
        addPlayerToHumanRoster,
        advancePlayoffStage,
        commitLiveMatchResult
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
