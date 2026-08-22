import type { Detector, DetectionContext } from '@clipcloak/core';
import { createRedactedPreview } from '@clipcloak/core';

function validateCPF(cpf: string): boolean {
  if (/^(\d)\1{10}$/.test(cpf)) return false; // Reject repeated digits (e.g. 11111111111)

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(10))) return false;

  return true;
}

function validateCNPJ(cnpj: string): boolean {
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  const digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size += 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

export const cpfCnpjDetector: Detector = {
  id: 'cpf-cnpj',
  category: 'pii',
  detect(text: string, _context?: DetectionContext) {
    const findings = [];
    
    // Captures CPF (with or without formatting) and CNPJ (with or without formatting)
    // Limits matches to boundaries to prevent capturing a subset of a long id.
    const regex = /\b(?:\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2}|\d{2}[.\s]?\d{3}[.\s]?\d{3}[/.\s]?\d{4}[-.\s]?\d{2})\b/g;
    
    let match;
    while ((match = regex.exec(text)) !== null) {
      const candidate = match[0];
      const cleanCandidate = candidate.replace(/[^\d]/g, '');

      let isCPF = false;
      let isCNPJ = false;

      if (cleanCandidate.length === 11) {
        isCPF = validateCPF(cleanCandidate);
      } else if (cleanCandidate.length === 14) {
        isCNPJ = validateCNPJ(cleanCandidate);
      }

      if (isCPF || isCNPJ) {
        // Redact format: show only first 3 and last 2 digits for CPF, similar for CNPJ
        const redacted = isCPF 
          ? `${cleanCandidate.slice(0, 3)}.***.***-${cleanCandidate.slice(9)}`
          : `${cleanCandidate.slice(0, 2)}.***.***/****-${cleanCandidate.slice(12)}`;

        findings.push({
          detectorId: isCPF ? 'cpf' : 'cnpj',
          category: this.category,
          severity: 'medium' as const,
          confidence: 0.9, // Math verification makes it very confident
          start: match.index,
          end: match.index + candidate.length,
          redactedPreview: redacted,
          reason: `Matches valid ${isCPF ? 'CPF' : 'CNPJ'} verification digits`,
        });
      }
    }

    return findings;
  },
};
