<template>
  <div class="min-h-screen flex flex-col surface-ground">
    <slot name="navbar"></slot>

    <ConfirmPopup v-if="isMounted" />
    <DynamicDialog v-if="isMounted" />

    <div class="relative h-0 w-full" v-if="isMounted">
      <ProgressBar v-if="loading || working" mode="indeterminate" class="absolute w-full" style="height: .2em" />
    </div>
    <div v-if="pageType === 'simple'"
         class="p-3 md:p-5 flex-grow-1 flex flex-column flex-auto align-items-center relative">
      <slot></slot>
    </div>
    <div v-if="pageType === 'wide'" class="relative flex-grow-1">
      <slot></slot>
    </div>
    <div>
      <slot name="footer"><div></div></slot>
    </div>
  </div>
</template>

<script setup>

  import ConfirmPopup from 'primevue/confirmpopup'
  import DynamicDialog from 'primevue/dynamicdialog'

  import ProgressBar from "primevue/progressbar"

  import { onMounted, ref, computed } from 'vue'
  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  const { working, loading, pageType } = defineProps({
    working: {
      type: Boolean
    },
    loading: {
      type: Boolean
    },
    pageType: {
      type: String,
      default: 'simple'
    }
  })

  //console.log("SETUP PAGE!!!")

  import { useRoute, useRouter } from 'vue-router'
  const route = useRoute()
  const router = useRouter()

</script>
