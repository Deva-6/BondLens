import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, Copy, Check, Eye } from 'lucide-react';
import { KeyClause, RiskFinding, DeadlineItem, ObligationItem } from '../types/analysis';

interface SplitDocumentViewerProps {
  rawText: string;
  keyClauses: KeyClause[];
  risks: RiskFinding[];
  deadlines: DeadlineItem[];
  obligations: ObligationItem[];
  selectedFindingId: string | null;
  onSelectFinding: (type: 'clause' | 'risk' | 'deadline' | 'obligation', id: string) => void;
  searchQuery?: string;
}

interface HighlightSpan {
  id: string;
  type: 'clause' | 'risk' | 'deadline' | 'obligation';
  title: string;
  quote: string;
  startIndex: number;
  endIndex: number;
  severityColor: string;
}

export const SplitDocumentViewer: React.FC<SplitDocumentViewerProps> = ({
  rawText,
  keyClauses,
  risks,
  deadlines,
  obligations,
  selectedFindingId,
  onSelectFinding,
  searchQuery: externalSearchQuery = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalSearchQuery) {
      setSearchQuery(externalSearchQuery);
    }
  }, [externalSearchQuery]);

  // Compute text highlight spans based on exact quotes
  const highlightSpans = useMemo(() => {
    const spans: HighlightSpan[] = [];
    const normalizedRaw = rawText.toLowerCase();

    // 1. Risks
    risks.forEach((r) => {
      if (!r.exactQuote || r.exactQuote.length < 5) return;
      const idx = normalizedRaw.indexOf(r.exactQuote.toLowerCase().trim());
      if (idx !== -1) {
        spans.push({
          id: r.id,
          type: 'risk',
          title: `Risk: ${r.title} (${r.severity})`,
          quote: r.exactQuote,
          startIndex: idx,
          endIndex: idx + r.exactQuote.trim().length,
          severityColor:
            r.severity === 'Critical'
              ? 'rgba(245, 101, 101, 0.35)'
              : r.severity === 'High'
              ? 'rgba(237, 137, 54, 0.35)'
              : 'rgba(236, 201, 75, 0.35)',
        });
      }
    });

    // 2. Clauses
    keyClauses.forEach((c) => {
      if (!c.exactQuote || c.exactQuote.length < 5) return;
      const idx = normalizedRaw.indexOf(c.exactQuote.toLowerCase().trim());
      if (idx !== -1 && !spans.some((s) => s.startIndex === idx)) {
        spans.push({
          id: c.id,
          type: 'clause',
          title: `Clause: ${c.title}`,
          quote: c.exactQuote,
          startIndex: idx,
          endIndex: idx + c.exactQuote.trim().length,
          severityColor: 'rgba(245, 230, 168, 0.3)',
        });
      }
    });

    // 3. Deadlines
    deadlines.forEach((d) => {
      if (!d.exactQuote || d.exactQuote.length < 5) return;
      const idx = normalizedRaw.indexOf(d.exactQuote.toLowerCase().trim());
      if (idx !== -1 && !spans.some((s) => s.startIndex === idx)) {
        spans.push({
          id: d.id,
          type: 'deadline',
          title: `Deadline: ${d.label}`,
          quote: d.exactQuote,
          startIndex: idx,
          endIndex: idx + d.exactQuote.trim().length,
          severityColor: 'rgba(99, 179, 237, 0.35)',
        });
      }
    });

    // 4. Obligations
    obligations.forEach((o) => {
      if (!o.exactQuote || o.exactQuote.length < 5) return;
      const idx = normalizedRaw.indexOf(o.exactQuote.toLowerCase().trim());
      if (idx !== -1 && !spans.some((s) => s.startIndex === idx)) {
        spans.push({
          id: o.id,
          type: 'obligation',
          title: `Obligation: ${o.description.slice(0, 30)}...`,
          quote: o.exactQuote,
          startIndex: idx,
          endIndex: idx + o.exactQuote.trim().length,
          severityColor: 'rgba(72, 187, 120, 0.35)',
        });
      }
    });

    return spans.sort((a, b) => a.startIndex - b.startIndex);
  }, [rawText, keyClauses, risks, deadlines, obligations]);

  // Scroll to selected finding when selectedFindingId changes
  useEffect(() => {
    if (!selectedFindingId || !containerRef.current) return;
    const element = containerRef.current.querySelector(`[data-finding-id="${selectedFindingId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedFindingId]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render text segments with interactive highlights
  const renderedContent = useMemo(() => {
    if (!rawText) return null;
    if (highlightSpans.length === 0) {
      return (
        <pre className="font-serif-doc text-sm text-stone-300 leading-relaxed whitespace-pre-wrap selection:bg-[#F5E6A8]/30">
          {rawText}
        </pre>
      );
    }

    const segments: React.ReactNode[] = [];
    let currentIndex = 0;

    highlightSpans.forEach((span, idx) => {
      // Unhighlighted text before this span
      if (span.startIndex > currentIndex) {
        segments.push(
          <span key={`text-${currentIndex}`}>
            {rawText.slice(currentIndex, span.startIndex)}
          </span>
        );
      }

      // Ensure valid range
      const chunk = rawText.slice(
        Math.max(currentIndex, span.startIndex),
        Math.min(rawText.length, span.endIndex)
      );

      const isSelected = selectedFindingId === span.id;

      segments.push(
        <mark
          key={`mark-${span.id}-${idx}`}
          data-finding-id={span.id}
          onClick={() => onSelectFinding(span.type, span.id)}
          title={`${span.title} (Click to inspect finding)`}
          className={`cursor-pointer rounded px-1 transition-all duration-300 ${
            isSelected
              ? 'ring-2 ring-[#F5E6A8] text-white shadow-lg shadow-[#F5E6A8]/20 font-medium'
              : 'hover:opacity-90'
          }`}
          style={{
            backgroundColor: span.severityColor,
            color: '#ffffff',
          }}
        >
          {chunk}
        </mark>
      );

      currentIndex = Math.max(currentIndex, span.endIndex);
    });

    // Remaining text after last span
    if (currentIndex < rawText.length) {
      segments.push(
        <span key={`text-end`}>{rawText.slice(currentIndex)}</span>
      );
    }

    return (
      <div className="font-serif-doc text-[13.5px] leading-relaxed text-stone-300 whitespace-pre-wrap font-normal selection:bg-[#F5E6A8]/30">
        {segments}
      </div>
    );
  }, [rawText, highlightSpans, selectedFindingId, onSelectFinding]);

  return (
    <div className="flex flex-col h-full bg-[#0d0d0d] border border-stone-800 rounded-xl overflow-hidden shadow-xl">
      {/* Viewer Header */}
      <div className="p-3 bg-[#131313] border-b border-stone-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-stone-300 font-medium">
          <Eye className="w-4 h-4 text-[#F5E6A8]" />
          <span>Interactive Document Source</span>
          <span className="text-[10px] text-stone-400 font-mono">
            ({highlightSpans.length} linked clauses)
          </span>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-3 text-[10px] text-stone-400">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" /> Risk
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F5E6A8]" /> Clause
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Deadline
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Obligation
          </span>
        </div>

        {/* Actions */}
        <button
          onClick={handleCopyText}
          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Text'}</span>
        </button>
      </div>

      {/* Document Text Body */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-6 bg-[#0a0a0a] border-t border-stone-900"
      >
        {renderedContent}
      </div>

      {/* Viewer Footer Status */}
      <div className="px-4 py-2 bg-[#111] border-t border-stone-800 text-[11px] text-stone-400 flex items-center justify-between">
        <span>Click any highlighted passage to focus its legal finding.</span>
        <span>{rawText.length.toLocaleString()} characters</span>
      </div>
    </div>
  );
};
