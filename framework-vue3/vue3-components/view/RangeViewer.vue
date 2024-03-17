<template>
  <div>

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

    <template v-for="(bucket, bucketIndex) in buckets.buckets" :key="bucket.id">

      <slot v-for="(item, itemIndex) in bucket.data" v-bind="{ item, bucket, itemIndex, bucketIndex }">
        <h4>{{bucketIndex}}.{{itemIndex}}</h4>
        <pre>{{ item }}</pre>
      </slot>

    </template>

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

  </div>
</template>

<script setup>

  import ScrollBorder from 'vue3-scroll-border'
  import { ref, toRefs, defineProps, defineEmits, watch } from 'vue'
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
    }
  })

  const {
    pathFunction, bucketSize, initialPosition, softClose,
    loadTopSensorSize, loadBottomSensorSize, dropTopSensorSize, dropBottomSensorSize,
    loadTopDelay, loadBottomDelay, dropTopDelay, dropBottomDelay,
  } = toRefs(props)

  const emit = defineEmits([
      'loadTop', 'loadBottom', 'loadedTop', 'loadedBottom',
      'dropTop', 'dropBottom', 'droppedTop', 'droppedBottom'
  ])

  const loadingTop = ref(false)
  const loadingBottom = ref(false)

  async function createBuckets() {
    return rangeBuckets(
        (range, p) => pathFunction.value(range, p),
        {
          bucketSize: bucketSize.value,
          initialPosition: initialPosition.value,
          softClose: softClose.value
        }
    )
  }

  const buckets = ref()

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

  function canLoadBottom() {
    return props.canLoadBottom && buckets.value.canLoadBottom()
  }
  function canLoadTop() {
    return props.canLoadTop && buckets.value.canLoadTop()
  }
  function canDropTop() {
    return props.canDropTop && buckets.value.buckets.length > 2
  }
  function canDropBottom() {
    return props.canDropBottom && buckets.value.buckets.length > 2
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

<style scoped>

</style>