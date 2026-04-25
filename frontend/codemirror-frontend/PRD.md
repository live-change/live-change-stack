# PRD: codemirror-frontend

**Audience:** humans and AI agents working in this repo.  
**Scope:** this package only. Backend contract is summarized; details live in `codemirror-service/PRD.md`.

## Product intent

Deliver a **browser-based collaborative text editor** (markdown and other CM languages) backed by LiveChange DAO/actions, comparable in *collab shape* to the ProseMirror stack used by `content-frontend`, but using **CodeMirror 6** and **ChangeSet**-based steps.

## Current delivery status (as of this PRD)

### Done

1. **Runnable app shell** — SSR entry, router, `ViewRoot`, standard frontend stack deps (session, user, access control, etc. per `server/services.config.js`).
2. **Collab demo UI** — `CodeEditor.vue`: document identity fields, language picker, displayed server version, sync state from editor.
3. **Collab editor** — `Editor.vue`:
   - Initializes CM6 with `@codemirror/collab` (`collab`, `sendableUpdates`, `receiveUpdates`, `getSyncedVersion`).
   - `clientID` = `api.windowId` (per-tab identity for collab).
   - Loads document through `RemoteAuthority.loadDocument()`; initial doc text from `documentData.content` (array of lines joined with `\n`).
   - Subscribes to remote step buckets via `inboxReader` inside `RemoteAuthority`; applies updates when `onNewUpdates` fires.
   - Debounces outgoing pushes with `queueMicrotask` after local changes.
   - Language and theme switched via **Compartments** (no full editor recreate).
4. **Library surface** — `index.js` re-exports `CodeEditor`, `Editor`, `RemoteAuthority`, and i18n locale maps.

### Explicitly not done (do not assume)

- **Obsidian-like product**: vault graph, files tree, plugins, offline, mobile — out of scope.
- **Rich markdown WYSIWYG**: CM is plain text with syntax highlighting; no split preview wired in the demo (optional extensions exist under `front/src/codemirror/markdown/` but are not required for collab).
- **Hardened offline / conflict UX**: minimal resync path; no dedicated user-facing conflict resolution UI.
- **Automated E2E for two-browser collab** in this package: plan item; add tests when CI story is clear (`yarn e2e` exists but collab-specific coverage may be missing).

## User flows (implemented)

1. Open app → land on `/` → see demo form + editor.
2. Optionally change `targetType` / `target` / document `type` (must match a configured `documentTypes` key on the server).
3. Edit text → local CM collab state → `sendableUpdates` → `codemirror.edit` → server applies and broadcasts steps → peer receives → `receiveUpdates`.

## Technical dependencies

- `@live-change/vue3-ssr` — `useApi`, `inboxReader`.
- `@live-change/codemirror-service` — document model, `edit`, views for `document` and `steps`.
- CodeMirror 6 packages: `codemirror`, `@codemirror/collab`, language packs, `@codemirror/state`, `@codemirror/view`.

## Configuration contract

`server/services.config.js` must register service `name: 'codemirror'` with **`documentTypes`** whose keys are the allowed `type` values passed from `Editor` / `RemoteAuthority` (e.g. `markdown`, `code`). Unknown types cause server-side rejection.

## Extension points (for future work)

- Replace demo page with routed “document list / open by id”.
- Wire `markdownLivePreviewExtensions()` from `front/src/codemirror/markdown/` into `Editor` when preview UX is desired.
- Align `RemoteAuthority` with ProseMirror’s duplicate-step / continuation semantics if long-running editors show edge cases.

## Success criteria (this package)

- Two browser tabs on the **same** `targetType` + `target` + `type` show **convergent** text after edits (ordering may follow CM rebase rules).
- Version indicator moves forward after saves; sync state reflects load/save lifecycle without permanent stuck `saving`.
