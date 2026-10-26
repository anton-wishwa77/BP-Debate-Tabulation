import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import {
  Scale,
  LogOut,
  RefreshCw,
  Clock,
  CheckCircle2,
  ChevronRight,
  Landmark,
  FileText,
  AlertCircle
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

export default function JudgeDashboard() {
  const navigate = useNavigate();
  const [judge, setJudge] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('forum_aeterna_judge');
    if (!saved) {
      navigate('/judge', { replace: true });
      return;
    }

    try {
      const parsed = JSON.parse(saved);
      if (!parsed?.judge_id) {
        navigate('/judge', { replace: true });
        return;
      }
      setJudge(parsed);
      loadMatches(parsed.judge_id);
    } catch (_) {
      navigate('/judge', { replace: true });
    }
  }, [navigate]);

  const loadMatches = async (judgeId, showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const data = await api.getJudgeMatches(judgeId);
      setMatches(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to retrieve assigned chamber matches');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('forum_aeterna_judge');
    navigate('/judge');
  };

  if (!judge) return null;

  return (
    <div className="space-y-8">
      {/* Top Banner: Adjudicator Profile & Controls */}
      <div className="rounded-2xl bg-canvas-parchment border-2 border-gold-light/60 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-blue via-gold-deep to-sky-blue" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-light/40 via-canvas-parchment to-sky-light/80 border-2 border-gold-deep/50 flex items-center justify-center text-gold-deep shadow-xs">
              <Scale className="w-7 h-7" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-roman text-[10px] tracking-widest text-gold-deep uppercase font-bold px-2 py-0.5 rounded bg-gold-deep/10 border border-gold-deep/30">
                  Chair Adjudicator
                </span>
                <span className="font-mono text-xs text-ink-400">
                  @{judge.username}
                </span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 mt-1">
                {judge.judge_name}
              </h1>
              <p className="font-sans text-xs text-ink-600">
                {judge.institution}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadMatches(judge.judge_id, true)}
              disabled={loading || isRefreshing}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md font-roman text-xs tracking-wider uppercase text-ink-800 bg-sky-light/40 hover:bg-sky-light border border-sky-blue/60 shadow-xs transition-all disabled:opacity-50"
              title="Refresh Assigned Chambers"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-gold-deep ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md font-roman text-xs tracking-wider uppercase text-[#9C3A3A] bg-[#F7EAEB] hover:bg-[#F2DFE1] border border-[#E8C4C4] shadow-xs transition-all"
              title="Sign Out of Tribunal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Depart Chamber</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg bg-[#F7EAEB] border border-[#E8C4C4] p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#9C3A3A] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-serif font-bold text-[#9C3A3A]">Chamber Connection Error</h4>
            <p className="font-sans text-xs text-ink-800 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => loadMatches(judge.judge_id, true)}
            className="font-roman text-xs uppercase tracking-wider text-[#9C3A3A] hover:underline font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Assigned Chambers Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gold-light/40">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink-900 flex items-center gap-2">
              <Landmark className="w-5 h-5 text-gold-deep" />
              <span>Assigned Debate Chambers</span>
            </h2>
            <p className="font-sans text-xs text-ink-600 mt-0.5">
              Select an active room fixture to record speaker marks, ranks, and seal the electronic ballot.
            </p>
          </div>
        </div>

        {loading ? (
          // Loading Skeletons
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
            <div className="h-48 rounded-xl bg-canvas-parchment border border-sky-blue/40 p-6" />
            <div className="h-48 rounded-xl bg-canvas-parchment border border-sky-blue/40 p-6" />
          </div>
        ) : matches.length === 0 ? (
          // Empty State
          <div className="rounded-xl bg-canvas-parchment border border-sky-blue/50 p-10 text-center max-w-lg mx-auto shadow-xs">
            <Scale className="w-10 h-10 text-gold-deep/60 mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-ink-900 mb-1">
              No Chambers Currently Assigned
            </h3>
            <p className="font-sans text-xs text-ink-600">
              The Tabulation Curia has not assigned your profile to a room in the current round, or the round draw has not yet been generated.
            </p>
          </div>
        ) : (
          // Matches Grid
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((match) => {
              const isSealed = match.is_submitted;

              return (
                <div
                  key={match.match_id}
                  className="rounded-xl bg-canvas-parchment border border-sky-blue/60 hover:border-gold-deep/60 transition-all duration-200 shadow-xs p-6 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    {/* Header: Round & Status Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-roman text-xs tracking-wider uppercase font-bold px-2.5 py-1 rounded bg-gold-deep/15 text-gold-deep border border-gold-deep/30">
                        Round {toRoman(match.round_number)}
                      </span>

                      {isSealed ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-roman text-[10px] tracking-wider uppercase font-bold bg-[#EBF7EE] text-[#287A3E] border border-[#BDE5C8] shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Verdict Sealed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-roman text-[10px] tracking-wider uppercase font-bold bg-[#FBF3EB] text-[#8E522C] border border-[#E8D4C5] shadow-xs">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Pending Adjudication</span>
                        </span>
                      )}
                    </div>

                    {/* Room Name */}
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-ink-900">
                        {match.room_name}
                      </h3>
                    </div>

                    {/* Motion Snippet */}
                    <div className="rounded-lg bg-sky-light/30 border border-sky-blue/40 p-3 font-sans text-xs text-ink-800">
                      <div className="flex items-center gap-1.5 font-roman text-[10px] tracking-wider uppercase font-bold text-gold-deep mb-1">
                        <FileText className="w-3 h-3" />
                        <span>Motion</span>
                      </div>
                      <p className="font-serif italic text-sm text-ink-900 line-clamp-2">
                        "{match.motion_text}"
                      </p>
                    </div>

                    {/* Participant Teams Preview */}
                    <div className="pt-2">
                      <span className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-400 block mb-1.5">
                        Competing Benches
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 font-sans text-xs">
                        {match.participants?.map((p) => (
                          <div key={p.participant_id} className="flex items-center gap-1.5 truncate">
                            <span className="font-mono text-[10px] font-bold text-gold-deep">
                              [{p.bench_position}]
                            </span>
                            <span className="truncate text-ink-800 font-medium">
                              {p.team_name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-6 mt-4 border-t border-sky-blue/40">
                    <Link
                      to={`/judge/matches/${match.match_id}/ballot`}
                      className={`w-full py-2.5 px-4 rounded-md font-roman text-xs tracking-wider uppercase font-bold shadow-xs transition-all flex items-center justify-center gap-2 ${
                        isSealed
                          ? 'bg-sky-light/60 hover:bg-sky-light text-ink-800 border border-sky-blue/70'
                          : 'bg-ink-900 hover:bg-ink-800 text-canvas-parchment border border-gold-deep'
                      }`}
                    >
                      <span>{isSealed ? 'Inspect Sealed Ballot' : 'Enter Chamber & Ballot'}</span>
                      <ChevronRight className="w-4 h-4 text-gold-light" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
