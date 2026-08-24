#!/usr/bin/env node

import { Command } from 'commander';
import { runScan } from './commands/scan.js';
import { runInit } from './commands/init.js';
import { runDoctor } from './commands/doctor.js';

import fs from 'node:fs';
import path from 'node:path';

const pkgPath = path.join(__dirname, '../package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const VERSION = pkg.version;

const program = new Command();

program
  .name('clipcloak')
  .description('Detects and redacts sensitive data before it reaches AI')
  .version(VERSION);

program
  .command('scan')
  .description('Scan text or file for sensitive data')
  .argument('[target]', 'file or directory to scan')
  .option('--stdin', 'Scan from standard input')
  .option('--staged', 'Scan git staged files')
  .option('--packs <packs>', 'Comma-separated list of packs to use (e.g., generic,br,eu)')
  .option('--format <format>', 'Output format (text, json, sarif)', 'text')
  .option('--severity <severity>', 'Minimum severity level (low, medium, high, critical)')
  .option('--confidence <confidence>', 'Minimum confidence level (0.0 to 1.0)', parseFloat)
  .option('--strict', 'Fail the CI (exit 2) if files were skipped or unknown')
  .action(async (target, options) => {
    await runScan(target, options);
  });

program
  .command('redact')
  .description('Redact sensitive data from a file and save as a new file')
  .argument('<target>', 'file to redact')
  .action(async (target) => {
    const { runRedact } = await import('./commands/redact.js');
    await runRedact(target);
  });

program
  .command('install')
  .description('Install integrations (git-hook, claude-code)')
  .argument('<target>', 'Integration to install (git-hook, claude-code)')
  .action(async (target) => {
    const { runInstall } = await import('./commands/install.js');
    await runInstall(target);
  });

program
  .command('hook')
  .description('Hook script for integrations (e.g. claude-code)')
  .argument('<target>', 'Integration target (claude-code)')
  .action(async (target) => {
    if (target === 'claude-code') {
      const { runClaudeCodeHook } = await import('./commands/hook.js');
      await runClaudeCodeHook();
    } else {
      console.error(`Unknown hook target: ${target}`);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Create a default .clipcloak.json configuration file in the current directory')
  .action(async () => {
    await runInit();
  });

program
  .command('doctor')
  .description('Diagnose ClipCloak environment and configuration')
  .action(async () => {
    await runDoctor();
  });

program.parse();
