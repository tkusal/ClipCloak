# ClipCloak Detector Catalog

ClipCloak groups its detectors into packages called **Packs**. These are loaded based on configuration or command line options.

## 📦 Pack: `generic` (Default)

The generic pack targets widely used API keys, infrastructure credentials, and common PII.

| Detector ID | Category | Severity | Confidence | Description / Formats |
| ----------- | -------- | -------- | ---------- | --------------------- |
| `aws-access-key` | `credential` | `critical` | `0.9` / `0.7` | Matches standard AWS Access Key IDs (`AKIA` / `ASIA`). Lowers confidence to `0.7` on dummy/mock strings. |
| `openai-api-key` | `credential` | `critical` | `0.95` / `0.75` | Matches standard OpenAI keys (`sk-` / `sk-proj-`). Lowers confidence to `0.75` on dummy/mock strings. |
| `anthropic-api-key` | `credential` | `critical` | `0.95` / `0.75` | Matches Anthropic API keys (`sk-ant-`). Lowers confidence to `0.75` on dummy/mock strings. |
| `github-pat` | `credential` | `critical` | `0.95` / `0.75` | Matches GitHub Personal Access Tokens (`ghp_`, `gho_`, etc.). |
| `connection-string` | `credential` | `high` | `0.8` | Connection URIs containing plaintext passwords (e.g. `postgres://user:pass@host`). |
| `jwt` | `credential` | `high` | `0.8` | Standard JSON Web Tokens (`Header.Payload.Signature`) checking Shannon Entropy of signature. |
| `private-key` | `credential` | `critical` | `0.99` | PEM private key blocks (e.g. `RSA`, `DSA`, `EC`, `OPENSSH`, `ENCRYPTED`). |
| `credit-card` | `financial` | `high` | `0.9` | Credit Card numbers validated with the Luhn algorithm. |
| `email` | `pii` | `low` | `0.9` | Standard email address format. |
| `ipv4` | `pii` | `low` | `0.8` | Standard IPv4 address formats, excluding loopbacks (`127.0.0.1`, `0.0.0.0`). |

---

## 📦 Pack: `br` (Brazilian PII)

Designed to detect Brazilian regional identifier formats with deterministic verifications.

| Detector ID | Category | Severity | Confidence | Description / Formats |
| ----------- | -------- | -------- | ---------- | --------------------- |
| `cpf` | `pii` | `medium` | `0.95` | Brazilian CPF validated mathematically with check digit logic. |
| `cnpj` | `pii` | `medium` | `0.95` | Brazilian CNPJ validated mathematically with check digit logic. |
| `pix` | `financial` | `high` | `0.8` | Brazilian PIX payment keys (emails, random keys, CPFs, CNPJs, phones). |
| `phone-br` | `pii` | `low` | `0.7` | Brazilian mobile and landline formats, excluding dummy sequential numbers. |

---

## 📦 Pack: `eu` (European Union PII)

Designed to detect European regional identifier formats.

| Detector ID | Category | Severity | Confidence | Description / Formats |
| ----------- | -------- | -------- | ---------- | --------------------- |
| `iban` | `financial` | `high` | `0.9` | International Bank Account Numbers validated via MOD 97 check digits. |
| `eu-vat` | `pii` | `low` | `0.6` | European Value Added Tax numbers validated per country alphanumeric limits. |
