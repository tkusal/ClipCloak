import fs from 'node:fs';
import path from 'node:path';
import { getPacks, scanText, isBinaryFileSync, MAX_FILE_SIZE } from '../utils/scanner.js';
import { applyRedaction } from '@clipcloak/core';
import { loadAndResolveConfig } from '@clipcloak/core';

export async function runRedact(target: string) {
  const cwd = process.cwd();
  const { config, errors: configErrors } = loadAndResolveConfig(cwd, {});

  if (configErrors && configErrors.length > 0) {
    console.error(`[ERROR] Configuration is invalid. Fix errors before redacting:`);
    for (const err of configErrors) {
      console.error(`  - ${err}`);
    }
    process.exit(2);
  }

  let packs;
  try {
    packs = getPacks(config.packs);
  } catch (err: unknown) {
    console.error(`[ERROR] Failed to load detector packs: ${(err instanceof Error ? err.message : String(err))}`);
    process.exit(2);
  }

  const fullPath = path.resolve(cwd, target);
  if (!fs.existsSync(fullPath)) {
    console.error(`[ERROR] Target not found: ${fullPath}`);
    process.exit(2);
  }

  const stat = fs.statSync(fullPath);
  if (!stat.isFile()) {
    console.error(`[ERROR] Redact only works on regular files, not directories or special devices.`);
    process.exit(2);
  }

  if (stat.size > MAX_FILE_SIZE) {
    console.error(`[ERROR] File is too large to redact safely (> 5 MB).`);
    process.exit(2);
  }

  if (isBinaryFileSync(fullPath)) {
    console.error(`[ERROR] File appears to be binary and cannot be redacted.`);
    process.exit(2);
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const { findings, errors: scanErrors } = scanText(content, fullPath, packs, {
    minSeverity: config.minSeverity,
    minConfidence: config.minConfidence,
  });

  if (scanErrors && scanErrors.length > 0) {
    console.error(`[ERROR] Scanner encountered internal errors:`);
    for (const err of scanErrors) {
      console.error(`  - ${err.errorMessage}`);
    }
    process.exit(2);
  }

  if (findings.length === 0) {
    console.log(`✅ No sensitive data found in ${target}. Nothing to redact.`);
    process.exit(0);
  }

  const redactedContent = applyRedaction(content, findings);

  const parsedPath = path.parse(fullPath);
  const newPath = path.join(parsedPath.dir, `${parsedPath.name}.redacted${parsedPath.ext}`);

  fs.writeFileSync(newPath, redactedContent, 'utf-8');

  console.log(`✅ Redacted ${findings.length} finding(s).`);
  console.log(`💾 Saved to: ${newPath}`);
  process.exit(0);
}
