import React, { useState } from 'react';
import { ShieldCheck, UserCheck, Lock, AlertCircle, Sparkles, KeyRound, UserPlus, LogIn, CheckCircle } from 'lucide-react';

interface LoginModalProps {
  onLoginSuccess: (name: string, pin: string) => void;
  existingUsers: string[];
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess, existingUsers }) => {
  const [mode, setMode] = useState<'login' | 'register'>(existingUsers.length === 0 ? 'register' : 'login');
  
  // Login fields
  const [loginName, setLoginName] = useState('');
  const [loginPin, setLoginPin] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regPinConfirm, setRegPinConfirm] = useState('');
  const [selectedColor, setSelectedColor] = useState('emerald');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const colors = [
    { id: 'emerald', label: 'Zelena', bg: 'bg-emerald-500' },
    { id: 'rose', label: 'Rdeča', bg: 'bg-rose-500' },
    { id: 'indigo', label: 'Vijolična', bg: 'bg-indigo-500' },
    { id: 'amber', label: 'Zlata', bg: 'bg-amber-500' },
    { id: 'teal', label: 'Turkizna', bg: 'bg-teal-500' },
    { id: 'cyan', label: 'Modra', bg: 'bg-cyan-500' }
  ];

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = loginName.trim();
    const cleanPin = loginPin.trim();

    if (!cleanName) {
      setError('Vnesite svoje ime ali izberite obstoječi profil.');
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = regName.trim();
    const cleanPin = regPin.trim();
    const cleanConfirm = regPinConfirm.trim();

    if (!cleanName) {
      setError('Vnesite svoje ime ali vzdevek za nov profil.');
      return;
    }

    if (cleanPin.length !== 4 || !/^\d{4}$/.test(cleanPin)) {
      setError('PIN mora biti natanko 4-mestno število (npr. 1234).');
      return;
    }

    if (cleanPin !== cleanConfirm) {
      setError('Vneseni kodi PIN se ne ujemata. Preverite ponovni vnos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          pin: cleanPin,
          avatarColor: selectedColor
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registracija ni uspela.');
      }

      onLoginSuccess(cleanName, cleanPin);
    } catch (err: any) {
      setError(err.message || 'Napaka pri povezavi s strežnikom.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSelectName = (userName: string) => {
    setLoginName(userName);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 text-rose-400 mb-2.5 shadow-inner">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Moralne Točke
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            {mode === 'login'
              ? 'Prijavite se v obstoječi profil s svojim PIN-om'
              : 'Ustvarite nov profil za beleženje točk'}
          </p>
        </div>

        {/* Mode Selector Tabs (Prijava vs Ustvari Profil) */}
        <div className="grid grid-cols-2 p-1 bg-slate-950/80 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
              mode === 'login'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-4 h-4 text-amber-400" />
            <span>Prijava</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
            }}
            className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer ${
              mode === 'register'
                ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Ustvari profil</span>
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: PRIJAVA (LOGIN) */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Tvoje Ime / Vzdevek
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="Vnesi svoje ime..."
                  autoFocus
                  className="w-full h-12 px-4 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white placeholder-slate-500 text-sm outline-none transition-colors"
                />
                <UserCheck className="w-4 h-4 text-slate-500 absolute right-3.5 top-4 pointer-events-none" />
              </div>

              {/* Quick existing user suggestions */}
              {existingUsers.length > 0 ? (
                <div className="mt-2.5">
                  <span className="text-[11px] text-slate-400 block mb-1">
                    Izbira registriranega profila:
                  </span>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {existingUsers.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => handleQuickSelectName(u)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                          loginName === u
                            ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-semibold'
                            : 'bg-slate-800/80 border-slate-700/60 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-center justify-between gap-2">
                  <span>V bazi še ni nobenega profila.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setError(null);
                    }}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline"
                  >
                    Ustvari nov profil →
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between items-center">
                <span>4-mestni PIN</span>
                <span className="text-[11px] font-normal text-slate-400">Vnesite kodo profila</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={loginPin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setLoginPin(val);
                  }}
                  placeholder="••••"
                  className="w-full h-12 px-4 tracking-[0.5em] text-center font-mono font-bold text-lg rounded-xl bg-slate-950/70 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white placeholder-slate-600 outline-none transition-colors"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-4 pointer-events-none" />
                <KeyRound className="w-4 h-4 text-slate-500 absolute right-3.5 top-4 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-1 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-[0.99] transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block animate-spin mr-1">↻</span>
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Prijavljanje...' : 'Prijavi se'}
            </button>

            <div className="text-center pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium transition cursor-pointer"
              >
                Še nimaš profila? 👉 <span className="underline">Ustvari nov profil tukaj</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: USTVARI NOV PROFIL (REGISTRACIJA) */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Novo Ime / Vzdevek
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Vnesi svoje ime ali vzdevek..."
                  autoFocus
                  className="w-full h-12 px-4 rounded-xl bg-slate-950/70 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white placeholder-slate-500 text-sm outline-none transition-colors"
                />
                <UserPlus className="w-4 h-4 text-slate-500 absolute right-3.5 top-4 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Izberi 4-mestni PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={regPin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setRegPin(val);
                    }}
                    placeholder="••••"
                    className="w-full h-11 px-3 tracking-[0.3em] text-center font-mono font-bold text-base rounded-xl bg-slate-950/70 border border-slate-800 focus:border-rose-500 text-white placeholder-slate-600 outline-none transition"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Ponovi PIN
                </label>
                <div className="relative">
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={regPinConfirm}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setRegPinConfirm(val);
                    }}
                    placeholder="••••"
                    className="w-full h-11 px-3 tracking-[0.3em] text-center font-mono font-bold text-base rounded-xl bg-slate-950/70 border border-slate-800 focus:border-rose-500 text-white placeholder-slate-600 outline-none transition"
                  />
                  <KeyRound className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Avatar color pick */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Izberi barvo avatarja
              </label>
              <div className="flex items-center gap-2">
                {colors.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedColor(c.id)}
                    className={`w-7 h-7 rounded-xl ${c.bg} flex items-center justify-center transition cursor-pointer ${
                      selectedColor === c.id ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'opacity-70 hover:opacity-100'
                    }`}
                    title={c.label}
                  >
                    {selectedColor === c.id && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              💡 Vaš 4-mestni PIN boste potrebovali za vsako prijavo in beleženje točk, kar zagotavlja, da nihče ne vnaša točk v vašem imenu.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block animate-spin mr-1">↻</span>
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {loading ? 'Ustvarjanje profila...' : 'Ustvari profil in vstopi'}
            </button>

            <div className="text-center pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="text-xs text-slate-400 hover:text-white transition cursor-pointer"
              >
                Že imaš profil? 👉 <span className="text-amber-400 underline">Prijavi se tukaj</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
