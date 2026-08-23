# ClipCloak Detector Catalog

ClipCloak groups its detectors into packages called **Packs**. These are loaded based on configuration or command line options.

## 📦 Pack: `generic`

The generic pack targets widely used API keys, infrastructure credentials, and common PII.

| Detector ID | Category | Description |
| ----------- | -------- | ----------- |
| `aws-access-key` | `credential` | aws-access-key |
| `aws-secret-key` | `credential` | aws-secret-key |
| `api-tokens` | `credential` | api-tokens |
| `jwt` | `credential` | jwt |
| `private-key` | `credential` | private-key |
| `connection-string` | `credential` | connection-string |
| `email` | `pii` | email |
| `ipv4` | `pii` | ipv4 |
| `credit-card` | `financial` | credit-card |
| `github-token` | `credential` | github-token |
| `stripe-key` | `credential` | stripe-key |

---

## 📦 Pack: `br`

Designed to detect Brazilian regional identifier formats with deterministic verifications.

| Detector ID | Category | Description |
| ----------- | -------- | ----------- |
| `cpf-cnpj` | `pii` | cpf-cnpj |
| `pix-key` | `financial` | pix-key |
| `phone-br` | `pii` | phone-br |

---

## 📦 Pack: `eu`

Designed to detect European regional identifier formats.

| Detector ID | Category | Description |
| ----------- | -------- | ----------- |
| `iban` | `financial` | iban |
| `eu-vat` | `pii` | eu-vat |

---

