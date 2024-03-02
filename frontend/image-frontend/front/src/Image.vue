<template>
  <img
      :src="url"
      @load="ev => $emit('load', ev)"
      :title="title"
      ref="element">
</template>

<script setup>

  import { api as useApi } from '@live-change/vue3-ssr'
  const api = useApi()

  import { ref, computed, watch } from 'vue'
  import { useResizeObserver, refDebounced } from '@vueuse/core'
  import { imageUploads } from "./imageUploads.js";

  const props = defineProps({
    image: {
      type: String,
      required: true
    },
    imageData: {
      type: Object
    },
    width: {
    },
    height: {
    },
    noResize: {
    },
    domResize: {
      default: false
    },
    empty: {
      type: String,
      default: "/static/images/empty-photo.svg"
    },
    title: {
      type: String,
      default: null
    }
  })

  const upload = computed(() => {
    return imageUploads.value.find(upload => upload.id == props.image)
  })

  const imageData = ref(props.imageData)
  const reloadImageDataTimeout = 500
  let tryCount = 0

  let loadImagePromise = null
  async function loadImageData() {
    if(!loadImagePromise) loadImagePromise = (async () => {
      const loaded = await api.get(['image', 'image', { image: props.image }])
      //console.log("IM", props.image, "DATA", loaded)
      loadImagePromise = null
      if(loaded) {
        const { width, height } = loaded
        size.value = { width, height }
        imageData.value = loaded
      }
      if(!imageData.value && !upload.value) {
        tryCount ++
        const wait = reloadImageDataTimeout * Math.pow(2, tryCount)
        //console.log("IM WAIT", wait)
        if(typeof window != 'undefined') setTimeout(loadImageData, wait)
      }
    })()
    return loadImagePromise
  }

  const url = ref("/images/empty-photo.svg")
  const size = ref()

  const emit = defineEmits(['size'])
  watch(() => size.value, () => emit('size', size.value))

  const dpr = (typeof window == 'undefined') ? 1.0 : window.devicePixelRatio

  const domSize = ref()
  const stableDomSize = refDebounced(domSize, 500)
  const element = ref()

  console.log("DR", props.domResize)
  if(props.domResize) {
    useResizeObserver(element, (entries) => {
      const entry = entries[0]
      const {width, height} = entry.contentRect
      domSize.value = {width, height}
    })
  }
  watch(() => stableDomSize.value, size => updateUrl())

  function getSuffix() {
    if(props.noResize) return ''
    const domSize = stableDomSize.value
    if(props.domResize && domSize) {
      console.log("DOM SIZE", domSize)
      let width = (domSize.width * dpr)|0
      let height = (domSize.height * dpr)|0
      if(imageData.value) {
        width = Math.min(width, imageData.value.width)
        height = Math.min(height, imageData.value.height)
      }
      if(props.domResize == 'width') {
        return `/width-${width}`
      } else if(props.domResize == 'height') {
        return `/height-${height}`
      } else {
        return `/rect-${width}-${height}`
      }
    }
    if(props.width && props.height) return `/rect-${(props.width*dpr)|0}-${(props.height*dpr)|0}`
    if(props.width) return `/width-${(props.width*dpr)|0}`
    if(props.height) return `/height-${(props.height*dpr)|0}`
    return ''
  }

  function updateUrl() {
    console.log("UPDATE URL!", upload.value)
    if(upload.value && upload.value.url) { // available upload
      size.value = { ...upload.value.size }
      url.value = upload.value.url
      return
    }
    if(!imageData.value) {
      tryCount = 0
      loadImageData()
      return
    } else {
      const suffix = getSuffix()
      url.value = `/api/image/image/${props.image}${suffix}`
    }
  }

  if(!imageData.value) updateUrl()

  watch(() => upload.value && upload.value.url, () => updateUrl())
  watch(() => imageData.value, () => updateUrl())

</script>
