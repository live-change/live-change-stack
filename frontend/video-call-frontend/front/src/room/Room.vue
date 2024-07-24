<template>
  <LimitedAccess v-slot="{ authorized }" objectType="videoCall_Room" :object="room" :requiredRoles="requiredRoles">
    <div v-if="state === 'welcome'"
         class="surface-card shadow-1 border-round p-3 flex flex-row flex-wrap align-items-center">
      <div class="w-30rem m-1" style="max-width: 80vw">
        <DeviceSelect v-model="selectedDevices" />
      </div>
      <div class="m-3 text-center">
        <h3>Select your media devices, and join.</h3>
        <Button @click="join" icon="pi pi-check" label="Join" />
      </div>
    </div>
    <template v-else>
      <p>JOINED</p>
    </template>
<!--    <p>selected devices: {{ selectedDevices }}</p>
    <p>local media streams:  {{ localMediaStreams }}</p>
    <p>local tracks:  {{ localTracks }}</p>-->
    <div class="surface-card shadow-1 border-round mt-3 p-3">
      <pre>{{ JSON.stringify(peer?.summary, null, "  ") }}</pre>
    </div>
  </LimitedAccess>
</template>

<script setup>
  import { LimitedAccess } from "@live-change/access-control-frontend"
  import { DeviceSelect } from '@live-change/peer-connection-frontend'

  import {
    ref, unref, computed, watch, watchEffect, toRefs,
    onMounted, onUnmounted, defineProps, getCurrentInstance
  } from 'vue'
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
  const displayMedia = ref()

  const canJoin = computed(() => !!selectedDevices.value.userMedia)

  function join() {
    console.log('Joining room', room.value, selectedDevices.value)
    state.value = 'joining'
    state.value = 'joined'
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


</script>

<style scoped>

</style>