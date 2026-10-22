import React, { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff, ShieldCheck, AlertCircle, X, Check } from 'lucide-react';

interface RoleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RoleAuthModal: React.FC<RoleAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === 'Timamilo') {
      setError(null);
      setPassword('');
      onSuccess();
    } else {
      setError('Mot de passe incorrect. Seul l’entraîneur possède les droits de modification.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden p-6 sm:p-7 relative border-t-4 border-t-emerald-500">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          title="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">
              Accès Mode Éditeur (Entraîneur)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Réservé au coach et staff technique
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-5 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80">
          Ce mode permet de <strong className="text-white">créer de nouveaux matchs</strong>, modifier les compositions, attribuer les <strong className="text-emerald-400">notes /10</strong>, les buteurs, passeurs, cartons et gérer l'effectif des joueurs.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Mot de passe Entraîneur :
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Entrez le mot de passe coach..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white rounded-xl px-4 py-3 text-sm pr-11 font-medium transition-colors outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                title={showPassword ? 'Masquer' : 'Afficher'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold mt-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-950/60 border border-emerald-400/40 transition-all cursor-pointer"
            >
              <Unlock className="w-4 h-4 text-emerald-200" />
              <span>Déverrouiller le Mode Éditeur</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
