import { a4 as useRoute, a5 as useRouter, q as resolveComponent, x as resolveDirective, o as openBlock, c as createElementBlock, F as Fragment, i as renderList, b as createBaseVNode, y as withDirectives, z as createVNode, w as withCtx, l as normalizeClass, t as toDisplayString } from "./vendor.e995dee7.js";
const _hoisted_1 = { class: "surface-card p-0 m-0 list-none flex overflow-x-auto select-none" };
const _hoisted_2 = { class: "font-medium" };
const _sfc_main = {
  setup(__props) {
    const route = useRoute();
    useRouter();
    const tabs = [{
      title: "Connected accounts",
      route: "user:connectedAccounts",
      icon: "pi-user"
    }, {
      title: "Change password",
      route: "user:changePassword",
      icon: "pi-key"
    }];
    function isActive(tab) {
      return route.name == tab.route;
    }
    return (_ctx, _cache) => {
      const _component_router_link = resolveComponent("router-link");
      const _directive_ripple = resolveDirective("ripple");
      return openBlock(), createElementBlock("ul", _hoisted_1, [
        (openBlock(), createElementBlock(Fragment, null, renderList(tabs, (tab) => {
          return createBaseVNode("li", null, [
            withDirectives(createVNode(_component_router_link, {
              to: { name: tab.route },
              class: normalizeClass(["cursor-pointer px-4 py-3 flex align-items-center border-bottom-2 hover:border-500 transition-colors transition-duration-150 p-ripple", isActive(tab) ? "border-blue-500 text-blue-500 hover:border-blue-500" : "text-700 border-transparent"]),
              style: { "text-decoration": "none" }
            }, {
              default: withCtx(() => [
                createBaseVNode("i", {
                  class: normalizeClass(["pi mr-2", tab.icon])
                }, null, 2),
                createBaseVNode("span", _hoisted_2, toDisplayString(tab.title), 1)
              ]),
              _: 2
            }, 1032, ["to", "class"]), [
              [_directive_ripple]
            ])
          ]);
        }), 64))
      ]);
    };
  }
};
export { _sfc_main as _ };
