import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext';
import { Header } from './components/Header';
import { OfficialIPLFantasyCreator } from './components/OfficialIPLFantasyCreator';
import { Dream11PitchManager } from './components/Dream11PitchManager';
import { MatchCenter } from './components/MatchCenter';
import { TransfersHub } from './components/TransfersHub';
import { SchedulePlannerView } from './components/SchedulePlannerView';
import { StandingsView } from './components/StandingsView';
import { PlayoffsView } from './components/PlayoffsView';
import { PlayerStatsView } from './components/PlayerStatsView';
import { TransferMarket } from './components/TransferMarket';
import { ScorecardModal } from './components/ScorecardModal';
import { BoosterHubModal } from './components/BoosterHubModal';
import { CommandConsole } from './components/CommandConsole';
import {
  Calendar,
  Trophy,
  Users,
  TrendingUp,
  ArrowRightLeft,
  Terminal,
  Shirt,
  Sparkles
} from 'lucide-react';

const MainDashboard: React.FC = () => {
  const { state, humanTeam, boostersState, openBoostersModal } = useGame();
  const [activeTab, setActiveTab] = useState<'my11' | 'matches' | 'schedule' | 'transfers' | 'standings' | 'stats'>('my11');
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  // If team is not created yet, show the official onboarding team creator!
  if (!state.is_team_created) {
    return <OfficialIPLFantasyCreator />;
  }

  const isPlayoffs = state.league_meta.playoffs_stage !== 'League';
  const transfers = state.transfers_state;

  return (
    <div className="min-h-screen bg-[#071026] text-white flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Official Top Header */}
      <Header
        isConsoleOpen={isConsoleOpen}
        onToggleConsole={() => setIsConsoleOpen(prev => !prev)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Uncluttered Official IPL Fantasy Navigation Tabs */}
        <nav aria-label="Main Navigation" className="flex flex-wrap items-center justify-between gap-3 bg-[#091436] p-1.5 rounded-2xl border border-indigo-900/50 shadow-lg">
          <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-0.5">
            {/* Tab 1: My 11 */}
            <button
              onClick={() => setActiveTab('my11')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                activeTab === 'my11'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-indigo-950/60'
              }`}
            >
              <span>🏟️</span>
              <span>My 11</span>
              <span className="bg-slate-950/30 text-[10px] px-1.5 py-0.2 rounded-full font-mono">
                {humanTeam.playing_xi.length}/11
              </span>
            </button>

            {/* Tab 2: Matches & Scoring */}
            <button
              onClick={() => setActiveTab('matches')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                activeTab === 'matches'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-indigo-950/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Matches</span>
              <span className="bg-[#050c1e] text-amber-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono border border-indigo-950">
                MD {state.league_meta.current_matchday}
              </span>
            </button>

            {/* Tab 3: Season Schedule & Transfer Planner */}
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer relative ${
                activeTab === 'schedule'
                  ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:text-white hover:bg-indigo-950/60'
              }`}
            >
              <Calendar className="w-4 h-4 text-violet-400" />
              <span>Schedule &amp; Planner</span>
              <span className="bg-[#050c1e] text-violet-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono border border-indigo-950">
                70 M
              </span>
            </button>

            {/* Tab 4: Transfers Center */}
            <button
              onClick={() => setActiveTab('transfers')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer relative ${
                activeTab === 'transfers'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-indigo-950/60'
              }`}
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Transfers</span>
              <span className="bg-cyan-950 text-cyan-300 text-[10px] px-1.5 py-0.2 rounded-full font-mono border border-cyan-800/40">
                {transfers?.is_unlimited_window
                  ? '∞ Free'
                  : transfers?.playoffs_started
                  ? `${transfers.playoffs_transfers_remaining}/10`
                  : `${transfers?.league_transfers_remaining ?? 100}/100`}
              </span>
            </button>

            {/* Tab 4: Leaderboard */}
            <button
              onClick={() => setActiveTab('standings')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer relative ${
                activeTab === 'standings'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-indigo-950/60'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Leaderboard</span>
              {isPlayoffs && (
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute -top-0.5 -right-0.5 animate-ping" />
              )}
            </button>

            {/* Tab 5: Player Stats */}
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-indigo-950/60'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Player Stats</span>
            </button>

            {/* Tab 6: Official TATA IPL Boosters */}
            <button
              onClick={openBoostersModal}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer relative ${
                boostersState.activeBoosterForNextMatch
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 border border-amber-500/30'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Boosters</span>
              {boostersState.activeBoosterForNextMatch ? (
                <span className="bg-slate-950 text-amber-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full uppercase">
                  ACTIVE
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-1.5 py-0.2 rounded-full border border-amber-500/30">
                  10
                </span>
              )}
            </button>
          </div>

          {/* Quick CLI Console Toggle */}
          <div className="hidden lg:flex items-center space-x-2 text-xs font-mono text-slate-400 px-3">
            <button
              onClick={() => setIsConsoleOpen(prev => !prev)}
              className="text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer bg-[#050c1e] px-2.5 py-1 rounded-lg border border-indigo-950"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>FLAME Terminal</span>
            </button>
          </div>
        </nav>

        {/* Tab Views */}
        {activeTab === 'my11' && <Dream11PitchManager />}
        {activeTab === 'matches' && <MatchCenter onOpenSchedule={() => setActiveTab('schedule')} />}
        {activeTab === 'schedule' && <SchedulePlannerView onNavigateToTransfers={() => setActiveTab('transfers')} />}
        {activeTab === 'transfers' && <TransfersHub onOpenSchedule={() => setActiveTab('schedule')} />}
        {activeTab === 'standings' && (
          <div className="space-y-6">
            <StandingsView />
            {isPlayoffs && <PlayoffsView />}
          </div>
        )}
        {activeTab === 'stats' && <PlayerStatsView />}
      </main>

      {/* Floating CLI Toggle Button at bottom right */}
      {!isConsoleOpen && (
        <button
          onClick={() => setIsConsoleOpen(true)}
          className="fixed bottom-6 right-6 z-30 bg-[#091436] hover:bg-indigo-950 text-amber-400 font-mono text-xs font-bold px-3.5 py-2 rounded-xl border border-amber-500/40 shadow-2xl flex items-center space-x-2 transition cursor-pointer group"
          title="Open FLAME Interactive Console"
        >
          <Terminal className="w-4 h-4 group-hover:animate-pulse text-amber-400" />
          <span>FLAME CLI</span>
        </button>
      )}

      {/* Interactive Command Terminal Drawer */}
      <CommandConsole
        isOpen={isConsoleOpen}
        onClose={() => setIsConsoleOpen(false)}
      />

      {/* Modals */}
      <TransferMarket />
      <ScorecardModal />
      {state.activeModal === 'boosters' && <BoosterHubModal />}
    </div>
  );
};

export default function App() {
  return (
    <GameProvider>
      <MainDashboard />
    </GameProvider>
  );
}
