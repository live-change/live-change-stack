<template>
  <div class="w-full lg:w-6/12 md:w-9/12">
    <div class="bg-surface-0 dark:bg-surface-900 p-6 shadow rounded-border">
      <div class="text-center mb-8">
        <div class="text-surface-900 dark:text-surface-0 text-3xl font-medium mb-4">
          Profile
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-center" v-if="userData !== undefined">
        <div class="relative mb-4" @click="openImageEditor">
          <Image v-if="userData?.image" :image="userData.image" class="mr-2 rounded-full profile-image"
                 domResize width="200" height="200" />
          <img v-else :src="identiconUrl" class="mr-2 rounded-full profile-image">
        </div>
        <command-form service="userIdentification" :action="updateMethod"
                      :initialValues="{ name: userData?.name }"
                      :parameters="{ image: userData?.image }" v-slot="{ data }"
                      keepOnDone @done="handleNameSaved"
                      class="ml-4 mb-4 flex flex-col">
          <div class="p-field flex flex-col">
            <InputText type="text" v-model="data.name"
                       :class="{ 'p-invalid': data.nameError }"
                       class="p-inputtext-lg" placeholder="Your name" />
            <small v-if="data.nameError" id="currentPassword-help" class="p-error">{{ t(`errors.${data.nameError}`) }}</small>
          </div>
          <Button type="submit" label="Save name" class="mt-4" icon="pi pi-save" />
        </command-form>
      </div>

    </div>
  </div>
</template>

<script setup>
  import { FileInput } from "@live-change/upload-frontend"
  import { ComponentDialog } from "@live-change/frontend-base"
  import { ImageEditor, Image } from "@live-change/image-frontend"
  import { useDialog } from 'primevue/usedialog'
  import InputText from 'primevue/inputtext'
  import Button from 'primevue/button'
  const dialog = useDialog()

  import { shallowRef, ref, inject, computed } from 'vue'
  import { path, live, actions,  api as useApi } from '@live-change/vue3-ssr'

  import { useI18n } from 'vue-i18n'
  const { t } = useI18n()

  import { useToast } from 'primevue/usetoast'
  import { useConfirm } from 'primevue/useconfirm'
  const confirm = useConfirm()
  const toast = useToast()

  const api = useApi()
  const [ ownerType, owner ] = api.client.value.user
      ? ['user_User', api.client.value.user]
      : ['session_Session', api.client.value.session]

  const dataPromise = live(path().userIdentification.identification({
    sessionOrUserType: ownerType, sessionOrUser: owner
  }))

  const identiconUrl = `/api/identicon/jdenticon/${ownerType}:${owner}/28.svg`

  const workingZone = inject('workingZone')

  const [ userData ] = await Promise.all([ dataPromise ])

  const updateMethod = computed(() => userData.value ? 'updateMyIdentification' : 'setMyIdentification')

  function openImageEditor() {
    dialog.open(ComponentDialog, {
      props: {
        header: 'Image Editor',
        style: {
          width: '50vw',
        },
        breakpoints:{
          '960px': '75vw',
          '640px': '90vw'
        },
        modal: true,
        contentClass: "p-0"
      },
      data: {
        component: shallowRef(ImageEditor),
        props: {
          type: 'circle',
          modelValue: userData.value?.image,
        }
      },
      onClose: (options) => {
        const data = options.data
        console.log("EDITOR RESULT", data)
        console.log("WZ", workingZone)
        workingZone.addPromise('update user image', (async () => {
          await api.command(['userIdentification', updateMethod.value], { image: data?.value })
          toast.add({ severity:'info', summary: 'User image saved', life: 1500 })
        })())
      }
    })
  }

  function handleNameSaved() {
    toast.add({ severity:'info', summary: 'User name saved', life: 1500 })
  }


</script>

<style scoped>
  .profile-image {
    aspect-ratio: 1/1;
    width: 200px;
    max-width: 100%;
    height: auto;
    border: 1px solid gray;
  }
</style>
