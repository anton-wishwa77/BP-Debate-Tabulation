import React, { useState, useEffect } from 'react';
import { api } from '../../api/client';
import {
  Award,
  X,
  AlertCircle,
  ShieldCheck,
  Building2,
  Users
} from 'lucide-react';

export default function EditTeamModal({ team, isOpen, onClose, onUpdated }) {
  const [formData, setFormData] = useState({
    name: '',
    institution: '',
    speaker_1_name: '',
    speaker_2_name: '',
    is_swing: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sync form state when team changes or modal opens
  useEffect(() => {
    if (team) {
      setFormData({
        name: team.team_name || team.name || '',
        institution: team.institution || '',
        speaker_1_name: team.speaker_1_name || '',
        speaker_2_name: team.speaker_2_name || '',
        is_swing: Boolean(team.is_swing)
      });
      setError(null);
    }
  }, [team, isOpen]);

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

  if (!isOpen || !team) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const trimmedName = formData.name.trim();
    const trimmedInstitution = formData.institution.trim();
    const trimmedSpeaker1 = formData.speaker_1_name.trim();
    const trimmedSpeaker2 = formData.speaker_2_name.trim();

    if (!trimmedName || !trimmedInstitution || !trimmedSpeaker1 || !trimmedSpeaker2) {
      setError('All delegation fields are required (team name, institution, and debaters).');
      return;
    }

    setLoading(true);
    try {
      const teamId = team.team_id || team.id;
      const res = await api.updateTeam(teamId, {
        name: trimmedName,
        team_name: trimmedName,
        institution: trimmedInstitution,
        speaker_1_name: trimmedSpeaker1,
        speaker_2_name: trimmedSpeaker2,
        is_swing: formData.is_swing
      });

      if (onUpdated) {
        await onUpdated(res.team || res);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to amend delegation records.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-team-title"
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
              <Award className="w-5 h-5 text-gold-deep" />
            </div>
            <div>
              <span className="font-roman text-[10px] tracking-[0.2em] text-gold-deep uppercase font-bold block">
                Senate Tabulation Directorate
              </span>
              <h3
                id="edit-team-title"
                className="font-serif text-2xl font-bold text-ink-900 leading-tight"
              >
                Amend Delegation Dossier
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
          {/* Team / Delegation Name */}
          <div className="space-y-1">
            <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700 flex items-center justify-between">
              <span>Team / Delegation Name *</span>
              <span className="text-ink-400 font-sans text-[10px] lowercase italic">must be unique</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Colombo A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-sky-blue/70 bg-white text-ink-900 font-serif font-bold text-sm focus:outline-hidden focus:border-gold-deep transition-colors"
            />
          </div>

          {/* Academic Institution */}
          <div className="space-y-1">
            <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-gold-deep" />
              <span>Institution / University *</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. University of Colombo"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-sky-blue/70 bg-white text-ink-900 focus:outline-hidden focus:border-gold-deep transition-colors"
            />
          </div>

          {/* Debater Roster in 2-column layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gold-deep" />
                <span>Speaker 1 Full Name *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Wishwa Fernando"
                value={formData.speaker_1_name}
                onChange={(e) => setFormData({ ...formData, speaker_1_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-sky-blue/70 bg-white text-ink-900 focus:outline-hidden focus:border-gold-deep transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-gold-deep" />
                <span>Speaker 2 Full Name *</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kavindu Sahan"
                value={formData.speaker_2_name}
                onChange={(e) => setFormData({ ...formData, speaker_2_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-sky-blue/70 bg-white text-ink-900 focus:outline-hidden focus:border-gold-deep transition-colors"
              />
            </div>
          </div>

          {/* Swing Team Status Roman Toggle Card */}
          <div className="pt-2">
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-sky-blue/60 bg-sky-light/20 cursor-pointer hover:border-gold-deep/60 transition-colors">
              <div className="space-y-0.5">
                <span className="font-roman text-xs uppercase font-bold tracking-wider text-ink-900 block">
                  Designate as Swing Delegation
                </span>
                <span className="font-sans text-[11px] text-ink-600 block">
                  Swing delegations balance chambers to multiples of four and do not advance to final rounds.
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.is_swing}
                onChange={(e) => setFormData({ ...formData, is_swing: e.target.checked })}
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
              className="px-4 py-2.5 rounded-lg font-roman text-xs uppercase tracking-wider text-ink-600 hover:text-ink-900 hover:bg-sky-light/40 transition-colors"
            >
              Discard
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-roman text-xs tracking-wider uppercase font-bold bg-ink-900 hover:bg-ink-800 text-canvas-parchment border border-gold-deep/80 shadow-xs disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <ShieldCheck className="w-4 h-4 text-gold-light" />
              <span>{loading ? 'Sealing...' : 'Seal Amendments'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
