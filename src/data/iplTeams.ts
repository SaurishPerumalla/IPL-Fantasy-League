import { Team } from '../types/fantasy';

export interface FranchisePreset {
  id: string;
  name: string;
  shortCode: string;
  city: string;
  homeVenue: string;
  color: string;
  secondaryColor: string;
  logoEmoji: string;
  roster: string[];
  playing_xi: string[];
  captain: string;
  vice_captain: string;
  impact_sub: string;
  substitutes: string[];
}

export const IPL_FRANCHISES_PRESET: FranchisePreset[] = [
  {
    id: 'CSK',
    name: 'Chennai Super Kings',
    shortCode: 'CSK',
    city: 'Chennai',
    homeVenue: 'MA Chidambaram Stadium, Chepauk',
    color: '#eab308', // Yellow
    secondaryColor: '#0284c7',
    logoEmoji: '🦁',
    roster: [
      'p_ruturaj', 'p_conway', 'p_dube', 'p_dhoni', 'p_jadeja',
      'p_pathirana', 'p_shami', 'p_sundar', 'p_mohit', 'p_dayal',
      'p_badoni', 'p_jitesh', 'p_tilak', 'p_ramandeep', 'p_bhuvi'
    ],
    playing_xi: [
      'p_ruturaj', 'p_conway', 'p_dube', 'p_dhoni', 'p_jadeja',
      'p_pathirana', 'p_shami', 'p_sundar', 'p_mohit', 'p_dayal', 'p_tilak'
    ],
    captain: 'p_ruturaj',
    vice_captain: 'p_jadeja',
    impact_sub: 'p_dube',
    substitutes: ['p_dube', 'p_badoni', 'p_ramandeep', 'p_bhuvi']
  },
  {
    id: 'MI',
    name: 'Mumbai Indians',
    shortCode: 'MI',
    city: 'Mumbai',
    homeVenue: 'Wankhede Stadium, Mumbai',
    color: '#0284c7', // Blue
    secondaryColor: '#f59e0b',
    logoEmoji: '⚡',
    roster: [
      'p_rohit', 'p_ishan', 'p_sky', 'p_hardik', 'p_tilak',
      'p_bumrah', 'p_nehal', 'p_stoinis', 'p_khaleel', 'p_chahal',
      'p_ashutosh', 'p_dayal', 'p_shashank', 'p_sandeep', 'p_jitesh'
    ],
    playing_xi: [
      'p_rohit', 'p_ishan', 'p_sky', 'p_hardik', 'p_tilak',
      'p_bumrah', 'p_stoinis', 'p_khaleel', 'p_chahal', 'p_nehal', 'p_sandeep'
    ],
    captain: 'p_hardik',
    vice_captain: 'p_sky',
    impact_sub: 'p_sky',
    substitutes: ['p_sky', 'p_ashutosh', 'p_shashank', 'p_dayal']
  },
  {
    id: 'RCB',
    name: 'Royal Challengers Bengaluru',
    shortCode: 'RCB',
    city: 'Bengaluru',
    homeVenue: 'M. Chinnaswamy Stadium, Bengaluru',
    color: '#dc2626', // Red
    secondaryColor: '#000000',
    logoEmoji: '👑',
    roster: [
      'p_kohli', 'p_faf', 'p_patidar', 'p_maxwell', 'p_jurel',
      'p_dayal', 'p_shami', 'p_chahal', 'p_badoni', 'p_curran',
      'p_ramandeep', 'p_sundar', 'p_shashank', 'p_harshit', 'p_mohit'
    ],
    playing_xi: [
      'p_kohli', 'p_faf', 'p_patidar', 'p_maxwell', 'p_jurel',
      'p_dayal', 'p_shami', 'p_chahal', 'p_curran', 'p_harshit', 'p_ramandeep'
    ],
    captain: 'p_kohli',
    vice_captain: 'p_faf',
    impact_sub: 'p_patidar',
    substitutes: ['p_patidar', 'p_badoni', 'p_sundar', 'p_shashank']
  },
  {
    id: 'KKR',
    name: 'Kolkata Knight Riders',
    shortCode: 'KKR',
    city: 'Kolkata',
    homeVenue: 'Eden Gardens, Kolkata',
    color: '#7c3aed', // Purple
    secondaryColor: '#f59e0b',
    logoEmoji: '⚔️',
    roster: [
      'p_salt', 'p_narine', 'p_rinku', 'p_russell', 'p_starc',
      'p_varun', 'p_harshit', 'p_ramandeep', 'p_sudharsan', 'p_jitesh',
      'p_bhuvi', 'p_tilak', 'p_ashutosh', 'p_nehal', 'p_khaleel'
    ],
    playing_xi: [
      'p_salt', 'p_narine', 'p_rinku', 'p_russell', 'p_starc',
      'p_varun', 'p_harshit', 'p_ramandeep', 'p_sudharsan', 'p_bhuvi', 'p_jitesh'
    ],
    captain: 'p_narine',
    vice_captain: 'p_russell',
    impact_sub: 'p_rinku',
    substitutes: ['p_rinku', 'p_ashutosh', 'p_tilak', 'p_khaleel']
  },
  {
    id: 'SRH',
    name: 'Sunrisers Hyderabad',
    shortCode: 'SRH',
    city: 'Hyderabad',
    homeVenue: 'Rajiv Gandhi Intl Stadium, Hyderabad',
    color: '#ea580c', // Orange
    secondaryColor: '#000000',
    logoEmoji: '🦅',
    roster: [
      'p_head', 'p_abhishek', 'p_klaasen', 'p_nitish_reddy', 'p_cummins',
      'p_natarajan', 'p_bhuvi', 'p_sundar', 'p_shashank', 'p_shami',
      'p_badoni', 'p_dube', 'p_jurel', 'p_mohit', 'p_harshit'
    ],
    playing_xi: [
      'p_head', 'p_abhishek', 'p_klaasen', 'p_nitish_reddy', 'p_cummins',
      'p_natarajan', 'p_bhuvi', 'p_sundar', 'p_shami', 'p_shashank', 'p_jurel'
    ],
    captain: 'p_cummins',
    vice_captain: 'p_klaasen',
    impact_sub: 'p_head',
    substitutes: ['p_head', 'p_badoni', 'p_dube', 'p_mohit']
  },
  {
    id: 'RR',
    name: 'Rajasthan Royals',
    shortCode: 'RR',
    city: 'Jaipur',
    homeVenue: 'Sawai Mansingh Stadium, Jaipur',
    color: '#ec4899', // Pink
    secondaryColor: '#1d4ed8',
    logoEmoji: '🛡️',
    roster: [
      'p_jaiswal', 'p_buttler', 'p_samson', 'p_jurel', 'p_boult',
      'p_chahal', 'p_sandeep', 'p_avesh', 'p_ashutosh', 'p_tewatia',
      'p_stoinis', 'p_nehal', 'p_badoni', 'p_harshal', 'p_khaleel'
    ],
    playing_xi: [
      'p_jaiswal', 'p_buttler', 'p_samson', 'p_jurel', 'p_boult',
      'p_chahal', 'p_sandeep', 'p_avesh', 'p_tewatia', 'p_stoinis', 'p_ashutosh'
    ],
    captain: 'p_samson',
    vice_captain: 'p_jaiswal',
    impact_sub: 'p_jaiswal',
    substitutes: ['p_jaiswal', 'p_badoni', 'p_nehal', 'p_harshal']
  },
  {
    id: 'DC',
    name: 'Delhi Capitals',
    shortCode: 'DC',
    city: 'Delhi',
    homeVenue: 'Arun Jaitley Stadium, Delhi',
    color: '#2563eb', // Royal Blue
    secondaryColor: '#dc2626',
    logoEmoji: '🐯',
    roster: [
      'p_mcgurk', 'p_pant', 'p_axar', 'p_kuldeep', 'p_khaleel',
      'p_shashank', 'p_miller', 'p_harshit', 'p_badoni', 'p_sandeep',
      'p_jitesh', 'p_ramandeep', 'p_tewatia', 'p_avesh', 'p_dayal'
    ],
    playing_xi: [
      'p_mcgurk', 'p_pant', 'p_axar', 'p_kuldeep', 'p_khaleel',
      'p_miller', 'p_harshit', 'p_sandeep', 'p_shashank', 'p_tewatia', 'p_badoni'
    ],
    captain: 'p_pant',
    vice_captain: 'p_axar',
    impact_sub: 'p_mcgurk',
    substitutes: ['p_mcgurk', 'p_jitesh', 'p_ramandeep', 'p_avesh']
  },
  {
    id: 'GT',
    name: 'Gujarat Titans',
    shortCode: 'GT',
    city: 'Ahmedabad',
    homeVenue: 'Narendra Modi Stadium, Ahmedabad',
    color: '#0d9488', // Teal
    secondaryColor: '#f59e0b',
    logoEmoji: '⚡',
    roster: [
      'p_gill', 'p_sudharsan', 'p_miller', 'p_rashid', 'p_shami',
      'p_tewatia', 'p_mohit', 'p_ashutosh', 'p_ishan', 'p_curran',
      'p_sundar', 'p_ramandeep', 'p_avesh', 'p_badoni', 'p_dayal'
    ],
    playing_xi: [
      'p_gill', 'p_sudharsan', 'p_miller', 'p_rashid', 'p_shami',
      'p_tewatia', 'p_mohit', 'p_ishan', 'p_curran', 'p_sundar', 'p_ashutosh'
    ],
    captain: 'p_gill',
    vice_captain: 'p_rashid',
    impact_sub: 'p_sudharsan',
    substitutes: ['p_sudharsan', 'p_ramandeep', 'p_avesh', 'p_badoni']
  },
  {
    id: 'LSG',
    name: 'Lucknow Super Giants',
    shortCode: 'LSG',
    city: 'Lucknow',
    homeVenue: 'BRSABV Ekana Stadium, Lucknow',
    color: '#06b6d4', // Cyan
    secondaryColor: '#1e3a8a',
    logoEmoji: '🦅',
    roster: [
      'p_rahul', 'p_qdk', 'p_pooran', 'p_stoinis', 'p_badoni',
      'p_krunal', 'p_bishnoi', 'p_mayank_yadav', 'p_mohit', 'p_sandeep',
      'p_nehal', 'p_shashank', 'p_khaleel', 'p_jitesh', 'p_dayal'
    ],
    playing_xi: [
      'p_rahul', 'p_qdk', 'p_pooran', 'p_stoinis', 'p_badoni',
      'p_krunal', 'p_bishnoi', 'p_mayank_yadav', 'p_mohit', 'p_nehal', 'p_khaleel'
    ],
    captain: 'p_rahul',
    vice_captain: 'p_pooran',
    impact_sub: 'p_pooran',
    substitutes: ['p_pooran', 'p_shashank', 'p_sandeep', 'p_jitesh']
  },
  {
    id: 'PBKS',
    name: 'Punjab Kings',
    shortCode: 'PBKS',
    city: 'Mullanpur',
    homeVenue: 'Maharaja Yadavindra Singh Stadium, Mullanpur',
    color: '#b91c1c', // Deep Crimson
    secondaryColor: '#e2e8f0',
    logoEmoji: '🦁',
    roster: [
      'p_prabhsimran', 'p_curran', 'p_livingstone', 'p_jitesh', 'p_shashank',
      'p_ashutosh', 'p_arshdeep', 'p_harshal', 'p_rabada', 'p_harshit',
      'p_badoni', 'p_nehal', 'p_sundar', 'p_bhuvi', 'p_ramandeep'
    ],
    playing_xi: [
      'p_prabhsimran', 'p_curran', 'p_livingstone', 'p_jitesh', 'p_shashank',
      'p_ashutosh', 'p_arshdeep', 'p_harshal', 'p_rabada', 'p_harshit', 'p_badoni'
    ],
    captain: 'p_curran',
    vice_captain: 'p_arshdeep',
    impact_sub: 'p_ashutosh',
    substitutes: ['p_ashutosh', 'p_nehal', 'p_sundar', 'p_bhuvi']
  }
];

export const VENUES: { name: string; city: string; defaultPitch: string }[] = [
  { name: 'Wankhede Stadium', city: 'Mumbai', defaultPitch: 'Flat Track' },
  { name: 'M. Chinnaswamy Stadium', city: 'Bengaluru', defaultPitch: 'Flat Track' },
  { name: 'MA Chidambaram Stadium, Chepauk', city: 'Chennai', defaultPitch: 'Dry Turner' },
  { name: 'Eden Gardens', city: 'Kolkata', defaultPitch: 'Balanced Surface' },
  { name: 'Narendra Modi Stadium', city: 'Ahmedabad', defaultPitch: 'Balanced Surface' },
  { name: 'Rajiv Gandhi Intl Stadium', city: 'Hyderabad', defaultPitch: 'Flat Track' },
  { name: 'Sawai Mansingh Stadium', city: 'Jaipur', defaultPitch: 'Balanced Surface' },
  { name: 'Arun Jaitley Stadium', city: 'Delhi', defaultPitch: 'Flat Track' },
  { name: 'BRSABV Ekana Stadium', city: 'Lucknow', defaultPitch: 'Sticky Wicket' },
  { name: 'HPCA Stadium', city: 'Dharamsala', defaultPitch: 'Green Seamer' }
];

export const createInitialTeamFromPreset = (preset: FranchisePreset, isHuman: boolean = false): Team => {
  return {
    id: preset.id,
    name: preset.name,
    shortCode: preset.shortCode,
    is_human: isHuman,
    budget_remaining: 100.0,
    roster: [...preset.roster],
    playing_xi: [...preset.playing_xi],
    captain: preset.captain,
    vice_captain: preset.vice_captain,
    impact_sub: preset.impact_sub,
    substitutes: [...preset.substitutes],
    color: preset.color,
    secondaryColor: preset.secondaryColor,
    logoEmoji: preset.logoEmoji,
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
};
