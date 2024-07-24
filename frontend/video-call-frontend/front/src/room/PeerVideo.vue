<template>
  <div @click="ev => $emit('click', ev)">
    <div v-if="peerState.videoMuted || !stream">
      <UserIdentification :ownerType="ownerType" :owner="owner" />

    </div>

    <div>
      <video autoplay playsinline
             :src-object.prop.camel="stream"
             :volume.prop.camel="volume"
             :ref="videoElement"
             @resize="handleVideoResize">
      </video>
    </div>

    <VolumeIndicator v-if="video.srcObject" :stream="stream"></VolumeIndicator>

    <div v-if="peerState">
      <i v-if="peerState.videoMuted"  class='bx bx-camera-off' />
      <i v-if="peerState.audioState" class='bx bx-microphone-off' />
    </div>

  </div>
</template>

<script setup>

  import { VolumeIndicator } from "@live-change/peer-connection"
  import { UserIdentification } from "@live-change/identification-frontend"

  import { defineProps, defineEmits, toRefs, ref, computed } from 'vue'

  const props = defineProps({
    stream: {
      type: Object,
      required: true
    },
    ownerType: {
      type: String,
      required: true
    },
    owner: {
      type: String,
      required: true
    },
    peerState: {
      type: Object,
      required: false
    },
    volume: {
      type: Number,
      defaultValue: 1
    }
  })
  const { stream, ownerType, owner, peerState } = toRefs(props)

  const emit = defineEmits(['resize'])

  const videoElement = ref(null)

  function handleVideoResize(event) {
    console.log("HANDLE VIDEO RESIZE EVENT", event.target.videoWidth, event.target.videoHeight)
    if(!event.target.videoWidth || !event.target.videoHeight) {
      console.error("WRONG VIDEO WIDTH OR HEIGHT")
      return
    }
    emit('resize', { width: event.target.videoWidth, height: event.target.videoHeight })
  }

</script>

<style scoped>

</style>