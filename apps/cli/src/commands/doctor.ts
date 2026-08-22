import os from 'node:os';
import { getPacks } from '../utils/scanner.js';
import { loadConfigFile } from '../utils/config.js';
import { resolveConfig } from '@clipcloak/core';

export async function runDoctor() {
  console.log('🩺 ClipCloak Doctor\n');

  console.log('--- Environment ---');
  console.log(`OS: ${os.type()} ${os.release()} (${os.arch()})`);
  console.log(`Node: ${process.version}`);
  console.log(`CWD: ${process.cwd()}\n`);

  console.log('--- Configuration ---');
  const fileConfig = loadConfigFile(process.cwd());
  if (fileConfig) {
    console.log('✅ Found .clipcloak.json in project or parent directory.');
  } else {
    console.log('ℹ️ No .clipcloak.json found. Using defaults.');
  }
  
  const config = resolveConfig(fileConfig, {});
  console.log(`Resolved minSeverity: ${config.minSeverity}`);
  console.log(`Resolved minConfidence: ${config.minConfidence}`);
  console.log(`Ignored patterns: ${config.ignore?.length || 0} rule(s)\n`);

  console.log('--- Detector Packs ---');
  const packs = getPacks(config.packs);
  console.log(`Active Packs: ${packs.length}`);
  
  for (const pack of packs) {
    console.log(`📦 Pack: ${pack.id}`);
    console.log(`   Detectors: ${pack.detectors.length}`);
    pack.detectors.forEach(d => {
      console.log(`     - ${d.id} [${d.category}]`);
    });
  }

  console.log('\n✅ Doctor check complete. Everything looks good!');
  process.exit(0);
}
