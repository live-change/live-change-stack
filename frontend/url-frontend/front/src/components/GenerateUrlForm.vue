<template>
  <div>
    <command-form service="url" action="generateUrl" v-slot="{ data }" :parameters="{ target, targetType, redirect }"
                  :initialValues="{ maxLength: 125, charset: 'all', ...initialValues }"
                  @done="handleTaken" keepOnDone>

      <div class="p-field mb-4">
        <label for="title" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
          Title (optional)
        </label>
        <InputText id="title" type="text" class="w-full"
                   aria-describedby="title-help" :invalid="!!data.titleError"
                   placeholder="enter title"
                   v-model="data.title" />
        <Message v-if="data.titleError" severity="error" variant="simple" size="small">
          {{ t(`errors.${data.titleError}`) }}
        </Message>
      </div>
      <div class="p-field mb-4">
        <label for="path" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
          Path (optional)
        </label>
        <InputText id="path" type="text" class="w-full"
                  aria-describedby="path-help" :invalid="!!data.pathError"
                   placeholder="or enter path"
                   v-model="data.path" />
        <Message v-if="data.pathError" severity="error" variant="simple" size="small">
          {{ t(`errors.${data.pathError}`) }}
        </Message>
      </div>
      <div class="p-field mb-4">
        <label for="maxLength" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
          Max length
        </label>
        <InputNumber inputId="maxLength" v-model="data.maxLength" showButtons buttonLayout="horizontal"
                     class="w-full"
                     :step="1" decrementButtonClass="p-button-danger" incrementButtonClass="p-button-success"
                     incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                     mode="decimal" :useGrouping="false" :invalid="!!data.maxLengthError" />
        <Message v-if="data.maxLengthError" severity="error" variant="simple" size="small">
          {{ t(`errors.${data.maxLengthError}`) }}
        </Message>
      </div>

      <div class="p-field mb-4">
        <label for="charset" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
          Charset
        </label>
        <Dropdown id="charset" type="text" class="w-full"
                   aria-describedby="charset-help" :invalid="!!data.charsetError"
                   placeholder="select charset"
                   v-model="data.charset" :options="charsets" optionLabel="label" optionValue="value" />
        <Message v-if="data.charsetError" severity="error" variant="simple" size="small">
          {{ t(`errors.${data.charsetError}`) }}
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

      <div class="p-field mb-4">
        <label for="prefix" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
          Prefix (optional)
        </label>
        <InputText id="prefix" type="text" class="w-full"
                   aria-describedby="prefix-help" :invalid="!!data.prefixError"
                   placeholder="or enter prefix"
                   v-model="data.prefix" />
        <Message v-if="data.prefixError" severity="error" variant="simple" size="small">
          {{ t(`errors.${data.prefixError}`) }}
        </Message>
      </div>

      <div class="p-field mb-4">
        <label for="suffix" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
          Suffix (optional)
        </label>
        <InputText id="suffix" type="text" class="w-full"
                   aria-describedby="suffix-help" :invalid="!!data.suffixError"
                   placeholder="enter suffix"
                   v-model="data.suffix" />
        <Message v-if="data.suffixError" severity="error" variant="simple" size="small">
          {{ t(`errors.${data.suffixError}`) }}
        </Message>
      </div>

      <div class="flex flex-row flex-wrap">
        <Button label="Generate Url" icon="pi pi-save" class="mr-2" type="submit" />
      </div>

    </command-form>
  </div>
</template>

<script setup>

  import Button from "primevue/button"
  import InputText from "primevue/inputtext"
  import InputNumber from "primevue/inputnumber"
  import Dropdown from "primevue/dropdown"
  import Message from "primevue/message"

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

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  const charsets = [
    { label: 'All', value: 'all' },
    { label: 'Digits', value: 'digits' },
    { label: 'Letters', value: 'letters' },
    { label: 'Small letters', value: 'smallLetters' },
    { label: 'Big letters', value: 'bigLetters' },
    { label: 'Small letters and numbers', value: 'small' },
    { label: 'Big letters and numbers', value: 'big' },
  ]

  const generateDialogVisible = ref(false)
  function showGenerateDialog(data) {
    generateDialogVisible.value = true
  }

  import { ref, onMounted } from 'vue'

  const isMounted = ref(false)
  onMounted(() => isMounted.value = true)

</script>

<style scoped>

</style>
