import { i as isClientSide } from "./index.73a97541.js";
import { b as script$2 } from "./divider.esm.3d885e30.js";
import { s as script$1 } from "./button.esm.d105ba0e.js";
import { s as script } from "./password.esm.c83b8514.js";
import { _ as _sfc_main$1 } from "./SettingsTabs.44422c5d.js";
import { x as resolveDirective, y as withDirectives, c as createElementBlock, z as createVNode, b as createBaseVNode, A as unref, w as withCtx, a as createCommentVNode, o as openBlock } from "./vendor.e995dee7.js";
const _hoisted_1 = { class: "w-full lg:w-6 md:w-9" };
const _hoisted_2 = { class: "surface-card p-4 shadow-2 border-round" };
const _hoisted_3 = /* @__PURE__ */ createBaseVNode("div", { class: "text-center mb-5" }, [
  /* @__PURE__ */ createBaseVNode("div", { class: "text-900 text-3xl font-medium mb-3" }, "Change password")
], -1);
const _hoisted_4 = { key: 0 };
const _hoisted_5 = { class: "p-field mb-3" };
const _hoisted_6 = /* @__PURE__ */ createBaseVNode("label", {
  for: "password",
  class: "block text-900 font-medium mb-2"
}, "Current password", -1);
const _hoisted_7 = /* @__PURE__ */ createBaseVNode("small", {
  id: "password-help",
  class: "p-error"
}, "password-error.", -1);
const _hoisted_8 = { class: "p-field mb-3" };
const _hoisted_9 = /* @__PURE__ */ createBaseVNode("label", {
  for: "password",
  class: "block text-900 font-medium mb-2"
}, "New password", -1);
const _hoisted_10 = /* @__PURE__ */ createBaseVNode("p", { class: "p-mt-2" }, "Suggestions", -1);
const _hoisted_11 = /* @__PURE__ */ createBaseVNode("ul", {
  class: "p-pl-2 p-ml-2 p-mt-0",
  style: { "line-height": "1.5" }
}, [
  /* @__PURE__ */ createBaseVNode("li", null, "At least one lowercase"),
  /* @__PURE__ */ createBaseVNode("li", null, "At least one uppercase"),
  /* @__PURE__ */ createBaseVNode("li", null, "At least one numeric"),
  /* @__PURE__ */ createBaseVNode("li", null, "Minimum 8 characters")
], -1);
const _hoisted_12 = /* @__PURE__ */ createBaseVNode("small", {
  id: "password-help",
  class: "p-error"
}, "password-error.", -1);
const _hoisted_13 = { class: "p-field mb-3" };
const _hoisted_14 = /* @__PURE__ */ createBaseVNode("label", {
  for: "reenterPassword",
  class: "block text-900 font-medium mb-2"
}, "Re-enter password", -1);
const _hoisted_15 = /* @__PURE__ */ createBaseVNode("small", {
  id: "reenterPassword-help",
  class: "p-error"
}, "password-error.", -1);
const _sfc_main = {
  setup(__props) {
    return (_ctx, _cache) => {
      const _directive_shared_element = resolveDirective("shared-element");
      return withDirectives((openBlock(), createElementBlock("div", _hoisted_1, [
        createVNode(_sfc_main$1),
        createBaseVNode("div", _hoisted_2, [
          _hoisted_3,
          unref(isClientSide) ? (openBlock(), createElementBlock("div", _hoisted_4, [
            createBaseVNode("div", _hoisted_5, [
              _hoisted_6,
              createVNode(unref(script), {
                id: "password",
                class: "w-full p-invalid",
                inputClass: "w-full",
                toggleMask: ""
              }),
              _hoisted_7
            ]),
            createBaseVNode("div", _hoisted_8, [
              _hoisted_9,
              createVNode(unref(script), {
                id: "password",
                class: "w-full p-invalid",
                inputClass: "w-full",
                toggleMask: ""
              }, {
                footer: withCtx(() => [
                  createVNode(unref(script$2)),
                  _hoisted_10,
                  _hoisted_11
                ]),
                _: 1
              }),
              _hoisted_12
            ]),
            createBaseVNode("div", _hoisted_13, [
              _hoisted_14,
              createVNode(unref(script), {
                id: "reenterPassword",
                class: "w-full p-invalid",
                inputClass: "w-full",
                feedback: false,
                toggleMask: ""
              }),
              _hoisted_15
            ]),
            createVNode(unref(script$1), {
              label: "Change password",
              icon: "pi pi-key",
              class: "w-full"
            })
          ])) : createCommentVNode("", true)
        ])
      ], 512)), [
        [_directive_shared_element, { duration: "300ms", includeChildren: true }, "form"]
      ]);
    };
  }
};
export default _sfc_main;
