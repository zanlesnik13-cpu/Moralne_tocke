import React, { useState } from 'react';
import { HistoryEntry } from '../types';
import { History, Search, ArrowRight, Flame, ShieldAlert, Trash2, Calendar, User, CheckCircle2 } from 'lucide-react';

interface AuditLogProps {
  history: HistoryEntry[];
  currentUser: string;
  userPin: string;
  onRefresh: () => void;
}

export const AuditLog: React.FC<AuditLogProps> = ({
  history,
  currentUser,
  userPin,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('sl-SI', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  // Collect distinct users for filter
  const allInvolvedUsers = Array.from(
    new Set([
      ...history.map(h => h.targetUser).filter(Boolean),
      ...history.map(h => h.recordedBy).filter(Boolean)
    ])
  );

  // Filtered entries
  const filteredHistory = history.filter(item => {
    const matchesSearch =
      (item.reason || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.targetUser || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.recordedBy || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesUser =
      filterUser === 'all' ||
      item.targetUser === filterUser ||
      item.recordedBy === filterUser;

    return matchesSearch && matchesUser;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Ali ste prepričani, da želite razveljaviti ta vnos točk?')) {
      return;
    }

    setDeletingId(id);
    setDeleteError(null);

    try {
      const res = await fetch('/api/history/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          requestedBy: currentUser,
          pin: userPin
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Brisanje ni uspelo.');
      }

      onRefresh();
    } catch (err: any) {
      setDeleteError(err.message || 'Napaka pri brisanju vnosa.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              Zgodovina & Revizijska Sled (Audit Log)
            </h3>
            <p className="text-xs text-slate-400">
              Vsi vnosi so transparentno zabeleženi z avtorjem, časom in razlogom.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Išči po razlogu ali imenu..."
              className="h-9 px-3 pl-8 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3 pointer-events-none" />
          </div>

          {/* User filter */}
          {allInvolvedUsers.length > 0 && (
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="h-9 px-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="all">Vsi vpleteni</option>
              {allInvolvedUsers.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {deleteError && (
        <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{deleteError}</span>
        </div>
      )}

      {/* Audit Log Entries List */}
      <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            {searchTerm || filterUser !== 'all'
              ? 'Ni najdenih vnosov za izbrane filtre.'
              : 'Zgodovina je prazna. Vnesite prve točke!'}
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isPositive = item.points > 0;
            const isNeutral = item.points === 0;
            const isChallenge = item.isDirectChallenge;
            const isSystemOrRule = item.targetUser.includes('Pravila');

            return (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/90 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {/* Points Indicator */}
                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg tabular-nums ${
                        isPositive
                          ? 'bg-emerald-950/70 border border-emerald-500/40 text-emerald-300'
                          : isNeutral
                          ? 'bg-slate-800 text-slate-300'
                          : 'bg-rose-950/70 border border-rose-500/40 text-rose-300'
                      }`}
                    >
                      {isPositive ? `+${item.points}` : item.points} točk
                    </span>

                    {/* Transaction parties: Kdo dal Komu */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-semibold text-slate-300">
                        {item.recordedBy}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="font-bold text-white">
                        {item.targetUser}
                      </span>
                    </div>

                    {isChallenge && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30 flex items-center gap-1 font-semibold">
                        <Flame className="w-3 h-3 text-rose-400" />
                        Direkt izziv
                      </span>
                    )}
                  </div>

                  {/* Reason description */}
                  <p className="text-xs text-slate-200 mt-1 pl-0.5">
                    {item.reason}
                  </p>

                  {/* Audit Metadata */}
                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(item.timestamp)}
                    </span>
                    <span>·</span>
                    <span className="text-slate-400">
                      Avtor: <b className="text-slate-300">{item.recordedBy}</b>
                    </span>
                  </div>
                </div>

                {/* Revoke / Undo action */}
                {!isSystemOrRule && (
                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition cursor-pointer"
                      title="Razveljavi ta vnos"
                    >
                      {deletingId === item.id ? (
                        <span className="inline-block animate-spin text-xs">↻</span>
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
