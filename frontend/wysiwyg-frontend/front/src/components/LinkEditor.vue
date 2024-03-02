<template>
  <div class="flex flex-column w-14rem">
    <div class="mb-2">
      <InputText type="text" v-model="linkData.href" placeholder="Href" class="w-full" />
    </div>
    <div class="flex flex-row flex-grow-1">
      <InputText type="text" v-model="linkData.target" placeholder="target" class="w-full flex-grow-1" />
      <Button v-if="!editor.isActive('link')" @click="addLink"
              icon="pi pi-plus" class="ml-1 flex-shrink-0" label="Add" />
      <Button v-else @click="removeLink"
              icon="pi pi-trash" class="ml-1 flex-shrink-0 p-button-danger" label="Remove" />
    </div>
  </div>
</template>

<script setup>

  import InputText from "primevue/inputtext"
  import Button from "primevue/button"

  import { inject, getCurrentInstance, ref, computed, watch } from "vue"
  import { toRefs } from "@vueuse/core"

  const { editor } = defineProps({
    editor: {
      type: Object,
      required: true
    }
  })

  const existingLink = editor.getAttributes('link')

  const linkData = ref({
    href: '',
    target: '_blank',
    ...existingLink
  })

  watch(linkData, () => {
    if(editor.isActive('link')) {
      editor.chain().setLink(linkData.value).run()
    }
  }, { deep: true })

  function addLink() {
    editor.chain().setLink(linkData.value).run()
  }

  function removeLink() {
    editor.chain().unsetLink().run()
  }


</script>

<style scoped>

</style>
