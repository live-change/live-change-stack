<template>
  <a target="_blank" :href="href" @click="handleClick">
    <slot />
  </a>
</template>

<script setup>

  import { computed, defineProps, defineEmits, toRefs, ref } from 'vue'

  const props = defineProps({
    href: {
      type: String,
      required: true
    },
    analytics: {
      type: Object
    }
  })

  const { href, analytics: analyticsEvent } = toRefs(props)

  import { analytics } from "@live-change/vue3-components"

  function handleClick() {
    if(analyticsEvent.value) {
      analytics.emit(analyticsEvent.value.event ?? 'externalLink', {
        ...analyticsEvent.value,
        event: undefined,
        href: href.value
      })
    } else {
      analytics.emit('externalLink', { href: href.value })
    }
  }

</script>

<style scoped>

</style>