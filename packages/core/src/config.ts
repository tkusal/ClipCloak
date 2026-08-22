import type { ClipCloakConfig } from './types.js';

export const DEFAULT_CONFIG: ClipCloakConfig = {
  packs: ['generic'],
  minSeverity: 'low',
  minConfidence: 0.5,
  ignore: [
    'node_modules/**',
    'dist/**',
    'build/**',
    '.git/**',
    '*.example',
    '*.sample'
  ],
};

/**
 * Merges loaded config with CLI options, where CLI options have precedence.
 * And both override defaults.
 */
export function resolveConfig(
  fileConfig: Partial<ClipCloakConfig> | null,
  cliOptions: Partial<ClipCloakConfig>
): ClipCloakConfig {
  const mergedConfig = { ...DEFAULT_CONFIG };

  if (fileConfig) {
    if (fileConfig.packs) mergedConfig.packs = fileConfig.packs;
    if (fileConfig.minSeverity) mergedConfig.minSeverity = fileConfig.minSeverity;
    if (fileConfig.minConfidence !== undefined) mergedConfig.minConfidence = fileConfig.minConfidence;
    if (fileConfig.ignore) {
      mergedConfig.ignore = [...new Set([...(DEFAULT_CONFIG.ignore || []), ...fileConfig.ignore])];
    }
  }

  if (cliOptions) {
    if (cliOptions.packs) mergedConfig.packs = cliOptions.packs;
    if (cliOptions.minSeverity) mergedConfig.minSeverity = cliOptions.minSeverity;
    if (cliOptions.minConfidence !== undefined) mergedConfig.minConfidence = cliOptions.minConfidence;
    if (cliOptions.ignore) {
      mergedConfig.ignore = [...new Set([...(mergedConfig.ignore || []), ...cliOptions.ignore])];
    }
  }

  return mergedConfig;
}
