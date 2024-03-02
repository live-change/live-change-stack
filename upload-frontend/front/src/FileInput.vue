<template>
  <span class="relative">
    <slot></slot>
    <input class="hidden-file" :name="name" type="file" :multiple="multiple" :accept="accept"
           @change="handleInputChange" ref="fileInput">
  </span>
</template>

<script setup>
  import { ref } from "vue"
  import { toRefs } from "@vueuse/core"

  const props = defineProps({
    accept: {
      type: String
    },
    multiple: {
      type: Boolean,
      default: false
    },
    name: {
      type: String
    }
  })

  const { multiple } = toRefs(props)

  const fileInput = ref()

  const emit = defineEmits(['input'])

  function handleFileSelected(file) {
    emit('input', file)
  }

  function handleInputChange(e) {
    let files = e.target.files || e.dataTransfer.files
    if (!files.length) return
    if(multiple.value) {
      handleFileSelected(files)
    } else {
      handleFileSelected(files[0])
    }
    fileInput.value = null
  }

</script>

<style scoped>
  span.file-input {
    position: relative;
    display: flex;
    height: auto;
  }

  input.hidden-file {
    border: none;
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    pointer-events: all;
    cursor: pointer;
    opacity: 0;
  }
</style>