<template>
  <div class="min-h-screen flex flex-column surface-ground">
    <NavBar v-if="!navBarHidden"></NavBar>
    <div class="relative h-0 w-full">
      <ProgressBar v-if="loading || working" mode="indeterminate" class="absolute top-0 w-full" style="height: .2em" />
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
  import NavBar from "./NavBar.vue"

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
  const navBarHidden = computed(() => route.meta.noNavBar )

</script>
