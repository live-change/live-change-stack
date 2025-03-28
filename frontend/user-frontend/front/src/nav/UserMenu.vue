<template>
  <ul class="list-none p-0 m-0 flex select-none flex-col">
    <li>
      <router-link :to="{ name: 'user:identification' }"
                   v-ripple
                   class="flex px-6 py-2 items-center 
                          text-surface-600 hover:text-surface-900 hover:bg-surface-100
                          dark:text-surface-400 dark:hover:text-surface-100 dark:hover:bg-surface-800
                          font-medium border-round cursor-pointer p-ripple no-underline
                          transition-colors duration-300 ease-in-out"
      >
        <i class="pi pi-user mr-3"></i>
        <span>Profile</span>
      </router-link>
    </li>
    <li v-if="!client.user">
      <router-link :to="{ name: 'user:signUpEmail' }"
                   v-ripple
                   class="flex px-6 py-2 items-center 
                          text-surface-600 hover:text-surface-900 hover:bg-surface-100
                          dark:text-surface-400 dark:hover:text-surface-100 dark:hover:bg-surface-800
                          font-medium border-round cursor-pointer p-ripple no-underline
                          transition-colors duration-300 ease-in-out"
      >
        <i class="pi pi-user-plus mr-3"></i>
        <span>Sign Up</span>
      </router-link>
    </li>
    <li v-if="!client.user">
      <router-link :to="{ name: 'user:signInEmail' }"
                   v-ripple
                   class="flex px-6 py-2 items-center 
                          text-surface-600 hover:text-surface-900 hover:bg-surface-100
                          dark:text-surface-400 dark:hover:text-surface-100 dark:hover:bg-surface-800
                          font-medium border-round cursor-pointer p-ripple no-underline
                          transition-colors duration-300 ease-in-out"
      >
        <i class="pi pi-key mr-3"></i>
        <span>Sign In</span>
      </router-link>
    </li>
    <li v-if="client.user">
      <router-link :to="{ name: 'user:settings' }"
                   v-ripple
                   class="flex px-6 py-2 items-center 
                          text-surface-600 hover:text-surface-900 hover:bg-surface-100
                          dark:text-surface-400 dark:hover:text-surface-100 dark:hover:bg-surface-800
                          font-medium border-round cursor-pointer p-ripple no-underline
                          transition-colors duration-300 ease-in-out"
      >
        <i class="pi pi-cog mr-3"></i>
        <span>Settings</span>
      </router-link>
    </li>
    <li v-if="client.user">
      <router-link :to="{ name: 'user:signOut' }"
                   v-ripple
                   class="flex px-6 py-2 items-center 
                   text-surface-600 hover:text-surface-900 hover:bg-surface-100
                          dark:text-surface-400 dark:hover:text-surface-100 dark:hover:bg-surface-800
                          font-medium border-round cursor-pointer p-ripple no-underline
                          transition-colors duration-300 ease-in-out"
      >
        <i class="pi pi-power-off mr-3"></i>
        <span>Sign Out</span>
      </router-link>
    </li>
  </ul>
</template>

<script setup>

  import { path, live, actions } from '@live-change/vue3-ssr'
  import { client as useClient } from '@live-change/vue3-ssr'
  import { toRefs } from '@vueuse/core'

  const client = useClient()

</script>

<style lang="scss">

</style>
