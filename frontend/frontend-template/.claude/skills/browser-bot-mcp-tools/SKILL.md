---
name: browser-bot-mcp-tools
description: Use bot-server MCP tools to control devices, inspect browser state, navigate tabs/pages, and capture screenshots with screenshotUrl. Use for MCP/mcpServer tasks in automation/browser-bot.
---

# Skill: browser-bot-mcp-tools

Use this skill for MCP-only tasks in `automation/browser-bot/bot-server`.
Do not switch to bot-runner guidance unless explicitly requested.

## Workflow

1. `initialize` (optional handshake)
2. `tools/list`
3. `listDevices`
4. Select a dedicated tool (`click`, `browserScanPage`, `navigate`, `browserScreenshot`, etc.)
5. Parse `result.content[0].text` JSON

## Prefer dedicated tools

Use dedicated MCP wrappers first:
- HID: `click`, `doubleClick`, `moveMouse`, `drag`, `scrollWheel`, `pressKey`, `keyCombo`, `typeText`
- Browser/readout: `browserScanPage`, `browserGetHtml`, `browserGetTabs`
- Browser navigation: `navigate`, `openTab`, `closeTab`, `activateTab`
- Screenshots: `browserScreenshot`, `deviceScreenshot`

Use `executeCommands` for advanced multi-step batches and when you need inline `wait`.

## `wait`

No standalone `wait` tool. Use only inside `executeCommands.actions`.

## Screenshot handling

For screenshot tools, read:
- `screenshot` metadata
- `screenshotUrl` (fully-qualified URL)

Use `screenshotUrl` directly to fetch bytes.

## Safety and constraints

- MCP forces direct control (`force: true`) and bypasses queue semantics.
- Do not mix browser and HID/wait actions in one `executeCommands` call.
- `browserScanPage` requires saved viewport calibration.
- `listDevices` may show devices visible to service context.
