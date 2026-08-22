import { Pack, Finding } from './types.js';

export function detect(text: string, packs: Pack[] = []): Finding[] {
  const findings: Finding[] = [];

  for (const pack of packs) {
    for (const detector of pack.detectors) {
      const results = detector.detect(text);
      for (const result of results) {
        findings.push({
          ...result,
          packId: pack.id,
        });
      }
    }
  }

  // Sort findings by startIndex to help with consistent processing
  return findings.sort((a, b) => a.startIndex - b.startIndex);
}
