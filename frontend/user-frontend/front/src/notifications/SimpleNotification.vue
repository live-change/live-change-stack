<template>
  <li :class="['px-3 py-2 flex align-items-start justify-content-between flex-column',
               notification.readState === 'new' ? 'surface-0 hover:surface-100' : 'surface-100 hover:surface-200'] ">
      <slot></slot>
    <span class="block text-500 font-medium mt-2">
      {{ DateTime.fromISO(notification.time).toRelative({ base: DateTime.fromMillis(now) })  }}
    </span>
  </li>
</template>

<script setup>

  const props = defineProps({
    notification: {
      type: Object,
      required: true
    },
    image: {
      type: String
    }
  })

  import { useTimestamp, toRefs } from '@vueuse/core'

  const { notification, image } = toRefs(props)

  const now = useTimestamp({ interval: 1000 })
  import { DateTime } from 'luxon'

</script>

<style scoped>

</style>