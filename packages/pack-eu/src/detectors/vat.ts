import type { Detector, DetectionContext } from '@clipcloak/core';
import { createRedactedPreview } from '@clipcloak/core';

export const vatDetector: Detector = {
  id: 'eu-vat',
  category: 'pii',
  defaultSeverity: 'low',
  defaultConfidence: 0.6,
  description: 'European Value Added Tax numbers', // Or financial depending on interpretation
  detect(text: string, _context?: DetectionContext) {
    const findings = [];

    // Covers the most common European VAT formats.
    // Usually starts with a 2-letter country code followed by 2-13 alphanumeric characters.
    // e.g. DE123456789, FR12123456789
    // For MVP, we use a slightly restrictive list of country prefixes to avoid false positives
    // with random hex strings or IDs.
    const euCountries =
      'AT|BE|BG|CY|CZ|DE|DK|EE|EL|ES|FI|FR|GB|HR|HU|IE|IT|LT|LU|LV|MT|NL|PL|PT|RO|SE|SI|SK';
    const regex = new RegExp(`\\b(${euCountries})[0-9A-Z]{2,13}\\b`, 'g');

    let match;
    while ((match = regex.exec(text)) !== null) {
      const candidate = match[0];

      // Exclude simple sequences
      if (/^[A-Z]{2}0{5,}$/.test(candidate)) continue;
      
      // Must contain at least one digit to avoid matching normal uppercase English words
      if (!/\d/.test(candidate)) continue;

      findings.push({
        detectorId: this.id,
        category: this.category,
        severity: 'low' as const, // VAT numbers are often public on invoices, but still sensitive in some contexts
        confidence: 0.6, // Regex-only, so lower confidence than IBAN
        start: match.index,
        end: match.index + candidate.length,
        redactedPreview: createRedactedPreview(candidate, this.id, { strategy: 'full' }),
        reason: 'Matches basic European VAT format',
      });
    }

    return findings;
  },
};
