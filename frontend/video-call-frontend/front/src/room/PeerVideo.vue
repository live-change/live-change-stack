<template>
  <div @click="ev => $emit('click', ev)"
       class="absolute surface-900 text-gray-200 border-1 border-white-alpha-30 peer-video">

    <div v-if="image && (!stream || peerState.videoMuted)"
         class="absolute w-full h-full bg-no-repeat bg-center" :style="{
           'background-image': 'url(' + image + ')',
           'background-size': '90%'
         }">
    </div>

    <div v-if="(peerState?.videoMuted || !stream) && !image"
         class="absolute w-full h-full flex flex-column align-items-center justify-content-center identification">
      <UserIdentification :ownerType="ownerType" :owner="owner" />
    </div>

    <div v-if="stream">
      <video autoplay playsinline
             :src-object.prop.camel="stream"
             :volume.prop.camel="volume"
             :muted="audioMuted"
             :ref="videoElement"
             @resize="handleVideoResize"
             class="w-full h-full"
             :style="mirror ? 'transform: scaleX(-1)' : ''">
      </video>
    </div>

    <VolumeIndicator v-if="stream" :stream="stream"
                     class="absolute" :style="{ right: 'calc(1% + 0.3rem)', top: 'calc(1% + 0.3rem) ' }" />

    <div v-if="peerState">
      <i v-if="peerState.videoMuted"  class='bx bx-camera-off' />
      <i v-if="peerState.audioState" class='bx bx-microphone-off' />
    </div>

    <pre>{{ image }}</pre>
<!--    <h3>{{ id  }}</h3>-->

  </div>
</template>

<style lang="scss">
  .peer-video {
    .identification {
      & > span > span, a {
        display: flex !important;
        flex-direction: column !important;
        position: absolute;
        width: 100%;
        left: 0;
        top: 0;
        height: 100%;
        align-items: center;
        justify-content: center;
        height: 100%;
        width: 100%;
        img, i {
          max-height: 70px !important;
          width: auto !important;
          height: 50% !important;
          aspect-ratio: 1/1;
          border: 1px solid red;
        }
        span {
          color: rgba(255,255,255,0.8);
          margin-top: 0.4em;
          font-size: 1.1em
        }
      }
    }
  }
</style>

<script setup>

  import { VolumeIndicator } from "@live-change/peer-connection-frontend"
  import { UserIdentification } from "@live-change/user-frontend"

  import { defineProps, defineEmits, toRefs, ref, computed } from 'vue'

  const props = defineProps({
    id: {
      type: String,
      required: true
    },
    stream: {
      type: Object,
      default: null,
    },
    image: {
      type: String,
      required: false
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
      default: 1
    },
    audioMuted: {
      type: Boolean,
      default: false
    },
    mirror: {
      type: Boolean,
      default: false
    },
  })
  const { id, stream, image, ownerType, owner, peerState, audioMuted, mirror } = toRefs(props)

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