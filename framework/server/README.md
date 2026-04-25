# LiveChange Framework Server

This package provides the server-side implementation of the LiveChange framework.

## DAO Protocol and Arguments

The LiveChange framework uses `@live-change/dao` for communication between the client and the server.
When calling actions or observing views directly via the raw DAO protocol (e.g., from C++, Python, or other non-JS clients), it's important to understand how arguments are passed.

### Arguments as Arrays

The DAO protocol is designed to be a generic RPC/observation protocol. It treats arguments like function arguments, meaning **they must always be passed as an array**, even if the action or view only takes a single object as its parameter.

When the framework processes a DAO request, it uses the spread operator (`...args`) to pass the arguments to the underlying action or view function. If you pass an object instead of an array, the server will attempt to spread the object, resulting in an error like:

```
TypeError: Spread syntax requires ...iterable[Symbol.iterator] to be a function
```

### Example: Calling an Action from C++

If an action `registerDeviceConnection` in the `deviceManager` service expects a single object with `pairingKey`, `connectionType`, and `capabilities`:

**Incorrect (Passing an object):**
```cpp
nlohmann::json args = {
  {"pairingKey", "123"},
  {"connectionType", "device"},
  {"capabilities", {"video"}}
};
// This will fail on the server!
connection->request({"deviceManager", "registerDeviceConnection"}, args, settings);
```

**Correct (Passing an array containing the object):**
```cpp
nlohmann::json args = {
  nlohmann::json::object({
    {"pairingKey", "123"},
    {"connectionType", "device"},
    {"capabilities", {"video"}}
  })
};
// Or explicitly: nlohmann::json::array({ ... })
// This works correctly!
connection->request({"deviceManager", "registerDeviceConnection"}, args, settings);
```

Always ensure that the `args` parameter in your DAO `request` or `observable` calls is an array.
