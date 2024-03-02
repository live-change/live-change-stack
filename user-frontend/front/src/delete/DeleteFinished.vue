<template>
  <div class="w-full lg:w-6 md:w-9" v-shared-element:form="{ duration: '300ms', includeChildren: true }">
    <div class="surface-card p-4 shadow-2 border-round">
      <div class="text-center mb-5">
        <div class="text-900 text-3xl font-medium mb-3">Account deleted</div>
      </div>

      <div class="mb-3">
        Account has been deleted, please leave feedback why you are leaving us.
      </div>

      <Textarea class="w-full" :autoResize="true" rows="4" cols="30" />
      <div class="flex flex-row align-items-end">
        <Button label="Send" icon="pi pi-send" class="ml-auto p-button-lg"></Button>
      </div>

    </div>
  </div>
</template>

<script setup>
  import InputText from "primevue/inputtext"
  import Checkbox from "primevue/checkbox"
  import Button from "primevue/button"
  import Divider from "primevue/divider"
  import Textarea from "primevue/textarea"

</script>

<style>

</style>
