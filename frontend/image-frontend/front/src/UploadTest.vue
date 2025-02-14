<template>
  <div class="w-full sm:w-9/12 md:w-8/12 lg:w-6/12 bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">
    <div class="text-center mb-8">
      <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
        Upload Test
      </div>
    </div>

    <div></div>
<!--    <pre>{{ JSON.stringify(upload, null, "  ") }}</pre>-->

    <FileInput @input="handleUpload" class="inline-block">
      <Button label="Upload File" icon="pi pi-upload"></Button>
    </FileInput>

    <div v-if="image">
      <h2>Image: {{ image }}</h2>
      <Image :image="image" width="200" height="200" />
    </div>
<!--    <UploadView v-if="upload" :upload="upload" cancelable class="bg-surface-0 dark:bg-surface-900 shadow rounded-border p-6 mt-4" />-->
  </div>
</template>

<script setup>

  import Button from "primevue/button"
  import { ref, shallowRef, getCurrentInstance } from 'vue'
  import { Upload, UploadView, FileInput } from "@live-change/upload-frontend"
  import { uploadImage } from "./imageUploads.js"
  import Image from "./Image.vue"

  const upload = shallowRef()
  const appContext = getCurrentInstance().appContext

  const image = ref()

  async function handleUpload(file) {
    console.log("FILE", file)
    upload.value = uploadImage('test', { file },
        { preparedPreview: true, appContext, generateId : true, noStart: true })
    image.value = upload.value.id
    console.log("START PREPARE!")
    await upload.value.prepare()
    console.log("START UPLOAD!")
    await upload.value.upload()
    image.value = upload.value.id

    console.log("UPLOADED", upload.value)

    //upload.value = null
  }

</script>

<style scoped>

</style>
