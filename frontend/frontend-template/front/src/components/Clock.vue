
<template>
  <div class="bg-surface-0 dark:bg-surface-900 p-4 shadow rounded-border">
    {{ d(locale.localTime(new Date(time)), 'long') }}
  </div>
</template>

<script setup lang="ts">
  import { defineProps, toRefs } from 'vue'
  import { useI18n } from 'vue-i18n'
  const { d } = useI18n()

  // @ts-ignore
  import { useLocale } from "@live-change/vue3-components"
  const locale = useLocale()

  const props = defineProps<{
    time: number
  }>()

  const { time } = toRefs(props)
</script>

<style scoped>

</style>