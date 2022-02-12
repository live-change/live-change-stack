import { _ as _export_sfc } from "./index.73a97541.js";
import { x as resolveDirective, y as withDirectives, c as createElementBlock, o as openBlock, b as createBaseVNode } from "./vendor.e995dee7.js";
const _sfc_main = {};
const _hoisted_1 = { class: "w-full lg:w-6 md:w-9" };
const _hoisted_2 = /* @__PURE__ */ createBaseVNode("div", { class: "surface-card border-round shadow-2 p-4" }, [
  /* @__PURE__ */ createBaseVNode("div", { class: "text-900 font-medium mb-4 text-xl" }, "Account connected"),
  /* @__PURE__ */ createBaseVNode("div", { class: "mt-0 p-0 line-height-3" }, "Congratulations! You have successfully connected accounts.")
], -1);
const _hoisted_3 = [
  _hoisted_2
];
function _sfc_render(_ctx, _cache) {
  const _directive_shared_element = resolveDirective("shared-element");
  return withDirectives((openBlock(), createElementBlock("div", _hoisted_1, _hoisted_3, 512)), [
    [_directive_shared_element, { duration: "300ms", includeChildren: true }, "form"]
  ]);
}
var ConnectAccountFinished = /* @__PURE__ */ _export_sfc(_sfc_main, [["render", _sfc_render]]);
export default ConnectAccountFinished;
