<template>
  <div class="w-full">
    <div class="w-full flex flex-row justify-content-center">
      <Button v-if="!editorVisible" @click="showNewObjectEditor"
              icon="pi pi-plus-circle" label="Create new object" class="p-button-rounded p-button-primary" />
    </div>

    <div class="surface-0 shadow-1 w-full">
      <object-editor v-if="editorVisible"
                     :dbApi="props.dbApi"
                     :currentData="JSON.stringify(newObjectData)"
                     :write="writeNewObject" :remove="removeObject" />
    </div>

  </div>
</template>

<script setup>

  import Button from "primevue/button"
  import ObjectEditor from "./ObjectEditor.vue"

  import { ref, watch, computed, defineProps } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import { path, live, actions, useApi, rangeBuckets, reverseRange } from '@live-change/vue3-ssr'
  const api = useApi()

  const props = defineProps({
    dbApi: {
      type: String,
      default: 'serverDatabase'
    },
    write: {
      type: Function,
      default: null
    },
  })

  const editorVisible = ref(false)
  const newObjectData = ref(null)

  function showNewObjectEditor() {
    newObjectData.value = {
      id: api.uid()
    }
    editorVisible.value = true
  }

  function writeNewObject(...args) {
    console.log("write args", args)
    const result = props.write(...args)
    console.log("write result", result)
/*    setTimeout(() => {
      editorVisible.value = false
      newObjectData.value = null
    }, 200)*/
    return result
  }

  function removeObject(data) {
    console.log("object remove", arguments)
    editorVisible.value = false
    newObjectData.value = null
    return false
  }

</script>

<style scoped>

</style>
