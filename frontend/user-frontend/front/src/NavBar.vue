<template>
  <div class="bg-surface-0 dark:bg-surface-900 py-1 px-6 shadow flex items-center justify-content-between
              relative md:sticky top-0 z-5"
       style="min-height: 80px" key="navbar">

    <router-link :to="{ name: 'index' }" class="no-underline text-gray-700 text-2xl font-medium">
      <div class="flex items-center">
        <img src="/images/logo.svg" class="w-12 mr-6">
        <span class="text-surface-700 dark:text-surface-400">
          User
        </span>
      </div>
    </router-link>

    <div class="align-items-center flex-grow-1 justify-content-between hidden lg:block absolute lg:static w-full
                surface-overlay left-0 top-100 z-1 shadow-2 lg:shadow-none top-menu">
<!--      <ul class="list-none p-0 m-0 flex lg:items-center select-none flex-col lg:flex-row-reverse">
        <li>
          <router-link :to="{ name: 'xml:search' }" v-ripple
                       class="flex px-6 p-3 lg:px-3 lg:py-2 align-items-center text-600 hover:text-900
                         hover:surface-100 font-medium border-round cursor-pointer transition-colors
                         transition-duration-150 p-ripple no-underline">
            <i class="pi pi-search mr-2"></i>
            <span>XML Search</span>
          </router-link>
        </li>
        <li>
          <router-link :to="{ name: 'urls' }" v-ripple
                       class="flex px-6 p-3 lg:px-3 lg:py-2 align-items-center text-600 hover:text-900
                         hover:surface-100 font-medium border-round cursor-pointer transition-colors
                         transition-duration-150 p-ripple no-underline">
            <i class="pi pi-link mr-2"></i>
            <span>XMLs</span>
          </router-link>
        </li>
      </ul>-->
    </div>

    <div class="flex grow"></div>

    <NotificationsIcon />

    <UserIcon />

    <a v-ripple class="cursor-pointer block lg:hidden text-surface-700 dark:text-surface-100 p-ripple ml-2 hover:bg-surface-100 dark:hover:bg-surface-700 p-2"
       v-styleclass="{ selector: '.top-menu', enterFromClass: 'hidden', leaveToClass: 'hidden', hideOnOutsideClick: true }">
      <i class="pi pi-bars text-4xl"></i>
    </a>

  </div>
</template>

<script setup>

  import NotificationsIcon from './notifications/NotificationsIcon.vue'
  import NotificationsList from './notifications/NotificationsList.vue'

  import { UserIcon } from "@live-change/user-frontend"

  import { useApi } from "@live-change/vue3-ssr"
  import { computed } from "vue"


  const api = useApi()

  const isMember = computed(() => api.client.value.roles.includes('member'))

</script>

<style scoped>

</style>
