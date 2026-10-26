import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppState, Rule, User } from './types';
import { LoginModal } from './components/LoginModal';
import { RulesSection } from './components/RulesSection';
import { PointsForm } from './components/PointsForm';
import { Leaderboard } from './components/Leaderboard';
import { AuditLog } from './components/AuditLog';
import { StreamlitCodeModal } from './components/StreamlitCodeModal';
import {
  Scale,
  Trophy,
  PlusCircle,
  BookOpen,
  History,
  LogOut,
  RefreshCw,
  Code2,
  AlertTriangle,
  Flame,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('moral_user') || null;
  });
  const [userPin, setUserPin] = useState<string | null>(() => {
    return localStorage.getItem('moral_pin') || null;
  });

  const [state, setState] = useState<AppState>({
    users: [],
    rules: [],
    history: [],
    scores: {}
  });

  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'leaderboard' | 'form' | 'rules' | 'history'>('all');
  const [showStreamlitModal, setShowStreamlitModal] = useState(false);

  const formRef = useRef<HTMLDivElement>(null);

  // Fetch current state from server
  const fetchState = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = await res.json();
        setState(data);
      }
    } catch (err) {
      console.error('Napaka pri pridobivanju stanja:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load and periodic synchronization (every 6 seconds for multi-user live sync)
  useEffect(() => {
    fetchState();
    const interval = setInterval(() => {
      fetchState(true);
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchState]);

  // Handle successful login
  const handleLoginSuccess = (name: string, pin: string) => {
    setCurrentUser(name);
    setUserPin(pin);
    localStorage.setItem('moral_user', name);
    localStorage.setItem('moral_pin', pin);
    fetchState();
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUserPin(null);
    localStorage.removeItem('moral_user');
    localStorage.removeItem('moral_pin');
  };

  // When a rule is clicked in RulesSection, populate form and smooth-scroll to form
  const handleSelectRule = (rule: Rule) => {
    setSelectedRule(rule);
    if (activeTab !== 'all') {
      setActiveTab('form');
    }
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleSelectUserForPoints = (userName: string) => {
    if (activeTab !== 'all') {
      setActiveTab('form');
    }
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // If not authenticated, display login modal
  const existingUserNames = state.users.map((u) => u.name);

  const myScore = currentUser && state.scores[currentUser] ? state.scores[currentUser].total : 0;
  const penaltyCount = Object.values(state.scores).filter((s) => s.total <= -100).length;

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col antialiased">
      {/* 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark with icon */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-950/40">
            <Scale className="w-5 h-5" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
            Moralne Točke
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <button
            onClick={() => setActiveTab('all')}
            className={`whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'all' ? 'text-white' : 'hover:text-slate-200'
            }`}
          >
            Vse naenkrat
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
              activeTab === 'leaderboard' ? 'text-white' : 'hover:text-slate-200'
            }`}
          >
            Lestvica
            {penaltyCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('form')}
            className={`whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'form' ? 'text-white' : 'hover:text-slate-200'
            }`}
          >
            Vnos točk
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'rules' ? 'text-white' : 'hover:text-slate-200'
            }`}
          >
            Pravilnik
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'history' ? 'text-white' : 'hover:text-slate-200'
            }`}
          >
            Zgodovina
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action / User Profile */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setShowStreamlitModal(true)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-300 hover:text-white transition cursor-pointer"
            title="Prikaži Streamlit kodo app.py"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Python Koda</span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-white leading-none">
                  {currentUser}
                </span>
                <span
                  className={`text-[11px] font-mono font-bold leading-none mt-1 tabular-nums ${
                    myScore > 0 ? 'text-emerald-400' : myScore < 0 ? 'text-rose-400' : 'text-slate-400'
                  }`}
                >
                  {myScore > 0 ? `+${myScore}` : myScore} točk
                </span>
              </div>

              <button
                onClick={handleLogout}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-rose-400 border border-slate-800 transition cursor-pointer"
                title="Odjava"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-400">Ni prijave</div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-24 sm:pb-12">
        {/* Sub-header info strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50 border border-slate-800/60 rounded-2xl p-3.5 sm:px-5">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Lokalna JSON sinhronizacija aktivna
            </span>
            <span>·</span>
            <span>{state.users.length} oseb</span>
            <span>·</span>
            <span>{state.history.length} zabeležb</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchState()}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isRefreshing ? 'Osveževanje...' : 'Osveži podatke'}</span>
            </button>
          </div>
        </div>

        {/* View content based on active tab */}
        {activeTab === 'all' && (
          <div className="space-y-8">
            {/* 1. Pravila na vrhu strani po navodilih */}
            <section id="rules">
              <RulesSection
                rules={state.rules}
                currentUser={currentUser || ''}
                userPin={userPin || ''}
                onSelectRule={handleSelectRule}
                onRulesUpdated={(newRules) => setState((prev) => ({ ...prev, rules: newRules }))}
              />
            </section>

            {/* 2. Grid for Vnosni obrazec & Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form */}
              <div ref={formRef} className="lg:col-span-5 space-y-6">
                <PointsForm
                  users={state.users}
                  currentUser={currentUser || ''}
                  userPin={userPin || ''}
                  selectedRule={selectedRule}
                  onClearSelectedRule={() => setSelectedRule(null)}
                  onPointsAdded={() => fetchState()}
                />
              </div>

              {/* Right Column: Leaderboard */}
              <div className="lg:col-span-7 space-y-6">
                <Leaderboard
                  users={state.users}
                  scores={state.scores}
                  currentUser={currentUser || ''}
                  userPin={userPin || ''}
                  onSelectUserForPoints={handleSelectUserForPoints}
                  onRefresh={() => fetchState()}
                />
              </div>
            </div>

            {/* 3. Audit Log (Revizijska sled) */}
            <section id="history">
              <AuditLog
                history={state.history}
                currentUser={currentUser || ''}
                userPin={userPin || ''}
                onRefresh={() => fetchState()}
              />
            </section>
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <Leaderboard
              users={state.users}
              scores={state.scores}
              currentUser={currentUser || ''}
              userPin={userPin || ''}
              onSelectUserForPoints={handleSelectUserForPoints}
              onRefresh={() => fetchState()}
            />
          </div>
        )}

        {activeTab === 'form' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <PointsForm
              users={state.users}
              currentUser={currentUser || ''}
              userPin={userPin || ''}
              selectedRule={selectedRule}
              onClearSelectedRule={() => setSelectedRule(null)}
              onPointsAdded={() => {
                fetchState();
                setActiveTab('all');
              }}
            />
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <RulesSection
              rules={state.rules}
              currentUser={currentUser || ''}
              userPin={userPin || ''}
              onSelectRule={(rule) => {
                handleSelectRule(rule);
                setActiveTab('form');
              }}
              onRulesUpdated={(newRules) => setState((prev) => ({ ...prev, rules: newRules }))}
            />
          </div>
        )}

        {activeTab === 'history' && (
          <div className="max-w-5xl mx-auto space-y-6">
            <AuditLog
              history={state.history}
              currentUser={currentUser || ''}
              userPin={userPin || ''}
              onRefresh={() => fetchState()}
            />
          </div>
        )}
      </main>

      {/* Mobile Bottom Tab Bar for Quick Touch Ergonomics */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 grid grid-cols-4 h-16 px-2">
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            activeTab === 'leaderboard' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Lestvica</span>
        </button>

        <button
          onClick={() => setActiveTab('form')}
          className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            activeTab === 'form' ? 'text-rose-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Točke</span>
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            activeTab === 'rules' ? 'text-amber-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Pravila</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center justify-center py-1 transition-colors cursor-pointer ${
            activeTab === 'history' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] font-medium mt-1">Zgodovina</span>
        </button>
      </div>

      {/* Login Modal when unauthenticated */}
      {!currentUser && (
        <LoginModal
          onLoginSuccess={handleLoginSuccess}
          existingUsers={existingUserNames}
        />
      )}

      {/* Streamlit Python code modal */}
      {showStreamlitModal && (
        <StreamlitCodeModal onClose={() => setShowStreamlitModal(false)} />
      )}
    </div>
  );
}
