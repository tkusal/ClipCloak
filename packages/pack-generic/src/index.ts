import type { DetectorPack } from '@clipcloak/core';
import { awsDetector } from './detectors/aws.js';
import { tokensDetector } from './detectors/tokens.js';
import { jwtDetector } from './detectors/jwt.js';
import { privateKeyDetector } from './detectors/private-key.js';
import { connectionStringDetector } from './detectors/connection-string.js';
import { emailDetector, ipv4Detector } from './detectors/network.js';
import { creditCardDetector } from './detectors/credit-card.js';

export const genericPack: DetectorPack = {
  id: 'generic',
  name: 'Generic Secrets & PII',
  detectors: [
    awsDetector,
    tokensDetector,
    jwtDetector,
    privateKeyDetector,
    connectionStringDetector,
    emailDetector,
    ipv4Detector,
    creditCardDetector,
  ],
};

export default genericPack;
