<div align="center">
  <h1>🛡️ ClipCloak</h1>
  <p><strong>A robust shield to help prevent secret leaks for developers and AI agents.</strong></p>

  <p>
    <a href="https://github.com/tkusal/ClipCloak/actions"><img src="https://img.shields.io/github/actions/workflow/status/tkusal/ClipCloak/ci.yml?branch=main" alt="CI Status"></a>
    <a href="https://www.npmjs.com/package/@clipcloak/cli"><img src="https://img.shields.io/npm/v/@clipcloak/cli.svg" alt="NPM Version"></a>
    <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  </p>
  <p>
    <em>Leia isso em <a href="README.pt-br.md">Português (Brasil)</a></em>
  </p>
</div>

---

ClipCloak is an ultra-fast, offline, cross-platform ecosystem designed to help detect and block sensitive data (API keys, passwords, credentials, PII) *before* it leaves your machine. 

Whether you're pushing code, pasting to untrusted apps, or letting an autonomous AI agent roam your filesystem, ClipCloak helps reduce the risk of exposing your secrets to the outside world.

## 🌟 Ecosystem

ClipCloak is built on a highly modular engine and provides tools for every developer workflow:

- **CLI (`@clipcloak/cli`)** *(Stable)*: Scan repositories, use it in CI/CD, or hook it to Git.
- **Git Hook** *(Stable)*: Prevent commits containing secrets (`clipcloak install git-hook`).
- **AI Integration** *(Preview)*: Seamlessly hooks into Claude Code's PreToolUse commands to block file reading when secrets are detected, helping ensure you don't leak production keys to AI vendors.
- **VS Code Extension** *(Preview)*: Highlights exposed secrets directly in your IDE as you type.
- **Desktop Daemon** *(Alpha)*: A background Electron app that monitors your operating system's clipboard locally, warning you and providing a "Safe Paste" shortcut (`Ctrl+Shift+V`) for instant redaction.

## 🚀 Quick Start

### 1. Command Line Interface (CLI)
Install globally or run via `npx`:

```bash
# Scan a specific file or folder
npx @clipcloak/cli scan ./src

# Scan only staged files in git
npx @clipcloak/cli scan --staged

# Install the pre-commit hook in your repo
npx @clipcloak/cli install git-hook
```

### 2. Desktop Clipboard Protection
1. Clone the repository and build the monorepo (`pnpm install && pnpm build`).
2. Run the desktop daemon: `cd apps/desktop && pnpm start`.
3. Copy a secret (e.g., a dummy GitHub PAT).
4. See the native OS notification! Press `Ctrl+Shift+V` to paste the redacted version anywhere.

### 3. Claude Code AI Protection
Protect your filesystem when using Claude Code:
```bash
npx @clipcloak/cli install claude-code
```
*Adds a local protection layer that can block supported file-read operations when sensitive data is detected.*

**Note:** ClipCloak reduces exposure risk; it is not a sandbox or a guarantee against secret leakage.

## 🧠 The Engine

ClipCloak uses a highly optimized Node.js core (`@clipcloak/core`). It avoids the dreaded "false positive fatigue" associated with simple RegEx scanners by using:
- **Shannon Entropy Analysis**: Distinguishes true randomly-generated API keys from dummy strings like `EXAMPLE_KEY` or `AKIAIOSFODNN7EXAMPLE`.
- **Modular Packs**: Enable only the detectors you need:
  - `@clipcloak/pack-generic`: AWS, GitHub, Stripe, JWTs, IPs, Emails, Credit Cards.
  - `@clipcloak/pack-br`: Brazilian PII (CPF, CNPJ, Pix).
  - `@clipcloak/pack-eu`: European PII (IBAN, VAT).

## ⚙️ Configuration

Create a `.clipcloak.json` at the root of your project:

```json
{
  "minSeverity": "medium",
  "minConfidence": 0.8,
  "packs": ["generic", "br"],
  "ignore": ["tests/fixtures/**", "*.md"]
}
```

## 🤝 Contributing

We welcome contributions from everyone! See our [Contributing Guide](CONTRIBUTING.md) to learn how to set up the monorepo, run tests, and add new detectors without leaking real secrets.

Please note that we have a [Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project, you agree to abide by its terms.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
