import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { getIgnoreFilter, walkDir } from '../utils/ignore.js';
import { getPacks, scanFile, scanBuffer, scanText } from '../utils/scanner.js';
import type { Severity, ScanResult } from '@clipcloak/core';
import { loadAndResolveConfig } from '@clipcloak/core';

export interface ScanOptions {
  packs?: string;
  stdin?: boolean;
  staged?: boolean;
  format?: string;
  severity?: Severity;
  confidence?: number;
  strict?: boolean;
}

export async function runScan(target: string | undefined, options: ScanOptions) {
  const cwd = process.cwd();

  const cliOptions: any = {};
  if (options.packs) cliOptions.packs = options.packs.split(',');
  if (options.severity) cliOptions.minSeverity = options.severity;
  if (options.confidence !== undefined) cliOptions.minConfidence = options.confidence;

  const { config, errors: configErrors } = loadAndResolveConfig(cwd, cliOptions);
  if (configErrors.length > 0) {
    console.error('❌ [ERROR] Invalid configuration:');
    for (const err of configErrors) {
      console.error(`  - ${err}`);
    }
    process.exit(2);
  }

  const ig = getIgnoreFilter(cwd, config.ignore);

  let packs;
  try {
    packs = getPacks(config.packs);
  } catch (err: unknown) {
    console.error(`❌ [ERROR] Failed to load packs: ${(err instanceof Error ? err.message : String(err))}`);
    process.exit(2);
  }

  const allFindings: ScanResult[] = [];
  const allErrors: { file: string; errors: any[] }[] = [];

  const detectOptions = {
    minSeverity: config.minSeverity,
    minConfidence: config.minConfidence,
  };

  // Handle stdin
  if (options.stdin) {
    try {
      const input = fs.readFileSync(0, 'utf-8');
      const { findings, errors } = scanText(input, 'stdin', packs, detectOptions);
      const status = (errors && errors.length > 0) ? 'error' : 'scanned';
      if (errors && errors.length > 0) {
        allErrors.push({ file: 'stdin', errors });
      }
      if (findings.length > 0) {
        allFindings.push({ file: 'stdin', status, findings, errors: errors || [] });
      }
    } catch (err: unknown) {
      allErrors.push({
        file: 'stdin',
        errors: [{ packId: 'core', detectorId: 'stdin-reader', errorMessage: (err instanceof Error ? err.message : String(err)) }],
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
            const { findings, errors, skippedReason } = scanBuffer(buffer, fullPath, packs, detectOptions);
            const status = (errors && errors.length > 0) ? 'error' : skippedReason ? 'skipped' : 'scanned';
            if (errors && errors.length > 0) {
              allErrors.push({ file: fullPath, errors });
            }
            if (findings.length > 0 || skippedReason) {
              allFindings.push({ file: fullPath, status, findings, errors: errors || [], skippedReason });
            }
          } catch (err: unknown) {
            const errMsg = err instanceof Error ? err.message : String(err);
            allErrors.push({ file: fullPath, errors: [{ packId: 'core', detectorId: 'git-show', errorMessage: errMsg }] });
            allFindings.push({ file: fullPath, status: 'error', findings: [], errors: [{ packId: 'core', detectorId: 'git-show', errorMessage: errMsg }] });
          }
        }
      }
    } catch (err: unknown) {
      console.error(`❌ [ERROR] Failed to scan staged files: ${(err instanceof Error ? err.message : String(err))}`);
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
        const walkResult = walkDir(fullPath, ig, cwd);
        
        // Add walk errors
        for (const e of walkResult.errors) {
          const errMsg = e.error.message || String(e.error);
          const packError = { packId: 'core', detectorId: 'walk-dir', errorMessage: errMsg };
          allErrors.push({ file: e.path, errors: [packError] });
          allFindings.push({ file: e.path, status: 'error', findings: [], errors: [packError] });
        }
        
        // Add walk skipped
        for (const s of walkResult.skipped) {
          allFindings.push({ file: s.path, status: 'skipped', findings: [], errors: [], skippedReason: s.reason });
        }

        for (const file of walkResult.files) {
          const { findings, errors, skippedReason } = scanFile(file, packs, detectOptions);
          const status = (errors && errors.length > 0) ? 'error' : skippedReason ? 'skipped' : 'scanned';
          if (errors && errors.length > 0) {
            allErrors.push({ file, errors });
          }
          if (findings.length > 0 || skippedReason) {
            allFindings.push({ file, status, findings, errors: errors || [], skippedReason });
          }
        }
      } else {
        const relPath = path.relative(cwd, fullPath);
        if (!ig.ignores(relPath)) {
          const { findings, errors, skippedReason } = scanFile(fullPath, packs, detectOptions);
          const status = (errors && errors.length > 0) ? 'error' : skippedReason ? 'skipped' : 'scanned';
          if (errors && errors.length > 0) {
            allErrors.push({ file: fullPath, errors });
          }
          if (findings.length > 0 || skippedReason) {
            allFindings.push({ file: fullPath, status, findings, errors: errors || [], skippedReason });
          }
        }
      }
    } catch (err: unknown) {
      allErrors.push({
        file: fullPath,
        errors: [{ packId: 'core', detectorId: 'file-reader', errorMessage: (err instanceof Error ? err.message : String(err)) }],
      });
    }
  } else {
    console.error('❌ [ERROR] No target specified. Use --stdin, --staged, or provide a path.');
    process.exit(2);
  }

  const blockSeverityWeight: Record<string, number> = { low: 1, medium: 2, high: 3, critical: 4 };
  const minBlockW = blockSeverityWeight[config.blockMinSeverity || 'high'];
  const blockCategories = config.blockCategories || ['credential', 'secret'];

  // Check which findings are blocking
  const blockableFindings = allFindings
    .flatMap((r) => r.findings)
    .filter((f) => {
      return blockSeverityWeight[f.severity] >= minBlockW && blockCategories.includes(f.category);
    });

  // Strict mode: Treat skips and errors as blocking
  const skippedFiles = allFindings.filter((r) => r.status === 'skipped');
  const errorFiles = allFindings.filter((r) => r.status === 'error');
  // Include allErrors.length to catch errors that didn't generate an explicit error ScanResult
  const strictViolations = options.strict && (skippedFiles.length > 0 || errorFiles.length > 0 || allErrors.length > 0);

  let exitCode = 0;
  if (blockableFindings.length > 0) {
    exitCode = 1;
  } else if (strictViolations) {
    exitCode = 2;
  }

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
              version: '1.0.0',
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
        en: '🚨 Found {0} blocking secret(s) ({1} total findings).',
        pt: '🚨 Encontrado {0} segredo(s) impeditivo(s) ({1} total).',
      },
      clean: {
        en: '✅ No blocking secrets found.',
        pt: '✅ Nenhum segredo impeditivo encontrado.',
      },
    };

    for (const result of allFindings) {
      if (result.findings.length > 0) {
        console.log(`\n📄  ${i18n.get('file', t)} ${result.file}`);
        for (const f of result.findings) {
          const isBlockable =
            blockSeverityWeight[f.severity] >= minBlockW && blockCategories.includes(f.category);
          const prefix = isBlockable ? '⛔ [BLOCK]' : '⚠️ [WARN]';
          console.log(
            `  - ${prefix} ${f.detectorId}: ${f.redactedPreview} (${i18n.get('confidence', t)} ${f.confidence})`,
          );
        }
      }
    }

    if (skippedFiles.length > 0) {
      console.log(`\n⏭️  ${skippedFiles.length} file(s) skipped (e.g., ${skippedFiles[0].skippedReason}).`);
    }

    const totalErrors = errorFiles.length + allErrors.filter(e => !errorFiles.some(ef => ef.file === e.file)).length;
    if (totalErrors > 0) {
      console.log(`\n❌  ${totalErrors} file(s) encountered errors.`);
    }

    if (exitCode === 1) {
      console.log(
        '\n' +
          i18n
            .get('found', t)
            .replace('{0}', String(blockableFindings.length))
            .replace('{1}', String(allFindings.flatMap((r) => r.findings).length)),
      );
    } else if (exitCode === 2) {
      console.log(
        `\n⛔ [STRICT MODE] Run blocked due to ${skippedFiles.length} skipped files and ${totalErrors} errors.`
      );
    } else {
      console.log('\n' + i18n.get('clean', t));
    }
  }

  process.exit(exitCode);
}
