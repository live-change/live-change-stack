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
      <div class="buttons">
        <button type="button" role="button" class="button" @click="() => peer.setOnline(true)">Set Online</button>
        <button type="button" role="button" class="button" @click="() => peer.setOnline(false)">Set Offline</button>
        <button type="button" role="button" class="button" @click="sendTestMessage">Test Message</button>
      </div>
    </div>
    <div v-for="remoteStream in remoteStreams">
      <h2>Remote stream {{ remoteStream.stream.id }} from {{ remoteStream.from }}</h2>
      <video autoplay playsinline :src-object.prop.camel="remoteStream.stream">
      </video>
    </div>

    <!--<div>
      <h2>Devices</h2>
      <pre>{{ JSON.stringify(devices, null, "  ") }}</pre>
    </div>-->

    <div>
      <h2>User media</h2>

      <Dropdown v-if="videoInputDevices && videoInputDevices.length>0"
                v-model="selectedVideoInput"
                :options="videoInputDevices"
                :optionLabel="option => option ? (option.label || 'unknown') : 'Browser default'"
                :placeholder="'Select video device...'">
      </Dropdown>
      <Dropdown v-if="audioInputDevices && audioInputDevices.length>0"
                v-model="selectedAudioInput"
                :options="audioInputDevices"
                :optionLabel="option => option ? (option.label || 'unknown') : 'Browser default'"
                :placeholder="'Select audio device...'">
      </Dropdown>

      <div class="buttons" v-if="!userMedia">
        <button class="button" @click="getUserMedia">getUserMedia</button>
      </div>
      <div class="buttons" v-if="userMedia">
        <button class="button" @click="dropUserMedia">drop UserMedia</button>
        <button v-if="userMediaMuted" type="button" class="button" @click="() => userMediaMuted = false">
          Unmute user media
        </button>
        <button v-if="!userMediaMuted" type="button" class="button" @click="() => userMediaMuted = true">
          Mute user media
        </button>
      </div>
      <video v-if="userMedia" autoplay playsinline :muted="userMediaMuted"
             :src-object.prop.camel="userMedia">
      </video>
    </div>



    <div>
      <h2>Display media</h2>

      <div class="buttons" v-if="!displayMedia">
        <button class="button" @click="getDisplayMedia">getDisplayMedia</button>
      </div>
      <div class="buttons" v-if="displayMedia">
        <button class="button" @click="dropDisplayMedia">drop DisplayMedia</button>
      </div>
      <video v-if="displayMedia" autoplay playsinline muted
             :src-object.prop.camel="displayMedia">
      </video>
    </div>

    <div v-for="(track, index) in (peer ? peer.localTracks : [])">
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

    <Dialog header="Permissions" v-model:visible="permissionsDialog" modal>

    </Dialog>

    <Dialog header="Connect camera" v-model:visible="connectDeviceDialog" modal>
      <template #header>
        <h3>Connect camera and microphone</h3>
      </template>

      <template #footer>
        <Button @click="connectDeviceCallbacks.connected()"
                label="Ok, connected" icon="pi pi-check" class="p-button-success" autofocus />
        <Button @click="connectDeviceCallbacks.camera()"
                label="Use only camera" icon="pi pi-video" class="p-button-warning" />
        <Button @click="connectDeviceCallbacks.microphone()"
                label="Use only microphone" icon="pi pi-volume-up" class="p-button-warning" />
        <Button @click="connectDeviceCallbacks.cancel()"
                label="Cancel" icon="pi pi-times" class="p-button-danger" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
  import Button from "primevue/button"
  import Dropdown from "primevue/dropdown"
  import Dialog from "primevue/dialog"

  import { ref, computed, watch, onMounted } from 'vue'
  import { path, live, actions, api as useApi } from '@live-change/vue3-ssr'
  const api = useApi()

  import { createPeer } from "./Peer.js"
  import { getUserMedia as getUserMediaNative, getDisplayMedia as getDisplayMediaNative, isUserMediaPermitted }
    from "./userMedia.js"

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

  const devices = ref([])
  const videoInputDevices = computed(() => devices.value.filter(d => d.kind == 'videoinput'))
  const audioInputDevices = computed(() => devices.value.filter(d => d.kind == 'audioinput'))

  const selectedVideoInput = ref(null)
  const selectedAudioInput = ref(null)
  const userMediaConstraints = computed(() => ({
      video: selectedVideoInput.value?.deviceId ? { deviceId: selectedVideoInput.value.deviceId } : true,
      audio: selectedAudioInput.value?.deviceId ? { deviceId: selectedAudioInput.value.deviceId } : true,
    }))

  const userMedia = ref()
  const displayMedia = ref()
  const localMediaStreams = computed(() =>
      (userMedia.value ? [userMedia.value] : []).concat(displayMedia.value ? [displayMedia.value] : [])
  )

  watch(() => userMediaConstraints.value, async value => {
    if(userMedia.value) {
      await dropUserMedia()
      await getUserMedia()
    }
  })

  watch(() => userMedia.value, (mediaStream, oldMediaStream) => {
    console.log("USER MEDIA STREAM CHANGE:", mediaStream, oldMediaStream)
    readDevices()
    if(oldMediaStream) {
      console.log("OLD MEDIA STREAM", oldMediaStream)
      oldMediaStream.getTracks().forEach(track => { if (track.readyState == 'live') track.stop() })
    }
  })

  const displayMediaEndedHandler = () => displayMedia.value = null
  watch(() => displayMedia.value, (mediaStream, oldMediaStream) => {
    console.log("DISPLAY MEDIA STREAM CHANGE:", mediaStream, oldMediaStream)
    if(oldMediaStream) {
      const track = oldMediaStream.getVideoTracks()[0]
      if(track) track.removeEventListener('ended', displayMediaEndedHandler)

      console.log("OLD MEDIA STREAM", oldMediaStream)
      oldMediaStream.getTracks().forEach(track => { if (track.readyState == 'live') track.stop() })
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
    for(const connection of peer.value.connections) {
      for(const remoteTrack of connection.remoteTracks) {
        if(remoteStreams.find(remoteStream => remoteStream.stream == remoteTrack.stream)) continue
        remoteStreams.push({
          from: connection.to,
          stream: remoteTrack.stream
        })
      }
    }
    return remoteStreams
  })

  const userMediaMuted = ref(true)

  const deviceChangeHandler = () => readDevices()
  onMounted(async () => {
    console.log("MOUNTED!")
    await initPeer()
    console.log(" PEER INITIALIZED!", peer.value)
    readDevices()

    if(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.addEventListener('devicechange', deviceChangeHandler)
    }
  })


  async function readDevices() {
    if(navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      const nativeDevices = await navigator.mediaDevices.enumerateDevices()
      devices.value = nativeDevices.map(({ deviceId, groupId, kind, label }) => ({ deviceId, groupId, kind, label }))
    }
  }

  let createPeerPromise = null
  async function initPeer() {
    if(createPeerPromise) return createPeerPromise
    createPeerPromise = createPeer({
      channelType, channel,
      localMediaStreams
    })
    peer.value = await createPeerPromise
    createPeerPromise = null
  }

  async function getUserMedia() { // media stream retrival logic
    let constraints = { ...userMediaConstraints.value } // make a copy
    while(true) {
      try {
        console.log("TRY GET USER MEDIA", constraints)
        const mediaStream = await getUserMediaNative(constraints)
        const videoTracks = mediaStream.getVideoTracks()
        const audioTracks = mediaStream.getAudioTracks()
        console.log('Got stream with constraints:', constraints)
        if(constraints.video) console.log(`Using video device: ${videoTracks[0] && videoTracks[0].label}`)
        if(constraints.audio) console.log(`Using audio device: ${audioTracks[0] && audioTracks[0].label}`)
        this.userMedia = mediaStream
        return;
      } catch(error) {
        console.log("GET USER MEDIA ERROR", error)
        const permitted = await isUserMediaPermitted(constraints)
        if(permitted || error.code == error.NOT_FOUND_ERR) {
          constraints = await askToConnectCamera({ ...userMediaConstraints.value })
          if(!constraints) return
        } else { // if not permitted display dialog
          const permitted = await showPermissionsModal()
          console.log("CAMERA PERMITTED", permitted)
          if(!permitted) constraints.video = false
          if(!(constraints.video || constraints.audio)) {
            constraints = await askToConnectCamera({ ...userMediaConstraints.value })
            if(!constraints) return
          }
          continue // retry get user media with new constraints
        }
      }
    }
  }

  async function dropUserMedia() {
    this.userMedia = null
  }


  import { usePermission } from "@vueuse/core"
  const microphonePermission = usePermission('microphone')
  const cameraPermission = usePermission('camera')

  const permissionsDialog = ref(false)
  const permissionsCallbacks = ref(null)

  async function showPermissionsModal() {
    return new Promise((resolve, reject) => {
      permissionsCallbacks.value = {
        disabled: () => {
          resolve(false)
        },
        ok: () => {
          resolve(true)
        },
        cancel: () => {
          reject('canceled by user')
        }
      }
      permissionsDialog.value = true
    })
  }

  const connectDeviceDialog = ref(false)
  const connectDeviceCallbacks = ref(null)

  async function askToConnectCamera(constraints) {
    return new Promise((resolve, reject) => {
      connectDeviceCallbacks.value = {
        connected: () => resolve({ ...constraints }),
        camera: () => resolve({ ...constraints, audio: false }),
        microphone: () => resolve({ ...constraints, video: false }),
        cancel: () => resolve(null)
      }
      connectDeviceDialog.value = true
    })
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
    this.displayMedia = null
  }


  function sendTestMessage() {
    for(const connection of this.peer.value.connections) {
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