---
title: Frontend Manual
---

# Frontend manual

This manual documents the **frontend** part of the Live Change Framework:

- how to bootstrap frontend apps based on `@live-change/frontend-template`
- how SSR and the client API work (`@live-change/vue3-ssr`)
- how to use `@live-change/vue3-components`
- how to build forms and CRUD screens with `@live-change/frontend-auto-form`

## Frontend stack

- **SSR and client API** (`@live-change/vue3-ssr`) — access to DAO, views, actions, models and metadata
- **Vue 3 components** (`@live-change/vue3-components`) — logic, forms, views, analytics
- **Frontend base** (`@live-change/frontend-base`) — client/server entry, layout, Tailwind, PrimeVue
- **Auto-form** (`@live-change/frontend-auto-form`) — automatic forms and CRUDs based on models
- **Template project** (`@live-change/frontend-template`) — a ready-made app wired to many services

## Contents

1. [Getting started](/frontend/01-getting-started.md) — first frontend app based on `frontend-template`
2. [Project structure](/frontend/02-project-structure.md) — directories, routing, layout, conventions
3. [SSR and routing](/frontend/03-ssr-and-routing.md) — SSR flow, entry points, router
4. [Logic and data layer](/frontend/04-logic-and-data-layer.md) — `vue3-ssr`, `dao-vue3`, logic components
5. [Forms and auto-form](/frontend/05-forms-and-auto-form.md) — forms, CRUDs, `frontend-auto-form`
6. [UI and components](/frontend/06-ui-and-components.md) — integration with PrimeVue, Tailwind, layouts
7. [Analytics and marketing](/frontend/07-analytics-and-marketing.md) — analytics, consent, marketing pages
8. [Best practices and patterns](/frontend/08-best-practices-and-patterns.md) — conventions and patterns
9. [API reference](/frontend/09-api-vue3-components.md) — concise API reference for the main modules
10. [Path and live](/frontend/10-path-and-live.md) — reactive path builder and live subscriptions
11. [Locale and time](/frontend/11-locale-and-time.md) — language, timezone, time utilities, emails
12. [Describe command](/frontend/12-describe-command.md) — discovering views, actions, and models for frontend development
13. [E2E lifecycle pattern](/frontend/13-e2e-lifecycle-pattern.md) — stable node:test teardown with `e2eSuite`, `env`, and `withBrowser`

