import type { Detector, DetectionContext } from '@clipcloak/core';
import { createRedactedPreview } from '@clipcloak/core';

import { isObviousDummyString, isSoftDummyString, shannonEntropy } from '../utils/entropy.js';

export const awsDetector: Detector = {
  id: 'aws-access-key',
  category: 'credential',
  detect(text: string, _context?: DetectionContext) {
    const regex = /\b(AKIA|ASIA)[A-Z0-9]{16}\b/g;
    const findings = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      const token = match[0];
      
      if (isObviousDummyString(token)) {
        continue;
      }

      let confidence = 0.9;
      if (isSoftDummyString(token)) {
        confidence = 0.7;
      }
      
      const entropy = shannonEntropy(token.slice(4)); // Check entropy of the random part
      if (entropy < 2.5 && confidence === 0.9) { // Needs some reasonable randomness, but don't skip if already flagged as dummy/low-confidence (to avoid double skip)
        continue;
      }

      findings.push({
        detectorId: this.id,
        category: this.category,
        severity: 'critical' as const,
        confidence,
        start: match.index,
        end: match.index + token.length,
        redactedPreview: createRedactedPreview(token, this.id, { strategy: 'partial' }),
        reason: 'Matches AWS Access Key ID pattern',
      });
    }

    return findings;
  },
};
