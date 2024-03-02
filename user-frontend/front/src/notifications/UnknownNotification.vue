<template>
  <SimpleNotification :notification="notification">
    <div class="text-orange-600 text-2xl">
      Unknown notification!
    </div>
    <pre class="w-full overflow-hidden">{{ notification }}</pre>
  </SimpleNotification>
</template>

<script setup>

  import SimpleNotification from "./SimpleNotification.vue"

  const { notification } = defineProps({
    notification: {
      type: Object,
      required: true
    }
  })

</script>

<style scoped>

</style>