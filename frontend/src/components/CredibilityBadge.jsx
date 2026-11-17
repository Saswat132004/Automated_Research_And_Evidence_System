import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function CredibilityBadge({ score = 0.85, sourceType = 'database' }) {
  const percentage = Math.round(score * 100);
  
  let color = 'bg-blue-500/10 text-blue-400 border-blue-500/30';
  let Icon = CheckCircle2;
  let label = 'Verified';

  if (percentage >= 95) {
    color = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    Icon = ShieldCheck;
    label = 'Authoritative';
  } else if (percentage < 80) {
    color = 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    Icon = AlertTriangle;
    label = 'Uncertain / Review';
  }

  return (
    <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono border ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{label}</span>
      <span className="opacity-80">({percentage}%)</span>
    </div>
  );
}
