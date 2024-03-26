<template>
  <SimpleNotification :notification="notification">
    <div class="text-orange-600 text-2xl">
      Unknown notification {{ notification.notificationType }}!
    </div>
    <pre class="w-full overflow-hidden">{{ notification }}</pre>
  </SimpleNotification>
</template>

<script setup>

  import SimpleNotification from "./SimpleNotification.vue"

  import { toRefs, watch } from 'vue'

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