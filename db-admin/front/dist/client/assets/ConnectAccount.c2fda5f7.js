import { s as script, b as script$2 } from "./divider.esm.3d885e30.js";
import { s as script$1 } from "./button.esm.d105ba0e.js";
import { x as resolveDirective, y as withDirectives, c as createElementBlock, b as createBaseVNode, z as createVNode, A as unref, w as withCtx, o as openBlock } from "./vendor.e995dee7.js";
const _hoisted_1 = { class: "w-full lg:w-6 md:w-9" };
const _hoisted_2 = { class: "surface-card p-4 shadow-2 border-round" };
const _hoisted_3 = /* @__PURE__ */ createBaseVNode("div", { class: "text-center mb-5" }, [
  /* @__PURE__ */ createBaseVNode("div", { class: "text-900 text-3xl font-medium mb-3" }, "Connect account")
], -1);
const _hoisted_4 = { class: "p-field mb-3" };
const _hoisted_5 = /* @__PURE__ */ createBaseVNode("label", {
  for: "email",
  class: "block text-900 font-medium mb-2"
}, " Email address ", -1);
const _hoisted_6 = /* @__PURE__ */ createBaseVNode("small", {
  id: "email-help",
  class: "p-error"
}, "email not found.", -1);
const _hoisted_7 = /* @__PURE__ */ createBaseVNode("span", { class: "text-600 font-normal text-sm" }, "OR", -1);
const _sfc_main = {
  setup(__props) {
    return (_ctx, _cache) => {
      const _directive_shared_element = resolveDirective("shared-element");
      return withDirectives((openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("div", _hoisted_2, [
          _hoisted_3,
          createBaseVNode("div", null, [
            createBaseVNode("div", _hoisted_4, [
              _hoisted_5,
              createVNode(unref(script), {
                id: "email",
                type: "text",
                class: "w-full p-invalid",
                "aria-describedby": "email-help"
              }),
              _hoisted_6
            ]),
            createVNode(unref(script$1), {
              label: "Connect",
              icon: "pi pi-user",
              class: "w-full"
            }),
            createVNode(unref(script$2), {
              align: "center",
              class: "my-4"
            }, {
              default: withCtx(() => [
                _hoisted_7
              ]),
              _: 1
            }),
            createVNode(unref(script$1), {
              label: "Connect GitHub account",
              icon: "pi pi-github",
              class: "w-full p-button-secondary mb-2"
            }),
            createVNode(unref(script$1), {
              label: "Connect Google account",
              icon: "pi pi-google",
              class: "w-full p-button-secondary mb-1"
            })
          ])
        ])
      ], 512)), [
        [_directive_shared_element, { duration: "300ms", includeChildren: true }, "form"]
      ]);
    };
  }
};
export default _sfc_main;
