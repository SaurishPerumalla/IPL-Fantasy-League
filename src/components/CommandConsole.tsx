import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { Terminal, Send, X, CornerDownLeft, Sparkles, Trash2 } from 'lucide-react';

interface CommandConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandConsole: React.FC<CommandConsoleProps> = ({ isOpen, onClose }) => {
  const { state, executeCommand } = useGame();
  const [inputVal, setInputVal] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [state.commandHistory, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    executeCommand(inputVal);
    setInputVal('');
    setHistoryIndex(-1);
  };

  const handleQuickCommand = (cmd: string) => {
    executeCommand(cmd);
    setInputVal('');
  };

  const commandShortcuts = [
    { label: '/status', cmd: '/status' },
    { label: '/simulate', cmd: '/simulate' },
    { label: '/scorecard', cmd: '/scorecard' },
    { label: '/lineup', cmd: '/lineup' },
    { label: '/fast-forward 1', cmd: '/fast-forward 1' },
    { label: '/help', cmd: '/help' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-xl shadow-2xl transition-all font-mono">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Terminal Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-rose-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-xs font-bold text-slate-300 ml-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              FLAME Master CLI Console (IPL 2026 Engine)
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Quick Chips */}
            <div className="hidden sm:flex items-center space-x-1.5">
              {commandShortcuts.map((sc, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleQuickCommand(sc.cmd)}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-800 transition cursor-pointer"
                >
                  {sc.label}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Terminal Output Log */}
        <div
          ref={scrollRef}
          className="h-44 overflow-y-auto py-2 space-y-2 text-xs text-slate-300 pr-2 select-text"
        >
          {state.commandHistory.map(item => (
            <div key={item.id} className="space-y-0.5">
              <div className="flex items-center space-x-2 text-slate-500 text-[10px]">
                <span>[{item.timestamp}]</span>
                <span className="text-amber-400 font-bold">$ {item.command}</span>
              </div>
              <div
                className={`whitespace-pre-wrap pl-4 border-l-2 py-0.5 ${
                  item.isError
                    ? 'border-rose-500 text-rose-300 bg-rose-950/20'
                    : 'border-slate-800 text-slate-300'
                }`}
              >
                {item.output}
              </div>
            </div>
          ))}
        </div>

        {/* Command Input Form */}
        <form onSubmit={handleSubmit} className="pt-2 flex items-center space-x-2">
          <span className="text-amber-400 font-black text-sm select-none">flame&gt;</span>
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Enter command (e.g. /status, /simulate, /scorecard, /transfer [Drop] for [Add], /fast-forward 2)..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 font-mono"
          />
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer flex items-center gap-1"
          >
            <span>Run</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
