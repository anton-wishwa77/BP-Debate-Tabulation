import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/client';
import RosterPanel from '../../components/admin/RosterPanel';
import RoundControlPanel from '../../components/admin/RoundControlPanel';
import RoomMatrix from '../../components/admin/RoomMatrix';
import MaintenancePanel from '../../components/admin/MaintenancePanel';
import {
  Shield,
  Users,
  Scale,
  Layers,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  LogOut,
  AlertCircle,
  KeyRound,
  Scroll,
  Archive,
  BarChart3
} from 'lucide-react';

function toRoman(num) {
  if (!num || num < 1) return String(num);
  const romanMap = [
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let res = '';
  let n = num;
  for (const [val, roman] of romanMap) {
    while (n >= val) {
      res += roman;
      n -= val;
    }
  }
  return res;
}

export default function AdminDashboard() {
  // Authentication State
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState(null);

  // Tab State
  // 1: overview (Tournament Overview & Ballots)
  // 2: rounds (Round Generation & Motions)
  // 3: roster (Roster & Swing Management)
  // 4: maintenance (Maintenance & Archives)
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRoundNumber, setSelectedRoundNumber] = useState(null);

  // Data State
  const [teams, setTeams] = useState([]);
  const [judges, setJudges] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Check auth session
  useEffect(() => {
    const saved = localStorage.getItem('forum_aeterna_admin');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.authenticated) {
          setIsAdminAuth(true);
        }
      } catch (_) {
        localStorage.removeItem('forum_aeterna_admin');
      }
    }
    setAuthLoading(false);
  }, []);

  // Fetch all core data
  const loadData = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const [teamsData, judgesData, roundsData] = await Promise.all([
        api.getTeams(),
        api.getJudges(),
        api.getAdminRounds()
      ]);

      const parsedTeams = Array.isArray(teamsData) ? teamsData : [];
      const parsedJudges = Array.isArray(judgesData) ? judgesData : [];
      const parsedRounds = Array.isArray(roundsData) ? roundsData : [];

      setTeams(parsedTeams);
      setJudges(parsedJudges);
      setRounds(parsedRounds);

      if (parsedRounds.length > 0) {
        setSelectedRoundNumber((prev) =>
          prev && parsedRounds.some((r) => r.round_number === prev)
            ? prev
            : parsedRounds[parsedRounds.length - 1].round_number
        );
      } else {
        setSelectedRoundNumber(null);
      }

      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to synchronize Senate registry data');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isAdminAuth) {
      loadData();
    }
  }, [isAdminAuth, loadData]);

  // Master Login Handler
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await api.loginAdmin(loginForm);
      localStorage.setItem('forum_aeterna_admin', JSON.stringify({ authenticated: true, user: loginForm.username }));
      setIsAdminAuth(true);
    } catch (err) {
      setLoginError(err.message || 'Invalid Senate master credentials');
    }
  };

  // Logout Handler
  const handleAdminLogout = () => {
    localStorage.removeItem('forum_aeterna_admin');
    setIsAdminAuth(false);
  };

  // Loading Initial Auth
  if (authLoading) {
    return (
      <div className="py-20 text-center font-serif text-lg text-ink-600 animate-pulse">
        Consulting Senate Archives...
      </div>
    );
  }

  // Not Authenticated -> Show Imperial Master Login Form
  if (!isAdminAuth) {
    return (
      <div className="max-w-md mx-auto py-12 px-4 space-y-6">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-ink-900 border-2 border-gold-deep flex items-center justify-center mx-auto text-gold-light shadow-md">
            <Shield className="w-8 h-8" />
          </div>
          <span className="font-roman text-xs tracking-widest text-gold-deep uppercase font-bold">
            Executive Directorate
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900">
            Senate Directorate
          </h1>
          <p className="font-sans text-xs text-ink-600 max-w-sm mx-auto">
            Assume executive oversight over debate chamber orchestration, roster balancing, and tournament scoring decrees.
          </p>
        </div>

        {loginError && (
          <div className="rounded-xl bg-[#F7EAEB] border border-[#E8C4C4] p-4 flex items-center gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-[#9C3A3A] shrink-0" />
            <p className="font-sans text-xs text-ink-800">{loginError}</p>
          </div>
        )}

        <div className="rounded-2xl bg-canvas-parchment border-2 border-gold-light/70 p-6 sm:p-8 shadow-sm space-y-6">
          <form onSubmit={handleAdminLogin} className="space-y-4 font-sans text-xs">
            <div className="space-y-1">
              <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700">
                Master Admin Username
              </label>
              <input
                type="text"
                required
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-sky-blue/70 bg-white text-ink-900 focus:outline-hidden focus:border-gold-deep"
              />
            </div>

            <div className="space-y-1">
              <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700">
                Senate Passphrase
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full px-3 py-2 rounded-md border border-sky-blue/70 bg-white text-ink-900 focus:outline-hidden focus:border-gold-deep font-mono"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-md font-roman text-xs tracking-wider uppercase font-bold bg-ink-900 hover:bg-ink-800 text-canvas-parchment border border-gold-deep shadow-xs transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <KeyRound className="w-4 h-4 text-gold-light" />
              <span>Enter Senate Directorate</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Active round calculations
  const latestRound = rounds.length > 0 ? rounds[rounds.length - 1] : null;
  const activeRoundMatches = latestRound?.matches || [];
  const sealedBallotsCount = activeRoundMatches.filter((m) => m.is_submitted).length;
  const totalBallotsCount = activeRoundMatches.length;
  const ballotCompletionRate =
    totalBallotsCount > 0
      ? Math.round((sealedBallotsCount / totalBallotsCount) * 100)
      : 0;

  const swingCount = teams.filter((t) => t.is_swing).length;
  const activeJudgesCount = judges.filter((j) => j.is_active).length;

  return (
    <div className="space-y-8">
      {/* 1. Classical Imperial Crest Banner */}
      <div className="rounded-2xl bg-canvas-parchment border-2 border-gold-light/60 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-blue via-gold-deep to-sky-blue" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-light/40 via-canvas-parchment to-sky-light/80 border-2 border-gold-deep/50 flex items-center justify-center text-gold-deep shadow-xs">
              <Shield className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-roman text-[10px] tracking-widest text-gold-deep uppercase font-bold px-2 py-0.5 rounded bg-gold-deep/10 border border-gold-deep/30">
                  Imperial Assembly
                </span>
                <span className="font-mono text-xs text-ink-400">
                  Tabulation Curia
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-4xl font-bold text-ink-900 mt-1">
                The High Senate & Tabulation Directorate
              </h1>
              <p className="font-sans text-xs text-ink-600">
                Executive Round Orchestration, Roster Balancing & Chamber Control Suite
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadData(true)}
              disabled={loading || isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md font-roman text-xs tracking-wider uppercase text-ink-800 bg-sky-light/40 hover:bg-sky-light border border-sky-blue/60 shadow-xs transition-all disabled:opacity-50"
              title="Sync Directorate Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gold-deep ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
            </button>

            <button
              onClick={handleAdminLogout}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md font-roman text-xs tracking-wider uppercase text-[#9C3A3A] bg-[#F7EAEB] hover:bg-[#F2DFE1] border border-[#E8C4C4] shadow-xs transition-all"
              title="Sign Out of Senate"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Depart Senate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="rounded-xl bg-[#F7EAEB] border border-[#E8C4C4] p-4 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-[#9C3A3A] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-serif font-bold text-[#9C3A3A] text-sm">Senate Registry Disruption</h4>
            <p className="font-sans text-xs text-ink-800 mt-0.5">{error}</p>
          </div>
          <button onClick={() => loadData(true)} className="font-roman text-xs uppercase text-[#9C3A3A] font-bold underline">
            Retry
          </button>
        </div>
      )}

      {/* High-Level Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Registered Teams */}
        <div className="rounded-xl bg-canvas-parchment border border-sky-blue/60 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-ink-600">
            <span className="font-roman text-[10px] tracking-wider uppercase font-bold text-gold-deep">
              Registered Delegations
            </span>
            <Users className="w-4 h-4 text-gold-deep/70" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-ink-900">
              {teams.length}
            </span>
            <span className="font-sans text-xs text-ink-600">Teams</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-block px-2 py-0.5 rounded text-[10px] font-roman uppercase font-bold tracking-wider ${
                swingCount > 0
                  ? 'bg-[#F5ECE8] text-[#8E522C] border border-[#DFCECA]'
                  : 'bg-sky-light/50 text-ink-600 border border-sky-blue/40'
              }`}
            >
              {swingCount} Swing Teams
            </span>
            {teams.length % 4 !== 0 && (
              <span className="text-[10px] font-sans text-[#9C3A3A] font-bold">
                (Needs Balancer)
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Active Adjudicators */}
        <div className="rounded-xl bg-canvas-parchment border border-sky-blue/60 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-ink-600">
            <span className="font-roman text-[10px] tracking-wider uppercase font-bold text-gold-deep">
              Adjudication Pool
            </span>
            <Scale className="w-4 h-4 text-gold-deep/70" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-3xl font-bold text-ink-900">
              {activeJudgesCount}
            </span>
            <span className="font-sans text-xs text-ink-600">Active</span>
          </div>
          <span className="font-sans text-[11px] text-ink-600 block">
            {judges.length} Total Adjudicators on Record
          </span>
        </div>

        {/* Metric 3: Current Active Round & Tournament Status */}
        <div className="rounded-xl bg-canvas-parchment border border-sky-blue/60 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-ink-600">
            <span className="font-roman text-[10px] tracking-wider uppercase font-bold text-gold-deep">
              Chamber State
            </span>
            <Layers className="w-4 h-4 text-gold-deep/70" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-ink-900 truncate">
              {latestRound ? `Round ${toRoman(latestRound.round_number)}` : 'Pre-Tournament'}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {latestRound ? (
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-roman uppercase font-bold tracking-wider bg-gold-deep/15 text-gold-deep border border-gold-deep/30">
                {latestRound.status}
              </span>
            ) : (
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-roman uppercase font-bold tracking-wider bg-sky-light/50 text-ink-600">
                No Draws Created
              </span>
            )}
          </div>
        </div>

        {/* Metric 4: Ballot Completion Rate */}
        <div className="rounded-xl bg-canvas-parchment border border-sky-blue/60 p-5 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-ink-600">
            <span className="font-roman text-[10px] tracking-wider uppercase font-bold text-gold-deep">
              Ballot Completion
            </span>
            <CheckCircle2 className="w-4 h-4 text-gold-deep/70" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl font-bold text-ink-900">
              {totalBallotsCount > 0 ? `${sealedBallotsCount} / ${totalBallotsCount}` : '0 / 0'}
            </span>
            <span className="font-sans text-xs text-ink-600">Sealed</span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-sky-light/60 h-2 rounded-full overflow-hidden border border-sky-blue/50">
            <div
              className="bg-gold-deep h-full rounded-full transition-all duration-500"
              style={{ width: `${ballotCompletionRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Classical Tabbed Navigation */}
      <div className="border-b border-gold-light/40 flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-roman text-xs tracking-wider uppercase font-bold transition-all border-t-2 border-x ${
            activeTab === 'overview'
              ? 'bg-canvas-parchment border-t-gold-deep border-x-sky-blue/60 text-ink-900 border-b-transparent shadow-xs'
              : 'border-transparent text-ink-600 hover:text-ink-900 hover:bg-sky-light/40'
          }`}
        >
          <BarChart3 className="w-4 h-4 text-gold-deep" />
          <span>Tournament Overview & Ballots</span>
        </button>

        <button
          onClick={() => setActiveTab('rounds')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-roman text-xs tracking-wider uppercase font-bold transition-all border-t-2 border-x ${
            activeTab === 'rounds'
              ? 'bg-canvas-parchment border-t-gold-deep border-x-sky-blue/60 text-ink-900 border-b-transparent shadow-xs'
              : 'border-transparent text-ink-600 hover:text-ink-900 hover:bg-sky-light/40'
          }`}
        >
          <Scroll className="w-4 h-4 text-gold-deep" />
          <span>Round Generation & Motions</span>
        </button>

        <button
          onClick={() => setActiveTab('roster')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-roman text-xs tracking-wider uppercase font-bold transition-all border-t-2 border-x ${
            activeTab === 'roster'
              ? 'bg-canvas-parchment border-t-gold-deep border-x-sky-blue/60 text-ink-900 border-b-transparent shadow-xs'
              : 'border-transparent text-ink-600 hover:text-ink-900 hover:bg-sky-light/40'
          }`}
        >
          <Users className="w-4 h-4 text-gold-deep" />
          <span>Roster & Swing Management</span>
        </button>

        <button
          onClick={() => setActiveTab('maintenance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg font-roman text-xs tracking-wider uppercase font-bold transition-all border-t-2 border-x ${
            activeTab === 'maintenance'
              ? 'bg-canvas-parchment border-t-gold-deep border-x-sky-blue/60 text-ink-900 border-b-transparent shadow-xs'
              : 'border-transparent text-ink-600 hover:text-ink-900 hover:bg-sky-light/40'
          }`}
        >
          <Archive className="w-4 h-4 text-gold-deep" />
          <span>Maintenance & Archives</span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <RoomMatrix
          rounds={rounds}
          selectedRoundNumber={selectedRoundNumber}
          onSelectRound={setSelectedRoundNumber}
          judges={judges}
          onRefresh={loadData}
        />
      )}

      {activeTab === 'rounds' && (
        <RoundControlPanel
          rounds={rounds}
          teams={teams}
          judges={judges}
          onRefresh={loadData}
          onSelectRound={(rNum) => {
            setSelectedRoundNumber(rNum);
            setActiveTab('overview');
          }}
        />
      )}

      {activeTab === 'roster' && (
        <RosterPanel
          teams={teams}
          judges={judges}
          onRefresh={loadData}
        />
      )}

      {activeTab === 'maintenance' && (
        <MaintenancePanel onRefresh={loadData} />
      )}
    </div>
  );
}
