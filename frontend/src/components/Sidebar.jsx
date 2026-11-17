import React from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Cpu,
  FileSearch,
  Network,
  ShieldAlert,
  FileText,
  BarChart3,
  Settings
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'new_investigation', label: 'New Investigation', icon: PlusCircle, highlight: true },
  { id: 'workspace', label: 'Research Workspace', icon: Cpu },
  { id: 'evidence', label: 'Evidence Explorer', icon: FileSearch },
  { id: 'graph', label: 'Knowledge Graph', icon: Network },
  { id: 'threat_intel', label: 'Threat Intelligence', icon: ShieldAlert },
  { id: 'reports', label: 'Research Reports', icon: FileText },
  { id: 'evaluation', label: 'Evaluation Metrics', icon: BarChart3 },
  { id: 'settings', label: 'Settings & Config', icon: Settings }
];

export default function Sidebar({ activeTab, onSelectTab }) {
  return (
    <aside className="w-64 border-r border-ares-border bg-[#0B1020] flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <div className="text-[11px] font-mono tracking-wider text-ares-muted uppercase px-3 py-2">
          Investigation Core
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : item.highlight
                  ? 'text-white hover:bg-ares-card border border-blue-500/20 hover:border-blue-500/40 text-blue-300'
                  : 'text-ares-muted hover:text-white hover:bg-ares-card border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : item.highlight ? 'text-blue-400' : 'text-ares-muted'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="border-t border-ares-border pt-4 px-2 space-y-2">
        <div className="bg-ares-card border border-ares-border rounded-lg p-3 text-xs">
          <div className="text-ares-muted text-[11px] uppercase font-mono mb-1">Retrieval Mode</div>
          <div className="text-white font-medium flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Hybrid BM25 + FAISS</span>
          </div>
          <div className="text-[11px] text-ares-muted mt-1">Cross-Encoder: Active</div>
        </div>
      </div>
    </aside>
  );
}
