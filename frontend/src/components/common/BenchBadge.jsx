import React from 'react';

export const BENCH_CONFIG = {
  OG: {
    code: 'OG',
    name: 'Opening Government',
    shortName: 'Opening Govt',
    bg: 'bg-[#E9F2F7]',
    text: 'text-[#3A7CA5]',
    border: 'border-[#BDD5E7]',
    ring: 'focus:ring-[#3A7CA5]',
    tag: 'Gov'
  },
  OO: {
    code: 'OO',
    name: 'Opening Opposition',
    shortName: 'Opening Opp',
    bg: 'bg-[#F7EAEB]',
    text: 'text-[#9C3A3A]',
    border: 'border-[#E8C4C4]',
    ring: 'focus:ring-[#9C3A3A]',
    tag: 'Opp'
  },
  CG: {
    code: 'CG',
    name: 'Closing Government',
    shortName: 'Closing Govt',
    bg: 'bg-[#EBEFF5]',
    text: 'text-[#2A3A5C]',
    border: 'border-[#C5CFDF]',
    ring: 'focus:ring-[#2A3A5C]',
    tag: 'Gov'
  },
  CO: {
    code: 'CO',
    name: 'Closing Opposition',
    shortName: 'Closing Opp',
    bg: 'bg-[#F5ECE8]',
    text: 'text-[#8E522C]',
    border: 'border-[#DFCECA]',
    ring: 'focus:ring-[#8E522C]',
    tag: 'Opp'
  }
};

/**
 * BenchBadge renders a color-coded British Parliamentary bench badge
 * adhering strictly to the Renaissance styling rules in design_philosophy.md.
 * 
 * @param {string} position - 'OG' | 'OO' | 'CG' | 'CO'
 * @param {boolean} showFullName - whether to render the full bench title
 * @param {string} size - 'sm' | 'md' | 'lg'
 */
export default function BenchBadge({ position, showFullName = false, size = 'sm', className = '' }) {
  const bench = BENCH_CONFIG[position] || {
    code: position || '??',
    name: position || 'Unknown',
    shortName: position || 'Unknown',
    bg: 'bg-canvas-parchment',
    text: 'text-ink-600',
    border: 'border-ink-400'
  };

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px]',
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm font-semibold'
  }[size] || 'px-2 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-roman tracking-wider uppercase rounded-md border font-bold shadow-xs transition-colors ${bench.bg} ${bench.text} ${bench.border} ${sizeClasses} ${className}`}
      title={bench.name}
    >
      <span className="font-roman">{bench.code}</span>
      {showFullName && (
        <span className="font-sans font-normal tracking-normal text-[11px] opacity-90 lowercase first-letter:uppercase">
          {bench.shortName}
        </span>
      )}
    </span>
  );
}
