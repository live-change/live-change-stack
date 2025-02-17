<template>
  <div class="w-full sm:w-9/12 md:w-8/12 lg:w-6/12 bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">
    <div class="text-center mb-8">
      <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
        Upload Test
      </div>
    </div>

    <FileInput @input="handleUpload" class="inline-block">
      <Button label="Upload File" icon="pi pi-upload"></Button>
    </FileInput>

    <UploadView v-if="upload" :upload="upload" cancelable class="bg-surface-0 dark:bg-surface-900 shadow rounded-border p-6 mt-4" />
  </div>
</template>

<script setup>
  import Button from "primevue/button"
  import FileInput from "./FileInput.vue"
  import Upload from "./Upload.js"
  import { ref, getCurrentInstance } from 'vue'
  import UploadView from "./UploadView.vue"

  const upload = ref()
  const appContext = getCurrentInstance().appContext

  async function handleUpload(file) {
    console.log("FILE", file)
    upload.value = new Upload('test', file, { appContext })

    await upload.value.promise
    upload.value = null
  }

</script>

<style scoped>


</style>