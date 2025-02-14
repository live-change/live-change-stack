<template>
  <div class="surface-overlay py-3 px-6 shadow-2 flex align-items-center justify-content-between
              relative md:sticky top-0 z-5"
       style="min-height: 80px" key="navbar">

    <router-link :to="{ name: 'index' }" class="no-underline text-gray-700 text-2xl font-medium">
      <div class="flex align-items-center">
        <img src="/images/logo.svg" class="w-3rem mr-4">
        <span>
          User
        </span>
      </div>
    </router-link>

    <div class="align-items-center flex-grow-1 justify-content-between hidden lg:block absolute lg:static w-full
                surface-overlay left-0 top-100 z-1 shadow-2 lg:shadow-none top-menu">
<!--      <ul class="list-none p-0 m-0 flex lg:align-items-center select-none flex-column lg:flex-row-reverse">
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

    <div class="flex flex-grow-1"></div>

    <NotificationsIcon />

    <UserIcon />

    <a v-ripple class="cursor-pointer block lg:hidden text-700 p-ripple ml-2 hover:surface-100 p-2"
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
