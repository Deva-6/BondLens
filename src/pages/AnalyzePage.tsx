import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  FileCode,
} from 'lucide-react';
import { ShineCard } from '../components/ShineCard';
import { ShineButton } from '../components/ShineButton';
import { BackButton } from '../components/BackButton';
import { DisclaimerNotice } from '../components/DisclaimerNotice';
import { DocumentParserService, ParseResult } from '../services/documentParserService';
import { AnalysisService } from '../services/analysisService';
import { StorageService } from '../services/storageService';
import { PartyRole } from '../types/analysis';
import { SAMPLE_CONTRACTS } from '../data/sampleContracts';

const PARTY_ROLES: PartyRole[] = [
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
];

const DOCUMENT_TYPES = [
  'Auto-detect',
  'Master Services Agreement (MSA)',
  'Non-Disclosure Agreement (NDA)',
  'Commercial Real Estate Lease',
  'Employment Agreement',
  'Vendor / Service Agreement',
  'Service Level Agreement (SLA)',
  'Software License / SaaS Agreement',
  'Terms of Service',
  'Partnership / MoU',
  'Purchase Order',
  'Loan Agreement',
];

const ANALYSIS_STEPS = [
  'Uploading document',
  'Extracting text & formatting',
  'Identifying clauses & provisions',
  'Assessing risks from your perspective',
  'Extracting deadlines and obligations',
  'Done',
];

export const AnalyzePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Tab: upload or paste
  const [inputMode, setInputMode] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [selectedRole, setSelectedRole] = useState<PartyRole>('Client');
  const [selectedDocType, setSelectedDocType] = useState('Auto-detect');

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Stepper state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check for sample query param
  useEffect(() => {
    const sampleId = searchParams.get('sample');
    if (sampleId) {
      const sample = SAMPLE_CONTRACTS.find((s) => s.id === sampleId) || SAMPLE_CONTRACTS[0];
      setDocTitle(sample.title);
      setPastedText(sample.text);
      setSelectedDocType(sample.documentType);
      setSelectedRole(sample.recommendedRole as PartyRole);
      setInputMode('paste');
    }
  }, [searchParams]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      if (!docTitle) {
        setDocTitle(droppedFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const chosenFile = e.target.files[0];
      setFile(chosenFile);
      if (!docTitle) {
        setDocTitle(chosenFile.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const loadSampleContract = (sampleId: string) => {
    const sample = SAMPLE_CONTRACTS.find((s) => s.id === sampleId);
    if (sample) {
      setDocTitle(sample.title);
      setPastedText(sample.text);
      setSelectedDocType(sample.documentType);
      setSelectedRole(sample.recommendedRole as PartyRole);
      setInputMode('paste');
      setFile(null);
    }
  };

  const handleStartAnalysis = async () => {
    setErrorMsg(null);
    let extractedText = '';

    try {
      if (inputMode === 'upload') {
        if (!file) {
          setErrorMsg('Please select or drop a document file to proceed.');
          return;
        }
        setCurrentStep(0); // Uploading
        setIsAnalyzing(true);

        // Advance to step 1: extracting text
        setCurrentStep(1);
        const parseResult: ParseResult = await DocumentParserService.parseFile(file);
        extractedText = parseResult.text;
      } else {
        if (!pastedText.trim() || pastedText.trim().length < 40) {
          setErrorMsg('Please paste at least 40 characters of document text.');
          return;
        }
        extractedText = pastedText.trim();
        setIsAnalyzing(true);
        setCurrentStep(1);
      }

      const finalTitle = docTitle.trim() || (file ? file.name : 'Analyzed Agreement');

      // Step 2: identifying clauses
      setCurrentStep(2);
      await new Promise((res) => setTimeout(res, 600));

      // Step 3: assessing risks
      setCurrentStep(3);

      // Perform real engine analysis via API
      const analysisResult = await AnalysisService.analyzeDocument(
        extractedText,
        finalTitle,
        selectedRole,
        selectedDocType
      );

      // Step 4: deadlines & obligations
      setCurrentStep(4);
      await new Promise((res) => setTimeout(res, 400));

      // Save to IndexedDB
      await StorageService.saveDocument(analysisResult);

      // Step 5: Done
      setCurrentStep(5);
      await new Promise((res) => setTimeout(res, 500));

      // Navigate to Report
      navigate(`/report/${analysisResult.id}`);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setIsAnalyzing(false);
      setErrorMsg(err.message || 'An unexpected error occurred during document parsing.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Button */}
      <BackButton
        fallbackTo="/dashboard"
        breadcrumbs={[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Analyze Document' }]}
      />

      {/* Page Title */}
      <div className="border-b border-stone-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
          Analyze Document
        </h1>
        <p className="text-sm text-stone-400 mt-1">
          Extract risks, deadlines, obligations and key clauses through the BondLens Analysis Engine.
        </p>
      </div>

      {/* Stepper Overlay during active analysis */}
      {isAnalyzing ? (
        <ShineCard glow className="p-8 text-center space-y-8">
          <div className="flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)] mb-4 shadow-[0_0_20px_var(--accent-glow)]">
              <Sparkles className="w-8 h-8 animate-pulse text-[var(--accent)]" />
            </div>
            <h2 className="text-xl font-bold text-white font-display">
              BondLens Analysis Engine in Progress
            </h2>
            <p className="text-xs text-stone-400 mt-1">
              Analyzing terms from the perspective of <span className="text-[var(--accent)] font-semibold">{selectedRole}</span>...
            </p>
          </div>

          {/* Stepper Progress */}
          <div className="max-w-md mx-auto space-y-3">
            {ANALYSIS_STEPS.map((stepName, idx) => {
              const isPast = idx < currentStep;
              const isCurrent = idx === currentStep;
              return (
                <div
                  key={stepName}
                  className={`flex items-center gap-3 p-2.5 rounded-xl text-xs transition-all ${
                    isCurrent
                      ? 'bg-[var(--accent-soft)] border border-[var(--accent)]/40 text-white font-medium'
                      : isPast
                      ? 'text-stone-400 opacity-80'
                      : 'text-stone-600 opacity-40'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono">
                    {isPast ? (
                      <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />
                    ) : isCurrent ? (
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] animate-ping" />
                    ) : (
                      <span className="w-2 h-2 rounded-full bg-stone-700" />
                    )}
                  </div>
                  <span>{stepName}</span>
                </div>
              );
            })}
          </div>

          <p className="text-[11px] text-stone-400 font-mono">
            Verifying clauses · Resolving relative dates · Assessing unmitigated exposure
          </p>
        </ShineCard>
      ) : (
        <div className="space-y-6">
          {/* Quick Sample Selector */}
          <div className="bg-[#0b0b0b] border border-stone-800/80 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-stone-300">
              <FileCode className="w-4 h-4 text-[var(--accent)]" />
              <span>Or test with a pre-configured sample agreement:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_CONTRACTS.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => loadSampleContract(sample.id)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-[#141414] hover:bg-[#1f1f1f] border border-stone-800 hover:border-[var(--accent)]/40 text-stone-300 hover:text-[var(--accent)] rounded-lg transition-colors cursor-pointer"
                >
                  {sample.title.split('(')[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Form Card */}
          <div className="p-6 bg-[#0a0a0a] border border-[var(--border-shine)]/30 rounded-2xl space-y-6">
            {/* Input Mode Selector */}
            <div className="flex items-center gap-2 border-b border-stone-800 pb-4">
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  inputMode === 'upload'
                    ? 'bg-[var(--accent-soft)] border border-[var(--accent)]/40 text-[var(--accent)]'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Upload File (PDF / DOCX / TXT)
              </button>
              <button
                type="button"
                onClick={() => setInputMode('paste')}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  inputMode === 'paste'
                    ? 'bg-[var(--accent-soft)] border border-[var(--accent)]/40 text-[var(--accent)]'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Paste Contract Text
              </button>
            </div>

            {/* Upload Area */}
            {inputMode === 'upload' ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  isDragging
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-stone-800 hover:border-stone-700 bg-[#0d0d0d]'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-stone-900 border border-stone-800 flex items-center justify-center text-[var(--accent)] mx-auto mb-3">
                  <Upload className="w-6 h-6" />
                </div>

                {file ? (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-white">{file.name}</p>
                    <p className="text-xs text-stone-400 font-mono">
                      {(file.size / 1024).toFixed(1)} KB · Ready to parse
                    </p>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      className="text-xs text-rose-400 hover:underline cursor-pointer"
                    >
                      Remove and choose another
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-stone-200">
                      Drag & drop your agreement file here, or{' '}
                      <label className="text-[var(--accent)] hover:underline cursor-pointer">
                        browse files
                        <input
                          type="file"
                          accept=".pdf,.docx,.txt,.md"
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                      </label>
                    </p>
                    <p className="text-xs text-stone-400">
                      Supports PDF (text layer), Microsoft Word (.docx), and plain text. Max 10 MB.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Document Text
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste contract provisions, clauses, terms of service, or entire agreements..."
                  rows={10}
                  className="w-full bg-[#0d0d0d] border border-stone-800 focus:border-[var(--accent)]/60 rounded-xl p-4 text-xs font-mono text-stone-200 placeholder-stone-400 focus:outline-none leading-relaxed"
                />
                <div className="text-right text-[11px] text-stone-400">
                  {pastedText.length.toLocaleString()} characters
                </div>
              </div>
            )}

            {/* Configuration Details: Party Selector & Document Type */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Document Title (Optional)
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Master Services Agreement"
                  className="w-full bg-[#0d0d0d] border border-stone-800 focus:border-[var(--accent)]/60 rounded-xl px-3 py-2 text-xs text-white placeholder-stone-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--accent)] mb-1.5 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>I am the... (Perspective)</span>
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as PartyRole)}
                  className="w-full bg-[#0d0d0d] border border-stone-800 focus:border-[var(--accent)] rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                >
                  {PARTY_ROLES.map((role) => (
                    <option key={role} value={role} className="bg-stone-900">
                      {role}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-stone-400 mt-1">
                  Risks & obligations are evaluated specifically for this role.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
                  Document Type
                </label>
                <select
                  value={selectedDocType}
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  className="w-full bg-[#0d0d0d] border border-stone-800 focus:border-[var(--accent)]/60 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                >
                  {DOCUMENT_TYPES.map((t) => (
                    <option key={t} value={t} className="bg-stone-900">
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error Message if any */}
            {errorMsg && (
              <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold">Notice:</span>
                  <p>{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-4 border-t border-stone-800 flex items-center justify-end">
              <ShineButton
                size="lg"
                onClick={handleStartAnalysis}
                disabled={inputMode === 'upload' ? !file : !pastedText.trim()}
              >
                <span>Run BondLens Analysis</span>
                <ArrowRight className="w-4 h-4" />
              </ShineButton>
            </div>
          </div>

          <DisclaimerNotice />
        </div>
      )}
    </div>
  );
};
