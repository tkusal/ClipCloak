import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { getIgnoreFilter, walkDir } from '../utils/ignore.js';
import { getPacks, scanFile, scanText } from '../utils/scanner.js';
import type { Finding, Severity } from '@clipcloak/core';
import { resolveConfig } from '@clipcloak/core';
import { loadConfigFile } from '../utils/config.js';

export interface ScanOptions {
  packs?: string;
  stdin?: boolean;
  staged?: boolean;
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
  // Handle staged files
  else if (options.staged) {
    try {
      const gitOutput = execSync('git diff --cached --name-only --diff-filter=ACMR').toString();
      const files = gitOutput.split('\n').map(s => s.trim()).filter(Boolean);
      for (const file of files) {
        const fullPath = path.resolve(cwd, file);
        if (fs.existsSync(fullPath)) {
          const relPath = path.relative(cwd, fullPath);
          if (!ig.ignores(relPath)) {
            // Read exact staged content using git show :<file>
            try {
              const content = execSync(`git show :${file}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString();
              const { findings } = scanText(content, fullPath, packs, detectOptions);
              if (findings.length > 0) {
                allFindings.push({ file: fullPath, findings });
              }
            } catch (err) {
              // Fallback to normal file read if git show fails (e.g., deleted file or renamed)
              const { findings } = scanFile(fullPath, packs, detectOptions);
              if (findings.length > 0) {
                allFindings.push({ file: fullPath, findings });
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('[ERROR] Failed to get staged files. Are you in a git repository?');
      process.exit(2);
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
  } else if (options.format === 'sarif') {
    const sarif = {
      version: '2.1.0',
      $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      runs: [{
        tool: {
          driver: {
            name: 'ClipCloak',
            version: '0.2.0',
            informationUri: 'https://github.com/tkusal/ClipCloak'
          }
        },
        results: allFindings.flatMap(r => r.findings.map(f => ({
          ruleId: f.detectorId,
          message: { text: f.reason },
          locations: [{
            physicalLocation: {
              artifactLocation: { uri: r.file },
              region: { charOffset: f.start, charLength: f.end - f.start }
            }
          }]
        })))
      }]
    };
    console.log(JSON.stringify(sarif, null, 2));
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
