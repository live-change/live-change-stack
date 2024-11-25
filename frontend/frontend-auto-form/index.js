import AutoInput from './front/src/components/form/AutoInput.vue'
import AutoField from './front/src/components/form/AutoField.vue'
import AutoEditor from './front/src/components/form/AutoEditor.vue'

export { AutoInput, AutoField, AutoEditor }

import * as inputConfig from './front/src/config.js'
export { inputConfig }

import editorData from './front/src/logic/editorData.js'
export { editorData }

export * from './front/src/logic/relations.js'

import ModelEditor from './front/src/components/crud/ModelEditor.vue'
export { ModelEditor }

export * from './front/src/router.js'

import en from "./front/locales/en.json"
const locales = { en }
export { locales }
