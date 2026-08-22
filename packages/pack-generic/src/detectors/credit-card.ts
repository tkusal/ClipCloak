import type { Detector, DetectionContext } from '@clipcloak/core';
import { createRedactedPreview } from '@clipcloak/core';

function luhnCheck(num: string): boolean {
  let sum = 0;
  let isEven = false;

  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num.charAt(i), 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

export const creditCardDetector: Detector = {
  id: 'credit-card',
  category: 'financial',
  detect(text: string, _context?: DetectionContext) {
    const findings = [];
    // Match 13 to 19 digit sequences, allowing for spaces or dashes between blocks
    // This regex looks for blocks of 4 digits, but is generic enough to catch most formats
    // Using positive lookahead to ensure we have enough digits total, then capturing.
    // simpler approach: find groups of digits/spaces/dashes that contain 13-19 digits total.

    // This regex looks for a boundary, a digit, followed by 12-18 combinations of digits, spaces, or dashes, ending in a digit and boundary.
    const regex = /\b(?:\d[ -]*?){13,19}\b/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const candidate = match[0];
      const cleanCandidate = candidate.replace(/[ -]/g, '');

      // Ensure it's not a generic sequence like 0000000000000000 or 1234567890123456
      if (/^(\d)\1+$/.test(cleanCandidate)) {
        continue;
      }

      if (cleanCandidate.length >= 13 && cleanCandidate.length <= 19) {
        if (luhnCheck(cleanCandidate)) {
          findings.push({
            detectorId: this.id,
            category: this.category,
            severity: 'medium' as const,
            confidence: 0.8, // Passes Luhn, high likelihood of being CC or similar financial token
            start: match.index,
            end: match.index + candidate.length,
            redactedPreview: createRedactedPreview(cleanCandidate, this.id, { strategy: 'full' }), // CCs should be fully redacted
            reason: 'Matches Credit Card format and passes Luhn validation',
          });
        }
      }
    }

    return findings;
  },
};
