import { describe, it, expect } from 'vitest';
import { stripeDetector } from '../src/detectors/stripe.js';

describe('Generic Pack: Stripe Detector', () => {
  it('should detect live secret keys', () => {
    const text = 'sk' + '_live_' + 'qWeRtYuIoPaSdFgHjKlZxCvB';
    const findings = stripeDetector.detect(text);
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('stripe-key');
  });
  it('should detect live restricted keys', () => {
    const text = 'rk' + '_live_' + 'qWeRtYuIoPaSdFgHjKlZxCvB';
    const findings = stripeDetector.detect(text);
    expect(findings).toHaveLength(1);
  });
  it('should ignore test keys', () => {
    const text = 'sk' + '_test_' + 'qWeRtYuIoPaSdFgHjKlZxCvB';
    const findings = stripeDetector.detect(text);
    expect(findings).toHaveLength(0);
  });
  it('should ignore false positives', () => {
    const text = 'sk_live_short';
    const findings = stripeDetector.detect(text);
    expect(findings).toHaveLength(0);
  });
});
