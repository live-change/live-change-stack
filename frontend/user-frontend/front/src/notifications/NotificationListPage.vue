<template>
  <div class="w-full lg:w-6/12 md:w-9/12">
    <div v-if="isMounted" class="bg-surface-0 dark:bg-surface-900 rounded-border shadow p-6">
      <NotificationsList />
    </div>
  </div>
</template>

<script setup>

  import NotificationsList from "./NotificationsList.vue"

  import { ref, onMounted } from "vue"

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

</script>

<style scoped>

</style>