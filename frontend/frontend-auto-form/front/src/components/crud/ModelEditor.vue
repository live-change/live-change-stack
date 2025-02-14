<template>
  <div>
<!--

      <h4>definition</h4>
      <pre>{{ modelDefinition }}</pre>
-->

    <div class="">
      Service <strong>{{ service }}</strong>
    </div>
    <div class="text-2xl mb-4">
      <span v-if="isNew">Create </span>
      <span v-else>Edit </span>
      <strong>{{ model }}</strong>
    </div>

    <form v-if="editor" @submit="handleSave" @reset="handleReset">
      <auto-editor
          :definition="modelDefinition"
          v-model="editor.value.value"
          :rootValue="editor.value.value"
          :i18n="i18n" />
      <EditorButtons :editor="editor" reset-button />
    </form>
  </div>
</template>

<script setup>

  import AutoEditor from '../form/AutoEditor.vue'
  import EditorButtons from './EditorButtons.vue'

  import { ref, computed, onMounted, defineProps, defineEmits, toRefs } from 'vue'

  const props = defineProps({
    service: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    identifiers: {
      type: Object,
      default: []
    },
    draft: {
      type: Boolean,
      default: false
    },
    options: {
      type: Object,
      default: () => ({})
    },
    i18n: {
      type: String,
      default: ''
    }
  })
  const { service, model, identifiers, draft, options, i18n } = toRefs(props)

  const emit = defineEmits(['saved', 'draftSaved', 'draftDiscarded', 'saveError', 'created' ])

  import { useApi, usePath, live } from '@live-change/vue3-ssr'
  const api = useApi()
  const path = usePath()

  const modelDefinition = computed(() => {
    return api.services?.[service.value]?.models?.[model.value]
  })

  import { editorData } from "@live-change/frontend-auto-form"
  import { computedAsync } from "@vueuse/core"

  const editor = computedAsync(async () => {
    try {
      const ed = await editorData({
        service: service.value,
        model: model.value,
        identifiers: identifiers.value,
        draft: draft.value,
        autoSave: true,
        ...options.value,
        onSaved: (...args) => handleSaved(...args),
        onDraftSaved: (...args) => emit('draftSaved', ...args),
        onDraftDiscarded: (...args) => emit('draftDiscarded', ...args),
        onSaveError: (...args) => emit('saveError', ...args),
        onCreated: (...args) => emit('created', ...args),
      })
      //console.log("ED", ed)
      return ed
    } catch(e) {
      console.error("EDITOR ERROR", e)
      return null
    }
  })

  const isNew = computed(() => !editor?.value?.saved?.value)

  function handleSave(ev) {
    ev.preventDefault()
    editor.value.save()
  }

  function handleReset(ev) {
    ev.preventDefault()
    editor.value.reset()
  }

  function handleSaved(saveResult) {
    console.log("SAVED", saveResult, isNew.value, editor.value.isNew)
    if(saveResult && isNew.value && editor.value.isNew) {
      emit('created', saveResult)
    }
    emit('saved', saveResult)
  }

</script>

<style scoped>

</style>