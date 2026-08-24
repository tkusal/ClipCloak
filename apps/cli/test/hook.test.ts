import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { MockInstance } from 'vitest';
import fs from 'node:fs';
import { runClaudeCodeHook } from '../src/commands/hook.js';

vi.mock('node:fs');

describe('CLI: Claude Code Hook', () => {
  let exitSpy: MockInstance;
  let logSpy: MockInstance;
  let mockFsExistsSync: MockInstance;
  let mockFsReadFileSync: MockInstance;
  let mockFsStatSync: MockInstance;

  beforeEach(() => {
    vi.resetAllMocks();
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockFsExistsSync = vi.mocked(fs.existsSync);
    mockFsReadFileSync = vi.mocked(fs.readFileSync);
    mockFsStatSync = vi.mocked(fs.statSync);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setupMock = (options: {
    stdin: string;
    fileExists?: boolean;
    fileContent?: string;
    fileSize?: number;
    isBinary?: boolean;
    configContent?: string;
  }) => {
    mockFsReadFileSync.mockImplementation((pathOrFd: number | string) => {
      if (pathOrFd === 0) return options.stdin;
      if (pathOrFd.toString().includes('claude-clipcloak.config.json')) {
        return options.configContent || '{}';
      }
      if (pathOrFd.toString().includes('.clipcloak')) {
        return options.configContent || '{}';
      }
      return options.fileContent || '';
    });

    mockFsExistsSync.mockImplementation((path: string) => {
      if (path.includes('claude-clipcloak.config.json') || path.includes('.clipcloak')) {
        return !!options.configContent;
      }
      if (path.includes('test.txt') || path.includes('secret.txt') || path.includes('binary.bin') || path.includes('missing.txt') || path.includes('large.txt')) {
        return options.fileExists !== false;
      }
      return false;
    });

    mockFsStatSync.mockImplementation(() => {
      return {
        isFile: () => true,
        size: options.fileSize || 1024,
      } as unknown as fs.Stats;
    });

    vi.spyOn(fs, 'openSync').mockImplementation(() => 999);
    vi.spyOn(fs, 'readSync').mockImplementation((_fd, buffer: Buffer | Uint8Array, _offset, _length, _position) => {
      if (options.isBinary) {
        buffer[0] = 0;
      } else {
        buffer[0] = 32;
      }
      return 1;
    });
    vi.spyOn(fs, 'closeSync').mockImplementation(() => {});
  };

  const getOutputDecision = () => {
    if (logSpy.mock.calls.length === 0) return null;
    return JSON.parse(logSpy.mock.calls[0][0]);
  };

  it('should allow read if no secret is found', async () => {
    setupMock({
      stdin: JSON.stringify({ toolName: 'Read', toolArgs: { filePath: 'test.txt' } }),
      fileContent: 'This is a normal file without secrets.',
    });
    await runClaudeCodeHook();
    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(getOutputDecision().hookSpecificOutput.permissionDecision).toBe('allow');
  });

  it('should deny read if secret is found', async () => {
    setupMock({
      stdin: JSON.stringify({ toolName: 'Read', toolArgs: { filePath: 'test.txt' } }),
      fileContent: 'My AWS key is AKIA1234567890ABCDEF',
      configContent: JSON.stringify({ blockMinSeverity: 'medium', minSeverity: 'medium' }),
    });
    await runClaudeCodeHook();
    expect(exitSpy).toHaveBeenCalledWith(0);
    const decision = getOutputDecision();
    expect(decision.hookSpecificOutput.permissionDecision).toBe('deny');
    expect(decision.hookSpecificOutput.permissionDecisionReason).toContain('Note: Claude Code @file references bypass PreToolUse hooks');
  });

  it('should allow if file does not exist', async () => {
    setupMock({
      stdin: JSON.stringify({ toolName: 'Read', toolArgs: { filePath: 'missing.txt' } }),
      fileExists: false,
    });
    await runClaudeCodeHook();
    expect(getOutputDecision().hookSpecificOutput.permissionDecision).toBe('allow');
  });

  it('should deny large file in strict mode', async () => {
    setupMock({
      stdin: JSON.stringify({ toolName: 'Read', toolArgs: { filePath: 'large.txt' } }),
      fileSize: 6 * 1024 * 1024,
      configContent: JSON.stringify({ mode: 'strict' }),
    });
    await runClaudeCodeHook();
    expect(getOutputDecision().hookSpecificOutput.permissionDecision).toBe('deny');
    expect(getOutputDecision().hookSpecificOutput.permissionDecisionReason).toContain('too large');
  });

  it('should deny binary file in strict mode', async () => {
    setupMock({
      stdin: JSON.stringify({ toolName: 'Read', toolArgs: { filePath: 'binary.bin' } }),
      isBinary: true,
      configContent: JSON.stringify({ mode: 'strict' }),
    });
    await runClaudeCodeHook();
    expect(getOutputDecision().hookSpecificOutput.permissionDecision).toBe('deny');
    expect(getOutputDecision().hookSpecificOutput.permissionDecisionReason).toContain('binary file');
  });

  it('should fallback to allow on invalid JSON stdin in standard mode', async () => {
    setupMock({ stdin: 'invalid json' });
    await runClaudeCodeHook();
    expect(getOutputDecision().hookSpecificOutput.permissionDecision).toBe('allow');
  });

  it('should deny on invalid JSON stdin in strict mode', async () => {
    setupMock({ stdin: 'invalid json', configContent: JSON.stringify({ mode: 'strict' }) });
    await runClaudeCodeHook();
    expect(getOutputDecision().hookSpecificOutput.permissionDecision).toBe('deny');
  });

  it('should extract path from Bash cat', async () => {
    setupMock({
      stdin: JSON.stringify({ toolName: 'Bash', toolArgs: { command: 'cat src/secret.txt' } }),
      fileContent: 'AKIA1234567890ABCDEF',
      configContent: JSON.stringify({ blockMinSeverity: 'medium', minSeverity: 'medium' }),
    });
    await runClaudeCodeHook();
    expect(getOutputDecision().hookSpecificOutput.permissionDecision).toBe('deny');
  });

  it('should extract path from Bash cat with quotes', async () => {
    setupMock({
      stdin: JSON.stringify({ toolName: 'Bash', toolArgs: { command: 'cat "src/my secret.txt"' } }),
      fileContent: 'AKIA1234567890ABCDEF',
      configContent: JSON.stringify({ blockMinSeverity: 'medium', minSeverity: 'medium' }),
    });
    await runClaudeCodeHook();
    expect(getOutputDecision().hookSpecificOutput.permissionDecision).toBe('deny');
  });

  it('should allow unrecognized Bash command in standard mode', async () => {
    setupMock({
      stdin: JSON.stringify({ toolName: 'Bash', toolArgs: { command: 'sed -i "s/a/b/" file.txt' } }),
    });
    await runClaudeCodeHook();
    expect(getOutputDecision().hookSpecificOutput.permissionDecision).toBe('allow');
  });
  it('should deny unrecognized Bash command in strict mode', async () => {
    setupMock({
      stdin: JSON.stringify({ toolName: 'Bash', toolArgs: { command: 'sed -i "s/a/b/" file.txt' } }),
      configContent: JSON.stringify({ mode: 'strict' }),
    });
    await runClaudeCodeHook();
    expect(getOutputDecision().hookSpecificOutput.permissionDecision).toBe('deny');
  });

  it('should deny missing file in strict mode', async () => {
    setupMock({
      stdin: JSON.stringify({ toolName: 'Read', toolArgs: { filePath: 'missing.txt' } }),
      fileExists: false,
      configContent: JSON.stringify({ mode: 'strict' }),
    });
    await runClaudeCodeHook();
    expect(getOutputDecision().hookSpecificOutput.permissionDecision).toBe('deny');
  });

  it('should extract path from PowerShell Get-Content', async () => {
    setupMock({
      stdin: JSON.stringify({ toolName: 'PowerShell', toolArgs: { command: 'Get-Content src/secret.txt' } }),
      fileContent: 'AKIA1234567890ABCDEF',
      configContent: JSON.stringify({ blockMinSeverity: 'medium', minSeverity: 'medium' }),
    });
    await runClaudeCodeHook();
    expect(getOutputDecision().hookSpecificOutput.permissionDecision).toBe('deny');
  });

  it('should handle Grep structured input correctly', async () => {
    setupMock({
      stdin: JSON.stringify({ toolName: 'Grep', toolArgs: { pattern: 'password', path: 'src/secret.txt' } }),
      fileContent: 'AKIA1234567890ABCDEF',
      configContent: JSON.stringify({ blockMinSeverity: 'medium', minSeverity: 'medium' }),
    });
    await runClaudeCodeHook();
    expect(getOutputDecision().hookSpecificOutput.permissionDecision).toBe('deny');
  });

  it('should deny Grep if path is missing in strict mode', async () => {
    setupMock({
      stdin: JSON.stringify({ toolName: 'Grep', toolArgs: { pattern: 'password' } }),
      configContent: JSON.stringify({ mode: 'strict' }),
    });
    await runClaudeCodeHook();
    expect(getOutputDecision().hookSpecificOutput.permissionDecision).toBe('deny');
  });

  it('should deny malformed config in strict mode', async () => {
    setupMock({
      stdin: JSON.stringify({ toolName: 'Read', toolArgs: { filePath: 'test.txt' } }),
      configContent: '{ invalid json ',
    });
    await runClaudeCodeHook();
    expect(getOutputDecision().hookSpecificOutput.permissionDecision).toBe('deny');
  });

  it('should handle pipes in Bash correctly', async () => {
    setupMock({
      stdin: JSON.stringify({ toolName: 'Bash', toolArgs: { command: 'cat src/secret.txt | grep something' } }),
      fileContent: 'AKIA1234567890ABCDEF',
      configContent: JSON.stringify({ blockMinSeverity: 'medium', minSeverity: 'medium' }),
    });
    await runClaudeCodeHook();
    expect(getOutputDecision().hookSpecificOutput.permissionDecision).toBe('deny');
  });
});
