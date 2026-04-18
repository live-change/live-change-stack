<template>
  <component :is="tag" ref="rootEl">
    <div
      v-if="showPlaceholder"
      class="reactive-range-viewer-placeholder"
      :style="{ minHeight: `${placeholderHeight}px` }"
    />
    <RangeViewer
      v-else-if="currentBuckets"
      :key="viewerKey"
      v-bind="forwardedViewerProps"
      :buckets="currentBuckets"
      v-on="forwardedListeners"
    >
      <template v-for="(_, slotName) in slots" #[slotName]="slotProps">
        <slot :name="slotName" v-bind="slotProps" />
      </template>
    </RangeViewer>
  </component>
</template>

<script setup>
  import { computed, onBeforeUnmount, ref, useAttrs, useSlots, watch } from 'vue'
  import { useElementSize } from '@vueuse/core'
  import { rangeBuckets } from '@live-change/vue3-ssr'
  import RangeViewer from './RangeViewer.vue'

  const props = defineProps({
    pathFunction: {
      type: Function,
      required: true
    },
    sourceKey: {
      default: undefined
    },
    preserveHeightOnReload: {
      type: Boolean,
      default: false
    },
    reloadOnPathFunctionChange: {
      type: Boolean,
      default: false
    },
    bucketSize: {
      type: Number,
      default: 20
    },
    initialPosition: {
      type: String,
      default: undefined
    },
    softClose: {
      type: Boolean,
      default: false
    },
    canLoadTop: {
      type: Boolean,
      default: true
    },
    canDropTop: {
      type: Boolean,
      default: false
    },
    canLoadBottom: {
      type: Boolean,
      default: true
    },
    canDropBottom: {
      type: Boolean,
      default: false
    },
    loadTopSensorSize: {
      type: String,
      default: '500px'
    },
    loadBottomSensorSize: {
      type: String,
      default: '500px'
    },
    dropTopSensorSize: {
      type: String,
      default: '5000px'
    },
    dropBottomSensorSize: {
      type: String,
      default: '5000px'
    },
    loadTopDelay: {
      type: Number,
      default: 200
    },
    loadBottomDelay: {
      type: Number,
      default: 200
    },
    dropTopDelay: {
      type: Number,
      default: 200
    },
    dropBottomDelay: {
      type: Number,
      default: 200
    },
    frozen: {
      type: Boolean,
      default: false
    },
    tag: {
      type: String,
      default: 'div'
    }
  })

  const attrs = useAttrs()
  const slots = useSlots()

  const rootEl = ref(null)
  const { height } = useElementSize(rootEl)

  const currentBuckets = ref(null)
  const showPlaceholder = ref(false)
  const placeholderHeight = ref(0)
  const viewerKey = ref(0)
  let currentReloadToken = 0

  const forwardedViewerProps = computed(() => ({
    bucketSize: props.bucketSize,
    initialPosition: props.initialPosition,
    softClose: props.softClose,
    canLoadTop: props.canLoadTop,
    canDropTop: props.canDropTop,
    canLoadBottom: props.canLoadBottom,
    canDropBottom: props.canDropBottom,
    loadTopSensorSize: props.loadTopSensorSize,
    loadBottomSensorSize: props.loadBottomSensorSize,
    dropTopSensorSize: props.dropTopSensorSize,
    dropBottomSensorSize: props.dropBottomSensorSize,
    loadTopDelay: props.loadTopDelay,
    loadBottomDelay: props.loadBottomDelay,
    dropTopDelay: props.dropTopDelay,
    dropBottomDelay: props.dropBottomDelay,
    frozen: props.frozen,
    tag: props.tag
  }))

  const forwardedListeners = computed(() => {
    const listeners = {}
    for(const [key, value] of Object.entries(attrs)) {
      if(key.startsWith('on')) listeners[key] = value
    }
    return listeners
  })

  async function buildBuckets() {
    return await rangeBuckets(
      (range, p) => props.pathFunction(range, p),
      {
        bucketSize: props.bucketSize,
        initialPosition: props.initialPosition,
        softClose: props.softClose
      }
    )
  }

  async function reloadBuckets() {
    const token = ++currentReloadToken
    if(props.preserveHeightOnReload) {
      placeholderHeight.value = Math.max(height.value || 0, 1)
      showPlaceholder.value = true
    }
    const newBuckets = await buildBuckets()
    if(token !== currentReloadToken) {
      newBuckets.dispose?.()
      return
    }
    currentBuckets.value?.dispose?.()
    currentBuckets.value = newBuckets
    viewerKey.value++
    showPlaceholder.value = false
  }

  watch(
    () => props.sourceKey,
    async () => {
      await reloadBuckets()
    },
    { immediate: true }
  )

  watch(
    () => props.pathFunction,
    async () => {
      if(!props.reloadOnPathFunctionChange) return
      await reloadBuckets()
    }
  )

  onBeforeUnmount(() => {
    currentBuckets.value?.dispose?.()
  })
</script>

<style scoped>
  .reactive-range-viewer-placeholder {
    width: 100%;
  }
</style>
