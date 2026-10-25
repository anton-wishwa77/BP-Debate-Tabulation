import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import BenchBadge from '../../components/common/BenchBadge';
import {
  Scroll,
  UserCheck,
  CheckCircle2,
  Clock,
  Lock,
  Eye,
  RefreshCw,
  AlertCircle,
  FileText
} from 'lucide-react';

const BENCH_ORDER = ['OG', 'OO', 'CG', 'CO'];

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

export default function DrawsBoard() {
  const [rounds, setRounds] = useState([]);
  const [selectedRoundNumber, setSelectedRoundNumber] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [directorPreview, setDirectorPreview] = useState(false);

  const fetchRounds = async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const data = await api.getRounds();
      const list = Array.isArray(data) ? data : [];
      setRounds(list);
      setError(null);

      // Default select the latest round or first round if not already selected
      if (list.length > 0 && selectedRoundNumber === null) {
        setSelectedRoundNumber(list[list.length - 1].round_number);
      }
    } catch (err) {
      setError(err.message || 'Failed to load tournament rounds');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRounds();
  }, []);

  const currentRound = rounds.find((r) => r.round_number === selectedRoundNumber) || rounds[0];

  const isRoundPublic = currentRound && (currentRound.status === 'Published' || currentRound.status === 'Completed' || directorPreview);

  return (
    <div className="space-y-8">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gold-light/40">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-gold-deep/10 border border-gold-deep/30 text-gold-deep font-roman text-xs tracking-widest uppercase mb-1.5">
            <span>Room Allocations &amp; Motions</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900 flex items-center gap-3">
            <Scroll className="w-7 h-7 text-gold-deep" />
            <span>Draws &amp; Motions Board</span>
          </h1>
          <p className="font-sans text-xs sm:text-sm text-ink-600 mt-1">
            Official British Parliamentary room fixtures, adjudicator chairs, and debate motions.
          </p>
        </div>

        <button
          onClick={() => fetchRounds(true)}
          disabled={loading || isRefreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md font-roman text-xs tracking-wider uppercase text-ink-800 bg-canvas-parchment hover:bg-sky-light/40 border border-gold-deep/40 hover:border-gold-deep shadow-xs transition-all duration-200 disabled:opacity-50"
          title="Refresh Draws"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gold-deep ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Sync Draws'}</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg bg-[#F7EAEB] border border-[#E8C4C4] p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#9C3A3A] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-serif font-bold text-[#9C3A3A]">Failed to Load Draws</h4>
            <p className="font-sans text-xs text-ink-800 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => fetchRounds(true)}
            className="font-roman text-xs uppercase tracking-wider text-[#9C3A3A] hover:underline font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        // Loading Skeleton
        <div className="space-y-6 animate-pulse">
          <div className="h-12 w-64 bg-sky-light/60 rounded-lg mx-auto" />
          <div className="h-44 bg-canvas-parchment rounded-xl border border-sky-blue/40 p-6" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-canvas-parchment rounded-xl border border-sky-blue/40" />
            <div className="h-64 bg-canvas-parchment rounded-xl border border-sky-blue/40" />
          </div>
        </div>
      ) : rounds.length === 0 ? (
        // Empty State
        <div className="rounded-xl bg-canvas-parchment border border-sky-blue/50 p-12 text-center max-w-xl mx-auto shadow-xs">
          <Scroll className="w-12 h-12 text-gold-deep/70 mx-auto mb-3" />
          <h3 className="font-serif text-xl font-bold text-ink-900 mb-1">
            No Tournament Rounds Generated Yet
          </h3>
          <p className="font-sans text-xs sm:text-sm text-ink-600">
            The Tabulation Core has not generated any rounds yet. Check back once Round 1 pairings are released.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Round Selector Bar */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {rounds.map((r) => {
              const isSelected = r.round_number === selectedRoundNumber;
              const statusBadgeConfig = {
                Draft: { label: 'Draft', color: 'text-amber-800 bg-amber-100 border-amber-300' },
                Published: { label: 'Published', color: 'text-sky-900 bg-sky-100 border-sky-300' },
                Completed: { label: 'Completed', color: 'text-emerald-900 bg-emerald-100 border-emerald-300' }
              }[r.status] || { label: r.status, color: 'text-ink-600 bg-sky-light border-sky-blue' };

              return (
                <button
                  key={r.round_id}
                  onClick={() => setSelectedRoundNumber(r.round_number)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border font-roman text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 ${
                    isSelected
                      ? 'bg-canvas-parchment border-gold-deep text-ink-900 font-bold shadow-sm ring-1 ring-gold-deep/30'
                      : 'bg-canvas-parchment/60 hover:bg-canvas-parchment border-sky-blue/50 text-ink-600 hover:text-ink-900'
                  }`}
                >
                  <span className="font-bold">Round {toRoman(r.round_number)}</span>
                  <span
                    className={`font-sans text-[10px] uppercase tracking-normal px-2 py-0.5 rounded-full border ${statusBadgeConfig.color}`}
                  >
                    {statusBadgeConfig.label}
                  </span>
                </button>
              );
            })}
          </div>

          {currentRound && (
            <>
              {/* Grand Motion Announcement Card */}
              <div className="relative rounded-2xl bg-canvas-parchment border-2 border-gold-light/60 p-6 sm:p-8 shadow-sm overflow-hidden">
                {/* Classical Hairline Accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-blue via-gold-deep to-sky-blue" />

                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gold-light/40">
                    <span className="font-roman text-xs tracking-[0.2em] uppercase font-bold text-gold-deep flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Motion of the House • Round {toRoman(currentRound.round_number)}</span>
                    </span>

                    <span className="font-sans text-xs text-ink-600">
                      Status: <strong className="text-ink-900 font-semibold">{currentRound.status}</strong>
                    </span>
                  </div>

                  {/* Info Slide Callout (if present) */}
                  {currentRound.info_slide && currentRound.info_slide.trim() !== '' && (
                    <div className="rounded-lg bg-sky-light/40 border border-sky-blue/60 p-4 font-sans text-xs sm:text-sm text-ink-800 leading-relaxed">
                      <div className="font-roman text-[11px] tracking-wider uppercase font-bold text-gold-deep mb-1">
                        Information Slide
                      </div>
                      <p className="whitespace-pre-wrap">{currentRound.info_slide}</p>
                    </div>
                  )}

                  {/* Motion Text */}
                  <div className="py-2 text-center sm:text-left">
                    <p className="font-serif text-2xl sm:text-3xl text-ink-900 italic font-semibold leading-relaxed tracking-wide">
                      "{currentRound.motion_text}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Pairings Content: Sealed Guard or Public Grid */}
              {!isRoundPublic ? (
                // Draft / Sealed Notice Card
                <div className="rounded-xl bg-canvas-parchment border border-amber-300 p-8 sm:p-10 text-center shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-700 mx-auto mb-4">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-ink-900 mb-2">
                    Pairings for Round {toRoman(currentRound.round_number)} are Currently Sealed
                  </h3>
                  <p className="font-sans text-xs sm:text-sm text-ink-600 max-w-lg mx-auto mb-6">
                    Room allocations and bench fixtures remain private while the draw is in Draft status. The Adjudication Core will publish the rooms upon round release.
                  </p>
                  <button
                    onClick={() => setDirectorPreview(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-roman text-xs tracking-wider uppercase text-ink-800 bg-sky-light/60 hover:bg-sky-light border border-sky-blue/70 shadow-xs transition-all"
                  >
                    <Eye className="w-4 h-4 text-gold-deep" />
                    <span>Preview Draft Pairings (Director Mode)</span>
                  </button>
                </div>
              ) : (
                // Published / Preview Room Pairings Grid
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-900 flex items-center gap-2">
                      <span>Room Allocations</span>
                      <span className="font-sans text-xs font-normal text-ink-600">
                        ({currentRound.matches?.length || 0} Matches)
                      </span>
                    </h3>

                    {directorPreview && currentRound.status === 'Draft' && (
                      <span className="font-roman text-[11px] tracking-wider uppercase px-2.5 py-1 rounded bg-amber-100 text-amber-900 border border-amber-300">
                        Director Preview Active
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {(currentRound.matches || []).map((match) => {
                      // Sort participants strictly into OG, OO, CG, CO
                      const sortedParticipants = [...(match.participants || [])].sort((a, b) => {
                        const indexA = BENCH_ORDER.indexOf(a.bench_position);
                        const indexB = BENCH_ORDER.indexOf(b.bench_position);
                        return (indexA === -1 ? 99 : indexA) - (indexB === -1 ? 99 : indexB);
                      });

                      return (
                        <div
                          key={match.match_id}
                          className="rounded-xl bg-canvas-parchment border border-sky-blue/60 hover:border-gold-deep/60 transition-all duration-200 shadow-xs overflow-hidden flex flex-col"
                        >
                          {/* Room Header */}
                          <div className="p-4 sm:p-5 bg-sky-light/30 border-b border-gold-light/30 flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <h4 className="font-serif text-xl font-bold text-ink-900">
                                {match.room_name}
                              </h4>
                              <div className="flex items-center gap-1.5 font-sans text-xs text-ink-600 mt-0.5">
                                <UserCheck className="w-3.5 h-3.5 text-gold-deep" />
                                <span>Chair:</span>
                                <strong className="text-ink-900 font-semibold">
                                  {match.judge?.judge_name || 'Adjudicator TBA'}
                                </strong>
                                {match.judge?.institution && (
                                  <span className="text-ink-400">({match.judge.institution})</span>
                                )}
                              </div>
                            </div>

                            {/* Ballot Status Badge */}
                            <div>
                              {match.is_submitted ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-roman text-[10px] tracking-wider uppercase font-bold bg-[#EBF7EE] text-[#287A3E] border border-[#BDE5C8] shadow-xs">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Result Confirmed</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-roman text-[10px] tracking-wider uppercase font-bold bg-sky-light/80 text-ink-800 border border-sky-blue/60 shadow-xs">
                                  <Clock className="w-3.5 h-3.5 text-gold-deep" />
                                  <span>Ballot Pending</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 4 BP Benches Grid */}
                          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                            {sortedParticipants.map((p) => (
                              <div
                                key={p.participant_id || p.team_id}
                                className="rounded-lg p-3 bg-canvas-marble border border-sky-blue/40 flex flex-col justify-between"
                              >
                                <div className="flex items-center justify-between mb-1.5">
                                  <BenchBadge position={p.bench_position} size="xs" />
                                  {p.rank !== null && p.rank !== undefined && (
                                    <span className="font-roman text-xs font-bold px-1.5 py-0.5 rounded bg-gold-deep/15 text-gold-deep border border-gold-deep/30">
                                      {toRoman(p.rank)}
                                    </span>
                                  )}
                                </div>
                                <div>
                                  <div className="font-serif font-bold text-sm text-ink-900 truncate">
                                    {p.team_name}
                                  </div>
                                  <div className="font-sans text-[11px] text-ink-600 truncate">
                                    {p.team_institution || p.institution}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
