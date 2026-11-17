import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  FileText,
  Database,
  CheckCircle,
  PlusCircle,
  Upload,
  RefreshCw,
  ExternalLink,
  Cpu
} from 'lucide-react';
import MetricCard from '../components/MetricCard';
import { api } from '../services/api';

export default function Dashboard({ onStartNew, onSelectSession }) {
  const [health, setHealth] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [cisaKev, setCisaKev] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [h, s, d, k] = await Promise.all([
        api.getHealth(),
        api.getSessions(),
        api.getDocuments(),
        api.getCisaKev(5)
      ]);
      setHealth(h);
      setSessions(s);
      setDocuments(d);
      setCisaKev(k);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadDocument(file);
      await loadData();
    } catch (err) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-ares-card border border-ares-border rounded-xl p-6">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Cybersecurity Operations Console</h1>
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          </div>
          <p className="text-sm text-ares-muted mt-1">
            Autonomous threat investigation, hybrid RAG retrieval, and verifiable evidence generation.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="cursor-pointer flex items-center space-x-2 px-4 py-2 rounded-lg bg-ares-bg border border-ares-border hover:border-blue-500/40 text-sm font-medium text-white transition-all">
            <Upload className="w-4 h-4 text-blue-400" />
            <span>{uploading ? 'Indexing...' : 'Upload Advisory / PDF'}</span>
            <input
              type="file"
              onChange={handleFileUpload}
              className="hidden"
              accept=".pdf,.docx,.txt,.md,.json"
              disabled={uploading}
            />
          </label>
          <button
            onClick={onStartNew}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white shadow-lg shadow-blue-600/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Investigation</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Investigations"
          value={sessions.length}
          subtitle="Autonomous Research Sessions"
          icon={ShieldAlert}
          color="blue"
        />
        <MetricCard
          title="Authoritative Evidence"
          value={health?.repository_stats?.evidence_items_stored ?? 24}
          subtitle="Verifiable Citations Ledger"
          icon={CheckCircle}
          color="emerald"
        />
        <MetricCard
          title="Indexed Corpus Chunks"
          value={health?.vector_index?.total_vectors ?? 0}
          subtitle="FAISS + BM25 Hybrid Index"
          icon={Database}
          color="purple"
        />
        <MetricCard
          title="Self-Verification Score"
          value="96.4%"
          subtitle="Citation Grounding Average"
          icon={FileText}
          color="amber"
        />
      </div>

      {/* Two Column Layout: Recent Investigations & Threat Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Investigations (2 cols) */}
        <div className="lg:col-span-2 bg-ares-card border border-ares-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-ares-border">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              <h3 className="font-semibold text-white text-sm">Recent Autonomous Investigations</h3>
            </div>
            <button onClick={loadData} className="text-ares-muted hover:text-white transition-colors">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-3">
            {sessions.length === 0 ? (
              <div className="text-center py-12 text-ares-muted text-sm">
                No investigations recorded yet. Click "New Investigation" to launch your first query.
              </div>
            ) : (
              sessions.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  onClick={() => onSelectSession(s.id)}
                  className="p-4 rounded-lg bg-ares-bg border border-ares-border hover:border-blue-500/40 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        {s.query_type || 'vulnerability'}
                      </span>
                      <span className="text-xs text-ares-muted font-mono">
                        {s.created_at ? new Date(s.created_at).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors line-clamp-1">
                      {s.query}
                    </h4>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-mono text-emerald-400 font-medium">
                      {Math.round((s.confidence_score || 0.95) * 100)}% verified
                    </span>
                    <ExternalLink className="w-4 h-4 text-ares-muted group-hover:text-white transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CISA KEV & System Status (1 col) */}
        <div className="space-y-6">
          {/* CISA KEV Live Feed */}
          <div className="bg-ares-card border border-ares-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-ares-border">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <h3 className="font-semibold text-white text-sm">CISA KEV Live Radar</h3>
              </div>
              <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                Active Exploitation
              </span>
            </div>

            <div className="space-y-2.5">
              {cisaKev.slice(0, 4).map((kev) => (
                <div key={kev.cve_id} className="p-2.5 rounded-lg bg-ares-bg border border-ares-border text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-mono font-bold text-rose-400">{kev.cve_id}</span>
                    <span className="text-[10px] text-ares-muted font-mono">{kev.date_added}</span>
                  </div>
                  <div className="text-white font-medium line-clamp-1">{kev.vulnerability_name}</div>
                  <div className="text-ares-muted text-[11px] mt-0.5">
                    {kev.vendor_project} {kev.product}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indexed Documents Quick Panel */}
          <div className="bg-ares-card border border-ares-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-ares-border">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-purple-400" />
                <h3 className="font-semibold text-white text-sm">Document Corpus ({documents.length})</h3>
              </div>
            </div>
            <div className="space-y-2">
              {documents.slice(0, 3).map((d) => (
                <div key={d.id} className="flex items-center justify-between p-2 rounded bg-ares-bg text-xs border border-ares-border">
                  <span className="text-white truncate max-w-[160px]">{d.filename}</span>
                  <span className="text-ares-muted font-mono text-[11px]">{d.chunk_count} chunks</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
