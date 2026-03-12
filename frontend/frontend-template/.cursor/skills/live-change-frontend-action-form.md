---
description: Build one-shot action forms with actionData, AutoField and ActionButtons
---

# Skill: live-change-frontend-action-form (Claude Code)

Use this skill when you build **one-shot action forms** with `actionData` and `AutoField` in a LiveChange frontend.

## When to use

- You need a form for a command/action (not CRUD model editing).
- The form submits once, then shows a "done" state.
- You want draft auto-save while the user fills in the form.

**Editing a model record instead?** Use `editorData` (see `live-change-frontend-editor-form` skill).
**No form fields, just a button?** Use `api.command` (see `live-change-frontend-command-forms` skill).

## Step 1 – Set up actionData

```javascript
import { AutoField, actionData, ActionButtons } from '@live-change/frontend-auto-form'

const formData = await actionData({
  service: 'blog',
  action: 'publishArticle',
  parameters: { article: props.articleId },   // fixed params (not shown as fields)
  initialValue: { scheduleTime: null },       // initial values for editable fields
  draft: true,
  doneToast: 'Article published!',
  onDone: (result) => {
    router.push({ name: 'articles' })
  },
})
```

For reactive parameters, use `computedAsync`:

```javascript
import { computedAsync } from '@vueuse/core'

const formData = computedAsync(() =>
  actionData({
    service: 'blog',
    action: 'publishArticle',
    parameters: { article: props.articleId },
  })
)
```

## Step 2 – Build the template with AutoField

Use `formData.action.properties.*` as definitions and `formData.value.*` as v-model:

```vue
<template>
  <form @submit.prevent="formData.submit()" @reset.prevent="formData.reset()">
    <AutoField
      :definition="formData.action.properties.scheduleTime"
      v-model="formData.value.scheduleTime"
      :error="formData.propertiesErrors?.scheduleTime"
      label="Schedule time"
    />
    <AutoField
      :definition="formData.action.properties.message"
      v-model="formData.value.message"
      :error="formData.propertiesErrors?.message"
      label="Message"
    />

    <ActionButtons :actionFormData="formData" :resetButton="true" />
  </form>
</template>
```

## Step 3 – Handle done state

After successful submission, `formData.done` becomes `true`:

```vue
<template>
  <div v-if="formData.done" class="text-center">
    <i class="pi pi-check-circle text-4xl text-green-500 mb-2"></i>
    <p>Article published successfully!</p>
  </div>
  <form v-else @submit.prevent="formData.submit()" @reset.prevent="formData.reset()">
    <!-- fields + ActionButtons -->
  </form>
</template>
```

## Step 4 – Manual buttons (alternative to ActionButtons)

```vue
<div class="flex gap-2 justify-end">
  <Button
    type="submit"
    :label="formData.submitting ? 'Executing...' : 'Execute'"
    :icon="formData.submitting ? 'pi pi-spin pi-spinner' : 'pi pi-play'"
    :disabled="formData.submitting"
  />
  <Button type="reset" label="Reset" :disabled="!formData.changed" icon="pi pi-eraser" />
</div>
```

## editorData vs actionData

| Aspect | `editorData` | `actionData` |
|---|---|---|
| Purpose | CRUD model editing | One-shot command form |
| Identifier | `model` + `identifiers` | `action` + `parameters` |
| Create/update | Detects automatically | Always "execute" |
| After submit | Record is saved | `done` becomes `true` |
| Definition source | `editor.model` | `formData.action` |
| `parameters` | Extra params on save | Fixed fields excluded from form |

## Key options

| Option | Default | Description |
|---|---|---|
| `service` | required | Service name |
| `action` | required | Action name |
| `parameters` | `{}` | Fixed identifier fields (not editable) |
| `initialValue` | `{}` | Initial values for editable fields |
| `draft` | `true` | Auto-save draft while filling |
| `debounce` | `600` | Debounce delay in ms |
| `doneToast` | `"Action done"` | Toast after success |
| `onDone` | – | Callback after success |

## Key returned properties

| Property | Description |
|---|---|
| `value` | Editable form data |
| `action` | Action definition (`.properties.*` for `AutoField`) |
| `editableProperties` | Properties not fixed by `parameters` |
| `changed` | Form differs from initial value |
| `submit()` | Execute the action |
| `submitting` | Action call in progress |
| `done` | `true` after success |
| `reset()` | Discard draft, restore initial value |
| `propertiesErrors` | Server validation errors per property |
| `draftChanged` | Draft auto-saved but not submitted |
| `savingDraft` | Draft auto-save in progress |
