import React, { useEffect, useState } from 'react';
import {
  ArrowUp,
  ChevronDown,
  LoaderCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Settings,
  Bot,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

const EXAMPLES = [
  'What should we do first after a suspected ransomware incident?',
  'Explain the risk and mitigation for CVE-2021-44228.',
  'What is Cross-Site Scripting (XSS) and how can developers prevent it?',
  'What MITRE ATT&CK techniques are commonly used for phishing-based initial access?'
];

function formatInlineText(text) {
  if (!text) return null;

  // Split by citation tags or bold blocks
  const parts = [];
  let remaining = text;
  let key = 0;

  // Regex matching [ARES-CIT-n], **bold**, and `code`
  const tokenRegex = /(\[ARES-CIT-\d+\]|\*\*.*?\*\*|`.*?`)/;

  while (remaining) {
    const match = remaining.match(tokenRegex);
    if (!match) {
      parts.push(remaining);
      break;
    }

    const matchIndex = match.index;
    if (matchIndex > 0) {
      parts.push(remaining.slice(0, matchIndex));
    }

    const token = match[0];
    if (token.startsWith('[ARES-CIT-')) {
      const citId = token.slice(1, -1);
      parts.push(
        <span
          key={`cit-${key++}`}
          className="inline-flex items-center px-1.5 py-0.5 mx-0.5 rounded text-[11px] font-mono font-medium bg-blue-50 text-blue-700 border border-blue-200"
          title={`Evidence Citation ${citId}`}
        >
          {citId}
        </span>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`b-${key++}`} className="font-semibold text-slate-900">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code key={`c-${key++}`} className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded text-slate-800">
          {token.slice(1, -1)}
        </code>
      );
    }

    remaining = remaining.slice(matchIndex + token.length);
  }

  return parts;
}

function Answer({ report }) {
  if (!report || !report.content_markdown) return null;
  const lines = report.content_markdown.split('\n');

  return (
    <article className="answer-copy space-y-3 text-sm leading-relaxed text-slate-700">
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        // Headings
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={index} className="pt-3 text-lg font-bold text-slate-950 border-b border-slate-100 pb-1">
              {formatInlineText(trimmed.slice(2))}
            </h1>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={index} className="pt-3 text-base font-semibold text-slate-950">
              {formatInlineText(trimmed.slice(3))}
            </h2>
          );
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={index} className="pt-2 text-sm font-semibold text-slate-900">
              {formatInlineText(trimmed.slice(4))}
            </h3>
          );
        }

        // Standalone bold header lines e.g. **Executive Summary:**
        if (/^\*\*[^*]+:\*\*/.test(trimmed)) {
          return (
            <h4 key={index} className="pt-2 text-sm font-semibold text-slate-900">
              {formatInlineText(trimmed)}
            </h4>
          );
        }

        // Numbered list items
        if (/^\d+\.\s/.test(trimmed)) {
          const numMatch = trimmed.match(/^\d+\./)[0];
          const rest = trimmed.replace(/^\d+\.\s*/, '');
          return (
            <p key={index} className="pl-3 flex items-start gap-2">
              <span className="font-semibold text-slate-900 shrink-0 font-mono text-xs mt-0.5">{numMatch}</span>
              <span>{formatInlineText(rest)}</span>
            </p>
          );
        }

        // Bullet list items
        if (/^[-*]\s/.test(trimmed)) {
          const rest = trimmed.replace(/^[-*]\s*/, '');
          return (
            <div key={index} className="pl-3 flex items-start gap-2.5">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
              <span>{formatInlineText(rest)}</span>
            </div>
          );
        }

        // Standard paragraph
        return (
          <p key={index} className="leading-relaxed">
            {formatInlineText(trimmed)}
          </p>
        );
      })}
    </article>
  );
}

export default function AskPage({ selectedSessionId, onSessionReady, onOpenDetails, onOpenSettings }) {
  const [question, setQuestion] = useState('');
  const [mode, setMode] = useState('standard');
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [activeModel, setActiveModel] = useState('');

  useEffect(() => {
    api.getConfig().then((cfg) => {
      if (cfg?.active_model || cfg?.ollama_model) {
        setActiveModel(cfg.active_model || cfg.ollama_model);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedSessionId) {
      setQuestion('');
      setAnswer(null);
      return;
    }
    api.getSessionDetails(selectedSessionId).then((session) => {
      setQuestion(session.query || '');
      setAnswer(session);
    }).catch(() => {});
  }, [selectedSessionId]);

  const ask = async (event) => {
    event.preventDefault();
    const cleanQuestion = question.trim();
    if (!cleanQuestion || loading) return;

    setError('');
    setAnswer(null);
    setLoading(true);
    try {
      const result = await api.startResearch(
        cleanQuestion,
        mode,
        ['nvd', 'cisa', 'mitre', 'local_docs']
      );
      const session = result.report
        ? { id: result.session_id, query: result.query, report: result.report }
        : await api.getSessionDetails(result.session_id);
      setAnswer(session);
      onSessionReady(result.session_id);
    } catch (err) {
      setError(err.message || 'ARES could not answer that question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startNew = () => {
    setQuestion('');
    setAnswer(null);
    setError('');
  };

  return (
    <div className="mx-auto w-full max-w-3xl pb-16">
      {!answer && !loading && (
        <section className="pt-12 text-center sm:pt-20">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Ask a security question
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-6 text-slate-500">
            Get clear, evidence-backed answers synthesized from threat catalogs and verified intelligence.
          </p>
          {activeModel && (
            <div className="mt-2 flex items-center justify-center gap-1.5 text-xs text-slate-400">
              <Bot className="w-3.5 h-3.5 text-blue-500" />
              <span>Answering engine: <span className="font-mono text-slate-600 font-medium">{activeModel}</span></span>
              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="ml-1 text-blue-600 hover:text-blue-800 underline"
                >
                  Configure
                </button>
              )}
            </div>
          )}
        </section>
      )}

      <form onSubmit={ask} className={`${answer || loading ? 'pt-8' : 'mt-9'} relative`}>
        <label htmlFor="question" className="sr-only">Your question</label>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-50">
          <textarea
            id="question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) ask(event);
            }}
            rows={answer ? 2 : 4}
            placeholder="Ask about a vulnerability, incident, TTP, or security decision…"
            className="w-full resize-none bg-transparent px-2 py-2 text-base text-slate-900 outline-none placeholder:text-slate-400"
            disabled={loading}
          />
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              >
                {mode === 'quick' ? 'Quick answer' : mode === 'deep' ? 'Deep research' : 'Standard research'}{' '}
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <span className="hidden text-xs text-slate-400 sm:inline">Ctrl + Enter to send</span>
            </div>
            <button
              type="submit"
              disabled={!question.trim() || loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
            >
              {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
              <span>{loading ? 'Synthesizing…' : 'Ask'}</span>
            </button>
          </div>
          {showOptions && (
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
              {[
                ['quick', 'Quick', 'Fast overview'],
                ['standard', 'Standard', 'Evidence-backed'],
                ['deep', 'Deep', 'Detailed analysis']
              ].map(([value, label, hint]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setMode(value);
                    setShowOptions(false);
                  }}
                  className={`rounded-lg border px-2 py-2 text-left text-xs transition ${
                    mode === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-medium">{label}</span>
                  <span className="text-[11px] opacity-75">{hint}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </form>

      {!answer && !loading && (
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {EXAMPLES.map((example) => (
            <button
              key={example}
              onClick={() => setQuestion(example)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-xs text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
            >
              {example}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-blue-600" />
          <h2 className="mt-3 font-medium text-slate-900">Researching & Synthesizing Answer</h2>
          <p className="mt-1 text-sm text-slate-500">
            Querying threat intelligence feeds and generating cited findings.
          </p>
        </section>
      )}

      {error && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {answer?.report && (
        <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-4 sm:px-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                  ARES Answer Dossier
                </p>
                <h1 className="mt-1 text-lg font-semibold text-slate-950">{answer.query}</h1>
              </div>
              <button
                onClick={startNew}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition"
              >
                <Plus className="h-3.5 w-3.5" /> New question
              </button>
            </div>
          </div>
          <div className="px-5 py-5 sm:px-7">
            <Answer report={answer.report} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-5 py-3 sm:px-7">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>
                {Math.round((answer.report.verification_score || 0) * 100)}% verification grounded · {answer.report.citations_count || 0} cited source(s)
              </span>
            </div>
            {onOpenDetails && (
              <button
                onClick={() => onOpenDetails(answer.id)}
                className="text-xs font-medium text-blue-700 hover:text-blue-800 transition"
              >
                View research evidence & workflow &rarr;
              </button>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
