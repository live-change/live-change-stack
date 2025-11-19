<template>
  <div class="w-full px-4 py-5 flex flex-col items-center justify-center">
    <div class="bg-surface-0 dark:bg-surface-900 p-3 shadow mb-1 w-60 text-center mb-4">
      <h1 class="my-1 text-center">Cron Admin</h1>
    </div>
    <div class="flex flex-row gap-4 items-center justify-center">
      <router-link :to="{ name: 'cron:admin:intervals' }" class="no-underline">
        <Button label="Intervals" icon="pi pi-clock" size="large" />
      </router-link>
      <router-link :to="{ name: 'cron:admin:schedules' }" class="no-underline">
        <Button label="Schedules" icon="pi pi-calendar" size="large" />
      </router-link>
    </div>
     
  </div>
</template>

<script setup>

</script>