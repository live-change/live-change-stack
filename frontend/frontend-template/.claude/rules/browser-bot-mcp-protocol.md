---
description: MCP protocol and tool usage constraints for automation browser-bot mcpServer
globs: automation/browser-bot/**/server/mcpServer/**/*.js, automation/docs/mcp*.md, automation/docs/tworzenie-botow.md
---

# browser-bot MCP protocol

## Scope

- Keep guidance MCP-only unless user explicitly asks for bot-runner workflows.
- Use implementation details from `automation/browser-bot/bot-server/server/mcpServer`.

## Protocol

- Methods: `initialize`, `tools/list`, `tools/call` only.
- Parse tool payload from `result.content[0].text`.

## Tool usage

- Prefer dedicated wrappers for HID/browser/navigation/screenshot actions.
- Keep `wait` only inside `executeCommands.actions`.
- Use `executeCommands` for advanced multi-step batches.

## Action constraints

- Do not mix browser action types with pointer/keyboard/wait in one `executeCommands` call.
- `browserScanPage` requires viewport calibration.

## Screenshot contract

- Screenshot tools return both `screenshot` and `screenshotUrl`.
- Fetch image bytes via `screenshotUrl`.

## Safety

- MCP uses service-context and force direct control behavior.
- Treat `listDevices` as potentially non-owner-scoped.
