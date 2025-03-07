import { useToast } from 'primevue/usetoast'
import { usePath, live, useApi } from '@live-change/vue3-ssr'
import { ref, computed, inject } from 'vue'
import { synchronized, defaultData } from '@live-change/vue3-components'

export default function editorData(options) {
  if(!options) throw new Error('options must be provided')

  const {
    identifiers,
    service: serviceName,
    model: modelName,

    draft = true,
    autoSave = false,

    updateDataProperty = undefined,
    recursive = true,
    debounce = 600,
    timeField = 'lastUpdate',

    savedToast = "Saved",
    savedDraftToast = "Draft saved",
    discardedDraftToast = "Draft discarded",
    saveDraftErrorToast = "Error saving draft",
    saveErrorToast = "Error saving",
    resetToast = "Reset done",

    onSaved = () => {},
    onDraftSaved = () => {},
    onDraftDiscarded = () => {},
    onReset = () => {},
    onSaveError = () => {},
    onCreated = (createResult) => {},

    toast = useToast(),
    path = usePath(),
    api = useApi(),
    workingZone = inject('workingZone')

  } = options

  if(!identifiers) throw new Error('identifiers must be defined')
  if(!serviceName || !modelName) throw new Error('service and model must be defined')

  const service = api.services[serviceName]
  const model = service.models[modelName]
  const {
    crudMethods = model.crud,
    identifiersNames = model.identifiers,
    editableProperties = model.editableProperties ?? Object.keys(model.properties)
  } = options

  if(!crudMethods) throw new Error('crud methods must be defined in model or options')
  if(!identifiersNames) throw new Error('identifiers names must be defined in model or options')
  if(!editableProperties) throw new Error('editableProperties must be defined in model or options')

  let idKey = null
  let draftIdParts = []
  for(const identifier of identifiersNames) {
    if(typeof identifier === 'object') {
      if(identifier.field === 'id') idKey = identifier.name
      draftIdParts.push('id')
    } else {
      draftIdParts.push(identifier)
    }
  }
  const isNew = (idKey ? (!identifiers[idKey]) : (!draftIdParts.every(key => identifiers[key])))
  const draftId = (idKey ? identifiers[idKey]
    : draftIdParts.map(key => JSON.stringify(identifiers[key])).join('_')) ?? 'new'
  const draftIdentifiers = {
    actionType: serviceName, action: crudMethods.read, targetType: modelName, target: draftId
  }

  const savedDataPath = isNew ? null : path[serviceName][crudMethods.read](identifiers)
  const draftDataPath = (draft && path.draft.myDraft(draftIdentifiers)) || null

  const updateAction = api.actions[serviceName][crudMethods.update]
  const createOrUpdateAction = api.actions[serviceName][crudMethods.createOrUpdate]
  if(!updateAction && !createOrUpdateAction)
    throw new Error('update or createOrUpdate action must be defined in model or options')
  const createAction = api.actions[serviceName][crudMethods.create]
  if(isNew && !createAction && !createOrUpdateAction)
    throw new Error('create action must be defined in model or options')
  const createOrUpdateDraftAction = draft && api.actions.draft.setOrUpdateMyDraft
  const removeDraftAction = draft && api.actions.draft.resetMyDraft

  return Promise.all([
    live(savedDataPath), live(draftDataPath)
  ]).then(([savedData, draftData]) => {

    const editableSavedData = computed(() => savedData.value && Object.fromEntries(
      editableProperties.map(prop => [prop, savedData.value[prop]])
        .concat([[timeField, savedData.value[timeField]]])
    ))
    const editableDraftData = computed(() => draft && draftData.value && Object.fromEntries(
      editableProperties.map(prop => [prop, draftData.value.data[prop]])
        .concat([[timeField, draftData.value.data[timeField]]])
    ))
    const source = computed(() => editableDraftData.value || editableSavedData.value || defaultData(model))

    let savePromise = null
    const saving = ref(false)
    async function saveData(data){
      const requestData = {
        ...(updateDataProperty ? { [updateDataProperty]: data } : data),
        ...identifiers
      }
      if(savePromise) await savePromise // wait for previous save
      saving.value = true
      savePromise = (async () => {
        try {
          if(createOrUpdateAction) {
            return createOrUpdateAction(requestData)
          }
          if(savedData.value) {
            return updateAction(requestData)
          } else {
            const createResult = await createAction(requestData)
            await onCreated(createResult)
            return createResult
          }
        } finally {
          saving.value = false
          savePromise = null
        }
      })()
      if(!autoSave && workingZone)
        workingZone.addPromise('save:'+serviceName+':'+modelName, savePromise.catch(() => {}))
      return await savePromise
    }

    if(draft) {
      function saveDraft(data){
        return createOrUpdateDraftAction({ ...data, from: editableSavedData.value })
      }
      const synchronizedData = synchronized({
        source,
        update: saveDraft,
        updateDataProperty: 'data',
        identifiers: draftIdentifiers,
        recursive,
        autoSave: true,
        debounce,
        timeField,
        isNew,
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
        JSON.stringify(editableSavedData.value ?? {}) !== JSON.stringify(synchronizedData.value.value))
      const sourceChanged = computed(() =>
        JSON.stringify(draftData.value.from) !== JSON.stringify(editableSavedData.value))

      async function save() {
        const saveResult = await saveData(synchronizedData.value.value)
        if(draftData.value) await removeDraftAction(draftIdentifiers)
        onSaved(saveResult)
        if(toast && savedToast) toast.add({ severity: 'success', summary: savedToast, life: 1500 })
      }

      async function discardDraft() {
        const discardPromise = removeDraftAction(draftIdentifiers)
        if(workingZone)
          workingZone.addPromise('discardDraft:'+serviceName+':'+modelName, discardPromise)
        await discardPromise
        onDraftDiscarded()
        if(toast && discardedDraftToast) toast.add({ severity: 'info', summary: discardedDraftToast, life: 1500 })
      }

      async function reset() {
        const discardPromise = removeDraftAction(draftIdentifiers)
        if(workingZone)
          workingZone.addPromise('discardDraft:'+serviceName+':'+modelName, discardPromise)
        await discardPromise
        synchronizedData.value.value = editableSavedData.value || defaultData(model)
        if(toast && discardedDraftToast) toast.add({ severity: 'info', summary: resetToast, life: 1500 })
        onReset()
      }

      return {
        identifiers,
        value: synchronizedData.value,
        changed,
        save,
        saving,
        reset,
        discardDraft,
        model,
        isNew,
        resetOnError: false,
        draftChanged: synchronizedData.changed,
        saveDraft: synchronizedData.save,
        savingDraft: synchronizedData.saving,
        saved: savedData,
        savedPath: savedDataPath,
        draft: draftData,
        sourceChanged /// needed for draft discard on concurrent save
      }
    } else {
      const synchronizedData = synchronized({
        source,
        update: saveData,
        updateDataProperty,
        identifiers,
        recursive,
        autoSave,
        debounce,
        onSave: (result) => {
          onSaved(result)
          if(toast && savedToast) toast.add({ severity: 'success', summary: savedToast, life: 1500 })
        },
        onSaveError(e) {
          console.error("SAVE ERROR", e)
          if(toast && saveDraftErrorToast)
            toast.add({ severity: 'error', summary: saveErrorToast, detail: e.message ?? e, life: 5000 })
          onSaveError(e)
        }
      })

      async function reset() {
        synchronizedData.value.value = editableSavedData.value || defaultData(model)
        if(toast && discardedDraftToast) toast.add({ severity: 'info', summary: resetToast, life: 1500 })
        onReset()
      }

      return {
        identifiers,
        value: synchronizedData.value,
        changed: synchronizedData.changed,
        save: synchronizedData.save,
        saving: synchronizedData.saving,
        saved: savedData,
        savedPath: savedDataPath,
        reset,
        model,
      }

    }
  })

}