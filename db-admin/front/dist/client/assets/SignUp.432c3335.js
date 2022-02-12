import { s as script } from "./divider.esm.3d885e30.js";
import { s as script$1 } from "./button.esm.d105ba0e.js";
import { q as resolveComponent, x as resolveDirective, y as withDirectives, c as createElementBlock, b as createBaseVNode, z as createVNode, w as withCtx, o as openBlock, A as unref, l as normalizeClass, t as toDisplayString, a as createCommentVNode } from "./vendor.e995dee7.js";
const _hoisted_1 = { class: "w-full lg:w-6 md:w-9" };
const _hoisted_2 = { class: "surface-card p-4 shadow-2 border-round" };
const _hoisted_3 = /* @__PURE__ */ createBaseVNode("div", { class: "text-center mb-5" }, [
  /* @__PURE__ */ createBaseVNode("div", { class: "text-900 text-3xl font-medium mb-3" }, "Sign Up")
], -1);
const _hoisted_4 = { class: "p-field mb-3" };
const _hoisted_5 = /* @__PURE__ */ createBaseVNode("label", {
  for: "email",
  class: "block text-900 font-medium mb-2"
}, " Email address ", -1);
const _hoisted_6 = {
  key: 0,
  id: "email-help",
  class: "p-error"
};
const _sfc_main = {
  setup(__props) {
    return (_ctx, _cache) => {
      const _component_command_form = resolveComponent("command-form");
      const _directive_shared_element = resolveDirective("shared-element");
      return withDirectives((openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("div", _hoisted_2, [
          _hoisted_3,
          createVNode(_component_command_form, {
            service: "message-authentication",
            action: "signUpEmail"
          }, {
            default: withCtx(({ data, submit }) => [
              createBaseVNode("div", _hoisted_4, [
                _hoisted_5,
                createVNode(unref(script), {
                  id: "email",
                  type: "text",
                  class: normalizeClass(["w-full", { "p-invalid": data.emailError }]),
                  "aria-describedby": "email-help",
                  modelValue: data.email,
                  "onUpdate:modelValue": ($event) => data.email = $event
                }, null, 8, ["class", "modelValue", "onUpdate:modelValue"]),
                data.emailError ? (openBlock(), createElementBlock("small", _hoisted_6, toDisplayString(data.emailError), 1)) : createCommentVNode("", true)
              ]),
              createVNode(unref(script$1), {
                label: "Connect Email",
                icon: "pi pi-user",
                class: "w-full",
                onClick: submit
              }, null, 8, ["onClick"])
            ]),
            _: 1
          })
        ])
      ], 512)), [
        [_directive_shared_element, { duration: "300ms", includeChildren: true }, "form"]
      ]);
    };
  }
};
export default _sfc_main;
