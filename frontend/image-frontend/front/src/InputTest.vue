<template>
  <div class="w-full card">
    <ImageInput v-model="image" />
  </div>
  <p>{{ image ?? 'none'}}</p>
</template>

<script setup>

  import ImageInput from "./ImageInput.vue";

  import { ref } from 'vue'

  const image = ref()

</script>

<style scoped>

</style>
