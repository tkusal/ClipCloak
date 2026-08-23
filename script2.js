const fs = require('fs');
const files = [
  'packages/pack-br/src/detectors/cpf-cnpj.ts',
  'packages/pack-br/src/detectors/pix.ts'
];

const metadata = {
  'cpf-cnpj': { s: 'medium', c: 0.95, d: 'Brazilian CPF and CNPJ validated mathematically' },
  'pix-key': { s: 'high', c: 0.8, d: 'Brazilian PIX payment keys' }
};

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let match;
  const regex = /id:\s*'([^']+)',\s*\n\s*category:\s*'([^']+)',/g;
  let newContent = content;
  
  while ((match = regex.exec(content)) !== null) {
    const id = match[1];
    const meta = metadata[id];
    if (meta) {
      const replacement = `id: '${id}',\n  category: '${match[2]}',\n  defaultSeverity: '${meta.s}',\n  defaultConfidence: ${meta.c},\n  description: '${meta.d}',`;
      newContent = newContent.replace(match[0], replacement);
    }
  }
  fs.writeFileSync(file, newContent);
}
