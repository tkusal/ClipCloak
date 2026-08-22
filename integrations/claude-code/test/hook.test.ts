import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'node:fs';
import { handlePreToolUse } from '../src/hook.js';

vi.mock('node:fs');

describe('Claude Code Hook: handlePreToolUse', () => {
  const mockCwd = '/mock/cwd';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should ALLOW if tool is not a read tool', () => {
    const result = handlePreToolUse({ toolName: 'bash', toolArgs: { command: 'ls' } }, mockCwd);
    expect(result.status).toBe('ALLOW');
  });

  it('should ALLOW if file does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const result = handlePreToolUse({ toolName: 'readFile', toolArgs: { path: 'secret.txt' } }, mockCwd);
    expect(result.status).toBe('ALLOW');
  });

  it('should ALLOW if file is too large', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ size: 10 * 1024 * 1024 } as unknown as fs.Stats); // 10MB
    const result = handlePreToolUse({ toolName: 'readFile', toolArgs: { path: 'big.txt' } }, mockCwd);
    expect(result.status).toBe('ALLOW');
  });

  it('should BLOCK if file contains high severity secret', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ size: 1024 } as unknown as fs.Stats);
    // Simulate an AWS key which is high/critical severity (using a generic regex match if possible, or JWT)
    vi.mocked(fs.readFileSync).mockReturnValue('Here is my key: AKIAYQ3Q4ZQ4O5Z6V7W8');
    
    const result = handlePreToolUse({ toolName: 'readFile', toolArgs: { path: '.env' } }, mockCwd);
    expect(result.status).toBe('BLOCK');
    expect(result.message).toContain('ClipCloak blocked this operation');
  });

  it('should ALLOW if no secret is found', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ size: 1024 } as unknown as fs.Stats);
    vi.mocked(fs.readFileSync).mockReturnValue('Just normal text here.');
    
    const result = handlePreToolUse({ toolName: 'readFile', toolArgs: { path: 'readme.md' } }, mockCwd);
    expect(result.status).toBe('ALLOW');
  });

  it('should ALLOW if an exception is thrown (Fail Safe)', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockImplementation(() => { throw new Error('Permission denied'); });
    
    const result = handlePreToolUse({ toolName: 'readFile', toolArgs: { path: 'root.txt' } }, mockCwd);
    expect(result.status).toBe('ALLOW');
  });
});
