import { getCurrentInstance, onUnmounted } from 'vue'
import { live as d3live, fetch as d3fetch, RangeBuckets } from '@live-change/dao-vue3'
import { InboxReader } from '@live-change/dao'

function useApi(context) {
  context = context || getCurrentInstance().appContext
  return context.config.globalProperties.$lc
}

function usePath(context) {
  return useApi(context).fetch
}

function useView(context) {
  return useApi(context).view
}

function useActions(context) {
  return useApi(context).actions
}

function useLive(path, context) {
  return d3live(useApi(context), path)
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
    context = getCurrentInstance().appContext
  } = options
  const api = useApi(context)
  return new InboxReader((position, bucketSize) => {
    const path = pathFunction(position, bucketSize)
    console.log("OBSERVE PATH", path)
    return api.observable(path)
  }, callback, start, bucketSize)
}

function useClient(context) {
  return useApi(context).client
}

function useUid(context) {
  return useApi(context).uid
}

function serviceDefinition(service, context = getCurrentInstance().appContext) {
  const api = useApi(context)
  return [...api.metadata.api.value.services].find(x => x.name === service)
}

// backward compatibility
const api = useApi
const path = usePath
const live = useLive
const fetch = useFetch
const view = useView
const actions = useActions
const client = useClient
const uid = useUid

export {
  usePath, useLive, useFetch, useApi, useView, useActions, useUid, useClient,
  path, live, fetch, api, view, actions, uid, client,
  rangeBuckets, reverseRange,
  inboxReader,
  serviceDefinition
}
