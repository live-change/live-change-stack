<template>
  <ul class="list-none p-0 m-0 flex select-none flex-col">
    <slot name="top" />
    <UserMenuItem
      :to="{ name: 'user:identification' }"
      icon="pi pi-user"
      data-testid="user-menu-profile"
    >
      {{ t('nav.profile') }}
    </UserMenuItem>
    <UserMenuItem
      v-if="!client.user"
      :to="{ name: 'user:signUpEmail' }"
      icon="pi pi-user-plus"
    >
      {{ t('nav.signUp') }}
    </UserMenuItem>
    <UserMenuItem
      v-if="!client.user"
      :to="{ name: 'user:signInEmail' }"
      icon="pi pi-key"
    >
      {{ t('nav.signIn') }}
    </UserMenuItem>
    <UserMenuItem
      v-if="client.user"
      :to="{ name: 'user:settings' }"
      icon="pi pi-cog"
    >
      {{ t('nav.settings') }}
    </UserMenuItem>
    <slot name="beforeSignOut" />
    <UserMenuItem
      v-if="client.user"
      :to="{ name: 'user:signOut' }"
      icon="pi pi-power-off"
    >
      {{ t('nav.signOut') }}
    </UserMenuItem>
  </ul>
</template>

<script setup>
  import { client as useClient } from '@live-change/vue3-ssr'
  import { useI18n } from 'vue-i18n'
  import UserMenuItem from './UserMenuItem.vue'

  const { t } = useI18n()
  const client = useClient()
</script>
