# PRD: codemirror-service

**Audience:** humans and AI agents.  
**Purpose:** single source of truth for **what this service does today** vs **what it does not promise**.

## Problem statement

Provide a **multi-user**, **ordered**, **rebase-capable** text document store for CodeMirror 6 collaboration, integrated with LiveChange **actions**, **events**, **views**, and **access control** (same pattern family as `prosemirror-service`, different document representation: **lines + ChangeSet JSON**).

## In scope (delivered)

### Data model

| Model | Role |
|--------|------|
| `Document` | One logical doc keyed by encoded `(targetType, target)`; fields `type`, `purpose`, `version`, `content` (line array), timestamps. |
| `StepsBucket` | Batch of applied updates at a version; holds `steps` (array of `{ clientID, changes }` with `changes` as JSON), `window`, session/user ids, `timestamp`. |
| `Snapshot` | Point-in-time `content` (line array) for compaction / historical read. |

### Runtime behavior

- **Open document cache** (`lru-cache`): holds `Text` + `version` + last bucket/snapshot pointers for fast `edit` handling.
- **`documentCreated`**: persists initial lines + version `1` + initial snapshot row.
- **`documentEdited`**:
  - Parses incoming steps to `ChangeSet`.
  - If client-supplied `version` ≠ current server version, loads intermediate buckets with **`StepsBucket.rangeGet`** and runs **`rebaseUpdates(received, intermediateUpdates)`**.
  - Applies each resulting update to authoritative `Text`, increments version per update.
  - Writes `Document` row, creates new `StepsBucket`, optionally creates `Snapshot` when version gap exceeds `snapshotAfterSteps` (default 230).
- **`snapshotTaken`**: creates snapshot at current or historical version; uses **`readVersion`** to replay from nearest snapshot when needed.

### API surface (DAO)

**Views**

- `codemirror.document` — `{ targetType, target }` → `Document` path.
- `codemirror.steps` — range over `StepsBucket` for document id (used by frontend `inboxReader`).
- `codemirror.snapshot` — `{ targetType, target, version }` → single snapshot path.
- `codemirror.snapshots` — range over snapshots for a document.

**Actions**

- `codemirror.createDocument` — idempotent reject if exists.
- `codemirror.createDocumentIfNotExists` — returns existing or creates.
- `codemirror.edit` — `{ targetType, target, type, version, steps, window, continuation }`; emits `documentEdited`. Returns `'saved'` or `'rejected'` (client should resync / rebase).
- `codemirror.takeSnapshot` — explicit snapshot emit.

**Trigger**

- `codemirror.takeSnapshot` — same as action path for internal/batch use.

### Access control

Default config uses `readerRoles` / `writerRoles` both `['writer']` unless overridden: reads and writes are gated on **object** `(targetType, target)` via relations/access-control patterns (see `index.js`).

## Out of scope / non-goals

- **Schema validation of `documentTypes` values** beyond “key must exist” — unlike ProseMirror, there is no per-type `Schema` object; values in config are markers only unless extended later.
- **Operational transform for arbitrary non-CM clients** — wire format is CodeMirror `ChangeSet` JSON.
- **Branching / named versions / merge requests** — only linear version integer + snapshots.
- **Deletion GC** of old buckets — not described here; retention is a product decision.

## Client contract (for AI implementing frontends)

1. **Document identity**: `targetType` and `target` identify the backing row; `type` must be a configured `documentTypes` key.
2. **Initial content**: create payloads accept `content` as **string** (split to lines) or **line array** (see `documentCreated` handler).
3. **Edits**: `steps` is an array of `{ clientID, changes }` where `changes` is `ChangeSet.toJSON()` from CM.
4. **Version argument on `edit`**: used together with server state for **rebase** when stale; client should still use CM collab (`sendableUpdates` / `receiveUpdates`) locally.
5. **Live stream**: clients subscribe to `codemirror.steps` with range `gt` cursor semantics compatible with `inboxReader` (see `codemirror-frontend` `RemoteAuthority`).

## Configuration keys

| Key | Meaning |
|-----|---------|
| `documentTypes` | **Required** map of allowed `type` strings → arbitrary metadata. |
| `snapshotAfterSteps` | Optional; default 230 — how far behind head a snapshot may lag before a new one is written on edit. |
| `readerRoles` / `writerRoles` | Optional role lists for access control views. |
| `testLatency` | Optional artificial delay in views/actions for debugging. |

## Known limitations / follow-ups

- **`edit` rejection semantics**: rely on client resync; no rich error payload in this PRD.
- **`continuation` flag**: exists on action (parity with prosemirror); CM `RemoteAuthority` currently sends `continuation: false` — align with ProseMirror duplicate-send handling if needed.
- **Tests**: `package.json` references `tape tests/*`; add tests under `tests/` if missing for regression safety.

## Success criteria (this service)

- Concurrent `edit` calls for the same document converge to **identical** `Document.content` and **monotonic** `version` consistent with applied buckets.
- `documentTypes` not configured → clear failure (`document type not found`).
- Historical `snapshotTaken` for `version < head` succeeds when snapshot chain + buckets exist (`readVersion`).
