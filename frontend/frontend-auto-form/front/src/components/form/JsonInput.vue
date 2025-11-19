<template>
  <div>
    
    <CodeEditor :readOnly="false" :initialData="initialData" @result="result => handleEditResult(result)"
      :ref="el => editorElementFound(el)" />

  </div>
</template>

<script setup>

  import CodeEditor from './CodeEditor.vue'
  import Textarea from 'primevue/textarea'

  import { defineProps, defineEmits, toRefs, ref, defineModel, computed, watch } from 'vue'
  import { useElementSize } from '@vueuse/core'

  const props = defineProps({
    definition: {
      type: Object
    },
    properties: {
      type: Object,
      default: () => ({})
    },
    rootValue: {
      type: Object,
      default: () => ({})
    },
    propName: {
      type: String,
      default: ''
    },
    i18n: {
      type: String,
      default: ''
    }
  })

  const { definition, properties, rootValue, propName, i18n: i18nPrefix } = toRefs(props)

  const model = defineModel({
    required: true
  })
  

  const initialData = ref(JSON.parse(JSON.stringify(model.value ?? null)))
  const edited = ref(false)
  let editTimeout = null

  function handleEditResult(result) {
    edited.value = true
    model.value = result.data
    if(editTimeout) clearTimeout(editTimeout)
    editTimeout = setTimeout(() => {
      edited.value = false
      editTimeout = null
    }, 1000)
  }

  watch(() => model.value, currentData => {
    const refresh = !edited.value
    initialData.value = JSON.parse(JSON.stringify(currentData))
    if(refresh) {
      //editedData.value = JSON.parse(currentData)
      setTimeout(() => {
        codeEditor.value.reset()
      })
    }
  })

  const codeEditor = ref()
  function editorElementFound(element) {
    codeEditor.value = element
  }

</script>

<style>
 
</style>
