<template>
  <div class="flex flex-col h-full">
    <div class="overflow-y-auto">
      <ul class="list-none p-2 m-0">
        <li>
          <div class="p-4 text-surface-500 dark:text-surface-300 font-medium">{{ t('settings.settings') }}</div>
        </li>

        <SettingsMenuItem name="user:identification" icon="id-card" :label="t('settings.identification')" class="hidden md:block" />

        <SettingsMenuItem v-if="client.user"
                          name="user:settings" icon="cog" :label="t('settings.generalSettings')" class="hidden md:block" />

        <SettingsMenuItem v-if="(availableLocales?.length ?? 0) > 1"
                          name="user:locale" icon="language" :label="t('settings.languageAndLocale')" class="hidden md:block" />

        <SettingsMenuItem v-if="clientConfig.notifications?.length"
                          name="user:notificationsSettings" icon="exclamation-circle" :label="t('settings.notifications')" />

      </ul>

      <ul v-if="client.user" class="list-none p-2 m-0 border-t border-surface">
        <li>
          <div class="p-4 text-surface-500 dark:text-surface-300 font-medium">{{ t('settings.authorization') }}</div>
        </li>

        <SettingsMenuItem v-if="client.user" name="user:connected" icon="users" :label="t('settings.connectedAccounts')" />

        <SettingsMenuItem v-if="client.user" name="user:changePassword" icon="key" :label="t('settings.changePassword')" />

      </ul>

      <ul v-if="client.user" class="list-none p-2 m-0 border-t border-surface">

        <SettingsMenuItem v-if="client.user" name="user:delete" icon="trash" :label="t('settings.deleteAccount')" />

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