<template>
  <component v-if="viewComponent && visible" :is="viewComponent" v-bind="attributes" :i18n="i18n" />
</template>

<script setup>
  import { injectComponent } from '@live-change/vue3-components'

  import { computed, inject, getCurrentInstance, toRefs, defineAsyncComponent } from 'vue'

  const props = defineProps({
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

  const { value, definition, propName, rootValue, visibleProperties } = toRefs(props)

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

  const viewFilter = computed(() => {
    const filter = definition?.view?.componentFilter
    if(filter) {
      if(filter.function) {
        return eval(`(${filter.function})`)
      } else {
        throw new Error('Unknown filter type' + JSON.stringify(filter))
      }
    }
    return undefined
  })

  const viewComponent = computed(() => {
    const type = definition.value.type ?? 'Object'
    const defaultComponent = (type === 'Object')
      ? defineAsyncComponent(() => import('./ObjectView.vue'))
      : defineAsyncComponent(() => import('./JsonView.vue'))
    return injectComponent(definition.value?.view?.componentRequest ?? {
      ...(definition.value?.view?.componentRequestProperties),
      name: 'AutoView',
      type,
      view: definition?.view?.name ?? definition?.view,
      filter: viewFilter.value
    }, defaultComponent)
  })

  const viewClass = computed(() => [definition.value?.view?.class, props.class])
  const viewStyle = computed(() => [definition.value?.view?.style, props.style])

  const attributes = computed(() => ({
    visibleProperties: visibleProperties.value,
    i18n: i18n.value,
    ...(definition.value?.view?.attributes),
    ...(props.attributes),
    value: value.value,
    definition: definition.value,
    class: viewClass.value,
    style: viewStyle.value,
    rootValue: rootValue.value,
    propName: propName.value,
  }))

</script>

<style scoped>

</style>
