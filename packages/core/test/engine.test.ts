import { describe, it, expect } from 'vitest';
import { detect } from '../src/engine.js';
import type { DetectorPack, Detector } from '../src/types.js';

describe('Core Engine', () => {
  const dummyDetector: Detector = {
    id: 'dummy',
    category: 'secret',
    detect(text: string) {
      if (text.includes('secret')) {
        return [{
          detectorId: 'dummy',
          category: 'secret',
          severity: 'high',
          confidence: 0.9,
          start: text.indexOf('secret'),
          end: text.indexOf('secret') + 6,
          redactedPreview: '***',
          reason: 'found secret',
        }];
      }
      return [];
    }
  };

  const dummyPack: DetectorPack = {
    id: 'dummy-pack',
    name: 'Dummy',
    detectors: [dummyDetector],
  };

  it('should find secrets using provided packs', () => {
    const findings = detect('this is a secret message', [dummyPack]);
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('dummy');
    expect(findings[0].packId).toBe('dummy-pack');
  });

  it('should apply confidence threshold', () => {
    const findings = detect('this is a secret message', [dummyPack], { minConfidence: 0.95 });
    expect(findings).toHaveLength(0); // the detector has 0.9
  });

  it('should not crash if a detector throws', () => {
    const crashingDetector: Detector = {
      id: 'crash',
      category: 'secret',
      detect() { throw new Error('Regex too complex'); }
    };
    
    const crashPack: DetectorPack = {
      id: 'crash-pack',
      name: 'Crash',
      detectors: [crashingDetector, dummyDetector],
    };

    // It should survive the crash and still return findings from dummyDetector
    const findings = detect('secret', [crashPack]);
    expect(findings).toHaveLength(1);
    expect(findings[0].detectorId).toBe('dummy');
  });
});
