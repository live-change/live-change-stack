import { a as script } from "./divider.esm.3d885e30.js";
import { s as script$1 } from "./button.esm.d105ba0e.js";
import { C as ref, x as resolveDirective, y as withDirectives, c as createElementBlock, b as createBaseVNode, z as createVNode, A as unref, o as openBlock } from "./vendor.e995dee7.js";
const _hoisted_1 = { class: "w-full lg:w-6 md:w-9" };
const _hoisted_2 = { class: "surface-card p-4 shadow-2 border-round" };
const _hoisted_3 = /* @__PURE__ */ createBaseVNode("div", { class: "text-center mb-5" }, [
  /* @__PURE__ */ createBaseVNode("div", { class: "text-900 text-3xl font-medium mb-3" }, "Delete account")
], -1);
const _hoisted_4 = /* @__PURE__ */ createBaseVNode("p", null, " Account deletion is irreversible, check the box below only if you are 100% sure that you want to delete your account. ", -1);
const _hoisted_5 = { class: "p-field-checkbox mb-3" };
const _hoisted_6 = /* @__PURE__ */ createBaseVNode("label", { for: "delete" }, "\xA0 I want to delete my account.", -1);
const _sfc_main = {
  setup(__props) {
    const wantDelete = ref(false);
    return (_ctx, _cache) => {
      const _directive_shared_element = resolveDirective("shared-element");
      return withDirectives((openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("div", _hoisted_2, [
          _hoisted_3,
          createBaseVNode("div", null, [
            _hoisted_4,
            createBaseVNode("div", _hoisted_5, [
              createVNode(unref(script), {
                id: "delete",
                modelValue: wantDelete.value,
                "onUpdate:modelValue": _cache[0] || (_cache[0] = ($event) => wantDelete.value = $event),
                binary: true
              }, null, 8, ["modelValue"]),
              _hoisted_6
            ]),
            createVNode(unref(script$1), {
              label: "Delete account",
              icon: "pi pi-user-plus",
              class: "p-button-lg",
              disabled: !wantDelete.value
            }, null, 8, ["disabled"])
          ])
        ])
      ], 512)), [
        [_directive_shared_element, { duration: "300ms", includeChildren: true }, "form"]
      ]);
    };
  }
};
export default _sfc_main;
