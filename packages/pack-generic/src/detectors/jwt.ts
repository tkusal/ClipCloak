import type { Detector, DetectionContext } from '@clipcloak/core';
import { createRedactedPreview } from '@clipcloak/core';

export const jwtDetector: Detector = {
  id: 'jwt',
  category: 'credential',
  detect(text: string, _context?: DetectionContext) {
    const findings = [];
    // Basic JWT regex: eyJ... (header) . eyJ... (payload) . ... (signature)
    // Matches Base64Url charset (A-Z, a-z, 0-9, -, _)
    const regex = /\beyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\b/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      findings.push({
        detectorId: this.id,
        category: this.category,
        severity: 'high' as const,
        confidence: 0.8, // JWTs might just be session state, but often contain PII or act as auth
        start: match.index,
        end: match.index + match[0].length,
        redactedPreview: createRedactedPreview(match[0], this.id, { strategy: 'partial' }),
        reason: 'Matches JWT structure (Base64Url Header.Payload.Signature)',
      });
    }

    return findings;
  },
};
