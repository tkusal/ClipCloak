#!/usr/bin/env node

import { Command } from 'commander';
import { detect } from '@clipcloak/core';
import genericPack from '@clipcloak/pack-generic';
import brPack from '@clipcloak/pack-br';
import euPack from '@clipcloak/pack-eu';

const program = new Command();

program
  .name('clipcloak')
  .description('Detects and redacts sensitive data before it reaches AI')
  .version('0.1.0');

program
  .command('scan')
  .description('Scan text or file for sensitive data')
  .argument('[file]', 'file to scan')
  .action((file) => {
    // TODO: implement CLI logic
    console.log(`Scanning ${file}... (WIP)`);
  });

program.parse();
