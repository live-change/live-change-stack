<template>

  <ConfirmPopup v-if="isMounted" />

  <PathEditor v-model="path"
              @update:read="v => { read = v; version++ }"
              @update:write="v => write = v"
              @update:remove="v => remove = v" />

<!--  <p>{{ path }}</p>-->

  <working-zone>

    <CreateObject v-if="write && !write.empty" :dbApi="dbApi" :write="write.result" class="mt-2" />

    <template v-if="read?.external?.includes('range')">
      <DataRangeView v-if="read && write && remove" :key="'rangeView' + version"
                     :dbApi="dbApi"
                     :read="read.result"
                     :write="!write.empty && write.result"
                     :remove="!remove.empty && remove.result" />
    </template>
    <template v-else>
      <DataView v-if="read && write && remove" :key="'view' + version"
                :dbApi="dbApi"
                :read="read.result"
                :write="!write.empty && write.result"
                :remove="!remove.empty && remove.result" />
    </template>

    <CreateObject v-if="write && !write.empty" :dbApi="props.dbApi" :write="write.result" class="mt-2" />

  </working-zone>

</template>

<script setup>
  import { computed, onMounted, ref } from 'vue'
  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import ConfirmPopup from 'primevue/confirmpopup'
  import PathEditor from "./PathEditor.vue"
  import DataRangeView from "./DataRangeView.vue"
  import DataView from "./DataView.vue"
  import CreateObject from "./CreateObject.vue"

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

  import { watch } from 'vue'
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
