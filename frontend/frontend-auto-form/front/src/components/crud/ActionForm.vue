<template>
  <div>
    <div class="text-xl mb-2">
      Service <strong>{{ service }}</strong>
    </div>
    <div class="text-2xl mb-6">
      Action <strong>{{ action }}</strong>
    </div>

    <pre>actionDefinition = {{ actionDefinition }}</pre>

    <form @submit="handleSubmit">
      <div class="flex flex-col gap-4">
        <auto-editor
          :definition="actionDefinition"
          v-model="formData"
          :rootValue="formData"
          :i18n="i18n"
        />

        <div class="flex justify-end mt-4">
          <Button 
            type="submit"
            :label="submitting ? 'Executing...' : 'Execute'" 
            :icon="submitting ? 'pi pi-spin pi-spinner' : 'pi pi-play'"
            :disabled="submitting"
            severity="success"
          />
        </div>
      </div>
    </form>
  </div>
</template>

<script setup>
  import { ref, computed, onMounted, defineProps, defineEmits, toRefs } from 'vue'
  import Button from 'primevue/button'
  import AutoEditor from '../form/AutoEditor.vue'
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
    }
  })
  const { service, action, i18n } = toRefs(props)

  const emit = defineEmits(['done'])

  import { useApi } from '@live-change/vue3-ssr'
  const api = useApi()

  const actionDefinition = computed(() => {
    const svc = api.metadata.api.value.services.find(s => s.name === service.value)
    return svc?.actions?.[action.value]
  })

  const formData = ref({})
  const submitting = ref(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting.value) return

    submitting.value = true
    try {
      const actionMethod = api.actions[service.value][action.value]
      if (!actionMethod) {
        throw new Error(`Action ${action.value} not found in service ${service.value}`)
      }

      const result = await actionMethod(formData.value)
      emit('done', result)
      toast.add({ severity: 'success', summary: 'Action executed successfully', life: 1500 })
    } catch (error) {
      console.error('Action execution error:', error)
      toast.add({ 
        severity: 'error', 
        summary: 'Error executing action', 
        detail: error.message || 'Unknown error', 
        life: 5000 
      })
    } finally {
      submitting.value = false
    }
  }
</script>

<style scoped>
</style> 