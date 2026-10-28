import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import BenchBadge from './BenchBadge';
import {
  X,
  Trophy,
  Award,
  Mic,
  Shield,
  Layers,
  Sparkles,
  AlertCircle,
  Clock,
  ChevronRight
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

export default function TeamDossierModal({ teamId, isOpen, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isOpen || !teamId) {
      setData(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    api.getTeamStats(teamId)
      .then((res) => {
        if (isMounted) {
          setData(res);
          setError(null);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to retrieve team dossier');
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, teamId]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dossier-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-canvas-parchment border-2 border-gold-deep shadow-2xl overflow-hidden ring-1 ring-gold-light/40 animate-in zoom-in-95 duration-200">
        {/* Classical Renaissance Hairline Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-blue via-gold-deep to-sky-blue" />

        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-gold-light/40 flex items-start justify-between gap-4 bg-sky-light/20">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-light/40 via-canvas-parchment to-sky-light/80 border border-gold-deep/50 flex items-center justify-center text-gold-deep shadow-xs shrink-0 mt-0.5">
              <Shield className="w-6 h-6 text-gold-deep" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-roman text-[10px] tracking-[0.2em] text-gold-deep uppercase font-bold">
                  Curia Tabularii • Team Dossier
                </span>
                {data?.is_swing && (
                  <span className="font-roman text-[10px] tracking-wider uppercase px-2 py-0.5 rounded border border-gold-light/60 bg-gold-light/20 text-gold-deep font-semibold">
                    Swing Team
                  </span>
                )}
              </div>

              {loading ? (
                <div className="h-8 w-48 bg-sky-light/80 rounded animate-pulse mt-1" />
              ) : (
                <h2
                  id="dossier-modal-title"
                  className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 leading-tight"
                >
                  {data?.name || data?.team_name || 'Delegation Profile'}
                </h2>
              )}

              {loading ? (
                <div className="h-4 w-32 bg-sky-light/50 rounded animate-pulse mt-1" />
              ) : (
                <p className="font-sans text-xs sm:text-sm text-ink-600">
                  {data?.institution || 'Academic Institution'}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-sky-light/60 transition-colors shrink-0"
            aria-label="Close dossier modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {error ? (
            <div className="rounded-xl bg-[#F7EAEB] border border-[#E8C4C4] p-5 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#9C3A3A] shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-serif font-bold text-[#9C3A3A]">Failed to Load Dossier</h4>
                <p className="font-sans text-xs text-ink-800 mt-1">{error}</p>
              </div>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  api.getTeamStats(teamId)
                    .then(setData)
                    .catch((err) => setError(err.message))
                    .finally(() => setLoading(false));
                }}
                className="font-roman text-xs uppercase tracking-wider text-[#9C3A3A] hover:underline font-bold"
              >
                Retry
              </button>
            </div>
          ) : loading ? (
            // Shimmer Loading Skeleton
            <div className="space-y-6 animate-pulse">
              {/* Stats matrix skeleton */}
              <div className="grid grid-cols-3 gap-3">
                <div className="h-20 bg-sky-light/40 rounded-xl border border-sky-blue/30" />
                <div className="h-20 bg-gold-light/20 rounded-xl border border-gold-light/40" />
                <div className="h-20 bg-sky-light/40 rounded-xl border border-sky-blue/30" />
              </div>
              {/* Speaker cards skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-28 bg-canvas-parchment rounded-xl border border-sky-blue/40 p-4" />
                <div className="h-28 bg-canvas-parchment rounded-xl border border-sky-blue/40 p-4" />
              </div>
              {/* Table skeleton */}
              <div className="h-44 bg-canvas-parchment rounded-xl border border-sky-blue/40" />
            </div>
          ) : data ? (
            <>
              {/* 1. Stats Summary Matrix (Top Bar) */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {/* Rank Badge */}
                <div className="rounded-xl bg-canvas-marble border border-sky-blue/60 p-3 sm:p-4 text-center shadow-2xs">
                  <span className="font-roman text-[10px] sm:text-xs tracking-wider uppercase text-gold-deep font-bold block">
                    Tournament Rank
                  </span>
                  <div className="font-roman font-bold text-xl sm:text-2xl text-ink-900 mt-1 flex items-center justify-center gap-1.5">
                    <Trophy className="w-4 h-4 text-gold-deep" />
                    <span>#{data.current_rank}</span>
                  </div>
                  <span className="font-sans text-[11px] text-ink-600 block mt-0.5">
                    Order {toRoman(data.current_rank)}
                  </span>
                </div>

                {/* Tournament Points Badge */}
                <div className="rounded-xl bg-gold-deep/10 border border-gold-deep/30 p-3 sm:p-4 text-center shadow-2xs">
                  <span className="font-roman text-[10px] sm:text-xs tracking-wider uppercase text-gold-deep font-bold block">
                    Total Team Points
                  </span>
                  <div className="font-serif font-bold text-2xl sm:text-3xl text-ink-900 mt-1">
                    {data.total_points}{' '}
                    <span className="text-xs font-sans font-normal opacity-80">pts</span>
                  </div>
                  <span className="font-sans text-[11px] text-ink-600 block mt-0.5">
                    From sealed ballots
                  </span>
                </div>

                {/* Total Speaks Badge */}
                <div className="rounded-xl bg-canvas-marble border border-sky-blue/60 p-3 sm:p-4 text-center shadow-2xs">
                  <span className="font-roman text-[10px] sm:text-xs tracking-wider uppercase text-ink-600 font-bold block">
                    Cumulative Speaks
                  </span>
                  <div className="font-serif font-bold text-2xl sm:text-3xl text-ink-900 mt-1">
                    {data.total_speaks}
                  </div>
                  <span className="font-sans text-[11px] text-ink-600 block mt-0.5">
                    Speaker Marks Total
                  </span>
                </div>
              </div>

              {/* 2. Speakers Roster Panel */}
              <div>
                <h3 className="font-roman text-xs tracking-wider uppercase text-gold-deep font-bold mb-3 flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5" />
                  <span>Delegation Speakers Roster</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Speaker 1 Card */}
                  <div className="rounded-xl bg-canvas-marble border border-sky-blue/60 p-4 shadow-2xs flex flex-col justify-between">
                    <div>
                      <span className="font-roman text-[10px] tracking-widest text-gold-deep uppercase font-bold block mb-1">
                        First Speaker • Speaker 1
                      </span>
                      <h4 className="font-serif text-lg font-bold text-ink-900 leading-snug">
                        {data.speaker_1?.speaker_1_name || data.speaker_1_name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-3 border-t border-sky-blue/30 grid grid-cols-2 gap-2 text-center">
                      <div className="bg-sky-light/30 rounded-lg p-2">
                        <span className="font-sans text-[10px] uppercase text-ink-600 font-medium block">
                          Total Speaks
                        </span>
                        <span className="font-mono font-bold text-base text-ink-900">
                          {data.speaker_1?.total_speaks ?? 0}
                        </span>
                      </div>
                      <div className="bg-sky-light/30 rounded-lg p-2">
                        <span className="font-sans text-[10px] uppercase text-ink-600 font-medium block">
                          Average Score
                        </span>
                        <span className="font-mono font-bold text-base text-gold-deep">
                          {(data.speaker_1?.average_speaks ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Speaker 2 Card */}
                  <div className="rounded-xl bg-canvas-marble border border-sky-blue/60 p-4 shadow-2xs flex flex-col justify-between">
                    <div>
                      <span className="font-roman text-[10px] tracking-widest text-gold-deep uppercase font-bold block mb-1">
                        Second Speaker • Speaker 2
                      </span>
                      <h4 className="font-serif text-lg font-bold text-ink-900 leading-snug">
                        {data.speaker_2?.speaker_2_name || data.speaker_2_name}
                      </h4>
                    </div>

                    <div className="mt-3 pt-3 border-t border-sky-blue/30 grid grid-cols-2 gap-2 text-center">
                      <div className="bg-sky-light/30 rounded-lg p-2">
                        <span className="font-sans text-[10px] uppercase text-ink-600 font-medium block">
                          Total Speaks
                        </span>
                        <span className="font-mono font-bold text-base text-ink-900">
                          {data.speaker_2?.total_speaks ?? 0}
                        </span>
                      </div>
                      <div className="bg-sky-light/30 rounded-lg p-2">
                        <span className="font-sans text-[10px] uppercase text-ink-600 font-medium block">
                          Average Score
                        </span>
                        <span className="font-mono font-bold text-base text-gold-deep">
                          {(data.speaker_2?.average_speaks ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Round-by-Round Trajectory Table */}
              <div>
                <h3 className="font-roman text-xs tracking-wider uppercase text-gold-deep font-bold mb-3 flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Round-by-Round Trajectory</span>
                </h3>

                <div className="rounded-xl border border-sky-blue/60 overflow-hidden bg-white shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-sans text-xs">
                      <thead>
                        <tr className="border-b border-gold-light/40 bg-sky-light/30 text-ink-900 font-roman tracking-wider uppercase text-[10px]">
                          <th scope="col" className="py-2.5 px-3 font-bold text-center w-14">
                            Round
                          </th>
                          <th scope="col" className="py-2.5 px-3 font-bold text-center w-20">
                            Bench
                          </th>
                          <th scope="col" className="py-2.5 px-3 font-bold text-center w-28">
                            Result
                          </th>
                          <th scope="col" className="py-2.5 px-3 font-bold">
                            Individual Speaks
                          </th>
                          <th scope="col" className="py-2.5 px-3 font-bold text-right w-24">
                            Round Speaks
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sky-blue/30">
                        {data.round_history && data.round_history.length > 0 ? (
                          data.round_history.map((r, idx) => (
                            <tr
                              key={`${r.round_number}-${idx}`}
                              className="hover:bg-sky-light/20 transition-colors"
                            >
                              {/* Round Number */}
                              <td className="py-3 px-3 text-center font-roman font-bold text-ink-900">
                                R{r.round_number}
                              </td>

                              {/* Bench Badge */}
                              <td className="py-3 px-3 text-center">
                                <BenchBadge position={r.bench_position} size="xs" />
                              </td>

                              {/* Result & Team Points */}
                              <td className="py-3 px-3 text-center">
                                <div className="inline-flex items-center gap-1.5">
                                  <span className="font-roman font-bold text-xs px-2 py-0.5 rounded bg-gold-deep/15 text-gold-deep border border-gold-deep/30">
                                    {r.rank_display || `${r.rank}`}
                                  </span>
                                  <span className="font-sans font-semibold text-[11px] text-ink-800">
                                    +{r.points} pts
                                  </span>
                                </div>
                              </td>

                              {/* Individual Speaks */}
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2 font-mono text-[11px] text-ink-800">
                                  <span>
                                    Spk 1:{' '}
                                    <strong className="text-ink-900">{r.speaker_1_score}</strong>
                                  </span>
                                  <span className="text-ink-300">•</span>
                                  <span>
                                    Spk 2:{' '}
                                    <strong className="text-ink-900">{r.speaker_2_score}</strong>
                                  </span>
                                </div>
                                {r.motion_text && (
                                  <div className="font-serif italic text-[11px] text-ink-600 line-clamp-1 mt-0.5">
                                    "{r.motion_text}"
                                  </div>
                                )}
                              </td>

                              {/* Total Round Speaks */}
                              <td className="py-3 px-3 text-right font-mono font-bold text-ink-900">
                                {r.total_round_speaks}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="py-8 px-4 text-center">
                              <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                                <Clock className="w-8 h-8 text-gold-deep/60 mb-2" />
                                <p className="font-serif italic text-sm text-ink-700">
                                  No official ballots sealed for this delegation yet.
                                </p>
                                <span className="font-sans text-[11px] text-ink-500 mt-0.5">
                                  Performance data will appear as rounds conclude and ballots are verified.
                                </span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-gold-light/40 bg-sky-light/10 flex items-center justify-between">
          <span className="font-sans text-[11px] text-ink-500 italic">
            Curia Tabularii • Tabulation Chamber Record
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg font-roman text-xs tracking-wider uppercase font-bold bg-canvas-parchment hover:bg-sky-light/40 border border-gold-deep/50 hover:border-gold-deep text-ink-800 transition-all shadow-xs"
          >
            Dismiss Dossier
          </button>
        </div>
      </div>
    </div>
  );
}
