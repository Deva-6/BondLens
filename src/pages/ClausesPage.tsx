import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Layers,
  Search,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Edit3,
  Check,
  Save,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { StorageService } from '../services/storageService';
import { BackButton } from '../components/BackButton';
import { DocumentAnalysis, KeyClause } from '../types/analysis';

export const ClausesPage: React.FC = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<DocumentAnalysis[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'library' | 'flashcards'>('library');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  // Flashcard Deck state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Active notes being edited
  const [editingNotes, setEditingNotes] = useState<{ [clauseKey: string]: string }>({});
  const [savingNoteKey, setSavingNoteKey] = useState<string | null>(null);

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

  const allClausesWithDoc = targetDocs.flatMap((d) =>
    (d.keyClauses || []).map((c) => ({ ...c, docId: d.id, docTitle: d.title }))
  );

  const filteredClauses = allClausesWithDoc.filter((c) => {
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (riskFilter !== 'all' && c.riskLevel !== riskFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.plainExplanation.toLowerCase().includes(q) ||
        c.exactQuote.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleToggleReviewed = async (docId: string, clauseId: string) => {
    await StorageService.toggleClauseReviewed(docId, clauseId);
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          return {
            ...d,
            keyClauses: d.keyClauses.map((c) =>
              c.id === clauseId ? { ...c, isReviewed: !c.isReviewed } : c
            ),
          };
        }
        return d;
      })
    );
  };

  const handleSaveNotes = async (docId: string, clauseId: string) => {
    const key = `${docId}_${clauseId}`;
    const notes = editingNotes[key] ?? '';
    setSavingNoteKey(key);
    await StorageService.updateClauseNotes(docId, clauseId, notes);
    setDocuments((prev) =>
      prev.map((d) => {
        if (d.id === docId) {
          return {
            ...d,
            keyClauses: d.keyClauses.map((c) =>
              c.id === clauseId ? { ...c, userNotes: notes } : c
            ),
          };
        }
        return d;
      })
    );
    setTimeout(() => setSavingNoteKey(null), 1000);
  };

  // Keyboard navigation for Flashcards: Left, Right, Space
  const nextCard = useCallback(() => {
    if (filteredClauses.length === 0) return;
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % filteredClauses.length);
  }, [filteredClauses.length]);

  const prevCard = useCallback(() => {
    if (filteredClauses.length === 0) return;
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + filteredClauses.length) % filteredClauses.length);
  }, [filteredClauses.length]);

  const toggleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  useEffect(() => {
    if (viewMode !== 'flashcards') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        toggleFlip();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextCard();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prevCard();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, nextCard, prevCard, toggleFlip]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse space-y-4">
        <div className="h-8 w-60 bg-stone-900 rounded" />
        <div className="h-44 bg-[#0d0d0d] rounded-xl" />
      </div>
    );
  }

  const currentCard = filteredClauses[currentCardIndex];

  const currentSelectedDoc = documents.find((d) => d.id === selectedDocId);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back Button with Breadcrumbs */}
      <BackButton
        fallbackTo="/dashboard"
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'My Documents', to: '/documents' },
          { label: currentSelectedDoc ? currentSelectedDoc.title : 'Key Clauses' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-display">
            Key Clauses
          </h1>
          <p className="text-sm text-stone-400 mt-1">
            Clause Library, personal notes, and interactive flashcard deck.
          </p>
        </div>

        {/* View Mode Toggle & Doc filter */}
        <div className="flex flex-wrap items-center gap-3">
          {documents.length > 0 && (
            <select
              value={selectedDocId}
              onChange={(e) => {
                setSelectedDocId(e.target.value);
                setCurrentCardIndex(0);
                setIsFlipped(false);
              }}
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
              onClick={() => setViewMode('library')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === 'library'
                  ? 'bg-[var(--accent)] text-black shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Clause Library
            </button>
            <button
              onClick={() => {
                setViewMode('flashcards');
                setCurrentCardIndex(0);
                setIsFlipped(false);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                viewMode === 'flashcards'
                  ? 'bg-[var(--accent)] text-black shadow-sm'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Flashcard Deck
            </button>
          </div>
        </div>
      </div>

      {documents.length === 0 ? (
        <div className="p-12 text-center bg-[#0a0a0a] border border-stone-800 rounded-2xl space-y-4">
          <BookOpen className="w-12 h-12 text-stone-600 mx-auto" />
          <h2 className="text-lg font-semibold text-white">No clauses extracted yet</h2>
          <p className="text-xs text-stone-400 max-w-md mx-auto">
            Analyze an agreement to populate your interactive clause repository.
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
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search clause titles & text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#141414] border border-stone-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-stone-400 focus:outline-none focus:border-[var(--accent)]/50 w-44 sm:w-56"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCurrentCardIndex(0);
                }}
                className="bg-[#141414] border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none"
              >
                <option value="all">All Categories</option>
                <option value="Liability">Liability</option>
                <option value="Payment">Payment</option>
                <option value="Termination">Termination</option>
                <option value="IP">Intellectual Property</option>
                <option value="Compliance">Compliance</option>
                <option value="Confidentiality">Confidentiality</option>
                <option value="Other">Other</option>
              </select>

              <select
                value={riskFilter}
                onChange={(e) => {
                  setRiskFilter(e.target.value);
                  setCurrentCardIndex(0);
                }}
                className="bg-[#141414] border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-300 focus:outline-none"
              >
                <option value="all">All Risk Levels</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <span className="text-xs text-stone-400">
              {filteredClauses.length} clause{filteredClauses.length === 1 ? '' : 's'} available
            </span>
          </div>

          {/* VIEW 1: FLASHCARD DECK */}
          {viewMode === 'flashcards' && (
            <div className="max-w-2xl mx-auto space-y-6">
              {filteredClauses.length === 0 ? (
                <div className="p-8 text-center text-xs text-stone-400">
                  No clauses match current filters.
                </div>
              ) : (
                <>
                  {/* Progress Header */}
                  <div className="flex items-center justify-between text-xs text-stone-400">
                    <span>
                      Card {currentCardIndex + 1} of {filteredClauses.length}
                    </span>
                    <span className="text-[11px] font-mono text-[var(--accent)]/70">
                      Space to flip · ← / → Arrow keys
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1 bg-stone-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] transition-all duration-300"
                      style={{
                        width: `${((currentCardIndex + 1) / filteredClauses.length) * 100}%`,
                      }}
                    />
                  </div>

                  {/* 3D Flip Card */}
                  <div
                    onClick={toggleFlip}
                    className="relative w-full h-[380px] cursor-pointer select-none perspective-1000 group"
                  >
                    <div
                      className={`w-full h-full duration-500 rounded-2xl p-8 border transition-all flex flex-col justify-between ${
                        isFlipped
                          ? 'bg-[#12100d] border-[var(--accent)] shadow-[0_0_25px_var(--accent-glow)]'
                          : 'bg-[#0a0a0a] border-stone-800 hover:border-stone-700 shadow-xl'
                      }`}
                    >
                      {/* CARD FRONT */}
                      {!isFlipped ? (
                        <>
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
                                {currentCard.category}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                                  currentCard.riskLevel === 'Critical'
                                    ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                                    : currentCard.riskLevel === 'High'
                                    ? 'bg-orange-950/60 text-orange-300 border-orange-800'
                                    : 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                                }`}
                              >
                                {currentCard.riskLevel} Risk
                              </span>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 font-display">
                              {currentCard.title}
                            </h3>
                            <span className="text-xs text-stone-400 block mb-4">
                              {currentCard.location} · {currentCard.docTitle}
                            </span>

                            {currentCard.exactQuote && (
                              <div className="p-4 bg-black/60 border-l-2 border-[var(--accent)]/40 font-serif-doc text-xs text-stone-300 italic leading-relaxed max-h-36 overflow-y-auto">
                                "{currentCard.exactQuote}"
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between text-xs text-stone-400 pt-4 border-t border-stone-900">
                            <span className="text-[11px] text-stone-400">
                              Click card or press Space to see explanation & negotiation tip
                            </span>
                            <RotateCw className="w-4 h-4 text-[var(--accent)]" />
                          </div>
                        </>
                      ) : (
                        /* CARD BACK */
                        <>
                          <div className="overflow-y-auto pr-1 space-y-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-[var(--accent)] uppercase tracking-wider">
                                Plain-Language Analysis
                              </span>
                              <span className="text-xs text-stone-400">{currentCard.title}</span>
                            </div>

                            <div>
                              <span className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider block mb-1">
                                What this means:
                              </span>
                              <p className="text-xs text-stone-200 leading-relaxed">
                                {currentCard.plainExplanation}
                              </p>
                            </div>

                            {currentCard.whyItMatters && (
                              <div>
                                <span className="text-[11px] font-semibold text-stone-300 uppercase tracking-wider block mb-1">
                                  Why it matters:
                                </span>
                                <p className="text-xs text-stone-300 leading-relaxed">
                                  {currentCard.whyItMatters}
                                </p>
                              </div>
                            )}

                            <div className="p-3 bg-black border border-stone-800 rounded-xl text-xs text-[var(--accent)]">
                              <strong className="text-stone-300">Negotiation Tip: </strong>
                              {currentCard.negotiationTip}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs text-stone-400 pt-3 border-t border-stone-900">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleReviewed(currentCard.docId, currentCard.id);
                              }}
                              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                currentCard.isReviewed
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                  : 'bg-stone-900 text-stone-300 hover:text-white'
                              }`}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{currentCard.isReviewed ? 'Reviewed' : 'Mark Reviewed'}</span>
                            </button>

                            <span className="text-[11px] text-stone-400">Click to flip back</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={prevCard}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#121212] hover:bg-[#1a1a1a] border border-stone-800 rounded-xl text-xs text-stone-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous</span>
                    </button>

                    <button
                      onClick={toggleFlip}
                      className="px-4 py-2 bg-[#1a1a1a] border border-stone-800 hover:border-[var(--accent)]/40 rounded-xl text-xs font-medium text-[var(--accent)] transition-colors cursor-pointer"
                    >
                      Flip Card
                    </button>

                    <button
                      onClick={nextCard}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#121212] hover:bg-[#1a1a1a] border border-stone-800 rounded-xl text-xs text-stone-200 hover:text-white transition-colors cursor-pointer"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* VIEW 2: CLAUSE LIBRARY */}
          {viewMode === 'library' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredClauses.map((clause) => {
                const noteKey = `${clause.docId}_${clause.id}`;
                const currentNotes =
                  editingNotes[noteKey] !== undefined
                    ? editingNotes[noteKey]
                    : clause.userNotes || '';

                return (
                  <div
                    key={`${clause.docId}-${clause.id}`}
                    className="p-5 bg-[#0a0a0a] border border-stone-800/90 hover:border-stone-700 rounded-xl space-y-3.5 transition-all"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
                        {clause.category}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-stone-400">{clause.location}</span>
                        <button
                          onClick={() => handleToggleReviewed(clause.docId, clause.id)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-colors ${
                            clause.isReviewed
                              ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                              : 'bg-stone-900 text-stone-400 hover:text-white border border-stone-800'
                          }`}
                          title="Toggle reviewed status"
                        >
                          <Check className="w-3 h-3" />
                          <span>{clause.isReviewed ? 'Reviewed' : 'Review'}</span>
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-white">{clause.title}</h3>
                      <p className="text-xs text-stone-300 mt-1.5 leading-relaxed">
                        {clause.plainExplanation}
                      </p>
                    </div>

                    {clause.exactQuote && (
                      <div className="p-2.5 bg-black/60 border-l-2 border-[var(--accent)]/40 font-serif-doc text-xs text-stone-300 italic">
                        "{clause.exactQuote}"
                      </div>
                    )}

                    <div className="p-2.5 bg-[#121212] border border-stone-800 rounded-lg text-xs text-stone-400">
                      <strong className="text-[var(--accent)]">Negotiation Tip: </strong>
                      {clause.negotiationTip}
                    </div>

                    {/* Personal Notes Section */}
                    <div className="pt-2 border-t border-stone-900 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-stone-400">
                        <span className="flex items-center gap-1">
                          <Edit3 className="w-3 h-3 text-[var(--accent)]" />
                          Personal Notes
                        </span>
                        {savingNoteKey === noteKey && (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <Save className="w-3 h-3" /> Saved
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={currentNotes}
                          placeholder="Add private note, e.g. 'Discuss with Sarah on Thursday'..."
                          onChange={(e) =>
                            setEditingNotes((prev) => ({
                              ...prev,
                              [noteKey]: e.target.value,
                            }))
                          }
                          onBlur={() => handleSaveNotes(clause.docId, clause.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveNotes(clause.docId, clause.id);
                            }
                          }}
                          className="flex-1 bg-[#141414] border border-stone-800 focus:border-[var(--accent)]/50 rounded-lg px-2.5 py-1 text-xs text-stone-200 placeholder-stone-400 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveNotes(clause.docId, clause.id)}
                          className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};
