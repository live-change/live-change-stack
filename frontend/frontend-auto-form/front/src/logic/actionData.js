import { useToast } from 'primevue/usetoast'
import { usePath, live, useApi } from '@live-change/vue3-ssr'
import { ref, computed, inject, watch, getCurrentInstance } from 'vue'
import { synchronized, defaultData } from '@live-change/vue3-components'

import { propertiesValidationErrors } from './validation.js'

import { cyrb128 } from './utils.js'
import deepmerge from 'deepmerge'

export default async function actionData(options) {
  if(!options) throw new Error('options must be provided')

  const {
    parameters = {},
    initialValue = {},

    service: serviceName,    
    action: actionName,

    draft = true,    
    recursive = true,
    debounce = 600,    
    timeField = 'lastUpdate',

    doneToast = "Action done",
    errorToast = "Action error",
    resetToast = "Reset done",
    savedDraftToast = "Draft saved",
    discardedDraftToast = "Draft discarded",

    onDone = ({ result, data }) => {},
    onError = ({ error, data }) => { throw error } ,
    onReset = () => {},

    onDraftSaved = () => {},
    onDraftDiscarded = () => {},        

    appContext = getCurrentInstance().appContext,

    toast = useToast(options.appContext),
    path = usePath(options.appContext),
    api = useApi(options.appContext),
    workingZone = inject('workingZone', options.appContext),

  } = options

  if(!serviceName || !actionName) throw new Error('service and action must be defined')

  const service = api.services[serviceName]
  if(!service) throw new Error('service must be defined in options')
  const action = service.actions[actionName]  
  if(!action) throw new Error('action must be defined in options')

  const editableProperties = (action.definition.editableProperties ?? Object.keys(action.definition.properties))
    .filter(key => !parameters[key])

  let draftIdParts = []
  let idKey = null
  for(const [parameterName, parameter] of Object.entries(parameters || {})) {
    if(parameter.type === 'id') {
      idKey = parameterName
    } else {
      draftIdParts.push(parameterName)
    }
  }
    
  let draftId = (idKey ? parameters[idKey]
    : draftIdParts.map(key => JSON.stringify(parameters[key])).join('_')) ?? 'any'
  if(draftId.length > 16) {
    draftId = cyrb128(draftId).slice(0, 16)
  }
  
  const draftIdentifiers = {
    actionType: serviceName, action: 'action', targetType: actionName, target: draftId || 'any'
  }

  const draftDataPath = (draft && path.draft.myDraft(draftIdentifiers)) || null

  const createOrUpdateDraftAction = draft && api.actions.draft.setOrUpdateMyDraft
  const removeDraftAction = draft && api.actions.draft.resetMyDraft

  const propertiesServerErrors = ref({})
  const lastSentData = ref(null)

  console.log("INITIAL VALUE", initialValue)
  console.log("DEFAULT DATA", defaultData(action.definition))

  const mergedInitialValue = deepmerge(
    defaultData(action.definition),
    JSON.parse(JSON.stringify(initialValue))
  )

  const formData = ref(mergedInitialValue)
  const done = ref(false)

  let commandPromise = null
  const submitting = ref(false)
  async function submitData(data){
    const requestData = JSON.parse(JSON.stringify({ ...data, ...parameters }))
    if(commandPromise) await commandPromise // wait for previous save
    submitting.value = true
    commandPromise = (async () => {
      propertiesServerErrors.value = {}
      lastSentData.value = JSON.parse(JSON.stringify(requestData))
      console.log("ACTION COMMAND DATA", requestData)
      try {
        const result = await action(requestData)
        done.value = true
        await onDone(result)
        return result
      } catch(e) {
        console.log("ACTION COMMAND ERROR", e)
        if(e.properties) {
          propertiesServerErrors.value = e.properties
        } else {
          await onError(e)
        }
        return Error
      } finally {
        submitting.value = false
        commandPromise = null        
      }    
    })()
    if(workingZone) workingZone.addPromise('command:'+serviceName+':'+actionName, commandPromise)
    return await commandPromise
  }

  if(draft) {
    const draftData = await live(draftDataPath)     
    function saveDraft(data){
      return createOrUpdateDraftAction({ ...data, from: formData.value })
    }
    const source = computed(() => draftData.value?.data || mergedInitialValue)
    const synchronizedData = synchronized({
      source,
      update: saveDraft,
      updateDataProperty: 'data',
      identifiers: draftIdentifiers,
      recursive,
      autoSave: true,
      debounce,
      timeField,
      resetOnError: false,
      onSave: () => {
        onDraftSaved()
        if(toast && savedDraftToast) toast.add({ severity: 'info', summary: savedDraftToast, life: 1500 })
      },
      onSaveError: (e) => {
        console.error("DRAFT SAVE ERROR", e)
        if(toast && saveDraftErrorToast)
          toast.add({ severity: 'error', summary: saveDraftErrorToast, detail: e.message ?? e, life: 5000 })
      }
    })
    const changed = computed(() =>
      JSON.stringify(mergedInitialValue ?? {})
        !== JSON.stringify({ ...synchronizedData.value.value, [timeField]: undefined })
    )    

    const propertiesErrors = computed(() => propertiesValidationErrors(
      synchronizedData.value.value, parameters, action.definition, lastSentData.value,
        propertiesServerErrors.value, appContext))

    async function submit() {
      const result = await submitData(synchronizedData.value.value)
      if(result === Error) return // silent return on error, because it's handled in onError
      if(draftData.value) await removeDraftAction(draftIdentifiers)
      if(toast && doneToast) toast.add({ severity: 'success', summary: doneToast, life: 1500 })
    }

    async function discardDraft() {
      const discardPromise = removeDraftAction(draftIdentifiers)
      if(workingZone)
        workingZone.addPromise('discardDraft:'+serviceName+':'+actionName, discardPromise)
      await discardPromise
      onDraftDiscarded()
      if(toast && discardedDraftToast) toast.add({ severity: 'info', summary: discardedDraftToast, life: 1500 })
    }

    async function reset() {
      const discardPromise = removeDraftAction(draftIdentifiers)
      if(workingZone)
        workingZone.addPromise('discardDraft:'+serviceName+':'+actionName, discardPromise)
      await discardPromise
      synchronizedData.value.value = editableSavedData.value || JSON.parse(JSON.stringify(mergedInitialValue))
      if(toast && discardedDraftToast) toast.add({ severity: 'info', summary: resetToast, life: 1500 })
      done.value = false
      onReset()
    }

    return {
      parameters,
      initialValue,
      mergedInitialValue,
      editableProperties,
      value: synchronizedData.value,
      changed,
      submit,
      submitting,
      reset,
      action,
      discardDraft,      
      propertiesErrors,      
      lastSentData,
      draftChanged: synchronizedData.changed,
      saveDraft: synchronizedData.save,
      savingDraft: synchronizedData.saving,
      done: done,
      draft: draftData
    }

  } else {
    
    async function submit() {
      const result = await submitData(formData.value)
      if(result === Error) return // silent return on error, because it's handled in onError
      if(toast && doneToast) toast.add({ severity: 'success', summary: doneToast, life: 1500 })
    }

    const changed = computed(() =>
      JSON.stringify(mergedInitialValue ?? {})
        !== JSON.stringify(formData.value)
    )    
    
    function reset() {
      formData.value = JSON.parse(JSON.stringify(mergedInitialValue))
    }

    return {
      parameters,    
      initialValue,
      editableProperties,
      value: formData,
      changed,
      submit,
      submitting,
      done,
      propertiesErrors,
      reset      
    }

  }

}