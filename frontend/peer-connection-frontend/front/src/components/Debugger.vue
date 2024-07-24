<template>
  <div v-if="isMounted" class="w-full sm:w-9 md:w-8 lg:w-6 surface-card p-4 shadow-2 border-round">
    <div class="text-center mb-5">
      <div class="text-900 text-3xl font-medium mb-3">
        Peer Connection Debugger
      </div>
    </div>

    <div v-if="peer">
      <h2>Peer connection</h2>
      <pre>{{ JSON.stringify(peer.summary, null, "  ") }}</pre>
      <div class="flex justify-content-between align-items-center">
        <div class="flex align-items-center">
          <InputSwitch v-model="peer.online" />
          <div class="ml-3">Peer online</div>
        </div>
        <Button @click="sendTestMessage">Test Message</Button>
      </div>
    </div>
    <div v-for="remoteStream in remoteStreams">
      <h2>Remote stream {{ remoteStream.stream.id }} from {{ remoteStream.from }}</h2>
      <video autoplay playsinline :src-object.prop.camel="remoteStream.stream" class="w-full">
      </video>
    </div>

    <div class="my-2">
      <h2>Local tracks</h2>
      <div v-for="(track, index) in (localTracks ?? [])">
        Track #{{ index }} {{ track.track.kind }} ({{ track.track.label }}) enabled: {{ track.enabled }}
        id: {{ track.track.id }}
        <div class="buttons">
          <button type="button" class="button" v-if="!track.enabled"
                  @click="() => peer.setTrackEnabled(track, true)">
            Enable Track
          </button>
          <button type="button" class="button" v-if="track.enabled"
                  @click="() => peer.setTrackEnabled(track, false)">
            Disable Track
          </button>
        </div>
      </div>
    </div>

    <div>
      <h2>User media</h2>
      <DeviceSelect v-model="selectedDevices" />
      <hr>
      <pre>{{ selectedDevices }}</pre>
      <div class="mt-1 mb-3 flex align-items-center">
        <InputSwitch v-model="userMediaEnabled" />
        <div class="ml-3">User media stream enabled</div>
      </div>
    </div>

    <div>
      <h2>Display media</h2>

      <div class="justify-content-between" v-if="!displayMedia">
        <Button v-if="!displayMedia" @click="getDisplayMedia">getDisplayMedia</Button>
        <Button v-if="displayMedia" @click="dropDisplayMedia">drop DisplayMedia</Button>
      </div>
      <video class="mt-2 w-full" v-if="displayMedia" autoplay playsinline muted
             :src-object.prop.camel="displayMedia">
      </video>
    </div>

  </div>
</template>

<script setup>
  import Button from "primevue/button"
  import DeviceSelect from './DeviceSelect.vue'

  import { ref, unref, computed, watch, onMounted, onUnmounted, getCurrentInstance } from 'vue'
  import { path, live, actions, api as useApi } from '@live-change/vue3-ssr'
  const api = useApi()

  const appContext = (typeof window != 'undefined') && getCurrentInstance()?.appContext

  import { createPeer } from "./Peer.js"
  import { getDisplayMedia as getDisplayMediaNative }
    from "./userMedia.js"
  import { mediaStreamsTracks } from './mediaStreamsTracks.js'

  const { channelType, channel } = defineProps({
    channelType: {
      type: String,
      required: true
    },
    channel: {
      type: String,
      required: true
    }
  })

  const isMounted = ref(false)
  onMounted( () => isMounted.value = true )

  const selectedDevices = ref({ })
  const userMediaEnabled = ref(false)
  const displayMedia = ref()
  const localMediaStreams = computed(() =>
      ( userMediaEnabled.value ? [selectedDevices.value.media] : []).concat(displayMedia.value ? [displayMedia.value] : [])
  )
  const localTracks = mediaStreamsTracks(localMediaStreams)
  watch(() => ([selectedDevices.value.audioMuted, selectedDevices.value.media]), ([muted, media]) => {
    if(!media) return
    console.log("UPDATE MUTED", muted, media.getAudioTracks())
    for(const track of media.getAudioTracks()) for(const localTrack of localTracks.value) 
      if(localTrack.track === track) localTrack.enabled = !muted
  }, { immediate: true })
  watch(() => ([selectedDevices.value.videoMuted, selectedDevices.value.media]), ([muted, media]) => {
    if(!media) return
    console.log("UPDATE MUTED", muted, media.getVideoTracks())
    for(const track of media.getVideoTracks()) for(const localTrack of localTracks.value)
      if(localTrack.track === track) localTrack.enabled = !muted
  }, { immediate: true })

  const displayMediaEndedHandler = () => displayMedia.value = null
  watch(() => displayMedia.value, (mediaStream, oldMediaStream) => {
    console.log("DISPLAY MEDIA STREAM CHANGE:", mediaStream, oldMediaStream)
    if(oldMediaStream) {
      const track = oldMediaStream.getVideoTracks()[0]
      if(track) track.removeEventListener('ended', displayMediaEndedHandler)

      console.log("OLD MEDIA STREAM", oldMediaStream)
      oldMediaStream.getTracks().forEach(track => { if (track.readyState === 'live') track.stop() })
    }
    if(mediaStream) {
      const track = mediaStream.getVideoTracks()[0]
      if(track) track.addEventListener('ended', displayMediaEndedHandler)
    }
  })

  const peer = ref()
  const remoteStreams = computed(() => {
    if(!peer.value) return []
    let remoteStreams = []
    for(const connection of unref(peer.value.connections)) {
      for(const remoteTrack of unref(connection.remoteTracks)) {
        if(remoteStreams.find(remoteStream => remoteStream.stream === remoteTrack.stream)) continue
        remoteStreams.push({
          from: connection.to,
          stream: remoteTrack.stream
        })
      }
    }
    return remoteStreams
  })

  onMounted(async () => {
    console.log("MOUNTED!")
    await initPeer()
  })

  let createPeerPromise = null
  async function initPeer() {
    if(createPeerPromise) return createPeerPromise
    createPeerPromise = createPeer({
      channelType, channel,
      onUnmountedCb: onUnmounted, appContext,
      localTracks,
    })
    peer.value = await createPeerPromise
    createPeerPromise = null
  }

  async function getDisplayMedia() { // media stream retrival logic
    let initialConstraints = { video: true } // make a copy
    let constraints = { ...initialConstraints }
    while(true) {
      try {
        console.log("TRY GET DISPLAY MEDIA", constraints)
        const mediaStream = await getDisplayMediaNative(constraints)
        const videoTracks = mediaStream.getVideoTracks()
        const audioTracks = mediaStream.getAudioTracks()
        console.log('Got stream with constraints:', constraints)
        if(constraints.video) console.log(`Using video device: ${videoTracks[0] && videoTracks[0].label}`)
        if(constraints.audio) console.log(`Using audio device: ${audioTracks[0] && audioTracks[0].label}`)
        displayMedia.value = mediaStream
        return;
      } catch(error) {
        console.log("GET DISPLAY MEDIA ERROR", error)
        return;
      }
    }
  }

  async function dropDisplayMedia() {
    displayMedia.value = null
  }

  function sendTestMessage() {
    for(const connection of peer.value.connections) {
      peer.value.sendMessage({
        to: connection.to,
        type: "ping",
        data: new Date().toISOString()
      })
    }
  }

</script>

<style scoped lang="scss">
  .peer-connection-debugger {

    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background: white;

    .peer-connection-debugger-content {
      position: absolute;
      left: 0;
      top: 50px;
      bottom: 0;
      width: 100%;
      height: auto;
      overflow: auto;
      background: white;
    }
  }
</style>