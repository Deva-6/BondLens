import React, { useState } from 'react';
import { X, Copy, Check, Mail, Sparkles } from 'lucide-react';
import { DocumentAnalysis, RiskFinding } from '../types/analysis';
import { ExportService } from '../services/exportService';

interface CounterProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentAnalysis;
  customEmailText?: string;
}

export const CounterProposalModal: React.FC<CounterProposalModalProps> = ({
  isOpen,
  onClose,
  document,
  customEmailText,
}) => {
  const highRisks = document.risks.filter(
    (r) => r.severity === 'Critical' || r.severity === 'High'
  );

  const [emailText, setEmailText] = useState(() =>
    customEmailText || ExportService.generateCounterProposalEmail(document, highRisks)
  );

  React.useEffect(() => {
    if (customEmailText) {
      setEmailText(customEmailText);
    } else {
      setEmailText(ExportService.generateCounterProposalEmail(document, highRisks));
    }
  }, [customEmailText, document]);

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(emailText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[#0e0e0e] border border-[#2a2517] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-[#141414] border-b border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5E6A8]/10 border border-[#F5E6A8]/30 flex items-center justify-center text-[#F5E6A8]">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Draft Counter-Proposal Email</h3>
              <p className="text-xs text-stone-400">
                Generated from {highRisks.length} key negotiation points in {document.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-3">
          <div className="flex items-center gap-2 text-xs text-[#F5E6A8]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Edit or personalize this draft before sending to your counterparty.</span>
          </div>

          <textarea
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            rows={14}
            className="w-full bg-[#121212] border border-stone-800 rounded-xl p-4 text-xs font-mono text-stone-200 focus:outline-none focus:border-[#F5E6A8]/60 leading-relaxed resize-none"
          />
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-[#141414] border-t border-stone-800 flex items-center justify-between">
          <span className="text-[11px] text-stone-400">
            Perspective: {document.userPartyRole}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-black bg-[#F5E6A8] hover:bg-[#E8D48B] rounded-lg transition-colors shadow-lg cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard' : 'Copy Email Draft'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
