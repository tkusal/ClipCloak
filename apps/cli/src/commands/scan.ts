import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { getIgnoreFilter, walkDir } from '../utils/ignore.js';
import { getPacks, scanFile, scanBuffer, scanText } from '../utils/scanner.js';
import type { Finding, Severity } from '@clipcloak/core';
import { resolveConfig, validateConfig } from '@clipcloak/core';
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
  if (fileConfig) {
    const configErrors = validateConfig(fileConfig);
    if (configErrors.length > 0) {
      console.error('❌ [ERROR] Invalid configuration in .clipcloak.json:');
      for (const err of configErrors) {
        console.error(`  - ${err}`);
      }
      process.exit(2);
    }
  }

  const cliOptions: any = {};
  if (options.packs) cliOptions.packs = options.packs.split(',');
  if (options.severity) cliOptions.minSeverity = options.severity;
  if (options.confidence !== undefined) cliOptions.minConfidence = options.confidence;

  let config;
  try {
    config = resolveConfig(fileConfig, cliOptions);
  } catch (err: any) {
    console.error(`❌ [ERROR] Config resolution failed: ${err.message}`);
    process.exit(2);
  }

  const ig = getIgnoreFilter(cwd, config.ignore);

  let packs;
  try {
    packs = getPacks(config.packs);
  } catch (err: any) {
    console.error(`❌ [ERROR] Pack resolution failed: ${err.message}`);
    process.exit(2);
  }

  const allFindings: { file: string; findings: Finding[] }[] = [];
  const allErrors: { file: string; errors: any[] }[] = [];

  const detectOptions = {
    minSeverity: config.minSeverity,
    minConfidence: config.minConfidence,
  };

  // Handle stdin
  if (options.stdin) {
    try {
      const text = fs.readFileSync(0, 'utf-8'); // Read from stdin
      const { findings, errors } = scanText(text, 'stdin', packs, detectOptions);
      if (errors && errors.length > 0) {
        allErrors.push({ file: 'stdin', errors });
      }
      if (findings.length > 0) {
        allFindings.push({ file: 'stdin', findings });
      }
    } catch (err: any) {
      allErrors.push({
        file: 'stdin',
        errors: [{ packId: 'core', detectorId: 'stdin-reader', errorMessage: err.message }],
      });
    }
  }
  // Handle staged files
  else if (options.staged) {
    try {
      const gitOutput = execFileSync(
        'git',
        ['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'],
        { cwd },
      ).toString();
      const files = gitOutput.split('\0').filter(Boolean);
      for (const file of files) {
        const fullPath = path.resolve(cwd, file);
        const relPath = path.relative(cwd, fullPath);
        if (!ig.ignores(relPath)) {
          // Read exact staged content directly from the index using git show :<file>
          try {
            const buffer = execFileSync('git', ['show', `:${file}`], {
              cwd,
              stdio: ['pipe', 'pipe', 'pipe'],
            });
            const { findings, errors } = scanBuffer(buffer, fullPath, packs, detectOptions);
            if (errors && errors.length > 0) {
              allErrors.push({ file: fullPath, errors });
            }
            if (findings.length > 0) {
              allFindings.push({ file: fullPath, findings });
            }
          } catch (err) {
            // Fallback to normal file read if git show fails (e.g. untracked or deleted from staging index somehow)
            const { findings, errors } = scanFile(fullPath, packs, detectOptions);
            if (errors && errors.length > 0) {
              allErrors.push({ file: fullPath, errors });
            }
            if (findings.length > 0) {
              allFindings.push({ file: fullPath, findings });
            }
          }
        }
      }
    } catch (err: any) {
      console.error(`❌ [ERROR] Failed to scan staged files: ${err.message}`);
      process.exit(2);
    }
  }
  // Handle file or directory
  else if (target) {
    const fullPath = path.resolve(cwd, target);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ [ERROR] Target not found: ${fullPath}`);
      process.exit(2);
    }

    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        const files = walkDir(fullPath, ig, cwd);
        for (const file of files) {
          const { findings, errors } = scanFile(file, packs, detectOptions);
          if (errors && errors.length > 0) {
            allErrors.push({ file, errors });
          }
          if (findings.length > 0) {
            allFindings.push({ file, findings });
          }
        }
      } else {
        const relPath = path.relative(cwd, fullPath);
        if (!ig.ignores(relPath)) {
          const { findings, errors } = scanFile(fullPath, packs, detectOptions);
          if (errors && errors.length > 0) {
            allErrors.push({ file: fullPath, errors });
          }
          if (findings.length > 0) {
            allFindings.push({ file: fullPath, findings });
          }
        }
      }
    } catch (err: any) {
      allErrors.push({
        file: fullPath,
        errors: [{ packId: 'core', detectorId: 'target-scanner', errorMessage: err.message }],
      });
    }
  } else {
    console.error('❌ [ERROR] Please specify a file/directory or use --stdin/--staged');
    process.exit(2);
  }

  // Handle failure-closed logic on scanner errors
  if (allErrors.length > 0) {
    console.error(`\n❌ [ERROR] ClipCloak encountered errors during scan:`);
    for (const errObj of allErrors) {
      console.error(`  - In ${errObj.file}:`);
      for (const err of errObj.errors) {
        console.error(`    * ${err.errorMessage}`);
      }
    }
    process.exit(2);
  }

  const blockSeverityWeight = { low: 1, medium: 2, high: 3, critical: 4 };
  const minBlockW = blockSeverityWeight[config.blockMinSeverity || 'high'];
  const blockCategories = config.blockCategories || ['credential', 'secret'];

  // Check which findings are blocking
  const blockableFindings = allFindings
    .flatMap((r) => r.findings)
    .filter((f) => {
      return blockSeverityWeight[f.severity] >= minBlockW && blockCategories.includes(f.category);
    });

  // Print results
  if (options.format === 'json') {
    console.log(JSON.stringify(allFindings, null, 2));
  } else if (options.format === 'sarif') {
    const sarif = {
      version: '2.1.0',
      $schema:
        'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
      runs: [
        {
          tool: {
            driver: {
              name: 'ClipCloak',
              version: '0.2.0',
              informationUri: 'https://github.com/tkusal/ClipCloak',
            },
          },
          results: allFindings.flatMap((r) =>
            r.findings.map((f) => ({
              ruleId: f.detectorId,
              message: { text: f.reason },
              locations: [
                {
                  physicalLocation: {
                    artifactLocation: { uri: r.file },
                    region: { charOffset: f.start, charLength: f.end - f.start },
                  },
                },
              ],
            })),
          ),
        },
      ],
    };
    console.log(JSON.stringify(sarif, null, 2));
  } else {
    // Text output
    const { i18n } = await import('@clipcloak/core');
    const t = {
      file: { en: 'File:', pt: 'Arquivo:' },
      confidence: { en: 'confidence:', pt: 'confiança:' },
      found: {
        en: '❌ Found {0} blocking secret(s) ({1} total findings).',
        pt: '❌ Encontrado {0} segredo(s) impeditivo(s) ({1} total).',
      },
      clean: {
        en: '✅ No blocking secrets found.',
        pt: '✅ Nenhum segredo impeditivo encontrado.',
      },
    };

    for (const result of allFindings) {
      if (result.findings.length > 0) {
        console.log(`\n🛡️  ${i18n.get('file', t)} ${result.file}`);
        for (const f of result.findings) {
          const isBlockable =
            blockSeverityWeight[f.severity] >= minBlockW && blockCategories.includes(f.category);
          const prefix = isBlockable ? '❌ [BLOCK]' : '⚠️ [WARN]';
          console.log(
            `  - ${prefix} ${f.detectorId}: ${f.redactedPreview} (${i18n.get('confidence', t)} ${f.confidence})`,
          );
        }
      }
    }

    if (blockableFindings.length > 0) {
      const totalFindings = allFindings.reduce((acc, curr) => acc + curr.findings.length, 0);
      console.log(
        `\n${i18n.get('found', t, blockableFindings.length.toString(), totalFindings.toString())}`,
      );
      process.exit(1);
    } else {
      console.log(i18n.get('clean', t));
      process.exit(0);
    }
  }

  process.exit(blockableFindings.length > 0 ? 1 : 0);
}
