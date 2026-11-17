import React, { useState } from 'react';
import {
  Send,
  Sparkles,
  Shield,
  Layers,
  Database,
  Sliders,
  Check,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

const SAMPLE_QUERIES = [
  {
    title: 'Log4Shell RCE Mechanics',
    query: 'Investigate Log4Shell CVE-2021-44228 JNDI injection vulnerability, threat actor adoption, and defensive mitigations.'
  },
  {
    title: 'ScreenConnect Auth Bypass',
    query: 'Analyze ConnectWise ScreenConnect CVE-2024-1709 authentication bypass exploited by LockBit ransomware syndicates.'
  },
  {
    title: 'MOVEit Transfer SQL Injection',
    query: 'Examine Progress MOVEit Transfer CVE-2023-34362 zero-day exploitation and data extortion by CL0P.'
  },
  {
    title: 'EternalBlue & WannaCry',
    query: 'Trace EternalBlue CVE-2017-0144 SMBv1 exploit mechanics and MITRE ATT&CK lateral movement techniques.'
  }
];

export default function NewInvestigation({ onInvestigationStarted }) {
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState('comprehensive');
  const [sources, setSources] = useState({
    nvd: true,
    cisa: true,
    mitre: true,
    local_docs: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleSource = (key) => {
    setSources((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLaunch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    const activeSources = Object.keys(sources).filter((k) => sources[k]);

    try {
      const res = await api.startResearch(query, depth, activeSources);
      if (res?.session_id) {
        onInvestigationStarted(res.session_id);
      }
    } catch (err) {
      setError(err.message || 'Failed to start research session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Initiate Autonomous Investigation</h1>
        <p className="text-sm text-ares-muted mt-1">
          Specify a cybersecurity research query. ARES will analyze intent, decompose subtasks, query authorized threat feeds, execute hybrid retrieval, and synthesize evidence-backed conclusions.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Input Card */}
      <form onSubmit={handleLaunch} className="bg-ares-card border border-ares-border rounded-xl p-6 space-y-6">
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-ares-muted mb-2">
            Cybersecurity Research Objective / Query
          </label>
          <div className="relative">
            <textarea
              rows={4}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Investigate Log4Shell CVE-2021-44228 JNDI lookup exploitation, adversary tactics, and internal architecture impacts..."
              className="w-full bg-[#0B1020] border border-ares-border rounded-xl p-4 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none font-sans"
              required
            />
          </div>
        </div>

        {/* Quick Start Presets */}
        <div>
          <div className="text-xs font-mono text-ares-muted mb-2 flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Preset Intelligence Queries:</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {SAMPLE_QUERIES.map((preset, idx) => (
              <button
                type="button"
                key={idx}
                onClick={() => setQuery(preset.query)}
                className="text-left p-3 rounded-lg bg-[#0B1020] border border-ares-border hover:border-blue-500/40 text-xs transition-all group"
              >
                <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                  {preset.title}
                </div>
                <div className="text-ares-muted text-[11px] line-clamp-1 mt-0.5">
                  {preset.query}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Parameters: Depth and Sources */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-ares-border">
          {/* Investigation Depth */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ares-muted mb-2">
              Investigation Depth & Reasoning Rigor
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'quick', name: 'Quick Triage', desc: 'Fast scanning & basic CVSS' },
                { id: 'standard', name: 'Standard RAG', desc: 'Hybrid search + MITRE' },
                { id: 'comprehensive', name: 'Comprehensive', desc: 'Multi-hop + Knowledge Graph' },
                { id: 'deep', name: 'Deep Forensic', desc: 'Exhaustive verification' }
              ].map((d) => (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => setDepth(d.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    depth === d.id
                      ? 'bg-blue-600/20 border-blue-500 text-white'
                      : 'bg-[#0B1020] border-ares-border text-ares-muted hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">{d.name}</div>
                  <div className="text-[10px] opacity-70 mt-0.5">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Authorized Sources */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-ares-muted mb-2">
              Authorized Intelligence Feeds
            </label>
            <div className="space-y-2">
              {[
                { key: 'nvd', name: 'NVD National Vulnerability Database', desc: 'CVSS scores & CWEs' },
                { key: 'cisa', name: 'CISA KEV Catalog', desc: 'Known exploited vulnerabilities' },
                { key: 'mitre', name: 'MITRE ATT&CK Matrix', desc: 'Adversary tactics & TTPs' },
                { key: 'local_docs', name: 'Internal Repository Corpus', desc: 'Uploaded PDFs & Advisories' }
              ].map((src) => (
                <div
                  key={src.key}
                  onClick={() => toggleSource(src.key)}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#0B1020] border border-ares-border cursor-pointer hover:border-blue-500/40 text-xs transition-all"
                >
                  <div>
                    <span className="font-medium text-white">{src.name}</span>
                    <span className="text-[10px] text-ares-muted block">{src.desc}</span>
                  </div>
                  <div
                    className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                      sources[src.key]
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'border-ares-border bg-ares-card'
                    }`}
                  >
                    {sources[src.key] && <Check className="w-3 h-3" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end pt-4 border-t border-ares-border">
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium shadow-lg shadow-blue-600/30 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Launching Multi-Agent Pipeline...' : 'Launch Autonomous Research'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
