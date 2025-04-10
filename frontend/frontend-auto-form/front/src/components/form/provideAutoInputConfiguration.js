import { defineAsyncComponent } from 'vue'
import { provideInputConfig, inputConfig } from './inputConfigInjection'

export const inputs = {
}
export const types = {
}

types.String = inputs.text = inputConfig( () => import('primevue/inputtext'))
inputs.textarea = inputConfig(() => import('primevue/textarea'), { attributes: { autoResize: true } })

inputs.password = inputConfig(() => import('primevue/password'))

const number = inputConfig(() => import('primevue/inputnumber'))
inputs.integer = number
types.Number = inputs.decimal = number.with({ attributes: { mode: 'decimal' } })

types.Object = inputs.object = inputConfig(() => import('./AutoEditor.vue'), {
  fieldComponent: defineAsyncComponent(() => import('./GroupField.vue'))
})

types.Array = inputs.list = inputConfig(() => import('./ArrayInput.vue'), {
  fieldComponent: defineAsyncComponent(() => import('./GroupField.vue'))
})

types.Date = inputs.datetime = inputConfig(() => import('./Calendar.vue'), { attributes: { showTime: true } })

inputs.select = inputConfig(() => import('primevue/dropdown'), {
  attributes: (config) => {
    const { definition, i18n, t, te } = config
   // console.log("SELECT", config)
    return {
      options: definition.options ?? definition.enum,
      optionLabel: option => {
        const i18nId = (definition.i18n ?? i18n + ':options') + '.' + option
        if(te(i18nId)) return t(i18nId)
        return t(option)
      }
    }
  }
})

inputs.multiselect = inputConfig(() => import('primevue/multiselect'), {
  attributes: (config) => {
    const { definition, i18n, t, te } = config
    return {
      options: definition.of.options ?? definition.of.enum ?? definition.options ?? definition.enum,
      optionLabel: option => {
        const i18nId = (definition.i18n ?? i18n + ':options') + '.' + option
        if(te(i18nId)) return t(i18nId)
        return t(option)
      }
    }
  }
})

inputs.duration = inputConfig(() => import('primevue/inputmask'), {
  attributes: { mask: '99:99:99' }
})

types.Image = inputs.image = inputConfig(
  async () => (await import('@live-change/image-frontend')).ImageInput
)

types.Boolean = inputs.switch = inputConfig(
  async () => (await import('primevue/inputswitch'))
)

/*
types.Boolean = inputs.switch = {
  fieldComponent: defineAsyncComponent(() => import('./SwitchField.vue')),
}*/

types.any = inputs.object = inputConfig(() => import('./ObjectInput.vue'))


export function provideAutoInputConfiguration() {
  for(let type in types) {
    provideInputConfig({    
      type: type
    }, types[type])
  }
  for(let input in inputs) {
    provideInputConfig({
      name: input
    }, inputs[input])
  }
}

import { useApi } from '@live-change/vue3-ssr'

export function provideMetadataBasedAutoInputConfiguration() {
  const objectInputConfig = inputConfig(() => import('./ObjectInput.vue'))
  provideInputConfig({
    name: 'object'
  }, objectInputConfig)
  const api = useApi()
  for(const service of api.metadata.api.value.services) {
    for(const modelName in service.models) {
      provideInputConfig({
        type: service.name + '_' + modelName
      }, objectInputConfig)
    }
  }
}