<template>
  <div class="surface-overlay py-3 px-6 shadow-2 flex align-items-center justify-content-between
              relative md:sticky top-0 z-5"
       style="min-height: 80px" key="navbar">
    <img src="/images/logo.svg" alt="Image" height="40" class="mr-0 lg:mr-6">
    <div class="hidden lg:flex">
      <!-- place for desktop menu -->
    </div>
    <div class="flex flex-grow-1"></div>
    <NotificationsIcon />
    <UserIcon />


    <div class="static w-auto w-full surface-overlay left-0 top-100 z-1 shadow-none hidden">
      <ul class="list-none p-0 m-0 flex align-items-center select-none flex-row border-top-none">
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


    <a v-ripple class="cursor-pointer block lg:hidden text-700 p-ripple ml-2 hover:surface-100 p-2"
       v-styleclass="{ selector: '@next', enterFromClass: 'hidden', leaveToClass: 'hidden', hideOnOutsideClick: true }">
      <i class="pi pi-bars text-4xl"></i>
    </a>
    <div class="align-items-center flex-grow-1 justify-content-between hidden absolute lg:static w-full surface-overlay left-0 top-100 z-1 shadow-2 lg:shadow-none">
      <ul class="list-none p-0 m-0 flex lg:align-items-center select-none flex-column lg:flex-row">
        <li>
          <a v-ripple class="flex px-6 p-3 lg:px-3 lg:py-2 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple">
            <i class="pi pi-home mr-2"></i>
            <span>Home</span>
          </a>
        </li>
        <li class="lg:relative">
          <a v-ripple class="flex px-6 p-3 lg:px-3 lg:py-2 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple"
             v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'scalein', leaveToClass: 'hidden', leaveActiveClass: 'fadeout', hideOnOutsideClick: true }">
            <i class="pi pi-users mr-2"></i>
            <span>Customers</span>
            <i class="pi pi-angle-down ml-auto lg:ml-3"></i>
          </a>
          <ul class="list-none py-3 px-6 m-0 lg:px-0 lg:py-0 border-round shadow-0 lg:shadow-2 lg:border-1 border-50 lg:absolute surface-overlay hidden origin-top w-full lg:w-15rem cursor-pointer">
            <li>
              <a v-ripple class="flex p-3 align-items-center text-600 hover:text-900 hover:surface-100 transition-colors transition-duration-150 p-ripple">
                <i class="pi pi-user-plus mr-2"></i>
                <span class="font-medium">Add New</span>
              </a>
            </li>
            <li class="relative">
              <a v-ripple class="flex p-3 align-items-center text-600 hover:text-900 hover:surface-100 transition-colors transition-duration-150 p-ripple"
                 v-styleclass="{ selector: '@next', enterFromClass: 'hidden', enterActiveClass: 'scalein', leaveToClass: 'hidden', leaveActiveClass: 'fadeout', hideOnOutsideClick: true }">
                <i class="pi pi-search mr-2"></i>
                <span class="font-medium">Search</span>
                <i class="pi pi-angle-down ml-auto lg:-rotate-90"></i>
              </a>
              <ul class="list-none py-3 pl-3 m-0 lg:px-0 lg:py-0 border-round shadow-0 lg:shadow-2 lg:border-1 border-50 lg:absolute surface-overlay hidden origin-top w-full lg:w-15rem cursor-pointer left-100 top-0">
                <li>
                  <a v-ripple class="flex p-3 align-items-center text-600 hover:text-900 hover:surface-100 transition-colors transition-duration-150 p-ripple">
                    <i class="pi pi-shopping-cart mr-2"></i>
                    <span class="font-medium">Purchases</span>
                  </a>
                </li>
                <li class="relative">
                  <a v-ripple class="flex p-3 align-items-center text-600 hover:text-900 hover:surface-100 transition-colors transition-duration-150 p-ripple">
                    <i class="pi pi-comments mr-2"></i>
                    <span class="font-medium">Messages</span>
                  </a>
                </li>
              </ul>
            </li>
          </ul>
        </li>
        <li>
          <a v-ripple class="flex px-6 p-3 lg:px-3 lg:py-2 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple">
            <i class="pi pi-calendar mr-2"></i>
            <span>Calendar</span>
          </a>
        </li>
        <li>
          <a v-ripple class="flex px-6 p-3 lg:px-3 lg:py-2 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple">
            <i class="pi pi-chart-line mr-2"></i>
            <span>Stats</span>
          </a>
        </li>
      </ul>
      <ul class="list-none p-0 m-0 flex lg:align-items-center select-none flex-column lg:flex-row border-top-1 surface-border lg:border-top-none">
        <li>
          <a v-ripple class="flex px-6 p-3 lg:px-3 lg:py-2 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple">
            <i class="pi pi-inbox text-base lg:text-2xl mr-2 lg:mr-0"></i>
            <span class="block lg:hidden font-medium">Inbox</span>
          </a>
        </li>
        <li class="border-top-1 surface-border lg:border-top-none">
          <a v-ripple class="flex px-6 p-3 lg:px-3 lg:py-2 align-items-center hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple">
            <img src="/images/empty-user-photo.svg" class="mr-3 lg:mr-0 border-circle" style="width: 28px; height: 28px"/>
            <div class="block lg:hidden">
              <div class="text-900 font-medium">Josephine Lillard</div>
              <span class="text-600 font-medium text-sm">Marketing Specialist</span>
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
