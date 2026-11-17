import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  ExternalLink,
  Layers,
  Users,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function ThreatIntelPage() {
  const [activeTab, setActiveTab] = useState('cisa'); // cisa, cve, mitre
  const [cisaList, setCisaList] = useState([]);
  const [mitreData, setMitreData] = useState(null);
  
  // CVE Search state
  const [cveSearchId, setCveSearchId] = useState('CVE-2021-44228');
  const [cveResult, setCveResult] = useState(null);
  const [cveLoading, setCveLoading] = useState(false);

  useEffect(() => {
    api.getCisaKev(30).then(setCisaList).catch(console.error);
    api.getMitreAttack().then(setMitreData).catch(console.error);
    handleCveSearch('CVE-2021-44228');
  }, []);

  const handleCveSearch = async (cveId) => {
    const target = cveId || cveSearchId;
    if (!target) return;
    setCveLoading(true);
    try {
      const res = await api.getCve(target);
      setCveResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setCveLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Tab Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-ares-card border border-ares-border rounded-xl p-5">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Threat Intelligence Feeds</h1>
          </div>
          <p className="text-xs text-ares-muted mt-1">
            Authoritative intelligence from CISA KEV, NIST NVD, and the MITRE ATT&CK Enterprise Matrix.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center space-x-2 bg-ares-bg p-1 rounded-lg border border-ares-border">
          {[
            { id: 'cisa', label: 'CISA KEV Catalog' },
            { id: 'cve', label: 'NVD CVE Lookup' },
            { id: 'mitre', label: 'MITRE ATT&CK' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-ares-muted hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab 1: CISA KEV Feed */}
      {activeTab === 'cisa' && (
        <div className="bg-ares-card border border-ares-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-ares-border">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <h3 className="font-semibold text-white text-sm">
                CISA Known Exploited Vulnerabilities Catalog ({cisaList.length} Entries)
              </h3>
            </div>
            <span className="text-xs font-mono text-ares-muted">
              Source: cisa.gov (Authoritative Feed)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B1020] text-ares-muted font-mono uppercase text-[10px] border-b border-ares-border">
                <tr>
                  <th className="p-3">CVE ID</th>
                  <th className="p-3">Vendor / Product</th>
                  <th className="p-3">Vulnerability Title</th>
                  <th className="p-3">Date Added</th>
                  <th className="p-3">Ransomware Use</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ares-border">
                {cisaList.map((item) => (
                  <tr key={item.cve_id} className="hover:bg-ares-bg/50 transition-colors">
                    <td className="p-3 font-mono font-bold text-rose-400">
                      {item.cve_id}
                    </td>
                    <td className="p-3 text-white">
                      {item.vendor_project} <span className="text-ares-muted">({item.product})</span>
                    </td>
                    <td className="p-3 text-slate-300 max-w-xs truncate" title={item.short_description}>
                      {item.vulnerability_name}
                    </td>
                    <td className="p-3 font-mono text-ares-muted">{item.date_added}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        {item.known_ransomware_campaign_use || 'Known'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 text-[11px] max-w-xs truncate">
                      {item.required_action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: NVD CVE Lookup */}
      {activeTab === 'cve' && (
        <div className="space-y-6">
          <div className="bg-ares-card border border-ares-border rounded-xl p-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleCveSearch();
              }}
              className="flex items-center space-x-3"
            >
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-ares-muted absolute left-3 top-3" />
                <input
                  type="text"
                  value={cveSearchId}
                  onChange={(e) => setCveSearchId(e.target.value.toUpperCase())}
                  placeholder="Enter CVE ID (e.g. CVE-2021-44228, CVE-2024-1709)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[#0B1020] border border-ares-border text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={cveLoading}
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm font-medium text-white shadow-lg shadow-blue-600/20"
              >
                {cveLoading ? 'Querying NVD...' : 'Query Vulnerability'}
              </button>
            </form>
          </div>

          {cveResult?.cve && (
            <div className="bg-ares-card border border-ares-border rounded-xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-ares-border">
                <div>
                  <div className="flex items-center space-x-3">
                    <h2 className="text-xl font-bold font-mono text-white">
                      {cveResult.cve.cve_id}
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      CVSS {cveResult.cve.cvss_v3_score} ({cveResult.cve.severity})
                    </span>
                  </div>
                  <p className="text-xs text-ares-muted mt-1 font-mono">{cveResult.cve.cwe_id}</p>
                </div>
                <div className="text-xs font-mono text-ares-muted">
                  Vector: <span className="text-slate-300">{cveResult.cve.vector_string}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-mono uppercase tracking-wider text-ares-muted">Vulnerability Overview</h4>
                <p className="text-sm text-slate-200 leading-relaxed bg-[#0B1020] p-4 rounded-lg border border-ares-border font-sans">
                  {cveResult.cve.description}
                </p>
              </div>

              {/* Affected & Remediation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-[#0B1020] border border-ares-border space-y-1">
                  <span className="text-xs font-mono text-ares-muted uppercase">Affected Systems:</span>
                  <div className="text-xs text-white font-medium">{cveResult.cve.affected_product}</div>
                </div>
                <div className="p-4 rounded-lg bg-[#0B1020] border border-ares-border space-y-1">
                  <span className="text-xs font-mono text-emerald-400 uppercase">Recommended Mitigation:</span>
                  <div className="text-xs text-white font-medium">{cveResult.cve.mitigation}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: MITRE ATT&CK */}
      {activeTab === 'mitre' && (
        <div className="space-y-6">
          {/* Tactics Grid */}
          <div className="bg-ares-card border border-ares-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-white text-sm">Enterprise Tactics (TA Matrix)</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {mitreData?.tactics?.map((tac) => (
                <div key={tac.id} className="p-3 rounded-lg bg-[#0B1020] border border-ares-border text-xs space-y-1">
                  <div className="font-mono text-blue-400 text-[10px]">{tac.id}</div>
                  <div className="font-semibold text-white">{tac.name}</div>
                  <div className="text-[11px] text-ares-muted line-clamp-2">{tac.description}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Adversary Profiles */}
          <div className="bg-ares-card border border-ares-border rounded-xl p-5 space-y-4">
            <h3 className="font-semibold text-white text-sm">Tracked Adversary Syndicates</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mitreData?.threat_actors?.map((actor) => (
                <div key={actor.name} className="p-4 rounded-lg bg-[#0B1020] border border-ares-border space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm text-purple-400">{actor.name}</span>
                    <span className="text-ares-muted font-mono">{actor.origin}</span>
                  </div>
                  <div className="text-ares-muted text-[11px]">
                    Target Sectors: <span className="text-slate-300">{actor.target_sectors.join(', ')}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {actor.known_ttps.map((ttp) => (
                      <span key={ttp} className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[10px] font-mono">
                        {ttp}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
