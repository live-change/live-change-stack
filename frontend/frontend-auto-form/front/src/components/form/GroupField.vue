<template>
  <div v-if="visible" class="pl-8 mb-4" :class="fieldClass" :style="fieldStyle">
    <h3>{{ t( i18n + label + ':title' ) }}</h3>
    <auto-input :modelValue="modelValue" :definition="definition" :name="props.name"
                 :class="props.inputClass" :style="props.inputStyle"
                 :properties="props.inputAttributes"
                 :rootValue="props.rootValue" :errors="props.errors"
                  :propName="props.propName"
                 @update:modelValue="value => emit('update:modelValue', value)"
                :i18n="props.i18n + props.propName.split('.').pop() + '.'" />
    <Message v-if="typeof validationResult == 'string'" severity="error" variant="simple" size="small">
      {{ t( 'errors.' + validationResult ) }}
    </Message>
  </div>
</template>

<script setup>
  import AutoInput from "./AutoInput.vue"
  import { computed, toRefs, getCurrentInstance } from 'vue'
  import Message from 'primevue/message'

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
    errors: {
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

  import { injectInputConfigByDefinition } from './inputConfigInjection.js'
  const inputConfig = computed(() => injectInputConfigByDefinition(definition.value))

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
