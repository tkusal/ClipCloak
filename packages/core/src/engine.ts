import type { Finding, DetectorPack, DetectOptions } from './types.js';
import { resolveOverlaps } from './overlap.js';

export function detect(
  text: string,
  packs: DetectorPack[],
  options: DetectOptions = {}
): Finding[] {
  let allFindings: Finding[] = [];

  // Filter packs if requested
  const activePacks = options.packs
    ? packs.filter(p => options.packs!.includes(p.id))
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
        // We catch errors to prevent a single faulty regex/detector from crashing the whole engine
        // In a real scenario we could log this safely (metadata only)
      }
    }
  }

  // Deduplicate and resolve overlapping findings
  allFindings = resolveOverlaps(allFindings);

  // Apply filters from options
  if (options.minConfidence !== undefined) {
    allFindings = allFindings.filter(f => f.confidence >= options.minConfidence!);
  }

  if (options.minSeverity !== undefined) {
    const severityWeight = { low: 1, medium: 2, high: 3, critical: 4 };
    const minW = severityWeight[options.minSeverity];
    allFindings = allFindings.filter(f => severityWeight[f.severity] >= minW);
  }

  return allFindings;
}
