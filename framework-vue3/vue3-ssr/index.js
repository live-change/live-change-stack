import { getCurrentInstance, onUnmounted, ref, computed, unref } from 'vue'
import { live as d3live, fetch as d3fetch, RangeBuckets } from '@live-change/dao-vue3'
import { InboxReader } from '@live-change/dao'

function useApi(context) {
  context = context || getCurrentInstance().appContext
  return context.config.globalProperties.$lc
}

function usePath(context) {
  return useApi(context).fetch
}

function useViews(context) {
  return useApi(context).views
}

function useActions(context) {
  return useApi(context).actions
}

function useLive(path, context, onUnmountedCb) {
  return d3live(useApi(context), path, onUnmountedCb)
}

function useFetch(path, context) {
  return d3fetch(useApi(context), path)
}

async function rangeBuckets(pathFunction, options, app = getCurrentInstance()) {
  const lc = useApi(app?.appContext)
  const extendedPathFunction = (range) => pathFunction(range, lc.fetch)
  const buckets = new RangeBuckets(lc, extendedPathFunction, options)
  if(app) {
    onUnmounted(() => {
      buckets.dispose()
    })
  } else {
    console.error("live fetch outside component instance - possible memory leak")
  }
  await buckets.wait()
  return {
    buckets: buckets.buckets,
    loadTop: () => buckets.loadTop(),
    loadBottom: () => buckets.loadBottom(),
    dropTop: () => buckets.dropTop(),
    dropBottom: () => buckets.dropBottom(),
    canLoadTop: () => buckets.isTopLoadPossible(),
    canLoadBottom: () => buckets.isBottomLoadPossible(),
    freeze: () => buckets.freeze(),
    unfreeze: () => buckets.unfreeze(),
    changed: buckets.changed
  }
}

async function rangeBucketsRaw(pathFunction, options, app = getCurrentInstance()) {
  const lc = useApi(app?.appContext)
  const extendedPathFunction = (range) => pathFunction(range, lc.fetch)
  const buckets = new RangeBuckets(lc, extendedPathFunction, options)
  if(app) {
    onUnmounted(() => {
      buckets.dispose()
    })
  } else {
    console.error("live fetch outside component instance - possible memory leak")
  }
  await buckets.wait()
  return buckets
}

function reverseRange(range) {
  return {
    gt: range.lt,
    gte: range.lte,
    lt: range.gt === '' ? '\xFF\xFF\xFF\xFF' : range.gt,
    lte: range.gte,
    limit: range.limit,
    reverse: !range.reverse
  }
}

function inboxReader(pathFunction, callback, start = '', options = {}) {
  const {
    bucketSize = 32,
    context = getCurrentInstance().appContext,
    idField = 'id',
    positionFilter = (n, curr) => n > curr
  } = options
  const api = useApi(context)
  return new InboxReader((position, bucketSize) => {
    const path = pathFunction(position, bucketSize)
    console.log("OBSERVE PATH", path)
    return api.observable(path)
  }, callback, start, bucketSize, idField, positionFilter)
}

function useClient(context) {
  return useApi(context).client
}

function useUid(context) {
  return useApi(context).uid
}

function useTimeSynchronization(context, onUnmountedCb) {
  if(typeof window === 'undefined') return { // on server we use current server time
    waitForSynchronized: () => Promise.resolve(),
    diff: ref(0),
    synchronized: ref(true),
    serverToLocal: (ts) => ts,
    localToServer: (ts) => ts,
    serverToLocalComputed: (ts) => ts,
    localToServerComputed: (ts) => ts,
  }
  const api = useApi(context)
  const timeSynchronization = api.settings.timeSynchronization
  if(!timeSynchronization) throw new Error("Time synchronization not configured")
  if(!onUnmountedCb && typeof window != 'undefined') {
    if(getCurrentInstance()) {
      onUnmountedCb = onUnmounted
    } else {
      onUnmountedCb = () => {
        console.error("live fetch outside component instance - possible memory leak")
      }
    }
  }
  const diffRef = ref(timeSynchronization.timeDiffObservable.getValue())
  const observer = {
    set(value) {
      diffRef.value = value
    }
  }
  timeSynchronization.timeDiffObservable.observe(observer)
  const synchronizedRef = ref(timeSynchronization.synchronizedObservable.getValue())
  const synchronizedObserver = {
    set(value) {
      synchronizedRef.value = value
    }
  }
  timeSynchronization.synchronizedObservable.observe(synchronizedObserver)
  onUnmountedCb(() => {
    timeSynchronization.timeDiffObservable.unobserve(observer)
    timeSynchronization.synchronizedObservable.unobserve(synchronizedObserver)
  })
  return {
    waitForSynchronized: () => timeSynchronization.readyPromise,
    diff: computed(() => diffRef.value),
    synchronized: computed(() => synchronizedRef.value),
    serverToLocal: (ts) => unref(ts) - diffRef.value,
    localToServer: (ts) => unref(ts) + diffRef.value,
    serverToLocalComputed: (ts) => computed(() => unref(ts) - diffRef.value),
    localToServerComputed: (ts) => computed(() => unref(ts) + diffRef.value),
  }
}

function serviceDefinition(service, context = getCurrentInstance().appContext) {
  const api = useApi(context)
  return [...api.metadata.api.value.services].find(x => x.name === service)
}

export function getId(object) {
  return object.to ?? object.id
}

// backward compatibility
const api = useApi
const path = usePath
const live = useLive
const fetch = useFetch
const view = useViews
const actions = useActions
const client = useClient
const uid = useUid

export {
  usePath, useLive, useFetch, useApi, useViews, useActions, useUid, useClient, useTimeSynchronization,
  path, live, fetch, api, view, actions, uid, client,
  rangeBuckets, rangeBucketsRaw, reverseRange,
  inboxReader,
  serviceDefinition
}
