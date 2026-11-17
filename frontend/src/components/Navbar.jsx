import React from 'react';
import { Shield, Plus, Settings } from 'lucide-react';

export default function Navbar({ activeTab, onNavigate, onNewQuestion }) {
  return (
    <header className="sticky top-0 z-20 h-16 border-b border-slate-200 bg-white/90 px-5 backdrop-blur sm:px-8">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between">
        <button onClick={onNewQuestion} className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-slate-900">ARES</span>
          <span className="hidden text-xs text-slate-400 sm:inline">Cybersecurity research assistant</span>
        </button>
        <nav className="flex items-center gap-1.5">
          <button
            onClick={onNewQuestion}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'ask' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Ask
          </button>
          <button
            onClick={() => onNavigate('history')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
              activeTab === 'history' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            History
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className={`rounded-lg p-2 text-sm font-medium transition flex items-center gap-1 ${
              activeTab === 'settings' ? 'bg-slate-100 text-blue-600' : 'text-slate-500 hover:text-slate-900'
            }`}
            title="Settings & LLM Configuration"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline text-xs">Settings</span>
          </button>
          <button
            onClick={onNewQuestion}
            className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New question</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
