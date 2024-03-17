<template>
  <ul class="list-none p-0 m-0 flex select-none flex-column flex-row">
    <li>
      <router-link :to="{ name: 'user:identification' }"
                   v-ripple
                   class="flex px-6 py-2 align-items-center text-600 hover:text-900 hover:surface-100
               font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple no-underline"
      >
        <i class="pi pi-user mr-2"></i>
        <span>Profile</span>
      </router-link>
    </li>
    <li v-if="!client.user">
      <router-link :to="{ name: 'user:signUp' }"
                   v-ripple
                   class="flex px-6 py-2 align-items-center text-600 hover:text-900 hover:surface-100
               font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple no-underline"
      >
        <i class="pi pi-user-plus mr-2"></i>
        <span>Sign Up</span>
      </router-link>
    </li>
    <li v-if="!client.user">
      <router-link :to="{ name: 'user:signIn' }"
                   v-ripple
                   class="flex px-6 py-2 align-items-center text-600 hover:text-900 hover:surface-100
               font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple no-underline"
      >
        <i class="pi pi-key mr-2"></i>
        <span>Sign In</span>
      </router-link>
    </li>
    <li v-if="client.user">
      <router-link :to="{ name: 'user:settings' }"
                   v-ripple
                   class="flex px-6 py-2 align-items-center text-600 hover:text-900 hover:surface-100
               font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple no-underline"
      >
        <i class="pi pi-cog mr-2"></i>
        <span>Settings</span>
      </router-link>
    </li>
    <li v-if="client.user">
      <router-link :to="{ name: 'user:signOut' }"
                   v-ripple
                   class="flex px-6 py-2 align-items-center text-600 hover:text-900 hover:surface-100
             font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple no-underline"
      >
        <i class="pi pi-power-off mr-2"></i>
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
