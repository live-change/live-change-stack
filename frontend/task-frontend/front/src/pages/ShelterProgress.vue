<template>
  <div class="flex flex-row w-full justify-evenly">
    <div class="bg-surface-0 dark:bg-surface-900 shadow-sm rounded-border px-4 py-1 w-full">
      <h2>{{ t('tasks.tasks') }}</h2>
      <Task v-for="task in rootTasks" :key="task.id" :task="task" :tasks="tasks" :task-types="taskTypes" />
<!--      <pre>{{ rootTasks }}</pre>-->
    </div>
  </div>
<!--  <pre>{{ tasks }}</pre>-->
</template>

<script setup>
  import { ref, computed, defineProps } from 'vue'
  import { usePath, live } from '@live-change/vue3-ssr'
  import BuildShelterResult from '../components/BuildShelterResult.vue'
  import MakePlanksResult from '../components/MakePlanksResult.vue'
  import Task from '../components/Task.vue'

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const props = defineProps({
    action: {
      type: Object,
      required: true
    }
  })

  const taskTypes = {
    buildShelter: {
      label(task) {
        return `Building shelter`
          +` ${task.properties.size.width}x${task.properties.size.height}x${task.properties.size.length}`
          +` at ${task.properties.place}`
          +` with ${task.properties.woodType} wood`
      },
      resultComponent: BuildShelterResult
    },
    makePlanks: {
      label(task) {
        return `Making planks from ${task.properties.woodType} wood`
      },
      resultComponent: MakePlanksResult
    },
    getWood: {
      label(task) {
        return `Getting ${task.properties.woodType} wood`
      }
    },
    cutWood: {
      label(task) {
        return `Cutting ${task.properties.wood.woodType} wood`
      }
    },
    buildWall: {
      label(task) {
        return `Building wall with ${task.properties.wallSize} planks`
      }
    },
    buildRoof: {
      label(task) {
        return `Building roof with ${task.properties.roofSize} planks`
      }
    },
    placePlank: {
      label(task) {
        return `Placing plank`
      }
    }
  }

  const tasksRoot = computed(() => ({
    rootType: 'command',
    root: props.action
  }))

  const path = usePath()

  const tasksPath = computed(
    () => tasksRoot.value ? path.task.tasksByRoot(tasksRoot.value) : null
  )

  const [ tasks ] = await Promise.all([
    live(tasksPath)
  ])

  const rootTasks = computed(() => tasks.value ? tasks.value.filter(t => t.causeType !== 'task_Task') : [])

</script>

<style scoped>

</style>
