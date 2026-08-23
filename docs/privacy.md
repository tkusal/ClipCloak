# ClipCloak Privacy Principles

ClipCloak was built from the ground up to guarantee developers that their source code, credentials, and clipboard values never leave their machine.

## Invariant Privacy Policies

### 1. 100% Local-First
- ClipCloak runs entirely on your local development machine.
- There are no outgoing network calls (`fetch`, `axios`, `http`, WebSockets).
- Resolving/updating regional packs requires compiling locally. No downloads are triggered during scans.

### 2. Zero Telemetry & Tracking
- ClipCloak collects no telemetry, error reports, usage tracking, or analytics.
- No central server exists to report statistics or errors.
- What happens on your machine stays on your machine.

### 3. No Intentional Plaintext Persistence
- Secrets copied to the clipboard are temporarily fingerprinted using SHA-256 to avoid redundant processing.
- Plaintext secrets are never intentionally persisted to files, registry, databases, telemetry, or logs.
- During scanning, sensitive values reside in the Node.js/V8 garbage-collected heap memory and are not explicitly zeroed out due to JavaScript's memory management model.

## Fully Auditable
Because the codebase is open-source and modular, you can easily inspect that there are no third-party network requests:
- `package.json` contains no network-related devDependencies.
- Building the monorepo produces clean local bundles.
- Workflows are hardened using immutable SHA pins to prevent supply chain modifications.
