import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Filter,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Check,
  Search,
  Download,
} from 'lucide-react';
import { ShineCard } from '../components/ShineCard';
import { BackButton } from '../components/BackButton';
import { StorageService } from '../services/storageService';
import { ExportService } from '../services/exportService';
import { DocumentAnalysis, RiskFinding, RiskSeverity, RiskCategory } from '../types/analysis';

export const RisksPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentAnalysis[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
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
    riskId: string,
    newStatus: 'Open' | 'Mitigated' | 'Accepted'
  ) => {
    await StorageService.updateRiskStatus(docId, riskId, newStatus);
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          return {
            ...d,
            risks: d.risks.map((r) => (r.id === riskId ? { ...r, status: newStatus } : r)),
          };
        }
        return d;
      })
    );
  };

  // Flatten risks across docs or filter by doc
  const targetDocs =
    selectedDocId === 'all'
      ? documents
      : documents.filter((d) => d.id === selectedDocId);

  const allRisksWithDoc = targetDocs.flatMap((d) =>
    (d.risks || []).map((r) => ({ ...r, docId: d.id, docTitle: d.title }))
  );

  const filteredRisks = allRisksWithDoc.filter((r) => {
    if (severityFilter !== 'all' && r.severity !== severityFilter) return false;
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && (r.status || 'Open') !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.exactQuote.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const allMissingProtections = targetDocs.flatMap((d) =>
    (d.missingProtections || []).map((m) => ({ ...m, docId: d.id, docTitle: d.title }))
  );

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
          { label: currentSelectedDoc ? currentSelectedDoc.title : 'Risks' },
        ]}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
            Risk Center
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Detect auto-renewal traps, uncapped liabilities, vague terms, and missing protections.
          </p>
        </div>

        {/* Document Selector & Download Button */}
        {documents.length > 0 && (
          <div className="flex flex-wrap items-center gap-3">
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

            <button
              onClick={() => {
                const targetDoc = currentSelectedDoc || documents[0];
                if (targetDoc) {
                  ExportService.exportPDFReport(targetDoc);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[var(--accent)] hover:opacity-90 text-black text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
              title="Download Risk Analysis Report"
            >
              <Download className="w-3.5 h-3.5 text-black stroke-[2.5]" />
              <span className="font-bold text-black">Download Risk Analysis</span>
            </button>
          </div>
        )}
      </div>

      {documents.length === 0 ? (
        <div className="p-12 text-center bg-[#0a0a0a] border border-stone-800 rounded-2xl space-y-4">
          <ShieldAlert className="w-12 h-12 text-stone-600 mx-auto" />
          <h2 className="text-lg font-semibold text-white">No analyzed risks found yet</h2>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            Analyze your first agreement to extract contractual risks and exposure.
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
          {/* Filter Bar */}
          <div className="p-4 bg-[#0a0a0a] border border-stone-800/80 rounded-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter risk findings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#141414] border border-stone-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-[var(--accent)]/50 w-44 sm:w-56"
                />
              </div>

              {/* Severity */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-[#141414] border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none"
              >
                <option value="all">All Severities</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              {/* Category */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#141414] border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="Liability">Liability</option>
                <option value="Payment">Payment</option>
                <option value="Termination">Termination</option>
                <option value="IP">Intellectual Property</option>
                <option value="Compliance">Compliance</option>
                <option value="Other">Other</option>
              </select>

              {/* Status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[#141414] border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="Open">Open</option>
                <option value="Mitigated">Mitigated</option>
                <option value="Accepted">Accepted</option>
              </select>
            </div>

            <span className="text-xs text-stone-400">
              Showing {filteredRisks.length} of {allRisksWithDoc.length} risks
            </span>
          </div>

          {/* Risks Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRisks.map((risk) => {
              const currentStatus = risk.status || 'Open';
              return (
                <div
                  key={`${risk.docId}-${risk.id}`}
                  className="p-5 bg-[#0a0a0a] border border-stone-800/90 hover:border-stone-700 rounded-xl space-y-3.5 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        risk.severity === 'Critical'
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                          : risk.severity === 'High'
                          ? 'bg-orange-950/60 text-orange-300 border-orange-800'
                          : 'bg-amber-950/60 text-amber-300 border-amber-800'
                      }`}
                    >
                      {risk.severity} Risk
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-stone-400 font-medium">
                        {risk.category}
                      </span>
                      {risk.isQuoteVerified && (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-800/40">
                          ✓ Verified
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-white">{risk.title}</h3>
                    <p className="text-xs text-stone-300 mt-1 leading-relaxed">
                      {risk.description}
                    </p>
                  </div>

                  {risk.exactQuote && (
                    <div className="p-2.5 bg-black/60 border-l-2 border-[var(--accent)]/50 font-serif-doc text-xs text-stone-300 italic">
                      "{risk.exactQuote}"
                    </div>
                  )}

                  <div className="p-2.5 bg-[#121212] border border-stone-800 rounded-lg text-xs text-[var(--accent)]">
                    <strong className="text-stone-300">Action: </strong>
                    {risk.recommendation}
                  </div>

                  {/* Status update buttons & document link */}
                  <div className="pt-2 border-t border-stone-900 flex items-center justify-between gap-2">
                    <button
                      onClick={() => navigate(`/report/${risk.docId}`)}
                      className="text-[11px] text-stone-400 hover:text-[var(--accent)] truncate max-w-[180px] flex items-center gap-1 cursor-pointer"
                    >
                      <span>{risk.docTitle}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </button>

                    <div className="flex items-center gap-1">
                      {(['Open', 'Mitigated', 'Accepted'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => handleUpdateStatus(risk.docId, risk.id, st)}
                          className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                            currentStatus === st
                              ? st === 'Mitigated'
                                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                                : st === 'Accepted'
                                ? 'bg-stone-800 text-stone-200 border border-stone-600'
                                : 'bg-rose-950/60 text-rose-300 border border-rose-800'
                              : 'text-stone-400 hover:text-white bg-transparent'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Missing Protections Detector Section */}
          {allMissingProtections.length > 0 && (
            <div className="space-y-4 pt-6 border-t border-stone-800">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white font-display">
                  Missing Protection Detector
                </h2>
              </div>
              <p className="text-xs text-stone-400">
                Key customary protections that are absent from these agreements:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allMissingProtections.map((mp, idx) => (
                  <div
                    key={`${mp.docId}-${mp.id || idx}`}
                    className="p-5 bg-[#0a0a0a] border border-amber-900/40 rounded-xl space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-300">{mp.title}</span>
                      <span className="text-stone-400 truncate max-w-[150px]">{mp.docTitle}</span>
                    </div>

                    <p className="text-xs text-stone-300">{mp.whyItMatters}</p>

                    <div className="p-2.5 bg-black border border-stone-800 rounded-lg">
                      <span className="text-[10px] uppercase font-bold text-[var(--accent)] tracking-wider block mb-1">
                        Recommended Language:
                      </span>
                      <p className="text-xs font-serif-doc text-stone-300 italic">
                        "{mp.suggestedWording}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
