<template>
  <slot v-bind="{ value, error, setValue, setError }"></slot>
</template>

<script>
export default {
  name: "FormBind",
  props: {
    name: {
      type: String,
      required: true
    },
    valueFilter: {
      type: Function,
      default: (v) => v
    }
  },
  inject: ['form'],
  computed: {
    definition() {
      return this.form.getFieldDefinition(this.name)
    },
    value: {
      get() {
        return this.form.getFieldValue(this.name)
      },
      set(value) {
        const filtered = this.valueFilter(value)
        this.form.setFieldValue(this.name, filtered)
      }
    },
    error: {
      get() {
        return this.form.getFieldError(this.name)
      },
      set(error) {
        this.form.setFieldError(this.name, error)
      }
    }
  },
  methods: {
    setValue(value) {
      const filtered = this.valueFilter(value)
      this.form.setFieldValue(this.name, filtered)
    },
    setError(error) {
      this.form.setFieldError(this.name, error)
    }
  },
  created() {
    this.connected = true
  },
  beforeUnmount() {
    this.connected = false
  }
}
</script>

<style scoped>

</style>