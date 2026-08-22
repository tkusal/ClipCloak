import { detect } from '@clipcloak/core';
import genericPack from '@clipcloak/pack-generic';
import brPack from '@clipcloak/pack-br';
import euPack from '@clipcloak/pack-eu';
import type { DetectorPack, DetectOptions, DetectResult } from '@clipcloak/core';
import fs from 'node:fs';

const ALL_PACKS: Record<string, DetectorPack> = {
  generic: genericPack,
  br: brPack,
  eu: euPack,
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export function getPacks(packNames?: string[]): DetectorPack[] {
  if (!packNames || packNames.length === 0) {
    return Object.values(ALL_PACKS);
  }
  
  const selected: DetectorPack[] = [];
  for (const name of packNames) {
    const trimmed = name.trim();
    if (ALL_PACKS[trimmed]) {
      selected.push(ALL_PACKS[trimmed]);
    } else {
      console.warn(`[WARN] Pack '${trimmed}' not found. Ignoring.`);
    }
  }
  return selected;
}

export function scanText(text: string, filename: string, packs: DetectorPack[], customOptions: Omit<DetectOptions, 'context'> = {}): DetectResult {
  const options: DetectOptions = {
    ...customOptions,
    context: { filename }
  };
  return detect(text, packs, options);
}

export function isBinaryFileSync(filepath: string): boolean {
  try {
    const fd = fs.openSync(filepath, 'r');
    const buffer = Buffer.alloc(4096);
    const bytesRead = fs.readSync(fd, buffer, 0, 4096, 0);
    fs.closeSync(fd);
    
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) {
        return true;
      }
    }
    return false;
  } catch {
    return false; // If we can't read it, let the next step try and fail gracefully
  }
}

export function scanFile(filepath: string, packs: DetectorPack[], customOptions: Omit<DetectOptions, 'context'> = {}): DetectResult {
  try {
    const stat = fs.statSync(filepath);
    if (stat.size > MAX_FILE_SIZE) {
      console.warn(`[SKIP] File ${filepath} is too large (${(stat.size/1024/1024).toFixed(2)} MB)`);
      return { findings: [], errors: [] };
    }

    if (isBinaryFileSync(filepath)) {
      // We don't log every single binary skip as it would be too noisy, 
      // but maybe verbose mode later. For now just skip silently.
      return { findings: [], errors: [] };
    }

    const content = fs.readFileSync(filepath, 'utf8');
    return scanText(content, filepath, packs, customOptions);
  } catch (err: any) {
    if (err.code === 'EACCES' || err.code === 'EPERM' || err.code === 'ENOENT') {
      console.warn(`[WARN] Failed to read ${filepath} (Permission denied or not found). Skipping.`);
      return { findings: [], errors: [] };
    }
    
    // For other weird IO errors, log but do not crash the whole process
    console.warn(`[ERROR] Unexpected error reading ${filepath}: ${err instanceof Error ? err.message : String(err)}`);
    return { findings: [], errors: [] };
  }
}
