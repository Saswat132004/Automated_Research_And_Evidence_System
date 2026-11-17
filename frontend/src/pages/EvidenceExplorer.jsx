import React, { useState, useEffect } from 'react';
import {
  FileSearch,
  Search,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';
import CredibilityBadge from '../components/CredibilityBadge';
import { api } from '../services/api';

export default function EvidenceExplorer({ sessionId }) {
  const [evidenceList, setEvidenceList] = useState([]);
  const [filterType, setFilterType] = useState('ALL');
  const [searchFilter, setSearchFilter] = useState('');
  const [adHocQuery, setAdHocQuery] = useState('');
  const [adHocResults, setAdHocResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (sessionId) {
      api.getSessionEvidence(sessionId)
        .then(setEvidenceList)
        .catch(console.error);
    }
  }, [sessionId]);

  const handleAdHocSearch = async (e) => {
    e.preventDefault();
    if (!adHocQuery.trim()) return;
    setSearching(true);
    try {
      const res = await api.searchEvidence(adHocQuery);
      setAdHocResults(res.results || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  const displayedList = evidenceList.filter((ev) => {
    const matchType = filterType === 'ALL' || ev.source_type === filterType;
    const matchSearch =
      ev.passage.toLowerCase().includes(searchFilter.toLowerCase()) ||
      ev.source_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      ev.citation_id.toLowerCase().includes(searchFilter.toLowerCase());
    return matchType && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-ares-card border border-ares-border rounded-xl p-5">
        <div>
          <div className="flex items-center space-x-2">
            <FileSearch className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Evidence Provenance Ledger</h1>
          </div>
          <p className="text-xs text-ares-muted mt-1">
            Authoritative source extracts, citations [ARES-CIT-*], credibility weighting, and freshness tracking.
          </p>
        </div>

        {/* Ad-Hoc Hybrid RAG Query Box */}
        <form onSubmit={handleAdHocSearch} className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Direct Hybrid RAG search..."
            value={adHocQuery}
            onChange={(e) => setAdHocQuery(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#0B1020] border border-ares-border text-xs text-white focus:outline-none focus:border-blue-500 w-64"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs text-white font-medium shadow-md shadow-blue-600/20"
          >
            {searching ? 'Querying...' : 'Search Index'}
          </button>
        </form>
      </div>

      {/* Ad-Hoc Results Alert if any */}
      {adHocResults && (
        <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 space-y-3">
          <div className="flex items-center justify-between text-xs text-blue-400 font-mono">
            <span>DIRECT HYBRID RETRIEVAL RESULTS ({adHocResults.length} matches):</span>
            <button onClick={() => setAdHocResults(null)} className="text-ares-muted hover:text-white">
              Clear
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {adHocResults.map((r, i) => (
              <div key={i} className="p-3 rounded-lg bg-ares-card border border-ares-border text-xs space-y-1.5">
                <div className="flex justify-between text-ares-muted font-mono text-[10px]">
                  <span>Rerank Score: {r.rerank_score}</span>
                  <span>Channels: {(r.retrieval_channels || []).join(' + ')}</span>
                </div>
                <p className="text-slate-300 line-clamp-3">{r.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-ares-card border border-ares-border rounded-xl p-4">
        {/* Source Type Filter */}
        <div className="flex items-center space-x-2">
          {['ALL', 'cve_nvd', 'cisa_kev', 'mitre_attack', 'local_doc'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                filterType === type
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-ares-bg text-ares-muted hover:text-white border border-ares-border'
              }`}
            >
              {type === 'ALL'
                ? 'All Sources'
                : type === 'cve_nvd'
                ? 'NVD CVE'
                : type === 'cisa_kev'
                ? 'CISA KEV'
                : type === 'mitre_attack'
                ? 'MITRE ATT&CK'
                : 'Local Corpus'}
            </button>
          ))}
        </div>

        {/* Text Filter */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-ares-muted absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Filter evidence ledger..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="pl-8 pr-3 py-1.5 rounded-lg bg-ares-bg border border-ares-border text-xs text-white focus:outline-none focus:border-blue-500 w-56"
          />
        </div>
      </div>

      {/* Evidence Cards Grid */}
      <div className="space-y-4">
        {displayedList.length === 0 ? (
          <div className="bg-ares-card border border-ares-border rounded-xl p-12 text-center text-ares-muted text-sm">
            {sessionId
              ? 'No evidence items match the specified criteria.'
              : 'Launch an investigation to populate the verifiable evidence ledger.'}
          </div>
        ) : (
          displayedList.map((ev) => (
            <div
              key={ev.id}
              className="bg-ares-card border border-ares-border rounded-xl p-5 hover:border-blue-500/40 transition-all space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
                    [{ev.citation_id}]
                  </span>
                  <span className="text-sm font-semibold text-white">{ev.source_name}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CredibilityBadge score={ev.credibility_score} sourceType={ev.source_type} />
                  <div className="flex items-center space-x-1 text-xs text-ares-muted font-mono">
                    <Calendar className="w-3 h-3" />
                    <span>{ev.freshness_date || 'Recent'}</span>
                  </div>
                </div>
              </div>

              {/* Passage text */}
              <div className="bg-[#0B1020] border border-ares-border rounded-lg p-3 text-xs text-slate-300 leading-relaxed font-mono">
                {ev.passage}
              </div>

              {/* Footer Provenance */}
              <div className="flex items-center justify-between text-xs text-ares-muted pt-2 border-t border-ares-border/60">
                <div className="flex items-center space-x-4">
                  <span>Relevance: {Math.round((ev.relevance_score || 0.9) * 100)}%</span>
                  <span>Channel: {ev.source_type}</span>
                </div>
                {ev.source_url && (
                  <a
                    href={ev.source_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                  >
                    <span>Inspect Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
