<template>
  <component v-if="inputConfig && visible" :is="inputConfig.component" v-bind="attributes"
             @update:modelValue="updateValue" :class="inputClass" :style="inputStyle" />
  <div v-else-if="visible" class="font-bold text-red-600">
    No input found for definition:
    <pre style="white-space: pre-wrap; word-wrap: break-word;"
      >{{propName}}: {{ JSON.stringify(definition, null, "  ") }}</pre>
  </div>
</template>

<script setup>
  import { computed, inject, toRefs } from 'vue'

  const props = defineProps({
    modelValue: {
    },
    definition: {
      type: Object
    },
    class: {},
    style: {},
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

  const emit = defineEmits(['update:modelValue'])

  const { definition, modelValue, propName } = toRefs(props)

  import { injectInputConfigByDefinition } from './inputConfigInjection.js'
  const inputConfig = computed(() => injectInputConfigByDefinition(definition.value))

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
    if(definitionIf.value) {
      //console.log("DIF", propName.value, definitionIf.value, 'IN', props.rootValue)
      return definitionIf.value({
        source: definition.value,
        props: props.rootValue,
        propName: props.propName
      })
    }
    return true
  })

  import { useI18n } from 'vue-i18n'
  const { rt, t, d, n, te } = useI18n()

  const configAttributes = computed(() => {
    const attributes = inputConfig.value?.attributes
    if(!attributes) return attributes
    if(typeof attributes == 'function') {
      const fieldName = props.propName.split('.').pop()
      //console.log("PROPS", JSON.stringify(props))
      //console.log("PROPNAME", propName.value)
      return attributes({
        config: inputConfig.value,
        definition: definition.value,
        i18n: props.i18n + fieldName,
        propName: props.propName,
        fieldName,
        rootValue: props.rootValue,
        t, d, n, rt, te
      })
    }
    return attributes
  })

  const attributes = computed(() => ({
    ...(configAttributes.value),
    ...(props.attributes),
    ...(definition.value.inputAttributes),
    modelValue: modelValue.value,
    definition: definition.value,
    rootValue: props.rootValue,
    propName: props.propName,
    i18n: props.i18n
  }))

  const inputClass = computed(() => [inputConfig.value?.inputClass, definition.value?.inputClass, props.class])
  const inputStyle = computed(() => [inputConfig.value?.inputStyle, definition.value?.inputStyle, props.style])

  function updateValue(value) {
    emit('update:modelValue', value)
  }

</script>

<style scoped>

</style>
