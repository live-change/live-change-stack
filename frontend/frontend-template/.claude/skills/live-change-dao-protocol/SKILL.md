---
description: Jak poprawnie wywoływać akcje i widoki frameworka LiveChange przez surowy protokół DAO.
---

# LiveChange DAO Protocol Arguments

**Dwa protokoły:** (1) **akcje/widoki serwisu** — argumenty jako tablica (poniżej); (2) **baza danych** — ścieżki `['database', operation, dbName, ...]` (`tableRange`, `tableObject`, `put`, `update`, …). Migracje i skrypty DB: `live-change-stack/docs/docs/server/21-database-dao.md`.

Kiedy komunikujesz się z frameworkiem LiveChange używając surowego protokołu `@live-change/dao` (np. z C++, Pythona, Rusta, Go lub dowolnego innego klienta nie-JS), MUSISZ ZAWSZE przekazywać argumenty jako **tablicę** (dotyczy akcji i widoków, nie operacji `database`).

Framework traktuje argumenty żądań (request) i obserwabli (observable) DAO jak argumenty funkcji i używa operatora spread (`...args`), aby przekazać je do bazowych funkcji akcji lub widoków. Jeśli przekażesz obiekt zamiast tablicy, serwer rzuci błąd `TypeError: Spread syntax requires ...iterable[Symbol.iterator] to be a function`.

Nawet jeśli akcja lub widok oczekuje pojedynczego obiektu jako parametru, ten obiekt MUSI być opakowany w jednoelementową tablicę.

## Przykład w C++ (używając nlohmann/json)

### Niepoprawnie ❌
```cpp
nlohmann::json args = {
  {"pairingKey", "123"},
  {"connectionType", "device"}
};
connection->request({"serviceName", "actionName"}, args, settings);
```

### Poprawnie ✅
```cpp
// Wrap the object in an array
auto args = {
  nlohmann::json::object({
    {"pairingKey", "123"},
    {"connectionType", "device"}
  })
};
connection->request({"serviceName", "actionName"}, args, settings);
```

Lub jawnie:
```cpp
nlohmann::json args = nlohmann::json::array({
  nlohmann::json::object({
    {"pairingKey", "123"},
    {"connectionType", "device"}
  })
});
```

Zawsze upewnij się, że Twój payload `args` jest tablicą przed wysłaniem go przez połączenie DAO.
