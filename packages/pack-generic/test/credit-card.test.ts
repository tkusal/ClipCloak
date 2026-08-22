import { describe, it, expect } from 'vitest';
import { creditCardDetector } from '../src/detectors/credit-card.js';

describe('Generic Pack: Credit Card Detector', () => {
  it('should detect valid Visa with Luhn check', () => {
    // Standard test VISA
    const text = 'My card is 4111 1111 1111 1111.';
    const findings = creditCardDetector.detect(text);

    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('credit-card');
  });

  it('should ignore numbers failing Luhn check', () => {
    const text = 'My card is 4111 1111 1111 1112.';
    const findings = creditCardDetector.detect(text);

    expect(findings).toHaveLength(0);
  });

  it('should ignore generic sequences like 0000000000000000 even if they pass Luhn', () => {
    const text = '0000 0000 0000 0000';
    const findings = creditCardDetector.detect(text);
    expect(findings).toHaveLength(0);
  });
});
