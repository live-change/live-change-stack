---
name: live-change-frontend-editor-form
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

## Step 1 – Set up editorData (recommended: `await`)

Use `await editorData(...)` directly in `<script setup>`, just like `live()`. Suspense handles the loading state.

```javascript
import { editorData, AutoField, EditorButtons } from '@live-change/frontend-auto-form'
import { useToast } from 'primevue/usetoast'
import { useRouter, useRoute } from 'vue-router'

const toast = useToast()
const router = useRouter()
const route = useRoute()

const editor = await editorData({
  service: 'blog',
  model: 'Article',
  identifiers: { article: route.params.article },
  draft: true,
  onSaved: () => {
    toast.add({ severity: 'success', summary: 'Saved', life: 1500 })
  },
  onCreated: (result) => {
    router.push({ name: 'article', params: { article: result } })
  },
})
```

For new records, pass empty identifiers:

```javascript
identifiers: {} // creates a new record
```

This is the simplest and most readable approach. Use it when identifiers are available at setup time (static values, route params).

## Step 2 – Build the template with AutoField

Use `editor.model.properties.*` as definitions and `editor.data.value` for v-model bindings:

**Important:** Always wrap in a `<form>` element. `EditorButtons` uses `type="submit"` / `type="reset"` internally — without a parent `<form>`, the buttons do nothing.

```vue
<template>
  <form @submit.prevent="editor.save()" @reset.prevent="editor.reset()">
    <div class="space-y-4">
      <AutoField
        :definition="editor.model.properties.title"
        v-model="editor.data.value.title"
        :error="editor.propertiesErrors?.title"
        label="Title"
      />
      <AutoField
        :definition="editor.model.properties.body"
        v-model="editor.data.value.body"
        :error="editor.propertiesErrors?.body"
        label="Body"
      />

      <!-- Custom input inside AutoField — gets label + error automatically -->
      <AutoField
        :definition="editor.model.properties.category"
        v-model="editor.data.value.category"
        :error="editor.propertiesErrors?.category"
        label="Category"
      >
        <Dropdown
          v-model="editor.data.value.category"
          :options="categories"
          optionLabel="name"
          optionValue="id"
          class="w-full"
        />
      </AutoField>

      <EditorButtons :editor="editor" :resetButton="true" />
    </div>
  </form>
</template>
```

No `v-if="editor"` needed — with `await`, the editor is always available after the component loads (Suspense handles the loading state).

## Step 3 – Use EditorButtons (alternative)

Instead of manual buttons, use the `EditorButtons` component:

```vue
<template>
  <form @submit.prevent="editor.save()" @reset.prevent="editor.reset()">
    <!-- fields... -->
    <EditorButtons :editor="editor" :resetButton="true" />
  </form>
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

## Showing validation errors — 3 approaches

**Every field in an `editorData` form must show validation errors.** Never use bare `InputText`/`Dropdown` without error feedback.

### Approach 1 — AutoField without slot (default, simplest)

AutoField auto-picks the right input component and renders label + error `Message` automatically:

```vue
<AutoField :definition="editor.model.properties.name" v-model="editor.data.value.name"
  :error="editor.propertiesErrors?.name" label="Name" />
```

Use for standard fields where the default input is fine.

### Approach 2 — AutoField with slot (custom input)

Wrap a custom input inside AutoField. AutoField still renders label and error:

```vue
<AutoField :definition="editor.model.properties.depth" v-model="editor.data.value.depth"
  :error="editor.propertiesErrors?.depth" label="Depth">
  <Dropdown v-model="editor.data.value.depth" :options="depthOptions"
    placeholder="Select depth" class="w-full" />
</AutoField>
```

Use when you need a non-standard input (custom Dropdown formatting, Popover picker, InputNumber with buttons, etc.). AutoField slots: `#default({ validationResult, uid })`, `#label({ uid })`, `#error({ validationResult })`.

### Approach 3 — Manual `Message` (no AutoField wrapper)

When the layout doesn't allow an AutoField wrapper (e.g. sub-fields of an Object property), add error feedback manually:

```vue
<InputText v-model="editor.data.value.address.street" placeholder="Street" class="w-full" />
<Message v-if="editor.propertiesErrors?.address" severity="error"
  variant="simple" size="small" class="mt-1">
  {{ editor.propertiesErrors.address }}
</Message>
```

Use as a last resort when there's no model property definition for the individual field.

## Step 4 – Reactive identifiers with computedAsync (advanced)

When identifiers come from reactive sources that **may change during the component lifetime** (e.g. a prop that changes without page navigation), use `computedAsync`. Create an additional `computed` to alias the data for cleaner template access:

```javascript
import { computed } from 'vue'
import { computedAsync } from '@vueuse/core'
import { editorData, AutoField, EditorButtons } from '@live-change/frontend-auto-form'

const editor = computedAsync(() =>
  editorData({
    service: 'blog',
    model: 'Article',
    identifiers: { article: props.articleId },
    draft: true,
  })
)

// Alias for cleaner template access
const editable = computed(() => editor.value?.value)
```

Then in the template:

```vue
<template>
  <form v-if="editor" @submit.prevent="editor.save()" @reset.prevent="editor.reset()">
    <AutoField
      :definition="editor.model.properties.title"
      v-model="editable.value.title"
      :error="editor.propertiesErrors?.title"
      label="Title"
    />
    <EditorButtons :editor="editor" />
  </form>
</template>
```

**When to use approach 1 vs approach 2:**
- Route params (`route.params.id`) → use `await` (approach 1). Route changes cause full page remount.
- Static identifiers (`{}` for new records) → use `await` (approach 1).
- Reactive prop that changes without remount → use `computedAsync` (approach 2).

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
| `data` | Editable form data (recommended), it is a ref, it should be used with value - editor.data.value |
| `value` | Editable form data (obsolete), it is a ref, it should be used with value - editor.value.value |
| `model` | Model definition (use `.properties.*` for `AutoField`) |
| `changed` | `true` when there are unsaved changes |
| `isNew` | `true` when creating (no existing record) |
| `save()` | Submit to backend |
| `reset()` | Discard draft, restore saved state |
| `propertiesErrors` | Server validation errors per property |
| `saving` | Save in progress |
| `draftChanged` | Draft auto-saved but not submitted |
| `savingDraft` | Draft auto-save in progress |
