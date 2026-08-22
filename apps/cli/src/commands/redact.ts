import fs from 'node:fs';
import path from 'node:path';
import { getPacks, scanText } from '../utils/scanner.js';
import { applyRedaction } from '@clipcloak/core';
import { loadConfigFile } from '../utils/config.js';
import { resolveConfig } from '@clipcloak/core';

export async function runRedact(target: string) {
  const cwd = process.cwd();
  const fileConfig = loadConfigFile(cwd);
  const config = resolveConfig(fileConfig, {});
  const packs = getPacks(config.packs);

  const fullPath = path.resolve(cwd, target);
  if (!fs.existsSync(fullPath)) {
    console.error(`[ERROR] Target not found: ${fullPath}`);
    process.exit(2);
  }

  const stat = fs.statSync(fullPath);
  if (stat.isDirectory()) {
    console.error(`[ERROR] Redact only works on single files, not directories.`);
    process.exit(2);
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const { findings } = scanText(content, fullPath, packs, {
    minSeverity: config.minSeverity,
    minConfidence: config.minConfidence
  });

  if (findings.length === 0) {
    console.log(`✅ No secrets found in ${target}. Nothing to redact.`);
    process.exit(0);
  }

  const redactedContent = applyRedaction(content, findings);
  
  const parsedPath = path.parse(fullPath);
  const newPath = path.join(parsedPath.dir, `${parsedPath.name}.redacted${parsedPath.ext}`);
  
  fs.writeFileSync(newPath, redactedContent, 'utf-8');
  
  console.log(`✅ Redacted ${findings.length} secret(s).`);
  console.log(`💾 Saved to: ${newPath}`);
  process.exit(0);
}
