import { describe, expect, it } from 'vitest';
import { handlePreToolUse } from '../src/hook.js';

describe('Claude Code Hook Deprecation', () => {
  it('should throw deprecation error', () => {
    expect(() => handlePreToolUse()).toThrow(/unified into @clipcloak\/cli/);
  });
});
