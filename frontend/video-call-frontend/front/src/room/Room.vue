<template>
  <LimitedAccess objectType="videoCall_Room" :object="room"
                 :requiredRoles="requiredRoles"
                 hidden
                 class="absolute w-full h-full">
    <template #default>
      <div class="absolute w-full h-full flex flex-row items-center justify-center">
        <div v-if="isMounted"
             class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border p-4 flex flex-row flex-wrap items-center"
             :class="{ hidden: state !== 'welcome' }">
          <div class="w-[30rem] m-1" style="max-width: 80vw">
            <DeviceSelect :modelValue="selectedDevices" @update:modelValue="updateSelectedDevices" retry-media-on-error />
          </div>
          <div class="m-4 text-center">
            <h3>Select your media devices, and join.</h3>
            <Button @click="join" icon="pi pi-check" label="Join" />
          </div>
        </div>
      </div>
      <template v-if="state === 'joined'">
        <VideoWall
          :main-videos="mainVideos ?? []"
          :my-videos="myVideos ?? []"
          class="w-full h-full top-0 absolute"
          style="background: black"
        />
        <div class="absolute bottom-0 h-16 left-1/2 right-1/2 flex flex-row justify-center">
          <div class="absolute w-11rem h-full bg-black-alpha-70 flex flex-row align-items-center
           justify-content-between px-3">
            <MicrophoneButton v-model="selectedDevices" />
            <CameraButton v-model="selectedDevices" />
            <Button @click="leave" raised
                    icon="bx bx-exit" severity="warning" rounded v-ripple />
          </div>
        </div>
      </template>
      <!--    <p>selected devices: {{ selectedDevices }}</p>
          <p>local media streams:  {{ localMediaStreams }}</p>
          <p>local tracks:  {{ localTracks }}</p>-->
<!--      <div class="bg-black/50 shadow-sm rounded-border mt-4 p-4 absolute text-white/90">
        <pre>{{ JSON.stringify(peer?.summary, null, "  ") }}</pre>
      </div>-->
    </template>

  </LimitedAccess>
</template>

<script setup>
  import { LimitedAccess } from "@live-change/access-control-frontend"
  import { DeviceSelect, CameraButton, MicrophoneButton } from '@live-change/peer-connection-frontend'
  import VideoWall from './VideoWall.vue'
  import Button from 'primevue/button'

  import {
    ref, unref, computed, watch, watchEffect, toRefs,
    onMounted, onUnmounted, defineProps, getCurrentInstance
  } from 'vue'
  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { path, live, actions, api as useApi } from '@live-change/vue3-ssr'
  const api = useApi()

  const appContext = (typeof window != 'undefined') && getCurrentInstance()?.appContext

  import { createPeer, mediaStreamsTracks } from "@live-change/peer-connection-frontend"

  const props = defineProps({
    room: {
      type: String,
      required: true
    }
  })

  const { room } = toRefs(props)
  const requiredRoles = ['listener', 'speaker']

  const state = ref('welcome')

  const selectedDevices = ref({ })

  function updateSelectedDevices(value) {
    console.log("updateSelectedDevices", value)
    selectedDevices.value = value
  }

  const displayMedia = ref()

  const canJoin = computed(() => !!selectedDevices.value.userMedia)

  function join() {
    console.log('Joining room', room.value, selectedDevices.value)
    state.value = 'joining'
    state.value = 'joined'
  }

  function leave() {
    state.value = 'welcome'
  }

  const localMediaStreams = computed(() =>
    ( selectedDevices.value?.media ? [selectedDevices.value.media] : [])
      .concat(displayMedia.value ? [displayMedia.value] : [])
  )
  const localTracks = mediaStreamsTracks(localMediaStreams)
  watch(() => ([selectedDevices.value.audioMuted, selectedDevices.value.media]), ([muted, media]) => {
    if(!media) return
    for(const track of media.getAudioTracks()) for(const localTrack of localTracks.value)
      if(localTrack.track === track) localTrack.enabled = !muted
  }, { immediate: true })
  watch(() => ([selectedDevices.value.videoMuted, selectedDevices.value.media]), ([muted, media]) => {
    if(!media) return
    for(const track of media.getVideoTracks()) for(const localTrack of localTracks.value)
      if(localTrack.track === track) localTrack.enabled = !muted
  }, { immediate: true })

  const peer = ref()

  watchEffect(() => {
    if(!peer.value) return
    peer.value.online = state.value === 'joined'
  }, { immediate: true })

  let createPeerPromise = null
  async function initPeer() {
    if(createPeerPromise) return createPeerPromise
    createPeerPromise = createPeer({
      channelType: 'videoCall_Room',
      channel: room.value,
      onUnmountedCb: onUnmounted, appContext,
      localTracks,
    })
    peer.value = await createPeerPromise
    createPeerPromise = null
  }

  onMounted(async () => {
    await initPeer()
  })

  const myVideos = computed(() => {
    if(!peer.value) return []
    if(!localMediaStreams.value?.length) return []
    return localMediaStreams.value.map(stream => ({
      id: stream.id,
      stream,
      mirror: true,
      audioMuted: true,
      peerState: peer.value.localPeerState
    }))
  })

  const mainVideos = computed(() => {
    if(!peer.value) return []
    let output = []
    for(const connection of unref(peer.value.connections)) {
      const peerId = connection.to
      const otherPeer = peer.value.otherPeers.find(peer => peer.id === peerId)
      if(!otherPeer) continue
      for(const remoteTrack of unref(connection.remoteTracks)) {
        if(output.find(remoteStream => remoteStream.stream === remoteTrack.stream)) continue
        const [ownerType, owner] = otherPeer.user
          ? ['user_User', otherPeer?.user?.user]
          : ['session_Session', otherPeer?.session]
        output.push({
          id: remoteTrack.stream.id,
          from: connection.to,
          stream: remoteTrack.stream,
          peerState: otherPeer?.peerState,
          ownerType, owner
        })
      }
    }
    return output
  })

  if(typeof window !== 'undefined') {
    window.peer = peer
  }


</script>

<style scoped>

</style>