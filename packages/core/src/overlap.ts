import type { Finding } from './types.js';

/**
 * Resolves overlapping findings by prioritizing severity, confidence, and length.
 * If one finding is completely inside another, or partially overlaps, we keep the most relevant one.
 */
export function resolveOverlaps(findings: Finding[]): Finding[] {
  if (findings.length <= 1) return findings;

  // Sort by start index ascending. If same start, sort by length descending.
  const sorted = [...findings].sort((a, b) => {
    if (a.start !== b.start) {
      return a.start - b.start;
    }
    const lenA = a.end - a.start;
    const lenB = b.end - b.start;
    return lenB - lenA; // longer first
  });

  const resolved: Finding[] = [];

  for (const current of sorted) {
    let keepCurrent = true;

    while (resolved.length > 0) {
      const previous = resolved[resolved.length - 1];

      // Check for overlap
      if (current.start < previous.end) {
        if (shouldKeepCurrent(previous, current)) {
          // Current is better, remove previous and check the one before it
          resolved.pop();
        } else {
          // Previous is better, drop current
          keepCurrent = false;
          break;
        }
      } else {
        // No overlap with the last resolved item, so no overlap with any prior items
        break;
      }
    }

    if (keepCurrent) {
      resolved.push(current);
    }
  }

  return resolved;
}

function shouldKeepCurrent(prev: Finding, current: Finding): boolean {
  const severityWeight = { low: 1, medium: 2, high: 3, critical: 4 };

  // 1. Compare severity
  const wPrev = severityWeight[prev.severity];
  const wCurr = severityWeight[current.severity];
  if (wCurr > wPrev) return true;
  if (wCurr < wPrev) return false;

  // 2. Compare confidence
  if (current.confidence > prev.confidence) return true;
  if (current.confidence < prev.confidence) return false;

  // 3. Compare length (longer is usually better as it captures more context)
  const lenPrev = prev.end - prev.start;
  const lenCurr = current.end - current.start;
  return lenCurr > lenPrev;
}
