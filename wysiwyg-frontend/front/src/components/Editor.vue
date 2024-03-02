<template>
  <div class="relative">
    <slot v-if="editor" name="menu" :editor="editor">
      <EditorMenu :editor="editor" :config="config">
        <template #beforeMenu="scope"><slot name="before" v-bind="{ ...scope, editor }" /></template>
        <template #afterMenu="scope"><slot name="after" v-bind="{ ...scope, editor }" /></template>
        <template #begin="scope"><slot name="menuBegin" v-bind="{ ...scope, editor, saveState }" /></template>
        <template #end="scope"><slot name="menuEnd" v-bind="{ ...scope, editor, saveState }" /></template>
      </EditorMenu>
    </slot>
    <editor-content :editor="editor" class="content" />
  </div>
</template>

<script setup>

  import { useEditor, EditorContent } from '@tiptap/vue-3'
  import { History } from '@tiptap/extension-history'

  import { ref, computed, watch, provide, defineEmits, defineProps } from 'vue'
  import { toRefs } from '@vueuse/core'
  import EditorMenu from "./EditorMenu.vue"
  import { getExtensions } from "../tiptap/contentConfigExtensions.js"
  import { getSchemaSpecFromConfig } from "../tiptap/schemaJson.js"

  const props = defineProps({
    modelValue: {
      type: String,
      default: JSON.stringify({ type: 'doc', content: [ ] })
    },
    config: {
      type: Object,
      required: true
    }
  })

  const emit = defineEmits(['update:modelValue'])

  const extensions = getExtensions(props.config)

  const editor = useEditor({
    content: JSON.parse(props.modelValue),
    extensions: [
      ...extensions,
      History.configure({
        depth: 100,
        newGroupDelay: 500
      })
    ],
    onUpdate: ({ editor, transaction }) => {
      console.log("EDITOR UPDATE", editor, transaction)
      const editorJson = JSON.stringify(editor.getJSON())
      emit('update:modelValue', editorJson)
      emit('update', { editor, transaction })
    }
  })

  const { modelValue, config } = toRefs(props)

  watch(() => modelValue.value, value => {
    const editorJson = JSON.stringify(editor.value.getJSON())
    const isSame = editorJson === value
    if (isSame) return
    editor.commands.setContent(JSON.parse(value), false)
  })

  const schemaSpec = ref(getSchemaSpecFromConfig(props.config))

  provide('wysiwyg', {})

</script>

<style lang="scss">
  .ProseMirror {
    > * + * {
      margin-top: 0.75em;
    }

    code {
      display: block;
      white-space: pre-wrap;
      font-size: 0.8rem;
      padding: 0.75rem 1rem;
      background-color:#e9ecef;
      color: #495057;
    }
  }

  .content {
    padding: 1rem 0 0;

    h3 {
      margin: 1rem 0 0.5rem;
    }

    pre {
      overflow-x: auto;
    }

    img {
      width: 100%;
    }

  }

</style>
