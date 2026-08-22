import type { Detector, DetectionContext } from '@clipcloak/core';
import { createRedactedPreview } from '@clipcloak/core';

export const emailDetector: Detector = {
  id: 'email',
  category: 'pii',
  detect(text: string, _context?: DetectionContext) {
    const findings = [];
    const regex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      findings.push({
        detectorId: this.id,
        category: this.category,
        severity: 'low' as const,
        confidence: 0.9,
        start: match.index,
        end: match.index + match[0].length,
        redactedPreview: createRedactedPreview(match[0], this.id, { strategy: 'full' }),
        reason: 'Email address',
      });
    }
    return findings;
  },
};

export const ipv4Detector: Detector = {
  id: 'ipv4',
  category: 'pii', // Network identifiable info
  detect(text: string, _context?: DetectionContext) {
    const findings = [];
    // Standard IPv4 regex (0-255 octets)
    const regex =
      /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const ip = match[0];
      // Ignore obvious loopbacks and generic dev IPs to reduce noise
      if (ip.startsWith('127.') || ip === '0.0.0.0' || ip === '255.255.255.255') {
        continue;
      }

      findings.push({
        detectorId: this.id,
        category: this.category,
        severity: 'low' as const,
        confidence: 0.8,
        start: match.index,
        end: match.index + ip.length,
        redactedPreview: createRedactedPreview(ip, this.id, { strategy: 'full' }),
        reason: 'IPv4 Address',
      });
    }
    return findings;
  },
};
