<template>
  <div>
    <h1>Hello world!</h1>
    <p>{{ currentTime }}</p>
  </div>
</template>

<script setup>
  import { currentTime } from "@live-change/frontend-base";
  import { useTimestamp } from "@vueuse/core";

  const now = useTimestamp({ interval: 500 })

</script>

<style scoped>

</style>
