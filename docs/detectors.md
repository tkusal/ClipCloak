# ClipCloak Detector Catalog

ClipCloak groups its detectors into packages called **Packs**. These are loaded based on configuration or command line options.

## 📦 Pack: `generic`

The generic pack targets widely used API keys, infrastructure credentials, and common PII.

| Detector ID | Emitted Finding IDs | Category | Severity | Confidence | Description |
| ----------- | ------------------- | -------- | -------- | ---------- | ----------- |
| `aws-access-key` | `aws-access-key` | `credential` | `critical` | `0.9` | Matches standard AWS Access Key IDs |
| `aws-secret-key` | `aws-secret-key` | `credential` | `critical` | `0.8` | Matches high-entropy 40-character base64 AWS Secret Key |
| `api-tokens` | `openai-api-key`<br>`anthropic-api-key`<br>`slack-token`<br>`npm-token`<br>`sendgrid-api-key`<br>`gcp-api-key` | `credential` | `critical` | `0.95` | General high-entropy API tokens (Slack, NPM, Sendgrid, GCP) |
| `jwt` | `jwt` | `credential` | `high` | `0.8` | Standard JSON Web Tokens checking Shannon Entropy |
| `private-key` | `private-key` | `credential` | `critical` | `0.99` | PEM private key blocks |
| `connection-string` | `connection-string` | `credential` | `high` | `0.8` | Connection URIs containing plaintext passwords |
| `email` | `email` | `pii` | `low` | `0.9` | Standard email address format |
| `ipv4` | `ipv4` | `pii` | `low` | `0.8` | Standard IPv4 address formats |
| `credit-card` | `credit-card` | `financial` | `high` | `0.9` | Credit Card numbers validated with the Luhn algorithm |
| `github-token` | `github-token` | `credential` | `critical` | `0.95` | Matches GitHub Personal Access Tokens |
| `stripe-key` | `stripe-key` | `credential` | `critical` | `0.95` | Stripe secret and restricted keys |

---

## 📦 Pack: `br`

Designed to detect Brazilian regional identifier formats with deterministic verifications.

| Detector ID | Emitted Finding IDs | Category | Severity | Confidence | Description |
| ----------- | ------------------- | -------- | -------- | ---------- | ----------- |
| `cpf-cnpj` | `cpf`<br>`cnpj` | `pii` | `medium` | `0.9` | Brazilian CPF and CNPJ validated mathematically |
| `pix-key` | `pix-evp`<br>`pix-contextual` | `financial` | `medium` | `0.3 - 0.9` | Brazilian PIX payment keys |
| `phone-br` | `phone-br` | `pii` | `low` | `0.7` | Brazilian mobile and landline formats |

---

## 📦 Pack: `eu`

Designed to detect European regional identifier formats.

| Detector ID | Emitted Finding IDs | Category | Severity | Confidence | Description |
| ----------- | ------------------- | -------- | -------- | ---------- | ----------- |
| `iban` | `iban` | `financial` | `medium` | `0.95` | International Bank Account Numbers validated via check digits |
| `eu-vat` | `eu-vat` | `pii` | `low` | `0.6` | European Value Added Tax numbers |

---

