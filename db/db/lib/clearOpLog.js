function padTimestamp(ts) {
  return ('' + ts).padStart(16, '0')
}

function resolveCutoff(lastTimestamp, now) {
  let cutoff
  if(typeof lastTimestamp === 'number') {
    cutoff = lastTimestamp
  } else if(typeof lastTimestamp === 'string') {
    const parsed = Date.parse(lastTimestamp)
    cutoff = Number.isFinite(parsed) ? parsed : Number(lastTimestamp)
  } else if(lastTimestamp instanceof Date) {
    cutoff = lastTimestamp.getTime()
  } else {
    throw new Error('lastTimestamp is required')
  }
  if(!Number.isFinite(cutoff)) throw new Error('invalid lastTimestamp')
  if(cutoff > now) throw new Error('cannot clear oplog in the future')
  return Math.min(cutoff, now)
}

function createOpLogWritter(store) {
  let lastTime = Date.now()
  let lastId = 0
  return function(operation) {
    const now = Date.now()
    if(now === lastTime) {
      lastId ++
    } else {
      lastId = 0
      lastTime = now
    }
    const id = padTimestamp(lastTime) + ':' + (('' + lastId).padStart(6, '0'))
    store.put({ id, timestamp: lastTime, operation })
    return id
  }
}

function writeClearOpLogMarker(opLog, writter, fromId, deleteBeforeStr) {
  const w = writter || createOpLogWritter(opLog)
  const logId = w({
    type: 'clearOpLog',
    from: fromId,
    to: deleteBeforeStr
  })
  return Promise.resolve(opLog.rangeGet({ gt: '', limit: 1 })).then(rows => {
    const opLogNewStart = rows[0]
    if(opLogNewStart) {
      opLog.put({
        id: logId,
        operation: {
          type: 'clearOpLog',
          from: fromId,
          to: opLogNewStart.id
        }
      })
    }
    return logId
  })
}

async function clearOpLogStore(opLog, lastTimestamp, limit, opLogWritter = null, options = {}) {
  const keysOnly = options.keysOnly === true
  const writeMarker = options.writeMarker !== false
  const now = Date.now()
  const deleteBefore = resolveCutoff(lastTimestamp, now)
  const deleteBeforeStr = padTimestamp(deleteBefore)
  const writter = opLogWritter || createOpLogWritter(opLog)

  const opLogStart = (await opLog.rangeGet({ gt: '', limit: 1 }))[0]
  if(!opLogStart) return { count: 0, last: "\xFF\xFF\xFF\xFF" }
  // Nothing older than cutoff — do not write a clearOpLog marker.
  if(opLogStart.id >= deleteBeforeStr) {
    return { count: 0, last: "\xFF\xFF\xFF\xFF" }
  }

  const removedStats = await opLog.rangeDelete({
    lt: deleteBeforeStr,
    limit
  }, { keysOnly })

  if(!removedStats.count) {
    return removedStats
  }

  if(!writeMarker) {
    return {
      ...removedStats,
      from: opLogStart.id,
      deleteBeforeStr,
      markerDeferred: true
    }
  }

  await writeClearOpLogMarker(opLog, writter, opLogStart.id, deleteBeforeStr)
  return removedStats
}

export {
  clearOpLogStore,
  createOpLogWritter,
  writeClearOpLogMarker,
  resolveCutoff,
  padTimestamp
}
