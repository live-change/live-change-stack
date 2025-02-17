<template>

  <SettingsMenu class="h-full block md:hidden bg-surface-0 dark:bg-surface-950" />

  <div class="flex-col flex-auto items-center p-8 hidden md:flex">
<!--    <LocaleSettings class="mb-8" />-->
    <Connected class="mb-8" />
    <ChangePassword />
  </div>

</template>

<script setup>
  import SettingsMenu from "./SettingsMenu.vue"

  import ChangePassword from "../password/ChangePassword.vue"
  import Connected from "../connected/Connected.vue"
  import LocaleSettings from '../locale/LocaleSettings.vue'

</script>

<style scoped>

</style>