<template>
  <div @dragenter="handleDrag"
       @dragover="handleDrag"
       @dragleave="handleDragLeave"
       @drop="handleDrop"
       :class="[{
         [props.acceptedClass]: dragging && accepted,
         [props.wrongClass]: dragging && !accepted
         }, props.class]">
    <FileInput v-if="clickable" @input="input => emit('input', input)">
      <slot></slot>
    </FileInput>
    <slot v-else></slot>
  </div>
</template>

<script setup>
  import FileInput from "./FileInput.vue";

  const props = defineProps({
    accept: {
      type: String
    },
    multiple: {
      type: Boolean,
      default: false
    },
    acceptedClass: {
      type: String,
      default: 'surface-500'
    },
    wrongClass: {
      type: String,
      default: 'bg-orange-300'
    },
    class: {
      type: String
    },
    clickable: {
      type: Boolean,
      default: true
    }
  })

  const emit = defineEmits(['input'])

  import { ref } from 'vue'

  const dragging = ref(false)
  const accepted = ref(false)

  function isAccepted(dataTransfer) {
    if(!props.accept) return true // accept everything
    const accepted = props.accept.split(',').map(x=>x.trim())
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const item = dataTransfer.items[i]
      if(!accepted.includes(item.type)) return false
    }
    return true
  }

  function handleDrag(e) {
    dragging.value = true
    accepted.value = isAccepted(e.dataTransfer)
    e.dataTransfer.dropEffect = accepted.value ? 'copy' : 'none'
    e.preventDefault()
  }

  function handleDragLeave(ev) {
    dragging.value = false
  }

  function handleDrop(ev) {
    dragging.value = false
    ev.preventDefault()
    console.log("DROPPED", ev)
    let files = []
    if(ev.dataTransfer.items) {
      for(let i = 0; i < ev.dataTransfer.items.length; i++) {
        if(ev.dataTransfer.items[i].kind === 'file') {
          let file = ev.dataTransfer.items[i].getAsFile();
          files.push(file)
        }
      }
    } else {
      for (let i = 0; i < ev.dataTransfer.files.length; i++) {
        files.push(ev.dataTransfer.files[i])
      }
    }
    if(this.multiple) {
      emit('input', files)
    } else {
      emit('input', files[0])
    }
  }

</script>

<style scoped>

</style>
