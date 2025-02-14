<template>
  <div class="field" :class="fieldClass" :style="fieldStyle">
    <slot name="label"
          v-bind="{ uid, value, definition, viewClass, viewStyle, attributes, propName, rootValue, i18n }">
      <label :for="uid" class="font-medium text-lg">{{ t( label ) }}</label>
    </slot>
    <slot v-bind="{ uid, value, definition, viewClass, viewStyle, attributes, propName, rootValue, i18n }">
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

  const { error, definition, value } = toRefs(props)

  const label = computed(() => props.i18n + (props.label || definition.value.label || props.name))

  const viewClass = computed(() => [definition.value?.view?.class, props.viewClass, 'ml-1'])
  const viewStyle = computed(() => [definition.value?.view?.style, props.viewStyle])
  const fieldClass = computed(() => [definition.value?.view?.class, props.class])
  const fieldStyle = computed(() => [definition.value?.view?.style, props.style])

</script>

<style scoped>

</style>
