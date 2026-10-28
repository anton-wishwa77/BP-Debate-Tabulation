import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Trophy, Scroll, Scale, Shield, Menu, X, Landmark } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-2 px-3 py-2 rounded-md font-roman text-sm tracking-wider uppercase transition-all duration-200 border ${
      isActive
        ? 'border-gold-deep/60 bg-gold-deep/10 text-ink-900 font-bold shadow-xs'
        : 'border-transparent text-ink-600 hover:text-ink-900 hover:border-sky-blue/50 hover:bg-sky-light/40'
    }`;

  return (
    <header className="sticky top-0 z-50 bg-canvas-parchment/95 backdrop-blur-md border-b border-gold-light/40 shadow-xs">
      {/* Classical Golden Hairline Header Accent */}
      <div className="h-1 bg-gradient-to-r from-sky-light via-gold-deep to-sky-light" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Roman Banner Title */}
          <Link to="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-gold-light/40 via-canvas-parchment to-sky-light/80 border border-gold-deep/40 flex items-center justify-center shadow-xs group-hover:border-gold-deep transition-all duration-300">
              <Landmark className="w-6 h-6 text-gold-deep group-hover:scale-105 transition-transform" />
            </div>
            <div className="flex flex-col">
              <span className="font-roman text-[10px] sm:text-[11px] tracking-[0.25em] text-gold-deep uppercase font-semibold leading-none mb-1">
                British Parliamentary Tabulation
              </span>
              <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-ink-900 group-hover:text-gold-deep transition-colors leading-none">
                Forum Aeterna
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink to="/" end className={navLinkClass}>
              <Trophy className="w-4 h-4 text-gold-deep" />
              <span>Standings</span>
            </NavLink>

            <NavLink to="/draws" className={navLinkClass}>
              <Scroll className="w-4 h-4 text-gold-deep" />
              <span>Draws & Motions</span>
            </NavLink>
          </nav>

          {/* Crest Action Buttons (Judge & Admin Portals) */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/judge"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md font-roman text-xs tracking-wider uppercase text-ink-800 bg-sky-light/60 hover:bg-sky-light border border-sky-blue/70 hover:border-gold-deep/60 shadow-xs transition-all duration-200"
              title="Adjudicator PIN Authentication & Digital Ballot Form"
            >
              <Scale className="w-3.5 h-3.5 text-gold-deep" />
              <span>Judge Portal</span>
            </Link>

            <Link
              to="/admin"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md font-roman text-xs tracking-wider uppercase text-canvas-parchment bg-ink-900 hover:bg-ink-800 border border-gold-deep/60 shadow-xs transition-all duration-200 hover:border-gold-light"
              title="Senate Tabulation Director Console"
            >
              <Shield className="w-3.5 h-3.5 text-gold-light" />
              <span>Senate Admin</span>
            </Link>
          </div>

          {/* Mobile Right Bar: Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2 rounded-md text-ink-600 hover:text-ink-900 hover:bg-sky-light/40 border border-sky-blue/40"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gold-light/30 bg-canvas-parchment px-4 pt-3 pb-6 space-y-3">
          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className={navLinkClass}
          >
            <Trophy className="w-4 h-4 text-gold-deep" />
            <span>Standings</span>
          </NavLink>

          <NavLink
            to="/draws"
            onClick={() => setMobileMenuOpen(false)}
            className={navLinkClass}
          >
            <Scroll className="w-4 h-4 text-gold-deep" />
            <span>Draws & Motions</span>
          </NavLink>

          <div className="pt-3 border-t border-sky-blue/40 flex flex-col gap-2">
            <Link
              to="/judge"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-md font-roman text-xs tracking-wider uppercase text-ink-800 bg-sky-light/60 border border-sky-blue/70"
            >
              <Scale className="w-3.5 h-3.5 text-gold-deep" />
              <span>Judge Portal</span>
            </Link>

            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 px-3 py-2 rounded-md font-roman text-xs tracking-wider uppercase text-canvas-parchment bg-ink-900 border border-gold-deep/60"
            >
              <Shield className="w-3.5 h-3.5 text-gold-light" />
              <span>Senate Admin</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
