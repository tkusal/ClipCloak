import fs from 'node:fs';
import path from 'node:path';
import { getIgnoreFilter, walkDir } from '../utils/ignore.js';
import { getPacks, scanFile, scanText } from '../utils/scanner.js';
import type { Finding, Severity } from '@clipcloak/core';
import { resolveConfig } from '@clipcloak/core';
import { loadConfigFile } from '../utils/config.js';

export interface ScanOptions {
  packs?: string;
  stdin?: boolean;
  format?: string;
  severity?: Severity;
  confidence?: number;
}

export async function runScan(target: string | undefined, options: ScanOptions) {
  const cwd = process.cwd();
  
  const fileConfig = loadConfigFile(cwd);
  
  const cliOptions: any = {};
  if (options.packs) cliOptions.packs = options.packs.split(',');
  if (options.severity) cliOptions.minSeverity = options.severity;
  if (options.confidence !== undefined) cliOptions.minConfidence = options.confidence;
  
  const config = resolveConfig(fileConfig, cliOptions);
  
  const ig = getIgnoreFilter(cwd, config.ignore);
  
  const packs = getPacks(config.packs);
  
  const allFindings: { file: string; findings: Finding[] }[] = [];

  const detectOptions = {
    minSeverity: config.minSeverity,
    minConfidence: config.minConfidence
  };

  // Handle stdin
  if (options.stdin) {
    const text = fs.readFileSync(0, 'utf-8'); // Read from stdin
    const { findings } = scanText(text, 'stdin', packs, detectOptions);
    if (findings.length > 0) {
      allFindings.push({ file: 'stdin', findings });
    }
  } 
  // Handle file or directory
  else if (target) {
    const fullPath = path.resolve(cwd, target);
    if (!fs.existsSync(fullPath)) {
      console.error(`[ERROR] Target not found: ${fullPath}`);
      process.exit(2);
    }

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      const files = walkDir(fullPath, ig, cwd);
      for (const file of files) {
        const { findings } = scanFile(file, packs, detectOptions);
        if (findings.length > 0) {
          allFindings.push({ file, findings });
        }
      }
    } else {
      // Check if the single file is ignored anyway
      const relPath = path.relative(cwd, fullPath);
      if (!ig.ignores(relPath)) {
        const { findings } = scanFile(fullPath, packs, detectOptions);
        if (findings.length > 0) {
          allFindings.push({ file: fullPath, findings });
        }
      }
    }
  } 
  else {
    console.error('[ERROR] Please specify a file/directory or use --stdin');
    process.exit(2);
  }

  // Print results
  if (options.format === 'json') {
    console.log(JSON.stringify(allFindings, null, 2));
  } else {
    // Text output
    let total = 0;
    for (const result of allFindings) {
      if (result.findings.length > 0) {
        console.log(`\n🛡️  File: ${result.file}`);
        for (const f of result.findings) {
          total++;
          console.log(`  - [${f.severity.toUpperCase()}] ${f.detectorId}: ${f.redactedPreview} (confidence: ${f.confidence})`);
        }
      }
    }
    
    if (total > 0) {
      console.log(`\n❌ Found ${total} potential secret(s).`);
      process.exit(1);
    } else {
      console.log('✅ No secrets found.');
      process.exit(0);
    }
  }

  // Exit appropriately for JSON as well
  const totalFindings = allFindings.reduce((acc, curr) => acc + curr.findings.length, 0);
  process.exit(totalFindings > 0 ? 1 : 0);
}
