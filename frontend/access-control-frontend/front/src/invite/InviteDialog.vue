<template>
  <Dialog v-model:visible="visible"
          :modal="true" class="w-full sm:w-9/12 md:w-8/12 lg:w-6/12">
    <template #header>
      <div class="flex flex-wrap w-full">
        <div class="text-xl">Invite user with email</div>
      </div>
    </template>

    <WorkingZone>

      <template #default>

        <TabView :pt="{ panelcontainer:{ class: 'px-1' } }" v-model:activeIndex="tabIndex">
          <TabPanel header="Single user">

            <command-form service="accessControl" action="inviteEmail"
                          ref="inviteForm"
                          v-slot="{ data }"
                          :parameters="{ objectType, object }"
                          :initialValues="{ roles: availableRoles }"
                          @done="handleInvited" keepOnDone>

              <div class="flex flex-row flex-wrap items-center" style="margin-left: -0.5rem; margin-right: -0.5rem;">
                <div class="col-span-12 md:col-span-6 py-1">
                  <div class="p-field mb-4">
                    <label for="email" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
                      Email address
                    </label>
                    <InputText id="email" type="text" class="w-full"
                               aria-describedby="email-help" :class="{ 'p-invalid': data.emailError }"
                               v-model="data.email" />
                    <small v-if="data.emailError" id="email-help" class="p-error">{{ t(`errors.${data.emailError}`) }}</small>
                  </div>
                </div>
                <div class="col-span-12 md:col-span-6">
                  <div class="p-field mb-4">
                    <label for="inviteAccess" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
                      Roles
                    </label>
                    <Dropdown v-if="!multiRole" id="inviteAccess" class="w-14em w-full"
                              :options="['none'].concat(availableRoles)"
                              :optionLabel="optionLabel"
                              :modelValue="data.roles?.[0] ?? 'none'"
                              @update:modelValue="newValue => data.roles = [newValue]"
                              :feedback="false" toggleMask />
                    <MultiSelect v-if="multiRole" id="inviteAccess" class="w-full"
                                 :options="availableRoles"
                                 :optionLabel="optionLabel"
                                 v-model="data.roles"
                                 :feedback="false" toggleMask />
                    <small v-if="data.rolesError" id="roles-help" class="p-error">{{ t(`errors.${data.rolesError}`) }}</small>
                  </div>
                </div>
              </div>
              <div class="p-field mb-1">
                <label for="inviteMessage" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
                  Message ( optional )
                </label>
                <Textarea id="inviteMessage" v-model="data.message" :autoResize="true" rows="3" class="w-full" />
              </div>

            </command-form>

          </TabPanel>
          <TabPanel header="Multiple users">

            <command-form service="accessControl" action="inviteManyEmailsFromText"
                          ref="inviteManyForm"
                          v-slot="{ data }"
                          :parameters="{ objectType, object }"
                          :initialValues="{ roles: availableRoles }"
                          @done="handleInvitedMany" keepOnDone>

                <div class="p-field mb-4">
                  <label for="email" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
                    Email addresses (newline or comma separated)
                  </label>
                  <Textarea id="emailsText" type="text" class="w-full"
                            rows="4"
                            aria-describedby="emails-help" :class="{ 'p-invalid': data.emailsTextError }"
                            v-model="data.emailsText" />
                  <small v-if="data.emailsTextError" id="emails-help" class="p-error">
                    {{ t(`errors.${data.emailsTextError}`) }}
                  </small>
                </div>
                <div class="p-field mb-4">
                  <label for="inviteAccess" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
                    Roles
                  </label>
                  <Dropdown v-if="!multiRole" id="inviteAccess" class="w-14em w-full"
                            :options="['none'].concat(availableRoles)"
                            :optionLabel="optionLabel"
                            :modelValue="data.roles?.[0] ?? 'none'"
                            @update:modelValue="newValue => data.roles = [newValue]"
                            :feedback="false" toggleMask />
                  <MultiSelect v-if="multiRole" id="inviteAccess" class="w-full"
                               :options="availableRoles"
                               :optionLabel="optionLabel"
                               v-model="data.roles"
                               :feedback="false" toggleMask />
                  <small v-if="data.rolesError" id="roles-help" class="p-error">{{ t(`errors.${data.rolesError}`) }}</small>
                </div>
              <div class="p-field mb-1">
                <label for="inviteMessage" class="block text-surface-900 dark:text-surface-0 font-medium mb-2">
                  Message ( optional )
                </label>
                <Textarea id="inviteMessage" v-model="data.message" :autoResize="true" rows="3" class="w-full" />
              </div>

            </command-form>

          </TabPanel>
        </TabView>

      </template>

      <template #working>
        <div class="absolute w-full h-full top-0 left-0 bg-black-alpha-40 z-5
         flex align-items-center justify-content-center">
          <ProgressSpinner animationDuration=".5s"/>
        </div>
      </template>

    </WorkingZone>

    <template #footer>
      <Button v-if="tabIndex === 0"
              label="Invite email" icon="pi pi-envelope" autofocus @click="inviteForm.submit()" />
      <Button v-else
              label="Invite emails" icon="pi pi-envelope" autofocus @click="inviteManyForm.submit()" />
    </template>


    <TaskModal v-model:visible="taskModalVisible" :task="inviteTask" :taskTypes="taskTypes" />

  </Dialog>
</template>

<script setup>
  import { TaskModal } from "@live-change/task-frontend"

  import { WorkingZone } from "@live-change/vue3-components"

  import ProgressSpinner from 'primevue/progressspinner'

  import TabView from 'primevue/tabview'
  import TabPanel from 'primevue/tabpanel'

  import Button from "primevue/button"
  import Dropdown from "primevue/dropdown"
  import MultiSelect from "primevue/multiselect"

  import Dialog from 'primevue/dialog'
  import InputText from 'primevue/inputtext'
  import Textarea from 'primevue/textarea'

  import { useToast } from 'primevue/usetoast'
  const toast = useToast()

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  import { ref, defineProps, defineModel, watch } from 'vue'
  import { toRefs } from "@vueuse/core"

  const props = defineProps({
    object: {
      type: String,
      required: true
    },
    objectType: {
      type: String,
      required: true
    },
    availableRoles: {
      type: Array,
      default: () => ['reader']
    },
    multiRole: {
      type: Boolean,
      default: false
    }
  })

  const { availableRoles, multiRole, object, objectType } = toRefs(props)

  const tabIndex = ref(0)

  const visible = defineModel('visible', { required: true })

  function optionLabel(option) {
    if(option === 'none') return 'none'
    return option
  }

  const inviteForm = ref()
  function handleInvited({ parameters, result }) {
    visible.value = false
    toast.add({ severity: 'success', summary: 'Invitation sent!', life: 1500 })
    console.log("INVITED", arguments)
  }

  const taskModalVisible = ref(false)
  const inviteTask = ref()

  watch(taskModalVisible, tmv => {
    if(!tmv) {
      inviteTask.value = null
      visible.value = false
      toast.add({ severity: 'success', summary: 'Invitations were sent!', life: 1500 })
    }
  })

  const taskTypes = {
    inviteManyEmail: {
      label(task) {
        return 'Invite ' + task.properties.contacts.length + ' emails'
      }
    },
    inviteEmail: {
      label(task) {
        return 'Invite '+ task.properties.email
      }
    }
  }

  const inviteManyForm = ref()
  function handleInvitedMany({ parameters, result }) {
    console.log("INVITE MANY", result)
    const { task } = result
    inviteTask.value = task
    taskModalVisible.value = true
    toast.add({ severity: 'info', summary: 'Invitation will be sent!', life: 1500 })
  }

</script>
