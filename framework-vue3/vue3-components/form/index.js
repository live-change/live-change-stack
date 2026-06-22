import DefinedForm from "./DefinedForm.vue"
import CommandForm from "./CommandForm.vue"
import FormBind from "./FormBind.vue"
import CodeEditor from "./CodeEditor.vue"

export { DefinedForm, CommandForm, FormBind, CodeEditor }

function registerFormComponents(app) {
  app.component("defined-form", DefinedForm)
  app.component("command-form", CommandForm)
  app.component("form-bind", FormBind)
  app.component("code-editor", CodeEditor)
}

export { registerFormComponents }
