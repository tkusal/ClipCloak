import { describe, it, expect } from 'vitest';
import { phoneBrDetector } from '../src/detectors/phone.js';

describe('BR Pack: Phone Detector', () => {
  it('should detect standard Brazilian mobile formatting', () => {
    const text = 'Meu número é (11) 98765-4321';
    const findings = phoneBrDetector.detect(text);
    
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('phone-br');
    expect(findings[0].severity).toBe('low');
  });

  it('should detect Brazilian landline formatting', () => {
    const text = 'Telefone comercial: 11 4004-3021';
    const findings = phoneBrDetector.detect(text);
    
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('phone-br');
  });

  it('should detect numbers containing country code +55', () => {
    const text = 'Me ligue em +5511987654321';
    const findings = phoneBrDetector.detect(text);
    
    expect(findings).toHaveLength(1);
  });

  it('should ignore sequential digits that are obviously mock or fake', () => {
    const text = 'Tente ligar para (11) 00000-0000 ou 11 99999-9999';
    const findings = phoneBrDetector.detect(text);
    
    expect(findings).toHaveLength(0);
  });

  it('should ignore invalid length numbers', () => {
    const text = '1234 1234567 119876543'; // too short
    const findings = phoneBrDetector.detect(text);
    expect(findings).toHaveLength(0);
  });
});
