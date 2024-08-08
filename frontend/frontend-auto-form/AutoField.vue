<template>
  <component v-if="fieldComponent && visible" :is="fieldComponent" v-bind="attributes"
             @update:modelValue="value => emit('update:modelValue', value)" :i18n="i18n" />
  <div v-else-if="visible" class="field" :class="fieldClass" :style="fieldStyle">
    <label :for="uid">{{ t( label ) }}</label>
    <slot>
      <auto-input :modelValue="modelValue" :definition="definition"
                  :class="props.inputClass" :style="props.inputStyle"
                  :attributes="props.inputAttributes"
                  :propName="props.propName"
                  :rootValue="props.rootValue"
                  @update:modelValue="value => emit('update:modelValue', value)"
                  :id="uid"
                  :i18n="i18n" />
    </slot>
    <div>
      <small v-if="validationResult" class="p-error mt-1">
        {{ (typeof validationResult === 'object')
             ? t( 'errors.' + validationResult.error, validationResult.validator )
             : t( 'errors.' + validationResult ) }}
      </small>
      <small v-if="maxLengthValidation" style="float: right" class="mt-1"
             :class="{ 'p-error': props.modelValue?.length > maxLengthValidation.length }">
        {{ t( 'info.maxLength', { maxLength: maxLengthValidation.length, length: props.modelValue?.length ?? 0 }) }}
      </small>
    </div>
  </div>
</template>

<script setup>

  import AutoInput from "./AutoInput.vue"

  import { inputs, types } from './config.js'
  import { computed, getCurrentInstance, inject, toRefs } from 'vue'

  import { useI18n } from 'vue-i18n'
  const { t, rt } = useI18n()

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

  const uid = 'field_'+getCurrentInstance().uid.toFixed().padStart(6, '0')

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

  import { validateData } from "@live-change/vue3-components"
  const appContext = getCurrentInstance().appContext
  const validationResult = computed(() => {
    const validationResult = validateData(definition.value, modelValue.value, 'validation', appContext,
      props.propName, props.rootValue, true)
    const softValidationResult = validateData(definition.value, modelValue.value, 'softValidation', appContext,
      props.propName, props.rootValue, true)
    return validationResult || softValidationResult || error.value
  })

  function findValidation(name) {
    if(definition.value.softValidation)
      for(const validator of definition.value.softValidation)
        if(validator.name === name) return validator
    if(definition.value.validation)
      for(const validator of definition.value.validation)
        if(validator.name === name) return validator
  }

  const maxLengthValidation = computed(() => findValidation('maxLength')?.params)

  const config = inject('auto-form', {
    inputs: {},
    types: {}
  })
  const inputConfig = computed(() => {
    if(definition.value.input) return config.inputs?.[definition.value.input] ?? inputs[definition.value.input]
    if(definition.value.type) return config.types?.[definition.value.type] ?? types[definition.value.type]
    return {
      ...(config.inputs?.default ?? inputs.default),
      ...definition?.autoForm?.config, // possible to modify config per input
    }
  })

  const label = computed(() => props.i18n + (props.label || definition.value.label || props.name))

  const fieldClass = computed(() => [inputConfig.value?.fieldClass, definition.value?.fieldClass, props.class, {
    'p-invalid': !!error.value
  }])
  const fieldStyle = computed(() => [inputConfig.value?.fieldStyle, definition.value?.fieldStyle, props.style])

  const configAttributes = computed(() => {
    const attributes = inputConfig.value?.fieldAttributes
    if(!attributes) return attributes
    if(typeof attributes == 'function') return attributes(definition.value)
    return attributes
  })

  const attributes = computed(() => ({
    ...(configAttributes.value),
    ...(props.attributes),
    label: props.label,
    modelValue: props.modelValue,
    definition: props.definition,
    class: fieldClass.value,
    style: fieldStyle.value,
    inputClass: [props.inputClass, { 'p-invalid': !!validationResult.value }],
    inputStyle: props.inputStyle,
    rootValue: props.rootValue,
    propName: props.propName,
  }))

  const fieldComponent = computed(() => inputConfig.value?.fieldComponent)


</script>

<style scoped>

</style>
