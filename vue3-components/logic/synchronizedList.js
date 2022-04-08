import { computed, ref, watch } from "vue"
import { useThrottleFn } from "@vueuse/core"
import { synchronized } from './synchronized.js'

function sortedArraysMerge(merge, ...arrays) {
  const result = []
  const positions = arrays.map(a => 0)
  let incremented = false
  do {
    incremented = false
    let lowestId = '\xFF\xFF\xFF\xFF\xFF'
    for(const arrayIndex in arrays) {
      const position = positions[arrayIndex]
      const array = arrays[arrayIndex]
      if(position < array.length && array[position].id < lowestId) {
        lowestId = array[position].id
      }
    }
    let objects = new Array(arrays.length)
    for(const arrayIndex in arrays) {
      const position = positions[arrayIndex]
      const array = arrays[arrayIndex]
      if(position < array.length && array[position].id == lowestId) {
        objects[arrayIndex] = array[position]
        positions[arrayIndex]++
      } else {
        objects[arrayIndex] = null
      }
    }
    const mergeResult = merge(...objects)
    if(mergeResult) {
      result.push(mergeResult)
    }
  } while (incremented)
  return result
}

function synchronizedList(options) {
  const {
    source,
    update: updateAction,
    insert: insertAction,
    delete: deleteAction,
    move: moveAction,
    identifiers = {},
    objectIdentifiers = object => ({ id: object.id }),
    timeField = 'lastUpdate',
    timeSource = () => (new Date()).toISOString(),
    onChange = () => {},
    onSave = () => {},
    recursive = false,
    throttle = 300,
    autoSave = true,
    mapper = source => synchronized({
        source, update: updateAction, identifiers: { ...identifiers, ...objectIdentifiers(source.value) }, timeField, timeSource,
        recursive, throttle, autoSave, onSave, onChange
      })
  } = options
  if(!source) throw new Error('source must be defined')
  const synchronizedList = ref([])
  const locallyAdded = ref([])
  const locallyDeleted = ref([])

  function createSynchronizedElement(sourceData) {
    const elementSource = ref(sourceData)
    const synchronizedElement = mapper(elementSource)
    synchronizedElement.source = elementSource
    synchronizedElement.id = sourceData.id
    return synchronizedElement
  }
  function synchronizeFromSource() {
    console.log("SYNCHRONIZE FROM SOURCE!")
    let obsoleteLocallyAdded = new Set()
    let obsoleteLocallyDeleted = new Set()
    let newSynchronized = sortedArraysMerge(
      (synchronizedElement, sourceElement, locallyAddedElement, locallyDeletedElement) => {

        if(locallyAddedElement && sourceElement) {
          obsoleteLocallyAdded.add(locallyAddedElement.id)
        }
        if(locallyDeletedElement && !sourceElement) {
          obsoleteLocallyDeleted.add(locallyAddedElement.id)
        }

        if(synchronizedElement) {
          if(locallyDeletedElement) {
            return null // synchronized element locally
          }
          if(sourceElement) {
            synchronizedElement.source.value = sourceElement
          } else if(locallyAddedElement) {
            synchronizedElement.source.value = locallyAddedElement
          } else {
            return null // synchronized element deleted
          }
        } else if(sourceElement) {
          console.log("CREATE SYNCHRONIZED FROM SOURCE!")
          return createSynchronizedElement(sourceElement)
        } else if(locallyAddedElement) {
          return createSynchronizedElement(locallyAddedElement)
        }
      }, synchronizedList.value, source.value || [], locallyAdded.value, locallyDeleted.value)
    if(obsoleteLocallyAdded.length > 0) {
      locallyAdded.value = locallyAdded.value.filter(
        locallyAddedElement => obsoleteLocallyAdded.has(locallyAddedElement.id)
      )
    }
    if(obsoleteLocallyDeleted.length > 0) {
      locallyDeleted.value = locallyDeleted.value.filter(
        locallyDeletedElement => obsoleteLocallyDeleted.has(locallyDeletedElement.id)
      )
    }
    synchronizedList.value = newSynchronized
  }

  watch(() => (source.value ?? []).map(({ id }) => id), sourceIds => synchronizeFromSource())
  synchronizeFromSource()

  const changed = computed(() => (synchronizedList.value.some(({ changed }) => changed.value))
                              || locallyAdded.length || locallyDeleted.length)

  async function save() {
    const results = await Promise.app(synchronizedList.value.map(synchronizedElement => synchronizedElement.save()))
    return results.some(res => res)
  }

  async function insert(element) {
    locallyAdded.value.push(element)
    await insertAction({ ...element, [timeField]: timeSource(), ...identifiers })
  }

  async function deleteElement(element) {
    locallyDeleted.value.push(element)
    await deleteAction({ ...element, ...identifiers })
  }

  async function move(element, toId) {
    throw new Error('not implemented yet')
  }

  const synchronizedValue = computed(() => synchronizedList.value.map(synchronizedElement => synchronizedElement.value))
  return { value: synchronizedValue, save, changed, insert, delete: deleteElement, move }
}

export default synchronizedList
export { synchronizedList }
