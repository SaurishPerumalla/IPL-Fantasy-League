import React, { useState, useMemo } from 'react';
import { ALL_PLAYERS } from '../data/players';
import { Player, PlayerRole } from '../types/fantasy';
import { useGame } from '../context/GameContext';
import {
  Search,
  Users,
  Plane,
  TrendingUp,
  Star,
  Shield,
  ArrowUpDown,
  Filter
} from 'lucide-react';

const IPL_TEAMS = ['ALL', 'CSK', 'MI', 'RCB', 'KKR', 'SRH', 'RR', 'DC', 'GT', 'LSG', 'PBKS'] as const;

export const PlayerStatsView: React.FC = () => {
  const { humanTeam, openTransferModal } = useGame();
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'rating' | 'name'>('price');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredPlayers = useMemo(() => {
    return ALL_PLAYERS.filter(p => {
      if (roleFilter !== 'ALL' && p.role !== roleFilter) return false;
      if (teamFilter !== 'ALL' && p.teamAffiliation !== teamFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q) || p.shortName.toLowerCase().includes(q);
        const matchesTeam = p.teamAffiliation?.toLowerCase().includes(q);
        if (!matchesName && !matchesTeam) return false;
      }
      return true;
    }).sort((a, b) => {
      let diff = 0;
      if (sortBy === 'price') {
        diff = b.currentPrice - a.currentPrice;
      } else if (sortBy === 'rating') {
        const ratingA = Math.max(a.battingRating, a.bowlingRating);
        const ratingB = Math.max(b.battingRating, b.bowlingRating);
        diff = ratingB - ratingA;
      } else if (sortBy === 'name') {
        diff = a.name.localeCompare(b.name);
      }
      return sortOrder === 'desc' ? diff : -diff;
    });
  }, [roleFilter, teamFilter, searchQuery, sortBy, sortOrder]);

  const handleSort = (field: 'price' | 'rating' | 'name') => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="bg-[#091436] rounded-2xl border border-indigo-900/50 p-5 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <span>IPL Player Directory &amp; Market Valuation</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse ratings, team affiliations, and player prices (all capped at ₹11.0 Cr for top performers).
            </p>
          </div>

          <div className="text-xs font-mono text-slate-300 bg-[#050c1e] px-3 py-1.5 rounded-xl border border-indigo-950">
            Showing <strong className="text-amber-400">{filteredPlayers.length}</strong> of {ALL_PLAYERS.length} players
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Search */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search players by name or team..."
              className="w-full bg-[#050c1e] border border-indigo-900/60 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Role Filter */}
          <div className="md:col-span-3">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              aria-label="Filter players by cricket role"
              className="w-full bg-[#050c1e] border border-indigo-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Roles (WK, BAT, AR, BOWL)</option>
              <option value="WK">Wicket-Keepers (WK)</option>
              <option value="BAT">Batters (BAT)</option>
              <option value="AR">All-Rounders (AR)</option>
              <option value="BOWL">Bowlers (BOWL)</option>
            </select>
          </div>

          {/* Team Filter */}
          <div className="md:col-span-4">
            <select
              value={teamFilter}
              onChange={e => setTeamFilter(e.target.value)}
              aria-label="Filter players by IPL franchise"
              className="w-full bg-[#050c1e] border border-indigo-900/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All 10 IPL Franchises</option>
              {IPL_TEAMS.filter(t => t !== 'ALL').map(team => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="bg-[#091436] rounded-2xl border border-indigo-900/50 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#0b1842] text-[10px] font-bold uppercase text-slate-400 tracking-wider border-b border-indigo-900/60">
              <tr>
                <th className="px-6 py-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('name')}>
                  <div className="flex items-center space-x-1">
                    <span>Player</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3.5">Franchise</th>
                <th className="px-6 py-3.5">Role</th>
                <th className="px-6 py-3.5">Country</th>
                <th className="px-6 py-3.5 cursor-pointer hover:text-white" onClick={() => handleSort('rating')}>
                  <div className="flex items-center space-x-1">
                    <span>Ratings</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3.5 text-right cursor-pointer hover:text-white" onClick={() => handleSort('price')}>
                  <div className="flex items-center justify-end space-x-1">
                    <span>Price</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-indigo-950/70">
              {filteredPlayers.map(player => {
                const isInUser11 = humanTeam.playing_xi.includes(player.id);
                const isCaptain = humanTeam.captain === player.id;
                const isVC = humanTeam.vice_captain === player.id;

                return (
                  <tr key={player.id} className="hover:bg-indigo-950/40 transition">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow shrink-0"
                          style={{ backgroundColor: player.avatarColor || '#3b82f6' }}
                        >
                          {player.shortName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span>{player.name}</span>
                            {player.nationality === 'OVERSEAS' && (
                              <span title="Overseas Player">
                                <Plane className="w-3 h-3 text-cyan-400 inline" />
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {player.shortName}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-3.5 font-mono font-bold text-amber-300">
                      {player.teamAffiliation}
                    </td>

                    <td className="px-6 py-3.5">
                      <span className="bg-[#050c1e] text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold border border-indigo-950">
                        {player.role}
                      </span>
                    </td>

                    <td className="px-6 py-3.5 text-slate-400 font-mono text-[11px]">
                      {player.country}
                    </td>

                    <td className="px-6 py-3.5 font-mono text-slate-300">
                      <div className="flex items-center space-x-2 text-[11px]">
                        <span>BAT: <strong className="text-white">{player.battingRating}</strong></span>
                        <span className="text-slate-600">|</span>
                        <span>BOWL: <strong className="text-white">{player.bowlingRating}</strong></span>
                      </div>
                    </td>

                    <td className="px-6 py-3.5 text-right font-mono font-bold text-sm">
                      <span className={player.currentPrice >= 10.5 ? 'text-amber-400' : 'text-slate-200'}>
                        ₹{player.currentPrice.toFixed(1)} Cr
                      </span>
                    </td>

                    <td className="px-6 py-3.5 text-center">
                      {isInUser11 ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          In Your 11 {isCaptain ? '(C)' : isVC ? '(VC)' : ''}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 font-mono">Available</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
