<route>
{
  meta: {
    raw: true
  }
}
</route>

<template>

<!--  <pre>{{ testData }}</pre>-->
  <VideoWall
    :mainVideos="testData.mainVideos"
    :topVideos="testData.topVideos"
    :otherVideos="testData.otherVideos"
    :myVideos="testData.myVideos"
    class="absolute surface-900 w-full h-full"
  />

</template>

<script setup>
  import testData from "../room/videoWallTestData.js"
  import VideoWall from '../room/VideoWall.vue'


</script>

<style scoped>

</style>