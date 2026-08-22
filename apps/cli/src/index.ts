#!/usr/bin/env node

import { Command } from 'commander';
import { runScan } from './commands/scan.js';

const program = new Command();

program
  .name('clipcloak')
  .description('Detects and redacts sensitive data before it reaches AI')
  .version('0.1.0');

program
  .command('scan')
  .description('Scan text or file for sensitive data')
  .argument('[target]', 'file or directory to scan')
  .option('--stdin', 'Scan from standard input')
  // .option('--staged', 'Scan git staged files') // TODO: implement later if needed via simple child_process git call
  .option('--packs <packs>', 'Comma-separated list of packs to use (e.g., generic,br,eu)')
  .option('--format <format>', 'Output format (text, json)', 'text')
  .action(async (target, options) => {
    await runScan(target, options);
  });

program.parse();
