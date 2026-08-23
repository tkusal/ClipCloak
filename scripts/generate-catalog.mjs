import genericPack from '../packages/pack-generic/dist/index.js';
import brPack from '../packages/pack-br/dist/index.js';
import euPack from '../packages/pack-eu/dist/index.js';
import fs from 'fs';
import path from 'path';

const packs = [genericPack.default || genericPack, brPack.default || brPack, euPack.default || euPack];

let md = '# ClipCloak Detector Catalog\n\n';
md += 'ClipCloak groups its detectors into packages called **Packs**. These are loaded based on configuration or command line options.\n\n';

for (const pack of packs) {
  md += `## 📦 Pack: \`${pack.id}\`\n\n`;
  if (pack.id === 'generic') md += 'The generic pack targets widely used API keys, infrastructure credentials, and common PII.\n\n';
  if (pack.id === 'br') md += 'Designed to detect Brazilian regional identifier formats with deterministic verifications.\n\n';
  if (pack.id === 'eu') md += 'Designed to detect European regional identifier formats.\n\n';

  md += '| Detector ID | Category | Description |\n';
  md += '| ----------- | -------- | ----------- |\n';

  for (const detector of pack.detectors) {
    let desc = detector.id;
    md += `| \`${detector.id}\` | \`${detector.category}\` | ${desc} |\n`;
  }
  md += '\n---\n\n';
}

fs.writeFileSync(path.join(process.cwd(), 'docs', 'detectors.md'), md);
console.log('Catalog generated.');
