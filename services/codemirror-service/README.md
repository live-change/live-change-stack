# @live-change/codemirror-service

LiveChange **service definition** for **collaborative CodeMirror 6** documents: stores document text as **line arrays**, applies incoming **ChangeSet** updates, keeps an append-only **steps** history, and optional **snapshots** for faster replay.

## What is implemented

- **Models** (`model.js`): `Document`, `StepsBucket`, `Snapshot`; in-memory LRU cache of open documents for hot apply path.
- **Events**: `documentCreated`, `documentEdited`, `snapshotTaken` — persist content, version, buckets, snapshots.
- **Views** (`index.js`): `document` (by `targetType` + `target`), `steps` (range), `snapshot` (single version), `snapshots` (range index).
- **Actions**: `createDocument`, `createDocumentIfNotExists`, `edit`, `takeSnapshot`; **trigger** `takeSnapshot`.
- **Collaboration merge**: **`rebaseUpdates`** from `@codemirror/collab` runs in the **`edit` action** (before `emit`), not in the event. When the client `version` lags the open document, intermediate steps are loaded from `StepsBucket`, rebased, and only then emitted. If rebase throws, the action returns **`rejected`** and **does not emit** `documentEdited`.
- **Event `documentEdited`**: deterministic persistence only — deserialize steps, apply sequentially to authoritative text, bump version, write `Document` and `StepsBucket`. It expects `version` to match the open document; a mismatch is a controlled `logicError` (should not happen after a successful `edit` emit).

## Configuration

In the host app `services.config.js`, register this package with **`documentTypes`**: an object whose **keys** are allowed document type strings. Values are currently opaque (used only for presence); optional metadata like `format: 'text'` is fine.

Example (see `frontend/codemirror-frontend/server/services.config.js`):

```js
{
  name: 'codemirror',
  path: '@live-change/codemirror-service',
  documentTypes: {
    markdown: { format: 'text' },
    code: { format: 'text' }
  }
}
```

## Related package

- UI and transport: [`@live-change/codemirror-frontend`](../../frontend/codemirror-frontend/README.md).
