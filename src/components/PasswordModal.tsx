import React, { useState } from 'react';
import { Lock, KeyRound, X, AlertCircle, ShieldAlert, CheckCircle2, Eye, EyeOff } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
  actionTitle?: string;
}

export const MASTER_PASSWORD = 'morant2026';

export function isUserAuthorized(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem('rifa_court_auth') === MASTER_PASSWORD;
}

export function setAuthorized(authorized: boolean): void {
  if (typeof window === 'undefined') return;
  if (authorized) {
    sessionStorage.setItem('rifa_court_auth', MASTER_PASSWORD);
  } else {
    sessionStorage.removeItem('rifa_court_auth');
  }
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
  isOpen,
  onSuccess,
  onClose,
  actionTitle = 'Acceso Restringido'
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === MASTER_PASSWORD) {
      setAuthorized(true);
      setError(false);
      setPassword('');
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#0F1724] border border-orange-500/60 shadow-[0_0_40px_rgba(255,100,24,0.3)] p-6 text-slate-100 text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Lock Graphic */}
        <div className="w-14 h-14 rounded-2xl bg-orange-950/70 border border-orange-500/50 flex items-center justify-center mx-auto mb-4 text-[#FF6418] shadow-lg">
          <Lock className="w-7 h-7" />
        </div>

        <h3 className="font-['Outfit'] font-black text-xl text-white uppercase tracking-wide">
          ACCESO PROTEGIDO
        </h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
          Ingresa la contraseña para autorizar <strong className="text-orange-400">{actionTitle}</strong>.
        </p>

        {error && (
          <div className="mt-4 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center justify-center gap-1.5 animate-bounce">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>Contraseña incorrecta. Intente de nuevo.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              autoFocus
              placeholder="Contraseña del sistema..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError(false);
              }}
              className="w-full pl-9 pr-10 py-2.5 bg-[#121A24] border border-slate-700 rounded-xl text-white font-mono text-center tracking-wider text-sm focus:outline-none focus:border-orange-500 shadow-inner"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-[#FF6418] hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(255,100,24,0.4)] transition-all flex items-center justify-center gap-1.5"
            >
              <span>Acceder</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
