import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitCompare,
  ArrowRight,
  ShieldAlert,
  BookOpen,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Scale,
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { BackButton } from '../components/BackButton';
import { DocumentAnalysis } from '../types/analysis';
import { SAMPLE_CONTRACTS } from '../data/sampleContracts';

export const ComparePage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentAnalysis[]>([]);
  const [docAId, setDocAId] = useState<string>('');
  const [docBId, setDocBId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const docs = await StorageService.getAllDocuments();
        setDocuments(docs);
        if (docs.length >= 2) {
          setDocAId(docs[0].id);
          setDocBId(docs[1].id);
        } else if (docs.length === 1) {
          setDocAId(docs[0].id);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const docA = documents.find((d) => d.id === docAId);
  const docB = documents.find((d) => d.id === docBId);

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
      {/* Back Button with Breadcrumbs */}
      <BackButton
        fallbackTo="/dashboard"
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'My Documents', to: '/documents' },
          { label: 'Compare Agreements' },
        ]}
      />

      {/* Header */}
      <div className="border-b border-stone-800 pb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display flex items-center gap-2.5">
          <GitCompare className="w-6 h-6 text-[var(--accent)]" />
          <span>Compare Agreements</span>
        </h1>
        <p className="text-sm text-stone-400 mt-1">
          Side-by-side risk differentials, clause terms, and missing protection comparison.
        </p>
      </div>

      {documents.length < 2 ? (
        <div className="p-12 text-center bg-[#0a0a0a] border border-stone-800 rounded-2xl space-y-4">
          <Scale className="w-12 h-12 text-stone-600 mx-auto" />
          <h2 className="text-lg font-semibold text-white">
            Comparison requires at least 2 analyzed documents
          </h2>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            You currently have {documents.length} document analyzed. Analyze a second agreement or try a sample contract to compare terms side-by-side.
          </p>
          <button
            onClick={() => navigate('/analyze')}
            className="px-5 py-2.5 bg-[var(--accent)] text-black font-semibold text-xs rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            Analyze Another Agreement
          </button>
        </div>
      ) : (
        <>
          {/* Selector Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#0a0a0a] border border-stone-800 rounded-xl">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-1.5">
                Document A
              </label>
              <select
                value={docAId}
                onChange={(e) => setDocAId(e.target.value)}
                className="w-full bg-[#141414] border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.userPartyRole})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1.5">
                Document B
              </label>
              <select
                value={docBId}
                onChange={(e) => setDocBId(e.target.value)}
                className="w-full bg-[#141414] border border-stone-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
              >
                {documents.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.userPartyRole})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Comparison Cards */}
          {docA && docB && (
            <div className="space-y-6">
              {/* Risk Score Differential */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-[#0a0a0a] border border-[var(--border-shine)]/30 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                      Doc A: {docA.title}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        docA.overallRiskScore >= 75
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                          : 'bg-amber-950/60 text-amber-300 border-amber-800'
                      }`}
                    >
                      {docA.overallRiskScore} / 100 Risk
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">{docA.summary}</p>
                </div>

                <div className="p-6 bg-[#0a0a0a] border border-stone-800 rounded-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-300">
                      Doc B: {docB.title}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        docB.overallRiskScore >= 75
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                          : 'bg-amber-950/60 text-amber-300 border-amber-800'
                      }`}
                    >
                      {docB.overallRiskScore} / 100 Risk
                    </span>
                  </div>
                  <p className="text-xs text-stone-300 leading-relaxed">{docB.summary}</p>
                </div>
              </div>

              {/* Differential Comparison Table */}
              <div className="bg-[#0a0a0a] border border-stone-800 rounded-xl overflow-hidden">
                <div className="p-4 bg-[#121212] border-b border-stone-800 text-xs font-semibold uppercase tracking-wider text-stone-300">
                  Key Parameters Matrix
                </div>
                <div className="divide-y divide-stone-900 text-xs">
                  <div className="grid grid-cols-3 p-3.5">
                    <span className="text-stone-400">Perspective Role</span>
                    <span className="text-stone-200">{docA.userPartyRole}</span>
                    <span className="text-stone-200">{docB.userPartyRole}</span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5">
                    <span className="text-stone-400">Document Type</span>
                    <span className="text-stone-200">{docA.documentType}</span>
                    <span className="text-stone-200">{docB.documentType}</span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5">
                    <span className="text-stone-400">Effective Date</span>
                    <span className="text-stone-200">{docA.metadata?.effectiveDate || 'Not specified'}</span>
                    <span className="text-stone-200">{docB.metadata?.effectiveDate || 'Not specified'}</span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5">
                    <span className="text-stone-400">Term Length</span>
                    <span className="text-stone-200">{docA.metadata?.termLength || 'Indefinite / SOW'}</span>
                    <span className="text-stone-200">{docB.metadata?.termLength || 'Indefinite / SOW'}</span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5">
                    <span className="text-stone-400">Governing Law</span>
                    <span className="text-stone-200">{docA.metadata?.governingLaw || 'Unspecified'}</span>
                    <span className="text-stone-200">{docB.metadata?.governingLaw || 'Unspecified'}</span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5">
                    <span className="text-stone-400">Total Risks Identified</span>
                    <span className="text-rose-300 font-mono font-semibold">{docA.risks?.length || 0}</span>
                    <span className="text-rose-300 font-mono font-semibold">{docB.risks?.length || 0}</span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5">
                    <span className="text-stone-400">Key Clauses Extracted</span>
                    <span className="text-[var(--accent)] font-mono font-semibold">{docA.keyClauses?.length || 0}</span>
                    <span className="text-[var(--accent)] font-mono font-semibold">{docB.keyClauses?.length || 0}</span>
                  </div>
                  <div className="grid grid-cols-3 p-3.5">
                    <span className="text-stone-400">Missing Protections</span>
                    <span className="text-amber-300 font-mono font-semibold">{docA.missingProtections?.length || 0}</span>
                    <span className="text-amber-300 font-mono font-semibold">{docB.missingProtections?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
