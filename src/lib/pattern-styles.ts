import type {CSSProperties} from 'react';

export type PatternStyle = 'stripes' | 'dots' | 'grid' | 'crosshatch' | 'zigzag';

export const patternStyles: Record<PatternStyle, string> = {
  stripes:
    'repeating-linear-gradient(-45deg, transparent, transparent 6px, var(--stripe-color, rgba(0,0,0,0.03)) 6px, var(--stripe-color, rgba(0,0,0,0.03)) 7px)',
  dots:
    'radial-gradient(circle, var(--stripe-color, rgba(0,0,0,0.04)) 1px, transparent 1px)',
  grid:
    'linear-gradient(var(--stripe-color, rgba(0,0,0,0.03)) 1px, transparent 1px), linear-gradient(90deg, var(--stripe-color, rgba(0,0,0,0.03)) 1px, transparent 1px)',
  crosshatch:
    'repeating-linear-gradient(45deg, transparent, transparent 6px, var(--stripe-color, rgba(0,0,0,0.03)) 6px, var(--stripe-color, rgba(0,0,0,0.03)) 7px), repeating-linear-gradient(-45deg, transparent, transparent 6px, var(--stripe-color, rgba(0,0,0,0.03)) 6px, var(--stripe-color, rgba(0,0,0,0.03)) 7px)',
  zigzag:
    'linear-gradient(135deg, var(--stripe-color, rgba(0,0,0,0.03)) 25%, transparent 25%), linear-gradient(225deg, var(--stripe-color, rgba(0,0,0,0.03)) 25%, transparent 25%), linear-gradient(315deg, var(--stripe-color, rgba(0,0,0,0.03)) 25%, transparent 25%), linear-gradient(45deg, var(--stripe-color, rgba(0,0,0,0.03)) 25%, transparent 25%)'
};

export const patternSizes: Record<PatternStyle, string> = {
  stripes: '',
  dots: '12px 12px',
  grid: '16px 16px',
  crosshatch: '',
  zigzag: '16px 16px'
};

export function getPatternStyle(patternStyle: PatternStyle): CSSProperties {
  return {
    backgroundImage: patternStyles[patternStyle],
    ...(patternSizes[patternStyle]
      ? { backgroundSize: patternSizes[patternStyle] }
      : {})
  };
}