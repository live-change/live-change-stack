---
name: live-change-backend-indexes-changestream
description: Build advanced LiveChange function indexes with ChangeStream pipes — cross joins, groupExisting, map/to. Use when denormalizing related model fields into an index, joining tables/indexes, or avoiding hand-rolled dual onChange joins.
---

# Skill: live-change-backend-indexes-changestream

Use this skill when an index row depends on **more than one** table/index (joins, denormalized status from a related model, distinct-by-prefix).

Canonical docs: `live-change-stack/docs/docs/server/11-indexes-and-foreign-models.md` (ChangeStream pipe API).

## When to use

- Join a relation index with a parent table (e.g. `byTask` × `Task` for assignee + status).
- Join a table with another index (e.g. scopes × access paths).
- Collapse multi-row indexes to one row per prefix (`groupExisting`).
- Replace a manual dual `onChange` / nested `range.onChange` fan-out.

## When NOT to use

- Simple property indexes — use `property: [...]`.
- Single-table derived keys — use `table.map(...).to(output)` (see `live-change-design-models-relations`).
- Union of equal peer sources — dual `onChange` writing to `output` is fine (see standalone indexes).

## Step 1 – Pick the left and right sides

| Join shape | Left (`this`) | Right (`other`) |
|------------|---------------|-----------------|
| Parent keyed by id, reverse via property index | Relation index (`byTask`, `byPhrase`, …) | Parent table |
| Object × reverse index by object id | Table | Index keyed by that id |
| Distinct while any member exists | Multi-row index | — use `groupExisting`, not `cross` |

`cross(other, selfToRange, otherToRange)`:

- On left change → `selfToRange` returns a **string** id (`other.objectGet`) or a **range** (`other.range` + buckets).
- On right change → `otherToRange` applied against the left stream the same way.

## Step 2 – Prefer `cross` → `map` → `to`

```js
indexes: {
  byWhoAndStatus: {
    property: ['whoType', 'who', 'status'],
    function: async function(input, output, {
      assignmentByTaskIndex, taskTable, assignmentTable, taskType, taskDefaultPriority
    }) {
      async function rowForAssignment(assignment, task) {
        if (!assignment?.who || !task?.status) return null
        const priorityKey = String(9999 - Math.min(Math.max(
          Number(task.maxPriority ?? task.priority ?? taskDefaultPriority), 0), 9999
        )).padStart(4, '0')
        return {
          id: [assignment.whoType, assignment.who, task.status, priorityKey, assignment.task]
            .map(v => JSON.stringify(v)).join(':'),
          whoType: assignment.whoType,
          who: assignment.who,
          status: task.status,
          task: assignment.task
          // ... other denormalized fields
        }
      }

      async function resolveAssignment(entry) {
        if (!entry) return null
        if (entry.task && entry.whoType && entry.who) return entry
        const id = entry.to ?? entry.id
        return id ? input.table(assignmentTable).object(id).get() : null
      }

      const byTask = await input.index(assignmentByTaskIndex)
      const tasks = await input.table(taskTable)

      await byTask.cross(
        tasks,
        async (entry) => {
          const a = await resolveAssignment(entry)
          return a?.task
        },
        (task) => {
          const prefix = [taskType, task.id].map(v => JSON.stringify(v)).join(':')
          return { gte: `${prefix}:`, lte: `${prefix}_\xFF\xFF\xFF\xFF` }
        }
      ).map(async ([entry, task]) => {
        const assignment = await resolveAssignment(entry)
        return rowForAssignment(assignment, task)
      }).to(output)
    },
    parameters: {
      assignmentByTaskIndex: definition.name + '_TaskAssignment_byTask',
      taskTable: definition.name + '_Task',
      assignmentTable: definition.name + '_TaskAssignment',
      taskType: 'todo_Task',
      taskDefaultPriority: 100
    }
  }
}
```

For a single serialized id prefix on the reverse side, use `prefixRange(JSON.stringify(id))` (available in index script context).

## Step 3 – Table × index (scope pattern)

```js
const scopesTable = await input.table(scopesTableName)
const pathsIndex = await input.index(pathsIndexName)

await scopesTable.cross(
  pathsIndex,
  scope => ({ gte: `"${scope.id}":`, lte: `"${scope.id}"_\xFF\xFF\xFF\xFF` }),
  path => path.ancestorType,
  128
).map(async ([scope, path]) => {
  if (!(scope && path)) return null
  return { id: /* ... */, /* denormalized fields */ }
}).to(output)
```

## Step 4 – `groupExisting` for distinct prefixes

```js
await (await input.index(multiRowIndexName))
  .groupExisting(async ({ id }) => id.slice(0, id.lastIndexOf('_') + 1))
  .map(entry => ({ id: entry.id.slice(0, entry.id.lastIndexOf('_')), /* fields */ }))
  .to(output)
```

## Anti-patterns

```js
// ❌ Nested range.onChange — registers a lasting observer on every parent change
await input.table(taskTable).onChange(async (task, oldTask) => {
  const range = byTask.range({ gte: prefix + ':', lte: prefix + '_\xFF\xFF\xFF\xFF' })
  await range.onChange(async entry => { /* ... */ })
})

// ❌ Dual table.onChange that manually re-reads the other side without cross
await input.table(A).onChange(syncA)
await input.table(B).onChange(syncB) // easy to miss B→A fan-out / leak observers
```

**Do this instead:** `left.cross(right, selfToRange, otherToRange).map(...).to(output)`.

## Serialization reminder

Index functions are `toString()`-serialized. Keep helpers **inside** the function body (or eval helper bundles). Pass table/index names only via `parameters`.

## Reference implementations

- `live-change-stack/services/scope-service/indexes.js` — `cross`, `groupExisting`
- `live-change-stack/services/task-service/model.js` — `groupExisting` (`taskNames`)
- `golem/services/product-analysis-service/phraseResearch.js` — index × table + `prefixRange`
