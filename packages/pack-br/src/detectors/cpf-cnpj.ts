import type { Detector, DetectionContext } from '@clipcloak/core';

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
  if (cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const baseAndOrder = cnpj.substring(0, 12);
  const digits = cnpj.substring(12);

  if (!/^\d{2}$/.test(digits)) return false;

  const charToInt = (char: string) => {
    const code = char.charCodeAt(0);
    return code - 48;
  };

  let sum = 0;
  let pos = 5;
  for (let i = 0; i < 12; i++) {
    sum += charToInt(baseAndOrder.charAt(i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  sum = 0;
  pos = 6;
  for (let i = 0; i < 12; i++) {
    sum += charToInt(baseAndOrder.charAt(i)) * pos--;
    if (pos < 2) pos = 9;
  }
  sum += parseInt(digits.charAt(0)) * 2;

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;

  return true;
}

export const cpfCnpjDetector: Detector = {
  id: 'cpf-cnpj',
  category: 'pii',
  defaultSeverity: 'medium',
  defaultConfidence: 0.9,
  description: 'Brazilian CPF and CNPJ validated mathematically',
  emittedIds: ['cpf', 'cnpj'],
  detect(text: string, _context?: DetectionContext) {
    const findings = [];

    // Captures CPF (with or without formatting) and CNPJ (with or without formatting) including alphanumeric
    // Limits matches to boundaries to prevent capturing a subset of a long id.
    const regex =
      /\b(?:\d{3}[.\s]?\d{3}[.\s]?\d{3}[-.\s]?\d{2}|[A-Za-z0-9]{2}[.\s]?[A-Za-z0-9]{3}[.\s]?[A-Za-z0-9]{3}[/.\s]?[A-Za-z0-9]{4}[-.\s]?\d{2})\b/g;

    let match;
    while ((match = regex.exec(text)) !== null) {
      const candidate = match[0];
      const cleanCandidate = candidate.replace(/[^\dA-Za-z]/g, '').toUpperCase();

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
