import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import BenchBadge from '../../components/common/BenchBadge';
import {
  ArrowLeft,
  Scale,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Stamp,
  Award,
  AlertCircle,
  FileText,
  RotateCcw
} from 'lucide-react';

const BENCH_ORDER = ['OG', 'OO', 'CG', 'CO'];

const RANK_POINTS = {
  1: 3,
  2: 2,
  3: 1,
  4: 0,
};

function formatOrdinal(n) {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  if (n === 4) return '4th';
  return `${n}th`;
}

export default function BallotForm() {
  const { matchId } = useParams();
  const navigate = useNavigate();

  const [judge, setJudge] = useState(null);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successSealed, setSuccessSealed] = useState(false);

  // Form state indexed by team_id: { rank, s1, s2 }
  const [ballotState, setBallotState] = useState({});

  useEffect(() => {
    const savedJudge = localStorage.getItem('forum_aeterna_judge');
    if (!savedJudge) {
      navigate('/judge', { replace: true });
      return;
    }
    try {
      const parsed = JSON.parse(savedJudge);
      if (!parsed?.judge_id) {
        navigate('/judge', { replace: true });
        return;
      }
      setJudge(parsed);
    } catch (_) {
      navigate('/judge', { replace: true });
      return;
    }

    loadMatchDetails();
  }, [matchId, navigate]);

  const loadMatchDetails = async () => {
    setLoading(true);
    try {
      const data = await api.getMatchById(matchId);
      setMatch(data);

      // Initialize ballot form state from existing participants
      const initialForm = {};
      (data.participants || []).forEach((p) => {
        initialForm[p.team_id] = {
          team_id: p.team_id,
          bench_position: p.bench_position,
          rank: p.rank ? Number(p.rank) : '',
          s1: p.speaker_1_score !== null && p.speaker_1_score !== undefined ? String(p.speaker_1_score) : '',
          s2: p.speaker_2_score !== null && p.speaker_2_score !== undefined ? String(p.speaker_2_score) : '',
        };
      });
      setBallotState(initialForm);

      if (data.is_submitted) {
        setSuccessSealed(true);
      }
    } catch (err) {
      setError(err.message || 'Failed to load match fixture');
    } finally {
      setLoading(false);
    }
  };

  const handleRankChange = (teamId, newRank) => {
    setBallotState((prev) => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        rank: newRank === '' ? '' : Number(newRank),
      },
    }));
  };

  const handleScoreChange = (teamId, speakerKey, val) => {
    setBallotState((prev) => ({
      ...prev,
      [teamId]: {
        ...prev[teamId],
        [speakerKey]: val,
      },
    }));
  };

  // Sorted participants according to strict BP bench sequence: OG, OO, CG, CO
  const sortedParticipants = useMemo(() => {
    if (!match?.participants) return [];
    return [...match.participants].sort((a, b) => {
      const idxA = BENCH_ORDER.indexOf(a.bench_position);
      const idxB = BENCH_ORDER.indexOf(b.bench_position);
      return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
    });
  }, [match]);

  // Compute team totals, rank uniqueness, score validity, and LPW errors
  const validation = useMemo(() => {
    const teams = Object.values(ballotState);
    if (teams.length !== 4) {
      return { isValid: false, lpwErrors: [], rankError: null, scoreErrors: [] };
    }

    const rankList = teams.map((t) => t.rank).filter((r) => r !== '' && !isNaN(r));
    const uniqueRanks = new Set(rankList);
    let rankError = null;

    if (rankList.length < 4) {
      rankError = 'All 4 benches must be assigned a rank (1st through 4th).';
    } else if (uniqueRanks.size !== 4 || ![1, 2, 3, 4].every((r) => uniqueRanks.has(r))) {
      rankError = 'Duplicate ranks detected. Each rank (1st, 2nd, 3rd, 4th) must be uniquely assigned.';
    }

    // Validate scores (50 - 100)
    const scoreErrors = [];
    teams.forEach((t) => {
      const s1Num = Number(t.s1);
      const s2Num = Number(t.s2);

      if (!t.s1 || isNaN(s1Num) || !Number.isInteger(s1Num) || s1Num < 50 || s1Num > 100) {
        scoreErrors.push(`${t.bench_position} Speaker 1 score must be an integer between 50 and 100.`);
      }
      if (!t.s2 || isNaN(s2Num) || !Number.isInteger(s2Num) || s2Num < 50 || s2Num > 100) {
        scoreErrors.push(`${t.bench_position} Speaker 2 score must be an integer between 50 and 100.`);
      }
    });

    // Validate LPW Prohibition
    const lpwErrors = [];
    if (!rankError && scoreErrors.length === 0) {
      const sortedByRank = [...teams].sort((a, b) => a.rank - b.rank);

      for (let i = 0; i < sortedByRank.length; i++) {
        for (let j = i + 1; j < sortedByRank.length; j++) {
          const higherTeam = sortedByRank[i]; // rank is lower number (e.g. 1st)
          const lowerTeam = sortedByRank[j];  // rank is higher number (e.g. 2nd)

          const higherSpeaks = Number(higherTeam.s1) + Number(higherTeam.s2);
          const lowerSpeaks = Number(lowerTeam.s1) + Number(lowerTeam.s2);

          if (higherSpeaks <= lowerSpeaks) {
            lpwErrors.push({
              higherRank: higherTeam.rank,
              lowerRank: lowerTeam.rank,
              higherBench: higherTeam.bench_position,
              lowerBench: lowerTeam.bench_position,
              higherSpeaks,
              lowerSpeaks,
              message: `Senate Adjudication Warning: A higher ranked team cannot hold equal or fewer speaker points than a lower ranked team.`,
            });
          }
        }
      }
    }

    const isValid = !rankError && scoreErrors.length === 0 && lpwErrors.length === 0;

    return {
      isValid,
      lpwErrors,
      rankError,
      scoreErrors,
    };
  }, [ballotState]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validation.isValid) return;

    setSubmitting(true);
    setError(null);

    const payload = Object.values(ballotState).map((entry) => ({
      team_id: entry.team_id,
      rank: Number(entry.rank),
      speaker_1_score: Number(entry.s1),
      speaker_2_score: Number(entry.s2),
    }));

    try {
      await api.submitBallot(matchId, payload);
      setSuccessSealed(true);
    } catch (err) {
      setError(err.message || 'Failed to seal ballot in Senate archives');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-sky-light/60 rounded" />
        <div className="h-32 bg-canvas-parchment rounded-xl border border-sky-blue/40" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-canvas-parchment rounded-xl border border-sky-blue/40" />
          <div className="h-64 bg-canvas-parchment rounded-xl border border-sky-blue/40" />
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="max-w-md mx-auto py-12 text-center">
        <AlertCircle className="w-10 h-10 text-[#9C3A3A] mx-auto mb-3" />
        <h2 className="font-serif text-2xl font-bold text-ink-900 mb-2">Chamber Not Found</h2>
        <p className="font-sans text-xs text-ink-600 mb-6">
          The requested debate match does not exist or has been modified.
        </p>
        <Link
          to="/judge/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-roman text-xs tracking-wider uppercase text-ink-800 bg-sky-light/60 border border-sky-blue/70"
        >
          <ArrowLeft className="w-4 h-4 text-gold-deep" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/judge/dashboard"
          className="inline-flex items-center gap-2 font-roman text-xs tracking-wider uppercase text-ink-600 hover:text-ink-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-gold-deep" />
          <span>Back to Adjudicator Dashboard</span>
        </Link>

        {judge && (
          <span className="font-sans text-xs text-ink-600">
            Adjudicator: <strong className="text-ink-900 font-semibold">{judge.judge_name}</strong>
          </span>
        )}
      </div>

      {/* Motion & Chamber Banner */}
      <div className="rounded-2xl bg-canvas-parchment border-2 border-gold-light/60 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-blue via-gold-deep to-sky-blue" />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gold-light/40">
            <span className="font-roman text-xs tracking-widest uppercase font-bold text-gold-deep flex items-center gap-2">
              <Scale className="w-4 h-4" />
              <span>Chamber E-Ballot • {match.room_name} (Round {match.round_number})</span>
            </span>

            {successSealed && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md font-roman text-xs tracking-wider uppercase font-bold bg-[#EBF7EE] text-[#287A3E] border border-[#BDE5C8]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Verdict Sealed</span>
              </span>
            )}
          </div>

          <div>
            <div className="flex items-center gap-1.5 font-roman text-[10px] tracking-wider uppercase font-bold text-gold-deep mb-1">
              <FileText className="w-3 h-3" />
              <span>Motion of the Debate</span>
            </div>
            <p className="font-serif text-2xl font-bold italic text-ink-900 leading-snug">
              "{match.motion_text}"
            </p>
          </div>

          {match.info_slide && match.info_slide.trim() !== '' && (
            <div className="mt-2 rounded-lg bg-sky-light/40 border border-sky-blue/60 p-3 font-sans text-xs text-ink-800">
              <strong className="font-roman text-[10px] uppercase tracking-wider text-gold-deep block mb-0.5">
                Information Slide
              </strong>
              {match.info_slide}
            </div>
          )}
        </div>
      </div>

      {/* Success / Sealed Banner */}
      {successSealed && (
        <div className="rounded-xl bg-[#EBF7EE] border-2 border-[#BDE5C8] p-6 text-center shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 mx-auto shadow-2xs">
            <Stamp className="w-8 h-8" />
          </div>
          <div>
            <span className="font-roman text-xs tracking-[0.2em] uppercase font-bold text-emerald-800 block mb-1">
              Decree Confirmed
            </span>
            <h3 className="font-serif text-2xl font-bold text-emerald-950">
              Ballot Officially Sealed and Recorded in Senate Archives
            </h3>
            <p className="font-sans text-xs text-emerald-800 max-w-md mx-auto mt-1">
              Ranks, team points, and individual debater marks have been committed atomically to the tabulation engine.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            <Link
              to="/judge/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-roman text-xs tracking-wider uppercase text-ink-800 bg-canvas-parchment hover:bg-sky-light/60 border border-emerald-400 font-bold shadow-xs transition-colors"
            >
              <span>Return to Dashboard</span>
            </Link>

            <Link
              to="/standings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-roman text-xs tracking-wider uppercase text-canvas-parchment bg-ink-900 hover:bg-ink-800 border border-gold-deep font-bold shadow-xs transition-colors"
            >
              <Award className="w-3.5 h-3.5 text-gold-light" />
              <span>Inspect Live Standings</span>
            </Link>

            <button
              type="button"
              onClick={() => setSuccessSealed(false)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md font-roman text-xs tracking-wider uppercase text-ink-600 hover:text-ink-900 transition-colors"
              title="Unlock ballot to adjust scores before round close"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Amend Ballot</span>
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="rounded-lg bg-[#F7EAEB] border border-[#E8C4C4] p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#9C3A3A] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-serif font-bold text-[#9C3A3A]">Ballot Submission Error</h4>
            <p className="font-sans text-xs text-ink-800 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Real-time Adjudication Standards Warnings */}
      {validation.lpwErrors.length > 0 && (
        <div className="rounded-xl bg-[#FDF3E7] border-2 border-[#E59866] p-5 shadow-xs space-y-2">
          <div className="flex items-center gap-2 text-[#A04000]">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <h4 className="font-roman text-xs tracking-wider uppercase font-bold">
              Senate Adjudication Warning • Parliamentary Adjudication Standards
            </h4>
          </div>
          <div className="space-y-1.5 pl-7">
            {validation.lpwErrors.map((err, idx) => (
              <p key={idx} className="font-sans text-xs text-[#6E2C00] leading-relaxed">
                {err.message}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Rank Duplication Warning */}
      {validation.rankError && (
        <div className="rounded-lg bg-amber-50 border border-amber-300 p-3.5 flex items-center gap-2.5 text-amber-900 font-sans text-xs">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>{validation.rankError}</span>
        </div>
      )}

      {/* 4-Bench Interactive Scoring Grid */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedParticipants.map((p) => {
            const current = ballotState[p.team_id] || { rank: '', s1: '', s2: '' };
            const s1Num = Number(current.s1);
            const s2Num = Number(current.s2);
            const teamTotal = (!isNaN(s1Num) ? s1Num : 0) + (!isNaN(s2Num) ? s2Num : 0);
            const pointsAwarded = current.rank ? RANK_POINTS[current.rank] : null;

            return (
              <div
                key={p.team_id}
                className={`rounded-xl bg-canvas-parchment border transition-all duration-200 shadow-xs p-5 flex flex-col justify-between space-y-5 ${
                  successSealed
                    ? 'border-emerald-300 opacity-90'
                    : 'border-sky-blue/70 hover:border-gold-deep/60'
                }`}
              >
                {/* Bench Header & Team Info */}
                <div className="space-y-2 pb-3 border-b border-sky-blue/30">
                  <div className="flex items-center justify-between">
                    <BenchBadge position={p.bench_position} showFullName size="sm" />
                    {pointsAwarded !== null && (
                      <span className="font-roman text-xs font-bold px-2 py-0.5 rounded bg-gold-deep/15 text-gold-deep border border-gold-deep/30">
                        {pointsAwarded} {pointsAwarded === 1 ? 'Point' : 'Points'}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-serif text-xl font-bold text-ink-900">
                      {p.team_name}
                    </h3>
                    <p className="font-sans text-xs text-ink-600">
                      {p.team_institution || p.institution}
                    </p>
                  </div>
                </div>

                {/* Rank Selector */}
                <div>
                  <label className="block font-roman text-xs tracking-wider uppercase font-bold text-ink-900 mb-1.5">
                    Chamber Placement (Rank)
                  </label>
                  <select
                    disabled={successSealed}
                    value={current.rank}
                    onChange={(e) => handleRankChange(p.team_id, e.target.value)}
                    className="w-full py-2 px-3 rounded-md bg-canvas-marble border border-sky-blue/70 focus:border-gold-deep focus:ring-1 focus:ring-gold-deep font-roman text-sm font-semibold text-ink-900 outline-hidden transition-all disabled:bg-sky-light/40"
                    required
                  >
                    <option value="">— Select Rank —</option>
                    <option value="1">1st Place (3 Points)</option>
                    <option value="2">2nd Place (2 Points)</option>
                    <option value="3">3rd Place (1 Point)</option>
                    <option value="4">4th Place (0 Points)</option>
                  </select>
                </div>

                {/* Speaker Score Inputs */}
                <div className="space-y-3">
                  <span className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-400 block">
                    Debater Scores (Standard scale: 50–100)
                  </span>

                  {/* Speaker 1 */}
                  <div>
                    <div className="flex items-center justify-between font-sans text-xs mb-1">
                      <span className="text-ink-800 font-medium truncate">
                        1. {p.speaker_1_name}
                      </span>
                      <span className="text-ink-400 text-[10px]">Min 50 • Max 100</span>
                    </div>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      disabled={successSealed}
                      value={current.s1}
                      onChange={(e) => handleScoreChange(p.team_id, 's1', e.target.value)}
                      placeholder="e.g. 75"
                      className="w-full py-1.5 px-3 rounded-md bg-canvas-marble border border-sky-blue/70 focus:border-gold-deep focus:ring-1 focus:ring-gold-deep font-mono text-sm text-ink-900 outline-hidden transition-all disabled:bg-sky-light/40"
                      required
                    />
                  </div>

                  {/* Speaker 2 */}
                  <div>
                    <div className="flex items-center justify-between font-sans text-xs mb-1">
                      <span className="text-ink-800 font-medium truncate">
                        2. {p.speaker_2_name}
                      </span>
                      <span className="text-ink-400 text-[10px]">Min 50 • Max 100</span>
                    </div>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      disabled={successSealed}
                      value={current.s2}
                      onChange={(e) => handleScoreChange(p.team_id, 's2', e.target.value)}
                      placeholder="e.g. 76"
                      className="w-full py-1.5 px-3 rounded-md bg-canvas-marble border border-sky-blue/70 focus:border-gold-deep focus:ring-1 focus:ring-gold-deep font-mono text-sm text-ink-900 outline-hidden transition-all disabled:bg-sky-light/40"
                      required
                    />
                  </div>
                </div>

                {/* Live Calculated Speaks Footer */}
                <div className="pt-3 border-t border-sky-blue/30 flex items-center justify-between font-sans text-xs">
                  <span className="text-ink-600">Combined Speaker Marks:</span>
                  <span className="font-roman text-base font-bold text-gold-deep">
                    {teamTotal > 0 ? teamTotal : '—'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Action Bar */}
        {!successSealed && (
          <div className="rounded-xl bg-canvas-parchment border border-gold-light/60 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
            <div>
              <h4 className="font-serif text-lg font-bold text-ink-900">
                Seal Official Room Ballot
              </h4>
              <p className="font-sans text-xs text-ink-600">
                All scoring constraints, rank permutations, and adjudication standards must pass before submission.
              </p>
            </div>

            <button
              type="submit"
              disabled={!validation.isValid || submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-md font-roman text-xs tracking-widest uppercase font-bold text-canvas-parchment bg-ink-900 hover:bg-ink-800 border border-gold-deep shadow-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Lock className="w-4 h-4 text-gold-light" />
              <span>{submitting ? 'Sealing Ballot...' : 'Seal & Submit Ballot'}</span>
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
