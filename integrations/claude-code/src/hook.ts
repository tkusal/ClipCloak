// This package is deprecated and its logic has been unified into @clipcloak/cli.
// Please use `npx @clipcloak/cli install claude-code` which utilizes the core CLI hook engine.
export function handlePreToolUse(): never {
  throw new Error("This implementation has been unified into @clipcloak/cli. Please use the CLI's `clipcloak hook claude-code` instead.");
}
