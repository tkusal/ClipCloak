import { describe, it, expect } from 'vitest';
import { connectionStringDetector } from '../src/detectors/connection-string.js';

describe('Generic Pack: Connection String Detector', () => {
  it('should detect strings with plaintext passwords', () => {
    const text = 'postgres://admin:SuperSecret123@localhost:5432/db';
    const findings = connectionStringDetector.detect(text);

    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('connection-string');
  });

  it('should ignore variable interpolated passwords', () => {
    const text = 'postgres://admin:${DB_PASS}@localhost:5432/db';
    const findings = connectionStringDetector.detect(text);

    expect(findings).toHaveLength(0); // Because it's not the actual secret
  });
});
