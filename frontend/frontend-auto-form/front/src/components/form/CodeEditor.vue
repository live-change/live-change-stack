<template>
  <BaseCodeEditor
    ref="editorRef"
    editor-class="code-editor p-component p-textarea"
    :height-offset="1.23"
    v-bind="props"
    @result="(...args) => emit('result', ...args)"
  >
    <template #formField>
      <Textarea class="hidden" />
    </template>
  </BaseCodeEditor>
</template>

<script setup>
  import { ref } from 'vue'
  import Textarea from 'primevue/textarea'
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

<style lang="scss">
  :deep(.code-editor) {
    font-family: monospace;
    outline: none;
    .cm-editor {
      padding: 0.5em;
    }
    .cm-focused {
      outline: none;
    }
  }
</style>
