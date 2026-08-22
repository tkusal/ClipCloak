import { describe, it, expect } from 'vitest';
import { pixDetector } from '../src/detectors/pix.js';

describe('BR Pack: PIX Detector', () => {
  it('should detect contextual UUID PIX key', () => {
    const text = 'My pix key is 123e4567-e89b-12d3-a456-426614174000';
    // Provide surrounding context manually
    const findings = pixDetector.detect(text, { surroundingText: text });
    
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('pix-evp');
    expect(findings[0].confidence).toBe(0.8); // Because 'pix' was in the context
  });

  it('should have low confidence for random UUIDs without PIX context', () => {
    const text = 'userId: 123e4567-e89b-12d3-a456-426614174000';
    const findings = pixDetector.detect(text, { surroundingText: text });
    
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('pix-evp');
    expect(findings[0].confidence).toBe(0.3); // Low confidence
  });

  it('should detect contextual phone or email PIX', () => {
    const text = 'Pague via chave pix: teste@email.com';
    const findings = pixDetector.detect(text, { surroundingText: text });
    
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('pix-contextual');
    // The key itself should be captured
    expect(text.substring(findings[0].start, findings[0].end)).toBe('teste@email.com');
  });
});
