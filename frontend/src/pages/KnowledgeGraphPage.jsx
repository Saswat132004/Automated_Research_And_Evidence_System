import React, { useState, useEffect } from 'react';
import { Network, RefreshCw } from 'lucide-react';
import GraphView from '../components/GraphView';
import { api } from '../services/api';

export default function KnowledgeGraphPage({ sessionId }) {
  const [graphData, setGraphData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchGraph = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const data = await api.getSessionGraph(sessionId);
      setGraphData(data);
    } catch (err) {
      console.error('Failed to load graph:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [sessionId]);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between bg-ares-card border border-ares-border rounded-xl p-5">
        <div>
          <div className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-purple-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Cybersecurity Entity Knowledge Graph</h1>
          </div>
          <p className="text-xs text-ares-muted mt-1">
            NetworkX multi-hop entity relationships linking Threat Actors, Vulnerabilities (CVE), Malware, Tools, and MITRE Tactics.
          </p>
        </div>
        <button
          onClick={fetchGraph}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-ares-bg border border-ares-border hover:border-blue-500/40 text-xs text-white"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Topology</span>
        </button>
      </div>

      {/* Interactive Visual Graph Component */}
      {graphData ? (
        <GraphView graphData={graphData} />
      ) : (
        <div className="bg-ares-card border border-ares-border rounded-xl p-16 text-center text-ares-muted text-sm">
          {sessionId
            ? 'Loading knowledge graph...'
            : 'Select or execute a research session to visualize entity relationships.'}
        </div>
      )}
    </div>
  );
}
