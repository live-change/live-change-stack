<template>
  <component v-if="tag" :is="tag" v-on:submit="ev => handleSubmitEvent(ev)" :class="class" :style="style">
    <slot v-bind="{ data }"></slot>
  </component>
  <slot v-else v-bind="{ data }"></slot>
</template>

<script>
  import { reactive, computed, watch } from 'vue'
  import { getElementPositionInDocument } from '../utils/dom.mjs'

  const errorSufix = 'Error'

  class FormValue {
    constructor(definition, component, data, property) {
      this.definition = definition
      this.component = component
      this.data = data
      this.property = property
      if(!this.component) throw new Error("no component parameter")

      this.validators = []
      this.barriers = []

      if(definition.validation) {
        let validations = Array.isArray(definition.validation) ? definition.validation : [definition.validation]
        const context = {
          service: this.serviceDefinition,
          action: this.actionDefinition,
          property: definition,
          validators: component.$validators
        }
        const getValidator = validation => {
          if(typeof validation == 'string') {
            const validator = component.$validators[validation]
            if(typeof validator != 'function') throw new Error(`Validator ${validation} not found`)
            return validator({}, context)
          } else {
            const validator = component.$validators[validation.name]
            if(typeof validator != 'function') throw new Error(`Validator ${JSON.stringify(validation)} not found`)
            return validator(validation, context)
          }
        }
        context.getValidator = getValidator
        this.validators = this.validators.concat(
            validations.map(validation => getValidator(validation))
        )
      }
    }

    setValue(value) {
      this.data[this.property] = value
    }
    getAnalyticsValue() {
      if(this.definition.secret) return undefined
      return this.data[this.property]
    }
    getValue() {
      return this.data[this.property]
    }
    setError(error) {
      this.data[this.property+errorSufix] = error
    }
    getError() {
      return this.data[this.property+errorSufix]
    }

    setProperty(name) {
      this.property = name
    }

    reset(initialValue) {
      if(this.definition.type) {
        let defaultValue = this.definition.defaultValue ?? this.definition.default
        if(defaultValue === undefined) {
          switch(this.definition.type) {
            case "String" : defaultValue = ""; break;
            case "Object" : defaultValue = {}; break;
            case "Number" : defaultValue = 0; break;
            case "Array"  : defaultValue = []; break;
            default: defaultValue = undefined
          }
        }
        this.setValue(initialValue ?? defaultValue)
      } else {
        this.setValue(initialValue)
      }
      this.setError(null)
    }

    afterError(initialValue) {
      if(this.definition.singleUse) this.reset(initialValue)
    }

    validate(context) {
      let promises = []
      const value = this.getValue()
      for(let validator of this.validators) {
        promises.push(validator(value, context))
      }
      return Promise.all(promises).then(results => {
        for(let error of results) {
          if(error) {
            if(this.data[this.property+errorSufix] == error) return error
            this.setError(error)
            return error
          }
        }
      })
    }

    clearValidation() {
      this.setError(null)
    }

    async waitForBarriers(context) {
      let promises = []
      for(let barrier of this.barriers) {
        promises.push(barrier(this.value, context))
      }
      await Promise.all(promises)
    }
  }

  class FormObject extends FormValue {
    constructor(definition, component, data, property) {
      super(definition, component, data, property)

      if(!this.data[this.property]) this.data[this.property] = {}
      this.object = this.data[this.property]
      this.properties = {}

      this.bindProperties(definition)

      this.unwatch = watch(() => this.data[this.property], () => {
        if(this.object !== this.data[this.property]) {
          this.object = this.data[this.property]
          console.log("OBJECT OBJECT CHANGE", this.property)
          this.bindProperties(definition)
        }
      }, { deep: true })
    }

    bindProperties(definition) {
      for(let propName in definition.properties) {
        let propDefn = definition.properties[propName]

        if(propDefn.type === "Object") {
          this.properties[propName] =
              new FormObject(definition.properties[propName], this.component, this.object, propName)
        } else if(propDefn.type === 'Array') {
          this.properties[propName] =
              new FormArray(definition.properties[propName], this.component, this.object, propName)
        } else {
          this.properties[propName] =
              new FormValue(definition.properties[propName], this.component, this.object, propName)
        }
      }
    }

    setProperty(name) {
      this.property = name
      this.object = this.data[this.property]
    }

    reset(initialValue) {
      if(this.definition.type === 'Object') {
        this.data[this.property] = JSON.parse(JSON.stringify(initialValue ||
          (this.definition.hasOwnProperty('defaultValue') ? this.definition.defaultValue : {} )))
        this.object = this.data[this.property]
        if(this.object) {
          for(const key in this.object) {
            if(!this.object[key]) delete this.object[key]
          }
        }
      }
      if(this.object) {
        for(let propName in this.properties) {
          this.properties[propName].reset(initialValue && initialValue[propName])
        }
      }
    }
    afterError(initialValue) {
      if(this.definition.singleUse) return this.reset()
      for(let propName in this.properties) {
        this.properties[propName].afterError(initialValue && initialValue[propName])
      }
    }

    validate(context) {
      let promises = [super.validate(context).then(error => ['root', error])]
      for(let propName in this.properties) {
        if(context.parameters && context.parameters[propName]) continue;
        promises.push(
            this.properties[propName].validate({
              ...context,
              propName: context.propName ? context.propName+'.'+propName : propName
            }).then(error => [propName, error])
        )
      }
      return Promise.all(promises).then(results => {
        //console.error("RESULTS", results)
        let anyError = false
        let errors = {}
        for(let [propName, error] of results) {
          if(error) {
            anyError = true
            errors[propName] = errors[propName] || error
          }
        }
        return anyError && errors
      })
    }

    clearValidation() {
      super.clearValidation()
      for(let propName in this.properties) {
        this.properties[propName].clearValidation()
      }
    }

    async waitForBarriers(context) {
      let promises = [ super.waitForBarriers(context).then(error => ['root', error]) ]
      for(let propName in this.properties) {
        if(context.parameters && context.parameters[propName]) continue;
        promises.push(
            this.properties[propName].waitForBarriers({
              ...context,
              propName: context.propName ? context.propName+'.'+propName : propName
            })
        )
      }
      await Promise.all(promises)
    }

    getValue() {
      let obj = { ...this.value }
      for(let propName in this.properties) {
        obj[propName] = this.properties[propName].getValue()
      }
      return obj
    }

    getAnalyticsValue() {
      if(this.definition.secret) return {}
      let obj = { ...this.value }
      for(let propName in this.properties) {
        obj[propName] = this.properties[propName].getAnalyticsValue()
      }
      return obj
    }

    setValue(value) {
      this.value = value
      for(let propName in this.properties) {
        this.properties[propName].setValue(value && value[propName])
      }
    }

    setDefinition(propName, defn) {
      const oldData = this.object[propName]
      this.definition = JSON.parse(JSON.stringify(this.definition))
      const propDefn = JSON.parse(JSON.stringify(defn))
      this.definition.properties[propName] = propDefn
      const definition = this.definition
      if(propDefn.type === "Object") {
        this.properties[propName] =
            new FormObject(definition.properties[propName], this.component, this.object, propName)
      } else if(propDefn.type === 'Array') {
        this.properties[propName] =
            new FormArray(definition.properties[propName], this.component, this.object, propName)
      } else {
        this.properties[propName] =
            new FormValue(definition.properties[propName], this.component, this.object, propName)
      }
      this.properties[propName].reset(oldData)
      this.object[propName] = this.properties[propName].getValue()
    }
  }

  class FormArray extends FormValue {
    constructor(definition, component, data, property) {
      super(definition, component, data, property)
      this.elementDefinition = definition.of
      this.elements = []
      if(!this.data[this.property]) this.data[this.property] = []
      this.object = this.data[this.property]
      this.bindElements()
      this.unwatch = watch(() => this.data[this.property], () => {
        if(this.object !== this.data[this.property]) {
          //console.log("ARRAY OBJECT CHANGE", this.property)
          this.object = this.data[this.property]
          this.elements = []
        }
        this.bindElements()
        //this.check()
      }, { deep: true })
    }

    bindElements() {
      while(this.elements.length > this.object.length) {
        this.elements.pop()
      }
      while(this.elements.length < this.object.length) {
        this.elements.push(this.newElement(this.elements.length))
      }
    }

    setProperty(name) {
      if(this.unwatch) this.unwatch()
      this.property = name
      this.object = this.data[this.property]
      this.unwatch = watch(() => this.data[this.property], () => {
        if(this.object != this.data[this.property]) {
          //console.log("ARRAY OBJECT CHANGE", this.property)
          this.object = this.data[this.property]
          this.elements = []
        }
        this.object = this.data[this.property]
        while(this.elements.length > this.object.length) {
          this.elements.pop()
        }
        while(this.elements.length < this.object.length) {
          this.elements.push(this.newElement(this.elements.length))
        }
      }, { deep: true })
    }

    newElement(index) {
      if(this.elementDefinition.type === "Object") {
        return new FormObject(this.elementDefinition, this.component, this.object, index)
      } else if(this.elementDefinition.type === 'Array') {
        return new FormArray(this.elementDefinition, this.component, this.object, index)
      } else {
        return new FormValue(this.elementDefinition, this.component, this.object, index)
      }
    }

    reset(initialValue) {
      initialValue = initialValue || this.definition.defaultValue || []
      this.data[this.property] = new Array(initialValue.length)
      this.elements = new Array(this.object.length)
      for(let i = 0; i < initialValue.length; i++) {
        let n = this.newElement(i)
        n.reset(initialValue[i])
        this.elements[i] = n
      }
      super.setValue(initialValue)
/*      if(this.property == 'query') {
        this.check()
        this.object.bzz = 1
      }*/
    }

    check() {
      console.log("ARRAY", this, JSON.stringify(this.data))
      for(let i = 0; i < this.elements.length; i++) {
        console.log("ELEMENT", i, this.elements[i].data[i] === this.object[i])
      }
    }

    afterError(initialValue) {
      if(this.definition.singleUse) return this.reset()
      for(let i = 0; i < this.elements.length; i++) {
        this.elements[i].afterError(initialValue && initialValue[i])
      }
    }

    validate(context) {
      let promises = [super.validate(context)]
      for(let propName in this.elements) {
        promises.push(this.elements[propName].validate({ ...context, propName: context.propName+'.'+propName }))
      }
      return Promise.all(promises).then(results => {
        let errors = {}
        let anyError = false
        for(let i = 0; i < results.length; i++) {
          const error = results[i]
          if(error) {
            errors[i] = error
            anyError = true
          }
        }
        return anyError && results
      })
    }

    clearValidation() {
      super.clearValidation()
      for(let element of this.elements) {
        console.log("CLEAR ELEMENT", element, 'OF', this.elements, "IN", this.property)
        element.clearValidation()
      }
    }

    async waitForBarriers(context) {
      let promises = [super.waitForBarriers(context)]
      for(let propName in this.elements) {
        promises.push(this.elements[propName].waitForBarriers({ ...context, propName: context.propName+'.'+propName }))
      }
      await Promise.all(promises)
    }

    getValue() {
      let arr = new Array(this.elements.length)
      arr.length = this.elements.length
      for(let i = 0; i < this.elements.length; i++) {
        arr[i] = this.elements[i].getValue()
      }
      return arr
    }

    getAnalyticsValue() {
      if(this.definition.secret) return []
      let arr = new Array(this.elements.length)
      arr.length = this.elements.length
      for(let i = 0; i < this.elements.length; i++) {
        arr[i] = this.elements[i].getAnalyticsValue()
      }
      return arr
    }

    setValue(value) {
      if(value !== this.object) {
        this.data[this.property] = value
        this.object = value
        this.elements = []
        if(!value) return;
        for(let i = 0; i < value.length; i++) {
          let n = this.newElement(i)
          n.reset(value[i])
          this.elements.push(n)
        }
      } else {
        for (let i = 0; i < value.length; i++) {
          if (this.elements[i]) {
            this.elements[i].setValue(value[i])
          } else {
            let n = this.newElement(i)
            n.reset(value[i])
            this.elements.push(n)
          }
        }
        this.elements = this.elements.slice(0, value.length)
      }
    }

    updateElementIndices() {
      for(let i = 0; i < this.elements.length; i++) {
        if(this.elements[i].property !== i) {
          this.elements[i].setProperty(i)
        }
      }
    }

    addElement(initialValue) {
      let el = this.newElement()
      el.reset(initialValue)
      this.elements.push(el)
    }

    removeElement(i) {
      this.elements.splice(i, 1)
      this.updateElementIndices()
    }
  }

  export default {
    name: "DefinedForm",
    props: {
      tag: {
        type: String,
        required: false,
        default: 'form'
      },
      definition: {
        type: Object,
        required: true
      },
      initialValues: {
        type: Object,
        default: null
      },
      provided: {
        type: Object,
        default: null
      },
      parameters: {
        type: Object,
        default() { return {} }
      },
      class: {
        type: String
      },
      style: {
        type: String
      }
    },
    //emits: ['submit', 'update'],
    provide() {
      return {
        form: {
          ...this.provided,
          getFieldDefinition: (name) => this.getFieldDefinition(name),
          setFieldDefinition: (name, definition) => this.setFieldDefinition(name, definition),
          getFieldValidators: (name) => this.getFieldValidators(name),
          getFieldValue: (name) => this.getFieldValue(name),
          setFieldValue: (name, value) => this.setFieldValue(name, value),
          getFieldError: (name) => this.getFieldError(name),
          setFieldError: (name, value) => this.setFieldError(name, value),
          getValue: () => this.formRoot.getValue(),
          reset: () => this.reset(),

          getNode: (name) => this.getNode(name),

          addValidator: (propName, validator) => this.addValidator(propName, validator),
          removeValidator: (propName, validator) => this.addValidator(propName, validator),
          validateField: (propName) => this.validateField(propName),
          validate: () => this.validate(),
          clearFieldValidation: (propName) => this.clearFieldValidation(propName),
          clearValidation: () => this.clearValidation(),

          addBarrier: (propName, validator) => this.addBarrier(propName, validator),
          removeBarrier: (propName, validator) => this.removeBarrier(propName, validator),
          waitForFieldBarriers: (propName) => this.waitForFieldBarriers(propName),
          waitForBarriers: (propName) => this.waitForBarriers(),

          addElementToArray: (propName, initialValue) => this.addElementToArray(propName, initialValue),
          removeElementFromArray: (propName, index) => this.removeElementFromArray(propName, index),

          data: computed(() => this.data),
          root: computed(() => this.formRoot),
          state: computed(() => this.state),
        }
      }
    },
    inject: ['loadingZone', 'workingZone'],
    data() {
      return {
        state: 'starting',
        data: {},
        formRoot: {}
      }
    },
    methods: {
      getNode(name) {
        let np = name.split('.')
        let node = this.formRoot
        for(let p of np) {
          if(!p) continue
          if(node.properties) node = node.properties[p]
            else if(node.elements) node = node.elements[p]
          if(!node) throw new Error(`form field ${name} not found`)//return null
        }
        return node
      },
      getNodeIfExists(name) {
        let np = name.split('.')
        let node = this.formRoot
        for(let p of np) {
          if(!p) continue
          if(node.properties) node = node.properties[p]
          else if(node.elements) node = node.elements[p]
          if(!node) return node
        }
        return node
      },
      getFieldDefinition(name) {
        return this.getNode(name).definition
      },
      setFieldDefinition(name, definition) {
        const sep = name.lastIndexOf('.')
        const parentName = sep > 0 ? name.slice(0, sep) : null
        const propName = sep > 0 ? name.slice(sep+1) : name
        return (parentName ? this.getNode(parentName) : this.formRoot).setDefinition(propName, definition)
      },
      getFieldValidators(name) {
        return this.getNode(name).validators
      },
      getFieldValue(name) {
        return this.getNode(name).getValue()
      },
      setFieldValue(name, value) {
        this.getNode(name).setValue(value)
      },
      getFieldError(name) {
        return this.getNode(name).error
      },
      setFieldError(name, error) {
        return this.getNode(name).setError(error)
      },
      initForm() {
        this.formRoot = new FormObject(this.definition, this, this, 'data')
        this.reset()
      },
      reset() {
        this.formRoot.reset(this.initialValues)
        //console.log("Form after reset", JSON.stringify(this.formRoot.getValue(), null, '  '))
      },

      getValidationContext(srcContext) {
        const context = {
          ...(srcContext || { parameters: this.parameters }),
          ...this.provided,
          source: this.definition,
          props: this.formRoot.getValue(),
          form: this
        }
        return context
      },

      addValidator(name, validator) {
        this.getNode(name).validators.push(validator)
      },
      removeValidator(name, validator) {
        let validators = this.getNode(name).validators
        let id = validators.indexOf(validator)
        if(id == -1) throw new Error("validator not found")
        validators.splice(id)
      },
      validateField(name, context) {
        return this.getNode(name).validate(this.getValidationContext(context))
      },
      validate(context) {
        return this.formRoot.validate(this.getValidationContext(context))
      },
      clearFieldValidation(name) {
        this.getNode(name).clearValidation()
      },
      clearValidation() {
        this.formRoot.clearValidation()
      },

      waitForFieldBarriers(name, context) {
        return this.getNode(name).waitForBarriers(this.getValidationContext(context))
      },
      waitForBarriers(context) {
        return this.formRoot.waitForBarriers(this.getValidationContext(context))
      },
      addBarrier(name, barrier) {
        this.getNode(name).barriers.push(barrier)
      },
      removeBarrier(name, barrier) {
        let barriers = this.getNode(name).barriers
        let id = barriers.indexOf(barrier)
        if(id === -1) throw new Error("barrier not found")
        barriers.splice(id)
      },


      addElementToArray(propName, initialValue) {
        this.getNode(propName).addElement(initialValue)
      },
      removeElementFromArray(propName, index) {
        this.getNode(propName).removeElement(index)
      },
      scrollToError() {
        let errorFieldElement = this.$el.querySelector(".formFieldError")
        if(!errorFieldElement) return
        let position = getElementPositionInDocument(errorFieldElement)
        window.scrollTo(0, position.y - 100) /// TODO: remove fixed nav-bar and do it properly.
      },
      handleSubmitEvent(ev) {
        ev.preventDefault()
        this.$emit('submit', ev)
      }
    },
    created() {
      this.initForm()
      this.state = 'ready'

      globalThis.form = this
    },
    unmounted() {
    },
    watch: {
      rootValue(newValue) {
        this.$emit('update', newValue)
      }
    }
  }
</script>

<style scoped>

</style>
