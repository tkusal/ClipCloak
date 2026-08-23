import type { Detector, DetectionContext } from '@clipcloak/core';
import { createRedactedPreview } from '@clipcloak/core';
import { isDummyString } from '../utils/entropy.js';

export const githubDetector: Detector = {
  id: 'github-token',
  category: 'credential',
  defaultSeverity: 'critical',
  defaultConfidence: 0.95,
  description: 'Matches GitHub Personal Access Tokens',
  detect(text: string, _context?: DetectionContext) {
    // Matches GitHub Personal Access Tokens (Classic and Fine-grained), OAuth tokens, etc.
    const regex = /\b(gh[pusor]_[a-zA-Z0-9]{36}|github_pat_[a-zA-Z0-9]{82})\b/g;
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
        confidence: 0.95, // High confidence because of the specific prefix
        start: match.index,
        end: match.index + token.length,
        redactedPreview: createRedactedPreview(token, this.id, { strategy: 'partial' }),
        reason: 'Matches GitHub Access Token format',
      });
    }

    return findings;
  },
};
