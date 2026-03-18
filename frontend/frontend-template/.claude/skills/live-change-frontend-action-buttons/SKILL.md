---
name: live-change-frontend-action-buttons
description: Build async action buttons with workingZone, toast and confirm dialogs
---

# Skill: live-change-frontend-action-buttons (Claude Code)

Use this skill when you build **buttons that trigger async actions** outside of forms, using `workingZone`, `toast`, and optionally `confirm`.

## When to use

- A button triggers a backend action (delete, approve, toggle, etc.) — **no form fields**.
- You want the global loading spinner to appear while the action runs.
- Destructive actions need a confirmation dialog before executing.

**Need a form with fields?** Use `editorData` (model editing) or `actionData` (one-shot actions) instead.

## Step 1 – Inject workingZone, set up toast/confirm

```javascript
import { inject } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { useApi, useActions } from '@live-change/vue3-ssr'

const workingZone = inject('workingZone')
const toast = useToast()
const confirm = useConfirm()
const api = useApi()
const actions = useActions()
```

`workingZone` is provided by `ViewRoot` (which wraps every page in `<WorkingZone>`). When you call `workingZone.addPromise(name, promise)`, the global spinner/blur activates until the promise resolves.

## Step 2 – Simple action button

Wrap the async operation in `workingZone.addPromise()`:

```javascript
function createItem() {
  workingZone.addPromise('createItem', (async () => {
    const result = await actions.blog.createArticle({})
    toast.add({ severity: 'success', summary: 'Article created', life: 2000 })
    router.push({ name: 'article:edit', params: { article: result } })
  })())
}
```

**Important:** Note the `(async () => { ... })()` pattern – you must invoke the async IIFE immediately so `addPromise` receives a Promise, not a function.

Template:

```vue
<Button label="Create article" icon="pi pi-plus" @click="createItem" />
```

## Step 3 – Destructive action with confirm

Use `confirm.require()` before the action:

```javascript
function deleteItem(item) {
  confirm.require({
    message: 'Are you sure you want to delete this article?',
    header: 'Confirmation',
    icon: 'pi pi-trash',
    acceptClass: 'p-button-danger',
    accept: async () => {
      workingZone.addPromise('deleteArticle', (async () => {
        await actions.blog.deleteArticle({ article: item.id })
        toast.add({ severity: 'success', summary: 'Deleted', life: 2000 })
      })())
    },
    reject: () => {
      toast.add({ severity: 'info', summary: 'Cancelled', life: 1500 })
    }
  })
}
```

Template:

```vue
<Button label="Delete" icon="pi pi-trash" severity="danger" @click="deleteItem(article)" />
```

## Step 4 – Error handling

Add try/catch inside the async IIFE:

```javascript
function toggleStatus(item) {
  workingZone.addPromise('toggleStatus', (async () => {
    try {
      await actions.blog.toggleArticleStatus({ article: item.id })
      toast.add({ severity: 'success', summary: 'Status updated', life: 2000 })
    } catch(e) {
      toast.add({ severity: 'error', summary: 'Error', detail: e?.message ?? e, life: 5000 })
    }
  })())
}
```

## Step 5 – Using api.command instead of actions

Both work. `actions` is shorthand for typed service actions:

```javascript
// Using actions (preferred when available):
await actions.blog.deleteArticle({ article: id })

// Using api.command (always works):
await api.command(['blog', 'deleteArticle'], { article: id })
```

## Pattern summary

```
Button click
  → confirm.require() (if destructive)
    → workingZone.addPromise('name', (async () => {
        try {
          await actions.service.action({ ... })
          toast.add({ severity: 'success', ... })
        } catch(e) {
          toast.add({ severity: 'error', ... })
        }
      })())
```
