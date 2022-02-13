<template>

  <PathEditor v-model="path" @update:read="v => read = v" @update:write="v => write = v"></PathEditor>

  <p>{{ path }}</p>


  <div v-if="read?.external?.includes('range')">
    RANGED
  </div>
  <div v-else>
    DONE
  </div>

</template>

<script setup>
  import PathEditor from "./PathEditor.vue"

  const props = defineProps({
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

  const pathParams = new Array(props.params.length / 2)
  for(let i = 0; i < props.params.length/2; i++) pathParams[i] = [props.params[i * 2], props.params[i * 2 + 1]]

  import { ref, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'

  const path = ref({ read: props.read, write: props.write, params: pathParams })

  const router = useRouter()
  const route = useRoute()

  watch(() => path.value, value => {
    console.log("PATH VALUE UPDATED", value)
    const paramsArray = value.params.flat()
    router.replace({ name: route.name, params: {
      read: value.read,
      write: value.write,
      params: paramsArray
    } })
    /// TODO: update URL
  })

  const read = ref()
  const write = ref()

</script>
