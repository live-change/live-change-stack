<template>
  <div class="bg-surface-0 dark:bg-surface-900 shadow-sm w-full p-2">
    <div class="flex flex-row flex-wrap w-full">
      <div class="col-span-2 text-right p-1">read:</div>
      <div class="col-span-10 p-1">
        <CodeEditor :initialCode="path.read"
                    @result="result => handleReadChange(result)" :env="env" :dbSugar="dbViewSugar" />
      </div>
    </div>
    <div class="flex flex-row flex-wrap w-full">
      <div class="col-span-2 text-right p-1">write:</div>
      <div class="col-span-10 p-1">
        <CodeEditor :initialCode="path.write"
                    @result="result => handleWriteChange(result)" :env="env" :dbSugar="dbRequestSugar" />
      </div>
    </div>
    <div class="flex flex-row flex-wrap w-full">
      <div class="col-span-2 text-right p-1">remove:</div>
      <div class="col-span-10 p-1">
        <CodeEditor :initialCode="path.remove"
                    @result="result => handleRemoveChange(result)" :env="env" :dbSugar="dbRequestSugar" />
      </div>
    </div>
    <div v-for="field in path.params" class="flex flex-row flex-wrap w-full">
      <div class="col-span-2 text-right p-1">{{ field[0] }} = </div>
      <div class="col-span-10 p-1">
        <CodeEditor :initialCode="field[1]"
                    @result="result => handleParamChange(field[0], result)" />
      </div>
    </div>
  </div>
  <div v-if="false" class="bg-surface-0 dark:bg-surface-900 shadow-sm w-full">
    <div class="flex flex-row flex-wrap w-full" >
      <div class="col-span-2 text-right">Compiled:</div>
      <div class="col-span-10" v-if="!readCompiled.error" v-html="highlightedObject(readCompiled.example)" />
      <Message v-if="readCompiled.error" severity="error" variant="simple" size="small" class="col-span-10">
        {{ readCompiled.error }}
      </Message>
    </div>
    <div class="flex flex-row flex-wrap w-full">
      <div class="col-span-2 text-right"></div>
      <div class="col-span-10" v-if="!writeCompiled.error" v-html="highlightedObject(writeCompiled.example)" />
      <Message v-if="writeCompiled.error" severity="error" variant="simple" size="small" class="col-span-10">
        {{ writeCompiled.error }}
      </Message>
    </div>
    <div class="flex flex-row flex-wrap w-full">
      <div class="col-span-2 text-right"></div>
      <div class="col-span-10" v-if="!removeCompiled.error" v-html="highlightedObject(removeCompiled.example)" />
      <Message v-if="removeCompiled.error" severity="error" variant="simple" size="small" class="col-span-10">
        {{ removeCompiled.error }}
      </Message>
    </div>
  </div>
</template>

<script setup>

  import CodeEditor from "./CodeEditor.vue"

  import { stringify } from "javascript-stringify"
  import * as Prism from 'prismjs/components/prism-core'

  import Message from "primevue/message"

  function highlightedObject(obj) {
    const code = stringify(obj)
    return Prism.highlight(code, Prism.languages.js, "js")
  }

  import { dbRequestSugar, dbViewSugar } from "./dbSugar.js";

  import { ref, reactive, computed, watch } from "vue"
  import { toRefs } from "@vueuse/core"

  const props = defineProps({
    modelValue: {
      type: Object,
      required: true
    }
  })

  const emit = defineEmits(['update:modelValue', 'update:read', 'update:write', 'update:remove'])

  const path = reactive(JSON.parse(JSON.stringify(props.modelValue)))

  watch(() => props.modelValue, value => {
    if(JSON.stringify(path) !== JSON.stringify(value)) {
      path.read = value.read
      path.write = value.write
      path.remove = value.remove
      path.params = JSON.parse(JSON.stringify(value.params))
    }
  })


  function handleReadChange(result) {
    if(result.error) {
    } else {
      path.read = result.code
    }
  }

  function handleWriteChange(result) {
    if(result.error) {
    } else {
      path.write = result.code
    }
  }

  function handleRemoveChange(result) {
    if(result.error) {
    } else {
      path.remove = result.code
    }
  }

  function handleParamChange(param, result) {
    if(result.error) {
    } else {
      path.params.find(p => p[0] == param)[1] = result.code
    }
  }

  import { extractParams, compilePath } from "./path.js"

  const codeParams = computed( () => {
    let allParams = []
    allParams.push(...extractParams(path.read))
    allParams.push(...extractParams(path.write))
    allParams.push(...extractParams(path.remove))
    for(const field of path.params) {
      //console.log("FD", field, "=>", extractParams(field[1]))
      allParams.push(...extractParams(field[1]))
    }
    const paramsSet = new Set(allParams)
    paramsSet.delete('range')
    paramsSet.delete('object')
    return Array.from(paramsSet)
  })

  const output = computed( () => {
    return {
      read: path.read,
      write: path.write,
      remove: path.remove,
      params: path.params.map(([k, v]) => [k, v])
    }
  })

  watch(() => codeParams.value, params => {
    for(const newParam of params) {
      if(!path.params.find(p => p[0] === newParam)) {
        path.params.push([newParam, ''])
      }
    }
    const removedParams = []
    for(const oldParam of path.params) {
      if(!params.find(p => p === oldParam[0]) && !oldParam[1]) {
        removedParams.push(oldParam[0])
      }
    }
    if(removedParams.length > 0) {
      path.params = path.params.filter(p => !removedParams.includes(p[0]))
    }
  })

  watch(() => output.value, value => {
    if(JSON.stringify(props.modelValue) !== JSON.stringify(value)) {
      console.log("EMIT OUTPUT!", JSON.stringify(props.modelValue), JSON.stringify(value))
      emit('update:modelValue', output.value)
    } else {
      console.log("DROP OUTPUT CHANGE", JSON.stringify(props.modelValue), JSON.stringify(value))
    }
  })

  const readCompiled = computed(() => {
    try {
      const compiled = compilePath(path.read, path.params, ['range'])
      return { ...compiled, example: compiled.result({ range: {  } }, dbViewSugar), empty: path.read === 'false'
        }
    } catch (error) {
      console.error("READ CODE ERROR", error)
      return {
        error: error.message
      }
    }
  })

  const writeCompiled = computed(() => {
    try {
      const compiled = compilePath(path.write, path.params, ['object'])
      return { ...compiled, example: compiled.result({ object: { id: 'object' } }, dbRequestSugar),
        empty: path.write === 'false' }
    } catch (error) {
      console.error("WRITE CODE ERROR", error)
      return {
        error: error.message
      }
    }
  })

  const removeCompiled = computed(() => {
    try {
      const compiled = compilePath(path.remove, path.params, ['object'])
      return { ...compiled, example: compiled.result({ object: { id: 'object' } }, dbRequestSugar),
        empty: path.remove === 'false' }
    } catch (error) {
      console.error("DELETE CODE ERROR", error)
      return {
        error: error.message
      }
    }
  })

  watch(() => readCompiled.value, value => {
    if(!value.error) emit('update:read', value)
  })
  watch(() => writeCompiled.value, value => {
    if(!value.error) emit('update:write', value)
  })
  watch(() => removeCompiled.value, value => {
    if(!value.error) emit('update:remove', value)
  })
  emit('update:read', readCompiled.value)
  emit('update:write', writeCompiled.value)
  emit('update:remove', removeCompiled.value)

  const env = {
    object: {},
    range: {}
  }

</script>
