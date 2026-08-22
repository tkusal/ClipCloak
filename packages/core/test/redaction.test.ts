import { describe, it, expect } from 'vitest';
import { createRedactedPreview, applyRedaction } from '../src/redaction.js';
import type { Finding } from '../src/types.js';

describe('Core Redaction', () => {
  describe('createRedactedPreview', () => {
    it('should partially redact OpenAI keys', () => {
      const secret = 'sk-proj-1234567890abcdef1234';
      const preview = createRedactedPreview(secret, 'openai');
      expect(preview).toBe('sk-proj-********1234');
    });

    it('should fallback to generic redaction for short strings', () => {
      const preview = createRedactedPreview('abc', 'test');
      expect(preview).toBe('[REDACTED:TEST]');
    });

    it('should fully redact if requested', () => {
      const preview = createRedactedPreview('1234567890123456', 'cc', { strategy: 'full' });
      expect(preview).toBe('[REDACTED:CC]');
    });
  });

  describe('applyRedaction', () => {
    it('should properly replace findings in text using offsets', () => {
      const text = 'Here is my key: sk-proj-1234567890abcdef1234. Do not share!';
      const finding: Finding = {
        detectorId: 'openai',
        packId: 'test',
        category: 'credential',
        severity: 'critical',
        confidence: 0.9,
        start: 16,
        end: 44,
        redactedPreview: 'sk-proj-********1234',
        reason: 'test',
      };

      const result = applyRedaction(text, [finding]);
      expect(result).toBe('Here is my key: sk-proj-********1234. Do not share!');
    });

    it('should handle multiple findings safely', () => {
      const text = 'IP: 192.168.1.1 and email: test@example.com';
      const f1: Finding = {
        detectorId: 'ip', packId: 'test', category: 'pii', severity: 'low', confidence: 0.9,
        start: 4, end: 15, redactedPreview: '[REDACTED:IP]', reason: 'test'
      };
      const f2: Finding = {
        detectorId: 'email', packId: 'test', category: 'pii', severity: 'low', confidence: 0.9,
        start: 27, end: 43, redactedPreview: '[REDACTED:EMAIL]', reason: 'test'
      };

      const result = applyRedaction(text, [f1, f2]);
      expect(result).toBe('IP: [REDACTED:IP] and email: [REDACTED:EMAIL]');
    });
  });
});
