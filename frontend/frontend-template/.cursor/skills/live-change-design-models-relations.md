---
description: Design models with userItem, itemOf, propertyOf relations and access control
---

# Skill: live-change-design-models-relations

Ten skill opisuje **krok po kroku**, jak projektować modele i relacje (`userItem`, `itemOf`, `propertyOf`, `foreignModel`) w serwisach LiveChange.

## Kiedy używać

Użyj tego skilla, gdy:

- dodajesz nowy model do serwisu,
- przenosisz dane z ręcznego CRUD na relacje,
- potrzebujesz spójnego wzorca dla access control i indeksów.

## 1. Dobierz typ relacji

Zastanów się, jak model jest powiązany z resztą domeny:

- **`userItem`** – obiekt należy do zalogowanego użytkownika (np. konto, urządzenie użytkownika).
- **`itemOf`** – lista elementów należy do innego modelu (np. połączenia urządzenia, pozycje zamówienia).
- **`propertyOf`** – pojedyncza właściwość/model ze stanem o ID równym rodzicowi (np. stan kursora, ustawienia).
- **bez relacji** – gdy obiekt jest globalny lub ma inną strukturę (np. globalny config).

Wybierz jedną główną relację na model – dodatkowe powiązania możesz odzwierciedlić polami i indeksami.

## 2. Zdefiniuj `properties` w czytelny sposób

1. Utwórz sekcję `properties`:
   - każdą właściwość zapisuj wieloliniowo,
   - jasno określ typ, domyślne wartości, walidację.

2. Przykład:

```js
properties: {
  name: {
    type: String,
    validation: ['nonEmpty']
  },
  status: {
    type: String,
    default: 'offline'
  },
  capabilities: {
    type: Array,
    of: {
      type: String
    }
  }
}
```

## 3. Skonfiguruj relację

### `userItem`

1. Dodaj blok `userItem` w definicji modelu.
2. Ustaw role dla odczytu i zapisu.
3. Ogranicz `writeableProperties` do pól, które użytkownik może zmieniać.

```js
userItem: {
  readAccessControl: { roles: ['owner', 'admin'] },
  writeAccessControl: { roles: ['owner', 'admin'] },
  writeableProperties: ['name']
}
```

### `itemOf`

1. Ustal model rodzica (`what`).
2. W razie potrzeby użyj `definition.foreignModel`, jeśli rodzic jest w innym serwisie.

```js
itemOf: {
  what: Device,
  readAccessControl: { roles: ['owner', 'admin'] },
  writeAccessControl: { roles: ['owner', 'admin'] }
}
```

### `propertyOf`

1. Użyj, gdy chcesz, żeby ID modelu = ID rodzica.
2. To ułatwia odczyt (`Model.get(parentId)`).

```js
propertyOf: {
  what: Device,
  readAccessControl: { roles: ['owner', 'admin'] },
  writeAccessControl: { roles: ['owner', 'admin'] }
}
```

### `propertyOf` z wieloma rodzicami (1:1 relacja do wielu encji)

Użyj, gdy model ma być „łącznikiem 1:1” pomiędzy kilkoma encjami (np. faktura ↔ kontrahent w konkretnej roli),
żeby generator relacji/CRUD rozumiał, że to jest relacja, a nie pole `someId` w `properties`.

Uwagi:

- Najczęściej jest to 1 lub 2 rodziców, ale lista `propertyOf` może zawierać **dowolnie wiele** modeli (np. relacja łącząca 3+ encje).
- Jeśli encja jest relacją, **nie dodawaj ręcznie** pól typu `...Id` w `properties` tylko po to, żeby “zrobić join” – generator CRUD nie potraktuje tego jako relacji.

Przykład:

```js
const CostInvoice = definition.foreignModel('invoice', 'CostInvoice')
const Contractor = definition.foreignModel('company', 'Contractor')

definition.model({
  name: 'Supplier',
  properties: {
    // opcjonalne pola dodatkowe
  },
  propertyOf: [
    { what: CostInvoice },
    { what: Contractor }
  ]
})
```

### `foreignModel`

1. Na początku pliku z modelem zadeklaruj:

```js
const Device = definition.foreignModel('deviceManager', 'Device')
```

2. Potem używaj `Device` w `itemOf`/`propertyOf`.

## 4. Dodaj indeksy

1. Zidentyfikuj typowe zapytania (np. po `sessionKey`, po `(device, status)`).
2. Dodaj sekcję `indexes`:

```js
indexes: {
  bySessionKey: {
    property: ['sessionKey']
  },
  byDeviceAndStatus: {
    property: ['device', 'status']
  }
}
```

3. Używaj tych indeksów w widokach i akcjach (`indexObjectGet`, `indexRangeGet`).

## 5. Ustal access control na poziomie modelu/relacji

1. Dla `userItem` / `itemOf` / `propertyOf` ustaw zawsze:
   - `readAccessControl`,
   - `writeAccessControl`.

2. Nie zakładaj domyślnych reguł – wpisz je wprost w definicji modelu.

## 6. Sprawdź wygenerowane widoki/akcje

Po dodaniu relacji:

1. Sprawdź, jakie widoki/akcje generuje plugin (np. `myUserDevices`, `createMyUserDevice`, itp.).
2. Zastanów się, czy potrzebujesz dodatkowych, niestandardowych widoków/akcji:
   - jeśli tak, dodaj je, ale **nie duplikuj** tego, co generuje relacja.

