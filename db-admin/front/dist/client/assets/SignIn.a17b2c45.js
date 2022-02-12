import { i as isClientSide } from "./index.73a97541.js";
import { s as script, a as script$2, b as script$4 } from "./divider.esm.3d885e30.js";
import { s as script$3 } from "./button.esm.d105ba0e.js";
import { s as script$1 } from "./password.esm.c83b8514.js";
import { q as resolveComponent, x as resolveDirective, y as withDirectives, c as createElementBlock, b as createBaseVNode, z as createVNode, w as withCtx, A as unref, a as createCommentVNode, o as openBlock, j as createTextVNode } from "./vendor.e995dee7.js";
const _hoisted_1 = { class: "w-full lg:w-6 md:w-9" };
const _hoisted_2 = { class: "surface-card p-4 shadow-2 border-round" };
const _hoisted_3 = { class: "text-center mb-5" };
const _hoisted_4 = /* @__PURE__ */ createBaseVNode("div", { class: "text-900 text-3xl font-medium mb-3" }, "Welcome Back", -1);
const _hoisted_5 = /* @__PURE__ */ createBaseVNode("span", { class: "text-600 font-medium line-height-3" }, "Don't have an account?", -1);
const _hoisted_6 = /* @__PURE__ */ createTextVNode(" Create today!");
const _hoisted_7 = { key: 0 };
const _hoisted_8 = { class: "p-field mb-3" };
const _hoisted_9 = /* @__PURE__ */ createBaseVNode("label", {
  for: "email",
  class: "block text-900 font-medium mb-2"
}, " Email address ", -1);
const _hoisted_10 = /* @__PURE__ */ createBaseVNode("small", {
  id: "email-help",
  class: "p-error"
}, "email not found.", -1);
const _hoisted_11 = { class: "p-field mb-3" };
const _hoisted_12 = /* @__PURE__ */ createBaseVNode("label", {
  for: "password",
  class: "block text-900 font-medium mb-2"
}, "Password (optional)", -1);
const _hoisted_13 = /* @__PURE__ */ createBaseVNode("small", {
  id: "password-help",
  class: "p-error"
}, "password-error.", -1);
const _hoisted_14 = { class: "flex align-items-center justify-content-between mb-6" };
const _hoisted_15 = { class: "flex align-items-center" };
const _hoisted_16 = /* @__PURE__ */ createBaseVNode("label", { for: "rememberme" }, "Remember me", -1);
const _hoisted_17 = /* @__PURE__ */ createTextVNode(" Forgot password? ");
const _hoisted_18 = /* @__PURE__ */ createBaseVNode("span", { class: "text-600 font-normal text-sm" }, "OR", -1);
const _sfc_main = {
  setup(__props) {
    return (_ctx, _cache) => {
      const _component_router_link = resolveComponent("router-link");
      const _directive_shared_element = resolveDirective("shared-element");
      return withDirectives((openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("div", _hoisted_2, [
          createBaseVNode("div", _hoisted_3, [
            _hoisted_4,
            _hoisted_5,
            createVNode(_component_router_link, {
              to: { name: "user:signUp" },
              class: "font-medium no-underline ml-2 text-blue-500 cursor-pointer"
            }, {
              default: withCtx(() => [
                _hoisted_6
              ]),
              _: 1
            })
          ]),
          unref(isClientSide) ? (openBlock(), createElementBlock("div", _hoisted_7, [
            createBaseVNode("div", _hoisted_8, [
              _hoisted_9,
              createVNode(unref(script), {
                id: "email",
                type: "text",
                class: "w-full p-invalid",
                "aria-describedby": "email-help"
              }),
              _hoisted_10
            ]),
            createBaseVNode("div", _hoisted_11, [
              _hoisted_12,
              createVNode(unref(script$1), {
                id: "password",
                class: "w-full p-invalid",
                inputClass: "w-full",
                toggleMask: ""
              }),
              _hoisted_13
            ]),
            createBaseVNode("div", _hoisted_14, [
              createBaseVNode("div", _hoisted_15, [
                createVNode(unref(script$2), {
                  id: "rememberme",
                  binary: true,
                  class: "mr-2"
                }),
                _hoisted_16
              ]),
              createVNode(_component_router_link, {
                to: { name: "user:resetPassword" },
                class: "font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer"
              }, {
                default: withCtx(() => [
                  _hoisted_17
                ]),
                _: 1
              })
            ]),
            createVNode(unref(script$3), {
              label: "Sign In",
              icon: "pi pi-user",
              class: "w-full"
            }),
            createVNode(unref(script$4), {
              align: "center",
              class: "my-4"
            }, {
              default: withCtx(() => [
                _hoisted_18
              ]),
              _: 1
            }),
            createVNode(unref(script$3), {
              label: "Sign In with GitHub",
              icon: "pi pi-github",
              class: "w-full p-button-secondary mb-2"
            }),
            createVNode(unref(script$3), {
              label: "Sign In with Google",
              icon: "pi pi-google",
              class: "w-full p-button-secondary mb-1"
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
