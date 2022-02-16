<template>

</template>

<script setup>
  const { read, write } = defineProps({
    read: {
      type: Function,
      required: true
    },
    write: {
      type: Function,
      default: null
    }
  })


</script>

<style scoped>

</style>