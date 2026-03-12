---
title: API – @live-change/vue3-ssr
---

# API – @live-change/vue3-ssr

Concise API reference for the main parts of `@live-change/vue3-ssr`.

## Hooks

### useApi(context?)

Returns the main API object (`$lc`), containing:

- `views`, `actions`, `models`, `services`
- `metadata` (API, version, client config)
- `client` – client data (user, session, roles)

### usePath(context?)

Returns a `fetch`/`path` function that:

- builds view / action paths:

```javascript
const path = usePath()

const profilePath = path.userIdentification.myIdentification()
const articlePath = path.blog.article({ article: articleId })
```

### useViews(), useActions()

Shortcuts to the view and action namespaces:

```javascript
const views = useViews()
const actions = useActions()

const path = views.blog.article({ article: articleId })
await actions.blog.updateArticle({ article: articleId, ...changes })
```

### useLive(path, context?, onUnmountedCb?)

Reactive observation of a DAO view (uses `dao-vue3`):

- `path` – path (`[service, view, params]` or `Path`)

Returns a `Ref` to the data.

### useFetch(path, context?)

One-off fetch of a view (PROMISE), useful in composables.

### useClient(), useUid(), useTimeSynchronization()

- `useClient()` – client (user, session, roles, config)
- `useUid()` – id generator
- `useTimeSynchronization()` – syncs time between server and client

## Api class – selected methods

The `Api` class in `Api.js` is used by the hooks.

Main pieces:

- `setup(settings)` – cache, SSR configuration
- `preFetch()` – prefetch global paths
- `preFetchRoute(route, router)` – prefetch for a route (from `reactivePreFetch`)
- `command(method, args)` – call an action (`[service, action]`, params)

### Metadata and definitions

`api.metadata.api.value` holds service metadata:

- `services` – list of services (`name`, `actions`, `views`, `models`, `clientConfig`)

From this are generated:

- `api.views[service][view]`
- `api.actions[service][action]`
- `api.models[service][model]`

and helper methods:

- `getServiceDefinition(name)`
- `getViewDefinition(service, view)`
- `getModelDefinition(service, model)`
- `getActionDefinition(service, action)`
