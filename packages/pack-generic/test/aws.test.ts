import { describe, it, expect } from 'vitest';
import { awsDetector, awsSecretKeyDetector } from '../src/detectors/aws.js';

describe('Generic Pack: AWS Detector', () => {
  it('should detect AWS access key', () => {
    const findings = awsDetector.detect('AKIA' + 'IOSFODNN7QWERTYU');
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('aws-access-key');
  });
  it('should detect AWS secret key', () => {
    const findings = awsSecretKeyDetector.detect('AWS_SECRET_ACCESS_KEY: ' + 'wJalrXUtnFEMI/' + 'K7MDENG/' + 'mzKYHJSsBVTahLryzo');
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('aws-secret-key');
  });
});
