<template>
  <component v-if="fieldComponent && visible" :is="fieldComponent" v-bind="attributes" :i18n="i18n" />
</template>

<script setup>
  import { injectComponent } from '@live-change/vue3-components'

  import { computed, inject, getCurrentInstance, toRefs } from 'vue'
  import DefaultFieldView from './DefaultFieldView.vue'

  const props = defineProps({
    name: {
      type: String
    },
    label: {
      type: String
    },
    value: {},
    definition: {
      type: Object
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
    visibleProperties: {
      type: Array,
      items: {
        type: String
      }
    },
    class: {},
    style: {},
    attributes: {
      type: Object,
      default: () => ({})
    }
  })

  const { value, definition, propName, rootValue, label, name } = toRefs(props)

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

  const fieldFilter = computed(() => {
    const filter = definition?.view?.fieldComponentFilter
    if(filter) {
      if(filter.function) {
        return eval(`(${filter.function})`)
      } else {
        throw new Error('Unknown filter type' + JSON.stringify(filter))
      }
    }
    return undefined
  })

  const fieldComponent = computed(() => injectComponent(definition.value?.view?.fieldComponentRequest ?? {
    ...(definition.value?.view?.fieldComponentRequestProperties),
    name: 'AutoFieldView',
    type: definition.type ?? 'Object',
    view: definition?.view?.name ?? definition?.view,
    filter: fieldFilter.value
  }, DefaultFieldView))

  const fieldClass = computed(() => [definition.value?.view?.fieldClass, props.class])
  const fieldStyle = computed(() => [definition.value?.view?.fieldStyle, props.style])

  const viewClass = computed(() => [definition.value?.view?.class, props.viewClass])
  const viewStyle = computed(() => [definition.value?.view?.style, props.viewStyle])

  const attributes = computed(() => ({
    i18n: i18n.value,
    name: name.value,
    label: label.value,
    ...(definition.value?.view?.attributes),
    ...(props.attributes),
    value: value.value,
    definition: definition.value,
    class: fieldClass.value,
    style: fieldStyle.value,
    viewClass: viewClass.value,
    viewStyle: viewStyle.value,
    rootValue: rootValue.value,
    propName: propName.value,
  }))

</script>

<style scoped>

</style>
