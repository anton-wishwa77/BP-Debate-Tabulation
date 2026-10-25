import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, ArrowLeft } from 'lucide-react';

export default function JudgePortalPlaceholder() {
  return (
    <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-sky-light/60 border border-sky-blue flex items-center justify-center mx-auto text-gold-deep shadow-xs">
        <Scale className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <span className="font-roman text-xs tracking-widest text-gold-deep uppercase font-bold">
          Adjudication Core • Phase 6
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink-900">
          Adjudicator Portal &amp; E-Ballot
        </h1>
        <p className="font-sans text-sm text-ink-600 max-w-md mx-auto">
          Adjudicator PIN login, room-scoped ballot entry, and real-time Low-Point Win mathematical validators will be active in Phase 6.
        </p>
      </div>

      <div className="p-6 rounded-xl bg-canvas-parchment border border-gold-light/60 shadow-xs max-w-md mx-auto">
        <p className="font-serif italic text-ink-800 text-sm">
          "The chairs shall deliberate in solemn assembly, scoring speech and strategy without concession to low-point triumphs."
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
