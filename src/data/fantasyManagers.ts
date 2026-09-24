import { FantasyManagerEntry } from '../types/fantasy';

export const INITIAL_AI_FANTASY_MANAGERS: Omit<FantasyManagerEntry, 'rank'>[] = [
  {
    id: 'ai_kohli',
    teamName: "Kohli's Challengers",
    managerName: 'Virat K. (AI)',
    isHuman: false,
    logoEmoji: '👑',
    playing_xi: [
      'p_kohli', 'p_faf', 'p_sky', 'p_maxwell', 'p_jurel',
      'p_bumrah', 'p_shami', 'p_chahal', 'p_curran', 'p_harshit', 'p_ramandeep'
    ],
    captain: 'p_kohli',
    vice_captain: 'p_bumrah',
    totalFantasyPoints: 0,
    matchdayPoints: {},
    transfersCount: 0
  },
  {
    id: 'ai_rohit',
    teamName: "Rohit's Hitmen",
    managerName: 'Rohit S. (AI)',
    isHuman: false,
    logoEmoji: '⚡',
    playing_xi: [
      'p_rohit', 'p_ishan', 'p_sky', 'p_hardik', 'p_tilak',
      'p_bumrah', 'p_stoinis', 'p_kuldeep', 'p_chahal', 'p_nehal', 'p_sandeep'
    ],
    captain: 'p_rohit',
    vice_captain: 'p_sky',
    totalFantasyPoints: 0,
    matchdayPoints: {},
    transfersCount: 0
  },
  {
    id: 'ai_dhoni',
    teamName: "Thala's Super Kings",
    managerName: 'MS Dhoni (AI)',
    isHuman: false,
    logoEmoji: '🦁',
    playing_xi: [
      'p_ruturaj', 'p_conway', 'p_dube', 'p_dhoni', 'p_jadeja',
      'p_pathirana', 'p_shami', 'p_sundar', 'p_mohit', 'p_dayal', 'p_tilak'
    ],
    captain: 'p_ruturaj',
    vice_captain: 'p_jadeja',
    totalFantasyPoints: 0,
    matchdayPoints: {},
    transfersCount: 0
  },
  {
    id: 'ai_gambhir',
    teamName: "Gambhir's Knights",
    managerName: 'Gautam G. (AI)',
    isHuman: false,
    logoEmoji: '⚔️',
    playing_xi: [
      'p_salt', 'p_narine', 'p_rinku', 'p_russell', 'p_starc',
      'p_varun', 'p_harshit', 'p_ramandeep', 'p_sudharsan', 'p_bhuvi', 'p_jitesh'
    ],
    captain: 'p_narine',
    vice_captain: 'p_russell',
    totalFantasyPoints: 0,
    matchdayPoints: {},
    transfersCount: 0
  },
  {
    id: 'ai_sachin',
    teamName: "Sachin's Masters",
    managerName: 'Sachin T. (AI)',
    isHuman: false,
    logoEmoji: '🏏',
    playing_xi: [
      'p_jaiswal', 'p_gill', 'p_pant', 'p_axar', 'p_cummins',
      'p_rashid', 'p_natarajan', 'p_boult', 'p_klaasen', 'p_abhishek', 'p_dube'
    ],
    captain: 'p_jaiswal',
    vice_captain: 'p_rashid',
    totalFantasyPoints: 0,
    matchdayPoints: {},
    transfersCount: 0
  },
  {
    id: 'ai_warne',
    teamName: "Warne's Royals",
    managerName: 'Shane W. (AI)',
    isHuman: false,
    logoEmoji: '🛡️',
    playing_xi: [
      'p_buttler', 'p_samson', 'p_jaiswal', 'p_boult', 'p_chahal',
      'p_avesh', 'p_tewatia', 'p_stoinis', 'p_ashutosh', 'p_jurel', 'p_sandeep'
    ],
    captain: 'p_samson',
    vice_captain: 'p_boult',
    totalFantasyPoints: 0,
    matchdayPoints: {},
    transfersCount: 0
  },
  {
    id: 'ai_sehwag',
    teamName: "Sehwag's Smashers",
    managerName: 'Virender S. (AI)',
    isHuman: false,
    logoEmoji: '💥',
    playing_xi: [
      'p_head', 'p_abhishek', 'p_klaasen', 'p_mcgurk', 'p_cummins',
      'p_shami', 'p_arshdeep', 'p_rabada', 'p_livingstone', 'p_curran', 'p_natarajan'
    ],
    captain: 'p_head',
    vice_captain: 'p_klaasen',
    totalFantasyPoints: 0,
    matchdayPoints: {},
    transfersCount: 0
  },
  {
    id: 'ai_dravid',
    teamName: "Dravid's Titans",
    managerName: 'Rahul D. (AI)',
    isHuman: false,
    logoEmoji: '🧱',
    playing_xi: [
      'p_gill', 'p_sudharsan', 'p_rahul', 'p_miller', 'p_rashid',
      'p_shami', 'p_mohit', 'p_sundar', 'p_tewatia', 'p_axar', 'p_kuldeep'
    ],
    captain: 'p_gill',
    vice_captain: 'p_rahul',
    totalFantasyPoints: 0,
    matchdayPoints: {},
    transfersCount: 0
  },
  {
    id: 'ai_kapil',
    teamName: "Kapil's Champions",
    managerName: 'Kapil D. (AI)',
    isHuman: false,
    logoEmoji: '🏆',
    playing_xi: [
      'p_hardik', 'p_jadeja', 'p_axar', 'p_russell', 'p_curran',
      'p_bumrah', 'p_starc', 'p_cummins', 'p_pant', 'p_kohli', 'p_rohit'
    ],
    captain: 'p_hardik',
    vice_captain: 'p_jadeja',
    totalFantasyPoints: 0,
    matchdayPoints: {},
    transfersCount: 0
  }
];
