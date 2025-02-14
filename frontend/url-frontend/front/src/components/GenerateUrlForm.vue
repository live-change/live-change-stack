<template>
  <div>
    <command-form service="url" action="generateUrl" v-slot="{ data }" :parameters="{ target, targetType, redirect }"
                  :initialValues="{ maxLength: 125, charset: 'all', ...initialValues }"
                  @done="handleTaken" keepOnDone>

      <div class="p-field mb-3">
        <label for="title" class="block text-900 font-medium mb-2">
          Title (optional)
        </label>
        <InputText id="title" type="text" class="w-full"
                   aria-describedby="title-help" :class="{ 'p-invalid': data.titleError }"
                   placeholder="enter title"
                   v-model="data.title" />
        <small v-if="data.titleError" id="title-help" class="p-error">{{ t(`errors.${data.titleError}`) }}</small>
      </div>
      <div class="p-field mb-3">
        <label for="path" class="block text-900 font-medium mb-2">
          Path (optional)
        </label>
        <InputText id="path" type="text" class="w-full"
                   aria-describedby="path-help" :class="{ 'p-invalid': data.pathError }"
                   placeholder="or enter path"
                   v-model="data.path" />
        <small v-if="data.pathError" id="path-help" class="p-error">{{ t(`errors.${data.pathError}`) }}</small>
      </div>
      <div class="p-field mb-3">
        <label for="maxLength" class="block text-900 font-medium mb-2">
          Max length
        </label>
        <InputNumber inputId="maxLength" v-model="data.maxLength" showButtons buttonLayout="horizontal"
                     class="w-full"
                     :step="1" decrementButtonClass="p-button-danger" incrementButtonClass="p-button-success"
                     incrementButtonIcon="pi pi-plus" decrementButtonIcon="pi pi-minus"
                     mode="decimal" :useGrouping="false" :class="{ 'p-invalid': data.maxLengthError }" />
        <small v-if="data.maxLengthError" id="maxLength-help" class="p-error">{{ t(`errors.${data.maxLengthError}`) }}</small>
      </div>

      <div class="p-field mb-3">
        <label for="charset" class="block text-900 font-medium mb-2">
          Charset
        </label>
        <Dropdown id="charset" type="text" class="w-full"
                   aria-describedby="charset-help" :class="{ 'p-invalid': data.charsetError }"
                   placeholder="select charset"
                   v-model="data.charset" :options="charsets" optionLabel="label" optionValue="value" />
        <small v-if="data.charsetError" id="charset-help" class="p-error">{{ t(`errors.${data.charsetError}`) }}</small>
      </div>

      <div class="p-field mb-3">
        <label for="domain" class="block text-900 font-medium mb-2">
          Domain (optional)
        </label>
        <InputText id="domain" type="text" class="w-full"
                   aria-describedby="domain-help" :class="{ 'p-invalid': data.domainError }"
                   placeholder="any"
                   v-model="data.domain" />
        <small v-if="data.domainError" id="domain-help" class="p-error">{{ t(`errors.${data.domainError}`) }}</small>
      </div>

      <div class="p-field mb-3">
        <label for="prefix" class="block text-900 font-medium mb-2">
          Prefix (optional)
        </label>
        <InputText id="prefix" type="text" class="w-full"
                   aria-describedby="prefix-help" :class="{ 'p-invalid': data.prefixError }"
                   placeholder="or enter prefix"
                   v-model="data.prefix" />
        <small v-if="data.prefixError" id="prefix-help" class="p-error">{{ t(`errors.${data.prefixError}`) }}</small>
      </div>

      <div class="p-field mb-3">
        <label for="suffix" class="block text-900 font-medium mb-2">
          Suffix (optional)
        </label>
        <InputText id="suffix" type="text" class="w-full"
                   aria-describedby="suffix-help" :class="{ 'p-invalid': data.suffixError }"
                   placeholder="enter suffix"
                   v-model="data.suffix" />
        <small v-if="data.suffixError" id="suffix-help" class="p-error">{{ t(`errors.${data.suffixError}`) }}</small>
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
