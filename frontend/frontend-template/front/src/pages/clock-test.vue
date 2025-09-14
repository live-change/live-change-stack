<route>
  { name: 'clock-test' }
</route>

<template>
  <div>
    <h1>Hello world!</h1>
    <p>{{ currentTime }}</p>
    <Clock :time="currentTime" />
  </div>
</template>

<script setup>
  import { useI18n } from "vue-i18n"

  import { currentTime } from "@live-change/frontend-base";

</script>

<style scoped>

</style>
