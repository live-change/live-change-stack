---
title: Views
---

# Views

Views are defined with **definition.view({ name, properties, returns, daoPath | get | observable | fetch })**. They expose read-only data to the client.

## View types (choose one)

Each view must use exactly one of these variants:

| Variant | When to use |
| --- | --- |
| `daoPath` | Data stored in the framework DB (preferred). The framework auto-generates both `get` and `observable` from `daoPath`. |
| `get` + `observable` | External or custom reactive data source (eg. WebSocket client, RPC stream). **Both are required together.** |
| `fetch` | Remote, non-reactive request/response data (eg. GeoIP). Often paired with `remote: true`. |

Important rule:

- If you write a view with `get`, you must also implement `observable` (and vice versa). Do not define only one of them. Use `daoPath` instead when the data comes from the DAO.

## View with daoPath to model path (topUp)

Single object by id; accessControl restricts to owner:

```javascript
// Source: live-change-stack/services/billing-service/topUp.js

definition.view({
  name: "topUp",
  properties: {
    topUp: { type: TopUp }
  },
  returns: { type: TopUp },
  accessControl: {
    roles: ['owner'],
    objects: (props) => [{
      objectType: definition.name + '_TopUp',
      object: props.topUp
    }]
  },
  async daoPath({ topUp }, { client, service }, method) {
    return TopUp.path(topUp)
  }
})
```

## View with daoPath and index (myReceivedCardsByState)

List by owner and optional state using a sorted index; owner comes from client:

```javascript
// Source: speed-dating/server/business-card-service/card.js

definition.view({
  name: "myReceivedCardsByState",
  properties: {
    state: { type: String, options: ['received', 'accepted', 'rejected', 'blocked'] },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: { type: ReceivedCard }
  },
  async daoPath(params, { client, service }) {
    const range = App.extractRange(params)
    const { state } = params
    const [sessionOrUserType, sessionOrUser] = client.user
      ? ['user_User', client.user]
      : ['session_Session', client.session]
    if(state) {
      return ReceivedCard.sortedIndexRangePath('byOwnerAndStateAndTime', [
        sessionOrUserType, sessionOrUser,
        state
      ], range)
    } else {
      return ReceivedCard.sortedIndexRangePath('byOwnerAndStateAndTime', [
        sessionOrUserType, sessionOrUser
      ], range)
    }
  }
})
```

## Views with rangePath and index paths (scan)

- **rangePath** — Full range over a model (e.g. blocks, transactions).
- **path(id)** — Single entity by id.
- **indexObjectPath(indexName, key)** — Single object by index key.
- **sortedIndexRangePath(indexName, keyPrefix, range)** — Sorted range from an index (e.g. byParticipants).

```javascript
// Source: ipi-web/scan/server/scan-service/view.js (excerpts)

definition.view({
  name: 'blocks',
  properties: { ...App.rangeProperties },
  returns: { type: Array, of: { type: Block } },
  async daoPath(props, { client, context }) {
    return Block.rangePath(App.extractRange(props))
  }
})

definition.view({
  name: 'blockByHeight',
  properties: { height: { type: Number, validation: ['nonEmpty', 'integer'] } },
  returns: { type: Block },
  async daoPath(props, { client, context }) {
    return Block.path(blockId(props.height))
  }
})

definition.view({
  name: 'transactionByHash',
  properties: { hash: { type: String, validation: ['nonEmpty'] } },
  returns: { type: Transaction },
  async daoPath(props, { client, context }) {
    return Transaction.indexObjectPath('byHash', props.hash)
  }
})

definition.view({
  name: 'transactionsByParticipant',
  properties: {
    participant: { type: String, validation: ['nonEmpty'] },
    ...App.rangeProperties
  },
  returns: { type: Array, of: { type: Transaction } },
  async daoPath(props, { client, context }) {
    return Transaction.sortedIndexRangePath('byParticipants', [props.participant],
      App.extractRange(props))
  }
})
```

## View with get and observable (external data)

When data is not stored in the framework DB (e.g. blockchain balance), use **get** and **observable** instead of daoPath:

```javascript
// Source: ipi-web/scan/server/scan-service/view.js

definition.view({
  name: 'balance',
  properties: {
    address: { type: String, validation: ['nonEmpty'] },
    denom: { type: String, validation: ['nonEmpty'] }
  },
  returns: { type: String },
  async get({ address, denom }, { client, context }) {
    return await getBalance(address, denom)
  },
  async observable({ address, denom }, { client, context }) {
    return await getBalanceObservable(address, denom)
  }
})
```

### Anti-pattern: `get` without `observable` (do not do this)

This will break reactive usage and can also break processors (eg. access control) that wrap both methods.

```javascript
definition.view({
  name: 'example',
  properties: {
    id: { type: String }
  },
  returns: { type: Object },
  async get({ id }) {
    return await SomeModel.get(id)
  }
})
```

## View with fetch (remote, non-reactive)

Use `fetch` when you want a one-shot remote response (no reactive observable stream). Example:

```javascript
// Source: live-change-stack/services/geoip-service/geoip.js
definition.view({
  name: 'myCountry',
  properties: {},
  returns: { type: String },
  remote: true,
  async fetch(props, { client }) {
    return await getGeoIp(client.ip)
  }
})
```

## Helpers

- **App.rangeProperties** — Standard range params (e.g. gt, gte, lt, lte, limit, reverse).
- **App.extractRange(props)** — Builds range object from props for rangePath / sortedIndexRangePath.
