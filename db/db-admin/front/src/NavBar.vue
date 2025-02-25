<template>
  <div class="bg-surface-0 dark:bg-surface-900 py-1 px-6 shadow flex items-center justify-content-between
              relative md:sticky top-0 z-5"
       style="min-height: 80px" key="navbar">

    <router-link :to="{ name: 'db:databases' }" 
        class="no-underline text-gray-700 text-2xl font-medium shrink-0">
      <div class="flex items-center">
        <img src="/images/logo.svg" class="w-14 mr-6">
        <span>
          Live
        </span>
        <span  class="text-primary-400">
          Change
        </span>
        <span class="ml-1">
          Database
        </span>
      </div>
    </router-link>

    <div class="flex flex-grow"></div>


    <!-- <a v-ripple class="cursor-pointer block lg:hidden text-surface-700 dark:text-surface-100 p-ripple ml-2 hover:bg-surface-100 dark:hover:bg-surface-700 p-2"
       v-styleclass="{
         selector: '.top-menu', enterClass: 'hidden', leaveToClass: 'hidden', hideOnOutsideClick: true
       }">
      <i class="pi pi-bars text-4xl"></i>
    </a> -->

  </div>
</template>

<script setup>

  // import { useApi } from "@live-change/vue3-ssr"
  // import { computed } from "vue"

  // const api = useApi()

  //const isMember = computed(() => api.client.value.roles.includes('member'))

</script>

<style scoped>

</style>
