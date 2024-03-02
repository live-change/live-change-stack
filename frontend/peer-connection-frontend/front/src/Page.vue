<template>
  <div class="min-h-screen flex flex-column surface-ground">
    <NavBar></NavBar>
    <ConfirmPopup v-if="isMounted"></ConfirmPopup>
    <Toast v-if="isMounted"></Toast>
    <div class="relative h-0 w-full">
      <ProgressBar v-if="loading || working" mode="indeterminate" style="height: .2em" />
    </div>
    <div v-if="pageType == 'simple'" class="p-5 flex flex-column flex-auto align-items-center">
      <slot></slot>
    </div>
    <div v-if="pageType == 'wide'">
      <slot></slot>
    </div>
  </div>
</template>

<script setup>
  import ProgressBar from "primevue/progressbar"

  import ConfirmPopup from 'primevue/confirmpopup'
  import Toast from 'primevue/toast'

  import NavBar from "./NavBar.vue"

  import { onMounted, ref } from 'vue'
  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  const { working, loading } = defineProps({
    working: {
      type: Boolean
    },
    loading: {
      type: Boolean
    }
  })

  console.log("SETUP PAGE!!!")

  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  const route = useRoute()

  const pageType = computed(() => route.meta.pageType ?? 'simple' )

</script>
