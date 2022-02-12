import { s as script } from "./button.esm.d105ba0e.js";
import "./index.73a97541.js";
import { _ as _sfc_main$1 } from "./SettingsTabs.44422c5d.js";
import { q as resolveComponent, x as resolveDirective, y as withDirectives, c as createElementBlock, z as createVNode, b as createBaseVNode, A as unref, w as withCtx, o as openBlock } from "./vendor.e995dee7.js";
const _hoisted_1 = { class: "w-full lg:w-6 md:w-9" };
const _hoisted_2 = { class: "surface-card border-round shadow-2 p-4" };
const _hoisted_3 = /* @__PURE__ */ createBaseVNode("div", { class: "text-900 font-medium mb-3 text-xl" }, "Connected accounts", -1);
const _hoisted_4 = { class: "list-none p-0 m-0 mt-5 mb-4" };
const _hoisted_5 = { class: "flex flex-row align-items-center justify-content-between mb-2" };
const _hoisted_6 = /* @__PURE__ */ createBaseVNode("div", { class: "flex flex-row align-items-center" }, [
  /* @__PURE__ */ createBaseVNode("i", { class: "pi pi-envelope mr-2" }),
  /* @__PURE__ */ createBaseVNode("span", { class: "block text-900 font-medium text-lg" }, "m8@em8.pl")
], -1);
const _hoisted_7 = { class: "flex flex-row align-items-center justify-content-between mb-2" };
const _hoisted_8 = /* @__PURE__ */ createBaseVNode("div", { class: "flex flex-row align-items-center" }, [
  /* @__PURE__ */ createBaseVNode("i", { class: "pi pi-envelope mr-2" }),
  /* @__PURE__ */ createBaseVNode("span", { class: "block text-900 font-medium text-lg" }, "michal@laszczewski.pl")
], -1);
const _hoisted_9 = { class: "flex flex-row align-items-center justify-content-between mb-2" };
const _hoisted_10 = /* @__PURE__ */ createBaseVNode("div", { class: "flex flex-row align-items-center" }, [
  /* @__PURE__ */ createBaseVNode("i", { class: "pi pi-phone mr-2" }),
  /* @__PURE__ */ createBaseVNode("span", { class: "block text-900 font-medium text-lg" }, "+27 123 456 789")
], -1);
const _hoisted_11 = { class: "flex flex-row align-items-center justify-content-between mb-2" };
const _hoisted_12 = /* @__PURE__ */ createBaseVNode("div", { class: "flex flex-row align-items-center" }, [
  /* @__PURE__ */ createBaseVNode("i", { class: "pi pi-google mr-2" }),
  /* @__PURE__ */ createBaseVNode("span", { class: "block text-900 font-medium text-lg" }, "michal8.m8@gmail.com")
], -1);
const _hoisted_13 = { class: "flex flex-row" };
const _sfc_main = {
  setup(__props) {
    return (_ctx, _cache) => {
      const _component_router_link = resolveComponent("router-link");
      const _directive_shared_element = resolveDirective("shared-element");
      return withDirectives((openBlock(), createElementBlock("div", _hoisted_1, [
        createVNode(_sfc_main$1),
        createBaseVNode("div", _hoisted_2, [
          _hoisted_3,
          createBaseVNode("ul", _hoisted_4, [
            createBaseVNode("li", _hoisted_5, [
              _hoisted_6,
              createVNode(unref(script), {
                class: "p-button-text p-button-plain p-button-rounded mr-1",
                icon: "pi pi-times"
              })
            ]),
            createBaseVNode("li", _hoisted_7, [
              _hoisted_8,
              createVNode(unref(script), {
                class: "p-button-text p-button-plain p-button-rounded mr-1",
                icon: "pi pi-times"
              })
            ]),
            createBaseVNode("li", _hoisted_9, [
              _hoisted_10,
              createVNode(unref(script), {
                class: "p-button-text p-button-plain p-button-rounded mr-1",
                icon: "pi pi-times"
              })
            ]),
            createBaseVNode("li", _hoisted_11, [
              _hoisted_12,
              createVNode(unref(script), {
                class: "p-button-text p-button-plain p-button-rounded mr-1",
                icon: "pi pi-trash"
              })
            ])
          ]),
          createBaseVNode("div", _hoisted_13, [
            createVNode(_component_router_link, {
              to: { name: "user:connectAccount" },
              class: "mr-2 no-underline"
            }, {
              default: withCtx(() => [
                createVNode(unref(script), {
                  label: "Connect Account",
                  icon: "pi pi-user-plus",
                  class: "p-button-lg"
                })
              ]),
              _: 1
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
