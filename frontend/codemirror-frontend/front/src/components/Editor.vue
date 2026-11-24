<template>
  <div ref="editorRoot" class="lc-cm-editor"></div>
</template>

<script setup>
  import { onMounted, onBeforeUnmount, ref, computed, watch, getCurrentInstance, nextTick } from 'vue'
  import { EditorState, Compartment, RangeSetBuilder } from '@codemirror/state'
  import { collab, receiveUpdates, sendableUpdates, getSyncedVersion } from '@codemirror/collab'
  import { EditorView, basicSetup } from 'codemirror'
  import { MatchDecorator, Decoration, ViewPlugin } from '@codemirror/view'
  import { highlightTree, tags } from '@lezer/highlight'
  import { defaultHighlightStyle, HighlightStyle, syntaxHighlighting } from '@codemirror/language'
  import { markdown } from '@codemirror/lang-markdown'
  import { javascript } from '@codemirror/lang-javascript'
  import { html } from '@codemirror/lang-html'
  import { css } from '@codemirror/lang-css'
  import { json } from '@codemirror/lang-json'
  import { oneDark, oneDarkHighlightStyle } from '@codemirror/theme-one-dark'
  import { useApi } from '@live-change/vue3-ssr'
  import RemoteAuthority from '../codemirror/RemoteAuthority.js'

  const props = defineProps({
    targetType: {
      type: String,
      required: true
    },
    target: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      default: 'document'
    },
    initialContent: {
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

  const emit = defineEmits(['update:synchronization-state', 'update:version'])

  const editorRoot = ref(null)
  const version = ref(1)
  const appContext = getCurrentInstance().appContext
  const api = useApi(appContext)
  const clientID = api.windowId
  let view
  let authority
  let pushScheduled = false
  const languageCompartment = new Compartment()
  const themeCompartment = new Compartment()

  const handlebarsMark = Decoration.mark({
    class: 'cm-handlebars',
    attributes: { style: 'color: #b45309' }
  })
  // Brackets, numbers and operators are missing from the stock light style.
  const extraHighlightStyle = HighlightStyle.define([
    { tag: tags.angleBracket, color: '#708' },
    { tag: tags.number, color: '#164' },
    { tag: tags.operator, color: '#a40' }
  ])
  const handlebarsDecorator = new MatchDecorator({
    regexp: /\{\{\{[\s\S]*?\}\}\}|\{\{[\s\S]*?\}\}/g,
    decoration: handlebarsMark
  })
  const handlebarsPlugin = ViewPlugin.fromClass(class {
    constructor(view) {
      this.decorations = handlebarsDecorator.createDeco(view)
    }
    update(update) {
      this.decorations = handlebarsDecorator.updateDeco(update, this.decorations)
    }
  }, {
    decorations: plugin => plugin.decorations
  })

  const editorExtensions = computed(() => [
    basicSetup,
    languageCompartment.of(languageExtension(props.language)),
    themeCompartment.of(themeExtension(props.dark)),
    collab({ startVersion: version.value, clientID }),
    EditorView.updateListener.of((update) => {
      if(update.docChanged) schedulePush()
    })
  ])

  function usesHandlebars(lang) {
    return lang === 'html' || lang === 'css' || lang === 'javascript' || lang === 'js'
  }

  function languageExtension(lang) {
    let support
    switch(lang) {
      case 'markdown':
        support = markdown()
        break
      case 'javascript':
      case 'js':
        support = javascript()
        break
      case 'html':
        support = html()
        break
      case 'css':
        support = css()
        break
      case 'json':
        support = json()
        break
      default:
        support = []
    }
    return usesHandlebars(lang) ? [support, handlebarsPlugin] : support
  }

  // Vite can load @codemirror/language twice (different ?v= on the same chunk).
  // The parser's tree then sits on a StateField the stock highlighter cannot see,
  // so read whichever language state actually holds a tree.
  function editorSyntaxTree(state) {
    const values = state.values
    if(!values) return null
    let best = null
    for(let i = 0; i < values.length; i++) {
      const value = values[i]
      if(!value || !value.context || !value.tree || typeof value.tree.iterate != 'function') continue
      if(!best || value.tree.length > best.length) best = value.tree
    }
    return best
  }

  function syntaxColorExtension(highlighter) {
    return ViewPlugin.fromClass(class {
      constructor(view) {
        this.decorations = this.build(view)
      }
      update(update) {
        this.decorations = this.build(update.view)
      }
      build(view) {
        const tree = editorSyntaxTree(view.state)
        if(!tree || !tree.length) return Decoration.none
        const builder = new RangeSetBuilder()
        const markCache = Object.create(null)
        let lastTo = -1
        try {
          for(const range of view.visibleRanges) {
            highlightTree(tree, highlighter, (start, end, style) => {
              if(end <= start || start < lastTo) return
              lastTo = end
              builder.add(start, end, markCache[style] || (markCache[style] = Decoration.mark({ class: style })))
            }, range.from, range.to)
          }
        } catch(error) {
          console.error('Syntax highlight failed', error)
          return Decoration.none
        }
        return builder.finish()
      }
    }, {
      decorations: plugin => plugin.decorations
    })
  }

  function themeExtension(dark) {
    if(dark) return [oneDark, syntaxColorExtension(oneDarkHighlightStyle)]
    return [
      syntaxHighlighting(defaultHighlightStyle),
      syntaxHighlighting(extraHighlightStyle),
      syntaxColorExtension([defaultHighlightStyle, extraHighlightStyle])
    ]
  }

  async function createView() {
    if(!editorRoot.value) return

    authority = new RemoteAuthority(appContext, props.targetType, props.target, props.type, {
      purpose: props.purpose,
      initialContent: props.initialContent
    })
    emit('update:synchronization-state', authority.synchronizationState.value)

    watch(
      () => authority?.synchronizationState.value,
      (state) => {
        if(state) emit('update:synchronization-state', state)
      }
    )

    const documentData = await authority.loadDocument()
    version.value = documentData.version
    emit('update:version', version.value)

    const state = EditorState.create({
      doc: Array.isArray(documentData.content) ? documentData.content.join('\n') : '',
      extensions: editorExtensions.value
    })

    try {
      view = new EditorView({
        state,
        parent: editorRoot.value,
        dispatch: (tr) => {
          view.update([tr])
        }
      })
    } catch (err) {
      console.error('CodeMirror EditorView failed', err)
      authority.synchronizationState.value = 'loadError'
      throw err
    }

    authority.synchronizationState.value = 'loaded'

    authority.onNewUpdates.push(() => {
      if(!view) return
      const syncedVersion = getSyncedVersion(view.state)
      const updates = authority.updatesSince(syncedVersion)
      if(updates.length === 0) return
      view.dispatch(receiveUpdates(view.state, updates))
      version.value = authority.remoteVersion
      emit('update:version', version.value)
    })

    authority.onResynchronization.push(() => {
      schedulePush()
    })
  }

  async function pushUpdates() {
    if(!view || !authority) return
    const updates = sendableUpdates(view.state)
    if(updates.length === 0) return
    const syncedVersion = getSyncedVersion(view.state)
    await authority.pushUpdates(syncedVersion, updates, clientID)
    version.value = authority.remoteVersion ?? syncedVersion
    emit('update:version', version.value)
  }

  function schedulePush() {
    if(pushScheduled) return
    pushScheduled = true
    queueMicrotask(async () => {
      pushScheduled = false
      try {
        await pushUpdates()
      } catch(error) {
        console.error('CodeMirror push failed', error)
      }
    })
  }

  onMounted(async () => {
    await nextTick()
    await createView()
  })

  onBeforeUnmount(() => {
    if(authority) {
      authority.dispose()
      authority = null
    }
    if(view) {
      view.destroy()
      view = null
    }
  })

  watch(
    () => props.language,
    () => {
      if(!view) return
      view.dispatch({
        effects: [
          languageCompartment.reconfigure(languageExtension(props.language))
        ]
      })
    }
  )

  watch(
    () => props.dark,
    () => {
      if(!view) return
      view.dispatch({
        effects: [
          themeCompartment.reconfigure(themeExtension(props.dark))
        ]
      })
    }
  )
</script>

<style scoped>
  .lc-cm-editor {
    border: 1px solid #ddd;
    border-radius: 4px;
    height: 100%;
    min-height: 300px;
  }
  .lc-cm-editor :deep(.cm-editor) {
    height: 100%;
  }
  .lc-cm-editor :deep(.cm-handlebars) {
    color: #b45309;
  }
</style>
