<template>
  <div class="bg-surface-0 dark:bg-surface-900 py-1 px-6 shadow flex items-center justify-content-between
              relative md:sticky top-0 z-5"
       style="min-height: 80px" key="navbar">

    <router-link to="/" class="no-underline mr-0 lg:mr-12">
      <div class="flex items-center text-2xl text-surface-800 dark:text-surface-50 font-medium">
        <img src="/images/logo.svg" alt="Logo" class="w-12 mr-3">
        <span class="hidden md:block">
          Live
        </span>
        <span class="hidden md:block text-primary-400">
          Change
        </span>
        <span class="hidden md:block ml-2">
          App
        </span>
      </div>
    </router-link>

    <div class="align-items-center flex-grow-1 justify-content-between hidden lg:block lg:ml-6 absolute lg:static w-full
                bg-surface-0 dark:bg-surface-900 left-0 top-1/1 z-1 shadow lg:shadow-none top-menu
                 dark:border-t-1 dark:border-surface-700 md:dark:border-t-0">
      <ul class="list-none p-0 m-0 flex items-end lg:items-center select-none flex-col lg:flex-row justify-end">
        <li class="w-1/1 lg:w-auto">
          <router-link
              :to="'/'" v-ripple
              class="flex justify-end px-6 p-3 lg:px-3 lg:py-2 items-center
                    text-surface-600 hover:text-900 hover:bg-surface-100 
                    dark:text-primary-400 dark:hover:text-primary-100 dark:hover:bg-surface-800
                    font-medium text-2xl md:text-xl border-round cursor-pointer transition-colors
                    transition-duration-150 p-ripple no-underline">
            <!--            <i class="pi pi-home mr-2"></i>-->
            <span>Home</span>
          </router-link>
        </li>
        <li v-if="!client.user" class="w-1/1 lg:w-auto">
          <router-link
              :to="{ name: 'user:signInEmail' }" v-ripple
              class="flex justify-end px-6 p-3 lg:px-3 lg:py-2 align-items-center 
                    text-surface-600 hover:text-900 hover:bg-surface-100 
                    dark:text-primary-400 dark:hover:text-primary-100 dark:hover:bg-surface-800
                    font-medium text-2xl md:text-xl border-round cursor-pointer transition-colors
                    transition-duration-150 p-ripple no-underline">
            <!--            <i class="pi pi-home mr-2"></i>-->
            <span>Sign in</span>
          </router-link>
        </li>
        <li v-if="!client.user" class="w-1/1 lg:w-auto">
          <router-link
              :to="{ name: 'user:signUpEmail' }" v-ripple
              class="flex justify-end px-6 p-3 lg:px-3 lg:py-2 align-items-center 
                    text-surface-600 hover:text-900 hover:bg-surface-100 
                    dark:text-primary-400 dark:hover:text-primary-100 dark:hover:bg-surface-800
                    font-medium text-2xl md:text-xl border-round cursor-pointer transition-colors
                    transition-duration-150 p-ripple no-underline">
            <!--            <i class="pi pi-home mr-2"></i>-->
            <span>Sign up</span>
          </router-link>
        </li>
      </ul>
    </div>

    <div class="flex grow"></div>

    <NotificationsIcon v-if="client.user" />

    <UserIcon v-if="client.user" />

    <a v-ripple class="cursor-pointer flex items-center justify-content-center no-underline lg:hidden text-surface-700 dark:text-surface-100 p-ripple
                                       ml-2 hover:bg-surface-100 dark:hover:bg-surface-700 p-2"
       v-styleclass="{
         selector: '.top-menu', enterFromClass: 'hidden', leaveToClass: 'hidden', hideOnOutsideClick: true
       }">
      <i class="pi pi-bars" style="font-size: 2.46rem;"></i>
    </a>


  </div>
</template>

<script setup>

  import { NotificationsIcon } from "@live-change/user-frontend"

  import { UserIcon } from "@live-change/user-frontend"
  import { client as useClient, useApi } from '@live-change/vue3-ssr'
  const client = useClient()


</script>

<style scoped>

</style>
