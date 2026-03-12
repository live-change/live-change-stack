---
description: Create or update Claude Code skills and Cursor rules/skills with proper format and frontmatter
---

# Skill: create-skills-and-rules

Use this skill when you need to **create or update skills and rules** for Claude Code (`.claude/`) and Cursor (`.cursor/`).

## Directory structure

```
.claude/
  rules/     *.md   – always-loaded project instructions
  skills/    *.md   – step-by-step guides, invocable or auto-matched by description
.cursor/
  rules/     *.mdc  – Cursor rules with description/globs/alwaysApply frontmatter
  skills/    *.md   – same content as .claude/skills/ (Cursor reads them as reference)
```

## Step 1 – Decide: rule or skill

| Type | Purpose | When loaded |
|---|---|---|
| **Rule** | Constraints, conventions, best practices | Automatically, based on `globs` or `alwaysApply` |
| **Skill** | Step-by-step implementation guide | When description matches task, or invoked via `/skill-name` |

Rules say **what to do / not do**. Skills say **how to do it step by step**.

## Step 2 – Create a Claude Code skill (`.claude/skills/<name>.md`)

### Frontmatter

```yaml
---
description: Short description of what this skill does and when to use it
---
```

The `description` field is used by Claude to decide when to automatically apply the skill. Write it as a concise action phrase.

### Optional frontmatter fields (for directory-based skills)

If you use the directory format `.claude/skills/<name>/SKILL.md`:

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
| `name` | directory name | Slash command name (lowercase, hyphens, max 64 chars) |
| `description` | – | When to use (Claude matches this to decide auto-invocation) |
| `user-invocable` | `true` | Show in `/` menu |
| `disable-model-invocation` | `false` | Prevent auto-loading by Claude |
| `allowed-tools` | – | Tools allowed without asking (e.g. `Read, Grep, Bash`) |
| `context` | – | Set to `fork` to run in isolated subagent |
| `agent` | – | Subagent type when `context: fork` (`Explore`, `Plan`, etc.) |
| `argument-hint` | – | Hint for autocomplete (e.g. `[issue-number]`) |
| `model` | inherited | Model override (`sonnet`, `opus`, `haiku`) |

### Dynamic substitutions in skill content

- `$ARGUMENTS` – all arguments passed when invoking
- `$ARGUMENTS[0]`, `$1` – specific argument by index
- `${CLAUDE_SESSION_ID}` – current session ID
- `${CLAUDE_SKILL_DIR}` – directory containing SKILL.md

### Body structure

```markdown
---
description: Build X with Y and Z
---

# Skill: my-skill-name (Claude Code)

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

## Step 5 – Mirror Cursor skills (`.cursor/skills/<name>.md`)

Copy the `.claude/skills/*.md` file directly to `.cursor/skills/`. Same content, same filename. Cursor reads these as reference documents.

## Step 6 – Mirror to sub-projects

If the project has sub-projects with their own `.claude/` and `.cursor/` directories, copy the files there too:

```bash
for dir in automation auto-firma; do
  cp .claude/skills/my-skill.md "$dir/.claude/skills/"
  cp .claude/skills/my-skill.md "$dir/.cursor/skills/"
  cp .claude/rules/my-rule.md "$dir/.claude/rules/"
  cp .cursor/rules/my-rule.mdc "$dir/.cursor/rules/"
done
```

## Naming conventions

- Use lowercase with hyphens: `live-change-frontend-editor-form.md`
- Prefix with domain: `live-change-frontend-*`, `live-change-backend-*`
- Skills describe actions: `*-editor-form`, `*-range-list`, `*-action-buttons`
- Rules describe scope: `*-vue-primevue`, `*-models-and-relations`

## Checklist

- [ ] Frontmatter with `description` in every file
- [ ] `.claude/skills/*.md` created
- [ ] `.cursor/skills/*.md` mirrored (same content)
- [ ] `.claude/rules/*.md` created (if rule)
- [ ] `.cursor/rules/*.mdc` created with `globs` + `alwaysApply` (if rule)
- [ ] Sub-projects updated (automation, auto-firma)
