import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  FolderOpen,
  ShieldAlert,
  BookOpen,
  Calendar,
  CheckSquare,
  Sparkles,
  ArrowRight,
  FileText,
  Clock,
} from 'lucide-react';
import { ShineCard } from '../components/ShineCard';
import { ShineButton } from '../components/ShineButton';
import { StorageService } from '../services/storageService';
import { DocumentAnalysis } from '../types/analysis';
import { SAMPLE_CONTRACTS } from '../data/sampleContracts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<DocumentAnalysis[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const docs = await StorageService.getAllDocuments();
        setDocuments(docs);
      } catch (err) {
        console.error('Failed to load documents:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute live counts across all documents
  const totalDocsCount = documents.length;
  const totalRisksCount = documents.reduce((acc, d) => acc + (d.risks?.length || 0), 0);
  const criticalRisksCount = documents.reduce(
    (acc, d) => acc + (d.risks?.filter((r) => r.severity === 'Critical' || r.severity === 'High').length || 0),
    0
  );
  const totalClausesCount = documents.reduce((acc, d) => acc + (d.keyClauses?.length || 0), 0);
  const totalDeadlinesCount = documents.reduce((acc, d) => acc + (d.deadlines?.length || 0), 0);
  const pendingDeadlinesCount = documents.reduce(
    (acc, d) => acc + (d.deadlines?.filter((dl) => dl.status !== 'Completed').length || 0),
    0
  );
  const totalObligationsCount = documents.reduce((acc, d) => acc + (d.obligations?.length || 0), 0);
  const myObligationsCount = documents.reduce(
    (acc, d) => acc + (d.obligations?.filter((o) => o.belongsToUser).length || 0),
    0
  );

  const handleLoadSample = (sampleId: string) => {
    navigate(`/analyze?sample=${sampleId}`);
  };

  const navCards = [
    {
      title: 'Analyze Document',
      route: '/analyze',
      icon: PlusCircle,
      description: 'Upload contracts, NDAs, or leases for clause & risk breakdown.',
      count: 'New Scan',
      badge: 'Start here',
      glow: true,
    },
    {
      title: 'My Documents',
      route: '/documents',
      icon: FolderOpen,
      description: 'Review and manage your local vault of analyzed agreements.',
      count: `${totalDocsCount} Document${totalDocsCount === 1 ? '' : 's'}`,
    },
    {
      title: 'Risks',
      route: '/risks',
      icon: ShieldAlert,
      description: 'Inspect auto-renewals, uncapped liabilities, and missing protections.',
      count: `${totalRisksCount} Finding${totalRisksCount === 1 ? '' : 's'} (${criticalRisksCount} critical)`,
    },
    {
      title: 'Key Clauses',
      route: '/clauses',
      icon: BookOpen,
      description: 'Clause library, personal notes, and interactive flashcard deck.',
      count: `${totalClausesCount} Clause${totalClausesCount === 1 ? '' : 's'}`,
    },
    {
      title: 'Deadlines',
      route: '/deadlines',
      icon: Calendar,
      description: 'Timeline milestones, .ics calendar exports, and reminder alerts.',
      count: `${pendingDeadlinesCount} Pending Deadline${pendingDeadlinesCount === 1 ? '' : 's'}`,
    },
    {
      title: 'Obligations',
      route: '/obligations',
      icon: CheckSquare,
      description: 'Track your contractual commitments vs counterparty duties.',
      count: `${myObligationsCount} Assigned to You`,
    },
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-8 w-48 bg-stone-900 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-44 bg-[#0d0d0d] border border-stone-800 rounded-xl animate-pulse p-6" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
            Contract Intelligence Dashboard
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Private, on-device analysis across your legal and business agreements.
          </p>
        </div>

        <ShineButton size="md" onClick={() => navigate('/analyze')} className="shrink-0">
          <PlusCircle className="w-4 h-4" />
          <span>Analyze Document</span>
        </ShineButton>
      </div>

      {/* Primary Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {navCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              onClick={() => navigate(card.route)}
              className="cursor-pointer group"
            >
              <ShineCard
                glow={card.glow}
                className="h-full flex flex-col justify-between hover:-translate-y-1 transition-all duration-300"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F5E6A8]/10 border border-[#F5E6A8]/20 flex items-center justify-center text-[#F5E6A8] group-hover:border-[#F5E6A8]/60 group-hover:scale-105 transition-all">
                      <Icon className="w-5 h-5" />
                    </div>
                    {card.badge ? (
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#F5E6A8] bg-[#F5E6A8]/15 px-2 py-0.5 rounded border border-[#F5E6A8]/30">
                        {card.badge}
                      </span>
                    ) : (
                      <span className="text-xs font-mono text-stone-400 font-medium">
                        {card.count}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-white group-hover:text-[#F5E6A8] transition-colors">
                    {card.title}
                  </h3>

                  <p className="text-xs text-stone-400 mt-2 leading-relaxed">
                    {card.description}
                  </p>
                </div>

                <div className="mt-6 pt-3 border-t border-stone-900 flex items-center justify-between text-xs text-stone-400 group-hover:text-stone-300">
                  <span>Open section</span>
                  <ArrowRight className="w-4 h-4 text-[#F5E6A8] group-hover:translate-x-1 transition-transform" />
                </div>
              </ShineCard>
            </div>
          );
        })}
      </div>

      {/* Empty State Banner (if no documents yet) */}
      {totalDocsCount === 0 && (
        <div className="p-8 bg-[#0b0b0b] border border-[#2a2517] rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-[#F5E6A8]">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs uppercase font-bold tracking-wider">
                First Time Here?
              </span>
            </div>
            <h2 className="text-lg font-semibold text-white">
              Analyze your first document or test with a sample agreement
            </h2>
            <p className="text-xs text-stone-400 max-w-xl">
              Upload any PDF, Word document, or plain text to instantly extract risks, auto-renewal traps, deadlines, and key obligations. Or test the engine immediately using our curated sample contract.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <ShineButton
              variant="outline"
              size="md"
              onClick={() => handleLoadSample(SAMPLE_CONTRACTS[0].id)}
            >
              <span>Try a sample contract (MSA)</span>
            </ShineButton>
            <ShineButton size="md" onClick={() => navigate('/analyze')}>
              <span>Analyze your first document</span>
            </ShineButton>
          </div>
        </div>
      )}

      {/* Recent Document Quick Access (if user has documents) */}
      {totalDocsCount > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-400">
              Recently Analyzed
            </h2>
            <button
              onClick={() => navigate('/documents')}
              className="text-xs text-[#F5E6A8] hover:underline cursor-pointer"
            >
              View all ({totalDocsCount})
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.slice(0, 2).map((doc) => (
              <div
                key={doc.id}
                onClick={() => navigate(`/report/${doc.id}`)}
                className="p-4 bg-[#0a0a0a] border border-stone-800 hover:border-[#F5E6A8]/50 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-stone-900 border border-stone-800 flex items-center justify-center text-stone-300 group-hover:text-[#F5E6A8]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white group-hover:text-[#F5E6A8] transition-colors truncate max-w-xs">
                      {doc.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                      <span>{doc.userPartyRole} view</span>
                      <span>·</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                      doc.overallRiskScore >= 75
                        ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                        : doc.overallRiskScore >= 50
                        ? 'bg-amber-950/40 text-amber-300 border-amber-800/50'
                        : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/50'
                    }`}
                  >
                    {doc.overallRiskScore} / 100
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
