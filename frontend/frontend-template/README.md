---
title: @live-change/frontend-template
---

## @live-change/frontend-template

`@live-change/frontend-template` to **szablon kompletnej aplikacji frontendowej** Live Change:

- gotowy SSR + SPA oparty o `@live-change/frontend-base` i `@live-change/vue3-ssr`
- zintegrowane moduły: `user-frontend`, `security`, `content`, `blog`, `task`, `upload`, `url`, `video-call`, `peer-connection`, `auto-form` i inne
- standardowa struktura katalogów i skrypty `package.json`

Szablon jest punktem startowym dla nowych projektów (np. `family-tree`, `speed-dating` zostały na nim oparte).

### Najważniejsze zależności

W `package.json` szablonu znajdziesz m.in.:

- `@live-change/frontend-base`
- `@live-change/frontend-auto-form`
- `@live-change/vue3-components`
- `@live-change/vue3-ssr`
- frontendy: `user-frontend`, `access-control-frontend`, `content-frontend`, `image-frontend`, `task-frontend`, `upload-frontend`, `url-frontend`, `wysiwyg-frontend`, `blog-frontend`, `video-call-frontend`, `peer-connection-frontend`

### Skrypty uruchomieniowe

Typowe skrypty (uproszczony przegląd):

- `memDev` / `localDev` / `dev` – tryby deweloperskie z różną konfiguracją DB
- `ssrDev` – dev SSR
- `serveAll` / `serveAllMem` – produkcyjny SSR z API i usługami
- `apiServer`, `devApiServer`, `memApiServer` – warianty samego API
- `build`, `build:client`, `build:ssr`, `build:server`, `build:spa` – budowanie frontu i serwera
- `prerender*` – generowanie statycznych stron

Są one spójne z opisem w dokumentacji serwera (`server/01-getting-started.md`).

### Struktura projektu na bazie szablonu

Typowy projekt zaczynający z `frontend-template` ma:

- `server/app.config.js` – lista usług i konfiguracja klienta
- `server/services.list.js` – eksport definicji usług
- `server/start.js` – start CLI (opisany w dokumentacji serwera)
- `front/src` – kod frontendu:
  - `App.vue`
  - `router.js`
  - `config.js` (i18n, tematy, integracje)
  - `pages/*` – strony routingu (`vite-plugin-pages`)
  - `components/*` – komponenty wspólne

W `front/src/config.js` łączysz lokalizacje `frontend-base`, `frontend-auto-form` i innych modułów, podobnie jak w:

- `family-tree/front/src/config.js`
- `speed-dating/front/src/config.js`

### Praca z szablonem

Typowy flow tworzenia nowej aplikacji:

1. Tworzysz nowy pakiet oparty o `@live-change/frontend-template` (lub kopiujesz repo).
2. Aktualizujesz `server/app.config.js` i `server/services.list.js`, aby włączyć tylko potrzebne usługi.
3. Dostosowujesz `front/src/config.js` (temat, i18n, integracje analityki).
4. Tworzysz nowe strony w `front/src/pages` oraz komponenty w `front/src/components`.
5. Korzystasz z:
   - `@live-change/vue3-ssr` do pracy z DAO,
   - `@live-change/vue3-components` do logiki i formularzy,
   - `@live-change/frontend-auto-form` do CRUD-ów.

Dokładny „manual” tego flow znajdzie się w sekcji `frontend/01-getting-started.md` dokumentacji.

### E2E starter (node:test + Playwright)

Szablon zawiera przykładowy zestaw E2E w katalogu `e2e/`:

- `env.ts` - lazy start `TestServer` i `disposeTestEnv()`
- `withBrowser.ts` - lifecycle przeglądarki per test
- `e2eSuite.ts` - wrapper `describe` + `after` z finalnym teardown
- `homepage.test.ts`, `client-session.test.ts` - przykładowe testy

Uruchamianie:

```bash
fnm exec -- npm run e2e
fnm exec -- npm run e2e:headed
```

Ważne: nie rejestruj `after(...process.exit(...))` w `e2e/env.ts`. Finalny `process.exit(0)` powinien być tylko w `e2eSuite.ts`.

