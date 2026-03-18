---
description: List entities accessible via access control views (myAccessibleObjects, myAccessesByObjectType, invitations, roles)
---

# Skill: live-change-frontend-accessible-objects (Claude Code)

Use this skill when you need to **list entities accessible to the current user** using the access-control service:

- objects with `entity` access control (not simple `userItem` relations),
- objects the user has roles on via `accessControl_setAccess` / `accessControl_setPublicAccess`,
- invitations to objects,
- role-filtered lists of accessible objects.

This skill complements:

- backend skill `live-change-design-actions-views-triggers` (how to grant access and enable indexes),
- frontend skills `live-change-frontend-data-views` and `live-change-frontend-page-list-detail`.

## When to use

- You want **all objects of a given type** that the current user can access (not just those they created).
- You are building a list like “My companies”, “My projects”, “Events I can join”.
- You already grant access through access-control triggers (owner / member / reader roles).
- The objects are **entities** with access control, not simple `userItem` / `itemOf` relations.

If you simply need “records owned by user”, prefer the `userItem` / `itemOf` relation patterns from `live-change-design-models-relations`. Use this skill when access is controlled by roles in the access-control service.

---

## Step 1 – Understand the views you can use

There are two main ways to list accessible objects on the frontend.

### 1. Indexed pipeline (requires `indexed: true` on access-control)

Enabled when the access-control service is configured with:

```js
// app.server/app.config.js (service config)
{
  name: 'accessControl',
  createSessionOnUpdate: true,
  contactTypes,
  indexed: true
}
```

Then the following views become available (from `access-control-service/indexes.js`):

- `myAccessibleObjects({ objectType?, ...range })`
- `myAccessibleObjectsByRole({ role, objectType?, ...range })`
- `accessibleObjects(...)` / `accessibleObjectsByRole(...)` – admin-only variants with explicit `sessionOrUserType` + `sessionOrUser`
- `objectAccesses({ objectType, object, role?, ...range })` – list owners/roles for a specific object

Use these when you want:

- “all my accessible objects of type X” (`myAccessibleObjects` with `objectType`),
- “all my objects where I have role Y” (`myAccessibleObjectsByRole` with `role`),
- admin tools for inspecting who has access to what (`accessibleObjects`, `objectAccesses`).

### 2. Non-indexed views (always available)

Even without `indexed: true`, `view.js` provides:

- `myAccessesByObjectType({ objectType, ...range })`
- `myAccessesByObjectTypeAndRole({ objectType, role, ...range })`
- `myAccessInvitationsByObjectType({ objectType, ...range })`
- `myAccessInvitationsByObjectTypeAndRole({ objectType, role, ...range })`

Use these when:

- you need invitations in addition to accepted accesses,
- the project has not enabled `indexed: true` yet,
- you are building paginated lists with `<RangeViewer>` based on access entries.

**Object type format:** always `serviceName_ModelName` (for example `company_Company`, `speedDating_Event`).

---

## Step 2 – Simple list with `myAccessibleObjects` (indexed)

This is the most convenient way to list all entities of one type accessible to the current user, when indexes are enabled.

Example: list companies the user can access (similar to auto-firma `companies/index.vue`):

```vue
<route>
  { "name": "companies", "meta": { "signedIn": true } }
</route>

<template>
  <div class="container mx-auto p-4">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">{{ t('companies.list.title') }}</h1>
      <Button :label="t('companies.list.addButton')" icon="pi pi-plus"
              @click="router.push({ name: 'companiesNew' })" />
    </div>

    <Card v-if="!accessibleCompanies?.length">
      <template #content>
        <p class="text-center text-gray-500">
          {{ t('companies.list.empty') }}
        </p>
      </template>
    </Card>

    <div class="grid gap-4">
      <Card v-for="accessible in accessibleCompanies" :key="accessible.id"
            class="cursor-pointer hover:shadow-md transition-shadow">
        <template #content>
          <div class="flex items-center justify-between">
            <div>
              <div class="text-lg font-semibold">{{ accessible.company.name }}</div>
              <div class="text-sm text-gray-500">
                {{ t('companies.list.nipLabel') }} {{ accessible.company.nip }}
              </div>
            </div>
            <router-link :to="{ name: 'company', params: { company: accessible.company.id } }">
              <Button :label="t('companies.list.details')"
                      icon="pi pi-arrow-right" severity="secondary" />
            </router-link>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { live, usePath, useClient } from '@live-change/vue3-ssr'
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Button from 'primevue/button'
import Card from 'primevue/card'

const router = useRouter()
const path = usePath()
const client = useClient()
const { t } = useI18n()

const accessibleCompaniesPath = computed(() =>
  client.value.user
    ? path.accessControl.myAccessibleObjects({ objectType: 'company_Company' })
        .with(accessible =>
          path.company.company({ company: accessible.object }).bind('company')
        )
    : null
)

const [accessibleCompanies] = await Promise.all([
  live(accessibleCompaniesPath)
])
</script>
```

Key points:

- **Guard with `client.value.user`** so that unauthenticated users do not try to load the view.
- Pass `objectType: 'service_Model'`, e.g. `'company_Company'`.
- Use `.with()` to hydrate each access entry with the full entity (`accessible.object` → `company`).

---

## Step 3 – Paginated list with `myAccessesByObjectType` + `RangeViewer`

When you want an infinite scroll or very large lists, use the non-indexed range views and `<RangeViewer>` (see also `live-change-frontend-range-list` and `speed-dating/front/src/pages/events/index.vue`).

Example: “My events” with invitations and accepted accesses:

```vue
<template>
  <div class="w-full max-w-6xl">
    <div class="w-full" v-if="anyInvitations?.length">
      <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow-sm p-4 mt-4">
        <div class="text-2xl font-medium text-surface-800 dark:text-surface-50">
          {{ t('event.invitations.title') }}
        </div>
      </div>
      <range-viewer :pathFunction="myEventsInvitationsPathRange" key="invitations"
                    :canLoadTop="false" canDropBottom
                    loadBottomSensorSize="4000px" dropBottomSensorSize="3000px">
        <template #empty>
          <div class="text-xl text-surface-800 dark:text-surface-50 my-4 mx-4">
            {{ t('event.invitations.noEventsFound') }}
          </div>
        </template>
        <template #default="{ item: invitation }">
          <EventCard :event="invitation.event" class="my-2" />
        </template>
      </range-viewer>
    </div>

    <div class="w-full">
      <div class="bg-surface-0 dark:bg-surface-900 rounded-border shadow-sm p-4 mt-4">
        <div class="text-2xl font-medium text-surface-800 dark:text-surface-50">
          {{ t('event.yourEvents') }}
        </div>
      </div>
      <range-viewer :pathFunction="myEventsAccessesPathRange" key="myEvents"
                    :canLoadTop="false" canDropBottom
                    loadBottomSensorSize="4000px" dropBottomSensorSize="3000px">
        <template #empty>
          <div class="text-xl text-surface-800 dark:text-surface-50 my-4 mx-4">
            {{ t('event.invitations.noEventsFound') }}
          </div>
        </template>
        <template #default="{ item: access }">
          <EventCard :event="access.event" class="my-2" />
        </template>
      </range-viewer>
    </div>
  </div>
</template>

<script setup>
import EventCard from '../../components/events/EventCard.vue'
import { RangeViewer } from '@live-change/vue3-components'

import { usePath, live, useClient, reverseRange } from '@live-change/vue3-ssr'
import { useI18n } from 'vue-i18n'

const path = usePath()
const client = useClient()
const { t } = useI18n()

function myEventsAccessesPathRange(range) {
  return path.accessControl.myAccessesByObjectType({
    objectType: 'speedDating_Event',
    ...reverseRange(range)
  }).with(access =>
    path.speedDating.event({ event: access.object }).bind('event')
  )
}

function myEventsInvitationsPathRange(range) {
  return path.accessControl.myAccessInvitationsByObjectType({
    objectType: 'speedDating_Event',
    ...reverseRange(range)
  }).with(invitation =>
    path.speedDating.event({ event: invitation.object }).bind('event')
  )
}

const anyInvitationsPath = myEventsInvitationsPathRange({ limit: 1 })

const [anyInvitations] = await Promise.all([
  live(anyInvitationsPath)
])
</script>
```

Notes:

- `myAccessesByObjectType` returns access entries with `objectType`, `object`, `role`, etc.
- You hydrate each access with the real entity using `.with(...)`.
- `<RangeViewer>` takes a `pathFunction(range)` that must handle `gt` / `lt` / `limit` (here we use `reverseRange(range)` from `@live-change/vue3-ssr`).

---

## Step 4 – Add invitations next to accepted accesses

Invitations are separate records that share the same `objectType` / `object` fields. To show invitations together with accepted accesses:

1. Use `myAccessInvitationsByObjectType` (and optionally `...ByObjectTypeAndRole`) for pending invites.
2. Use `myAccessesByObjectType` (and optionally `...ByObjectTypeAndRole`) for accepted access.
3. Display them in separate sections or merge in the UI.

Example outline:

```js
function myObjectsAccessesPathRange(range) {
  return path.accessControl.myAccessesByObjectType({
    objectType: 'myService_MyEntity',
    ...reverseRange(range)
  }).with(access =>
    path.myService.myEntity({ entity: access.object }).bind('entity')
  )
}

function myObjectsInvitationsPathRange(range) {
  return path.accessControl.myAccessInvitationsByObjectType({
    objectType: 'myService_MyEntity',
    ...reverseRange(range)
  }).with(invitation =>
    path.myService.myEntity({ entity: invitation.object }).bind('entity')
  )
}
```

Use two `<RangeViewer>` blocks or one section with two lists, depending on UX.

---

## Step 5 – Filter by role with `myAccessibleObjectsByRole`

When indexes are enabled, you can query only objects where the current user has a specific role (for example `owner`, `admin`, `member`).

Example:

```js
import { computed } from 'vue'
import { usePath, useClient, live } from '@live-change/vue3-ssr'

const path = usePath()
const client = useClient()

const ownerProjectsPath = computed(() =>
  client.value.user
    ? path.accessControl.myAccessibleObjectsByRole({
        role: 'owner',
        objectType: 'project_Project'
      }).with(accessible =>
        path.project.project({ project: accessible.object }).bind('project')
      )
    : null
)

const [ownerProjects] = await Promise.all([
  live(ownerProjectsPath)
])
```

Use this pattern for:

- “Projects I own” vs. “Projects where I am a member”.
- “Companies where I am accountant” vs. general access.

---

## Step 6 – Admin tools with `accessibleObjects` and `objectAccesses`

For administrative UIs you may need to:

- list all objects accessible to a given user,
- list all users who have access to a specific object and their roles.

Use these views (available when `indexed: true`):

- `accessibleObjects({ sessionOrUserType, sessionOrUser, objectType?, ...range })`
- `accessibleObjectsByRole({ sessionOrUserType, sessionOrUser, role, objectType?, ...range })`
- `objectAccesses({ objectType, object, role?, ...range })`

Important:

- These views require **admin** role (checked in `indexes.js`).
- `sessionOrUserType` is `'user_User'` for users or `'session_Session'` for anonymous sessions.
- `sessionOrUser` is the user id or session id.

Example skeleton for an admin panel:

```js
const usersProjectsPath = computed(() =>
  client.value.roles.includes('admin')
    ? path.accessControl.accessibleObjectsByRole({
        sessionOrUserType: 'user_User',
        sessionOrUser: inspectedUserId,
        role: 'member',
        objectType: 'project_Project'
      }).with(accessible =>
        path.project.project({ project: accessible.object }).bind('project')
      )
    : null
)
```

---

## Summary

| Need | View | Notes |
|---|---|---|
| All entities of one type I can access | `myAccessibleObjects({ objectType })` | Requires `indexed: true`, simplest pattern |
| All entities where I have specific role | `myAccessibleObjectsByRole({ role, objectType? })` | Use for “owner”, “member”, etc. |
| Paginated “my X” list without indexes | `myAccessesByObjectType` + `<RangeViewer>` | Always available, hydrate with `.with()` |
| Pending invitations | `myAccessInvitationsByObjectType` | Often shown in a separate section |
| Admin: what objects a user can access | `accessibleObjects` / `accessibleObjectsByRole` | Requires admin role, explicit user id |
| Admin: who has access to object | `objectAccesses` | Good for audit / sharing dialogs |

Remember:

- `objectType` is always `service_Model`.
- For relations like `userItem`, use relation-based views instead; this skill is for **access-control based entities**.
