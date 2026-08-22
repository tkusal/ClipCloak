import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

function getGitHooksDir(cwd: string): string | null {
  try {
    const relativePath = execSync('git rev-parse --git-path hooks', {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    return path.resolve(cwd, relativePath);
  } catch {
    return null;
  }
}

function installClaudeHookInSettings(cwd: string) {
  const claudeDir = path.join(cwd, '.claude');
  if (!fs.existsSync(claudeDir)) {
    fs.mkdirSync(claudeDir, { recursive: true });
  }

  const settingsPath = path.join(claudeDir, 'settings.json');
  let settings: any = {};

  if (fs.existsSync(settingsPath)) {
    try {
      const content = fs.readFileSync(settingsPath, 'utf8');
      settings = JSON.parse(content);
    } catch (err) {
      console.warn(`[WARN] Failed to parse existing .claude/settings.json. Overwriting.`, err);
    }
  }

  if (!settings.hooks) {
    settings.hooks = {};
  }
  if (!settings.hooks.PreToolUse) {
    settings.hooks.PreToolUse = [];
  }

  const newHookEntry = {
    matcher: 'Read|ViewFile|View|fs_read_file|readFile|cat',
    hooks: [
      {
        type: 'command',
        command: 'clipcloak hook claude-code',
      },
    ],
  };

  // Check if our command is already registered
  const exists = settings.hooks.PreToolUse.some(
    (entry: any) =>
      entry.hooks && entry.hooks.some((h: any) => h.command === 'clipcloak hook claude-code'),
  );

  if (!exists) {
    settings.hooks.PreToolUse.push(newHookEntry);
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
  console.log(`✅ Registered ClipCloak tool hook in ${settingsPath}`);
}

export async function runInstall(target: string) {
  const cwd = process.cwd();

  if (target === 'git-hook') {
    const hooksDir = getGitHooksDir(cwd);
    if (!hooksDir) {
      console.error('❌ [ERROR] Not a git repository (or git is not installed in PATH).');
      process.exit(1);
    }

    if (!fs.existsSync(hooksDir)) {
      fs.mkdirSync(hooksDir, { recursive: true });
    }

    const preCommitPath = path.join(hooksDir, 'pre-commit');
    const hookBody = `
# --- ClipCloak Git Hook ---
if [ -f "./node_modules/.bin/clipcloak" ]; then
  ./node_modules/.bin/clipcloak scan --staged
elif command -v clipcloak >/dev/null 2>&1; then
  clipcloak scan --staged
else
  echo "⚠️ ClipCloak executable not found in ./node_modules/.bin or PATH. Skipping pre-commit check."
  exit 0
fi

if [ $? -ne 0 ]; then
  echo "❌ ClipCloak found sensitive data. Commit aborted."
  echo "To bypass (not recommended), use git commit --no-verify"
  exit 1
fi
# --- End ClipCloak ---
`;

    if (fs.existsSync(preCommitPath)) {
      const existingContent = fs.readFileSync(preCommitPath, 'utf8');
      if (existingContent.includes('clipcloak') || existingContent.includes('ClipCloak')) {
        console.log('✅ ClipCloak pre-commit hook is already installed in pre-commit.');
        process.exit(0);
      }

      try {
        fs.appendFileSync(preCommitPath, `\n${hookBody}`);
        console.log('✅ Appended ClipCloak scan to existing git pre-commit hook.');
        console.log(`Hook location: ${preCommitPath}`);
        process.exit(0);
      } catch (err: any) {
        console.error('❌ [ERROR] Failed to update git hook:', err.message);
        process.exit(1);
      }
    } else {
      const hookScript = `#!/bin/sh${hookBody}`;
      try {
        fs.writeFileSync(preCommitPath, hookScript, { mode: 0o755 });
        console.log('✅ Installed git pre-commit hook successfully.');
        console.log(`Hook location: ${preCommitPath}`);
        process.exit(0);
      } catch (err: any) {
        console.error('❌ [ERROR] Failed to write git hook:', err.message);
        process.exit(1);
      }
    }
  } else if (target === 'claude-code') {
    const configPath = path.join(cwd, 'claude-clipcloak.config.json');
    const config = {
      mode: 'standard', // or 'strict'
      description: 'ClipCloak hook configuration for Claude Code',
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`✅ Config file created at: ${configPath}`);
    console.log('   In `strict` mode, any scanner crash or unrecognized tool blocks access.');
    console.log('   In `standard` mode, we fail-open to preserve agent flow.');

    try {
      installClaudeHookInSettings(cwd);
      console.log('✅ Installed Claude Code integration successfully.');
      process.exit(0);
    } catch (err: any) {
      console.error('❌ [ERROR] Failed to update .claude/settings.json:', err.message);
      process.exit(1);
    }
  } else {
    console.error(`❌ [ERROR] Unknown install target: ${target}`);
    console.log('Available targets: git-hook, claude-code');
    process.exit(1);
  }
}
