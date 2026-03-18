---
name: live-change-frontend-page-list-detail
description: Build list and detail pages with live data, computed paths, .with() and useClient
---

# Skill: live-change-frontend-page-list-detail (Claude Code)

Use this skill when you need to build a **list + detail** UI in Vue 3 / PrimeVue / Tailwind for a LiveChange backend.

## When to use

- You are adding a new list page (devices, orders, etc.).
- You are adding a detail page for a single object.
- You want to follow the `live(path)` + `Promise.all` pattern compatible with SSR.

## Step 1 – List page (`src/pages/<resource>/index.vue`)

1. Create the file: `src/pages/<resource>/index.vue`.
2. In the `<template>`, follow this layout:
   - container with padding (`container mx-auto p-4`),
   - header with title and “add” button,
   - empty-state card,
   - grid of cards or rows.

Example:

```vue
<template>
  <div class="container mx-auto p-4">
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Devices</h1>
      <Button label="Add" icon="pi pi-plus" @click="openDialog" />
    </div>

    <Card v-if="devices.value?.length === 0">
      <template #content>
        <p class="text-center text-gray-500">
          No devices yet
        </p>
      </template>
    </Card>

    <div class="grid gap-4">
      <Card v-for="device in devices.value" :key="device.id">
        <template #content>
          <!-- device content -->
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { path, live, api as useApi } from '@live-change/vue3-ssr'
import Button from 'primevue/button'
import Card from 'primevue/card'

const api = useApi()

const [devices] = await Promise.all([
  live(path().deviceManager.myUserDevices({}))
])

function openDialog() {
  // open dialog for creating a new device
}
</script>

<route>
  { "name": "devices", "meta": { "signedIn": true } }
</route>
```

## Step 2 – Detail page (`src/pages/<resource>/[id].vue`)

1. Create `src/pages/<resource>/[id].vue`.
2. In `script setup`:
   - use `useRoute()` to get the id (`route.params.id`),
   - fetch the main object and related data using `Promise.all`.

Example skeleton:

```vue
<template>
  <div class="container mx-auto p-4 space-y-4" v-if="item.value">
    <Card>
      <template #title>
        {{ item.value.name }}
      </template>
      <template #content>
        <!-- details -->
      </template>
    </Card>
  </div>
</template>

<script setup>
import { path, live } from '@live-change/vue3-ssr'
import { useRoute } from 'vue-router'
import Card from 'primevue/card'

const route = useRoute()
const id = route.params.id

const [item] = await Promise.all([
  live(path().myService.myUserItem({ item: id }))
])
</script>

<route>
  { "name": "myItem", "meta": { "signedIn": true } }
</route>
```

## Step 3 – Computed paths with reactive parameters

When the path depends on reactive values (route params, props), wrap it in `computed()`:

```js
import { computed, unref } from 'vue'
import { usePath, live } from '@live-change/vue3-ssr'
import { useRoute } from 'vue-router'

const path = usePath()
const route = useRoute()
const deviceId = route.params.device

const devicePath = computed(() => path.deviceManager.myUserDevice({ device: unref(deviceId) }))
const connectionsPath = computed(() =>
  path.deviceManager.deviceOwnedDeviceConnections({ device: unref(deviceId) })
)

const [device, connections] = await Promise.all([
  live(devicePath),
  live(connectionsPath),
])
```

## Step 4 – Attach related objects with `.with()`

Use `.with()` to load related data alongside each item:

```js
const devicesPath = computed(() =>
  path.deviceManager.myUserDevices({})
    .with(device => path.deviceManager.deviceState({ device: device.id }).bind('state'))
    .with(device => path.userIdentification.identification({
      sessionOrUserType: device.ownerType,
      sessionOrUser: device.owner
    }).bind('ownerProfile'))
)

const [devices] = await Promise.all([live(devicesPath)])
```

Access in template: `device.state?.online`, `device.ownerProfile?.firstName`.

## Step 5 – Auth guard with `useClient`

Use `useClient()` to conditionally show UI or load data based on authentication:

```js
import { useClient } from '@live-change/vue3-ssr'

const client = useClient()

// Conditional path (null = no fetch)
const adminDataPath = computed(() =>
  client.value.roles.includes('admin') && path.deviceManager.allDevices({})
)
const [adminData] = await Promise.all([live(adminDataPath)])
```

Template:

```vue
<Button v-if="client.roles.includes('admin')" label="Admin panel" />
<div v-if="!client.user">
  <p>Please sign in</p>
  <router-link :to="{ name: 'user:signIn' }">Sign in</router-link>
</div>
```

## Step 6 – Status tags and simple indicators

1. Use PrimeVue `Tag` for status fields.
2. Map statuses to severities (`success`, `secondary`, etc.).

Example:

```vue
<Tag
  :value="conn.status"
  :severity="conn.status === 'online' ? 'success' : 'secondary'"
/>
```

## Step 7 – Large lists with RangeViewer

For large or infinite-scroll lists, use `<RangeViewer>` instead of loading everything at once. See the `live-change-frontend-range-list` skill for details.

