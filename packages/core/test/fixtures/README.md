# Fixtures

This directory contains test fixtures used to validate the detection engine and the specific detector packs.

## Structure

- `true-positive/`: Files containing actual secrets that MUST be detected. Tests will fail if no secrets are found or if the confidence/severity doesn't match expected values.
- `true-negative/`: Files containing non-sensitive data (e.g., normal code, documentation, public examples) that MUST NOT trigger any detection. Tests will fail if any secret is reported.
- `false-positive/`: Edge cases that look like secrets (e.g., example tokens in docs, randomly generated hashes, UUIDs) but are actually safe. These tests ensure the engine is properly filtering out noise.
- `malformed/`: Files with broken encodings, huge lines, binary null bytes mixed with text, etc. Tests ensure the scanner does not crash or loop infinitely.
- `regression/`: Specific cases reported in issues/bugs to ensure they don't break again in the future.
