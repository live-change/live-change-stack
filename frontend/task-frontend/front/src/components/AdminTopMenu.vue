<template>

  <ul class="bg-surface-0 dark:bg-surface-900 p-0 m-0 list-none flex overflow-x-auto select-none">
    <li v-for="entry in entries" :key="entry.label" class="flex-1 p-0 m-0">
      <router-link
          :to="entry.route ? { name: entry.route, params: { } } : null"
          :target="entry.target"
          v-ripple
          class="cursor-pointer px-4 py-3 flex items-center justify-center
                 border-y-2 hover:border-b-primary-400
                 transition-colors transition-duration-150 p-ripple no-underline"
          :class="[
            route.name === entry.route
              ? 'border-b-surface-400 text-surface-300 hover:border-b-surface-700 border-t-transparent'
              : 'text-surface-700 dark:text-surface-100 border-transparent'
          ]">
        <i v-if="entry.icon" class="mr-2" :class="[ entry.icon ]"></i>
        <span class="font-medium">{{ entry.label }}</span>
      </router-link>
    </li>
  </ul>
  
</template>

<script setup>

  import { useRoute } from 'vue-router'
  const route = useRoute()

  const entries = [
    { label: 'Intervals', icon: 'pi pi-clock', route: 'cron:admin:intervals' },
    { label: 'Schedules', icon: 'pi pi-calendar', route: 'cron:admin:schedules' },
    { label: 'Tasks', icon: 'pi pi-tasks', route: 'task:admin' },
  ]

</script>


<style scoped>

</style>