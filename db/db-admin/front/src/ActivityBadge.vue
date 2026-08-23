<template>
  <Tag
    class="ml-2"
    :severity="severity"
    :value="label"
    v-tooltip.top="tooltipText"
  />
</template>

<script setup>
  import { computed } from 'vue'
  import Tag from 'primevue/tag'
  import { api } from '@live-change/vue3-ssr'
  import { live } from '@live-change/dao-vue3'

  const props = defineProps({
    kind: {
      type: String,
      required: true // table | index | log
    },
    dbApi: {
      type: String,
      required: true
    },
    dbName: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    indexStatus: {
      type: String,
      default: null
    },
    indexError: {
      type: String,
      default: null
    },
    failedOn: {
      type: Object,
      default: null
    }
  })

  const dao = api().source
  const viewName = props.kind === 'table'
    ? 'tableActivity'
    : (props.kind === 'index' ? 'indexActivity' : 'logActivity')

  const activity = await live(dao, {
    what: [props.dbApi, viewName, props.dbName, props.name]
  })

  const severity = computed(() => {
    const value = activity.value || {}
    if(props.indexStatus === 'sleeping' || value.error) return 'danger'
    if(value.busy) return 'warn'
    return 'success'
  })

  const label = computed(() => {
    const value = activity.value || {}
    if(props.indexStatus === 'sleeping') {
      if(props.failedOn) return `sleeping: ${props.failedOn.type} ${props.failedOn.name}`
      if(props.indexError) return `sleeping: ${props.indexError}`
      return 'sleeping'
    }
    if(value.error) return 'error'
    if(value.busy) {
      return props.kind === 'index' ? 'catching up' : 'writing'
    }
    return 'idle'
  })

  const tooltipText = computed(() => {
    const value = activity.value || {}
    const parts = []
    if(value.error || props.indexError) {
      parts.push(String(value.error || props.indexError))
    }
    if(value.lastKey != null && value.lastKey !== '') {
      parts.push(`lastKey: ${value.lastKey}`)
    }
    return parts.length ? parts.join('\n') : 'no activity yet'
  })
</script>
