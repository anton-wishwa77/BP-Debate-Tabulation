import React, { useState } from 'react';
import { api } from '../../api/client';
import {
  Scroll,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Layers,
  Sparkles,
  X,
  FileText,
  Lock,
  Unlock,
  ArrowRight
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

export default function RoundControlPanel({ rounds, teams, judges, onRefresh, onSelectRound }) {
  // Generation Form State
  const maxExistingRound = rounds.length > 0 ? Math.max(...rounds.map((r) => r.round_number)) : 0;
  const nextRoundNumber = maxExistingRound + 1;

  const [roundNumber, setRoundNumber] = useState(nextRoundNumber);
  const [motionText, setMotionText] = useState('');
  const [infoSlide, setInfoSlide] = useState('');
  const [showGenerateModal, setShowGenerateModal] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Pre-draw validations
  const isTeamCountDivisible = teams.length > 0 && teams.length % 4 === 0;
  const neededJudges = teams.length / 4;
  const activeJudgesCount = judges.filter((j) => j.is_active).length;
  const hasEnoughJudges = activeJudgesCount >= neededJudges;

  // Check if previous round has unsealed ballots
  const prevRound = rounds.find((r) => r.round_number === nextRoundNumber - 1);
  const hasUnsealedBallots =
    prevRound && prevRound.matches?.some((m) => !m.is_submitted);

  const handleGenerateRound = async (e) => {
    e.preventDefault();
    if (!motionText.trim()) {
      setErrorMessage('Motion text is mandatory for chamber assembly.');
      return;
    }

    if (!isTeamCountDivisible) {
      setErrorMessage(
        `Cannot generate round: Team count (${teams.length}) is not divisible by 4. Please invoke the Rule of 4 Balancer first.`
      );
      return;
    }

    if (!hasEnoughJudges) {
      setErrorMessage(
        `Cannot generate round: At least ${neededJudges} active adjudicators required for ${teams.length} teams, but only ${activeJudgesCount} are active.`
      );
      return;
    }

    if (hasUnsealedBallots) {
      setErrorMessage(
        `Cannot generate Round ${roundNumber}: Round ${prevRound.round_number} has pending unsealed ballots. All verdicts must be sealed before Swiss power-pairing.`
      );
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await api.generateRound({
        round_number: parseInt(roundNumber, 10),
        motion_text: motionText.trim(),
        info_slide: infoSlide.trim() ? infoSlide.trim() : null
      });

      setSuccessMessage(`Round ${toRoman(roundNumber)} successfully drafted and chambers generated.`);
      setMotionText('');
      setInfoSlide('');
      setRoundNumber(nextRoundNumber + 1);
      setShowGenerateModal(false);
      await onRefresh();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to generate round draw.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (roundId, newStatus) => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await api.updateRound(roundId, { status: newStatus });
      setSuccessMessage(`Round status decree updated to "${newStatus}".`);
      await onRefresh();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update round status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRound = async (roundId, rNum) => {
    if (
      !window.confirm(
        `Are you certain you wish to dissolve Round ${toRoman(
          rNum
        )}? This will cascade-delete all chamber fixtures and submitted ballots for this round.`
      )
    ) {
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    try {
      await api.deleteRound(roundId);
      setSuccessMessage(`Round ${toRoman(rNum)} dissolved successfully.`);
      await onRefresh();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete round.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Error & Success Alerts */}
      {errorMessage && (
        <div className="rounded-xl bg-[#F7EAEB] border border-[#E8C4C4] p-4 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-[#9C3A3A] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-serif font-bold text-[#9C3A3A] text-sm">Chamber Dispatch Rejection</h4>
            <p className="font-sans text-xs text-ink-800 mt-0.5">{errorMessage}</p>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-ink-400 hover:text-ink-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="rounded-xl bg-[#EBF7EE] border border-[#BDE5C8] p-4 flex items-start gap-3 shadow-xs text-[#287A3E]">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-serif font-bold text-sm">Senate Decree Enacted</h4>
            <p className="font-sans text-xs mt-0.5">{successMessage}</p>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner: Quick Round Generator Card */}
      <div className="rounded-2xl bg-canvas-parchment border-2 border-gold-light/60 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-blue via-gold-deep to-sky-blue" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="font-roman text-[10px] tracking-widest text-gold-deep uppercase font-bold px-2 py-0.5 rounded bg-gold-deep/10 border border-gold-deep/30">
                Orchestration Console
              </span>
              <span className="font-sans text-xs font-semibold text-ink-600">
                {rounds.length} Total Rounds Orchestrated
              </span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-ink-900">
              Chamber Generation & Motion Dispatch
            </h2>
            <p className="font-sans text-xs text-ink-600 leading-relaxed">
              Generate sequential British Parliamentary rounds. Round 1 utilizes randomized Fisher-Yates array shuffling; Round 2 and beyond execute Swiss Power-Pairing sorted by cumulative points and speaker marks with bench equity balancing.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => {
                setRoundNumber(nextRoundNumber);
                setShowGenerateModal(true);
              }}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg font-roman text-xs tracking-wider uppercase font-bold bg-ink-900 hover:bg-ink-800 text-canvas-parchment border border-gold-deep shadow-xs hover:border-gold-light transition-all duration-200 hover:scale-[1.02]"
            >
              <PlusCircle className="w-4 h-4 text-gold-light" />
              <span>Draft Round {toRoman(nextRoundNumber)} Draw</span>
            </button>
          </div>
        </div>

        {/* Pre-validation checklist pill indicator */}
        <div className="mt-6 pt-6 border-t border-sky-blue/40 grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans text-xs">
          <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${isTeamCountDivisible ? 'bg-[#EBF7EE]/60 border-[#BDE5C8] text-[#287A3E]' : 'bg-[#F7EAEB]/60 border-[#E8C4C4] text-[#9C3A3A]'}`}>
            {isTeamCountDivisible ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="font-medium truncate">
              {teams.length} Teams {isTeamCountDivisible ? '(Divisible by 4)' : '(Remainder - Swing Needed)'}
            </span>
          </div>

          <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${hasEnoughJudges ? 'bg-[#EBF7EE]/60 border-[#BDE5C8] text-[#287A3E]' : 'bg-[#F7EAEB]/60 border-[#E8C4C4] text-[#9C3A3A]'}`}>
            {hasEnoughJudges ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="font-medium truncate">
              {activeJudgesCount} Active Judges ({neededJudges || 1} Needed)
            </span>
          </div>

          <div className={`flex items-center gap-2 p-2.5 rounded-lg border ${!hasUnsealedBallots ? 'bg-[#EBF7EE]/60 border-[#BDE5C8] text-[#287A3E]' : 'bg-[#F7EAEB]/60 border-[#E8C4C4] text-[#9C3A3A]'}`}>
            {!hasUnsealedBallots ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span className="font-medium truncate">
              {!hasUnsealedBallots ? 'Prior Ballots Sealed' : 'Pending Ballots in Prior Round'}
            </span>
          </div>
        </div>
      </div>

      {/* Rounds Directory */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gold-light/40">
          <div>
            <h3 className="font-serif text-2xl font-bold text-ink-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-gold-deep" />
              <span>Chamber Rounds & Decrees</span>
            </h3>
            <p className="font-sans text-xs text-ink-600 mt-0.5">
              Review pairing status, publish draw schedules to public debaters, or mark rounds complete.
            </p>
          </div>
        </div>

        {rounds.length === 0 ? (
          <div className="rounded-xl bg-canvas-parchment border border-sky-blue/50 p-12 text-center max-w-md mx-auto shadow-xs">
            <Scroll className="w-10 h-10 text-gold-deep/60 mx-auto mb-3" />
            <h4 className="font-serif text-lg font-bold text-ink-900 mb-1">No Rounds Generated Yet</h4>
            <p className="font-sans text-xs text-ink-600">
              Click "Draft Round I Draw" above to execute the initial pairing and form the debate chambers.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {rounds.map((round) => {
              const sealedCount = round.matches?.filter((m) => m.is_submitted).length || 0;
              const totalRooms = round.matches?.length || 0;
              const allSealed = totalRooms > 0 && sealedCount === totalRooms;

              return (
                <div
                  key={round.round_id}
                  className="rounded-xl bg-canvas-parchment border border-sky-blue/70 hover:border-gold-deep/60 p-6 shadow-xs transition-all space-y-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="font-roman text-sm tracking-wider uppercase font-bold px-3 py-1 rounded bg-gold-deep/15 text-gold-deep border border-gold-deep/40 shadow-xs">
                        Round {toRoman(round.round_number)}
                      </span>

                      {round.status === 'Draft' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-roman uppercase font-bold tracking-wider bg-[#FBF3EB] text-[#8E522C] border border-[#E8D4C5]">
                          <Lock className="w-3 h-3" />
                          <span>Draft (Confidential)</span>
                        </span>
                      )}

                      {round.status === 'Published' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-roman uppercase font-bold tracking-wider bg-sky-light text-ink-900 border border-sky-blue">
                          <Eye className="w-3 h-3 text-gold-deep" />
                          <span>Published (Public on /draws)</span>
                        </span>
                      )}

                      {round.status === 'Completed' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-roman uppercase font-bold tracking-wider bg-[#EBF7EE] text-[#287A3E] border border-[#BDE5C8]">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Completed</span>
                        </span>
                      )}
                    </div>

                    {/* Room & Ballot summary badge */}
                    <div className="flex items-center gap-2 font-sans text-xs">
                      <span className="text-ink-600 font-medium">Chamber Ballots:</span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded ${
                          allSealed
                            ? 'bg-[#EBF7EE] text-[#287A3E] border border-[#BDE5C8]'
                            : 'bg-[#FBF3EB] text-[#8E522C] border border-[#E8D4C5]'
                        }`}
                      >
                        {sealedCount} / {totalRooms} Sealed
                      </span>
                    </div>
                  </div>

                  {/* Motion Banner */}
                  <div className="rounded-lg bg-sky-light/30 border border-sky-blue/40 p-3.5 space-y-1.5">
                    <div className="flex items-center gap-1.5 font-roman text-[10px] tracking-wider uppercase font-bold text-gold-deep">
                      <FileText className="w-3 h-3" />
                      <span>Debate Motion</span>
                    </div>
                    <p className="font-serif italic text-base text-ink-900 font-semibold">
                      "{round.motion_text}"
                    </p>
                    {round.info_slide && (
                      <div className="pt-2 text-xs text-ink-600 font-sans border-t border-sky-blue/30">
                        <span className="font-semibold text-ink-800">Context Slide: </span>
                        {round.info_slide}
                      </div>
                    )}
                  </div>

                  {/* Status Action Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {round.status === 'Draft' && (
                        <button
                          onClick={() => handleUpdateStatus(round.round_id, 'Published')}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-roman text-xs tracking-wider uppercase font-bold bg-sky-light/80 hover:bg-sky-light text-ink-900 border border-sky-blue shadow-xs transition-all"
                        >
                          <Eye className="w-3.5 h-3.5 text-gold-deep" />
                          <span>Publish Pairings to Public</span>
                        </button>
                      )}

                      {round.status === 'Published' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(round.round_id, 'Completed')}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-roman text-xs tracking-wider uppercase font-bold bg-[#EBF7EE] hover:bg-[#DFF1E4] text-[#287A3E] border border-[#BDE5C8] shadow-xs transition-all"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Complete Round</span>
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(round.round_id, 'Draft')}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-roman text-xs tracking-wider uppercase text-ink-600 hover:text-ink-900 bg-canvas-parchment hover:bg-sky-light/30 border border-sky-blue/50 shadow-xs transition-all"
                          >
                            <Lock className="w-3.5 h-3.5 text-ink-400" />
                            <span>Revert to Draft</span>
                          </button>
                        </>
                      )}

                      {round.status === 'Completed' && (
                        <button
                          onClick={() => handleUpdateStatus(round.round_id, 'Published')}
                          disabled={actionLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-roman text-xs tracking-wider uppercase text-ink-600 hover:text-ink-900 bg-canvas-parchment hover:bg-sky-light/30 border border-sky-blue/50 shadow-xs transition-all"
                        >
                          <Unlock className="w-3.5 h-3.5 text-ink-400" />
                          <span>Re-open to Published</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {onSelectRound && (
                        <button
                          onClick={() => onSelectRound(round.round_number)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md font-roman text-xs uppercase tracking-wider text-ink-800 bg-sky-light/40 hover:bg-sky-light border border-sky-blue/60 transition-all"
                        >
                          <span>Inspect Chambers</span>
                          <ArrowRight className="w-3.5 h-3.5 text-gold-deep" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDeleteRound(round.round_id, round.round_number)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md font-roman text-xs uppercase tracking-wider text-[#9C3A3A] hover:bg-[#F7EAEB] border border-transparent hover:border-[#E8C4C4] transition-all"
                        title="Dissolve Round Draw"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Round</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: GENERATE ROUND */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-canvas-parchment border-2 border-gold-deep shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gold-light/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-deep/15 border border-gold-deep/40 flex items-center justify-center text-gold-deep">
                  <Scroll className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-ink-900">
                    Draft Round {toRoman(roundNumber)} Draw
                  </h3>
                  <p className="font-sans text-xs text-ink-600">
                    {roundNumber === 1
                      ? 'Executes initial random draw & chamber assignments.'
                      : 'Executes Swiss Power-Pairing & bench equity balancing.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowGenerateModal(false)} className="text-ink-400 hover:text-ink-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateRound} className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700">
                  Round Number *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={roundNumber}
                  onChange={(e) => setRoundNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-sky-blue/70 bg-white text-ink-900 font-mono focus:outline-hidden focus:border-gold-deep"
                />
              </div>

              <div className="space-y-1">
                <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700">
                  Debate Motion *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. This House would subsidize indigenous renewable energy over fossil fuels."
                  value={motionText}
                  onChange={(e) => setMotionText(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-sky-blue/70 bg-white text-ink-900 font-serif italic text-sm focus:outline-hidden focus:border-gold-deep"
                />
              </div>

              <div className="space-y-1">
                <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700">
                  Info Slide / Context (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Provide background context or factual definitions for debaters..."
                  value={infoSlide}
                  onChange={(e) => setInfoSlide(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-sky-blue/70 bg-white text-ink-900 focus:outline-hidden focus:border-gold-deep"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gold-light/30">
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="px-4 py-2 rounded-md font-roman text-xs uppercase tracking-wider text-ink-600 hover:text-ink-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2.5 rounded-md font-roman text-xs tracking-wider uppercase font-bold bg-ink-900 hover:bg-ink-800 text-canvas-parchment border border-gold-deep shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Drafting Chambers...' : 'Execute Draw & Form Chambers'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
