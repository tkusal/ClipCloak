import { describe, it, expect } from 'vitest';
import { ibanDetector } from '../src/detectors/iban.js';

describe('EU Pack: IBAN Detector', () => {
  it('should detect valid IBAN and pass MOD-97', () => {
    // Valid generated test IBAN for GB
    const text = 'Please send money to GB82 WEST 1234 5698 7654 32';
    const findings = ibanDetector.detect(text);

    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('iban');
    expect(findings[0].redactedPreview).toBe('GB***5432');
  });

  it('should reject invalid IBAN failing MOD-97', () => {
    const text = 'GB82 WEST 1234 5698 7654 33'; // Changed last digit
    const findings = ibanDetector.detect(text);

    expect(findings).toHaveLength(0);
  });
});
