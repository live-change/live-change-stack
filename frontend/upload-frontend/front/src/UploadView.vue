<template>
<!--  <pre>{{ JSON.stringify(uploadProgress, null, '  ') }}</pre>-->
  <div class="surface-card" v-if="uploadProgress">
    <ProgressBar :value="uploadProgress.percentage.toFixed()" />
    <div v-if="uploadProgress.state != 'done'" class="flex mt-2">
      {{ uploadProgress.state}}
      <div class="flex-grow-1">
        {{ prettyBytes(uploadProgress.transferred) }}
        /
        {{ prettyBytes(uploadProgress.length) }}
      </div>
      <div class="text-right ml-2" v-if="uploadProgress.eta">
        eta: {{ Duration.fromMillis(uploadProgress.eta).toHuman({  unitDisplay: "short" }) }}
      </div>
    </div>
    <div v-else class="flex flex-row justify-content-center">
      <div class="mr-1">Uploaded</div>
      <div v-if="upload.serverUpload" class="mr-1 font-semibold">{{ upload.serverUpload.fileName }}</div>
      <div>{{ prettyBytes(uploadProgress.length) }}</div>
    </div>
  </div>
</template>

<script setup>

  import ProgressBar from "primevue/progressbar"
  import { toRefs } from "@vueuse/core"
  import prettyBytes from 'pretty-bytes'
  import { Duration } from 'luxon'

  import { computed } from 'vue'

  const props = defineProps({
    upload: {
      type: Object,
      required: true
    },
    cancelable: {
      type: Boolean,
      default: false
    }
  })

  const { upload, cancelable } = toRefs(props)

  const uploadProgress = computed(() => {
    const serverUpload = upload.value.serverUpload
    //console.log("serverUpload", JSON.stringify(serverUpload, null, '  '))
    if (serverUpload && serverUpload.progress) {
      return {
        ...serverUpload.progress,
        state: serverUpload.state
      }
    } else {
      return {
        percentage: 0,
        state: 'starting',
        transferred: 0,
        length: 0,
        eta: null,
      }
    }
  })

</script>

<style scoped>

</style>
