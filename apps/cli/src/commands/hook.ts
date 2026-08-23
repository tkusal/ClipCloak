import fs from 'node:fs';
import path from 'node:path';
import { detect, resolveConfig } from '@clipcloak/core';
import { loadConfigFile } from '../utils/config.js';
import { getPacks, isBinaryFileSync } from '../utils/scanner.js';

function getClaudeHookMode(): 'standard' | 'strict' {
  try {
    const configPath = path.join(process.cwd(), 'claude-clipcloak.config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.mode === 'strict') {
        return 'strict';
      }
    }
  } catch {
    // Ignore and fallback to standard mode
  }
  return 'standard';
}

function outputDecision(decision: 'allow' | 'deny', reason?: string) {
  const result: any = {
    hookSpecificOutput: {
      permissionDecision: decision,
    },
  };
  if (reason) {
    result.hookSpecificOutput.permissionDecisionReason = reason;
  }
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

export async function runClaudeCodeHook() {
  const mode = getClaudeHookMode();

  try {
    let input = '';
    try {
      input = fs.readFileSync(0, 'utf-8');
    } catch (err) {
      // If reading stdin fails, fallback to standard behavior
      if (mode === 'strict') {
        outputDecision('deny', 'ClipCloak strict mode: Failed to read stdin event.');
      } else {
        outputDecision('allow');
      }
    }

    if (!input.trim()) {
      outputDecision('allow');
    }

    let payload;
    try {
      payload = JSON.parse(input);
    } catch (err) {
      if (mode === 'strict') {
        outputDecision('deny', 'ClipCloak strict mode: Failed to parse stdin JSON payload.');
      } else {
        outputDecision('allow');
      }
      return;
    }

    const toolName = payload.tool_name || payload.toolName;
    const toolInput = payload.tool_input || payload.toolArgs || {};

    // Standard Claude Code tool names or typical CLI commands
    const fileReadTools = ['Read', 'ViewFile', 'View', 'fs_read_file', 'readFile', 'cat'];

    if (!toolName || !fileReadTools.includes(toolName)) {
      outputDecision('allow');
    }

    const filePath =
      toolInput.file_path ||
      toolInput.filePath ||
      toolInput.path ||
      toolInput.file ||
      toolInput.filename;

    if (!filePath || typeof filePath !== 'string') {
      if (mode === 'strict') {
        outputDecision('deny', 'ClipCloak strict mode: Unknown or missing file path in read tool.');
      } else {
        outputDecision('allow');
      }
      return;
    }

    const cwd = process.cwd();
    const fullPath = path.resolve(cwd, filePath);

    if (!fs.existsSync(fullPath)) {
      outputDecision('allow'); // Let the tool fail naturally on non-existing files
    }

    const stat = fs.statSync(fullPath);
    if (!stat.isFile()) {
      outputDecision('allow');
      return;
    }
    // Skip/Block very large files
    if (stat.size > 5 * 1024 * 1024) {
      if (mode === 'strict') {
        outputDecision(
          'deny',
          `ClipCloak strict mode: File ${filePath} is too large to scan safely (> 5 MB).`,
        );
      } else {
        outputDecision('allow');
      }
      return;
    }

    // Skip binary files
    if (isBinaryFileSync(fullPath)) {
      outputDecision('allow');
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    // Resolve project config
    const fileConfig = loadConfigFile(cwd);
    const config = resolveConfig(fileConfig, {});
    const packs = getPacks(config.packs);

    const { findings, errors } = detect(content, packs, {
      context: { filename: filePath },
      minSeverity: config.minSeverity || 'high',
      minConfidence: config.minConfidence || 0.5,
    });

    if (errors && errors.length > 0) {
      if (mode === 'strict') {
        outputDecision(
          'deny',
          `ClipCloak strict mode: Internal scanner error: ${errors[0].errorMessage}`,
        );
      } else {
        outputDecision('allow');
      }
      return;
    }

    if (findings.length > 0) {
      // Find the highest severity finding
      const worstFinding = [...findings].sort((a, b) => {
        const severityWeight = { low: 1, medium: 2, high: 3, critical: 4 };
        return severityWeight[b.severity] - severityWeight[a.severity];
      })[0];

      const reason = `ClipCloak blocked reading ${filePath} because it contains potential sensitive data (${worstFinding.detectorId}, severity: ${worstFinding.severity.toUpperCase()}).`;
      outputDecision('deny', reason);
    }

    outputDecision('allow');
  } catch (err: any) {
    if (mode === 'strict') {
      outputDecision('deny', `ClipCloak strict mode: Hook crash: ${err.message}`);
    } else {
      outputDecision('allow');
    }
  }
}
