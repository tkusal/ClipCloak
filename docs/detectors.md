# ClipCloak Detector Catalog

ClipCloak groups its detectors into packages called **Packs**. These are loaded based on configuration or command line options.

## 📦 Pack: `generic`

The generic pack targets widely used API keys, infrastructure credentials, and common PII.

| Detector ID | Category | Severity | Confidence | Description |
| ----------- | -------- | -------- | ---------- | ----------- |
| `aws-access-key` | `credential` | `critical` | `0.9` | Matches standard AWS Access Key IDs |
| `aws-secret-key` | `credential` | `critical` | `0.8` | Matches high-entropy 40-character base64 AWS Secret Key |
| `api-tokens` | `credential` | `critical` | `0.95` | General high-entropy API tokens (Slack, NPM, Sendgrid, GCP) |
| `jwt` | `credential` | `high` | `0.8` | Standard JSON Web Tokens checking Shannon Entropy |
| `private-key` | `credential` | `critical` | `0.99` | PEM private key blocks |
| `connection-string` | `credential` | `high` | `0.8` | Connection URIs containing plaintext passwords |
| `email` | `pii` | `low` | `0.9` | Standard email address format |
| `ipv4` | `pii` | `low` | `0.8` | Standard IPv4 address formats |
| `credit-card` | `financial` | `high` | `0.9` | Credit Card numbers validated with the Luhn algorithm |
| `github-token` | `credential` | `critical` | `0.95` | Matches GitHub Personal Access Tokens |
| `stripe-key` | `credential` | `critical` | `0.95` | Stripe secret and restricted keys |

---

## 📦 Pack: `br`

Designed to detect Brazilian regional identifier formats with deterministic verifications.

| Detector ID | Category | Severity | Confidence | Description |
| ----------- | -------- | -------- | ---------- | ----------- |
| `cpf-cnpj` | `pii` | `medium` | `0.95` | Brazilian CPF and CNPJ validated mathematically |
| `pix-key` | `financial` | `high` | `0.8` | Brazilian PIX payment keys |
| `phone-br` | `pii` | `low` | `0.7` | Brazilian mobile and landline formats |

---

## 📦 Pack: `eu`

Designed to detect European regional identifier formats.

| Detector ID | Category | Severity | Confidence | Description |
| ----------- | -------- | -------- | ---------- | ----------- |
| `iban` | `financial` | `high` | `0.9` | International Bank Account Numbers validated via check digits |
| `eu-vat` | `pii` | `low` | `0.6` | European Value Added Tax numbers |

---

