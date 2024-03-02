<template>

  <SettingsMenu class="h-full block md:hidden surface-section" />

  <div class="flex-column flex-auto align-items-center p-5 hidden md:flex">
    <Connected class="mb-5" />
    <ChangePassword />
  </div>

</template>

<script setup>
  import SettingsMenu from "./SettingsMenu.vue"

  import ChangePassword from "../password/ChangePassword.vue"
  import Connected from "../connected/Connected.vue"

</script>

<style scoped>

</style>