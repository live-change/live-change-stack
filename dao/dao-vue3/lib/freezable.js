import { ref, onUnmounted, getCurrentInstance, unref, reactive, isRef, shallowRef, watch, computed } from 'vue'

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
    frozen.value = JSON.parse(JSON.stringify(source.value))
  }
  function unfreeze() {
    frozen.value = false
  }
  const output = computed(() => {
    if(frozen.value) return frozen.value
    return source.value
  })
  const changed = computed(() => JSON.stringify(output.value) !== JSON.stringify(source.value))
  return { output, freeze, unfreeze, changed }
}
