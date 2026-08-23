import type { Detector, DetectionContext } from '@clipcloak/core';
import { createRedactedPreview } from '@clipcloak/core';
import { isDummyString } from '../utils/entropy.js';

export const connectionStringDetector: Detector = {
  id: 'connection-string',
  category: 'credential',
  defaultSeverity: 'high',
  defaultConfidence: 0.8,
  description: 'Connection URIs containing plaintext passwords',
  detect(text: string, _context?: DetectionContext) {
    const findings = [];
    // Matches e.g. postgres://user:password@host:port/db
    // Excludes http/https which are usually public URLs unless they have credentials
    // Note: this regex captures the whole URI but is tuned to find URIs with :password@
    const regex = /\b([a-z+]+):\/\/[^:/\s]+:([^@\s]+)@[^/\s]+\b/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const fullMatch = match[0];
      const password = match[2];

      // If it looks like a variable interpolation like ${DB_PASS}, skip it, it's not the actual secret
      if (password.includes('${') || password.includes('<') || isDummyString(password)) {
        continue;
      }

      findings.push({
        detectorId: this.id,
        category: this.category,
        severity: 'high' as const,
        confidence: 0.8,
        start: match.index,
        end: match.index + fullMatch.length,
        redactedPreview: createRedactedPreview(fullMatch, this.id, { strategy: 'full' }),
        reason: 'Connection string containing a plaintext password',
      });
    }

    return findings;
  },
};
