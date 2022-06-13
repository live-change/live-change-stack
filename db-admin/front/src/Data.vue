<template>

  <PathEditor v-model="path"
              @update:read="v => { read = v; version++ }"
              @update:write="v => write = v"
              @update:remove="v => remove = v" />

<!--  <p>{{ path }}</p>-->

  <template v-if="read?.external?.includes('range')">
    <DataRangeView v-if="read && write && remove" :key="'rangeView' + version"
                   :dbApi="dbApi" :read="read.result" :write="write.result" :remove="remove.result" />
  </template>
  <template v-else>
    <DataView v-if="read && write && remove" :key="'view' + version"
              :dbApi="dbApi" :read="read.result" :write="write.result" :remove="remove.result" />
  </template>

</template>

<script setup>
  import { computed } from 'vue'

  import PathEditor from "./PathEditor.vue"
  import DataRangeView from "./DataRangeView.vue"
  import DataView from "./DataView.vue"

  const props = defineProps({
    dbApi: {
      type: String,
      default: 'serverDatabase'
    },
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
    remove: {
      type: String,
      required: true
    },
    params: {
      type: Array,
      required: true
    }
  })



  import { ref, watch } from 'vue'
  import { useRouter, useRoute } from 'vue-router'

  function computePath() {
    const pathParams = new Array(props.params.length / 2)
    for(let i = 0; i < props.params.length/2; i++) pathParams[i] = [props.params[i * 2], props.params[i * 2 + 1]]
    return { read: props.read, write: props.write, remove: props.remove, params: pathParams }
  }

  const propsPath = computed(() => computePath())

  const path = ref(propsPath.value)
  watch(() => propsPath.value, () => path.value = propsPath.value)

  const router = useRouter()
  const route = useRoute()

  watch(() => path.value, value => {
    console.log("PATH VALUE UPDATED", JSON.stringify(value, null, '  '))
    const paramsArray = value.params.flat()
    router.replace({ name: route.name, params: {
      read: value.read,
      write: value.write, 
      remove: value.remove,
      params: paramsArray
    } })
    /// TODO: update URL
  })

  const version = ref(0)
  const read = ref()
  const write = ref()
  const remove = ref()

</script>
