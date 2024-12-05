<template>
  <div>
    <div class="mb-4 border-bottom-1" v-for="(value, index) in modelValue">
      <div class="flex flex-row align-items-center justify-content-between">

        <div class="text-2xl">
          {{ te(i18n.slice(0,-1)+':itemTitle')
          ? t(i18n.slice(0,-1)+':itemTitle', { ...value, index: index+1 })
          : `#${index + 1}` }}
        </div>

        <div class="flex flex-row">
          <Button class="mx-1" icon="pi pi-plus" @click="insertItem(index)"
                  style="transform: scale(0.9)"
                  rounded
                  severity="success"
                  size="small"
                  v-ripple
                  aria-label="Insert before" />
          <Button v-if="index > 0"
                  style="transform: scale(0.9)"
                  class="mx-1"
                  icon="pi pi-arrow-up" @click="swapItem(index)"
                  severity="secondary"
                  rounded
                  size="small"
                  aria-label="Move up" />
          <Button v-if="index < modelValue.length - 1"
                  style="transform: scale(0.9)"
                  class="mx-1"
                  icon="pi pi-arrow-down" @click="swapItem(index + 1)"
                  severity="secondary"
                  rounded
                  v-ripple
                  size="small"
                  aria-label="Move down" />
          <Button class="mx-1"
                  style="transform: scale(0.9)"
                  icon="pi pi-trash" @click="removeItem(index)"
                  severity="danger"
                  rounded
                  size="small"
                  v-ripple
                  :aria-label="`Remove  #${ index+1 }`" />
        </div>

      </div>
      <auto-input :modelValue="value" :definition="definition.of || definition.items"
                   @update:modelValue="value => updateItem(index, value)"
                  :rootValue="props.rootValue" :propName="props.propName + '.' + index"
                  :i18n="i18n" />
    </div>
    <div>
      <Button severity="success"
              :label="te(i18n.slice(0,-1)+':addItem') ? t(i18n.slice(0,-1)+':addItem') : t('autoform.addItem')"
              icon="pi pi-plus"
              @click="ev => insertItem()" />
    </div>
  </div>
</template>

<script setup>
  import { useI18n } from 'vue-i18n'
  const { t, te,  n, d } = useI18n()

  import Button from "primevue/button";
  import AutoInput from "./AutoInput.vue"

  import { inputs, types } from '../../config.js'
  import { computed, getCurrentInstance, toRefs } from 'vue'

  const props = defineProps({
    modelValue: {
    },
    definition: {
      type: Object
    },
    properties: {
      type: Object,
      default: () => ({})
    },
    rootValue: {
      type: Object,
      default: () => ({})
    },
    propName: {
      type: String,
      default: ''
    },
    i18n: {
      type: String,
      default: ''
    }
  })

  const emit = defineEmits(['update:modelValue'])

  const { value, definition, modelValue } = toRefs(props)

  import { defaultData } from "@live-change/vue3-components"

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()

  function insertItem(index) {
    const data = modelValue.value || []
    const item = defaultData(definition.value.of || definition.value.items)
    data.splice(index ?? data.length, 0, item) /// TODO: default value
    emit('update:modelValue', data)
    toast.add({ severity: 'info', summary: 'Item added', life: 1500 })
  }
  function updateItem(index, value) {
    const data = modelValue.value || []
    data[index] = value
    emit('update:modelValue', data)
  }
  function removeItem(index) {
    confirm.require({
      target: event.currentTarget,
      message: `Are you sure you want to remove this item?`,
      icon: 'pi pi-info-circle',
      acceptClass: 'p-button-danger',
      accept: async () => {
        const data = modelValue.value || []
        data.splice(index, 1)
        emit('update:modelValue', data)
        toast.add({ severity: 'info', summary: 'Item removed', life: 1500 })
      },
      reject: () => {
        toast.add({ severity:'error', summary: 'Rejected', detail: 'You have rejected', life: 3000 })
      }
    })
  }
  function swapItem(index) {
    const data = modelValue.value || []
    if(index === 0) {
      const popped = data.pop()
      data.push(data.shift())
      data.unshift(popped)
    } else {
      const tmp = data[index]
      data[index] = data[index-1]
      data[index-1] = tmp
    }
    emit('update:modelValue', data)
  }

</script>

<style scoped>

</style>
