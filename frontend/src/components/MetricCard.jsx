import React from 'react';

export default function MetricCard({ title, value, subtitle, icon: Icon, color = 'blue' }) {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    rose: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
  };

  return (
    <div className="bg-ares-card border border-ares-border rounded-xl p-5 hover:border-blue-500/30 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-ares-muted uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className={`p-2 rounded-lg border ${colorMap[color] || colorMap.blue}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="text-2xl font-bold font-mono text-white tracking-tight">{value}</div>
      {subtitle && <div className="text-xs text-ares-muted mt-1.5">{subtitle}</div>}
    </div>
  );
}
