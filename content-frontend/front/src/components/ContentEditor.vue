<template>

  <DocumentEditor :targetType="objectType" :target="object"
                  :purpose="purpose" :type="contentType"
                  :config="contentConfig || defaultContentConfig"
                  :class="className" :style="style"
                  v-model:saveState="saveState" v-model:version="version">

    <template #menuEnd="{}">

      <router-link :to="previewRoute(objectType, object)" target="_blank"
                   class="no-underline">
        <Button icon="pi pi-eye" label="Preview" class="p-button-secondary p-button-sm mr-1 mb-1" />
      </router-link>

      <div class="p-buttonset mr-1 mb-1 border-round">
        <Button type="button"
                class="p-button p-component p-button-sm p-button-outlined p-button-secondary cursor-auto inline-block"
                :class="{ 'p-disabled': saveState == 'saving' }">
        <span class="pi p-button-icon p-button-icon-left"
              :class="[saveState == 'saving' ? 'pi-sync' : 'pi-hashtag' ]" />
          <span class="p-button-label">{{ ( version ?? 0 ).toFixed().padStart(10, '0') }}</span>
        </Button>
        <Button icon="pi pi-save" label="Publish" class="p-button-success p-button-sm" type="button"
                :disabled="saveState == 'saving'" @click="publish" />
      </div>

    </template>

  </DocumentEditor>

  <div></div><!-- Because bug in vue -->

</template>

<script setup>

  import Button from 'primevue/button'

  import { DocumentEditor, EditorMenu } from "@live-change/wysiwyg-frontend"

  import defaultContentConfig from "./contentConfig.js"

  const props = defineProps({
    objectType: {
      type: String,
      required: true
    },
    object: {
      type: String,
      required: true
    },
    previewRoute: {
      type: Function,
      default: (objectType, object) => {
        const [service, type] = objectType.split('_')
        const prop = type[0].toLowerCase()+type.slice(1)
        return { name: `${service}:${prop}Preview`, params: { [prop]: object }}
      }
    },
    publishTarget: {
      type: String,
      required: true
    },
    contentType: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      required: true
    },
    contentConfig: {
      type: Object,
      default: () => null
    },
    class: {},
    style: {}
  })
  import { toRefs } from "@vueuse/core"
  const {
    objectType, object, previewRoute, publishTarget, contentType, purpose, contentConfig,
    class: className, style
  } = toRefs(props)

  import { computed, watch, ref, onMounted, inject } from 'vue'

  const document = computed(() => `${JSON.stringify(objectType.value)}:${JSON.stringify(object.value)}`)

  const saveState = ref()
  const version = ref()

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()

  const workingZone = inject('workingZone')


  import { useApi, path, live } from '@live-change/vue3-ssr'

  const api = useApi()

  const p = path()

  const liveCanonicalUrlPath = computed(
    () =>  p.url.targetOwnedCanonical({ targetType: objectType.value, target: object.value })
  )

  const [canonicalUrlData] = await Promise.all([
    live(liveCanonicalUrlPath),
  ]).catch(e => [null, null, null, null])


  function publish() {
    const snapshotVersion = version.value
    const typeName = objectType.value.split('_')[1]
    const typeNameLower = typeName[0].toLowerCase()+typeName.slice(1)
    confirm.require({
      target: event.currentTarget,
      message: `Do you want to publish this content version ${snapshotVersion} to ${publishTarget.value}`,
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        api.actions.content.publish({
          objectType: objectType.value, object: object.value, version: snapshotVersion, type: contentType.value
        }).then(() => {
          toast.add({ severity: 'success', summary: 'Published', detail: typeName+' published', life: 3000 })
        }).catch(e => {
          toast.add({ severity: 'error', summary: 'Error', detail: 'Error publishing ' + typeNameLower, life: 3000 })
        })
      },
      reject: () => {
        toast.add({ severity:'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })

  }

</script>

<style scoped>

</style>
