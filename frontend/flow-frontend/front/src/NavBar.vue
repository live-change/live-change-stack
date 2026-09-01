<template>
  <div class="bg-surface-0 dark:bg-surface-900 py-1 px-6 shadow flex items-center justify-between
              relative md:sticky top-0 z-5"
       style="min-height: 64px" key="navbar">

    <router-link :to="{ name: 'index' }" class="no-underline text-gray-700 text-2xl font-medium">
      <div class="flex items-center">
        <img src="/images/logo.svg" class="w-10 mr-4">
        <span class="text-surface-700 dark:text-surface-400">
          Flow editor
        </span>
      </div>
    </router-link>

    <nav class="flex items-center gap-4">
      <router-link :to="{ name: 'index' }" data-testid="nav-kitchen-sink"
                   class="no-underline text-surface-700 dark:text-surface-400">
        Kitchen sink
      </router-link>
      <router-link :to="{ name: 'calculation' }" data-testid="nav-calculation"
                   class="no-underline text-surface-700 dark:text-surface-400">
        Calculation
      </router-link>
    </nav>

  </div>
</template>

<script setup>

</script>
