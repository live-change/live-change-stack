---
name: live-change-frontend-synchronized
description: Use synchronized and synchronizedList for autosave editing in LiveChange Vue frontends, including object vs list decision flow, identifiers mapping, and save/delete patterns
---

# Skill: live-change-frontend-synchronized (Cursor)

Use this skill when implementing or refactoring frontend editing flows that should keep local form state synchronized with backend data.

## When to use

- Editing one object loaded from `live(...)` with autosave or manual save.
- Editing list items inline (for example access roles) with per-row identifiers.
- Replacing custom `watch + api.command` autosave logic with a standard helper.
- Choosing between `synchronized`, `synchronizedList`, and `editorData`.

## Decision flow

1. **One editable object** (`profile`, `note`, `settings`) -> use `synchronized`.
2. **Editable list rows** (`accesses`, `invitations`, `requests`) -> use `synchronizedList`.
3. **Definition-driven CRUD form with validation UI** -> use `editorData` from auto-form stack.

## What counts as "editable list rows"

Treat the feature as a list flow (`synchronizedList`) when most of these are true:

- The UI renders rows with `v-for` and each row has editable fields.
- Users can edit many rows inline in one screen (table/config/admin list).
- Autosave should happen per row while the list stays reactive.
- Each row needs its own action payload keys in addition to shared list context.

In this case, wire one `synchronizedList(...)` and edit fields directly on `syncList.value`.
Do not build a parallel `id -> synchronized(...)` map for rows.

## `synchronized` pattern (object)

```javascript
import { synchronized } from '@live-change/vue3-components'

const sync = synchronized({
  source: sourceRef,
  update: actions.service.updateThing,
  identifiers: computed(() => ({ thing: thingId.value })),
  recursive: true,
  autoSave: true,
  debounce: 600
})

const { value: editable, changed, saving, save } = sync
```

### Rules

- `source` should come from `live(...)` or a computed source.
- Keep identifiers stable and pass them through `identifiers` (plain object or `computed`).
- Use `updateDataProperty: 'data'` for draft-like payloads where backend expects nested data.
- Use `autoSave: false` when save must happen only after explicit confirmation.

## `synchronizedList` pattern (list)

```javascript
import { synchronizedList } from '@live-change/vue3-components'

const syncList = synchronizedList({
  source: accesses,
  update: actions.accessControl.updateSessionOrUserAndObjectOwnedAccess,
  delete: actions.accessControl.resetSessionOrUserAndObjectOwnedAccess,
  identifiers: { object, objectType },
  objectIdentifiers: ({ to, sessionOrUser, sessionOrUserType }) => ({
    access: to, sessionOrUser, sessionOrUserType, object, objectType
  }),
  recursive: true
})

const editableRows = syncList.value
await syncList.delete(editableRows.value[0])
```

### Rules

- `source` should be a list from `live(...)`.
- Every item should have stable `id`.
- Put shared context in `identifiers`, and row-specific keys in `objectIdentifiers`.
- Edit rows through `syncList.value`; call `syncList.delete(...)` / `syncList.insert(...)` on the helper object.
- Prefer this pattern for configuration lists, permission tables, dictionaries, and other multi-row settings editors.

## Project examples to follow

- `speed-dating/front/src/components/notes/NoteEditor.vue` (`synchronized` with autosave)
- `speed-dating/front/src/components/profile/ProfileSettings.vue` (`synchronized` + `updateDataProperty: 'data'`)
- `family-tree/front/src/components/AgreementDialog.vue` (`synchronized` with manual save)
- `rcstreamer/front/src/configuration/AccessRequests.vue` (`synchronizedList`)
- `rcstreamer/front/src/configuration/AccessInvitations.vue` (`synchronizedList`)
- `rcstreamer/front/src/configuration/AccessList.vue` (`synchronizedList`)

## Common mistakes

- Using `synchronized` for a list of rows instead of `synchronizedList`.
- Forgetting `objectIdentifiers` when backend update/delete actions need per-row keys.
- Mutating raw `live(...)` list data instead of `synchronizedList(...).value`.
- Mixing autosave helper patterns with unrelated one-shot action form patterns.
