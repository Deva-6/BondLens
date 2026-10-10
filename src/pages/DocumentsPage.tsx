import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Search,
  PlusCircle,
  FileText,
  Trash2,
  ExternalLink,
  RefreshCw,
  LayoutGrid,
  List,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { BackButton } from '../components/BackButton';
import { ShineCard } from '../components/ShineCard';
import { DocumentAnalysis } from '../types/analysis';

export const DocumentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentAnalysis[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'risk-desc' | 'risk-asc' | 'title'>('date-desc');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [docToDelete, setDocToDelete] = useState<DocumentAnalysis | null>(null);
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

  const handleDelete = async () => {
    if (!docToDelete) return;
    await StorageService.deleteDocument(docToDelete.id);
    setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
    setDocToDelete(null);
  };

  const filteredAndSorted = documents
    .filter((d) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.documentType.toLowerCase().includes(q) ||
        d.userPartyRole.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'date-desc') return b.createdAt - a.createdAt;
      if (sortBy === 'date-asc') return a.createdAt - b.createdAt;
      if (sortBy === 'risk-desc') return b.overallRiskScore - a.overallRiskScore;
      if (sortBy === 'risk-asc') return a.overallRiskScore - b.overallRiskScore;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      return 0;
    });

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-8 w-60 bg-stone-900 rounded" />
        <div className="h-44 bg-[#0d0d0d] rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Button */}
      <BackButton
        fallbackTo="/dashboard"
        breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'My Documents' }]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
            My Documents
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Local encrypted repository of analyzed agreements ({documents.length} total).
          </p>
        </div>

        <button
          onClick={() => navigate('/analyze')}
          className="flex items-center gap-1.5 px-4 py-2 bg-[var(--accent)] text-black font-semibold text-xs rounded-xl hover:opacity-90 transition-opacity cursor-pointer shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Analyze Document</span>
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="p-12 text-center bg-[#0a0a0a] border border-stone-800 rounded-2xl space-y-4">
          <FolderOpen className="w-12 h-12 text-stone-600 mx-auto" />
          <h2 className="text-lg font-semibold text-white">Your document vault is empty</h2>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            Upload your contracts, terms, or leases to begin tracking obligations and risks.
          </p>
          <button
            onClick={() => navigate('/analyze')}
            className="px-5 py-2.5 bg-[var(--accent)] text-black font-semibold text-xs rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            Analyze First Document
          </button>
        </div>
      ) : (
        <>
          {/* Controls: Search, Sort, View Toggle */}
          <div className="p-4 bg-[#0a0a0a] border border-stone-800/80 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[240px]">
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search agreements by title or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#141414] border border-stone-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-[var(--accent)]/50"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-[#141414] border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none"
                >
                  <option value="date-desc">Newest First</option>
                  <option value="date-asc">Oldest First</option>
                  <option value="risk-desc">Highest Risk Score</option>
                  <option value="risk-asc">Lowest Risk Score</option>
                  <option value="title">Title (A-Z)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1 bg-[#121212] p-1 border border-stone-800 rounded-lg">
              <button
                onClick={() => setViewLayout('grid')}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewLayout === 'grid' ? 'bg-stone-800 text-[var(--accent)]' : 'text-stone-400'
                }`}
                aria-label="Grid layout"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewLayout('list')}
                className={`p-1.5 rounded transition-colors cursor-pointer ${
                  viewLayout === 'list' ? 'bg-stone-800 text-[var(--accent)]' : 'text-stone-400'
                }`}
                aria-label="List layout"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Documents Grid / List */}
          {viewLayout === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSorted.map((doc) => (
                <div
                  key={doc.id}
                  className="p-5 bg-[#0a0a0a] border border-stone-800 hover:border-[var(--accent)]/50 rounded-xl space-y-4 transition-all duration-300 flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-semibold text-[var(--accent)] truncate max-w-[150px]">
                        {doc.documentType}
                      </span>
                      <span
                        className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                          doc.overallRiskScore >= 75
                            ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                            : doc.overallRiskScore >= 50
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                            : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                        }`}
                      >
                        {doc.overallRiskScore} Risk
                      </span>
                    </div>

                    <h3
                      onClick={() => navigate(`/report/${doc.id}`)}
                      className="text-base font-semibold text-white group-hover:text-[var(--accent)] transition-colors cursor-pointer truncate"
                      title={doc.title}
                    >
                      {doc.title}
                    </h3>

                    <p className="text-xs text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                      {doc.summary}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-stone-400 mt-4 pt-3 border-t border-stone-900">
                      <span>{doc.userPartyRole} view</span>
                      <span>·</span>
                      <span>{doc.keyClauses?.length || 0} clauses</span>
                      <span>·</span>
                      <span>{doc.deadlines?.length || 0} deadlines</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-900 flex items-center justify-between">
                    <button
                      onClick={() => navigate(`/report/${doc.id}`)}
                      className="text-xs font-semibold text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>Open Report</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDocToDelete(doc)}
                      className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-stone-900 rounded-lg transition-colors cursor-pointer"
                      title="Delete document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#0a0a0a] border border-stone-800 rounded-xl divide-y divide-stone-900 overflow-hidden">
              {filteredAndSorted.map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 flex items-center justify-between gap-4 hover:bg-stone-950/60 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-[var(--accent)] shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4
                        onClick={() => navigate(`/report/${doc.id}`)}
                        className="text-sm font-semibold text-white hover:text-[var(--accent)] transition-colors truncate cursor-pointer"
                      >
                        {doc.title}
                      </h4>
                      <p className="text-[11px] text-stone-400 truncate">
                        {doc.documentType} · Perspective: {doc.userPartyRole} · {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        doc.overallRiskScore >= 75
                          ? 'bg-rose-950/40 text-rose-300 border-rose-800/60'
                          : doc.overallRiskScore >= 50
                          ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                          : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                      }`}
                    >
                      {doc.overallRiskScore}/100
                    </span>

                    <button
                      onClick={() => navigate(`/report/${doc.id}`)}
                      className="px-3 py-1.5 text-xs font-semibold text-stone-300 hover:text-white bg-stone-900 hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
                    >
                      Open
                    </button>

                    <button
                      onClick={() => setDocToDelete(doc)}
                      className="p-1.5 text-stone-400 hover:text-rose-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!docToDelete}
        title="Delete Agreement"
        message={`Are you sure you want to permanently delete "${docToDelete?.title}" from your on-device vault?`}
        confirmLabel="Delete"
        isDestructive
        onConfirm={handleDelete}
        onCancel={() => setDocToDelete(null)}
      />
    </div>
  );
};
