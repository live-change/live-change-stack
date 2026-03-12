---
title: @live-change/vue3-ssr
---

## @live-change/vue3-ssr

Pakiet `@live-change/vue3-ssr` dostarcza **warstwę API dla Vue 3** nad Live Change DAO oraz narzędzia do SSR:

- **client API** – obiekt `$lc` z widokami, akcjami, modelami i konfiguracją klienta
- **hooki Vue** – `useApi`, `usePath`, `useLive`, `useFetch`, `useViews`, `useActions`, `useClient`, `useUid`
- **SSR i prerender** – cache DAO na serwerze i na kliencie, prefetch tras
- **metadane** – `api.metadata` z definicjami usług, modeli, widoków i klienta

Ten pakiet jest używany w każdej aplikacji frontendowej opartej o Live Change (np. `family-tree`, `speed-dating`).

### Podstawowe pojęcia

- **DAO** – warstwa danych Live Change (observable views, commands, metadata)
- **API** – instancja klasy `Api` owinięta nad DAO
- **Path** – ścieżka DAO opisująca widok (`[service, view, params]`)
- **SSR cache** – dane wstrzykiwane z serwera do klienta, aby uniknąć podwójnych fetchy

### Użycie hooków w komponentach

Najczęściej używane hooki:

- `useApi()` – dostęp do `$lc` (klienta, configu, metadanych)
- `usePath()` – generowanie ścieżek widoków i akcji
- `useLive(path)` – żywe obserwowanie widoku (reaktywny wynik)
- `useActions()` – wywoływanie akcji jako metod

Przykład minimalnej integracji w komponencie:

```javascript
import { computed } from 'vue'
import { useApi, usePath, useLive, useActions } from '@live-change/vue3-ssr'

const api = useApi()
const path = usePath()
const actions = useActions()

const userPath = computed(() => path.user.profile({ user: api.client.value.user }))
const user = await useLive(userPath)

async function saveProfile(changes) {
  await actions.user.updateProfile({ ...changes })
}
```

### Metadane i definicje usług

`vue3-ssr` pobiera metadane API i generuje wygodne struktury:

- `api.services[serviceName].actions[...].definition`
- `api.services[serviceName].views[...].definition`
- `api.services[serviceName].models[... ]`
- `api.services[serviceName].config` – konfiguracja klienta usługi

Możesz np. pobrać definicję modelu:

```javascript
import { useApi } from '@live-change/vue3-ssr'

const api = useApi()
const eventDefinition = api.services.speedDating.models.Event
```

### Synchronizacja czasu

`useTimeSynchronization()` zapewnia spójny czas między serwerem a przeglądarką:

```javascript
import { currentTime } from '@live-change/frontend-base'
import { useTimeSynchronization } from '@live-change/vue3-ssr'

const timeSync = useTimeSynchronization()
const serverTime = timeSync.localToServerComputed(currentTime)
```

### Przykłady z projektów

- `family-tree/front/src/App.vue`:
  - użycie `useApi`, `usePath`, `useActions`, `live` do zgody na regulaminy i analitykę
- `speed-dating/front/src/App.vue`:
  - użycie `useClient`, `useApi`, `usePath`, `live` do identyfikacji użytkownika i zgód

Te projekty są dobrym źródłem „żywych” przykładów korzystania z `@live-change/vue3-ssr` w złożonych aplikacjach SSR.

