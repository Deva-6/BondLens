import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const DisclaimerNotice: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`flex items-center justify-center gap-2 py-2 px-4 text-[11px] text-stone-400 border border-stone-800/80 bg-[#080808] rounded-xl ${className}`}
    >
      <ShieldAlert className="w-3.5 h-3.5 text-[#F5E6A8]/70 shrink-0" />
      <span>
        BondLens provides informational analysis, not legal advice. Always review critical terms with qualified counsel.
      </span>
    </div>
  );
};
