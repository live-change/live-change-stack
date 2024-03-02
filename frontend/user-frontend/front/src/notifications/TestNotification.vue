<template>
  <SimpleNotification :notification="notification">
    Test Notification
  </SimpleNotification>
</template>

<script setup>

  import SimpleNotification from "./SimpleNotification.vue"
  import { toRefs } from "@vueuse/core"

  const props = defineProps({
    notification: {
      type: Object,
      required: true
    }
  })

  const { notification } = toRefs(props)

</script>

<style scoped>

</style>