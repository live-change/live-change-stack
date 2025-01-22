import { ref } from 'vue'
import ImageUpload from "./ImageUpload.js";

export const imageUploads = ref([])

async function handleUpload(upload, options) {
  await upload.upload()
  const existingIndex = imageUploads.value.findIndex(u => u.localUid === upload.localUid)
  if(existingIndex !== -1) {
    imageUploads.value.splice(existingIndex, 1)
  }
  console.log("IMAGE UPLOADS", imageUploads)
}

export function uploadImage(purpose, uploadable, options = {}) {
  const upload = new ImageUpload(purpose, uploadable, options)
  if(options.id) {
    const existingIndex = imageUploads.value.findIndex(u => u.id === options.id)
    if( existingIndex !== -1 ) {
      imageUploads.value[existingIndex].cancel()
      imageUploads.value[existingIndex] = upload
      handleUpload(upload, options)
      return upload
    }
  }
  imageUploads.value.push(upload)
  handleUpload(upload, options)
  return upload
}
