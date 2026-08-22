import { describe, it, expect } from 'vitest';
import { resolveConfig, DEFAULT_CONFIG } from '../src/config.js';

describe('Configuration Utilities', () => {
  it('should return default config when no inputs provided', () => {
    const config = resolveConfig(null, {});
    expect(config).toEqual(DEFAULT_CONFIG);
  });

  it('should override default config with file config', () => {
    const fileConfig = {
      packs: ['generic', 'br'],
      minSeverity: 'high' as const,
      minConfidence: 0.8,
      ignore: ['*.txt'],
    };

    const config = resolveConfig(fileConfig, {});

    expect(config.packs).toEqual(['generic', 'br']);
    expect(config.minSeverity).toBe('high');
    expect(config.minConfidence).toBe(0.8);
    // Ignore should merge
    expect(config.ignore).toContain('*.txt');
    expect(config.ignore).toContain('node_modules/**');
  });

  it('should override file config with cli options', () => {
    const fileConfig = {
      packs: ['generic', 'br'],
      minSeverity: 'high' as const,
      minConfidence: 0.8,
    };

    const cliConfig = {
      packs: ['generic'],
      minSeverity: 'critical' as const,
    };

    const config = resolveConfig(fileConfig, cliConfig);

    expect(config.packs).toEqual(['generic']);
    expect(config.minSeverity).toBe('critical');
    // From file config
    expect(config.minConfidence).toBe(0.8);
  });
});
