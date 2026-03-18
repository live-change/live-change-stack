---
name: live-change-frontend-command-forms
description: Build forms with api.command, command-form, workingZone, confirm and toast
---

# Skill: live-change-frontend-command-forms (Claude Code)

Use this skill when you build **forms and actions** for a LiveChange frontend:

- calling `api.command`,
- using `<command-form>`,
- handling destructive actions with confirm + toast.

## Choosing the right pattern

Before using this skill, pick the right approach:

| Pattern | When to use |
|---|---|
| `editorData` | **Editing model records** (create/update). Drafts, validation, `AutoField`. See `live-change-frontend-editor-form` skill. |
| `actionData` | **One-shot action forms** (not CRUD). Submit once → done. See `live-change-frontend-action-form` skill. |
| `api.command` | **Single button or programmatic calls** (no form fields). This skill, Step 1. |
| `<command-form>` | **Avoid.** Legacy. Only for trivial prototypes without drafts or `AutoField`. This skill, Step 2. |

**Decision flow:**

1. Does the user fill in form fields? → **No**: use `api.command` (this skill).
2. Is it editing a model record? → **Yes**: use `editorData`.
3. Is it a one-shot action? → **Yes**: use `actionData`.
4. Only use `<command-form>` for the simplest throwaway cases.

## Step 1 – Use `api.command` directly

1. Import and create `api`:

```js
import { api as useApi } from '@live-change/vue3-ssr'

const api = useApi()
```

2. Call commands as:

```js
await api.command(['deviceManager', 'createMyUserDevice'], {
  name: 'My device'
})

await api.command(['deviceManager', 'deleteMyUserDevice'], {
  device: id
})
```

3. Wrap in `try/catch` if you need custom error handling.

## Step 2 – `<command-form>` (legacy – prefer editorData/actionData)

> **Note:** `<command-form>` is the oldest pattern. For new code, prefer `editorData` (model editing) or `actionData` (one-shot actions) – they support drafts, `AutoField`, and richer state management.

1. Use `<command-form>` only for trivial forms without drafts or `AutoField`.
2. Provide:
   - `service` – service name,
   - `action` – action name,
   - `fields` – constant/hidden fields (e.g. ids).

Example:

```vue
<command-form
  service="deviceManager"
  action="updateMyUserDevice"
  :fields="{ device: deviceId }"
>
  <template #default="{ fieldProps, submit, busy }">
    <div class="space-y-4">
      <div>
        <label class="block text-sm font-medium mb-1">
          Name
        </label>
        <InputText v-bind="fieldProps('name')" class="w-full" />
      </div>
      <div class="flex justify-end gap-2">
        <Button
          label="Save"
          icon="pi pi-check"
          :loading="busy"
          @click="submit"
        />
      </div>
    </div>
  </template>
</command-form>
```

## Step 3 – Confirm + Toast for destructive actions

1. Use PrimeVue `useConfirm` and `useToast`.
2. Put the `api.command` call in `accept`.

Example:

```js
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { api as useApi } from '@live-change/vue3-ssr'

const api = useApi()
const confirm = useConfirm()
const toast = useToast()

function deleteDevice(id) {
  confirm.require({
    message: 'Are you sure you want to delete this device?',
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      await api.command(['deviceManager', 'deleteMyUserDevice'], { device: id })
      toast.add({
        severity: 'success',
        summary: 'Deleted',
        life: 2000
      })
    }
  })
}
```

## Step 3b – WorkingZone for button actions (outside forms)

When a button triggers an async action outside a form, wrap it with `workingZone.addPromise()` so the global loading spinner activates:

```js
import { inject } from 'vue'
import { useToast } from 'primevue/usetoast'
import { useActions } from '@live-change/vue3-ssr'

const workingZone = inject('workingZone')
const toast = useToast()
const actions = useActions()

function createDevice() {
  workingZone.addPromise('createDevice', (async () => {
    const result = await actions.deviceManager.createMyUserDevice({ name: 'New device' })
    toast.add({ severity: 'success', summary: 'Created', life: 2000 })
    router.push({ name: 'device', params: { device: result } })
  })())
}
```

Combine with `confirm.require()` for destructive actions:

```js
function deleteDevice(id) {
  confirm.require({
    message: 'Are you sure?',
    header: 'Confirmation',
    icon: 'pi pi-trash',
    acceptClass: 'p-button-danger',
    accept: async () => {
      workingZone.addPromise('deleteDevice', (async () => {
        await actions.deviceManager.deleteMyUserDevice({ device: id })
        toast.add({ severity: 'success', summary: 'Deleted', life: 2000 })
      })())
    }
  })
}
```

For a detailed guide, see the `live-change-frontend-action-buttons` skill.

## Step 4 – Pattern for sensitive values (toggle + copy)

1. By default, hide sensitive values (keys, tokens, etc.).
2. Add:
   - a toggle button (eye / eye-slash),
   - a copy button with a toast.

Example:

```vue
<template>
  <div class="flex items-center gap-2">
    <code>
      {{ revealed ? item.pairingKey : '••••••••••••' }}
    </code>
    <Button
      :icon="revealed ? 'pi pi-eye-slash' : 'pi pi-eye'"
      text
      @click="revealed = !revealed"
    />
    <Button
      icon="pi pi-copy"
      text
      @click="copyToClipboard(item.pairingKey)"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'

const toast = useToast()
const revealed = ref(false)

async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text)
  toast.add({
    severity: 'info',
    summary: 'Copied',
    life: 1500
  })
}
</script>
```

