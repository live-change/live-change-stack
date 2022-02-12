import { s as script } from "./button.esm.d105ba0e.js";
import { x as resolveDirective, y as withDirectives, c as createElementBlock, b as createBaseVNode, z as createVNode, A as unref, X as createStaticVNode, o as openBlock } from "./vendor.e995dee7.js";
const _hoisted_1 = { class: "w-full lg:w-6 md:w-9" };
const _hoisted_2 = { class: "surface-card border-round shadow-2 p-4" };
const _hoisted_3 = /* @__PURE__ */ createBaseVNode("div", { class: "text-900 font-medium mb-3 text-xl" }, "Link expired", -1);
const _hoisted_4 = /* @__PURE__ */ createBaseVNode("p", { class: "mt-0 mb-4 p-0 line-height-3" }, "Your secret link already expired. To send another link click button below.", -1);
const _hoisted_5 = /* @__PURE__ */ createStaticVNode('<div class="surface-card border-round shadow-2 p-4"><div class="text-900 font-medium mb-3 text-xl">Unknown link</div><p class="mt-0 mb-2 p-0 line-height-3">We can&#39;t find your secret link. Check if you copied the address correctly.</p></div><div class="surface-card border-round shadow-2 p-4"><div class="text-900 font-medium mb-3 text-xl">Link used</div><p class="mt-0 mb-2 p-0 line-height-3">This link was already used.</p></div>', 2);
const _sfc_main = {
  props: {
    message: {
      type: String,
      required: true
    }
  },
  setup(__props) {
    return (_ctx, _cache) => {
      const _directive_shared_element = resolveDirective("shared-element");
      return withDirectives((openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("div", _hoisted_2, [
          _hoisted_3,
          _hoisted_4,
          createVNode(unref(script), {
            label: "Resend",
            class: "p-button-lg"
          })
        ]),
        _hoisted_5
      ], 512)), [
        [_directive_shared_element, { duration: "300ms", includeChildren: true }, "form"]
      ]);
    };
  }
};
export default _sfc_main;
