import type { Pack } from '@clipcloak/core';

export const genericPack: Pack = {
  id: 'generic',
  name: 'Generic Secrets & PII',
  version: '0.1.0',
  detectors: [
    // TODO: implement AWS, OpenAI, GitHub, etc.
  ],
};

export default genericPack;
