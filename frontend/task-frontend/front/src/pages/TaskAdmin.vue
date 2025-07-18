<template>
  <div class="w-full">
    <div class="bg-surface-0 dark:bg-surface-900 p-3 shadow mb-1">
      <h2>Tasks</h2>
<!--       <pre>tasksNames = {{ tasksNames }}</pre>
      <pre>taskStates = {{ taskStates }}</pre> -->
      <div class="flex flex-wrap gap-3 mb-3">
        <div class="flex-1">
          <label for="task-name" class="block mb-2">Task Name</label>
          <Select id="task-name" v-model="name" :options="['any', ...tasksNames]" 
                  placeholder="Select Task Name" class="w-full"  />
        </div>
        <div class="flex-1">
          <label for="task-state" class="block mb-2">Task State</label>
          <Select id="task-state" v-model="state" :options="['any', ...taskStates.map(s => ({label: s, value: s}))]"
                  placeholder="Select Task State" class="w-full" />
        </div>
      </div>
    </div>
    
    <!-- <pre>tasksPathConfig = {{ tasksPathConfig }}</pre> -->

    <range-viewer :pathFunction="tasksPathFunction" :key="JSON.stringify(tasksPathConfig)"
                  :canLoadTop="false" :canDropBottom="false"
                  loadBottomSensorSize="3000px" dropBottomSensorSize="12000px">
      <template #empty>
        <div class="bg-surface-0 p-3 shadow text-center text-gray-500 text-lg">
          No tasks found...
        </div>
      </template>

      <template #default="{ item: task }">     
        <TaskAdminCard :task="task" :tasks="task.subTasks" class="mt-1"  />
      </template>
    </range-viewer>
    
  </div>

</template>

<script setup>

  import TaskAdminCard from '../components/TaskAdminCard.vue'

  import Select from 'primevue/select'

  import { ref, computed } from 'vue'
  import { RangeViewer } from "@live-change/vue3-components"

  import { inject } from 'vue'
  const workingZone = inject('workingZone')

  import { usePath, live, useClient, useActions, reverseRange, useApi } from '@live-change/vue3-ssr'
  const path = usePath()
  const client = useClient()
  const actions = useActions()
  const api = useApi()

  const taskDefinition = computed(() => api.getServiceDefinition('task').models.Task)
  const taskStates = computed(() => taskDefinition.value?.properties?.state?.enum)


  const state = ref('any')
  const name = ref('any')

  const tasksPathConfig = computed(() => {
    return {
      name: name.value === 'any' ? undefined : name.value,
      state: state.value === 'any' ? undefined : state.value
    }
  })

  const tasksPathFunction = computed(() => (range) => 
    path.task.independentTasks({ ...tasksPathConfig.value, ...reverseRange(range) })
      .with(task => path.task.tasksByRoot({
         rootType: 'task_Task',
         root: task.id//{ or: [task.to, task.id]} 
        }).bind('subTasks'))
     
  )

  const tasksNamesPath = path.task.taskNames({})

  console.log("TASKS NAMES PATH", tasksNamesPath)

  const [tasksNamesData] = await Promise.all([
    live(tasksNamesPath)
  ])
  const tasksNames = computed(() => tasksNamesData.value.map(task => task.id))

  console.log("TASKS NAMES", tasksNames)

</script>