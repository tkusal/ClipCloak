import type { Detector, DetectionContext } from '@clipcloak/core';

export const privateKeyDetector: Detector = {
  id: 'private-key',
  category: 'credential',
  defaultSeverity: 'critical',
  defaultConfidence: 0.99,
  description: 'PEM private key blocks',
  detect(text: string, _context?: DetectionContext) {
    const findings = [];
    const regex =
      /-----BEGIN (?:RSA|DSA|EC|OPENSSH|PGP|ED25519|ENCRYPTED)? ?PRIVATE KEY-----\r?\n[A-Za-z0-9+/\n\r=]+-----END (?:RSA|DSA|EC|OPENSSH|PGP|ED25519|ENCRYPTED)? ?PRIVATE KEY-----/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      findings.push({
        detectorId: this.id,
        category: this.category,
        severity: 'critical' as const,
        confidence: 0.99, // Unmistakable block
        start: match.index,
        end: match.index + match[0].length,
        redactedPreview: '[REDACTED:PRIVATE_KEY]', // Never preview any part of a PEM block
        reason: 'Matches PEM encoded Private Key block',
      });
    }

    return findings;
  },
};
