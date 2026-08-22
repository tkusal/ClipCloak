import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_CONFIG } from '@clipcloak/core';

export async function runInit() {
  const cwd = process.cwd();
  const configPath = path.join(cwd, '.clipcloak.json');

  if (fs.existsSync(configPath)) {
    console.warn(`[ClipCloak] Configuration file already exists at ${configPath}`);
    process.exit(1);
  }

  try {
    const configString = JSON.stringify(DEFAULT_CONFIG, null, 2);
    fs.writeFileSync(configPath, configString, 'utf-8');
    console.log(`✅ Created .clipcloak.json at ${configPath}`);
    console.log('You can now customize the engine behavior, ignored patterns, and enabled packs.');
    process.exit(0);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ERROR] Failed to create .clipcloak.json: ${message}`);
    process.exit(2);
  }
}
