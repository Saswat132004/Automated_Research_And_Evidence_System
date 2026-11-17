import React, { useEffect, useState } from 'react';
import { Clock3, MessageSquare, Search } from 'lucide-react';
import { api } from '../services/api';

export default function HistoryPage({ onOpenSession }) {
  const [sessions, setSessions] = useState([]);
  const [filter, setFilter] = useState('');
  useEffect(() => { api.getSessions().then(setSessions).catch(console.error); }, []);
  const visible = sessions.filter((session) => session.query.toLowerCase().includes(filter.toLowerCase()));

  return <div className="mx-auto max-w-3xl py-10">
    <h1 className="text-2xl font-semibold tracking-tight text-slate-950">Previous questions</h1>
    <p className="mt-1 text-sm text-slate-500">Open a past answer or continue researching the topic.</p>
    <label className="relative mt-6 block"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search questions" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50" /></label>
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {visible.length ? visible.map((session) => <button key={session.id} onClick={() => onOpenSession(session.id)} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-4 text-left last:border-0 hover:bg-slate-50">
        <MessageSquare className="h-4 w-4 shrink-0 text-blue-600" /><span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{session.query}</span><span className="hidden shrink-0 text-xs text-slate-400 sm:inline">{session.created_at ? new Date(session.created_at).toLocaleDateString() : ''}</span>
      </button>) : <p className="px-4 py-12 text-center text-sm text-slate-500">No questions found.</p>}
    </div>
  </div>;
}
