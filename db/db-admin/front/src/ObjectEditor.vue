<template>
  <div class="flex flex-row">

    <div class="grow pt-1 pb-1 w-40">
      <CodeEditor :readOnly="readOnly || !write" :initialData="initialData" @result="result => handleEditResult(result)"
        :ref="el => editorElementFound(el)" />
    </div>
    <div class="flex flex-col justify-end items-center">
      <Button v-if="edited" @click="ev => resetObject(ev)"
              icon="pi pi-refresh" class="p-button-rounded p-button-warning m-1 mr-2 mt-2" />
      <Button v-if="edited" @click="ev => updateObject(ev)"
              icon="pi pi-save" class="p-button-rounded p-button-primary m-1 mr-2" />
      <Button v-if="remove" @click="ev => deleteObject(ev)"
              icon="pi pi-trash" class="p-button-rounded p-button-danger m-1 mr-2 mb-2" />
    </div>
  </div>
</template>

<script setup>

  import Button from "primevue/button"
  import CodeEditor from "./CodeEditor.vue";

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()

  import { ref, onMounted, onUnmounted, inject, computed, watch } from "vue"
  let isMounted = ref(false)
  onMounted(() => isMounted.value = true)
  onUnmounted(() => isMounted.value = false)

  const workingZone = inject('workingZone')

  const props = defineProps({
    dbApi: {
      type: String
    },
    currentData: {
      type: String
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    write: {
      type: Function,
      default: null
    },
    remove: {
      type: Function,
      default: null
    }
  })

  const { dbApi, readOnly, write, remove } = props


  const initialData = ref(JSON.parse(props.currentData))
  const editedData = ref(JSON.parse(props.currentData))

  const edited = computed(() => JSON.stringify(initialData.value) !== JSON.stringify(editedData.value))

  watch(() => props.currentData, currentData => {
    const refresh = !edited.value
    initialData.value = JSON.parse(currentData)
    if(refresh) {
      editedData.value = JSON.parse(currentData)
      setTimeout(() => {
        codeEditor.value.reset()
      })
    }
  })

  function handleEditResult(result) {
    editedData.value = result.data
  }

  import { api } from "@live-change/vue3-ssr"
  const dao = api().source

  const codeEditor = ref()
  function editorElementFound(element) {
    codeEditor.value = element
  }

  import { dbRequestSugar } from "./dbSugar.js";

  function resetObject(event) {
    codeEditor.value.reset()
  }

  function deleteObject(event) {
    const removeRequest = remove({ object: initialData.value }, dbRequestSugar)
    if(removeRequest === false) return // remove handled elsewhere
    const requestInfo =
        `${removeRequest[0].join('.')}(${removeRequest.slice(1).map(v => JSON.stringify(v)).join(', ')})`
    const id = initialData.value.id
    confirm.require({
      target: event.currentTarget,
      message: `Do you want to delete object ${id}\n`,
      //message: `${requestInfo} ?`,
      icon: 'pi pi-trash',
      acceptClass: 'p-button-danger',
      accept: async () => {
        workingZone.addPromise('deleteObject', (async () => {
          await dao.request([ dbApi, ...removeRequest[0] ], ...(removeRequest.slice(1)))
          toast.add({ severity:'info', summary: `Object ${id} deleted`, life: 1500 })
        })())
      },
      reject: () => {
        toast.add({ severity:'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })
  }

  function updateObject(event) {
    const updateRequest = write({ object: editedData.value }, dbRequestSugar)
    if(updateRequest === false) return // update handled elsewhere
    const requestInfo =
        `${updateRequest[0].join('.')}(${updateRequest.slice(1).map(v => JSON.stringify(v)).join(', ')})`
    const id = editedData.value.id
    confirm.require({
      target: event.currentTarget,
      message: `Do you want to update object ${id}\n`,
      //message: `\n${requestInfo} ?`,
      icon: 'pi pi-trash',
      acceptClass: 'p-button-danger',
      accept: async () => {
        workingZone.addPromise('updateObject', (async () => {
          await dao.request([ dbApi, ...updateRequest[0] ], ...(updateRequest.slice(1)))
          toast.add({ severity:'info', summary: `Object ${id} updated`, life: 1500 })
        })())
      },
      reject: () => {
        toast.add({ severity:'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })
  }

</script>

<style scoped>

</style>
