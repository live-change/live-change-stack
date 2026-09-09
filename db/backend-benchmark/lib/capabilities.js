export const BACKEND_NAMES = ['lmdb', 'memory', 'leveldb', 'memdown', 'rocksdb', 'sqlite']

export const BACKEND_ALIASES = {
  mem: 'memory'
}

const LEVEL_CAPS = {
  durable: true,
  countGet: true,
  countObservable: true,
  rangeDelete: true,
  rangeDeleteKeysOnly: true,
  stat: false,
  native: true
}

export const BACKEND_CAPABILITIES = {
  lmdb: {
    durable: true,
    countGet: true,
    countObservable: true,
    rangeDelete: true,
    rangeDeleteKeysOnly: true,
    stat: true,
    native: true
  },
  memory: {
    durable: false,
    countGet: true,
    countObservable: true,
    rangeDelete: true,
    rangeDeleteKeysOnly: false,
    stat: false,
    native: false
  },
  leveldb: { ...LEVEL_CAPS },
  memdown: { ...LEVEL_CAPS, durable: false, native: false },
  rocksdb: { ...LEVEL_CAPS, stat: true },
  sqlite: {
    durable: true,
    countGet: true,
    countObservable: true,
    rangeDelete: true,
    rangeDeleteKeysOnly: true,
    stat: true,
    native: true
  }
}

export function canonicalBackendName(name) {
  return BACKEND_ALIASES[name] || name
}

export function resolveBackends(list) {
  if(!list || list === 'all') return [...BACKEND_NAMES]
  return list.split(',').map(s => s.trim()).filter(Boolean).map(canonicalBackendName)
}

export function capabilitiesFor(backendName) {
  const name = canonicalBackendName(backendName)
  return BACKEND_CAPABILITIES[name] || {
    durable: false,
    countGet: false,
    countObservable: false,
    rangeDelete: true,
    rangeDeleteKeysOnly: false,
    stat: false,
    native: false
  }
}

export function defaultTimeout(suite) {
  if(suite === 'stress') return 120000
  if(suite === 'bench') return 180000
  if(suite === 'durability') return 60000
  if(suite === 'table') return 60000
  return 30000
}
