<template>
  <div class="surface-overlay py-3 px-6 shadow-2 flex align-items-center justify-content-between
              relative sticky top-0 z-5"
       style="min-height: 80px" key="navbar">
    <img src="/images/logo.svg" alt="Image" height="40" class="mr-0 lg:mr-12">
    <div class="hidden lg:flex">
      <!-- place for desktop menu -->
    </div>
    <div class="flex grow"></div>
    <UserIcon />


    <div class="static w-auto w-full bg-surface-0 dark:bg-surface-900 left-0 top-full z-10 shadow-none hidden">
      <ul class="list-none p-0 m-0 flex items-center select-none flex-row border-t-0">
        <li>
          <a v-ripple class="flex p-3 px-3 align-items-center text-600 hover:text-900 hover:surface-100
            font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple">
            <i class="pi pi-inbox text-base text-2xl mr-0"></i>
          </a>
        </li>
        <li>
          <a v-ripple class="flex p-3 px-3 align-items-center text-600 hover:text-900 hover:surface-100 font-medium
           border-round cursor-pointer transition-colors transition-duration-150 p-ripple">
            <i class="pi pi-bell text-base lg:text-2xl mr-2 lg:mr-0" v-badge.danger></i>
          </a>
        </li>
      </ul>
    </div>


    <a v-ripple class="cursor-pointer block lg:hidden text-surface-700 dark:text-surface-100 p-ripple ml-2 hover:bg-surface-100 dark:hover:bg-surface-700 p-2"
       v-styleclass="{ selector: '@next', enterFromClass: 'hidden', leaveToClass: 'hidden', hideOnOutsideClick: true }">
      <i class="pi pi-bars text-4xl"></i>
    </a>
    <div class="items-center grow justify-between hidden absolute lg:static w-full bg-surface-0 dark:bg-surface-900 left-0 top-full z-10 shadow lg:shadow-none">
      <ul class="list-none p-0 m-0 flex lg:items-center select-none flex-col lg:flex-row">
        <li>
          <a v-ripple class="flex px-12 p-4 lg:px-4 lg:py-2 items-center text-surface-600 dark:text-surface-200 hover:text-surface-900 dark:hover:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-700 font-medium rounded-border cursor-pointer transition-colors duration-150 p-ripple">
            <i class="pi pi-home mr-2"></i>
            <span>Home</span>
          </a>
        </li>
        <li class="lg:relative">
          <a v-ripple class="flex px-12 p-4 lg:px-4 lg:py-2 items-center text-surface-600 dark:text-surface-200 hover:text-surface-900 dark:hover:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-700 font-medium rounded-border cursor-pointer transition-colors duration-150 p-ripple"
             v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'scalein', leaveToClass: 'hidden', leaveActiveClass: 'fadeout', hideOnOutsideClick: true }">
            <i class="pi pi-users mr-2"></i>
            <span>Customers</span>
            <i class="pi pi-angle-down ml-auto lg:ml-4"></i>
          </a>
          <ul class="list-none py-4 px-12 m-0 lg:px-0 lg:py-0 rounded-border shadow-0 lg:shadow lg:border border-surface-50 dark:border-surface-800 lg:absolute bg-surface-0 dark:bg-surface-900 hidden origin-top w-full lg:w-60 cursor-pointer">
            <li>
              <a v-ripple class="flex p-4 items-center text-surface-600 dark:text-surface-200 hover:text-surface-900 dark:hover:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors duration-150 p-ripple">
                <i class="pi pi-user-plus mr-2"></i>
                <span class="font-medium">Add New</span>
              </a>
            </li>
            <li class="relative">
              <a v-ripple class="flex p-4 items-center text-surface-600 dark:text-surface-200 hover:text-surface-900 dark:hover:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors duration-150 p-ripple"
                 v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'scalein', leaveToClass: 'hidden', leaveActiveClass: 'fadeout', hideOnOutsideClick: true }">
                <i class="pi pi-search mr-2"></i>
                <span class="font-medium">Search</span>
                <i class="pi pi-angle-down ml-auto lg:-rotate-90"></i>
              </a>
              <ul class="list-none py-4 pl-4 m-0 lg:px-0 lg:py-0 rounded-border shadow-0 lg:shadow lg:border border-surface-50 dark:border-surface-800 lg:absolute bg-surface-0 dark:bg-surface-900 hidden origin-top w-full lg:w-60 cursor-pointer left-full top-0">
                <li>
                  <a v-ripple class="flex p-4 items-center text-surface-600 dark:text-surface-200 hover:text-surface-900 dark:hover:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors duration-150 p-ripple">
                    <i class="pi pi-shopping-cart mr-2"></i>
                    <span class="font-medium">Purchases</span>
                  </a>
                </li>
                <li class="relative">
                  <a v-ripple class="flex p-4 items-center text-surface-600 dark:text-surface-200 hover:text-surface-900 dark:hover:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors duration-150 p-ripple">
                    <i class="pi pi-comments mr-2"></i>
                    <span class="font-medium">Messages</span>
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </li>
        <li>
          <a v-ripple class="flex px-12 p-4 lg:px-4 lg:py-2 items-center text-surface-600 dark:text-surface-200 hover:text-surface-900 dark:hover:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-700 font-medium rounded-border cursor-pointer transition-colors duration-150 p-ripple">
            <i class="pi pi-calendar mr-2"></i>
            <span>Calendar</span>
          </a>
        </li>
        <li>
          <a v-ripple class="flex px-12 p-4 lg:px-4 lg:py-2 items-center text-surface-600 dark:text-surface-200 hover:text-surface-900 dark:hover:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-700 font-medium rounded-border cursor-pointer transition-colors duration-150 p-ripple">
            <i class="pi pi-chart-line mr-2"></i>
            <span>Stats</span>
          </a>
        </li>
      </ul>
      <ul class="list-none p-0 m-0 flex lg:items-center select-none flex-col lg:flex-row border-t border-surface lg:border-t-0">
        <li>
          <a v-ripple class="flex px-12 p-4 lg:px-4 lg:py-2 items-center text-surface-600 dark:text-surface-200 hover:text-surface-900 dark:hover:text-surface-0 hover:bg-surface-100 dark:hover:bg-surface-700 font-medium rounded-border cursor-pointer transition-colors duration-150 p-ripple">
            <i class="pi pi-inbox text-base lg:text-2xl mr-2 lg:mr-0"></i>
            <span class="block lg:hidden font-medium">Inbox</span>
          </a>
        </li>
        <li class="border-t border-surface lg:border-t-0">
          <a v-ripple class="flex px-12 p-4 lg:px-4 lg:py-2 items-center hover:bg-surface-100 dark:hover:bg-surface-700 font-medium rounded-border cursor-pointer transition-colors duration-150 p-ripple">
            <img src="/images/empty-user-photo.svg" class="mr-4 lg:mr-0 rounded-full" style="width: 28px; height: 28px"/>
            <div class="block lg:hidden">
              <div class="text-surface-900 dark:text-surface-0 font-medium">Josephine Lillard</div>
              <span class="text-surface-600 dark:text-surface-200 font-medium text-sm">Marketing Specialist</span>
            </div>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>

import { NotificationsIcon } from "@live-change/user-frontend"

import { UserIcon } from "@live-change/user-frontend"



</script>

<style scoped>

</style>
