<template>
  <div class="flex">
    <i class="pi pi-globe mr-2"></i>
    <template v-if="canonical">
      <span class="font-bold mr-2">Url:</span>
      <span class="mr-1 font-normal">{{ canonical.domain || '*' }}</span>
      <span class="text-ellipsis overflow-hidden font-normal grow">
        {{props.prefix}}{{ canonical.path }}
      </span>

    </template>
    <span v-else>No Url</span>
    <template v-if="redirects.length">
      <i class="pi pi-arrow-up-right mr-1 ml-4"></i>
      <span class="font-bold">{{ redirects.length }}</span>
    </template>
  </div>
</template>

<script setup>
  const props = defineProps({
    target: {
      type: String,
      required: true
    },
    targetType: {
      type: String,
      required: true
    },
    prefix: {
      type: String,
      default: '/'
    }
  })

  import { computed } from 'vue'

  import { path, live } from '@live-change/vue3-ssr'
  const p = path()
  const canonicalLivePath = computed(
    () => p.url.canonical({ targetType: props.targetType, target: props.target })
  )
  const redirectsLivePath = computed(
    () => p.url.redirects({ targetType: props.targetType, target: props.target })
  )
  const [canonical, redirects] = await Promise.all([
    live(canonicalLivePath),
    live(redirectsLivePath)
  ])

</script>

<style scoped>

</style>
