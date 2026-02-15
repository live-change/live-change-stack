---
title: Server Manual
---

# Server manual

This manual documents the **server-side** part of the Live Change framework: how to start an application, define services, and implement models, actions, views, triggers, relations, tasks, cron, timers, and messaging.

## Stack

- **Framework** (`@live-change/framework`) — App, service definitions, models, actions, views, triggers, indexes
- **Server** (`@live-change/server`) — CLI starter, SSR server, API (WebSocket/SockJS), DB setup
- **Relations plugin** (`@live-change/relations-plugin`) — propertyOf, itemOf, propertyOfAny, itemOfAny, boundTo, relatedTo
- **User service** — userProperty, userItem, sessionOrUserProperty, sessionOrUserItem, contactOrUserProperty, contactOrUserItem
- **Simple query** (`@live-change/simple-query`) — declarative queries over multiple models (WIP)
- **Task / Cron / Timer / Email / Phone services** — background tasks, scheduled jobs, one-shot or repeating timers, email and SMS

## Contents

1. [Getting started](/server/01-getting-started.html) — Entry point, start.js, app.config, services.list, starter; dev/ssr/api modes; env vars
2. [App config](/server/02-app-config.html) — app.config structure, services array, clientConfig, remote
3. [Services list and init](/server/03-services-list-and-init.html) — Importing services, wiring modules, init script and seed data
4. [Service definition](/server/04-service-definition.html) — createServiceDefinition, name, use (dependencies)
5. [Models](/server/05-models.html) — Bare models, properties, indexes, entity; objectType/object convention
6. [Actions](/server/06-actions.html) — definition.action, execute, emit, triggerService, client
7. [Views](/server/07-views.html) — definition.view, daoPath, get/observable, range and index paths
8. [Triggers](/server/08-triggers.html) — definition.trigger, reacting to events, triggerService
9. [Relations](/server/09-relations.html) — Overview of all relation types
   - [propertyOf and itemOf](/server/09-01-propertyOf-itemOf.html)
   - [propertyOfAny and itemOfAny](/server/09-02-propertyOfAny-itemOfAny.html)
   - [userProperty and userItem](/server/09-03-userProperty-userItem.html)
   - [sessionOrUserProperty and sessionOrUserItem](/server/09-04-sessionOrUserProperty-sessionOrUserItem.html)
   - [contactOrUserProperty and contactOrUserItem](/server/09-05-contactOrUserProperty-contactOrUserItem.html)
   - [boundTo and relatedTo](/server/09-06-boundTo-relatedTo.html)
10. [Simple query](/server/10-simple-query.html) — simpleQuery(definition), sources, code, id (WIP)
11. [Indexes and foreign models](/server/11-indexes-and-foreign-models.html) — indexes in models, foreignModel, rangePath in views
12. [Security and access](/server/12-security-and-access.html) — accessControl, security.config, roles
13. [Custom services in project](/server/13-custom-services-in-project.html) — Local service folders, definition + models/actions/views, registration
14. [Tasks](/server/14-tasks.html) — task-service: defining and running background tasks
15. [Cron and intervals](/server/15-cron-and-intervals.html) — cron-service: Schedule and Interval, triggers
16. [Timers](/server/16-timers.html) — timer-service: createTimer, cancelTimer, one-shot and repeating
17. [Email and SMS](/server/17-email-and-sms.html) — Sending email and SMS via triggers; rendering (frontend) note
