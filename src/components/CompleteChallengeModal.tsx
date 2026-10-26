import React, { useState } from 'react';
import { Skull, CheckCircle2, X, AlertTriangle, ShieldCheck } from 'lucide-react';

interface CompleteChallengeModalProps {
  targetUser: string;
  currentScore: number;
  recordedBy: string;
  userPin: string;
  onClose: () => void;
  onChallengeCompleted: () => void;
}

export const CompleteChallengeModal: React.FC<CompleteChallengeModalProps> = ({
  targetUser,
  currentScore,
  recordedBy,
  userPin,
  onClose,
  onChallengeCompleted
}) => {
  const [description, setDescription] = useState('');
  const [offsetPoints, setOffsetPoints] = useState(100);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/challenge/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUser,
          recordedBy,
          pin: userPin,
          challengeDescription: description.trim() || 'Uspešno opravljen kazenski izziv pred skupino.',
          penaltyPointsToOffset: offsetPoints
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Napaka pri potrjevanju izziva.');
      }

      onChallengeCompleted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Napaka pri klicu strežnika.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-lg bg-slate-900 border border-red-500/50 rounded-3xl p-6 sm:p-7 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-inner">
            <Skull className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Opravljen Moralni Izziv
            </h3>
            <p className="text-xs text-rose-300">
              Oseba <span className="font-bold text-white">{targetUser}</span> ima trenutno{' '}
              <span className="font-mono font-bold text-red-400">{currentScore} točk</span>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3.5 mb-5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 space-y-1">
          <p className="font-semibold text-white">Kakšen je postopek za izziv?</p>
          <p className="text-slate-400">
            Ko oseba doseže mejo -100 točk, mora opraviti izziv (npr. častiti celotno pijačo, opraviti smešno nalogo, javni govor itd.). Ko skupina potrdi opravljen izziv, se vpiše odkupnina točk (+100 točk), da se vrne v varno območje.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Opis opravljenega izziva
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="npr. Počastil vse z rundo pijače & zapel pesem..."
              autoFocus
              className="w-full h-11 px-4 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-rose-500 text-white text-xs outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Točke odkupnine (dodatek k točkam)
            </label>
            <input
              type="number"
              value={offsetPoints}
              onChange={(e) => setOffsetPoints(parseInt(e.target.value, 10) || 0)}
              className="w-full h-11 px-4 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-rose-500 text-white font-mono text-sm outline-none transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Privzeto +100 točk za izbris kazenskega limita.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              Prekliči
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 transition cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block animate-spin">↻</span>
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              Potrdi opravljen izziv
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
