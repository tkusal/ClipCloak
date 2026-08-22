import { describe, it, expect } from 'vitest';
import { vatDetector } from '../src/detectors/vat.js';

describe('EU Pack: VAT Detector', () => {
  it('should detect valid European VAT numbers', () => {
    // German VAT number example: DE123456789
    const text = 'My company VAT number is DE123456789.';
    const findings = vatDetector.detect(text);

    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('eu-vat');
    expect(findings[0].severity).toBe('low');
  });

  it('should detect French VAT numbers', () => {
    // French VAT number format: FR + 11 characters
    const text = 'Invoices should be billed under FR12345678901';
    const findings = vatDetector.detect(text);

    expect(findings).toHaveLength(1);
  });

  it('should ignore fake/zeroed VAT numbers', () => {
    const text = 'Avoid mock values like DE000000 or FR00000000';
    const findings = vatDetector.detect(text);

    expect(findings).toHaveLength(0);
  });

  it('should ignore codes of non-EU country formats or unsupported prefixes', () => {
    const text = 'US12345678 XX12345678';
    const findings = vatDetector.detect(text);
    expect(findings).toHaveLength(0);
  });
});
