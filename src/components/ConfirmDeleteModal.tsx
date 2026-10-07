import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemNames?: string[];
  confirmText?: string;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  title,
  message,
  itemNames,
  confirmText = 'Supprimer définitivement',
  onConfirm,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Icon + Title */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400">Cette action est irréversible</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message body */}
        <p className="text-xs sm:text-sm text-slate-300 mb-4 leading-relaxed">{message}</p>

        {/* Item names list preview if provided */}
        {itemNames && itemNames.length > 0 && (
          <div className="mb-4 bg-slate-950 border border-slate-800/80 rounded-xl p-3 max-h-36 overflow-y-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Éléments concernés ({itemNames.length}) :
            </span>
            <ul className="text-xs text-slate-300 space-y-1">
              {itemNames.slice(0, 10).map((name, idx) => (
                <li key={idx} className="flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  <span className="truncate">{name}</span>
                </li>
              ))}
              {itemNames.length > 10 && (
                <li className="text-[11px] text-slate-400 font-medium italic pt-1">
                  ... et {itemNames.length - 10} autre(s)
                </li>
              )}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-rose-950/50 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
