import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import BenchBadge from '../../components/common/BenchBadge';
import { Trophy, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';

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

export default function TeamStandings() {
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStandings = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const data = await api.getTeamStandings();
      setStandings(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load team standings');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStandings();
  }, []);

  return (
    <div className="space-y-6">
      {/* Subheader / Table Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gold-light/40">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-gold-deep" />
            <span>Curia of Teams</span>
          </h2>
          <p className="font-sans text-xs sm:text-sm text-ink-600 mt-0.5">
            Live tournament leaderboard sorted by cumulative team points, speaker marks, and bench equity.
          </p>
        </div>

        <button
          onClick={() => fetchStandings(true)}
          disabled={loading || isRefreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md font-roman text-xs tracking-wider uppercase text-ink-800 bg-canvas-parchment hover:bg-sky-light/40 border border-gold-deep/40 hover:border-gold-deep shadow-xs transition-all duration-200 disabled:opacity-50"
          title="Refresh Standings"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gold-deep ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Sync Standings'}</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg bg-[#F7EAEB] border border-[#E8C4C4] p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#9C3A3A] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-serif font-bold text-[#9C3A3A]">Failed to Fetch Standings</h4>
            <p className="font-sans text-xs text-ink-800 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => fetchStandings(true)}
            className="font-roman text-xs uppercase tracking-wider text-[#9C3A3A] hover:underline font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Standings Table Card */}
      <div className="bg-canvas-parchment rounded-xl border border-sky-blue/60 shadow-sm overflow-hidden">
        {/* Table Head Ornaments */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gold-light/40 bg-sky-light/30">
                <th scope="col" className="py-3.5 px-4 font-roman text-xs tracking-widest text-gold-deep uppercase font-bold text-center w-16">
                  Rank
                </th>
                <th scope="col" className="py-3.5 px-4 font-roman text-xs tracking-widest text-ink-900 uppercase font-bold">
                  Team &amp; Institution
                </th>
                <th scope="col" className="py-3.5 px-4 font-roman text-xs tracking-widest text-ink-900 uppercase font-bold text-center w-24">
                  Rounds
                </th>
                <th scope="col" className="py-3.5 px-4 font-roman text-xs tracking-widest text-gold-deep uppercase font-bold text-center w-28">
                  Points
                </th>
                <th scope="col" className="py-3.5 px-4 font-roman text-xs tracking-widest text-ink-900 uppercase font-bold text-right w-28">
                  Speaks
                </th>
                <th scope="col" className="py-3.5 px-4 font-roman text-xs tracking-widest text-ink-900 uppercase font-bold text-left hidden sm:table-cell">
                  Bench History
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sky-blue/30 font-sans text-sm">
              {loading ? (
                // Loading Skeletons
                Array.from({ length: 6 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4 text-center">
                      <div className="h-6 w-8 bg-sky-light/80 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-40 bg-sky-light/80 rounded mb-1.5" />
                      <div className="h-3 w-28 bg-sky-light/50 rounded" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-4 w-6 bg-sky-light/80 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-7 w-12 bg-gold-light/40 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-4 w-12 bg-sky-light/80 rounded ml-auto" />
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <div className="flex gap-1.5">
                        <div className="h-5 w-8 bg-sky-light/60 rounded" />
                        <div className="h-5 w-8 bg-sky-light/60 rounded" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : standings.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-sky-light/60 flex items-center justify-center text-gold-deep mb-3 border border-sky-blue/50">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <h3 className="font-serif text-lg font-bold text-ink-900 mb-1">
                        The Senate has not yet recorded any completed matches.
                      </h3>
                      <p className="font-sans text-xs text-ink-600">
                        Standings will dynamically calculate here as soon as chairs submit validated ballots without Low-Point Wins.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Populated Standings
                standings.map((team, index) => {
                  const rank = index + 1;
                  const isTopThree = rank <= 3;
                  const medalColors = {
                    1: 'bg-gold-deep text-canvas-parchment border-gold-light ring-2 ring-gold-deep/20',
                    2: 'bg-slate-400 text-canvas-parchment border-slate-300',
                    3: 'bg-amber-700 text-canvas-parchment border-amber-600'
                  }[rank] || 'bg-sky-light/60 text-ink-800 border-sky-blue/60';

                  return (
                    <tr
                      key={team.team_id}
                      className="hover:bg-sky-light/20 transition-colors duration-150 group"
                    >
                      {/* Rank Medal / Roman Numeral */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center w-7 h-7 rounded-md font-roman text-xs font-bold border shadow-2xs ${medalColors}`}
                          title={`Rank ${rank}`}
                        >
                          {toRoman(rank)}
                        </span>
                      </td>

                      {/* Team Name & Institution */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-base font-bold text-ink-900 group-hover:text-gold-deep transition-colors">
                            {team.team_name}
                          </span>
                          {team.is_swing && (
                            <span className="font-roman text-[10px] tracking-wider uppercase px-2 py-0.5 rounded border border-gold-light/60 bg-gold-light/20 text-gold-deep font-semibold">
                              Swing
                            </span>
                          )}
                        </div>
                        <div className="font-sans text-xs text-ink-600">
                          {team.institution}
                        </div>
                      </td>

                      {/* Rounds Played */}
                      <td className="py-3.5 px-4 text-center font-sans font-medium text-ink-800">
                        {team.rounds_played}
                      </td>

                      {/* Total Team Points Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center justify-center px-3 py-1 rounded-md font-roman font-bold text-sm bg-gold-deep/15 text-gold-deep border border-gold-deep/40 shadow-xs">
                          {team.total_points} <span className="text-[10px] ml-1 font-sans font-normal opacity-75">pts</span>
                        </span>
                      </td>

                      {/* Total Speaker Points */}
                      <td className="py-3.5 px-4 text-right font-sans font-semibold text-ink-900">
                        {team.total_speaks}
                      </td>

                      {/* Bench History Array */}
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        {Array.isArray(team.bench_history) && team.bench_history.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {team.bench_history.map((bench, bIdx) => (
                              <BenchBadge
                                key={`${team.team_id}-bench-${bIdx}`}
                                position={bench}
                                size="xs"
                              />
                            ))}
                          </div>
                        ) : (
                          <span className="font-sans text-xs text-ink-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
