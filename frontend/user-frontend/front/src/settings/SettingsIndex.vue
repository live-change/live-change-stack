<template>

  <SettingsMenu class="h-full block md:hidden surface-section" />

  <div class="flex-column flex-auto align-items-center p-5 hidden md:flex">
<!--    <LocaleSettings class="mb-5" />-->
    <Connected class="mb-5" />
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