import fs from 'node:fs';
import path from 'node:path';

export async function runInstall(target: string) {
  const cwd = process.cwd();

  if (target === 'git-hook') {
    const gitDir = path.join(cwd, '.git');
    if (!fs.existsSync(gitDir)) {
      console.error('[ERROR] Not a git repository (or no .git directory found).');
      process.exit(1);
    }
    
    const hooksDir = path.join(gitDir, 'hooks');
    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }
    
    const preCommitPath = path.join(hooksDir, 'pre-commit');
    const hookScript = `#!/bin/sh
# ClipCloak pre-commit hook
echo "🛡️  Running ClipCloak scan on staged files..."
npx @clipcloak/cli scan --staged
if [ $? -ne 0 ]; then
  echo "❌ ClipCloak found sensitive data. Commit aborted."
  echo "To bypass (not recommended), use git commit --no-verify"
  exit 1
fi
exit 0
`;
    
    try {
      fs.writeFileSync(preCommitPath, hookScript, { mode: 0o755 });
      console.log('✅ Installed git pre-commit hook successfully.');
      console.log(`Hook location: ${preCommitPath}`);
    } catch (err: unknown) {
      console.error('[ERROR] Failed to write git hook:', err instanceof Error ? err.message : String(err));
      process.exit(1);
    }
  } else if (target === 'claude-code') {
    const configPath = path.join(cwd, 'claude-clipcloak.config.json');
    const config = {
      mode: 'standard', // or 'strict'
      description: "ClipCloak hook configuration for Claude Code"
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log('✅ Installed Claude Code integration.');
    console.log(`Config file created at: ${configPath}`);
    console.log('In `strict` mode, any scanner crash or unrecognized tool blocks access.');
    console.log('In `standard` mode, we fail-open to preserve agent flow.');
    process.exit(0);
  } else {
    console.error(`[ERROR] Unknown install target: ${target}`);
    console.log('Available targets: git-hook, claude-code');
    process.exit(1);
  }
}
