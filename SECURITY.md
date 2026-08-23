# Security Policy

## Supported Versions

We currently provide security updates to the following versions of ClipCloak:

| Version | Supported |
| ------- | --------- |
| v1.x    | Yes       |
| < v1.0  | No        |

## Reporting a Vulnerability

If you discover a security vulnerability in ClipCloak, please **do not open a public issue**. We strongly encourage responsible disclosure.

Please report the vulnerability using **GitHub Private Vulnerability Reporting** directly in this repository (under the "Security" tab -> "Advisories" -> "Report a vulnerability"). 
If you prefer email, you can send it to `security@clipcloak.dev` (or the repository administrator).

### What to Include
When reporting an issue, please provide:
1. Steps to reproduce the issue.
2. A proof-of-concept (PoC) if applicable.
3. Potential impact (e.g., bypass of detection, denial of service via ReDoS, memory disclosure).

### Process
- **Acknowledgement**: We will acknowledge receipt of your vulnerability report within 48 hours.
- **Triage**: We will determine if the report constitutes a valid vulnerability within 5 business days.
- **Coordinated Disclosure**: If valid, we will work with you to coordinate a release fixing the issue before any public disclosure is made.

### Safe Harbor
We will not initiate legal action or law enforcement investigation against anyone who reports a vulnerability in good faith, respects our disclosure process, and does not exploit the vulnerability beyond what is necessary to prove its existence.

### Out of Scope (Not Vulnerabilities)
The following are considered out of scope and do not constitute security vulnerabilities in ClipCloak:
- **False Positives**: The scanner flagging a non-sensitive string (e.g., a dummy value) is an annoyance, not a vulnerability. Please report these as regular bug issues.
- **Bypasses in unsupported contexts**: e.g., an AI agent reading secrets using complex shell commands not parsable by our heuristics in Standard mode, or using `@file` references in Claude Code which deliberately bypass PreToolUse hooks.
- **Memory scraping**: ClipCloak runs in the user space; any attacker with sufficient privileges to dump the memory of the Node.js or Electron process can extract secrets. Defending against active OS-level malware is out of scope.
