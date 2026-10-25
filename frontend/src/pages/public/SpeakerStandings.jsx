import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Mic, RefreshCw, AlertCircle, Award } from 'lucide-react';

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

export default function SpeakerStandings() {
  const [speakers, setSpeakers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSpeakers = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    try {
      const data = await api.getSpeakerStandings();
      setSpeakers(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load speaker standings');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSpeakers();
  }, []);

  return (
    <div className="space-y-6">
      {/* Subheader / Table Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gold-light/40">
        <div>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900 flex items-center gap-2.5">
            <Mic className="w-6 h-6 text-gold-deep" />
            <span>Tribune of Speakers</span>
          </h2>
          <p className="font-sans text-xs sm:text-sm text-ink-600 mt-0.5">
            Individual debater tab ranked by aggregate speaker points, rounds spoken, and round average.
          </p>
        </div>

        <button
          onClick={() => fetchSpeakers(true)}
          disabled={loading || isRefreshing}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md font-roman text-xs tracking-wider uppercase text-ink-800 bg-canvas-parchment hover:bg-sky-light/40 border border-gold-deep/40 hover:border-gold-deep shadow-xs transition-all duration-200 disabled:opacity-50"
          title="Refresh Speaker Tab"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gold-deep ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Syncing...' : 'Sync Speakers'}</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg bg-[#F7EAEB] border border-[#E8C4C4] p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#9C3A3A] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-serif font-bold text-[#9C3A3A]">Failed to Fetch Speakers</h4>
            <p className="font-sans text-xs text-ink-800 mt-0.5">{error}</p>
          </div>
          <button
            onClick={() => fetchSpeakers(true)}
            className="font-roman text-xs uppercase tracking-wider text-[#9C3A3A] hover:underline font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {/* Speaker Leaderboard Card */}
      <div className="bg-canvas-parchment rounded-xl border border-sky-blue/60 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gold-light/40 bg-sky-light/30">
                <th scope="col" className="py-3.5 px-4 font-roman text-xs tracking-widest text-gold-deep uppercase font-bold text-center w-16">
                  Rank
                </th>
                <th scope="col" className="py-3.5 px-4 font-roman text-xs tracking-widest text-ink-900 uppercase font-bold">
                  Debater &amp; Institution
                </th>
                <th scope="col" className="py-3.5 px-4 font-roman text-xs tracking-widest text-ink-900 uppercase font-bold hidden md:table-cell">
                  Team Affiliation
                </th>
                <th scope="col" className="py-3.5 px-4 font-roman text-xs tracking-widest text-ink-900 uppercase font-bold text-center w-24">
                  Rounds
                </th>
                <th scope="col" className="py-3.5 px-4 font-roman text-xs tracking-widest text-gold-deep uppercase font-bold text-right w-28">
                  Total
                </th>
                <th scope="col" className="py-3.5 px-4 font-roman text-xs tracking-widest text-ink-900 uppercase font-bold text-right w-28">
                  Average
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
                      <div className="h-4 w-36 bg-sky-light/80 rounded mb-1.5" />
                      <div className="h-3 w-24 bg-sky-light/50 rounded" />
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">
                      <div className="h-4 w-32 bg-sky-light/70 rounded" />
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="h-4 w-6 bg-sky-light/80 rounded mx-auto" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-5 w-12 bg-gold-light/40 rounded ml-auto" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-4 w-12 bg-sky-light/80 rounded ml-auto" />
                    </td>
                  </tr>
                ))
              ) : speakers.length === 0 ? (
                // Empty State
                <tr>
                  <td colSpan={6} className="py-12 px-4 text-center">
                    <div className="max-w-md mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-full bg-sky-light/60 flex items-center justify-center text-gold-deep mb-3 border border-sky-blue/50">
                        <Award className="w-6 h-6" />
                      </div>
                      <h3 className="font-serif text-lg font-bold text-ink-900 mb-1">
                        No individual debater marks recorded yet.
                      </h3>
                      <p className="font-sans text-xs text-ink-600">
                        Debater scores will populate here automatically as soon as round ballots are confirmed.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                // Populated Speakers
                speakers.map((speaker, index) => {
                  const rank = index + 1;
                  const medalColors = {
                    1: 'bg-gold-deep text-canvas-parchment border-gold-light ring-2 ring-gold-deep/20',
                    2: 'bg-slate-400 text-canvas-parchment border-slate-300',
                    3: 'bg-amber-700 text-canvas-parchment border-amber-600'
                  }[rank] || 'bg-sky-light/60 text-ink-800 border-sky-blue/60';

                  return (
                    <tr
                      key={`${speaker.speaker_name}-${speaker.team_name}-${index}`}
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

                      {/* Speaker Name & Institution */}
                      <td className="py-3.5 px-4">
                        <div className="font-serif text-base font-bold text-ink-900 group-hover:text-gold-deep transition-colors">
                          {speaker.speaker_name}
                        </div>
                        <div className="font-sans text-xs text-ink-600">
                          {speaker.institution}
                        </div>
                        {/* Mobile visible team name */}
                        <div className="font-sans text-[11px] text-gold-deep md:hidden mt-0.5">
                          {speaker.team_name}
                        </div>
                      </td>

                      {/* Team Affiliation */}
                      <td className="py-3.5 px-4 font-sans text-sm text-ink-800 hidden md:table-cell">
                        {speaker.team_name}
                      </td>

                      {/* Rounds Spoken */}
                      <td className="py-3.5 px-4 text-center font-sans font-medium text-ink-800">
                        {speaker.rounds_spoken}
                      </td>

                      {/* Total Speaker Score */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-roman font-bold text-sm text-gold-deep">
                          {speaker.total_speaker_score}
                        </span>
                      </td>

                      {/* Average Score (2 decimal places) */}
                      <td className="py-3.5 px-4 text-right font-sans font-semibold text-ink-900">
                        {Number(speaker.average_score).toFixed(2)}
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
