import type { Detector, DetectionContext } from '@clipcloak/core';
import { createRedactedPreview } from '@clipcloak/core';

import { isObviousDummyString, isSoftDummyString, shannonEntropy } from '../utils/entropy.js';

export const awsDetector: Detector = {
  id: 'aws-access-key',
  category: 'credential',
  defaultSeverity: 'critical',
  defaultConfidence: 0.9,
  description: 'Matches standard AWS Access Key IDs',
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
      if (entropy < 2.5 && confidence === 0.9) {
        // Needs some reasonable randomness, but don't skip if already flagged as dummy/low-confidence (to avoid double skip)
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

export const awsSecretKeyDetector: Detector = {
  id: 'aws-secret-key',
  category: 'credential',
  defaultSeverity: 'critical',
  defaultConfidence: 0.8,
  description: 'Matches high-entropy 40-character base64 AWS Secret Key',
  detect(text: string, _context?: DetectionContext) {
    // AWS Secret Access Keys are 40 base64 characters
    const regex = /(?<![A-Za-z0-9/+=])[A-Za-z0-9/+=]{40}(?![A-Za-z0-9/+=])/g;
    const findings = [];
    let match;

    while ((match = regex.exec(text)) !== null) {
      const token = match[0];

      if (isObviousDummyString(token)) {
        continue;
      }

      const entropy = shannonEntropy(token);
      // Requires high entropy (random base64 usually > 4.5)
      if (entropy < 4.0) {
        continue;
      }

      // Contextual check to reduce false positives (like SHA-1 hashes)
      const contextWindow = text.substring(Math.max(0, match.index - 200), match.index + 200).toLowerCase();
      const hasContext = /aws_?secret|secret_?access_?key|aws_?session|akid|akia|asia|\.env|\byaml\b|\bjson\b/i.test(contextWindow);

      if (!hasContext) {
        continue; // Skip if no AWS or Secret context is found nearby
      }

      let confidence = 0.8;
      if (isSoftDummyString(token)) {
        confidence = 0.6;
      }

      findings.push({
        detectorId: this.id,
        category: this.category,
        severity: 'critical' as const,
        confidence,
        start: match.index,
        end: match.index + token.length,
        redactedPreview: createRedactedPreview(token, this.id, { strategy: 'partial' }),
        reason: 'Matches high-entropy 40-character base64 AWS Secret Key pattern with context',
      });
    }

    return findings;
  },
};
