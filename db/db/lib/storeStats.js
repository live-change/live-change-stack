export function unavailableStoreStat() {
  return {
    available: false,
    entryCount: null,
    usedBytes: null
  }
}

export function readStoreStat(store) {
  if(!store || typeof store.stat !== 'function') return unavailableStoreStat()
  try {
    const stat = store.stat()
    if(!stat || !stat.available) return unavailableStoreStat()
    return stat
  } catch(e) {
    return unavailableStoreStat()
  }
}

export function combineStoreStats(dataStat, opLogStat = null) {
  const data = dataStat || unavailableStoreStat()
  const opLog = opLogStat
  const dataBytes = data.available ? (data.usedBytes || 0) : 0
  const opLogBytes = opLog && opLog.available ? (opLog.usedBytes || 0) : 0
  const entryCount = data.available ? data.entryCount : null
  return {
    data,
    opLog,
    entryCount,
    usedBytes: (data.available || (opLog && opLog.available))
      ? dataBytes + opLogBytes
      : null
  }
}
