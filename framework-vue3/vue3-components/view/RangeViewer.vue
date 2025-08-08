<template>
  <component :is="tag">

    <scroll-border placement="top"
                   key="top-scroll-border"
                   :load="loadTop"
                   :canLoad="canLoadTop"
                   :loadSensorSize="loadTopSensorSize"
                   :drop="dropTop"
                   :canDrop="canDropTop"
                   :dropSensorSize="dropTopSensorSize"
                   :loadDelay="loadTopDelay"
                   :dropDelay="loadBottomDelay"
    />

    <slot v-if="loadingTop" name="loadingTop"></slot>

    <slot v-if="frozen && buckets?.changed" name="changedTop"></slot>

    <slot v-if="itemsCount === 0" name="empty"></slot>

    <template v-for="(bucket, bucketIndex) in buckets?.buckets ?? []" :key="bucket.id">

      <slot v-for="(item, itemIndex) in bucket.data" v-bind="{ item, bucket, itemIndex, bucketIndex }">
        <h4>{{bucketIndex}}.{{itemIndex}}</h4>
        <pre>{{ item }}</pre>
      </slot>

    </template>

    <slot v-if="frozen && buckets?.changed" name="changedBottom"></slot>

    <slot v-if="loadingBottom" name="loadingBottom"></slot>

    <scroll-border placement="bottom"
                   key="bottom-scroll-border"
                   :load="loadBottom"
                   :canLoad="canLoadBottom"
                   :loadSensorSize="loadBottomSensorSize"
                   :drop="dropBottom"
                   :canDrop="canDropBottom"
                   :dropSensorSize="dropBottomSensorSize"
                   :loadDelay="loadTopDelay"
                   :dropDelay="loadBottomDelay"
    />

  </component>
</template>

<script setup>

  import ScrollBorder from 'vue3-scroll-border'
  import { ref, unref, toRefs, defineProps, defineEmits, watch, computed } from 'vue'
  import { rangeBuckets } from '@live-change/vue3-ssr'

  const props = defineProps({
    pathFunction: {
      type: Function,
      default: undefined
    },
    buckets:{
      type: Object,
      default: undefined
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
    },
  })

  const {
    pathFunction, bucketSize, initialPosition, softClose,
    loadTopSensorSize, loadBottomSensorSize, dropTopSensorSize, dropBottomSensorSize,
    loadTopDelay, loadBottomDelay, dropTopDelay, dropBottomDelay, frozen
  } = toRefs(props)

  const emit = defineEmits([
      'loadTop', 'loadBottom', 'loadedTop', 'loadedBottom',
      'dropTop', 'dropBottom', 'droppedTop', 'droppedBottom',
      'changed'
  ])

  const loadingTop = ref(false)
  const loadingBottom = ref(false)

  async function createBuckets() {
    try {
      return await rangeBuckets(
        (range, p) => pathFunction.value(range, p),
        {
          bucketSize: bucketSize.value,
          initialPosition: initialPosition.value,
          softClose: softClose.value
        }
      )
    } catch(e) {
      console.error("Error creating buckets", e)
      throw e
    }
  }

  const buckets = ref()

  const itemsCount = computed(() => {
    if(!buckets.value) return 0
    return buckets.value.buckets.reduce((acc, b) => acc + (unref(b.data)?.length ?? 0), 0)
  })

  if(props.buckets) {
    buckets.value = props.buckets
  } else if(props.pathFunction) {
    const [ initialBuckets ] = await Promise.all([
      createBuckets()
    ])
    watch(pathFunction, async () => {
      console.warn("PATH FUNCTION CHANGED - BUCKETS RELOAD EXPERIMENTAL!")
      const newBuckets = await createBuckets()
      if(buckets.value) buckets.value.dispose()
      buckets.value = newBuckets
    })
    buckets.value = initialBuckets
  } else {
    throw new Error("Either buckets or pathFunction must be provided")
  }

  watch(() => frozen.value, (frozen) => {
    if(frozen) buckets.value.freeze()
      else buckets.value.unfreeze()
  }, { immediate: true })

  watch(() => buckets.value?.changed, () => {
    emit('changed')
  })

  function canLoadBottom() {
    return props.canLoadBottom && buckets.value.canLoadBottom()
  }
  function canLoadTop() {
    return props.canLoadTop && buckets.value.canLoadTop()
  }
  function canDropTop() {
    return props.canDropTop && buckets.value.buckets && buckets.value.buckets.length > 2
  }
  function canDropBottom() {
    return props.canDropBottom && buckets.value.buckets && buckets.value.buckets.length > 2
  }


  async function loadTop() {
    if(!props.canLoadTop) return
    if(!buckets.value.canLoadTop()) return
    emit('loadTop')
    loadingTop.value = true
    const result = await buckets.value.loadTop()
    loadingTop.value = false
    emit('loadedTop')
    return result
  }

  async function loadBottom() {
    console.log("LOAD BOTTOM!!!")
    if(!props.canLoadBottom) return
    if(!buckets.value.canLoadBottom()) return
    emit('loadBottom')
    loadingBottom.value = true
    const result = await buckets.value.loadBottom()
    loadingBottom.value = false
    emit('loadedBottom')
    return result
  }

  function dropTop() {
    if(!props.canDropTop) return
    if(buckets.value.buckets.length < 2) return
    emit('dropTop')
    loadingTop.value = true
    const result = buckets.value.dropTop()
    loadingTop.value = false
    emit('droppedTop')
    return result
  }

  function dropBottom() {
    if(!props.canDropBottom) return
    if(buckets.value.buckets.length < 2) return
    emit('dropBottom')
    loadingBottom.value = true
    const result = buckets.value.dropBottom()
    loadingBottom.value = false
    emit('droppedBottom')
    console.log("DROPPED BOTTOM", result)
    return result
  }


</script>

<style>
/*   .load-sensor {
    visibility: visible !important;
    border: 2px solid red !important;
  }
  .drop-sensor {
    visibility: visible !important;
    border: 1px solid blue !important;
  } */
</style>