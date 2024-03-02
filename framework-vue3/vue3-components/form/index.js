import DefinedForm from "./DefinedForm.vue"
import CommandForm from "./CommandForm.vue"
import FormBind from "./FormBind.vue"

export { DefinedForm, CommandForm, FormBind }

function registerFormComponents(app) {
  app.component("defined-form", DefinedForm)
  app.component("command-form", CommandForm)
  app.component("form-bind", FormBind)
}

export { registerFormComponents }
