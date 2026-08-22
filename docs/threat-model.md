# ClipCloak Threat Model

This document outlines the security boundaries, assets, threats, and mitigations for ClipCloak.

## Assets to Protect

1. **Secrets / Credentials:** Developer secrets like API keys, database passwords, private keys, and authorization tokens.
2. **Personally Identifiable Information (PII):** Regional user identifiers, contact information, financial numbers (e.g. CPF, CNPJ, IBAN, VAT, credit cards).
3. **Local Clipboard:** The current clipboard content on the user's OS.
4. **Local Source Files:** Files processed during CLI scans or Claude Code agent execution.

## Threat Boundary

The security boundary of ClipCloak is the **local development machine**.

```
                           +----------------------------+
                           |  Local Development Machine  |
                           |                            |
  [Local Clipboard]   ---> |    [ClipCloak Desktop]     |
                           |            |               |
  [Git Repository]    ---> |    [ClipCloak CLI]         |
                           |            |               |
  [Claude Code / AI]  ---> |    [ClipCloak Hooks]       |
                           |                            |
                           +----------------------------+
                                         |
                                         | (Blocks outbound secrets)
                                         v
                                  [Untrusted AI APIs]
```

## Threats and Mitigations

### 1. Clipboard Leakage (Accidental Paste into AI Chats)
- **Threat:** User copies an API key or SSH private key to use elsewhere, and later accidentally pastes it into a web prompt for ChatGPT, Claude, etc.
- **Mitigation:** ClipCloak Desktop polls the clipboard, fingerprints content via non-reversible SHA-256 (leaving no plaintext secrets in memory), and alerts/redacts if a secret matches active detectors.

### 2. AI Agents Reading Local Credentials
- **Threat:** Autonomous coding agents (like Claude Code) invoke file-reading tools (e.g. `Read`, `fs_read_file`) on files containing credentials (like `.env`, config files).
- **Mitigation:** ClipCloak integrates as a `PreToolUse` hook script, intercepting read requests, parsing filenames, scanning file buffers locally, and returning blocking OIDC `deny` instructions.

### 3. Untrusted Git Commits containing Secrets
- **Threat:** Developer commits a secret to their local repository history, which is then pushed to a public remote.
- **Mitigation:** ClipCloak installs a `pre-commit` Git hook, running local `--staged` index scans to block commits containing sensitive strings.

## Out-of-Scope / Non-Mitigated Threats
- **Operating System Compromise:** Malware with keylogger/clipboard-reader privileges can read clipboard values before ClipCloak.
- **Intentional Bypasses:** Developers explicitly bypassing pre-commit checks (`--no-verify`) or configuring AI agents to ignore hooks.
