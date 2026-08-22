import { describe, it, expect } from 'vitest';
import { jwtDetector } from '../src/detectors/jwt.js';

describe('Generic Pack: JWT Detector', () => {
  it('should detect valid JWT structure with high-entropy signature', () => {
    // Standard JWT header: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
    // Standard payload: eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ
    // High-entropy signature: SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
    const text = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
    const findings = jwtDetector.detect(text);
    
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('jwt');
    expect(findings[0].severity).toBe('high');
    expect(findings[0].confidence).toBe(0.8);
  });

  it('should ignore JWT structures with low-entropy signatures (e.g. repeated dummy signatures)', () => {
    const text = 'token = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
    const findings = jwtDetector.detect(text);
    
    expect(findings).toHaveLength(0);
  });

  it('should ignore malformed strings', () => {
    const text = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ';
    const findings = jwtDetector.detect(text);
    expect(findings).toHaveLength(0);
  });
});
