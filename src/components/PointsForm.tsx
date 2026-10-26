import React, { useState, useEffect } from 'react';
import { Rule, User } from '../types';
import { PlusCircle, User as UserIcon, Award, FileText, CheckCircle2, AlertCircle, Sparkles, Flame } from 'lucide-react';

interface PointsFormProps {
  users: User[];
  currentUser: string;
  userPin: string;
  selectedRule: Rule | null;
  onClearSelectedRule: () => void;
  onPointsAdded: () => void;
}

export const PointsForm: React.FC<PointsFormProps> = ({
  users,
  currentUser,
  userPin,
  selectedRule,
  onClearSelectedRule,
  onPointsAdded
}) => {
  const [targetUser, setTargetUser] = useState<string>('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [customNewUserName, setCustomNewUserName] = useState('');
  const [points, setPoints] = useState<number | string>(-5);
  const [reason, setReason] = useState<string>('');
  const [isDirectChallenge, setIsDirectChallenge] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // When a rule is clicked from RulesSection, populate points & reason
  useEffect(() => {
    if (selectedRule) {
      setPoints(selectedRule.points);
      setReason(selectedRule.label);
      setIsDirectChallenge(Boolean(selectedRule.isDirectChallenge));
    }
  }, [selectedRule]);

  // Set default target user if none selected
  useEffect(() => {
    if (!targetUser && users.length > 0) {
      // Pick first user who isn't current user, or just first user
      const other = users.find((u) => u.name !== currentUser);
      setTargetUser(other ? other.name : users[0].name);
    }
  }, [users, currentUser, targetUser]);

  const handleQuickPointAdjust = (val: number) => {
    setPoints(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    const recipient = isNewUser ? customNewUserName.trim() : targetUser;
    const cleanReason = reason.trim();
    const numericPoints = typeof points === 'number' ? points : parseInt(points, 10);

    if (!recipient) {
      setStatusMessage({ type: 'error', text: 'Izberite ali vnesite osebo, ki ji dodeljujete točke.' });
      return;
    }

    if (isNaN(numericPoints)) {
      setStatusMessage({ type: 'error', text: 'Vnesite veljavno število točk (pozitivno ali negativno).' });
      return;
    }

    if (!cleanReason) {
      setStatusMessage({ type: 'error', text: 'Vnesite razlog za dodelitev moralnih točk.' });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/points/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordedBy: currentUser,
          pin: userPin,
          targetUser: recipient,
          points: numericPoints,
          reason: cleanReason,
          isDirectChallenge
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Napaka pri beleženju točk.');
      }

      setStatusMessage({
        type: 'success',
        text: `✅ Uspešno zabeleženo ${numericPoints > 0 ? `+${numericPoints}` : numericPoints} točk za ${recipient}!`
      });

      // Reset form partially
      setReason('');
      if (isNewUser) {
        setIsNewUser(false);
        setCustomNewUserName('');
        setTargetUser(recipient);
      }
      onClearSelectedRule();
      onPointsAdded();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Napaka pri pošiljanju podatkov.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-sm relative overflow-hidden">
      <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
            <PlusCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Beleženje Moralnih Točk</h3>
            <p className="text-xs text-slate-400">
              Vnos bo trajno zabeležen pod vašim imenom (<span className="text-rose-400 font-medium">{currentUser}</span>)
            </p>
          </div>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`mb-4 p-3.5 rounded-2xl text-xs sm:text-sm flex items-start gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border border-rose-500/40 text-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Recipient Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex justify-between items-center">
            <span>Komu dodeljuješ točke?</span>
            <button
              type="button"
              onClick={() => {
                setIsNewUser(!isNewUser);
                setStatusMessage(null);
              }}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
            >
              {isNewUser ? '← Izberi obstoječo osebo' : '+ Nova oseba...'}
            </button>
          </label>

          {!isNewUser ? (
            <div className="relative">
              <select
                value={targetUser}
                onChange={(e) => setTargetUser(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-white text-sm outline-none transition-colors appearance-none cursor-pointer"
              >
                {users.map((u) => (
                  <option key={u.name} value={u.name}>
                    {u.name} {u.name === currentUser ? '(Jaz)' : ''}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-4 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={customNewUserName}
                onChange={(e) => setCustomNewUserName(e.target.value)}
                placeholder="Vnesi ime novega prijatelja / sošolca..."
                autoFocus
                className="w-full h-12 px-4 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-rose-500 text-white text-sm outline-none transition-colors"
              />
            </div>
          )}
        </div>

        {/* Points Field with Quick Preset Buttons */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Število Točk (Pozitivno ali Negativno)
          </label>

          {/* Quick presets */}
          <div className="grid grid-cols-6 gap-1.5 mb-2">
            {[-20, -10, -5, 5, 10, 50].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => handleQuickPointAdjust(val)}
                className={`py-1.5 px-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                  Number(points) === val
                    ? val > 0
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-md shadow-emerald-500/20'
                      : 'bg-rose-500 text-white border-rose-400 font-extrabold shadow-md shadow-rose-500/20'
                    : val > 0
                    ? 'bg-slate-950/60 border-slate-800 text-emerald-400 hover:bg-emerald-950/30'
                    : 'bg-slate-950/60 border-slate-800 text-rose-400 hover:bg-rose-950/30'
                }`}
              >
                {val > 0 ? `+${val}` : val}
              </button>
            ))}
          </div>

          <div className="relative">
            <input
              type="number"
              step="1"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              placeholder="npr. -10 ali +15"
              className="w-full h-12 px-4 font-mono font-bold text-base rounded-xl bg-slate-950/80 border border-slate-800 focus:border-rose-500 text-white outline-none transition-colors"
            />
            <Award className="w-4 h-4 text-slate-500 absolute right-4 top-4 pointer-events-none" />
          </div>
        </div>

        {/* Reason Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Razlog za dodelitev
          </label>
          <div className="relative">
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="npr. Vaje - ni prinesel poročila ali Častiš 20eur pijačo..."
              className="w-full h-12 px-4 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-rose-500 text-white text-sm outline-none transition-colors"
            />
            <FileText className="w-4 h-4 text-slate-500 absolute right-4 top-4 pointer-events-none" />
          </div>
        </div>

        {/* Direct challenge toggle */}
        <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-rose-400" />
            <div>
              <span className="text-xs font-medium text-slate-200">Direktni izziv</span>
              <p className="text-[11px] text-slate-500">Označi vnos kot takojšen izziv (npr. tožarjenje)</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isDirectChallenge}
              onChange={(e) => setIsDirectChallenge(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
          </label>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-[0.99] transition cursor-pointer disabled:opacity-50"
        >
          {loading ? (
            <span className="inline-block animate-spin mr-1">↻</span>
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          {loading ? 'Beleženje točk...' : 'Potrdi in shrani v zgodovino'}
        </button>
      </form>
    </div>
  );
};
