import AutoInput from './front/src/components/form/AutoInput.vue'
import AutoField from './front/src/components/form/AutoField.vue'
import AutoEditor from './front/src/components/form/AutoEditor.vue'

export { AutoInput, AutoField, AutoEditor }

import * as inputConfig from './front/src/config.js'
export { inputConfig }

import editorData from './front/src/logic/editorData.js'
export { editorData }
import viewData from './front/src/logic/viewData.js'

export * from './front/src/logic/relations.js'

import ModelEditor from './front/src/components/crud/ModelEditor.vue'
export { ModelEditor }
import ModelView from './front/src/components/crud/ModelView.vue'
export { ModelView }
import ModelList from './front/src/components/crud/ModelList.vue'
export { ModelList }
import EditorButtons from './front/src/components/crud/EditorButtons.vue'
export { EditorButtons }
import AutoObjectIdentification from './front/src/components/crud/AutoObjectIdentification.vue'
export { AutoObjectIdentification }

export * from './front/src/router.js'

import en from "./front/locales/en.json"
const locales = { en }
export { locales }
