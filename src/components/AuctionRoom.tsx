import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import { ALL_PLAYERS } from '../data/players';
import { Player, Team } from '../types/fantasy';
import { Gavel, CheckCircle2, DollarSign, Users, Award, Shield, ArrowRight, Play, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const AuctionRoom: React.FC = () => {
  const { state, humanTeam, allTeams, addPlayerToHumanRoster, closeModals } = useGame();
  const isOpen = state.activeModal === 'auction';

  const [currentLotIndex, setCurrentLotIndex] = useState(0);
  const [currentBid, setCurrentBid] = useState(2.0);
  const [highestBidderTeamId, setHighestBidderTeamId] = useState<string>('');
  const [hammerStep, setHammerStep] = useState<'open' | 'once' | 'twice' | 'sold'>('open');
  const [auctionLog, setAuctionLog] = useState<{ id: string; text: string; type: 'bid' | 'hammer' | 'sold' }[]>([]);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const availablePlayers = ALL_PLAYERS.filter(p => {
    // Exclude players already in human roster
    return !humanTeam.roster.includes(p.id);
  });

  const currentPlayer: Player | undefined = availablePlayers[currentLotIndex];

  // Initialize lot
  useEffect(() => {
    if (currentPlayer) {
      setCurrentBid(currentPlayer.basePrice);
      setHighestBidderTeamId('');
      setHammerStep('open');
      setAuctionLog(prev => [
        {
          id: `lot_${Date.now()}`,
          text: `🔔 LOT ON THE BLOCK: ${currentPlayer.name} (${currentPlayer.role}, Tier ${currentPlayer.tier}, Base Price: ₹${currentPlayer.basePrice} Cr)`,
          type: 'bid'
        },
        ...prev.slice(0, 15)
      ]);
    }
  }, [currentLotIndex, currentPlayer?.id]);

  // AI Bidding simulation timer
  useEffect(() => {
    if (!isOpen || !currentPlayer || hammerStep === 'sold') return;

    const interval = setInterval(() => {
      // If highest bidder is not human, AI or User might bid
      if (hammerStep === 'open') {
        const shouldAIBid = Math.random() > 0.45 && currentBid < currentPlayer.currentPrice * 1.3;
        if (shouldAIBid) {
          const aiTeams = allTeams.filter(t => !t.is_human && t.budget_remaining >= currentBid + 0.5);
          if (aiTeams.length > 0) {
            const randomAI = aiTeams[Math.floor(Math.random() * aiTeams.length)];
            const increment = Math.random() > 0.6 ? 0.5 : 0.25;
            const newPrice = Math.round((currentBid + increment) * 100) / 100;

            setCurrentBid(newPrice);
            setHighestBidderTeamId(randomAI.id);
            setAuctionLog(prev => [
              {
                id: `bid_${Date.now()}`,
                text: `💰 ${randomAI.name} bids ₹${newPrice.toFixed(2)} Cr for ${currentPlayer.shortName}`,
                type: 'bid'
              },
              ...prev.slice(0, 15)
            ]);
            return;
          }
        }

        // Advance hammer
        setHammerStep('once');
        setAuctionLog(prev => [
          { id: `h1_${Date.now()}`, text: `🔨 Going ONCE at ₹${currentBid.toFixed(2)} Cr...`, type: 'hammer' },
          ...prev.slice(0, 15)
        ]);
      } else if (hammerStep === 'once') {
        setHammerStep('twice');
        setAuctionLog(prev => [
          { id: `h2_${Date.now()}`, text: `🔨🔨 Going TWICE at ₹${currentBid.toFixed(2)} Cr...!`, type: 'hammer' },
          ...prev.slice(0, 15)
        ]);
      } else if (hammerStep === 'twice') {
        // Sold!
        setHammerStep('sold');
        const winnerTeam = allTeams.find(t => t.id === highestBidderTeamId) || humanTeam;
        const winnerName = highestBidderTeamId ? winnerTeam.name : 'UNSOLD';

        if (highestBidderTeamId === humanTeam.id) {
          addPlayerToHumanRoster(currentPlayer, currentBid);
          try {
            confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
          } catch (e) {}
        }

        setAuctionLog(prev => [
          {
            id: `sold_${Date.now()}`,
            text: `🔨🔨🔨 SOLD! ${currentPlayer.name} to ${winnerName} for ₹${currentBid.toFixed(2)} Cr!`,
            type: 'sold'
          },
          ...prev.slice(0, 15)
        ]);
      }
    }, isAutoSimulating ? 800 : 2600);

    return () => clearInterval(interval);
  }, [isOpen, currentPlayer, hammerStep, currentBid, highestBidderTeamId, allTeams, isAutoSimulating]);

  if (!isOpen || !currentPlayer) return null;

  const handleUserBid = (increment: number) => {
    if (humanTeam.budget_remaining < currentBid + increment) {
      alert(`Insufficient purse balance! You only have ₹${humanTeam.budget_remaining.toFixed(2)} Cr remaining.`);
      return;
    }
    const newPrice = Math.round((currentBid + increment) * 100) / 100;
    setCurrentBid(newPrice);
    setHighestBidderTeamId(humanTeam.id);
    setHammerStep('open');
    setAuctionLog(prev => [
      {
        id: `bid_user_${Date.now()}`,
        text: `🟢 YOU (${humanTeam.name}) raised bid to ₹${newPrice.toFixed(2)} Cr!`,
        type: 'bid'
      },
      ...prev.slice(0, 15)
    ]);
  };

  const handleNextLot = () => {
    setCurrentLotIndex(prev => (prev + 1 < availablePlayers.length ? prev + 1 : 0));
  };

  const handleAutoFillAndStart = () => {
    // Fill remaining spots in human roster with top available players
    let needed = 15 - humanTeam.roster.length;
    if (needed > 0) {
      const candidates = availablePlayers.slice(0, needed);
      candidates.forEach(p => {
        addPlayerToHumanRoster(p, p.basePrice);
      });
    }
    closeModals();
  };

  const highestBidderTeam = allTeams.find(t => t.id === highestBidderTeamId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Auction Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-amber-600 via-yellow-600 to-amber-700 text-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-slate-950 text-amber-400 rounded-xl shadow-md">
              <Gavel className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-slate-950 flex items-center gap-2">
                IPL 2026 LIVE MINI-AUCTION
                <span className="bg-slate-950 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Lot #{currentLotIndex + 1}
                </span>
              </h3>
              <p className="text-xs text-amber-950 font-semibold">
                Purse: ₹{humanTeam.budget_remaining.toFixed(2)} Cr | Roster: {humanTeam.roster.length}/18 Players
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleAutoFillAndStart}
              className="bg-slate-950 hover:bg-slate-900 text-amber-300 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-400/40 transition cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Fast-Complete Roster
            </button>
            <button
              onClick={closeModals}
              className="bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 font-bold text-sm px-2.5 py-1 rounded-lg transition"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Auction Stage & Player Block */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Player on the Block (7 cols) */}
          <div className="md:col-span-7 bg-slate-950 rounded-2xl border border-slate-800 p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Tier {currentPlayer.tier}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    {currentPlayer.role}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">
                    {currentPlayer.nationality === 'OVERSEAS' ? '✈️ Overseas' : '🇮🇳 India'}
                  </span>
                </div>
                <h4 className="text-2xl font-black text-white mt-1.5">{currentPlayer.name}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{currentPlayer.bio}</p>
              </div>

              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg ring-2 ring-white/10"
                style={{ backgroundColor: currentPlayer.avatarColor || '#3b82f6' }}
              >
                {currentPlayer.shortName.slice(0, 2).toUpperCase()}
              </div>
            </div>

            {/* Ratings Bars */}
            <div className="grid grid-cols-3 gap-2.5 pt-2">
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-medium">BATTING</div>
                <div className="text-lg font-black text-amber-400">{currentPlayer.battingRating}</div>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-medium">BOWLING</div>
                <div className="text-lg font-black text-cyan-400">{currentPlayer.bowlingRating}</div>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 text-center">
                <div className="text-[10px] text-slate-400 font-medium">STRIKE RATE</div>
                <div className="text-lg font-black text-emerald-400">{currentPlayer.strikeRateRating}</div>
              </div>
            </div>

            {/* Current Price Banner */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-400 font-medium">Current Highest Bid</div>
                <div className="text-3xl font-black text-amber-400 font-mono">
                  ₹{currentBid.toFixed(2)} <span className="text-sm font-semibold text-slate-300">Cr</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400 font-medium">Leading Bidder</div>
                <div className="text-sm font-bold text-white flex items-center justify-end gap-1.5 mt-0.5">
                  {highestBidderTeam ? (
                    <>
                      <span>{highestBidderTeam.logoEmoji}</span>
                      <span className={highestBidderTeam.is_human ? 'text-emerald-400' : 'text-slate-200'}>
                        {highestBidderTeam.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-500 italic">No bids yet</span>
                  )}
                </div>
              </div>
            </div>

            {/* Hammer Status Alert */}
            <div className={`p-3 rounded-xl border text-center font-bold text-sm transition-all ${
              hammerStep === 'sold'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : hammerStep === 'twice'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                : hammerStep === 'once'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-800'
            }`}>
              {hammerStep === 'sold' && `🔨 SOLD to ${highestBidderTeam ? highestBidderTeam.name : 'UNSOLD'}!`}
              {hammerStep === 'twice' && `🔨🔨 GOING TWICE AT ₹${currentBid.toFixed(2)} Cr!`}
              {hammerStep === 'once' && `🔨 GOING ONCE AT ₹${currentBid.toFixed(2)} Cr...`}
              {hammerStep === 'open' && `🟢 BIDDING OPEN (Base: ₹${currentPlayer.basePrice} Cr)`}
            </div>

            {/* User Bid Buttons */}
            {hammerStep !== 'sold' ? (
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleUserBid(0.20)}
                  className="bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-md cursor-pointer"
                >
                  +₹20 Lakhs
                </button>
                <button
                  type="button"
                  onClick={() => handleUserBid(0.50)}
                  className="bg-orange-500 hover:bg-orange-400 active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-md cursor-pointer"
                >
                  +₹50 Lakhs
                </button>
                <button
                  type="button"
                  onClick={() => handleUserBid(1.00)}
                  className="bg-red-600 hover:bg-red-500 active:scale-95 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow-md cursor-pointer"
                >
                  +₹1.00 Crore
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleNextLot}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold py-3 rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Next Lot</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Right Column: Live Feed & User Squad (5 cols) */}
          <div className="md:col-span-5 space-y-4">
            {/* Live Gavel Log */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between mb-2.5">
                <span>Auctioneer Log</span>
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h5>
              <div className="h-44 overflow-y-auto space-y-2 pr-1 font-mono text-[11px]">
                {auctionLog.map(item => (
                  <div
                    key={item.id}
                    className={`p-2 rounded-lg ${
                      item.type === 'sold'
                        ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/40'
                        : item.type === 'hammer'
                        ? 'bg-amber-950/40 text-amber-300'
                        : 'bg-slate-900/80 text-slate-300'
                    }`}
                  >
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Human Squad Summary */}
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-400" /> {humanTeam.name} Roster
                </span>
                <span className="text-xs text-amber-300 font-mono font-bold">
                  {humanTeam.roster.length}/18 Players
                </span>
              </div>

              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pt-1">
                {humanTeam.roster.map(pId => {
                  const p = ALL_PLAYERS.find(pl => pl.id === pId);
                  return (
                    <span
                      key={pId}
                      className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-700 text-slate-200 font-mono"
                    >
                      {p?.shortName || pId}
                    </span>
                  );
                })}
                {humanTeam.roster.length === 0 && (
                  <span className="text-slate-500 text-xs italic">No players acquired yet. Place your first bid!</span>
                )}
              </div>

              {humanTeam.roster.length >= 11 && (
                <button
                  type="button"
                  onClick={closeModals}
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Roster Ready ({humanTeam.roster.length} Players) - Enter Tournament
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
