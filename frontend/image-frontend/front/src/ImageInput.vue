<template>
  <div>
    <div v-if="modelValue" class="flex flex-col items-center">
      <Image :image="modelValue" :key="modelValue"
             :width="definition?.width ?? 400" :height="definition?.height ?? 400"
             style="max-width: 100%" />
      <div class="w-full mt-2 flex flex-row flex-wrap justify-around items-center">
        <Button @click="cropImage" type="button" label="Crop Image"
                icon="pi pi-pencil" class="p-button-secondary w-48" />
        <Button @click="deleteImage" type="button" label="Remove Image"
                icon="pi pi-trash" class="p-button-danger w-48" />
      </div>
    </div>
    <div v-else>
      <DropZone class="w-full relative p-2 flex justify-center items-center"
                :accept="acceptList" @input="handleFile">
        <div class="w-auto border-dashed border-primary-500 flex items-center justify-center p-2"
             :style="dropZoneStyle">
          <p class="text-primary text-xl">Drop image here!</p>
        </div>
      </DropZone>
      <FileInput :accept="acceptList" @input="handleFile" class="block">
        <Button type="button" label="Upload Image" icon="pi pi-upload" class="p-button-primary" />
      </FileInput>
    </div>

    <Dialog v-model:visible="editorVisible" header="Crop Image">
      <ImageEditor :modelValue="modelValue" @update:modelValue="updateImage"
                   :width="definition?.width ?? 400" :height="definition?.height ?? 400"
                   :uploadedFile="uploadedFile" :purpose="definition?.purpose"
                   @close="closeEditor" />
    </Dialog>
  </div>
</template>

<script setup>
  import { FileInput, DropZone } from '@live-change/upload-frontend'
  import Button from "primevue/button"
  import Dialog from "primevue/dialog"
  import Image from "./Image.vue"
  import ImageEditor from "./ImageEditor.vue"

  const props = defineProps({
    modelValue: { // image
      type: String,
      default: null
    },
    definition: {
      type: Object,
      default: () => {}
    }
  })
  const emit = defineEmits(['update:modelValue'])

  import { computed, ref } from 'vue'
  import { toRefs } from '@vueuse/core'

  const { modelValue, definition } = toRefs(props)

  const acceptList = 'image/jpeg, image/png, image/webp, .jpg, .png, .jpeg, .webp'
  const aspectRatio = computed(() => {
    if(definition.value?.aspectRatio) {
      return definition.value.aspectRatio
    } else if(definition.value?.width && definition?.value.height) {
      return definition.value.width / definition.value.height
    } else {
      return 1
    }
  })

  const dropZoneStyle = computed(() => ({
    'aspect-ratio': `${aspectRatio.value}`,
    'max-width': `${definition.value?.width ?? 250}px`,
    'max-height': `${definition.value?.height ?? 250}px`
  }))

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()

  const editorVisible = ref(false)
  const uploadedFile = ref(null)

  function handleFile(file) {
    console.log("HANDLE FILE", file)
    if(file) {
      uploadedFile.value = file
      editorVisible.value = true
    }
  }
  function updateImage(value) {
    emit('update:modelValue', value)
  }
  function closeEditor() {
    editorVisible.value = false
    uploadedFile.value = null
  }
  function cropImage() {
    uploadedFile.value = null
    editorVisible.value = true
  }
  function deleteImage() {
    console.log("CONFIRM", confirm)
    confirm.require({
      target: event.currentTarget,
      message: `Are you sure you want to delete this image?`,
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        emit('update:modelValue', null)
        toast.add({ severity: 'info', summary: 'Image removed', life: 1500 })
      },
      reject: () => {
        toast.add({ severity:'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })
  }

</script>

<style scoped>

</style>
