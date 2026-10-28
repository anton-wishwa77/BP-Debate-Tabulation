import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BenchBadge from '../common/BenchBadge';
import TeamDossierModal from '../common/TeamDossierModal';
import ReassignJudgeModal from './ReassignJudgeModal';
import {
  Scale,
  Clock,
  CheckCircle2,
  CheckCircle,
  ExternalLink,
  Award,
  Layers,
  Building2,
  FileText,
  X,
  Eye,
  ShieldCheck,
  Gavel,
  Lock
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

const BENCH_ORDER = ['OG', 'OO', 'CG', 'CO'];

export default function RoomMatrix({
  rounds,
  selectedRoundNumber,
  onSelectRound,
  judges = [],
  onRefresh
}) {
  const [localRounds, setLocalRounds] = useState(rounds || []);
  const [inspectMatch, setInspectMatch] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [reassignMatch, setReassignMatch] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    setLocalRounds(rounds || []);
  }, [rounds]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  if (!localRounds || localRounds.length === 0) {
    return (
      <div className="rounded-xl bg-canvas-parchment border border-sky-blue/50 p-12 text-center max-w-md mx-auto shadow-xs">
        <Layers className="w-10 h-10 text-gold-deep/60 mx-auto mb-3" />
        <h3 className="font-serif text-lg font-bold text-ink-900 mb-1">No Debate Chambers Formed</h3>
        <p className="font-sans text-xs text-ink-600">
          Chamber matrices will materialize here as soon as a tournament round draw is executed.
        </p>
      </div>
    );
  }

  // Active round resolution
  const activeRound =
    localRounds.find((r) => r.round_number === selectedRoundNumber) ||
    localRounds[localRounds.length - 1];

  const matches = activeRound?.matches || [];
  const sealedCount = matches.filter((m) => m.is_submitted).length;
  const totalMatches = matches.length;
  const completionPercentage =
    totalMatches > 0 ? Math.round((sealedCount / totalMatches) * 100) : 0;

  const handleJudgeAllocated = (matchId, newJudge) => {
    setLocalRounds((prevRounds) =>
      prevRounds.map((r) => ({
        ...r,
        matches: (r.matches || []).map((m) =>
          m.match_id === matchId
            ? {
                ...m,
                judge_id: newJudge ? (newJudge.judge_id || newJudge.id) : null,
                judge: newJudge
                  ? {
                      judge_id: newJudge.judge_id || newJudge.id,
                      judge_name: newJudge.judge_name,
                      institution: newJudge.institution,
                      is_active: newJudge.is_active ?? true
                    }
                  : null
              }
            : m
        )
      }))
    );

    if (reassignMatch) {
      setToastMessage(`Adjudicator allocation sealed for ${reassignMatch.room_name}.`);
    }

    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Round Selection Tabs & Round Summary Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gold-light/40">
        <div>
          <h3 className="font-serif text-2xl font-bold text-ink-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-gold-deep" />
            <span>Debate Chamber Matrix</span>
          </h3>
          <p className="font-sans text-xs text-ink-600 mt-0.5">
            Real-time adjudication monitoring and ballot verdict verification.
          </p>
        </div>

        {/* Round Switcher Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {rounds.map((r) => {
            const isSelected = r.round_number === activeRound.round_number;
            return (
              <button
                key={r.round_id}
                onClick={() => onSelectRound && onSelectRound(r.round_number)}
                className={`px-3 py-1.5 rounded-md font-roman text-xs tracking-wider uppercase font-bold transition-all shadow-xs border ${
                  isSelected
                    ? 'bg-gold-deep text-white border-gold-deep/80 shadow-xs'
                    : 'bg-canvas-parchment text-ink-700 hover:text-ink-900 border-sky-blue/60 hover:bg-sky-light/40'
                }`}
              >
                Round {toRoman(r.round_number)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Round Info Banner */}
      <div className="rounded-xl bg-canvas-parchment border border-sky-blue/70 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-roman text-[10px] tracking-widest text-gold-deep uppercase font-bold px-2 py-0.5 rounded bg-gold-deep/10 border border-gold-deep/30">
              Round {toRoman(activeRound.round_number)} • {activeRound.status}
            </span>
            <span className="font-sans text-xs text-ink-600">
              {matches.length} Rooms • {matches.length * 4} Competing Debaters
            </span>
          </div>
          <p className="font-serif italic text-base text-ink-900 font-semibold line-clamp-2">
            "{activeRound.motion_text}"
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right font-sans">
            <span className="text-[10px] font-roman uppercase tracking-wider text-ink-600 block">
              Ballot Completion
            </span>
            <span className="font-serif font-bold text-lg text-ink-900">
              {sealedCount} / {totalMatches} Sealed ({completionPercentage}%)
            </span>
          </div>
          <div className="w-12 h-12 rounded-full border-2 border-gold-deep/40 bg-sky-light/50 flex items-center justify-center font-roman font-bold text-xs text-gold-deep">
            {completionPercentage}%
          </div>
        </div>
      </div>

      {/* Chamber Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {matches.map((match) => {
          const isSealed = match.is_submitted;

          // Sort participants in standard BP order [OG, OO, CG, CO]
          const sortedParticipants = [...(match.participants || [])].sort(
            (a, b) =>
              BENCH_ORDER.indexOf(a.bench_position) -
              BENCH_ORDER.indexOf(b.bench_position)
          );

          return (
            <div
              key={match.match_id}
              className="rounded-xl bg-canvas-parchment border border-sky-blue/70 hover:border-gold-deep/60 shadow-xs transition-all p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Chamber Title & Real-time Ballot Status */}
                <div className="flex items-center justify-between gap-2 border-b border-sky-blue/40 pb-2.5">
                  <div>
                    <span className="font-roman text-[10px] tracking-wider uppercase font-bold text-gold-deep">
                      Chamber {match.match_id}
                    </span>
                    <h4 className="font-serif text-xl font-bold text-ink-900 leading-tight">
                      {match.room_name}
                    </h4>
                  </div>

                  {isSealed ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-roman text-[10px] tracking-wider uppercase font-bold bg-[#EBF7EE] text-[#287A3E] border border-[#BDE5C8] shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ballot Sealed</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-roman text-[10px] tracking-wider uppercase font-bold bg-[#FBF3EB] text-[#8E522C] border border-[#E8D4C5] shadow-xs">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Awaiting Verdict</span>
                    </span>
                  )}
                </div>

                {/* Chair Adjudicator Info & Allocation Control */}
                <div className="flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg bg-sky-light/30 border border-sky-blue/40 font-sans text-xs">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <Scale className="w-4 h-4 text-gold-deep shrink-0" />
                    <div className="truncate">
                      {match.judge?.judge_name ? (
                        <>
                          <span className="font-semibold text-ink-900 block truncate">
                            {match.judge.judge_name}
                          </span>
                          {match.judge.institution && (
                            <span className="text-ink-600 text-[11px] block truncate">
                              {match.judge.institution}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-roman uppercase tracking-wider font-bold">
                          Unassigned Chair
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reassign / Amend Action */}
                  {isSealed ? (
                    <span
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded font-roman text-[10px] tracking-wider uppercase font-bold text-ink-400 bg-sky-light/20 border border-sky-blue/30 cursor-not-allowed shrink-0"
                      title="Chair allocation locked: Official ballot has been sealed"
                    >
                      <Lock className="w-3 h-3 text-gold-deep/60" />
                      <span>Chair Finalized</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReassignMatch(match)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded font-roman text-[11px] tracking-wider uppercase font-bold text-ink-800 bg-canvas-parchment hover:bg-sky-light/60 border border-sky-blue/60 hover:border-gold-deep shadow-2xs transition-all duration-200 shrink-0 cursor-pointer"
                      title={`Amend chair adjudicator for ${match.room_name}`}
                    >
                      <Gavel className="w-3.5 h-3.5 text-gold-deep" />
                      <span>Amend Chair</span>
                    </button>
                  )}
                </div>

                {/* The 4 Benches */}
                <div className="space-y-2 pt-1">
                  <span className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-400 block">
                    Bench Assignments
                  </span>
                  <div className="space-y-1.5 font-sans text-xs">
                    {sortedParticipants.map((p) => (
                      <div
                        key={p.participant_id}
                        className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/70 border border-sky-blue/40 hover:bg-sky-light/20 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <BenchBadge position={p.bench_position} size="xs" />
                          <div className="truncate">
                            <button
                              type="button"
                              onClick={() => setSelectedTeamId(p.team_id)}
                              className="font-serif font-bold text-ink-900 hover:text-gold-deep border-b border-dotted border-transparent hover:border-gold-deep transition-all duration-200 cursor-pointer block truncate text-left focus:outline-hidden"
                              title={`View dossier for ${p.team_name}`}
                            >
                              {p.team_name}
                            </button>
                            <span className="text-[11px] text-ink-600 block truncate">
                              {p.speaker_1_name} & {p.speaker_2_name}
                            </span>
                          </div>
                        </div>

                        {/* If match is submitted, preview Rank / Speaks */}
                        {isSealed && p.rank !== null && (
                          <div className="text-right shrink-0">
                            <span className="inline-flex items-center gap-1 font-roman text-xs font-bold text-gold-deep">
                              <Award className="w-3 h-3" />
                              <span>Rank {p.rank}</span>
                            </span>
                            <span className="text-[10px] text-ink-600 block font-mono">
                              {(p.speaker_1_score || 0) + (p.speaker_2_score || 0)} speaks
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Administrative Actions */}
              <div className="pt-3 border-t border-sky-blue/40 flex items-center justify-between gap-2">
                {isSealed ? (
                  <button
                    onClick={() => setInspectMatch(match)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md font-roman text-xs tracking-wider uppercase font-bold text-ink-800 bg-sky-light/60 hover:bg-sky-light border border-sky-blue/70 shadow-xs transition-all"
                  >
                    <Eye className="w-3.5 h-3.5 text-gold-deep" />
                    <span>Inspect Score Sheet</span>
                  </button>
                ) : (
                  <span className="font-sans text-[11px] text-ink-600 italic">
                    Tribunal in session...
                  </span>
                )}

                <Link
                  to={`/judge/matches/${match.match_id}/ballot`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md font-roman text-xs tracking-wider uppercase text-gold-deep hover:text-ink-900 hover:underline transition-all"
                  title="Administrative override of score sheet"
                >
                  <span>{isSealed ? 'Override Ballot' : 'E-Ballot Portal'}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: INSPECT SCORE SHEET */}
      {inspectMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-canvas-parchment border-2 border-gold-deep shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gold-light/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-deep/15 border border-gold-deep/40 flex items-center justify-center text-gold-deep">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-ink-900">
                    Sealed Score Sheet — {inspectMatch.room_name}
                  </h3>
                  <p className="font-sans text-xs text-ink-600">
                    Chair Adjudicator: {inspectMatch.judge?.judge_name || 'Assigned Tribunal'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectMatch(null)}
                className="text-ink-400 hover:text-ink-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-sky-blue/60 bg-white shadow-xs">
              <table className="w-full text-left border-collapse font-sans text-xs">
                <thead>
                  <tr className="bg-sky-light/40 border-b border-sky-blue/50 text-ink-900 font-roman tracking-wider uppercase text-[10px]">
                    <th className="py-2.5 px-3">Bench</th>
                    <th className="py-2.5 px-3">Team</th>
                    <th className="py-2.5 px-3">Speaker 1</th>
                    <th className="py-2.5 px-3">Speaker 2</th>
                    <th className="py-2.5 px-3 text-center">Speaks Total</th>
                    <th className="py-2.5 px-3 text-center">Rank</th>
                    <th className="py-2.5 px-3 text-center">Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sky-blue/30 text-ink-800">
                  {inspectMatch.participants?.map((p) => {
                    const totalSpeaks = (p.speaker_1_score || 0) + (p.speaker_2_score || 0);

                    return (
                      <tr key={p.participant_id} className="hover:bg-sky-light/20 transition-colors">
                        <td className="py-3 px-3">
                          <BenchBadge position={p.bench_position} size="xs" />
                        </td>
                        <td className="py-3 px-3">
                          <button
                            type="button"
                            onClick={() => setSelectedTeamId(p.team_id)}
                            className="font-serif font-bold text-sm text-ink-900 hover:text-gold-deep border-b border-dotted border-transparent hover:border-gold-deep transition-all duration-200 cursor-pointer text-left focus:outline-hidden"
                            title={`View dossier for ${p.team_name}`}
                          >
                            {p.team_name}
                          </button>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {p.speaker_1_name}: <span className="font-bold">{p.speaker_1_score ?? '-'}</span>
                        </td>
                        <td className="py-3 px-3 font-mono">
                          {p.speaker_2_name}: <span className="font-bold">{p.speaker_2_score ?? '-'}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-ink-900">
                          {totalSpeaks > 0 ? totalSpeaks : '-'}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="font-roman font-bold text-xs px-2 py-0.5 rounded bg-gold-deep/15 text-gold-deep border border-gold-deep/30">
                            {p.rank ? `${p.rank}` : '-'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-ink-900">
                          {p.points !== null ? `+${p.points}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="font-sans text-[11px] text-ink-600">
                Official British Parliamentary adjudication standards verified at submission.
              </span>
              <div className="flex items-center gap-3">
                <Link
                  to={`/judge/matches/${inspectMatch.match_id}/ballot`}
                  className="px-4 py-2 rounded-md font-roman text-xs tracking-wider uppercase font-bold bg-ink-900 hover:bg-ink-800 text-canvas-parchment border border-gold-deep shadow-xs"
                >
                  Edit / Override Ballot
                </Link>
                <button
                  type="button"
                  onClick={() => setInspectMatch(null)}
                  className="px-4 py-2 rounded-md font-roman text-xs uppercase tracking-wider text-ink-600 hover:text-ink-900 border border-sky-blue/60"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Renaissance Team Dossier Modal */}
      <TeamDossierModal
        teamId={selectedTeamId}
        isOpen={Boolean(selectedTeamId)}
        onClose={() => setSelectedTeamId(null)}
      />

      {/* Renaissance Reassign Adjudicator Modal */}
      <ReassignJudgeModal
        isOpen={Boolean(reassignMatch)}
        match={reassignMatch}
        roundNumber={activeRound?.round_number}
        roundMatches={matches}
        judges={judges}
        onClose={() => setReassignMatch(null)}
        onSuccess={handleJudgeAllocated}
      />

      {/* Classical Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl bg-canvas-parchment border-2 border-gold-deep text-ink-900 shadow-2xl animate-in slide-in-from-bottom-5 duration-200 ring-1 ring-gold-light/40">
          <div className="w-7 h-7 rounded-full bg-gold-deep/15 border border-gold-deep/40 flex items-center justify-center text-gold-deep shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
          <span className="font-roman text-xs tracking-wider uppercase font-bold">
            {toastMessage}
          </span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-ink-400 hover:text-ink-900 ml-2"
            aria-label="Dismiss Notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
