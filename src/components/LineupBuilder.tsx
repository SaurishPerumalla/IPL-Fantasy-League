import React from 'react';
import { useGame } from '../context/GameContext';
import { Dream11PitchManager } from './Dream11PitchManager';
import { X, Shield } from 'lucide-react';

export const LineupBuilder: React.FC = () => {
  const { state, closeModals } = useGame();
  const isOpen = state.activeModal === 'lineup';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-black text-white">
              Dream11 Team Manager &amp; Playing XI
            </h3>
          </div>

          <button
            onClick={closeModals}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Dream11 Manager */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <Dream11PitchManager onSaved={closeModals} compactMode />
        </div>
      </div>
    </div>
  );
};
