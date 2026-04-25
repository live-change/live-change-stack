# Raport prac zadaniowych (I-III 2026)

## Cel i metoda

Raport przygotowano na podstawie:
- `raport_prac.md` (lista commitów),
- historii `git log` dla okresu 2026-01-01 do 2026-03-31.

W zestawieniu nacisk położono na realne prace twórcze w kodzie (nowe moduły, nowe pliki, istotne poprawki logiki, testów i dokumentacji technicznej), a nie na same commity wydaniowe `v0.9.x` i masowe podbicia wersji zależności.

## Styczeń 2026

### 1) Poprawki logiki edytora auto-form
- Zakres: korekty działania logiki edytora i powiązań relacji.
- Kluczowe pliki:
  - `frontend/frontend-auto-form/front/src/logic/editorData.js`
  - `framework/framework/lib/processors/accessControl.js`
  - `framework/relations-plugin/src/pluralRelationUtils.js`
- Commity: `f8f57cc63`

### 2) Poprawki lokalizacji i przepływów logowania/rejestracji
- Zakres: poprawne przechwytywanie locale i przekazywanie ustawień językowych w ekranach auth.
- Kluczowe pliki:
  - `framework-vue3/vue3-components/logic/locale.js`
  - `services/locale-settings-service/index.js`
  - `frontend/user-frontend/front/src/message-auth/email/ConnectEmail.vue`
  - `frontend/user-frontend/front/src/message-auth/email/SignInEmail.vue`
  - `frontend/user-frontend/front/src/message-auth/sms/ConnectSms.vue`
- Commity: `69c3fdb8d`

### 3) Usprawnienia i18n w `user-frontend`
- Zakres: rozszerzenie/poprawa tłumaczeń i komunikatów w modułach logowania, konta i integracji.
- Kluczowe pliki:
  - `frontend/user-frontend/front/locales/en.json`
  - `frontend/user-frontend/front/locales/pl.json`
  - `frontend/user-frontend/front/src/sign/GoogleAuth.vue`
  - `frontend/user-frontend/front/src/sign/LinkedinAuth.vue`
  - `frontend/user-frontend/front/src/password/ResetPasswordForm.vue`
- Commity: `384ccf1eb`, `9c8a60e65`, `9046a5c84`, `f7d6b1af4`

### 4) Poprawki auth SMS / Google + UX formularzy
- Zakres: poprawki błędów obsługi SMS (connect/send), obsługa przypadku already connected dla Google auth, korekty formularzy.
- Kluczowe pliki:
  - `frontend/user-frontend/front/src/message-auth/sms/ConnectSms.vue`
  - `services/phone-service/render.js`
  - `frontend/user-frontend/front/src/sign/GoogleAuthReturn.vue`
  - `framework-vue3/vue3-components/form/DefinedForm.vue`
- Commity: `f6cb704db`, `38ddf52bb`, `f7d6b1af4`, `bd0d6206e`

### 5) Zmiany serwisowe: cron/access control + telemetry
- Zakres: poprawki kontroli dostępu dla cron i aktualizacja integracji telemetry.
- Kluczowe pliki:
  - `services/access-control-service/access.js`
  - `services/access-control-service/accessControl.js`
  - `services/cron-service/interval.js`
  - `services/cron-service/schedule.js`
  - `framework/server/lib/setupTelemetry.js`
- Commity: `b2667f686`, `014234736`

## Luty 2026

### 1) Utworzenie nowego modułu `feedback-service` i integracja frontu
- Zakres: implementacja nowego serwisu feedback + routing i widok formularza e-mail po stronie frontendu.
- Nowe pliki:
  - `services/feedback-service/config.js`
  - `services/feedback-service/definition.js`
  - `services/feedback-service/feedback.js`
  - `services/feedback-service/index.js`
  - `frontend/user-frontend/front/src/feedback/email/FeedbackEmail.vue`
  - `frontend/user-frontend/front/src/feedback/routes.js`
- Commity: `51d5a5956`

### 2) Poprawki SSR i obsługi błędów w frontendzie
- Zakres: korekty obsługi błędów renderowania SSR i przebiegu startowego aplikacji.
- Kluczowe pliki:
  - `frontend/frontend-base/main.js`
  - `frontend/frontend-base/server-entry.js`
  - `services/email-service/auth.js`
  - `services/email-service/config.js`
- Commity: `b1ba21e8d`, `6de2ccd7b`

### 3) Nowy komponent infrastrukturalny UI: `LoadingWorkingZone`
- Zakres: stworzenie komponentu łączącego stany ładowania i pracy.
- Kluczowe pliki:
  - `framework-vue3/vue3-components/logic/LoadingWorkingZone.vue`
  - `framework-vue3/vue3-components/logic/index.js`
- Commity: `daf7f8e7e`

### 4) Rozbudowa śledzenia błędów logiki (`app.logicError`)
- Zakres: wdrożenie mechanizmu lepszego raportowania błędów logiki w frameworku i wielu serwisach.
- Kluczowe pliki:
  - `framework/framework/lib/App.js`
  - `framework/framework/lib/processors/accessControl.js`
  - `dao/dao/index.js`
  - `services/access-control-service/accessControl.js`
  - `services/google-authentication-service/connect.js`
- Commity: `51b8f0ba4`

### 5) Utworzenie nowego modułu `codemirror-service`
- Zakres: start implementacji backendowego serwisu edytora (CM6).
- Nowe pliki:
  - `services/codemirror-service/definition.js`
  - `services/codemirror-service/index.js`
  - `services/codemirror-service/model.js`
- Commity: `c69a6df1e`

### 6) Dokumentacja techniczna backendu (nowy zestaw rozdziałów)
- Zakres: przygotowanie i publikacja kompletnego opisu architektury serwerowej (modele, akcje, widoki, triggery, relacje, bezpieczeństwo, taski).
- Nowe pliki (przykładowo):
  - `docs/docs/server/01-getting-started.md`
  - `docs/docs/server/05-models.md`
  - `docs/docs/server/06-actions.md`
  - `docs/docs/server/07-views.md`
  - `docs/docs/server/08-triggers.md`
  - `docs/docs/server/14-tasks.md`
- Commity: `cfc969ff1` (+ dalsze rozszerzenia w marcu)

## Marzec 2026

### 1) Utworzenie nowej aplikacji frontendowej `codemirror-frontend`
- Zakres: pełne uruchomienie nowego frontendu edytora (router, SSR entry, komponent edytora, integracja CM6).
- Nowe pliki (wybór):
  - `frontend/codemirror-frontend/front/src/components/Editor.vue`
  - `frontend/codemirror-frontend/front/src/codemirror/RemoteAuthority.js`
  - `frontend/codemirror-frontend/front/src/entry-client.js`
  - `frontend/codemirror-frontend/front/src/entry-server.js`
  - `frontend/codemirror-frontend/front/src/router.js`
  - `frontend/codemirror-frontend/index.js`
- Commity: `51b02ed65`

### 2) Migracja i uruchomienie testów e2e `user-frontend` w TypeScript
- Zakres: przejście z testów `.js` na `.ts`, przygotowanie środowiska uruchomieniowego, poprawki stabilizujące przebieg testów.
- Kluczowe zmiany:
  - dodanie plików testowych `*.test.ts`,
  - usunięcie starych odpowiedników `*.test.js`,
  - dopracowanie helperów kroków testowych i konfiguracji środowiska.
- Kluczowe pliki:
  - `frontend/user-frontend/e2e/signInEmailCode.test.ts`
  - `frontend/user-frontend/e2e/signUpEmailLink.test.ts`
  - `frontend/user-frontend/e2e/steps.ts`
  - `frontend/user-frontend/e2e/env.ts`
- Commity: `256b9491c`, `b0cbd8320`

### 3) Rozszerzenie logiki relacji user/session i autopodstawiania
- Zakres: poprawki i rozwinięcie mechanizmu domyślnych wartości oraz autoaktualizacji relacji użytkownik/sesja.
- Kluczowe pliki:
  - `services/user-service/sessionOrUserItem.js`
  - `services/user-service/sessionOrUserProperty.js`
  - `services/user-service/userItem.js`
  - `services/user-service/userProperty.js`
  - `services/session-service/sessionItem.js`
- Commity: `c3a054ed5`, `59ba60add`

### 4) Poprawki `frontend-auto-form` i UI ikony użytkownika
- Zakres: korekty logiki `editorData`, poprawa stylu i parametryzacji komponentu ikony użytkownika.
- Kluczowe pliki:
  - `frontend/frontend-auto-form/front/src/logic/editorData.js`
  - `frontend/frontend-auto-form/index.js`
  - `frontend/user-frontend/front/src/nav/UserIcon.vue`
- Commity: `4765f2846`, `a6b125009`

### 5) Rozbudowa dokumentacji frontendowej i dalsza dokumentacja serwera
- Zakres: przygotowanie nowej sekcji docs dla frontendu oraz dalsze rozdziały dokumentacji serwera.
- Nowe pliki (wybór):
  - `docs/docs/frontend/01-getting-started.md`
  - `docs/docs/frontend/03-ssr-and-routing.md`
  - `docs/docs/frontend/05-forms-and-auto-form.md`
  - `docs/docs/frontend/09-api-vue3-components.md`
  - `docs/docs/frontend/12-describe-command.md`
  - `docs/docs/server/06b-events.md`
- Commity: `59ba60add`, `4765f2846`, `a6b125009`

## Podsumowanie ilościowe (kod + dokumentacja)

- **Styczeń 2026:** 24 commity, 168 modyfikowanych plików, 0 nowych plików.
- **Luty 2026:** 20 commitów, 193 modyfikowane pliki, 39 nowych plików.
- **Marzec 2026:** 14 commitów, 227 modyfikowanych plików, 120 nowych plików, 16 usuniętych plików (głównie stare testy JS zastąpione TS).

## Uwagi do zastosowania księgowego / prawno-autorskiego

- Powyższe pozycje można traktować jako kandydatów na odrębne dzieła (nowe moduły, nowe komponenty, nowe testy e2e, dokumentacja techniczna, istotne zmiany logiki domenowej).
- Commity wydaniowe `v0.9.175`–`v0.9.201` zostały pominięte jako pozycje techniczne/release.
- W wielu commitach występują równolegle masowe aktualizacje wersji pakietów (`package.json`) — nie były one podstawą kwalifikacji dzieł.
