<template>
  <div class="relative">
    <slot v-if="editor" name="menu" :editor="editor" :saveState="saveState">
      <EditorMenu :editor="editor" :config="config" :saveState="saveState">
        <template #before="scope"><slot name="beforeMenu" v-bind="{ ...scope, editor, saveState }" /></template>
        <template #begin="scope"><slot name="menuBegin" v-bind="{ ...scope, editor, saveState }" /></template>
        <template #end="scope">
          <slot name="menuEnd" v-bind="{ ...scope, editor, saveState }" />
          <Button v-if="config.nodes.component" label="Edit Buttons"
                  :class="[
                    'p-button-sm p-button-primary inline-block mr-1 mb-1', { 'p-button-outlined': !editButtons }
                    ]"
                  @click="toggleEditButtons" />
        </template>
        <template #after="scope">
          <div v-if="componentControl"
               class="bg-surface-0 dark:bg-surface-900 p-1 shadow rounded-border">
            <StyleEditor v-if="componentControl.type == 'style'" :nodeControl="componentControl.nodeControl"
                         :key="componentControl.uid" />
            <SettingsEditor v-if="componentControl.type == 'settings'" :nodeControl="componentControl.nodeControl"
                            :key="componentControl.uid" />
          </div>
          <slot name="afterMenu" v-bind="{ ...scope, editor, saveState }" />
        </template>
      </EditorMenu>
    </slot>
    <editor-content :editor="editor" :class="[className, { 'show-edit-buttons': editButtons }]" :style="style" />
  </div>
</template>

<script setup>
  import Button from "primevue/button"

  import StyleEditor from "./StyleEditor.vue";
  import SettingsEditor from "./SettingsEditor.vue";

  import { useEditor, EditorContent } from '@tiptap/vue-3'
  import { History } from '@tiptap/extension-history'
  import Gapcursor from '@tiptap/extension-gapcursor'
  import {
    ref, computed, watch, provide, defineEmits, defineProps, getCurrentInstance, onUnmounted, inject, onMounted,
    shallowRef
  } from 'vue'
  import { toRefs, useDebounceFn } from '@vueuse/core'
  import EditorMenu from "./EditorMenu.vue"
  import { getExtensions } from "../tiptap/contentConfigExtensions.js"
  import { getSchemaSpecFromConfig, serializeSchema } from "../tiptap/schemaJson.js"

  import { live, path, useApi, inboxReader } from '@live-change/vue3-ssr'
  import ProseMirrorCollab from "../tiptap/ProseMirrorCollab.js"
  import { sendableSteps, receiveTransaction, getVersion } from '@tiptap/pm/collab'
  import { Step } from '@tiptap/pm/transform'
  import RemoteAuthority from "../tiptap/RemoteAuthority";

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
      required: true
    },
    config: {
      type: Object,
      required: true
    },
    initialContent: {
      type: Object,
      default: () => ({ type: 'doc', content: [ ] })
    },
    class: {
      type: String,
      default: ''
    },
    style: {
      type: String,
      default: ''
    },
  })

  const emit = defineEmits(['update:saveState', 'update:version'])

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  const appContext = getCurrentInstance().appContext
  const api = useApi(appContext)
  const clientID = api.windowId

  const { targetType, target, class: className, style } = props

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

  const extensions = getExtensions(props.config)
  const authority = new RemoteAuthority(appContext, props.targetType, props.target, props.type, {
    purpose: props.purpose,
    initialContent: props.initialContent
  })

  const saveState = computed(() => authority.synchronizationState.value ?? 'loading')
  emit('update:saveState', saveState.value)
  watch(() => saveState.value, async (state) => {
    emit('update:saveState', state)
  })

  const version = ref()
  watch(() => version.value, async (v) => {
    emit('update:version', v)
  })

  authority.onNewSteps.push(() => {
    console.log("ON NEW STEPS!")
    const { state, view } = editor.value
    const currentVersion = getVersion(state)
    console.log("COLLAB VERSION", currentVersion)
    let { steps, clientIDs } = authority.stepsSince(currentVersion, state.schema)
    console.log("RECEIVE STEPS", steps, clientIDs, clientID)
    const transaction = receiveTransaction(state, steps, clientIDs)
    view.dispatch(transaction)
    version.value = authority.remoteVersion
  })
  authority.onResynchronization.push(async function () {
    const state = editor.value.reactiveState.value
    const sendable = sendableSteps(state)
    if (sendable) {
      console.log("SEND STEPS", sendable.steps, sendable.version)
      authority.receiveSteps(sendable.version, sendable.steps, sendable.clientID)
    }
  })

  onUnmounted(() => authority.dispose())
  const documentData = await authority.loadDocument()
  version.value = authority.remoteVersion

  //console.log("CONFIG", props.config, 'EXTENSIONS', extensions)
  //console.log("DOCUMENT DATA", documentData)
  const editor = useEditor({
    content: documentData.content,
    extensions: [
      ...extensions,
      Gapcursor,
      ProseMirrorCollab.configure({
        version: documentData.version,
        clientID
      }),
      History.configure({
        depth: 100,
        newGroupDelay: 500
      })
    ],
    onTransaction: ({ editor, transaction }) => {
      console.log("EDITOR UPDATE", editor, transaction)
      for(const step of transaction.steps) {
        window.lastStep = step
      }
      saveDebounced()
    }
  })

  const schemaSpec = editor.view
    ? serializeSchema(editor.view.state.schema.spec)
    : getSchemaSpecFromConfig(props.config)

  const editButtons = ref(true)
  function toggleEditButtons() {
    editButtons.value = !editButtons.value
    if(!editButtons.value) {
      componentControl.value = null
    }
  }

  if(typeof window != 'undefined') window.schemaSpecJson = JSON.stringify(schemaSpec, null, "  ")

  async function save() {
    const state = editor.value.reactiveState.value
    const sendable = sendableSteps(state)
    if (sendable) {
      console.log("SEND STEPS", sendable.steps, sendable.version)
      authority.receiveSteps(sendable.version, sendable.steps, sendable.clientID)
    }
  }
  const saveDebounced = useDebounceFn(save, 100)

  if(typeof window !== 'undefined') {
    window.editor = editor
    window.testStep = (json) => {
      const testStep = Step.fromJSON(schema, json)
      console.log("TS", testStep)
      const transaction = editor.value.view.state.tr
      transaction.step(testStep)
      console.log("TRANSACTION", transaction)
      transaction.apply(editor.value.view.state)
    }
  }

  const componentControl = shallowRef()
  provide('componentEditorControl', {
    componentControl,
    toggleEditor(type, nodeControl, event) {
      const uid = nodeControl.value.uid
      if(componentControl.value && componentControl.value.uid == uid && componentControl.value.type == type) {
        componentControl.value = null
      } else {
        console.log("SET COMPONENT CONTROL", nodeControl.value)
        componentControl.value = { type, nodeControl, uid }
      }
    }
  })

</script>

<style>
  .cm-line, .cm-content {
    padding: 0 !important;
  }
</style>
