<template>
  <prism-editor v-if="isMounted"
                class="config-editor" :highlight="highlight"
                :style="{ height: (codeLines * 1.35) + 'em' }"
                v-model="code"
                :readonly="readOnly" :line-numbers="codeLines > 1" />
  <small v-if="editResult.error" class="p-error">{{ editResult.error }}</small>
</template>

<script setup>

  import { stringify } from "javascript-stringify"

  import 'vue-prism-editor/dist/prismeditor.min.css'
  import 'prismjs/themes/prism-coy.css'
  import * as Prism from 'prismjs/components/prism-core'
  import 'prismjs/components/prism-clike'
  import 'prismjs/components/prism-javascript'

  import { PrismEditor } from 'vue-prism-editor'

  import { ref, computed, watch, onMounted } from 'vue'

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)


  const { initialCode, initialData, readOnly, env } = defineProps({
    initialCode: {
      type: String
    },
    initialData: {
    },
    readOnly: {
      type: Boolean,
      default: false
    },
    env: {
      type: Object
    }
  })

  const emit = defineEmits(['result'])

  const code = ref(initialCode !== undefined ? initialCode : stringify(initialData, null, "  "))

  function highlight(code) {
    return Prism.highlight(code, Prism.languages.js, "js")
  }

  const codeLines = computed(() => code.value.split('\n').length)

  const modified = computed(() => code.value != initialCode)

  const editResult = computed(() => {
    if(!modified.value && initialData) return { data: initialData, code: code.value }
    try {
      const $ = env || {}
      console.log("COMPILE CODE", code.value)
      const result = eval(`(${code.value})`)
      if(result) return { data: result, code: code.value }
      return { error: 'empty' }
    } catch(e) {
      if(e instanceof SyntaxError) {
        if(e.lineNumber) return {
          error: `${e.message} at ${e.lineNumber}:${e.columnNumber - (e.lineNumber ? 0 : -1)}`
        }
      }
      return { error: e.message }
    }
  })

  function reset() {
    code.value = initialCode !== undefined ? initialCode : stringify(initialData, null, "  ")
  }

  watch(() => editResult.value, () => emit('result', editResult.value))

  defineExpose({ reset })

</script>

<style scoped>

</style>