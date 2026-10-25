import React from 'react';
import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-canvas-marble text-ink-800 antialiased selection:bg-gold-light/40 selection:text-ink-900">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {children}
      </main>

      {/* Classical Roman Footer */}
      <footer className="mt-auto border-t border-gold-light/40 bg-canvas-parchment/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col">
            <span className="font-serif text-lg font-bold text-ink-900">Forum Aeterna</span>
            <span className="font-roman text-[11px] tracking-widest text-gold-deep uppercase">
              Omnia Disputando Comprobantur • Established MMXXVI
            </span>
          </div>

          <p className="font-sans text-xs text-ink-600">
            British Parliamentary Tabulation Engine adhering to strict Rule of 4 &amp; LPW prohibitions.
          </p>
        </div>
      </footer>
    </div>
  );
}
