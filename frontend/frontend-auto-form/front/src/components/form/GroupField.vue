<template>
  <div v-if="visible" class="pl-5 mb-3" :class="fieldClass" :style="fieldStyle">
    <h3>{{ t( i18n + label + ':title' ) }}</h3>
    <auto-input :modelValue="modelValue" :definition="definition" :name="props.name"
                 :class="props.inputClass" :style="props.inputStyle"
                 :properties="props.inputAttributes"
                 :rootValue="props.rootValue" :propName="props.propName"
                 @update:modelValue="value => emit('update:modelValue', value)"
                :i18n="props.i18n + props.propName.split('.').pop() + '.'" />
    <small v-if="typeof validationResult == 'string'" class="p-error">{{ t( 'errors.' + validationResult ) }}</small>
  </div>
</template>

<script setup>
  import AutoInput from "./AutoInput.vue"
  import { inputs, types } from '../../config.js'
  import { computed, inject, toRefs, getCurrentInstance } from 'vue'

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const props = defineProps({
    modelValue: {},
    error: {
      type: String
    },
    definition: {
      type: Object
    },
    name: {
      type: String
    },
    label: {
      type: String
    },
    class: {},
    style: {},
    inputClass: {},
    inputStyle: {},
    attributes: {
      type: Object,
      default: () => ({})
    },
    inputAttributes: {
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

  const emit = defineEmits(['update:modelValue'])

  const { error, definition, modelValue } = toRefs(props)

  const definitionIf = computed(() => {
    if(definition.value?.if) {
      if(definition.value?.if.function) {
        return eval(`(${definition.value.if.function})`)
      }
    }
    return false
  })

  const visible = computed(() => {
    if(!definition.value) return false
    if(definitionIf.value) {
      return definitionIf.value({
        source: definition.value,
        props: props.rootValue,
        propName: props.propName
      })
    }
    return true
  })

  const inputConfig = computed(() => {
    if(definition.value?.input) return inputs[definition.value.input]
    if(definition.value?.type) return types[definition.value.type]
    return inputs.default
  })

  import { validateData } from "@live-change/vue3-components"

  const appContext = getCurrentInstance().appContext

  const validationResult = computed(() => {
    console.log('validation', definition.value, modelValue.value)
    const validationResult = validateData(definition.value, modelValue.value, 'validation', appContext)
    const softValidationResult = validateData(definition.value, modelValue.value, 'softValidation', appContext)
    console.log('validationResult', validationResult, softValidationResult, error.value)
    return validationResult || softValidationResult || error.value
  })

  const label = computed(() => props.label || definition.value?.label || props.name)

  const fieldClass = computed(() => [inputConfig.value?.fieldClass, definition.value?.fieldClass, props.class, {
    'p-invalid': !!error.value
  }])
  const fieldStyle = computed(() => [inputConfig.value?.fieldStyle, definition.value?.fieldStyle, props.style])

</script>

<style scoped>

</style>
