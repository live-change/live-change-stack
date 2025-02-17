<template>
  <div :class="['px-4 py-2 flex items-start justify-between flex-col',
               notification.readState === 'new' ? 'bg-surface-0 dark:bg-surface-900 hover:bg-surface-100 dark:hover:bg-surface-700' : 'bg-surface-100 dark:bg-surface-700 hover:bg-surface-200 dark:hover:bg-surface-600'] ">
      <slot></slot>
    <span class="block text-surface-500 dark:text-surface-300 font-medium mt-2">
      {{ DateTime.fromISO(notification.time).toRelative({ base: DateTime.fromMillis(now) })  }}
    </span>
  </div>
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