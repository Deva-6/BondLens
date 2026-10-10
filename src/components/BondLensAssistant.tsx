import React, { useState, useRef, useEffect, useId } from 'react';
import {
  Send,
  X,
  Sparkles,
  AlertCircle,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Mail,
  FileText,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ExternalLink,
  Square,
  RotateCcw,
  Trash2,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { Logo } from './Logo';
import { ChatMessage, PartyRole, DocumentAnalysis, AssistantCitation } from '../types/analysis';
import { AnalysisService, AssistantAnswerResult } from '../services/analysisService';
import { StorageService } from '../services/storageService';

export interface BondLensAssistantProps {
  document: DocumentAnalysis;
  isOpen: boolean;
  onToggle: () => void;
  onJumpToClause?: (quote: string, location?: string) => void;
  onDraftEmail?: (negotiationPoints: string[], documentTitle: string) => void;
  onAddNote?: (noteText: string) => void;
}

export type AssistantMode = 'ask' | 'decide';

const ASK_QUICK_CHIPS = [
  'Can I terminate early?',
  'What happens if I miss a payment?',
  'Is liability capped?',
  'What are my deadlines?',
  'What am I obligated to do?',
  'Is there an auto-renewal?',
  'Who owns the IP?',
  'What is missing from this contract?',
];

export const BondLensAssistant: React.FC<BondLensAssistantProps> = ({
  document,
  isOpen,
  onToggle,
  onJumpToClause,
  onDraftEmail,
  onAddNote,
}) => {
  const [mode, setMode] = useState<AssistantMode>('ask');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [savedNoteId, setSavedNoteId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [liveAnnouncement, setLiveAnnouncement] = useState('');

  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const regionId = useId();

  // Load chat history from document / IndexedDB
  useEffect(() => {
    async function loadHistory() {
      try {
        const doc = await StorageService.getDocument(document.id);
        if (doc && doc.chatHistory) {
          setMessages(doc.chatHistory);
        } else if (document.chatHistory) {
          setMessages(document.chatHistory);
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      }
    }
    loadHistory();
  }, [document.id]);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  // Escape key listener to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onToggle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onToggle]);

  // Decide mode chips (dynamically includes party role)
  const decideChips = [
    'Should I sign this?',
    'What should I negotiate first?',
    `Is this safe for me as the ${document.userPartyRole}?`,
    'Compare accepting vs asking for changes',
    'Draft a counter-clause for this risk',
  ];

  const handleSend = async (userPrompt: string) => {
    const trimmed = userPrompt.trim();
    if (!trimmed || isLoading) return;

    setErrorMsg(null);
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
      mode,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setIsLoading(true);
    setLiveAnnouncement(`User asked: ${trimmed}. Reading the document...`);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Prepare abort controller for stop button
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Save user message to IndexedDB
      await StorageService.saveChatMessage(document.id, userMsg);

      // Call assistant service
      const assistantResult: AssistantAnswerResult = await AnalysisService.askBondLensAssistant({
        documentText: document.rawText,
        documentTitle: document.title,
        partyRole: document.userPartyRole,
        mode,
        query: trimmed,
        messages: nextHistory.map((m) => ({
          role: m.role,
          content: m.content,
        })),
        signal: controller.signal,
      });

      const assistantMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'assistant',
        content: assistantResult.answer,
        timestamp: Date.now(),
        mode,
        bottomLine: assistantResult.bottomLine,
        points: assistantResult.points,
        whatToNegotiate: assistantResult.whatToNegotiate,
        consequencesIfAccepted: assistantResult.consequencesIfAccepted,
        questionsToAsk: assistantResult.questionsToAsk,
        citations: assistantResult.citations,
        notFoundInDocument: assistantResult.notFoundInDocument,
        followUps: assistantResult.followUps,
        feedback: null,
        isDetailExpanded: false,
      };

      const updatedHistory = [...nextHistory, assistantMsg];
      setMessages(updatedHistory);
      setLiveAnnouncement(
        assistantResult.bottomLine
          ? `Assistant answered: ${assistantResult.bottomLine}`
          : `Assistant answered: ${assistantResult.answer}`
      );

      // Persist in IndexedDB
      await StorageService.saveChatMessage(document.id, assistantMsg);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setLiveAnnouncement('Response stopped by user.');
        return;
      }
      console.error('BondLens Assistant error:', err);
      const isBusy =
        err?.message?.includes('busy') ||
        err?.message?.includes('429') ||
        err?.message?.includes('quota');

      setErrorMsg(
        isBusy
          ? 'The assistant is busy, retrying... please try again in a few moments.'
          : err.message || 'BondLens Assistant is temporarily unavailable.'
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  const handleCopy = (msg: ChatMessage) => {
    let fullText = msg.content;
    if (msg.bottomLine) {
      fullText = `Bottom Line: ${msg.bottomLine}\n\n${msg.content}`;
    }
    if (msg.points && msg.points.length > 0) {
      fullText += `\n\nKey Reasons:\n${msg.points.map((p) => `• ${p}`).join('\n')}`;
    }
    if (msg.whatToNegotiate && msg.whatToNegotiate.length > 0) {
      fullText += `\n\nWhat to Negotiate:\n${msg.whatToNegotiate.map((n, i) => `${i + 1}. ${n}`).join('\n')}`;
    }
    if (msg.consequencesIfAccepted && msg.consequencesIfAccepted.length > 0) {
      fullText += `\n\nIf Accepted As-Is:\n${msg.consequencesIfAccepted.map((c) => `• ${c}`).join('\n')}`;
    }
    if (msg.questionsToAsk && msg.questionsToAsk.length > 0) {
      fullText += `\n\nQuestions to Ask:\n${msg.questionsToAsk.map((q) => `? ${q}`).join('\n')}`;
    }
    if (msg.citations && msg.citations.length > 0) {
      fullText += `\n\nVerified Citations:\n${msg.citations.map((c) => `"${c.quote}" [${c.location}]`).join('\n')}`;
    }

    navigator.clipboard.writeText(fullText);
    setCopiedId(msg.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveToNotes = async (msg: ChatMessage) => {
    const noteText = msg.bottomLine ? `[${msg.bottomLine}] ${msg.content}` : msg.content;
    await StorageService.addDocumentNote(
      document.id,
      noteText,
      `BondLens Assistant (${msg.mode === 'decide' ? 'Decision' : 'Factual'})`
    );
    if (onAddNote) {
      onAddNote(noteText);
    }
    setSavedNoteId(msg.id);
    setTimeout(() => setSavedNoteId(null), 2000);
  };

  const handleFeedback = async (msgId: string, feedback: 'up' | 'down') => {
    const target = messages.find((m) => m.id === msgId);
    const newFeedback = target?.feedback === feedback ? null : feedback;

    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback: newFeedback } : m))
    );
    await StorageService.updateMessageFeedback(document.id, msgId, newFeedback);
  };

  const handleToggleExpandDetail = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, isDetailExpanded: !m.isDetailExpanded } : m))
    );
  };

  const handleNewChat = () => {
    setMessages([]);
    setErrorMsg(null);
    setInput('');
  };

  const handleClearHistoryConfirm = async () => {
    await StorageService.clearChatHistory(document.id);
    setMessages([]);
    setShowClearConfirm(false);
  };

  const handleDraftEmailClick = (msg: ChatMessage) => {
    const points = msg.whatToNegotiate && msg.whatToNegotiate.length > 0
      ? msg.whatToNegotiate
      : msg.points || [];

    if (onDraftEmail) {
      onDraftEmail(points, document.title);
    }
  };

  // Bottom Line style helper
  const getBottomLineBadgeClass = (line: string) => {
    const lower = line.toLowerCase();
    if (lower.includes('high risk') || lower.includes('do not sign') || lower.includes('critical')) {
      return 'bg-rose-950/70 text-rose-300 border-rose-800';
    }
    if (lower.includes('reasonable') || lower.includes('safe') || lower.includes('balanced')) {
      return 'bg-emerald-950/70 text-emerald-300 border-emerald-800';
    }
    return 'bg-amber-950/70 text-amber-300 border-amber-800';
  };

  // If collapsed: Render floating round launcher button
  if (!isOpen) {
    return (
      <button
        onClick={onToggle}
        aria-label="Open BondLens Assistant"
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#111] hover:bg-[#181818] border-2 border-[var(--accent)] shadow-2xl shadow-[var(--accent-glow)]/30 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      >
        <Logo size={28} glow />
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute top-1 right-1 border-2 border-black animate-pulse" />
        <span className="sr-only">Open BondLens Assistant</span>
      </button>
    );
  }

  return (
    <>
      {/* Screen reader live updates */}
      <div className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </div>

      {/* Docked Right-Side Panel (Desktop ~380px, Mobile full screen bottom sheet) */}
      <aside
        id={regionId}
        aria-label="BondLens Assistant"
        role="region"
        className="fixed top-16 bottom-0 right-0 z-40 w-full sm:w-[380px] bg-[#0c0c0c] border-l border-[var(--border-shine)]/40 shadow-2xl shadow-black/80 flex flex-col transition-all duration-300 animate-slide-left focus:outline-none"
      >
        {/* Header */}
        <div className="p-3.5 bg-[#121212] border-b border-stone-800/90 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] border border-[var(--accent)]/40 flex items-center justify-center shrink-0">
              <Logo size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5 truncate">
                <span>BondLens Assistant</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
              </h2>
              <p className="text-[10px] text-stone-400 truncate">
                {document.title} · <span className="text-[var(--accent)]">{document.userPartyRole}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* New Chat */}
            <button
              onClick={handleNewChat}
              title="Start a new chat thread"
              aria-label="New chat"
              className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Clear History */}
            <button
              onClick={() => setShowClearConfirm(true)}
              title="Clear saved chat history"
              aria-label="Clear chat history"
              className="p-1.5 text-stone-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            {/* Collapse Arrow */}
            <button
              onClick={onToggle}
              title="Collapse BondLens Assistant (Esc)"
              aria-label="Collapse BondLens Assistant"
              className="p-1.5 text-stone-400 hover:text-white hover:bg-stone-800 rounded-lg transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Clear History Confirmation Banner */}
        {showClearConfirm && (
          <div className="p-3 bg-rose-950/80 border-b border-rose-800 text-xs text-rose-200 flex items-center justify-between gap-2 animate-fade-in shrink-0">
            <span>Clear conversation history for this agreement?</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleClearHistoryConfirm}
                className="px-2 py-0.5 bg-rose-700 text-white rounded text-[11px] font-semibold hover:bg-rose-600 cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-0.5 bg-stone-800 text-stone-300 rounded text-[11px] hover:bg-stone-700 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Mode Toggle Bar: Ask a Question vs Help Me Decide */}
        <div className="p-2 bg-[#0e0e0e] border-b border-stone-800/80 shrink-0">
          <div className="grid grid-cols-2 p-0.5 bg-[#161616] rounded-xl border border-stone-800 text-xs">
            <button
              onClick={() => setMode('ask')}
              className={`py-1.5 text-center font-medium rounded-lg transition-all cursor-pointer ${
                mode === 'ask'
                  ? 'bg-[var(--accent)] text-black font-bold shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Ask a question
            </button>
            <button
              onClick={() => setMode('decide')}
              className={`py-1.5 text-center font-medium rounded-lg transition-all cursor-pointer ${
                mode === 'decide'
                  ? 'bg-[var(--accent)] text-black font-bold shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Help me decide
            </button>
          </div>
        </div>

        {/* Messages Scroll View */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-6 px-2 space-y-4 animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-[var(--accent-soft)] border border-[var(--accent)]/30 mx-auto flex items-center justify-center text-[var(--accent)]">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {mode === 'ask' ? 'Ask BondLens Assistant' : 'Decision Intelligence'}
                </h3>
                <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto leading-relaxed">
                  {mode === 'ask'
                    ? `Factual answers grounded strictly in "${document.title}". Citations verified against document text.`
                    : `Strategic negotiation and signing guidance evaluated from the perspective of the ${document.userPartyRole}.`}
                </p>
              </div>

              {/* Starter Quick-Prompt Chips */}
              <div className="space-y-1.5 text-left pt-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500 px-1 block">
                  {mode === 'ask' ? 'Suggested Inquiries' : 'Strategic Decisions'}
                </span>
                {(mode === 'ask' ? ASK_QUICK_CHIPS.slice(0, 5) : decideChips).map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="w-full text-left text-xs p-2.5 rounded-xl bg-[#141414] hover:bg-[#1c1c1c] border border-stone-800 hover:border-[var(--accent)]/50 text-stone-300 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <span className="truncate mr-2">{prompt}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-stone-500 group-hover:text-[var(--accent)] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col animate-fade-in ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {/* User Message Bubble */}
                {msg.role === 'user' ? (
                  <div className="max-w-[88%] rounded-2xl p-3 text-xs leading-relaxed bg-[var(--accent-soft)] border border-[var(--accent)]/40 text-stone-100 rounded-br-sm shadow-sm">
                    {msg.content}
                  </div>
                ) : (
                  /* Assistant Message Bubble */
                  <div className="w-full max-w-[96%] rounded-2xl p-3.5 text-xs leading-relaxed bg-[#141414] border border-stone-800/90 text-stone-200 rounded-bl-sm space-y-3 shadow-lg">
                    {/* Decision Mode: Fixed Structure Rendering */}
                    {msg.mode === 'decide' ? (
                      <div className="space-y-3">
                        {/* 1. Bottom Line Banner */}
                        {msg.bottomLine && (
                          <div
                            className={`px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 ${getBottomLineBadgeClass(
                              msg.bottomLine
                            )}`}
                          >
                            <ShieldAlert className="w-4 h-4 shrink-0" />
                            <div>
                              <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">
                                Bottom Line ({document.userPartyRole} Perspective)
                              </span>
                              <span>{msg.bottomLine}</span>
                            </div>
                          </div>
                        )}

                        {/* 2. Why: 2-4 Bullets tied to verified quote and location */}
                        {msg.points && msg.points.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider block">
                              Key Reasons
                            </span>
                            <ul className="space-y-1.5 text-stone-300">
                              {msg.points.map((pt, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-[var(--accent)] mt-0.5 font-bold shrink-0">•</span>
                                  <span>{pt}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 3. What to Negotiate: Ranked List */}
                        {msg.whatToNegotiate && msg.whatToNegotiate.length > 0 && (
                          <div className="p-2.5 bg-[#0e0e0e] border border-stone-800 rounded-xl space-y-1.5">
                            <span className="text-[11px] font-bold text-[var(--accent)] uppercase tracking-wider block">
                              What to Negotiate (Ranked)
                            </span>
                            <ol className="space-y-1 text-stone-300 list-decimal list-inside">
                              {msg.whatToNegotiate.map((item, idx) => (
                                <li key={idx} className="leading-relaxed">
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* 4. If You Accept As-Is: Consequences, Deadlines, Costs */}
                        {msg.consequencesIfAccepted && msg.consequencesIfAccepted.length > 0 && (
                          <div className="p-2.5 bg-black/40 border border-stone-900 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold text-amber-400/90 uppercase tracking-wider block">
                              Consequences If Accepted As-Is
                            </span>
                            <ul className="space-y-1 text-stone-400">
                              {msg.consequencesIfAccepted.map((c, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-amber-500 shrink-0">⚠</span>
                                  <span>{c}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* 5. Questions to Ask */}
                        {msg.questionsToAsk && msg.questionsToAsk.length > 0 && (
                          <div className="space-y-1 pt-1">
                            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                              Questions to Ask the Counterparty
                            </span>
                            <ul className="space-y-1 text-stone-300">
                              {msg.questionsToAsk.map((q, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-[var(--accent)] font-bold shrink-0">?</span>
                                  <span>{q}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Disclaimer */}
                        <div className="text-[10px] text-stone-500 italic pt-1 border-t border-stone-900">
                          BondLens provides informational analysis, not legal advice.
                        </div>
                      </div>
                    ) : (
                      /* Ask Mode: Short 1-2 sentence direct answer + Citations */
                      <div className="space-y-2.5">
                        <p className="text-stone-200 leading-relaxed font-normal">{msg.content}</p>

                        {/* Optional Extended Points (Explain More) */}
                        {msg.points && msg.points.length > 0 && (
                          <div>
                            <button
                              onClick={() => handleToggleExpandDetail(msg.id)}
                              className="text-[11px] font-medium text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer py-1"
                            >
                              <span>{msg.isDetailExpanded ? 'Show less' : 'Explain more'}</span>
                              {msg.isDetailExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {msg.isDetailExpanded && (
                              <div className="p-2.5 bg-[#0e0e0e] rounded-xl border border-stone-800 space-y-1.5 mt-1 animate-fade-in">
                                <ul className="space-y-1 text-stone-300">
                                  {msg.points.map((pt, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5 leading-relaxed">
                                      <span className="text-[var(--accent)] shrink-0">•</span>
                                      <span>{pt}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Verified Citations Block (Exact quote under 40 words, location, Jump to clause) */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="pt-2 border-t border-stone-800/80 space-y-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                          Verified Document Citations
                        </span>
                        <div className="space-y-2">
                          {msg.citations.map((cit, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 bg-[#0c0c0c] border border-stone-800 rounded-xl space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                                  <span>✓ Verified</span>
                                  {cit.location && (
                                    <span className="text-stone-400">· {cit.location}</span>
                                  )}
                                </span>

                                {onJumpToClause && (
                                  <button
                                    onClick={() => onJumpToClause(cit.quote, cit.location)}
                                    className="text-[10px] text-[var(--accent)] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                                    title="Open document viewer scrolled to this clause"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>Jump to clause</span>
                                  </button>
                                )}
                              </div>
                              <blockquote className="font-serif-doc text-[11px] text-stone-300 italic border-l-2 border-[var(--accent)] pl-2">
                                "{cit.quote}"
                              </blockquote>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Toolbar on Each Answer */}
                    <div className="pt-2 border-t border-stone-900 flex items-center justify-between text-[11px] text-stone-400">
                      <div className="flex items-center gap-1">
                        {/* Copy button */}
                        <button
                          onClick={() => handleCopy(msg)}
                          className="p-1 text-stone-400 hover:text-white hover:bg-stone-800 rounded transition-colors cursor-pointer"
                          title="Copy answer"
                          aria-label="Copy answer"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Add to report notes button */}
                        <button
                          onClick={() => handleSaveToNotes(msg)}
                          className="p-1 text-stone-400 hover:text-[var(--accent)] hover:bg-stone-800 rounded transition-colors cursor-pointer"
                          title="Save to document notes"
                          aria-label="Add to report notes"
                        >
                          {savedNoteId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <FileText className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Draft Email button (especially for decision/negotiation replies) */}
                        <button
                          onClick={() => handleDraftEmailClick(msg)}
                          className="p-1 text-stone-400 hover:text-blue-400 hover:bg-stone-800 rounded transition-colors cursor-pointer"
                          title="Draft counter-proposal email"
                          aria-label="Draft email"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Thumbs up / down feedback */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleFeedback(msg.id, 'up')}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            msg.feedback === 'up'
                              ? 'text-emerald-400 bg-emerald-950/40'
                              : 'text-stone-400 hover:text-white hover:bg-stone-800'
                          }`}
                          aria-label="Helpful"
                          title="Helpful"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.id, 'down')}
                          className={`p-1 rounded transition-colors cursor-pointer ${
                            msg.feedback === 'down'
                              ? 'text-rose-400 bg-rose-950/40'
                              : 'text-stone-400 hover:text-white hover:bg-stone-800'
                          }`}
                          aria-label="Not helpful"
                          title="Not helpful"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <span className="text-[10px] text-stone-400 mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))
          )}

          {/* Typing Indicator while waiting */}
          {isLoading && (
            <div className="flex items-center gap-2.5 text-stone-300 text-xs py-2 px-3.5 bg-[#141414] border border-stone-800 rounded-2xl max-w-[85%] animate-pulse shadow-md">
              <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-ping" />
              <span>Reading the document...</span>
            </div>
          )}

          {/* Error Banner with Retry */}
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-xs text-rose-200 flex items-start justify-between gap-2 animate-fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={() => {
                  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
                  if (lastUserMsg) {
                    handleSend(lastUserMsg.content);
                  }
                }}
                className="px-2 py-1 bg-rose-800 hover:bg-rose-700 text-white text-[11px] font-semibold rounded shrink-0 cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Retry</span>
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Chips Strip Above Input */}
        <div className="px-3 py-1.5 bg-[#0e0e0e] border-t border-stone-900 overflow-x-auto flex items-center gap-1.5 scrollbar-none shrink-0">
          {(mode === 'ask' ? ASK_QUICK_CHIPS : decideChips).map((chip) => (
            <button
              key={chip}
              disabled={isLoading}
              onClick={() => handleSend(chip)}
              className="text-[10.5px] whitespace-nowrap px-2.5 py-1 rounded-lg bg-[#161616] hover:bg-[#202020] border border-stone-800 hover:border-[var(--accent)]/40 text-stone-300 hover:text-white transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Box Area */}
        <div className="p-3 bg-[#111] border-t border-stone-800/90 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="space-y-1.5"
          >
            <div className="relative flex items-end gap-2 bg-[#181818] border border-stone-800 focus-within:border-[var(--accent)]/60 rounded-xl p-2 transition-colors">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  if (e.target.value.length <= 1000) {
                    setInput(e.target.value);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(input);
                  }
                }}
                placeholder={
                  mode === 'ask'
                    ? 'Ask what the document says...'
                    : `Ask for guidance as the ${document.userPartyRole}...`
                }
                disabled={isLoading}
                rows={2}
                maxLength={1000}
                className="flex-1 bg-transparent text-xs text-white placeholder-stone-400 focus:outline-none resize-none leading-relaxed min-h-[44px] max-h-32"
              />

              <div className="flex items-center gap-1 shrink-0 pb-0.5">
                {isLoading ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors cursor-pointer"
                    title="Stop response"
                    aria-label="Stop response"
                  >
                    <Square className="w-3.5 h-3.5 fill-current" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-[var(--accent)] text-black hover:opacity-90 disabled:opacity-30 rounded-lg transition-all cursor-pointer font-bold shadow-md"
                    title="Send message (Enter)"
                    aria-label="Send message"
                  >
                    <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                )}
              </div>
            </div>

            {/* Character count & shortcuts hint */}
            <div className="flex items-center justify-between text-[10px] text-stone-400 px-1">
              <span>Enter to send · Shift+Enter for new line</span>
              <span
                className={input.length >= 950 ? 'text-amber-400 font-mono' : 'font-mono text-stone-400'}
              >
                {input.length}/1000
              </span>
            </div>
          </form>
        </div>
      </aside>
    </>
  );
};
