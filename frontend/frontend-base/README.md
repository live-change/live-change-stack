---
title: @live-change/frontend-base
---

## @live-change/frontend-base

`@live-change/frontend-base` to **wspólna baza dla aplikacji frontendowych** Live Change:

- standardowa konfiguracja Vite, Tailwind, PrimeVue
- entrypointy klienta i serwera
- komponenty bazowe (`ViewRoot`, `Page`, `UpdateBanner`, `ComponentDialog`)
- helpery czasu, odpowiedzi SSR, lokalizacji

Pakiet jest używany m.in. przez:

- `@live-change/frontend-template`
- aplikacje jak `family-tree`, `speed-dating` (przez swoje własne `front/src` + config)

### Struktura pakietu

Najważniejsze pliki:

- `index.js` – eksporty głównych komponentów i helperów
- `client-entry.js` – entrypoint SPA/klienta SSR
- `server-entry.js` – entrypoint SSR
- `main.js` – wspólna logika tworzenia aplikacji Vue
- `ViewRoot.vue`, `Page.vue`, `UpdateBanner.vue`, `ComponentDialog.vue`
- `locales/*.json` – podstawowe tłumaczenia
- `time.js`, `response.js`, `host.js`, `lezer.js` – helpery

### Komponent `ViewRoot`

`ViewRoot` jest kontenerem layoutu aplikacji:

```vue
<template>
  <view-root>
    <template #navbar>
      <NavBar />
      <UpdateBanner />
    </template>
  </view-root>
</template>

<script setup>
  import { ViewRoot, UpdateBanner } from '@live-change/frontend-base'
  import NavBar from './components/NavBar.vue'
</script>
```

W projektach:

- `speed-dating/front/src/App.vue` – `ViewRoot` + nawigacja, baner identyfikacji użytkownika, `UpdateBanner`
- `family-tree/front/src/App.vue` – `ViewRoot` z nagłówkiem i banerem aktualizacji

### `UpdateBanner`

`UpdateBanner` informuje użytkownika o nowej wersji frontendu (wykrywany mismatch wersji z `vue3-ssr`):

- integruje się z metadanymi wersji z Live Change
- pokazuje nienachalny komunikat o konieczności odświeżenia

### Entry client/server

`client-entry.js` i `server-entry.js` implementują spójny sposób tworzenia aplikacji:

- rejestracja globalnych komponentów
- integracja z `@live-change/vue3-ssr` i DAO
- konfiguracja routera i i18n

W typowym projekcie bazującym na `frontend-template` nie musisz ich ruszać – dostajesz gotowy SSR/SPA flow.

### Czas i helpery

- `currentTime` z `time.js` – reaktywny czas używany m.in. z `useTimeSynchronization` (`vue3-ssr`)
- `response.js` – helper do odpowiedzi SSR
- `host.js` – helper do adresu hosta w środowiskach SSR

### Integracja z i18n i tematami

`frontend-base` dostarcza bazowe tłumaczenia (np. komunikaty ogólne, layout), które następnie są scalane z tłumaczeniami modułów w plikach `front/src/config.js` w projektach (`deepmerge` z `baseLocales` i innymi).

