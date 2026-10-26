import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../../api/client';
import { Scale, Lock, User, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';

export default function JudgeLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // If already logged in, redirect straight to dashboard
  useEffect(() => {
    const saved = localStorage.getItem('forum_aeterna_judge');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed?.judge_id) {
          navigate('/judge/dashboard', { replace: true });
        }
      } catch (_) {
        localStorage.removeItem('forum_aeterna_judge');
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !pin.trim()) {
      setError('Both Username and PIN are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const judgeData = await api.loginJudge({
        username: username.trim(),
        pin: pin.trim(),
      });

      localStorage.setItem('forum_aeterna_judge', JSON.stringify(judgeData));
      navigate('/judge/dashboard');
    } catch (err) {
      setError(err.message || 'Invalid credentials or inactive adjudicator status');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u, p) => {
    setUsername(u);
    setPin(p);
    setError(null);
  };

  return (
    <div className="max-w-md mx-auto py-8 sm:py-12">
      {/* Back Link */}
      <div className="mb-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-roman text-xs tracking-wider uppercase text-ink-600 hover:text-ink-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-gold-deep" />
          <span>Return to Public Standings</span>
        </Link>
      </div>

      <div className="rounded-2xl bg-canvas-parchment border-2 border-gold-light/60 p-6 sm:p-8 shadow-sm relative overflow-hidden">
        {/* Classical Top Hairline Gradient */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-blue via-gold-deep to-sky-blue" />

        {/* Roman Seal Emblem Header */}
        <div className="text-center space-y-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-light/30 via-canvas-parchment to-sky-light/80 border-2 border-gold-deep/50 flex items-center justify-center mx-auto shadow-xs">
            <Scale className="w-8 h-8 text-gold-deep" />
          </div>

          <div>
            <span className="font-roman text-[10px] tracking-[0.25em] text-gold-deep uppercase font-bold block mb-1">
              Curia Adjudicatorum
            </span>
            <h1 className="font-serif text-3xl font-bold text-ink-900 tracking-tight">
              Tribunal of Adjudicators
            </h1>
            <p className="font-sans text-xs text-ink-600 mt-1 max-w-xs mx-auto">
              Enter adjudicator username and 4-digit security PIN to access assigned chambers.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg bg-[#F7EAEB] border border-[#E8C4C4] p-3.5 flex items-start gap-2.5 text-left">
            <AlertCircle className="w-4 h-4 text-[#9C3A3A] shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-sans text-xs font-semibold text-[#9C3A3A] block">
                Access Denied
              </span>
              <span className="font-sans text-xs text-ink-800">
                {error}
              </span>
            </div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block font-roman text-xs tracking-wider uppercase font-bold text-ink-900 mb-1.5">
              Adjudicator Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. dinesh_f"
                className="w-full pl-9 pr-3 py-2 rounded-md bg-canvas-marble border border-sky-blue/70 focus:border-gold-deep focus:ring-1 focus:ring-gold-deep font-sans text-sm text-ink-900 outline-hidden transition-all placeholder:text-ink-400"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-roman text-xs tracking-wider uppercase font-bold text-ink-900 mb-1.5">
              4-Digit Security PIN
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                maxLength={10}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full pl-9 pr-3 py-2 rounded-md bg-canvas-marble border border-sky-blue/70 focus:border-gold-deep focus:ring-1 focus:ring-gold-deep font-sans text-sm tracking-widest text-ink-900 outline-hidden transition-all placeholder:text-ink-400"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-md font-roman text-xs tracking-widest uppercase font-bold text-canvas-parchment bg-ink-900 hover:bg-ink-800 border border-gold-deep shadow-xs transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Lock className="w-4 h-4 text-gold-light" />
            <span>{loading ? 'Authenticating...' : 'Enter Sacred Chamber'}</span>
          </button>
        </form>

        {/* Demo Credentials Quick-Fill Toolbar */}
        <div className="mt-8 pt-5 border-t border-gold-light/40">
          <span className="font-roman text-[10px] tracking-wider uppercase font-bold text-gold-deep block text-center mb-2.5">
            Sri Lankan Circuit Demo Adjudicators
          </span>
          <div className="grid grid-cols-1 gap-2 text-left">
            <button
              type="button"
              onClick={() => handleQuickFill('dinesh_f', '1234')}
              className="px-2.5 py-1.5 rounded-md bg-sky-light/40 hover:bg-sky-light/80 border border-sky-blue/50 text-[11px] font-sans flex items-center justify-between text-ink-800 transition-colors"
            >
              <span className="font-semibold">Dinesh Fernando (UoC)</span>
              <span className="font-mono text-gold-deep">dinesh_f / 1234</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('sanjeewa_s', '4321')}
              className="px-2.5 py-1.5 rounded-md bg-sky-light/40 hover:bg-sky-light/80 border border-sky-blue/50 text-[11px] font-sans flex items-center justify-between text-ink-800 transition-colors"
            >
              <span className="font-semibold">Sanjeewa Senanayake (Ruhuna)</span>
              <span className="font-mono text-gold-deep">sanjeewa_s / 4321</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickFill('kavindi_h', '7890')}
              className="px-2.5 py-1.5 rounded-md bg-sky-light/40 hover:bg-sky-light/80 border border-sky-blue/50 text-[11px] font-sans flex items-center justify-between text-ink-800 transition-colors"
            >
              <span className="font-semibold">Kavindi Herath (Moratuwa)</span>
              <span className="font-mono text-gold-deep">kavindi_h / 7890</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
