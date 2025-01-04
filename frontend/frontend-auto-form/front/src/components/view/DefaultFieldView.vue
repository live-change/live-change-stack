<template>
  <div class="field" :class="fieldClass" :style="fieldStyle">
    <slot name="label" v-bind="{ validationResult, uid }">
      <label :for="uid">{{ t( label ) }}</label>
    </slot>
    <slot v-bind="{ validationResult, uid }">
      <AutoView :value="value" :definition="definition"
                :class="viewClass" :style="viewStyle"
                :attributes="attributes"
                :propName="propName"
                :rootValue="rootValue"
                :id="uid"
                :i18n="i18n" />
    </slot>
  </div>
</template>

<script setup>

  import AutoView from "./AutoView.vue"

  import { inputs, types } from '../../config.js'
  import { computed, getCurrentInstance, inject, toRefs, onMounted, ref, useId } from 'vue'

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { useI18n } from 'vue-i18n'
  const { t, rt } = useI18n()

  const props = defineProps({
    value: {},
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
    viewClass: {},
    viewStyle: {},
    attributes: {
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
    },
  })

  const instanceUid = getCurrentInstance().uid
  const uid = useId()

  const emit = defineEmits(['update:modelValue'])

  const { error, definition, modelValue } = toRefs(props)

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

  const label = computed(() => props.i18n + (props.label || definition.value.label || props.name))

  const viewClass = computed(() => [definition.value?.view?.class, props.viewClass])
  const viewStyle = computed(() => [definition.value?.view?.style, props.viewStyle])
  const fieldClass = computed(() => [definition.value?.view?.class, props.class])
  const fieldStyle = computed(() => [definition.value?.view?.style, props.style])

</script>

<style scoped>

</style>
