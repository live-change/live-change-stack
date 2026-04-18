---
title: @live-change/vue3-components
---

## @live-change/vue3-components

Pakiet `@live-change/vue3-components` dostarcza **zestaw gotowych komponentów Vue 3** zintegrowanych z Live Change:

- komponenty **logiczne** (`logic/*`) – obserwacja danych, strefy ładowania i pracy, analityka
- komponenty **formularzy** (`form/*`) – `DefinedForm`, `CommandForm`, `FormBind`
- komponenty **widoków** (`view/*`) – `ScrollLoader`, `VisibleArea`, `RangeViewer`

W typowej aplikacji rejestrujesz komponenty globalnie:

```javascript
import { createApp } from 'vue'
import { registerComponents } from '@live-change/vue3-components'
import App from './App.vue'

const app = createApp(App)

registerComponents(app, {
  // opcjonalne ustawienia, np. analytics
})

app.mount('#app')
```

### Komponenty logiczne

Najważniejsze komponenty i helpery:

- `Loading`, `LoadingZone`, `LoadingWorkingZone` – spójne wyświetlanie stanów ładowania
- `WorkingZone` – zarządzanie „pracami” (operacjami) i ich błędami
- `Observe` – reaktywne obserwowanie ścieżek DAO
- `analytics`, `useAnalytics`, `installRouterAnalytics` – prosty system zdarzeń analitycznych
- `synchronized`, `synchronizedList` – synchronizacja danych formularzy z widokami/akcjami

Przykład użycia `synchronized` (fragment z `speed-dating`):

```javascript
import { synchronized } from '@live-change/vue3-components'
import { usePath, live, useActions } from '@live-change/vue3-ssr'

const path = usePath()
const actions = useActions()

const eventPath = computed(() => path.speedDating.event({ event }))
const eventData = await live(eventPath)

const synchronizedEvent = synchronized({
  source: eventData,
  update: actions.speedDating.updateEvent,
  identifiers: { event },
  recursive: true,
  autoSave: true,
  debounce: 600
})

const editable = synchronizedEvent.value
```

Przykład użycia `synchronizedList` (fragment z `rcstreamer`):

```javascript
import { synchronizedList } from '@live-change/vue3-components'

const synchronizedAccessesList = synchronizedList({
  source: accesses,
  update: accessControlApi.updateSessionOrUserAndObjectOwnedAccess,
  delete: accessControlApi.resetSessionOrUserAndObjectOwnedAccess,
  identifiers: { object, objectType },
  objectIdentifiers: ({ to, sessionOrUser, sessionOrUserType }) => ({
    access: to, sessionOrUser, sessionOrUserType, object, objectType
  }),
  recursive: true
})

const synchronizedAccesses = synchronizedAccessesList.value
await synchronizedAccessesList.delete(synchronizedAccesses.value[0])
```

`synchronizedList` jest przeznaczony do edycji list elementów (np. role dostępów), gdzie:

- `source` jest tablicą z `live(...)`,
- każdy element ma stabilne `id`,
- `identifiers` przekazuje kontekst wspólny dla listy,
- `objectIdentifiers` mapuje identyfikatory pojedynczego elementu pod akcje backendu.

### Formularze: `DefinedForm`, `CommandForm`, `FormBind`

- **`DefinedForm`** – renderuje formularz na podstawie definicji (np. definicji akcji)
- **`CommandForm`** – integruje formularz bezpośrednio z akcją (wysyła komendę po submit)
- **`FormBind`** – wiąże formularz z metadanymi i walidacją

Przykład prostego formularza opartego o definicję akcji:

```vue
<DefinedForm
  :definition="definition"
  v-model="editable"
  @submit="save"
/>
```

### Widoki: `ScrollLoader`, `VisibleArea`, `RangeViewer`

Komponenty widoków są zintegrowane z DAO i `RangeBuckets`:

- **`ScrollLoader`** – ładowanie kolejnych stron danych przy przewijaniu
- **`VisibleArea`** – reagowanie na widoczność fragmentu DOM
- **`RangeViewer`** – prezentacja danych podzielonych na zakresy

Użycie `ScrollLoader` w typowym widoku listy:

```vue
<scroll-loader :loadMore="loadMore" :canLoadMore="canLoadMore">
  <div v-for="item in items" :key="item.id">
    {{ item.name }}
  </div>
</scroll-loader>
```

### Receptury z projektów

#### `speed-dating` – formularz edycji eventu

Plik `front/src/pages/events/[event]/edit.vue` pokazuje:

- pobranie definicji modelu z `vue3-ssr`
- użycie `synchronized` do auto-zapisu
- `AutoEditor` z `frontend-auto-form` do generowania formularza na bazie modelu

#### `speed-dating` – wizytówka użytkownika

Plik `front/src/components/profile/ProfileSettings.vue`:

- `synchronized` dla draftu wizytówki (`draft` service)
- `AutoField` do mapowania właściwości modelu na pola formularza
- integracja z PrimeVue i własnymi komponentami UI

#### `family-tree` – strefy ładowania i praca na danych

W `family-tree` komponenty z `@live-change/vue3-components` są użyte do:

- synchronizacji identyfikacji użytkownika z analityką
- emisji zdarzeń przez `analytics.emit(...)`

Te przykłady będą opisane szerzej w sekcji „receptur frontendu” w dokumentacji.

