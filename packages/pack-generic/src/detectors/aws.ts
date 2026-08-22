import type { Detector, DetectionContext } from '@clipcloak/core';
import { createRedactedPreview } from '@clipcloak/core';

import { isDummyString, shannonEntropy } from '../utils/entropy.js';

export const awsDetector: Detector = {
  id: 'aws-access-key',
  category: 'credential',
  detect(text: string, _context?: DetectionContext) {
    const regex = /\b(AKIA|ASIA)[A-Z0-9]{16}\b/g;
    const findings = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      const token = match[0];
      
      if (isDummyString(token)) {
        continue;
      }
      
      const entropy = shannonEntropy(token.slice(4)); // Check entropy of the random part
      if (entropy < 2.5) { // Needs some reasonable randomness
        continue;
      }

      findings.push({
        detectorId: this.id,
        category: this.category,
        severity: 'critical' as const,
        confidence: 0.9,
        start: match.index,
        end: match.index + token.length,
        redactedPreview: createRedactedPreview(token, this.id, { strategy: 'partial' }),
        reason: 'Matches AWS Access Key ID pattern',
      });
    }

    return findings;
  },
};
