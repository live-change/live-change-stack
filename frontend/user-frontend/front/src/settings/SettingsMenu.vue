<template>
  <div class="flex flex-col h-full">
    <div class="overflow-y-auto">
      <ul class="list-none p-2 m-0">
        <li>
          <div class="p-4 text-surface-500 dark:text-surface-300 font-medium">SETTINGS</div>
        </li>

        <SettingsMenuItem name="user:identification" icon="id-card" label="Identification" class="hidden md:block" />

        <SettingsMenuItem v-if="client.user" name="user:settings" icon="cog" label="General Settings" class="hidden md:block" />

        <SettingsMenuItem name="user:locale" icon="language" label="Language and Locale" class="hidden md:block" />

        <SettingsMenuItem name="user:notificationsSettings" icon="exclamation-circle" label="Notifications" />

      </ul>

      <ul v-if="client.user"  class="list-none p-2 m-0 border-t border-surface">
        <li>
          <div class="p-4 text-surface-500 dark:text-surface-300 font-medium">AUTHORIZATION</div>
        </li>

        <SettingsMenuItem v-if="client.user" name="user:connected" icon="users" label="Connected Accounts" />

        <SettingsMenuItem v-if="client.user" name="user:changePassword" icon="key" label="Change Password" />

      </ul>

      <ul v-if="client.user" class="list-none p-2 m-0 border-t border-surface">

        <SettingsMenuItem v-if="client.user" name="user:delete" icon="trash" label="Delete Account" />

      </ul>
    </div>

    <!--        <div class="p-2 mt-auto border-t border-surface">
              <ul class="list-none p-2 m-0 hidden origin-bottom animate-duration-150">
                <li>
                  <a v-ripple class="flex align-items-center cursor-pointer p-3 text-700 hover:surface-100
                      border-round transition-colors transition-duration-150 p-ripple">
                    <i class="pi pi-user mr-2"></i>
                    <span class="font-medium">Profile</span>
                  </a>
                </li>
                <li>
                  <a v-ripple class="flex align-items-center cursor-pointer p-3 text-700 hover:surface-100
                      border-round transition-colors transition-duration-150 p-ripple">
                    <i class="pi pi-cog mr-2"></i>
                    <span class="font-medium">Settings</span>
                  </a>
                </li>
                <li>
                  <a v-ripple class="flex align-items-center cursor-pointer p-3 text-700 hover:surface-100
                      border-round transition-colors transition-duration-150 p-ripple">
                    <i class="pi pi-sign-out mr-2"></i>
                    <span class="font-medium">Sign Out</span>
                  </a>
                </li>
              </ul>
              <a v-ripple class="p-3 flex align-items-center cursor-pointer text-700 hover:surface-100
                  border-round transition-colors transition-duration-150 p-ripple"
                 v-styleclass="{ selector: '@prev', enterFromClass: 'hidden', enterActiveClass: 'animate-scalein',
                   leaveToClass: 'hidden', leaveActiveClass: 'animate-fadeout' }">
                <img src="/images/empty-user-photo.svg" class="mr-2 rounded-full" style="width: 28px; height: 28px"/>
                <span class="font-medium">Amy Elsner</span>
                <i class="pi pi-chevron-up ml-auto"></i>
              </a>
            </div>-->
  </div>
</template>

<script setup>
  import SettingsMenuItem from "./SettingsMenuItem.vue"

  import { useRoute } from 'vue-router'
  const route = useRoute()

  import { client as useClient } from '@live-change/vue3-ssr'

  const client = useClient()

</script>

<style scoped>

</style>