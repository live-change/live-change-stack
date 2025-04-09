<template>
  <div class="flex flex-col h-full">
    <div class="overflow-y-auto">
      <ul class="list-none p-2 m-0">
        <li>
          <div class="p-4 text-surface-500 dark:text-surface-300 font-medium">SETTINGS</div>
        </li>

        <SettingsMenuItem name="user:identification" icon="id-card" label="Identification" class="hidden md:block" />

        <SettingsMenuItem v-if="client.user"
                          name="user:settings" icon="cog" label="General Settings" class="hidden md:block" />

        <SettingsMenuItem v-if="(availableLocales?.length ?? 0) > 1"
                          name="user:locale" icon="language" label="Language and Locale" class="hidden md:block" />

        <SettingsMenuItem v-if="clientConfig.notifications?.length"
                          name="user:notificationsSettings" icon="exclamation-circle" label="Notifications" />

      </ul>

      <ul v-if="client.user" class="list-none p-2 m-0 border-t border-surface">
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

  </div>
</template>

<script setup>
  import SettingsMenuItem from "./SettingsMenuItem.vue"

  import { useRoute } from 'vue-router'
  const route = useRoute()

  import { useApi, useClient } from '@live-change/vue3-ssr'

  const api = useApi()
  const client = useClient()

  const clientConfig = api.getServiceDefinition('notification')?.clientConfig

  import { useI18n } from 'vue-i18n'
  const { t, availableLocales } = useI18n()

</script>

<style scoped>

</style>