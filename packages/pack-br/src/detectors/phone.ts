import type { Detector, DetectionContext } from '@clipcloak/core';
import { createRedactedPreview } from '@clipcloak/core';

export const phoneBrDetector: Detector = {
  id: 'phone-br',
  category: 'pii',
  defaultSeverity: 'low',
  defaultConfidence: 0.7,
  description: 'Brazilian mobile and landline formats',
  detect(text: string, _context?: DetectionContext) {
    const findings = [];

    // Matches standard Brazilian mobile/landline formats:
    // +55 (11) 98888-8888, 55 11 988888888, (11) 98888-8888
    const regex = /\b(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9\d{4}[-\s]?\d{4}|\d{4}[-\s]?\d{4})\b/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const candidate = match[0];
      const clean = candidate.replace(/\D/g, '');

      // Basic sanity check on length (10 digits for landline with DDD, 11 for mobile, +2 for 55)
      // Exclude simple sequences that are likely false positives (e.g., 00000000000)
      if (/^(\d)\1+$/.test(clean)) continue;
      // Exclude sequential digits in the phone body (last 8 digits) (e.g., (11) 00000-0000)
      if (clean.length >= 8 && /^(\d)\1+$/.test(clean.slice(-8))) continue;

      let isValidLength = false;
      if (clean.length === 10 || clean.length === 11)
        isValidLength = true; // Without country code
      else if (clean.length === 12 || clean.length === 13) {
        if (clean.startsWith('55')) isValidLength = true; // With country code
      }

      if (isValidLength) {
        findings.push({
          detectorId: this.id,
          category: this.category,
          severity: 'low' as const,
          confidence: 0.7, // Phone numbers are noisy without context
          start: match.index,
          end: match.index + candidate.length,
          redactedPreview: createRedactedPreview(candidate, this.id, { strategy: 'full' }),
          reason: 'Matches Brazilian phone number format',
        });
      }
    }

    return findings;
  },
};
