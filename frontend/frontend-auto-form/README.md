---
title: @live-change/frontend-auto-form
---

## @live-change/frontend-auto-form

`@live-change/frontend-auto-form` to moduł do **automatycznego generowania formularzy i CRUD-ów** na podstawie:

- definicji modeli i akcji po stronie serwera (Live Change)
- metadanych wygenerowanych przez `@live-change/framework` i dostępnych przez `@live-change/vue3-ssr`

Zapewnia:

- komponenty **pól formularza** (`AutoField`, `AutoInput`, `AutoEditor`, `ModelEditor`, `ModelView`, `ModelSingle`, `ActionForm`, itp.)
- provider-y konfiguracji (`provideAutoViewComponents`, `provideAutoInputConfiguration`, `provideMetadataBasedAutoInputConfiguration`)
- lokalizacje (`locales`) używane w aplikacjach takich jak `family-tree` i `speed-dating`

### Podstawowa integracja

W `App.vue` typowej aplikacji włączasz auto-form globalnie:

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

oraz dodajesz lokalizacje do i18n w `front/src/config.js`:

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

### Kluczowe komponenty

#### `AutoField`

Generuje pojedyncze pole formularza na podstawie definicji właściwości modelu lub akcji:

```vue
<AutoField
  :definition="definition.properties.firstName"
  v-model="editable.firstName"
  :error="validationResult?.propertyErrors?.firstName"
  :label="t('profile.firstName')"
/>
```

Możesz wstrzykiwać własny layout przez sloty (`#default`, `#label`, `#error`), jak w `ProfileSettings.vue` (`speed-dating`).

#### `AutoInput` i `AutoEditor`

`AutoInput` – pojedyncze pole edycyjne na podstawie definicji,

`AutoEditor` – edytor całego obiektu (modelu) na podstawie definicji:

```vue
<auto-editor
  :definition="eventDefinition"
  v-model="editable"
  :rootValue="editable"
  i18n="event."
/>
```

W przykładzie z `speed-dating/front/src/pages/events/[event]/edit.vue`:

- `eventDefinition` pochodzi z `api.services.speedDating.models.Event`
- `editable` jest synchronizowane z widokiem i akcją poprzez `synchronized`

#### `ModelEditor`, `ModelView`, `ModelSingle`

Te komponenty łączą:

- definicję modelu
- widoki i akcje (DAO)
- generowane formularze i widoki list/szczegółów

Są używane m.in. w:

- `speed-dating/front/src/pages/events/[event]/surveys.vue` (`ModelEditor` dla ankiet)
- `family-tree` – ekrany ustawień i edytory szablonów

### Flow od modelu do CRUD

1. **Definicja modelu i akcji** w serwisie po stronie serwera (np. `Event`, `TreeSettings`).
2. **Eksport metadanych** przez Live Change i odczyt przez `@live-change/vue3-ssr` (`api.services[service].models[Model]`).
3. **Auto-form** generuje formularze i widoki:
   - `AutoField` dla pojedynczych pól,
   - `AutoEditor` / `ModelEditor` dla całych obiektów,
   - `ActionForm` / `ActionEditor` dla akcji.

### Przykłady z projektów

#### `family-tree`

- `front/src/components/TreeSettings.vue`:
  - `AutoField` użyty do edycji zagnieżdżonych ustawień (rootPerson, format, marginesy, tło, tytuł)
  - integracja z PrimeVue (Dropdown, Slider, InputNumber) przez sloty
- `front/src/components/marketing/*Editor.vue`:
  - `AutoField`, `editorData` do edycji szablonów i obrazów reklamowych
- `front/src/pages/tree/[tree]/settings.vue`:
  - użycie `editorData` z `@live-change/frontend-auto-form` do spięcia formularza z modelem ustawień

#### `speed-dating`

- `front/src/components/profile/ProfileSettings.vue`:
  - `AutoField` dla pól identyfikacji użytkownika, z własnymi layoutami i walidacją
  - integracja z `synchronized` i serwisem `draft`
- `front/src/pages/events/[event]/edit.vue`:
  - `AutoInput`, `AutoField`, `AutoEditor` do edycji eventu
- `front/src/pages/events/[event]/surveys.vue`:
  - `ModelEditor` do edycji ankiet powiązanych z eventem

Te pliki są najlepszym odniesieniem, jeśli chcesz szybko zobaczyć, jak układa się flow od modelu do działającego CRUD-a.

