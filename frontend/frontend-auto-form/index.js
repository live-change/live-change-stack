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
import ActionForm from './front/src/components/crud/ActionForm.vue'
export { ActionForm }

export * from './front/src/router.js'

import DataWithSchema from './front/src/components/schema/DataWithSchema.vue'
export { DataWithSchema }
import SchemaFromDefinition from './front/src/components/schema/SchemaFromDefinition.vue'
export { SchemaFromDefinition }
export * from './front/src/logic/schema.js'

import en from "./front/locales/en.json"
import pl from "./front/locales/pl.json"
const locales = { en, pl }
export { locales }
