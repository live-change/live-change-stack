<template>
<!--  <pre style="white-space: pre-wrap; word-wrap: break-word;">{{ JSON.stringify(editable, null, '  ') }}</pre>-->
  <auto-editor :definition="editableDefinition" v-model="editable" :rootValue="editable" i18n="content.metadata." />
  <Button label="Save metadata" icon="pi pi-save" :disabled="!changed || error" @click="save" />
  <div>
    <small v-if="error" class="p-error">Fix errors above to save</small>
  </div>
</template>

<script setup>
  import Button from 'primevue/button'
  import { AutoInput, AutoField, AutoEditor } from '@live-change/frontend-auto-form'

  import "@live-change/image-frontend"

  import { computed, watch, ref, onMounted, onUnmounted, inject } from 'vue'
  import { toRefs } from "@vueuse/core"

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  const props = defineProps({
    objectType: {
      type: String,
      required: true
    },
    object: {
      type: String,
      required: true
    }
  })

  const { objectType, object } = props

  import { useApi, path, live } from '@live-change/vue3-ssr'
  const api = useApi()
  const p = path()

  const definition = api.getServiceDefinition('content').models.Metadata
  const editableDefinition = {
    ...definition,
    properties: { ...{
      ...definition.properties,
      objectType: undefined,
      object: undefined,
      lastUpdate: undefined
    } }
  }

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()

  import { synchronized, defaultData, validateData } from "@live-change/vue3-components"

  const serverMetadata = await live(p.content.objectOwnedMetadata({ objectType, object }))
  const metadata = computed(() => serverMetadata.value || defaultData(editableDefinition))

  const synchronizedMetadata = synchronized({
    source: metadata,
    update: api.actions.content.setOrUpdateObjectOwnedMetadata,
    identifiers: { object, objectType },
    recursive: true,
    autoSave: false,
    onSave: () => toast.add({ severity: 'info', summary: 'Metadata saved', life: 1500 })
  })

  const editable = synchronizedMetadata.value
  const save = synchronizedMetadata.save
  const changed = synchronizedMetadata.changed

  const error = computed(() => validateData(editableDefinition, editable.value))


  function beforeUnload(ev) {
    if(changed.value) return ev.returnValue = "You have some unsaved changes!"
  }
  onMounted(() => window.addEventListener('beforeunload', beforeUnload))
  onUnmounted(() => window.removeEventListener('beforeunload', beforeUnload))

</script>

<style scoped>

</style>
