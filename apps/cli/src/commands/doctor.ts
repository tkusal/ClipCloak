import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { getPacks, scanText } from '../utils/scanner.js';
import { loadAndResolveConfig } from '@clipcloak/core';

export async function runDoctor() {
  console.log('🩺 ClipCloak Doctor\n');
  let issuesFound = false;

  console.log('--- Environment ---');
  console.log(`OS: ${os.type()} ${os.release()} (${os.arch()})`);
  console.log(`Node: ${process.version}`);
  const cwd = process.cwd();
  console.log(`CWD: ${cwd}\n`);

  console.log('--- Configuration ---');
  const { config, errors } = loadAndResolveConfig(cwd, {});
  if (errors.length > 0) {
    issuesFound = true;
    console.log('❌ Configuration has schema validation errors:');
    for (const err of errors) {
      console.log(`  - ${err}`);
    }
  } else {
    console.log('✅ Configuration schema is valid.');
  }
  console.log(`Resolved minSeverity: ${config.minSeverity}`);
  console.log(`Resolved minConfidence: ${config.minConfidence}`);
  console.log(`Resolved blockMinSeverity: ${config.blockMinSeverity}`);
  console.log(`Ignored patterns: ${config.ignore?.length || 0} rule(s)\n`);

  console.log('--- Git & Hooks ---');
  let isGitRepo = false;
  try {
    const gitDir = execSync('git rev-parse --git-dir', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
    console.log(`✅ Git repository detected. Git dir: ${gitDir}`);
    isGitRepo = true;
  } catch (err) {
    console.log('⚠️ Not a Git repository (or Git is not installed).');
  }

  if (isGitRepo) {
    try {
      const hooksDir = path.resolve(
        cwd,
        execSync('git rev-parse --git-path hooks').toString().trim(),
      );
      const preCommitPath = path.join(hooksDir, 'pre-commit');
      if (fs.existsSync(preCommitPath)) {
        const content = fs.readFileSync(preCommitPath, 'utf8');
        if (content.includes('clipcloak') || content.includes('ClipCloak')) {
          console.log(`✅ Pre-commit hook is installed at: ${preCommitPath}`);
        } else {
          console.log(
            `ℹ️ Pre-commit hook exists at ${preCommitPath} but does not contain ClipCloak scanning.`,
          );
        }
      } else {
        console.log('ℹ️ No pre-commit hook installed.');
      }
    } catch (err: unknown) {
      console.log(`⚠️ Failed to inspect Git hooks directory: ${(err instanceof Error ? err.message : String(err))}`);
    }
  }
  console.log('');

  console.log('--- Detector Packs & Synthetic Run ---');
  try {
    const packs = getPacks(config.packs);
    console.log(`Active Packs: ${packs.length}`);
    for (const pack of packs) {
      console.log(`📦 Pack: ${pack.id} (${pack.detectors.length} detectors)`);
    }

    // Run synthetic test to confirm detectors work
    const testSecret = 'AKIAJ2P33Y7WQ6U2G3A4';
    const testText = `This is a test block containing a mock AWS key: ${testSecret}`;
    const { findings, errors } = scanText(testText, 'synthetic_test.txt', packs, {
      minSeverity: 'low',
      minConfidence: 0.1,
    });

    if (errors && errors.length > 0) {
      issuesFound = true;
      console.log('❌ Synthetic scan encountered errors:');
      for (const err of errors) {
        console.log(`  - Pack: ${err.packId}, Detector: ${err.detectorId}: ${err.errorMessage}`);
      }
    } else if (findings.length > 0) {
      console.log('✅ Synthetic scan succeeded. Detectors are functioning properly.');
      const testFinding = findings[0];
      console.log(
        `   Captured synthetic match: [${testFinding.severity.toUpperCase()}] ${testFinding.detectorId} -> ${testFinding.redactedPreview}`,
      );
    } else {
      issuesFound = true;
      console.log(
        '❌ Synthetic scan failed to find the mock secret. Detectors might be disabled or misconfigured.',
      );
    }
  } catch (err: unknown) {
    issuesFound = true;
    console.log(`❌ Failed to verify packs or execute synthetic run: ${(err instanceof Error ? err.message : String(err))}`);
  }

  if (issuesFound) {
    console.log('\n⚠️ Doctor check complete. Some issues were found. Please see details above.');
    process.exit(1);
  } else {
    console.log('\n✅ Doctor check complete. Everything looks good!');
    process.exit(0);
  }
}
