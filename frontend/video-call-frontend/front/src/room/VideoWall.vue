<template>
  <div :ref="wall">
    <pre style="display: none">{{ JSON.stringify(videoSizes, null, "  ") }}</pre>
    <!--<pre style="display: none">{{ JSON.stringify(allVisibleVideos, null, "  ") }}</pre>
    <pre style="display: none">{{ JSON.stringify(allVideos, null, "  ") }}</pre>-->
    <VideoDisplayVideo v-for="tile in videoTiles" :style="videoStyles[tile.id]"
                       :key="tile.id" :video="tile.video" :volume="volume"
                       @videoResize="ev => handleVideoResize(tile, ev)"
                       @click="ev => handleVideoClick(tile, ev)">
    </VideoDisplayVideo>
  </div>
</template>

<script setup>

  import PeerVideo from './PeerVideo.vue'

  import { defineProps, defineEmits, toRefs, ref, computed, watch } from 'vue'
  import { useElementSize } from '@vueuse/core'

  const props = defineProps({
    mainVideos: {
      type: Array,
      default: () => [] // testData.mainVideos
    },
    topVideos: {
      type: Array,
      default: () => [] // testData.otherVideos
    },
    otherVideos: {
      type: Array,
      default: () => [] // testData.otherVideos
    },
    myVideos: {
      type: Array,
      default: () => [] // testData.myVideos
    },
    topBarHeight: {
      type: Number,
      default: 80
    },
    bottomBarHeight: {
      type: Number,
      default: 80
    },
    volume: {
      type: Number,
      defaultValue: 1
    }
  })
  const { mainVideos, topVideos, otherVideos, myVideos, topBarHeight, bottomBarHeight, volume } = toRefs(props)

  const emit = defineEmits(['videoClick'])

  const allVideos = computed(() => [].concat(mainVideos.value, topVideos.value, otherVideos.value, myVideos.value))

  const wall = ref(null)
  const wallSize = useElementSize(wall)

  const videoTiles = ref([])

  const defaultVideoSize = { width: 640, height: 480 }

  watch(allVideos, videos => {
    for(const video of videos) {
      const index = videoTiles.value.findIndex(v => v.id === video.id)
      if(index === -1) {
        videoTiles.value.push({ id: video.id, video, size: { ...defaultVideoSize } })
      } else {
        videoTiles.value.splice(index, 1, { id: video.id, video, size: { ...defaultVideoSize } })
      }
    }
  }, { immediate: true })

  function handleVideoResize(tile, { width, height }) {
    tile.size = { width, height }
  }

  function handleClick(tile, event) {
    emit('videoClick', { event, ...tile })
  }

  import allocateSpace from './allocateSpace.js'

  const videoStyles = computed(() => {
    if(typeof window == 'undefined') return {}
    if(!wallSize?.width || !wallSize?.height) return {}
    const areaSize = wallSize.value

    let styles = {}
    const bottomBarVisible = otherVideos.value.length > 0  || myVideos.value.length > 0
    const bottomHeight = bottomBarVisible ? bottomBarHeight.value : 0

    let right = 0
    for(const video of myVideos.value) {
      const size = videoTiles.value.find(v => v.id === video.id)?.size
      if(!size || !size.width || !size.height) {
        styles[myVideo.id] = { display: 'none' }
        continue
      }
      const { width, height } = size
      const ratio = width/height
      const newWidth = bottomBarHeight * ratio
      console.log('NW', newWidth, ratio)
      styles[myVideo.id] = {
        width: newWidth + 'px',
        height: bottomHeight + 'px',
        bottom: '0',
        right: right + 'px'
      }
      right += newWidth
    }

    const topBarVisible = topVideos.value.length > 0
    const topHeight = topBarVisible ? topBarHeight : 0

    /// Allocate space for bottom videos
    allocateSpace(0, areaSize.height - bottomHeight,
      areaSize.width - right, bottomHeight,
      otherVideos, styles)

    /// Allocate space for top videos
    allocateSpace(0, 0,
      areaSize.width, topHeight,
      topVideos, styles)

    /// Allocate space for main videos
    allocateSpace(0, topHeight,
      areaSize.width, areaSize.height - bottomHeight - topHeight,
      mainVideos, styles)

    return styles

  })



</script>


<style scoped>

</style>