<template>
  <div v-if="actionFormData">
    <div class="text-xl mb-2">
      Service <strong>{{ service }}</strong>
    </div>
    <div class="text-2xl mb-6">
      Action <strong>{{ action }}</strong>
    </div>

    <div v-if="task">
      <Task :task="rootTask" :tasks="tasksData" />
      <pre>rootTask = {{ rootTask }}</pre>
    </div>
    <div v-else-if="resultWithType">      
      <div class="text-xl mb-2">
        Result:
      </div>
      <div class="text-sm text-gray-500">
        <pre>{{ resultWithType }}</pre>
      </div>
    </div>
    <form v-else @submit="handleSubmit" @reset="handleReset">
      <div class="flex flex-col gap-4">

        <div v-for="[name, parameter] in Object.entries(actionFormData.parameters)"
             class="flex flex-col mb-3">                    
          <template v-if="!name.endsWith('Type')">
            <div class="min-w-[8rem] font-medium">{{ actionFormData.action.definition.properties[name].label ?? name }}</div>    
            <div>
              <InjectedObjectIndentification v-if="actionFormData.parameters[name+'Type']
                        ?? actionFormData.action.definition.properties[name]?.type 
                        ?? actionFormData.action.definition.properties[name]?.type.split('_').length > 1"
                :type="actionFormData.parameters[name+'Type']
                        ?? actionFormData.action.definition.properties[name]?.type"
                :object="actionFormData.parameters[name]"
              />
              <pre v-else>parameter</pre>
            </div>
          </template>
        </div>

        <auto-editor
          :definition="actionFormData.action.definition"
          :editableProperties="actionFormData.editableProperties"
          v-model="actionFormData.value"
          :rootValue="actionFormData.value"
          :errors="actionFormData.propertiesErrors"
          :i18n="i18n"
        />

        <ActionButtons
          :actionFormData="actionFormData"
          :resetButton="true"
          :i18n="i18n"
        />

       <!--  <div class="flex justify-end mt-4 gap-2">
          <Button
            type="reset"
            :label="'Reset'"
            :icon="'pi pi-times'"
            :disabled="actionFormData.submitting"
            severity="danger"
          />          
          <Button 
            type="submit"
            :label="actionFormData.submitting === true ? 'Executing...' : 'Execute'" 
            :icon="actionFormData.submitting === true ? 'pi pi-spin pi-spinner' : 'pi pi-play'"
            :disabled="actionFormData.submitting"
            severity="success"
          />
        </div> -->
      </div>
    </form>

<!--     <pre>propertiesErrors = {{ actionFormData.propertiesErrors }}</pre>
    <pre>definition = {{ actionFormData.action.definition }}</pre> -->
  </div>
</template>

<script setup>

  import { ref, computed, onMounted, defineProps, defineEmits, toRefs, watch } from 'vue'
  import Button from 'primevue/button'
  import AutoEditor from '../form/AutoEditor.vue'
  import ActionButtons from './ActionButtons.vue'
  import { Task } from '@live-change/task-frontend'

  import InjectedObjectIndentification from './InjectedObjectIndentification.vue'

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()

  const props = defineProps({
    service: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      required: true,
    },
    i18n: {
      type: String,
      default: ''
    },
    initialValue: {
      type: Object,
      default: () => ({})
    },
    parameters: {
      type: Object,
      default: () => ({})
    }
  })

  const { service, action, i18n, initialValue, parameters } = toRefs(props)

  const emit = defineEmits(['done', 'error'])

  import { useApi, usePath, live } from '@live-change/vue3-ssr'
  const api = useApi()
  const path = usePath()

  import { useRouter } from 'vue-router'
  const router = useRouter()

  import { actionData } from '@live-change/frontend-auto-form'

  const resultWithType = ref(null)  
  const task = ref(null)

  const tasksPath = computed(() => task.value && path.task.tasksByRoot({
    root: task.value,
    rootType: 'task_Task'
  }))

  const actionFormDataPromise = actionData({
    service: service.value,
    action: action.value,
    i18n: i18n.value,
    initialValue: initialValue.value,
    parameters: parameters.value,
    onDone: handleDone
  })

  const [
    actionFormData,
    tasksData
  ] = await Promise.all([
    actionFormDataPromise,
    live(tasksPath)
  ])

  const returnType = computed(() => {
    const returnType = actionFormData.action.definition.returns
    return returnType?.type
  })

  function handleSubmit(ev) {
    ev.preventDefault()
    actionFormData.submit()
  }

  function handleReset(ev) {
    ev.preventDefault()
    actionFormData.reset()
  }

  function handleDone(result) {
    console.log('handleDone', result)
    handleResult(result, returnType.value)
  }

  function handleResult(result, type) {
    console.log('handleResult', result, type)
    task.value = null
    resultWithType.value = null
    if(type === 'task_Task') {
      task.value = result
    } else if(type && type.split('_').length === 1) {
      if(typeof result === 'object') {
        resultWithType.value = {
          type: type,
          result: result
        }
      } else { /// redirect to object view
        router.push({
          name: 'auto-form:view',
          params: {
            serviceName: service.value,
            modelName: type.split('_')[0],
            identifiers: [result]
          }
        })
      }
    } else {
      resultWithType.value = {
        type: type,
        result: result
      }
    }
  }

  const rootTask = computed(() => {
    if(task.value && tasksData.value) {
      return tasksData.value.find(t => t.id === task.value)
    }
  })

  const rootTaskDone = computed(() => {
    if(rootTask.value) {
      return rootTask.value.state === 'done'
    }
    return false
  })

/*   watch(rootTaskDone, (done) => {
    if(done) {
      const taskType = rootTask.value.type
      const taskService = rootTask.value.service      
      const taskDefinition = api.serviceDefinition(taskService).tasks[taskType]
      handleResult(rootTask.value.result, taskDefinition.returns.type)
    }
  }, { immediate: true }) */


</script>

<style scoped>
</style> 