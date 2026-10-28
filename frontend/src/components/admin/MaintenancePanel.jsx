import React, { useState } from 'react';
import { api } from '../../api/client';
import {
  Download,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Database,
  History,
  X,
  Sparkles
} from 'lucide-react';

export default function MaintenancePanel({ onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);

  // Export Standings to CSV
  const handleExportCSV = async () => {
    setLoading(true);
    setError(null);
    try {
      const [teamStandings, speakerStandings] = await Promise.all([
        api.getTeamStandings(),
        api.getSpeakerStandings()
      ]);

      const teamsData = Array.isArray(teamStandings) ? teamStandings : [];
      const speakersData = Array.isArray(speakerStandings) ? speakerStandings : [];

      // Build CSV Content
      let csv = '';

      // Section 1: Team Standings
      csv += '--- FORUM AETERNA: OFFICIAL TEAM STANDINGS ---\r\n';
      csv += 'Rank,Team Name,Institution,Total Points,Total Speaks,Rounds Played,Bench History,Swing Status\r\n';
      teamsData.forEach((team, idx) => {
        const benchStr = Array.isArray(team.bench_history) ? team.bench_history.join(' -> ') : '';
        const escape = (text) => `"${String(text || '').replace(/"/g, '""')}"`;

        csv += [
          idx + 1,
          escape(team.team_name),
          escape(team.institution),
          team.total_points ?? 0,
          team.total_speaks ?? 0,
          team.rounds_played ?? 0,
          escape(benchStr),
          team.is_swing ? 'Yes' : 'No'
        ].join(',') + '\r\n';
      });

      csv += '\r\n';

      // Section 2: Speaker Leaderboard
      csv += '--- FORUM AETERNA: INDIVIDUAL SPEAKER LEADERBOARD ---\r\n';
      csv += 'Rank,Speaker Name,Team Name,Institution,Rounds Spoken,Total Speaks,Average Score\r\n';
      speakersData.forEach((speaker, idx) => {
        const escape = (text) => `"${String(text || '').replace(/"/g, '""')}"`;

        csv += [
          idx + 1,
          escape(speaker.speaker_name),
          escape(speaker.team_name),
          escape(speaker.institution),
          speaker.rounds_spoken ?? 0,
          speaker.total_speaker_score ?? 0,
          speaker.average_score ?? 0.0
        ].join(',') + '\r\n';
      });

      // Trigger Browser Download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `forum_aeterna_standings_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setNotification({
        type: 'success',
        message: 'Standings and speaker marks successfully exported to CSV.'
      });
    } catch (err) {
      setError(err.message || 'Failed to export standings data.');
    } finally {
      setLoading(false);
    }
  };

  // Reset and Re-seed Database
  const handleResetAndSeed = async () => {
    setLoading(true);
    setError(null);
    setShowResetModal(false);
    try {
      // 1. Truncate tables
      await api.resetDatabase();
      // 2. Re-seed Sri Lankan university teams & adjudicators
      const seedRes = await api.seedDatabase();

      setNotification({
        type: 'success',
        message: `Database reset completed. Restored ${seedRes.teams || 8} authentic Sri Lankan university teams and ${seedRes.judges || 3} chair adjudicators.`
      });

      if (onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      setError(err.message || 'Failed to reset and re-seed database.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Notifications */}
      {error && (
        <div className="rounded-xl bg-[#F7EAEB] border border-[#E8C4C4] p-4 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-[#9C3A3A] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-serif font-bold text-[#9C3A3A] text-sm">System Maintenance Notice</h4>
            <p className="font-sans text-xs text-ink-800 mt-0.5">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-ink-400 hover:text-ink-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {notification && (
        <div className="rounded-xl bg-[#EBF7EE] border border-[#BDE5C8] p-4 flex items-start gap-3 shadow-xs text-[#287A3E]">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-serif font-bold text-sm">Operation Confirmed</h4>
            <p className="font-sans text-xs mt-0.5">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(null)} className="opacity-60 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Export and Reset */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Export Card */}
        <div className="rounded-2xl bg-canvas-parchment border border-sky-blue/70 hover:border-gold-deep/60 p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-gold-deep/15 border border-gold-deep/40 flex items-center justify-center text-gold-deep">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <span className="font-roman text-[10px] tracking-widest text-gold-deep uppercase font-bold">
                Archives & Publications
              </span>
              <h3 className="font-serif text-2xl font-bold text-ink-900 mt-1">
                Export Standings to CSV
              </h3>
            </div>
            <p className="font-sans text-xs text-ink-600 leading-relaxed">
              Compile and generate a comprehensive tabular `.csv` spreadsheet containing real-time Team Standings (ranks, points, speaks, bench histories) and Individual Speaker Leaderboards (total speaks, round averages).
            </p>
          </div>

          <div className="pt-4 border-t border-sky-blue/40">
            <button
              onClick={handleExportCSV}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-roman text-xs tracking-wider uppercase font-bold bg-ink-900 hover:bg-ink-800 text-canvas-parchment border border-gold-deep shadow-xs transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-gold-light" />
              <span>{loading ? 'Compiling Archive...' : 'Download Standings CSV'}</span>
            </button>
          </div>
        </div>

        {/* Database Reset & Seed Card */}
        <div className="rounded-2xl bg-canvas-parchment border border-[#E8C4C4] hover:border-[#9C3A3A]/60 p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-[#F7EAEB] border border-[#E8C4C4] flex items-center justify-center text-[#9C3A3A]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <span className="font-roman text-[10px] tracking-widest text-[#9C3A3A] uppercase font-bold">
                Chamber Restoration
              </span>
              <h3 className="font-serif text-2xl font-bold text-ink-900 mt-1">
                Reset Chamber Database
              </h3>
            </div>
            <p className="font-sans text-xs text-ink-600 leading-relaxed">
              Truncate all rounds, matches, and participant ballots, then restore the pristine Sri Lankan university circuit demo state (8 teams: Ruhuna, Moratuwa, Colombo, Peradeniya, Law College, J'pura, Kelaniya, KDU, and 3 chair adjudicators).
            </p>
          </div>

          <div className="pt-4 border-t border-[#E8C4C4]/60">
            <button
              onClick={() => setShowResetModal(true)}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-roman text-xs tracking-wider uppercase font-bold bg-[#F7EAEB] hover:bg-[#F2DFE1] text-[#9C3A3A] border border-[#E8C4C4] shadow-xs transition-all disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset & Seed Sri Lankan Circuit</span>
            </button>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL: RESET */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-canvas-parchment border-2 border-[#9C3A3A] shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#F7EAEB] border border-[#E8C4C4] flex items-center justify-center text-[#9C3A3A] shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-bold text-ink-900">
                  Confirm Chamber Reset
                </h3>
                <span className="font-roman text-[10px] tracking-wider uppercase font-bold text-[#9C3A3A]">
                  Irreversible Action
                </span>
              </div>
            </div>

            <p className="font-sans text-xs text-ink-700 leading-relaxed">
              This action will permanently purge all rounds, debate pairings, and submitted ballots. The database will then be re-populated with the standard 8 Sri Lankan university debate delegations and 3 chair adjudicators.
            </p>

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-gold-light/30">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-4 py-2 rounded-md font-roman text-xs uppercase tracking-wider text-ink-600 hover:text-ink-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetAndSeed}
                disabled={loading}
                className="px-5 py-2.5 rounded-md font-roman text-xs tracking-wider uppercase font-bold bg-[#9C3A3A] hover:bg-[#852E2E] text-white border border-[#752626] shadow-xs transition-all disabled:opacity-50"
              >
                {loading ? 'Resetting...' : 'Execute Reset & Seed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
