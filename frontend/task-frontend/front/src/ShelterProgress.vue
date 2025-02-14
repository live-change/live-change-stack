<template>
  <div class="flex flex-row w-full justify-content-evenly">
    <div class="surface-card shadow-1 border-round px-3 py-1 w-full">
      <h2>Tasks</h2>
      <Task v-for="task in rootTasks" :key="task.id" :task="task" :tasks="tasks" :task-types="taskTypes" />
<!--      <pre>{{ rootTasks }}</pre>-->
    </div>
  </div>
<!--  <pre>{{ tasks }}</pre>-->
</template>

<script setup>
  import { ref, computed, defineProps } from 'vue'
  import { usePath, live } from '@live-change/vue3-ssr'
  import BuildShelterResult from './components/BuildShelterResult.vue'
  import MakePlanksResult from './components/MakePlanksResult.vue'
  import Task from './components/Task.vue'

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
    rootType: 'userAction',
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
