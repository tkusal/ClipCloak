import { describe, it, expect } from 'vitest';
import { privateKeyDetector } from '../src/detectors/private-key.js';

describe('Generic Pack: Private Key Detector', () => {
  it('should detect private key with LF line endings', () => {
    const text = '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD\n-----END PRIVATE KEY-----';
    const findings = privateKeyDetector.detect(text);
    
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('private-key');
    expect(findings[0].severity).toBe('critical');
    expect(findings[0].redactedPreview).toBe('[REDACTED:PRIVATE_KEY]');
  });

  it('should detect private key with CRLF line endings', () => {
    const text = '-----BEGIN RSA PRIVATE KEY-----\r\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD\r\n-----END RSA PRIVATE KEY-----';
    const findings = privateKeyDetector.detect(text);
    
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('private-key');
  });

  it('should detect encrypted private keys', () => {
    const text = '-----BEGIN ENCRYPTED PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQD\n-----END ENCRYPTED PRIVATE KEY-----';
    const findings = privateKeyDetector.detect(text);
    
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('private-key');
  });

  it('should detect other common key variants', () => {
    const ECKey = '-----BEGIN EC PRIVATE KEY-----\nMIIEvgIBADANBgkq\n-----END EC PRIVATE KEY-----';
    const OpenSSHKey = '-----BEGIN OPENSSH PRIVATE KEY-----\nMIIEvgIBADANBgkq\n-----END OPENSSH PRIVATE KEY-----';
    
    expect(privateKeyDetector.detect(ECKey)).toHaveLength(1);
    expect(privateKeyDetector.detect(OpenSSHKey)).toHaveLength(1);
  });

  it('should ignore false positives', () => {
    const text = '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA\n-----END PUBLIC KEY-----';
    const findings = privateKeyDetector.detect(text);
    expect(findings).toHaveLength(0);
  });
});
