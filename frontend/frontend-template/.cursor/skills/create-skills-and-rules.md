---
name: create-skills-and-rules
description: Create or update Claude Code skills and Cursor rules/skills with proper format and frontmatter, and configure OpenCode
---

# Skill: create-skills-and-rules

Use this skill when you need to **create or update skills and rules** for Claude Code (`.claude/`), Cursor (`.cursor/`), and OpenCode (`opencode.json`).

## Directory structure

```
.claude/
  rules/     *.md              – always-loaded project instructions
  skills/    <name>/SKILL.md   – step-by-step guides, invocable or auto-matched by description
.cursor/
  rules/     *.mdc             – Cursor rules with description/globs/alwaysApply frontmatter
  skills/    *.md              – flat files, same content as .claude/skills/ (Cursor reads them as reference)
opencode.json                  – OpenCode config: instructions array points to .claude/rules/*.md
```

**Cross-tool compatibility:**
- **Claude Code** reads both flat files and directory-based skills from `.claude/skills/`
- **OpenCode** reads **only** directory-based skills (`.claude/skills/<name>/SKILL.md`) — flat files are ignored
- **Cursor** reads flat files from `.cursor/skills/*.md` as reference documents
- Rules are loaded by OpenCode via `opencode.json` `instructions` array

**Standard format:** Always use directory-based skills (`<name>/SKILL.md`) for compatibility with all tools.

## Step 1 – Decide: rule or skill

| Type | Purpose | When loaded |
|---|---|---|
| **Rule** | Constraints, conventions, best practices | Automatically, based on `globs` or `alwaysApply` |
| **Skill** | Step-by-step implementation guide | When description matches task, or invoked via `/skill-name` |

Rules say **what to do / not do**. Skills say **how to do it step by step**.

## Step 2 – Create a skill (`.claude/skills/<name>/SKILL.md`)

### Create the directory and file

```bash
mkdir -p .claude/skills/my-skill-name
# then create .claude/skills/my-skill-name/SKILL.md
```

### Required frontmatter

```yaml
---
name: my-skill-name
description: Short description of what this skill does and when to use it
---
```

| Field | Required by | Description |
|---|---|---|
| `name` | OpenCode, Claude Code | Must match directory name exactly. Lowercase, hyphens only, regex `^[a-z0-9]+(-[a-z0-9]+)*$`, max 64 chars |
| `description` | All tools | When to use — Claude/OpenCode match this to decide auto-invocation |

### Optional frontmatter fields (Claude Code only)

```yaml
---
name: my-skill
description: What this skill does
user-invocable: true
disable-model-invocation: false
allowed-tools: Read, Grep, Bash
context: fork
agent: Explore
argument-hint: [filename]
model: sonnet
---
```

| Field | Default | Description |
|---|---|---|
| `user-invocable` | `true` | Show in `/` menu |
| `disable-model-invocation` | `false` | Prevent auto-loading by Claude |
| `allowed-tools` | – | Tools allowed without asking (e.g. `Read, Grep, Bash`) |
| `context` | – | Set to `fork` to run in isolated subagent |
| `agent` | – | Subagent type when `context: fork` (`Explore`, `Plan`, etc.) |
| `argument-hint` | – | Hint for autocomplete (e.g. `[issue-number]`) |
| `model` | inherited | Model override (`sonnet`, `opus`, `haiku`) |

OpenCode ignores unknown frontmatter fields, so these are safe to include.

### Dynamic substitutions in skill content

- `$ARGUMENTS` – all arguments passed when invoking
- `$ARGUMENTS[0]`, `$1` – specific argument by index
- `${CLAUDE_SESSION_ID}` – current session ID
- `${CLAUDE_SKILL_DIR}` – directory containing SKILL.md

### Body structure

```markdown
---
name: my-skill-name
description: Build X with Y and Z
---

# Skill: my-skill-name

Use this skill when you build **X** using Y and Z.

## When to use

- Bullet list of scenarios

## Step 1 – First step

Explanation + code example.

## Step 2 – Second step

Explanation + code example.
```

Keep skills under 500 lines. Use clear step numbering. Include real code examples.

## Step 3 – Create a Claude Code rule (`.claude/rules/<name>.md`)

### Frontmatter

```yaml
---
description: Short description of this rule's purpose
globs: **/front/src/**/*.{vue,js,ts}
---
```

| Field | Description |
|---|---|
| `description` | What this rule covers (used for matching) |
| `globs` | File patterns that trigger this rule (e.g. `**/*.js`, `**/services/**/*.js`) |

### Body structure

```markdown
---
description: Rules for X development
globs: **/*.js
---

# Title

## Section 1

- Rule bullet points
- Code examples

## Section 2

- More rules
```

Rules are concise. Lead with the constraint, then show a code example.

## Step 4 – Create Cursor rule (`.cursor/rules/<name>.mdc`)

Same content as the Claude rule, but with Cursor-specific frontmatter:

```yaml
---
description: Short description of this rule's purpose
globs: **/front/src/**/*.{vue,js,ts}
alwaysApply: false
---
```

| Field | Default | Description |
|---|---|---|
| `description` | – | What the rule does; Cursor uses this to decide when to apply |
| `globs` | – | Comma-separated file patterns (e.g. `**/*.tsx, src/**/*.js`) |
| `alwaysApply` | `false` | If `true`, applies to every session regardless of context |

**Notes:**
- Do NOT quote glob patterns in frontmatter
- Keep rules short (target 25 lines, max 50 lines for best Cursor performance)
- The `.mdc` extension is required for Cursor

## Step 5 – Register rules in OpenCode (`opencode.json`)

OpenCode reads `.claude/skills/<name>/SKILL.md` natively for skills (no extra step needed). But rules must be registered in `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "instructions": [
    ".claude/rules/live-change-backend-architecture.md",
    ".claude/rules/live-change-frontend-vue-primevue.md"
  ]
}
```

When you **create a new rule**, add its path to the `instructions` array in `opencode.json`.

When you **create a new skill**, no `opencode.json` change is needed — OpenCode discovers skills from `.claude/skills/<name>/SKILL.md` automatically.

**Important:** OpenCode ignores the `globs` frontmatter from Claude Code rules. All instructions listed in `opencode.json` are always loaded.

## Step 6 – Mirror Cursor skills (`.cursor/skills/<name>.md`)

Copy the skill content to `.cursor/skills/` as a **flat file** (Cursor reads flat `.md` files as reference):

```bash
cp .claude/skills/my-skill-name/SKILL.md .cursor/skills/my-skill-name.md
```

The content is the same (including `name` in frontmatter). Cursor ignores unknown frontmatter fields.

## Step 7 – Mirror to sub-projects

If the project has sub-projects with their own `.claude/` and `.cursor/` directories, copy the files there too:

```bash
for dir in automation auto-firma; do
  # Skills: directory format for .claude, flat for .cursor
  mkdir -p "$dir/.claude/skills/my-skill-name"
  cp .claude/skills/my-skill-name/SKILL.md "$dir/.claude/skills/my-skill-name/SKILL.md"
  cp .claude/skills/my-skill-name/SKILL.md "$dir/.cursor/skills/my-skill-name.md"

  # Rules
  cp .claude/rules/my-rule.md "$dir/.claude/rules/"
  cp .cursor/rules/my-rule.mdc "$dir/.cursor/rules/"
done
```

## Naming conventions

- Use lowercase with hyphens: `live-change-frontend-editor-form`
- Must match regex `^[a-z0-9]+(-[a-z0-9]+)*$` (OpenCode requirement)
- Prefix with domain: `live-change-frontend-*`, `live-change-backend-*`
- Skills describe actions: `*-editor-form`, `*-range-list`, `*-action-buttons`
- Rules describe scope: `*-vue-primevue`, `*-models-and-relations`

## Checklist

- [ ] Directory created: `.claude/skills/<name>/SKILL.md`
- [ ] Frontmatter has both `name` (matching dir) and `description`
- [ ] `.cursor/skills/<name>.md` mirrored (flat file, same content)
- [ ] `.claude/rules/*.md` created (if rule)
- [ ] `.cursor/rules/*.mdc` created with `globs` + `alwaysApply` (if rule)
- [ ] `opencode.json` `instructions` array updated (if new rule)
- [ ] Sub-projects updated (automation, auto-firma)
