import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Clock,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  Check,
  RotateCcw,
  Bell,
  Search,
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { ExportService } from '../services/exportService';
import { BackButton } from '../components/BackButton';
import { DocumentAnalysis, DeadlineItem, DeadlineType } from '../types/analysis';

export const DeadlinesPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentAnalysis[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const docs = await StorageService.getAllDocuments();
        setDocuments(docs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const targetDocs =
    selectedDocId === 'all'
      ? documents
      : documents.filter((d) => d.id === selectedDocId);

  const allDeadlinesWithDoc = targetDocs.flatMap((d) =>
    (d.deadlines || []).map((dl) => ({ ...dl, docId: d.id, docTitle: d.title }))
  );

  const handleToggleDone = async (docId: string, dlId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    await StorageService.updateDeadlineStatus(docId, dlId, nextStatus as any);
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          return {
            ...d,
            deadlines: d.deadlines.map((dl) =>
              dl.id === dlId ? { ...dl, status: nextStatus as any } : dl
            ),
          };
        }
        return d;
      })
    );
  };

  const handleSnooze = async (docId: string, dlId: string, days: number) => {
    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + days);
    const dateStr = snoozeDate.toISOString().split('T')[0];

    await StorageService.updateDeadlineStatus(docId, dlId, 'Snoozed', dateStr);
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          return {
            ...d,
            deadlines: d.deadlines.map((dl) =>
              dl.id === dlId ? { ...dl, status: 'Snoozed', snoozedUntil: dateStr } : dl
            ),
          };
        }
        return d;
      })
    );
  };

  const handleExportAllICS = () => {
    try {
      const docName =
        selectedDocId === 'all'
          ? 'BondLens_All_Agreements'
          : documents.find((d) => d.id === selectedDocId)?.title || 'BondLens_Deadlines';
      ExportService.exportICS(filteredDeadlines, docName);
    } catch (err: any) {
      alert(err.message || 'No deadlines available to export.');
    }
  };

  // Calculate reminder proximity (days until target date)
  const getDeadlineProximity = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return null;

    const now = new Date();
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, urgency: 'overdue' };
    if (diffDays <= 1) return { label: 'Due tomorrow / today', urgency: 'critical' };
    if (diffDays <= 7) return { label: `Due in ${diffDays} days`, urgency: 'high' };
    if (diffDays <= 30) return { label: `Due in ${diffDays} days`, urgency: 'upcoming' };
    return { label: `In ${diffDays} days`, urgency: 'normal' };
  };

  const filteredDeadlines = allDeadlinesWithDoc.filter((dl) => {
    if (typeFilter !== 'all' && dl.type !== typeFilter) return false;
    if (statusFilter !== 'all' && dl.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        dl.label.toLowerCase().includes(q) ||
        (dl.consequenceIfMissed && dl.consequenceIfMissed.toLowerCase().includes(q))
      );
    }
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-8 w-60 bg-stone-900 rounded" />
        <div className="h-44 bg-[#0d0d0d] rounded-xl" />
      </div>
    );
  }

  const currentSelectedDoc = documents.find((d) => d.id === selectedDocId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Button with Breadcrumbs */}
      <BackButton
        fallbackTo="/dashboard"
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'My Documents', to: '/documents' },
          { label: currentSelectedDoc ? currentSelectedDoc.title : 'Deadlines' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
            Deadlines & Timeline
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Track notice requirements, renewal dates, payment terms, and .ics export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {documents.length > 0 && (
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="bg-[#141414] border border-stone-800 rounded-xl px-3 py-1.5 text-xs text-stone-200 focus:outline-none"
            >
              <option value="all">All Documents ({documents.length})</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1 bg-[#121212] p-1 border border-stone-800 rounded-xl">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-[#F5E6A8] text-black shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === 'calendar'
                  ? 'bg-[#F5E6A8] text-black shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Calendar Schedule
            </button>
          </div>

          <button
            onClick={handleExportAllICS}
            disabled={filteredDeadlines.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#181818] hover:bg-[#222] border border-stone-800 hover:border-[#F5E6A8]/50 text-xs font-semibold text-[#F5E6A8] rounded-xl transition-colors cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .ics</span>
          </button>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="p-12 text-center bg-[#0a0a0a] border border-stone-800 rounded-2xl space-y-4">
          <CalendarIcon className="w-12 h-12 text-stone-600 mx-auto" />
          <h2 className="text-lg font-semibold text-white">No deadlines extracted yet</h2>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            Analyze a contract to track payment milestones and notice dates.
          </p>
          <button
            onClick={() => navigate('/analyze')}
            className="px-5 py-2.5 bg-[#F5E6A8] text-black font-semibold text-xs rounded-xl hover:bg-[#E8D48B] transition-colors cursor-pointer"
          >
            Analyze Document
          </button>
        </div>
      ) : (
        <>
          {/* Filter Bar */}
          <div className="p-4 bg-[#0a0a0a] border border-stone-800/80 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter deadlines..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#141414] border border-stone-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-[#F5E6A8]/50 w-44 sm:w-56"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-[#141414] border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="Payment">Payment</option>
                <option value="Renewal">Renewal</option>
                <option value="TerminationNotice">Termination Notice</option>
                <option value="Deliverable">Deliverable</option>
                <option value="Audit">Audit</option>
                <option value="Expiration">Expiration</option>
                <option value="Other">Other</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#141414] border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Snoozed">Snoozed</option>
              </select>
            </div>

            <span className="text-xs text-stone-400">
              Showing {filteredDeadlines.length} deadlines
            </span>
          </div>

          {/* VIEW: LIST */}
          {viewMode === 'list' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDeadlines.map((dl) => {
                const effectiveDateStr = dl.resolvedDate || dl.date;
                const proximity = getDeadlineProximity(effectiveDateStr);

                return (
                  <div
                    key={`${dl.docId}-${dl.id}`}
                    className={`p-5 bg-[#0a0a0a] border rounded-xl space-y-3 transition-all ${
                      dl.status === 'Completed'
                        ? 'border-stone-900 opacity-60'
                        : 'border-stone-800/90 hover:border-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60">
                        {dl.type}
                      </span>

                      {/* Reminder proximity badge */}
                      {proximity && dl.status !== 'Completed' && (
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border flex items-center gap-1 ${
                            proximity.urgency === 'overdue'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                              : proximity.urgency === 'critical' || proximity.urgency === 'high'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                              : 'bg-stone-900 text-stone-300 border-stone-800'
                          }`}
                        >
                          <Bell className="w-2.5 h-2.5" />
                          {proximity.label}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3
                        className={`text-sm font-semibold ${
                          dl.status === 'Completed' ? 'line-through text-stone-500' : 'text-white'
                        }`}
                      >
                        {dl.label}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-mono text-[#F5E6A8] mt-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {dl.resolvedDate
                            ? `Resolved Date: ${dl.resolvedDate}`
                            : dl.date
                            ? dl.date
                            : dl.relativeRule || 'Date pending'}
                        </span>
                      </div>
                    </div>

                    {dl.noticeRequiredDays ? (
                      <p className="text-xs text-stone-300">
                        Notice window required:{' '}
                        <strong className="text-white">{dl.noticeRequiredDays} days</strong> prior.
                      </p>
                    ) : null}

                    {dl.consequenceIfMissed && (
                      <div className="p-2.5 bg-red-950/20 border border-red-900/30 rounded-lg text-xs text-rose-300">
                        <strong>Consequence: </strong>
                        {dl.consequenceIfMissed}
                      </div>
                    )}

                    {dl.exactQuote && (
                      <div className="text-[11px] font-serif-doc text-stone-400 italic">
                        "{dl.exactQuote}"
                      </div>
                    )}

                    {/* Actions toolbar */}
                    <div className="pt-2 border-t border-stone-900 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleDone(dl.docId, dl.id, dl.status)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                          dl.status === 'Completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-stone-900 text-stone-300 hover:text-white border border-stone-800'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{dl.status === 'Completed' ? 'Completed' : 'Mark Done'}</span>
                      </button>

                      {/* Snooze menu */}
                      {dl.status !== 'Completed' && (
                        <div className="flex items-center gap-1 text-[11px] text-stone-400">
                          <span>Snooze:</span>
                          <button
                            onClick={() => handleSnooze(dl.docId, dl.id, 7)}
                            className="px-1.5 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 cursor-pointer"
                          >
                            7d
                          </button>
                          <button
                            onClick={() => handleSnooze(dl.docId, dl.id, 14)}
                            className="px-1.5 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 cursor-pointer"
                          >
                            14d
                          </button>
                          <button
                            onClick={() => handleSnooze(dl.docId, dl.id, 30)}
                            className="px-1.5 py-0.5 rounded bg-stone-900 hover:bg-stone-800 text-stone-300 cursor-pointer"
                          >
                            30d
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW: CALENDAR SCHEDULE */}
          {viewMode === 'calendar' && (
            <div className="space-y-4">
              <div className="p-6 bg-[#0a0a0a] border border-stone-800 rounded-2xl space-y-6">
                <h3 className="text-base font-semibold text-white font-display">
                  Chronological Schedule
                </h3>

                <div className="space-y-4">
                  {filteredDeadlines
                    .slice()
                    .sort((a, b) => {
                      const da = a.resolvedDate || a.date || '9999';
                      const db = b.resolvedDate || b.date || '9999';
                      return da.localeCompare(db);
                    })
                    .map((dl) => (
                      <div
                        key={`${dl.docId}-${dl.id}`}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#111] border border-stone-800/80 rounded-xl gap-4 hover:border-[#F5E6A8]/40 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-[#F5E6A8]/10 border border-[#F5E6A8]/30 flex flex-col items-center justify-center text-[#F5E6A8] shrink-0 font-mono">
                            <span className="text-[10px] uppercase">
                              {(dl.resolvedDate || dl.date)?.slice(5, 7) || 'CAL'}
                            </span>
                            <span className="text-sm font-bold">
                              {(dl.resolvedDate || dl.date)?.slice(8, 10) || '—'}
                            </span>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-white">{dl.label}</h4>
                            <p className="text-xs text-stone-400 mt-0.5">
                              {dl.docTitle} · {dl.type}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-mono text-[#F5E6A8] font-bold block">
                            {dl.resolvedDate || dl.date || dl.relativeRule}
                          </span>
                          <span className="text-[11px] text-stone-400">
                            Status: {dl.status}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
