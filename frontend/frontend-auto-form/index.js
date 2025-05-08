import AutoInput from './front/src/components/form/AutoInput.vue'
import AutoField from './front/src/components/form/AutoField.vue'
import AutoEditor from './front/src/components/form/AutoEditor.vue'

export { AutoInput, AutoField, AutoEditor }

export * from './front/src/components/form/provideAutoInputConfiguration.js'
export * from './front/src/components/form/inputConfigInjection.js'

import editorData from './front/src/logic/editorData.js'
export { editorData }

import actionData from './front/src/logic/actionData.js'
export { actionData }

import AutoView from './front/src/components/view/AutoView.vue'
import AutoViewField from './front/src/components/view/AutoViewField.vue'
import DefaultFieldView from './front/src/components/view/DefaultFieldView.vue'
import JsonView from './front/src/components/view/JsonView.vue'
import ObjectView from './front/src/components/view/ObjectView.vue'
export { AutoView, AutoViewField, DefaultFieldView, JsonView, ObjectView }

import provideAutoViewComponents from './front/src/components/view/provideAutoViewComponents.js'
export { provideAutoViewComponents }

import viewData from './front/src/logic/viewData.js'
export { viewData }

export * from './front/src/logic/relations.js'

import ModelEditor from './front/src/components/crud/ModelEditor.vue'
export { ModelEditor }
import ModelView from './front/src/components/crud/ModelView.vue'
export { ModelView }
import ModelList from './front/src/components/crud/ModelList.vue'
export { ModelList }
import EditorButtons from './front/src/components/crud/EditorButtons.vue'
export { EditorButtons }
import DefaultObjectIdentification from './front/src/components/crud/DefaultObjectIdentification.vue'
export { DefaultObjectIdentification }
import ObjectPath from './front/src/components/crud/ObjectPath.vue'
export { ObjectPath }
import AutoObjectIdentification from './front/src/components/crud/AutoObjectIdentification.vue'
export { AutoObjectIdentification }

export * from './front/src/router.js'

import en from "./front/locales/en.json"
const locales = { en }
export { locales }
