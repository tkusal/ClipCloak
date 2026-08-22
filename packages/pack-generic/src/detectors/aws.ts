import type { Detector, DetectionContext } from '@clipcloak/core';
import { createRedactedPreview } from '@clipcloak/core';

export const awsDetector: Detector = {
  id: 'aws-access-key',
  category: 'credential',
  detect(text: string, _context?: DetectionContext) {
    // AWS Access Key ID format: AKIA[A-Z0-9]{16}
    // Note: ASIA is for temporary credentials
    const regex = /\b(AKIA|ASIA)[A-Z0-9]{16}\b/g;
    const findings = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      findings.push({
        detectorId: this.id,
        category: this.category,
        severity: 'critical' as const,
        confidence: 0.9, // Very distinct pattern
        start: match.index,
        end: match.index + match[0].length,
        redactedPreview: createRedactedPreview(match[0], this.id, { strategy: 'partial' }),
        reason: 'Matches AWS Access Key ID pattern',
      });
    }

    return findings;
  },
};
