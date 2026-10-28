import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Scale, X, Check, AlertCircle, ShieldAlert, UserX } from 'lucide-react';

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

export default function ReassignJudgeModal({
  isOpen,
  match,
  roundNumber,
  roundMatches = [],
  judges = [],
  onClose,
  onSuccess
}) {
  const [selectedJudgeId, setSelectedJudgeId] = useState('');
  const [allJudges, setAllJudges] = useState(judges);
  const [loading, setLoading] = useState(false);
  const [fetchingJudges, setFetchingJudges] = useState(false);
  const [error, setError] = useState(null);

  // Initialize selected judge when match changes
  useEffect(() => {
    if (match) {
      setSelectedJudgeId(match.judge?.judge_id ? String(match.judge.judge_id) : '');
      setError(null);
    }
  }, [match]);

  // Fetch judges if not passed via props
  useEffect(() => {
    if (isOpen && (!judges || judges.length === 0)) {
      setFetchingJudges(true);
      api.getJudges()
        .then((data) => {
          setAllJudges(Array.isArray(data) ? data : []);
        })
        .catch((err) => {
          setError(err.message || 'Failed to load registered adjudicators');
        })
        .finally(() => setFetchingJudges(false));
    } else if (judges && judges.length > 0) {
      setAllJudges(judges);
    }
  }, [isOpen, judges]);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen || !match) return null;

  // Build a map of judges already assigned to other rooms in this round
  const conflictMap = {};
  for (const rm of roundMatches) {
    if (rm.match_id !== match.match_id && rm.judge?.judge_id) {
      conflictMap[rm.judge.judge_id] = rm.room_name;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const targetJudgeId = selectedJudgeId ? parseInt(selectedJudgeId, 10) : null;

    try {
      const response = await api.reassignMatchJudge(match.match_id, targetJudgeId);
      if (onSuccess) {
        onSuccess(match.match_id, response.judge);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update adjudicator chair allocation');
    } finally {
      setLoading(false);
    }
  };

  const currentJudgeName = match.judge?.judge_name;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) onClose();
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-canvas-parchment border-2 border-gold-deep shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200 relative overflow-hidden ring-1 ring-gold-light/40"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Classical Golden Hairline Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-light via-gold-deep to-sky-light" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-gold-light/50 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-light/40 via-canvas-parchment to-sky-light/80 border border-gold-deep/50 flex items-center justify-center text-gold-deep shadow-xs">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <span className="font-roman text-[10px] tracking-widest text-gold-deep uppercase font-bold block">
                Senate Tabulation Directorate
              </span>
              <h3 id="modal-title" className="font-serif text-2xl font-bold text-ink-900 leading-tight">
                Chamber Adjudicator Allocation
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-sky-light/40 transition-colors disabled:opacity-50"
            aria-label="Close Allocation Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chamber Details Badge */}
        <div className="rounded-xl bg-sky-light/30 border border-sky-blue/60 p-4 space-y-2 font-sans text-xs">
          <div className="flex items-center justify-between">
            <span className="font-roman text-[10px] tracking-wider uppercase font-bold text-gold-deep">
              Round {roundNumber ? toRoman(roundNumber) : '—'}
            </span>
            <span className="font-mono text-ink-400 text-[11px]">
              Chamber ID: #{match.match_id}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-serif font-bold text-base text-ink-900">
              {match.room_name}
            </span>
            <span className="text-ink-600">
              Currently: <strong className="text-ink-900 font-semibold">{currentJudgeName || 'Unassigned Chair'}</strong>
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="rounded-xl bg-[#FDF3E7] border border-[#E59866] p-4 flex items-start gap-3 shadow-2xs">
            <ShieldAlert className="w-5 h-5 text-[#A04000] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-roman text-xs tracking-wider uppercase font-bold text-[#A04000] block">
                Allocation Restriction
              </span>
              <p className="font-sans text-xs text-[#6E2C00] leading-relaxed">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Allocation Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="judge-select"
              className="block font-roman text-xs tracking-wider uppercase font-bold text-ink-800"
            >
              Presiding Chair Adjudicator
            </label>
            <div className="relative">
              <select
                id="judge-select"
                value={selectedJudgeId}
                onChange={(e) => {
                  setSelectedJudgeId(e.target.value);
                  setError(null);
                }}
                disabled={loading || fetchingJudges}
                className="w-full rounded-lg bg-white border border-sky-blue/70 focus:border-gold-deep focus:ring-1 focus:ring-gold-deep/50 py-2.5 px-3 font-sans text-xs sm:text-sm text-ink-900 shadow-2xs transition-all duration-200 cursor-pointer disabled:opacity-50"
              >
                <option value="">— No Adjudicator (Vacate Chair) —</option>
                {allJudges
                  .filter((j) => j.is_active !== false)
                  .map((j) => {
                    const isConflicted = conflictMap[j.judge_id];
                    const isCurrent = match.judge?.judge_id === j.judge_id;

                    return (
                      <option
                        key={j.judge_id}
                        value={j.judge_id}
                        disabled={Boolean(isConflicted)}
                      >
                        {j.judge_name} ({j.institution})
                        {isCurrent ? ' [Current Chair]' : ''}
                        {isConflicted ? ` (Assigned: ${isConflicted})` : ''}
                      </option>
                    );
                  })}
              </select>
            </div>
            <p className="font-sans text-[11px] text-ink-600">
              Only active adjudicators unassigned to other chambers in this round may be allocated.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gold-light/40 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-md font-roman text-xs tracking-wider uppercase font-bold text-ink-700 hover:text-ink-900 border border-sky-blue/70 hover:bg-sky-light/40 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md font-roman text-xs tracking-widest uppercase font-bold text-canvas-parchment bg-ink-900 hover:bg-ink-800 border border-gold-deep shadow-sm transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4 text-gold-light" />
              <span>{loading ? 'Sealing...' : 'Seal Allocation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
