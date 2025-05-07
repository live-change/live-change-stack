<template>
  <component v-if="fieldComponent && visible" :is="fieldComponent" v-bind="attributes"
             @update:modelValue="value => emit('update:modelValue', value)" :i18n="i18n" />
  <div v-else-if="visible" class="field" :class="fieldClass" :style="fieldStyle">
    <slot name="label" v-bind="{ validationResult, uid }">
      <label :for="uid">{{ t( label ) }}</label>
    </slot>
    <slot v-bind="{ validationResult, uid }">
      <auto-input :modelValue="modelValue" :definition="definition"
                  :class="props.inputClass" :style="props.inputStyle"
                  :attributes="props.inputAttributes"
                  :propName="props.propName"
                  :rootValue="props.rootValue" :errors="props.errors"
                  @update:modelValue="value => emit('update:modelValue', value)"
                  :id="uid"
                  :i18n="i18n" />
    </slot>
    <div>
      <slot name="error"  v-bind="{ validationResult, uid }" >
        <Message v-if="validationResult && !minLengthErrorVisible" severity="error" variant="simple" size="small" 
                 class="mt-1">
          {{ (typeof validationResult === 'object')
               ? t( 'errors.' + validationResult.error, validationResult.validator )
               : t( 'errors.' + validationResult ) }}
        </Message>
      </slot>
      <Message v-if="maxLengthValidation || minLengthValidation" :severity="minMaxError ? 'error' : 'secondary'"
               variant="simple" size="small" 
               class="mt-1" style="float: right">
        {{
          (minLengthErrorVisible)
            ? t( 'info.minLength', { minLength: minLengthValidation.length, length: props.modelValue?.length ?? 0 })
            : t( 'info.maxLength', { maxLength: maxLengthValidation.length, length: props.modelValue?.length ?? 0 })
        }}
      </Message>
    </div>
  </div>
</template>

<script setup>

  import Message from "primevue/message"

  import AutoInput from "./AutoInput.vue"

  import { computed, getCurrentInstance, inject, toRefs, onMounted, ref, useId } from 'vue'

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

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
    },
    ignoreFieldComponent: {
      type: Boolean,
      default: false
    }
  })

  const uid = useId()

  const emit = defineEmits(['update:modelValue'])

  const { error, definition, modelValue, errors } = toRefs(props)

  const definitionIf = computed(() => {
    if(definition.value?.if) {
      if(definition.value?.if.function) {        
        return eval(`(${definition.value.if.function})`)
      } else {
        throw new Error('Unknown if type' + JSON.stringify(definition.value.if))
      }
    }
    return false
  })

  const visible = computed(() => {
    if(!definition.value) return false
    if(definition.value.type === 'type' && props.propName.endsWith('Type') && !definition.value.showType) {   
      return false
    }
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
    return errors.value?.[props.propName] || error.value
  })

  function findValidation(name) {
    if(definition.value.softValidation)
      for(const validator of definition.value.softValidation)
        if(validator.name === name) return validator
    if(definition.value.validation)
      for(const validator of definition.value.validation)
        if(validator.name === name) return validator
  }

  const maxLengthValidation = computed(() => findValidation('maxLength'))
  const minLengthValidation = computed(() => findValidation('minLength'))

  const minMaxError = computed(() =>
    (maxLengthValidation.value && props.modelValue?.length
      && props.modelValue?.length > maxLengthValidation.value.length)
    || (minLengthValidation.value && props.modelValue?.length
      && props.modelValue?.length < minLengthValidation.value.length)
  )

  const minLengthErrorVisible = computed(() =>
    minLengthValidation.value && props.modelValue?.length
    && props.modelValue?.length < minLengthValidation.value.length
  )

  import { injectInputConfigByDefinition } from './inputConfigInjection.js'
  const inputConfig = computed(() => injectInputConfigByDefinition(definition.value))

  const label = computed(() => props.i18n + (props.label || definition.value.label || props.name))

  const fieldClass = computed(() => [inputConfig.value?.fieldClass, definition.value?.fieldClass, props.class, {
    'p-invalid': !!error.value
  }, 'flex flex-col'])
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
    errors: props.errors,
    propName: props.propName,
  }))

  const fieldComponent = computed(() => props.ignoreFieldComponent ? null : inputConfig.value?.fieldComponent)


</script>

<style scoped>

</style>
