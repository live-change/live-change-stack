---
title: Simple query
---

# Simple query

**Work in progress.** The API and behavior may change.

---

# Simple query

**Simple query** (`@live-change/simple-query`) lets you define read-only views that join or filter over **multiple sources** (models or foreign models) using a declarative **code** rule. Install the package and add it to your service; then call **simpleQuery(definition)** to create a query factory.

## Setup

```javascript
// Source: speed-dating/server/business-card-service/card.js

import simpleQuery from "@live-change/simple-query"
const query = simpleQuery(definition)
```

## Defining a query (cardsGivenIn)

**sources** — Map of alias → model (or foreign model).  
**returns** — Shape of each returned object (often an object with fields from multiple sources).  
**id** — Function that returns a unique id array for each result row (for ordering/dedup).  
**code** — Array of rules that constrain and join sources (e.g. equality on typed identifiers).  
**view** — Optional view config (e.g. access) for the generated view.

```javascript
// Source: speed-dating/server/business-card-service/card.js

const Identification = definition.foreignModel('userIdentification', 'Identification')

const cardsGivenIn = query({
  name: 'cardsGivenIn',
  properties: {
    givenInType: { type: 'type' },
    givenIn: { type: 'any' },
    ...App.rangeProperties
  },
  sources: {
    receivedCard: ReceivedCard,
    userIdentification: Identification
  },
  returns: {
    type: Array,
    of: {
      type: Object,
      properties: {
        receivedCard: ReceivedCard,
        giverIdentification: Identification,
        receiverIdentification: Identification
      }
    }
  },
  id: ({ receivedCard, giverIdentification, receiverIdentification }) => [receivedCard.givenAt, receivedCard.id],
  code: ({ givenInType, givenIn, ...range }, { receivedCard, userIdentification }) => [
    receivedCard.givenIn.$typed().$equals([givenInType, givenIn]),
    userIdentification.$as('giverIdentification').sessionOrUser.$typed().$equals(receivedCard.giver.$typed()),
    userIdentification.$as('receiverIdentification').sessionOrUser.$typed().$equals(receivedCard.sessionOrUser.$typed())
  ],
  view: {
    access: ['admin']
  }
})
```

## Code rules

- **sourceName.propertyName** — Refers to a property of a source.
- **.$typed()** — Treat the value as a typed identifier (service_Model:id).
- **.$equals(value)** — Equality constraint.
- **.$as(alias)** — Use the same source under another alias (e.g. userIdentification twice as giver and receiver).

The query engine uses these rules to build an index-backed or scan plan and exposes the result as a view (e.g. list of cards with giver and receiver identification, filtered by givenIn and range).

## When to use simple query

Use it when you need a **view that depends on more than one model** (e.g. ReceivedCard + Identification) with equality or range filters. For single-model range or index reads, use a normal **definition.view** with **daoPath** (see [Views](/server/07-views.html)).
