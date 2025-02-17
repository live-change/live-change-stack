<template>
  <div @click="ev => $emit('click', ev)"
       class="text-gray-200 peer-video">

    <div v-if="image && (!stream || peerState.videoState !== 'enabled')"
         class="absolute w-full h-full bg-no-repeat bg-center" :style="{
           'background-image': 'url(' + image + ')',
           'background-size': '90%'
         }">
    </div>

    <video v-if="stream"
           autoplay playsinline
           :src-object.prop.camel="stream"
           :volume.prop.camel="volume"
           :muted="audioMuted"
           ref="videoElement"
           @resize="handleVideoResize"
           class="w-full h-full absolute"
           :style="mirror ? 'transform: scaleX(-1)' : ''">
    </video>

    <div v-if="(peerState?.videoState !== 'enabled' || !stream) && !image && ownerType && owner"
         class="absolute w-full h-full left-0 top-0 flex flex-col items-center justify-center identification">
      <UserIdentification :ownerType="ownerType" :owner="owner" />
      <!--      <pre>{{ peerState }}</pre>
            <pre>[{{ ownerType }}]</pre>-->
    </div>

    <slot name="videoOverlay" v-bind="props" />

    <div v-if="peerState"
         class="absolute top-0 right-0 h-12 pr-1 flex items-center">
      <div v-if="peerState.audioState === 'muted'"
           class="border-circle bg-black-alpha-40 mx-1
                  flex align-items-center justify-content-center w-2rem h-2rem">
        <i class='bx bx-microphone-off text-xl text-red-600' />
      </div>
      <div v-if="peerState.audioState === 'none'"
           class="border-circle bg-black-alpha-40 mx-1
                  flex align-items-center justify-content-center w-2rem h-2rem">
        <i class='bx bx-microphone-off text-xl text-gray-500' />
      </div>

      <div v-if="peerState.videoState === 'muted'"
           class="border-circle bg-black-alpha-40 mx-1
                  flex align-items-center justify-content-center w-2rem h-2rem">
        <i class='bx bx-camera-off text-xl text-red-600' />
      </div>
      <div v-if="peerState.videoState === 'none'"
           class="border-circle bg-black-alpha-40 mx-1
                  flex align-items-center justify-content-center w-2rem h-2rem">
        <i class='bx bx-camera-off text-xl text-gray-500' />
      </div>

      <VolumeIndicator v-if="stream && peerState?.audioState === 'enabled'" :stream="stream"
                       class="mx-1" />
    </div>

<!--    <pre>{{ peerState }}</pre>-->
<!--    <pre>{{ image }}</pre>-->
<!--    <h3>{{ id  }}</h3>-->

  </div>
</template>

<style lang="scss">
  .peer-video {
    .identification {
      & > span > span, a {
        &:hover {
          background: none !important;
        }
        display: flex !important;
        flex-direction: column !important;
        position: absolute;
        width: 100%;
        left: 0;
        top: 0;
        height: 100%;
        align-items: center;
        justify-content: center;
        img, i {
          max-height: 120px !important;
          width: auto !important;
          height: 50% !important;
          aspect-ratio: 1/1;
        }
        span {
          color: rgba(255,255,255,0.8);
          margin-top: 0.8em;
          font-size: 1.1em
        }
      }
    }
  }
</style>

<script setup>

  import { VolumeIndicator } from "@live-change/peer-connection-frontend"
  import { UserIdentification as DefaultUserIdentification } from "@live-change/user-frontend"

  import { injectComponent } from "@live-change/vue3-components"
  const UserIdentification = injectComponent('UserIdentification', DefaultUserIdentification)


  import { defineProps, defineEmits, toRefs, ref, computed, watchEffect } from 'vue'

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
    audioOutputId: {
      type: String,
      default: null
    }
  })
  const {
    id, stream, image, ownerType, owner, peerState, audioMuted, mirror, audioOutputId
  } = toRefs(props)

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

  watchEffect(() => {
    const output = videoElement.value
    const outputDeviceId = audioOutputId.value
    if(!output) return
    (async () => {
      console.log("SET OUTPUT DEVICE", outputDeviceId)
      if(outputDeviceId) {
        await output.setSinkId(outputDeviceId)
      } else {
        //await output.setSinkId(null)
      }
    })()
  })

</script>

<style scoped>

</style>