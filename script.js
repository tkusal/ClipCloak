const fs = require('fs');
const files = [
  'packages/pack-br/src/detectors/cpf-cnpj.ts',
  'packages/pack-br/src/detectors/phone.ts',
  'packages/pack-br/src/detectors/pix.ts',
  'packages/pack-eu/src/detectors/iban.ts',
  'packages/pack-eu/src/detectors/vat.ts',
  'packages/pack-generic/src/detectors/aws.ts',
  'packages/pack-generic/src/detectors/connection-string.ts',
  'packages/pack-generic/src/detectors/credit-card.ts',
  'packages/pack-generic/src/detectors/github.ts',
  'packages/pack-generic/src/detectors/jwt.ts',
  'packages/pack-generic/src/detectors/network.ts',
  'packages/pack-generic/src/detectors/private-key.ts',
  'packages/pack-generic/src/detectors/stripe.ts',
  'packages/pack-generic/src/detectors/tokens.ts'
];

const metadata = {
  'cpf': { s: 'medium', c: 0.95, d: 'Brazilian CPF validated mathematically' },
  'cnpj': { s: 'medium', c: 0.95, d: 'Brazilian CNPJ validated mathematically' },
  'phone-br': { s: 'low', c: 0.7, d: 'Brazilian mobile and landline formats' },
  'pix': { s: 'high', c: 0.8, d: 'Brazilian PIX payment keys' },
  'iban': { s: 'high', c: 0.9, d: 'International Bank Account Numbers validated via check digits' },
  'eu-vat': { s: 'low', c: 0.6, d: 'European Value Added Tax numbers' },
  'aws-access-key': { s: 'critical', c: 0.9, d: 'Matches standard AWS Access Key IDs' },
  'aws-secret-key': { s: 'critical', c: 0.8, d: 'Matches high-entropy 40-character base64 AWS Secret Key' },
  'connection-string': { s: 'high', c: 0.8, d: 'Connection URIs containing plaintext passwords' },
  'credit-card': { s: 'high', c: 0.9, d: 'Credit Card numbers validated with the Luhn algorithm' },
  'github-pat': { s: 'critical', c: 0.95, d: 'Matches GitHub Personal Access Tokens' },
  'jwt': { s: 'high', c: 0.8, d: 'Standard JSON Web Tokens checking Shannon Entropy' },
  'ipv4': { s: 'low', c: 0.8, d: 'Standard IPv4 address formats' },
  'email': { s: 'low', c: 0.9, d: 'Standard email address format' },
  'private-key': { s: 'critical', c: 0.99, d: 'PEM private key blocks' },
  'stripe-secret': { s: 'critical', c: 0.95, d: 'Stripe secret and restricted keys' },
  'openai-api-key': { s: 'critical', c: 0.95, d: 'OpenAI API keys' },
  'anthropic-api-key': { s: 'critical', c: 0.95, d: 'Anthropic API keys' },
  'slack-token': { s: 'critical', c: 0.95, d: 'Slack API tokens' },
  'npm-token': { s: 'critical', c: 0.95, d: 'NPM access tokens' },
  'sendgrid-key': { s: 'critical', c: 0.95, d: 'SendGrid API keys' },
  'gcp-api-key': { s: 'high', c: 0.9, d: 'Google Cloud Platform API keys' }
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
