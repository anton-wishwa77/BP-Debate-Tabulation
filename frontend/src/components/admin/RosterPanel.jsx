import React, { useState } from 'react';
import { api } from '../../api/client';
import {
  Users,
  UserPlus,
  Scale,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  HelpCircle,
  X,
  RefreshCw,
  Edit2
} from 'lucide-react';
import EditJudgeModal from './EditJudgeModal';
import EditTeamModal from './EditTeamModal';

export default function RosterPanel({ teams, judges, onRefresh, readOnly = false }) {
  // Modal states
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showAddJudgeModal, setShowAddJudgeModal] = useState(false);
  const [editingJudge, setEditingJudge] = useState(null);
  const [editingTeam, setEditingTeam] = useState(null);

  // Form states
  const [teamForm, setTeamForm] = useState({
    team_name: '',
    institution: '',
    speaker_1_name: '',
    speaker_2_name: ''
  });

  const [judgeForm, setJudgeForm] = useState({
    judge_name: '',
    institution: '',
    username: '',
    pin: ''
  });

  // Action states
  const [actionLoading, setActionLoading] = useState(false);
  const [swingNotification, setSwingNotification] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [visiblePins, setVisiblePins] = useState({});

  // Team search
  const [teamSearch, setTeamSearch] = useState('');
  const [judgeSearch, setJudgeSearch] = useState('');

  const remainder = teams.length % 4;
  const isDivisible = remainder === 0 && teams.length > 0;
  const neededSwing = remainder === 0 ? 0 : 4 - remainder;

  const togglePinVisibility = (judgeId) => {
    setVisiblePins((prev) => ({
      ...prev,
      [judgeId]: !prev[judgeId]
    }));
  };

  // Add Team Handler
  const handleAddTeam = async (e) => {
    e.preventDefault();
    if (!teamForm.team_name.trim() || !teamForm.institution.trim() || !teamForm.speaker_1_name.trim() || !teamForm.speaker_2_name.trim()) {
      setErrorMessage('All team fields are required.');
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    try {
      await api.createTeam(teamForm);
      setTeamForm({ team_name: '', institution: '', speaker_1_name: '', speaker_2_name: '' });
      setShowAddTeamModal(false);
      setSwingNotification({
        type: 'success',
        message: `Team "${teamForm.team_name}" registered successfully.`
      });
      await onRefresh();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to register team.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Team Handler
  const handleDeleteTeam = async (teamId, teamName) => {
    if (!window.confirm(`Are you certain you wish to remove "${teamName}" from the roster?`)) {
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    try {
      await api.deleteTeam(teamId);
      setSwingNotification({
        type: 'success',
        message: `Team "${teamName}" has been removed from the roster.`
      });
      await onRefresh();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to remove team. Matches may already reference it.');
    } finally {
      setActionLoading(false);
    }
  };

  // Invoke Rule of 4 Balancer
  const handleInvokeSwingBalancer = async () => {
    setActionLoading(true);
    setErrorMessage(null);
    setSwingNotification(null);
    try {
      const res = await api.addSwingTeams();
      if (res.added > 0) {
        setSwingNotification({
          type: 'success',
          message: `Rule of 4 Balancer invoked: Automatically drafted ${res.added} swing team(s) to restore chamber divisibility by 4.`
        });
      } else {
        setSwingNotification({
          type: 'info',
          message: 'The roster is already perfectly divisible by 4. No swing teams needed.'
        });
      }
      await onRefresh();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to invoke Swing Balancer.');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Judge Handler
  const handleAddJudge = async (e) => {
    e.preventDefault();
    if (!judgeForm.judge_name.trim() || !judgeForm.institution.trim() || !judgeForm.username.trim() || !judgeForm.pin.trim()) {
      setErrorMessage('All judge fields are required.');
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    try {
      await api.createJudge(judgeForm);
      setJudgeForm({ judge_name: '', institution: '', username: '', pin: '' });
      setShowAddJudgeModal(false);
      setSwingNotification({
        type: 'success',
        message: `Adjudicator "${judgeForm.judge_name}" inducted into the senate pool.`
      });
      await onRefresh();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to register adjudicator.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Judge Active Status
  const handleToggleJudgeActive = async (judge) => {
    setActionLoading(true);
    setErrorMessage(null);
    try {
      await api.updateJudge(judge.judge_id, {
        is_active: !judge.is_active
      });
      await onRefresh();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update adjudicator status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Judge Handler
  const handleDeleteJudge = async (judgeId, judgeName) => {
    if (!window.confirm(`Are you certain you wish to strike adjudicator "${judgeName}" from the roster?`)) {
      return;
    }

    setActionLoading(true);
    setErrorMessage(null);
    try {
      await api.deleteJudge(judgeId);
      setSwingNotification({
        type: 'success',
        message: `Adjudicator "${judgeName}" removed from the tournament directory.`
      });
      await onRefresh();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to remove adjudicator. Rooms may already be assigned.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered teams & judges
  const filteredTeams = teams.filter((t) => {
    const q = teamSearch.toLowerCase();
    return (
      t.team_name.toLowerCase().includes(q) ||
      t.institution.toLowerCase().includes(q) ||
      t.speaker_1_name.toLowerCase().includes(q) ||
      t.speaker_2_name.toLowerCase().includes(q)
    );
  });

  const filteredJudges = judges.filter((j) => {
    const q = judgeSearch.toLowerCase();
    return (
      j.judge_name.toLowerCase().includes(q) ||
      j.institution.toLowerCase().includes(q) ||
      j.username.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Notifications / Error Alert */}
      {errorMessage && (
        <div className="rounded-xl bg-[#F7EAEB] border border-[#E8C4C4] p-4 flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 text-[#9C3A3A] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-serif font-bold text-[#9C3A3A] text-sm">Senate Action Notice</h4>
            <p className="font-sans text-xs text-ink-800 mt-0.5">{errorMessage}</p>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-ink-400 hover:text-ink-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {swingNotification && (
        <div
          className={`rounded-xl p-4 flex items-start gap-3 shadow-xs border ${
            swingNotification.type === 'success'
              ? 'bg-[#EBF7EE] border-[#BDE5C8] text-[#287A3E]'
              : 'bg-sky-light/50 border-sky-blue text-ink-900'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-serif font-bold text-sm">Senate Balance Decree</h4>
            <p className="font-sans text-xs mt-0.5">{swingNotification.message}</p>
          </div>
          <button
            onClick={() => setSwingNotification(null)}
            className="opacity-60 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Rule of 4 Balancer Banner */}
      <div className="rounded-2xl bg-canvas-parchment border-2 border-gold-light/60 p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-blue via-gold-deep to-sky-blue" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="font-roman text-[10px] tracking-widest text-gold-deep uppercase font-bold px-2 py-0.5 rounded bg-gold-deep/10 border border-gold-deep/30">
                Rule of 4 Constraint
              </span>
              <span className="font-sans text-xs font-semibold text-ink-600">
                {teams.length} Teams Registered • {teams.filter((t) => t.is_swing).length} Swing
              </span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-ink-900">
              {isDivisible
                ? 'Roster Divisibility Satisfied (Divisible by 4)'
                : `Roster Imbalance: ${neededSwing} Swing Team(s) Required`}
            </h3>
            <p className="font-sans text-xs text-ink-600 leading-relaxed">
              British Parliamentary rounds mandate exactly 4 benches per chamber (OG, OO, CG, CO). If the team count leaves a remainder, the automated balancer drafts dummy swing teams to restore symmetry.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleInvokeSwingBalancer}
              disabled={actionLoading || isDivisible}
              className={`inline-flex items-center gap-2 px-5 py-3 rounded-lg font-roman text-xs tracking-wider uppercase font-bold shadow-xs transition-all duration-200 border ${
                isDivisible
                  ? 'bg-sky-light/40 text-ink-400 border-sky-blue/50 cursor-not-allowed'
                  : 'bg-gold-deep hover:bg-gold-deep/90 text-white border-gold-deep/80 hover:scale-[1.02]'
              }`}
            >
              <Sparkles className="w-4 h-4 text-gold-light" />
              <span>Invoke Rule of 4 Balancer</span>
            </button>
          </div>
        </div>
      </div>

      {/* TEAMS SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gold-light/40">
          <div>
            <h3 className="font-serif text-2xl font-bold text-ink-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-deep" />
              <span>Registered Debating Teams</span>
            </h3>
            <p className="font-sans text-xs text-ink-600 mt-0.5">
              Manage collegiate delegations, speaker pairings, and swing statuses.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search team or speaker..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-sky-blue/60 bg-canvas-parchment text-xs text-ink-800 placeholder-ink-400 focus:outline-hidden focus:border-gold-deep"
            />
            <button
              onClick={() => setShowAddTeamModal(true)}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md font-roman text-xs tracking-wider uppercase font-bold bg-ink-900 hover:bg-ink-800 text-canvas-parchment border border-gold-deep/70 shadow-xs transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 text-gold-light" />
              <span>Add Team</span>
            </button>
          </div>
        </div>

        {/* Teams Table */}
        <div className="rounded-xl bg-canvas-parchment border border-sky-blue/60 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-sky-light/40 border-b border-sky-blue/50 text-ink-900 font-roman tracking-wider uppercase text-[10px]">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Team Name</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Speaker 1</th>
                  <th className="py-3 px-4">Speaker 2</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-blue/30 text-ink-800">
                {filteredTeams.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-ink-400 font-serif italic text-sm">
                      No matching debate teams found in senate registry.
                    </td>
                  </tr>
                ) : (
                  filteredTeams.map((team, idx) => (
                    <tr key={team.team_id} className="hover:bg-sky-light/20 transition-colors">
                      <td className="py-3 px-4 font-mono text-ink-400 text-[11px]">{idx + 1}</td>
                      <td className="py-3 px-4 font-serif font-bold text-sm text-ink-900">
                        {team.team_name}
                      </td>
                      <td className="py-3 px-4 text-ink-600 flex items-center gap-1.5">
                        <Building2 className="w-3 h-3 text-gold-deep/70 shrink-0" />
                        <span className="truncate">{team.institution}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-ink-800">{team.speaker_1_name}</td>
                      <td className="py-3 px-4 font-medium text-ink-800">{team.speaker_2_name}</td>
                      <td className="py-3 px-4 text-center">
                        {team.is_swing ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-roman uppercase font-bold tracking-wider bg-[#F5ECE8] text-[#8E522C] border border-[#DFCECA]">
                            Swing
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-roman uppercase font-bold tracking-wider bg-sky-light/50 text-ink-600 border border-sky-blue/50">
                            Registered
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingTeam(team)}
                            disabled={actionLoading}
                            className="p-1.5 rounded text-ink-600 hover:text-gold-deep hover:bg-sky-light/50 transition-colors"
                            title={`Amend ${team.team_name} dossier`}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTeam(team.team_id, team.team_name)}
                            disabled={actionLoading}
                            className="p-1.5 rounded text-ink-400 hover:text-[#9C3A3A] hover:bg-[#F7EAEB] transition-colors"
                            title="Strike team from roster"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* JUDGES SECTION */}
      <div className="space-y-4 pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gold-light/40">
          <div>
            <h3 className="font-serif text-2xl font-bold text-ink-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-gold-deep" />
              <span>Adjudication Directorate</span>
            </h3>
            <p className="font-sans text-xs text-ink-600 mt-0.5">
              Manage chair adjudicators, secret tribunal PINs, and chamber allocation availability.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search adjudicator..."
              value={judgeSearch}
              onChange={(e) => setJudgeSearch(e.target.value)}
              className="px-3 py-1.5 rounded-md border border-sky-blue/60 bg-canvas-parchment text-xs text-ink-800 placeholder-ink-400 focus:outline-hidden focus:border-gold-deep"
            />
            <button
              onClick={() => setShowAddJudgeModal(true)}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md font-roman text-xs tracking-wider uppercase font-bold bg-ink-900 hover:bg-ink-800 text-canvas-parchment border border-gold-deep/70 shadow-xs transition-all"
            >
              <UserPlus className="w-3.5 h-3.5 text-gold-light" />
              <span>Add Adjudicator</span>
            </button>
          </div>
        </div>

        {/* Judges Table */}
        <div className="rounded-xl bg-canvas-parchment border border-sky-blue/60 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs">
              <thead>
                <tr className="bg-sky-light/40 border-b border-sky-blue/50 text-ink-900 font-roman tracking-wider uppercase text-[10px]">
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Adjudicator Name</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Username</th>
                  <th className="py-3 px-4">Authentication PIN</th>
                  <th className="py-3 px-4 text-center">Active Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-blue/30 text-ink-800">
                {filteredJudges.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-ink-400 font-serif italic text-sm">
                      No matching adjudicators found in senate records.
                    </td>
                  </tr>
                ) : (
                  filteredJudges.map((judge, idx) => {
                    const isPinVisible = !!visiblePins[judge.judge_id];

                    return (
                      <tr key={judge.judge_id} className="hover:bg-sky-light/20 transition-colors">
                        <td className="py-3 px-4 font-mono text-ink-400 text-[11px]">{idx + 1}</td>
                        <td className="py-3 px-4 font-serif font-bold text-sm text-ink-900">
                          {judge.judge_name}
                        </td>
                        <td className="py-3 px-4 text-ink-600 flex items-center gap-1.5">
                          <Building2 className="w-3 h-3 text-gold-deep/70 shrink-0" />
                          <span className="truncate">{judge.institution}</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-ink-600">@{judge.username}</td>
                        <td className="py-3 px-4">
                          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded bg-sky-light/40 border border-sky-blue/50 font-mono text-xs">
                            <span>{isPinVisible ? judge.pin : '••••'}</span>
                            <button
                              type="button"
                              onClick={() => togglePinVisibility(judge.judge_id)}
                              className="text-ink-400 hover:text-ink-900 transition-colors"
                              title={isPinVisible ? 'Mask PIN' : 'Reveal PIN'}
                            >
                              {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleJudgeActive(judge)}
                            disabled={actionLoading}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-roman text-[10px] tracking-wider uppercase font-bold transition-all shadow-xs border ${
                              judge.is_active
                                ? 'bg-[#EBF7EE] text-[#287A3E] border-[#BDE5C8] hover:bg-[#DFF1E4]'
                                : 'bg-[#F7EAEB] text-[#9C3A3A] border-[#E8C4C4] hover:bg-[#F2DFE1]'
                            }`}
                            title="Toggle active status"
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${judge.is_active ? 'bg-[#287A3E]' : 'bg-[#9C3A3A]'}`} />
                            <span>{judge.is_active ? 'Active' : 'Inactive'}</span>
                          </button>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingJudge(judge)}
                              disabled={actionLoading}
                              className="p-1.5 rounded text-ink-600 hover:text-gold-deep hover:bg-sky-light/50 transition-colors"
                              title={`Edit ${judge.judge_name} dossier`}
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteJudge(judge.judge_id, judge.judge_name)}
                              disabled={actionLoading}
                              className="p-1.5 rounded text-ink-400 hover:text-[#9C3A3A] hover:bg-[#F7EAEB] transition-colors"
                              title="Strike adjudicator from roster"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* MODAL: ADD TEAM */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-canvas-parchment border-2 border-gold-deep shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gold-light/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-deep/15 border border-gold-deep/40 flex items-center justify-center text-gold-deep">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-ink-900">Register Debate Delegation</h3>
                  <p className="font-sans text-xs text-ink-600">Induct two debaters representing their collegiate institution.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddTeamModal(false)}
                className="text-ink-400 hover:text-ink-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTeam} className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Colombo A"
                  value={teamForm.team_name}
                  onChange={(e) => setTeamForm({ ...teamForm, team_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-sky-blue/70 bg-white text-ink-900 focus:outline-hidden focus:border-gold-deep"
                />
              </div>

              <div className="space-y-1">
                <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700">Academic Institution *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. University of Colombo"
                  value={teamForm.institution}
                  onChange={(e) => setTeamForm({ ...teamForm, institution: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-sky-blue/70 bg-white text-ink-900 focus:outline-hidden focus:border-gold-deep"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700">Speaker 1 Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wishwa Fernando"
                    value={teamForm.speaker_1_name}
                    onChange={(e) => setTeamForm({ ...teamForm, speaker_1_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-sky-blue/70 bg-white text-ink-900 focus:outline-hidden focus:border-gold-deep"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700">Speaker 2 Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kavindu Sahan"
                    value={teamForm.speaker_2_name}
                    onChange={(e) => setTeamForm({ ...teamForm, speaker_2_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-sky-blue/70 bg-white text-ink-900 focus:outline-hidden focus:border-gold-deep"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gold-light/30">
                <button
                  type="button"
                  onClick={() => setShowAddTeamModal(false)}
                  className="px-4 py-2 rounded-md font-roman text-xs uppercase tracking-wider text-ink-600 hover:text-ink-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-md font-roman text-xs tracking-wider uppercase font-bold bg-ink-900 hover:bg-ink-800 text-canvas-parchment border border-gold-deep shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Inducting...' : 'Induct Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD JUDGE */}
      {showAddJudgeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-canvas-parchment border-2 border-gold-deep shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-gold-light/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-deep/15 border border-gold-deep/40 flex items-center justify-center text-gold-deep">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-bold text-ink-900">Induct Adjudicator</h3>
                  <p className="font-sans text-xs text-ink-600">Register a qualified chair adjudicator with portal credentials.</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddJudgeModal(false)}
                className="text-ink-400 hover:text-ink-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddJudge} className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dinesh Fernando"
                  value={judgeForm.judge_name}
                  onChange={(e) => setJudgeForm({ ...judgeForm, judge_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-sky-blue/70 bg-white text-ink-900 focus:outline-hidden focus:border-gold-deep"
                />
              </div>

              <div className="space-y-1">
                <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700">Institution *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Faculty of Law, University of Colombo"
                  value={judgeForm.institution}
                  onChange={(e) => setJudgeForm({ ...judgeForm, institution: e.target.value })}
                  className="w-full px-3 py-2 rounded-md border border-sky-blue/70 bg-white text-ink-900 focus:outline-hidden focus:border-gold-deep"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. dinesh_f"
                    value={judgeForm.username}
                    onChange={(e) => setJudgeForm({ ...judgeForm, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-md border border-sky-blue/70 bg-white text-ink-900 focus:outline-hidden focus:border-gold-deep"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-roman text-[10px] tracking-wider uppercase font-bold text-ink-700">Authentication PIN *</label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    pattern="[0-9]*"
                    required
                    placeholder="••••"
                    value={judgeForm.pin}
                    onChange={(e) => setJudgeForm({ ...judgeForm, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                    className="w-full px-3 py-2 rounded-md border border-sky-blue/70 bg-white text-ink-900 font-mono tracking-widest focus:outline-hidden focus:border-gold-deep"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gold-light/30">
                <button
                  type="button"
                  onClick={() => setShowAddJudgeModal(false)}
                  className="px-4 py-2 rounded-md font-roman text-xs uppercase tracking-wider text-ink-600 hover:text-ink-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-md font-roman text-xs tracking-wider uppercase font-bold bg-ink-900 hover:bg-ink-800 text-canvas-parchment border border-gold-deep shadow-xs disabled:opacity-50"
                >
                  {actionLoading ? 'Inducting...' : 'Induct Adjudicator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT JUDGE */}
      <EditJudgeModal
        judge={editingJudge}
        isOpen={Boolean(editingJudge)}
        onClose={() => setEditingJudge(null)}
        onUpdated={async () => {
          setSwingNotification({
            type: 'success',
            message: `Adjudicator "${editingJudge?.judge_name}" record sealed and updated.`
          });
          await onRefresh();
        }}
      />

      {/* MODAL: EDIT TEAM */}
      <EditTeamModal
        team={editingTeam}
        isOpen={Boolean(editingTeam)}
        onClose={() => setEditingTeam(null)}
        onUpdated={async (updatedTeam) => {
          const teamName = updatedTeam?.name || updatedTeam?.team_name || editingTeam?.team_name;
          setSwingNotification({
            type: 'success',
            message: `Delegation records for "${teamName}" officially amended.`
          });
          await onRefresh();
        }}
      />
    </div>
  );
}
