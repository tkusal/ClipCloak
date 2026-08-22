import fs from 'node:fs';
import path from 'node:path';
import { detect } from '@clipcloak/core';
import genericPack from '@clipcloak/pack-generic';
import brPack from '@clipcloak/pack-br';
import euPack from '@clipcloak/pack-eu';
import type { DetectorPack } from '@clipcloak/core';

// Claude Code Hook Types (Conceptual based on the official spec)
export interface PreToolUseEvent {
  toolName: string;
  toolArgs: Record<string, unknown>;
}

export interface HookDecision {
  status: 'ALLOW' | 'BLOCK';
  message?: string;
}

const ALL_PACKS: DetectorPack[] = [genericPack, brPack, euPack];

/**
 * Hook handler designed to be registered via Claude Code's extension system.
 * It intercepts file reading tools and scans the content before the LLM sees it.
 */
export function handlePreToolUse(
  event: PreToolUseEvent,
  cwd: string = process.cwd(),
  mode: 'standard' | 'strict' = 'standard',
): HookDecision {
  // We only care about file reading tools for this layer of protection
  const readTools = ['fs_read_file', 'readFile', 'cat', 'ViewFile'];

  if (!readTools.includes(event.toolName)) {
    return { status: 'ALLOW' };
  }

  // Extract the filename being accessed (depends on the specific tool's schema)
  const targetFile = event.toolArgs?.path || event.toolArgs?.file || event.toolArgs?.filename;

  if (!targetFile || typeof targetFile !== 'string') {
    return mode === 'strict'
      ? { status: 'BLOCK', message: 'ClipCloak strict mode: Unknown arguments in read tool.' }
      : { status: 'ALLOW' };
  }

  const fullPath = path.resolve(cwd, targetFile);

  if (!fs.existsSync(fullPath)) {
    return { status: 'ALLOW' }; // Let the tool fail naturally if file doesn't exist
  }

  try {
    const stat = fs.statSync(fullPath);
    // Skip very large files to prevent freezing the agent
    if (stat.size > 5 * 1024 * 1024) {
      return mode === 'strict'
        ? { status: 'BLOCK', message: 'ClipCloak strict mode: File is too large to scan safely.' }
        : { status: 'ALLOW' };
    }

    const content = fs.readFileSync(fullPath, 'utf8');

    // Scan using the core engine
    const { findings } = detect(content, ALL_PACKS, {
      context: { filename: targetFile },
      minSeverity: 'high', // We only block for High or Critical to avoid interrupting vibe coding too much
    });

    if (findings.length > 0) {
      // Sort findings by severity so we highlight the worst one
      const worstFinding = [...findings].sort((a, _b) => (a.severity === 'critical' ? -1 : 1))[0];

      // Safe redacted message for the agent context (never print the raw value!)
      const message = `ClipCloak blocked this operation.

Potential sensitive data detected in:
${targetFile}

Detector: ${worstFinding.packId}/${worstFinding.detectorId}
Severity: ${worstFinding.severity.toUpperCase()}

The sensitive value was not displayed to protect your credentials.`;

      return {
        status: 'BLOCK',
        message,
      };
    }

    return { status: 'ALLOW' };
  } catch (err) {
    // Failsafe: if the scanner crashes, we allow the read to not break the user's flow in standard mode
    if (mode === 'strict') {
      return {
        status: 'BLOCK',
        message: 'ClipCloak strict mode: Internal scanner error prevented safe reading.',
      };
    }
    return { status: 'ALLOW' };
  }
}
