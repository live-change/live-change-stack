
<template>
  <div class="surface-card p-3 shadow-2 border-round">
    {{ d(new Date(), 'long') }}
  </div>
</template>

<script setup lang="ts">
  import { defineProps, toRefs } from 'vue'
  import { useI18n } from 'vue-i18n'
  const { t, d, n } = useI18n()

  const props = defineProps<{
    time: number
  }>()

  const { time } = toRefs(props)
</script>

<style scoped>

</style>