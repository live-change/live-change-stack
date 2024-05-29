<template>
  <defined-form
      v-if="actionDefinition && (state === 'ready' || state === 'working')"
      :tag="formTag"
      @submit="handleSubmitEvent"
      ref="defined"
      :provided="{ service, action, submit, getAction: () => actionDefinition }"
      :parameters="parameters"
      :definition="actionDefinition"
      :initial-values="initialValues"
      :class="class"
      :style="style"
      v-slot="{ data }">
    <slot v-bind="{ data, submit, definition: actionDefinition }"></slot>
  </defined-form>
  <slot v-if="state === 'error'" name="error">
    <div class="alert alert-danger" role="alert">error</div>
  </slot>
  <slot v-if="state === 'done'" name="done">
    <div class="alert alert-success" role="alert">success</div>
  </slot>
</template>

<script>
  import DefinedForm from './DefinedForm.vue'
  import analytics from '../logic/analytics.js'
  import createDebug from 'debug'
  const debug = createDebug("live-change/command-form")

  export default {
    name: "CommandForm",
    components: { DefinedForm },
    props: {
      service: {
        type: String,
        required: true
      },
      serviceDefinitionSource: {
        type: String,
        default: null
      },
      action: {
        type: String,
        required: true
      },
      parameters: {
        type: Object,
        default() { return {} }
      },
      initialValues: {
        type: Object,
        default: null
      },
      ignoreError: {
        default: false
      },
      externalErrorsProcessing: {
        type: Boolean,
        default: false
      },
      resetOnDone: {
        type: Boolean,
        default: false
      },
      keepOnDone: {
        type: Boolean,
        default: false
      },
      formTag: {
        type: String,
        default: 'form'
      },
      class: {
        type: String
      },
      style: {
        type: String
      }
    },
    emits: ['validate', 'submit', 'done', 'error'],
    inject: ['loadingZone', 'workingZone'],
    data() {
      return {
        state: 'loading',
        error: null,
        loadingTask: null
      }
    },
    computed: {
      serviceDefinitionsError() {
        return this.$api.metadata.serviceDefinitionsError
      },
      serviceDefinition() {
        if(this.serviceDefinitionSource) {
          if(typeof this.servicesDefinitionSource == 'string') {
            const definition = this.$api.serviceDefinitions.value
                .find(service => service.name === this.serviceDefinitionSource)
            return definition
          } else {
            return this.serviceDefinitionSource
          }
        }
        if(!this.$api.servicesDefinitions.value) return
        const definition = this.$api.servicesDefinitions.value.find(service => service.name === this.service)
        return definition
      },
      actionDefinition() {
        return this.serviceDefinition
          && this.serviceDefinition.actions[this.action]
      },
      definitionNotFound() {
        return (this.$api.metadata.serviceDefinitions && !this.serviceDefinition)
            || (this.serviceDefinition && !this.actionDefinition)
      },
      loadingError() {
        return this.definitionNotFound ? "notFound" : this.serviceDefinitionsError
      }
    },
    methods: {
      getNode(name) {
        return this.$refs.defined.getNode(name)
      },
      getNodeIfExists(name) {
        return this.$refs.defined.getNodeIfExists(name)
      },
      getFieldDefinition(name) {
        return this.$refs.defined.getFieldDefinition(name)
      },
      setFieldDefinition(name, definition) {
        return this.$refs.defined.setFieldDefinition(name, definition)
      },
      getFieldValidators(name) {
        return this.getNode(name).validators
      },
      getFieldValue(name) {
        return this.getNode(name).getValue()
      },
      setFieldValue(name, value) {
        return this.getNode(name).setValue(value)
      },
      getFieldError(name) {
        return this.getNode(name).error
      },
      setFieldError(name, error) {
        return this.getNode(name).setError(error)
      },
      getAction() {
        return this.actionDefinition
      },
      reset() {
        this.$refs.defined.reset()
      },
      observe(name, observer) {
        this.getNode(name).observe(observer)
      },
      unobserve(name, observer) {
        const node = this.getNodeIfExists(name)
        if(node) node.unobserve(observer)
      },
      observeError(name, observer) {
        this.getNode(name).observeError(observer)
      },
      unobserveError(name, observer) {
        const node = this.getNodeIfExists(name)
        if(node) node.unobserveError(observer)
      },

      addValidator(name, validator) {
        this.getNode(name).validators.push(validator)
      },
      removeValidator(name, validator) {
        let validators = this.getNode(name).validators
        let id = validators.indexOf(validator)
        if(id === -1) throw new Error("validator not found")
        validators.splice(id)
      },
      validateField(name) {
        return this.getNode(name).validate(this.$refs.defined.formRoot.properties, name, this.actionDefinition)
      },
      validate(context) {
        return this.$refs.defined.validate(context)
      },
      clearFieldValidation(name) {
        this.getNode(name).clearValidation()
      },
      clearValidation() {
        this.$refs.defined.clearValidation()
      },

      waitForFieldBarriers(name, context) {
        return this.$refs.defined.waitForFieldBarriers(name, context)
      },
      waitForBarriers(context) {
        return this.$refs.defined.waitForBarriers(context)
      },
      addBarrier(name, validator) {
        this.$refs.defined.addBarrier(name, validator)
      },
      removeBarrier(name, validator) {
        this.$refs.defined.removeBarrier(name, validator)
      },

      addElementToArray(propName, initialValue) {
        this.getNode(propName).addElement(initialValue)
      },
      removeElementFromArray(propName, index) {
        this.getNode(propName).removeElement(index)
      },
      scrollToError() {
        this.$refs.defined.scrollToError()
      },
      async submit(additionalParameters) {
        if(!(this.state === 'ready' || this.state === 'error')) return
        this.state = 'working'
        this.workingTask = this.workingZone.started({ name: `service ${this.service} action ${this.action}` })

        this.clearValidation()

        const _commandId = this.$api.uid()

        const analyticsValue = this.$refs.defined.formRoot.getAnalyticsValue()
        const analyticsParameters =
            { ...analyticsValue, ...this.parameters, ...(additionalParameters || {}), _commandId }

        analytics.emit('form', { service: this.service, action: this.action, parameters: analyticsParameters })

        const barrierResult = await this.waitForBarriers({
          parameters: { ...this.parameters, ...additionalParameters }
        })

        this.$emit("validate", { parameters: { ...this.parameters, ...additionalParameters }, form: this })

        const validationError = await this.validate({
          parameters: { ...this.parameters, ...additionalParameters }
        })

        debug("VALIDATION ERROR?", validationError)
        if(validationError) {
          analytics.emit('formError', {
            service: this.service, action: this.action, parameters: analyticsParameters, error: validationError
          })
          this.workingZone.finished(this.workingTask)
          this.state = 'ready'
          this.scrollToError()
          return;
        }

        let parameters = this.$refs.defined.formRoot.getValue()
        parameters = { ...parameters, ...this.parameters, ...(additionalParameters || {}), _commandId }
        //console.trace("SUBMIT!")
        debug("SUBMIT DATA:\n"+JSON.stringify(parameters, null, "  "))

        this.$emit("submit", { parameters, form: this })

        return this.$api.request([this.service, this.action], parameters).then((result) => {
          debug("DATA SUBMITED")
          analytics.emit('formDone', {
            service: this.service, action: this.action, parameters: analyticsParameters, error: validationError
          })
          if(this.resetOnDone) {
            this.state = 'ready'
            this.reset()
          } else if(this.keepOnDone) {
            this.state = 'ready'
          } else {
            this.state = 'done'
          }
          this.$emit('done', { result , parameters })
          this.workingZone.finished(this.workingTask)
        }).catch((error) => {
          console.error("FORM ERROR", error)
          analytics.emit('formError', {
            service: this.service, action: this.action, parameters: analyticsParameters, error
          })
          this.$refs.defined.formRoot.afterError(this.initialValues)
          if(error.properties) {
            for(let propName in error.properties) {
              let node = this.getNode(propName)
              if(!node) {
                this.state = 'error'
                this.error = `protocol mismatch, field ${propName} not found`
                return
              }
              node.setError(error.properties[propName])
              this.state = 'ready'
            }
            this.scrollToError()
            this.workingZone.finished(this.workingTask)
          } else if(this.ignoreError) {
            if((typeof this.ignoreError) == 'function') {
              if(this.ignoreError(error)) {
                this.state = 'ready'
                this.workingZone.finished(this.workingTask)
              } else {
                this.state = 'error'
                this.error = error
                this.workingZone.failed(this.workingTask, error)
              }
            } else if(Array.isArray(this.ignoreError)) {
              if(this.ignoreError.indexOf(error) !== -1) {
                this.state = 'ready'
                this.workingZone.finished(this.workingTask)
              } else {
                this.state = 'error'
                this.error = error
                this.workingZone.failed(this.workingTask, error)
              }
            } else {
              this.workingZone.finished(this.workingTask)
            }
          } else if(this.externalErrorsProcessing) {
            // ...
          } else {
            this.state = 'error'
            this.error = error
            this.workingZone.failed(this.workingTask, error)
          }
          this.$emit('error', { error, parameters, task: this.workingTask })
        })
      },
      handleSubmitEvent(ev) {
        //console.log("HANDLE SUBMIT EVENT!", ev)
        ev.preventDefault()
        this.submit()
      },
      setState(state) {
        this.state = state
      }
    },
    created() {
      if(this.actionDefinition) {
        this.state = 'ready'
      } else {
        this.loadingTask = this.loadingZone.started({ name: `action ${this.service}/${this.action} definition` })
        if(this.loadingError) {
          this.state = 'loadingError'
          if(this.loadingTask) {
            this.loadingZone.failed(this.loadingTask, this.loadingError)
            this.loadingTask = null
          }
        }
      }
    },
    unmounted() {
      if(this.loadingTask) {
        this.loadingZone.finished(this.loadingTask)
      }
    },
    watch: {
      actionDefinition(def) {
        if(def && this.state === 'loading') {
          this.state = 'ready'
          if(this.loadingTask) {
            this.loadingZone.finished(this.loadingTask)
            this.loadingTask = null
          }
        }
      },
      loadingError(error) {
        if(error && this.state === 'loading') {
          this.state = 'loadingError'
          if(this.loadingTask) {
            this.loadingZone.failed(this.loadingTask, error)
            this.loadingTask = null
          }
        }
      }
    }
  }
</script>

<style scoped>

</style>
