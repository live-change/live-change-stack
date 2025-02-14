<template>
  <Dialog v-model:visible="shareDialog"
          :modal="true">
    <template #header>
      <div class="text-900 text-3xl font-medium">
        Access Control
      </div>
    </template>
    <AccessControl :objectType="objectType" :object="object" />
  </Dialog>
  <div class="w-full sm:w-9 md:w-8 lg:w-6 surface-card p-4 shadow-2 border-round">
    <LimitedAccess :objectType="objectType" :object="object" :requiredRoles="requiredRoles"
                   v-slot="{ authorized, roles, accesses }">
      <div v-if="authorized" class="text-right">
        <Button label="Share" icon="pi pi-share-alt" class="p-button mb-4" @click="showShareDialog" />
      </div>
      <div v-if="authorized" class="text-900 text-3xl font-medium mb-3">
        Access Granted!
      </div>
      <div>
        <p>
          <strong>Roles:</strong>
          <span v-for="role in roles" class="mx-1">{{ role }}</span>
        </p>
        <div>
          <strong>Accesses:</strong>
          <ol>
            <li v-for="access of accesses">
              <em class="mr-2">{{ access.id.split(':').join(' : ') }}</em>
              <span v-for="role in access.roles" class="mx-1">{{ role }}</span>
            </li>
          </ol>
        </div>
      </div>
    </LimitedAccess>
  </div>
</template>

<script setup>

  import Button from "primevue/button"
  import Dialog from "primevue/dialog"

  import { ref } from 'vue'

  import LimitedAccess from "./components/LimitedAccess.vue"
  import AccessControl from "./configuration/AccessControl.vue"

  const {
    object, objectType, requiredRoles
  } = defineProps({
    object: {
      type: String,
      default: 'example_Example'
    },
    objectType: {
      type: String,
      default: 'one'
    },
    requiredRoles: {
      type: Array,
      default: () => ['reader', 'writer', 'moderator', 'admin']
    }
  })

  const shareDialog = ref(false)

  function showShareDialog() {
    shareDialog.value = true
  }

</script>

<style scoped>

</style>
