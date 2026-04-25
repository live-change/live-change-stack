<template>
  <div ref="editorRoot" class="lc-cm-editor"></div>
</template>

<script setup>
  import { onMounted, onBeforeUnmount, ref, computed, watch, getCurrentInstance, nextTick } from 'vue'
  import { EditorState, Compartment } from '@codemirror/state'
  import { collab, receiveUpdates, sendableUpdates, getSyncedVersion } from '@codemirror/collab'
  import { EditorView, basicSetup } from 'codemirror'
  import { markdown } from '@codemirror/lang-markdown'
  import { javascript } from '@codemirror/lang-javascript'
  import { html } from '@codemirror/lang-html'
  import { css } from '@codemirror/lang-css'
  import { json } from '@codemirror/lang-json'
  import { oneDark } from '@codemirror/theme-one-dark'
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

  const editorExtensions = computed(() => [
    basicSetup,
    languageCompartment.of(languageExtension(props.language)),
    themeCompartment.of(props.dark ? oneDark : []),
    collab({ startVersion: version.value, clientID }),
    EditorView.updateListener.of((update) => {
      if(update.docChanged) schedulePush()
    })
  ])

  function languageExtension(lang) {
    switch(lang) {
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
          themeCompartment.reconfigure(props.dark ? oneDark : [])
        ]
      })
    }
  )
</script>

<style scoped>
  .lc-cm-editor {
    border: 1px solid #ddd;
    border-radius: 4px;
    min-height: 300px;
  }
</style>
