import "./divider.esm.3d885e30.js";
import { s as script$1 } from "./button.esm.d105ba0e.js";
import { o as openBlock, g as createBlock, m as mergeProps, x as resolveDirective, y as withDirectives, c as createElementBlock, b as createBaseVNode, z as createVNode, A as unref } from "./vendor.e995dee7.js";
var script = {
  name: "Textarea",
  emits: ["update:modelValue"],
  props: {
    modelValue: null,
    autoResize: Boolean
  },
  mounted() {
    if (this.$el.offsetParent && this.autoResize) {
      this.resize();
    }
  },
  updated() {
    if (this.$el.offsetParent && this.autoResize) {
      this.resize();
    }
  },
  methods: {
    resize() {
      const style = window.getComputedStyle(this.$el);
      this.$el.style.height = "auto";
      this.$el.style.height = `calc(${style.borderTopWidth} + ${style.borderBottomWidth} + ${this.$el.scrollHeight}px)`;
      if (parseFloat(this.$el.style.height) >= parseFloat(this.$el.style.maxHeight)) {
        this.$el.style.overflowY = "scroll";
        this.$el.style.height = this.$el.style.maxHeight;
      } else {
        this.$el.style.overflow = "hidden";
      }
    },
    onInput(event) {
      if (this.autoResize) {
        this.resize();
      }
      this.$emit("update:modelValue", event.target.value);
    }
  },
  computed: {
    filled() {
      return this.modelValue != null && this.modelValue.toString().length > 0;
    }
  }
};
function render(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createBlock("textarea", mergeProps({
    class: ["p-inputtextarea p-inputtext p-component", { "p-filled": $options.filled, "p-inputtextarea-resizable ": $props.autoResize }]
  }, _ctx.$attrs, {
    value: $props.modelValue,
    onInput: _cache[1] || (_cache[1] = (...args) => $options.onInput && $options.onInput(...args))
  }), null, 16, ["value"]);
}
function styleInject(css, ref) {
  if (ref === void 0)
    ref = {};
  var insertAt = ref.insertAt;
  if (!css || typeof document === "undefined") {
    return;
  }
  var head = document.head || document.getElementsByTagName("head")[0];
  var style = document.createElement("style");
  style.type = "text/css";
  if (insertAt === "top") {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }
  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}
var css_248z = "\n.p-inputtextarea-resizable {\n    overflow: hidden;\n    resize: none;\n}\n.p-fluid .p-inputtextarea {\n    width: 100%;\n}\n";
styleInject(css_248z);
script.render = render;
const _hoisted_1 = { class: "w-full lg:w-6 md:w-9" };
const _hoisted_2 = { class: "surface-card p-4 shadow-2 border-round" };
const _hoisted_3 = /* @__PURE__ */ createBaseVNode("div", { class: "text-center mb-5" }, [
  /* @__PURE__ */ createBaseVNode("div", { class: "text-900 text-3xl font-medium mb-3" }, "Account deleted")
], -1);
const _hoisted_4 = /* @__PURE__ */ createBaseVNode("div", { class: "mb-3" }, " Account has been deleted, please leave feedback why you are leaving us. ", -1);
const _hoisted_5 = { class: "flex flex-row align-items-end" };
const _sfc_main = {
  setup(__props) {
    return (_ctx, _cache) => {
      const _directive_shared_element = resolveDirective("shared-element");
      return withDirectives((openBlock(), createElementBlock("div", _hoisted_1, [
        createBaseVNode("div", _hoisted_2, [
          _hoisted_3,
          _hoisted_4,
          createVNode(unref(script), {
            class: "w-full",
            autoResize: true,
            rows: "4",
            cols: "30"
          }),
          createBaseVNode("div", _hoisted_5, [
            createVNode(unref(script$1), {
              label: "Send",
              icon: "pi pi-send",
              class: "ml-auto p-button-lg"
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
