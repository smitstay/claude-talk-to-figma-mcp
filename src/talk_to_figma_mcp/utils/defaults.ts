import { Color, ColorWithDefaults } from '../types/color';

export const FIGMA_DEFAULTS = {
  color: {
    opacity: 1,
  },
  fill: {
    white: { r: 1, g: 1, b: 1, a: 1 },
    black: { r: 0, g: 0, b: 0, a: 1 },
  },
  shape: {
    polygon: {
      sides: 6,
    },
    star: {
      points: 5,
      innerRadius: 0.5,
    }
  }
} as const;

/**
 * Safely applies a default value only when the input is undefined.
 * Unlike || operator, this preserves falsy values like 0.
 */
export function applyDefault<T>(value: T | undefined, defaultValue: T): T {
  return value !== undefined ? value : defaultValue;
}

/**
 * Applies default values to a color object.
 * Alpha defaults to 1 if not specified, but preserves 0 (transparency).
 */
export function applyColorDefaults(color: Color): ColorWithDefaults {
  return {
    r: color.r,
    g: color.g,
    b: color.b,
    a: applyDefault(color.a, FIGMA_DEFAULTS.color.opacity)
  };
}