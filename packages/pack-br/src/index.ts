import type { Pack } from '@clipcloak/core';

export const brPack: Pack = {
  id: 'br',
  name: 'Brazilian PII',
  version: '0.1.0',
  detectors: [
    // TODO: implement CPF, CNPJ, PIX
  ],
};

export default brPack;
