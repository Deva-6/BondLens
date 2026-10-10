import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  UserCheck,
  Building,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Check,
  ExternalLink,
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { BackButton } from '../components/BackButton';
import { DocumentAnalysis, ObligationItem, ObligationStatus } from '../types/analysis';

export const ObligationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentAnalysis[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('all');
  const [partyTab, setPartyTab] = useState<'my' | 'counterparty' | 'all'>('my');
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

  const handleUpdateStatus = async (
    docId: string,
    obId: string,
    newStatus: ObligationStatus
  ) => {
    await StorageService.updateObligationStatus(docId, obId, newStatus);
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          return {
            ...d,
            obligations: d.obligations.map((o) =>
              o.id === obId ? { ...o, status: newStatus } : o
            ),
          };
        }
        return d;
      })
    );
  };

  const targetDocs =
    selectedDocId === 'all'
      ? documents
      : documents.filter((d) => d.id === selectedDocId);

  const allObligationsWithDoc = targetDocs.flatMap((d) =>
    (d.obligations || []).map((o) => ({ ...o, docId: d.id, docTitle: d.title }))
  );

  const filteredObligations = allObligationsWithDoc.filter((o) => {
    if (partyTab === 'my' && !o.belongsToUser) return false;
    if (partyTab === 'counterparty' && o.belongsToUser) return false;
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        o.description.toLowerCase().includes(q) ||
        o.responsibleParty.toLowerCase().includes(q) ||
        (o.consequenceOfBreach && o.consequenceOfBreach.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const myCount = allObligationsWithDoc.filter((o) => o.belongsToUser).length;
  const counterpartyCount = allObligationsWithDoc.filter((o) => !o.belongsToUser).length;

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
          { label: currentSelectedDoc ? currentSelectedDoc.title : 'Obligations' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
            Obligation Tracker
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Track affirmative duties, covenants, and breach penalties across your agreements.
          </p>
        </div>

        {/* Doc selector */}
        {documents.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-stone-400">Agreement:</span>
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
          </div>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="p-12 text-center bg-[#0a0a0a] border border-stone-800 rounded-2xl space-y-4">
          <CheckSquare className="w-12 h-12 text-stone-600 mx-auto" />
          <h2 className="text-lg font-semibold text-white">No obligations recorded yet</h2>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            Run an analysis to distinguish your commitments from counterparty obligations.
          </p>
          <button
            onClick={() => navigate('/analyze')}
            className="px-5 py-2.5 bg-[var(--accent)] text-black font-semibold text-xs rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            Analyze Document
          </button>
        </div>
      ) : (
        <>
          {/* Party Tabs & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-[#0a0a0a] border border-stone-800/80 rounded-xl">
            {/* Party Tab Buttons */}
            <div className="flex items-center gap-1 bg-[#121212] p-1 border border-stone-800 rounded-xl">
              <button
                onClick={() => setPartyTab('my')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  partyTab === 'my'
                    ? 'bg-[var(--accent)] text-black shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>My Obligations ({myCount})</span>
              </button>
              <button
                onClick={() => setPartyTab('counterparty')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  partyTab === 'counterparty'
                    ? 'bg-[var(--accent)] text-black shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Counterparty ({counterpartyCount})</span>
              </button>
              <button
                onClick={() => setPartyTab('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  partyTab === 'all'
                    ? 'bg-[var(--accent)] text-black shadow-sm'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                All ({allObligationsWithDoc.length})
              </button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search duties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#141414] border border-stone-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-[var(--accent)] w-44 sm:w-52"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#141414] border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Fulfilled">Fulfilled</option>
                <option value="Waived">Waived</option>
              </select>
            </div>
          </div>

          {/* Obligations Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredObligations.map((ob) => (
              <div
                key={`${ob.docId}-${ob.id}`}
                className={`p-5 bg-[#0a0a0a] border rounded-xl space-y-3 transition-all ${
                  ob.status === 'Fulfilled'
                    ? 'border-stone-900 opacity-60'
                    : 'border-stone-800/90 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      ob.belongsToUser
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/40'
                        : 'bg-stone-900 text-stone-300 border-stone-800'
                    }`}
                  >
                    {ob.belongsToUser ? 'You are responsible' : `${ob.responsibleParty} duty`}
                  </span>

                  <span className="text-xs text-stone-400 font-mono">
                    {ob.dueDate || 'Ongoing duty'}
                  </span>
                </div>

                <p className="text-xs text-stone-200 leading-relaxed font-medium">
                  {ob.description}
                </p>

                {ob.consequenceOfBreach && (
                  <div className="p-2.5 bg-red-950/20 border border-red-900/30 rounded-lg text-xs text-rose-300">
                    <strong>Consequence of breach: </strong>
                    {ob.consequenceOfBreach}
                  </div>
                )}

                {ob.exactQuote && (
                  <div className="text-[11px] font-serif-doc text-stone-400 italic">
                    "{ob.exactQuote}"
                  </div>
                )}

                {/* Status Switcher */}
                <div className="pt-2 border-t border-stone-900 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-stone-400 truncate max-w-[160px]">
                    {ob.docTitle}
                  </span>

                  <div className="flex items-center gap-1">
                    {(['Pending', 'In Progress', 'Fulfilled', 'Waived'] as ObligationStatus[]).map(
                      (st) => (
                        <button
                          key={st}
                          onClick={() => handleUpdateStatus(ob.docId, ob.id, st)}
                          className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                            ob.status === st
                              ? st === 'Fulfilled'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : st === 'In Progress'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/40'
                              : 'text-stone-400 hover:text-white bg-transparent'
                          }`}
                        >
                          {st}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
