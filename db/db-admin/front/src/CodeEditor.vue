<template>
  <BaseCodeEditor
    ref="editorRef"
    editor-class="config-editor"
    v-bind="props"
    @result="(...args) => emit('result', ...args)"
  />
</template>

<script setup>
  import { ref } from 'vue'
  import { CodeEditor as BaseCodeEditor } from '@live-change/vue3-components'

  const props = defineProps({
    initialCode: {
      type: String
    },
    initialData: {
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    env: {
      type: Object
    },
    dbSugar: {
      type: Object
    }
  })

  const emit = defineEmits(['result'])
  const editorRef = ref()

  defineExpose({
    reset: () => editorRef.value?.reset()
  })
</script>

<style scoped>
  :deep(.config-editor) {
    font-family: monospace;
    outline: none;
  }
  :deep(.config-editor .cm-editor) {
    padding: 0.5em;
  }
  :deep(.config-editor .cm-focused) {
    outline: none;
  }
</style>
