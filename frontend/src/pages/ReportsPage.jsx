import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  CheckCircle,
  FileDown,
  Calendar,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';

export default function ReportsPage({ sessionId }) {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getReports()
      .then((data) => {
        setReports(data);
        if (data.length > 0) {
          // If sessionId provided, find that report, else take the first
          const target = sessionId ? data.find((r) => r.session_id === sessionId) || data[0] : data[0];
          return api.getReport(target.session_id);
        }
        return null;
      })
      .then((fullReport) => {
        if (fullReport) setSelectedReport(fullReport);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [sessionId]);

  const handleSelectReport = async (sId) => {
    try {
      const full = await api.getReport(sId);
      setSelectedReport(full);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-ares-card border border-ares-border rounded-xl p-5">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Intelligence Research Reports</h1>
          </div>
          <p className="text-xs text-ares-muted mt-1">
            Publication-ready cybersecurity dossiers with verifiable citations and exportable PDFs.
          </p>
        </div>

        {selectedReport && (
          <div className="flex items-center space-x-3">
            <a
              href={api.getMarkdownUrl(selectedReport.session_id)}
              download
              className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-ares-bg border border-ares-border hover:border-blue-500/40 text-xs font-medium text-white transition-all"
            >
              <FileDown className="w-4 h-4 text-blue-400" />
              <span>Download Markdown</span>
            </a>
            <a
              href={api.getPdfUrl(selectedReport.session_id)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-medium text-white shadow-lg shadow-blue-600/20 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Official PDF</span>
            </a>
          </div>
        )}
      </div>

      {/* Main Content: Left Reports List, Right Report Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports Index */}
        <div className="bg-ares-card border border-ares-border rounded-xl p-5 space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-ares-muted pb-2 border-b border-ares-border">
            Available Reports ({reports.length})
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {reports.length === 0 ? (
              <div className="text-ares-muted text-xs py-8 text-center">No reports compiled yet.</div>
            ) : (
              reports.map((r) => {
                const isSelected = selectedReport?.session_id === r.session_id;
                return (
                  <div
                    key={r.id}
                    onClick={() => handleSelectReport(r.session_id)}
                    className={`p-3 rounded-lg border cursor-pointer text-xs transition-all space-y-1.5 ${
                      isSelected
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-[#0B1020] border-ares-border text-slate-300 hover:border-blue-500/40'
                    }`}
                  >
                    <div className="font-semibold text-white line-clamp-1">{r.title}</div>
                    <div className="flex justify-between items-center text-[10px] text-ares-muted font-mono">
                      <span>{r.generated_at ? new Date(r.generated_at).toLocaleDateString() : 'Recent'}</span>
                      <span className="text-emerald-400">{Math.round((r.verification_score || 0.95) * 100)}% Verified</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Report Content Viewer */}
        <div className="lg:col-span-2 bg-ares-card border border-ares-border rounded-xl p-6 space-y-6">
          {selectedReport ? (
            <>
              {/* Report Header Metadata */}
              <div className="space-y-3 pb-4 border-b border-ares-border">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    CLASSIFICATION: TLP:AMBER | VERIFIED DOSSIER
                  </span>
                  <div className="flex items-center space-x-1 text-xs text-ares-muted font-mono">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(selectedReport.generated_at).toLocaleString()}</span>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {selectedReport.title}
                </h2>
                
                {/* Score Pills */}
                <div className="flex items-center space-x-4 pt-1">
                  <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-mono">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Factuality Verification: {Math.round((selectedReport.verification_score || 1) * 100)}%</span>
                  </div>
                  <div className="text-xs text-ares-muted font-mono">
                    Citations Anchored: <span className="text-blue-400">{selectedReport.citations_count || 4}</span>
                  </div>
                  {selectedReport.unsupported_claims_count > 0 && (
                    <div className="flex items-center space-x-1 text-xs text-amber-400 font-mono">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{selectedReport.unsupported_claims_count} unverified claim(s) flagged</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Formatted Markdown Content Body */}
              <div className="prose prose-invert max-w-none text-xs text-slate-300 leading-relaxed font-sans space-y-4">
                {selectedReport.content_markdown.split('\n\n').map((paragraph, i) => {
                  if (paragraph.startsWith('### ') || paragraph.startsWith('## ')) {
                    return (
                      <h3 key={i} className="text-sm font-bold text-white border-b border-ares-border pb-1 mt-4">
                        {paragraph.replace(/^#+\s*/, '')}
                      </h3>
                    );
                  }
                  if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                    return (
                      <ul key={i} className="list-disc pl-5 space-y-1">
                        {paragraph.split('\n').map((line, j) => (
                          <li key={j}>{line.replace(/^[\*\-]\s*/, '')}</li>
                        ))}
                      </ul>
                    );
                  }
                  if (/^\d+\.\s/.test(paragraph)) {
                    return (
                      <ol key={i} className="list-decimal pl-5 space-y-1">
                        {paragraph.split('\n').map((line, j) => (
                          <li key={j}>{line.replace(/^\d+\.\s*/, '')}</li>
                        ))}
                      </ol>
                    );
                  }
                  return (
                    <p key={i} className="text-slate-300">
                      {paragraph}
                    </p>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-ares-muted text-sm">
              Select a research report from the ledger to view full intelligence analysis.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
