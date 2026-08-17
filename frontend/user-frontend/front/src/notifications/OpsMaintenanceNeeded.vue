<template>
  <TodoTaskNotification
    :notification="notification"
    type-key="ops_MaintenanceNeeded"
  />
</template>

<script setup>
  import TodoTaskNotification from './TodoTaskNotification.vue'

  defineProps({
    notification: {
      type: Object,
      required: true
    }
  })
</script>
