<template>
  <div ref="wall">
<!--    <pre style="display: none">{{ JSON.stringify(videoSizes, null, "  ") }}</pre>-->
    <!--<pre style="display: none">{{ JSON.stringify(allVisibleVideos, null, "  ") }}</pre>
    <pre style="display: none">{{ JSON.stringify(allVideos, null, "  ") }}</pre>-->
<!--    <div class="surface-card p-3">
      <pre>videoStyles = {{ videoStyles }}</pre>
      <pre>wall = {{ wall }} {{ wallSize }}</pre>
      <pre>mainVideos = {{ mainVideos }}</pre>
      <pre>topVideos = {{ topVideos }}</pre>
      <pre>bottomVideos = {{ bottomVideos }}</pre>
      <pre>myVideos = {{ myVideos }}</pre>
    </div>-->
    <PeerVideo v-for="tile in videoTiles"
               :key="tile.id" :stream="tile.video?.stream"
               :volume="volume" :audio-muted="tile.video?.audioMuted"
               :id="tile.id" :image="tile.video?.image"
               :mirror="tile.video?.mirror"
               :peer-state="tile.video?.peerState"
               :ownerType="tile.video?.ownerType ?? 'unknown'"
               :owner="tile.video?.owner ?? 'unknown'"
               @resize="ev => handleVideoResize(tile, ev)"
               @click="ev => handleVideoClick(tile, ev)"
               :style="videoStyles[tile.id]">
    </PeerVideo>
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
    bottomVideos: {
      type: Array,
      default: () => [] // testData.otherVideos
    },
    myVideos: {
      type: Array,
      default: () => [] // testData.myVideos
    },
    topBarHeight: {
      type: Number,
      default: 100
    },
    bottomBarHeight: {
      type: Number,
      default: 120
    },
    volume: {
      type: Number,
      defaultValue: 1
    }
  })
  const { mainVideos, topVideos, bottomVideos, myVideos, topBarHeight, bottomBarHeight, volume } = toRefs(props)

  const emit = defineEmits(['videoClick'])

  const allVideos = computed(() => [].concat(mainVideos.value, topVideos.value, bottomVideos.value, myVideos.value))

  const wall = ref(null)
  const wallSize = useElementSize(wall)

  const videoTiles = ref([])

  const defaultVideoSize = { width: 640, height: 480 }

  watch(allVideos, videos => {
    for(const video of videos) {
      const index = videoTiles.value.findIndex(v => v.id === video.id)
      const tile = {
        id: video.id,
        video,
        size: { ...(video.size ?? defaultVideoSize) }
      }
      if(index === -1) {
        videoTiles.value.push(tile)
      } else {
        videoTiles.value.splice(index, 1, tile)
      }
    }
    for(let i = videoTiles.value.length - 1; i >= 0; i--) {
      const tile = videoTiles.value[i]
      const index = videos.findIndex(v => v.id === tile.id)
      if(index === -1) {
        videoTiles.value.splice(i, 1)
        i--;
      }
    }
  }, { immediate: true })

  function handleVideoResize(tile, { width, height }) {
    console.log("handel video resize", arguments)
    tile.size = { width, height }
  }

  function handleVideoClick(tile, event) {
    emit('videoClick', { event, ...tile })
  }

  import allocateSpace from './allocateSpace.js'

  const videoStyles = computed(() => {
    console.log('recomputeVideoStyles', JSON.stringify(mainVideos.value))
    if(typeof window == 'undefined') return {}
    const areaSize = {
      width: wallSize.width.value,
      height: wallSize.height.value
    }
    if(!areaSize?.width || !areaSize?.height) return {}

    let styles = {}
    const bottomBarVisible = bottomVideos.value.length > 0  || myVideos.value.length > 0
    const bottomHeight = bottomBarVisible ? bottomBarHeight.value : 0

    let right = 0
    for(const video of myVideos.value) {
      const size = videoTiles.value.find(v => v.id === video.id)?.size ?? video.size
      if(!size || !size.width || !size.height) {
        styles[video.id] = { display: 'none' }
        continue
      }
      const { width, height } = size
      const ratio = width/height
      const newWidth = bottomHeight * ratio
      console.log('NW', newWidth, ratio, bottomHeight)
      styles[video.id] = {
        width: newWidth + 'px',
        height: bottomHeight + 'px',
        bottom: '0',
        right: right + 'px'
      }
      right += newWidth
    }

    const topBarVisible = topVideos.value.length > 0
    const topHeight = topBarVisible ? topBarHeight.value : 0

    /// Allocate space for bottom videos
    allocateSpace(0, areaSize.height - bottomHeight,
      areaSize.width - right, bottomHeight,
      bottomVideos.value, videoTiles.value, styles)

    /// Allocate space for top videos
    allocateSpace(0, 0,
      areaSize.width, topHeight,
      topVideos.value, videoTiles.value, styles)

    /// Allocate space for main videos
    allocateSpace(0, topHeight,
      areaSize.width, areaSize.height - bottomHeight - topHeight,
      mainVideos.value, videoTiles.value, styles)

    return styles

  })



</script>


<style scoped>

</style>