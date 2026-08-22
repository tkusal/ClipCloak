import type { ClipCloakConfig, Severity, FindingCategory } from './types.js';

export const DEFAULT_CONFIG: ClipCloakConfig = {
  packs: ['generic'],
  minSeverity: 'low',
  minConfidence: 0.5,
  blockMinSeverity: 'high',
  blockCategories: ['credential', 'secret'],
  ignore: ['node_modules/**', 'dist/**', 'build/**', '.git/**', '*.example', '*.sample'],
};

/**
 * Validates configuration values, returning an array of validation error messages.
 */
export function validateConfig(config: any): string[] {
  const errors: string[] = [];
  if (!config || typeof config !== 'object') {
    errors.push('Configuration must be a JSON object.');
    return errors;
  }

  if (config.packs !== undefined) {
    if (!Array.isArray(config.packs)) {
      errors.push('The "packs" property must be an array of strings.');
    } else {
      const validPacks = ['generic', 'br', 'eu'];
      for (const pack of config.packs) {
        if (typeof pack !== 'string' || !validPacks.includes(pack)) {
          errors.push(`Invalid pack: "${pack}". Allowed packs are: ${validPacks.join(', ')}.`);
        }
      }
    }
  }

  if (config.minSeverity !== undefined) {
    const validSeverities: Severity[] = ['low', 'medium', 'high', 'critical'];
    if (
      typeof config.minSeverity !== 'string' ||
      !validSeverities.includes(config.minSeverity as Severity)
    ) {
      errors.push(
        `Invalid minSeverity: "${config.minSeverity}". Allowed values: ${validSeverities.join(', ')}.`,
      );
    }
  }

  if (config.minConfidence !== undefined) {
    if (
      typeof config.minConfidence !== 'number' ||
      config.minConfidence < 0 ||
      config.minConfidence > 1
    ) {
      errors.push(
        `Invalid minConfidence: ${config.minConfidence}. Must be a number between 0 and 1.`,
      );
    }
  }

  if (config.ignore !== undefined) {
    if (!Array.isArray(config.ignore)) {
      errors.push('The "ignore" property must be an array of strings.');
    } else {
      for (const ignore of config.ignore) {
        if (typeof ignore !== 'string') {
          errors.push('Ignore patterns must be strings.');
        }
      }
    }
  }

  if (config.blockMinSeverity !== undefined) {
    const validSeverities: Severity[] = ['low', 'medium', 'high', 'critical'];
    if (
      typeof config.blockMinSeverity !== 'string' ||
      !validSeverities.includes(config.blockMinSeverity as Severity)
    ) {
      errors.push(
        `Invalid blockMinSeverity: "${config.blockMinSeverity}". Allowed values: ${validSeverities.join(', ')}.`,
      );
    }
  }

  if (config.blockCategories !== undefined) {
    if (!Array.isArray(config.blockCategories)) {
      errors.push('The "blockCategories" property must be an array of strings.');
    } else {
      const validCategories: FindingCategory[] = ['secret', 'credential', 'pii', 'financial'];
      for (const cat of config.blockCategories) {
        if (typeof cat !== 'string' || !validCategories.includes(cat as FindingCategory)) {
          errors.push(
            `Invalid block category: "${cat}". Allowed categories are: ${validCategories.join(', ')}.`,
          );
        }
      }
    }
  }

  return errors;
}

/**
 * Merges loaded config with CLI options, where CLI options have precedence.
 * And both override defaults.
 */
export function resolveConfig(
  fileConfig: Partial<ClipCloakConfig> | null,
  cliOptions: Partial<ClipCloakConfig>,
): ClipCloakConfig {
  const mergedConfig = { ...DEFAULT_CONFIG };

  if (fileConfig) {
    if (fileConfig.packs) mergedConfig.packs = fileConfig.packs;
    if (fileConfig.minSeverity) mergedConfig.minSeverity = fileConfig.minSeverity;
    if (fileConfig.minConfidence !== undefined)
      mergedConfig.minConfidence = fileConfig.minConfidence;
    if (fileConfig.blockMinSeverity) mergedConfig.blockMinSeverity = fileConfig.blockMinSeverity;
    if (fileConfig.blockCategories) mergedConfig.blockCategories = fileConfig.blockCategories;
    if (fileConfig.ignore) {
      mergedConfig.ignore = [...new Set([...(DEFAULT_CONFIG.ignore || []), ...fileConfig.ignore])];
    }
  }

  if (cliOptions) {
    if (cliOptions.packs) mergedConfig.packs = cliOptions.packs;
    if (cliOptions.minSeverity) mergedConfig.minSeverity = cliOptions.minSeverity;
    if (cliOptions.minConfidence !== undefined)
      mergedConfig.minConfidence = cliOptions.minConfidence;
    if (cliOptions.blockMinSeverity) mergedConfig.blockMinSeverity = cliOptions.blockMinSeverity;
    if (cliOptions.blockCategories) mergedConfig.blockCategories = cliOptions.blockCategories;
    if (cliOptions.ignore) {
      mergedConfig.ignore = [...new Set([...(mergedConfig.ignore || []), ...cliOptions.ignore])];
    }
  }

  return mergedConfig;
}
