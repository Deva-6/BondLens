import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0e0e0e] border border-stone-800 rounded-2xl shadow-2xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isDestructive
                ? 'bg-red-950/50 text-red-400 border border-red-800/40'
                : 'bg-[#F5E6A8]/10 text-[#F5E6A8] border border-[#F5E6A8]/30'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-xs text-stone-400 mt-0.5">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-800/80">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-stone-300 hover:text-white bg-stone-900 hover:bg-stone-800 border border-stone-700/60 rounded-xl transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-950'
                : 'bg-[#F5E6A8] hover:bg-[#E8D48B] text-black shadow-lg shadow-[#F5E6A8]/20'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
