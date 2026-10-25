import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';

export default function AdminDashboardPlaceholder() {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-ink-900 border border-gold-deep flex items-center justify-center mx-auto text-gold-light shadow-xs">
        <Shield className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="font-roman text-xs tracking-widest text-gold-deep uppercase font-bold">
          Senate Curia • Phase 7
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900">
          Tabulation Director Console
        </h1>
        <p className="font-sans text-sm text-ink-600 max-w-md mx-auto">
          Tournament master controls, team/judge registration, swing balancer triggers, and Swiss draw generators will be accessible here in Phase 7.
        </p>
      </div>

      <div className="p-6 rounded-xl bg-canvas-parchment border border-gold-light/60 shadow-xs max-w-md mx-auto">
        <p className="font-serif italic text-ink-800 text-sm">
          "The Tabulation Director preserves the integrity of brackets, power-pairing, and bench allocations across all tournament rounds."
        </p>
      </div>

      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md font-roman text-xs tracking-wider uppercase text-ink-800 bg-sky-light/60 hover:bg-sky-light border border-sky-blue/70 shadow-xs transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-gold-deep" />
          <span>Return to Standings</span>
        </Link>
      </div>
    </div>
  );
}
