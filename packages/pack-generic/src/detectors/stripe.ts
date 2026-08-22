import type { Detector, DetectionContext } from '@clipcloak/core';
import { createRedactedPreview } from '@clipcloak/core';
import { isDummyString } from '../utils/entropy.js';

export const stripeDetector: Detector = {
  id: 'stripe-key',
  category: 'credential',
  detect(text: string, _context?: DetectionContext) {
    // Matches Stripe live secret keys and restricted keys
    const regex = /\b([sr]k_live_[a-zA-Z0-9]{24,99})\b/g;
    const findings = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      const token = match[0];
      
      if (isDummyString(token)) {
        continue;
      }

      findings.push({
        detectorId: this.id,
        category: this.category,
        severity: 'critical' as const,
        confidence: 0.95,
        start: match.index,
        end: match.index + token.length,
        redactedPreview: createRedactedPreview(token, this.id, { strategy: 'partial' }),
        reason: 'Matches Stripe Live Secret/Restricted Key',
      });
    }

    return findings;
  },
};
