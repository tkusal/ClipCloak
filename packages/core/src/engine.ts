import type { Finding, DetectorPack, DetectOptions, DetectResult, DetectorError } from './types.js';
import { resolveOverlaps } from './overlap.js';

export function detect(
  text: string,
  packs: DetectorPack[],
  options: DetectOptions = {},
): DetectResult {
  if (typeof text !== 'string') {
    return {
      findings: [],
      errors: [
        { packId: 'core', detectorId: 'engine', errorMessage: 'Input text must be a string' },
      ],
    };
  }

  let allFindings: Finding[] = [];
  const errors: DetectorError[] = [];

  // Filter packs if requested
  const activePacks = Array.isArray(options.packs)
    ? packs.filter((p) => options.packs!.includes(p.id))
    : packs;

  for (const pack of activePacks) {
    for (const detector of pack.detectors) {
      try {
        const rawFindings = detector.detect(text, options.context);

        for (const finding of rawFindings) {
          allFindings.push({
            ...finding,
            packId: pack.id,
          });
        }
      } catch (err) {
        errors.push({
          packId: pack.id,
          detectorId: detector.id,
          errorMessage: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  // Apply filters from options first to avoid low-confidence findings eliminating valid findings during overlap
  if (options.minConfidence !== undefined) {
    allFindings = allFindings.filter((f) => f.confidence >= options.minConfidence!);
  }

  if (options.minSeverity !== undefined) {
    const severityWeight = { low: 1, medium: 2, high: 3, critical: 4 };
    const minW = severityWeight[options.minSeverity];
    allFindings = allFindings.filter((f) => severityWeight[f.severity] >= minW);
  }

  // Deduplicate and resolve overlapping findings AFTER filtering
  allFindings = resolveOverlaps(allFindings);

  return { findings: allFindings, errors };
}
