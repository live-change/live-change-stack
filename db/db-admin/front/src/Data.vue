<template>

  <ConfirmPopup v-if="isMounted" />
  

  <PathEditor v-model="path"
              @update:read="v => { read = v; version++ }"
              @update:write="v => write = v"
              @update:remove="v => remove = v" />

  <div v-if="isIndex">
    <h4>Index code:</h4>  
    <pre style="white-space: pre-wrap;">{{  indexCode  }}</pre>
    <h4>Index config:</h4>
    <pre style="white-space: pre-wrap;">{{  indexConfigWithoutCode  }}</pre>
  </div>
  

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
  import CodeEditor from "./CodeEditor.vue"

  import { dbViewSugar } from "./dbSugar.js"

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

  const { dbApi } = props
  
  import { useApi } from "@live-change/vue3-ssr"
  const dao = useApi().source
  import { live } from "@live-change/dao-vue3"

  const readResult = computed(() => read.value && eval(read.value.result)({}, dbViewSugar))

  const isIndex = computed(() => readResult.value?.[0] === 'indexRange')  
  const dbName = computed(() => readResult.value?.[1])
  const indexName = computed(() => readResult.value?.[2])


  const indexCodePath = computed(() => isIndex.value ? {
    what: [dbApi, 'indexCode', dbName.value, indexName.value],
  } : null)
  const indexConfigPath = computed(() => isIndex.value ? {
    what: [dbApi, 'indexConfig', dbName.value, indexName.value],    
  } : null)

  const [indexCode, indexConfig] = await Promise.all([
    live(dao, indexCodePath),
    live(dao, indexConfigPath)
  ])

  const indexConfigWithoutCode = computed(() => {
    const config = indexConfig.value
    if(!config) return null
    return {
      ...config,
      code: undefined
    }
  })


</script>
