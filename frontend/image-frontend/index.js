import ImageUpload from "./front/src/ImageUpload.js"
import ImageEditor from "./front/src/ImageEditor.vue"
import ImageInput from "./front/src/ImageInput.vue"
import Image from "./front/src/Image.vue"
import {uploadImage, imageUploads} from "./front/src/imageUploads.js";
import preProcessImageFile from "./front/src/preprocessImageFile.js";

export { ImageUpload, Image, uploadImage, preProcessImageFile, imageUploads, ImageEditor, ImageInput }

import { inputConfig, provideInputConfig } from "@live-change/frontend-auto-form"
export function provideImageInputConfig() {
  const config = inputConfig(() => import('./front/src/ImageInput.vue'))
  provideInputConfig({ name: 'image' }, config)
  provideInputConfig({ type: 'Image' }, config)
}

