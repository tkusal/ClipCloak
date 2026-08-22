import { describe, it, expect } from 'vitest';
import { emailDetector, ipv4Detector } from '../src/detectors/network.js';

describe('Generic Pack: Network Detectors', () => {
  describe('Email Detector', () => {
    it('should detect valid emails', () => {
      const text = 'Contact john.doe@example.com for more info or admin@domain.org.';
      const findings = emailDetector.detect(text);

      expect(findings).toHaveLength(2);
      expect(findings[0].detectorId).toBe('email');
      expect(findings[0].severity).toBe('low');
      expect(findings[0].redactedPreview).toBe('[REDACTED:EMAIL]');
    });

    it('should ignore false positives', () => {
      const text = 'not-an-email address@domain @domain.com';
      const findings = emailDetector.detect(text);
      expect(findings).toHaveLength(0);
    });
  });

  describe('IPv4 Detector', () => {
    it('should detect valid IPs', () => {
      const text = 'Connect to 192.168.1.15 or 8.8.8.8';
      const findings = ipv4Detector.detect(text);

      expect(findings).toHaveLength(2);
      expect(findings[0].detectorId).toBe('ipv4');
      expect(findings[0].severity).toBe('low');
      expect(findings[0].redactedPreview).toBe('[REDACTED:IPV4]');
    });

    it('should ignore standard loopback/broadcast IPs to reduce noise', () => {
      const text = 'IPs: 127.0.0.1, 0.0.0.0, 255.255.255.255';
      const findings = ipv4Detector.detect(text);

      expect(findings).toHaveLength(0);
    });

    it('should ignore invalid IP formats', () => {
      const text = '999.999.999.999 256.0.0.1 1.2.3';
      const findings = ipv4Detector.detect(text);
      expect(findings).toHaveLength(0);
    });
  });
});
