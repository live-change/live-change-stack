---
title: Relations plugin — generated artifacts
---

# Relations plugin — generated artifacts

This page is a **technical reference** for what `@live-change/relations-plugin` adds to a service at definition time: views, actions, triggers, events, indexes, and fields. For **what each relation means** and how to choose it, see [Relations overview](/server/09-relations.html) and the sub-pages (09-01 … 09-06).

Implementation lives under `live-change-stack/framework/relations-plugin/src/`.

## Processor order

Processors run in this order (`relations-plugin/src/index.ts`):

`entity` → `propertyOf`, `itemOf` → `propertyOfAny`, `itemOfAny` → `relatedTo`, `relatedToAny` → `boundTo`, `boundToAny` → `saveAuthor`

Later steps can still add names; avoid clashes across the whole service.

## Summary table

| Model annotation | Main source files | Typical generated artifacts |
|------------------|-------------------|------------------------------|
| **`entity`** | `entity.ts`, `entityUtils.ts` | Single-object view named **camelCase model** (e.g. `Auction` → `auction`); optional **global range** view (`defineGlobalRangeView` in `utils.ts`); events `{Model}Created`, `{Model}Updated`, `{Model}Deleted`; triggers `{service}_create{Model}`, `{service}_update{Model}`, `{service}_delete{Model}`; actions `create{Model}`, `update{Model}`, `delete{Model}` when access flags allow |
| **`itemOf`** | `itemOf.ts`, `pluralRelationUtils.js` | Same **single-object view name** pattern (`auction`); **range** view `{parents}Owned{PluralModel}`; optional global range; events including transferred/copy/delete-by-owner; CRUD triggers and actions; parent delete/copy triggers; `model.crud` hints (`read`, `rangeBy…`, etc.) |
| **`propertyOf`** | `propertyOf.ts`, `singularRelationUtils.js` | Object view (default name = camelCase model unless `config.name` / prefix/suffix); **multiple range views** from parent identifier combinations (`defineRangeViews`); optional `config.views`; events `{Model}Set`, `Updated`, `Transferred`, `Reset`; actions `set{Model}`, `update{Model}`, `setOrUpdate{Model}`, `reset{Model}`, `delete{Model}` per access |
| **`itemOfAny`** | `itemOfAny.ts`, `pluralRelationAnyUtils.js` | Same *kinds* as `itemOf` with polymorphic owner fields from `utilsAny.js` |
| **`propertyOfAny`** | `propertyOfAny.ts`, `singularRelationAnyUtils.js` | Same *kinds* as `propertyOf` for polymorphic owners |
| **`relatedTo`** | `relatedTo.ts`, `pluralRelationUtils.js` | Like `itemOf` but context uses **`Friend` / `Related`** — range view names contain the **Related** segment |
| **`relatedToAny`** | `relatedToAny.ts` | Same family as `relatedTo` with `*Any` helpers |
| **`boundTo`** | `boundTo.ts`, `singularRelationUtils.js` | Similar to `propertyOf` with **Bound** naming; object + range views; set/update/reset flows |
| **`boundToAny`** | `boundToAny.ts` | Same family as `boundTo` for polymorphic bindings |
| **`saveAuthor` / `saveUpdater`** | `saveAuthor.ts` | Only **extra properties**: `authorType` / `author` and/or `updaterType` / `updater` — no views |

Shared:

- **Global listing** — `defineGlobalRangeView` in `utils.ts` when `readAllAccess` (or equivalent) is set.
- **Change triggers** — lifecycle signals from `changeTriggers.js` (see [Change triggers (reference)](#change-triggers-reference) below). Distinct from **CRUD action triggers** (`{service}_create{Model}`, etc.) which execute writes.
- **Auto fields and indexes** — see [09-01](/server/09-01-propertyOf-itemOf.html) and [09-relations](/server/09-relations.html); this page focuses on **generated names** for views/actions/events/triggers.

## Change triggers (reference)

Change triggers notify listeners when model data changes. They are **not** the same as CRUD action triggers (`cron_createSchedule`) — those run the write pipeline; change triggers (`changeCron_Schedule`, `changeObject`) run **after** validation and **before** the persistence event.

### When they fire

| Source | Fires change triggers? |
|--------|------------------------|
| Relations-plugin CRUD actions/triggers (`create{Model}`, `set{Model}`, …) | Yes — internally via `fireChangeTriggers` |
| `entity` CRUD | Yes |
| User/session wrapper `ownerCrud` actions (`createMyUser…`, `setMySession…`, …) | Yes — since relations-plugin export (see below) |
| `signedIn` / `contactConnected` owner migration | Yes — item transfer = **update**; property transfer = **delete + create** |
| Raw `Model.create` / event handlers | No |

### Trigger names (per model `Model` in service `myService`)

| Trigger | When |
|---------|------|
| `createMyService_Model` | create |
| `updateMyService_Model` | update |
| `deleteMyService_Model` | delete |
| `changeMyService_Model` | any change |
| `createObject` / `updateObject` / `deleteObject` / `changeObject` | any model using relations or wrappers above |

Pattern: `{changeType}{ServiceNameCapitalized}_{ModelName}`.

### Payload

```javascript
{
  objectType,   // e.g. 'myService_MyModel'
  object,       // record id (property models: composite id from owner identifiers)
  identifiers,  // parent owner fields, e.g. { user: '...' } or { sessionOrUserType, sessionOrUser }
  data,         // new writable data (null on delete)
  oldData,      // previous writable data (null on create)
  changeType    // 'create' | 'update' | 'delete'
}
```

`changeType` is derived from `data` / `oldData`: only `data` → create; both → update; only `oldData` → delete.

### Public API: `fireChangeTriggers`

Import from `@live-change/relations-plugin` when a custom action or service processor performs writes via `emit()` instead of relations CRUD triggers (avoids an extra trigger round-trip):

```javascript
import { fireChangeTriggers, extractObjectData } from '@live-change/relations-plugin'

// Inside action/trigger execute — trigger comes from context
await fireChangeTriggers({
  service,
  modelName: 'MyModel',
  app,
  objectType: service.name + '_MyModel',
  object: id,
  identifiers: { user: client.user },
  oldData: null,           // or extractObjectData(writeableProperties, entity, {})
  data,                    // null on delete
  trigger                  // required — from execute context
})
await emit({ type: 'MyModelCreated', ... })
```

Also exported: `extractObjectData`, `extractIdentifiers` (from `dataUtils.js`).

**Not** part of the public API: `registerParentDeleteTriggers`, `registerParentCopyTriggers` (internal cascade registration).

Implementation: `framework/relations-plugin/src/fireChangeTriggers.ts` → `changeTriggers.js`.

## Name collisions

Do **not** hand-register a `definition.view`, `definition.action`, `definition.event`, or `definition.trigger` whose **name** matches something the plugin already registered (e.g. model `Auction` with **`entity`** already registers view **`auction`** — a second `definition.view({ name: 'auction' })` throws `view auction already exists`).

Confirm the effective API with **`describe`**, e.g. `fnm exec -- node server/start.js describe --service myService --output yaml` (see project rules for Node via `fnm`).

## User service wrappers

`userProperty`, `userItem`, `sessionOrUser*`, `contactOrUser*` are handled by **processors in user-service** (and `sessionItem` / `sessionProperty` in session-service) that rewrite models to `propertyOf` / `itemOf` / `propertyOfAny` / `itemOfAny` and add **ownerCrud** views/actions.

Those wrapper actions call the same **`fireChangeTriggers`** public API before `emit()`, so lifecycle triggers (`changeMyService_Model`, `changeObject`, …) behave like standard relations CRUD. See [Change triggers (reference)](#change-triggers-reference).

Generated names follow the same underlying patterns after the rewrite — use `describe` on the concrete service.
