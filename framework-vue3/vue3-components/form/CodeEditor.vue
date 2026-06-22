<template>
  <div
    v-if="isMounted"
    ref="editorRoot"
    :class="editorClass"
    :style="{ minHeight: (codeLines * 1.35 + heightOffset) + 'em' }"
  />
  <small v-if="editResult.error" class="p-error block mt-1">{{ editResult.error }}</small>
  <slot name="formField" />
</template>

<script setup>
  import { stringify } from 'javascript-stringify'
  import { EditorState } from '@codemirror/state'
  import { EditorView, drawSelection, lineNumbers, keymap } from '@codemirror/view'
  import { javascript } from '@codemirror/lang-javascript'
  import { syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'
  import { defaultKeymap } from '@codemirror/commands'

  import { ensureCodeMirrorHighlightStyles } from '../codemirror/setupHighlight.js'

  import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'

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
    },
    editorClass: {
      type: String,
      default: 'lc-code-editor'
    },
    heightOffset: {
      type: Number,
      default: 0
    }
  })

  const { env, dbSugar } = props

  const emit = defineEmits(['result'])

  const editorRoot = ref(null)
  const isMounted = ref(false)
  let cmView
  let updatingFromEditor = false

  const code = ref(
    props.initialCode !== undefined
      ? props.initialCode
      : stringify(props.initialData, null, '  ')
  )

  watch(() => props.initialCode, () => {
    if (props.initialCode == code.value) return
    setCode(
      props.initialCode !== undefined
        ? props.initialCode
        : stringify(props.initialData, null, '  ')
    )
  })

  function setCode(value) {
    code.value = value
    if (!cmView || cmView.state.doc.toString() === value) return
    updatingFromEditor = true
    cmView.dispatch({
      changes: { from: 0, to: cmView.state.doc.length, insert: value }
    })
    updatingFromEditor = false
  }

  const codeLines = computed(() => Math.max(1, code.value.split('\n').length))

  const modified = computed(() => code.value != props.initialCode)

  const editResult = computed(() => {
    if (!modified.value && props.initialData) return { data: props.initialData, code: code.value }
    try {
      const $ = env || {}
      const db = dbSugar || {}
      const result = eval(`(${code.value})`)
      if (result === false) return { data: false, code: code.value }
      if (result) return { data: result, code: code.value }
      return { error: 'empty' }
    } catch (e) {
      if (e instanceof SyntaxError) {
        if (e.lineNumber) return {
          error: `${e.message} at ${e.lineNumber}:${e.columnNumber - (e.lineNumber ? 0 : -1)}`
        }
      }
      return { error: e.message }
    }
  })

  function reset() {
    setCode(
      props.initialCode !== undefined
        ? props.initialCode
        : stringify(props.initialData, null, '  ')
    )
  }

  watch(() => editResult.value, () => emit('result', editResult.value))

  function buildExtensions(showLineNumbers) {
    return [
      drawSelection(),
      syntaxHighlighting(defaultHighlightStyle),
      javascript(),
      EditorView.editable.of(!props.readOnly),
      keymap.of(defaultKeymap),
      ...(showLineNumbers ? [lineNumbers()] : []),
      EditorView.updateListener.of((update) => {
        if (!update.docChanged || updatingFromEditor) return
        code.value = update.state.doc.toString()
      })
    ]
  }

  onMounted(async () => {
    ensureCodeMirrorHighlightStyles()
    isMounted.value = true
    await nextTick()
    const showLineNumbers = codeLines.value > 1
    cmView = new EditorView({
      parent: editorRoot.value,
      state: EditorState.create({
        doc: code.value,
        extensions: buildExtensions(showLineNumbers)
      })
    })
  })

  watch(codeLines, (lines, prevLines) => {
    if (!cmView) return
    const showLineNumbers = lines > 1
    const prevShowLineNumbers = (prevLines ?? 1) > 1
    if (showLineNumbers === prevShowLineNumbers) return
    const doc = cmView.state.doc.toString()
    cmView.setState(EditorState.create({
      doc,
      extensions: buildExtensions(showLineNumbers)
    }))
  })

  onBeforeUnmount(() => {
    cmView?.destroy()
    cmView = undefined
  })

  defineExpose({ reset })
</script>
