<template>
  <div class="w-full">
    <div class="w-full bg-surface-0 dark:bg-surface-900">
      <h2 class="p-6">Editor:</h2>
      <ImageEditor v-model="image" />
<!--      :source-image="'[Wc6P55MDs.0@1V6ZJBwyF_1I98X_]'"-->
    </div>
    <div v-if="image">
      <h2>Preview:</h2>
      <Image :image="image" width="200" height="200" :key="image" />
    </div>
  </div>
</template>

<script setup>

  import ImageEditor from "./ImageEditor.vue"
  import Image from "./Image.vue"

  import { ref } from 'vue'

  const image = ref()

</script>

<style scoped>

</style>
