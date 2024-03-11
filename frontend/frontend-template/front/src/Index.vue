<template>
  <div>
    <h1>Hello world!</h1>
    <p>{{ currentTime }}</p>
    <Clock :time="currentTime" />
  </div>
</template>

<script setup>
  import { currentTime } from "@live-change/frontend-base";

</script>

<style scoped>

</style>
