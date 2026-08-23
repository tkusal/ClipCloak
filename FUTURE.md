# 🚀 ClipCloak: Future Ideas & Backlog

This document outlines potential features, improvements, and stretch goals for the next major and minor versions of the ClipCloak ecosystem (v1.1.0 and beyond).

## 1. Engine & Detectors (Core)
- **More Cloud Providers**: Native detectors for GCP (Google Cloud) and Azure credentials.
- **SaaS Tokens**: Dedicated detectors for Slack, Discord, NPM, and Sendgrid tokens.
- **Database URIs**: Robust detection for Postgres, MongoDB, and Redis connection strings containing raw passwords.
- **Context-Aware Scanning**: Use AST (Abstract Syntax Tree) parsing to know if a string is inside a comment, a variable named `mock_secret`, or actual code, further reducing false positives.

## 2. Artificial Intelligence Integrations
- **Cursor & Copilot Native Hooks**: Provide native extensions or configurations to directly intercept Cursor/Copilot file-reading contexts.
- **Devin / Autonomous Agents**: Create an environment wrapper (e.g., a FUSE filesystem or `LD_PRELOAD` library) that redacts secrets at the OS level so *any* AI terminal agent is automatically blocked from reading `.env` files.

## 3. Developer Experience (IDE & Ecosystem)
- **JetBrains Plugin**: Expand beyond VS Code by building a plugin for IntelliJ, WebStorm, and PyCharm.
- **Browser Extension**: A Chrome/Firefox extension that injects ClipCloak into the browser's paste event, preventing users from accidentally pasting secrets into ChatGPT, Claude web, or public forums.

## 4. Performance & Architecture
- **Rust Rewrite (Spike)**: If the Node.js core hits performance ceilings on massive monorepos, explore rewriting the `@clipcloak/core` pattern-matching engine in Rust (via NAPI-RS or WebAssembly).
- **Incremental Scanning**: Cache hashes of scanned files (similar to ESLint/Prettier caches) to make subsequent CLI runs instantaneous.

## 5. Enterprise & Teams
- **Remote Config Sync**: Allow teams to fetch a centralized `.clipcloak.json` configuration from a remote URL or private repository, ensuring everyone uses the same severity and pack rules.
- **Custom Redaction Templates**: Let users define exactly how redacted text should look (e.g., `[SECRET_HIDDEN]` instead of `********`).

---

*Got an idea? Feel free to open a feature request in our GitHub Issues!*
