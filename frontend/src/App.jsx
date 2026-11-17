import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Workspace from './pages/Workspace';
import AskPage from './pages/AskPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import { api } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('ask');
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    api.getHealth()
      .then(setSystemHealth)
      .catch(console.error);
  }, []);

  const handleSessionReady = (sessionId) => {
    setActiveSessionId(sessionId);
  };

  const handleSelectSession = (sessionId) => {
    setActiveSessionId(sessionId);
    setActiveTab('ask');
  };

  const handleNewQuestion = () => {
    setActiveSessionId(null);
    setActiveTab('ask');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Navbar activeTab={activeTab} onNavigate={setActiveTab} onNewQuestion={handleNewQuestion} />
      <main className="px-5 sm:px-8">
        {activeTab === 'ask' && (
          <AskPage
            selectedSessionId={activeSessionId}
            onSessionReady={handleSessionReady}
            onOpenDetails={(sessionId) => {
              setActiveSessionId(sessionId);
              setActiveTab('details');
            }}
            onOpenSettings={() => setActiveTab('settings')}
          />
        )}
        {activeTab === 'history' && <HistoryPage onOpenSession={handleSelectSession} />}
        {activeTab === 'settings' && <SettingsPage />}
        {activeTab === 'details' && (
          <Workspace sessionId={activeSessionId} onNavigateTab={(tab) => setActiveTab(tab || 'ask')} />
        )}
      </main>
    </div>
  );
}
