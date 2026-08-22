import type { Detector, DetectionContext } from '@clipcloak/core';

// MOD-97 algorithm for IBAN validation (ISO 13616)
function isValidIban(iban: string): boolean {
  // Move first 4 characters to the end
  const rearranged = iban.substring(4) + iban.substring(0, 4);

  // Convert letters to numbers (A=10, B=11, ... Z=35)
  let numericIban = '';
  for (let i = 0; i < rearranged.length; i++) {
    const charCode = rearranged.charCodeAt(i);
    if (charCode >= 65 && charCode <= 90) {
      // A-Z
      numericIban += (charCode - 55).toString();
    } else {
      numericIban += rearranged.charAt(i);
    }
  }

  // Calculate modulo 97 on large numbers safely in JS
  let remainder = 0;
  for (let i = 0; i < numericIban.length; i++) {
    remainder = (remainder * 10 + parseInt(numericIban.charAt(i), 10)) % 97;
  }

  return remainder === 1;
}

export const ibanDetector: Detector = {
  id: 'iban',
  category: 'financial',
  detect(text: string, _context?: DetectionContext) {
    const findings = [];

    // IBAN format: 2 letters (country), 2 digits (check), then up to 30 alphanumeric characters
    // Matches blocks of alphanumeric characters with optional spaces
    const regex = /\b[A-Z]{2}\d{2}(?:[\s]*[A-Z0-9]){11,30}\b/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      const candidate = match[0];
      const cleanCandidate = candidate.replace(/\s/g, '').toUpperCase();

      // Basic sanity length checks per ISO 13616 (max 34 chars)
      if (cleanCandidate.length >= 15 && cleanCandidate.length <= 34) {
        if (isValidIban(cleanCandidate)) {
          findings.push({
            detectorId: this.id,
            category: this.category,
            severity: 'medium' as const,
            confidence: 0.95, // MOD-97 checksum gives very high confidence
            start: match.index,
            end: match.index + candidate.length,
            // Only show Country Code and last 4 chars
            redactedPreview: `${cleanCandidate.substring(0, 2)}***${cleanCandidate.slice(-4)}`,
            reason: 'Matches valid IBAN format and passes MOD-97 checksum',
          });
        }
      }
    }

    return findings;
  },
};
