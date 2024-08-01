<template>
  <Button v-if="!model.audioInput?.deviceId"
          @click="emit('disabledAudioClick')" raised
          icon="bx bx-microphone-off"  severity="secondary" rounded v-ripple />
  <Button v-else-if="audioInputMuted" @click="audioInputMuted = false" raised
          icon="bx bx-microphone-off" severity="danger" rounded v-ripple />
  <Button v-else @click="audioInputMuted = true" raised
          icon="bx bx-microphone" severity="success" rounded v-ripple />
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

  const emit = defineEmits(['disabledAudioClick'])

  const audioInputMuted = computed({
    get: () => model.value?.audioMuted,
    set: (value) => model.value = {
      ...model.value,
      audioMuted: value
    }
  })

</script>

<style scoped>

</style>