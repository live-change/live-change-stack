---
title: Frontend – Forms and auto-form
---

# Frontend – Forms and auto-form

This chapter shows how to build forms and CRUD screens in Live Change.

There are **two generations of form tooling**:

- **Legacy forms** from `@live-change/vue3-components`: `DefinedForm`, `CommandForm`, `FormBind`.
- **New auto-form system** from `@live-change/frontend-auto-form`: `AutoField`, `AutoInput`, `AutoEditor`, `ModelEditor`, CRUD helpers.

> Auto-form is the **recommended modern approach** for new screens. Legacy forms remain useful as low-level building blocks and for backwards compatibility.

## Server-side definitions (common foundation)

Both approaches use the same **server-side definitions**:

- **models** – e.g. `api.services.blog.models.Article`
- **actions** – e.g. `api.services.blog.actions.updateArticle`

Access them via `useApi()`:

```javascript
import { useApi } from '@live-change/vue3-ssr'

const api = useApi()

const articleDefinition = api.services.blog.models.Article
const updateDefinition = api.services.userIdentification.actions.updateMyIdentification
```

These definitions are used by:

- `vue3-components` for validation and low-level forms.
- `frontend-auto-form` for generating fields, editors and CRUD UIs.

---

## Global configuration

To enable auto-form across the app, call the three providers once in `App.vue`:

```javascript
import {
  provideAutoViewComponents,
  provideAutoInputConfiguration,
  provideMetadataBasedAutoInputConfiguration
} from '@live-change/frontend-auto-form'

provideAutoViewComponents()
provideAutoInputConfiguration()
provideMetadataBasedAutoInputConfiguration()
```

For additional input types (e.g. image upload) add the corresponding provider:

```javascript
import { provideImageInputConfig } from '@live-change/image-frontend'
provideImageInputConfig()
```

Merge auto-form locales in `config.js`:

```javascript
import { locales as autoFormLocales } from '@live-change/frontend-auto-form'

i18n: {
  messages: {
    en: deepmerge.all([
      baseLocales.en,
      autoFormLocales.en,
      // ...
    ])
  }
}
```

---

## Auto-form – field components

### AutoField – single field based on a definition

`AutoField` is the basic building block. Given a property definition it renders the label, the appropriate input widget and validation errors:

```vue
<AutoField
  :definition="definition.properties.title"
  v-model="editable.title"
  :error="validationResult?.propertyErrors?.title"
  :label="t('article.title')"
/>
```

Props:

- `definition` – property definition from the model or action
- `modelValue` / `v-model` – field value
- `error` – validation result (optional)
- `label` – label text (optional, overrides `#label` slot)

Slots:

- `#label` – custom label element
- `#default` – custom input widget (receives `{ validationResult }`)
- `#error` – custom error rendering

### Custom label

```vue
<AutoField :definition="definition.properties.website" v-model="editable.website">
  <template #label="{ uid }">
    <label :for="uid"
           class="block font-medium mb-2 flex items-center text-surface-900 dark:text-surface-0">
      <i class="pi pi-globe mr-2" /> {{ t('profile.website') }}
    </label>
  </template>
</AutoField>
```

### Custom input widget

Replace the default input with any PrimeVue component:

```vue
<AutoField :definition="definition.properties.description" v-model="editable.description"
           :error="validationResult?.propertyErrors?.description"
           :label="t('article.description')">
  <template #default="{ validationResult }">
    <Textarea autoResize class="w-full"
              :class="{ 'p-invalid': validationResult }"
              v-model="editable.description" />
  </template>
</AutoField>
```

### Inline prefix / suffix

Useful for URLs or other fields with a visible prefix:

```vue
<AutoField :definition="definition.properties.linkedin" v-model="editable.linkedin"
           :error="validationResult?.propertyErrors?.linkedin">
  <template #label>
    <label class="block font-medium mb-2 flex items-center text-surface-900 dark:text-surface-0">
      <i class="pi pi-linkedin mr-2" /> LinkedIn
    </label>
  </template>
  <template #default="{ validationResult }">
    <div class="flex flex-row items-center">
      <span class="font-semibold mr-1 text-surface-500 dark:text-surface-300">linkedin.com/in/</span>
      <InputText class="w-full" :class="{ 'p-invalid': validationResult }"
                 v-model="editable.linkedin" />
    </div>
  </template>
</AutoField>
```

### Custom error message

```vue
<AutoField :definition="definition.properties.contactsShared" v-model="editable.contactsShared"
           :error="validationResult?.propertyErrors?.contactsShared">
  <template #error="{ validationResult }">
    <Message v-if="validationResult?.error === 'empty'" severity="error" variant="simple" size="small">
      You must share at least one contact.
    </Message>
  </template>
</AutoField>
```

### AutoInput

`AutoInput` is a lower-level component – just the input widget without label or error wrapping. Use `AutoField` in most cases; reach for `AutoInput` only when you need to build a completely custom layout.

---

## Auto-form – model editors and CRUD helpers

### AutoEditor – full-model editor

`AutoEditor` renders a complete form for all writeable properties of a model:

```vue
<auto-editor
  :definition="articleDefinition"
  v-model="editable"
  :rootValue="editable"
  i18n="article."
/>
```

Props:

- `definition` – model definition (from `api.services[service].models[Model]`)
- `modelValue` / `v-model` – the object being edited
- `rootValue` – root value passed down for nested fields
- `i18n` – translation key prefix for field labels

Typical pattern – pair `AutoEditor` with `synchronized` for autosave:

```vue
<script setup>
import { computed, toRefs } from 'vue'
import { usePath, live, useActions, useApi } from '@live-change/vue3-ssr'
import { synchronized } from '@live-change/vue3-components'
import { AutoEditor } from '@live-change/frontend-auto-form'
import { useToast } from 'primevue/usetoast'

const api = useApi()
const path = usePath()
const actions = useActions()
const toast = useToast()

const props = defineProps({ article: { type: String, required: true } })
const { article } = toRefs(props)

const articleDefinition = api.services.blog.models.Article

const articlePath = computed(() => path.blog.article({ article: article.value }))
const [ articleData ] = await Promise.all([ live(articlePath) ])

const { value: editable } = synchronized({
  source: articleData,
  update: actions.blog.updateArticle,
  identifiers: { article: article.value },
  recursive: true,
  autoSave: true,
  debounce: 600,
  onSave: () => toast.add({ severity: 'info', summary: 'Saved', life: 1500 })
})
</script>

<template>
  <div class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border p-4">
    <auto-editor
      :definition="articleDefinition"
      v-model="editable"
      :rootValue="editable"
      i18n="article."
    />
  </div>
</template>
```

### ModelEditor / ModelView / ModelSingle

High-level CRUD components that combine model definitions, views and actions:

- `ModelEditor` – list / single-record edit screen
- `ModelView` – list and detail views
- `ModelSingle` – single model instance

They handle data loading, form generation and action calls internally, reducing boilerplate for standard admin screens.

---

## editorData – full CRUD lifecycle

`editorData` from `@live-change/frontend-auto-form` is the **highest-level form helper**. It manages the entire lifecycle of a single model record:

- loads the saved record (if it exists),
- optionally loads/saves a **draft** automatically while the user types,
- decides between **create** and **update** based on whether a record exists,
- calls the right action on `save()`,
- removes the draft after a successful save,
- exposes server-side property errors via `propertiesErrors`,
- shows toasts for save/draft/error states.

It requires the model on the server to declare `crud`, `identifiers`, and `editableProperties`. In return it eliminates almost all boilerplate for a standard create/edit form.

### Basic usage

```javascript
import { editorData } from '@live-change/frontend-auto-form'
import { computedAsync } from '@vueuse/core'
import { inject } from 'vue'

const workingZone = inject('workingZone')

const props = defineProps({ article: { type: String, required: true } })

// editorData returns a Promise, so wrap with computedAsync when identifiers are reactive
const editor = computedAsync(() =>
  editorData({
    service: 'blog',
    model: 'Article',
    identifiers: { article: props.article },
    // draft: true  (default) – auto-saves draft, saves to model on save()
  })
)
```

Then wire it to `AutoEditor` + `EditorButtons` in a `<form>`:

```vue
<template>
  <form v-if="editor" @submit.prevent="editor.save()" @reset.prevent="editor.reset()">
    <auto-editor
      :definition="editor.model"
      v-model="editor.value.value"
      :rootValue="editor.value.value"
      :errors="editor.propertiesErrors"
      i18n="article."
    />
    <EditorButtons :editor="editor" :reset-button="true" />
  </form>
</template>
```

`EditorButtons` automatically shows:
- a spinning "Saving draft…" indicator while draft is being auto-saved,
- a "Draft changed" hint when there are unsaved draft changes,
- a **Save** or **Create** button (label changes based on `editor.isNew`),
- a **Reset** button (when `reset-button` is set).

### Draft mode (default)

With `draft: true` (the default):

1. `editorData` loads both the saved record and the draft from `path.draft.myDraft(...)`.
2. Every change is auto-saved to the draft service (debounced).
3. Calling `editor.save()` submits to the real model and deletes the draft.
4. Calling `editor.discardDraft()` throws away the draft without saving.

Use this for **user-facing forms** where you don't want data loss on accidental navigation.

### No-draft autosave (admin panels)

```javascript
const editor = computedAsync(() =>
  editorData({
    service: 'blog',
    model: 'Article',
    identifiers: { article: props.article },
    draft: false,
    autoSave: true,
    debounce: 800,
  })
)
```

Changes are saved directly to the model after each debounce period. Use for **admin panels** where the record always exists and immediate persistence is acceptable.

### Create vs update

`editorData` detects automatically whether the record exists:

- If `savedData.value` is `null`, calling `save()` triggers the `create` action.
- If it exists, `save()` triggers the `update` action.

The `editor.isNew` ref exposes this state:

```vue
<h2>{{ editor.isNew.value ? 'New article' : 'Edit article' }}</h2>
```

### Accessing the returned object

| Property | Type | Description |
|---|---|---|
| `value` | `Ref` | Editable data (reactive) |
| `changed` | `Ref<boolean>` | Any unsaved changes vs saved record |
| `save()` | function | Submit to model, clear draft |
| `saving` | `Ref<boolean>` | Save in progress |
| `reset()` | function | Discard draft, restore saved state |
| `discardDraft()` | function | Discard draft only (draft mode) |
| `isNew` | `Ref<boolean>` | `true` when creating a new record |
| `propertiesErrors` | `Ref<object>` | Server-returned property errors |
| `model` | object | Model definition (for `AutoEditor`) |
| `saved` | `Ref` | Raw saved data from the view |
| `draft` | `Ref` | Raw draft data (draft mode) |
| `draftChanged` | `Ref<boolean>` | Unsaved changes in draft |
| `savingDraft` | `Ref<boolean>` | Draft auto-save in progress |

### Manual form fields with editorData

`editorData` also pairs well with `AutoField` when the layout needs to be customised:

```vue
<template>
  <form v-if="editor" @submit.prevent="editor.save()">
    <AutoField :definition="editor.model.properties.title"
               v-model="editor.value.value.title"
               :error="editor.propertiesErrors?.value?.title"
               :label="t('article.title')" />
    <AutoField :definition="editor.model.properties.body"
               v-model="editor.value.value.body"
               :error="editor.propertiesErrors?.value?.body">
      <template #default>
        <Textarea autoResize class="w-full" v-model="editor.value.value.body" />
      </template>
    </AutoField>
    <EditorButtons :editor="editor" :reset-button="true" />
  </form>
</template>
```

---

## actionData – forms for actions

`actionData` from `@live-change/frontend-auto-form` is the **action counterpart to `editorData`**. Use it when you need a form that submits a **one-shot command** (an action), rather than editing a persistent model record.

Key differences from `editorData`:

| | `editorData` | `actionData` |
|---|---|---|
| Target | Model record (persistent) | Action (one-shot command) |
| On submit | `save()` → create or update | `submit()` → call action directly |
| Success state | Record exists in DB | `done` ref becomes `true` |
| Main buttons | `EditorButtons` | `ActionButtons` |

Everything else – draft auto-save, `workingZone` integration, `propertiesErrors`, `AutoEditor` – works identically.

### Basic usage

```javascript
import { actionData } from '@live-change/frontend-auto-form'

const props = defineProps({
  article: { type: String, required: true }
})

// actionData is async – await it directly (identifiers are static here)
const formData = await actionData({
  service: 'blog',
  action: 'publishArticle',
  parameters: { article: props.article },  // fixed identifiers, not shown as fields
  // draft: true (default) – auto-saves form state while user fills it in
  onDone: (result) => {
    router.push({ name: 'article:view', params: { article: props.article } })
  }
})
```

When `parameters` are reactive, wrap with `computedAsync`:

```javascript
import { computedAsync } from '@vueuse/core'

const formData = computedAsync(() =>
  actionData({
    service: 'blog',
    action: 'publishArticle',
    parameters: { article: props.article },
  })
)
```

### Template with AutoEditor + ActionButtons

```vue
<template>
  <form v-if="formData" @submit.prevent="formData.submit()" @reset.prevent="formData.reset()">
    <auto-editor
      :definition="formData.action.definition"
      :editableProperties="formData.editableProperties"
      v-model="formData.value.value"
      :rootValue="formData.value.value"
      :errors="formData.propertiesErrors"
      i18n="publishArticle."
    />
    <ActionButtons :actionFormData="formData" :reset-button="true" />
  </form>
</template>
```

`ActionButtons` shows:
- "Executing…" spinner while the action is in progress (`submitting`),
- "Draft changed" hint while the draft is being auto-saved,
- validation error message from `propertiesErrors`,
- an **Execute** button (disabled while submitting).

### Handling the done state

After a successful submit, `formData.done` becomes `true`. You can use this to show a confirmation, redirect, or reset the form:

```vue
<template>
  <div v-if="formData?.done.value" class="text-center p-4">
    <i class="pi pi-check-circle text-green-500 text-4xl" />
    <p>Article published!</p>
    <Button label="Back" @click="router.back()" />
  </div>
  <form v-else-if="formData" @submit.prevent="formData.submit()">
    <!-- ... -->
  </form>
</template>
```

### Draft mode for action forms

With `draft: true` (default), the partially filled-in form is auto-saved to the `draft` service while the user types. This prevents data loss if they navigate away and come back. The draft is removed after a successful submit.

For simple action dialogs that don't need persistence across navigation, use `draft: false`:

```javascript
const formData = await actionData({
  service: 'blog',
  action: 'sendInvitation',
  parameters: { article: props.article },
  draft: false,
})
```

### Returned object

| Property | Type | Description |
|---|---|---|
| `value` | `Ref` | Editable form data |
| `changed` | `Ref<boolean>` | Form differs from initial value |
| `submit()` | function | Execute the action, clear draft |
| `submitting` | `Ref<boolean>` | Action call in progress |
| `done` | `Ref<boolean>` | `true` after successful submit |
| `reset()` | function | Discard draft, restore initial value |
| `discardDraft()` | function | Discard draft without submitting (draft mode) |
| `propertiesErrors` | `Ref<object>` | Server-returned property errors |
| `action` | object | Action definition (for `AutoEditor`) |
| `editableProperties` | string[] | Properties not fixed by `parameters` |
| `draftChanged` | `Ref<boolean>` | Draft auto-saved but not submitted |
| `savingDraft` | `Ref<boolean>` | Draft auto-save in progress |

---

## Manual form with validation

When you need more control than `AutoEditor` provides – e.g. custom layout, conditional fields or extra validation – build the form field by field using `AutoField` and `validateData`:

```vue
<script setup>
import { computed, getCurrentInstance } from 'vue'
import { usePath, live, useActions, useApi } from '@live-change/vue3-ssr'
import { synchronized, validateData } from '@live-change/vue3-components'
import { AutoField } from '@live-change/frontend-auto-form'
import { useI18n } from 'vue-i18n'

const api = useApi()
const path = usePath()
const actions = useActions()
const { t } = useI18n()
const appContext = getCurrentInstance().appContext

// Load data
const [ profileData, draft ] = await Promise.all([
  live(path.profile.myProfile()),
  live(path.draft.myDraft({ actionType: 'updateMyProfile', action: 'profile',
                             targetType: 'profile', target: 'myProfile' }))
])

const draftIdentifiers = {
  actionType: 'updateMyProfile', action: 'profile',
  targetType: 'profile', target: 'myProfile'
}

// Editable state with autosave to draft
const { value: editable, changed, saving, save: saveDraft } = synchronized({
  source: computed(() => draft.value?.data ?? profileData.value),
  update: actions.draft.setOrUpdateMyDraft,
  updateDataProperty: 'data',
  identifiers: draftIdentifiers,
  recursive: true,
  autoSave: true,
  debounce: 600
})

// Definition comes from the action (so validation rules are server-side)
const updateMethod = computed(() => profileData.value ? 'updateMyProfile' : 'setMyProfile')
const definition = computed(() => actions.profile[updateMethod.value].definition)

// Client-side validation mirrors server rules
const validationResult = computed(() =>
  validateData(definition.value, editable.value, 'validation', appContext, '', editable.value, true)
)

async function saveProfile(ev) {
  ev.preventDefault()
  await actions.profile[updateMethod.value](editable.value)
  if(draft.value) await actions.draft.resetMyDraft(draftIdentifiers)
}
</script>

<template>
  <form @submit="saveProfile">
    <AutoField :definition="definition.properties.firstName"
               v-model="editable.firstName"
               :error="validationResult?.propertyErrors?.firstName"
               :label="t('profile.firstName')" />

    <AutoField :definition="definition.properties.lastName"
               v-model="editable.lastName"
               :error="validationResult?.propertyErrors?.lastName"
               :label="t('profile.lastName')" />

    <AutoField :definition="definition.properties.bio"
               v-model="editable.bio"
               :error="validationResult?.propertyErrors?.bio"
               :label="t('profile.bio')">
      <template #default="{ validationResult }">
        <Textarea autoResize class="w-full"
                  :class="{ 'p-invalid': validationResult }"
                  v-model="editable.bio" />
      </template>
    </AutoField>

    <div class="flex flex-row justify-end items-center mt-4">
      <span v-if="saving" class="text-surface-500 dark:text-surface-300 mr-2">
        <i class="pi pi-spin pi-spinner" /> Saving draft…
      </span>
      <span v-if="validationResult" class="p-error font-semibold mr-2">
        {{ t('form.correctErrors') }}
      </span>
      <Button type="submit" :label="t('profile.save')" icon="pi pi-save"
              :disabled="!!validationResult" />
    </div>
  </form>
</template>
```

---

## Custom dropdown field

To replace the default input with a `Select` / `Dropdown`, pass it in the `#default` slot:

```vue
<AutoField :definition="definition.properties.category" v-model="editable.category"
           class="mb-3"
           :label="t('article.category')">
  <template #default>
    <Select v-model="editable.category"
            :options="definition.properties.category.options"
            :optionLabel="v => t('article.categories.' + v)"
            class="w-full" />
  </template>
</AutoField>
```

`AutoField` still handles the label and any validation error; only the input widget is swapped.

---

## Summary and guidance

- **Legacy forms (DefinedForm / CommandForm / FormBind)**:
  - good for very custom or low-level situations,
  - still used in some older code and advanced flows.
- **Auto-form (AutoField / AutoEditor / ModelEditor / ModelView / ModelSingle)**:
  - recommended for **new** forms and CRUD screens,
  - keeps form structure in sync with server definitions,
  - integrates well with PrimeVue and custom UI via slots.

For new screens, follow this pattern:

1. Define models and actions on the server.
2. Access definitions through `useApi()` (`api.services[service].models[Model]` / `actions[Action].definition`).
3. Use `synchronized` for editable state where needed.
4. Build UIs on top of `AutoField`, `AutoEditor` and the CRUD helpers with as little custom wiring as possible.
