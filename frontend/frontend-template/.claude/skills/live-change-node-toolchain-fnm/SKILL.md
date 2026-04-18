---
name: live-change-node-toolchain-fnm
description: Run node, npm, npx, tsx and framework CLI with fnm exec so .node-version and .nvmrc are respected
---

# Skill: Node toolchain with fnm

Use this skill whenever you run **Node**, **npm**, **npx**, **tsx**, or **corepack** in this repo (tests, `describe`, dev servers, scripts). Agents must not use the default sandbox Node; use **fnm exec** so the version from dotfiles applies.

## When to use

- Running `npm test`, `npm run …`, linters, builds
- `node server/start.js describe` or any framework entry
- `tsx` for TypeScript scripts
- Any subprocess that would invoke `node` or `npm` for a project with `.node-version` / `.nvmrc`

## Step 1 – Find the right directory

Locate the nearest project root that has `.node-version` or `.nvmrc` for the task (often the app folder, e.g. `auto-firma/app/`).

`cd` to that directory before running commands so fnm reads the correct file.

## Step 2 – Prefix with fnm exec

```bash
fnm exec -- node server/start.js describe --service myService --output yaml
fnm exec -- npm test
fnm exec -- npx vitest
fnm exec -- tsx ./tools/something.ts
```

The part after `--` is the same command you would run manually with the correct Node active.

## Step 3 – Nested monorepo paths

If you are in the repo root but the dotfile is only under `some-app/`:

```bash
cd some-app && fnm exec -- npm test
```

## If fnm is missing

Do not fall back to bare `node` / `npm` for framework work. Report that fnm is required (or document a one-off alternative the user approved).
