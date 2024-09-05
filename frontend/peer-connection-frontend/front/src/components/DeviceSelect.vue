<template>
  <div>
    <div v-if="videoInputRequest !== 'none'" @click="handleEmptyPreviewClick"
         class="w-full bg-gray-900 relative" style="aspect-ratio: 16/9">
      <div v-if="!model?.videoInput?.deviceId"
           class="flex flex-column align-items-center justify-content-center h-full">
        <i class="pi pi-eye-slash text-9xl text-gray-500" style="font-size: 2.5rem" />
        <div class="text-xl">Video input not found!</div>
        <div class>Please connect camera.</div>
        <audio v-if="model?.audioInput?.deviceId"
               autoplay playsinline :muted="userMediaMuted"
               :src-object.prop.camel="userMedia">
        </audio>
      </div>
      <div v-else class="bg-black-alpha-90 flex align-items-center justify-content-center">
        <video v-if="userMedia" autoplay playsinline :muted="userMediaMuted"
               :src-object.prop.camel="userMedia"
               class="max-w-full max-h-full" style="object-fit: contain; transform: scaleX(-1)">
        </video>
      </div>
      <div class="absolute top-0 left-0 w-full h-full flex flex-column justify-content-end align-items-center">
        <div class="flex flex-row justify-content-between align-items-center h-5rem w-7rem media-buttons">
          <MicrophoneButton v-model="model" @disabled-audio-click="handleDisabledAudioClick" />
          <CameraButton v-model="model" @disabled-video-click="handleDisabledVideoClick" />
        </div>
      </div>
      <div class="absolute top-0 right-0" v-if="userMedia">
        <div class="m-3">
          <VolumeIndicator :stream="userMedia" />
        </div>
      </div>
    </div>
    <div class="flex flex-row gap-2 pt-2 justify-content-around">
      <div v-if="audioInputRequest !== 'none' && audioInputs.length > 1"
           class="flex flex-column align-items-stretch flex-grow-1">
        <div class="text-sm mb-1 pl-1">Microphone</div>
        <Dropdown v-model="model.audioInput" :options="audioInputs"
                  optionLabel="label"
                  placeholder="Select">
          <template #value="slotProps">
            <div class="flex flex-row align-items-center">
              <i class="pi pi-microphone mr-2" />
              &nbsp;
              <div class="absolute overflow-hidden text-overflow-ellipsis" style="left: 2em; right: 2em;">
                {{ slotProps.value ? slotProps.value.label : slotProps.placeholder }}
              </div>
            </div>
          </template>
        </Dropdown>
      </div>
      <div v-if="audioOutputRequest !== 'none' && audioOutputs.length > 1"
           class="flex flex-column align-items-stretch flex-grow-1">
        <div class="text-sm mb-1 pl-1">Audio output</div>
        <Dropdown v-model="model.audioOutput" :options="audioOutputs" optionLabel="label"
                  placeholder="Select">
          <template #value="slotProps">
            <div class="flex flex-row align-items-center">
              <i class="pi pi-volume-up mr-2" />
              &nbsp;
              <div class="absolute overflow-hidden text-overflow-ellipsis" style="left: 2em; right: 2em;">
                {{ slotProps.value ? slotProps.value.label : slotProps.placeholder }}
              </div>
            </div>
          </template>
        </Dropdown>
      </div>

      <div v-if="videoInputRequest !== 'none' && videoInputs.length > 1"
           class="flex flex-column align-items-stretch flex-grow-1">
        <div class="text-sm mb-1 pl-1">Camera</div>
        <Dropdown v-model="model.videoInput" :options="videoInputs" optionLabel="label"
                  placeholder="Select">
          <template #value="slotProps">
            <div class="flex flex-row align-items-center">
              <i class="pi pi-camera mr-2" />
              &nbsp;
              <div class="absolute overflow-hidden text-overflow-ellipsis" style="left: 2em; right: 2em;">
                {{ slotProps.value ? slotProps.value.label : slotProps.placeholder }}
              </div>
            </div>
          </template>
        </Dropdown>
      </div>
    </div>

    <PermissionsDialog
      v-model="permissionsDialog" @ok="permissionsCallbacks.ok"
      :required-permissions="[{ name: 'camera' }, { name: 'microphone' }]"
      title="User media permissions" auto-close>
      <template #introduction>
        <div class="flex flex-column align-items-center">
          <p>For the best experience, please allow access to your camera and microphone.</p>
          <img src="/images/cameraAccess/en.png" style="height:50vh">
        </div>
      </template>
      <template #buttons="{ permissions: { camera, microphone } }">
        <Button v-if="camera === 'denied' && microphone === 'granted'
                      && audioInputRequest !== 'none' && videoInputRequest !== 'required'"
                @click="permissionsCallbacks.audioOnly()"
                label="Audio Only" icon="pi pi-eye-slash" class="p-button-warning" autofocus />
        <Button v-if="camera === 'granted' && microphone === 'denied'
                      && videoInputRequest !== 'none' && audioInputRequest !== 'required'"
                @click="permissionsCallbacks.videoOnly()"
                label="Video Only" icon="pi pi-volume-off" class="p-button-warning" autofocus />
        <Button @click="permissionsCallbacks.cancel()"
                label="Cancel" icon="pi pi-times" class="p-button-warning" autofocus />
      </template>
    </PermissionsDialog>
<!--

    <pre>PD: {{ permissionsDialog }}</pre>

    <pre>DEV: {{ devices }}</pre>

    <pre>UM: {{ userMedia }}</pre>-->

  </div>
</template>

<style lang="scss">
  .media-buttons {
    .bx::before {
      font-size: 1.69em;
    }
  }
</style>

<script setup>

  import Button from 'primevue/button'
  import Dropdown from 'primevue/dropdown'
  import PermissionsDialog from './PermissionsDialog.vue'
  import VolumeIndicator from './VolumeIndicator.vue'

  import { defineProps, defineModel, computed, ref, toRefs, onMounted, watch, watchEffect } from 'vue'
  import { useInterval, useEventListener } from  "@vueuse/core"
  import { getUserMedia as getUserMediaNative, getDisplayMedia as getDisplayMediaNative, isUserMediaPermitted }
    from "./userMedia.js"
  import MicrophoneButton from './MicrophoneButton.vue'
  import CameraButton from './CameraButton.vue'


  const props = defineProps({
    audioInputRequest: {
      type: String,
      default: 'wanted'
    },
    audioOutputRequest: {
      type: String,
      default: 'wanted' // can be wanted required or none
    },
    videoInputRequest: {
      type: String,
      default: 'wanted'
    },
    constraints: {
      type: Object,
      default: () => ({})
    }
  })
  const { audioInputRequest, audioOutputRequest, videoInputRequest, constraints } = toRefs(props)

  const model = defineModel({
    required: true,
    type: Object,
    properties: {
      audioInput: {
        type: Object
      },
      audioOutput: {
        type: Object
      },
      videoInput: {
        type: Object
      },
      audioMuted: {
        type: Boolean
      },
      videoMuted: {
        type: Boolean
      },
      userMedia: {
        type: Object
      }
    }
  })

  globalThis.deviceSelectModel = model

  const devices = ref([])
  async function updateDevices() {
    console.log("UPDATE DEVICES")
    devices.value = await navigator.mediaDevices.enumerateDevices()
    console.log("DEVICES", JSON.stringify(devices.value))
  }
  if(typeof window !== 'undefined') {
    useEventListener(navigator.mediaDevices, 'devicechange', updateDevices)
    onMounted(updateDevices)
  }

  const audioInputs = computed(() => devices.value.filter(device => device.kind === 'audioinput'))
  const audioOutputs = computed(() => devices.value.filter(device => device.kind === 'audiooutput'))
  const videoInputs = computed(() => devices.value.filter(device => device.kind === 'videoinput'))

  watch(audioInputs, (value) => {
    model.value = {
      ...model.value,
      audioInput: value[0]
    }
  }, { immediate: true })
  watch(audioOutputs, (value) => {
    model.value = {
      ...model.value,
      audioOutput: value[0]
    }
  }, { immediate: true })
  watch(videoInputs, (value) => {
    model.value = {
      ...model.value,
      videoInput: value[0]
    }
  }, { immediate: true })

/*  onMounted(() => {
    if(!model.value?.audioInput || !model.value?.audioOutput || !model.value?.videoInput) {
      console.log("AUTO SELECT", audioInputs.value)
      model.value = {
        ...model.value,
        audioInput: model.audioInput || audioInputs.value[0],
        audioOutput: model.audioOutput || audioOutputs.value[0],
        videoInput: model.videoInput || videoInputs.value[0]
      }
    }
  })*/

  const limitedMedia = ref(null)

  const selectedConstraints = ref({ video: false, audio: false })
  watch(() => ({
    video: limitedMedia.value === 'audio' ? false :
      { deviceId: model.value?.videoInput?.deviceId, ...constraints.value.video },
    audio: limitedMedia.value === 'video' ? false :
      { deviceId: model.value?.audioInput?.deviceId, ...constraints.value.audio }
  }), ({ video, audio }) => {
    console.log("SELECTED CONSTRAINTS", {
      video: selectedConstraints.value.video?.deviceId,
      audio: selectedConstraints.value.audio?.deviceId
    })
    if(selectedConstraints.value.video?.deviceId !== video?.deviceId
      || selectedConstraints.value.audio?.deviceId !== audio?.deviceId) {
      console.log("SELECTED CONSTRAINTS CHANGE", { video: video.deviceId, audio: audio.deviceId })
      selectedConstraints.value = { video, audio }
    }
  }, { immediate: true })

  const userMedia = ref(null)
  async function updateUserMedia() {
    if(userMedia.value) {
      console.log("CLOSE USER MEDIA")
      userMedia.value.getTracks().forEach(track => track.stop())
      userMedia.value = null
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    const constraints = selectedConstraints.value
    const videoAllowed = videoInputRequest.value !== 'none' && constraints.video
    const audioAllowed = audioInputRequest.value !== 'none' && constraints.audio
    if(!videoAllowed && !audioAllowed) {
      console.log("USER MEDIA NOT ALLOWED")
      return
    }
    console.log("TRY GET USER MEDIA", JSON.stringify(constraints, null, 2))
    try {
      console.log("GET USER MEDIA")
      const mediaStream = await getUserMediaNative(constraints)
      console.log("Got User Media", mediaStream)
      userMedia.value = mediaStream
    } catch(e) {
      console.error("Failed to get user media", e)
    }
  }

  watch(() => selectedConstraints.value, updateUserMedia, { immediate: true })

  const userMediaMuted = true

  watch(() => userMedia.value, stream => {
    console.log("MEDIA STREAM CHANGE", stream)
    model.value = {
      ...model.value,
      media: stream
    }
  })

  watchEffect(() => {
    if(userMedia.value) {
      console.log("STREAM", userMedia.value, model.value.audioMuted, model.value.videoMuted)
      userMedia.value.getAudioTracks().forEach(track => track.enabled = !model.value.audioMuted)
      userMedia.value.getVideoTracks().forEach(track => track.enabled = !model.value.videoMuted)
    }
  })


  const permissionsDialog = ref({ })
  const permissionsCallbacks = ref({})

  async function showPermissionsDialog() {
    return new Promise((resolve, reject) => {
      permissionsCallbacks.value = {
        audioOnly: () => {
          limitedMedia.value = 'audio'
          permissionsDialog.value = {
            ...permissionsDialog.value,
            visible: false
          }
          updateDevices()
          resolve(true)
        },
        videoOnly: () => {
          permissionsDialog.value = {
            ...permissionsDialog.value,
            visible: false
          }
          limitedMedia.value = 'video'
          updateDevices()
          resolve(true)
        },
        ok: () => {
          console.log("OK")
          updateDevices()
          resolve(true)
        },
        cancel: () => {
          permissionsDialog.value = {}
          reject('canceled by user')
        }
      }
      permissionsDialog.value = {
        ...permissionsDialog.value,
        visible: true
      }
    })
  }

  function handleEmptyPreviewClick() {
    if(userMedia.value) return
    const { camera, microphone } = permissionsDialog.value.permissions
    if(camera === 'denied' || microphone === 'denied') {
      // open permissions dialog
      showPermissionsDialog()
    }
  }

  function handleDisabledAudioClick() {
    limitedMedia.value = null
    const { camera, microphone } = permissionsDialog.value.permissions
    if(camera === 'denied' || microphone === 'denied') {
      // open permissions dialog
      showPermissionsDialog()
    }
  }
  function handleDisabledVideoClick() {
    console.log("DISABLED VIDEO CLICK")
    limitedMedia.value = null
    const { camera, microphone } = permissionsDialog.value.permissions
    if(camera === 'denied' || microphone === 'denied') {
      // open permissions dialog
      showPermissionsDialog()
    }
  }

  const permissionsMap = ref({})
  watch(() => permissionsDialog.value.permissions, value => {
    console.log("PERMISSIONS DIALOG PERMISSIONS", value)
    if(!permissionsMap.value.camera && !permissionsMap.value.microphone) { // first update
      console.log('FIRST PERMISSIONS UPDATE', value)
      if(value.camera === 'denied' || value.microphone === 'denied') {
        showPermissionsDialog()
      }
    }
    if(permissionsMap.value.camera !== value.camera || permissionsMap.value.microphone !== value.microphone) {
      permissionsMap.value = value
    }
  })
  watch(() => permissionsMap.value, value => {
    console.log("PERMISSIONS MAP CHANGED", value)
    updateDevices()
    //updateUserMedia()
  })

</script>

<style scoped>

</style>