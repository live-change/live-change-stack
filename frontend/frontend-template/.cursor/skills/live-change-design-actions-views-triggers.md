---
description: Design actions, views, triggers with indexes and batch processing patterns
---

# Skill: live-change-design-actions-views-triggers

Ten skill opisuje **krok po kroku**, jak projektować akcje, widoki i triggery w serwisach LiveChange, korzystając z indeksów i unikając pełnych skanów.

## Kiedy używać

Użyj tego skilla, gdy:

- dodajesz nowe akcje do istniejących modeli,
- tworzysz widoki (szczególnie zakresowe) dla list,
- implementujesz triggery (online/offline, batchowe przetwarzanie, asynchroniczne wyniki).

## 1. Projekt akcji

1. **Określ cel akcji**
   - Czy tworzy/aktualizuje/usunie obiekt?
   - Czy ma czekać na zewnętrzny wynik (np. urządzenie)?

2. **Zdefiniuj `properties`**
   - Każde pole opisane wieloliniowo,
   - tylko to, co faktycznie potrzebne – resztę pobieraj z bazy na podstawie kluczy.

3. **Użyj indeksów do wyszukiwania**
   - Zamiast pełnych skanów, korzystaj z `indexObjectGet` / `indexRangeGet`.

4. **Zwróć sensowny wynik**
   - ID utworzonego obiektu,
   - klucze sesyjne, jeśli trzeba je przechować po stronie klienta,
   - dane potrzebne do dalszych kroków.

### Szkic wzorca

```js
definition.action({
  name: 'someAction',
  properties: {
    someKey: {
      type: String
    }
  },
  async execute({ someKey }, { client, service }) {
    const obj = await SomeModel.indexObjectGet('bySomeKey', { someKey })
    if(!obj) throw new Error('notFound')

    const id = app.generateUid()

    await SomeOtherModel.create({
      id,
      // ...
    })

    return { id }
  }
})
```

## 2. Projekt widoku

1. **Zdecyduj, czy to pojedynczy obiekt czy lista**
   - pojedynczy: użyj `get` lub `indexObjectGet`,
   - lista: użyj `indexRangeGet` z indeksem.

2. **Zdefiniuj `properties` widoku**
   - tylko parametry potrzebne do wyszukiwania,
   - typy zgodne z modelem (String/Number/itp.).

3. **Użyj indeksów**

Przykład widoku zakresowego:

```js
definition.view({
  name: 'myItemsByStatus',
  properties: {
    status: {
      type: String
    }
  },
  async get({ status }, { client, service }) {
    return MyModel.indexRangeGet('byStatus', {
      status
    })
  }
})
```

## 3. Triggery – online/offline

1. **Zidentyfikuj zdarzenie**
   - np. „połączenie online/offline”, „sesja utworzona”, „serwer się uruchomił”.

2. **Zdefiniuj trigger z `properties`**
   - triggery online/offline zwykle potrzebują tylko ID obiektu.

3. **Aktualizuj minimalny zestaw pól**
   - np. `status`, `lastSeenAt`.

Przykład:

```js
definition.trigger({
  name: 'sessionConnectionOnline',
  properties: {
    connection: {
      type: String
    }
  },
  async execute({ connection }, { service }) {
    await Connection.update(connection, {
      status: 'online',
      lastSeenAt: new Date()
    })
  }
})
```

## 4. Triggery batchowe – unikaj pełnych skanów

1. **Ustal limit batcha** (np. 32 lub 128 rekordów).
2. **Wykorzystaj `rangeGet` z `gt: lastId`**
   - inicjalnie `last = ''`,
   - po każdym batchu ustaw `last` na ID ostatniego rekordu.
3. **Kończ, gdy batch jest pusty**.

Przykład:

```js
definition.trigger({
  name: 'allOffline',
  async execute({}, { service }) {
    let last = ''
    while(true) {
      const items = await Connection.rangeGet({
        gt: last,
        limit: 32
      })
      if(items.length === 0) break

      for(const item of items) {
        await Connection.update(item.id, {
          status: 'offline'
        })
      }

      last = items[items.length - 1].id
    }
  }
})
```

## 5. Wzorzec „pending + resolve” dla asynchronicznych wyników

Użyj tego wzorca, gdy:

- akcja tworzy zlecenie/komendę,
- wynik przychodzi później z innego procesu (urządzenie, worker, itp.),
- chcesz, żeby akcja czekała na wynik z timeoutem.

### Kroki

1. Utwórz helper `pendingCommands` (Map) w osobnym module.
2. W akcji tworzącej:
   - utwórz rekord z `status: 'pending'`,
   - wywołaj `waitForCommand(id, timeoutMs)`.
3. W akcji raportującej:
   - zaktualizuj rekord (`status: 'completed'`, `result`),
   - wywołaj `resolveCommand(id, result)`.

### Szkic helpera

```js
const pendingCommands = new Map()

export function waitForCommand(commandId, timeoutMs = 115000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingCommands.delete(commandId)
      reject(new Error('timeout'))
    }, timeoutMs)
    pendingCommands.set(commandId, { resolve, reject, timer })
  })
}

export function resolveCommand(commandId, result) {
  const pending = pendingCommands.get(commandId)
  if(pending) {
    clearTimeout(pending.timer)
    pendingCommands.delete(commandId)
    pending.resolve(result)
  }
}
```

