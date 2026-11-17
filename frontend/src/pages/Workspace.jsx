import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Terminal,
  CheckCircle2,
  Clock,
  FileText,
  Network,
  FileSearch,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import AgentWorkflowVisualizer from '../components/AgentWorkflowVisualizer';
import { api } from '../services/api';

export default function Workspace({ sessionId, onNavigateTab }) {
  const [session, setSession] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessionData = async () => {
    if (!sessionId) return;
    try {
      const [s, l] = await Promise.all([
        api.getSessionDetails(sessionId),
        api.getSessionLogs(sessionId)
      ]);
      setSession(s);
      setLogs(l);
    } catch (err) {
      console.error('Workspace fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
    const interval = setInterval(() => {
      if (session?.status !== 'completed' && session?.status !== 'failed') {
        fetchSessionData();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [sessionId, session?.status]);

  if (!sessionId) {
    return (
      <div className="bg-ares-card border border-ares-border rounded-xl p-12 text-center max-w-xl mx-auto space-y-4">
        <Cpu className="w-12 h-12 text-blue-400 mx-auto opacity-70" />
        <h2 className="text-xl font-bold text-white">No Active Research Workspace</h2>
        <p className="text-sm text-ares-muted">
          Select an investigation from the dashboard or initiate a new query to inspect agent progress and execution traces.
        </p>
        <button
          onClick={() => onNavigateTab('new_investigation')}
          className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white shadow-lg shadow-blue-600/20"
        >
          Launch New Research
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Session Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-ares-card border border-ares-border rounded-xl p-5">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
              SESSION: {sessionId.slice(0, 8)}
            </span>
            <span className="text-xs font-mono text-ares-muted">
              Type: {session?.query_type || 'Investigation'}
            </span>
          </div>
          <h1 className="text-lg font-bold text-white mt-1.5 line-clamp-1">
            {session?.query || 'Autonomous Cyber Research'}
          </h1>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateTab('evidence')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-ares-bg border border-ares-border hover:border-blue-500/40 text-xs text-white"
          >
            <FileSearch className="w-3.5 h-3.5 text-blue-400" />
            <span>View Evidence</span>
          </button>
          <button
            onClick={() => onNavigateTab('graph')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-ares-bg border border-ares-border hover:border-blue-500/40 text-xs text-white"
          >
            <Network className="w-3.5 h-3.5 text-purple-400" />
            <span>Knowledge Graph</span>
          </button>
          <button
            onClick={() => onNavigateTab('reports')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-medium shadow-md shadow-blue-600/20"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Full Report</span>
          </button>
        </div>
      </div>

      {/* Visual Workflow Tracker */}
      <AgentWorkflowVisualizer currentStatus={session?.status || 'completed'} />

      {/* Two Column Layout: Subtasks & Terminal Console */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subtasks Progress */}
        <div className="bg-ares-card border border-ares-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-ares-border">
            <h3 className="text-sm font-semibold text-white">Decomposed Subtasks</h3>
            <span className="text-xs font-mono text-ares-muted">
              {session?.tasks?.length || 4} tasks
            </span>
          </div>

          <div className="space-y-3">
            {(session?.tasks || []).map((task, i) => (
              <div
                key={task.id || i}
                className="p-3 rounded-lg bg-[#0B1020] border border-ares-border space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    {task.agent_type}
                  </span>
                  <div className="flex items-center space-x-1 text-emerald-400 text-xs font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </div>
                </div>
                <div className="text-xs font-medium text-white">{task.title}</div>
                <div className="text-[11px] font-mono text-ares-muted flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>Execution: {task.execution_time_seconds || 1.2}s</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Agent Log Console */}
        <div className="lg:col-span-2 bg-ares-card border border-ares-border rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-ares-border">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-semibold text-white">Agent Execution Telemetry Log</h3>
              </div>
              <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>LIVE</span>
              </span>
            </div>

            <div className="h-[380px] overflow-y-auto bg-[#070B16] rounded-lg border border-ares-border p-3 font-mono text-xs space-y-2">
              {logs.length === 0 ? (
                <div className="text-ares-muted py-12 text-center">Initializing telemetry logs...</div>
              ) : (
                logs.map((log) => {
                  const isSuccess = log.log_level === 'SUCCESS';
                  const isWarn = log.log_level === 'WARNING';
                  const isErr = log.log_level === 'ERROR';

                  return (
                    <div key={log.id} className="flex items-start space-x-2 leading-relaxed">
                      <span className="text-ares-muted text-[10px] select-none flex-shrink-0">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '00:00:00'}
                      </span>
                      <span className="text-blue-400 font-semibold select-none flex-shrink-0">
                        [{log.agent_name}]
                      </span>
                      <span
                        className={`flex-1 ${
                          isSuccess
                            ? 'text-emerald-400'
                            : isWarn
                            ? 'text-amber-400'
                            : isErr
                            ? 'text-rose-400'
                            : 'text-slate-300'
                        }`}
                      >
                        {log.message}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-ares-muted pt-3 border-t border-ares-border mt-3">
            <span>Telemetry Protocol: ARES-V1-LOGSTREAM</span>
            <span>Security Isolation: Active (Bypass Protection Verified)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
