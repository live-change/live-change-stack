<template>
  <div ref="editorRoot" class="lc-cm-editor"></div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { EditorState } from '@codemirror/state'
import { EditorView, basicSetup } from 'codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { javascript } from '@codemirror/lang-javascript'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  language: {
    type: String,
    default: 'markdown'
  },
  dark: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue'])

const editorRoot = ref(null)
let view

function languageExtension(lang) {
  switch (lang) {
    case 'markdown':
      return markdown()
    case 'javascript':
      return javascript()
    case 'html':
      return html()
    case 'css':
      return css()
    case 'json':
      return json()
    default:
      return []
  }
}

function createView() {
  if (!editorRoot.value) return
  const state = EditorState.create({
    doc: props.modelValue,
    extensions: [
      basicSetup,
      languageExtension(props.language),
      props.dark ? oneDark : []
    ]
  })
  view = new EditorView({
    state,
    parent: editorRoot.value,
    dispatch(tr) {
      view.update([tr])
      if (tr.docChanged) {
        emit('update:modelValue', view.state.doc.toString())
      }
    }
  })
}

onMounted(() => {
  createView()
})

onBeforeUnmount(() => {
  if (view) {
    view.destroy()
    view = null
  }
})

watch(
  () => props.modelValue,
  value => {
    if (!view) return
    const current = view.state.doc.toString()
    if (value !== current) {
      view.dispatch({
        changes: {
          from: 0,
          to: current.length,
          insert: value
        }
      })
    }
  }
)

watch(
  () => props.language,
  () => {
    if (!view) return
    view.dispatch({
      effects: EditorState.reconfigure.of([
        basicSetup,
        languageExtension(props.language),
        props.dark ? oneDark : []
      ])
    })
  }
)
</script>

<style scoped>
.lc-cm-editor {
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 200px;
}
</style>

