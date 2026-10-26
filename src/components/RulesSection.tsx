import React, { useState } from 'react';
import { Rule } from '../types';
import { BookOpen, Edit3, Plus, Trash2, Check, X, Zap, Flame, ShieldAlert } from 'lucide-react';

interface RulesSectionProps {
  rules: Rule[];
  currentUser: string;
  userPin: string;
  onSelectRule: (rule: Rule) => void;
  onRulesUpdated: (newRules: Rule[]) => void;
}

export const RulesSection: React.FC<RulesSectionProps> = ({
  rules,
  currentUser,
  userPin,
  onSelectRule,
  onRulesUpdated
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableRules, setEditableRules] = useState<Rule[]>(rules);
  const [newLabel, setNewLabel] = useState('');
  const [newPoints, setNewPoints] = useState<number>(-5);
  const [newIsDirect, setNewIsDirect] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync when prop updates and not actively editing
  React.useEffect(() => {
    if (!isEditing) {
      setEditableRules(rules);
    }
  }, [rules, isEditing]);

  const handleStartEdit = () => {
    setEditableRules([...rules]);
    setIsEditing(true);
    setSaveError(null);
  };

  const handleCancelEdit = () => {
    setEditableRules(rules);
    setIsEditing(false);
    setSaveError(null);
  };

  const handleUpdateRuleItem = (index: number, field: keyof Rule, value: any) => {
    const updated = [...editableRules];
    updated[index] = { ...updated[index], [field]: value };
    setEditableRules(updated);
  };

  const handleDeleteRule = (index: number) => {
    const updated = editableRules.filter((_, i) => i !== index);
    setEditableRules(updated);
  };

  const handleAddNewRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const newRule: Rule = {
      id: `rule-${Date.now()}`,
      label: newLabel.trim(),
      points: Number(newPoints) || 0,
      isDirectChallenge: newIsDirect
    };

    setEditableRules([...editableRules, newRule]);
    setNewLabel('');
    setNewPoints(-5);
    setNewIsDirect(false);
  };

  const handleSaveAllRules = async () => {
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch('/api/rules/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updatedBy: currentUser,
          pin: userPin,
          rules: editableRules
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Shranjevanje pravil ni uspelo.');
      }

      onRulesUpdated(data.rules || editableRules);
      setIsEditing(false);
    } catch (err: any) {
      setSaveError(err.message || 'Napaka pri shranjevanju na strežnik.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Kriteriji & Pravila Točkovanja
            </h3>
            <p className="text-xs text-slate-400">
              Kliknite na pravilo za hitri vnos ali prilagodite pravilnik s klikom na gumb.
            </p>
          </div>
        </div>

        <div>
          {!isEditing ? (
            <button
              onClick={handleStartEdit}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              Uredi pravila
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={handleCancelEdit}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-medium transition cursor-pointer"
              >
                Prekliči
              </button>
              <button
                onClick={handleSaveAllRules}
                disabled={saving}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-emerald-900/30"
              >
                {saving ? (
                  <span className="inline-block animate-spin">↻</span>
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                Shrani pravila
              </button>
            </div>
          )}
        </div>
      </div>

      {saveError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* VIEW MODE: Rules Grid with interactive quick-action */}
      {!isEditing ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {rules.map((rule) => {
            const isNegative = rule.points < 0;
            const isPositive = rule.points > 0;
            const isChallenge = rule.isDirectChallenge || rule.label.toLowerCase().includes('challenge');

            return (
              <button
                key={rule.id}
                type="button"
                onClick={() => onSelectRule(rule)}
                className={`group relative text-left p-3 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-[0.98] ${
                  isChallenge
                    ? 'bg-rose-950/30 border-rose-500/40 hover:border-rose-400 hover:bg-rose-950/50'
                    : isPositive
                    ? 'bg-emerald-950/20 border-emerald-500/30 hover:border-emerald-400 hover:bg-emerald-950/40'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
                title="Klikni za hitri vnos v obrazec"
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="text-xs font-medium text-slate-200 line-clamp-1 group-hover:text-white capitalize">
                    {rule.label}
                  </span>
                  {isChallenge && (
                    <Flame className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />
                  )}
                </div>

                <div className="flex items-center justify-between mt-1">
                  {isChallenge ? (
                    <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wide">
                      Direkt Izziv
                    </span>
                  ) : (
                    <span
                      className={`text-sm font-bold font-mono tabular-nums ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? `+${rule.points}` : rule.points}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 group-hover:text-amber-400 font-medium transition-colors">
                    + Uporabi
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        /* EDIT MODE: Detailed form for rules management */
        <div className="space-y-4">
          <div className="text-xs text-amber-400/90 font-medium bg-amber-950/30 border border-amber-500/20 rounded-xl p-3">
            💡 Spremenite besedilo, točke ali označite kot "Direktni izziv". Spremembe se bodo trajno shranile v skupno JSON bazo.
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {editableRules.map((rule, idx) => (
              <div
                key={rule.id || idx}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800"
              >
                <input
                  type="text"
                  value={rule.label}
                  onChange={(e) => handleUpdateRuleItem(idx, 'label', e.target.value)}
                  placeholder="Ime pravila"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                />

                <input
                  type="number"
                  value={rule.points}
                  onChange={(e) => handleUpdateRuleItem(idx, 'points', parseInt(e.target.value, 10) || 0)}
                  placeholder="Točke"
                  className="w-20 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono text-center text-white focus:outline-none focus:border-amber-500"
                />

                <label className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(rule.isDirectChallenge)}
                    onChange={(e) => handleUpdateRuleItem(idx, 'isDirectChallenge', e.target.checked)}
                    className="rounded text-rose-500 focus:ring-rose-500 bg-slate-800 border-slate-700"
                  />
                  <span>Izziv</span>
                </label>

                <button
                  type="button"
                  onClick={() => handleDeleteRule(idx)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                  title="Odstrani pravilo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Rule */}
          <form onSubmit={handleAddNewRule} className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Novo pravilo (npr. 'zamuda na kavo')..."
              className="flex-1 min-w-[180px] px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <input
              type="number"
              value={newPoints}
              onChange={(e) => setNewPoints(parseInt(e.target.value, 10) || 0)}
              placeholder="Točke"
              className="w-20 px-2 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-center text-white focus:outline-none focus:border-amber-500"
            />
            <label className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={newIsDirect}
                onChange={(e) => setNewIsDirect(e.target.checked)}
                className="rounded text-rose-500 focus:ring-rose-500"
              />
              <span>Direkt izziv</span>
            </label>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Dodaj v seznam
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
