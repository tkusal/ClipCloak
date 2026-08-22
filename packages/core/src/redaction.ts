import type { Finding } from './types.js';

export interface RedactOptions {
  maskChar?: string;
  strategy?: 'full' | 'partial';
}

/**
 * Creates a safe preview for a detected secret.
 * This is used inside the detector to generate the `redactedPreview` without keeping the raw string.
 */
export function createRedactedPreview(
  rawSecret: string, 
  detectorId: string,
  options: RedactOptions = {}
): string {
  const mask = options.maskChar || '*';
  const strategy = options.strategy || 'partial';
  const len = rawSecret.length;

  if (strategy === 'full' || len < 6) {
    return `[REDACTED:${detectorId.toUpperCase()}]`;
  }

  // Partial strategy: show some prefix/suffix if long enough, but heavily mask
  // e.g. sk-proj-123456789 -> sk-proj-********6789
  
  if (rawSecret.startsWith('sk-')) {
    // Standard OpenAI/Anthropic format
    const parts = rawSecret.split('-');
    if (parts.length >= 2) {
      const prefix = parts.slice(0, parts.length - 1).join('-');
      const lastPart = parts[parts.length - 1];
      const safeSuffix = lastPart.slice(-4);
      return `${prefix}-${mask.repeat(8)}${safeSuffix}`;
    }
  }

  if (len >= 12) {
    const prefix = rawSecret.slice(0, 4);
    const suffix = rawSecret.slice(-4);
    return `${prefix}${mask.repeat(len - 8)}${suffix}`;
  }

  return `[REDACTED:${detectorId.toUpperCase()}]`;
}

/**
 * Applies the findings to the original text, returning a fully safe redacted string.
 * This is useful if the consumer wants to log the text safely.
 * Notice: This relies strictly on the offsets (start/end), not on string replacement
 * of the raw value, preventing issues where the same text appears safely elsewhere.
 */
export function applyRedaction(text: string, findings: Finding[]): string {
  if (findings.length === 0) return text;

  // Ensure findings are sorted by start index
  const sorted = [...findings].sort((a, b) => a.start - b.start);
  
  let result = '';
  let lastIndex = 0;

  for (const finding of sorted) {
    // Skip if findings overlap (overlap resolution should have handled this, 
    // but defensive programming in case consumer passed raw findings)
    if (finding.start < lastIndex) continue;

    result += text.slice(lastIndex, finding.start);
    result += finding.redactedPreview;
    lastIndex = finding.end;
  }

  result += text.slice(lastIndex);
  return result;
}
