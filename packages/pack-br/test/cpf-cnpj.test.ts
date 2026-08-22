import { describe, it, expect } from 'vitest';
import { cpfCnpjDetector } from '../src/detectors/cpf-cnpj.js';

describe('BR Pack: CPF & CNPJ Detector', () => {
  it('should detect valid formatted CPF', () => {
    // Valid generated test CPF
    const text = 'Meu CPF é 123.456.789-09.';
    const findings = cpfCnpjDetector.detect(text);
    
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('cpf');
    expect(findings[0].redactedPreview).toBe('123.***.***-09');
  });

  it('should reject invalid CPF format', () => {
    const text = '123.456.789-10'; // Math verification fails
    const findings = cpfCnpjDetector.detect(text);
    expect(findings).toHaveLength(0);
  });

  it('should detect valid formatted CNPJ', () => {
    // Valid generated test CNPJ
    const text = 'Empresa: 11.222.333/0001-81';
    const findings = cpfCnpjDetector.detect(text);
    
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('cnpj');
  });
});
