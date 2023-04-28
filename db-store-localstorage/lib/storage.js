let local
let session

function useWebStorage(storage) {
  return {
    setItem: async (key, value) => Promise.resolve(storage.setItem(key, JSON.stringify(value))),
    getItem: async (key) => {
      const json = storage.getItem(key)
      return Promise.resolve(json && JSON.parse(json))
    },
    removeItem: async (key) => Promise.resolve(storage.removeItem(key)),
    clear: async () => Promise.resolve(storage.clear()),
    set: async (keys) => {
      for(let key in keys) {
        storage.setItem(key, JSON.stringify(keys[key]))
      }
      return Promise.resolve()
    },
    get: async (keys) => {
      if(!keys) {
        const result = {}
        for(let i = 0; i<storage.length; i++) {
          const key = storage.key(i)
          result[key] = JSON.parse(storage.getItem(key))
        }
        return Promise.resolve(result)
      }
      const result = {}
      const keysList = typeof keys == 'string' ? keys : (Array.isArray(keys) ? keys : Object.keys(keys))
      for(let key of keysList) {
        const item = storage.getItem(key)
        result[key] = (item && JSON.parse(item)) ?? (typeof keys == 'object' ? keys[key] : undefined)
      }
      return Promise.resolve(result)
    },
    getValues: async (keys) => {
      if(!keys) {
        const result = new Array(storage.length)
        for(let i = 0; i<storage.length; i++) {
          const key = storage.key(i)
          result[i] = JSON.parse(storage.getItem(key))
        }
        return Promise.resolve(result)
      }
      const result = new Array(keys.length)
      for(let i = 0; i<keys.length; i++) {
        const key = keys[i]
        const item = storage.getItem(key)
        result[i] = (item && JSON.parse(item)) ?? (typeof keys == 'object' ? keys[key] : undefined)
      }
      return Promise.resolve(result)
    },
    getKeys: async () => {
      const result = []
      for(let i = 0; i<storage.length; i++) {
        result.push(storage.key(i))
      }
      return Promise.resolve(result)
    },
    remove: async (keys) => {
      for(let key of keys) {
        storage.removeItem(key)
      }
      return Promise.resolve()
    }
  }
}

function useExtensionStorage(storage) {
  return {
    set: async (keys) => storage.set(keys),
    get: async (keys) => storage.get(keys),
    getValues: async (keys) => Object.values(await storage.get(keys)),
    getKeys: async () => Object.keys(await storage.get()),
    remove: async (keys) => storage.remove(keys),
    clear: async () => storage.clear(),
    setItem: async (key, value) => storage.set({ [key]: value }),
    getItem: async (key) => storage.get(key)[key],
    removeItem: async (key) => storage.remove(key),
  }
}

function useTestStorage() {
  const storage = new Map()
  return {
    setItem: async (key, value) => Promise.resolve(storage.set(key, value)),
    getItem: async (key) => Promise.resolve(storage.get(key)),
    removeItem: async (key) => Promise.resolve(storage.delete(key)),
    clear: async () => Promise.resolve(storage.clear()),
    set: async (keys) => {
      for(let key in keys) {
        storage.set(key, keys[key])
      }
      return Promise.resolve()
    },
    get: async (keys) => {
      if(!keys) {
        const result = {}
        for(let [key, value] of storage) {
          result[key] = value
        }
        return Promise.resolve(result)
      }
      const result = {}
      const keysList = typeof keys == 'string' ? keys : (Array.isArray(keys) ? keys : Object.keys(keys))
      for(let key of keysList) {
        result[key] = storage.get(key) ?? (typeof keys == 'object' ? keys[key] : undefined)
      }
      return Promise.resolve(result)
    },
    getValues: async (keys) => {
      if(!keys) {
        const result = new Array(storage.size)
        let i = 0
        for(let value of storage.values()) {
          result[i++] = value
        }
        return Promise.resolve(result)
      }
      const result = new Array(keys.length)
      for(let i = 0; i<keys.length; i++) {
        const key = keys[i]
        result[i] = storage.get(key) ?? (typeof keys == 'object' ? keys[key] : undefined)
      }
      return Promise.resolve(result)
    },
    getKeys: async () => Promise.resolve(Array.from(storage.keys())),
    remove: async (keys) => {
      for(let key of keys) {
        storage.delete(key)
      }
      return Promise.resolve()
    }
  }
}

if(typeof window == 'undefined') {
  local = useTestStorage()
  session = useTestStorage()
} else {
  let isExtension = false
  if (typeof browser !== "undefined") {
    isExtension = browser.extension
  } {
    if (typeof chrome !== "undefined") {
      window.browser = chrome.extension
    }
  }
  if (isExtension && browser.storage) {
    local = useExtensionStorage(browser.storage.local)
    session = useExtensionStorage(browser.storage.session)
  } else if(typeof window != 'undefined' && window.localStorage && window.sessionStorage) {
    local = useWebStorage(window.localStorage)
    session = useWebStorage(window.sessionStorage)
  } else {
    local = null
    session = null
  }
}

module.exports = { local, session }
