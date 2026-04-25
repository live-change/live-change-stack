<template>
  <div class="p-4">
    <div class="mb-3 text-xl font-semibold">
      CodeMirror collab demo
    </div>

    <div class="grid formgrid mb-3">
      <div class="field col-12 md:col-3">
        <label class="block mb-1">Target type</label>
        <InputText v-model="targetType" class="w-full" />
      </div>
      <div class="field col-12 md:col-3">
        <label class="block mb-1">Target</label>
        <InputText v-model="target" class="w-full" />
      </div>
      <div class="field col-12 md:col-2">
        <label class="block mb-1">Document type</label>
        <InputText v-model="documentType" class="w-full" />
      </div>
      <div class="field col-12 md:col-2">
        <label class="block mb-1">Language</label>
        <Dropdown
          v-model="language"
          :options="languages"
          option-label="label"
          option-value="value"
          class="w-full"
        />
      </div>
      <div class="field col-12 md:col-2 flex align-items-end">
        <div class="w-full">
          <div class="mb-1">Sync state</div>
          <Tag :value="syncState" :severity="syncSeverity" class="w-full justify-content-center" />
        </div>
      </div>
    </div>

    <div class="mb-2 text-sm">
      Version: <b>{{ versionLabel }}</b>
    </div>

    <Editor
      :target-type="targetType"
      :target="target"
      :type="documentType"
      :purpose="purpose"
      :language="language"
      :initial-content="initialContent"
      @update:synchronization-state="onSyncState"
      @update:version="onVersion"
    />
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import InputText from 'primevue/inputtext'
  import Dropdown from 'primevue/dropdown'
  import Tag from 'primevue/tag'
  import Editor from './Editor.vue'

  const targetType = ref('Example')
  const target = ref('demo')
  const documentType = ref('markdown')
  const purpose = ref('document')
  const language = ref('markdown')
  const syncState = ref('loading')
  const version = ref(1)

  const initialContent = ref(`# Collaborative markdown demo

Open this page in two browser windows and edit in both places.
`)

  const languages = [
    { label: 'Markdown', value: 'markdown' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'HTML', value: 'html' },
    { label: 'CSS', value: 'css' },
    { label: 'JSON', value: 'json' }
  ]

  const syncSeverity = computed(() => {
    if(syncState.value === 'saved') return 'success'
    if(syncState.value === 'saving') return 'warn'
    return 'info'
  })

  const versionLabel = computed(() => (version.value ?? 0).toFixed().padStart(10, '0'))

  function onSyncState(state) {
    syncState.value = state
  }

  function onVersion(v) {
    version.value = v
  }
</script>
