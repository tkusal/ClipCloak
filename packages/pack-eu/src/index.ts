import type { Pack } from '@clipcloak/core';

export const euPack: Pack = {
  id: 'eu',
  name: 'European PII',
  version: '0.1.0',
  detectors: [
    // TODO: implement IBAN, VAT
  ],
};

export default euPack;
