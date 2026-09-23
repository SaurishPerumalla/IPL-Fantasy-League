import { BoosterDef, BoosterId, BoosterUsageState } from '../types/fantasy';

export const OFFICIAL_BOOSTERS: BoosterDef[] = [
  {
    id: 'triple_captain',
    name: 'Triple Captain',
    tagline: '3X Points for your Captain',
    description: 'Multiplies your nominated Captain’s fantasy points by 3.0x (instead of the regular 2.0x) for this matchday.',
    icon: '👑',
    badgeColor: 'from-amber-500 to-yellow-400',
    maxUses: 2,
    multiplierText: '3.0X Captain',
    category: 'multiplier'
  },
  {
    id: 'double_power',
    name: 'Double Power',
    tagline: '2X Points for your entire 11',
    description: 'Doubles the fantasy points scored by ALL 11 players in your fantasy team for this matchday.',
    icon: '⚡',
    badgeColor: 'from-rose-500 to-orange-500',
    maxUses: 2,
    multiplierText: '2.0X Whole Team',
    category: 'multiplier'
  },
  {
    id: 'indian_warrior',
    name: 'Indian Warrior',
    tagline: '2X Points for Indian stars',
    description: 'Doubles the points scored by every Indian player in your starting lineup for this matchday.',
    icon: '🇮🇳',
    badgeColor: 'from-blue-600 to-indigo-600',
    maxUses: 2,
    multiplierText: '2.0X Indian XI',
    category: 'multiplier'
  },
  {
    id: 'foreign_stars',
    name: 'Foreign Stars',
    tagline: '2X Points for Overseas stars',
    description: 'Doubles the points scored by all Overseas (Foreign) players in your playing XI for this matchday.',
    icon: '✈️',
    badgeColor: 'from-cyan-500 to-blue-500',
    maxUses: 2,
    multiplierText: '2.0X Overseas',
    category: 'multiplier'
  },
  {
    id: 'free_hit',
    name: 'Free Hit',
    tagline: 'Unlimited 1-match transfers',
    description: 'Make unlimited free transfers for this matchday without spending transfer quota. Your squad automatically reverts after the match.',
    icon: '✨',
    badgeColor: 'from-emerald-500 to-teal-500',
    maxUses: 1,
    multiplierText: '∞ Free 1-Match',
    category: 'transfers'
  },
  {
    id: 'wild_card',
    name: 'Wild Card',
    tagline: 'Permanent squad overhaul',
    description: 'Make unlimited free permanent transfers within your ₹100 Cr budget to rebuild your entire lineup without consuming transfer quota.',
    icon: '🔄',
    badgeColor: 'from-purple-600 to-pink-600',
    maxUses: 1,
    multiplierText: '∞ Permanent',
    category: 'transfers'
  },
  {
    id: 'power_striker',
    name: 'Power Striker',
    tagline: '2X Batters & Wicket-Keepers',
    description: 'Doubles the points scored by all Batters (BAT) and Wicket-Keepers (WK) in your team for this matchday.',
    icon: '🏏',
    badgeColor: 'from-amber-600 to-red-600',
    maxUses: 1,
    multiplierText: '2.0X Bat & WK',
    category: 'role'
  },
  {
    id: 'strike_force',
    name: 'Strike Force',
    tagline: '2X Bowlers haul',
    description: 'Doubles the points scored by all Bowlers (BOWL) in your team for this matchday.',
    icon: '🎯',
    badgeColor: 'from-violet-600 to-indigo-600',
    maxUses: 1,
    multiplierText: '2.0X Bowlers',
    category: 'role'
  },
  {
    id: 'allround_marvel',
    name: 'All-Round Marvel',
    tagline: '2X All-Rounders points',
    description: 'Doubles all points scored by All-Rounders (AR) in your team for this matchday across both batting and bowling.',
    icon: '⭐',
    badgeColor: 'from-teal-500 to-emerald-600',
    maxUses: 1,
    multiplierText: '2.0X All-Rounders',
    category: 'role'
  },
  {
    id: 'super_sub',
    name: 'Super Sub',
    tagline: '2X Impact Player impact',
    description: 'Doubles the points scored by your nominated Impact Player / 12th man for this matchday.',
    icon: '🔄',
    badgeColor: 'from-orange-500 to-amber-500',
    maxUses: 2,
    multiplierText: '2.0X Impact Sub',
    category: 'multiplier'
  }
];

export const getBoosterById = (id: BoosterId): BoosterDef | undefined => {
  return OFFICIAL_BOOSTERS.find(b => b.id === id);
};

export const defaultBoosterState: BoosterUsageState = {
  remainingUses: {
    triple_captain: 2,
    double_power: 2,
    indian_warrior: 2,
    foreign_stars: 2,
    free_hit: 1,
    wild_card: 1,
    power_striker: 1,
    strike_force: 1,
    allround_marvel: 1,
    super_sub: 2
  },
  activeBoosterForNextMatch: null,
  history: [],
  savedFreeHitLineup: null
};
