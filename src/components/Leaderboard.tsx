import React, { useState } from 'react';
import { User, UserScore } from '../types';
import { Trophy, AlertOctagon, Skull, Flame, ArrowUpRight, CheckSquare, Sparkles, UserPlus } from 'lucide-react';
import { CompleteChallengeModal } from './CompleteChallengeModal';

interface LeaderboardProps {
  users: User[];
  scores: Record<string, UserScore>;
  currentUser: string;
  userPin: string;
  onSelectUserForPoints: (userName: string) => void;
  onRefresh: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  users,
  scores,
  currentUser,
  userPin,
  onSelectUserForPoints,
  onRefresh
}) => {
  const [resolvingUser, setResolvingUser] = useState<string | null>(null);

  // Combine user objects with computed scores
  const allNames = Array.from(new Set([...users.map(u => u.name), ...Object.keys(scores)]));

  const sortedList = allNames
    .map(name => {
      const scoreObj = scores[name] || { total: 0, count: 0, directChallenges: 0 };
      const userMeta = users.find(u => u.name === name);
      return {
        name,
        total: scoreObj.total,
        count: scoreObj.count,
        directChallenges: scoreObj.directChallenges,
        avatarColor: userMeta?.avatarColor || 'indigo'
      };
    })
    .sort((a, b) => b.total - a.total);

  const penaltyUsers = sortedList.filter(u => u.total <= -100);

  return (
    <div className="space-y-4">
      {/* Aggressive Global Danger Alert Banner if anyone has <= -100 points */}
      {penaltyUsers.length > 0 && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-red-950 via-rose-950 to-red-950 border-2 border-red-500 shadow-2xl shadow-red-950/80 animate-severe-pulse">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-red-600 text-white shrink-0 shadow-lg shadow-red-600/40">
                <AlertOctagon className="w-7 h-7 animate-bounce" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-black text-white tracking-wide flex items-center gap-2">
                  <span>🚨 ALARM: AKTIVEN MORALNI IZZIV! (-100 TOČK)</span>
                </h4>
                <p className="text-xs sm:text-sm text-red-200 mt-0.5">
                  Naslednje osebe so padle pod mejo <b className="text-white">-100 točk</b> in morajo nemudoma opraviti predpisan izziv pred skupino:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {penaltyUsers.map(u => (
                    <span
                      key={u.name}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-red-900/90 border border-red-400 text-white font-bold text-xs"
                    >
                      <Skull className="w-3.5 h-3.5 text-red-300" />
                      {u.name} ({u.total} točk)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Leaderboard Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl backdrop-blur-sm">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Skupna Lestvica Moralnih Točk
              </h3>
              <p className="text-xs text-slate-400">
                Razvrščeno od najvišjega moralnega seštevka do najnižjega.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono text-slate-400">
            Skupaj oseb: <span className="font-bold text-white">{sortedList.length}</span>
          </div>
        </div>

        {/* List of Users */}
        <div className="space-y-3">
          {sortedList.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              Ni še registriranih uporabnikov ali točk.
            </div>
          ) : (
            sortedList.map((user, index) => {
              const isPenalty = user.total <= -100;
              const isPositive = user.total > 0;
              const isNeutral = user.total === 0;
              const isFirst = index === 0 && !isPenalty;
              const isSecond = index === 1 && !isPenalty;
              const isThird = index === 2 && !isPenalty;
              const isMe = user.name === currentUser;

              if (isPenalty) {
                // Aggressive red highlighted row
                return (
                  <div
                    key={user.name}
                    className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-red-950 via-rose-950 to-red-950 border-2 border-red-500 shadow-xl shadow-red-950/70 animate-severe-pulse transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-red-600 text-white font-mono font-bold text-base flex items-center justify-center shrink-0 shadow-md">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-extrabold text-white">
                              {user.name} {isMe ? '(Ti)' : ''}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                              <AlertOctagon className="w-3 h-3" />
                              Obvezen Izziv!
                            </span>
                          </div>
                          <p className="text-xs text-red-200 mt-0.5">
                            ⚠️ Dosežena kritična meja pod -100 točk! Oseba mora opraviti javni izziv.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-red-900/60">
                        <div className="text-right">
                          <div className="text-xl sm:text-2xl font-black font-mono text-red-200 tabular-nums">
                            {user.total} točk
                          </div>
                          <div className="text-[11px] text-red-300">
                            {user.count} {user.count === 1 ? 'vnos' : 'vnosov'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setResolvingUser(user.name)}
                            className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-red-950/40 transition cursor-pointer"
                          >
                            <CheckSquare className="w-3.5 h-3.5" />
                            <span>Opravil izziv?</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onSelectUserForPoints(user.name)}
                            className="p-2 rounded-xl bg-red-900/60 hover:bg-red-800 text-white text-xs transition cursor-pointer"
                            title="Dodaj točke tej osebi"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              // Standard row
              return (
                <div
                  key={user.name}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 ${
                    isMe
                      ? 'bg-slate-800/80 border-slate-700 shadow-md ring-1 ring-slate-600'
                      : 'bg-slate-950/50 border-slate-800/90 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl font-mono font-bold text-sm flex items-center justify-center shrink-0 ${
                          isFirst
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            : isSecond
                            ? 'bg-slate-300/20 text-slate-200 border border-slate-300/30'
                            : isThird
                            ? 'bg-amber-600/20 text-amber-300 border border-amber-600/30'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : `#${index + 1}`}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm sm:text-base font-bold text-white">
                            {user.name}
                          </span>
                          {isMe && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 font-medium">
                              Ti
                            </span>
                          )}
                          {user.directChallenges > 0 && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/30 font-medium flex items-center gap-1"
                              title="Direktni izziv v zgodovini"
                            >
                              <Flame className="w-2.5 h-2.5 text-rose-400" />
                              {user.directChallenges}x izziv
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {user.count} {user.count === 1 ? 'vnos točk' : 'vnosov točk'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div
                          className={`text-base sm:text-lg font-bold font-mono tabular-nums ${
                            isPositive
                              ? 'text-emerald-400'
                              : isNeutral
                              ? 'text-slate-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {isPositive ? `+${user.total}` : user.total}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium">
                          {isPositive ? 'Pozitivno' : isNeutral ? 'Nevtralno' : 'V minusu'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectUserForPoints(user.name)}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        title="Določi točke"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-rose-400" />
                        <span className="hidden sm:inline">Točke</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Complete challenge popup */}
      {resolvingUser && (
        <CompleteChallengeModal
          targetUser={resolvingUser}
          currentScore={scores[resolvingUser]?.total || 0}
          recordedBy={currentUser}
          userPin={userPin}
          onClose={() => setResolvingUser(null)}
          onChallengeCompleted={onRefresh}
        />
      )}
    </div>
  );
};
