<template>
  <div v-if="state === 'edit'">
    <ImageCrop v-if="sourceImage || sourceUpload"
               :crop="cropData"
               :aspectRatio="aspectRatio"
               :sourceImage="sourceImage"
               :fill="props.fill"
               :sourceUpload="sourceUpload"
               :type="type"
               v-model:ready="cropReady"
               ref="imageCrop" style="max-height: 60vh" />
    <div class="flex p-4 pb-2 flex-wrap">
      <div class="grow flex justify-center">
        <Button type="button" label="Upload" icon="pi pi-upload" class="p-button-primary mb-2"
                @click="() => state = 'upload' "/>
      </div>
      <div class="flex grow justify-center">
        <Button type="button" label="Save" icon="pi pi-save" class="p-button-warning ml-2 mb-2"
                :disabled="!cropReady" @click="saveImage" />
        <Button type="button" label="Remove" icon="pi pi-times" class="p-button-danger ml-2 mb-2"
                @click="removeImage"/>
      </div>
    </div>
  </div>
  <div v-else-if="state === 'upload'" class="flex flex-col items-center">
    <DropZone class="grow w-full relative p-6 md:p-8 lg:p-12 pt-2 md:pt-4 lg:pt-6 bg-surface-0 dark:bg-surface-950"
              :accept="acceptList" @input="handleFile">
      <div class="w-auto flex flex-row items-center justify-center">
        <div class="w-full border-2 border-dashed border-primary-500 flex items-center justify-center"
             :style="`aspect-ratio: ${aspectRatio}; max-width: 50vh`">
          <p class="text-primary text-xl">Drop image here!</p>
        </div>
      </div>
    </DropZone>
    <div class="w-full flex justify-center px-6 pt-4 pb-4 grow-0">
      <FileInput :accept="acceptList" @input="handleFile" class="block">
        <Button type="button" label="Upload Image" icon="pi pi-upload" class="p-button-primary" />
      </FileInput>
    </div>
  </div>
  <div v-else>
    <ProgressSpinner />
  </div>
</template>

<script setup>
  import { computed, ref, watch, inject, getCurrentInstance } from 'vue'
  import { useResizeObserver } from '@vueuse/core'
  import { getElementPositionInWindow, getElementPositionInElement } from "./dom.js"

  import { path, fetch } from '@live-change/vue3-ssr'

  import { FileInput, DropZone } from '@live-change/upload-frontend'
  import { uploadImage } from "./imageUploads.js"
  import Button from "primevue/button"
  import ProgressSpinner from "primevue/progressspinner"

  import ImageCrop from "./ImageCrop.vue"

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()

  const props = defineProps({
    modelValue: { // image
      type: String,
      default: null
    },
    sourceImage: {
      type: String,
      default: null
    },
    uploadedFile: {
      type: (typeof window != "undefined") ? Blob : undefined,
      default: null
    },
    purpose: {
      type: String,
      default: "unknown"
    },
    width: {
      type: Number,
      default: 256
    },
    height: {
      type: Number,
      default: 256
    },
    type: {
      type: String,
      default: 'rect' // or 'circle'
    },
    fill: {
      type: Boolean,
      default: true
    },
    saveButton: {
      type: Boolean
    }
  })

  const workingZone = inject('workingZone')
  const loadingZone = inject('loadingZone')

  const aspectRatio = computed(() => props.width/props.height)
  const acceptList = 'image/jpeg, image/png, image/webp, .jpg, .png, .jpeg, .webp'

  const state = ref(props.modelValue || props.sourceImage ? 'edit' : 'upload')

  const sourceImage = ref(props.sourceImage)
  const sourceUpload = ref()

  const upload = ref()

  const imageType = ref()
  const imageName = ref()
  const cropData = ref({ x: 0, y: 0, zoom: 1, orientation: 0 })

  const imageCrop = ref()
  const cropReady = ref(false)

  const appContext = getCurrentInstance().appContext

  const emit = defineEmits(['update:modelValue', 'close'])

  async function removeImage(event) {
    confirm.require({
      target: event.currentTarget,
      message: `Do you want to delete image?`,
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        sourceImage.value = null
        state.value = 'upload'
        emit('update:modelValue', null)
        emit('close')
        toast.add({ severity:'info', summary: 'Image Deleted', life: 1500 })
      },
      reject: () => {
        toast.add({ severity:'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })
  }

  async function saveImage() {
    await workingZone.addPromise('crop image and upload', (async () => {
      if(!imageCrop.value) throw new Error("crop not available")
      if(!cropReady.value) throw new Error("crop not ready")
      console.log("IMAGE CROP", imageCrop.value)
      const { crop, canvas } = await imageCrop.value.crop()
      console.log("CROP RESULT", crop, canvas)

      state.value = 'uploading'
      upload.value = uploadImage(props.purpose, { canvas },
        { preparedPreview: true, appContext, generateId : true, crop,  })
      console.log("START PREPARE!")
      emit('update:modelValue', upload.value.id)
      if(sourceUpload.value) await sourceUpload.value.upload()
      await upload.value.upload()
      state.value = 'edit'
      emit('close')
    })())
  }

  async function handleFile(file) {
    imageName.value = file.name
    imageType.value = file.type
    await workingZone.addPromise("upload source image", (async () => {
      sourceUpload.value = uploadImage(props.purpose, { file },
        { preparedPreview: true, appContext, generateId : true, saveCanvas: true })
      console.log("START PREPARE!")
      state.value = 'uploading'
      await sourceUpload.value.prepare()
      cropReady.value = false
      sourceImage.value = sourceUpload.value.id
      state.value = 'edit'
    })())
    console.log("START UPLOAD!")
    await sourceUpload.value.upload()
    console.log("SOURCE UPLOADED", sourceUpload.value)
  }
  if(props.uploadedFile) handleFile(props.uploadedFile)

  if(props.modelValue) { // Existing image
    loadingZone.addPromise("load exsting image metadata", (async () => {
      const imageData = await fetch(
        path().image.image({ image: props.modelValue }).with(
          image => path().image.image({ image: image.crop.originalImage }).bind('originalImage')
        )
      )
      const originalImage = imageData.value.originalImage
      console.log("IM DATA", imageData, originalImage)
      imageName.value = originalImage.name
      const splitName = originalImage.name.split('.')
      const extension = splitName[splitName.length - 1].toLowerCase()
      switch(extension) {
        case 'jpg':
        case 'jpeg':
          imageType.value = 'image/jpeg'
          break
        case 'webp':
          imageType.value = 'image/webp'
          break
        default:
        case 'png':
          imageType.value = 'image/png'
          break
      }
      cropData.value = imageData.value.crop
      sourceImage.value = originalImage.id
      console.log("IMAGE", imageName.value, imageType.value)
    })())
  }
</script>

<style scoped>

</style>
