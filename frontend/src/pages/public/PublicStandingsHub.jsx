import React, { useState } from 'react';
import TeamStandings from './TeamStandings';
import SpeakerStandings from './SpeakerStandings';
import { Trophy, Mic } from 'lucide-react';

export default function PublicStandingsHub() {
  const [activeTab, setActiveTab] = useState('teams'); // 'teams' | 'speakers'

  return (
    <div className="space-y-8">
      {/* Classical Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-deep/10 border border-gold-deep/30 text-gold-deep font-roman text-xs tracking-widest uppercase">
          <span>Official Tournament Tabulation</span>
        </div>
        <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink-900 tracking-tight">
          Tournament Standings
        </h1>
        <p className="font-sans text-sm sm:text-base text-ink-600 max-w-xl mx-auto">
          Deliberations and standings computed dynamically under official British Parliamentary adjudication standards.
        </p>
      </div>

      {/* Classical Segmented Control Tabs */}
      <div className="flex justify-center">
        <div className="inline-flex p-1.5 rounded-lg bg-canvas-parchment border border-gold-light/50 shadow-xs">
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center gap-2 px-5 py-2 rounded-md font-roman text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 ${
              activeTab === 'teams'
                ? 'bg-gold-deep text-canvas-parchment font-bold shadow-xs'
                : 'text-ink-600 hover:text-ink-900 hover:bg-sky-light/40'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Curia of Teams</span>
          </button>

          <button
            onClick={() => setActiveTab('speakers')}
            className={`flex items-center gap-2 px-5 py-2 rounded-md font-roman text-xs sm:text-sm tracking-wider uppercase transition-all duration-200 ${
              activeTab === 'speakers'
                ? 'bg-gold-deep text-canvas-parchment font-bold shadow-xs'
                : 'text-ink-600 hover:text-ink-900 hover:bg-sky-light/40'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Tribune of Speakers</span>
          </button>
        </div>
      </div>

      {/* Active View */}
      {activeTab === 'teams' ? <TeamStandings /> : <SpeakerStandings />}
    </div>
  );
}
