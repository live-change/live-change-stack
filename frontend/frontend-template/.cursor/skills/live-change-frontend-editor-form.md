---
description: Build CRUD editing forms with editorData and AutoField components
---

# Skill: live-change-frontend-editor-form (Claude Code)

Use this skill when you build **CRUD editing forms** with `editorData` and `AutoField` in a LiveChange frontend.

## When to use

- You need a create/edit form for a model record.
- You want draft auto-saving while the user types.
- You prefer individual `<AutoField>` components over `<AutoEditor>` for layout control.

**Not editing a model?** Use `actionData` instead (see `live-change-frontend-action-form` skill).
**No form fields, just a button?** Use `api.command` (see `live-change-frontend-command-forms` skill).

## Step 1 – Set up editorData

```javascript
import { ref, getCurrentInstance } from 'vue'
import { AutoField, editorData } from '@live-change/frontend-auto-form'
import { useToast } from 'primevue/usetoast'
import { useRouter } from 'vue-router'

const toast = useToast()
const router = useRouter()
const appContext = getCurrentInstance().appContext

const editor = ref(null)

async function loadEditor() {
  editor.value = await editorData({
    service: 'blog',
    model: 'Article',
    identifiers: { article: props.articleId },
    draft: true,
    appContext,
    toast,
    onSaved: () => {
      toast.add({ severity: 'success', summary: 'Saved', life: 1500 })
    },
    onCreated: (result) => {
      router.push({ name: 'article', params: { article: result } })
    },
  })
}

loadEditor()
```

For new records, pass an empty or missing identifier:

```javascript
identifiers: { article: props.articleId } // props.articleId can be undefined for new
```

## Step 2 – Build the template with AutoField

Use `editor.model.properties.*` as definitions and `editor.value.*` as v-model:

```vue
<template>
  <div v-if="editor" class="space-y-4">
    <AutoField
      :definition="editor.model.properties.title"
      v-model="editor.value.title"
      :error="editor.propertiesErrors?.title"
      label="Title"
    />
    <AutoField
      :definition="editor.model.properties.body"
      v-model="editor.value.body"
      :error="editor.propertiesErrors?.body"
      label="Body"
    />

    <!-- Manual field alongside AutoField -->
    <div>
      <label class="block text-sm font-medium mb-1">Category</label>
      <Dropdown
        v-model="editor.value.category"
        :options="categories"
        optionLabel="name"
        optionValue="id"
        class="w-full"
      />
    </div>

    <!-- Buttons -->
    <div class="flex gap-2 justify-end">
      <Button v-if="!editor.isNew" @click="editor.save()"
        label="Save" icon="pi pi-save"
        :disabled="!editor.changed" />
      <Button v-else @click="editor.save()"
        label="Create" icon="pi pi-plus" severity="success"
        :disabled="!editor.changed" />
      <Button @click="editor.reset()"
        label="Reset" icon="pi pi-eraser"
        :disabled="!editor.changed" />
    </div>
  </div>
</template>
```

## Step 3 – Use EditorButtons (alternative)

Instead of manual buttons, use the `EditorButtons` component:

```vue
<template>
  <div v-if="editor">
    <!-- fields... -->
    <EditorButtons :editor="editor" :resetButton="true" />
  </div>
</template>

<script setup>
  import { EditorButtons } from '@live-change/frontend-auto-form'
</script>
```

`EditorButtons` automatically handles:
- "Saving draft..." spinner,
- "Draft changed" hint,
- validation error message,
- Save/Create button (disabled when nothing changed),
- optional Reset button.

## Step 4 – Reactive identifiers with computedAsync

When identifiers come from reactive sources (route params, props):

```javascript
import { computedAsync } from '@vueuse/core'

const editor = computedAsync(() =>
  editorData({
    service: 'blog',
    model: 'Article',
    identifiers: { article: props.articleId },
    draft: true,
    appContext,
    toast,
  })
)
```

## Key options reference

| Option | Default | Description |
|---|---|---|
| `service` | required | Service name |
| `model` | required | Model name |
| `identifiers` | required | e.g. `{ article: id }` |
| `draft` | `true` | Auto-save draft while editing |
| `autoSave` | `false` | Auto-save directly (when `draft: false`) |
| `debounce` | `600` | Debounce delay in ms |
| `initialData` | `{}` | Default values for new records |
| `parameters` | `{}` | Extra params sent with every action |
| `onSaved` | – | Callback after save |
| `onCreated` | – | Callback after create (receives result) |

## Key returned properties

| Property | Description |
|---|---|
| `value` | Editable data (use with `v-model`) |
| `model` | Model definition (use `.properties.*` for `AutoField`) |
| `changed` | `true` when there are unsaved changes |
| `isNew` | `true` when creating (no existing record) |
| `save()` | Submit to backend |
| `reset()` | Discard draft, restore saved state |
| `propertiesErrors` | Server validation errors per property |
| `saving` | Save in progress |
| `draftChanged` | Draft auto-saved but not submitted |
| `savingDraft` | Draft auto-save in progress |
