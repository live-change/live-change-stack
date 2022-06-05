import { computed, ref, watch } from "vue"
import { useThrottleFn } from "@vueuse/core"

function copy(value) {
  let res = JSON.parse(JSON.stringify(value || {}))
  if(value) for(const key in value) {
    if(typeof value[key] == 'function') {
      res[key] = value[key]
    }
  }
  return res
}

function synchronized(options) {
  const {
    source,
    update,
    identifiers = {},
    timeField = 'lastUpdate',
    timeSource = () => (new Date()).toISOString(),
    onChange = () => {},
    onSave = () => {},
    recursive = false,
    throttle = 300,
    autoSave = true
  } = options
  if(!source) throw new Error('source must be defined')
  if(!update) throw new Error('update function must be defined')
  if(recursive) {
    const synchronizedValue = ref(copy(source.value))
    const synchronizedJSON = computed(() => JSON.stringify(synchronizedValue.value))
    const lastLocalUpdate = ref(synchronized.value ? synchronizedValue.value[timeField] : '')

    let lastSavedUpdate = lastLocalUpdate.value

    const changed = computed(() => (JSON.stringify(source.value) != synchronizedJSON.value)
                                && (lastLocalUpdate.value > ((source.value && source.value[timeField]) ?? '')))
    async function save() {
      if((JSON.stringify(source.value) == JSON.stringify(synchronizedValue.value))
         || (lastLocalUpdate.value <= ((source.value && source.value[timeField]) ?? ''))) {
        return false // identical, no need to save
      }
      if(lastSavedUpdate == lastLocalUpdate.value) {
        return false // duplicated save action
      }
      lastSavedUpdate = lastLocalUpdate.value
      const data = JSON.parse(synchronizedJSON.value)
      // console.log("LAST LOCAL UPDATE", lastLocalUpdate.value)
      // console.log("LAST REMOTE UPDATE", ((source.value && source.value[timeField]) ?? ''))
      // console.log("SOURCE JSON", JSON.stringify(source.value))
      // console.log("SYNCHRONIZED JSON", JSON.stringify(synchronizedValue.value))
      await update({ ...data, [timeField]: lastLocalUpdate.value, ...identifiers })
      onSave()
      return true
    }
    const throttledSave = throttle ? useThrottleFn(save, throttle) : save
    watch(() => synchronizedJSON.value, json => {
      lastLocalUpdate.value = timeSource()
      onChange()
      if(autoSave) throttledSave()
    })
    //console.log("WATCH SOURCE VALUE", source.value)
    watch(() => JSON.stringify(source.value), sourceJson => {
      const sourceData = JSON.parse(sourceJson)
      if(sourceData) {
        //console.log("SRC DATA", JSON.stringify(sourceData))
        //console.log("TIME", sourceData[timeField], '>', lastLocalUpdate.value)
        if(sourceData[timeField] > lastLocalUpdate.value) {
          lastLocalUpdate.value = sourceData[timeField]
          synchronizedValue.value = copy(sourceData)
        }

      }
    })
    return { value: synchronizedValue, save, changed }
  } else {
    const local = ref(source.value)
    const changed = computed(() => (JSON.stringify(source.value) != JSON.stringify(local.value))
                                && ( ((local.value && local.value[timeField]) ?? '')
                                   > ((source.value && source.value[timeField]) ?? '')))
    async function save() {
      if((JSON.stringify(source.value) == JSON.stringify(local.value))
         || ( ((local.value && local.value[timeField]) ?? '')
           <= ((source.value && source.value[timeField]) ?? ''))) return false // identical, no need to save
      const data = JSON.parse(JSON.stringify(local.value))
      await update({ ...data, ...identifiers })
      onSave()
      return true
    }
    const throttledSave = throttle ? useThrottleFn(save, throttle) : save
    const synchronizedComputed = computed({
      get: () => {
        const localTime = ((local.value && local.value[timeField]) ?? '')
        const sourceTime = ((source.value && source.value[timeField]) ?? '')
        return localTime > sourceTime ? local.value : source.value
      },
      set: newValue => {
        local.value = { ...newValue, [timeField]: timeSource() }
        onChange()
        if(autoSave) throttledSave()
      }
    })
    return { value: synchronizedComputed, save, changed }
  }
}

export { synchronized }
export default synchronized