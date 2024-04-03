<template>
  <div class="w-full lg:w-6 md:w-9">
    <div class="surface-card border-round shadow-2 p-4">
      <div class="text-900 font-medium mb-3 text-xl">Test Index</div>
      <div>
        <Button @click="testNotification" label="Add test notification" />
      </div>
    </div>
  </div>
</template>

<script setup>

  import { useApi } from '@live-change/vue3-ssr'

  const api = useApi()

  function testNotification() {
    api.actions.notification.testNotification({ })
  }

</script>

<style scoped>

</style>