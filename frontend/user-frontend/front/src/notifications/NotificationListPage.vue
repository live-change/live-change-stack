<template>
  <div class="w-full lg:w-6 md:w-9">
    <div v-if="isMounted" class="surface-card border-round shadow-2 p-4">
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