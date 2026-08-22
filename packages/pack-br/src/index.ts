import type { DetectorPack } from '@clipcloak/core';
import { cpfCnpjDetector } from './detectors/cpf-cnpj.js';
import { pixDetector } from './detectors/pix.js';
import { phoneBrDetector } from './detectors/phone.js';

export const brPack: DetectorPack = {
  id: 'br',
  name: 'Brazilian PII',
  detectors: [cpfCnpjDetector, pixDetector, phoneBrDetector],
};

export default brPack;
