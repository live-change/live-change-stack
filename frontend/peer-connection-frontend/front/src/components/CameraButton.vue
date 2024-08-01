<template>
  <Button v-if="!model.videoInput?.deviceId"
          @click="emit('disabledAudioClick')" raised
          icon="bx bx-camera-off"  severity="secondary" rounded v-ripple />
  <Button v-else-if="videoInputMuted" @click="videoInputMuted = false" raised
          icon="bx bx-camera-off" severity="danger" rounded v-ripple />
  <Button v-else @click="videoInputMuted = true" raised
          icon="bx bx-camera" severity="success" rounded v-ripple />
</template>

<script setup>
  import { defineModel, defineEmits, computed } from 'vue'

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

  const emit = defineEmits(['disabledVideoClick'])

  const videoInputMuted = computed({
    get: () => model.value?.videoMuted,
    set: (value) => model.value = {
      ...model.value,
      videoMuted: value
    }
  })

</script>

<style scoped>

</style>