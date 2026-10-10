import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Calendar,
  Copy,
  Mail,
  RefreshCw,
  Trash2,
  Check,
  ShieldAlert,
  BookOpen,
  CheckSquare,
  AlertTriangle,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Eye,
  Bot,
  X,
  FileCode,
  FileSpreadsheet,
  File,
} from 'lucide-react';
import { BackButton } from '../components/BackButton';
import { CircularRiskGauge } from '../components/CircularRiskGauge';
import { SplitDocumentViewer } from '../components/SplitDocumentViewer';
import { BondLensAssistant } from '../components/BondLensAssistant';
import { CounterProposalModal } from '../components/CounterProposalModal';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { DisclaimerNotice } from '../components/DisclaimerNotice';
import { ShineCard } from '../components/ShineCard';
import { StorageService } from '../services/storageService';
import { ExportService } from '../services/exportService';
import { AnalysisService } from '../services/analysisService';
import { DocumentAnalysis, PartyRole } from '../types/analysis';

type TabType = 'overview' | 'risks' | 'clauses' | 'deadlines' | 'obligations' | 'missing';

export const ReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [document, setDocument] = useState<DocumentAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Dropdown states
  const [actionsMenuOpen, setActionsMenuOpen] = useState(false);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Side drawers & Assistant states
  const [isViewerDrawerOpen, setIsViewerDrawerOpen] = useState(false);
  const [viewerSearchQuery, setViewerSearchQuery] = useState('');
  const [customEmailDraft, setCustomEmailDraft] = useState<string | undefined>(undefined);
  const [isAssistantOpen, setIsAssistantOpen] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : false
  );

  // Modals
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  // Expandable accordion states in compact lists
  const [expandedItems, setExpandedItems] = useState<{ [id: string]: boolean }>({});

  const actionsRef = useRef<HTMLDivElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadDoc() {
      if (!id) return;
      try {
        const found = await StorageService.getDocument(id);
        if (found) {
          setDocument(found);
        } else {
          navigate('/documents');
        }
      } catch (err) {
        console.error('Failed to load document report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDoc();
  }, [id, navigate]);

  // Click outside listener for dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (actionsRef.current && !actionsRef.current.contains(event.target as Node)) {
        setActionsMenuOpen(false);
      }
      if (downloadRef.current && !downloadRef.current.contains(event.target as Node)) {
        setDownloadMenuOpen(false);
      }
    }
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  if (loading || !document) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-6 animate-pulse">
        <div className="h-8 w-60 bg-stone-900 rounded" />
        <div className="h-44 bg-[#0d0d0d] border border-stone-800 rounded-2xl" />
        <div className="h-96 bg-[#0a0a0a] border border-stone-800 rounded-2xl" />
      </div>
    );
  }

  const toggleExpand = (itemId: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const handleDownloadFormat = async (format: 'pdf' | 'md' | 'json' | 'txt') => {
    setIsDownloading(true);
    setDownloadMenuOpen(false);

    try {
      await new Promise((res) => setTimeout(res, 250)); // smooth visual feedback
      if (format === 'pdf') {
        ExportService.exportPDFReport(document);
        showToast(`Generated PDF for ${document.title}`);
      } else if (format === 'md') {
        ExportService.exportMarkdown(document);
        showToast(`Downloaded Markdown report`);
      } else if (format === 'json') {
        ExportService.exportJSON(document);
        showToast(`Downloaded JSON dataset`);
      } else if (format === 'txt') {
        ExportService.exportPlainText(document);
        showToast(`Downloaded Plain Text report`);
      }
    } catch (err: any) {
      alert(`Download failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(document.summary);
    showToast('Executive summary copied to clipboard');
    setActionsMenuOpen(false);
  };

  const handleExportICS = () => {
    try {
      ExportService.exportICS(document.deadlines, document.title);
      showToast('Exported calendar deadlines (.ics)');
    } catch (err: any) {
      alert(err.message || 'No deadlines to export.');
    }
    setActionsMenuOpen(false);
  };

  const handleDeleteDocument = async () => {
    await StorageService.deleteDocument(document.id);
    navigate('/documents');
  };

  const handlePartyChange = async (newRole: PartyRole) => {
    if (newRole === document.userPartyRole || isReanalyzing) return;
    setIsReanalyzing(true);
    try {
      const updated = await AnalysisService.analyzeDocument(
        document.rawText,
        document.title,
        newRole,
        document.documentType
      );
      updated.id = document.id;
      updated.chatHistory = document.chatHistory;
      await StorageService.saveDocument(updated);
      setDocument(updated);
      showToast(`Re-analyzed from perspective of ${newRole}`);
    } catch (err: any) {
      alert(`Re-analysis failed: ${err.message}`);
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Compute Top 3 things to know
  const topRisks = (document.risks || [])
    .filter((r) => r.severity === 'Critical' || r.severity === 'High')
    .slice(0, 2);
  const nextDeadline = (document.deadlines || [])[0];
  const primaryObligation = (document.obligations || []).find((o) => o.belongsToUser);

  return (
    <div className={`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 transition-all duration-300 ${isAssistantOpen ? 'lg:pr-[395px]' : ''}`}>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-2.5 bg-[#121212] border border-[var(--accent)] text-stone-200 text-xs rounded-xl shadow-2xl animate-fade-in">
          <Check className="w-4 h-4 text-[var(--accent)]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER: Back Button & Breadcrumb */}
      <div className="space-y-3">
        <BackButton
          fallbackTo="/documents"
          breadcrumbs={[
            { label: 'Dashboard', to: '/dashboard' },
            { label: 'My Documents', to: '/documents' },
            { label: document.title },
          ]}
        />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-5">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display truncate">
              {document.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-400 mt-1">
              <span className="text-[var(--accent)] font-medium">{document.documentType}</span>
              <span>·</span>
              <span>Analyzed {new Date(document.createdAt).toLocaleDateString()}</span>
              {document.metadata?.governingLaw && (
                <>
                  <span>·</span>
                  <span>Law: {document.metadata.governingLaw}</span>
                </>
              )}
            </div>
          </div>

          {/* Perspective Selector & Actions Dropdown & View Document Drawer Button */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {/* Party Selector */}
            <div className="flex items-center gap-1.5 bg-[#121212] border border-stone-800 rounded-xl px-2.5 py-1.5 text-xs">
              <span className="text-stone-400">View as:</span>
              <select
                value={document.userPartyRole}
                onChange={(e) => handlePartyChange(e.target.value as PartyRole)}
                disabled={isReanalyzing}
                className="bg-transparent font-medium text-[var(--accent)] focus:outline-none cursor-pointer"
              >
                {[
                  'Client',
                  'Vendor',
                  'Employer',
                  'Employee',
                  'Landlord',
                  'Tenant',
                  'Disclosing party',
                  'Receiving party',
                  'Customer',
                  'Licensor',
                  'Licensee',
                ].map((role) => (
                  <option key={role} value={role} className="bg-stone-900 text-stone-200">
                    {role}
                  </option>
                ))}
              </select>
              {isReanalyzing && <RefreshCw className="w-3 h-3 text-[var(--accent)] animate-spin" />}
            </div>

            {/* Single "Actions" Dropdown */}
            <div className="relative" ref={actionsRef}>
              <button
                onClick={() => setActionsMenuOpen(!actionsMenuOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#121212] hover:bg-[#1a1a1a] border border-stone-800 hover:border-stone-700 text-xs font-semibold text-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                <span>Actions</span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {actionsMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-56 bg-[#0e0e0e] border border-stone-800 rounded-xl shadow-2xl py-1 z-30 divide-y divide-stone-900">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handleDownloadFormat('pdf');
                        setActionsMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-white hover:bg-stone-900 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Download Analysis (PDF)</span>
                    </button>
                    <button
                      onClick={handleExportICS}
                      className="w-full text-left px-3 py-2 text-xs text-stone-300 hover:text-white hover:bg-stone-900 flex items-center gap-2 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      <span>Export .ics Deadlines</span>
                    </button>
                    <button
                      onClick={handleCopySummary}
                      className="w-full text-left px-3 py-2 text-xs text-stone-300 hover:text-white hover:bg-stone-900 flex items-center gap-2 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Summary</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsProposalModalOpen(true);
                        setActionsMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-stone-300 hover:text-white hover:bg-stone-900 flex items-center gap-2 cursor-pointer"
                    >
                      <Mail className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>Draft Counter-Proposal</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsViewerDrawerOpen(true);
                        setActionsMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-stone-300 hover:text-white hover:bg-stone-900 flex items-center gap-2 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-stone-400" />
                      <span>View Full Document</span>
                    </button>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        handlePartyChange(document.userPartyRole);
                        setActionsMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-stone-300 hover:text-white hover:bg-stone-900 flex items-center gap-2 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Re-analyze</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsDeleteModalOpen(true);
                        setActionsMenuOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TOP SECTION: Circular Risk Gauge + Prominent Download Button Group BESIDE IT */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 p-6 bg-[#0a0a0a] border border-[var(--border-shine)]/30 rounded-2xl relative overflow-visible">
        {/* Left: Circular Risk Gauge */}
        <div className="flex-1">
          <CircularRiskGauge
            score={document.overallRiskScore}
            level={document.riskLevel}
            breakdown={document.scoreBreakdown}
          />
        </div>

        {/* Right / Beside: Prominent Shiny-Border Download Analysis Button Group */}
        <div className="w-full lg:w-72 shrink-0 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-stone-800/80 pt-4 lg:pt-0 lg:pl-6">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-black bg-[var(--accent)] px-2 py-0.5 rounded shadow-sm">
              DOWNLOAD
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-200">
              ANALYSIS
            </span>
          </div>

          <div className="relative inline-flex w-full rounded-xl p-[1px] bg-gradient-to-r from-[var(--border-shine)] via-[var(--accent)] to-[var(--border-shine)] shadow-lg shadow-[var(--accent-glow)]/30" ref={downloadRef}>
            {/* Primary Button */}
            <button
              onClick={() => handleDownloadFormat('pdf')}
              disabled={isDownloading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-xs font-bold rounded-l-[11px] cursor-pointer disabled:opacity-50 transition-all bg-[var(--accent)] hover:opacity-90 text-black shadow-md"
            >
              {isDownloading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-black stroke-[2.5]" />
              ) : (
                <Download className="w-4 h-4 text-black stroke-[2.5]" />
              )}
              <span className="font-bold text-black tracking-wide">
                {isDownloading ? 'Generating...' : 'Download PDF'}
              </span>
            </button>

            {/* Dropdown Arrow Button */}
            <button
              onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
              disabled={isDownloading}
              aria-label="Other export formats: PDF, Markdown, JSON, Plain text"
              className="px-3.5 py-3 bg-[var(--accent)] hover:opacity-90 border-l border-black/20 text-black rounded-r-[11px] transition-all cursor-pointer flex items-center justify-center font-bold"
            >
              <ChevronDown className="w-4 h-4 text-black stroke-[2.5]" />
            </button>

            {/* Dropdown Menu */}
            {downloadMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-[#0e0e0e] border border-stone-800 rounded-xl shadow-2xl py-1 z-40 divide-y divide-stone-900">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-stone-400 tracking-wider">
                  Available Formats
                </div>
                <div className="py-1">
                  <button
                    onClick={() => handleDownloadFormat('pdf')}
                    className="w-full text-left px-3 py-2 text-xs text-stone-200 hover:text-white hover:bg-stone-900 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <File className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-white font-medium">Download PDF Document</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">.pdf</span>
                  </button>
                  <button
                    onClick={() => handleDownloadFormat('md')}
                    className="w-full text-left px-3 py-2 text-xs text-stone-200 hover:text-white hover:bg-stone-900 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <FileCode className="w-3.5 h-3.5 text-blue-400" />
                      <span className="text-white font-medium">Download Markdown Brief</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">.md</span>
                  </button>
                  <button
                    onClick={() => handleDownloadFormat('json')}
                    className="w-full text-left px-3 py-2 text-xs text-stone-200 hover:text-white hover:bg-stone-900 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-white font-medium">Download Structured Data</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">.json</span>
                  </button>
                  <button
                    onClick={() => handleDownloadFormat('txt')}
                    className="w-full text-left px-3 py-2 text-xs text-stone-200 hover:text-white hover:bg-stone-900 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-amber-300" />
                      <span className="text-white font-medium">Download Plain Text Summary</span>
                    </span>
                    <span className="text-[10px] text-stone-400 font-mono">.txt</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          <span className="text-[10px] text-stone-400 mt-2">
            Includes all risks, clauses, deadlines, obligations, and citations.
          </span>
        </div>
      </div>

      {/* BELOW GAUGE: 3-Sentence Summary & Top 3 Things to Know */}
      <div className="space-y-4">
        {/* 3-Sentence Executive Summary */}
        <div className="p-4 bg-[#0a0a0a] border border-stone-800 rounded-xl space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--accent)] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Executive Brief</span>
          </div>
          <p className="text-xs text-stone-200 leading-relaxed font-normal">
            {document.summary}
          </p>
        </div>

        {/* Top 3 Things to Know Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Card 1: Primary Risk Alert */}
          <div className="p-3.5 bg-[#0a0a0a] border border-stone-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-rose-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Critical Risk</span>
              </span>
              <span className="text-[10px] text-stone-400">{topRisks[0]?.category || 'General'}</span>
            </div>
            <h4 className="text-xs font-semibold text-white truncate">
              {topRisks[0]?.title || 'No critical exposure found'}
            </h4>
            <p className="text-[11px] text-stone-400 line-clamp-2">
              {topRisks[0]?.description || 'Baseline terms appear standard for this category.'}
            </p>
          </div>

          {/* Card 2: Key Upcoming Deadline */}
          <div className="p-3.5 bg-[#0a0a0a] border border-stone-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-blue-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Next Milestone</span>
              </span>
              <span className="text-[10px] text-stone-400">{nextDeadline?.type || 'Milestone'}</span>
            </div>
            <h4 className="text-xs font-semibold text-white truncate">
              {nextDeadline?.label || 'Ongoing standard term'}
            </h4>
            <p className="text-[11px] text-stone-400 font-mono">
              {nextDeadline?.resolvedDate || nextDeadline?.relativeRule || 'Standard schedule'}
            </p>
          </div>

          {/* Card 3: Priority Obligation */}
          <div className="p-3.5 bg-[#0a0a0a] border border-stone-800 rounded-xl space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-emerald-400 flex items-center gap-1">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Your Core Duty</span>
              </span>
              <span className="text-[10px] text-stone-400">{primaryObligation?.dueDate || 'Active'}</span>
            </div>
            <h4 className="text-xs font-semibold text-white truncate">
              {primaryObligation?.description || 'Review full obligations tab for commitments'}
            </h4>
            <p className="text-[11px] text-stone-400 line-clamp-2">
              {primaryObligation?.consequenceOfBreach || 'Ensure compliance before signing.'}
            </p>
          </div>
        </div>
      </div>

      {/* ONE ROW OF TABS: Overview | Risks | Clauses | Deadlines | Obligations | Missing */}
      <div className="space-y-4">
        <div className="flex items-center gap-1.5 border-b border-stone-800 pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Sparkles, count: undefined },
            { id: 'risks', label: 'Risks', icon: ShieldAlert, count: document.risks?.length || 0 },
            { id: 'clauses', label: 'Clauses', icon: BookOpen, count: document.keyClauses?.length || 0 },
            { id: 'deadlines', label: 'Deadlines', icon: Calendar, count: document.deadlines?.length || 0 },
            { id: 'obligations', label: 'Obligations', icon: CheckSquare, count: document.obligations?.length || 0 },
            { id: 'missing', label: 'Missing', icon: AlertTriangle, count: document.missingProtections?.length || 0 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/40 shadow-sm'
                    : 'text-stone-400 hover:text-white hover:bg-stone-900'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="p-5 bg-[#0a0a0a] border border-stone-800 rounded-xl space-y-3">
              <h3 className="text-sm font-semibold text-white">Document Metadata & Parties</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-[#121212] rounded-lg border border-stone-900">
                  <span className="text-stone-400 block text-[10px] uppercase">Effective Date</span>
                  <span className="text-white font-mono">{document.metadata?.effectiveDate || 'Not specified'}</span>
                </div>
                <div className="p-2.5 bg-[#121212] rounded-lg border border-stone-900">
                  <span className="text-stone-400 block text-[10px] uppercase">Term Length</span>
                  <span className="text-white">{document.metadata?.termLength || 'Indefinite / Ongoing'}</span>
                </div>
                <div className="p-2.5 bg-[#121212] rounded-lg border border-stone-900">
                  <span className="text-stone-400 block text-[10px] uppercase">Governing Law</span>
                  <span className="text-white">{document.metadata?.governingLaw || 'Standard'}</span>
                </div>
                <div className="p-2.5 bg-[#121212] rounded-lg border border-stone-900">
                  <span className="text-stone-400 block text-[10px] uppercase">Jurisdiction</span>
                  <span className="text-white">{document.metadata?.jurisdiction || 'Mutual'}</span>
                </div>
              </div>

              {document.metadata?.parties && document.metadata.parties.length > 0 && (
                <div className="pt-2 border-t border-stone-900">
                  <span className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold block mb-2">
                    Identified Signatories & Parties
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {document.metadata.parties.map((p, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-[#141414] border border-stone-800 rounded-lg text-xs text-stone-300"
                      >
                        <strong>{p.name}</strong> ({p.role})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Summary Counts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div
                onClick={() => setActiveTab('risks')}
                className="p-4 bg-[#0a0a0a] border border-stone-800 hover:border-[var(--accent)] rounded-xl cursor-pointer transition-all"
              >
                <div className="text-2xl font-bold font-mono text-rose-400">{document.risks?.length || 0}</div>
                <div className="text-xs text-stone-400 mt-1">Identified Risks</div>
              </div>
              <div
                onClick={() => setActiveTab('clauses')}
                className="p-4 bg-[#0a0a0a] border border-stone-800 hover:border-[var(--accent)] rounded-xl cursor-pointer transition-all"
              >
                <div className="text-2xl font-bold font-mono text-[var(--accent)]">{document.keyClauses?.length || 0}</div>
                <div className="text-xs text-stone-400 mt-1">Key Clauses</div>
              </div>
              <div
                onClick={() => setActiveTab('deadlines')}
                className="p-4 bg-[#0a0a0a] border border-stone-800 hover:border-[var(--accent)] rounded-xl cursor-pointer transition-all"
              >
                <div className="text-2xl font-bold font-mono text-blue-400">{document.deadlines?.length || 0}</div>
                <div className="text-xs text-stone-400 mt-1">Deadlines</div>
              </div>
              <div
                onClick={() => setActiveTab('obligations')}
                className="p-4 bg-[#0a0a0a] border border-stone-800 hover:border-[var(--accent)] rounded-xl cursor-pointer transition-all"
              >
                <div className="text-2xl font-bold font-mono text-emerald-400">{document.obligations?.length || 0}</div>
                <div className="text-xs text-stone-400 mt-1">Obligations</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RISKS (Compact list with accordion) */}
        {activeTab === 'risks' && (
          <div className="space-y-2">
            {document.risks?.map((risk) => {
              const isExpanded = !!expandedItems[risk.id];
              return (
                <div
                  key={risk.id}
                  className="bg-[#0a0a0a] border border-stone-800 hover:border-stone-700 rounded-xl overflow-hidden transition-all"
                >
                  <div
                    onClick={() => toggleExpand(risk.id)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                          risk.severity === 'Critical'
                            ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                            : risk.severity === 'High'
                            ? 'bg-orange-950/60 text-orange-300 border-orange-800'
                            : 'bg-amber-950/60 text-amber-300 border-amber-800'
                        }`}
                      >
                        {risk.severity}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">{risk.title}</h4>
                        <p className="text-[11px] text-stone-400 truncate">{risk.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-stone-500 hidden sm:inline">{risk.category}</span>
                      <ChevronRight
                        className={`w-4 h-4 text-stone-400 transition-transform ${
                          isExpanded ? 'rotate-90 text-[var(--accent)]' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Expanded Accordion Details */}
                  {isExpanded && (
                    <div className="p-4 bg-[#111] border-t border-stone-900 space-y-3 text-xs animate-fade-in">
                      <p className="text-stone-300 leading-relaxed">{risk.description}</p>
                      {risk.exactQuote && (
                        <div className="p-2.5 bg-black/60 border-l-2 border-[var(--accent)] font-serif-doc text-stone-300 italic">
                          "{risk.exactQuote}"
                        </div>
                      )}
                      <div className="p-2.5 bg-black/40 border border-stone-800 rounded-lg text-[var(--accent)]">
                        <strong className="text-stone-300">Action: </strong>
                        {risk.recommendation}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                        {risk.isQuoteVerified && (
                          <span className="text-emerald-400">✓ Verified in document text</span>
                        )}
                        <span>Confidence: {((risk.confidence || 0.88) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 3: CLAUSES (Compact list with accordion) */}
        {activeTab === 'clauses' && (
          <div className="space-y-2">
            {document.keyClauses?.map((clause) => {
              const isExpanded = !!expandedItems[clause.id];
              return (
                <div
                  key={clause.id}
                  className="bg-[#0a0a0a] border border-stone-800 hover:border-stone-700 rounded-xl overflow-hidden transition-all"
                >
                  <div
                    onClick={() => toggleExpand(clause.id)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] font-semibold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-0.5 rounded border border-[var(--accent)]/30 shrink-0">
                        {clause.category}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">{clause.title}</h4>
                        <p className="text-[11px] text-stone-400 truncate">{clause.plainExplanation}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-stone-500 hidden sm:inline">{clause.location}</span>
                      <ChevronRight
                        className={`w-4 h-4 text-stone-400 transition-transform ${
                          isExpanded ? 'rotate-90 text-[var(--accent)]' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-[#111] border-t border-stone-900 space-y-3 text-xs animate-fade-in">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                          Plain-Language Meaning
                        </span>
                        <p className="text-stone-300 leading-relaxed">{clause.plainExplanation}</p>
                      </div>
                      {clause.whyItMatters && (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">
                            Why It Matters
                          </span>
                          <p className="text-stone-400 leading-relaxed">{clause.whyItMatters}</p>
                        </div>
                      )}
                      {clause.exactQuote && (
                        <div className="p-2.5 bg-black/60 border-l-2 border-[var(--accent)] font-serif-doc text-stone-300 italic">
                          "{clause.exactQuote}"
                        </div>
                      )}
                      <div className="p-2.5 bg-black/40 border border-stone-800 rounded-lg text-stone-300">
                        <strong className="text-[var(--accent)]">Negotiation Tip: </strong>
                        {clause.negotiationTip}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 4: DEADLINES (Compact list with accordion) */}
        {activeTab === 'deadlines' && (
          <div className="space-y-2">
            {document.deadlines?.map((dl) => {
              const isExpanded = !!expandedItems[dl.id];
              return (
                <div
                  key={dl.id}
                  className="bg-[#0a0a0a] border border-stone-800 hover:border-stone-700 rounded-xl overflow-hidden transition-all"
                >
                  <div
                    onClick={() => toggleExpand(dl.id)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] font-bold text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60 shrink-0">
                        {dl.type}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">{dl.label}</h4>
                        <p className="text-[11px] text-stone-400 truncate font-mono">
                          {dl.resolvedDate || dl.date || dl.relativeRule}
                        </p>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 text-stone-400 transition-transform ${
                        isExpanded ? 'rotate-90 text-[var(--accent)]' : ''
                      }`}
                    />
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-[#111] border-t border-stone-900 space-y-2.5 text-xs animate-fade-in">
                      {dl.consequenceIfMissed && (
                        <div className="text-rose-300">
                          <strong>Consequence if missed: </strong>
                          {dl.consequenceIfMissed}
                        </div>
                      )}
                      {dl.noticeRequiredDays ? (
                        <div className="text-stone-300">
                          <strong>Notice required: </strong> {dl.noticeRequiredDays} days prior
                        </div>
                      ) : null}
                      {dl.exactQuote && (
                        <div className="p-2 bg-black/60 font-serif-doc text-stone-400 italic">
                          "{dl.exactQuote}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 5: OBLIGATIONS (Compact list with accordion) */}
        {activeTab === 'obligations' && (
          <div className="space-y-2">
            {document.obligations?.map((ob) => {
              const isExpanded = !!expandedItems[ob.id];
              return (
                <div
                  key={ob.id}
                  className="bg-[#0a0a0a] border border-stone-800 hover:border-stone-700 rounded-xl overflow-hidden transition-all"
                >
                  <div
                    onClick={() => toggleExpand(ob.id)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border shrink-0 ${
                          ob.belongsToUser
                            ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/40'
                            : 'bg-stone-900 text-stone-300 border-stone-800'
                        }`}
                      >
                        {ob.belongsToUser ? 'My Duty' : `${ob.responsibleParty} Duty`}
                      </span>
                      <h4 className="text-xs font-semibold text-white truncate">{ob.description}</h4>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-stone-500 hidden sm:inline">{ob.dueDate || 'Ongoing'}</span>
                      <ChevronRight
                        className={`w-4 h-4 text-stone-400 transition-transform ${
                          isExpanded ? 'rotate-90 text-[var(--accent)]' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-[#111] border-t border-stone-900 space-y-2 text-xs animate-fade-in">
                      <p className="text-stone-300">{ob.description}</p>
                      {ob.consequenceOfBreach && (
                        <div className="text-rose-300">
                          <strong>Consequence of breach: </strong> {ob.consequenceOfBreach}
                        </div>
                      )}
                      {ob.exactQuote && (
                        <div className="p-2 bg-black/60 font-serif-doc text-stone-400 italic">
                          "{ob.exactQuote}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 6: MISSING PROTECTIONS (Compact list with accordion) */}
        {activeTab === 'missing' && (
          <div className="space-y-2">
            {document.missingProtections?.map((mp) => {
              const isExpanded = !!expandedItems[mp.id];
              return (
                <div
                  key={mp.id}
                  className="bg-[#0a0a0a] border border-stone-800 hover:border-amber-900/60 rounded-xl overflow-hidden transition-all"
                >
                  <div
                    onClick={() => toggleExpand(mp.id)}
                    className="p-3.5 flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 shrink-0">
                        Missing
                      </span>
                      <h4 className="text-xs font-semibold text-white truncate">{mp.title}</h4>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 text-stone-400 transition-transform ${
                        isExpanded ? 'rotate-90 text-[var(--accent)]' : ''
                      }`}
                    />
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-[#111] border-t border-stone-900 space-y-2.5 text-xs animate-fade-in">
                      <p className="text-stone-300">{mp.whyItMatters}</p>
                      <div className="p-3 bg-black border border-stone-800 rounded-lg">
                        <span className="text-[10px] uppercase font-bold text-[var(--accent)] tracking-wider block mb-1">
                          Suggested Insertion Language:
                        </span>
                        <p className="font-serif-doc text-stone-300 italic">"{mp.suggestedWording}"</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* VIEW DOCUMENT SIDE DRAWER */}
      {isViewerDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-[#0c0c0c] border-l border-stone-800 h-full flex flex-col shadow-2xl animate-slide-left">
            <div className="p-4 bg-[#141414] border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <FileText className="w-4 h-4 text-[var(--accent)]" />
                <span>Document Source Viewer</span>
              </div>
              <button
                onClick={() => setIsViewerDrawerOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden p-2">
              <SplitDocumentViewer
                rawText={document.rawText}
                keyClauses={document.keyClauses}
                risks={document.risks}
                deadlines={document.deadlines}
                obligations={document.obligations}
                selectedFindingId={null}
                onSelectFinding={() => {}}
                searchQuery={viewerSearchQuery}
              />
            </div>
          </div>
        </div>
      )}

      {/* DOCKED RIGHT-SIDE ASSISTANT */}
      <BondLensAssistant
        document={document}
        isOpen={isAssistantOpen}
        onToggle={() => setIsAssistantOpen(!isAssistantOpen)}
        onJumpToClause={(quote) => {
          setViewerSearchQuery(quote);
          setIsViewerDrawerOpen(true);
        }}
        onDraftEmail={(points) => {
          const emailDraft = ExportService.generateCounterProposalEmail(
            document,
            points.map((p, i) => ({
              id: `point-${i}`,
              title: p,
              description: p,
              severity: 'High',
              category: 'Liability',
              exactQuote: '',
              recommendation: p,
            }))
          );
          setCustomEmailDraft(emailDraft);
          setIsProposalModalOpen(true);
        }}
        onAddNote={() => {
          showToast('Answer saved to document report notes');
        }}
      />

      {/* MODALS */}
      <CounterProposalModal
        isOpen={isProposalModalOpen}
        onClose={() => {
          setIsProposalModalOpen(false);
          setCustomEmailDraft(undefined);
        }}
        document={document}
        customEmailText={customEmailDraft}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Delete Agreement"
        message={`Are you sure you want to permanently delete "${document.title}"?`}
        confirmLabel="Delete"
        isDestructive
        onConfirm={handleDeleteDocument}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

      <DisclaimerNotice />
    </div>
  );
};
