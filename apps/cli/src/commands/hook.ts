import fs from 'node:fs';
import path from 'node:path';
import { detect, loadAndResolveConfig } from '@clipcloak/core';

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
      hookEventName: 'PreToolUse',
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
    const fileReadTools = ['Read', 'ViewFile', 'View', 'fs_read_file', 'readFile', 'cat', 'Bash', 'Grep'];

    if (!toolName || !fileReadTools.includes(toolName)) {
      outputDecision('allow');
    }

    const cwd = process.cwd();
    const pathsToScan: string[] = [];

    if (toolName === 'Bash' || toolName === 'Grep') {
      const commandOrPattern = toolInput.command || toolInput.pattern || '';
      // Heuristic: extract anything that looks like a file path after standard read commands
      const regex = /(?:cat|grep|head|tail|less|more|vi|vim|nano)\s+(?:-[a-zA-Z0-9]+\s+)*(['"]?)([a-zA-Z0-9_.\-/\\]+)\1/g;
      let match;
      while ((match = regex.exec(commandOrPattern)) !== null) {
        if (match[2] && !match[2].startsWith('-')) {
          pathsToScan.push(match[2]);
        }
      }
      
      // If we couldn't extract paths but it's Bash/Grep, we allow it with a risk (or we could block in strict mode)
      if (pathsToScan.length === 0) {
        outputDecision('allow');
        return;
      }
    } else {
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
      pathsToScan.push(filePath);
    }

    // Resolve project config once
    const { config } = loadAndResolveConfig(cwd, {});
    const packs = getPacks(config.packs);

    for (const filePath of pathsToScan) {
      const fullPath = path.resolve(cwd, filePath);

      if (!fs.existsSync(fullPath)) {
        continue;
      }

      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) {
        continue;
      }
      
      // Skip/Block very large files
      if (stat.size > 5 * 1024 * 1024) {
        if (mode === 'strict') {
          outputDecision(
            'deny',
            `ClipCloak strict mode: File ${filePath} is too large to scan safely (> 5 MB).`,
          );
        }
        continue;
      }

      // Skip binary files
      if (isBinaryFileSync(fullPath)) {
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf8');

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
        }
        continue;
      }

      const blockSeverityWeight = { low: 1, medium: 2, high: 3, critical: 4 };
      const minBlockW = blockSeverityWeight[config.blockMinSeverity || 'high'];
      const blockCategories = config.blockCategories || ['credential', 'secret'];

      const blockableFindings = findings.filter(
        (f) => blockSeverityWeight[f.severity] >= minBlockW && blockCategories.includes(f.category)
      );

      if (blockableFindings.length > 0) {
        // Find the highest severity finding
        const worstFinding = [...blockableFindings].sort((a, b) => {
          return blockSeverityWeight[b.severity] - blockSeverityWeight[a.severity];
        })[0];

        const reason = `ClipCloak blocked reading ${filePath} because it contains potential sensitive data (${worstFinding.detectorId}, severity: ${worstFinding.severity.toUpperCase()}). Note: Claude Code @file references bypass PreToolUse hooks.`;
        outputDecision('deny', reason);
        return; // Exits process
      }
    }

    outputDecision('allow');
  } catch (err: unknown) {
    if (mode === 'strict') {
      outputDecision('deny', `ClipCloak strict mode: Hook crash: ${(err instanceof Error ? err.message : String(err))}`);
    } else {
      outputDecision('allow');
    }
  }
}
