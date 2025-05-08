<template>
  <div v-if="actionFormData">
    <div class="text-xl mb-2">
      Service <strong>{{ service }}</strong>
    </div>
    <div class="text-2xl mb-6">
      Action <strong>{{ action }}</strong>
    </div>

    <form @submit="handleSubmit" @reset="handleReset">
      <div class="flex flex-col gap-4">
        <auto-editor
          :definition="actionFormData.action.definition"
          v-model="actionFormData.value"
          :rootValue="actionFormData.value"
          :errors="actionFormData.propertiesErrors"
          :i18n="i18n"
        />

        <div class="flex justify-end mt-4 gap-2">
          <Button
            type="reset"
            :label="'Reset'"
            :icon="'pi pi-times'"
            :disabled="actionFormData.submitting"
            severity="danger"
          />
          <Button 
            type="submit"
            :label="actionFormData.submitting ? 'Executing...' : 'Execute'" 
            :icon="actionFormData.submitting ? 'pi pi-spin pi-spinner' : 'pi pi-play'"
            :disabled="actionFormData.submitting"
            severity="success"
          />
        </div>
      </div>
    </form>

<!--     <pre>propertiesErrors = {{ actionFormData.propertiesErrors }}</pre>
    <pre>definition = {{ actionFormData.action.definition }}</pre> -->
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

  const emit = defineEmits(['done', 'error'])

  import { useApi } from '@live-change/vue3-ssr'
  const api = useApi()

  import { actionData } from '@live-change/frontend-auto-form'

  const actionFormData = await actionData({
    service: service.value,
    action: action.value,
    i18n: i18n.value
  })

  const handleSubmit = (ev) => {
    ev.preventDefault()
    actionFormData.submit()
  }

  const handleReset = (ev) => {
    ev.preventDefault()
    actionFormData.reset()
  }

</script>

<style scoped>
</style> 