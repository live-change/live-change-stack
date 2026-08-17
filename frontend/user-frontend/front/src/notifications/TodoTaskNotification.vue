<template>
  <SimpleNotification :notification="notification">
    <router-link
      v-if="taskLink"
      :to="taskLink"
      class="block no-underline text-inherit hover:opacity-90"
    >
      <div class="font-medium text-primary-600 dark:text-primary-400 hover:underline">
        {{ displayTitle }}
      </div>
      <div v-if="notification.message" class="text-sm mt-1 text-surface-700 dark:text-surface-200">
        {{ notification.message }}
      </div>
      <div
        v-if="notification.blockedType || notification.blocked"
        class="text-xs text-surface-500 mt-1 font-mono"
      >
        {{ notification.blockedType }} {{ notification.blocked }}
      </div>
      <div class="text-sm mt-2 text-primary-600 dark:text-primary-400 hover:underline">
        {{ t(`notifications.types.${i18nType}.openTask`) }}
      </div>
    </router-link>
    <template v-else>
      <div class="font-medium">
        {{ displayTitle }}
      </div>
      <div v-if="notification.message" class="text-sm mt-1">{{ notification.message }}</div>
      <div
        v-if="notification.blockedType || notification.blocked"
        class="text-xs text-surface-500 mt-1 font-mono"
      >
        {{ notification.blockedType }} {{ notification.blocked }}
      </div>
    </template>
  </SimpleNotification>
</template>

<script setup>
  import SimpleNotification from './SimpleNotification.vue'
  import { computed } from 'vue'
  import { toRefs } from '@vueuse/core'
  import { useI18n } from 'vue-i18n'

  const props = defineProps({
    notification: {
      type: Object,
      required: true
    },
    /**
     * i18n key under notifications.types.* (defaults to notification.notificationType)
     */
    typeKey: {
      type: String,
      default: null
    }
  })

  const { notification } = toRefs(props)
  const { t } = useI18n()

  const i18nType = computed(() =>
    props.typeKey
    || notification.value?.notificationType
    || 'todo_TaskAssigned'
  )

  const displayTitle = computed(() =>
    notification.value?.title
    || t(`notifications.types.${i18nType.value}.name`)
  )

  const taskLink = computed(() => {
    const taskId = notification.value?.task != null
      ? String(notification.value.task)
      : ''
    if (!taskId) return null
    const listId = notification.value?.todoList != null
      ? String(notification.value.todoList)
      : ''
    if (listId) {
      return {
        name: 'todoTask',
        params: { listId, taskId }
      }
    }
    // Fallback when older notifications omitted todoList
    return {
      name: 'todoTaskById',
      params: { taskId }
    }
  })
</script>
