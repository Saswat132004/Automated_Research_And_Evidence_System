import React, { useState, useEffect } from 'react';
import {
  Settings,
  Cpu,
  Database,
  Key,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Zap,
  Globe,
  LoaderCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function SettingsPage() {
  const [config, setConfig] = useState(null);
  const [provider, setProvider] = useState('ollama');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('phi3:latest');
  const [installedModels, setInstalledModels] = useState([]);
  const [openaiKey, setOpenaiKey] = useState('');
  const [openaiUrl, setOpenaiUrl] = useState('https://api.openai.com/v1');
  const [openaiModel, setOpenaiModel] = useState('gpt-4o-mini');
  const [topK, setTopK] = useState(10);
  const [rerankTopK, setRerankTopK] = useState(5);
  
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState('');
  const [refreshingModels, setRefreshingModels] = useState(false);

  const loadData = async () => {
    try {
      const [cfg, modelsData] = await Promise.all([
        api.getConfig(),
        api.getInstalledModels().catch(() => ({ installed_models: [] }))
      ]);
      setConfig(cfg);
      if (cfg.llm_provider) setProvider(cfg.llm_provider === 'auto' ? 'ollama' : cfg.llm_provider);
      if (cfg.ollama_base_url) setOllamaUrl(cfg.ollama_base_url);
      if (cfg.ollama_model) setOllamaModel(cfg.active_model || cfg.ollama_model);
      if (cfg.openai_base_url) setOpenaiUrl(cfg.openai_base_url);
      if (cfg.openai_model) setOpenaiModel(cfg.openai_model);
      if (cfg.top_k_retrieval) setTopK(cfg.top_k_retrieval);
      if (cfg.rerank_top_k) setRerankTopK(cfg.rerank_top_k);

      if (modelsData?.installed_models?.length) {
        setInstalledModels(modelsData.installed_models);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefreshModels = async () => {
    setRefreshingModels(true);
    try {
      const res = await api.getInstalledModels();
      if (res?.installed_models) {
        setInstalledModels(res.installed_models);
        if (res.active_model) {
          setOllamaModel(res.active_model);
        }
      }
    } catch (err) {
      console.error('Error refreshing models:', err);
    } finally {
      setRefreshingModels(false);
    }
  };

  const handleTestLLM = async () => {
    setTesting(true);
    setTestResult(null);
    setTestError('');
    try {
      const res = await api.testLLM('Are you online? Answer concisely in one sentence.');
      if (res.status === 'success') {
        setTestResult(res);
      } else {
        setTestError(res.error || 'LLM test failed.');
      }
    } catch (err) {
      setTestError(err.message || 'Could not communicate with LLM.');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      const payload = {
        llm_provider: provider,
        ollama_base_url: ollamaUrl,
        ollama_model: ollamaModel,
        openai_base_url: openaiUrl,
        openai_model: openaiModel,
        top_k_retrieval: Number(topK),
        rerank_top_k: Number(rerankTopK)
      };
      if (openaiKey) {
        payload.openai_api_key = openaiKey;
      }
      const updated = await api.updateConfig(payload);
      setConfig(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch (err) {
      alert(`Failed to save settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">AI & Inference Settings</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure your local or cloud LLM engine for answering cybersecurity questions.
            </p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2.5 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">Settings saved successfully! The answering LLM will use the updated configuration.</span>
        </div>
      )}

      {/* Test Connection Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-semibold text-slate-900">LLM Diagnostic & Connectivity Test</h3>
          </div>
          <button
            type="button"
            onClick={handleTestLLM}
            disabled={testing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition disabled:opacity-50"
          >
            {testing ? <LoaderCircle className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            <span>{testing ? 'Testing Engine…' : 'Test LLM Response'}</span>
          </button>
        </div>

        {testResult && (
          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <div className="flex items-center justify-between font-semibold">
              <span className="flex items-center gap-1 text-emerald-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Operational ({testResult.latency_ms} ms)
              </span>
              <span className="font-mono text-[11px] bg-emerald-100/80 px-2 py-0.5 rounded text-emerald-800">
                Model: {testResult.model}
              </span>
            </div>
            <p className="pt-1 text-slate-700 italic border-t border-emerald-100">
              "{testResult.response}"
            </p>
          </div>
        )}

        {testError && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Test failed:</p>
              <p className="mt-0.5">{testError}</p>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Provider Selection */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Cpu className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Inference Provider</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
              onClick={() => setProvider('ollama')}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                provider === 'ollama'
                  ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="provider"
                checked={provider === 'ollama'}
                onChange={() => setProvider('ollama')}
                className="mt-1"
              />
              <div>
                <div className="text-sm font-semibold text-slate-900">Local Ollama (Recommended)</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Runs privately on your machine using local models (e.g. Phi-3, LLaMA-3, Mistral). No API fees or data leakage.
                </div>
              </div>
            </label>

            <label
              onClick={() => setProvider('openai')}
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                provider === 'openai'
                  ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="provider"
                checked={provider === 'openai'}
                onChange={() => setProvider('openai')}
                className="mt-1"
              />
              <div>
                <div className="text-sm font-semibold text-slate-900">Cloud API / OpenAI Compatible</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Use OpenAI (GPT-4o), Groq, OpenRouter, Together, or LM Studio via an API key.
                </div>
              </div>
            </label>
          </div>

          {/* Ollama Section */}
          {provider === 'ollama' && (
            <div className="pt-4 space-y-4 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1.5">
                    Ollama Base URL
                  </label>
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 font-mono text-xs"
                    placeholder="http://localhost:11434"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Default local endpoint: http://localhost:11434</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="font-medium text-slate-700">
                      Model Selection
                    </label>
                    <button
                      type="button"
                      onClick={handleRefreshModels}
                      disabled={refreshingModels}
                      className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                    >
                      <RefreshCw className={`w-3 h-3 ${refreshingModels ? 'animate-spin' : ''}`} />
                      <span>Detect Models</span>
                    </button>
                  </div>

                  {installedModels.length > 0 ? (
                    <div className="space-y-1.5">
                      <select
                        value={ollamaModel}
                        onChange={(e) => setOllamaModel(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 font-mono text-xs bg-white"
                      >
                        {installedModels.map((m) => (
                          <option key={m} value={m}>
                            {m} {m.includes('phi3') ? '(Fast & Recommended)' : ''}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={ollamaModel}
                        onChange={(e) => setOllamaModel(e.target.value)}
                        placeholder="Or type custom model name"
                        className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-mono text-[11px]"
                      />
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={ollamaModel}
                      onChange={(e) => setOllamaModel(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 font-mono text-xs"
                      placeholder="e.g. phi3:latest, llama3:latest"
                    />
                  )}
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Detected {installedModels.length} installed model(s) in local Ollama.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* OpenAI Section */}
          {provider === 'openai' && (
            <div className="pt-4 space-y-4 border-t border-slate-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1.5">
                    API Key
                  </label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder={config?.has_openai_key ? '•••••••••••••••• (Key Configured)' : 'sk-...'}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 font-mono text-xs"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">Compatible with OpenAI, Groq (gsk_...), OpenRouter, etc.</span>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1.5">
                    Model Name
                  </label>
                  <input
                    type="text"
                    value={openaiModel}
                    onChange={(e) => setOpenaiModel(e.target.value)}
                    placeholder="gpt-4o-mini or llama-3.3-70b-versatile"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 font-mono text-xs"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">e.g. gpt-4o-mini, gpt-4o, claude-3-haiku</span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-medium text-slate-700 mb-1.5">
                    API Base URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={openaiUrl}
                    onChange={(e) => setOpenaiUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 font-mono text-xs"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Use default for OpenAI, or https://api.groq.com/openai/v1 for Groq, or http://localhost:1234/v1 for LM Studio.
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Retrieval Parameters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Database className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Hybrid Retrieval & Vector Search</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1.5">
                Top-K Vector Retrieval
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={topK}
                onChange={(e) => setTopK(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 font-mono text-xs"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">Number of candidate passages fetched from FAISS & BM25</span>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1.5">
                Rerank Top-K Evidence
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={rerankTopK}
                onChange={(e) => setRerankTopK(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-slate-900 font-mono text-xs"
              />
              <span className="text-[11px] text-slate-400 mt-1 block">High-relevance passages passed to the answering LLM</span>
            </div>
          </div>
        </div>

        {/* Security Summary */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-2">
          <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
            <Shield className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-900">Execution Guardrails & Privacy</h3>
          </div>
          <div className="text-xs text-slate-600 space-y-1.5 pt-1">
            <p>&bull; <strong>Local Isolation:</strong> Local Ollama runs completely offline on your host without external outbound data transmission.</p>
            <p>&bull; <strong>SSRF Protection:</strong> Internal IP ranges and metadata servers (169.254.169.254) are permanently disallowed.</p>
            <p>&bull; <strong>Evidence Provenance:</strong> The answering LLM grounds factual claims in authoritative feeds (CISA KEV, NVD, MITRE ATT&CK).</p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-medium text-white shadow-sm transition disabled:opacity-50"
          >
            {saving ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{saving ? 'Saving Changes…' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
