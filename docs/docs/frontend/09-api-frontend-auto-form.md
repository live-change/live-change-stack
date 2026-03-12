---
title: API – @live-change/frontend-auto-form
---

# API – @live-change/frontend-auto-form

Concise API reference for the main parts of `@live-change/frontend-auto-form`.

## Configuration providers

### provideAutoViewComponents()

Registers auto-form view components globally (e.g. list views, editors).

### provideAutoInputConfiguration()

Registers default mapping from property/definition types to input components (InputText, Checkbox, Select, etc.).

### provideMetadataBasedAutoInputConfiguration()

Adds mapping based on model/action metadata generated on the server (e.g. types, validators).

You typically call all three in `App.vue`:

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

## Components

### AutoField

Basic component described in the forms chapter:

- props:
  - `definition` – property definition
  - `modelValue` – field value
  - `error` – validation result (optional)
  - `label` – label text (optional)
- events:
  - `update:modelValue`

Slots:

- `#label` – custom label
- `#default` – custom field rendering
- `#error` – custom error rendering

### AutoInput

Lower-level – single input from a definition.

### AutoEditor

Editor for a full object (model) from a definition:

- props:
  - `definition` – model definition
  - `modelValue` – object to edit
  - `rootValue` – root value (for nesting)
  - `i18n` – translation key prefix
  - `errors` – property errors object (from `editorData.propertiesErrors`)

### EditorButtons

Standard save/reset button bar, designed to work with an `editorData` result:

- props:
  - `editor` – the object returned by `editorData` (required)
  - `resetButton` – whether to show the Reset button (boolean)

Renders:
- "Saving draft…" spinner while auto-saving draft,
- "Draft changed" hint when draft has unsaved changes,
- validation error message when `propertiesErrors` is non-empty,
- **Save** / **Create** button (disabled when nothing changed),
- optional **Reset** button.

### ActionButtons

Standard Execute/Reset button bar for action forms, designed to work with an `actionData` result:

- props:
  - `actionFormData` – the object returned by `actionData` (required)
  - `resetButton` – whether to show the Reset button (boolean)

Renders:
- "Executing…" spinner while `submitting` is true,
- "Draft changed" hint when draft has auto-saved changes,
- validation error message when `propertiesErrors` is non-empty,
- **Execute** button (disabled while submitting),
- optional **Reset** button.

### ModelEditor / ModelView / ModelSingle

High-level CRUD components:

- `ModelEditor` – list / single-record edit screen for a model
- `ModelView` – lists and details
- `ModelSingle` – single model instance

They combine model definitions, views and actions internally.

## editorData(options)

`editorData` is the highest-level form helper. It manages the full CRUD lifecycle for a single model record: load, draft, create/update decision, save, and error handling.

```javascript
import { editorData } from '@live-change/frontend-auto-form'
import { computedAsync } from '@vueuse/core'

// editorData returns a Promise; wrap with computedAsync when identifiers are reactive
const editor = computedAsync(() =>
  editorData({
    service: 'blog',
    model: 'Article',
    identifiers: { article: props.article },
    draft: true,      // default – auto-saves draft
    autoSave: false,  // when draft:false, save changes directly
    debounce: 600,
  })
)
```

### Options

| Option | Default | Description |
|---|---|---|
| `service` | required | Service name (string) |
| `model` | required | Model name (string) |
| `identifiers` | required | Identifier object, e.g. `{ article: id }` |
| `draft` | `true` | Enable draft auto-save via `draft` service |
| `autoSave` | `false` | Auto-save directly to model (when `draft:false`) |
| `debounce` | `600` | Debounce delay in ms |
| `initialData` | `{}` | Default values for new records |
| `parameters` | `{}` | Extra parameters sent with every action call |
| `savedToast` | `"Saved"` | Toast message after successful save |
| `savedDraftToast` | `"Draft saved"` | Toast message after draft save |
| `onSaved` | `() => {}` | Callback after successful save |
| `onCreated` | `(result) => {}` | Callback after create (receives action result) |
| `onDraftSaved` | `() => {}` | Callback after draft save |
| `onDraftDiscarded` | `() => {}` | Callback after draft discard |

### Returned object

| Property | Type | Description |
|---|---|---|
| `value` | `Ref` | Editable data (pass to `v-model`) |
| `changed` | `Ref<boolean>` | Unsaved changes vs saved record |
| `save()` | function | Submit to model, clear draft |
| `saving` | `Ref<boolean>` | Save in progress |
| `reset()` | function | Discard draft, restore saved state |
| `discardDraft()` | function | Discard draft without saving (draft mode only) |
| `isNew` | `Ref<boolean>` | `true` when creating a new record |
| `propertiesErrors` | `Ref<object>` | Server-returned property errors |
| `model` | object | Model definition (pass to `AutoEditor` as `definition`) |
| `saved` | `Ref` | Raw saved data |
| `draft` | `Ref` | Raw draft data (draft mode only) |
| `draftChanged` | `Ref<boolean>` | Draft has auto-saved but not yet submitted |
| `savingDraft` | `Ref<boolean>` | Draft auto-save in progress |

### Server-side model requirements

`editorData` reads `crud`, `identifiers`, and `editableProperties` from the model definition. These must be configured on the server model or passed as options:

```javascript
// server: myService/article.js
export const Article = definition.model({
  name: 'Article',
  properties: { title: { type: String }, body: { type: String } },
  crud: {
    read: 'article',           // view name
    create: 'createArticle',   // action name
    update: 'updateArticle',   // action name
  },
  identifiers: ['article'],    // or [{ name: 'article', field: 'id' }]
  editableProperties: ['title', 'body'],
  // ...
})
```

## actionData(options)

`actionData` is the action counterpart to `editorData`. It manages the state for a **one-shot command form**: draft auto-save while filling in the form, validation, submission, and `done` state.

```javascript
import { actionData } from '@live-change/frontend-auto-form'

// static parameters – await directly
const formData = await actionData({
  service: 'blog',
  action: 'publishArticle',
  parameters: { article: props.article },
})

// reactive parameters – use computedAsync
import { computedAsync } from '@vueuse/core'
const formData = computedAsync(() =>
  actionData({
    service: 'blog',
    action: 'publishArticle',
    parameters: { article: props.article },
  })
)
```

### Options

| Option | Default | Description |
|---|---|---|
| `service` | required | Service name |
| `action` | required | Action name |
| `parameters` | `{}` | Fixed identifier fields (not shown as editable) |
| `initialValue` | `{}` | Initial values for editable fields |
| `draft` | `true` | Enable draft auto-save via `draft` service |
| `debounce` | `600` | Debounce delay in ms |
| `doneToast` | `"Action done"` | Toast after successful submit |
| `onDone` | `(result) => {}` | Callback after successful submit |
| `onError` | rethrows | Callback on action error |
| `onDraftSaved` | `() => {}` | Callback after draft save |
| `onDraftDiscarded` | `() => {}` | Callback after draft discard |

### Returned object

| Property | Type | Description |
|---|---|---|
| `value` | `Ref` | Editable form data |
| `changed` | `Ref<boolean>` | Form differs from initial value |
| `submit()` | function | Execute the action, clear draft |
| `submitting` | `Ref<boolean>` | Action call in progress |
| `done` | `Ref<boolean>` | `true` after successful submit |
| `reset()` | function | Discard draft, restore initial value |
| `discardDraft()` | function | Discard draft only (draft mode) |
| `propertiesErrors` | `Ref<object>` | Server-returned property errors |
| `action` | object | Action definition (pass to `AutoEditor` as `definition`) |
| `editableProperties` | string[] | Properties not fixed by `parameters` |
| `draftChanged` | `Ref<boolean>` | Draft auto-saved but not submitted |
| `savingDraft` | `Ref<boolean>` | Draft auto-save in progress |

## locales

`locales` holds translations used in forms:

- `locales.en`, `locales.pl`

In `front/src/config.js` they are merged with other modules:

```javascript
import { locales as autoFormLocales } from '@live-change/frontend-auto-form'

export default {
  i18n: {
    messages: {
      en: deepmerge.all([
        baseLocales.en,
        autoFormLocales.en,
        // ...
      ]),
      pl: deepmerge.all([
        baseLocales.pl || {},
        autoFormLocales.pl || {},
        // ...
      ])
    }
  }
}
```
