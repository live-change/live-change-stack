---
title: Frontend – Best practices and patterns
---

# Frontend – Best practices and patterns

This chapter gathers best practices and patterns that apply to all Live Change frontend apps.

## Code conventions

- **Indentation**: 2 spaces.
- **JavaScript**: no semicolons at end of line.
- **Comments**: only where the code is not self-explanatory (intent, trade-offs).

## Project structure

- keep server and frontend logic separate (`server/` vs `front/`),
- app configuration is **shared**:
  - `server/app.config.js` – services and their options
  - `server/services.list.js` – service definitions
- the frontend should:
  - use `vue3-ssr` to work with the DAO
  - use `vue3-components` and `frontend-auto-form` instead of hand-writing duplicate forms.

## Data reads vs commands

- Load and display data (including previews and computed fields) with **views** — `live` / `useFetch` on paths from `usePath()`, not with `api.command`.
- Use **commands** (`api.command` / `useActions`) only when the user intent is to **change** persisted state.
- Details: [Logic and data layer – Reads vs writes](04-logic-and-data-layer.md#reads-vs-writes-cqrs-like).

## Model-to-screen flow

Recommended pattern for any new CRUD screen:

1. **On the server**: define the model (`models`) and actions (`actions`) in the service.
2. **On the frontend**:
   - get definitions via `useApi()` (`api.services[service].models[Model]` / `actions[Action].definition`),
   - use `synchronized` for editable data,
   - render the form with `AutoField` / `AutoEditor` / `ModelEditor`.
3. **Validation**:
   - base it on the definition validation (server-side),
   - add minimal UI-only validation only for things the server can't know (e.g. auto-prefixing `https://`).

## Reusability

- if you see the same form in several places – extract it into a component.
- if data logic repeats – extract it into a composable (e.g. `useArticle`, `useProfileSettings`).
- avoid copying "raw" definitions – always get them from `useApi()`.

## SSR and UX

- use SSR (`ssrDev`, `serveAll`) in production to:
  - shorten time to first paint,
  - improve SEO,
  - keep server and client in sync.
- use SPA modes (`*:spa`) where SSR is unnecessary (e.g. internal tools).

## Forms and CRUDs

- prefer auto-form (`frontend-auto-form`) for:
  - settings screens,
  - admin panels,
  - forms based on models.
- build forms manually (field by field with `AutoField`) only where the UI is unusual or needs very custom validation logic.
- avoid hand-writing inputs for things the server definition already knows – `AutoEditor` derives the right widget automatically.

## Analytics and privacy

- always:
  - model user consent (e.g. `agreement` service),
  - respect consent in analytics integrations,
  - emit events via `analytics` from `vue3-components`.

## How to start new screens

Checklist:

1. Does the model/action exist on the server?
2. Are model/action definitions available via `useApi()`?
3. Can the form be built with `AutoEditor`? If not, use `AutoField` per field.
4. What data needs to be synced (`synchronized`) and when should it be saved?
5. Should drafts be used (user-facing multi-step form) or direct autosave (admin panel)?
6. What analytics events are worth emitting?
