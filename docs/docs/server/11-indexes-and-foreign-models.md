---
title: Indexes and foreign models
---

# Indexes and foreign models

**Indexes** on models enable efficient range and lookup views. **Foreign models** let one service reference entities from another service (e.g. user Identification from userIdentification service) and use them in views or simple queries.

## Indexes on a model

Define **indexes** in **definition.model({ indexes: { ... } })**. Each index has a **property** (single key or array of keys) and optionally **multi: true** for multi-value keys (e.g. participants).

```javascript
// Source: speed-dating/server/business-card-service/card.js

const ReceivedCard = definition.model({
  name: "ReceivedCard",
  // ...
  indexes: {
    byOwnerAndStateAndTime: {
      property: ['sessionOrUserType', 'sessionOrUser', 'state', 'givenAt']
    }
  }
})
```

```javascript
// Source: ipi-web/scan/server/scan-service/model.js

const Transaction = definition.model({
  name: 'Transaction',
  properties: { ... },
  indexes: {
    byTime: { property: 'time' },
    byHash: { property: 'hash' },
    byParticipants: { property: 'participants', multi: true },
    byAccSequence: { property: 'accSequence', multi: true },
    // ...
  }
})
```

## Using indexes in views

- **Model.rangePath(range)** — Full range over the model (primary order).
- **Model.path(id)** — Single entity by id.
- **Model.sortedIndexRangePath(indexName, keyPrefix, range)** — Range over an index; keyPrefix is the prefix of the index key (e.g. [sessionOrUserType, sessionOrUser, state] for byOwnerAndStateAndTime).
- **Model.indexObjectPath(indexName, key)** — Single object by exact index key.
- **Model.indexObjectPath(indexName, keyPrefix, { limit, reverse })** — One object from index (e.g. last by participants).

```javascript
// Source: speed-dating/server/business-card-service/card.js

return ReceivedCard.sortedIndexRangePath('byOwnerAndStateAndTime', [
  sessionOrUserType, sessionOrUser,
  state
], range)
```

```javascript
// Source: ipi-web/scan/server/scan-service/view.js

return Transaction.indexObjectPath('byHash', props.hash)

return Transaction.sortedIndexRangePath('byParticipants', [props.participant], App.extractRange(props))

return Transaction.indexObjectPath('byParticipants', [props.participant], { limit: 1, reverse: true })
```

## Foreign models

Use **definition.foreignModel(serviceName, modelName)** to reference a model from another service. You get a proxy that supports path/index access for use in views or in simple-query sources.

```javascript
// Source: speed-dating/server/business-card-service/card.js

const Identification = definition.foreignModel('userIdentification', 'Identification')
```

Then use **Identification** in a simple-query **sources** map or in view logic that needs to read from the userIdentification service.

## Block and custom paths (scan)

When the path is not a simple model path or index path, define helpers (e.g. blockId, blockTransactionsPath) and use them in daoPath:

```javascript
// Source: ipi-web/scan/server/scan-service/view.js

return Block.path(blockId(props.height))
return blockTransactionsPath(props.height, App.extractRange(props))
```

These helpers return DAO paths that the framework resolves to the correct range or object.
