import type { DetectorPack } from '@clipcloak/core';
import { ibanDetector } from './detectors/iban.js';
import { vatDetector } from './detectors/vat.js';

export const euPack: DetectorPack = {
  id: 'eu',
  name: 'European PII & Financial',
  detectors: [
    ibanDetector,
    vatDetector,
  ],
};

export default euPack;
