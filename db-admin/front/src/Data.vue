<template>
  <p>{{ path }}</p>

  <PathEditor v-model="path"></PathEditor>

</template>

<script setup>
  import PathEditor from "./PathEditor.vue"

  const { position, read, write, params } = defineProps({
    position: {
      type: String,
      required: true
    },
    read: {
      type: String,
      required: true
    },
    write: {
      type: String,
      required: true
    },
    params: {
      type: Array,
      required: true
    }
  })

  const pathParams = new Array(params.length / 2)
  for(let i = 0; i < params.length/2; i++) pathParams[i] = [params[i * 2], params[i * 2 + 1]]

  import { ref } from 'vue'

  const path = ref({ read, write, params: pathParams })



</script>
