<template>
  <div>
    <command-form service="url" action="takeUrl" v-slot="{ data }" :parameters="{ target, targetType, redirect }"
                  :initialValues="initialValues" @done="handleTaken" keepOnDone>

      <div class="p-field mb-4">
        <label for="path" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
          Path
        </label>
        <InputText id="path" type="text" class="w-full"
                   aria-describedby="path-help" :invalid="!!data.pathError"
                   placeholder="enter/absolute/path"
                   v-model="data.path" />
        <Message v-if="data.pathError" severity="error" variant="simple" size="small">
          {{ t(`errors.${data.pathError}`) }}
        </Message>
      </div>
      <div class="p-field mb-4">
        <label for="domain" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
          Domain (optional)
        </label>
        <InputText id="domain" type="text" class="w-full"
                   aria-describedby="domain-help" :invalid="!!data.domainError"
                   placeholder="any"
                   v-model="data.domain" />
        <Message v-if="data.domainError" severity="error" variant="simple" size="small">
          {{ t(`errors.${data.domainError}`) }}
        </Message>
      </div>

      <div class="flex flex-row flex-wrap">
        <Button label="Take Url" icon="pi pi-save" class="mr-2" type="submit" />
        <Button label="Generate Url" icon="pi pi-plus" type="button" @click="() => showGenerateDialog(data)"/>
      </div>

    </command-form>

    <Dialog :visible="generateDialogVisible" @update:visible="v => generateDialogVisible = v"
            :modal="true" class="w-full sm:w-9/12 md:w-8/12 lg:w-6/12">
      <template #header>
        <h3>Generate url</h3>
      </template>
      <GenerateUrlForm :redirect="redirect" :targetType="targetType" :target="target" @taken="handleTaken" />
    </Dialog>
  </div>
</template>

<script setup>

  import Button from "primevue/button"
  import InputText from "primevue/inputtext"
  import Dialog from "primevue/dialog"
  import Message from "primevue/message"

  import GenerateUrlForm from "./GenerateUrlForm.vue"

  const { initialValues, target, targetType, redirect } = defineProps({
    initialValues: {
      type: Object,
      default: () => ({})
    },
    target: {
      type: String,
      required: true
    },
    targetType: {
      type: String,
      required: true
    },
    redirect: {
      type: Boolean,
      default: false
    }
  })

  const emit = defineEmits(['taken'])
  function handleTaken() {
    emit('taken')
  }

  const generateDialogVisible = ref(false)
  function showGenerateDialog(data) {
    generateDialogVisible.value = true
  }

  import { ref, onMounted } from 'vue'

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

</script>

<style scoped>

</style>
