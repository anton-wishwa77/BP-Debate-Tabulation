import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Scale,
  X,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Check
} from 'lucide-react';

export default function EditJudgeModal({ judge, isOpen, onClose, onUpdated }) {
  const [formData, setFormData] = useState({
    judge_name: '',
    institution: '',
    username: '',
    pin: '',
    is_active: true
  });
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync form state when judge changes
  useEffect(() => {
    if (judge) {
      setFormData({
        judge_name: judge.judge_name || '',
        institution: judge.institution || '',
        username: judge.username || '',
        pin: judge.pin || '',
        is_active: judge.is_active !== undefined ? judge.is_active : true
      });
      setError(null);
      setShowPin(false);
    }
  }, [judge, isOpen]);

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

  if (!isOpen || !judge) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedName = formData.judge_name.trim();
    const trimmedInstitution = formData.institution.trim();
    const trimmedUsername = formData.username.trim();
    const trimmedPin = formData.pin.trim();

    if (!trimmedName || !trimmedInstitution || !trimmedUsername) {
      setError('Adjudicator Name, Institution, and Username are required.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(trimmedUsername)) {
      setError('Username may only contain letters, numbers, and underscores.');
      return;
    }

    if (!/^\d{4}$/.test(trimmedPin)) {
      setError('Tribunal PIN must be exactly 4 numeric digits.');
      return;
    }

    setLoading(true);
    try {
      await api.updateJudge(judge.judge_id || judge.id, {
        judge_name: trimmedName,
        institution: trimmedInstitution,
        username: trimmedUsername,
        pin: trimmedPin,
        is_active: formData.is_active
      });

      if (onUpdated) {
        await onUpdated();
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update adjudicator profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-judge-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-lg rounded-2xl bg-canvas-parchment border-2 border-gold-deep shadow-2xl p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-200 ring-1 ring-gold-light/40 overflow-hidden">
        {/* Classical Gold Accent Hairline */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-blue via-gold-deep to-sky-blue" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-gold-light/40 pb-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-light/40 via-canvas-parchment to-sky-light/80 border border-gold-deep/50 flex items-center justify-center text-gold-deep shadow-xs shrink-0">
              <Scale className="w-5 h-5 text-gold-deep" />
            </div>
            <div>
              <span className="font-roman text-[10px] tracking-[0.2em] text-gold-deep uppercase font-bold block">
                Senate Tabulation Directorate
              </span>
              <h3
                id="edit-judge-title"
                className="font-serif text-2xl font-bold text-ink-900 leading-tight"
              >
                Edit Adjudicator Dossier
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-sky-light/50 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="rounded-xl bg-[#F7EAEB] border border-[#E8C4C4] p-3.5 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#9C3A3A] shrink-0 mt-0.5" />
            <p className="font-sans text-xs text-[#9C3A3A] font-medium leading-relaxed">
              {error}
            </p>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 font-sans text-xs">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700">
              Adjudicator Full Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dinesh Fernando, PC"
              value={formData.judge_name}
              onChange={(e) => setFormData({ ...formData, judge_name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-sky-blue/70 bg-white text-ink-900 focus:outline-hidden focus:border-gold-deep transition-colors"
            />
          </div>

          {/* Academic Institution */}
          <div className="space-y-1">
            <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700">
              Institution / Affiliation *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Faculty of Law, University of Colombo"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-sky-blue/70 bg-white text-ink-900 focus:outline-hidden focus:border-gold-deep transition-colors"
            />
          </div>

          {/* Username & PIN in 2-column layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700">
                Portal Username *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. dinesh_f"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-sky-blue/70 bg-white text-ink-900 font-mono focus:outline-hidden focus:border-gold-deep transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700">
                4-Digit Access PIN *
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={formData.pin}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pin: e.target.value.replace(/\D/g, '').slice(0, 4)
                    })
                  }
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-sky-blue/70 bg-white text-ink-900 font-mono tracking-widest focus:outline-hidden focus:border-gold-deep transition-colors"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-ink-400 hover:text-ink-800 transition-colors"
                  title={showPin ? 'Mask PIN' : 'Reveal PIN'}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Active Status Roman Toggle Card */}
          <div className="pt-2">
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-sky-blue/60 bg-sky-light/20 cursor-pointer hover:border-gold-deep/60 transition-colors">
              <div className="space-y-0.5">
                <span className="font-roman text-xs uppercase font-bold tracking-wider text-ink-900 block">
                  Tribunal Availability Status
                </span>
                <span className="font-sans text-[11px] text-ink-600 block">
                  Active adjudicators may be drafted as chamber chairs in tournament draws.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-5 h-5 rounded border-sky-blue text-gold-deep focus:ring-gold-deep cursor-pointer accent-gold-deep"
              />
            </label>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gold-light/30">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-lg font-roman text-xs uppercase tracking-wider text-ink-600 hover:text-ink-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-roman text-xs tracking-wider uppercase font-bold bg-ink-900 hover:bg-ink-800 text-canvas-parchment border border-gold-deep/80 shadow-xs disabled:opacity-50 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-gold-light" />
              <span>{loading ? 'Sealing...' : 'Seal Revisions'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
