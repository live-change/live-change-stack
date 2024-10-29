import { ref, onUnmounted, getCurrentInstance, unref, reactive, isRef, shallowRef, watch, computed } from 'vue'

function deepUnref(value) {
  if(isRef(value)) return deepUnref(value.value)
  return value
}

export default function freezable(source) {
  if(typeof window === 'undefined') return {
    output: source,
    changed: ref(false),
    freeze() {},
    unfreeze() {}
  }
  const frozen = ref(false)
  function freeze() {
    if(frozen.value) return
    frozen.value = JSON.parse(JSON.stringify(deepUnref(source.value)))
  }
  function unfreeze() {
    frozen.value = false
  }
  const output = computed(() => {
    if(frozen.value) return deepUnref(frozen.value)
    return source.value
  })
  const changed = computed(() => {
    console.log("CHECK CHANGED", deepUnref(output.value),deepUnref(source.value))
    return JSON.stringify(deepUnref(output)) !== JSON.stringify(deepUnref(source))
  })
  return { output, freeze, unfreeze, changed }
}
