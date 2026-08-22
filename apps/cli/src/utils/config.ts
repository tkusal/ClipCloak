import fs from 'node:fs';
import path from 'node:path';
import type { ClipCloakConfig } from '@clipcloak/core';

/**
 * Loads configuration from .clipcloak.json in the specified directory or its parents.
 */
export function loadConfigFile(cwd: string = process.cwd()): Partial<ClipCloakConfig> | null {
  let currentDir = cwd;
  let reachedRoot = false;
  while (!reachedRoot) {
    const configPath = path.join(currentDir, '.clipcloak.json');
    if (fs.existsSync(configPath)) {
      try {
        const content = fs.readFileSync(configPath, 'utf-8');
        const parsed = JSON.parse(content) as Partial<ClipCloakConfig>;
        return parsed;
      } catch (err) {
        console.warn(`[ClipCloak] Failed to parse ${configPath}:`, err);
        return null;
      }
    }
    
    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) {
      reachedRoot = true;
    } else {
      currentDir = parentDir;
    }
  }
  
  return null;
}
