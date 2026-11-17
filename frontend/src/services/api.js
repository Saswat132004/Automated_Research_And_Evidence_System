// The unified app is served by FastAPI on :8000 and Vite proxies requests on
// :5173. Other IDE preview servers do not have that proxy, so use FastAPI
// directly instead of issuing a request to the preview server.
const API_BASE = ['8000', '5173'].includes(window.location.port)
  ? '/api/v1'
  : 'http://localhost:8000/api/v1';

async function fetchJson(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'API request failed');
    }
    return await res.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // System
  getHealth: () => fetchJson('/system/health'),
  getConfig: () => fetchJson('/system/config'),
  updateConfig: (data) => fetchJson('/system/config', { method: 'POST', body: JSON.stringify(data) }),
  getInstalledModels: () => fetchJson('/system/installed-models'),
  testLLM: (prompt) => fetchJson('/system/llm/test', { method: 'POST', body: JSON.stringify({ prompt: prompt || 'ARES Answering Test' }) }),

  // Research
  startResearch: (query, depth = 'comprehensive', target_sources = ['nvd', 'mitre', 'cisa', 'local_docs']) =>
    fetchJson('/research/start', {
      method: 'POST',
      body: JSON.stringify({ query, depth, target_sources })
    }),
  getSessions: () => fetchJson('/research/sessions'),
  getSessionDetails: (id) => fetchJson(`/research/sessions/${id}`),
  getSessionLogs: (id) => fetchJson(`/research/sessions/${id}/logs`),

  // Documents
  getDocuments: () => fetchJson('/documents'),
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || 'Upload failed');
    }
    return res.json();
  },
  deleteDocument: (id) => fetchJson(`/documents/${id}`, { method: 'DELETE' }),

  // Evidence
  getSessionEvidence: (sessionId) => fetchJson(`/evidence/session/${sessionId}`),
  searchEvidence: (query) => fetchJson(`/evidence/search?q=${encodeURIComponent(query)}`),

  // Graph
  getSessionGraph: (sessionId) => fetchJson(`/graph/session/${sessionId}`),

  // Threat Intel
  getCve: (cveId) => fetchJson(`/threat-intel/cve/${cveId}`),
  getCisaKev: (limit = 30) => fetchJson(`/threat-intel/cisa-kev?limit=${limit}`),
  getMitreAttack: () => fetchJson('/threat-intel/mitre-attack'),

  // Reports
  getReports: () => fetchJson('/reports'),
  getReport: (sessionId) => fetchJson(`/reports/${sessionId}`),
  getMarkdownUrl: (sessionId) => `${API_BASE}/reports/${sessionId}/markdown`,
  getPdfUrl: (sessionId) => `${API_BASE}/reports/${sessionId}/pdf`,

  // Evaluation
  getLatestEvaluation: () => fetchJson('/evaluation/latest'),
  runEvaluation: (k = 5) => fetchJson(`/evaluation/run?k=${k}`, { method: 'POST' }),
};
