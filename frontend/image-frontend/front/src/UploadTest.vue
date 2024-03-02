<template>
  <div class="w-full sm:w-9 md:w-8 lg:w-6 surface-card p-4 shadow-2 border-round">
    <div class="text-center mb-5">
      <div class="text-900 text-3xl font-medium mb-3">
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
<!--    <UploadView v-if="upload" :upload="upload" cancelable class="surface-card shadow-2 border-round p-4 mt-3" />-->
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
