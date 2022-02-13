<template>
  <div class="surface-0 shadow-1 w-full">
    <div class="flex flex-row flex-wrap w-full">
      <div class="col-2 text-right">Read:</div>
      <div class="col-10">
        <CodeEditor :initialCode="path.read" @result="result => handleReadChange(result)" />
      </div>
    </div>
    <div class="flex flex-row flex-wrap w-full">
      <div class="col-2 text-right">Write:</div>
      <div class="col-10">
        <CodeEditor :initialCode="path.write" @result="result => handleWriteChange(result)" />
      </div>
    </div>
    <div v-for="field in path.params" class="flex flex-row flex-wrap w-full">
      <div class="col-2 text-right">{{ field[0] }} = </div>
      <div class="col-10">
        <CodeEditor :initialCode="field[1]"
                    @result="result => handleParamChange(field[0], result)" />
      </div>
    </div>
  </div>
  <div class="surface-0 shadow-1 w-full">
    <div class="flex flex-row flex-wrap w-full" >
      <div class="col-2 text-right">Compiled:</div>
      <div class="col-10" v-if="!readCompiled.error" v-html="highlightedObject(readCompiled.example)" />
      <div class="col-10 p-error" v-else>{{ readCompiled.error }}</div>
    </div>
    <div class="flex flex-row flex-wrap w-full">
      <div class="col-2 text-right"></div>
      <div class="col-10" v-if="!writeCompiled.error" v-html="highlightedObject(writeCompiled.example)" />
      <div class="col-10 p-error" v-else>{{ writeCompiled.error }}</div>
    </div>
  </div>
</template>

<script setup>

  import CodeEditor from "./CodeEditor.vue"

  import { stringify } from "javascript-stringify"
  import * as Prism from 'prismjs/components/prism-core'

  function highlightedObject(obj) {
    const code = stringify(obj)
    return Prism.highlight(code, Prism.languages.js, "js")
  }

  import { ref, reactive, computed, watch } from "vue"

  const { modelValue } = defineProps({
    modelValue: {
      type: Object,
      required: true
    }
  })

  const emit = defineEmits(['update:modelValue', 'update:read', 'update:write'])

  const path = reactive(modelValue)


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
    for(const field of path.params) {
      console.log("FD", field, "=>", extractParams(field[1]))
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
      params: path.params.map(([k, v]) => [k, v])
    }
  })

  watch(() => codeParams.value, params => {
    for(const newParam of params) {
      if(!path.params.find(p => p[0] == newParam)) {
        path.params.push([newParam, ''])
      }
    }
    const deletedParams = []
    for(const oldParam of path.params) {
      if(!params.find(p => p == oldParam[0]) && !oldParam[1]) {
        deletedParams.push(oldParam[0])
      }
    }
    if(deletedParams.length > 0) {
      path.params = path.params.filter(p => !deletedParams.includes(p[0]))
    }
  })

  watch(() => output.value, value => {
    console.log("EMIT OUTPUT!")
    emit('update:modelValue', output.value)
  })

  const readCompiled = computed(() => {
    try {
      const compiled = compilePath(path.read, path.params, ['range'])
      return { ...compiled, example: compiled.result({ range: {  } }) }
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
      return { ...compiled, example: compiled.result({ object: { id: 'object' } }) }
    } catch (error) {
      console.error("WRITE CODE ERROR", error)
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
  emit('update:read', readCompiled.value)
  emit('update:write', writeCompiled.value)

</script>
