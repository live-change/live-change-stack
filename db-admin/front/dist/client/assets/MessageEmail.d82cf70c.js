import { s as script } from "./button.esm.d105ba0e.js";
import { _ as _export_sfc } from "./index.73a97541.js";
import { c as createElementBlock, b as createBaseVNode, t as toDisplayString, z as createVNode, A as unref, F as Fragment, Y as pushScopeId, Z as popScopeId, j as createTextVNode, o as openBlock } from "./vendor.e995dee7.js";
var _imports_0 = "/images/logo128.png";
var MessageEmail_vue_vue_type_style_index_0_scoped_true_lang = "\nimg[data-v-2a961452] {\n    width: 100%;\n    max-width: 100px;\n}\n.message[data-v-2a961452] {\n    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol;\n    color: #495057;\n    font-weight: 400;\n}\npre[data-v-2a961452] {\n    border-top: 1px solid black;\n    border-bottom: 1px solid black;\n}\n";
const _withScopeId = (n) => (pushScopeId("data-v-2a961452"), n = n(), popScopeId(), n);
const _hoisted_1 = { "data-headers": "" };
const _hoisted_2 = {
  "data-html": "",
  class: "message m-6"
};
const _hoisted_3 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ createBaseVNode("p", { class: "text-lg" }, " Hello username! ", -1));
const _hoisted_4 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ createBaseVNode("p", null, " We are glad to see you have just signed up for DEMO with your email. In order to confirm that, please click the button below: ", -1));
const _hoisted_5 = /* @__PURE__ */ createTextVNode(" Or copy this address to your browser address bar:");
const _hoisted_6 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ createBaseVNode("br", null, null, -1));
const _hoisted_7 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ createBaseVNode("p", null, " Let us know in case it's not you. ", -1));
const _hoisted_8 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ createBaseVNode("p", null, [
  /* @__PURE__ */ createTextVNode(" See you soon"),
  /* @__PURE__ */ createBaseVNode("br"),
  /* @__PURE__ */ createTextVNode(" Live Change Team ")
], -1));
const _hoisted_9 = /* @__PURE__ */ _withScopeId(() => /* @__PURE__ */ createBaseVNode("img", { src: _imports_0 }, null, -1));
const _sfc_main = {
  props: {
    action: {
      type: String,
      required: true
    },
    contact: {
      type: String,
      required: true
    },
    data: {
      type: String,
      required: true
    }
  },
  setup(__props) {
    const { action, contact, data } = __props;
    const metadata = {
      from: "admin@flipchart.live",
      subject: "Confirm your email address.",
      to: contact
    };
    const linkAddress = "https://example.com/link/key";
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock(Fragment, null, [
        createBaseVNode("pre", _hoisted_1, toDisplayString(JSON.stringify(metadata, null, "  ")), 1),
        createBaseVNode("div", _hoisted_2, [
          _hoisted_3,
          _hoisted_4,
          createBaseVNode("div", null, [
            createVNode(unref(script), {
              label: "Confirm email",
              class: "p-button-lg"
            })
          ]),
          createBaseVNode("p", null, [
            _hoisted_5,
            _hoisted_6,
            createBaseVNode("a", { href: linkAddress }, toDisplayString(linkAddress))
          ]),
          _hoisted_7,
          _hoisted_8,
          _hoisted_9
        ]),
        createBaseVNode("pre", {
          class: "message",
          "data-text": ""
        }, "    Hello username!\n\n    We are glad to see you have just signed up for DEMO with your email.\n    In order to confirm that, please click link below or copy address to your browser address bar:\n\n    " + toDisplayString(linkAddress) + "\n\n    Let us know in case it's not you.\n\n    See you soon\n    Live Change Team\n  ")
      ], 64);
    };
  }
};
var MessageEmail = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-2a961452"]]);
export default MessageEmail;
