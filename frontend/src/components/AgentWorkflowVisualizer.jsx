import React from 'react';
import {
  Search,
  ListTree,
  Server,
  Layers,
  Network,
  Cpu,
  ShieldCheck,
  FileCheck2,
  Check
} from 'lucide-react';

const STAGES = [
  { id: 'analyzing', name: 'Query Analysis', agent: 'QueryAnalyzer', icon: Search },
  { id: 'planning', name: 'Task Decomposition', agent: 'AgenticPlanner', icon: ListTree },
  { id: 'executing', name: 'Parallel Subtasks', agent: 'ResearchAgent', icon: Server },
  { id: 'retrieving', name: 'Hybrid Retrieval', agent: 'BM25 + FAISS', icon: Layers },
  { id: 'building_graph', name: 'Knowledge Graph', agent: 'GraphAgent', icon: Network },
  { id: 'synthesizing', name: 'Evidence Synthesis', agent: 'SynthesisAgent', icon: Cpu },
  { id: 'verifying', name: 'Self-Verification', agent: 'VerificationAgent', icon: ShieldCheck },
  { id: 'completed', name: 'Final Report', agent: 'ReportGenerator', icon: FileCheck2 }
];

export default function AgentWorkflowVisualizer({ currentStatus = 'pending' }) {
  // Determine index of current status
  const statusIndexMap = {
    pending: 0,
    analyzing: 1,
    planning: 2,
    executing: 3,
    retrieving: 4,
    building_graph: 5,
    synthesizing: 6,
    verifying: 7,
    completed: 8
  };

  const activeIndex = statusIndexMap[currentStatus] ?? (currentStatus === 'completed' ? 8 : 1);

  return (
    <div className="bg-ares-card border border-ares-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
            Autonomous Agentic Pipeline
          </h3>
          <p className="text-xs text-ares-muted mt-0.5">
            Sequential & parallel bounded agents investigating cybersecurity evidence
          </p>
        </div>
        <div className="text-xs font-mono px-3 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
          Status: {currentStatus.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {STAGES.map((stage, idx) => {
          const isDone = activeIndex > idx || currentStatus === 'completed';
          const isCurrent = activeIndex === idx && currentStatus !== 'completed';
          const Icon = stage.icon;

          return (
            <div
              key={stage.id}
              className={`p-3 rounded-lg border flex flex-col items-center text-center transition-all ${
                isDone
                  ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                  : isCurrent
                  ? 'bg-blue-900/30 border-blue-500 text-blue-300 shadow-lg shadow-blue-500/10 radar-glow'
                  : 'bg-ares-bg/50 border-ares-border text-ares-muted'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 text-xs font-medium ${
                  isDone
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : isCurrent
                    ? 'bg-blue-600 text-white'
                    : 'bg-ares-card border border-ares-border text-ares-muted'
                }`}
              >
                {isDone ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="text-xs font-medium leading-tight text-white mb-1">
                {stage.name}
              </div>
              <div className="text-[10px] font-mono text-ares-muted leading-none">
                {stage.agent}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
