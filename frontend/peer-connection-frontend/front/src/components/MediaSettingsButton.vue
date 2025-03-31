<template>
  <div>
    <OverlayPanel ref="mediaSettingsOverlay">
      <div class="flex flex-col gap-2 pt-2 justify-around" style="min-width: 20rem; max-width: 90vw">
        git c<div v-if="audioInputRequest !== 'none' && model.audioInputs?.length > 0"
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
    </OverlayPanel>

    <Button @click="toggleMediaSettings" raised
            icon="bx bx-cog" severity="" rounded v-ripple />
  </div>
</template>

<script setup>
  import Button from 'primevue/button'
  import OverlayPanel from 'primevue/overlaypanel'
  import Dropdown from 'primevue/dropdown'


  import { defineModel, defineProps, defineEmits, computed, ref, toRefs, onMounted } from 'vue'
  import { useEventListener } from '@vueuse/core'

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

  const mediaSettingsOverlay = ref()

  function toggleMediaSettings(ev) {
    mediaSettingsOverlay.value.toggle(ev)
    console.log('toggleMediaSettings')
  }

  function updateAudioInput(value) {
    model.value = {
      ...model.value,
      audioInput: value
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

</script>

<style scoped>

</style>