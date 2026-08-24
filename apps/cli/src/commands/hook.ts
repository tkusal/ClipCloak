import fs from 'node:fs';
import path from 'node:path';
import { detect, loadAndResolveConfig } from '@clipcloak/core';

import { getPacks, isBinaryFileSync } from '../utils/scanner.js';

function getClaudeHookMode(): { mode: 'standard' | 'strict'; error?: string } {
  const configPath = path.join(process.cwd(), 'claude-clipcloak.config.json');
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      if (config.mode === 'strict') {
        return { mode: 'strict' };
      }
    } catch (err) {
      return { mode: 'strict', error: 'Malformed claude-clipcloak.config.json' };
    }
  }
  return { mode: 'standard' };
}

function outputDecision(decision: 'allow' | 'deny', reason?: string) {
  const result: {
    hookSpecificOutput: {
      hookEventName: string;
      permissionDecision: 'allow' | 'deny';
      permissionDecisionReason?: string;
    };
  } = {
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
  const modeResult = getClaudeHookMode();
  const mode = modeResult.mode;

  if (modeResult.error && mode === 'strict') {
    return outputDecision('deny', `ClipCloak strict mode: ${modeResult.error}`);
  }

  const cwd = process.cwd();

  try {
    let input = '';
    try {
      input = fs.readFileSync(0, 'utf-8');
    } catch (err) {
      if (mode === 'strict') {
        return outputDecision('deny', 'ClipCloak strict mode: Failed to read stdin event.');
      } else {
        return outputDecision('allow');
      }
    }

    if (!input.trim()) {
      if (mode === 'strict') {
        return outputDecision('deny', 'ClipCloak strict mode: Empty stdin payload.');
      }
      return outputDecision('allow');
    }

    let payload;
    try {
      payload = JSON.parse(input);
    } catch (err) {
      if (mode === 'strict') {
        return outputDecision('deny', 'ClipCloak strict mode: Failed to parse stdin JSON payload.');
      }
      return outputDecision('allow');
    }

    const toolName = payload.tool_name || payload.toolName;
    const toolInput = payload.tool_input || payload.toolArgs || {};

    const fileReadTools = ['Read', 'ViewFile', 'View', 'fs_read_file', 'readFile', 'cat', 'Bash', 'Grep', 'PowerShell'];

    if (!toolName || !fileReadTools.includes(toolName)) {
      if (mode === 'strict') {
        return outputDecision('deny', 'Unknown tool not allowed in strict mode. Only standard read operations are intercepted.');
      }
      return outputDecision('allow');
    }

    const pathsToScan: string[] = [];

    if (toolName === 'Bash' || toolName === 'PowerShell') {
      const commandOrPattern = toolInput.command || '';
      // Heuristic: extract paths for Bash and PowerShell
      const regex = /(?:cat|grep|head|tail|less|more|vi|vim|nano|Get-Content|gc|type)\s+(?:-[a-zA-Z0-9]+\s+)*(['"]?)([a-zA-Z0-9_.\-/\\][\w\s.\-/\\]*?)\1(?=\s|$|&&|\|\||;|>|<|\|)/gi;
      let match;
      while ((match = regex.exec(commandOrPattern)) !== null) {
        if (match[2] && !match[2].startsWith('-')) {
          pathsToScan.push(match[2].trim());
        }
      }
      
      if (pathsToScan.length === 0) {
        if (mode === 'strict') {
          return outputDecision('deny', `ClipCloak strict mode: Could not reliably extract file paths from ${toolName} command.`);
        }
        return outputDecision('allow');
      }
    } else if (toolName === 'Grep') {
      const filePath = toolInput.path || toolInput.filePath || toolInput.file_path;
      if (filePath) {
        pathsToScan.push(filePath);
      } else {
        if (mode === 'strict') {
          return outputDecision('deny', 'ClipCloak strict mode: Grep tool requires a path field.');
        }
        return outputDecision('allow');
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
          return outputDecision('deny', 'ClipCloak strict mode: Unknown or missing file path in read tool.');
        }
        return outputDecision('allow');
      }
      pathsToScan.push(filePath);
    }

    const { config, errors: configErrors } = loadAndResolveConfig(cwd, {});
    if (configErrors && configErrors.length > 0 && mode === 'strict') {
      return outputDecision('deny', `ClipCloak strict mode: Configuration error: ${configErrors[0]}`);
    }
    
    const packs = getPacks(config.packs);

    for (const filePath of pathsToScan) {
      const fullPath = path.resolve(cwd, filePath);

      if (!fs.existsSync(fullPath)) {
        if (mode === 'strict') {
          return outputDecision('deny', `ClipCloak strict mode: Target file ${filePath} does not exist.`);
        }
        continue;
      }

      const stat = fs.statSync(fullPath);
      if (!stat.isFile()) {
        if (mode === 'strict') {
          return outputDecision('deny', `ClipCloak strict mode: Target ${filePath} is not a regular file.`);
        }
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
        if (mode === 'strict') {
          outputDecision('deny', `ClipCloak strict mode: File ${filePath} is a binary file and cannot be scanned.`);
        }
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
