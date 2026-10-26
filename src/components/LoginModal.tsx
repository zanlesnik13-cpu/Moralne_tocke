import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, AlertCircle, Sparkles, KeyRound } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (name: string, pin: string) => void;
  existingUsers: string[];
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, existingUsers }) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanPin = pin.trim();

    if (!cleanName) {
      setError('Vnesite svoje ime ali vzdevek.');
      return;
    }

    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setError('PIN mora biti natanko 4-mestno število (npr. 1234).');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cleanName, pin: cleanPin })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Prijava ni uspela.');
      }

      onLoginSuccess(cleanName, cleanPin);
    } catch (err: any) {
      setError(err.message || 'Napaka pri povezavi s strežnikom.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelectName = (userName: string) => {
    setName(userName);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 text-rose-400 mb-3 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Prijava v Moralne Točke</h2>
          <p className="text-sm text-slate-400 mt-1">
            Vnesite svoje ime in 4-mestno kodo (PIN) za varno beleženje točk.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Tvoje Ime / Vzdevek
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="npr. Luka, Žan, Matic, Jan..."
                autoFocus
                className="w-full h-12 px-4 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white placeholder-slate-500 text-sm outline-none transition-colors"
              />
              <UserCheck className="w-4 h-4 text-slate-500 absolute right-3.5 top-4 pointer-events-none" />
            </div>

            {/* Quick existing user suggestions */}
            {existingUsers.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5 items-center">
                <span className="text-[11px] text-slate-500">Obstoječi:</span>
                {existingUsers.slice(0, 5).map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => handleQuickSelectName(u)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    {u}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between items-center">
              <span>4-mestni PIN</span>
              <span className="text-[11px] font-normal text-slate-400">Zaščita pred zlorabo</span>
            </label>
            <div className="relative">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setPin(val);
                }}
                placeholder="••••"
                className="w-full h-12 px-4 tracking-[0.5em] text-center font-mono font-bold text-lg rounded-xl bg-slate-950/70 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white placeholder-slate-600 outline-none transition-colors"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-4 pointer-events-none" />
              <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-4 pointer-events-none" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              💡 Če ime še ne obstaja v bazi, se samodejno ustvari nov profil s tem PIN-om.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-2 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-[0.99] transition cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin mr-1">↻</span>
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {loading ? 'Prijavljanje...' : 'Vstopi v aplikacijo'}
          </button>
        </form>
      </div>
    </div>
  );
};
