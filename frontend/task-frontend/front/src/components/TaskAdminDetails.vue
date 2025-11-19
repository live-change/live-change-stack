<template>
  <div class="mt-2">
    <div v-if="taskData.progress" class="mb-2">
      <ProgressBar :value="Math.floor((100 * taskData.progress.current / taskData.progress.total))" />
      <div class="flex flex-row items-center justify-between">
        <div class="text-sm text-gray-600 dark:text-gray-400">{{ taskData.progress.action }}</div>
        <div class="text-sm text-gray-600 dark:text-gray-400">{{ taskData.progress.current }} / {{ taskData.progress.total }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-2 text-sm">
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>ID:</div>
        <div>{{ taskData.id }}</div>
      </div>
      
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>State:</div>
        <div>{{ taskData.state }}</div>
      </div>
      
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>Created:</div>
        <div>{{ d(taskData.createdAt, 'longWithSeconds') }}</div>
      </div>

      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>Started:</div>
        <div>{{ d(taskData.startedAt, 'longWithSeconds') }}</div>
      </div>

      <div class="grid grid-cols-2 gap-2 text-sm" v-if="taskData.doneAt">
        <div>Duration:</div>
        <div>
          {{ (new Date(taskData.doneAt).getTime() - new Date(taskData.startedAt).getTime()) / 1000 }}s
        </div>
      </div>      

      
      <div class="grid grid-cols-2 gap-2 text-sm" v-if="taskData.doneAt">
        <div v-if="taskData.doneAt">Done:</div>
        <div v-if="taskData.doneAt">{{ d(taskData.doneAt, 'longWithSeconds') }}</div>
      </div>

      <div class="grid grid-cols-2 gap-2 text-sm" v-if="taskData.client">
        <div>Client:</div>
        <div>
          {{ taskData.client }}
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 text-sm" v-if="taskData.cause">
        <div>Cause:</div>
        <div>{{ taskData.causeType }} - {{ taskData.cause }}</div>
      </div>
    </div>

    <div v-if="taskData.properties" class="mt-2">
      <div class="font-semibold">Properties:</div>
      <div class="relative">
        <pre 
          :class="[
            'text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto whitespace-pre',
            !isPropertiesExpanded && 'overflow-y-hidden'
          ]"
        >{{ JSON.stringify(taskData.properties, null, 2).split('\n')
            .slice(0, !isPropertiesExpanded ? 5 : undefined).join('\n') }}</pre>

        <div v-if="!isPropertiesExpanded && hasPropertiesOverflow" class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-100 dark:from-gray-800 to-transparent" />
      </div>
      <div 
          v-if="hasPropertiesOverflow" 
          class="mt-1 flex items-center ml-3"
          @click="expandProperties"
        >
          <span class="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
            {{ isPropertiesExpanded ? 'show less' : 'show more' }}
          </span>
          <i :class="['pi', isPropertiesExpanded ? 'pi-chevron-up' : 'pi-chevron-down', 'text-sm cursor-pointer ml-2']" />
        </div>
    </div>

    <div v-if="taskData.retries?.length" class="mt-2">
      <div class="font-semibold">Retries:</div>
      <TaskRetry 
        v-for="(retry, index) in taskData.retries" 
        :key="index"
        :retry="retry"
        :index="index"
      />
    </div>

    <div v-if="taskData.result" class="mt-2">
      <div class="font-semibold">Result:</div>
      <div class="relative">
        <pre 
          :class="[
            'text-sm bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto whitespace-pre',
            !isResultExpanded && 'overflow-y-hidden'
          ]"
        >{{ JSON.stringify(taskData.result, null, 2).split('\n')
           .slice(0, !isResultExpanded ? 5 : undefined).join('\n') }}</pre>

        <div v-if="!isResultExpanded && hasOverflow" class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-100 dark:from-gray-800 to-transparent" />

      </div>
      <div 
          v-if="hasOverflow" 
          class="mt-1 flex items-center ml-3"
          @click="expandResult"
        >
          <span class="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
            {{ isResultExpanded ? 'show less' : 'show more' }}
          </span>
          <i :class="['pi', isResultExpanded ? 'pi-chevron-up' : 'pi-chevron-down', 'text-sm cursor-pointer ml-2']" />
        </div>
    </div>

    <div class="mt-2">
      <div class="font-semibold">Subtasks:</div>
      <range-viewer :pathFunction="tasksPathFunction" :key="JSON.stringify(tasksPathConfig)"
                  :canLoadTop="false" :canDropBottom="false"
                  loadBottomSensorSize="3000px" dropBottomSensorSize="12000px">
        <template #empty>
          <div class="bg-surface-0 dark:bg-surface-900 p-3 shadow text-center text-gray-500 text-lg">
            No subtasks found...
          </div>
        </template>

        <template #default="{ item: task }">     
          <TaskAdminCard :task="task" class="mt-1"  />
        </template>
      </range-viewer>
    </div>    
    

    <!-- <div v-if="childTasks.length" class="mt-2">
      <div class="font-semibold">Subtasks:</div>
      <div v-for="subtask in childTasks" :key="subtask.id" class="mt-2">
        <TaskAdminCard :task="subtask" :tasks="tasks" :taskTypes="taskTypes" />        
      </div>
    </div> -->
  </div>
</template>

<script setup>
  import { ref, computed } from 'vue'
  import ProgressBar from 'primevue/progressbar'
  import TaskAdminCard from './TaskAdminCard.vue'
  import TaskRetry from './TaskRetry.vue'
  import { RangeViewer } from "@live-change/vue3-components"

  import { useI18n } from 'vue-i18n'
  const { d } = useI18n()

  const props = defineProps({
    task: {
      type: Object,
      required: true
    },
/*     tasks: {
      type: Array,
      default: () => []
    }, */
    taskTypes: {
      type: Object,
      default: () => ({})
    }
  })

  /* const taskId = computed(() => props.task?.to || props.task?.id || props.task) */

  const taskData = computed(() => props.task)//tasks.find(t => t.to === taskId.value || t.id === taskId.value))

/*   const childTasks = computed(() => {
    return props.tasks.filter(t => t.causeType === "task_Task" && t.cause === taskId.value)
  }) */

  const taskId = computed(() => props.task?.to ?? props.task?.id)

  import { usePath, live, useClient, useActions, reverseRange, useApi } from '@live-change/vue3-ssr'
  const path = usePath()
  const client = useClient()
  const actions = useActions()
  const api = useApi()

  const tasksPathConfig = computed(() => ({
    causeType: 'task_Task',
    cause: taskId.value
  }))

  const tasksPathFunction = computed(() => (range) => 
    path.task.tasksByCauseAndStart({ ...tasksPathConfig.value, ...reverseRange(range) })
  )
  
  const isResultExpanded = ref(false)
  const isPropertiesExpanded = ref(false)
  
  const hasOverflow = computed(() => {
    if (!taskData.value?.result) return false
    const jsonString = JSON.stringify(taskData.value.result, null, 2)
    const lineCount = (jsonString.match(/\n/g) || []).length
    return lineCount > 4
  })

  const hasPropertiesOverflow = computed(() => {
    if (!taskData.value?.properties) return false
    const jsonString = JSON.stringify(taskData.value.properties, null, 2)
    const lineCount = (jsonString.match(/\n/g) || []).length
    return lineCount > 4
  })

  const expandResult = () => {
    isResultExpanded.value = !isResultExpanded.value
  }

  const expandProperties = () => {
    isPropertiesExpanded.value = !isPropertiesExpanded.value
  }
</script>
