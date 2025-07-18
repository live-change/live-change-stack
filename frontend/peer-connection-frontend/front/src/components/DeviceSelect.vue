<template>
  <div>
    <div v-if="videoInputRequest !== 'none'" @click="handleEmptyPreviewClick"
         class="w-full bg-gray-900 relative" style="aspect-ratio: 16/9">
      <div v-if="!model?.videoInput?.deviceId"
           class="flex flex-col items-center justify-center h-full">
        <i class="pi pi-eye-slash text-9xl text-gray-500" style="font-size: 2.5rem" />
        <div class="text-xl">Video input not found!</div>
        <div class>Please connect camera.</div>
        <audio v-if="model?.audioInput?.deviceId" ref="outputElement"
               autoplay playsinline :muted="userMediaMuted"
               :src-object.prop.camel="model.media">
        </audio>
      </div>
      <div v-else class="bg-black/90 flex items-center justify-center absolute w-full h-full">
        <video v-if="model.media" autoplay playsinline :muted="userMediaMuted" ref="outputElement"
               :src-object.prop.camel="model.media"
               class="max-w-full max-h-full" style="object-fit: contain; transform: scaleX(-1)">
        </video>
      </div>

      <div v-if="model.cameraAccessError || model.mediaError"
           class="absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center">
        <div v-if="model.cameraAccessError"
             class="flex flex-col justify-center items-center m-4 p-2 bg-black/40">
          <i class="bx bx-camera-off text-4xl text-red-600" />
          <div class="text-red-500 text-xl mb-1">
            Cannot access the camera.
          </div>
          <div class="text-red-500 text-sm text-center">
            It might be in use by another application or there might be a hardware issue.
            Please ensure no other applications are using the camera and try again.
          </div>
        </div>
        <div v-else-if="model.mediaError"
             class="flex flex-col justify-center items-center m-4 p-2 bg-black/40">
          <i class="bx bx-camera-off text-4xl text-red-600" />
          <div class="text-red-500 text-xl mb-1">
            Cannot access media devices.
          </div>
          <div class="text-red-500 text-sm text-center">
            {{ model.mediaError }}
          </div>
        </div>
      </div>

      <div v-if="gettingUserMedia"
           class="absolute top-0 left-0 w-full h-full flex flex-col justify-center items-center">
        <ProgressSpinner  />
      </div>

      <div class="absolute top-0 left-0 w-full h-full flex flex-col justify-end items-center">
        <div class="flex flex-row justify-between items-center h-20 w-28 media-buttons">
          <MicrophoneButton v-model="model" @disabled-audio-click="handleDisabledAudioClick" />
          <CameraButton v-model="model" @disabled-video-click="handleDisabledVideoClick" />
        </div>
      </div>
      <div class="absolute top-0 right-0" v-if="model.media">
        <div class="m-4">
          <VolumeIndicator :stream="model.media" />
        </div>
      </div>

    </div>
    <div class="flex flex-row gap-2 pt-2 justify-around">
      <div v-if="audioInputRequest !== 'none' && model.audioInputs?.length > 0"
           class="flex flex-col items-stretch grow">
        <div class="text-sm mb-1 pl-1">Microphone</div>
        <Dropdown :modelValue="model.audioInput"
                  @update:modelValue="value => updateAudioInput(value)"
                  :options="model.audioInputs"
                  optionLabel="label"
                  placeholder="Select">
          <template #value="slotProps">
            <div class="flex flex-row items-center">
              <i class="pi pi-microphone mr-2" />
              &nbsp;
              <div class="absolute overflow-hidden text-ellipsis" style="left: 2em; right: 2em;">
                {{ slotProps.value ? slotProps.value.label : slotProps.placeholder }}
              </div>
            </div>
          </template>
        </Dropdown>
      </div>
      <div v-if="audioOutputRequest !== 'none' && model.audioOutputs?.length > 0"
           class="flex flex-col items-stretch grow">
        <div class="text-sm mb-1 pl-1">Audio output</div>
        <Dropdown :modelValue="model.audioOutput"
                  @update:modelValue="value => updateAudioOutput(value)"
                  :options="model.audioOutputs" optionLabel="label"
                  placeholder="Select">
          <template #value="slotProps">
            <div class="flex flex-row items-center">
              <i class="pi pi-volume-up mr-2" />
              &nbsp;
              <div class="absolute overflow-hidden text-ellipsis" style="left: 2em; right: 2em;">
                {{ slotProps.value ? slotProps.value.label : slotProps.placeholder }}
              </div>
            </div>
          </template>
        </Dropdown>
      </div>

      <div v-if="videoInputRequest !== 'none' && model.videoInputs?.length > 0"
           class="flex flex-col items-stretch grow">
        <div class="text-sm mb-1 pl-1">Camera</div>
        <Dropdown :modelValue="model.videoInput"
                  @update:modelValue="value => updateVideoInput(value)"
                  :options="model.videoInputs" optionLabel="label"
                  placeholder="Select">
          <template #value="slotProps">
            <div class="flex flex-row items-center">
              <i class="pi pi-camera mr-2" />
              &nbsp;
              <div class="absolute overflow-hidden text-ellipsis" style="left: 2em; right: 2em;">
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
        <div class="flex flex-col items-center">
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

<!--    <pre>{{ model }}</pre>-->
<!--    <pre>{{ audioInputs }}</pre>-->
<!--

    <pre>PD: {{ permissionsDialog }}</pre>

    <pre>DEV: {{ devices }}</pre>

    <pre>UM: {{ model.media }}</pre>-->

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
  import ProgressSpinner from 'primevue/progressspinner'
  import PermissionsDialog from './PermissionsDialog.vue'
  import VolumeIndicator from './VolumeIndicator.vue'

  import { defineProps, defineModel, computed, ref, toRefs, onMounted, watch, watchEffect } from 'vue'
  import { useIntervalFn, useEventListener } from  "@vueuse/core"
  import {
    getUserMedia as getUserMediaNative, getDisplayMedia as getDisplayMediaNative,
    isUserMediaPermitted, stopMedia
  } from "./userMedia.js"
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
    },
    retryMediaOnError: {
      type: Boolean,
      default: false
    }
  })
  const { audioInputRequest, audioOutputRequest, videoInputRequest, constraints, retryMediaOnError } = toRefs(props)

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
      media: {
        type: Object
      },
      mediaError: {
        type: Object
      },
      cameraAccessError: {
        type: Object
      }
    }
  })

  if(typeof window !== 'undefined') {
    window.deviceSelectModel = model
  }

  function restoreSavedDevice(model, deviceType) {
    const saved = localStorage.getItem(deviceType)
    const devices = model[deviceType+'s']
    if(!devices || devices.length === 0) {
      model[deviceType] = null
      return
    }
    let savedDevice = null
    if(saved) {
      const parsed = JSON.parse(saved)
      savedDevice = devices.find(device => device.deviceId === parsed.deviceId)
        || devices.find(device => device.label === parsed.label)      
    } 
    if(savedDevice) {
      model[deviceType] = savedDevice        
    } else {
      if(model[deviceType]) {
        const exists = devices.find(device => device.deviceId === model[deviceType].deviceId)
        model[deviceType] = exists
      }
      model[deviceType] = devices[0]      
    }
  }

  const devices = ref([])
  async function updateDevices() {
    console.log("UPDATE DEVICES")
    devices.value = await navigator.mediaDevices.enumerateDevices()
    console.log("DEVICES", JSON.stringify(devices.value))
    const newModel = {
      ...model.value,
      audioInputs: devices.value.filter(device => device.kind === 'audioinput').map(fixLabel),
      audioOutputs: devices.value.filter(device => device.kind === 'audiooutput').map(fixLabel),
      videoInputs: devices.value.filter(device => device.kind === 'videoinput').map(fixLabel)
    }
    console.log("NEW MODEL", newModel)
    restoreSavedDevice(newModel, 'audioInput')
    restoreSavedDevice(newModel, 'audioOutput')
    restoreSavedDevice(newModel, 'videoInput')
    model.value = newModel
  }
  if(typeof window !== 'undefined') {
    useEventListener(navigator.mediaDevices, 'devicechange', updateDevices)
    onMounted(updateDevices)
  }

  function fixLabel(device, index) {
    const { deviceId, groupId, kind, label } = device
    if(!label.trim()) return {
      deviceId, groupId, kind,
      label: ({
        audioinput: "Audio Input",
        audiooutput: "Audio Output",
        videoinput: "Video Input"
      }[kind]) + ` ${index + 1}`
    }
    return device
  }

/*  watch(model.value, (v) => {
    console.trace("MODEL CHANGED", v)
    if(typeof v.audioInput === 'string') throw new Error("AUDIO INPUT IS STRING")
    if(typeof v.audioOutput === 'string') throw new Error("AUDIO OUTPUT IS STRING")
    if(typeof v.videoInput === 'string') throw new Error("VIDEO INPUT IS STRING")
  }, { immediate: true, deep: true })*/

  function setUserMedia(media) {
    if(media === model.value.media) return
    if(media?.id === model.value.media?.id) return
    console.log("MEDIA STREAM CHANGE", media, 'FROM', model.value.media)
    if(model.value.media) {
      stopMedia(model.value.media)
    }
    model.value = {
      ...model.value,
      media
    }
    setTimeout(() => { /// firefox needs this timeout
      model.value = {
        ...model.value,
        media
      }
      console.log("MEDIA STREAM CHANGED", model.value.media, media)
    }, 1)
  }

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
  watchEffect(() => {
    const video = videoInputRequest.value === 'none' ? false :
      (limitedMedia.value === 'audio' ? false :
        { deviceId: model.value?.videoInput?.deviceId, ...constraints.value.video })
    const audio = audioInputRequest.value === 'none' ? false :
      (limitedMedia.value === 'video' ? false :
        { deviceId: model.value?.audioInput?.deviceId, ...constraints.value.audio })  
    console.log("SELECTED CONSTRAINTS", {
      video: selectedConstraints.value.video?.deviceId,
      audio: selectedConstraints.value.audio?.deviceId
    })
    if(selectedConstraints.value.video?.deviceId !== video?.deviceId
      || selectedConstraints.value.audio?.deviceId !== audio?.deviceId) {
      console.log("SELECTED CONSTRAINTS CHANGE", { video: video.deviceId, audio: audio.deviceId })
      selectedConstraints.value = { video, audio }
    }
  })

  const gettingUserMedia = ref(false)
  async function updateUserMedia(retry = false) {
    console.log("USER MEDIA UPDATE WHEN MODEL IS", model.value)
    if(gettingUserMedia.value) return
    if(!retry && model.value.mediaError) {
      console.log("CLEAR MEDIA ERROR")
      model.value = {
        ...model.value,
        mediaError: null
      }
    }
    gettingUserMedia.value = true
    try {
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
        if(JSON.stringify(selectedConstraints.value) !== JSON.stringify(constraints)) {
          console.log("SELECTED CONSTRAINTS CHANGED WHILE GETTING USER MEDIA")
          stopMedia(mediaStream)
          gettingUserMedia.value = false
          setTimeout(() => updateUserMedia(), 10)
          return
        }
        /*      if(userMedia.value && retry) {
          console.log("CLOSE USER MEDIA")
          userMedia.value.getTracks().forEach(track => track.stop())
          userMedia.value = null
          await new Promise(resolve => setTimeout(resolve, 100))
        }*/
        console.log("Got User Media", mediaStream)
        setUserMedia(mediaStream)
        if(model.value.cameraAccessError || model.value.mediaError) {
          model.value = {
            ...model.value,
            cameraAccessError: null,
            mediaError: null
          }
        }
      } catch(error) {
        console.error("Failed to get user media", error)
        if(error.name === 'NotReadableError') {
          const isCameraRelated = error.message.includes('video') || error.message.includes('camera')
          if(isCameraRelated) {
            model.value = {
              ...model.value,
              cameraAccessError: error
            }
            console.log("RE", retry)
            if(retry) return
            try {
              console.log("GET USER MEDIA 2")
              const mediaStream = await getUserMediaNative({
                ...constraints,
                video: false
              })
              console.log("Got User Media 2", mediaStream)
              setUserMedia(mediaStream)
            } catch(error) {
              model.value = {
                ...model.value,
                mediaError: error,
                cameraAccessError: null
              }
            }
          } else {
            model.value = {
              ...model.value,
              mediaError: error
            }
          }
        } else if(error.name === 'PermissionDeniedError') {
          showPermissionsDialog()
        } else if(error.name === 'NotAllowedError') {
          showPermissionsDialog()
        } else {
          model.value = {
            ...model.value,
            mediaError: error
          }
        }
      }
    } finally {
      gettingUserMedia.value = false
    }
  }

  watch(() => selectedConstraints.value, (constraints, oldConstraints) => {
    console.log("CONSTRAINTS CHANGED FROM", oldConstraints, 'TO', constraints)
    updateUserMedia()
  })
  onMounted(() => {
    if(!model.value.media) {
      updateUserMedia()
    }
  })

  useIntervalFn(() => {
    if(!retryMediaOnError.value) return
    if(!model.value.cameraAccessError) return
    console.log("RETRY CAMERA ACCESS!")
    updateUserMedia(true)
  }, 1000)

  const userMediaMuted = true


  watchEffect(() => {
    if(model.value.media) {
      console.log("STREAM", model.value.media, model.value.audioMuted, model.value.videoMuted)
      model.value.media.getAudioTracks().forEach(track => track.enabled = !model.value.audioMuted)
      model.value.media.getVideoTracks().forEach(track => track.enabled = !model.value.videoMuted)
    }
  })

  const outputElement = ref(null)
  watchEffect(() => {
    const output = outputElement.value
    const outputDeviceId = model.value?.audioOutput?.deviceId
    if(!output) return
    (async () => {
      if(outputDeviceId) {
        await output.setSinkId(outputDeviceId)
      } else {
        //await output.setSinkId(null)
      }
    })()
  })

  const permissionsDialog = ref({ })
  const permissionsCallbacks = ref({})

  async function showPermissionsDialog() {
    try {
      await Promise.all([
        navigator.permissions.query({ name: 'camera' }),
        navigator.permissions.query({ name: 'microphone' })
      ])
    } catch(error) {
      /// TODO: some other dialog for firefox...
      return
    }
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
    if(model.value.media) return
    if(!permissionsDialog.value?.permissions) return
    const { camera, microphone } = permissionsDialog.value.permissions
    if(camera === 'denied' || microphone === 'denied') {
      // open permissions dialog
      showPermissionsDialog()
    }
  }

  function handleDisabledAudioClick() {
    limitedMedia.value = null
    if(!permissionsDialog.value?.permissions) return
    const { camera, microphone } = permissionsDialog.value.permissions
    if(camera === 'denied' || microphone === 'denied') {
      // open permissions dialog
      showPermissionsDialog()
    }
  }
  function handleDisabledVideoClick() {
    console.log("DISABLED VIDEO CLICK")
    limitedMedia.value = null
    if(!permissionsDialog.value?.permissions) return
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

  function updateAudioInput(value) {
    model.value = {
      ...model.value,
      audioInput: value,
    }
  }
  function updateAudioOutput(value) {
    model.value = {
      ...model.value,
      audioOutput: value
    }
  }
  function updateVideoInput(value) {
    model.value = {
      ...model.value,
      videoInput: value
    }
  }

  watch(() => model.value.audioInput, (value) => {
    if(value && value.deviceId === model.audioInputs?.value?.[0]?.deviceId) {
      localStorage.removeItem('audioInput')
    } else if(value) localStorage.setItem('audioInput', JSON.stringify(value))
  })
  watch(() => model.value.audioOutput, (value) => {
    if(value && value.deviceId === model.audioOutputs?.value?.[0]?.deviceId) {
      localStorage.removeItem('audioOutput')
    } else if(value) localStorage.setItem('audioOutput', JSON.stringify(value))
  })
  watch(() => model.value.videoInput, (value) => {
    if(value && value.deviceId === model.videoInputs?.value?.[0]?.deviceId) {
      localStorage.removeItem('videoInput')
    } else if(value) localStorage.setItem('videoInput', JSON.stringify(value))
  })
  
  

</script>

<style scoped>

</style>