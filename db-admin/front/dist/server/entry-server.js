"use strict";
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports[Symbol.toStringTag] = "Module";
var serverRenderer = require("vue/server-renderer");
var vue = require("vue");
var debugLib = require("debug");
var vueApi = require("@live-change/vue-api");
require("@live-change/dao");
var vueRouter = require("vue-router");
function _interopDefaultLegacy(e) {
  return e && typeof e === "object" && "default" in e ? e : { "default": e };
}
function _interopNamespace(e) {
  if (e && e.__esModule)
    return e;
  var n = { __proto__: null, [Symbol.toStringTag]: "Module" };
  if (e) {
    Object.keys(e).forEach(function(k) {
      if (k !== "default") {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function() {
            return e[k];
          }
        });
      }
    });
  }
  n["default"] = e;
  return Object.freeze(n);
}
var debugLib__default = /* @__PURE__ */ _interopDefaultLegacy(debugLib);
/**
 * vue-meta v3.0.0-alpha.9
 * (c) 2021
 * - Pim (@pimlie)
 * - All the amazing contributors
 * @license MIT
 */
async function renderMetaToString(app, ctx = {}) {
  var _a;
  if (!ctx.teleports || !ctx.teleports.head) {
    const { renderToString } = await Promise.resolve().then(function() {
      return /* @__PURE__ */ _interopNamespace(require("@vue/server-renderer"));
    });
    const teleports2 = (_a = app.config.globalProperties.$metaManager) == null ? void 0 : _a.render();
    await Promise.all(teleports2.map((teleport) => renderToString(teleport, ctx)));
  }
  const { teleports } = ctx;
  for (const target in teleports) {
    if (target.endsWith("Attrs")) {
      const str = teleports[target];
      teleports[target] = str.slice(str.indexOf(" ") + 1, str.indexOf(">"));
    }
  }
  return ctx;
}
var _export_sfc = (sfc, props) => {
  for (const [key, val] of props) {
    sfc[key] = val;
  }
  return sfc;
};
const _sfc_main$t = {
  name: "Loading",
  props: {
    what: {},
    error: {},
    name: {
      type: String,
      required: true
    }
  },
  inject: ["loadingZone"],
  data() {
    return {
      state: "loading"
    };
  },
  computed: {
    loaded() {
      return !!this.what;
    }
  },
  watch: {
    loaded(def) {
      if (def && this.state == "loading") {
        this.state = "ready";
        if (this.loadingTask) {
          this.loadingZone.finished(this.loadingTask);
          this.loadingTask = null;
        }
      }
    },
    error(error) {
      if (error && this.state == "loading") {
        this.state = "error";
        if (this.loadingTask) {
          this.loadingZone.failed(this.loadingTask, error);
          this.loadingTask = null;
        }
      }
    }
  },
  created() {
    if (this.loaded) {
      this.state = "ready";
      this.$nextTick(this.$router.loadingDone);
    } else {
      this.loadingTask = this.loadingZone.started({ name: this.name });
      if (this.loadingError) {
        this.state = "error";
        if (this.loadingTask) {
          this.loadingZone.failed(this.loadingTask, this.loadingError);
          this.loadingTask = null;
        }
      }
    }
  },
  destroyed() {
    if (this.loadingTask) {
      this.loadingZone.finished(this.loadingTask);
    }
  }
};
function _sfc_ssrRender$d(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<!--[-->`);
  if ($data.state == "ready") {
    serverRenderer.ssrRenderSlot(_ctx.$slots, "default", { value: $props.what }, null, _push, _parent);
  } else {
    _push(`<!---->`);
  }
  if ($data.state == "error") {
    serverRenderer.ssrRenderSlot(_ctx.$slots, "error", {}, () => {
      _push(`<div class="alert alert-danger" role="alert">error</div>`);
    }, _push, _parent);
  } else {
    _push(`<!---->`);
  }
  if ($data.state == "loading") {
    serverRenderer.ssrRenderSlot(_ctx.$slots, "loading", {}, null, _push, _parent);
  } else {
    _push(`<!---->`);
  }
  _push(`<!--]-->`);
}
const _sfc_setup$t = _sfc_main$t.setup;
_sfc_main$t.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("../../../live-change-framework-vue3/vue3-components/logic/Loading.vue");
  return _sfc_setup$t ? _sfc_setup$t(props, ctx) : void 0;
};
var Loading = /* @__PURE__ */ _export_sfc(_sfc_main$t, [["ssrRender", _sfc_ssrRender$d]]);
const info$1 = debugLib__default["default"]("loading:info");
const debug$2 = debugLib__default["default"]("loading:debug");
const _sfc_main$s = {
  name: "LoadingZone",
  props: {
    suspense: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      loading: [],
      loadingBlockId: 0,
      connectionProblem: false
    };
  },
  setup() {
    const errors = vue.reactive([]);
    vue.onErrorCaptured((e) => {
      errors.push({ task: { name: "vue" }, reason: e });
      return true;
    });
    return {
      errors
    };
  },
  computed: {},
  methods: {
    loadingStarted(task) {
      if (this.loading.length == 0) {
        if (this.$analytics && this.$analytics.loadingStarted)
          this.$analytics.loadingStarted({ task: task.name });
        info$1("LOADING STARTED!");
        const loadingBlockId = this.loadingBlockId;
        this.loagindTimeout = setTimeout(() => {
          if (loadingBlockId == this.loadingBlockId && this.loading.length > 0) {
            this.connectionProblem = true;
            if (this.$analytics && this.$analytics.loadingError)
              this.$analytics.loadingError({
                task: "View loading",
                reason: "connection problem",
                tasks: this.loading.map((t) => t.name)
              });
          }
        }, 4e3);
      }
      debug$2(`task started ${task.name}`);
      this.loading.push(task);
      if (this.$allLoadingTasks)
        this.$allLoadingTasks.push(task);
      return task;
    },
    loadingFinished(task) {
      let id = this.loading.indexOf(task);
      debug$2(`task finished ${task.name}`);
      if (id == -1)
        throw new Error("Task not found");
      this.loading.splice(id, 1);
      if (this.$allLoadingTasks)
        this.$allLoadingTasks.splice(this.$allLoadingTasks.indexOf(task), 1);
      if (this.loading.length == 0) {
        this.loadingBlockId++;
        clearTimeout(this.loadingTimeout);
        if (this.$analytics && this.$analytics.loadingDone)
          this.$analytics.loadingDone({ task: task.name });
        this.$nextTick(this.$router.loadingDone);
      }
    },
    loadingFailed(task, reason) {
      debug$2(`task failed ${task.name} because ${reason}`);
      this.loadingBlockId++;
      clearTimeout(this.loadingTimeout);
      this.errors.push({ task, reason });
      if (this.$analytics && this.$analytics.loadingError) {
        this.$analytics.loadingError({ task: task.name, reason });
      }
      let id = this.loading.indexOf(task);
      if (id == -1) {
        this.errors.push({ task, reason: "unknown task " + task.name });
        throw new Error("Task not found");
      }
      this.loading.splice(id, 1);
      if (this.$allLoadingTasks)
        this.$allLoadingTasks.splice(this.$allLoadingTasks.indexOf(task), 1);
      if (this.$allLoadingErrors)
        this.$allLoadingErrors.push({ task, reason });
    },
    addLoadingPromise(name, promise) {
      let task = this.loadingStarted({ name, promise });
      promise.catch((reason) => {
        console.error("LOADING OF", name, "FAILED", reason);
        this.loadingFailed(task, reason);
      });
      promise.then((result) => this.loadingFinished(task));
      return promise;
    }
  },
  provide() {
    return {
      loadingZone: {
        started: (task) => this.loadingStarted(task),
        finished: (task) => this.loadingFinished(task),
        failed: (task, reason) => this.loadingFailed(task, reason),
        addPromise: (name, promise) => this.addLoadingPromise(name, promise)
      }
    };
  },
  beforeUnmount() {
    for (let task of this.loading) {
      if (this.$allLoadingTasks)
        this.$allLoadingTasks.splice(this.$allLoadingTasks.indexOf(task), 1);
    }
  }
};
function _sfc_ssrRender$c(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<!--[-->`);
  if ($props.suspense) {
    serverRenderer.ssrRenderSuspense(_push, {
      default: () => {
        _push(`<div>`);
        serverRenderer.ssrRenderSlot(_ctx.$slots, "default", { isLoading: !!$data.loading.length, loading: $data.loading, errors: $setup.errors }, null, _push, _parent);
        if ($data.loading.length && !$setup.errors.length) {
          serverRenderer.ssrRenderSlot(_ctx.$slots, "loading", {}, () => {
            _push(` Loading... `);
          }, _push, _parent);
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
      },
      fallback: () => {
        _push(`<div>`);
        serverRenderer.ssrRenderSlot(_ctx.$slots, "loading", {}, () => {
          _push(` Loading... `);
        }, _push, _parent);
        _push(`</div>`);
      },
      _: 3
    });
  } else {
    serverRenderer.ssrRenderSlot(_ctx.$slots, "default", { isLoading: !!$data.loading.length, loading: $data.loading, errors: $setup.errors }, null, _push, _parent);
  }
  if ($setup.errors.length) {
    serverRenderer.ssrRenderSlot(_ctx.$slots, "error", { errors: $setup.errors }, () => {
      _push(`<h1>Loading errors!</h1><ol><!--[-->`);
      serverRenderer.ssrRenderList($setup.errors, (error) => {
        _push(`<li class="error"> Loading of <b>${serverRenderer.ssrInterpolate(error.task.name)}</b> failed because of error <b>${serverRenderer.ssrInterpolate(error.reason)}</b></li>`);
      });
      _push(`<!--]--></ol>`);
    }, _push, _parent);
  } else {
    _push(`<!---->`);
  }
  _push(`<!--]-->`);
}
const _sfc_setup$s = _sfc_main$s.setup;
_sfc_main$s.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("../../../live-change-framework-vue3/vue3-components/logic/LoadingZone.vue");
  return _sfc_setup$s ? _sfc_setup$s(props, ctx) : void 0;
};
var LoadingZone = /* @__PURE__ */ _export_sfc(_sfc_main$s, [["ssrRender", _sfc_ssrRender$c]]);
const info = debugLib__default["default"]("working:info");
const debug$1 = debugLib__default["default"]("working:debug");
const _sfc_main$r = {
  name: "WorkingZone",
  data() {
    return {
      working: [],
      errors: [],
      workingBlockId: 0,
      connectionProblem: false
    };
  },
  computed: {},
  methods: {
    workingStarted(task) {
      if (this.working.length == 0) {
        if (this.$analytics && this.$analytics.workingStarted)
          this.$analytics.workingStarted({ task: task.name });
        info("WORKING STARTED!");
        const workingBlockId = this.workingBlockId;
        this.loagindTimeout = setTimeout(() => {
          if (workingBlockId == this.workingBlockId && this.working.length > 0) {
            this.connectionProblem = true;
            if (this.$analytics && this.$analytics.workingError)
              this.$analytics.workingError({
                task: "View working",
                reason: "connection problem",
                tasks: this.working.map((t) => t.name)
              });
          }
        }, 4e3);
      }
      debug$1(`task started ${task.name}`);
      this.working.push(task);
      if (this.$allWorkingTasks)
        this.$allWorkingTasks.push(task);
      return task;
    },
    workingFinished(task) {
      let id = this.working.indexOf(task);
      debug$1(`task finished ${task.name}`);
      if (id == -1)
        throw new Error("Task not found");
      this.working.splice(id, 1);
      if (this.$allWorkingTasks)
        this.$allWorkingTasks.splice(this.$allWorkingTasks.indexOf(task), 1);
      if (this.working.length == 0) {
        this.workingBlockId++;
        clearTimeout(this.workingTimeout);
        if (this.$analytics && this.$analytics.workingDone)
          this.$analytics.workingDone({ task: task.name });
        this.$nextTick(this.$router.workingDone);
      }
    },
    workingFailed(task, reason) {
      debug$1(`task failed ${task.name} because ${reason}`);
      this.workingBlockId++;
      clearTimeout(this.workingTimeout);
      this.errors.push({ task, reason });
      if (this.$analytics && this.$analytics.workingError)
        this.$analytics.workingError({ task: task.name, reason });
      let id = this.working.indexOf(task);
      if (id == -1) {
        this.errors.push({ task, reason: "unknown task " + task.name });
        throw new Error("Task not found");
      }
      this.working.splice(id, 1);
      if (this.$allWorkingTasks)
        this.$allWorkingTasks.splice(this.$allWorkingTasks.indexOf(task), 1);
      if (this.$allWorkingErrors)
        this.$allWorkingErrors.push({ task, reason });
    },
    addWorkingPromise(name, promise) {
      let task = this.workingStarted({ name, promise });
      promise.catch((reason) => {
        console.error("WORKING OF", name, "FAILED", reason);
        this.workingFailed(task, reason);
      });
      promise.then((result) => this.workingFinished(task));
      return promise;
    }
  },
  provide() {
    return {
      workingZone: {
        started: (task) => this.workingStarted(task),
        finished: (task) => this.workingFinished(task),
        failed: (task, reason) => this.workingFailed(task, reason),
        addPromise: (name, promise) => this.addWorkingPromise(name, promise)
      }
    };
  },
  beforeUnmount() {
    for (let task of this.working) {
      if (this.$allWorkingTasks)
        this.$allWorkingTasks.splice(this.$allWorkingTasks.indexOf(task), 1);
    }
  }
};
function _sfc_ssrRender$b(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<!--[-->`);
  serverRenderer.ssrRenderSlot(_ctx.$slots, "default", { isWorking: !!$data.working.length, working: $data.working, errors: $data.errors }, null, _push, _parent);
  if ($data.working.length && !$data.errors.length) {
    serverRenderer.ssrRenderSlot(_ctx.$slots, "working", {}, () => {
      _push(` Processing... `);
    }, _push, _parent);
  } else {
    _push(`<!---->`);
  }
  if ($data.errors.length) {
    serverRenderer.ssrRenderSlot(_ctx.$slots, "error", { errors: $data.errors }, () => {
      _push(`<h1>Processing errors!</h1><ol><!--[-->`);
      serverRenderer.ssrRenderList($data.errors, (error) => {
        _push(`<li class="error"> Processing of <b>${serverRenderer.ssrInterpolate(error.task.name)}</b> failed because of error <b>${serverRenderer.ssrInterpolate(error.reason)}</b></li>`);
      });
      _push(`<!--]--></ol>`);
    }, _push, _parent);
  } else {
    _push(`<!---->`);
  }
  _push(`<!--]-->`);
}
const _sfc_setup$r = _sfc_main$r.setup;
_sfc_main$r.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("../../../live-change-framework-vue3/vue3-components/logic/WorkingZone.vue");
  return _sfc_setup$r ? _sfc_setup$r(props, ctx) : void 0;
};
var WorkingZone = /* @__PURE__ */ _export_sfc(_sfc_main$r, [["ssrRender", _sfc_ssrRender$b]]);
const _sfc_main$q = {
  name: "Observe",
  props: {
    tag: {
      default: ""
    },
    what: {
      required: true
    },
    name: {},
    noLoadingZone: {
      type: Boolean
    }
  },
  inject: ["loadingZone"],
  data() {
    return {};
  },
  reactive: {
    value() {
      return this.what;
    }
  },
  computed: {
    computedName() {
      if (this.name)
        return this.name;
      return JSON.stringify(this.what);
    },
    error() {
      return this.valueError;
    },
    state() {
      if (this.error)
        return "error";
      if (this.value === void 0)
        return "loading";
      return "ready";
    }
  },
  watch: {
    state(state) {
      if (this.noLoadingZone)
        return;
      if (state == "ready" && this.loadingTask) {
        this.loadingZone.finished(this.loadingTask);
        this.loadingTask = null;
      }
      if (state == "error") {
        if (!this.loadingTask) {
          this.loadingTask = this.loadingZone.started({ name: this.computedName });
        }
        this.loadingZone.failed(this.loadingTask, this.error);
        this.loadingTask = null;
      }
    }
  },
  created() {
    if (this.noLoadingZone)
      return;
    if (this.state != "ready") {
      this.loadingTask = this.loadingZone.started({ name: this.computedName });
      if (this.error) {
        this.loadingZone.failed(this.loadingTask, this.error);
        this.loadingTask = null;
      }
    }
  },
  beforeUnmount() {
    if (this.noLoadingZone)
      return;
    if (this.loadingTask) {
      this.loadingZone.finished(this.loadingTask);
    }
  }
};
function _sfc_ssrRender$a(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<!--[-->`);
  if ($props.tag) {
    serverRenderer.ssrRenderVNode(_push, vue.createVNode(vue.resolveDynamicComponent($props.tag), _attrs, {
      default: vue.withCtx((_, _push2, _parent2, _scopeId) => {
        if (_push2) {
          if ($options.state == "ready") {
            serverRenderer.ssrRenderSlot(_ctx.$slots, "default", { value: _ctx.value }, null, _push2, _parent2, _scopeId);
          } else {
            _push2(`<!---->`);
          }
          if ($options.state == "error") {
            serverRenderer.ssrRenderSlot(_ctx.$slots, "error", {}, () => {
              _push2(`<div class="alert alert-danger" role="alert"${_scopeId}>error</div>`);
            }, _push2, _parent2, _scopeId);
          } else {
            _push2(`<!---->`);
          }
          if ($options.state == "loading") {
            serverRenderer.ssrRenderSlot(_ctx.$slots, "loading", {}, null, _push2, _parent2, _scopeId);
          } else {
            _push2(`<!---->`);
          }
        } else {
          return [
            $options.state == "ready" ? vue.renderSlot(_ctx.$slots, "default", vue.mergeProps({ key: 0 }, { value: _ctx.value })) : vue.createCommentVNode("", true),
            $options.state == "error" ? vue.renderSlot(_ctx.$slots, "error", { key: 1 }, () => [
              vue.createVNode("div", {
                class: "alert alert-danger",
                role: "alert"
              }, "error")
            ]) : vue.createCommentVNode("", true),
            $options.state == "loading" ? vue.renderSlot(_ctx.$slots, "loading", { key: 2 }) : vue.createCommentVNode("", true)
          ];
        }
      }),
      _: 3
    }), _parent);
  } else {
    _push(`<!---->`);
  }
  if (!$props.tag && $options.state == "ready") {
    serverRenderer.ssrRenderSlot(_ctx.$slots, "default", { value: _ctx.value }, null, _push, _parent);
  } else {
    _push(`<!---->`);
  }
  if (!$props.tag && $options.state == "error") {
    serverRenderer.ssrRenderSlot(_ctx.$slots, "error", {}, () => {
      _push(`<div class="alert alert-danger" role="alert">error</div>`);
    }, _push, _parent);
  } else {
    _push(`<!---->`);
  }
  if (!$props.tag && $options.state == "loading") {
    serverRenderer.ssrRenderSlot(_ctx.$slots, "loading", {}, null, _push, _parent);
  } else {
    _push(`<!---->`);
  }
  _push(`<!--]-->`);
}
const _sfc_setup$q = _sfc_main$q.setup;
_sfc_main$q.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("../../../live-change-framework-vue3/vue3-components/logic/Observe.vue");
  return _sfc_setup$q ? _sfc_setup$q(props, ctx) : void 0;
};
var Observe = /* @__PURE__ */ _export_sfc(_sfc_main$q, [["ssrRender", _sfc_ssrRender$a]]);
function registerLogicComponents(app) {
  app.component("loading", Loading);
  app.component("loading-zone", LoadingZone);
  app.component("working-zone", WorkingZone);
  app.component("observe", Observe);
}
function getElementPositionInDocument(element) {
  let o = element;
  let x = 0;
  let y = 0;
  while (true) {
    x += o.offsetLeft;
    y += o.offsetTop;
    if (window.getComputedStyle(o).position == "fixed") {
      return { x, y };
    }
    o = o.offsetParent;
    if (!o) {
      return {
        x: x || 0,
        y: y || 0
      };
    }
    if (o.scrollLeft)
      x -= o.scrollLeft;
    if (o.scrollTop)
      y -= o.scrollTop;
  }
}
function getScrollParent(element, includeHidden) {
  let style = getComputedStyle(element);
  const excludeStaticParent = style.position === "absolute";
  const overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/;
  if (style.position === "fixed")
    return document.body;
  for (let parent = element; parent = parent.parentElement; ) {
    style = getComputedStyle(parent);
    if (excludeStaticParent && style.position === "static")
      continue;
    if (overflowRegex.test(style.overflow + style.overflowY + style.overflowX))
      return parent;
  }
  return document.body;
}
const errorSufix = "Error";
class FormValue {
  constructor(definition, component, data, property) {
    this.definition = definition;
    this.component = component;
    this.data = data;
    this.property = property;
    if (!this.component)
      throw new Error("no component parameter");
    this.validators = [];
    if (definition.validation) {
      let validations = Array.isArray(definition.validation) ? definition.validation : [definition.validation];
      const context = {
        service: this.serviceDefinition,
        action: this.actionDefinition,
        property: definition,
        validators: component.$validators
      };
      const getValidator = (validation) => {
        if (typeof validation == "string") {
          const validator = component.$validators[validation];
          if (typeof validator != "function")
            throw new Error(`Validator ${validation} not found`);
          return validator({}, context);
        } else {
          const validator = component.$validators[validation.name];
          if (typeof validator != "function")
            throw new Error(`Validator ${JSON.stringify(validation)} not found`);
          return validator(validation, context);
        }
      };
      context.getValidator = getValidator;
      this.validators = this.validators.concat(validations.map((validation) => getValidator(validation)));
    }
  }
  setValue(value) {
    this.data[this.property] = value;
  }
  getAnalyticsValue() {
    if (this.definition.secret)
      return void 0;
    return this.data[this.property];
  }
  getValue() {
    return this.data[this.property];
  }
  setError(error) {
    this.data[this.property + errorSufix] = error;
  }
  getError() {
    return this.data[this.property + errorSufix];
  }
  setProperty(name) {
    this.property = name;
  }
  reset(initialValue) {
    if (this.definition.type) {
      let defaultValue = this.definition.defaulValue || null;
      if (!defaultValue) {
        switch (this.definition.type) {
          case "String":
            defaultValue = "";
            break;
          case "Object":
            defaultValue = {};
            break;
          case "Number":
            defaultValue = 0;
            break;
          case "Array":
            defaultValue = [];
            break;
        }
      }
      this.setValue(initialValue || defaultValue);
    } else {
      this.setValue(initialValue);
    }
    this.setError(null);
  }
  afterError(initialValue) {
    if (this.definition.singleUse)
      this.reset(initialValue);
  }
  validate(context) {
    let promises = [];
    const value = this.getValue();
    for (let validator of this.validators) {
      promises.push(validator(value, context));
    }
    return Promise.all(promises).then((results) => {
      for (let error of results) {
        if (error) {
          if (this.data[this.property + errorSufix] == error)
            return error;
          this.setError(error);
          return error;
        }
      }
    });
  }
  clearValidation() {
    this.setError(null);
  }
}
class FormObject extends FormValue {
  constructor(definition, component, data, property) {
    super(definition, component, data, property);
    this.object = this.data[this.property];
    this.properties = {};
    for (let propName in definition.properties) {
      let propDefn = definition.properties[propName];
      if (propDefn.type == "Object") {
        this.properties[propName] = new FormObject(definition.properties[propName], this.component, this.object, propName);
      } else if (propDefn.type == "Array") {
        this.properties[propName] = new FormArray(definition.properties[propName], this.component, this.object, propName);
      } else {
        this.properties[propName] = new FormValue(definition.properties[propName], this.component, this.object, propName);
      }
    }
  }
  setProperty(name) {
    this.property = name;
    this.object = this.data[this.property];
  }
  reset(initialValue) {
    if (this.definition.type == "Object") {
      this.data[this.property] = JSON.parse(JSON.stringify(initialValue || (this.definition.hasOwnProperty("defaultValue") ? this.definition.defaultValue : {})));
      this.object = this.data[this.property];
      if (this.object) {
        for (const key in this.object) {
          if (!this.object[key])
            delete this.object[key];
        }
      }
    }
    if (this.object) {
      for (let propName in this.properties) {
        this.properties[propName].reset(initialValue && initialValue[propName]);
      }
    }
  }
  afterError(initialValue) {
    if (this.definition.singleUse)
      return this.reset();
    for (let propName in this.properties) {
      this.properties[propName].afterError(initialValue && initialValue[propName]);
    }
  }
  validate(context) {
    let promises = [super.validate(context).then((error) => ["root", error])];
    for (let propName in this.properties) {
      if (context.parameters && context.parameters[propName])
        continue;
      promises.push(this.properties[propName].validate(__spreadProps(__spreadValues({}, context), {
        propName: context.propName ? context.propName + "." + propName : propName
      })).then((error) => [propName, error]));
    }
    return Promise.all(promises).then((results) => {
      let anyError = false;
      let errors = {};
      for (let [propName, error] of results) {
        if (error) {
          anyError = true;
          errors[propName] = errors[propName] || error;
        }
      }
      return anyError && errors;
    });
  }
  clearValidation() {
    super.clearValidation();
    for (let propName in this.properties) {
      this.properties[propName].clearValidation();
    }
  }
  getValue() {
    let obj = __spreadValues({}, this.value);
    for (let propName in this.properties) {
      obj[propName] = this.properties[propName].getValue();
    }
    return obj;
  }
  getAnalyticsValue() {
    if (this.definition.secret)
      return {};
    let obj = __spreadValues({}, this.value);
    for (let propName in this.properties) {
      obj[propName] = this.properties[propName].getAnalyticsValue();
    }
    return obj;
  }
  setValue(value) {
    this.value = value;
    for (let propName in this.properties) {
      this.properties[propName].setValue(value && value[propName]);
    }
  }
  setDefinition(propName, defn) {
    const oldData = this.object[propName];
    this.definition = JSON.parse(JSON.stringify(this.definition));
    const propDefn = JSON.parse(JSON.stringify(defn));
    this.definition.properties[propName] = propDefn;
    const definition = this.definition;
    if (propDefn.type == "Object") {
      this.properties[propName] = new FormObject(definition.properties[propName], this.component, this.object, propName);
    } else if (propDefn.type == "Array") {
      this.properties[propName] = new FormArray(definition.properties[propName], this.component, this.object, propName);
    } else {
      this.properties[propName] = new FormValue(definition.properties[propName], this.component, this.object, propName);
    }
    this.properties[propName].reset(oldData);
    this.object[propName] = this.properties[propName].getValue();
  }
}
class FormArray extends FormValue {
  constructor(definition, component, data, property) {
    super(definition, component, data, property);
    this.elementDefinition = definition.of;
    this.elements = [];
    this.object = this.data[this.property];
  }
  setProperty(name) {
    this.property = name;
    this.object = this.data[this.property];
  }
  newElement(index) {
    if (this.elementDefinition.type == "Object") {
      return new FormObject(this.elementDefinition, this.component, this.object, index);
    } else if (this.elementDefinition.type == "Array") {
      return new FormArray(this.elementDefinition, this.component, this.object, index);
    } else {
      return new FormValue(this.elementDefinition, this.component, this.object, index);
    }
  }
  reset(initialValue) {
    initialValue = initialValue || this.definition.defaultValue || [];
    this.data[this.property] = new Array(initialValue.length);
    this.elements = this.data[this.property];
    for (let i = 0; i < initialValue.length; i++) {
      let n = this.newElement(this.elements.length);
      n.reset(initialValue[i]);
      this.elements.push(n);
    }
    super.setValue(initialValue);
  }
  afterError(initialValue) {
    if (this.definition.singleUse)
      return this.reset();
    for (let i = 0; i < this.elements.length; i++) {
      this.elements[i].afterError(initialValue && initialValue[i]);
    }
  }
  validate(context) {
    let promises = [super.validate(context)];
    for (let propName in this.elements) {
      promises.push(this.elements[propName].validate(__spreadProps(__spreadValues({}, context), { propName: context.propName + "." + propName })));
    }
    return Promise.all(promises).then((results) => {
      let anyError = false;
      for (let i = 0; i < results.length; i++) {
        const error = results[i];
        if (error) {
          anyError = true;
        }
      }
      return anyError && results;
    });
  }
  clearValidation() {
    super.clearValidation();
    for (let element of this.elements) {
      element.clearValidation();
    }
  }
  getValue() {
    let arr = new Array(this.elements.length);
    arr.length = this.elements.length;
    for (let i = 0; i < this.elements.length; i++) {
      arr[i] = this.elements[i].getValue();
    }
    return arr;
  }
  getAnalyticsValue() {
    if (this.definition.secret)
      return [];
    let arr = new Array(this.elements.length);
    arr.length = this.elements.length;
    for (let i = 0; i < this.elements.length; i++) {
      arr[i] = this.elements[i].getAnalyticsValue();
    }
    return arr;
  }
  setValue(value) {
    this.data[this.property] = value;
    if (!value)
      return;
    for (let i = 0; i < value.length; i++) {
      if (this.elements[i]) {
        this.elements[i].setValue(value[i]);
      } else {
        let n = this.newElement();
        n.reset(value[i]);
        this.elements.push(n);
      }
    }
    this.elements = this.elements.slice(0, value.length);
  }
  updateElementIndices() {
    for (let i = 0; i < this.elements.length; i++) {
      if (this.elements[i].property != i) {
        this.elements[i].setProperty(i);
      }
    }
  }
  addElement(initialValue) {
    let el = this.newElement();
    el.reset(initialValue);
    this.elements.push(el);
  }
  removeElement(i) {
    this.elements.splice(i, 1);
    this.updateElementIndices();
  }
}
const _sfc_main$p = {
  name: "DefinedForm",
  props: {
    tag: {
      type: String,
      required: false,
      default: "form"
    },
    definition: {
      type: Object,
      required: true
    },
    initialValues: {
      type: Object,
      default: null
    },
    provided: {
      type: Object,
      default: null
    },
    parameters: {
      type: Object,
      default: null
    },
    class: {
      type: String
    },
    style: {
      type: String
    }
  },
  provide() {
    return {
      form: __spreadProps(__spreadValues({}, this.provided), {
        getFieldDefinition: (name) => this.getFieldDefinition(name),
        setFieldDefinition: (name, definition) => this.setFieldDefinition(name, definition),
        getFieldValidators: (name) => this.getFieldValidators(name),
        getFieldValue: (name) => this.getFieldValue(name),
        setFieldValue: (name, value) => this.setFieldValue(name, value),
        getFieldError: (name) => this.getFieldError(name),
        setFieldError: (name, value) => this.setFieldError(name, value),
        getValue: () => this.formRoot.getValue(),
        reset: () => this.reset(),
        addValidator: (propName, validator) => this.addValidator(propName, validator),
        removeValidator: (propName, validator) => this.addValidator(propName, validator),
        validateField: (propName) => this.validateField(propName),
        validate: () => this.validate(),
        clearFieldValidation: (propName) => this.clearFieldValidation(propName),
        clearValidation: () => this.clearValidation(),
        addElementToArray: (propName, initialValue) => this.addElementToArray(propName, initialValue),
        removeElementFromArray: (propName, index) => this.removeElementFromArray(propName, index)
      })
    };
  },
  inject: ["loadingZone", "workingZone"],
  data() {
    return {
      state: "starting",
      data: {},
      formRoot: {}
    };
  },
  computed: {
    rootValue() {
      return this.formRoot && this.formRoot.value;
    }
  },
  methods: {
    getNode(name) {
      let np = name.split(".");
      let node = this.formRoot;
      for (let p of np) {
        if (node.properties)
          node = node.properties[p];
        else if (node.elements)
          node = node.elements[p];
        if (!node)
          throw new Error(`form field ${name} not found`);
      }
      return node;
    },
    getNodeIfExists(name) {
      let np = name.split(".");
      let node = this.formRoot;
      for (let p of np) {
        if (node.properties)
          node = node.properties[p];
        else if (node.elements)
          node = node.elements[p];
        if (!node)
          return node;
      }
      return node;
    },
    getFieldDefinition(name) {
      return this.getNode(name).definition;
    },
    setFieldDefinition(name, definition) {
      const sep = name.lastIndexOf(".");
      const parentName = sep > 0 ? name.slice(0, sep) : null;
      const propName = sep > 0 ? name.slice(sep + 1) : name;
      return (parentName ? this.getNode(parentName) : this.formRoot).setDefinition(propName, definition);
    },
    getFieldValidators(name) {
      return this.getNode(name).validators;
    },
    getFieldValue(name) {
      return this.getNode(name).getValue();
    },
    setFieldValue(name, value) {
      this.getNode(name).setValue(value);
    },
    getFieldError(name) {
      return this.getNode(name).error;
    },
    setFieldError(name, error) {
      return this.getNode(name).setError(error);
    },
    initForm() {
      this.formRoot = new FormObject(this.definition, this, this, "data");
      this.reset();
    },
    reset() {
      this.formRoot.reset(this.initialValues);
    },
    addValidator(name, validator) {
      this.getNode(name).validators.push(validator);
    },
    removeValidator(name, validator) {
      let validators = this.getNode(name).validators;
      let id = validators.indexOf(validator);
      if (id == -1)
        throw new Error("validator not found");
      validators.splice(id);
    },
    validateField(name) {
      return this.getNode(name).validate(this.formRoot.properties, name, this.definition);
    },
    validate(context) {
      context = __spreadProps(__spreadValues(__spreadValues({}, context || { parameters: this.parameters }), this.provided), {
        source: this.definition,
        props: this.formRoot.getValue(),
        form: this
      });
      return this.formRoot.validate(context);
    },
    clearFieldValidation(name) {
      this.getNode(name).clearValidation();
    },
    clearValidation() {
      this.formRoot.clearValidation();
    },
    addElementToArray(propName, initialValue) {
      this.getNode(propName).addElement(initialValue);
    },
    removeElementFromArray(propName, index) {
      this.getNode(propName).removeElement(index);
    },
    scrollToError() {
      let errorFieldElement = this.$el.querySelector(".formFieldError");
      if (!errorFieldElement)
        return;
      let position = getElementPositionInDocument(errorFieldElement);
      window.scrollTo(0, position.y - 100);
    }
  },
  created() {
    this.initForm();
    this.state = "ready";
  },
  unmounted() {
  },
  watch: {
    rootValue(newValue) {
      this.$emit("update", newValue);
    }
  }
};
function _sfc_ssrRender$9(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  if ($props.tag) {
    serverRenderer.ssrRenderVNode(_push, vue.createVNode(vue.resolveDynamicComponent($props.tag), vue.mergeProps({
      class: $props.class,
      style: $props.style
    }, _attrs), {
      default: vue.withCtx((_, _push2, _parent2, _scopeId) => {
        if (_push2) {
          serverRenderer.ssrRenderSlot(_ctx.$slots, "default", { data: $data.data }, null, _push2, _parent2, _scopeId);
        } else {
          return [
            vue.renderSlot(_ctx.$slots, "default", { data: $data.data })
          ];
        }
      }),
      _: 3
    }), _parent);
  } else {
    serverRenderer.ssrRenderSlot(_ctx.$slots, "default", { data: $data.data }, null, _push, _parent);
  }
}
const _sfc_setup$p = _sfc_main$p.setup;
_sfc_main$p.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("../../../live-change-framework-vue3/vue3-components/form/DefinedForm.vue");
  return _sfc_setup$p ? _sfc_setup$p(props, ctx) : void 0;
};
var DefinedForm = /* @__PURE__ */ _export_sfc(_sfc_main$p, [["ssrRender", _sfc_ssrRender$9]]);
const debug = debugLib__default["default"]("live-change/command-form");
const _sfc_main$o = {
  name: "CommandForm",
  components: { DefinedForm },
  props: {
    service: {
      type: String,
      required: true
    },
    serviceDefinitionSource: {
      type: String,
      default: null
    },
    action: {
      type: String,
      required: true
    },
    parameters: {
      type: Object,
      default() {
        return {};
      }
    },
    initialValues: {
      type: Object,
      default: null
    },
    ignoreError: {
      default: false
    },
    externalErrorsProcessing: {
      type: Boolean,
      default: false
    },
    resetOnDone: {
      type: Boolean,
      default: false
    },
    keepOnDone: {
      type: Boolean,
      default: false
    },
    formTag: {
      type: String,
      default: "form"
    },
    class: {
      type: String
    },
    style: {
      type: String
    }
  },
  inject: ["loadingZone", "workingZone"],
  data() {
    return {
      state: "loading",
      error: null,
      loadingTask: null
    };
  },
  computed: {
    serviceDefinitionsError() {
      return this.$api.metadata.serviceDefinitionsError;
    },
    serviceDefinition() {
      var _a, _b;
      if (this.serviceDefinitionSource) {
        if (typeof this.serviceDefinitionSource == "string") {
          const definition2 = this.$api.metadata.serviceDefinitions.find((service) => service.name == this.serviceDefinitionSource);
          return definition2;
        } else {
          return this.serviceDefinitionSource;
        }
      }
      if (!((_a = this.$api.metadata.api) == null ? void 0 : _a.services))
        return;
      const definition = (_b = this.$api.metadata.api) == null ? void 0 : _b.services.find((service) => service.name == this.service);
      return definition;
    },
    actionDefinition() {
      return this.serviceDefinition && this.serviceDefinition.actions[this.action];
    },
    definitionNotFound() {
      return this.$api.metadata.serviceDefinitions && !this.serviceDefinition || this.serviceDefinition && !this.actionDefinition;
    },
    loadingError() {
      return this.definitionNotFound ? "notFound" : this.serviceDefinitionsError;
    }
  },
  methods: {
    getNode(name) {
      return this.$refs.defined.getNode(name);
    },
    getNodeIfExists(name) {
      return this.$refs.defined.getNodeIfExists(name);
    },
    getFieldDefinition(name) {
      return this.$refs.defined.getFieldDefinition(name);
    },
    setFieldDefinition(name, definition) {
      return this.$refs.defined.setFieldDefinition(name, definition);
    },
    getFieldValidators(name) {
      return this.getNode(name).validators;
    },
    getFieldValue(name) {
      return this.getNode(name).getValue();
    },
    setFieldValue(name, value) {
      return this.getNode(name).setValue(value);
    },
    getFieldError(name) {
      return this.getNode(name).error;
    },
    setFieldError(name, error) {
      return this.getNode(name).setError(error);
    },
    getAction() {
      return this.actionDefinition;
    },
    reset() {
      this.$refs.defined.reset();
    },
    observe(name, observer) {
      this.getNode(name).observe(observer);
    },
    unobserve(name, observer) {
      const node = this.getNodeIfExists(name);
      if (node)
        node.unobserve(observer);
    },
    observeError(name, observer) {
      this.getNode(name).observeError(observer);
    },
    unobserveError(name, observer) {
      const node = this.getNodeIfExists(name);
      if (node)
        node.unobserveError(observer);
    },
    addValidator(name, validator) {
      this.getNode(name).validators.push(validator);
    },
    removeValidator(name, validator) {
      let validators = this.getNode(name).validators;
      let id = validators.indexOf(validator);
      if (id == -1)
        throw new Error("validator not found");
      validators.splice(id);
    },
    validateField(name) {
      return this.getNode(name).validate(this.$refs.defined.formRoot.properties, name, this.actionDefinition);
    },
    validate(context) {
      return this.$refs.defined.validate(context);
    },
    clearFieldValidation(name) {
      this.getNode(name).clearValidation();
    },
    clearValidation() {
      this.$refs.defined.clearValidation();
    },
    addElementToArray(propName, initialValue) {
      this.getNode(propName).addElement(initialValue);
    },
    removeElementFromArray(propName, index) {
      this.getNode(propName).removeElement(index);
    },
    scrollToError() {
      this.$refs.defined.scrollToError();
    },
    async submit(additionalParameters) {
      if (!(this.state == "ready" || this.state == "error"))
        return;
      this.state = "working";
      this.workingTask = this.workingZone.started({ name: `service ${this.service} action ${this.action}` });
      this.clearValidation();
      const _commandId = this.$api.guid();
      const analyticsValue = this.$refs.defined.formRoot.getAnalyticsValue();
      const analyticsParameters = __spreadProps(__spreadValues(__spreadValues(__spreadValues({}, analyticsValue), this.parameters), additionalParameters || {}), { _commandId });
      if (this.$analytics && this.$analytics.form)
        this.$analytics.form(this.service, this.action, analyticsParameters);
      return this.validate({ parameters: __spreadValues(__spreadValues({}, this.parameters), additionalParameters) }).then((validationError) => {
        debug("VALIDATION ERROR?", validationError);
        if (validationError) {
          if (this.$analytics && this.$analytics.formError)
            this.$analytics.formError(this.service, this.action, { analyticsParameters, error: validationError });
          this.workingZone.finished(this.workingTask);
          this.state = "ready";
          this.scrollToError();
          return;
        }
        let parameters = this.$refs.defined.formRoot.getValue();
        parameters = __spreadProps(__spreadValues(__spreadValues(__spreadValues({}, parameters), this.parameters), additionalParameters || {}), { _commandId });
        debug("SUBMIT DATA:\n" + JSON.stringify(parameters, null, "  "));
        this.$emit("submit", { parameters });
        return this.$api.request([this.service, this.action], parameters).then((result) => {
          debug("DATA SUBMITED");
          if (this.$analytics && this.$analytics.formDone)
            this.$analytics.formDone(this.service, this.action, analyticsParameters);
          if (this.resetOnDone) {
            this.state = "ready";
            this.reset();
          } else if (this.keepOnDone) {
            this.state = "ready";
          } else {
            this.state = "done";
          }
          this.$emit("done", { result, parameters });
          this.workingZone.finished(this.workingTask);
        }).catch((error) => {
          if (this.$analytics && this.$analytics.formError)
            this.$analytics.formError(this.service, this.action, { analyticsParameters, error });
          this.$refs.defined.formRoot.afterError(this.initialValues);
          if (error.properties) {
            for (let propName in error.properties) {
              let node = this.getNode(propName);
              if (!node) {
                this.state = "error";
                this.error = `protocol mismatch, field ${propName} not found`;
                return;
              }
              node.setError(error.properties[propName]);
              this.state = "ready";
            }
            this.scrollToError();
            this.workingZone.finished(this.workingTask);
          } else if (this.ignoreError) {
            if (typeof this.ignoreError == "function") {
              if (this.ignoreError(error)) {
                this.workingZone.finished(this.workingTask);
              } else {
                this.state = "error";
                this.error = error;
                this.workingZone.failed(this.workingTask, error);
              }
            } else if (Array.isArray(this.ignoreError)) {
              if (this.ignoreError.indexOf(error) != -1) {
                this.workingZone.finished(this.workingTask);
              } else {
                this.state = "error";
                this.error = error;
                this.workingZone.failed(this.workingTask, error);
              }
            } else {
              this.workingZone.finished(this.workingTask);
            }
          } else if (this.externalErrorsProcessing)
            ;
          else {
            this.state = "error";
            this.error = error;
            this.workingZone.failed(this.workingTask, error);
          }
          this.$emit("error", { error, parameters, task: this.workingTask });
        });
      });
    },
    handleSubmitEvent(ev) {
      ev.preventDefault();
      this.submit();
    },
    setState(state) {
      this.state = state;
    }
  },
  created() {
    if (this.actionDefinition) {
      this.state = "ready";
    } else {
      this.loadingTask = this.loadingZone.started({ name: `action ${this.service}/${this.action} definition` });
      if (this.loadingError) {
        this.state = "loadingError";
        if (this.loadingTask) {
          this.loadingZone.failed(this.loadingTask, this.loadingError);
          this.loadingTask = null;
        }
      }
    }
  },
  unmounted() {
    if (this.loadingTask) {
      this.loadingZone.finished(this.loadingTask);
    }
  },
  watch: {
    actionDefinition(def) {
      if (def && this.state == "loading") {
        this.state = "ready";
        if (this.loadingTask) {
          this.loadingZone.finished(this.loadingTask);
          this.loadingTask = null;
        }
      }
    },
    loadingError(error) {
      if (error && this.state == "loading") {
        this.state = "loadingError";
        if (this.loadingTask) {
          this.loadingZone.failed(this.loadingTask, error);
          this.loadingTask = null;
        }
      }
    }
  }
};
function _sfc_ssrRender$8(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_defined_form = vue.resolveComponent("defined-form");
  _push(`<!--[-->`);
  if ($options.actionDefinition && ($data.state == "ready" || $data.state == "working")) {
    _push(serverRenderer.ssrRenderComponent(_component_defined_form, vue.mergeProps({
      tag: $props.formTag,
      ref: "defined",
      provided: { service: $props.service, action: $props.action, submit: $options.submit, getAction: () => $options.actionDefinition },
      parameters: $props.parameters,
      definition: $options.actionDefinition,
      "initial-values": $props.initialValues,
      class: $props.class,
      style: $props.style
    }, _attrs), {
      default: vue.withCtx(({ data }, _push2, _parent2, _scopeId) => {
        if (_push2) {
          serverRenderer.ssrRenderSlot(_ctx.$slots, "default", { data, submit: $options.submit }, null, _push2, _parent2, _scopeId);
        } else {
          return [
            vue.renderSlot(_ctx.$slots, "default", { data, submit: $options.submit })
          ];
        }
      }),
      _: 3
    }, _parent));
  } else {
    _push(`<!---->`);
  }
  if ($data.state == "error") {
    serverRenderer.ssrRenderSlot(_ctx.$slots, "error", {}, () => {
      _push(`<div class="alert alert-danger" role="alert">error</div>`);
    }, _push, _parent);
  } else {
    _push(`<!---->`);
  }
  if ($data.state == "done") {
    serverRenderer.ssrRenderSlot(_ctx.$slots, "done", {}, () => {
      _push(`<div class="alert alert-success" role="alert">success</div>`);
    }, _push, _parent);
  } else {
    _push(`<!---->`);
  }
  _push(`<!--]-->`);
}
const _sfc_setup$o = _sfc_main$o.setup;
_sfc_main$o.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("../../../live-change-framework-vue3/vue3-components/form/CommandForm.vue");
  return _sfc_setup$o ? _sfc_setup$o(props, ctx) : void 0;
};
var CommandForm = /* @__PURE__ */ _export_sfc(_sfc_main$o, [["ssrRender", _sfc_ssrRender$8]]);
const _sfc_main$n = {
  name: "FormBind",
  props: {
    name: {
      type: String,
      required: true
    },
    valueFilter: {
      type: Function,
      default: (v) => v
    }
  },
  inject: ["form"],
  computed: {
    definition() {
      return this.form.getFieldDefinition(this.name);
    },
    value: {
      get() {
        return this.form.getFieldValue(this.name);
      },
      set(value) {
        const filtered = this.valueFilter(value);
        this.form.setFieldValue(this.name, filtered);
      }
    },
    error: {
      get() {
        return this.form.getFieldError(this.name);
      },
      set(error) {
        this.form.setFieldError(this.name, error);
      }
    }
  },
  methods: {
    setValue(value) {
      const filtered = this.valueFilter(value);
      this.form.setFieldValue(this.name, filtered);
    },
    setError(error) {
      this.form.setFieldError(this.name, error);
    }
  },
  created() {
    this.connected = true;
  },
  beforeUnmount() {
    this.connected = false;
  }
};
function _sfc_ssrRender$7(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  serverRenderer.ssrRenderSlot(_ctx.$slots, "default", { value: $options.value, error: $options.error, setValue: $options.setValue, setError: $options.setError }, null, _push, _parent);
}
const _sfc_setup$n = _sfc_main$n.setup;
_sfc_main$n.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("../../../live-change-framework-vue3/vue3-components/form/FormBind.vue");
  return _sfc_setup$n ? _sfc_setup$n(props, ctx) : void 0;
};
var FormBind = /* @__PURE__ */ _export_sfc(_sfc_main$n, [["ssrRender", _sfc_ssrRender$7]]);
function registerFormComponents(app) {
  app.component("defined-form", DefinedForm);
  app.component("command-form", CommandForm);
  app.component("form-bind", FormBind);
}
const _sfc_main$m = {
  name: "VisibleArea",
  props: {
    throttleTime: {
      type: Number,
      default: 0
    },
    checkInterval: {
      type: Number,
      default: 200
    },
    rootElement: {}
  },
  data() {
    return {
      visibleArea: {
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        clipLeft: 0,
        clipTop: 0,
        offsetLeft: 0,
        offsetTop: 0,
        areaWidth: 0,
        areaHeight: 0
      },
      clipElements: [],
      lastRecompute: 0,
      lastRecomputeReason: null,
      needRecompute: false,
      foundRootElement: null,
      checkInt: 0
    };
  },
  mounted() {
    const self = this.$refs.area;
    let o = self.parentElement;
    while (o) {
      const computedStyle = window.getComputedStyle(o);
      let clipped = false;
      switch (computedStyle.overflowX) {
        case "auto":
        case "scroll":
        case "hidden":
          clipped = true;
      }
      switch (computedStyle.overflowY) {
        case "auto":
        case "scroll":
        case "hidden":
          clipped = true;
      }
      this.clipElements.push({
        element: o,
        width: o.clientWidth,
        height: o.clientHeight,
        clipped
      });
      if (this.rootElement == o) {
        this.foundRootElement = o;
        break;
      }
      if (computedStyle.position == "fixed")
        break;
      o = o.parentElement;
    }
    this.recomputeListenerScroll = (ev) => this.recomputeIfNeeded("scroll");
    this.recomputeListenerResize = () => this.recomputeIfNeeded("resize");
    window.addEventListener("scroll", this.recomputeListenerScroll);
    window.addEventListener("resize", this.recomputeListenerResize);
    for (const clip of this.clipElements) {
      clip.element.addEventListener("scroll", this.recomputeListenerScroll);
    }
    this.checkInt = setInterval(() => this.checkClipElements("unknown"), this.checkInterval);
    if (window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.checkClipElements("resize");
      });
      for (const clip of this.clipElements) {
        this.resizeObserver.observe(clip.element);
      }
      this.resizeObserver.observe(this.$refs.area);
    }
    this.compute("started");
  },
  beforeDestroy() {
    if (this.resizeObserver)
      this.resizeObserver.disconnect();
    clearInterval(this.checkInt);
    window.removeEventListener("scroll", this.recomputeListenerScroll);
    window.removeEventListener("resize", this.recomputeListenerResize);
    for (const clip of this.clipElements) {
      clip.element.removeEventListener("scroll", this.recomputeListenerScroll);
    }
  },
  methods: {
    checkClipElements(reason) {
      let changed = false;
      for (const clip of this.clipElements) {
        if (clip.element.clientWidth != clip.width || clip.element.clientHeight != clip.height) {
          clip.width = clip.element.clientWidth;
          clip.height = clip.element.clientHeight;
          changed = true;
        }
      }
      const self = this.$refs.area;
      if (self.clientWidth != this.visibleArea.areaWidth || self.clientHeight != this.visibleArea.areaHeight) {
        changed = true;
      }
      if (changed || this.needRecompute)
        this.recomputeIfNeeded(reason);
    },
    recomputeIfNeeded(reason) {
      if (this.lastRecomputeReason == reason && Date.now() - this.lastRecompute < this.throttleTime) {
        this.needRecompute = true;
        return;
      }
      this.compute(reason);
    },
    compute(reason) {
      if (!reason)
        throw new Error("RECOMPUTE WITH NO REASON!");
      this.lastRecompute = Date.now();
      const self = this.$refs.area;
      if (!self)
        return;
      let vx = self.offsetLeft + self.clientLeft;
      let vy = self.offsetTop + self.clientTop;
      let vw = self.clientWidth;
      let vh = self.clientHeight;
      let cx = 0;
      let cy = 0;
      let child = self;
      const doClip = (w, h) => {
        if (vx < 0) {
          cx += -vx;
          vw -= -vx;
          vx = 0;
        }
        if (vy < 0) {
          cy += -vy;
          vh -= -vy;
          vy = 0;
        }
        if (vx + vw > w) {
          vw = w - vx;
        }
        if (vy + vh > h) {
          vh = h - vy;
        }
      };
      for (const clip of this.clipElements) {
        vx -= clip.element.scrollLeft || 0;
        vy -= clip.element.scrollTop || 0;
        const ox = clip.element.offsetLeft + clip.element.clientLeft;
        const oy = clip.element.offsetTop + clip.element.clientTop;
        if (child.offsetParent == clip.element.offsetParent) {
          vx -= ox;
          vy -= oy;
          if (clip.clipped)
            doClip(clip.element.clientWidth, clip.element.clientHeight);
          vx += ox;
          vy += oy;
        } else {
          if (clip.clipped)
            doClip(clip.element.clientWidth, clip.element.clientHeight);
          vx += ox;
          vy += oy;
        }
        child = clip.element;
      }
      if (!this.foundRootElement) {
        vx -= document.documentElement.scrollLeft || 0;
        vy -= document.documentElement.scrollTop || 0;
        doClip(document.documentElement.clientWidth, document.documentElement.clientHeight);
      }
      this.needRecompute = false;
      const newVisibleArea = {
        left: Math.max(cx, 0),
        top: Math.max(cy, 0),
        width: vw,
        height: vh,
        clipLeft: cx,
        clipTop: cy,
        clipRight: self.clientWidth - cx - vw,
        clipBottom: self.clientHeight - cy - vh,
        offsetLeft: vx,
        offsetTop: vy,
        areaWidth: self.clientWidth,
        areaHeight: self.clientHeight
      };
      if (JSON.stringify(newVisibleArea) != JSON.stringify(this.visibleArea)) {
        this.visibleArea = newVisibleArea;
        this.$emit("update", newVisibleArea, reason);
      }
    }
  }
};
function _sfc_ssrRender$6(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({
    class: "visible-area",
    ref: "area"
  }, _attrs))}>`);
  serverRenderer.ssrRenderSlot(_ctx.$slots, "default", $data.visibleArea, null, _push, _parent);
  _push(`</div>`);
}
const _sfc_setup$m = _sfc_main$m.setup;
_sfc_main$m.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("../../../live-change-framework-vue3/vue3-components/view/VisibleArea.vue");
  return _sfc_setup$m ? _sfc_setup$m(props, ctx) : void 0;
};
var VisibleArea = /* @__PURE__ */ _export_sfc(_sfc_main$m, [["ssrRender", _sfc_ssrRender$6]]);
function createReactiveObject(...definitions) {
  let data = {};
  for (const definition of definitions) {
    if (typeof definition.data == "function")
      data = __spreadValues(__spreadValues({}, data), definition.data.apply({ $options: definition }));
    if (typeof definition.data == "object" && definition.data)
      data = __spreadValues(__spreadValues({}, data), definition.data);
  }
  const object = vue.reactive(data);
  object.$options = definitions[0];
  for (const definition of definitions) {
    for (const key in definition.computed)
      object[key] = vue.computed(definition.computed[key].bind(object));
  }
  for (const definition of definitions) {
    for (const key in definition.watch)
      vue.watch(() => object[key], (n, o) => definition.watch[key].apply(object));
  }
  for (const definition of definitions)
    if (definition.beforeCreate)
      definition.beforeCreate.apply(object);
  for (const definition of definitions)
    if (definition.created)
      definition.created.apply(object);
  object.$destroy = function() {
    for (const definition of definitions)
      if (definition.beforeDestroy)
        definition.beforeDestroy.apply(object);
  };
  return object;
}
const currentTime = createReactiveObject({
  data: {
    now: Date.now()
  },
  created() {
    if (typeof window != "undefined") {
      setInterval(() => {
        this.now = Date.now();
      }, 1e3);
    }
  }
});
const _sfc_main$l = {
  name: "ScrollLoader",
  inject: ["loadingZone"],
  components: { VisibleArea },
  props: {
    topMargin: {
      type: Number,
      default: 1e3
    },
    bottomMargin: {
      type: Number,
      default: 1e3
    },
    what: {
      type: Function,
      required: true
    },
    bucketSize: {
      type: Number,
      default: 20
    },
    readMode: {
      type: String,
      default: "id"
    },
    rowIdPrefix: {
      type: String,
      default: ""
    },
    autoScrollRoute: {
      type: Function,
      default: null
    },
    savedScrollPosition: {
      type: String,
      default: null
    },
    rangeCut: {
      type: Function,
      default: (a) => a
    },
    startPosition: {
      default: null
    },
    rowKey: {
      type: Function,
      default: (row) => row.id
    },
    stickyEnd: {
      type: Boolean,
      default: false
    },
    hardClose: {
      type: Boolean,
      default: false
    },
    propagateLoading: {
      type: Boolean,
      default: false
    },
    trackVisibleRows: {
      type: Boolean,
      default: false
    },
    debugLog: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      finished: false,
      visibleArea: null,
      topFill: 0,
      bottomFill: 0,
      buckets: [],
      firstLoading: true,
      scrollPosition: null,
      scrollParentHeight: 0,
      ignoreNextScroll: false,
      loadingTask: null,
      lastVisibleRows: [],
      visibleRows: [],
      bucketSizes: [],
      rowSizes: [],
      bucketsSize: []
    };
  },
  computed: {
    visibleState() {
      this.log("BUCKETS", this.buckets.length);
      const rows = this.buckets.flatMap((bucket, bucketId) => {
        this.log("BUCKET", bucket);
        if (bucket.state != "ready" && bucket.state != "closing")
          return [];
        let rows2 = bucket.range.reverse ? bucket.items.map((item, itemId) => __spreadProps(__spreadValues({}, item), { bucketId, itemId })).reverse() : bucket.items.map((item, itemId) => __spreadProps(__spreadValues({}, item), { bucketId, itemId }));
        if (bucket.softClose) {
          if (bucket.softClose.lte)
            rows2 = rows2.filter((item) => item.id <= bucket.softClose.lte);
          if (bucket.softClose.gte)
            rows2 = rows2.filter((item) => item.id >= bucket.softClose.gte);
        }
        return rows2;
      });
      this.log("ROWS", rows.length);
      return {
        rows,
        topLoading: !this.buckets[0] || this.buckets[0].state == "loading",
        bottomLoading: !this.buckets[0] || this.buckets[0].state == "loading",
        topFill: this.topFill,
        bottomFill: this.bottomFill
      };
    },
    isLoading() {
      for (const bucket of this.buckets) {
        if (bucket.state == "loading")
          return true;
      }
      return false;
    },
    isLoadingTop() {
      if (this.buckets.length < 2)
        return false;
      const firstBucket = this.buckets[0];
      if (firstBucket && firstBucket.state == "loading")
        return true;
      return false;
    },
    isLoadingBottom() {
      const lastBucket = this.buckets[this.buckets.length - 1];
      if (lastBucket && lastBucket.state == "loading")
        return true;
      return false;
    },
    isLoadingTopTooLong() {
      if (this.buckets.length < 2)
        return false;
      const firstBucket = this.buckets[0];
      if (firstBucket && firstBucket.state == "loading")
        return currentTime.now - firstBucket.loadingStarted > 1e4;
      return false;
    },
    isLoadingBottomTooLong() {
      const lastBucket = this.buckets[this.buckets.length - 1];
      if (lastBucket && lastBucket.state == "loading")
        return currentTime.now - lastBucket.loadingStarted > 1e4;
      return false;
    }
  },
  watch: {
    visibleRows(rows) {
      for (let row of rows) {
        const old = this.lastVisibleRows.find((r) => r.id == row.id);
        if (!old) {
          this.log("ROW BECOME VISIBLE", row.text, row.id, row);
          this.$emit("rowVisible", row);
        }
      }
      for (let row of this.lastVisibleRows) {
        const current = rows.find((r) => r.id == row.id);
        if (!current) {
          this.log("ROW BECOME HIDDEN", row.text, row.id, row);
          this.$emit("rowHidden", row);
        }
      }
      this.lastVisibleRows = rows.slice();
    },
    scrollPosition(scrollPos, oldScrollPos) {
      if (!scrollPos)
        return;
      if (!this.autoScrollRoute)
        return;
      const rowId = this.rowIdPrefix + scrollPos.row;
      const oldRowId = oldScrollPos && this.rowIdPrefix + oldScrollPos.row;
      if (rowId === void 0)
        return;
      if (this.isLoading)
        return;
      if (this.firstLoading)
        return;
      if (scrollPos.rowId == 0 && scrollPos.offset == 0 && !this.savedScrollPosition)
        return;
      delete this.$router.hashScrollLocks[oldRowId];
      this.$router.hashScrollLocks[rowId] = true;
      const atTop = this.visibleArea.clipTop == 0 && !scrollPos.rowId;
      const hash = atTop ? "" : "#" + rowId;
      if (this.$router.currentRoute.hash != hash) {
        this.$router.replace(__spreadProps(__spreadValues({}, this.autoScrollRoute(atTop ? null : rowId)), { hash }));
      }
    },
    isLoading(newState, oldState) {
      this.log("LOADING STATE", newState);
      if (this.propagateLoading) {
        if (newState && !this.loadingTask) {
          this.loadingTask = this.loadingZone.started({ name: `scrollLoader buckets` });
        } else if (!newState && this.loadingTask) {
          this.loadingZone.finished(this.loadingTask);
          this.loadingTask = null;
        }
      }
      if (newState)
        this.$emit("loading");
      else
        this.$emit("loaded");
    },
    visibleState() {
      setTimeout(() => {
        this.log("COMPUTE VISIBLE ROWS BECAUSE VISIBLE STATE CHANGED");
        this.computeVisibleRows();
      }, 20);
    },
    visibleArea() {
      setTimeout(() => {
        this.log("COMPUTE VISIBLE ROWS BECAUSE VISIBLE AREA CHANGED");
        this.computeVisibleRows();
      }, 20);
    }
  },
  methods: {
    log(...args) {
      if (this.debugLog)
        console.log(...args);
    },
    computeVisibleRows() {
      if (!this.trackVisibleRows)
        return [];
      const visibleState = this.visibleState;
      const visibleArea = this.visibleArea;
      if (!visibleArea)
        return [];
      if (!visibleState)
        return [];
      let visibleRows = [];
      const rowSizes = this.rowSizes;
      this.log("COMPUTE VISIBLE ROWS");
      const scrollMin = visibleArea.clipTop;
      const scrollMax = scrollMin + visibleArea.height;
      this.log("SCROLL MIN", scrollMin, " MAX", scrollMax);
      let top = this.topFill;
      for (let i = 0; i < rowSizes.length; i++) {
        const size = rowSizes[i];
        const row = visibleState.rows[i];
        const bottom = top + size;
        if (top < scrollMax && bottom > scrollMin) {
          if (row)
            visibleRows.push(row);
        }
        top = bottom;
      }
      this.visibleRows = visibleRows;
    },
    computeScrollPosition(visibleArea) {
      if (this.stickyEnd && visibleArea.clipBottom < 10) {
        return "end";
      }
      const clipTop = visibleArea.clipTop;
      let top = this.topFill;
      if (this.$refs.topLoading)
        top += this.$refs.topLoading.offsetHeight;
      let rowId = 0;
      let lastItem, lastBucketId, lastItemId;
      for (let bucketId = 0; bucketId < this.buckets.length; bucketId++) {
        const bucket = this.buckets[bucketId];
        if (top + bucket.height > clipTop) {
          let rowTop = top;
          for (let itemId = 0; itemId < bucket.items.length; itemId++) {
            const item = bucket.items[bucket.range.reverse ? bucket.items.length - itemId - 1 : itemId];
            lastItem = item;
            lastBucketId = bucketId;
            lastItemId = lastItemId;
            const element = this.$refs["row_" + rowId];
            if (element) {
              if (rowTop + element.offsetHeight > clipTop || itemId == bucket.items.length - 1)
                return {
                  row: this.rowName(__spreadProps(__spreadValues({}, item), { bucketId, itemId })),
                  offset: clipTop - rowTop,
                  rowId
                };
              rowId++;
              rowTop += element.offsetHeight;
            } else {
              return {
                row: this.rowName(__spreadProps(__spreadValues({}, item), { bucketId, itemId })),
                offset: clipTop - top,
                rowId
              };
            }
          }
        } else {
          rowId += bucket.items.length;
        }
        top += bucket.height;
      }
      if (lastItem) {
        return {
          row: this.rowId(__spreadProps(__spreadValues({}, lastItem), { bucketId: lastBucketId, itemId: lastItemId })),
          offset: clipTop - top,
          rowId
        };
      }
    },
    measureRows() {
      const elements = Object.keys(this.$refs).filter((key) => key.slice(0, 4) == "row_").map((key) => this.$refs[key]).filter((key) => !!key);
      if (!elements)
        return [];
      for (const element of elements) {
        if (!element)
          debugger;
      }
      const measurements = elements.map((element) => ({
        offsetTop: element.offsetTop,
        offsetHeight: element.offsetHeight,
        element
      }));
      if (measurements.length == 0)
        return 0;
      if (measurements.length == 1)
        return [measurements[0].offsetHeight];
      measurements.sort((a, b) => a.offsetTop - b.offsetTop);
      this.log("MEASUREMENTS", measurements);
      const rowDistance = measurements[1].offsetTop - measurements[0].offsetTop - measurements[0].offsetHeight;
      const rowSizes = measurements.map((m) => m.offsetHeight + rowDistance);
      return rowSizes;
    },
    measureBuckets(rowSizes) {
      if (!rowSizes)
        rowSizes = this.measureRows();
      this.log("ROW SIZES", rowSizes);
      let rowId = 0;
      const bucketSizes = new Array(this.buckets.length).fill(0);
      for (let i = 0; i < bucketSizes.length; i++) {
        const bucket = this.buckets[i];
        for (let j = 0; j < bucket.items.length; j++) {
          if (bucket.softClose) {
            if (bucket.softClose.gte && bucket.items[j].id < bucket.softClose.gte)
              continue;
            if (bucket.softClose.lte && bucket.items[j].id > bucket.softClose.lte)
              continue;
          }
          if (rowId < rowSizes.length)
            bucketSizes[i] += rowSizes[rowId++];
        }
      }
      this.log("BUCKET SIZES", bucketSizes);
      return bucketSizes;
    },
    scrollTo(to) {
      this.ignoreNextScroll = true;
      this.scrollParent.scrollTop = to;
      setTimeout(() => {
        this.ignoreNextScroll = false;
      }, 500);
    },
    scrollToPosition(pos) {
      this.log("SCROLL POS", JSON.stringify(pos));
      if (!pos)
        return;
      if (pos == "end") {
        this.log("SCROLL TO END!");
        this.scrollTo(this.$el.offsetTop + this.$el.offsetHeight - this.scrollParent.clientHeight);
        return;
      }
      const element = document.getElementById(this.rowIdPrefix + pos.row);
      if (element) {
        this.log("FOUND ELEMENT", element, element.offsetTop);
        const elementTop = element.offsetTop;
        this.log("SCROLL TO", elementTop + pos.offset);
        this.scrollTo(elementTop + pos.offset);
      } else {
        this.log("SCROLL ELEMENT NOT FOUND");
      }
    },
    loadMoreIfNeeded() {
      this.log("LOAD MORE IF NEEDED!", !!this.visibleArea, this.buckets.length);
      if (!this.visibleArea)
        return;
      if (this.buckets.length == 0)
        return;
      const firstBucket = this.buckets[0];
      const lastBucket = this.buckets[this.buckets.length - 1];
      const visibleTop = this.visibleArea.top;
      const visibleBottom = this.visibleArea.top + this.visibleArea.height;
      const top = visibleTop - this.topMargin;
      const bottom = visibleBottom + this.bottomMargin;
      const topEnd = this.topFill + (this.$refs.topLoading ? this.$refs.topLoading.offsetHeight : 0);
      const bottomEnd = topEnd + this.bucketsSize;
      this.log("TOP", top, "<", topEnd, "=", top < topEnd);
      if (firstBucket) {
        this.log("FIRST", JSON.stringify(firstBucket.range), "ST", firstBucket.state, "ITEMS", firstBucket.items.length);
      } else
        this.log("NO FIRST BUCKET!");
      this.log("BOTTOM", bottom, ">", bottomEnd, "=", bottom > bottomEnd);
      if (lastBucket) {
        this.log("LAST", JSON.stringify(lastBucket.range), "ST", lastBucket.state, "ITEMS", lastBucket.items.length);
      } else
        this.log("NO LAST BUCKET!");
      if (top < topEnd && firstBucket.state == "ready" && (firstBucket.range.gt || firstBucket.range.gte || firstBucket.items.length == this.bucketSize)) {
        if (this.readMode != "index" || firstBucket.range.gt != 0)
          this.loadTop();
      }
      if (bottom > bottomEnd && lastBucket.state == "ready" && (lastBucket.range.lt || lastBucket.range.lte || lastBucket.items.length == this.bucketSize) && lastBucket.range.lt != "\xFF\xFF\xFF\xFF") {
        this.loadBottom();
      }
    },
    setVisibleArea(visibleArea, reason) {
      this.log("HANDLE VISIBLE AREA CHANGE!!! REASON:", reason, "IGNORE SCROLL", this.ignoreNextScroll);
      const oldVisibleArea = this.visibleArea;
      this.log("NEW", JSON.stringify(visibleArea));
      this.log("OLD", JSON.stringify(oldVisibleArea));
      if (!this.scrollParent) {
        this.log("IGNORE VISIBLE AREA CHANGE BECAUSE NO SCROLL PARENT!");
        this.visibleArea = visibleArea;
        return;
      }
      const sizeChanged = !oldVisibleArea || (visibleArea.areaWidth != oldVisibleArea.areaWidth || visibleArea.areaHeight != oldVisibleArea.areaHeight);
      const resized = sizeChanged || reason == "resize";
      let rowSizes = this.rowSizes;
      let bucketSizes = this.bucketSizes;
      this.log("NEED MEASURE?", resized, bucketSizes.length != this.buckets.length);
      if (resized || bucketSizes.length != this.buckets.length) {
        rowSizes = this.measureRows();
        bucketSizes = this.measureBuckets(rowSizes);
      }
      if (resized) {
        if ((!this.scrollPosition || typeof this.scrollPosition == "object") && oldVisibleArea)
          ;
        const sp = this.scrollPosition;
        if (sp && (typeof sp != "object" || sp.rowId > 0 && sp.offset > 0)) {
          this.scrollToPosition(this.scrollPosition);
        }
      }
      this.computeVisibleRows();
      if (resized || bucketSizes.length != this.buckets.length) {
        this.rowSizes = rowSizes;
        this.bucketSizes = bucketSizes;
        this.bucketsSize = this.bucketSizes.reduce((a, b) => a + b, 0);
        for (let i = 0; i < this.bucketSizes.length; i++) {
          if (this.buckets[i]) {
            this.buckets[i].height = this.bucketSizes[i];
          }
        }
      }
      this.visibleArea = visibleArea;
      if (reason == "scroll") {
        if (this.ignoreNextScroll) {
          this.ignoreNextScroll = false;
        } else {
          this.scrollPosition = this.computeScrollPosition(this.visibleArea);
        }
      }
      this.loadMoreIfNeeded();
    },
    getNextBucketRange() {
      switch (this.readMode) {
        case "id": {
          const lastBucket = this.buckets[this.buckets.length - 1];
          if (!lastBucket)
            return {
              gt: ""
            };
          if (lastBucket.lte)
            return {
              gt: lastBucket.lte
            };
          if (lastBucket.lt)
            return {
              gte: lastBucket.lt
            };
          if (!lastBucket.items.length)
            throw new Error("ADD NEXT BUCKET AFTER EMPTY BUCKET");
          return {
            gt: lastBucket.items[lastBucket.range.reverse ? 0 : lastBucket.items.length - 1].id
          };
        }
        case "index": {
          const lastBucket = this.buckets[this.buckets.length - 1];
          return {
            gt: lastBucket ? +lastBucket.range.gt + this.bucketSize : 0
          };
        }
      }
    },
    getPrevBucketRange() {
      switch (this.readMode) {
        case "id": {
          const firstBucket = this.buckets[0];
          if (!firstBucket)
            return {
              lt: "\xFF\xFF\xFF\xFF",
              reverse: true
            };
          if (firstBucket.gte)
            return {
              lt: firstBucket.lte,
              reverse: true
            };
          if (firstBucket.gt)
            return {
              lte: firstBucket.lt,
              reverse: true
            };
          if (!firstBucket.items.length)
            throw new Error("ADD PREV BUCKET BEFORE EMPTY BUCKET");
          return {
            lt: firstBucket.items[firstBucket.range.reverse ? firstBucket.items.length - 1 : 0].id,
            reverse: true
          };
        }
        case "index": {
          const firstBucket = this.buckets[0];
          return {
            gt: firstBucket ? +firstBucket.range.gt - this.bucketSize : -this.bucketSize
          };
        }
      }
    },
    createBucket(range) {
      const bucket = vue.reactive({
        state: "free",
        range: this.rangeCut(__spreadProps(__spreadValues({}, range), { limit: this.bucketSize })),
        height: 0,
        observable: null,
        items: [],
        error: null,
        softClose: null
      });
      bucket.stateObserver = (s, v, id, el) => {
        if (bucket.state == "free") {
          console.trace("BUCKET SIGNAL IN STATE FREE");
          return;
        }
        this.log("SIGNAL", s, "BUCKET", JSON.stringify(bucket.range), "DP:", JSON.stringify(bucket.daoPath), "IN STATE", bucket.state, "ARGS", JSON.stringify([v, id, el]));
        if (bucket.state == "closing" && v.length == 0) {
          console.error("BUCKET CLOSING EMPTY!?!?");
        }
        if (bucket.state == "loading" && s == "set" && v) {
          bucket.state = v.length > 0 ? "ready" : "empty";
          this.handleLoaded(bucket, v);
        } else if ((bucket.state == "empty" || bucket.state == "closing") && (s == "putByField" || s == "push")) {
          bucket.state = "ready";
          this.handleLoaded(bucket, [el]);
        } else if ((bucket.state == "empty" || bucket.state == "closing") && s == "set") {
          bucket.state = "ready";
          this.handleLoaded(bucket, v);
        }
        this.$nextTick(() => {
          this.loadMoreIfNeeded();
        });
      };
      return bucket;
    },
    closeBucket(bucket) {
      if (bucket.closed)
        return;
      this.log("CLOSE BUCKET", JSON.stringify(bucket.range));
      bucket.closed = true;
      switch (this.readMode) {
        case "id": {
          this.log("BUCKET ITEMS", bucket.items.map((i) => i.id).join(", "));
          const range = bucket.range.reverse ? {
            gte: bucket.items[bucket.items.length - 1].id,
            lt: bucket.range.lt || void 0,
            lte: !bucket.range.lt && bucket.items[0].id || void 0,
            reverse: true
          } : {
            gt: bucket.range.gt || void 0,
            gte: !bucket.range.gt && bucket.items[0].id || void 0,
            lte: bucket.items[bucket.items.length - 1].id
          };
          this.log("CLOSE RANGE", range);
          if (this.hardClose) {
            bucket.range = range;
            this.loadBucket(bucket, true);
          } else {
            let gt = range.gte || range.gt;
            let lt = range.lte || range.lt;
            if (gt && lt && gt > lt) {
              bucket.softClose = { lte: range.gte, gte: range.lte, gt: range.lt, lt: range.gt };
            } else {
              bucket.softClose = range;
            }
          }
          return;
        }
        case "index": {
          return;
        }
      }
    },
    addNextBucket(start) {
      const range = start || this.getNextBucketRange();
      this.log("NEXT BUCKET RANGE:", range);
      const lastBucket = this.buckets[this.buckets.length - 1];
      if (lastBucket)
        this.closeBucket(lastBucket);
      const bucket = this.createBucket(range);
      this.buckets.push(bucket);
      return bucket;
    },
    addPrevBucket(start) {
      const range = start || this.getPrevBucketRange();
      this.log("PREV BUCKET RANGE:", range);
      const firstBucket = this.buckets[0];
      this.log("FIRST BUCKET CLOSE?", firstBucket.range, firstBucket.items.length);
      if (firstBucket)
        this.closeBucket(firstBucket);
      const bucket = this.createBucket(range);
      this.buckets.unshift(bucket);
      return bucket;
    },
    async loadEndBucket() {
      const range = { lt: "\xFF\xFF\xFF\xFF", reverse: true, limit: this.bucketSize };
      const daoPath = this.what(__spreadValues({}, range));
      const lastItems = await this.$api.get(daoPath);
      lastItems.reverse();
      this.log("LAST ITEMS LOADED", lastItems);
      const endBucketRange = lastItems.length > 0 ? {
        gte: lastItems[0].id,
        lte: lastItems[lastItems.length - 1].id
      } : {
        gte: "",
        limit: this.bucketSize
      };
      const bucket = this.createBucket(endBucketRange);
      bucket.items = lastItems;
      bucket.closed = true;
      this.buckets.push(bucket);
      this.loadBucket(bucket, true);
      return bucket;
    },
    loadBucket(bucket, closing) {
      bucket.state = closing ? "closing" : "loading";
      bucket.loadingStarted = Date.now();
      this.log("LOAD BUCKET", JSON.stringify(bucket.range));
      if (bucket.observable) {
        bucket.observable.unbindProperty(bucket, "items");
        bucket.observable.unbindErrorProperty(bucket, "error");
        bucket.observable.unobserve(bucket.stateObserver);
      }
      bucket.daoPath = this.what(__spreadValues({}, bucket.range));
      bucket.observable = this.$api.observable(bucket.daoPath);
      this.log("BUCKET PATH", JSON.stringify(bucket.daoPath));
      this.log("BUCKET OBSERVABLE CACHED DATA", bucket.observable.list);
      bucket.observable.bindProperty(bucket, "items");
      bucket.observable.bindErrorProperty(bucket, "error");
      bucket.observable.observe(bucket.stateObserver);
    },
    unloadBucket(bucket) {
      bucket.state = "free";
      bucket.observable.unbindProperty(bucket, "items");
      bucket.observable.unbindErrorProperty(bucket, "error");
      bucket.observable.unobserve(bucket.stateObserver);
      bucket.observable = null;
    },
    loadBottom() {
      const bucket = this.addNextBucket();
      this.loadBucket(bucket);
    },
    loadTop() {
      const bucket = this.addPrevBucket();
      this.loadBucket(bucket);
    },
    rowName(row) {
      switch (this.readMode) {
        case "id":
          return row.id;
        case "index":
          return +this.buckets[row.bucketId].range.gt + row.itemId;
      }
    },
    rowId(row) {
      return this.rowIdPrefix + this.rowName(row);
    },
    async startLoading() {
      this.log("START LOADING");
      if (this.startPosition) {
        this.scrollPosition = this.startPosition;
      }
      if (this.savedScrollPosition) {
        const position = this.savedScrollPosition;
        this.log("LOADING SAVED SCROLL", position);
        delete this.$router.hashScrollLocks[position];
        if (position.slice(0, this.rowIdPrefix.length) == this.rowIdPrefix) {
          this.scrollPosition = { row: +position.slice(this.rowIdPrefix.length), offset: 0, rowId: Infinity };
          this.log("SAVED SCROLL POSITION", this.scrollPosition);
        }
      }
      if (this.scrollPosition) {
        if (this.scrollPosition == "end") {
          this.topFill = this.topMargin * 1.5 | 0;
          this.log("LOAD END BUCKET BECAUSE SCROLL IS ON END");
          await this.loadEndBucket();
          return;
        }
        const start = this.scrollPosition.row;
        this.topFill = this.topMargin * 1.5 | 0;
        this.log("LOAD BUCKET AT", start);
        const bucket = this.addNextBucket({ gt: start });
        this.loadBucket(bucket);
        return;
      }
      const firstBucket = this.addNextBucket();
      this.loadBucket(firstBucket);
    },
    handleLoaded(bucket, items) {
      if (!this.isLoading) {
        if (this.firstLoading)
          this.finishFirstLoading();
        this.$emit("loaded");
      }
    },
    finishFirstLoading() {
      if (!this.firstLoading)
        return;
      this.log("FIRST LOADING FINISHED");
      this.firstLoading = false;
      this.$emit("loadedFirst");
    }
  },
  mounted() {
    this.log("MOUNTED!");
    this.scrollParent = getScrollParent(this.$el);
    if (this.scrollParent) {
      this.log("SCROLL PARENT FOUND", this.scrollParent);
      const va = this.visibleArea;
      this.visibleArea = null;
      this.setVisibleArea(va, "start");
    } else {
      this.log("NO SCROLL PARENT!!!");
    }
  },
  created() {
    if (typeof window != "undefined") {
      window.sl = this;
    }
    if (this.propagateLoading) {
      this.log("PROPAGATE LOADING");
      this.loadingTask = this.loadingZone.started({ name: `scrollLoader buckets` });
      setTimeout(() => {
        if (!this.isLoading && this.loadingTask) {
          this.loadingZone.finished(this.loadingTask);
          this.loadingTask = null;
        }
      }, 50);
    }
    this.startLoading();
  },
  beforeDestroy() {
    this.log("BEFORE DESTROY");
    for (const bucket of this.buckets) {
      if (bucket.observable)
        this.unloadBucket(bucket);
    }
    if (this.loadingTask) {
      this.log("FINISH LOADING!");
      this.loadingZone.finished(this.loadingTask);
    }
  }
};
function _sfc_ssrRender$5(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_visible_area = vue.resolveComponent("visible-area");
  _push(serverRenderer.ssrRenderComponent(_component_visible_area, vue.mergeProps({ ref: "area" }, _attrs), {
    default: vue.withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(`<div class="scroll-top-fill" style="${serverRenderer.ssrRenderStyle({ height: $data.topFill + "px" })}"${_scopeId}></div>`);
        if ($options.isLoadingTop) {
          serverRenderer.ssrRenderSlot(_ctx.$slots, "loadingTop", vue.mergeProps({ connectionProblem: $options.isLoadingTopTooLong }, { ref: "topLoading" }), null, _push2, _parent2, _scopeId);
        } else {
          _push2(`<!---->`);
        }
        _push2(`<!--[-->`);
        serverRenderer.ssrRenderList($options.visibleState.rows, (row, index) => {
          _push2(`<div class="scroll-data"${serverRenderer.ssrRenderAttr("id", $options.rowId(row))}${_scopeId}>`);
          serverRenderer.ssrRenderSlot(_ctx.$slots, "default", { row, index, rows: $options.visibleState.rows }, null, _push2, _parent2, _scopeId);
          _push2(`</div>`);
        });
        _push2(`<!--]-->`);
        if ($options.isLoadingBottom) {
          serverRenderer.ssrRenderSlot(_ctx.$slots, "loadingBottom", vue.mergeProps({ connectionProblem: $options.isLoadingBottomTooLong }, { ref: "bottomLoading" }), null, _push2, _parent2, _scopeId);
        } else {
          _push2(`<!---->`);
        }
        _push2(`<div class="scroll-bottom-fill" style="${serverRenderer.ssrRenderStyle({ height: $data.bottomFill + "px" })}"${_scopeId}></div>`);
      } else {
        return [
          vue.createVNode("div", {
            class: "scroll-top-fill",
            style: { height: $data.topFill + "px" }
          }, null, 4),
          $options.isLoadingTop ? vue.renderSlot(_ctx.$slots, "loadingTop", vue.mergeProps({ key: 0 }, { connectionProblem: $options.isLoadingTopTooLong }, { ref: "topLoading" })) : vue.createCommentVNode("", true),
          (vue.openBlock(true), vue.createBlock(vue.Fragment, null, vue.renderList($options.visibleState.rows, (row, index) => {
            return vue.openBlock(), vue.createBlock("div", {
              class: "scroll-data",
              ref: "row_" + index,
              id: $options.rowId(row),
              key: $props.rowKey(row)
            }, [
              vue.renderSlot(_ctx.$slots, "default", { row, index, rows: $options.visibleState.rows })
            ], 8, ["id"]);
          }), 128)),
          $options.isLoadingBottom ? vue.renderSlot(_ctx.$slots, "loadingBottom", vue.mergeProps({ key: 1 }, { connectionProblem: $options.isLoadingBottomTooLong }, { ref: "bottomLoading" })) : vue.createCommentVNode("", true),
          vue.createVNode("div", {
            class: "scroll-bottom-fill",
            style: { height: $data.bottomFill + "px" }
          }, null, 4)
        ];
      }
    }),
    _: 3
  }, _parent));
}
const _sfc_setup$l = _sfc_main$l.setup;
_sfc_main$l.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("../../../live-change-framework-vue3/vue3-components/view/ScrollLoader.vue");
  return _sfc_setup$l ? _sfc_setup$l(props, ctx) : void 0;
};
var ScrollLoader = /* @__PURE__ */ _export_sfc(_sfc_main$l, [["ssrRender", _sfc_ssrRender$5]]);
function registerViewComponents(app) {
  app.component("scroll-loader", ScrollLoader);
  app.component("visible-area", VisibleArea);
}
function registerComponents(app, settings = {}) {
  registerLogicComponents(app);
  registerFormComponents(app);
  registerViewComponents(app);
}
const prefix$1 = "$lcDaoPath_";
const reactiveMixin = (dao) => ({
  data() {
    if (!this.$options.reactive)
      return {};
    let data = {};
    for (let key in this.$options.reactive) {
      data[key] = void 0;
      data[key + "Error"] = void 0;
    }
    return data;
  },
  beforeCreate() {
    if (!this.$options.reactive)
      return;
    if (!this.$options.computed)
      this.$options.computed = {};
    for (let key in this.$options.reactive) {
      let path = this.$options.reactive[key];
      if (typeof path == "function") {
        this.$options.computed[prefix$1 + key] = path;
      } else if (typeof path == "string")
        ;
      else if (path.length !== void 0)
        ;
      else
        throw new Error("unknown reactive path " + path);
    }
  },
  created() {
    if (!this.$options.reactive)
      return;
    this.reactiveObservables = {};
    let reactiveObservables = this.reactiveObservables;
    for (let key in this.$options.reactive) {
      let path = this.$options.reactive[key];
      if (typeof path == "function") {
        let p = this[prefix$1 + key];
        if (p) {
          reactiveObservables[key] = dao.observable(p);
          reactiveObservables[key].bindProperty(this, key);
          reactiveObservables[key].bindErrorProperty(this, key + "Error");
        }
        let oldPathJson;
        vue.watch(() => this[prefix$1 + key], (newPath) => {
          const json = JSON.stringify(newPath);
          const match = JSON.stringify(newPath) == oldPathJson;
          oldPathJson = json;
          if (match)
            return;
          if (reactiveObservables[key]) {
            this[key] = void 0;
            this[key + "Error"] = void 0;
            reactiveObservables[key].unbindProperty(this, key);
            reactiveObservables[key].unbindErrorProperty(this, key + "Error");
          }
          delete reactiveObservables[key];
          if (newPath) {
            reactiveObservables[key] = dao.observable(newPath);
            reactiveObservables[key].bindProperty(this, key);
            reactiveObservables[key].bindErrorProperty(this, key + "Error");
          } else {
            this[key] = void 0;
          }
        });
      } else if (typeof path == "string") {
        reactiveObservables[key] = dao.observable(path);
        reactiveObservables[key].bindProperty(this, key);
        reactiveObservables[key].bindErrorProperty(this, key + "Error");
      } else if (path.length !== void 0) {
        reactiveObservables[key] = dao.observable(path);
        reactiveObservables[key].bindProperty(this, key);
        reactiveObservables[key].bindErrorProperty(this, key + "Error");
      } else
        throw new Error("unknown reactive path " + path);
    }
  },
  beforeUnmount() {
    if (!this.$options.reactive)
      return;
    let reactiveObservables = this.reactiveObservables;
    for (let key in reactiveObservables) {
      reactiveObservables[key].unbindProperty(this, key);
      reactiveObservables[key].unbindErrorProperty(this, key + "Error");
    }
  }
});
let prefix = "$lcDaoPath_";
const reactivePrefetchMixin = (dao) => ({
  beforeCreate() {
    if (typeof window == "undefined")
      return;
    if (!this.$options.reactivePreFetch)
      return;
    if (!this.$options.computed)
      this.$options.computed = {};
    this.$options.computed[prefix + "_reactivePreFetch"] = function() {
      return this.$options.reactivePreFetch.call(this, this.$route, this.$router);
    };
    const optionData = this.$options.data;
    this.$options.data = function vueReactiveDaoInjectedDataFn() {
      const data = (typeof optionData === "function" ? optionData.call(this) : optionData) || {};
      data.reactivePreFetchedPaths = [];
      data.reactivePreFetchError = null;
      return data;
    };
  },
  created() {
    if (typeof window == "undefined")
      return;
    if (!this.$options.reactivePreFetch)
      return;
    let paths = this[prefix + "_reactivePreFetch"];
    if (paths) {
      this.reactivePreFetchObservable = dao.observable({ paths });
      this.reactivePreFetchObservable.bindProperty(this, "reactivePreFetchedPaths");
      this.reactivePreFetchObservable.bindErrorProperty(this, "reactivePreFetchError");
    }
    vue.watch(() => this[prefix + "_reactivePreFetch"], (paths2) => {
      if (this.reactivePreFetchObservable) {
        this.reactivePreFetchObservable.unbindProperty(this, "reactivePreFetchedPaths");
        this.reactivePreFetchObservable.unbindErrorProperty(this, "reactivePreFetchError");
      }
      delete this.reactivePreFetchObservable;
      if (paths2) {
        this.reactivePreFetchObservable = dao.observable({ paths: paths2 });
        this.reactivePreFetchObservable.bindProperty(this, "reactivePreFetchedPaths");
        this.reactivePreFetchObservable.bindErrorProperty(this, "reactivePreFetchError");
      }
    });
  },
  beforeUnmount() {
    if (typeof window == "undefined")
      return;
    if (!this.$options.reactivePreFetch)
      return;
    if (this.reactivePreFetchObservable) {
      this.reactivePreFetchObservable.unbindProperty(this, "reactivePreFetchedPaths");
      this.reactivePreFetchObservable.unbindErrorProperty(this, "reactivePreFetchError");
    }
  }
});
const ReactiveDaoVue = {
  install(Vue, options) {
    if (!options || !options.dao)
      throw new Error("dao option required");
    const dao = options.dao;
    Vue.mixin(reactiveMixin(dao));
    Vue.mixin(reactivePrefetchMixin(dao));
  }
};
async function serverApi(dao, settings = {}) {
  const api = new vueApi.Api(dao);
  api.setup({
    ssr: true,
    createReactiveObject(definition) {
      return createReactiveObject(definition, reactiveMixin(api));
    }
  });
  for (const plugin of settings.use || []) {
    plugin(api);
  }
  api.generateServicesApi();
  await api.preFetch();
  return api;
}
/**
 * vue-meta v3.0.0-alpha.9
 * (c) 2021
 * - Pim (@pimlie)
 * - All the amazing contributors
 * @license MIT
 */
const resolveOption = (predicament, initialValue) => (options, contexts) => {
  let resolvedIndex = -1;
  contexts.reduce((acc, context, index) => {
    const retval = predicament(acc, context);
    if (retval !== acc) {
      resolvedIndex = index;
      return retval;
    }
    return acc;
  }, initialValue);
  if (resolvedIndex > -1) {
    return options[resolvedIndex];
  }
};
const setup = (context) => {
  let depth = 0;
  if (context.vm) {
    let { vm } = context;
    do {
      if (vm.parent) {
        depth++;
        vm = vm.parent;
      }
    } while (vm && vm.parent && vm !== vm.root);
  }
  context.depth = depth;
};
const resolve = resolveOption((currentValue, context) => {
  const { depth } = context;
  if (!currentValue || depth > currentValue) {
    return depth;
  }
  return currentValue;
});
var defaultResolver = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  setup,
  resolve
});
const defaultConfig = {
  body: {
    tag: "script",
    to: "body"
  },
  base: {
    valueAttribute: "href"
  },
  charset: {
    tag: "meta",
    nameless: true,
    valueAttribute: "charset"
  },
  description: {
    tag: "meta"
  },
  og: {
    group: true,
    namespacedAttribute: true,
    tag: "meta",
    keyAttribute: "property"
  },
  twitter: {
    group: true,
    namespacedAttribute: true,
    tag: "meta"
  },
  htmlAttrs: {
    attributesFor: "html"
  },
  headAttrs: {
    attributesFor: "head"
  },
  bodyAttrs: {
    attributesFor: "body"
  }
};
const tags = {
  title: {
    attributes: false
  },
  base: {
    contentAsAttribute: true,
    attributes: ["href", "target"]
  },
  meta: {
    contentAsAttribute: true,
    keyAttribute: "name",
    attributes: ["content", "name", "http-equiv", "charset"]
  },
  link: {
    contentAsAttribute: true,
    attributes: [
      "href",
      "crossorigin",
      "rel",
      "media",
      "integrity",
      "hreflang",
      "type",
      "referrerpolicy",
      "sizes",
      "imagesrcset",
      "imagesizes",
      "as",
      "color"
    ]
  },
  style: {
    attributes: ["media"]
  },
  script: {
    attributes: [
      "src",
      "type",
      "nomodule",
      "async",
      "defer",
      "crossorigin",
      "integrity",
      "referrerpolicy"
    ]
  },
  noscript: {
    attributes: false
  }
};
function getTagConfigItem(tagOrName, key) {
  for (const name of tagOrName) {
    const tag = tags[name];
    if (name && tag) {
      return tag[key];
    }
  }
}
Object.freeze({});
Object.freeze([]);
const isArray = Array.isArray;
const isFunction = (val) => typeof val === "function";
const isString = (val) => typeof val === "string";
const isObject = (val) => val !== null && typeof val === "object";
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);
const isPlainObject = (val) => toTypeString(val) === "[object Object]";
const IS_PROXY = Symbol("kIsProxy");
const PROXY_SOURCES = Symbol("kProxySources");
const PROXY_TARGET = Symbol("kProxyTarget");
const RESOLVE_CONTEXT = Symbol("kResolveContext");
function clone(v) {
  if (isArray(v)) {
    return v.map(clone);
  }
  if (isObject(v)) {
    const res = {};
    for (const key in v) {
      if (key === "context") {
        res[key] = v[key];
      } else {
        res[key] = clone(v[key]);
      }
    }
    return res;
  }
  return v;
}
const pluck = (collection, key, callback) => {
  const plucked = [];
  for (const row of collection) {
    if (row && key in row) {
      plucked.push(row[key]);
      if (callback) {
        callback(row);
      }
    }
  }
  return plucked;
};
const allKeys = (source, ...sources) => {
  const keys = source ? Object.keys(source) : [];
  if (sources) {
    for (const source2 of sources) {
      if (!source2 || !isObject(source2)) {
        continue;
      }
      for (const key in source2) {
        if (!keys.includes(key)) {
          keys.push(key);
        }
      }
    }
  }
  return keys;
};
const recompute = (context, path = [], target, sources) => {
  const setTargetAndSources = !target && !sources;
  if (setTargetAndSources) {
    ({ active: target, sources } = context);
    if (path.length) {
      for (let i = 0; i < path.length; i++) {
        const seg = path[i];
        if (!target || !target[seg]) {
          {
            console.error(`recompute: segment ${seg} not found on target`, path, target);
          }
          return;
        }
        target = target[seg];
        sources = sources.map((source) => source[seg]).filter(Boolean);
      }
    }
  }
  if (!target || !sources) {
    return;
  }
  const keys = allKeys(...sources);
  const targetKeys = Object.keys(target);
  for (const key of targetKeys) {
    if (!keys.includes(key)) {
      delete target[key];
    }
  }
  for (const key of keys) {
    let isObject2 = false;
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      if (source && key in source && source[key] !== void 0) {
        isObject2 = isPlainObject(source[key]);
        break;
      }
    }
    if (isObject2) {
      if (!target[key]) {
        target[key] = {};
      }
      const keySources2 = [];
      for (const source of sources) {
        if (key in source) {
          keySources2.push(source[key]);
        }
      }
      recompute(context, [...path, key], target[key], keySources2);
      continue;
    }
    if (!target[key] && isArray(sources[0][key])) {
      target[key] = [];
    }
    const keyContexts = [];
    const keySources = pluck(sources, key, (source) => keyContexts.push(source[RESOLVE_CONTEXT]));
    let resolved = context.resolve(keySources, keyContexts, target[key], key, path);
    if (isPlainObject(resolved)) {
      resolved = clone(resolved);
    }
    target[key] = resolved;
  }
};
const createProxy = (context, target, resolveContext, pathSegments = []) => {
  const handler2 = createHandler(context, resolveContext, pathSegments);
  const proxy = vue.markRaw(new Proxy(target, handler2));
  if (!pathSegments.length && context.sources) {
    context.sources.push(proxy);
  }
  return proxy;
};
const createHandler = (context, resolveContext, pathSegments = []) => ({
  get: (target, key, receiver) => {
    if (key === IS_PROXY) {
      return true;
    }
    if (key === PROXY_SOURCES) {
      return context.sources;
    }
    if (key === PROXY_TARGET) {
      return target;
    }
    if (key === RESOLVE_CONTEXT) {
      return resolveContext;
    }
    let value = Reflect.get(target, key, receiver);
    if (!isObject(value)) {
      return value;
    }
    if (!value[IS_PROXY]) {
      const keyPath = [...pathSegments, key];
      value = createProxy(context, value, resolveContext, keyPath);
      Reflect.set(target, key, value);
    }
    return value;
  },
  set: (target, key, value) => {
    const success = Reflect.set(target, key, value);
    if (success) {
      const isArrayItem = isArray(target);
      let hasArrayParent = false;
      let { sources: proxies, active } = context;
      let activeSegmentKey;
      let index = 0;
      for (const segment of pathSegments) {
        proxies = pluck(proxies, segment);
        if (isArrayItem && index === pathSegments.length - 1) {
          activeSegmentKey = segment;
          break;
        }
        if (isArray(active)) {
          hasArrayParent = true;
        }
        active = active[segment];
        index++;
      }
      if (hasArrayParent) {
        recompute(context);
        return success;
      } else if (isPlainObject(value)) {
        recompute(context, pathSegments);
        return success;
      }
      let keyContexts = [];
      let keySources;
      if (isArrayItem) {
        keySources = proxies;
        keyContexts = proxies.map((proxy) => proxy[RESOLVE_CONTEXT]);
      } else {
        keySources = pluck(proxies, key, (proxy) => keyContexts.push(proxy[RESOLVE_CONTEXT]));
      }
      let resolved = context.resolve(keySources, keyContexts, active, key, pathSegments);
      if (isPlainObject(resolved)) {
        resolved = clone(resolved);
      }
      if (isArrayItem && activeSegmentKey) {
        active[activeSegmentKey] = resolved;
      } else {
        active[key] = resolved;
      }
    }
    return success;
  },
  deleteProperty: (target, key) => {
    const success = Reflect.deleteProperty(target, key);
    if (success) {
      const isArrayItem = isArray(target);
      let activeSegmentKey;
      let proxies = context.sources;
      let active = context.active;
      let index = 0;
      for (const segment of pathSegments) {
        proxies = proxies.map((proxy) => proxy && proxy[segment]);
        if (isArrayItem && index === pathSegments.length - 1) {
          activeSegmentKey = segment;
          break;
        }
        active = active[segment];
        index++;
      }
      if (proxies.some((proxy) => proxy && key in proxy)) {
        let keyContexts = [];
        let keySources;
        if (isArrayItem) {
          keySources = proxies;
          keyContexts = proxies.map((proxy) => proxy[RESOLVE_CONTEXT]);
        } else {
          keySources = pluck(proxies, key, (proxy) => keyContexts.push(proxy[RESOLVE_CONTEXT]));
        }
        let resolved = context.resolve(keySources, keyContexts, active, key, pathSegments);
        if (isPlainObject(resolved)) {
          resolved = clone(resolved);
        }
        if (isArrayItem && activeSegmentKey) {
          active[activeSegmentKey] = resolved;
        } else {
          active[key] = resolved;
        }
      } else {
        delete active[key];
      }
    }
    return success;
  }
});
const createMergedObject = (resolve2, active) => {
  const sources = [];
  const context = {
    active,
    resolve: resolve2,
    sources
  };
  const compute = () => recompute(context);
  return {
    context,
    compute,
    addSource: (source, resolveContext, recompute2 = false) => {
      const proxy = createProxy(context, source, resolveContext || {});
      if (recompute2) {
        compute();
      }
      return proxy;
    },
    delSource: (sourceOrProxy, recompute2 = true) => {
      const index = sources.findIndex((source) => source === sourceOrProxy || source[PROXY_TARGET] === sourceOrProxy);
      if (index > -1) {
        sources.splice(index, 1);
        if (recompute2) {
          compute();
        }
        return true;
      }
      return false;
    }
  };
};
const cachedElements = {};
function renderMeta(context, key, data, config) {
  if ("attributesFor" in config) {
    return renderAttributes(context, key, data, config);
  }
  if ("group" in config) {
    return renderGroup(context, key, data, config);
  }
  return renderTag(context, key, data, config);
}
function renderGroup(context, key, data, config) {
  if (isArray(data)) {
    {
      console.warn("Specifying an array for group properties isnt supported");
    }
    return [];
  }
  return Object.keys(data).map((childKey) => {
    const groupConfig = {
      group: key,
      data
    };
    if (config.namespaced) {
      groupConfig.tagNamespace = config.namespaced === true ? key : config.namespaced;
    } else if (config.namespacedAttribute) {
      const namespace = config.namespacedAttribute === true ? key : config.namespacedAttribute;
      groupConfig.fullName = `${namespace}:${childKey}`;
      groupConfig.slotName = `${namespace}(${childKey})`;
    }
    return renderTag(context, key, data[childKey], config, groupConfig);
  }).filter(Boolean).flat();
}
function renderTag(context, key, data, config = {}, groupConfig) {
  const contentAttributes = ["content", "json", "rawContent"];
  const getTagConfig = (key2) => getTagConfigItem([tag, config.tag], key2);
  if (isArray(data)) {
    return data.map((child) => {
      return renderTag(context, key, child, config, groupConfig);
    }).filter(Boolean).flat();
  }
  const { tag = config.tag || key } = data;
  let content = "";
  let hasChilds = false;
  let isRaw = false;
  if (isString(data)) {
    content = data;
  } else if (data.children && isArray(data.children)) {
    hasChilds = true;
    content = data.children.map((child) => {
      const data2 = renderTag(context, key, child, config, groupConfig);
      if (isArray(data2)) {
        return data2.map(({ vnode: vnode2 }) => vnode2);
      }
      return data2 && data2.vnode;
    });
  } else {
    let i = 0;
    for (const contentAttribute of contentAttributes) {
      if (!content && data[contentAttribute]) {
        if (i === 1) {
          content = JSON.stringify(data[contentAttribute]);
        } else {
          content = data[contentAttribute];
        }
        isRaw = i > 1;
        break;
      }
      i++;
    }
  }
  const fullName = groupConfig && groupConfig.fullName || key;
  const slotName = groupConfig && groupConfig.slotName || key;
  let { attrs: attributes } = data;
  if (!attributes && typeof data === "object") {
    attributes = __spreadValues({}, data);
    delete attributes.tag;
    delete attributes.children;
    delete attributes.to;
    for (const attr of contentAttributes) {
      delete attributes[attr];
    }
  } else if (!attributes) {
    attributes = {};
  }
  if (hasChilds) {
    content = getSlotContent(context, slotName, content, data);
  } else {
    const contentAsAttribute = !!getTagConfig("contentAsAttribute");
    let { valueAttribute } = config;
    if (!valueAttribute && contentAsAttribute) {
      const [tagAttribute] = getTagConfig("attributes");
      valueAttribute = isString(contentAsAttribute) ? contentAsAttribute : tagAttribute;
    }
    if (!valueAttribute) {
      content = getSlotContent(context, slotName, content, data);
    } else {
      const { nameless } = config;
      if (!nameless) {
        const keyAttribute = config.keyAttribute || getTagConfig("keyAttribute");
        if (keyAttribute) {
          attributes[keyAttribute] = fullName;
        }
      }
      attributes[valueAttribute] = getSlotContent(context, slotName, attributes[valueAttribute] || content, groupConfig);
      content = "";
    }
  }
  const finalTag = groupConfig && groupConfig.tagNamespace ? `${groupConfig.tagNamespace}:${tag}` : tag;
  if (finalTag === "title" && !context.isSSR) {
    document.title = content;
    return;
  }
  if (isRaw && content) {
    attributes.innerHTML = content;
  }
  const vnode = vue.h(finalTag, attributes, content || void 0);
  return {
    to: data.to,
    vnode
  };
}
function renderAttributes(context, key, data, config) {
  const { attributesFor } = config;
  if (!attributesFor || !data) {
    return;
  }
  if (context.isSSR) {
    return {
      to: "",
      vnode: vue.h(`ssr-${attributesFor}`, data)
    };
  }
  if (!cachedElements[attributesFor]) {
    const [el2, el22] = Array.from(document.querySelectorAll(attributesFor));
    if (!el2) {
      console.error("Could not find element for selector", attributesFor, ", won't render attributes");
      return;
    }
    if (el22) {
      console.warn("Found multiple elements for selector", attributesFor);
    }
    cachedElements[attributesFor] = {
      el: el2,
      attrs: []
    };
  }
  const { el, attrs } = cachedElements[attributesFor];
  for (const attr in data) {
    let content = getSlotContent(context, `${key}(${attr})`, data[attr], data);
    if (isArray(content)) {
      content = content.join(",");
    }
    el.setAttribute(attr, content || "");
    if (!attrs.includes(attr)) {
      attrs.push(attr);
    }
  }
  const attrsToRemove = attrs.filter((attr) => !data[attr]);
  for (const attr of attrsToRemove) {
    el.removeAttribute(attr);
  }
}
function getSlotContent({ metainfo, slots }, slotName, content, groupConfig) {
  const slot = slots && slots[slotName];
  if (!slot || !isFunction(slot)) {
    return content;
  }
  const slotScopeProps = {
    content,
    metainfo
  };
  if (groupConfig && groupConfig.group) {
    const { group, data } = groupConfig;
    slotScopeProps[group] = data;
  }
  const slotContent = slot(slotScopeProps);
  if (slotContent && slotContent.length) {
    const { children } = slotContent[0];
    return children ? children.toString() : "";
  }
  return content;
}
const hasSymbol = typeof Symbol === "function" && typeof Symbol.toStringTag === "symbol";
const PolySymbol = (name) => hasSymbol ? Symbol("[vue-meta]: " + name) : "[vue-meta]: " + name;
const metaActiveKey = /* @__PURE__ */ PolySymbol("meta_active");
function applyDifference(target, newSource, oldSource) {
  for (const key in newSource) {
    if (!(key in oldSource)) {
      target[key] = newSource[key];
      continue;
    }
    if (isObject(target[key])) {
      applyDifference(target[key], newSource[key], oldSource[key]);
      continue;
    }
    if (newSource[key] !== oldSource[key]) {
      target[key] = newSource[key];
    }
  }
  for (const key in oldSource) {
    if (!newSource || !(key in newSource)) {
      delete target[key];
    }
  }
}
function getCurrentManager(vm) {
  if (!vm) {
    vm = vue.getCurrentInstance() || void 0;
  }
  if (!vm) {
    return void 0;
  }
  return vm.appContext.config.globalProperties.$metaManager;
}
function useMeta(source, manager) {
  const vm = vue.getCurrentInstance() || void 0;
  if (!manager && vm) {
    manager = getCurrentManager(vm);
  }
  if (!manager) {
    throw new Error("No manager or current instance");
  }
  if (vue.isProxy(source)) {
    vue.watch(source, (newSource, oldSource) => {
      applyDifference(metaProxy.meta, newSource, oldSource);
    });
    source = source.value;
  }
  const metaProxy = manager.addMeta(source, vm);
  return metaProxy;
}
const MetainfoImpl = vue.defineComponent({
  name: "Metainfo",
  inheritAttrs: false,
  setup(_, { slots }) {
    return () => {
      const manager = getCurrentManager();
      if (!manager) {
        return;
      }
      return manager.render({ slots });
    };
  }
});
const Metainfo = MetainfoImpl;
const ssrAttribute = "data-vm-ssr";
function addVnode(isSSR, teleports, to, vnodes) {
  const nodes = isArray(vnodes) ? vnodes : [vnodes];
  if (!isSSR) {
    nodes.forEach((vnode, idx) => {
      if (vnode.type === vue.Comment) {
        nodes.splice(idx, 1);
      }
    });
  } else if (!to.endsWith("Attrs")) {
    nodes.forEach((vnode) => {
      if (!vnode.props) {
        vnode.props = {};
      }
      vnode.props[ssrAttribute] = true;
    });
  }
  if (!teleports[to]) {
    teleports[to] = [];
  }
  teleports[to].push(...nodes);
}
const createMetaManager = (isSSR = false, config, resolver) => MetaManager.create(isSSR, config || defaultConfig, resolver || defaultResolver);
const _MetaManager = class {
  constructor(isSSR, config, target, resolver) {
    __publicField(this, "isSSR", false);
    __publicField(this, "config");
    __publicField(this, "target");
    __publicField(this, "resolver");
    __publicField(this, "ssrCleanedUp", false);
    this.isSSR = isSSR;
    this.config = config;
    this.target = target;
    if (resolver && "setup" in resolver && isFunction(resolver.setup)) {
      this.resolver = resolver;
    }
  }
  install(app) {
    app.component("Metainfo", Metainfo);
    app.config.globalProperties.$metaManager = this;
    app.provide(metaActiveKey, this.target.context.active);
  }
  addMeta(metadata, vm) {
    if (!vm) {
      vm = vue.getCurrentInstance() || void 0;
    }
    const metaGuards = {
      removed: []
    };
    const resolveContext = { vm };
    const { resolver } = this;
    if (resolver && resolver.setup) {
      resolver.setup(resolveContext);
    }
    const meta = this.target.addSource(metadata, resolveContext, true);
    const onRemoved = (removeGuard) => metaGuards.removed.push(removeGuard);
    const unmount = (ignoreGuards) => this.unmount(!!ignoreGuards, meta, metaGuards, vm);
    if (vm) {
      vue.onUnmounted(unmount);
    }
    return {
      meta,
      onRemoved,
      unmount
    };
  }
  unmount(ignoreGuards, meta, metaGuards, vm) {
    if (vm) {
      const { $el } = vm.proxy;
      if ($el && $el.offsetParent) {
        let observer = new MutationObserver((records) => {
          for (const { removedNodes } of records) {
            if (!removedNodes) {
              continue;
            }
            removedNodes.forEach((el) => {
              if (el === $el && observer) {
                observer.disconnect();
                observer = void 0;
                this.reallyUnmount(ignoreGuards, meta, metaGuards);
              }
            });
          }
        });
        observer.observe($el.parentNode, { childList: true });
        return;
      }
    }
    this.reallyUnmount(ignoreGuards, meta, metaGuards);
  }
  async reallyUnmount(ignoreGuards, meta, metaGuards) {
    this.target.delSource(meta);
    if (!ignoreGuards && metaGuards) {
      await Promise.all(metaGuards.removed.map((removeGuard) => removeGuard()));
    }
  }
  render({ slots } = {}) {
    const active = this.target.context.active;
    const { isSSR } = this;
    if (!isSSR && !this.ssrCleanedUp) {
      this.ssrCleanedUp = true;
      const cleanUpSSR = () => {
        const ssrTags = document.querySelectorAll(`[${ssrAttribute}]`);
        if (ssrTags && ssrTags.length) {
          ssrTags.forEach((el) => el.parentNode && el.parentNode.removeChild(el));
        }
      };
      if (document.readyState === "loading") {
        window.addEventListener("DOMContentLoaded", cleanUpSSR, { once: true });
      } else {
        cleanUpSSR();
      }
    }
    const teleports = {};
    for (const key in active) {
      const config = this.config[key] || {};
      let renderedNodes = renderMeta({ isSSR, metainfo: active, slots }, key, active[key], config);
      if (!renderedNodes) {
        continue;
      }
      if (!isArray(renderedNodes)) {
        renderedNodes = [renderedNodes];
      }
      let defaultTo = key !== "base" && active[key].to;
      if (!defaultTo && "to" in config) {
        defaultTo = config.to;
      }
      if (!defaultTo && "attributesFor" in config) {
        defaultTo = key;
      }
      for (const { to, vnode } of renderedNodes) {
        addVnode(this.isSSR, teleports, to || defaultTo || "head", vnode);
      }
    }
    if (slots) {
      for (const slotName in slots) {
        const tagName = slotName === "default" ? "head" : slotName;
        if (tagName !== "head" && tagName !== "body") {
          continue;
        }
        const slot = slots[slotName];
        if (isFunction(slot)) {
          addVnode(this.isSSR, teleports, tagName, slot({ metainfo: active }));
        }
      }
    }
    return Object.keys(teleports).map((to) => {
      const teleport = teleports[to];
      return vue.h(vue.Teleport, { to }, teleport);
    });
  }
};
let MetaManager = _MetaManager;
__publicField(MetaManager, "create", (isSSR, config, resolver) => {
  const resolve2 = (options, contexts, active2, key, pathSegments) => {
    if (isFunction(resolver)) {
      return resolver(options, contexts, active2, key, pathSegments);
    }
    return resolver.resolve(options, contexts, active2, key, pathSegments);
  };
  const active = vue.reactive({});
  const mergedObject = createMergedObject(resolve2, active);
  const manager = new _MetaManager(isSSR, config, mergedObject, resolver);
  return manager;
});
var DomHandler = {
  innerWidth(el) {
    let width = el.offsetWidth;
    let style = getComputedStyle(el);
    width += parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    return width;
  },
  width(el) {
    let width = el.offsetWidth;
    let style = getComputedStyle(el);
    width -= parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
    return width;
  },
  getWindowScrollTop() {
    let doc = document.documentElement;
    return (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
  },
  getWindowScrollLeft() {
    let doc = document.documentElement;
    return (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0);
  },
  getOuterWidth(el, margin) {
    if (el) {
      let width = el.offsetWidth;
      if (margin) {
        let style = getComputedStyle(el);
        width += parseFloat(style.marginLeft) + parseFloat(style.marginRight);
      }
      return width;
    } else {
      return 0;
    }
  },
  getOuterHeight(el, margin) {
    if (el) {
      let height = el.offsetHeight;
      if (margin) {
        let style = getComputedStyle(el);
        height += parseFloat(style.marginTop) + parseFloat(style.marginBottom);
      }
      return height;
    } else {
      return 0;
    }
  },
  getClientHeight(el, margin) {
    if (el) {
      let height = el.clientHeight;
      if (margin) {
        let style = getComputedStyle(el);
        height += parseFloat(style.marginTop) + parseFloat(style.marginBottom);
      }
      return height;
    } else {
      return 0;
    }
  },
  getViewport() {
    let win = window, d = document, e = d.documentElement, g = d.getElementsByTagName("body")[0], w = win.innerWidth || e.clientWidth || g.clientWidth, h = win.innerHeight || e.clientHeight || g.clientHeight;
    return { width: w, height: h };
  },
  getOffset(el) {
    var rect = el.getBoundingClientRect();
    return {
      top: rect.top + (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0),
      left: rect.left + (window.pageXOffset || document.documentElement.scrollLeft || document.body.scrollLeft || 0)
    };
  },
  index(element) {
    let children = element.parentNode.childNodes;
    let num = 0;
    for (var i = 0; i < children.length; i++) {
      if (children[i] === element)
        return num;
      if (children[i].nodeType === 1)
        num++;
    }
    return -1;
  },
  addMultipleClasses(element, className) {
    if (element.classList) {
      let styles = className.split(" ");
      for (let i = 0; i < styles.length; i++) {
        element.classList.add(styles[i]);
      }
    } else {
      let styles = className.split(" ");
      for (let i = 0; i < styles.length; i++) {
        element.className += " " + styles[i];
      }
    }
  },
  addClass(element, className) {
    if (element.classList)
      element.classList.add(className);
    else
      element.className += " " + className;
  },
  removeClass(element, className) {
    if (element.classList)
      element.classList.remove(className);
    else
      element.className = element.className.replace(new RegExp("(^|\\b)" + className.split(" ").join("|") + "(\\b|$)", "gi"), " ");
  },
  hasClass(element, className) {
    if (element) {
      if (element.classList)
        return element.classList.contains(className);
      else
        return new RegExp("(^| )" + className + "( |$)", "gi").test(element.className);
    }
    return false;
  },
  find(element, selector) {
    return element.querySelectorAll(selector);
  },
  findSingle(element, selector) {
    return element.querySelector(selector);
  },
  getHeight(el) {
    let height = el.offsetHeight;
    let style = getComputedStyle(el);
    height -= parseFloat(style.paddingTop) + parseFloat(style.paddingBottom) + parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
    return height;
  },
  getWidth(el) {
    let width = el.offsetWidth;
    let style = getComputedStyle(el);
    width -= parseFloat(style.paddingLeft) + parseFloat(style.paddingRight) + parseFloat(style.borderLeftWidth) + parseFloat(style.borderRightWidth);
    return width;
  },
  absolutePosition(element, target) {
    let elementDimensions = element.offsetParent ? { width: element.offsetWidth, height: element.offsetHeight } : this.getHiddenElementDimensions(element);
    let elementOuterHeight = elementDimensions.height;
    let elementOuterWidth = elementDimensions.width;
    let targetOuterHeight = target.offsetHeight;
    let targetOuterWidth = target.offsetWidth;
    let targetOffset = target.getBoundingClientRect();
    let windowScrollTop = this.getWindowScrollTop();
    let windowScrollLeft = this.getWindowScrollLeft();
    let viewport = this.getViewport();
    let top, left;
    if (targetOffset.top + targetOuterHeight + elementOuterHeight > viewport.height) {
      top = targetOffset.top + windowScrollTop - elementOuterHeight;
      element.style.transformOrigin = "bottom";
      if (top < 0) {
        top = windowScrollTop;
      }
    } else {
      top = targetOuterHeight + targetOffset.top + windowScrollTop;
      element.style.transformOrigin = "top";
    }
    if (targetOffset.left + elementOuterWidth > viewport.width)
      left = Math.max(0, targetOffset.left + windowScrollLeft + targetOuterWidth - elementOuterWidth);
    else
      left = targetOffset.left + windowScrollLeft;
    element.style.top = top + "px";
    element.style.left = left + "px";
  },
  relativePosition(element, target) {
    let elementDimensions = element.offsetParent ? { width: element.offsetWidth, height: element.offsetHeight } : this.getHiddenElementDimensions(element);
    const targetHeight = target.offsetHeight;
    const targetOffset = target.getBoundingClientRect();
    const viewport = this.getViewport();
    let top, left;
    if (targetOffset.top + targetHeight + elementDimensions.height > viewport.height) {
      top = -1 * elementDimensions.height;
      element.style.transformOrigin = "bottom";
      if (targetOffset.top + top < 0) {
        top = -1 * targetOffset.top;
      }
    } else {
      top = targetHeight;
      element.style.transformOrigin = "top";
    }
    if (elementDimensions.width > viewport.width) {
      left = targetOffset.left * -1;
    } else if (targetOffset.left + elementDimensions.width > viewport.width) {
      left = (targetOffset.left + elementDimensions.width - viewport.width) * -1;
    } else {
      left = 0;
    }
    element.style.top = top + "px";
    element.style.left = left + "px";
  },
  getParents(element, parents = []) {
    return element["parentNode"] === null ? parents : this.getParents(element.parentNode, parents.concat([element.parentNode]));
  },
  getScrollableParents(element) {
    let scrollableParents = [];
    if (element) {
      let parents = this.getParents(element);
      const overflowRegex = /(auto|scroll)/;
      const overflowCheck = (node) => {
        let styleDeclaration = window["getComputedStyle"](node, null);
        return overflowRegex.test(styleDeclaration.getPropertyValue("overflow")) || overflowRegex.test(styleDeclaration.getPropertyValue("overflowX")) || overflowRegex.test(styleDeclaration.getPropertyValue("overflowY"));
      };
      for (let parent of parents) {
        let scrollSelectors = parent.nodeType === 1 && parent.dataset["scrollselectors"];
        if (scrollSelectors) {
          let selectors = scrollSelectors.split(",");
          for (let selector of selectors) {
            let el = this.findSingle(parent, selector);
            if (el && overflowCheck(el)) {
              scrollableParents.push(el);
            }
          }
        }
        if (parent.nodeType !== 9 && overflowCheck(parent)) {
          scrollableParents.push(parent);
        }
      }
    }
    return scrollableParents;
  },
  getHiddenElementOuterHeight(element) {
    element.style.visibility = "hidden";
    element.style.display = "block";
    let elementHeight = element.offsetHeight;
    element.style.display = "none";
    element.style.visibility = "visible";
    return elementHeight;
  },
  getHiddenElementOuterWidth(element) {
    element.style.visibility = "hidden";
    element.style.display = "block";
    let elementWidth = element.offsetWidth;
    element.style.display = "none";
    element.style.visibility = "visible";
    return elementWidth;
  },
  getHiddenElementDimensions(element) {
    var dimensions = {};
    element.style.visibility = "hidden";
    element.style.display = "block";
    dimensions.width = element.offsetWidth;
    dimensions.height = element.offsetHeight;
    element.style.display = "none";
    element.style.visibility = "visible";
    return dimensions;
  },
  fadeIn(element, duration) {
    element.style.opacity = 0;
    var last = +new Date();
    var opacity = 0;
    var tick = function() {
      opacity = +element.style.opacity + (new Date().getTime() - last) / duration;
      element.style.opacity = opacity;
      last = +new Date();
      if (+opacity < 1) {
        window.requestAnimationFrame && requestAnimationFrame(tick) || setTimeout(tick, 16);
      }
    };
    tick();
  },
  fadeOut(element, ms) {
    var opacity = 1, interval = 50, duration = ms, gap = interval / duration;
    let fading = setInterval(() => {
      opacity -= gap;
      if (opacity <= 0) {
        opacity = 0;
        clearInterval(fading);
      }
      element.style.opacity = opacity;
    }, interval);
  },
  getUserAgent() {
    return navigator.userAgent;
  },
  appendChild(element, target) {
    if (this.isElement(target))
      target.appendChild(element);
    else if (target.el && target.elElement)
      target.elElement.appendChild(element);
    else
      throw new Error("Cannot append " + target + " to " + element);
  },
  scrollInView(container, item) {
    let borderTopValue = getComputedStyle(container).getPropertyValue("borderTopWidth");
    let borderTop = borderTopValue ? parseFloat(borderTopValue) : 0;
    let paddingTopValue = getComputedStyle(container).getPropertyValue("paddingTop");
    let paddingTop = paddingTopValue ? parseFloat(paddingTopValue) : 0;
    let containerRect = container.getBoundingClientRect();
    let itemRect = item.getBoundingClientRect();
    let offset = itemRect.top + document.body.scrollTop - (containerRect.top + document.body.scrollTop) - borderTop - paddingTop;
    let scroll = container.scrollTop;
    let elementHeight = container.clientHeight;
    let itemHeight = this.getOuterHeight(item);
    if (offset < 0) {
      container.scrollTop = scroll + offset;
    } else if (offset + itemHeight > elementHeight) {
      container.scrollTop = scroll + offset - elementHeight + itemHeight;
    }
  },
  clearSelection() {
    if (window.getSelection) {
      if (window.getSelection().empty) {
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges && window.getSelection().rangeCount > 0 && window.getSelection().getRangeAt(0).getClientRects().length > 0) {
        window.getSelection().removeAllRanges();
      }
    } else if (document["selection"] && document["selection"].empty) {
      try {
        document["selection"].empty();
      } catch (error) {
      }
    }
  },
  calculateScrollbarWidth() {
    if (this.calculatedScrollbarWidth != null)
      return this.calculatedScrollbarWidth;
    let scrollDiv = document.createElement("div");
    scrollDiv.className = "p-scrollbar-measure";
    document.body.appendChild(scrollDiv);
    let scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    document.body.removeChild(scrollDiv);
    this.calculatedScrollbarWidth = scrollbarWidth;
    return scrollbarWidth;
  },
  getBrowser() {
    if (!this.browser) {
      let matched = this.resolveUserAgent();
      this.browser = {};
      if (matched.browser) {
        this.browser[matched.browser] = true;
        this.browser["version"] = matched.version;
      }
      if (this.browser["chrome"]) {
        this.browser["webkit"] = true;
      } else if (this.browser["webkit"]) {
        this.browser["safari"] = true;
      }
    }
    return this.browser;
  },
  resolveUserAgent() {
    let ua = navigator.userAgent.toLowerCase();
    let match = /(chrome)[ ]([\w.]+)/.exec(ua) || /(webkit)[ ]([\w.]+)/.exec(ua) || /(opera)(?:.*version|)[ ]([\w.]+)/.exec(ua) || /(msie) ([\w.]+)/.exec(ua) || ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua) || [];
    return {
      browser: match[1] || "",
      version: match[2] || "0"
    };
  },
  isVisible(element) {
    return element.offsetParent != null;
  },
  invokeElementMethod(element, methodName, args) {
    element[methodName].apply(element, args);
  },
  getFocusableElements(element) {
    let focusableElements = this.find(element, `button:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden]),
                [href][clientHeight][clientWidth]:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden]),
                input:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden]), select:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden]),
                textarea:not([tabindex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden]), [tabIndex]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden]),
                [contenteditable]:not([tabIndex = "-1"]):not([disabled]):not([style*="display:none"]):not([hidden])`);
    let visibleFocusableElements = [];
    for (let focusableElement of focusableElements) {
      if (getComputedStyle(focusableElement).display != "none" && getComputedStyle(focusableElement).visibility != "hidden")
        visibleFocusableElements.push(focusableElement);
    }
    return visibleFocusableElements;
  },
  getFirstFocusableElement(element) {
    const focusableElements = this.getFocusableElements(element);
    return focusableElements.length > 0 ? focusableElements[0] : null;
  },
  isClickable(element) {
    const targetNode = element.nodeName;
    const parentNode = element.parentElement && element.parentElement.nodeName;
    return targetNode == "INPUT" || targetNode == "BUTTON" || targetNode == "A" || parentNode == "INPUT" || parentNode == "BUTTON" || parentNode == "A" || this.hasClass(element, "p-button") || this.hasClass(element.parentElement, "p-button") || this.hasClass(element.parentElement, "p-checkbox") || this.hasClass(element.parentElement, "p-radiobutton");
  },
  applyStyle(element, style) {
    if (typeof style === "string") {
      element.style.cssText = this.style;
    } else {
      for (let prop in this.style) {
        element.style[prop] = style[prop];
      }
    }
  },
  isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window["MSStream"];
  },
  isAndroid() {
    return /(android)/i.test(navigator.userAgent);
  },
  isTouchDevice() {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  }
};
class ConnectedOverlayScrollHandler {
  constructor(element, listener = () => {
  }) {
    this.element = element;
    this.listener = listener;
  }
  bindScrollListener() {
    this.scrollableParents = DomHandler.getScrollableParents(this.element);
    for (let i = 0; i < this.scrollableParents.length; i++) {
      this.scrollableParents[i].addEventListener("scroll", this.listener);
    }
  }
  unbindScrollListener() {
    if (this.scrollableParents) {
      for (let i = 0; i < this.scrollableParents.length; i++) {
        this.scrollableParents[i].removeEventListener("scroll", this.listener);
      }
    }
  }
  destroy() {
    this.unbindScrollListener();
    this.element = null;
    this.listener = null;
    this.scrollableParents = null;
  }
}
var ObjectUtils = {
  equals(obj1, obj2, field) {
    if (field)
      return this.resolveFieldData(obj1, field) === this.resolveFieldData(obj2, field);
    else
      return this.deepEquals(obj1, obj2);
  },
  deepEquals(a, b) {
    if (a === b)
      return true;
    if (a && b && typeof a == "object" && typeof b == "object") {
      var arrA = Array.isArray(a), arrB = Array.isArray(b), i, length, key;
      if (arrA && arrB) {
        length = a.length;
        if (length != b.length)
          return false;
        for (i = length; i-- !== 0; )
          if (!this.deepEquals(a[i], b[i]))
            return false;
        return true;
      }
      if (arrA != arrB)
        return false;
      var dateA = a instanceof Date, dateB = b instanceof Date;
      if (dateA != dateB)
        return false;
      if (dateA && dateB)
        return a.getTime() == b.getTime();
      var regexpA = a instanceof RegExp, regexpB = b instanceof RegExp;
      if (regexpA != regexpB)
        return false;
      if (regexpA && regexpB)
        return a.toString() == b.toString();
      var keys = Object.keys(a);
      length = keys.length;
      if (length !== Object.keys(b).length)
        return false;
      for (i = length; i-- !== 0; )
        if (!Object.prototype.hasOwnProperty.call(b, keys[i]))
          return false;
      for (i = length; i-- !== 0; ) {
        key = keys[i];
        if (!this.deepEquals(a[key], b[key]))
          return false;
      }
      return true;
    }
    return a !== a && b !== b;
  },
  resolveFieldData(data, field) {
    if (data && Object.keys(data).length && field) {
      if (this.isFunction(field)) {
        return field(data);
      } else if (field.indexOf(".") === -1) {
        return data[field];
      } else {
        let fields = field.split(".");
        let value = data;
        for (var i = 0, len = fields.length; i < len; ++i) {
          if (value == null) {
            return null;
          }
          value = value[fields[i]];
        }
        return value;
      }
    } else {
      return null;
    }
  },
  isFunction(obj) {
    return !!(obj && obj.constructor && obj.call && obj.apply);
  },
  filter(value, fields, filterValue) {
    var filteredItems = [];
    if (value) {
      for (let item of value) {
        for (let field of fields) {
          if (String(this.resolveFieldData(item, field)).toLowerCase().indexOf(filterValue.toLowerCase()) > -1) {
            filteredItems.push(item);
            break;
          }
        }
      }
    }
    return filteredItems;
  },
  reorderArray(value, from, to) {
    let target;
    if (value && from !== to) {
      if (to >= value.length) {
        target = to - value.length;
        while (target-- + 1) {
          value.push(void 0);
        }
      }
      value.splice(to, 0, value.splice(from, 1)[0]);
    }
  },
  findIndexInList(value, list) {
    let index = -1;
    if (list) {
      for (let i = 0; i < list.length; i++) {
        if (list[i] === value) {
          index = i;
          break;
        }
      }
    }
    return index;
  },
  contains(value, list) {
    if (value != null && list && list.length) {
      for (let val of list) {
        if (this.equals(value, val))
          return true;
      }
    }
    return false;
  },
  insertIntoOrderedArray(item, index, arr, sourceArr) {
    if (arr.length > 0) {
      let injected = false;
      for (let i = 0; i < arr.length; i++) {
        let currentItemIndex = this.findIndexInList(arr[i], sourceArr);
        if (currentItemIndex > index) {
          arr.splice(i, 0, item);
          injected = true;
          break;
        }
      }
      if (!injected) {
        arr.push(item);
      }
    } else {
      arr.push(item);
    }
  },
  removeAccents(str) {
    if (str && str.search(/[\xC0-\xFF]/g) > -1) {
      str = str.replace(/[\xC0-\xC5]/g, "A").replace(/[\xC6]/g, "AE").replace(/[\xC7]/g, "C").replace(/[\xC8-\xCB]/g, "E").replace(/[\xCC-\xCF]/g, "I").replace(/[\xD0]/g, "D").replace(/[\xD1]/g, "N").replace(/[\xD2-\xD6\xD8]/g, "O").replace(/[\xD9-\xDC]/g, "U").replace(/[\xDD]/g, "Y").replace(/[\xDE]/g, "P").replace(/[\xE0-\xE5]/g, "a").replace(/[\xE6]/g, "ae").replace(/[\xE7]/g, "c").replace(/[\xE8-\xEB]/g, "e").replace(/[\xEC-\xEF]/g, "i").replace(/[\xF1]/g, "n").replace(/[\xF2-\xF6\xF8]/g, "o").replace(/[\xF9-\xFC]/g, "u").replace(/[\xFE]/g, "p").replace(/[\xFD\xFF]/g, "y");
    }
    return str;
  },
  getVNodeProp(vnode, prop) {
    let props = vnode.props;
    if (props) {
      let kebapProp = prop.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
      let propName = Object.prototype.hasOwnProperty.call(props, kebapProp) ? kebapProp : prop;
      return vnode.type.props[prop].type === Boolean && props[propName] === "" ? true : props[propName];
    }
    return null;
  }
};
function handler() {
  let zIndexes = [];
  const generateZIndex = (key, baseZIndex) => {
    let lastZIndex = zIndexes.length > 0 ? zIndexes[zIndexes.length - 1] : { key, value: baseZIndex };
    let newZIndex = lastZIndex.value + (lastZIndex.key === key ? 0 : baseZIndex) + 1;
    zIndexes.push({ key, value: newZIndex });
    return newZIndex;
  };
  const revertZIndex = (zIndex) => {
    zIndexes = zIndexes.filter((obj) => obj.value !== zIndex);
  };
  const getCurrentZIndex = () => {
    return zIndexes.length > 0 ? zIndexes[zIndexes.length - 1].value : 0;
  };
  const getZIndex = (el) => {
    return el ? parseInt(el.style.zIndex, 10) || 0 : 0;
  };
  return {
    get: getZIndex,
    set: (key, el, baseZIndex) => {
      if (el) {
        el.style.zIndex = String(generateZIndex(key, baseZIndex));
      }
    },
    clear: (el) => {
      if (el) {
        revertZIndex(getZIndex(el));
        el.style.zIndex = "";
      }
    },
    getCurrent: () => getCurrentZIndex()
  };
}
var ZIndexUtils = handler();
var lastId = 0;
function UniqueComponentId(prefix2 = "pv_id_") {
  lastId++;
  return `${prefix2}${lastId}`;
}
function primebus() {
  const allHandlers = new Map();
  return {
    on(type, handler2) {
      let handlers = allHandlers.get(type);
      if (!handlers)
        handlers = [handler2];
      else
        handlers.push(handler2);
      allHandlers.set(type, handlers);
    },
    off(type, handler2) {
      let handlers = allHandlers.get(type);
      if (handlers) {
        handlers.splice(handlers.indexOf(handler2) >>> 0, 1);
      }
    },
    emit(type, evt) {
      let handlers = allHandlers.get(type);
      if (handlers) {
        handlers.slice().map((handler2) => {
          handler2(evt);
        });
      }
    }
  };
}
const FilterMatchMode = {
  STARTS_WITH: "startsWith",
  CONTAINS: "contains",
  NOT_CONTAINS: "notContains",
  ENDS_WITH: "endsWith",
  EQUALS: "equals",
  NOT_EQUALS: "notEquals",
  IN: "in",
  LESS_THAN: "lt",
  LESS_THAN_OR_EQUAL_TO: "lte",
  GREATER_THAN: "gt",
  GREATER_THAN_OR_EQUAL_TO: "gte",
  BETWEEN: "between",
  DATE_IS: "dateIs",
  DATE_IS_NOT: "dateIsNot",
  DATE_BEFORE: "dateBefore",
  DATE_AFTER: "dateAfter"
};
const defaultOptions = {
  ripple: false,
  inputStyle: "outlined",
  locale: {
    startsWith: "Starts with",
    contains: "Contains",
    notContains: "Not contains",
    endsWith: "Ends with",
    equals: "Equals",
    notEquals: "Not equals",
    noFilter: "No Filter",
    lt: "Less than",
    lte: "Less than or equal to",
    gt: "Greater than",
    gte: "Greater than or equal to",
    dateIs: "Date is",
    dateIsNot: "Date is not",
    dateBefore: "Date is before",
    dateAfter: "Date is after",
    clear: "Clear",
    apply: "Apply",
    matchAll: "Match All",
    matchAny: "Match Any",
    addRule: "Add Rule",
    removeRule: "Remove Rule",
    accept: "Yes",
    reject: "No",
    choose: "Choose",
    upload: "Upload",
    cancel: "Cancel",
    dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    dayNamesMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
    monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    today: "Today",
    weekHeader: "Wk",
    firstDayOfWeek: 0,
    dateFormat: "mm/dd/yy",
    weak: "Weak",
    medium: "Medium",
    strong: "Strong",
    passwordPrompt: "Enter a password",
    emptyFilterMessage: "No results found",
    emptyMessage: "No available options"
  },
  filterMatchModeOptions: {
    text: [
      FilterMatchMode.STARTS_WITH,
      FilterMatchMode.CONTAINS,
      FilterMatchMode.NOT_CONTAINS,
      FilterMatchMode.ENDS_WITH,
      FilterMatchMode.EQUALS,
      FilterMatchMode.NOT_EQUALS
    ],
    numeric: [
      FilterMatchMode.EQUALS,
      FilterMatchMode.NOT_EQUALS,
      FilterMatchMode.LESS_THAN,
      FilterMatchMode.LESS_THAN_OR_EQUAL_TO,
      FilterMatchMode.GREATER_THAN,
      FilterMatchMode.GREATER_THAN_OR_EQUAL_TO
    ],
    date: [
      FilterMatchMode.DATE_IS,
      FilterMatchMode.DATE_IS_NOT,
      FilterMatchMode.DATE_BEFORE,
      FilterMatchMode.DATE_AFTER
    ]
  },
  zIndex: {
    modal: 1100,
    overlay: 1e3,
    menu: 1e3,
    tooltip: 1100
  }
};
const PrimeVueSymbol = Symbol();
var PrimeVue = {
  install: (app, options) => {
    let configOptions = options ? __spreadValues(__spreadValues({}, defaultOptions), options) : __spreadValues({}, defaultOptions);
    const PrimeVue2 = {
      config: vue.reactive(configOptions)
    };
    app.config.globalProperties.$primevue = PrimeVue2;
    app.provide(PrimeVueSymbol, PrimeVue2);
  }
};
var ConfirmationEventBus = primebus();
const PrimeVueConfirmSymbol = Symbol();
var ConfirmationService = {
  install: (app) => {
    const ConfirmationService2 = {
      require: (options) => {
        ConfirmationEventBus.emit("confirm", options);
      },
      close: () => {
        ConfirmationEventBus.emit("close");
      }
    };
    app.config.globalProperties.$confirm = ConfirmationService2;
    app.provide(PrimeVueConfirmSymbol, ConfirmationService2);
  }
};
const PrimeVueToastSymbol = Symbol();
var ToastEventBus = primebus();
var ToastService = {
  install: (app) => {
    const ToastService2 = {
      add: (message) => {
        ToastEventBus.emit("add", message);
      },
      removeGroup: (group) => {
        ToastEventBus.emit("remove-group", group);
      },
      removeAllGroups: () => {
        ToastEventBus.emit("remove-all-groups");
      }
    };
    app.config.globalProperties.$toast = ToastService2;
    app.provide(PrimeVueToastSymbol, ToastService2);
  }
};
function bind(el, binding) {
  el.$_pstyleclass_clicklistener = () => {
    const target = resolveTarget(el, binding);
    if (binding.value.toggleClass) {
      if (DomHandler.hasClass(target, binding.value.toggleClass))
        DomHandler.removeClass(target, binding.value.toggleClass);
      else
        DomHandler.addClass(target, binding.value.toggleClass);
    } else {
      if (target.offsetParent === null)
        enter(target, el, binding);
      else
        leave(target, binding);
    }
  };
  el.addEventListener("click", el.$_pstyleclass_clicklistener);
}
function unbind(el) {
  if (el.$_pstyleclass_clicklistener) {
    el.addEventListener("click", el.$_pstyleclass_clicklistener);
    el.$_pstyleclass_clicklistener = null;
  }
  unbindDocumentListener(el);
}
function enter(target, el, binding) {
  if (binding.value.enterActiveClass) {
    if (!target.$_pstyleclass_animating) {
      target.$_pstyleclass_animating = true;
      if (binding.value.enterActiveClass === "slidedown") {
        target.style.height = "0px";
        DomHandler.removeClass(target, "hidden");
        target.style.maxHeight = target.scrollHeight + "px";
        DomHandler.addClass(target, "hidden");
        target.style.height = "";
      }
      DomHandler.addClass(target, binding.value.enterActiveClass);
      if (binding.value.enterClass) {
        DomHandler.removeClass(target, binding.value.enterClass);
      }
      target.$p_styleclass_enterlistener = () => {
        DomHandler.removeClass(target, binding.value.enterActiveClass);
        if (binding.value.enterToClass) {
          DomHandler.addClass(target, binding.value.enterToClass);
        }
        target.removeEventListener("animationend", target.$p_styleclass_enterlistener);
        if (binding.value.enterActiveClass === "slidedown") {
          target.style.maxHeight = "";
        }
        target.$_pstyleclass_animating = false;
      };
      target.addEventListener("animationend", target.$p_styleclass_enterlistener);
    }
  } else {
    if (binding.value.enterClass) {
      DomHandler.removeClass(target, binding.value.enterClass);
    }
    if (binding.value.enterToClass) {
      DomHandler.addClass(target, binding.value.enterToClass);
    }
  }
  if (binding.value.hideOnOutsideClick) {
    bindDocumentListener(target, el, binding);
  }
}
function leave(target, binding) {
  if (binding.value.leaveActiveClass) {
    if (!target.$_pstyleclass_animating) {
      target.$_pstyleclass_animating = true;
      DomHandler.addClass(target, binding.value.leaveActiveClass);
      if (binding.value.leaveClass) {
        DomHandler.removeClass(target, binding.value.leaveClass);
      }
      target.$p_styleclass_leavelistener = () => {
        DomHandler.removeClass(target, binding.value.leaveActiveClass);
        if (binding.value.leaveToClass) {
          DomHandler.addClass(target, binding.value.leaveToClass);
        }
        target.removeEventListener("animationend", target.$p_styleclass_leavelistener);
        target.$_pstyleclass_animating = false;
      };
      target.addEventListener("animationend", target.$p_styleclass_leavelistener);
    }
  } else {
    if (binding.value.leaveClass) {
      DomHandler.removeClass(target, binding.value.leaveClass);
    }
    if (binding.value.leaveToClass) {
      DomHandler.addClass(target, binding.value.leaveToClass);
    }
  }
  if (binding.value.hideOnOutsideClick) {
    unbindDocumentListener(target);
  }
}
function resolveTarget(el, binding) {
  switch (binding.value.selector) {
    case "@next":
      return el.nextElementSibling;
    case "@prev":
      return el.previousElementSibling;
    case "@parent":
      return el.parentElement;
    case "@grandparent":
      return el.parentElement.parentElement;
    default:
      return document.querySelector(binding.value.selector);
  }
}
function bindDocumentListener(target, el, binding) {
  if (!target.$p_styleclass_documentlistener) {
    target.$p_styleclass_documentlistener = (event) => {
      if (getComputedStyle(target).getPropertyValue("position") === "static") {
        unbindDocumentListener(target);
      } else if (!el.isSameNode(event.target) && !el.contains(event.target) && !target.contains(event.target)) {
        leave(target, binding);
      }
    };
    target.ownerDocument.addEventListener("click", target.$p_styleclass_documentlistener);
  }
}
function unbindDocumentListener(target) {
  if (target.$p_styleclass_documentlistener) {
    target.ownerDocument.removeEventListener("click", target.$p_styleclass_documentlistener);
    target.$p_styleclass_documentlistener = null;
  }
}
const StyleClass = {
  mounted(el, binding) {
    bind(el, binding);
  },
  unmounted(el) {
    unbind(el);
  }
};
function bindEvents(el) {
  el.addEventListener("mousedown", onMouseDown);
}
function unbindEvents(el) {
  el.removeEventListener("mousedown", onMouseDown);
}
function create(el) {
  let ink = document.createElement("span");
  ink.className = "p-ink";
  el.appendChild(ink);
  ink.addEventListener("animationend", onAnimationEnd);
}
function remove(el) {
  let ink = getInk(el);
  if (ink) {
    unbindEvents(el);
    ink.removeEventListener("animationend", onAnimationEnd);
    ink.remove();
  }
}
function onMouseDown(event) {
  let target = event.currentTarget;
  let ink = getInk(target);
  if (!ink || getComputedStyle(ink, null).display === "none") {
    return;
  }
  DomHandler.removeClass(ink, "p-ink-active");
  if (!DomHandler.getHeight(ink) && !DomHandler.getWidth(ink)) {
    let d = Math.max(DomHandler.getOuterWidth(target), DomHandler.getOuterHeight(target));
    ink.style.height = d + "px";
    ink.style.width = d + "px";
  }
  let offset = DomHandler.getOffset(target);
  let x = event.pageX - offset.left + document.body.scrollTop - DomHandler.getWidth(ink) / 2;
  let y = event.pageY - offset.top + document.body.scrollLeft - DomHandler.getHeight(ink) / 2;
  ink.style.top = y + "px";
  ink.style.left = x + "px";
  DomHandler.addClass(ink, "p-ink-active");
}
function onAnimationEnd(event) {
  DomHandler.removeClass(event.currentTarget, "p-ink-active");
}
function getInk(el) {
  for (let i = 0; i < el.children.length; i++) {
    if (typeof el.children[i].className === "string" && el.children[i].className.indexOf("p-ink") !== -1) {
      return el.children[i];
    }
  }
  return null;
}
const Ripple = {
  mounted(el, binding) {
    if (binding.instance.$primevue && binding.instance.$primevue.config && binding.instance.$primevue.config.ripple) {
      create(el);
      bindEvents(el);
    }
  },
  unmounted(el) {
    remove(el);
  }
};
const BadgeDirective = {
  beforeMount(el, options) {
    const id = UniqueComponentId() + "_badge";
    el.$_pbadgeId = id;
    let badge = document.createElement("span");
    badge.id = id;
    badge.className = "p-badge p-component";
    for (let modifier in options.modifiers) {
      DomHandler.addClass(badge, "p-badge-" + modifier);
    }
    if (options.value != null) {
      badge.appendChild(document.createTextNode(options.value));
      if (String(options.value).length === 1) {
        DomHandler.addClass(badge, "p-badge-no-gutter");
      }
    } else {
      DomHandler.addClass(badge, "p-badge-dot");
    }
    DomHandler.addClass(el, "p-overlay-badge");
    el.appendChild(badge);
  },
  updated(el, options) {
    DomHandler.addClass(el, "p-overlay-badge");
    if (options.oldValue !== options.value) {
      let badge = document.getElementById(el.$_pbadgeId);
      if (options.value) {
        if (DomHandler.hasClass(badge, "p-badge-dot")) {
          DomHandler.removeClass(badge, "p-badge-dot");
        }
        if (String(options.value).length === 1)
          DomHandler.addClass(badge, "p-badge-no-gutter");
        else
          DomHandler.removeClass(badge, "p-badge-no-gutter");
      } else if (!options.value && !DomHandler.hasClass(badge, "p-badge-dot")) {
        DomHandler.addClass(badge, "p-badge-dot");
      }
      badge.innerHTML = "";
      badge.appendChild(document.createTextNode(options.value));
    }
  }
};
var primevue_min = '.p-component,.p-component *{box-sizing:border-box}.p-hidden{display:none}.p-hidden-space{visibility:hidden}.p-hidden-accessible{border:0;clip:rect(0 0 0 0);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px}.p-hidden-accessible input,.p-hidden-accessible select{transform:scale(0)}.p-reset{margin:0;padding:0;border:0;outline:0;text-decoration:none;font-size:100%;list-style:none}.p-disabled,.p-disabled *{cursor:default !important;pointer-events:none;user-select:none}.p-component-overlay{position:fixed;top:0;left:0;width:100%;height:100%}.p-overflow-hidden{overflow:hidden}.p-unselectable-text{user-select:none}.p-scrollbar-measure{width:100px;height:100px;overflow:scroll;position:absolute;top:-9999px}@-webkit-keyframes p-fadein{0%{opacity:0}100%{opacity:1}}@keyframes p-fadein{0%{opacity:0}100%{opacity:1}}input[type="button"],input[type="submit"],input[type="reset"],input[type="file"]::-webkit-file-upload-button,button{border-radius:0}.p-link{text-align:left;background-color:transparent;margin:0;padding:0;border:0;cursor:pointer;user-select:none}.p-connected-overlay{opacity:0;transform:scaleY(0.8);transition:transform .12s cubic-bezier(0,0,0.2,1),opacity .12s cubic-bezier(0,0,0.2,1)}.p-connected-overlay-visible{opacity:1;transform:scaleY(1)}.p-connected-overlay-hidden{opacity:0;transform:scaleY(1);transition:opacity .1s linear}.p-connected-overlay-enter-from{opacity:0;transform:scaleY(0.8)}.p-connected-overlay-leave-to{opacity:0}.p-connected-overlay-enter-active{transition:transform .12s cubic-bezier(0,0,0.2,1),opacity .12s cubic-bezier(0,0,0.2,1)}.p-connected-overlay-leave-active{transition:opacity .1s linear}.p-toggleable-content-enter-from,.p-toggleable-content-leave-to{max-height:0}.p-toggleable-content-enter-to,.p-toggleable-content-leave-from{max-height:1000px}.p-toggleable-content-leave-active{overflow:hidden;transition:max-height .45s cubic-bezier(0,1,0,1)}.p-toggleable-content-enter-active{overflow:hidden;transition:max-height 1s ease-in-out}.p-sr-only{border:0;clip:rect(1px,1px,1px,1px);clip-path:inset(50%);height:1px;margin:-1px;overflow:hidden;padding:0;position:absolute;width:1px;word-wrap:normal !important}.p-badge{display:inline-block;border-radius:10px;text-align:center;padding:0 .5rem}.p-overlay-badge{position:relative}.p-overlay-badge .p-badge{position:absolute;top:0;right:0;transform:translate(50%,-50%);transform-origin:100% 0;margin:0}.p-badge-dot{width:.5rem;min-width:.5rem;height:.5rem;border-radius:50%;padding:0}.p-badge-no-gutter{padding:0;border-radius:50%}.p-button{margin:0;display:inline-flex;cursor:pointer;user-select:none;align-items:center;vertical-align:bottom;text-align:center;overflow:hidden;position:relative}.p-button-label{flex:1 1 auto}.p-button-icon-right{order:1}.p-button:disabled{cursor:default}.p-button-icon-only{justify-content:center}.p-button-icon-only .p-button-label{visibility:hidden;width:0;flex:0 0 auto}.p-button-vertical{flex-direction:column}.p-button-icon-bottom{order:2}.p-buttonset .p-button{margin:0}.p-buttonset .p-button:not(:last-child){border-right:0 none}.p-buttonset .p-button:not(:first-of-type):not(:last-of-type){border-radius:0}.p-buttonset .p-button:first-of-type{border-top-right-radius:0;border-bottom-right-radius:0}.p-buttonset .p-button:last-of-type{border-top-left-radius:0;border-bottom-left-radius:0}.p-buttonset .p-button:focus{position:relative;z-index:1}.p-button-label{transition:all .2s}.p-checkbox{display:inline-flex;cursor:pointer;user-select:none;vertical-align:bottom;position:relative}.p-checkbox-box{display:flex;justify-content:center;align-items:center}.p-colorpicker-panel .p-colorpicker-color{background:transparent url("__VITE_ASSET__473bc8ca__") no-repeat left top}.p-colorpicker-panel .p-colorpicker-hue{background:transparent url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABEAAACWCAIAAAC3uvTNAAAA7ElEQVRYw+2YUQqDQAxEh9GWuqV6Be9/JT88RN0VRUuv0ElBwhKY3yF5m90kLKd+mF/975r6geNyjm9Fy0kgqTJ6nqoIdGKczjmPJU5tZxA8wWPL7YOHKhZAlcmTAVVcxSCrMbfgqY/H6JEOoASPe56tgSrqLR7U2zWojwWjJ3jq47HEiZoGTwJxP1RRXw8y9RZfCMhbhTHOVTxXnUFtPJ5rGjzu35y2KfKGQxWT2K4TQL1d2zz6KAH1kRU8wfOXx+37qY3Hct+aDaqot2u7R/wMuDS3qnj0z0HqK4X/+kRNHdfUwFP2Nisqe/sFuUZiVjC9HCUAAAAASUVORK5CYII=") no-repeat left top}.p-inputtext{margin:0}.p-fluid .p-inputtext{width:100%}.p-inputgroup{display:flex;align-items:stretch;width:100%}.p-inputgroup-addon{display:flex;align-items:center;justify-content:center}.p-inputgroup .p-float-label{display:flex;align-items:stretch;width:100%}.p-inputgroup .p-inputtext,.p-fluid .p-inputgroup .p-inputtext,.p-inputgroup .p-inputwrapper,.p-fluid .p-inputgroup .p-input{flex:1 1 auto;width:1%}.p-float-label{display:block;position:relative}.p-float-label label{position:absolute;pointer-events:none;top:50%;margin-top:-.5rem;transition-property:all;transition-timing-function:ease;line-height:1}.p-float-label textarea ~ label{top:1rem}.p-float-label input:focus ~ label,.p-float-label input.p-filled ~ label,.p-float-label textarea:focus ~ label,.p-float-label textarea.p-filled ~ label,.p-float-label .p-inputwrapper-focus ~ label,.p-float-label .p-inputwrapper-filled ~ label{top:-.75rem;font-size:12px}.p-float-label .input:-webkit-autofill ~ label{top:-20px;font-size:12px}.p-input-icon-left,.p-input-icon-right{position:relative;display:inline-block}.p-input-icon-left>i,.p-input-icon-right>i{position:absolute;top:50%;margin-top:-.5rem}.p-fluid .p-input-icon-left,.p-fluid .p-input-icon-right{display:block;width:100%}.p-radiobutton{display:inline-flex;cursor:pointer;user-select:none;vertical-align:bottom}.p-radiobutton-box{display:flex;justify-content:center;align-items:center}.p-radiobutton-icon{-webkit-backface-visibility:hidden;backface-visibility:hidden;transform:translateZ(0) scale(.1);border-radius:50%;visibility:hidden}.p-radiobutton-box.p-highlight .p-radiobutton-icon{transform:translateZ(0) scale(1.0,1.0);visibility:visible}.p-ripple{overflow:hidden;position:relative}.p-ink{display:block;position:absolute;background:rgba(255,255,255,0.5);border-radius:100%;transform:scale(0)}.p-ink-active{animation:ripple .4s linear}.p-ripple-disabled .p-ink{display:none !important}@keyframes ripple{100%{opacity:0;transform:scale(2.5)}}.p-tooltip{position:absolute;display:none;padding:.25em .5rem;max-width:12.5rem}.p-tooltip.p-tooltip-right,.p-tooltip.p-tooltip-left{padding:0 .25rem}.p-tooltip.p-tooltip-top,.p-tooltip.p-tooltip-bottom{padding:.25em 0}.p-tooltip .p-tooltip-text{white-space:pre-line;word-break:break-word}.p-tooltip-arrow{position:absolute;width:0;height:0;border-color:transparent;border-style:solid}.p-tooltip-right .p-tooltip-arrow{top:50%;left:0;margin-top:-.25rem;border-width:.25em .25em .25em 0}.p-tooltip-left .p-tooltip-arrow{top:50%;right:0;margin-top:-.25rem;border-width:.25em 0 .25em .25rem}.p-tooltip.p-tooltip-top{padding:.25em 0}.p-tooltip-top .p-tooltip-arrow{bottom:0;left:50%;margin-left:-.25rem;border-width:.25em .25em 0}.p-tooltip-bottom .p-tooltip-arrow{top:0;left:50%;margin-left:-.25rem;border-width:0 .25em .25rem}';
var theme = ':root {\n  --surface-a:#ffffff;\n  --surface-b:#f8f9fa;\n  --surface-c:#e9ecef;\n  --surface-d:#dee2e6;\n  --surface-e:#ffffff;\n  --surface-f:#ffffff;\n  --text-color:#495057;\n  --text-color-secondary:#6c757d;\n  --primary-color:#2196F3;\n  --primary-color-text:#ffffff;\n  --font-family:-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol;\n  --surface-0: #ffffff;\n  --surface-50: #FAFAFA;\n  --surface-100: #F5F5F5;\n  --surface-200: #EEEEEE;\n  --surface-300: #E0E0E0;\n  --surface-400: #BDBDBD;\n  --surface-500: #9E9E9E;\n  --surface-600: #757575;\n  --surface-700: #616161;\n  --surface-800: #424242;\n  --surface-900: #212121;\n  --gray-50: #FAFAFA;\n  --gray-100: #F5F5F5;\n  --gray-200: #EEEEEE;\n  --gray-300: #E0E0E0;\n  --gray-400: #BDBDBD;\n  --gray-500: #9E9E9E;\n  --gray-600: #757575;\n  --gray-700: #616161;\n  --gray-800: #424242;\n  --gray-900: #212121;\n  --content-padding:1rem;\n  --inline-spacing:0.5rem;\n  --border-radius:3px;\n  --surface-ground:#f8f9fa;\n  --surface-section:#ffffff;\n  --surface-card:#ffffff;\n  --surface-overlay:#ffffff;\n  --surface-border:#dee2e6;\n  --surface-hover: #e9ecef;\n  --focus-ring: 0 0 0 0.2rem #a6d5fa;\n  --maskbg: rgba(0, 0, 0, 0.4);\n}\n\n* {\n  box-sizing: border-box;\n}\n\n.p-component {\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";\n  font-size: 1rem;\n  font-weight: normal;\n}\n\n.p-component-overlay {\n  background-color: rgba(0, 0, 0, 0.4);\n  transition-duration: 0.2s;\n}\n\n.p-disabled, .p-component:disabled {\n  opacity: 0.6;\n}\n\n.p-error {\n  color: #f44336;\n}\n\n.p-text-secondary {\n  color: #6c757d;\n}\n\n.pi {\n  font-size: 1rem;\n}\n\n.p-link {\n  font-size: 1rem;\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";\n  border-radius: 3px;\n}\n.p-link:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n\n.p-component-overlay-enter {\n  animation: p-component-overlay-enter-animation 150ms forwards;\n}\n\n.p-component-overlay-leave {\n  animation: p-component-overlay-leave-animation 150ms forwards;\n}\n\n@keyframes p-component-overlay-enter-animation {\n  from {\n    background-color: transparent;\n  }\n  to {\n    background-color: var(--maskbg);\n  }\n}\n@keyframes p-component-overlay-leave-animation {\n  from {\n    background-color: var(--maskbg);\n  }\n  to {\n    background-color: transparent;\n  }\n}\n\n:root {\n  --blue-50:#f4fafe;\n  --blue-100:#cae6fc;\n  --blue-200:#a0d2fa;\n  --blue-300:#75bef8;\n  --blue-400:#4baaf5;\n  --blue-500:#2196f3;\n  --blue-600:#1c80cf;\n  --blue-700:#1769aa;\n  --blue-800:#125386;\n  --blue-900:#0d3c61;\n  --green-50:#f6fbf6;\n  --green-100:#d4ecd5;\n  --green-200:#b2ddb4;\n  --green-300:#90cd93;\n  --green-400:#6ebe71;\n  --green-500:#4caf50;\n  --green-600:#419544;\n  --green-700:#357b38;\n  --green-800:#2a602c;\n  --green-900:#1e4620;\n  --yellow-50:#fffcf5;\n  --yellow-100:#fef0cd;\n  --yellow-200:#fde4a5;\n  --yellow-300:#fdd87d;\n  --yellow-400:#fccc55;\n  --yellow-500:#fbc02d;\n  --yellow-600:#d5a326;\n  --yellow-700:#b08620;\n  --yellow-800:#8a6a19;\n  --yellow-900:#644d12;\n  --cyan-50:#f2fcfd;\n  --cyan-100:#c2eff5;\n  --cyan-200:#91e2ed;\n  --cyan-300:#61d5e4;\n  --cyan-400:#30c9dc;\n  --cyan-500:#00bcd4;\n  --cyan-600:#00a0b4;\n  --cyan-700:#008494;\n  --cyan-800:#006775;\n  --cyan-900:#004b55;\n  --pink-50:#fef4f7;\n  --pink-100:#fac9da;\n  --pink-200:#f69ebc;\n  --pink-300:#f1749e;\n  --pink-400:#ed4981;\n  --pink-500:#e91e63;\n  --pink-600:#c61a54;\n  --pink-700:#a31545;\n  --pink-800:#801136;\n  --pink-900:#5d0c28;\n  --indigo-50:#f5f6fb;\n  --indigo-100:#d1d5ed;\n  --indigo-200:#acb4df;\n  --indigo-300:#8893d1;\n  --indigo-400:#6372c3;\n  --indigo-500:#3f51b5;\n  --indigo-600:#36459a;\n  --indigo-700:#2c397f;\n  --indigo-800:#232d64;\n  --indigo-900:#192048;\n  --teal-50:#f2faf9;\n  --teal-100:#c2e6e2;\n  --teal-200:#91d2cc;\n  --teal-300:#61beb5;\n  --teal-400:#30aa9f;\n  --teal-500:#009688;\n  --teal-600:#008074;\n  --teal-700:#00695f;\n  --teal-800:#00534b;\n  --teal-900:#003c36;\n  --orange-50:#fff8f2;\n  --orange-100:#fde0c2;\n  --orange-200:#fbc791;\n  --orange-300:#f9ae61;\n  --orange-400:#f79530;\n  --orange-500:#f57c00;\n  --orange-600:#d06900;\n  --orange-700:#ac5700;\n  --orange-800:#874400;\n  --orange-900:#623200;\n  --bluegray-50:#f7f9f9;\n  --bluegray-100:#d9e0e3;\n  --bluegray-200:#bbc7cd;\n  --bluegray-300:#9caeb7;\n  --bluegray-400:#7e96a1;\n  --bluegray-500:#607d8b;\n  --bluegray-600:#526a76;\n  --bluegray-700:#435861;\n  --bluegray-800:#35454c;\n  --bluegray-900:#263238;\n  --purple-50:#faf4fb;\n  --purple-100:#e7cbec;\n  --purple-200:#d4a2dd;\n  --purple-300:#c279ce;\n  --purple-400:#af50bf;\n  --purple-500:#9c27b0;\n  --purple-600:#852196;\n  --purple-700:#6d1b7b;\n  --purple-800:#561561;\n  --purple-900:#3e1046;\n}\n\n.p-autocomplete .p-autocomplete-loader {\n  right: 0.5rem;\n}\n.p-autocomplete.p-autocomplete-dd .p-autocomplete-loader {\n  right: 2.857rem;\n}\n.p-autocomplete .p-autocomplete-multiple-container {\n  padding: 0.25rem 0.5rem;\n}\n.p-autocomplete .p-autocomplete-multiple-container:not(.p-disabled):hover {\n  border-color: #2196F3;\n}\n.p-autocomplete .p-autocomplete-multiple-container:not(.p-disabled).p-focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n  border-color: #2196F3;\n}\n.p-autocomplete .p-autocomplete-multiple-container .p-autocomplete-input-token {\n  padding: 0.25rem 0;\n}\n.p-autocomplete .p-autocomplete-multiple-container .p-autocomplete-input-token input {\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";\n  font-size: 1rem;\n  color: #495057;\n  padding: 0;\n  margin: 0;\n}\n.p-autocomplete .p-autocomplete-multiple-container .p-autocomplete-token {\n  padding: 0.25rem 0.5rem;\n  margin-right: 0.5rem;\n  background: #dee2e6;\n  color: #495057;\n  border-radius: 16px;\n}\n.p-autocomplete .p-autocomplete-multiple-container .p-autocomplete-token .p-autocomplete-token-icon {\n  margin-left: 0.5rem;\n}\n.p-autocomplete.p-invalid.p-component > .p-inputtext {\n  border-color: #f44336;\n}\n\n.p-autocomplete-panel {\n  background: #ffffff;\n  color: #495057;\n  border: 0 none;\n  border-radius: 3px;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n}\n.p-autocomplete-panel .p-autocomplete-items {\n  padding: 0.5rem 0;\n}\n.p-autocomplete-panel .p-autocomplete-items .p-autocomplete-item {\n  margin: 0;\n  padding: 0.5rem 1rem;\n  border: 0 none;\n  color: #495057;\n  background: transparent;\n  transition: box-shadow 0.2s;\n  border-radius: 0;\n}\n.p-autocomplete-panel .p-autocomplete-items .p-autocomplete-item:hover {\n  color: #495057;\n  background: #e9ecef;\n}\n.p-autocomplete-panel .p-autocomplete-items .p-autocomplete-item.p-highlight {\n  color: #495057;\n  background: #E3F2FD;\n}\n.p-autocomplete-panel .p-autocomplete-items .p-autocomplete-item-group {\n  margin: 0;\n  padding: 0.75rem 1rem;\n  color: #495057;\n  background: #ffffff;\n  font-weight: 600;\n}\n\n.p-calendar.p-invalid.p-component > .p-inputtext {\n  border-color: #f44336;\n}\n\n.p-datepicker {\n  padding: 0.5rem;\n  background: #ffffff;\n  color: #495057;\n  border: 1px solid #ced4da;\n  border-radius: 3px;\n}\n.p-datepicker:not(.p-datepicker-inline) {\n  background: #ffffff;\n  border: 0 none;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n}\n.p-datepicker:not(.p-datepicker-inline) .p-datepicker-header {\n  background: #ffffff;\n}\n.p-datepicker .p-datepicker-header {\n  padding: 0.5rem;\n  color: #495057;\n  background: #ffffff;\n  font-weight: 600;\n  margin: 0;\n  border-bottom: 1px solid #dee2e6;\n  border-top-right-radius: 3px;\n  border-top-left-radius: 3px;\n}\n.p-datepicker .p-datepicker-header .p-datepicker-prev,\n.p-datepicker .p-datepicker-header .p-datepicker-next {\n  width: 2rem;\n  height: 2rem;\n  color: #6c757d;\n  border: 0 none;\n  background: transparent;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n}\n.p-datepicker .p-datepicker-header .p-datepicker-prev:enabled:hover,\n.p-datepicker .p-datepicker-header .p-datepicker-next:enabled:hover {\n  color: #495057;\n  border-color: transparent;\n  background: #e9ecef;\n}\n.p-datepicker .p-datepicker-header .p-datepicker-prev:focus,\n.p-datepicker .p-datepicker-header .p-datepicker-next:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-datepicker .p-datepicker-header .p-datepicker-title {\n  line-height: 2rem;\n}\n.p-datepicker .p-datepicker-header .p-datepicker-title select {\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n}\n.p-datepicker .p-datepicker-header .p-datepicker-title select:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n  border-color: #2196F3;\n}\n.p-datepicker .p-datepicker-header .p-datepicker-title .p-datepicker-month {\n  margin-right: 0.5rem;\n}\n.p-datepicker table {\n  font-size: 1rem;\n  margin: 0.5rem 0;\n}\n.p-datepicker table th {\n  padding: 0.5rem;\n}\n.p-datepicker table th > span {\n  width: 2.5rem;\n  height: 2.5rem;\n}\n.p-datepicker table td {\n  padding: 0.5rem;\n}\n.p-datepicker table td > span {\n  width: 2.5rem;\n  height: 2.5rem;\n  border-radius: 50%;\n  transition: box-shadow 0.2s;\n  border: 1px solid transparent;\n}\n.p-datepicker table td > span.p-highlight {\n  color: #495057;\n  background: #E3F2FD;\n}\n.p-datepicker table td > span:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-datepicker table td.p-datepicker-today > span {\n  background: #ced4da;\n  color: #495057;\n  border-color: transparent;\n}\n.p-datepicker table td.p-datepicker-today > span.p-highlight {\n  color: #495057;\n  background: #E3F2FD;\n}\n.p-datepicker .p-datepicker-buttonbar {\n  padding: 1rem 0;\n  border-top: 1px solid #dee2e6;\n}\n.p-datepicker .p-datepicker-buttonbar .p-button {\n  width: auto;\n}\n.p-datepicker .p-timepicker {\n  border-top: 1px solid #dee2e6;\n  padding: 0.5rem;\n}\n.p-datepicker .p-timepicker button {\n  width: 2rem;\n  height: 2rem;\n  color: #6c757d;\n  border: 0 none;\n  background: transparent;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n}\n.p-datepicker .p-timepicker button:enabled:hover {\n  color: #495057;\n  border-color: transparent;\n  background: #e9ecef;\n}\n.p-datepicker .p-timepicker button:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-datepicker .p-timepicker button:last-child {\n  margin-top: 0.2em;\n}\n.p-datepicker .p-timepicker span {\n  font-size: 1.25rem;\n}\n.p-datepicker .p-timepicker > div {\n  padding: 0 0.5rem;\n}\n.p-datepicker.p-datepicker-timeonly .p-timepicker {\n  border-top: 0 none;\n}\n.p-datepicker .p-monthpicker {\n  margin: 0.5rem 0;\n}\n.p-datepicker .p-monthpicker .p-monthpicker-month {\n  padding: 0.5rem;\n  transition: box-shadow 0.2s;\n  border-radius: 3px;\n}\n.p-datepicker .p-monthpicker .p-monthpicker-month.p-highlight {\n  color: #495057;\n  background: #E3F2FD;\n}\n.p-datepicker.p-datepicker-multiple-month .p-datepicker-group {\n  border-right: 1px solid #dee2e6;\n  padding-right: 0.5rem;\n  padding-left: 0.5rem;\n  padding-top: 0;\n  padding-bottom: 0;\n}\n.p-datepicker.p-datepicker-multiple-month .p-datepicker-group:first-child {\n  padding-left: 0;\n}\n.p-datepicker.p-datepicker-multiple-month .p-datepicker-group:last-child {\n  padding-right: 0;\n  border-right: 0 none;\n}\n.p-datepicker:not(.p-disabled) table td span:not(.p-highlight):not(.p-disabled):hover {\n  background: #e9ecef;\n}\n.p-datepicker:not(.p-disabled) table td span:not(.p-highlight):not(.p-disabled):focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-datepicker:not(.p-disabled) .p-monthpicker .p-monthpicker-month:not(.p-highlight):not(.p-disabled):hover {\n  background: #e9ecef;\n}\n.p-datepicker:not(.p-disabled) .p-monthpicker .p-monthpicker-month:not(.p-highlight):not(.p-disabled):focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n\n@media screen and (max-width: 769px) {\n  .p-datepicker table th, .p-datepicker table td {\n    padding: 0;\n  }\n}\n.p-cascadeselect {\n  background: #ffffff;\n  border: 1px solid #ced4da;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n  border-radius: 3px;\n}\n.p-cascadeselect:not(.p-disabled):hover {\n  border-color: #2196F3;\n}\n.p-cascadeselect:not(.p-disabled).p-focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n  border-color: #2196F3;\n}\n.p-cascadeselect .p-cascadeselect-label {\n  background: transparent;\n  border: 0 none;\n  padding: 0.5rem 0.5rem;\n}\n.p-cascadeselect .p-cascadeselect-label.p-placeholder {\n  color: #6c757d;\n}\n.p-cascadeselect .p-cascadeselect-label:enabled:focus {\n  outline: 0 none;\n  box-shadow: none;\n}\n.p-cascadeselect .p-cascadeselect-trigger {\n  background: transparent;\n  color: #6c757d;\n  width: 2.357rem;\n  border-top-right-radius: 3px;\n  border-bottom-right-radius: 3px;\n}\n.p-cascadeselect.p-invalid.p-component {\n  border-color: #f44336;\n}\n\n.p-cascadeselect-panel {\n  background: #ffffff;\n  color: #495057;\n  border: 0 none;\n  border-radius: 3px;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n}\n.p-cascadeselect-panel .p-cascadeselect-items {\n  padding: 0.5rem 0;\n}\n.p-cascadeselect-panel .p-cascadeselect-items .p-cascadeselect-item {\n  margin: 0;\n  border: 0 none;\n  color: #495057;\n  background: transparent;\n  transition: box-shadow 0.2s;\n  border-radius: 0;\n}\n.p-cascadeselect-panel .p-cascadeselect-items .p-cascadeselect-item .p-cascadeselect-item-content {\n  padding: 0.5rem 1rem;\n}\n.p-cascadeselect-panel .p-cascadeselect-items .p-cascadeselect-item .p-cascadeselect-item-content:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: inset 0 0 0 0.15rem #a6d5fa;\n}\n.p-cascadeselect-panel .p-cascadeselect-items .p-cascadeselect-item.p-highlight {\n  color: #495057;\n  background: #E3F2FD;\n}\n.p-cascadeselect-panel .p-cascadeselect-items .p-cascadeselect-item:not(.p-highlight):not(.p-disabled):hover {\n  color: #495057;\n  background: #e9ecef;\n}\n.p-cascadeselect-panel .p-cascadeselect-items .p-cascadeselect-item .p-cascadeselect-group-icon {\n  font-size: 0.875rem;\n}\n\n.p-input-filled .p-cascadeselect {\n  background: #f8f9fa;\n}\n.p-input-filled .p-cascadeselect:not(.p-disabled):hover {\n  background-color: #f8f9fa;\n}\n.p-input-filled .p-cascadeselect:not(.p-disabled).p-focus {\n  background-color: #ffffff;\n}\n\n.p-checkbox {\n  width: 20px;\n  height: 20px;\n}\n.p-checkbox .p-checkbox-box {\n  border: 2px solid #ced4da;\n  background: #ffffff;\n  width: 20px;\n  height: 20px;\n  color: #495057;\n  border-radius: 3px;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n}\n.p-checkbox .p-checkbox-box .p-checkbox-icon {\n  transition-duration: 0.2s;\n  color: #ffffff;\n  font-size: 14px;\n}\n.p-checkbox .p-checkbox-box.p-highlight {\n  border-color: #2196F3;\n  background: #2196F3;\n}\n.p-checkbox:not(.p-checkbox-disabled) .p-checkbox-box:hover {\n  border-color: #2196F3;\n}\n.p-checkbox:not(.p-checkbox-disabled) .p-checkbox-box.p-focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n  border-color: #2196F3;\n}\n.p-checkbox:not(.p-checkbox-disabled) .p-checkbox-box.p-highlight:hover {\n  border-color: #0b7ad1;\n  background: #0b7ad1;\n  color: #ffffff;\n}\n.p-checkbox.p-invalid > .p-checkbox-box {\n  border-color: #f44336;\n}\n\n.p-input-filled .p-checkbox .p-checkbox-box {\n  background-color: #f8f9fa;\n}\n.p-input-filled .p-checkbox .p-checkbox-box.p-highlight {\n  background: #2196F3;\n}\n.p-input-filled .p-checkbox:not(.p-checkbox-disabled) .p-checkbox-box:hover {\n  background-color: #f8f9fa;\n}\n.p-input-filled .p-checkbox:not(.p-checkbox-disabled) .p-checkbox-box.p-highlight:hover {\n  background: #0b7ad1;\n}\n\n.p-chips .p-chips-multiple-container {\n  padding: 0.25rem 0.5rem;\n}\n.p-chips .p-chips-multiple-container:not(.p-disabled):hover {\n  border-color: #2196F3;\n}\n.p-chips .p-chips-multiple-container:not(.p-disabled).p-focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n  border-color: #2196F3;\n}\n.p-chips .p-chips-multiple-container .p-chips-token {\n  padding: 0.25rem 0.5rem;\n  margin-right: 0.5rem;\n  background: #dee2e6;\n  color: #495057;\n  border-radius: 16px;\n}\n.p-chips .p-chips-multiple-container .p-chips-token .p-chips-token-icon {\n  margin-left: 0.5rem;\n}\n.p-chips .p-chips-multiple-container .p-chips-input-token {\n  padding: 0.25rem 0;\n}\n.p-chips .p-chips-multiple-container .p-chips-input-token input {\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";\n  font-size: 1rem;\n  color: #495057;\n  padding: 0;\n  margin: 0;\n}\n.p-chips.p-invalid.p-component > .p-inputtext {\n  border-color: #f44336;\n}\n\n.p-colorpicker-preview {\n  width: 2rem;\n  height: 2rem;\n}\n\n.p-colorpicker-panel {\n  background: #323232;\n  border-color: #191919;\n}\n.p-colorpicker-panel .p-colorpicker-color-handle,\n.p-colorpicker-panel .p-colorpicker-hue-handle {\n  border-color: #ffffff;\n}\n\n.p-colorpicker-overlay-panel {\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n}\n\n.p-dropdown {\n  background: #ffffff;\n  border: 1px solid #ced4da;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n  border-radius: 3px;\n}\n.p-dropdown:not(.p-disabled):hover {\n  border-color: #2196F3;\n}\n.p-dropdown:not(.p-disabled).p-focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n  border-color: #2196F3;\n}\n.p-dropdown.p-dropdown-clearable .p-dropdown-label {\n  padding-right: 1.5rem;\n}\n.p-dropdown .p-dropdown-label {\n  background: transparent;\n  border: 0 none;\n}\n.p-dropdown .p-dropdown-label.p-placeholder {\n  color: #6c757d;\n}\n.p-dropdown .p-dropdown-label:enabled:focus {\n  outline: 0 none;\n  box-shadow: none;\n}\n.p-dropdown .p-dropdown-trigger {\n  background: transparent;\n  color: #6c757d;\n  width: 2.357rem;\n  border-top-right-radius: 3px;\n  border-bottom-right-radius: 3px;\n}\n.p-dropdown .p-dropdown-clear-icon {\n  color: #6c757d;\n  right: 2.357rem;\n}\n.p-dropdown.p-invalid.p-component {\n  border-color: #f44336;\n}\n\n.p-dropdown-panel {\n  background: #ffffff;\n  color: #495057;\n  border: 0 none;\n  border-radius: 3px;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n}\n.p-dropdown-panel .p-dropdown-header {\n  padding: 0.5rem 1rem;\n  border-bottom: 0 none;\n  color: #495057;\n  background: #f8f9fa;\n  margin: 0;\n  border-top-right-radius: 3px;\n  border-top-left-radius: 3px;\n}\n.p-dropdown-panel .p-dropdown-header .p-dropdown-filter {\n  padding-right: 1.5rem;\n  margin-right: -1.5rem;\n}\n.p-dropdown-panel .p-dropdown-header .p-dropdown-filter-icon {\n  right: 0.5rem;\n  color: #6c757d;\n}\n.p-dropdown-panel .p-dropdown-items {\n  padding: 0.5rem 0;\n}\n.p-dropdown-panel .p-dropdown-items .p-dropdown-item {\n  margin: 0;\n  padding: 0.5rem 1rem;\n  border: 0 none;\n  color: #495057;\n  background: transparent;\n  transition: box-shadow 0.2s;\n  border-radius: 0;\n}\n.p-dropdown-panel .p-dropdown-items .p-dropdown-item.p-highlight {\n  color: #495057;\n  background: #E3F2FD;\n}\n.p-dropdown-panel .p-dropdown-items .p-dropdown-item:not(.p-highlight):not(.p-disabled):hover {\n  color: #495057;\n  background: #e9ecef;\n}\n.p-dropdown-panel .p-dropdown-items .p-dropdown-item-group {\n  margin: 0;\n  padding: 0.75rem 1rem;\n  color: #495057;\n  background: #ffffff;\n  font-weight: 600;\n}\n.p-dropdown-panel .p-dropdown-items .p-dropdown-empty-message {\n  padding: 0.5rem 1rem;\n  color: #495057;\n  background: transparent;\n}\n\n.p-input-filled .p-dropdown {\n  background: #f8f9fa;\n}\n.p-input-filled .p-dropdown:not(.p-disabled):hover {\n  background-color: #f8f9fa;\n}\n.p-input-filled .p-dropdown:not(.p-disabled).p-focus {\n  background-color: #ffffff;\n}\n\n.p-editor-container .p-editor-toolbar {\n  background: #f8f9fa;\n  border-top-right-radius: 3px;\n  border-top-left-radius: 3px;\n}\n.p-editor-container .p-editor-toolbar.ql-snow {\n  border: 1px solid #dee2e6;\n}\n.p-editor-container .p-editor-toolbar.ql-snow .ql-stroke {\n  stroke: #6c757d;\n}\n.p-editor-container .p-editor-toolbar.ql-snow .ql-fill {\n  fill: #6c757d;\n}\n.p-editor-container .p-editor-toolbar.ql-snow .ql-picker .ql-picker-label {\n  border: 0 none;\n  color: #6c757d;\n}\n.p-editor-container .p-editor-toolbar.ql-snow .ql-picker .ql-picker-label:hover {\n  color: #495057;\n}\n.p-editor-container .p-editor-toolbar.ql-snow .ql-picker .ql-picker-label:hover .ql-stroke {\n  stroke: #495057;\n}\n.p-editor-container .p-editor-toolbar.ql-snow .ql-picker .ql-picker-label:hover .ql-fill {\n  fill: #495057;\n}\n.p-editor-container .p-editor-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-label {\n  color: #495057;\n}\n.p-editor-container .p-editor-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-label .ql-stroke {\n  stroke: #495057;\n}\n.p-editor-container .p-editor-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-label .ql-fill {\n  fill: #495057;\n}\n.p-editor-container .p-editor-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-options {\n  background: #ffffff;\n  border: 0 none;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n  border-radius: 3px;\n  padding: 0.5rem 0;\n}\n.p-editor-container .p-editor-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-options .ql-picker-item {\n  color: #495057;\n}\n.p-editor-container .p-editor-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-options .ql-picker-item:hover {\n  color: #495057;\n  background: #e9ecef;\n}\n.p-editor-container .p-editor-toolbar.ql-snow .ql-picker.ql-expanded:not(.ql-icon-picker) .ql-picker-item {\n  padding: 0.5rem 1rem;\n}\n.p-editor-container .p-editor-content {\n  border-bottom-right-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n.p-editor-container .p-editor-content.ql-snow {\n  border: 1px solid #dee2e6;\n}\n.p-editor-container .p-editor-content .ql-editor {\n  background: #ffffff;\n  color: #495057;\n  border-bottom-right-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n.p-editor-container .ql-snow.ql-toolbar button:hover,\n.p-editor-container .ql-snow.ql-toolbar button:focus {\n  color: #495057;\n}\n.p-editor-container .ql-snow.ql-toolbar button:hover .ql-stroke,\n.p-editor-container .ql-snow.ql-toolbar button:focus .ql-stroke {\n  stroke: #495057;\n}\n.p-editor-container .ql-snow.ql-toolbar button:hover .ql-fill,\n.p-editor-container .ql-snow.ql-toolbar button:focus .ql-fill {\n  fill: #495057;\n}\n.p-editor-container .ql-snow.ql-toolbar button.ql-active,\n.p-editor-container .ql-snow.ql-toolbar .ql-picker-label.ql-active,\n.p-editor-container .ql-snow.ql-toolbar .ql-picker-item.ql-selected {\n  color: #2196F3;\n}\n.p-editor-container .ql-snow.ql-toolbar button.ql-active .ql-stroke,\n.p-editor-container .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-stroke,\n.p-editor-container .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-stroke {\n  stroke: #2196F3;\n}\n.p-editor-container .ql-snow.ql-toolbar button.ql-active .ql-fill,\n.p-editor-container .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-fill,\n.p-editor-container .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-fill {\n  fill: #2196F3;\n}\n.p-editor-container .ql-snow.ql-toolbar button.ql-active .ql-picker-label,\n.p-editor-container .ql-snow.ql-toolbar .ql-picker-label.ql-active .ql-picker-label,\n.p-editor-container .ql-snow.ql-toolbar .ql-picker-item.ql-selected .ql-picker-label {\n  color: #2196F3;\n}\n\n.p-inputgroup-addon {\n  background: #e9ecef;\n  color: #6c757d;\n  border-top: 1px solid #ced4da;\n  border-left: 1px solid #ced4da;\n  border-bottom: 1px solid #ced4da;\n  padding: 0.5rem 0.5rem;\n  min-width: 2.357rem;\n}\n.p-inputgroup-addon:last-child {\n  border-right: 1px solid #ced4da;\n}\n\n.p-inputgroup > .p-component,\n.p-inputgroup > .p-inputwrapper > .p-inputtext,\n.p-inputgroup > .p-float-label > .p-component {\n  border-radius: 0;\n  margin: 0;\n}\n.p-inputgroup > .p-component + .p-inputgroup-addon,\n.p-inputgroup > .p-inputwrapper > .p-inputtext + .p-inputgroup-addon,\n.p-inputgroup > .p-float-label > .p-component + .p-inputgroup-addon {\n  border-left: 0 none;\n}\n.p-inputgroup > .p-component:focus,\n.p-inputgroup > .p-inputwrapper > .p-inputtext:focus,\n.p-inputgroup > .p-float-label > .p-component:focus {\n  z-index: 1;\n}\n.p-inputgroup > .p-component:focus ~ label,\n.p-inputgroup > .p-inputwrapper > .p-inputtext:focus ~ label,\n.p-inputgroup > .p-float-label > .p-component:focus ~ label {\n  z-index: 1;\n}\n\n.p-inputgroup-addon:first-child,\n.p-inputgroup button:first-child,\n.p-inputgroup input:first-child,\n.p-inputgroup > .p-inputwrapper:first-child,\n.p-inputgroup > .p-inputwrapper:first-child > .p-inputtext {\n  border-top-left-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n\n.p-inputgroup .p-float-label:first-child input {\n  border-top-left-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n\n.p-inputgroup-addon:last-child,\n.p-inputgroup button:last-child,\n.p-inputgroup input:last-child,\n.p-inputgroup > .p-inputwrapper:last-child,\n.p-inputgroup > .p-inputwrapper:last-child > .p-inputtext {\n  border-top-right-radius: 3px;\n  border-bottom-right-radius: 3px;\n}\n\n.p-inputgroup .p-float-label:last-child input {\n  border-top-right-radius: 3px;\n  border-bottom-right-radius: 3px;\n}\n\n.p-fluid .p-inputgroup .p-button {\n  width: auto;\n}\n.p-fluid .p-inputgroup .p-button.p-button-icon-only {\n  width: 2.357rem;\n}\n\n.p-inputnumber.p-invalid.p-component > .p-inputtext {\n  border-color: #f44336;\n}\n\n.p-inputswitch {\n  width: 3rem;\n  height: 1.75rem;\n}\n.p-inputswitch .p-inputswitch-slider {\n  background: #ced4da;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n  border-radius: 30px;\n}\n.p-inputswitch .p-inputswitch-slider:before {\n  background: #ffffff;\n  width: 1.25rem;\n  height: 1.25rem;\n  left: 0.25rem;\n  margin-top: -0.625rem;\n  border-radius: 50%;\n  transition-duration: 0.2s;\n}\n.p-inputswitch.p-inputswitch-checked .p-inputswitch-slider:before {\n  transform: translateX(1.25rem);\n}\n.p-inputswitch.p-focus .p-inputswitch-slider {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-inputswitch:not(.p-disabled):hover .p-inputswitch-slider {\n  background: #b6bfc8;\n}\n.p-inputswitch.p-inputswitch-checked .p-inputswitch-slider {\n  background: #2196F3;\n}\n.p-inputswitch.p-inputswitch-checked .p-inputswitch-slider:before {\n  background: #ffffff;\n}\n.p-inputswitch.p-inputswitch-checked:not(.p-disabled):hover .p-inputswitch-slider {\n  background: #0d89ec;\n}\n.p-inputswitch.p-invalid {\n  border-color: #f44336;\n}\n\n.p-inputtext {\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";\n  font-size: 1rem;\n  color: #495057;\n  background: #ffffff;\n  padding: 0.5rem 0.5rem;\n  border: 1px solid #ced4da;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n  appearance: none;\n  border-radius: 3px;\n}\n.p-inputtext:enabled:hover {\n  border-color: #2196F3;\n}\n.p-inputtext:enabled:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n  border-color: #2196F3;\n}\n.p-inputtext.p-invalid.p-component {\n  border-color: #f44336;\n}\n.p-inputtext.p-inputtext-sm {\n  font-size: 0.875rem;\n  padding: 0.4375rem 0.4375rem;\n}\n.p-inputtext.p-inputtext-lg {\n  font-size: 1.25rem;\n  padding: 0.625rem 0.625rem;\n}\n\n.p-float-label > label {\n  left: 0.5rem;\n  color: #6c757d;\n  transition-duration: 0.2s;\n}\n\n.p-input-icon-left > i:first-of-type {\n  left: 0.5rem;\n  color: #6c757d;\n}\n\n.p-input-icon-left > .p-inputtext {\n  padding-left: 2rem;\n}\n\n.p-input-icon-left.p-float-label > label {\n  left: 2rem;\n}\n\n.p-input-icon-right > i:last-of-type {\n  right: 0.5rem;\n  color: #6c757d;\n}\n\n.p-input-icon-right > .p-inputtext {\n  padding-right: 2rem;\n}\n\n::-webkit-input-placeholder {\n  color: #6c757d;\n}\n\n:-moz-placeholder {\n  color: #6c757d;\n}\n\n::-moz-placeholder {\n  color: #6c757d;\n}\n\n:-ms-input-placeholder {\n  color: #6c757d;\n}\n\n.p-input-filled .p-inputtext {\n  background-color: #f8f9fa;\n}\n.p-input-filled .p-inputtext:enabled:hover {\n  background-color: #f8f9fa;\n}\n.p-input-filled .p-inputtext:enabled:focus {\n  background-color: #ffffff;\n}\n\n.p-inputtext-sm .p-inputtext {\n  font-size: 0.875rem;\n  padding: 0.4375rem 0.4375rem;\n}\n\n.p-inputtext-lg .p-inputtext {\n  font-size: 1.25rem;\n  padding: 0.625rem 0.625rem;\n}\n\n.p-listbox {\n  background: #ffffff;\n  color: #495057;\n  border: 1px solid #ced4da;\n  border-radius: 3px;\n}\n.p-listbox .p-listbox-header {\n  padding: 0.5rem 1rem;\n  border-bottom: 0 none;\n  color: #495057;\n  background: #f8f9fa;\n  margin: 0;\n  border-top-right-radius: 3px;\n  border-top-left-radius: 3px;\n}\n.p-listbox .p-listbox-header .p-listbox-filter {\n  padding-right: 1.5rem;\n}\n.p-listbox .p-listbox-header .p-listbox-filter-icon {\n  right: 0.5rem;\n  color: #6c757d;\n}\n.p-listbox .p-listbox-list {\n  padding: 0.5rem 0;\n}\n.p-listbox .p-listbox-list .p-listbox-item {\n  margin: 0;\n  padding: 0.5rem 1rem;\n  border: 0 none;\n  color: #495057;\n  transition: box-shadow 0.2s;\n  border-radius: 0;\n}\n.p-listbox .p-listbox-list .p-listbox-item.p-highlight {\n  color: #495057;\n  background: #E3F2FD;\n}\n.p-listbox .p-listbox-list .p-listbox-item:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: inset 0 0 0 0.15rem #a6d5fa;\n}\n.p-listbox .p-listbox-list .p-listbox-item-group {\n  margin: 0;\n  padding: 0.75rem 1rem;\n  color: #495057;\n  background: #ffffff;\n  font-weight: 600;\n}\n.p-listbox .p-listbox-list .p-listbox-empty-message {\n  padding: 0.5rem 1rem;\n  color: #495057;\n  background: transparent;\n}\n.p-listbox:not(.p-disabled) .p-listbox-item:not(.p-highlight):not(.p-disabled):hover {\n  color: #495057;\n  background: #e9ecef;\n}\n.p-listbox.p-invalid {\n  border-color: #f44336;\n}\n\n.p-multiselect {\n  background: #ffffff;\n  border: 1px solid #ced4da;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n  border-radius: 3px;\n}\n.p-multiselect:not(.p-disabled):hover {\n  border-color: #2196F3;\n}\n.p-multiselect:not(.p-disabled).p-focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n  border-color: #2196F3;\n}\n.p-multiselect .p-multiselect-label {\n  padding: 0.5rem 0.5rem;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n}\n.p-multiselect .p-multiselect-label.p-placeholder {\n  color: #6c757d;\n}\n.p-multiselect.p-multiselect-chip .p-multiselect-token {\n  padding: 0.25rem 0.5rem;\n  margin-right: 0.5rem;\n  background: #dee2e6;\n  color: #495057;\n  border-radius: 16px;\n}\n.p-multiselect.p-multiselect-chip .p-multiselect-token .p-multiselect-token-icon {\n  margin-left: 0.5rem;\n}\n.p-multiselect .p-multiselect-trigger {\n  background: transparent;\n  color: #6c757d;\n  width: 2.357rem;\n  border-top-right-radius: 3px;\n  border-bottom-right-radius: 3px;\n}\n.p-multiselect.p-invalid.p-component {\n  border-color: #f44336;\n}\n\n.p-inputwrapper-filled.p-multiselect.p-multiselect-chip .p-multiselect-label {\n  padding: 0.25rem 0.5rem;\n}\n\n.p-multiselect-panel {\n  background: #ffffff;\n  color: #495057;\n  border: 0 none;\n  border-radius: 3px;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n}\n.p-multiselect-panel .p-multiselect-header {\n  padding: 0.5rem 1rem;\n  border-bottom: 0 none;\n  color: #495057;\n  background: #f8f9fa;\n  margin: 0;\n  border-top-right-radius: 3px;\n  border-top-left-radius: 3px;\n}\n.p-multiselect-panel .p-multiselect-header .p-multiselect-filter-container .p-inputtext {\n  padding-right: 1.5rem;\n}\n.p-multiselect-panel .p-multiselect-header .p-multiselect-filter-container .p-multiselect-filter-icon {\n  right: 0.5rem;\n  color: #6c757d;\n}\n.p-multiselect-panel .p-multiselect-header .p-checkbox {\n  margin-right: 0.5rem;\n}\n.p-multiselect-panel .p-multiselect-header .p-multiselect-close {\n  margin-left: 0.5rem;\n  width: 2rem;\n  height: 2rem;\n  color: #6c757d;\n  border: 0 none;\n  background: transparent;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n}\n.p-multiselect-panel .p-multiselect-header .p-multiselect-close:enabled:hover {\n  color: #495057;\n  border-color: transparent;\n  background: #e9ecef;\n}\n.p-multiselect-panel .p-multiselect-header .p-multiselect-close:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-multiselect-panel .p-multiselect-items {\n  padding: 0.5rem 0;\n}\n.p-multiselect-panel .p-multiselect-items .p-multiselect-item {\n  margin: 0;\n  padding: 0.5rem 1rem;\n  border: 0 none;\n  color: #495057;\n  background: transparent;\n  transition: box-shadow 0.2s;\n  border-radius: 0;\n}\n.p-multiselect-panel .p-multiselect-items .p-multiselect-item.p-highlight {\n  color: #495057;\n  background: #E3F2FD;\n}\n.p-multiselect-panel .p-multiselect-items .p-multiselect-item:not(.p-highlight):not(.p-disabled):hover {\n  color: #495057;\n  background: #e9ecef;\n}\n.p-multiselect-panel .p-multiselect-items .p-multiselect-item:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: inset 0 0 0 0.15rem #a6d5fa;\n}\n.p-multiselect-panel .p-multiselect-items .p-multiselect-item .p-checkbox {\n  margin-right: 0.5rem;\n}\n.p-multiselect-panel .p-multiselect-items .p-multiselect-item-group {\n  margin: 0;\n  padding: 0.75rem 1rem;\n  color: #495057;\n  background: #ffffff;\n  font-weight: 600;\n}\n.p-multiselect-panel .p-multiselect-items .p-multiselect-empty-message {\n  padding: 0.5rem 1rem;\n  color: #495057;\n  background: transparent;\n}\n\n.p-input-filled .p-multiselect {\n  background: #f8f9fa;\n}\n.p-input-filled .p-multiselect:not(.p-disabled):hover {\n  background-color: #f8f9fa;\n}\n.p-input-filled .p-multiselect:not(.p-disabled).p-focus {\n  background-color: #ffffff;\n}\n\n.p-password.p-invalid.p-component > .p-inputtext {\n  border-color: #f44336;\n}\n\n.p-password-panel {\n  padding: 1rem;\n  background: #ffffff;\n  color: #495057;\n  border: 0 none;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n  border-radius: 3px;\n}\n.p-password-panel .p-password-meter {\n  margin-bottom: 0.5rem;\n  background: #dee2e6;\n}\n.p-password-panel .p-password-meter .p-password-strength.weak {\n  background: #D32F2F;\n}\n.p-password-panel .p-password-meter .p-password-strength.medium {\n  background: #FBC02D;\n}\n.p-password-panel .p-password-meter .p-password-strength.strong {\n  background: #689F38;\n}\n\n.p-radiobutton {\n  width: 20px;\n  height: 20px;\n}\n.p-radiobutton .p-radiobutton-box {\n  border: 2px solid #ced4da;\n  background: #ffffff;\n  width: 20px;\n  height: 20px;\n  color: #495057;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n}\n.p-radiobutton .p-radiobutton-box:not(.p-disabled):not(.p-highlight):hover {\n  border-color: #2196F3;\n}\n.p-radiobutton .p-radiobutton-box:not(.p-disabled).p-focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n  border-color: #2196F3;\n}\n.p-radiobutton .p-radiobutton-box .p-radiobutton-icon {\n  width: 12px;\n  height: 12px;\n  transition-duration: 0.2s;\n  background-color: #ffffff;\n}\n.p-radiobutton .p-radiobutton-box.p-highlight {\n  border-color: #2196F3;\n  background: #2196F3;\n}\n.p-radiobutton .p-radiobutton-box.p-highlight:not(.p-disabled):hover {\n  border-color: #0b7ad1;\n  background: #0b7ad1;\n  color: #ffffff;\n}\n.p-radiobutton.p-invalid > .p-radiobutton-box {\n  border-color: #f44336;\n}\n.p-radiobutton:focus {\n  outline: 0 none;\n}\n\n.p-input-filled .p-radiobutton .p-radiobutton-box {\n  background-color: #f8f9fa;\n}\n.p-input-filled .p-radiobutton .p-radiobutton-box:not(.p-disabled):hover {\n  background-color: #f8f9fa;\n}\n.p-input-filled .p-radiobutton .p-radiobutton-box.p-highlight {\n  background: #2196F3;\n}\n.p-input-filled .p-radiobutton .p-radiobutton-box.p-highlight:not(.p-disabled):hover {\n  background: #0b7ad1;\n}\n\n.p-rating .p-rating-icon {\n  color: #495057;\n  margin-left: 0.5rem;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n  font-size: 1.143rem;\n}\n.p-rating .p-rating-icon.p-rating-cancel {\n  color: #e74c3c;\n}\n.p-rating .p-rating-icon:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-rating .p-rating-icon:first-child {\n  margin-left: 0;\n}\n.p-rating .p-rating-icon.pi-star {\n  color: #2196F3;\n}\n.p-rating:not(.p-disabled):not(.p-readonly) .p-rating-icon:hover {\n  color: #2196F3;\n}\n.p-rating:not(.p-disabled):not(.p-readonly) .p-rating-icon.p-rating-cancel:hover {\n  color: #c0392b;\n}\n\n.p-selectbutton .p-button {\n  background: #ffffff;\n  border: 1px solid #ced4da;\n  color: #495057;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n}\n.p-selectbutton .p-button .p-button-icon-left,\n.p-selectbutton .p-button .p-button-icon-right {\n  color: #6c757d;\n}\n.p-selectbutton .p-button:not(.p-disabled):not(.p-highlight):hover {\n  background: #e9ecef;\n  border-color: #ced4da;\n  color: #495057;\n}\n.p-selectbutton .p-button:not(.p-disabled):not(.p-highlight):hover .p-button-icon-left,\n.p-selectbutton .p-button:not(.p-disabled):not(.p-highlight):hover .p-button-icon-right {\n  color: #6c757d;\n}\n.p-selectbutton .p-button.p-highlight {\n  background: #2196F3;\n  border-color: #2196F3;\n  color: #ffffff;\n}\n.p-selectbutton .p-button.p-highlight .p-button-icon-left,\n.p-selectbutton .p-button.p-highlight .p-button-icon-right {\n  color: #ffffff;\n}\n.p-selectbutton .p-button.p-highlight:hover {\n  background: #0d89ec;\n  border-color: #0d89ec;\n  color: #ffffff;\n}\n.p-selectbutton .p-button.p-highlight:hover .p-button-icon-left,\n.p-selectbutton .p-button.p-highlight:hover .p-button-icon-right {\n  color: #ffffff;\n}\n.p-selectbutton.p-invalid > .p-button {\n  border-color: #f44336;\n}\n\n.p-slider {\n  background: #dee2e6;\n  border: 0 none;\n  border-radius: 3px;\n}\n.p-slider.p-slider-horizontal {\n  height: 0.286rem;\n}\n.p-slider.p-slider-horizontal .p-slider-handle {\n  margin-top: -0.5715rem;\n  margin-left: -0.5715rem;\n}\n.p-slider.p-slider-vertical {\n  width: 0.286rem;\n}\n.p-slider.p-slider-vertical .p-slider-handle {\n  margin-left: -0.5715rem;\n  margin-bottom: -0.5715rem;\n}\n.p-slider .p-slider-handle {\n  height: 1.143rem;\n  width: 1.143rem;\n  background: #ffffff;\n  border: 2px solid #2196F3;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n}\n.p-slider .p-slider-handle:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-slider .p-slider-range {\n  background: #2196F3;\n}\n.p-slider:not(.p-disabled) .p-slider-handle:hover {\n  background: #2196F3;\n  border-color: #2196F3;\n}\n\n.p-treeselect {\n  background: #ffffff;\n  border: 1px solid #ced4da;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n  border-radius: 3px;\n}\n.p-treeselect:not(.p-disabled):hover {\n  border-color: #2196F3;\n}\n.p-treeselect:not(.p-disabled).p-focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n  border-color: #2196F3;\n}\n.p-treeselect .p-treeselect-label {\n  padding: 0.5rem 0.5rem;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n}\n.p-treeselect .p-treeselect-label.p-placeholder {\n  color: #6c757d;\n}\n.p-treeselect.p-treeselect-chip .p-treeselect-token {\n  padding: 0.25rem 0.5rem;\n  margin-right: 0.5rem;\n  background: #dee2e6;\n  color: #495057;\n  border-radius: 16px;\n}\n.p-treeselect .p-treeselect-trigger {\n  background: transparent;\n  color: #6c757d;\n  width: 2.357rem;\n  border-top-right-radius: 3px;\n  border-bottom-right-radius: 3px;\n}\n.p-treeselect.p-invalid.p-component {\n  border-color: #f44336;\n}\n\n.p-inputwrapper-filled.p-treeselect.p-treeselect-chip .p-treeselect-label {\n  padding: 0.25rem 0.5rem;\n}\n\n.p-treeselect-panel {\n  background: #ffffff;\n  color: #495057;\n  border: 0 none;\n  border-radius: 3px;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n}\n.p-treeselect-panel .p-treeselect-items-wrapper .p-tree {\n  border: 0 none;\n}\n.p-treeselect-panel .p-treeselect-items-wrapper .p-treeselect-empty-message {\n  padding: 0.5rem 1rem;\n  color: #495057;\n  background: transparent;\n}\n\n.p-input-filled .p-treeselect {\n  background: #f8f9fa;\n}\n.p-input-filled .p-treeselect:not(.p-disabled):hover {\n  background-color: #f8f9fa;\n}\n.p-input-filled .p-treeselect:not(.p-disabled).p-focus {\n  background-color: #ffffff;\n}\n\n.p-togglebutton.p-button {\n  background: #ffffff;\n  border: 1px solid #ced4da;\n  color: #495057;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n}\n.p-togglebutton.p-button .p-button-icon-left,\n.p-togglebutton.p-button .p-button-icon-right {\n  color: #6c757d;\n}\n.p-togglebutton.p-button:not(.p-disabled):not(.p-highlight):hover {\n  background: #e9ecef;\n  border-color: #ced4da;\n  color: #495057;\n}\n.p-togglebutton.p-button:not(.p-disabled):not(.p-highlight):hover .p-button-icon-left,\n.p-togglebutton.p-button:not(.p-disabled):not(.p-highlight):hover .p-button-icon-right {\n  color: #6c757d;\n}\n.p-togglebutton.p-button.p-highlight {\n  background: #2196F3;\n  border-color: #2196F3;\n  color: #ffffff;\n}\n.p-togglebutton.p-button.p-highlight .p-button-icon-left,\n.p-togglebutton.p-button.p-highlight .p-button-icon-right {\n  color: #ffffff;\n}\n.p-togglebutton.p-button.p-highlight:hover {\n  background: #0d89ec;\n  border-color: #0d89ec;\n  color: #ffffff;\n}\n.p-togglebutton.p-button.p-highlight:hover .p-button-icon-left,\n.p-togglebutton.p-button.p-highlight:hover .p-button-icon-right {\n  color: #ffffff;\n}\n.p-togglebutton.p-button.p-invalid > .p-button {\n  border-color: #f44336;\n}\n\n.p-button {\n  color: #ffffff;\n  background: #2196F3;\n  border: 1px solid #2196F3;\n  padding: 0.5rem 1rem;\n  font-size: 1rem;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n  border-radius: 3px;\n}\n.p-button:enabled:hover {\n  background: #0d89ec;\n  color: #ffffff;\n  border-color: #0d89ec;\n}\n.p-button:enabled:active {\n  background: #0b7ad1;\n  color: #ffffff;\n  border-color: #0b7ad1;\n}\n.p-button.p-button-outlined {\n  background-color: transparent;\n  color: #2196F3;\n  border: 1px solid;\n}\n.p-button.p-button-outlined:enabled:hover {\n  background: rgba(33, 150, 243, 0.04);\n  color: #2196F3;\n  border: 1px solid;\n}\n.p-button.p-button-outlined:enabled:active {\n  background: rgba(33, 150, 243, 0.16);\n  color: #2196F3;\n  border: 1px solid;\n}\n.p-button.p-button-outlined.p-button-plain {\n  color: #6c757d;\n  border-color: #6c757d;\n}\n.p-button.p-button-outlined.p-button-plain:enabled:hover {\n  background: #e9ecef;\n  color: #6c757d;\n}\n.p-button.p-button-outlined.p-button-plain:enabled:active {\n  background: #dee2e6;\n  color: #6c757d;\n}\n.p-button.p-button-text {\n  background-color: transparent;\n  color: #2196F3;\n  border-color: transparent;\n}\n.p-button.p-button-text:enabled:hover {\n  background: rgba(33, 150, 243, 0.04);\n  color: #2196F3;\n  border-color: transparent;\n}\n.p-button.p-button-text:enabled:active {\n  background: rgba(33, 150, 243, 0.16);\n  color: #2196F3;\n  border-color: transparent;\n}\n.p-button.p-button-text.p-button-plain {\n  color: #6c757d;\n}\n.p-button.p-button-text.p-button-plain:enabled:hover {\n  background: #e9ecef;\n  color: #6c757d;\n}\n.p-button.p-button-text.p-button-plain:enabled:active {\n  background: #dee2e6;\n  color: #6c757d;\n}\n.p-button:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-button .p-button-icon-left {\n  margin-right: 0.5rem;\n}\n.p-button .p-button-icon-right {\n  margin-left: 0.5rem;\n}\n.p-button .p-button-icon-bottom {\n  margin-top: 0.5rem;\n}\n.p-button .p-button-icon-top {\n  margin-bottom: 0.5rem;\n}\n.p-button .p-badge {\n  margin-left: 0.5rem;\n  min-width: 1rem;\n  height: 1rem;\n  line-height: 1rem;\n  color: #2196F3;\n  background-color: #ffffff;\n}\n.p-button.p-button-raised {\n  box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12);\n}\n.p-button.p-button-rounded {\n  border-radius: 2rem;\n}\n.p-button.p-button-icon-only {\n  width: 2.357rem;\n  padding: 0.5rem 0;\n}\n.p-button.p-button-icon-only .p-button-icon-left,\n.p-button.p-button-icon-only .p-button-icon-right {\n  margin: 0;\n}\n.p-button.p-button-icon-only.p-button-rounded {\n  border-radius: 50%;\n  height: 2.357rem;\n}\n.p-button.p-button-sm {\n  font-size: 0.875rem;\n  padding: 0.4375rem 0.875rem;\n}\n.p-button.p-button-sm .p-button-icon {\n  font-size: 0.875rem;\n}\n.p-button.p-button-lg {\n  font-size: 1.25rem;\n  padding: 0.625rem 1.25rem;\n}\n.p-button.p-button-lg .p-button-icon {\n  font-size: 1.25rem;\n}\n.p-button.p-button-loading-label-only .p-button-label {\n  margin-left: 0.5rem;\n}\n.p-button.p-button-loading-label-only .p-button-loading-icon {\n  margin-right: 0;\n}\n\n.p-fluid .p-button {\n  width: 100%;\n}\n.p-fluid .p-button-icon-only {\n  width: 2.357rem;\n}\n.p-fluid .p-buttonset {\n  display: flex;\n}\n.p-fluid .p-buttonset .p-button {\n  flex: 1;\n}\n\n.p-button.p-button-secondary, .p-buttonset.p-button-secondary > .p-button, .p-splitbutton.p-button-secondary > .p-button {\n  color: #ffffff;\n  background: #607D8B;\n  border: 1px solid #607D8B;\n}\n.p-button.p-button-secondary:enabled:hover, .p-buttonset.p-button-secondary > .p-button:enabled:hover, .p-splitbutton.p-button-secondary > .p-button:enabled:hover {\n  background: #56717d;\n  color: #ffffff;\n  border-color: #56717d;\n}\n.p-button.p-button-secondary:enabled:focus, .p-buttonset.p-button-secondary > .p-button:enabled:focus, .p-splitbutton.p-button-secondary > .p-button:enabled:focus {\n  box-shadow: 0 0 0 0.2rem #beccd2;\n}\n.p-button.p-button-secondary:enabled:active, .p-buttonset.p-button-secondary > .p-button:enabled:active, .p-splitbutton.p-button-secondary > .p-button:enabled:active {\n  background: #4d646f;\n  color: #ffffff;\n  border-color: #4d646f;\n}\n.p-button.p-button-secondary.p-button-outlined, .p-buttonset.p-button-secondary > .p-button.p-button-outlined, .p-splitbutton.p-button-secondary > .p-button.p-button-outlined {\n  background-color: transparent;\n  color: #607D8B;\n  border: 1px solid;\n}\n.p-button.p-button-secondary.p-button-outlined:enabled:hover, .p-buttonset.p-button-secondary > .p-button.p-button-outlined:enabled:hover, .p-splitbutton.p-button-secondary > .p-button.p-button-outlined:enabled:hover {\n  background: rgba(96, 125, 139, 0.04);\n  color: #607D8B;\n  border: 1px solid;\n}\n.p-button.p-button-secondary.p-button-outlined:enabled:active, .p-buttonset.p-button-secondary > .p-button.p-button-outlined:enabled:active, .p-splitbutton.p-button-secondary > .p-button.p-button-outlined:enabled:active {\n  background: rgba(96, 125, 139, 0.16);\n  color: #607D8B;\n  border: 1px solid;\n}\n.p-button.p-button-secondary.p-button-text, .p-buttonset.p-button-secondary > .p-button.p-button-text, .p-splitbutton.p-button-secondary > .p-button.p-button-text {\n  background-color: transparent;\n  color: #607D8B;\n  border-color: transparent;\n}\n.p-button.p-button-secondary.p-button-text:enabled:hover, .p-buttonset.p-button-secondary > .p-button.p-button-text:enabled:hover, .p-splitbutton.p-button-secondary > .p-button.p-button-text:enabled:hover {\n  background: rgba(96, 125, 139, 0.04);\n  border-color: transparent;\n  color: #607D8B;\n}\n.p-button.p-button-secondary.p-button-text:enabled:active, .p-buttonset.p-button-secondary > .p-button.p-button-text:enabled:active, .p-splitbutton.p-button-secondary > .p-button.p-button-text:enabled:active {\n  background: rgba(96, 125, 139, 0.16);\n  border-color: transparent;\n  color: #607D8B;\n}\n\n.p-button.p-button-info, .p-buttonset.p-button-info > .p-button, .p-splitbutton.p-button-info > .p-button {\n  color: #ffffff;\n  background: #0288D1;\n  border: 1px solid #0288D1;\n}\n.p-button.p-button-info:enabled:hover, .p-buttonset.p-button-info > .p-button:enabled:hover, .p-splitbutton.p-button-info > .p-button:enabled:hover {\n  background: #027abc;\n  color: #ffffff;\n  border-color: #027abc;\n}\n.p-button.p-button-info:enabled:focus, .p-buttonset.p-button-info > .p-button:enabled:focus, .p-splitbutton.p-button-info > .p-button:enabled:focus {\n  box-shadow: 0 0 0 0.2rem #89d4fe;\n}\n.p-button.p-button-info:enabled:active, .p-buttonset.p-button-info > .p-button:enabled:active, .p-splitbutton.p-button-info > .p-button:enabled:active {\n  background: #026da7;\n  color: #ffffff;\n  border-color: #026da7;\n}\n.p-button.p-button-info.p-button-outlined, .p-buttonset.p-button-info > .p-button.p-button-outlined, .p-splitbutton.p-button-info > .p-button.p-button-outlined {\n  background-color: transparent;\n  color: #0288D1;\n  border: 1px solid;\n}\n.p-button.p-button-info.p-button-outlined:enabled:hover, .p-buttonset.p-button-info > .p-button.p-button-outlined:enabled:hover, .p-splitbutton.p-button-info > .p-button.p-button-outlined:enabled:hover {\n  background: rgba(2, 136, 209, 0.04);\n  color: #0288D1;\n  border: 1px solid;\n}\n.p-button.p-button-info.p-button-outlined:enabled:active, .p-buttonset.p-button-info > .p-button.p-button-outlined:enabled:active, .p-splitbutton.p-button-info > .p-button.p-button-outlined:enabled:active {\n  background: rgba(2, 136, 209, 0.16);\n  color: #0288D1;\n  border: 1px solid;\n}\n.p-button.p-button-info.p-button-text, .p-buttonset.p-button-info > .p-button.p-button-text, .p-splitbutton.p-button-info > .p-button.p-button-text {\n  background-color: transparent;\n  color: #0288D1;\n  border-color: transparent;\n}\n.p-button.p-button-info.p-button-text:enabled:hover, .p-buttonset.p-button-info > .p-button.p-button-text:enabled:hover, .p-splitbutton.p-button-info > .p-button.p-button-text:enabled:hover {\n  background: rgba(2, 136, 209, 0.04);\n  border-color: transparent;\n  color: #0288D1;\n}\n.p-button.p-button-info.p-button-text:enabled:active, .p-buttonset.p-button-info > .p-button.p-button-text:enabled:active, .p-splitbutton.p-button-info > .p-button.p-button-text:enabled:active {\n  background: rgba(2, 136, 209, 0.16);\n  border-color: transparent;\n  color: #0288D1;\n}\n\n.p-button.p-button-success, .p-buttonset.p-button-success > .p-button, .p-splitbutton.p-button-success > .p-button {\n  color: #ffffff;\n  background: #689F38;\n  border: 1px solid #689F38;\n}\n.p-button.p-button-success:enabled:hover, .p-buttonset.p-button-success > .p-button:enabled:hover, .p-splitbutton.p-button-success > .p-button:enabled:hover {\n  background: #5e8f32;\n  color: #ffffff;\n  border-color: #5e8f32;\n}\n.p-button.p-button-success:enabled:focus, .p-buttonset.p-button-success > .p-button:enabled:focus, .p-splitbutton.p-button-success > .p-button:enabled:focus {\n  box-shadow: 0 0 0 0.2rem #c2e0a8;\n}\n.p-button.p-button-success:enabled:active, .p-buttonset.p-button-success > .p-button:enabled:active, .p-splitbutton.p-button-success > .p-button:enabled:active {\n  background: #537f2d;\n  color: #ffffff;\n  border-color: #537f2d;\n}\n.p-button.p-button-success.p-button-outlined, .p-buttonset.p-button-success > .p-button.p-button-outlined, .p-splitbutton.p-button-success > .p-button.p-button-outlined {\n  background-color: transparent;\n  color: #689F38;\n  border: 1px solid;\n}\n.p-button.p-button-success.p-button-outlined:enabled:hover, .p-buttonset.p-button-success > .p-button.p-button-outlined:enabled:hover, .p-splitbutton.p-button-success > .p-button.p-button-outlined:enabled:hover {\n  background: rgba(104, 159, 56, 0.04);\n  color: #689F38;\n  border: 1px solid;\n}\n.p-button.p-button-success.p-button-outlined:enabled:active, .p-buttonset.p-button-success > .p-button.p-button-outlined:enabled:active, .p-splitbutton.p-button-success > .p-button.p-button-outlined:enabled:active {\n  background: rgba(104, 159, 56, 0.16);\n  color: #689F38;\n  border: 1px solid;\n}\n.p-button.p-button-success.p-button-text, .p-buttonset.p-button-success > .p-button.p-button-text, .p-splitbutton.p-button-success > .p-button.p-button-text {\n  background-color: transparent;\n  color: #689F38;\n  border-color: transparent;\n}\n.p-button.p-button-success.p-button-text:enabled:hover, .p-buttonset.p-button-success > .p-button.p-button-text:enabled:hover, .p-splitbutton.p-button-success > .p-button.p-button-text:enabled:hover {\n  background: rgba(104, 159, 56, 0.04);\n  border-color: transparent;\n  color: #689F38;\n}\n.p-button.p-button-success.p-button-text:enabled:active, .p-buttonset.p-button-success > .p-button.p-button-text:enabled:active, .p-splitbutton.p-button-success > .p-button.p-button-text:enabled:active {\n  background: rgba(104, 159, 56, 0.16);\n  border-color: transparent;\n  color: #689F38;\n}\n\n.p-button.p-button-warning, .p-buttonset.p-button-warning > .p-button, .p-splitbutton.p-button-warning > .p-button {\n  color: #212529;\n  background: #FBC02D;\n  border: 1px solid #FBC02D;\n}\n.p-button.p-button-warning:enabled:hover, .p-buttonset.p-button-warning > .p-button:enabled:hover, .p-splitbutton.p-button-warning > .p-button:enabled:hover {\n  background: #fab710;\n  color: #212529;\n  border-color: #fab710;\n}\n.p-button.p-button-warning:enabled:focus, .p-buttonset.p-button-warning > .p-button:enabled:focus, .p-splitbutton.p-button-warning > .p-button:enabled:focus {\n  box-shadow: 0 0 0 0.2rem #fde6ab;\n}\n.p-button.p-button-warning:enabled:active, .p-buttonset.p-button-warning > .p-button:enabled:active, .p-splitbutton.p-button-warning > .p-button:enabled:active {\n  background: #e8a704;\n  color: #212529;\n  border-color: #e8a704;\n}\n.p-button.p-button-warning.p-button-outlined, .p-buttonset.p-button-warning > .p-button.p-button-outlined, .p-splitbutton.p-button-warning > .p-button.p-button-outlined {\n  background-color: transparent;\n  color: #FBC02D;\n  border: 1px solid;\n}\n.p-button.p-button-warning.p-button-outlined:enabled:hover, .p-buttonset.p-button-warning > .p-button.p-button-outlined:enabled:hover, .p-splitbutton.p-button-warning > .p-button.p-button-outlined:enabled:hover {\n  background: rgba(251, 192, 45, 0.04);\n  color: #FBC02D;\n  border: 1px solid;\n}\n.p-button.p-button-warning.p-button-outlined:enabled:active, .p-buttonset.p-button-warning > .p-button.p-button-outlined:enabled:active, .p-splitbutton.p-button-warning > .p-button.p-button-outlined:enabled:active {\n  background: rgba(251, 192, 45, 0.16);\n  color: #FBC02D;\n  border: 1px solid;\n}\n.p-button.p-button-warning.p-button-text, .p-buttonset.p-button-warning > .p-button.p-button-text, .p-splitbutton.p-button-warning > .p-button.p-button-text {\n  background-color: transparent;\n  color: #FBC02D;\n  border-color: transparent;\n}\n.p-button.p-button-warning.p-button-text:enabled:hover, .p-buttonset.p-button-warning > .p-button.p-button-text:enabled:hover, .p-splitbutton.p-button-warning > .p-button.p-button-text:enabled:hover {\n  background: rgba(251, 192, 45, 0.04);\n  border-color: transparent;\n  color: #FBC02D;\n}\n.p-button.p-button-warning.p-button-text:enabled:active, .p-buttonset.p-button-warning > .p-button.p-button-text:enabled:active, .p-splitbutton.p-button-warning > .p-button.p-button-text:enabled:active {\n  background: rgba(251, 192, 45, 0.16);\n  border-color: transparent;\n  color: #FBC02D;\n}\n\n.p-button.p-button-help, .p-buttonset.p-button-help > .p-button, .p-splitbutton.p-button-help > .p-button {\n  color: #ffffff;\n  background: #9C27B0;\n  border: 1px solid #9C27B0;\n}\n.p-button.p-button-help:enabled:hover, .p-buttonset.p-button-help > .p-button:enabled:hover, .p-splitbutton.p-button-help > .p-button:enabled:hover {\n  background: #8c239e;\n  color: #ffffff;\n  border-color: #8c239e;\n}\n.p-button.p-button-help:enabled:focus, .p-buttonset.p-button-help > .p-button:enabled:focus, .p-splitbutton.p-button-help > .p-button:enabled:focus {\n  box-shadow: 0 0 0 0.2rem #df9eea;\n}\n.p-button.p-button-help:enabled:active, .p-buttonset.p-button-help > .p-button:enabled:active, .p-splitbutton.p-button-help > .p-button:enabled:active {\n  background: #7d1f8d;\n  color: #ffffff;\n  border-color: #7d1f8d;\n}\n.p-button.p-button-help.p-button-outlined, .p-buttonset.p-button-help > .p-button.p-button-outlined, .p-splitbutton.p-button-help > .p-button.p-button-outlined {\n  background-color: transparent;\n  color: #9C27B0;\n  border: 1px solid;\n}\n.p-button.p-button-help.p-button-outlined:enabled:hover, .p-buttonset.p-button-help > .p-button.p-button-outlined:enabled:hover, .p-splitbutton.p-button-help > .p-button.p-button-outlined:enabled:hover {\n  background: rgba(156, 39, 176, 0.04);\n  color: #9C27B0;\n  border: 1px solid;\n}\n.p-button.p-button-help.p-button-outlined:enabled:active, .p-buttonset.p-button-help > .p-button.p-button-outlined:enabled:active, .p-splitbutton.p-button-help > .p-button.p-button-outlined:enabled:active {\n  background: rgba(156, 39, 176, 0.16);\n  color: #9C27B0;\n  border: 1px solid;\n}\n.p-button.p-button-help.p-button-text, .p-buttonset.p-button-help > .p-button.p-button-text, .p-splitbutton.p-button-help > .p-button.p-button-text {\n  background-color: transparent;\n  color: #9C27B0;\n  border-color: transparent;\n}\n.p-button.p-button-help.p-button-text:enabled:hover, .p-buttonset.p-button-help > .p-button.p-button-text:enabled:hover, .p-splitbutton.p-button-help > .p-button.p-button-text:enabled:hover {\n  background: rgba(156, 39, 176, 0.04);\n  border-color: transparent;\n  color: #9C27B0;\n}\n.p-button.p-button-help.p-button-text:enabled:active, .p-buttonset.p-button-help > .p-button.p-button-text:enabled:active, .p-splitbutton.p-button-help > .p-button.p-button-text:enabled:active {\n  background: rgba(156, 39, 176, 0.16);\n  border-color: transparent;\n  color: #9C27B0;\n}\n\n.p-button.p-button-danger, .p-buttonset.p-button-danger > .p-button, .p-splitbutton.p-button-danger > .p-button {\n  color: #ffffff;\n  background: #D32F2F;\n  border: 1px solid #D32F2F;\n}\n.p-button.p-button-danger:enabled:hover, .p-buttonset.p-button-danger > .p-button:enabled:hover, .p-splitbutton.p-button-danger > .p-button:enabled:hover {\n  background: #c02929;\n  color: #ffffff;\n  border-color: #c02929;\n}\n.p-button.p-button-danger:enabled:focus, .p-buttonset.p-button-danger > .p-button:enabled:focus, .p-splitbutton.p-button-danger > .p-button:enabled:focus {\n  box-shadow: 0 0 0 0.2rem #edacac;\n}\n.p-button.p-button-danger:enabled:active, .p-buttonset.p-button-danger > .p-button:enabled:active, .p-splitbutton.p-button-danger > .p-button:enabled:active {\n  background: #aa2424;\n  color: #ffffff;\n  border-color: #aa2424;\n}\n.p-button.p-button-danger.p-button-outlined, .p-buttonset.p-button-danger > .p-button.p-button-outlined, .p-splitbutton.p-button-danger > .p-button.p-button-outlined {\n  background-color: transparent;\n  color: #D32F2F;\n  border: 1px solid;\n}\n.p-button.p-button-danger.p-button-outlined:enabled:hover, .p-buttonset.p-button-danger > .p-button.p-button-outlined:enabled:hover, .p-splitbutton.p-button-danger > .p-button.p-button-outlined:enabled:hover {\n  background: rgba(211, 47, 47, 0.04);\n  color: #D32F2F;\n  border: 1px solid;\n}\n.p-button.p-button-danger.p-button-outlined:enabled:active, .p-buttonset.p-button-danger > .p-button.p-button-outlined:enabled:active, .p-splitbutton.p-button-danger > .p-button.p-button-outlined:enabled:active {\n  background: rgba(211, 47, 47, 0.16);\n  color: #D32F2F;\n  border: 1px solid;\n}\n.p-button.p-button-danger.p-button-text, .p-buttonset.p-button-danger > .p-button.p-button-text, .p-splitbutton.p-button-danger > .p-button.p-button-text {\n  background-color: transparent;\n  color: #D32F2F;\n  border-color: transparent;\n}\n.p-button.p-button-danger.p-button-text:enabled:hover, .p-buttonset.p-button-danger > .p-button.p-button-text:enabled:hover, .p-splitbutton.p-button-danger > .p-button.p-button-text:enabled:hover {\n  background: rgba(211, 47, 47, 0.04);\n  border-color: transparent;\n  color: #D32F2F;\n}\n.p-button.p-button-danger.p-button-text:enabled:active, .p-buttonset.p-button-danger > .p-button.p-button-text:enabled:active, .p-splitbutton.p-button-danger > .p-button.p-button-text:enabled:active {\n  background: rgba(211, 47, 47, 0.16);\n  border-color: transparent;\n  color: #D32F2F;\n}\n\n.p-button.p-button-link {\n  color: #0b7ad1;\n  background: transparent;\n  border: transparent;\n}\n.p-button.p-button-link:enabled:hover {\n  background: transparent;\n  color: #0b7ad1;\n  border-color: transparent;\n}\n.p-button.p-button-link:enabled:hover .p-button-label {\n  text-decoration: underline;\n}\n.p-button.p-button-link:enabled:focus {\n  background: transparent;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n  border-color: transparent;\n}\n.p-button.p-button-link:enabled:active {\n  background: transparent;\n  color: #0b7ad1;\n  border-color: transparent;\n}\n\n.p-speeddial-button.p-button.p-button-icon-only {\n  width: 4rem;\n  height: 4rem;\n}\n.p-speeddial-button.p-button.p-button-icon-only .p-button-icon {\n  font-size: 1.3rem;\n}\n\n.p-speeddial-action {\n  width: 3rem;\n  height: 3rem;\n  background: #495057;\n  color: #fff;\n}\n.p-speeddial-action:hover {\n  background: #343a40;\n  color: #fff;\n}\n\n.p-speeddial-direction-up .p-speeddial-item {\n  margin: 0.25rem 0;\n}\n.p-speeddial-direction-up .p-speeddial-item:first-child {\n  margin-bottom: 0.5rem;\n}\n\n.p-speeddial-direction-down .p-speeddial-item {\n  margin: 0.25rem 0;\n}\n.p-speeddial-direction-down .p-speeddial-item:first-child {\n  margin-top: 0.5rem;\n}\n\n.p-speeddial-direction-left .p-speeddial-item {\n  margin: 0 0.25rem;\n}\n.p-speeddial-direction-left .p-speeddial-item:first-child {\n  margin-right: 0.5rem;\n}\n\n.p-speeddial-direction-right .p-speeddial-item {\n  margin: 0 0.25rem;\n}\n.p-speeddial-direction-right .p-speeddial-item:first-child {\n  margin-left: 0.5rem;\n}\n\n.p-speeddial-circle .p-speeddial-item,\n.p-speeddial-semi-circle .p-speeddial-item,\n.p-speeddial-quarter-circle .p-speeddial-item {\n  margin: 0;\n}\n.p-speeddial-circle .p-speeddial-item:first-child, .p-speeddial-circle .p-speeddial-item:last-child,\n.p-speeddial-semi-circle .p-speeddial-item:first-child,\n.p-speeddial-semi-circle .p-speeddial-item:last-child,\n.p-speeddial-quarter-circle .p-speeddial-item:first-child,\n.p-speeddial-quarter-circle .p-speeddial-item:last-child {\n  margin: 0;\n}\n\n.p-speeddial-mask {\n  background-color: rgba(0, 0, 0, 0.4);\n}\n\n.p-carousel .p-carousel-content .p-carousel-prev,\n.p-carousel .p-carousel-content .p-carousel-next {\n  width: 2rem;\n  height: 2rem;\n  color: #6c757d;\n  border: 0 none;\n  background: transparent;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n  margin: 0.5rem;\n}\n.p-carousel .p-carousel-content .p-carousel-prev:enabled:hover,\n.p-carousel .p-carousel-content .p-carousel-next:enabled:hover {\n  color: #495057;\n  border-color: transparent;\n  background: #e9ecef;\n}\n.p-carousel .p-carousel-content .p-carousel-prev:focus,\n.p-carousel .p-carousel-content .p-carousel-next:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-carousel .p-carousel-indicators {\n  padding: 1rem;\n}\n.p-carousel .p-carousel-indicators .p-carousel-indicator {\n  margin-right: 0.5rem;\n  margin-bottom: 0.5rem;\n}\n.p-carousel .p-carousel-indicators .p-carousel-indicator button {\n  background-color: #e9ecef;\n  width: 2rem;\n  height: 0.5rem;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n  border-radius: 0;\n}\n.p-carousel .p-carousel-indicators .p-carousel-indicator button:hover {\n  background: #dee2e6;\n}\n.p-carousel .p-carousel-indicators .p-carousel-indicator.p-highlight button {\n  background: #E3F2FD;\n  color: #495057;\n}\n\n.p-datatable .p-paginator-top {\n  border-width: 0 0 1px 0;\n  border-radius: 0;\n}\n.p-datatable .p-paginator-bottom {\n  border-width: 0 0 1px 0;\n  border-radius: 0;\n}\n.p-datatable .p-datatable-header {\n  background: #f8f9fa;\n  color: #495057;\n  border: 1px solid #e9ecef;\n  border-width: 1px 0 1px 0;\n  padding: 1rem 1rem;\n  font-weight: 600;\n}\n.p-datatable .p-datatable-footer {\n  background: #f8f9fa;\n  color: #495057;\n  border: 1px solid #e9ecef;\n  border-width: 0 0 1px 0;\n  padding: 1rem 1rem;\n  font-weight: 600;\n}\n.p-datatable .p-datatable-thead > tr > th {\n  text-align: left;\n  padding: 1rem 1rem;\n  border: 1px solid #e9ecef;\n  border-width: 0 0 1px 0;\n  font-weight: 600;\n  color: #495057;\n  background: #f8f9fa;\n  transition: box-shadow 0.2s;\n}\n.p-datatable .p-datatable-tfoot > tr > td {\n  text-align: left;\n  padding: 1rem 1rem;\n  border: 1px solid #e9ecef;\n  border-width: 0 0 1px 0;\n  font-weight: 600;\n  color: #495057;\n  background: #f8f9fa;\n}\n.p-datatable .p-sortable-column .p-sortable-column-icon {\n  color: #6c757d;\n  margin-left: 0.5rem;\n}\n.p-datatable .p-sortable-column .p-sortable-column-badge {\n  border-radius: 50%;\n  height: 1.143rem;\n  min-width: 1.143rem;\n  line-height: 1.143rem;\n  color: #495057;\n  background: #E3F2FD;\n  margin-left: 0.5rem;\n}\n.p-datatable .p-sortable-column:not(.p-highlight):hover {\n  background: #e9ecef;\n  color: #495057;\n}\n.p-datatable .p-sortable-column:not(.p-highlight):hover .p-sortable-column-icon {\n  color: #6c757d;\n}\n.p-datatable .p-sortable-column.p-highlight {\n  background: #f8f9fa;\n  color: #2196F3;\n}\n.p-datatable .p-sortable-column.p-highlight .p-sortable-column-icon {\n  color: #2196F3;\n}\n.p-datatable .p-sortable-column.p-highlight:hover {\n  background: #e9ecef;\n  color: #2196F3;\n}\n.p-datatable .p-sortable-column.p-highlight:hover .p-sortable-column-icon {\n  color: #2196F3;\n}\n.p-datatable .p-sortable-column:focus {\n  box-shadow: inset 0 0 0 0.15rem #a6d5fa;\n  outline: 0 none;\n}\n.p-datatable .p-datatable-tbody > tr {\n  background: #ffffff;\n  color: #495057;\n  transition: box-shadow 0.2s;\n  outline-color: #a6d5fa;\n}\n.p-datatable .p-datatable-tbody > tr > td {\n  text-align: left;\n  border: 1px solid #e9ecef;\n  border-width: 0 0 1px 0;\n  padding: 1rem 1rem;\n}\n.p-datatable .p-datatable-tbody > tr > td .p-row-toggler,\n.p-datatable .p-datatable-tbody > tr > td .p-row-editor-init,\n.p-datatable .p-datatable-tbody > tr > td .p-row-editor-save,\n.p-datatable .p-datatable-tbody > tr > td .p-row-editor-cancel {\n  width: 2rem;\n  height: 2rem;\n  color: #6c757d;\n  border: 0 none;\n  background: transparent;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n}\n.p-datatable .p-datatable-tbody > tr > td .p-row-toggler:enabled:hover,\n.p-datatable .p-datatable-tbody > tr > td .p-row-editor-init:enabled:hover,\n.p-datatable .p-datatable-tbody > tr > td .p-row-editor-save:enabled:hover,\n.p-datatable .p-datatable-tbody > tr > td .p-row-editor-cancel:enabled:hover {\n  color: #495057;\n  border-color: transparent;\n  background: #e9ecef;\n}\n.p-datatable .p-datatable-tbody > tr > td .p-row-toggler:focus,\n.p-datatable .p-datatable-tbody > tr > td .p-row-editor-init:focus,\n.p-datatable .p-datatable-tbody > tr > td .p-row-editor-save:focus,\n.p-datatable .p-datatable-tbody > tr > td .p-row-editor-cancel:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-datatable .p-datatable-tbody > tr > td .p-row-editor-save {\n  margin-right: 0.5rem;\n}\n.p-datatable .p-datatable-tbody > tr > td > .p-column-title {\n  font-weight: 600;\n}\n.p-datatable .p-datatable-tbody > tr.p-highlight {\n  background: #E3F2FD;\n  color: #495057;\n}\n.p-datatable .p-datatable-tbody > tr.p-datatable-dragpoint-top > td {\n  box-shadow: inset 0 2px 0 0 #E3F2FD;\n}\n.p-datatable .p-datatable-tbody > tr.p-datatable-dragpoint-bottom > td {\n  box-shadow: inset 0 -2px 0 0 #E3F2FD;\n}\n.p-datatable.p-datatable-hoverable-rows .p-datatable-tbody > tr:not(.p-highlight):hover {\n  background: #e9ecef;\n  color: #495057;\n}\n.p-datatable .p-column-resizer-helper {\n  background: #2196F3;\n}\n.p-datatable .p-datatable-scrollable-header,\n.p-datatable .p-datatable-scrollable-footer {\n  background: #f8f9fa;\n}\n.p-datatable .p-datatable-loading-icon {\n  font-size: 2rem;\n}\n.p-datatable.p-datatable-gridlines .p-datatable-header {\n  border-width: 1px 1px 0 1px;\n}\n.p-datatable.p-datatable-gridlines .p-datatable-footer {\n  border-width: 0 1px 1px 1px;\n}\n.p-datatable.p-datatable-gridlines .p-paginator-top {\n  border-width: 0 1px 0 1px;\n}\n.p-datatable.p-datatable-gridlines .p-paginator-bottom {\n  border-width: 0 1px 1px 1px;\n}\n.p-datatable.p-datatable-gridlines .p-datatable-thead > tr > th {\n  border-width: 1px 1px 1px 1px;\n}\n.p-datatable.p-datatable-gridlines .p-datatable-tbody > tr > td {\n  border-width: 1px;\n}\n.p-datatable.p-datatable-gridlines .p-datatable-tfoot > tr > td {\n  border-width: 1px;\n}\n.p-datatable.p-datatable-gridlines.p-datatable-scrollable .p-datatable-thead > tr > th + th {\n  border-left-width: 0;\n}\n.p-datatable.p-datatable-gridlines.p-datatable-scrollable .p-datatable-tbody > tr > td + td {\n  border-left-width: 0;\n}\n.p-datatable.p-datatable-gridlines.p-datatable-scrollable .p-datatable-tbody > tr + tr > td, .p-datatable.p-datatable-gridlines.p-datatable-scrollable .p-datatable-tbody > tr:first-child > td {\n  border-top-width: 0;\n}\n.p-datatable.p-datatable-gridlines.p-datatable-scrollable .p-datatable-tfoot > tr > td + td {\n  border-left-width: 0;\n}\n.p-datatable.p-datatable-striped .p-datatable-tbody > tr:nth-child(even) {\n  background: #fcfcfc;\n}\n.p-datatable.p-datatable-striped .p-datatable-tbody > tr:nth-child(even).p-highlight {\n  background: #E3F2FD;\n  color: #495057;\n}\n.p-datatable.p-datatable-striped .p-datatable-tbody > tr:nth-child(even).p-highlight .p-row-toggler {\n  color: #495057;\n}\n.p-datatable.p-datatable-striped .p-datatable-tbody > tr:nth-child(even).p-highlight .p-row-toggler:hover {\n  color: #495057;\n}\n.p-datatable.p-datatable-sm .p-datatable-header {\n  padding: 0.5rem 0.5rem;\n}\n.p-datatable.p-datatable-sm .p-datatable-thead > tr > th {\n  padding: 0.5rem 0.5rem;\n}\n.p-datatable.p-datatable-sm .p-datatable-tbody > tr > td {\n  padding: 0.5rem 0.5rem;\n}\n.p-datatable.p-datatable-sm .p-datatable-tfoot > tr > td {\n  padding: 0.5rem 0.5rem;\n}\n.p-datatable.p-datatable-sm .p-datatable-footer {\n  padding: 0.5rem 0.5rem;\n}\n.p-datatable.p-datatable-lg .p-datatable-header {\n  padding: 1.25rem 1.25rem;\n}\n.p-datatable.p-datatable-lg .p-datatable-thead > tr > th {\n  padding: 1.25rem 1.25rem;\n}\n.p-datatable.p-datatable-lg .p-datatable-tbody > tr > td {\n  padding: 1.25rem 1.25rem;\n}\n.p-datatable.p-datatable-lg .p-datatable-tfoot > tr > td {\n  padding: 1.25rem 1.25rem;\n}\n.p-datatable.p-datatable-lg .p-datatable-footer {\n  padding: 1.25rem 1.25rem;\n}\n\n.p-dataview .p-paginator-top {\n  border-width: 0 0 1px 0;\n  border-radius: 0;\n}\n.p-dataview .p-paginator-bottom {\n  border-width: 0 0 1px 0;\n  border-radius: 0;\n}\n.p-dataview .p-dataview-header {\n  background: #f8f9fa;\n  color: #495057;\n  border: 1px solid #e9ecef;\n  border-width: 1px 0 1px 0;\n  padding: 1rem 1rem;\n  font-weight: 600;\n}\n.p-dataview .p-dataview-content {\n  background: #ffffff;\n  color: #495057;\n  border: 0 none;\n  padding: 0;\n}\n.p-dataview.p-dataview-list .p-dataview-content > .p-grid > div {\n  border: solid #e9ecef;\n  border-width: 0 0 1px 0;\n}\n.p-dataview .p-dataview-footer {\n  background: #f8f9fa;\n  color: #495057;\n  border: 1px solid #e9ecef;\n  border-width: 0 0 1px 0;\n  padding: 1rem 1rem;\n  font-weight: 600;\n  border-bottom-left-radius: 3px;\n  border-bottom-right-radius: 3px;\n}\n\n.p-column-filter-row .p-column-filter-menu-button,\n.p-column-filter-row .p-column-filter-clear-button {\n  margin-left: 0.5rem;\n}\n\n.p-column-filter-menu-button {\n  width: 2rem;\n  height: 2rem;\n  color: #6c757d;\n  border: 0 none;\n  background: transparent;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n}\n.p-column-filter-menu-button:hover {\n  color: #495057;\n  border-color: transparent;\n  background: #e9ecef;\n}\n.p-column-filter-menu-button.p-column-filter-menu-button-open, .p-column-filter-menu-button.p-column-filter-menu-button-open:hover {\n  background: #e9ecef;\n  color: #495057;\n}\n.p-column-filter-menu-button.p-column-filter-menu-button-active, .p-column-filter-menu-button.p-column-filter-menu-button-active:hover {\n  background: #E3F2FD;\n  color: #495057;\n}\n.p-column-filter-menu-button:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n\n.p-column-filter-clear-button {\n  width: 2rem;\n  height: 2rem;\n  color: #6c757d;\n  border: 0 none;\n  background: transparent;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n}\n.p-column-filter-clear-button:hover {\n  color: #495057;\n  border-color: transparent;\n  background: #e9ecef;\n}\n.p-column-filter-clear-button:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n\n.p-column-filter-overlay {\n  background: #ffffff;\n  color: #495057;\n  border: 0 none;\n  border-radius: 3px;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n  min-width: 12.5rem;\n}\n.p-column-filter-overlay .p-column-filter-row-items {\n  padding: 0.5rem 0;\n}\n.p-column-filter-overlay .p-column-filter-row-items .p-column-filter-row-item {\n  margin: 0;\n  padding: 0.5rem 1rem;\n  border: 0 none;\n  color: #495057;\n  background: transparent;\n  transition: box-shadow 0.2s;\n  border-radius: 0;\n}\n.p-column-filter-overlay .p-column-filter-row-items .p-column-filter-row-item.p-highlight {\n  color: #495057;\n  background: #E3F2FD;\n}\n.p-column-filter-overlay .p-column-filter-row-items .p-column-filter-row-item:not(.p-highlight):not(.p-disabled):hover {\n  color: #495057;\n  background: #e9ecef;\n}\n.p-column-filter-overlay .p-column-filter-row-items .p-column-filter-row-item:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: inset 0 0 0 0.15rem #a6d5fa;\n}\n.p-column-filter-overlay .p-column-filter-row-items .p-column-filter-separator {\n  border-top: 1px solid #dee2e6;\n  margin: 0.25rem 0;\n}\n\n.p-column-filter-overlay-menu .p-column-filter-operator {\n  padding: 0.5rem 1rem;\n  border-bottom: 0 none;\n  color: #495057;\n  background: #f8f9fa;\n  margin: 0;\n  border-top-right-radius: 3px;\n  border-top-left-radius: 3px;\n}\n.p-column-filter-overlay-menu .p-column-filter-constraint {\n  padding: 1rem;\n  border-bottom: 1px solid #dee2e6;\n}\n.p-column-filter-overlay-menu .p-column-filter-constraint .p-column-filter-matchmode-dropdown {\n  margin-bottom: 0.5rem;\n}\n.p-column-filter-overlay-menu .p-column-filter-constraint .p-column-filter-remove-button {\n  margin-top: 0.5rem;\n}\n.p-column-filter-overlay-menu .p-column-filter-constraint:last-child {\n  border-bottom: 0 none;\n}\n.p-column-filter-overlay-menu .p-column-filter-add-rule {\n  padding: 0.5rem 1rem;\n}\n.p-column-filter-overlay-menu .p-column-filter-buttonbar {\n  padding: 1rem;\n}\n\n.fc {\n  /* FullCalendar 4 */\n  /* FullCalendar 5 */\n}\n.fc.fc-unthemed .fc-view-container th {\n  background: #f8f9fa;\n  border: 1px solid #dee2e6;\n  color: #495057;\n}\n.fc.fc-unthemed .fc-view-container td.fc-widget-content {\n  border: 1px solid #dee2e6;\n  color: #495057;\n}\n.fc.fc-unthemed .fc-view-container td.fc-head-container {\n  border: 1px solid #dee2e6;\n}\n.fc.fc-unthemed .fc-view-container .fc-view {\n  background: #ffffff;\n}\n.fc.fc-unthemed .fc-view-container .fc-row {\n  border-right: 1px solid #dee2e6;\n}\n.fc.fc-unthemed .fc-view-container .fc-event {\n  background: #0d89ec;\n  border: 1px solid #0d89ec;\n  color: #ffffff;\n}\n.fc.fc-unthemed .fc-view-container .fc-divider {\n  background: #f8f9fa;\n  border: 1px solid #dee2e6;\n}\n.fc.fc-unthemed .fc-toolbar .fc-button {\n  color: #ffffff;\n  background: #2196F3;\n  border: 1px solid #2196F3;\n  font-size: 1rem;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n  border-radius: 3px;\n  display: flex;\n  align-items: center;\n}\n.fc.fc-unthemed .fc-toolbar .fc-button:enabled:hover {\n  background: #0d89ec;\n  color: #ffffff;\n  border-color: #0d89ec;\n}\n.fc.fc-unthemed .fc-toolbar .fc-button:enabled:active {\n  background: #0b7ad1;\n  color: #ffffff;\n  border-color: #0b7ad1;\n}\n.fc.fc-unthemed .fc-toolbar .fc-button:enabled:active:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.fc.fc-unthemed .fc-toolbar .fc-button .fc-icon-chevron-left {\n  font-family: "PrimeIcons" !important;\n  text-indent: 0;\n  font-size: 1rem;\n}\n.fc.fc-unthemed .fc-toolbar .fc-button .fc-icon-chevron-left:before {\n  content: "\\e900";\n}\n.fc.fc-unthemed .fc-toolbar .fc-button .fc-icon-chevron-right {\n  font-family: "PrimeIcons" !important;\n  text-indent: 0;\n  font-size: 1rem;\n}\n.fc.fc-unthemed .fc-toolbar .fc-button .fc-icon-chevron-right:before {\n  content: "\\e901";\n}\n.fc.fc-unthemed .fc-toolbar .fc-button:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.fc.fc-unthemed .fc-toolbar .fc-button.fc-dayGridMonth-button, .fc.fc-unthemed .fc-toolbar .fc-button.fc-timeGridWeek-button, .fc.fc-unthemed .fc-toolbar .fc-button.fc-timeGridDay-button {\n  background: #ffffff;\n  border: 1px solid #ced4da;\n  color: #495057;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n}\n.fc.fc-unthemed .fc-toolbar .fc-button.fc-dayGridMonth-button:hover, .fc.fc-unthemed .fc-toolbar .fc-button.fc-timeGridWeek-button:hover, .fc.fc-unthemed .fc-toolbar .fc-button.fc-timeGridDay-button:hover {\n  background: #e9ecef;\n  border-color: #ced4da;\n  color: #495057;\n}\n.fc.fc-unthemed .fc-toolbar .fc-button.fc-dayGridMonth-button.fc-button-active, .fc.fc-unthemed .fc-toolbar .fc-button.fc-timeGridWeek-button.fc-button-active, .fc.fc-unthemed .fc-toolbar .fc-button.fc-timeGridDay-button.fc-button-active {\n  background: #2196F3;\n  border-color: #2196F3;\n  color: #ffffff;\n}\n.fc.fc-unthemed .fc-toolbar .fc-button.fc-dayGridMonth-button.fc-button-active:hover, .fc.fc-unthemed .fc-toolbar .fc-button.fc-timeGridWeek-button.fc-button-active:hover, .fc.fc-unthemed .fc-toolbar .fc-button.fc-timeGridDay-button.fc-button-active:hover {\n  background: #0d89ec;\n  border-color: #0d89ec;\n  color: #ffffff;\n}\n.fc.fc-unthemed .fc-toolbar .fc-button.fc-dayGridMonth-button:focus, .fc.fc-unthemed .fc-toolbar .fc-button.fc-timeGridWeek-button:focus, .fc.fc-unthemed .fc-toolbar .fc-button.fc-timeGridDay-button:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n  z-index: 1;\n}\n.fc.fc-unthemed .fc-toolbar .fc-button-group .fc-button {\n  border-radius: 0;\n}\n.fc.fc-unthemed .fc-toolbar .fc-button-group .fc-button:first-child {\n  border-top-left-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n.fc.fc-unthemed .fc-toolbar .fc-button-group .fc-button:last-child {\n  border-top-right-radius: 3px;\n  border-bottom-right-radius: 3px;\n}\n.fc.fc-theme-standard .fc-view-harness .fc-scrollgrid {\n  border-color: #dee2e6;\n}\n.fc.fc-theme-standard .fc-view-harness th {\n  background: #f8f9fa;\n  border-color: #dee2e6;\n  color: #495057;\n}\n.fc.fc-theme-standard .fc-view-harness td {\n  color: #495057;\n  border-color: #dee2e6;\n}\n.fc.fc-theme-standard .fc-view-harness .fc-view {\n  background: #ffffff;\n}\n.fc.fc-theme-standard .fc-view-harness .fc-popover {\n  background: none;\n  border: 0 none;\n}\n.fc.fc-theme-standard .fc-view-harness .fc-popover .fc-popover-header {\n  border: 1px solid #dee2e6;\n  padding: 1rem;\n  background: #f8f9fa;\n  color: #495057;\n}\n.fc.fc-theme-standard .fc-view-harness .fc-popover .fc-popover-header .fc-popover-close {\n  opacity: 1;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  overflow: hidden;\n  font-family: "PrimeIcons" !important;\n  font-size: 1rem;\n  width: 2rem;\n  height: 2rem;\n  color: #6c757d;\n  border: 0 none;\n  background: transparent;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n}\n.fc.fc-theme-standard .fc-view-harness .fc-popover .fc-popover-header .fc-popover-close:before {\n  content: "\\e90b";\n}\n.fc.fc-theme-standard .fc-view-harness .fc-popover .fc-popover-header .fc-popover-close:hover {\n  color: #495057;\n  border-color: transparent;\n  background: #e9ecef;\n}\n.fc.fc-theme-standard .fc-view-harness .fc-popover .fc-popover-header .fc-popover-close:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.fc.fc-theme-standard .fc-view-harness .fc-popover .fc-popover-body {\n  padding: 1rem;\n  border: 1px solid #dee2e6;\n  background: #ffffff;\n  color: #495057;\n  border-top: 0 none;\n}\n.fc.fc-theme-standard .fc-view-harness .fc-event.fc-daygrid-block-event {\n  color: #ffffff;\n  background: #0d89ec;\n  border-color: #0d89ec;\n}\n.fc.fc-theme-standard .fc-view-harness .fc-event.fc-daygrid-block-event .fc-event-main {\n  color: #ffffff;\n}\n.fc.fc-theme-standard .fc-view-harness .fc-event.fc-daygrid-dot-event .fc-daygrid-event-dot {\n  background: #0d89ec;\n  border-color: #0d89ec;\n}\n.fc.fc-theme-standard .fc-view-harness .fc-event.fc-daygrid-dot-event:hover {\n  background: #e9ecef;\n  color: #495057;\n}\n.fc.fc-theme-standard .fc-view-harness .fc-cell-shaded {\n  background: #f8f9fa;\n}\n.fc.fc-theme-standard .fc-toolbar .fc-button {\n  color: #ffffff;\n  background: #2196F3;\n  border: 1px solid #2196F3;\n  font-size: 1rem;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n  border-radius: 3px;\n}\n.fc.fc-theme-standard .fc-toolbar .fc-button:enabled:hover {\n  background: #0d89ec;\n  color: #ffffff;\n  border-color: #0d89ec;\n}\n.fc.fc-theme-standard .fc-toolbar .fc-button:enabled:active {\n  background: #0b7ad1;\n  color: #ffffff;\n  border-color: #0b7ad1;\n}\n.fc.fc-theme-standard .fc-toolbar .fc-button:enabled:active:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.fc.fc-theme-standard .fc-toolbar .fc-button:disabled {\n  opacity: 0.6;\n  color: #ffffff;\n  background: #2196F3;\n  border: 1px solid #2196F3;\n}\n.fc.fc-theme-standard .fc-toolbar .fc-button .fc-icon-chevron-left {\n  font-family: "PrimeIcons" !important;\n  text-indent: 0;\n  font-size: 1rem;\n}\n.fc.fc-theme-standard .fc-toolbar .fc-button .fc-icon-chevron-left:before {\n  content: "\\e900";\n}\n.fc.fc-theme-standard .fc-toolbar .fc-button .fc-icon-chevron-right {\n  font-family: "PrimeIcons" !important;\n  text-indent: 0;\n  font-size: 1rem;\n}\n.fc.fc-theme-standard .fc-toolbar .fc-button .fc-icon-chevron-right:before {\n  content: "\\e901";\n}\n.fc.fc-theme-standard .fc-toolbar .fc-button:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.fc.fc-theme-standard .fc-toolbar .fc-button.fc-dayGridMonth-button, .fc.fc-theme-standard .fc-toolbar .fc-button.fc-timeGridWeek-button, .fc.fc-theme-standard .fc-toolbar .fc-button.fc-timeGridDay-button {\n  background: #ffffff;\n  border: 1px solid #ced4da;\n  color: #495057;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n}\n.fc.fc-theme-standard .fc-toolbar .fc-button.fc-dayGridMonth-button:hover, .fc.fc-theme-standard .fc-toolbar .fc-button.fc-timeGridWeek-button:hover, .fc.fc-theme-standard .fc-toolbar .fc-button.fc-timeGridDay-button:hover {\n  background: #e9ecef;\n  border-color: #ced4da;\n  color: #495057;\n}\n.fc.fc-theme-standard .fc-toolbar .fc-button.fc-dayGridMonth-button.fc-button-active, .fc.fc-theme-standard .fc-toolbar .fc-button.fc-timeGridWeek-button.fc-button-active, .fc.fc-theme-standard .fc-toolbar .fc-button.fc-timeGridDay-button.fc-button-active {\n  background: #2196F3;\n  border-color: #2196F3;\n  color: #ffffff;\n}\n.fc.fc-theme-standard .fc-toolbar .fc-button.fc-dayGridMonth-button.fc-button-active:hover, .fc.fc-theme-standard .fc-toolbar .fc-button.fc-timeGridWeek-button.fc-button-active:hover, .fc.fc-theme-standard .fc-toolbar .fc-button.fc-timeGridDay-button.fc-button-active:hover {\n  background: #0d89ec;\n  border-color: #0d89ec;\n  color: #ffffff;\n}\n.fc.fc-theme-standard .fc-toolbar .fc-button.fc-dayGridMonth-button:not(:disabled):focus, .fc.fc-theme-standard .fc-toolbar .fc-button.fc-timeGridWeek-button:not(:disabled):focus, .fc.fc-theme-standard .fc-toolbar .fc-button.fc-timeGridDay-button:not(:disabled):focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n  z-index: 1;\n}\n.fc.fc-theme-standard .fc-toolbar .fc-button-group .fc-button {\n  border-radius: 0;\n}\n.fc.fc-theme-standard .fc-toolbar .fc-button-group .fc-button:first-child {\n  border-top-left-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n.fc.fc-theme-standard .fc-toolbar .fc-button-group .fc-button:last-child {\n  border-top-right-radius: 3px;\n  border-bottom-right-radius: 3px;\n}\n\n.p-orderlist .p-orderlist-controls {\n  padding: 1rem;\n}\n.p-orderlist .p-orderlist-controls .p-button {\n  margin-bottom: 0.5rem;\n}\n.p-orderlist .p-orderlist-header {\n  background: #f8f9fa;\n  color: #495057;\n  border: 1px solid #dee2e6;\n  padding: 1rem;\n  font-weight: 600;\n  border-bottom: 0 none;\n  border-top-right-radius: 3px;\n  border-top-left-radius: 3px;\n}\n.p-orderlist .p-orderlist-list {\n  border: 1px solid #dee2e6;\n  background: #ffffff;\n  color: #495057;\n  padding: 0.5rem 0;\n  border-bottom-right-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n.p-orderlist .p-orderlist-list .p-orderlist-item {\n  padding: 0.5rem 1rem;\n  margin: 0;\n  border: 0 none;\n  color: #495057;\n  background: transparent;\n  transition: transform 0.2s, box-shadow 0.2s;\n}\n.p-orderlist .p-orderlist-list .p-orderlist-item:not(.p-highlight):hover {\n  background: #e9ecef;\n  color: #495057;\n}\n.p-orderlist .p-orderlist-list .p-orderlist-item:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: inset 0 0 0 0.15rem #a6d5fa;\n}\n.p-orderlist .p-orderlist-list .p-orderlist-item.p-highlight {\n  color: #495057;\n  background: #E3F2FD;\n}\n\n.p-organizationchart .p-organizationchart-node-content.p-organizationchart-selectable-node:not(.p-highlight):hover {\n  background: #e9ecef;\n  color: #495057;\n}\n.p-organizationchart .p-organizationchart-node-content.p-highlight {\n  background: #E3F2FD;\n  color: #495057;\n}\n.p-organizationchart .p-organizationchart-node-content.p-highlight .p-node-toggler i {\n  color: #6cbbf5;\n}\n.p-organizationchart .p-organizationchart-line-down {\n  background: #dee2e6;\n}\n.p-organizationchart .p-organizationchart-line-left {\n  border-right: 1px solid #dee2e6;\n  border-color: #dee2e6;\n}\n.p-organizationchart .p-organizationchart-line-top {\n  border-top: 1px solid #dee2e6;\n  border-color: #dee2e6;\n}\n.p-organizationchart .p-organizationchart-node-content {\n  border: 1px solid #dee2e6;\n  background: #ffffff;\n  color: #495057;\n  padding: 1rem;\n}\n.p-organizationchart .p-organizationchart-node-content .p-node-toggler {\n  background: inherit;\n  color: inherit;\n  border-radius: 50%;\n}\n.p-organizationchart .p-organizationchart-node-content .p-node-toggler:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n\n.p-paginator {\n  background: #ffffff;\n  color: #6c757d;\n  border: solid #e9ecef;\n  border-width: 0;\n  padding: 0.5rem 1rem;\n  border-radius: 3px;\n}\n.p-paginator .p-paginator-first,\n.p-paginator .p-paginator-prev,\n.p-paginator .p-paginator-next,\n.p-paginator .p-paginator-last {\n  background-color: transparent;\n  border: 0 none;\n  color: #6c757d;\n  min-width: 2.357rem;\n  height: 2.357rem;\n  margin: 0.143rem;\n  transition: box-shadow 0.2s;\n  border-radius: 3px;\n}\n.p-paginator .p-paginator-first:not(.p-disabled):not(.p-highlight):hover,\n.p-paginator .p-paginator-prev:not(.p-disabled):not(.p-highlight):hover,\n.p-paginator .p-paginator-next:not(.p-disabled):not(.p-highlight):hover,\n.p-paginator .p-paginator-last:not(.p-disabled):not(.p-highlight):hover {\n  background: #e9ecef;\n  border-color: transparent;\n  color: #495057;\n}\n.p-paginator .p-paginator-first {\n  border-top-left-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n.p-paginator .p-paginator-last {\n  border-top-right-radius: 3px;\n  border-bottom-right-radius: 3px;\n}\n.p-paginator .p-dropdown {\n  margin-left: 0.5rem;\n  margin-right: 0.5rem;\n  height: 2.357rem;\n}\n.p-paginator .p-dropdown .p-dropdown-label {\n  padding-right: 0;\n}\n.p-paginator .p-paginator-page-input {\n  margin-left: 0.5rem;\n  margin-right: 0.5rem;\n}\n.p-paginator .p-paginator-page-input .p-inputtext {\n  max-width: 2.357rem;\n}\n.p-paginator .p-paginator-current {\n  background-color: transparent;\n  border: 0 none;\n  color: #6c757d;\n  min-width: 2.357rem;\n  height: 2.357rem;\n  margin: 0.143rem;\n  padding: 0 0.5rem;\n}\n.p-paginator .p-paginator-pages .p-paginator-page {\n  background-color: transparent;\n  border: 0 none;\n  color: #6c757d;\n  min-width: 2.357rem;\n  height: 2.357rem;\n  margin: 0.143rem;\n  transition: box-shadow 0.2s;\n  border-radius: 3px;\n}\n.p-paginator .p-paginator-pages .p-paginator-page.p-highlight {\n  background: #E3F2FD;\n  border-color: #E3F2FD;\n  color: #495057;\n}\n.p-paginator .p-paginator-pages .p-paginator-page:not(.p-highlight):hover {\n  background: #e9ecef;\n  border-color: transparent;\n  color: #495057;\n}\n\n.p-picklist .p-picklist-buttons {\n  padding: 1rem;\n}\n.p-picklist .p-picklist-buttons .p-button {\n  margin-bottom: 0.5rem;\n}\n.p-picklist .p-picklist-header {\n  background: #f8f9fa;\n  color: #495057;\n  border: 1px solid #dee2e6;\n  padding: 1rem;\n  font-weight: 600;\n  border-bottom: 0 none;\n  border-top-right-radius: 3px;\n  border-top-left-radius: 3px;\n}\n.p-picklist .p-picklist-list {\n  border: 1px solid #dee2e6;\n  background: #ffffff;\n  color: #495057;\n  padding: 0.5rem 0;\n  border-bottom-right-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n.p-picklist .p-picklist-list .p-picklist-item {\n  padding: 0.5rem 1rem;\n  margin: 0;\n  border: 0 none;\n  color: #495057;\n  background: transparent;\n  transition: transform 0.2s, box-shadow 0.2s;\n}\n.p-picklist .p-picklist-list .p-picklist-item:not(.p-highlight):hover {\n  background: #e9ecef;\n  color: #495057;\n}\n.p-picklist .p-picklist-list .p-picklist-item:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: inset 0 0 0 0.15rem #a6d5fa;\n}\n.p-picklist .p-picklist-list .p-picklist-item.p-highlight {\n  color: #495057;\n  background: #E3F2FD;\n}\n\n.p-timeline .p-timeline-event-marker {\n  border: 2px solid #2196F3;\n  border-radius: 50%;\n  width: 1rem;\n  height: 1rem;\n  background-color: #ffffff;\n}\n.p-timeline .p-timeline-event-connector {\n  background-color: #dee2e6;\n}\n.p-timeline.p-timeline-vertical .p-timeline-event-opposite,\n.p-timeline.p-timeline-vertical .p-timeline-event-content {\n  padding: 0 1rem;\n}\n.p-timeline.p-timeline-vertical .p-timeline-event-connector {\n  width: 2px;\n}\n.p-timeline.p-timeline-horizontal .p-timeline-event-opposite,\n.p-timeline.p-timeline-horizontal .p-timeline-event-content {\n  padding: 1rem 0;\n}\n.p-timeline.p-timeline-horizontal .p-timeline-event-connector {\n  height: 2px;\n}\n\n.p-tree {\n  border: 1px solid #dee2e6;\n  background: #ffffff;\n  color: #495057;\n  padding: 1rem;\n  border-radius: 3px;\n}\n.p-tree .p-tree-container .p-treenode {\n  padding: 0.143rem;\n}\n.p-tree .p-tree-container .p-treenode .p-treenode-content {\n  border-radius: 3px;\n  transition: box-shadow 0.2s;\n  padding: 0;\n}\n.p-tree .p-tree-container .p-treenode .p-treenode-content .p-tree-toggler {\n  margin-right: 0.5rem;\n  width: 2rem;\n  height: 2rem;\n  color: #6c757d;\n  border: 0 none;\n  background: transparent;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n}\n.p-tree .p-tree-container .p-treenode .p-treenode-content .p-tree-toggler:enabled:hover {\n  color: #495057;\n  border-color: transparent;\n  background: #e9ecef;\n}\n.p-tree .p-tree-container .p-treenode .p-treenode-content .p-tree-toggler:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-tree .p-tree-container .p-treenode .p-treenode-content .p-treenode-icon {\n  margin-right: 0.5rem;\n  color: #6c757d;\n}\n.p-tree .p-tree-container .p-treenode .p-treenode-content .p-checkbox {\n  margin-right: 0.5rem;\n}\n.p-tree .p-tree-container .p-treenode .p-treenode-content .p-checkbox .p-indeterminate .p-checkbox-icon {\n  color: #495057;\n}\n.p-tree .p-tree-container .p-treenode .p-treenode-content:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-tree .p-tree-container .p-treenode .p-treenode-content.p-highlight {\n  background: #E3F2FD;\n  color: #495057;\n}\n.p-tree .p-tree-container .p-treenode .p-treenode-content.p-highlight .p-tree-toggler,\n.p-tree .p-tree-container .p-treenode .p-treenode-content.p-highlight .p-treenode-icon {\n  color: #495057;\n}\n.p-tree .p-tree-container .p-treenode .p-treenode-content.p-highlight .p-tree-toggler:hover,\n.p-tree .p-tree-container .p-treenode .p-treenode-content.p-highlight .p-treenode-icon:hover {\n  color: #495057;\n}\n.p-tree .p-tree-container .p-treenode .p-treenode-content.p-treenode-selectable:not(.p-highlight):hover {\n  background: #e9ecef;\n  color: #495057;\n}\n.p-tree .p-tree-filter-container {\n  margin-bottom: 0.5rem;\n}\n.p-tree .p-tree-filter-container .p-tree-filter {\n  width: 100%;\n  padding-right: 1.5rem;\n}\n.p-tree .p-tree-filter-container .p-tree-filter-icon {\n  right: 0.5rem;\n  color: #6c757d;\n}\n.p-tree .p-treenode-children {\n  padding: 0 0 0 1rem;\n}\n.p-tree .p-tree-loading-icon {\n  font-size: 2rem;\n}\n\n.p-treetable .p-paginator-top {\n  border-width: 0 0 1px 0;\n  border-radius: 0;\n}\n.p-treetable .p-paginator-bottom {\n  border-width: 0 0 1px 0;\n  border-radius: 0;\n}\n.p-treetable .p-treetable-header {\n  background: #f8f9fa;\n  color: #495057;\n  border: 1px solid #e9ecef;\n  border-width: 1px 0 1px 0;\n  padding: 1rem 1rem;\n  font-weight: 600;\n}\n.p-treetable .p-treetable-footer {\n  background: #f8f9fa;\n  color: #495057;\n  border: 1px solid #e9ecef;\n  border-width: 0 0 1px 0;\n  padding: 1rem 1rem;\n  font-weight: 600;\n}\n.p-treetable .p-treetable-thead > tr > th {\n  text-align: left;\n  padding: 1rem 1rem;\n  border: 1px solid #e9ecef;\n  border-width: 0 0 1px 0;\n  font-weight: 600;\n  color: #495057;\n  background: #f8f9fa;\n  transition: box-shadow 0.2s;\n}\n.p-treetable .p-treetable-tfoot > tr > td {\n  text-align: left;\n  padding: 1rem 1rem;\n  border: 1px solid #e9ecef;\n  border-width: 0 0 1px 0;\n  font-weight: 600;\n  color: #495057;\n  background: #f8f9fa;\n}\n.p-treetable .p-sortable-column {\n  outline-color: #a6d5fa;\n}\n.p-treetable .p-sortable-column .p-sortable-column-icon {\n  color: #6c757d;\n  margin-left: 0.5rem;\n}\n.p-treetable .p-sortable-column .p-sortable-column-badge {\n  border-radius: 50%;\n  height: 1.143rem;\n  min-width: 1.143rem;\n  line-height: 1.143rem;\n  color: #495057;\n  background: #E3F2FD;\n  margin-left: 0.5rem;\n}\n.p-treetable .p-sortable-column:not(.p-highlight):hover {\n  background: #e9ecef;\n  color: #495057;\n}\n.p-treetable .p-sortable-column:not(.p-highlight):hover .p-sortable-column-icon {\n  color: #6c757d;\n}\n.p-treetable .p-sortable-column.p-highlight {\n  background: #f8f9fa;\n  color: #2196F3;\n}\n.p-treetable .p-sortable-column.p-highlight .p-sortable-column-icon {\n  color: #2196F3;\n}\n.p-treetable .p-treetable-tbody > tr {\n  background: #ffffff;\n  color: #495057;\n  transition: box-shadow 0.2s;\n  outline-color: #a6d5fa;\n}\n.p-treetable .p-treetable-tbody > tr > td {\n  text-align: left;\n  border: 1px solid #e9ecef;\n  border-width: 0 0 1px 0;\n  padding: 1rem 1rem;\n}\n.p-treetable .p-treetable-tbody > tr > td .p-treetable-toggler {\n  width: 2rem;\n  height: 2rem;\n  color: #6c757d;\n  border: 0 none;\n  background: transparent;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n  margin-right: 0.5rem;\n}\n.p-treetable .p-treetable-tbody > tr > td .p-treetable-toggler:enabled:hover {\n  color: #495057;\n  border-color: transparent;\n  background: #e9ecef;\n}\n.p-treetable .p-treetable-tbody > tr > td .p-treetable-toggler:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-treetable .p-treetable-tbody > tr > td .p-treetable-toggler + .p-checkbox {\n  margin-right: 0.5rem;\n}\n.p-treetable .p-treetable-tbody > tr > td .p-treetable-toggler + .p-checkbox .p-indeterminate .p-checkbox-icon {\n  color: #495057;\n}\n.p-treetable .p-treetable-tbody > tr.p-highlight {\n  background: #E3F2FD;\n  color: #495057;\n}\n.p-treetable .p-treetable-tbody > tr.p-highlight .p-treetable-toggler {\n  color: #495057;\n}\n.p-treetable .p-treetable-tbody > tr.p-highlight .p-treetable-toggler:hover {\n  color: #495057;\n}\n.p-treetable.p-treetable-hoverable-rows .p-treetable-tbody > tr:not(.p-highlight):hover {\n  background: #e9ecef;\n  color: #495057;\n}\n.p-treetable.p-treetable-hoverable-rows .p-treetable-tbody > tr:not(.p-highlight):hover .p-treetable-toggler {\n  color: #495057;\n}\n.p-treetable .p-column-resizer-helper {\n  background: #2196F3;\n}\n.p-treetable .p-treetable-scrollable-header,\n.p-treetable .p-treetable-scrollable-footer {\n  background: #f8f9fa;\n}\n.p-treetable .p-treetable-loading-icon {\n  font-size: 2rem;\n}\n.p-treetable.p-treetable-gridlines .p-datatable-header {\n  border-width: 1px 1px 0 1px;\n}\n.p-treetable.p-treetable-gridlines .p-treetable-footer {\n  border-width: 0 1px 1px 1px;\n}\n.p-treetable.p-treetable-gridlines .p-treetable-top {\n  border-width: 0 1px 0 1px;\n}\n.p-treetable.p-treetable-gridlines .p-treetable-bottom {\n  border-width: 0 1px 1px 1px;\n}\n.p-treetable.p-treetable-gridlines .p-treetable-thead > tr > th {\n  border-width: 1px;\n}\n.p-treetable.p-treetable-gridlines .p-treetable-tbody > tr > td {\n  border-width: 1px;\n}\n.p-treetable.p-treetable-gridlines .p-treetable-tfoot > tr > td {\n  border-width: 1px;\n}\n.p-treetable.p-treetable-sm .p-treetable-header {\n  padding: 0.875rem 0.875rem;\n}\n.p-treetable.p-treetable-sm .p-treetable-thead > tr > th {\n  padding: 0.5rem 0.5rem;\n}\n.p-treetable.p-treetable-sm .p-treetable-tbody > tr > td {\n  padding: 0.5rem 0.5rem;\n}\n.p-treetable.p-treetable-sm .p-treetable-tfoot > tr > td {\n  padding: 0.5rem 0.5rem;\n}\n.p-treetable.p-treetable-sm .p-treetable-footer {\n  padding: 0.5rem 0.5rem;\n}\n.p-treetable.p-treetable-lg .p-treetable-header {\n  padding: 1.25rem 1.25rem;\n}\n.p-treetable.p-treetable-lg .p-treetable-thead > tr > th {\n  padding: 1.25rem 1.25rem;\n}\n.p-treetable.p-treetable-lg .p-treetable-tbody > tr > td {\n  padding: 1.25rem 1.25rem;\n}\n.p-treetable.p-treetable-lg .p-treetable-tfoot > tr > td {\n  padding: 1.25rem 1.25rem;\n}\n.p-treetable.p-treetable-lg .p-treetable-footer {\n  padding: 1.25rem 1.25rem;\n}\n\n.p-accordion .p-accordion-header .p-accordion-header-link {\n  padding: 1rem;\n  border: 1px solid #dee2e6;\n  color: #495057;\n  background: #f8f9fa;\n  font-weight: 600;\n  border-radius: 3px;\n  transition: box-shadow 0.2s;\n}\n.p-accordion .p-accordion-header .p-accordion-header-link .p-accordion-toggle-icon {\n  margin-right: 0.5rem;\n}\n.p-accordion .p-accordion-header:not(.p-disabled) .p-accordion-header-link:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-accordion .p-accordion-header:not(.p-highlight):not(.p-disabled):hover .p-accordion-header-link {\n  background: #e9ecef;\n  border-color: #dee2e6;\n  color: #495057;\n}\n.p-accordion .p-accordion-header:not(.p-disabled).p-highlight .p-accordion-header-link {\n  background: #f8f9fa;\n  border-color: #dee2e6;\n  color: #495057;\n  border-bottom-right-radius: 0;\n  border-bottom-left-radius: 0;\n}\n.p-accordion .p-accordion-header:not(.p-disabled).p-highlight:hover .p-accordion-header-link {\n  border-color: #dee2e6;\n  background: #e9ecef;\n  color: #495057;\n}\n.p-accordion .p-accordion-content {\n  padding: 1rem;\n  border: 1px solid #dee2e6;\n  background: #ffffff;\n  color: #495057;\n  border-top: 0;\n  border-top-right-radius: 0;\n  border-top-left-radius: 0;\n  border-bottom-right-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n.p-accordion .p-accordion-tab {\n  margin-bottom: 0;\n}\n.p-accordion .p-accordion-tab .p-accordion-header .p-accordion-header-link {\n  border-radius: 0;\n}\n.p-accordion .p-accordion-tab .p-accordion-content {\n  border-bottom-right-radius: 0;\n  border-bottom-left-radius: 0;\n}\n.p-accordion .p-accordion-tab:not(:first-child) .p-accordion-header .p-accordion-header-link {\n  border-top: 0 none;\n}\n.p-accordion .p-accordion-tab:not(:first-child) .p-accordion-header:not(.p-highlight):not(.p-disabled):hover .p-accordion-header-link, .p-accordion .p-accordion-tab:not(:first-child) .p-accordion-header:not(.p-disabled).p-highlight:hover .p-accordion-header-link {\n  border-top: 0 none;\n}\n.p-accordion .p-accordion-tab:first-child .p-accordion-header .p-accordion-header-link {\n  border-top-right-radius: 3px;\n  border-top-left-radius: 3px;\n}\n.p-accordion .p-accordion-tab:last-child .p-accordion-header:not(.p-highlight) .p-accordion-header-link {\n  border-bottom-right-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n.p-accordion .p-accordion-tab:last-child .p-accordion-content {\n  border-bottom-right-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n\n.p-card {\n  background: #ffffff;\n  color: #495057;\n  box-shadow: 0 2px 1px -1px rgba(0, 0, 0, 0.2), 0 1px 1px 0 rgba(0, 0, 0, 0.14), 0 1px 3px 0 rgba(0, 0, 0, 0.12);\n  border-radius: 3px;\n}\n.p-card .p-card-body {\n  padding: 1rem;\n}\n.p-card .p-card-title {\n  font-size: 1.5rem;\n  font-weight: 700;\n  margin-bottom: 0.5rem;\n}\n.p-card .p-card-subtitle {\n  font-weight: 400;\n  margin-bottom: 0.5rem;\n  color: #6c757d;\n}\n.p-card .p-card-content {\n  padding: 1rem 0;\n}\n.p-card .p-card-footer {\n  padding: 1rem 0 0 0;\n}\n\n.p-fieldset {\n  border: 1px solid #dee2e6;\n  background: #ffffff;\n  color: #495057;\n  border-radius: 3px;\n}\n.p-fieldset .p-fieldset-legend {\n  padding: 1rem;\n  border: 1px solid #dee2e6;\n  color: #495057;\n  background: #f8f9fa;\n  font-weight: 600;\n  border-radius: 3px;\n}\n.p-fieldset.p-fieldset-toggleable .p-fieldset-legend {\n  padding: 0;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n}\n.p-fieldset.p-fieldset-toggleable .p-fieldset-legend a {\n  padding: 1rem;\n  color: #495057;\n  border-radius: 3px;\n  transition: box-shadow 0.2s;\n}\n.p-fieldset.p-fieldset-toggleable .p-fieldset-legend a .p-fieldset-toggler {\n  margin-right: 0.5rem;\n}\n.p-fieldset.p-fieldset-toggleable .p-fieldset-legend a:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-fieldset.p-fieldset-toggleable .p-fieldset-legend a:hover {\n  color: #495057;\n}\n.p-fieldset.p-fieldset-toggleable .p-fieldset-legend:hover {\n  background: #e9ecef;\n  border-color: #dee2e6;\n  color: #495057;\n}\n.p-fieldset .p-fieldset-content {\n  padding: 1rem;\n}\n\n.p-divider .p-divider-content {\n  background-color: #ffffff;\n}\n.p-divider.p-divider-horizontal {\n  margin: 1rem 0;\n  padding: 0 1rem;\n}\n.p-divider.p-divider-horizontal:before {\n  border-top: 1px #dee2e6;\n}\n.p-divider.p-divider-horizontal .p-divider-content {\n  padding: 0 0.5rem;\n}\n.p-divider.p-divider-vertical {\n  margin: 0 1rem;\n  padding: 1rem 0;\n}\n.p-divider.p-divider-vertical:before {\n  border-left: 1px #dee2e6;\n}\n.p-divider.p-divider-vertical .p-divider-content {\n  padding: 0.5rem 0;\n}\n\n.p-panel .p-panel-header {\n  border: 1px solid #dee2e6;\n  padding: 1rem;\n  background: #f8f9fa;\n  color: #495057;\n  border-top-right-radius: 3px;\n  border-top-left-radius: 3px;\n}\n.p-panel .p-panel-header .p-panel-title {\n  font-weight: 600;\n}\n.p-panel .p-panel-header .p-panel-header-icon {\n  width: 2rem;\n  height: 2rem;\n  color: #6c757d;\n  border: 0 none;\n  background: transparent;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n}\n.p-panel .p-panel-header .p-panel-header-icon:enabled:hover {\n  color: #495057;\n  border-color: transparent;\n  background: #e9ecef;\n}\n.p-panel .p-panel-header .p-panel-header-icon:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-panel.p-panel-toggleable .p-panel-header {\n  padding: 0.5rem 1rem;\n}\n.p-panel .p-panel-content {\n  padding: 1rem;\n  border: 1px solid #dee2e6;\n  background: #ffffff;\n  color: #495057;\n  border-bottom-right-radius: 3px;\n  border-bottom-left-radius: 3px;\n  border-top: 0 none;\n}\n.p-panel .p-panel-footer {\n  padding: 0.5rem 1rem;\n  border: 1px solid #dee2e6;\n  background: #ffffff;\n  color: #495057;\n  border-top: 0 none;\n}\n\n.p-scrollpanel .p-scrollpanel-bar {\n  background: #f8f9fa;\n  border: 0 none;\n}\n\n.p-splitter {\n  border: 1px solid #dee2e6;\n  background: #ffffff;\n  border-radius: 3px;\n  color: #495057;\n}\n.p-splitter .p-splitter-gutter {\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n  background: #f8f9fa;\n}\n.p-splitter .p-splitter-gutter .p-splitter-gutter-handle {\n  background: #dee2e6;\n}\n.p-splitter .p-splitter-gutter-resizing {\n  background: #dee2e6;\n}\n\n.p-tabview .p-tabview-nav {\n  background: #ffffff;\n  border: 1px solid #dee2e6;\n  border-width: 0 0 2px 0;\n}\n.p-tabview .p-tabview-nav li {\n  margin-right: 0;\n}\n.p-tabview .p-tabview-nav li .p-tabview-nav-link {\n  border: solid #dee2e6;\n  border-width: 0 0 2px 0;\n  border-color: transparent transparent #dee2e6 transparent;\n  background: #ffffff;\n  color: #6c757d;\n  padding: 1rem;\n  font-weight: 600;\n  border-top-right-radius: 3px;\n  border-top-left-radius: 3px;\n  transition: box-shadow 0.2s;\n  margin: 0 0 -2px 0;\n}\n.p-tabview .p-tabview-nav li .p-tabview-nav-link:not(.p-disabled):focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: inset 0 0 0 0.2rem #a6d5fa;\n}\n.p-tabview .p-tabview-nav li:not(.p-highlight):not(.p-disabled):hover .p-tabview-nav-link {\n  background: #ffffff;\n  border-color: #6c757d;\n  color: #6c757d;\n}\n.p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link {\n  background: #ffffff;\n  border-color: #2196F3;\n  color: #2196F3;\n}\n.p-tabview .p-tabview-nav-btn.p-link {\n  background: #ffffff;\n  color: #2196F3;\n  width: 2.357rem;\n  box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14), 0 1px 5px 0 rgba(0, 0, 0, 0.12);\n  border-radius: 0;\n}\n.p-tabview .p-tabview-nav-btn.p-link:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: inset 0 0 0 0.2rem #a6d5fa;\n}\n.p-tabview .p-tabview-panels {\n  background: #ffffff;\n  padding: 1rem;\n  border: 0 none;\n  color: #495057;\n  border-bottom-right-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n\n.p-toolbar {\n  background: #f8f9fa;\n  border: 1px solid #dee2e6;\n  padding: 1rem;\n  border-radius: 3px;\n}\n.p-toolbar .p-toolbar-separator {\n  margin: 0 0.5rem;\n}\n\n.p-confirm-popup {\n  background: #ffffff;\n  color: #495057;\n  border: 0 none;\n  border-radius: 3px;\n  box-shadow: 0px 11px 15px -7px rgba(0, 0, 0, 0.2), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 9px 46px 8px rgba(0, 0, 0, 0.12);\n}\n.p-confirm-popup .p-confirm-popup-content {\n  padding: 1rem;\n}\n.p-confirm-popup .p-confirm-popup-footer {\n  text-align: right;\n  padding: 0 1rem 1rem 1rem;\n}\n.p-confirm-popup .p-confirm-popup-footer button {\n  margin: 0 0.5rem 0 0;\n  width: auto;\n}\n.p-confirm-popup .p-confirm-popup-footer button:last-child {\n  margin: 0;\n}\n.p-confirm-popup:after {\n  border: solid transparent;\n  border-color: rgba(255, 255, 255, 0);\n  border-bottom-color: #ffffff;\n}\n.p-confirm-popup:before {\n  border: solid transparent;\n  border-color: rgba(255, 255, 255, 0);\n  border-bottom-color: #ffffff;\n}\n.p-confirm-popup.p-confirm-popup-flipped:after {\n  border-top-color: #ffffff;\n}\n.p-confirm-popup.p-confirm-popup-flipped:before {\n  border-top-color: #ffffff;\n}\n.p-confirm-popup .p-confirm-popup-icon {\n  font-size: 1.5rem;\n}\n.p-confirm-popup .p-confirm-popup-message {\n  margin-left: 1rem;\n}\n\n.p-dialog {\n  border-radius: 3px;\n  box-shadow: 0px 11px 15px -7px rgba(0, 0, 0, 0.2), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 9px 46px 8px rgba(0, 0, 0, 0.12);\n  border: 0 none;\n}\n.p-dialog .p-dialog-header {\n  border-bottom: 0 none;\n  background: #ffffff;\n  color: #495057;\n  padding: 1.5rem;\n  border-top-right-radius: 3px;\n  border-top-left-radius: 3px;\n}\n.p-dialog .p-dialog-header .p-dialog-title {\n  font-weight: 600;\n  font-size: 1.25rem;\n}\n.p-dialog .p-dialog-header .p-dialog-header-icon {\n  width: 2rem;\n  height: 2rem;\n  color: #6c757d;\n  border: 0 none;\n  background: transparent;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n  margin-right: 0.5rem;\n}\n.p-dialog .p-dialog-header .p-dialog-header-icon:enabled:hover {\n  color: #495057;\n  border-color: transparent;\n  background: #e9ecef;\n}\n.p-dialog .p-dialog-header .p-dialog-header-icon:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-dialog .p-dialog-header .p-dialog-header-icon:last-child {\n  margin-right: 0;\n}\n.p-dialog .p-dialog-content {\n  background: #ffffff;\n  color: #495057;\n  padding: 0 1.5rem 2rem 1.5rem;\n}\n.p-dialog .p-dialog-footer {\n  border-top: 0 none;\n  background: #ffffff;\n  color: #495057;\n  padding: 0 1.5rem 1.5rem 1.5rem;\n  text-align: right;\n  border-bottom-right-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n.p-dialog .p-dialog-footer button {\n  margin: 0 0.5rem 0 0;\n  width: auto;\n}\n.p-dialog.p-confirm-dialog .p-confirm-dialog-icon {\n  font-size: 2rem;\n}\n.p-dialog.p-confirm-dialog .p-confirm-dialog-message {\n  margin-left: 1rem;\n}\n\n.p-overlaypanel {\n  background: #ffffff;\n  color: #495057;\n  border: 0 none;\n  border-radius: 3px;\n  box-shadow: 0px 11px 15px -7px rgba(0, 0, 0, 0.2), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 9px 46px 8px rgba(0, 0, 0, 0.12);\n}\n.p-overlaypanel .p-overlaypanel-content {\n  padding: 1rem;\n}\n.p-overlaypanel .p-overlaypanel-close {\n  background: #2196F3;\n  color: #ffffff;\n  width: 2rem;\n  height: 2rem;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n  border-radius: 50%;\n  position: absolute;\n  top: -1rem;\n  right: -1rem;\n}\n.p-overlaypanel .p-overlaypanel-close:enabled:hover {\n  background: #0d89ec;\n  color: #ffffff;\n}\n.p-overlaypanel:after {\n  border: solid transparent;\n  border-color: rgba(255, 255, 255, 0);\n  border-bottom-color: #ffffff;\n}\n.p-overlaypanel:before {\n  border: solid transparent;\n  border-color: rgba(255, 255, 255, 0);\n  border-bottom-color: #ffffff;\n}\n.p-overlaypanel.p-overlaypanel-flipped:after {\n  border-top-color: #ffffff;\n}\n.p-overlaypanel.p-overlaypanel-flipped:before {\n  border-top-color: #ffffff;\n}\n\n.p-sidebar {\n  background: #ffffff;\n  color: #495057;\n  border: 0 none;\n  box-shadow: 0px 11px 15px -7px rgba(0, 0, 0, 0.2), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 9px 46px 8px rgba(0, 0, 0, 0.12);\n}\n.p-sidebar .p-sidebar-header {\n  padding: 1rem;\n}\n.p-sidebar .p-sidebar-header .p-sidebar-close,\n.p-sidebar .p-sidebar-header .p-sidebar-icon {\n  width: 2rem;\n  height: 2rem;\n  color: #6c757d;\n  border: 0 none;\n  background: transparent;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n}\n.p-sidebar .p-sidebar-header .p-sidebar-close:enabled:hover,\n.p-sidebar .p-sidebar-header .p-sidebar-icon:enabled:hover {\n  color: #495057;\n  border-color: transparent;\n  background: #e9ecef;\n}\n.p-sidebar .p-sidebar-header .p-sidebar-close:focus,\n.p-sidebar .p-sidebar-header .p-sidebar-icon:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-sidebar .p-sidebar-header + .p-sidebar-content {\n  padding-top: 0;\n}\n.p-sidebar .p-sidebar-content {\n  padding: 1rem;\n}\n\n.p-tooltip .p-tooltip-text {\n  background: #495057;\n  color: #ffffff;\n  padding: 0.5rem 0.5rem;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n  border-radius: 3px;\n}\n.p-tooltip.p-tooltip-right .p-tooltip-arrow {\n  border-right-color: #495057;\n}\n.p-tooltip.p-tooltip-left .p-tooltip-arrow {\n  border-left-color: #495057;\n}\n.p-tooltip.p-tooltip-top .p-tooltip-arrow {\n  border-top-color: #495057;\n}\n.p-tooltip.p-tooltip-bottom .p-tooltip-arrow {\n  border-bottom-color: #495057;\n}\n\n.p-fileupload .p-fileupload-buttonbar {\n  background: #f8f9fa;\n  padding: 1rem;\n  border: 1px solid #dee2e6;\n  color: #495057;\n  border-bottom: 0 none;\n  border-top-right-radius: 3px;\n  border-top-left-radius: 3px;\n}\n.p-fileupload .p-fileupload-buttonbar .p-button {\n  margin-right: 0.5rem;\n}\n.p-fileupload .p-fileupload-buttonbar .p-button.p-fileupload-choose.p-focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-fileupload .p-fileupload-content {\n  background: #ffffff;\n  padding: 2rem 1rem;\n  border: 1px solid #dee2e6;\n  color: #495057;\n  border-bottom-right-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n.p-fileupload .p-progressbar {\n  height: 0.25rem;\n}\n.p-fileupload .p-fileupload-row > div {\n  padding: 1rem 1rem;\n}\n.p-fileupload.p-fileupload-advanced .p-message {\n  margin-top: 0;\n}\n\n.p-fileupload-choose:not(.p-disabled):hover {\n  background: #0d89ec;\n  color: #ffffff;\n  border-color: #0d89ec;\n}\n.p-fileupload-choose:not(.p-disabled):active {\n  background: #0b7ad1;\n  color: #ffffff;\n  border-color: #0b7ad1;\n}\n\n.p-breadcrumb {\n  background: #ffffff;\n  border: 1px solid #dee2e6;\n  border-radius: 3px;\n  padding: 1rem;\n}\n.p-breadcrumb ul li .p-menuitem-link {\n  transition: box-shadow 0.2s;\n  border-radius: 3px;\n}\n.p-breadcrumb ul li .p-menuitem-link:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-breadcrumb ul li .p-menuitem-link .p-menuitem-text {\n  color: #495057;\n}\n.p-breadcrumb ul li .p-menuitem-link .p-menuitem-icon {\n  color: #6c757d;\n}\n.p-breadcrumb ul li.p-breadcrumb-chevron {\n  margin: 0 0.5rem 0 0.5rem;\n  color: #495057;\n}\n.p-breadcrumb ul li:last-child .p-menuitem-text {\n  color: #495057;\n}\n.p-breadcrumb ul li:last-child .p-menuitem-icon {\n  color: #6c757d;\n}\n\n.p-contextmenu {\n  padding: 0.25rem 0;\n  background: #ffffff;\n  color: #495057;\n  border: 0 none;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n  width: 12.5rem;\n}\n.p-contextmenu .p-menuitem-link {\n  padding: 0.75rem 1rem;\n  color: #495057;\n  border-radius: 0;\n  transition: box-shadow 0.2s;\n  user-select: none;\n}\n.p-contextmenu .p-menuitem-link .p-menuitem-text {\n  color: #495057;\n}\n.p-contextmenu .p-menuitem-link .p-menuitem-icon {\n  color: #6c757d;\n  margin-right: 0.5rem;\n}\n.p-contextmenu .p-menuitem-link .p-submenu-icon {\n  color: #6c757d;\n}\n.p-contextmenu .p-menuitem-link:not(.p-disabled):hover {\n  background: #e9ecef;\n}\n.p-contextmenu .p-menuitem-link:not(.p-disabled):hover .p-menuitem-text {\n  color: #495057;\n}\n.p-contextmenu .p-menuitem-link:not(.p-disabled):hover .p-menuitem-icon {\n  color: #6c757d;\n}\n.p-contextmenu .p-menuitem-link:not(.p-disabled):hover .p-submenu-icon {\n  color: #6c757d;\n}\n.p-contextmenu .p-menuitem-link:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: inset 0 0 0 0.15rem #a6d5fa;\n}\n.p-contextmenu .p-submenu-list {\n  padding: 0.25rem 0;\n  background: #ffffff;\n  border: 0 none;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n}\n.p-contextmenu .p-menuitem.p-menuitem-active > .p-menuitem-link {\n  background: #e9ecef;\n}\n.p-contextmenu .p-menuitem.p-menuitem-active > .p-menuitem-link .p-menuitem-text {\n  color: #495057;\n}\n.p-contextmenu .p-menuitem.p-menuitem-active > .p-menuitem-link .p-menuitem-icon, .p-contextmenu .p-menuitem.p-menuitem-active > .p-menuitem-link .p-submenu-icon {\n  color: #6c757d;\n}\n.p-contextmenu .p-menu-separator {\n  border-top: 1px solid #dee2e6;\n  margin: 0.25rem 0;\n}\n.p-contextmenu .p-submenu-icon {\n  font-size: 0.875rem;\n}\n\n.p-dock .p-dock-list-container {\n  background: rgba(255, 255, 255, 0.1);\n  border: 1px solid rgba(255, 255, 255, 0.2);\n  padding: 0.5rem 0.5rem;\n  border-radius: 0.5rem;\n}\n.p-dock .p-dock-item {\n  padding: 0.5rem;\n}\n.p-dock .p-dock-action {\n  width: 4rem;\n  height: 4rem;\n}\n.p-dock.p-dock-top .p-dock-item-second-prev,\n.p-dock.p-dock-top .p-dock-item-second-next, .p-dock.p-dock-bottom .p-dock-item-second-prev,\n.p-dock.p-dock-bottom .p-dock-item-second-next {\n  margin: 0 0.9rem;\n}\n.p-dock.p-dock-top .p-dock-item-prev,\n.p-dock.p-dock-top .p-dock-item-next, .p-dock.p-dock-bottom .p-dock-item-prev,\n.p-dock.p-dock-bottom .p-dock-item-next {\n  margin: 0 1.3rem;\n}\n.p-dock.p-dock-top .p-dock-item-current, .p-dock.p-dock-bottom .p-dock-item-current {\n  margin: 0 1.5rem;\n}\n.p-dock.p-dock-left .p-dock-item-second-prev,\n.p-dock.p-dock-left .p-dock-item-second-next, .p-dock.p-dock-right .p-dock-item-second-prev,\n.p-dock.p-dock-right .p-dock-item-second-next {\n  margin: 0.9rem 0;\n}\n.p-dock.p-dock-left .p-dock-item-prev,\n.p-dock.p-dock-left .p-dock-item-next, .p-dock.p-dock-right .p-dock-item-prev,\n.p-dock.p-dock-right .p-dock-item-next {\n  margin: 1.3rem 0;\n}\n.p-dock.p-dock-left .p-dock-item-current, .p-dock.p-dock-right .p-dock-item-current {\n  margin: 1.5rem 0;\n}\n\n@media screen and (max-width: 960px) {\n  .p-dock.p-dock-top .p-dock-list-container, .p-dock.p-dock-bottom .p-dock-list-container {\n    overflow-x: auto;\n    width: 100%;\n  }\n  .p-dock.p-dock-top .p-dock-list-container .p-dock-list, .p-dock.p-dock-bottom .p-dock-list-container .p-dock-list {\n    margin: 0 auto;\n  }\n  .p-dock.p-dock-left .p-dock-list-container, .p-dock.p-dock-right .p-dock-list-container {\n    overflow-y: auto;\n    height: 100%;\n  }\n  .p-dock.p-dock-left .p-dock-list-container .p-dock-list, .p-dock.p-dock-right .p-dock-list-container .p-dock-list {\n    margin: auto 0;\n  }\n  .p-dock .p-dock-list .p-dock-item {\n    transform: none;\n    margin: 0;\n  }\n}\n.p-megamenu {\n  padding: 0.5rem;\n  background: #f8f9fa;\n  color: #495057;\n  border: 1px solid #dee2e6;\n  border-radius: 3px;\n}\n.p-megamenu .p-megamenu-root-list > .p-menuitem > .p-menuitem-link {\n  padding: 0.75rem 1rem;\n  color: #495057;\n  border-radius: 3px;\n  transition: box-shadow 0.2s;\n  user-select: none;\n}\n.p-megamenu .p-megamenu-root-list > .p-menuitem > .p-menuitem-link .p-menuitem-text {\n  color: #495057;\n}\n.p-megamenu .p-megamenu-root-list > .p-menuitem > .p-menuitem-link .p-menuitem-icon {\n  color: #6c757d;\n  margin-right: 0.5rem;\n}\n.p-megamenu .p-megamenu-root-list > .p-menuitem > .p-menuitem-link .p-submenu-icon {\n  color: #6c757d;\n  margin-left: 0.5rem;\n}\n.p-megamenu .p-megamenu-root-list > .p-menuitem > .p-menuitem-link:not(.p-disabled):hover {\n  background: #e9ecef;\n}\n.p-megamenu .p-megamenu-root-list > .p-menuitem > .p-menuitem-link:not(.p-disabled):hover .p-menuitem-text {\n  color: #495057;\n}\n.p-megamenu .p-megamenu-root-list > .p-menuitem > .p-menuitem-link:not(.p-disabled):hover .p-menuitem-icon {\n  color: #6c757d;\n}\n.p-megamenu .p-megamenu-root-list > .p-menuitem > .p-menuitem-link:not(.p-disabled):hover .p-submenu-icon {\n  color: #6c757d;\n}\n.p-megamenu .p-megamenu-root-list > .p-menuitem > .p-menuitem-link:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: inset 0 0 0 0.15rem #a6d5fa;\n}\n.p-megamenu .p-megamenu-root-list > .p-menuitem.p-menuitem-active > .p-menuitem-link,\n.p-megamenu .p-megamenu-root-list > .p-menuitem.p-menuitem-active > .p-menuitem-link:not(.p-disabled):hover {\n  background: #e9ecef;\n}\n.p-megamenu .p-megamenu-root-list > .p-menuitem.p-menuitem-active > .p-menuitem-link .p-menuitem-text,\n.p-megamenu .p-megamenu-root-list > .p-menuitem.p-menuitem-active > .p-menuitem-link:not(.p-disabled):hover .p-menuitem-text {\n  color: #495057;\n}\n.p-megamenu .p-megamenu-root-list > .p-menuitem.p-menuitem-active > .p-menuitem-link .p-menuitem-icon,\n.p-megamenu .p-megamenu-root-list > .p-menuitem.p-menuitem-active > .p-menuitem-link:not(.p-disabled):hover .p-menuitem-icon {\n  color: #6c757d;\n}\n.p-megamenu .p-megamenu-root-list > .p-menuitem.p-menuitem-active > .p-menuitem-link .p-submenu-icon,\n.p-megamenu .p-megamenu-root-list > .p-menuitem.p-menuitem-active > .p-menuitem-link:not(.p-disabled):hover .p-submenu-icon {\n  color: #6c757d;\n}\n.p-megamenu .p-menuitem-link {\n  padding: 0.75rem 1rem;\n  color: #495057;\n  border-radius: 0;\n  transition: box-shadow 0.2s;\n  user-select: none;\n}\n.p-megamenu .p-menuitem-link .p-menuitem-text {\n  color: #495057;\n}\n.p-megamenu .p-menuitem-link .p-menuitem-icon {\n  color: #6c757d;\n  margin-right: 0.5rem;\n}\n.p-megamenu .p-menuitem-link .p-submenu-icon {\n  color: #6c757d;\n}\n.p-megamenu .p-menuitem-link:not(.p-disabled):hover {\n  background: #e9ecef;\n}\n.p-megamenu .p-menuitem-link:not(.p-disabled):hover .p-menuitem-text {\n  color: #495057;\n}\n.p-megamenu .p-menuitem-link:not(.p-disabled):hover .p-menuitem-icon {\n  color: #6c757d;\n}\n.p-megamenu .p-menuitem-link:not(.p-disabled):hover .p-submenu-icon {\n  color: #6c757d;\n}\n.p-megamenu .p-menuitem-link:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: inset 0 0 0 0.15rem #a6d5fa;\n}\n.p-megamenu .p-megamenu-panel {\n  background: #ffffff;\n  color: #495057;\n  border: 0 none;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n}\n.p-megamenu .p-megamenu-submenu-header {\n  margin: 0;\n  padding: 0.75rem 1rem;\n  color: #495057;\n  background: #ffffff;\n  font-weight: 600;\n  border-top-right-radius: 3px;\n  border-top-left-radius: 3px;\n}\n.p-megamenu .p-megamenu-submenu {\n  padding: 0.25rem 0;\n  width: 12.5rem;\n}\n.p-megamenu .p-megamenu-submenu .p-menu-separator {\n  border-top: 1px solid #dee2e6;\n  margin: 0.25rem 0;\n}\n.p-megamenu .p-menuitem.p-menuitem-active > .p-menuitem-link {\n  background: #e9ecef;\n}\n.p-megamenu .p-menuitem.p-menuitem-active > .p-menuitem-link .p-menuitem-text {\n  color: #495057;\n}\n.p-megamenu .p-menuitem.p-menuitem-active > .p-menuitem-link .p-menuitem-icon, .p-megamenu .p-menuitem.p-menuitem-active > .p-menuitem-link .p-submenu-icon {\n  color: #6c757d;\n}\n.p-megamenu.p-megamenu-vertical {\n  width: 12.5rem;\n  padding: 0.25rem 0;\n}\n\n.p-menu {\n  padding: 0.25rem 0;\n  background: #ffffff;\n  color: #495057;\n  border: 1px solid #dee2e6;\n  border-radius: 3px;\n  width: 12.5rem;\n}\n.p-menu .p-menuitem-link {\n  padding: 0.75rem 1rem;\n  color: #495057;\n  border-radius: 0;\n  transition: box-shadow 0.2s;\n  user-select: none;\n}\n.p-menu .p-menuitem-link .p-menuitem-text {\n  color: #495057;\n}\n.p-menu .p-menuitem-link .p-menuitem-icon {\n  color: #6c757d;\n  margin-right: 0.5rem;\n}\n.p-menu .p-menuitem-link .p-submenu-icon {\n  color: #6c757d;\n}\n.p-menu .p-menuitem-link:not(.p-disabled):hover {\n  background: #e9ecef;\n}\n.p-menu .p-menuitem-link:not(.p-disabled):hover .p-menuitem-text {\n  color: #495057;\n}\n.p-menu .p-menuitem-link:not(.p-disabled):hover .p-menuitem-icon {\n  color: #6c757d;\n}\n.p-menu .p-menuitem-link:not(.p-disabled):hover .p-submenu-icon {\n  color: #6c757d;\n}\n.p-menu .p-menuitem-link:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: inset 0 0 0 0.15rem #a6d5fa;\n}\n.p-menu.p-menu-overlay {\n  background: #ffffff;\n  border: 0 none;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n}\n.p-menu .p-submenu-header {\n  margin: 0;\n  padding: 0.75rem 1rem;\n  color: #495057;\n  background: #ffffff;\n  font-weight: 600;\n  border-top-right-radius: 0;\n  border-top-left-radius: 0;\n}\n.p-menu .p-menu-separator {\n  border-top: 1px solid #dee2e6;\n  margin: 0.25rem 0;\n}\n\n.p-menubar {\n  padding: 0.5rem;\n  background: #f8f9fa;\n  color: #495057;\n  border: 1px solid #dee2e6;\n  border-radius: 3px;\n}\n.p-menubar .p-menuitem-link {\n  padding: 0.75rem 1rem;\n  color: #495057;\n  border-radius: 0;\n  transition: box-shadow 0.2s;\n  user-select: none;\n}\n.p-menubar .p-menuitem-link .p-menuitem-text {\n  color: #495057;\n}\n.p-menubar .p-menuitem-link .p-menuitem-icon {\n  color: #6c757d;\n  margin-right: 0.5rem;\n}\n.p-menubar .p-menuitem-link .p-submenu-icon {\n  color: #6c757d;\n}\n.p-menubar .p-menuitem-link:not(.p-disabled):hover {\n  background: #e9ecef;\n}\n.p-menubar .p-menuitem-link:not(.p-disabled):hover .p-menuitem-text {\n  color: #495057;\n}\n.p-menubar .p-menuitem-link:not(.p-disabled):hover .p-menuitem-icon {\n  color: #6c757d;\n}\n.p-menubar .p-menuitem-link:not(.p-disabled):hover .p-submenu-icon {\n  color: #6c757d;\n}\n.p-menubar .p-menuitem-link:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: inset 0 0 0 0.15rem #a6d5fa;\n}\n.p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link {\n  padding: 0.75rem 1rem;\n  color: #495057;\n  border-radius: 3px;\n  transition: box-shadow 0.2s;\n  user-select: none;\n}\n.p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link .p-menuitem-text {\n  color: #495057;\n}\n.p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link .p-menuitem-icon {\n  color: #6c757d;\n  margin-right: 0.5rem;\n}\n.p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link .p-submenu-icon {\n  color: #6c757d;\n  margin-left: 0.5rem;\n}\n.p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link:not(.p-disabled):hover {\n  background: #e9ecef;\n}\n.p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link:not(.p-disabled):hover .p-menuitem-text {\n  color: #495057;\n}\n.p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link:not(.p-disabled):hover .p-menuitem-icon {\n  color: #6c757d;\n}\n.p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link:not(.p-disabled):hover .p-submenu-icon {\n  color: #6c757d;\n}\n.p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: inset 0 0 0 0.15rem #a6d5fa;\n}\n.p-menubar .p-menubar-root-list > .p-menuitem.p-menuitem-active > .p-menuitem-link,\n.p-menubar .p-menubar-root-list > .p-menuitem.p-menuitem-active > .p-menuitem-link:not(.p-disabled):hover {\n  background: #e9ecef;\n}\n.p-menubar .p-menubar-root-list > .p-menuitem.p-menuitem-active > .p-menuitem-link .p-menuitem-text,\n.p-menubar .p-menubar-root-list > .p-menuitem.p-menuitem-active > .p-menuitem-link:not(.p-disabled):hover .p-menuitem-text {\n  color: #495057;\n}\n.p-menubar .p-menubar-root-list > .p-menuitem.p-menuitem-active > .p-menuitem-link .p-menuitem-icon,\n.p-menubar .p-menubar-root-list > .p-menuitem.p-menuitem-active > .p-menuitem-link:not(.p-disabled):hover .p-menuitem-icon {\n  color: #6c757d;\n}\n.p-menubar .p-menubar-root-list > .p-menuitem.p-menuitem-active > .p-menuitem-link .p-submenu-icon,\n.p-menubar .p-menubar-root-list > .p-menuitem.p-menuitem-active > .p-menuitem-link:not(.p-disabled):hover .p-submenu-icon {\n  color: #6c757d;\n}\n.p-menubar .p-submenu-list {\n  padding: 0.25rem 0;\n  background: #ffffff;\n  border: 0 none;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n  width: 12.5rem;\n}\n.p-menubar .p-submenu-list .p-menu-separator {\n  border-top: 1px solid #dee2e6;\n  margin: 0.25rem 0;\n}\n.p-menubar .p-submenu-list .p-submenu-icon {\n  font-size: 0.875rem;\n}\n.p-menubar .p-menuitem.p-menuitem-active > .p-menuitem-link {\n  background: #e9ecef;\n}\n.p-menubar .p-menuitem.p-menuitem-active > .p-menuitem-link .p-menuitem-text {\n  color: #495057;\n}\n.p-menubar .p-menuitem.p-menuitem-active > .p-menuitem-link .p-menuitem-icon, .p-menubar .p-menuitem.p-menuitem-active > .p-menuitem-link .p-submenu-icon {\n  color: #6c757d;\n}\n\n@media screen and (max-width: 960px) {\n  .p-menubar {\n    position: relative;\n  }\n  .p-menubar .p-menubar-button {\n    display: flex;\n    width: 2rem;\n    height: 2rem;\n    color: #6c757d;\n    border-radius: 50%;\n    transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n  }\n  .p-menubar .p-menubar-button:hover {\n    color: #6c757d;\n    background: #e9ecef;\n  }\n  .p-menubar .p-menubar-button:focus {\n    outline: 0 none;\n    outline-offset: 0;\n    box-shadow: 0 0 0 0.2rem #a6d5fa;\n  }\n  .p-menubar .p-menubar-root-list {\n    position: absolute;\n    display: none;\n    padding: 0.25rem 0;\n    background: #ffffff;\n    border: 0 none;\n    box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n    width: 100%;\n  }\n  .p-menubar .p-menubar-root-list .p-menu-separator {\n    border-top: 1px solid #dee2e6;\n    margin: 0.25rem 0;\n  }\n  .p-menubar .p-menubar-root-list .p-submenu-icon {\n    font-size: 0.875rem;\n  }\n  .p-menubar .p-menubar-root-list > .p-menuitem {\n    width: 100%;\n    position: static;\n  }\n  .p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link {\n    padding: 0.75rem 1rem;\n    color: #495057;\n    border-radius: 0;\n    transition: box-shadow 0.2s;\n    user-select: none;\n  }\n  .p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link .p-menuitem-text {\n    color: #495057;\n  }\n  .p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link .p-menuitem-icon {\n    color: #6c757d;\n    margin-right: 0.5rem;\n  }\n  .p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link .p-submenu-icon {\n    color: #6c757d;\n  }\n  .p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link:not(.p-disabled):hover {\n    background: #e9ecef;\n  }\n  .p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link:not(.p-disabled):hover .p-menuitem-text {\n    color: #495057;\n  }\n  .p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link:not(.p-disabled):hover .p-menuitem-icon {\n    color: #6c757d;\n  }\n  .p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link:not(.p-disabled):hover .p-submenu-icon {\n    color: #6c757d;\n  }\n  .p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link:focus {\n    outline: 0 none;\n    outline-offset: 0;\n    box-shadow: inset 0 0 0 0.15rem #a6d5fa;\n  }\n  .p-menubar .p-menubar-root-list > .p-menuitem > .p-menuitem-link > .p-submenu-icon {\n    margin-left: auto;\n    transition: transform 0.2s;\n  }\n  .p-menubar .p-menubar-root-list > .p-menuitem.p-menuitem-active > .p-menuitem-link > .p-submenu-icon {\n    transform: rotate(-180deg);\n  }\n  .p-menubar .p-menubar-root-list .p-submenu-list {\n    width: 100%;\n    position: static;\n    box-shadow: none;\n    border: 0 none;\n  }\n  .p-menubar .p-menubar-root-list .p-submenu-list .p-submenu-icon {\n    transition: transform 0.2s;\n    transform: rotate(90deg);\n  }\n  .p-menubar .p-menubar-root-list .p-submenu-list .p-menuitem-active > .p-menuitem-link > .p-submenu-icon {\n    transform: rotate(-90deg);\n  }\n  .p-menubar .p-menubar-root-list .p-menuitem {\n    width: 100%;\n    position: static;\n  }\n  .p-menubar .p-menubar-root-list ul li a {\n    padding-left: 2.25rem;\n  }\n  .p-menubar .p-menubar-root-list ul li ul li a {\n    padding-left: 3.75rem;\n  }\n  .p-menubar .p-menubar-root-list ul li ul li ul li a {\n    padding-left: 5.25rem;\n  }\n  .p-menubar .p-menubar-root-list ul li ul li ul li ul li a {\n    padding-left: 6.75rem;\n  }\n  .p-menubar .p-menubar-root-list ul li ul li ul li ul li ul li a {\n    padding-left: 8.25rem;\n  }\n  .p-menubar.p-menubar-mobile-active .p-menubar-root-list {\n    display: flex;\n    flex-direction: column;\n    top: 100%;\n    left: 0;\n    z-index: 1;\n  }\n}\n.p-panelmenu .p-panelmenu-header > a {\n  padding: 1rem;\n  border: 1px solid #dee2e6;\n  color: #495057;\n  background: #f8f9fa;\n  font-weight: 600;\n  border-radius: 3px;\n  transition: box-shadow 0.2s;\n}\n.p-panelmenu .p-panelmenu-header > a .p-panelmenu-icon {\n  margin-right: 0.5rem;\n}\n.p-panelmenu .p-panelmenu-header > a .p-menuitem-icon {\n  margin-right: 0.5rem;\n}\n.p-panelmenu .p-panelmenu-header > a:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-panelmenu .p-panelmenu-header:not(.p-highlight):not(.p-disabled) > a:hover {\n  background: #e9ecef;\n  border-color: #dee2e6;\n  color: #495057;\n}\n.p-panelmenu .p-panelmenu-header.p-highlight {\n  margin-bottom: 0;\n}\n.p-panelmenu .p-panelmenu-header.p-highlight > a {\n  background: #f8f9fa;\n  border-color: #dee2e6;\n  color: #495057;\n  border-bottom-right-radius: 0;\n  border-bottom-left-radius: 0;\n}\n.p-panelmenu .p-panelmenu-header.p-highlight:not(.p-disabled) > a:hover {\n  border-color: #dee2e6;\n  background: #e9ecef;\n  color: #495057;\n}\n.p-panelmenu .p-panelmenu-content {\n  padding: 0.25rem 0;\n  border: 1px solid #dee2e6;\n  background: #ffffff;\n  color: #495057;\n  margin-bottom: 0;\n  border-top: 0;\n  border-top-right-radius: 0;\n  border-top-left-radius: 0;\n  border-bottom-right-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n.p-panelmenu .p-panelmenu-content .p-menuitem .p-menuitem-link {\n  padding: 0.75rem 1rem;\n  color: #495057;\n  border-radius: 0;\n  transition: box-shadow 0.2s;\n  user-select: none;\n}\n.p-panelmenu .p-panelmenu-content .p-menuitem .p-menuitem-link .p-menuitem-text {\n  color: #495057;\n}\n.p-panelmenu .p-panelmenu-content .p-menuitem .p-menuitem-link .p-menuitem-icon {\n  color: #6c757d;\n  margin-right: 0.5rem;\n}\n.p-panelmenu .p-panelmenu-content .p-menuitem .p-menuitem-link .p-submenu-icon {\n  color: #6c757d;\n}\n.p-panelmenu .p-panelmenu-content .p-menuitem .p-menuitem-link:not(.p-disabled):hover {\n  background: #e9ecef;\n}\n.p-panelmenu .p-panelmenu-content .p-menuitem .p-menuitem-link:not(.p-disabled):hover .p-menuitem-text {\n  color: #495057;\n}\n.p-panelmenu .p-panelmenu-content .p-menuitem .p-menuitem-link:not(.p-disabled):hover .p-menuitem-icon {\n  color: #6c757d;\n}\n.p-panelmenu .p-panelmenu-content .p-menuitem .p-menuitem-link:not(.p-disabled):hover .p-submenu-icon {\n  color: #6c757d;\n}\n.p-panelmenu .p-panelmenu-content .p-menuitem .p-menuitem-link:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: inset 0 0 0 0.15rem #a6d5fa;\n}\n.p-panelmenu .p-panelmenu-content .p-menuitem .p-menuitem-link .p-panelmenu-icon {\n  margin-right: 0.5rem;\n}\n.p-panelmenu .p-panelmenu-content .p-submenu-list:not(.p-panelmenu-root-submenu) {\n  padding: 0 0 0 1rem;\n}\n.p-panelmenu .p-panelmenu-panel {\n  margin-bottom: 0;\n}\n.p-panelmenu .p-panelmenu-panel .p-panelmenu-header > a {\n  border-radius: 0;\n}\n.p-panelmenu .p-panelmenu-panel .p-panelmenu-content {\n  border-radius: 0;\n}\n.p-panelmenu .p-panelmenu-panel:not(:first-child) .p-panelmenu-header > a {\n  border-top: 0 none;\n}\n.p-panelmenu .p-panelmenu-panel:not(:first-child) .p-panelmenu-header:not(.p-highlight):not(.p-disabled):hover > a, .p-panelmenu .p-panelmenu-panel:not(:first-child) .p-panelmenu-header:not(.p-disabled).p-highlight:hover > a {\n  border-top: 0 none;\n}\n.p-panelmenu .p-panelmenu-panel:first-child .p-panelmenu-header > a {\n  border-top-right-radius: 3px;\n  border-top-left-radius: 3px;\n}\n.p-panelmenu .p-panelmenu-panel:last-child .p-panelmenu-header:not(.p-highlight) > a {\n  border-bottom-right-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n.p-panelmenu .p-panelmenu-panel:last-child .p-panelmenu-content {\n  border-bottom-right-radius: 3px;\n  border-bottom-left-radius: 3px;\n}\n\n.p-steps .p-steps-item .p-menuitem-link {\n  background: transparent;\n  transition: box-shadow 0.2s;\n  border-radius: 3px;\n  background: #ffffff;\n}\n.p-steps .p-steps-item .p-menuitem-link .p-steps-number {\n  color: #495057;\n  border: 1px solid #e9ecef;\n  background: #ffffff;\n  min-width: 2rem;\n  height: 2rem;\n  line-height: 2rem;\n  font-size: 1.143rem;\n  z-index: 1;\n  border-radius: 50%;\n}\n.p-steps .p-steps-item .p-menuitem-link .p-steps-title {\n  margin-top: 0.5rem;\n  color: #6c757d;\n}\n.p-steps .p-steps-item .p-menuitem-link:not(.p-disabled):focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-steps .p-steps-item.p-highlight .p-steps-number {\n  background: #E3F2FD;\n  color: #495057;\n}\n.p-steps .p-steps-item.p-highlight .p-steps-title {\n  font-weight: 600;\n  color: #495057;\n}\n.p-steps .p-steps-item:before {\n  content: " ";\n  border-top: 1px solid #dee2e6;\n  width: 100%;\n  top: 50%;\n  left: 0;\n  display: block;\n  position: absolute;\n  margin-top: -1rem;\n}\n\n.p-tabmenu .p-tabmenu-nav {\n  background: #ffffff;\n  border: 1px solid #dee2e6;\n  border-width: 0 0 2px 0;\n}\n.p-tabmenu .p-tabmenu-nav .p-tabmenuitem {\n  margin-right: 0;\n}\n.p-tabmenu .p-tabmenu-nav .p-tabmenuitem .p-menuitem-link {\n  border: solid #dee2e6;\n  border-width: 0 0 2px 0;\n  border-color: transparent transparent #dee2e6 transparent;\n  background: #ffffff;\n  color: #6c757d;\n  padding: 1rem;\n  font-weight: 600;\n  border-top-right-radius: 3px;\n  border-top-left-radius: 3px;\n  transition: box-shadow 0.2s;\n  margin: 0 0 -2px 0;\n}\n.p-tabmenu .p-tabmenu-nav .p-tabmenuitem .p-menuitem-link .p-menuitem-icon {\n  margin-right: 0.5rem;\n}\n.p-tabmenu .p-tabmenu-nav .p-tabmenuitem .p-menuitem-link:not(.p-disabled):focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: inset 0 0 0 0.2rem #a6d5fa;\n}\n.p-tabmenu .p-tabmenu-nav .p-tabmenuitem:not(.p-highlight):not(.p-disabled):hover .p-menuitem-link {\n  background: #ffffff;\n  border-color: #6c757d;\n  color: #6c757d;\n}\n.p-tabmenu .p-tabmenu-nav .p-tabmenuitem.p-highlight .p-menuitem-link {\n  background: #ffffff;\n  border-color: #2196F3;\n  color: #2196F3;\n}\n\n.p-tieredmenu {\n  padding: 0.25rem 0;\n  background: #ffffff;\n  color: #495057;\n  border: 1px solid #dee2e6;\n  border-radius: 3px;\n  width: 12.5rem;\n}\n.p-tieredmenu .p-menuitem-link {\n  padding: 0.75rem 1rem;\n  color: #495057;\n  border-radius: 0;\n  transition: box-shadow 0.2s;\n  user-select: none;\n}\n.p-tieredmenu .p-menuitem-link .p-menuitem-text {\n  color: #495057;\n}\n.p-tieredmenu .p-menuitem-link .p-menuitem-icon {\n  color: #6c757d;\n  margin-right: 0.5rem;\n}\n.p-tieredmenu .p-menuitem-link .p-submenu-icon {\n  color: #6c757d;\n}\n.p-tieredmenu .p-menuitem-link:not(.p-disabled):hover {\n  background: #e9ecef;\n}\n.p-tieredmenu .p-menuitem-link:not(.p-disabled):hover .p-menuitem-text {\n  color: #495057;\n}\n.p-tieredmenu .p-menuitem-link:not(.p-disabled):hover .p-menuitem-icon {\n  color: #6c757d;\n}\n.p-tieredmenu .p-menuitem-link:not(.p-disabled):hover .p-submenu-icon {\n  color: #6c757d;\n}\n.p-tieredmenu .p-menuitem-link:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: inset 0 0 0 0.15rem #a6d5fa;\n}\n.p-tieredmenu.p-tieredmenu-overlay {\n  background: #ffffff;\n  border: 0 none;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n}\n.p-tieredmenu .p-submenu-list {\n  padding: 0.25rem 0;\n  background: #ffffff;\n  border: 0 none;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n}\n.p-tieredmenu .p-menuitem.p-menuitem-active > .p-menuitem-link {\n  background: #e9ecef;\n}\n.p-tieredmenu .p-menuitem.p-menuitem-active > .p-menuitem-link .p-menuitem-text {\n  color: #495057;\n}\n.p-tieredmenu .p-menuitem.p-menuitem-active > .p-menuitem-link .p-menuitem-icon, .p-tieredmenu .p-menuitem.p-menuitem-active > .p-menuitem-link .p-submenu-icon {\n  color: #6c757d;\n}\n.p-tieredmenu .p-menu-separator {\n  border-top: 1px solid #dee2e6;\n  margin: 0.25rem 0;\n}\n.p-tieredmenu .p-submenu-icon {\n  font-size: 0.875rem;\n}\n\n.p-inline-message {\n  padding: 0.5rem 0.5rem;\n  margin: 0;\n  border-radius: 3px;\n}\n.p-inline-message.p-inline-message-info {\n  background: #B3E5FC;\n  border: solid #0891cf;\n  border-width: 0px;\n  color: #044868;\n}\n.p-inline-message.p-inline-message-info .p-inline-message-icon {\n  color: #044868;\n}\n.p-inline-message.p-inline-message-success {\n  background: #C8E6C9;\n  border: solid #439446;\n  border-width: 0px;\n  color: #224a23;\n}\n.p-inline-message.p-inline-message-success .p-inline-message-icon {\n  color: #224a23;\n}\n.p-inline-message.p-inline-message-warn {\n  background: #FFECB3;\n  border: solid #d9a300;\n  border-width: 0px;\n  color: #6d5100;\n}\n.p-inline-message.p-inline-message-warn .p-inline-message-icon {\n  color: #6d5100;\n}\n.p-inline-message.p-inline-message-error {\n  background: #FFCDD2;\n  border: solid #e60017;\n  border-width: 0px;\n  color: #73000c;\n}\n.p-inline-message.p-inline-message-error .p-inline-message-icon {\n  color: #73000c;\n}\n.p-inline-message .p-inline-message-icon {\n  font-size: 1rem;\n  margin-right: 0.5rem;\n}\n.p-inline-message .p-inline-message-text {\n  font-size: 1rem;\n}\n.p-inline-message.p-inline-message-icon-only .p-inline-message-icon {\n  margin-right: 0;\n}\n\n.p-message {\n  margin: 1rem 0;\n  border-radius: 3px;\n}\n.p-message .p-message-wrapper {\n  padding: 1rem 1.5rem;\n}\n.p-message .p-message-close {\n  width: 2rem;\n  height: 2rem;\n  border-radius: 50%;\n  background: transparent;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n}\n.p-message .p-message-close:hover {\n  background: rgba(255, 255, 255, 0.3);\n}\n.p-message .p-message-close:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-message.p-message-info {\n  background: #B3E5FC;\n  border: solid #0891cf;\n  border-width: 0 0 0 6px;\n  color: #044868;\n}\n.p-message.p-message-info .p-message-icon {\n  color: #044868;\n}\n.p-message.p-message-info .p-message-close {\n  color: #044868;\n}\n.p-message.p-message-success {\n  background: #C8E6C9;\n  border: solid #439446;\n  border-width: 0 0 0 6px;\n  color: #224a23;\n}\n.p-message.p-message-success .p-message-icon {\n  color: #224a23;\n}\n.p-message.p-message-success .p-message-close {\n  color: #224a23;\n}\n.p-message.p-message-warn {\n  background: #FFECB3;\n  border: solid #d9a300;\n  border-width: 0 0 0 6px;\n  color: #6d5100;\n}\n.p-message.p-message-warn .p-message-icon {\n  color: #6d5100;\n}\n.p-message.p-message-warn .p-message-close {\n  color: #6d5100;\n}\n.p-message.p-message-error {\n  background: #FFCDD2;\n  border: solid #e60017;\n  border-width: 0 0 0 6px;\n  color: #73000c;\n}\n.p-message.p-message-error .p-message-icon {\n  color: #73000c;\n}\n.p-message.p-message-error .p-message-close {\n  color: #73000c;\n}\n.p-message .p-message-text {\n  font-size: 1rem;\n  font-weight: 500;\n}\n.p-message .p-message-icon {\n  font-size: 1.5rem;\n  margin-right: 0.5rem;\n}\n\n.p-toast {\n  opacity: 0.9;\n}\n.p-toast .p-toast-message {\n  margin: 0 0 1rem 0;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n  border-radius: 3px;\n}\n.p-toast .p-toast-message .p-toast-message-content {\n  padding: 1rem;\n  border-width: 0 0 0 6px;\n}\n.p-toast .p-toast-message .p-toast-message-content .p-toast-message-text {\n  margin: 0 0 0 1rem;\n}\n.p-toast .p-toast-message .p-toast-message-content .p-toast-message-icon {\n  font-size: 2rem;\n}\n.p-toast .p-toast-message .p-toast-message-content .p-toast-summary {\n  font-weight: 700;\n}\n.p-toast .p-toast-message .p-toast-message-content .p-toast-detail {\n  margin: 0.5rem 0 0 0;\n}\n.p-toast .p-toast-message .p-toast-icon-close {\n  width: 2rem;\n  height: 2rem;\n  border-radius: 50%;\n  background: transparent;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n}\n.p-toast .p-toast-message .p-toast-icon-close:hover {\n  background: rgba(255, 255, 255, 0.3);\n}\n.p-toast .p-toast-message .p-toast-icon-close:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n.p-toast .p-toast-message.p-toast-message-info {\n  background: #B3E5FC;\n  border: solid #0891cf;\n  border-width: 0 0 0 6px;\n  color: #044868;\n}\n.p-toast .p-toast-message.p-toast-message-info .p-toast-message-icon,\n.p-toast .p-toast-message.p-toast-message-info .p-toast-icon-close {\n  color: #044868;\n}\n.p-toast .p-toast-message.p-toast-message-success {\n  background: #C8E6C9;\n  border: solid #439446;\n  border-width: 0 0 0 6px;\n  color: #224a23;\n}\n.p-toast .p-toast-message.p-toast-message-success .p-toast-message-icon,\n.p-toast .p-toast-message.p-toast-message-success .p-toast-icon-close {\n  color: #224a23;\n}\n.p-toast .p-toast-message.p-toast-message-warn {\n  background: #FFECB3;\n  border: solid #d9a300;\n  border-width: 0 0 0 6px;\n  color: #6d5100;\n}\n.p-toast .p-toast-message.p-toast-message-warn .p-toast-message-icon,\n.p-toast .p-toast-message.p-toast-message-warn .p-toast-icon-close {\n  color: #6d5100;\n}\n.p-toast .p-toast-message.p-toast-message-error {\n  background: #FFCDD2;\n  border: solid #e60017;\n  border-width: 0 0 0 6px;\n  color: #73000c;\n}\n.p-toast .p-toast-message.p-toast-message-error .p-toast-message-icon,\n.p-toast .p-toast-message.p-toast-message-error .p-toast-icon-close {\n  color: #73000c;\n}\n\n.p-galleria .p-galleria-close {\n  margin: 0.5rem;\n  background: transparent;\n  color: #f8f9fa;\n  width: 4rem;\n  height: 4rem;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n  border-radius: 50%;\n}\n.p-galleria .p-galleria-close .p-galleria-close-icon {\n  font-size: 2rem;\n}\n.p-galleria .p-galleria-close:hover {\n  background: rgba(255, 255, 255, 0.1);\n  color: #f8f9fa;\n}\n.p-galleria .p-galleria-item-nav {\n  background: transparent;\n  color: #f8f9fa;\n  width: 4rem;\n  height: 4rem;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n  border-radius: 3px;\n  margin: 0 0.5rem;\n}\n.p-galleria .p-galleria-item-nav .p-galleria-item-prev-icon,\n.p-galleria .p-galleria-item-nav .p-galleria-item-next-icon {\n  font-size: 2rem;\n}\n.p-galleria .p-galleria-item-nav:not(.p-disabled):hover {\n  background: rgba(255, 255, 255, 0.1);\n  color: #f8f9fa;\n}\n.p-galleria .p-galleria-caption {\n  background: rgba(0, 0, 0, 0.5);\n  color: #f8f9fa;\n  padding: 1rem;\n}\n.p-galleria .p-galleria-indicators {\n  padding: 1rem;\n}\n.p-galleria .p-galleria-indicators .p-galleria-indicator button {\n  background-color: #e9ecef;\n  width: 1rem;\n  height: 1rem;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n  border-radius: 50%;\n}\n.p-galleria .p-galleria-indicators .p-galleria-indicator button:hover {\n  background: #dee2e6;\n}\n.p-galleria .p-galleria-indicators .p-galleria-indicator.p-highlight button {\n  background: #E3F2FD;\n  color: #495057;\n}\n.p-galleria.p-galleria-indicators-bottom .p-galleria-indicator, .p-galleria.p-galleria-indicators-top .p-galleria-indicator {\n  margin-right: 0.5rem;\n}\n.p-galleria.p-galleria-indicators-left .p-galleria-indicator, .p-galleria.p-galleria-indicators-right .p-galleria-indicator {\n  margin-bottom: 0.5rem;\n}\n.p-galleria.p-galleria-indicator-onitem .p-galleria-indicators {\n  background: rgba(0, 0, 0, 0.5);\n}\n.p-galleria.p-galleria-indicator-onitem .p-galleria-indicators .p-galleria-indicator button {\n  background: rgba(255, 255, 255, 0.4);\n}\n.p-galleria.p-galleria-indicator-onitem .p-galleria-indicators .p-galleria-indicator button:hover {\n  background: rgba(255, 255, 255, 0.6);\n}\n.p-galleria.p-galleria-indicator-onitem .p-galleria-indicators .p-galleria-indicator.p-highlight button {\n  background: #E3F2FD;\n  color: #495057;\n}\n.p-galleria .p-galleria-thumbnail-container {\n  background: rgba(0, 0, 0, 0.9);\n  padding: 1rem 0.25rem;\n}\n.p-galleria .p-galleria-thumbnail-container .p-galleria-thumbnail-prev,\n.p-galleria .p-galleria-thumbnail-container .p-galleria-thumbnail-next {\n  margin: 0.5rem;\n  background-color: transparent;\n  color: #f8f9fa;\n  width: 2rem;\n  height: 2rem;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n  border-radius: 50%;\n}\n.p-galleria .p-galleria-thumbnail-container .p-galleria-thumbnail-prev:hover,\n.p-galleria .p-galleria-thumbnail-container .p-galleria-thumbnail-next:hover {\n  background: rgba(255, 255, 255, 0.1);\n  color: #f8f9fa;\n}\n.p-galleria .p-galleria-thumbnail-container .p-galleria-thumbnail-item-content:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n\n.p-galleria-mask {\n  --maskbg: rgba(0, 0, 0, 0.9);\n}\n\n.p-image-mask {\n  --maskbg: rgba(0, 0, 0, 0.9);\n}\n\n.p-image-preview-indicator {\n  background-color: transparent;\n  color: #f8f9fa;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n}\n\n.p-image-preview-container:hover > .p-image-preview-indicator {\n  background-color: rgba(0, 0, 0, 0.5);\n}\n\n.p-image-toolbar {\n  padding: 1rem;\n}\n\n.p-image-action.p-link {\n  color: #f8f9fa;\n  background-color: transparent;\n  width: 3rem;\n  height: 3rem;\n  border-radius: 50%;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n  margin-right: 0.5rem;\n}\n.p-image-action.p-link:last-child {\n  margin-right: 0;\n}\n.p-image-action.p-link:hover {\n  color: #f8f9fa;\n  background-color: rgba(255, 255, 255, 0.1);\n}\n.p-image-action.p-link i {\n  font-size: 1.5rem;\n}\n\n.p-avatar {\n  background-color: #dee2e6;\n  border-radius: 3px;\n}\n.p-avatar.p-avatar-lg {\n  width: 3rem;\n  height: 3rem;\n  font-size: 1.5rem;\n}\n.p-avatar.p-avatar-lg .p-avatar-icon {\n  font-size: 1.5rem;\n}\n.p-avatar.p-avatar-xl {\n  width: 4rem;\n  height: 4rem;\n  font-size: 2rem;\n}\n.p-avatar.p-avatar-xl .p-avatar-icon {\n  font-size: 2rem;\n}\n\n.p-avatar-group .p-avatar {\n  border: 2px solid #ffffff;\n}\n\n.p-badge {\n  background: #2196F3;\n  color: #ffffff;\n  font-size: 0.75rem;\n  font-weight: 700;\n  min-width: 1.5rem;\n  height: 1.5rem;\n  line-height: 1.5rem;\n}\n.p-badge.p-badge-secondary {\n  background-color: #607D8B;\n  color: #ffffff;\n}\n.p-badge.p-badge-success {\n  background-color: #689F38;\n  color: #ffffff;\n}\n.p-badge.p-badge-info {\n  background-color: #0288D1;\n  color: #ffffff;\n}\n.p-badge.p-badge-warning {\n  background-color: #FBC02D;\n  color: #212529;\n}\n.p-badge.p-badge-danger {\n  background-color: #D32F2F;\n  color: #ffffff;\n}\n.p-badge.p-badge-lg {\n  font-size: 1.125rem;\n  min-width: 2.25rem;\n  height: 2.25rem;\n  line-height: 2.25rem;\n}\n.p-badge.p-badge-xl {\n  font-size: 1.5rem;\n  min-width: 3rem;\n  height: 3rem;\n  line-height: 3rem;\n}\n\n.p-chip {\n  background-color: #dee2e6;\n  color: #495057;\n  border-radius: 16px;\n  padding: 0 0.5rem;\n}\n.p-chip .p-chip-text {\n  line-height: 1.5;\n  margin-top: 0.25rem;\n  margin-bottom: 0.25rem;\n}\n.p-chip .p-chip-icon {\n  margin-right: 0.5rem;\n}\n.p-chip img {\n  width: 2rem;\n  height: 2rem;\n  margin-left: -0.5rem;\n  margin-right: 0.5rem;\n}\n.p-chip .p-chip-remove-icon {\n  margin-left: 0.5rem;\n  border-radius: 3px;\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n}\n.p-chip .p-chip-remove-icon:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n\n.p-inplace .p-inplace-display {\n  padding: 0.5rem 0.5rem;\n  border-radius: 3px;\n  transition: background-color 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;\n}\n.p-inplace .p-inplace-display:not(.p-disabled):hover {\n  background: #e9ecef;\n  color: #495057;\n}\n.p-inplace .p-inplace-display:focus {\n  outline: 0 none;\n  outline-offset: 0;\n  box-shadow: 0 0 0 0.2rem #a6d5fa;\n}\n\n.p-progressbar {\n  border: 0 none;\n  height: 1.5rem;\n  background: #dee2e6;\n  border-radius: 3px;\n}\n.p-progressbar .p-progressbar-value {\n  border: 0 none;\n  margin: 0;\n  background: #2196F3;\n}\n.p-progressbar .p-progressbar-label {\n  color: #495057;\n  line-height: 1.5rem;\n}\n\n.p-scrolltop {\n  width: 3rem;\n  height: 3rem;\n  border-radius: 50%;\n  box-shadow: 0 2px 4px -1px rgba(0, 0, 0, 0.2), 0 4px 5px 0 rgba(0, 0, 0, 0.14), 0 1px 10px 0 rgba(0, 0, 0, 0.12);\n  transition: background-color 0.2s, color 0.2s, box-shadow 0.2s;\n}\n.p-scrolltop.p-link {\n  background: rgba(0, 0, 0, 0.7);\n}\n.p-scrolltop.p-link:hover {\n  background: rgba(0, 0, 0, 0.8);\n}\n.p-scrolltop .p-scrolltop-icon {\n  font-size: 1.5rem;\n  color: #f8f9fa;\n}\n\n.p-skeleton {\n  background-color: #e9ecef;\n  border-radius: 3px;\n}\n.p-skeleton:after {\n  background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0));\n}\n\n.p-tag {\n  background: #2196F3;\n  color: #ffffff;\n  font-size: 0.75rem;\n  font-weight: 700;\n  padding: 0.25rem 0.4rem;\n  border-radius: 3px;\n}\n.p-tag.p-tag-success {\n  background-color: #689F38;\n  color: #ffffff;\n}\n.p-tag.p-tag-info {\n  background-color: #0288D1;\n  color: #ffffff;\n}\n.p-tag.p-tag-warning {\n  background-color: #FBC02D;\n  color: #212529;\n}\n.p-tag.p-tag-danger {\n  background-color: #D32F2F;\n  color: #ffffff;\n}\n.p-tag .p-tag-icon {\n  margin-right: 0.25rem;\n  font-size: 0.75rem;\n}\n\n.p-terminal {\n  background: #ffffff;\n  color: #495057;\n  border: 1px solid #dee2e6;\n  padding: 1rem;\n}\n.p-terminal .p-terminal-input {\n  font-size: 1rem;\n  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";\n}\n\n/* Customizations to the designer theme should be defined here */\n.p-carousel .p-carousel-indicators .p-carousel-indicator.p-highlight button {\n  background-color: #2196F3;\n}\n\n.p-galleria .p-galleria-indicators .p-galleria-indicator.p-highlight button {\n  background-color: #2196F3;\n}\n';
var primeflex = ".grid {\n  display: flex;\n  flex-wrap: wrap;\n  margin-right: -0.5rem;\n  margin-left: -0.5rem;\n  margin-top: -0.5rem;\n}\n\n.grid > .col,\n.grid > [class*=col] {\n  box-sizing: border-box;\n}\n\n.grid-nogutter {\n  margin-right: 0;\n  margin-left: 0;\n  margin-top: 0;\n}\n\n.grid-nogutter > .col,\n.grid-nogutter > [class*=col-] {\n  padding: 0;\n}\n\n.col {\n  flex-grow: 1;\n  flex-basis: 0;\n  padding: 0.5rem;\n}\n\n.col-fixed {\n  flex: 0 0 auto;\n  padding: 0.5rem;\n}\n\n.col-1 {\n  flex: 0 0 auto;\n  padding: 0.5rem;\n  width: 8.3333%;\n}\n\n.col-2 {\n  flex: 0 0 auto;\n  padding: 0.5rem;\n  width: 16.6667%;\n}\n\n.col-3 {\n  flex: 0 0 auto;\n  padding: 0.5rem;\n  width: 25%;\n}\n\n.col-4 {\n  flex: 0 0 auto;\n  padding: 0.5rem;\n  width: 33.3333%;\n}\n\n.col-5 {\n  flex: 0 0 auto;\n  padding: 0.5rem;\n  width: 41.6667%;\n}\n\n.col-6 {\n  flex: 0 0 auto;\n  padding: 0.5rem;\n  width: 50%;\n}\n\n.col-7 {\n  flex: 0 0 auto;\n  padding: 0.5rem;\n  width: 58.3333%;\n}\n\n.col-8 {\n  flex: 0 0 auto;\n  padding: 0.5rem;\n  width: 66.6667%;\n}\n\n.col-9 {\n  flex: 0 0 auto;\n  padding: 0.5rem;\n  width: 75%;\n}\n\n.col-10 {\n  flex: 0 0 auto;\n  padding: 0.5rem;\n  width: 83.3333%;\n}\n\n.col-11 {\n  flex: 0 0 auto;\n  padding: 0.5rem;\n  width: 91.6667%;\n}\n\n.col-12 {\n  flex: 0 0 auto;\n  padding: 0.5rem;\n  width: 100%;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:col-1 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 8.3333%;\n  }\n  .sm\\:col-2 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 16.6667%;\n  }\n  .sm\\:col-3 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 25%;\n  }\n  .sm\\:col-4 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 33.3333%;\n  }\n  .sm\\:col-5 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 41.6667%;\n  }\n  .sm\\:col-6 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 50%;\n  }\n  .sm\\:col-7 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 58.3333%;\n  }\n  .sm\\:col-8 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 66.6667%;\n  }\n  .sm\\:col-9 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 75%;\n  }\n  .sm\\:col-10 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 83.3333%;\n  }\n  .sm\\:col-11 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 91.6667%;\n  }\n  .sm\\:col-12 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 100%;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:col-1 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 8.3333%;\n  }\n  .md\\:col-2 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 16.6667%;\n  }\n  .md\\:col-3 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 25%;\n  }\n  .md\\:col-4 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 33.3333%;\n  }\n  .md\\:col-5 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 41.6667%;\n  }\n  .md\\:col-6 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 50%;\n  }\n  .md\\:col-7 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 58.3333%;\n  }\n  .md\\:col-8 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 66.6667%;\n  }\n  .md\\:col-9 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 75%;\n  }\n  .md\\:col-10 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 83.3333%;\n  }\n  .md\\:col-11 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 91.6667%;\n  }\n  .md\\:col-12 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 100%;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:col-1 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 8.3333%;\n  }\n  .lg\\:col-2 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 16.6667%;\n  }\n  .lg\\:col-3 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 25%;\n  }\n  .lg\\:col-4 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 33.3333%;\n  }\n  .lg\\:col-5 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 41.6667%;\n  }\n  .lg\\:col-6 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 50%;\n  }\n  .lg\\:col-7 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 58.3333%;\n  }\n  .lg\\:col-8 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 66.6667%;\n  }\n  .lg\\:col-9 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 75%;\n  }\n  .lg\\:col-10 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 83.3333%;\n  }\n  .lg\\:col-11 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 91.6667%;\n  }\n  .lg\\:col-12 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 100%;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:col-1 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 8.3333%;\n  }\n  .xl\\:col-2 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 16.6667%;\n  }\n  .xl\\:col-3 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 25%;\n  }\n  .xl\\:col-4 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 33.3333%;\n  }\n  .xl\\:col-5 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 41.6667%;\n  }\n  .xl\\:col-6 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 50%;\n  }\n  .xl\\:col-7 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 58.3333%;\n  }\n  .xl\\:col-8 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 66.6667%;\n  }\n  .xl\\:col-9 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 75%;\n  }\n  .xl\\:col-10 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 83.3333%;\n  }\n  .xl\\:col-11 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 91.6667%;\n  }\n  .xl\\:col-12 {\n    flex: 0 0 auto;\n    padding: 0.5rem;\n    width: 100%;\n  }\n}\n.col-offset-0 {\n  margin-left: 0 !important;\n}\n\n.col-offset-1 {\n  margin-left: 8.3333% !important;\n}\n\n.col-offset-2 {\n  margin-left: 16.6667% !important;\n}\n\n.col-offset-3 {\n  margin-left: 25% !important;\n}\n\n.col-offset-4 {\n  margin-left: 33.3333% !important;\n}\n\n.col-offset-5 {\n  margin-left: 41.6667% !important;\n}\n\n.col-offset-6 {\n  margin-left: 50% !important;\n}\n\n.col-offset-7 {\n  margin-left: 58.3333% !important;\n}\n\n.col-offset-8 {\n  margin-left: 66.6667% !important;\n}\n\n.col-offset-9 {\n  margin-left: 75% !important;\n}\n\n.col-offset-10 {\n  margin-left: 83.3333% !important;\n}\n\n.col-offset-11 {\n  margin-left: 91.6667% !important;\n}\n\n.col-offset-12 {\n  margin-left: 100% !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:col-offset-0 {\n    margin-left: 0 !important;\n  }\n  .sm\\:col-offset-1 {\n    margin-left: 8.3333% !important;\n  }\n  .sm\\:col-offset-2 {\n    margin-left: 16.6667% !important;\n  }\n  .sm\\:col-offset-3 {\n    margin-left: 25% !important;\n  }\n  .sm\\:col-offset-4 {\n    margin-left: 33.3333% !important;\n  }\n  .sm\\:col-offset-5 {\n    margin-left: 41.6667% !important;\n  }\n  .sm\\:col-offset-6 {\n    margin-left: 50% !important;\n  }\n  .sm\\:col-offset-7 {\n    margin-left: 58.3333% !important;\n  }\n  .sm\\:col-offset-8 {\n    margin-left: 66.6667% !important;\n  }\n  .sm\\:col-offset-9 {\n    margin-left: 75% !important;\n  }\n  .sm\\:col-offset-10 {\n    margin-left: 83.3333% !important;\n  }\n  .sm\\:col-offset-11 {\n    margin-left: 91.6667% !important;\n  }\n  .sm\\:col-offset-12 {\n    margin-left: 100% !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:col-offset-0 {\n    margin-left: 0 !important;\n  }\n  .md\\:col-offset-1 {\n    margin-left: 8.3333% !important;\n  }\n  .md\\:col-offset-2 {\n    margin-left: 16.6667% !important;\n  }\n  .md\\:col-offset-3 {\n    margin-left: 25% !important;\n  }\n  .md\\:col-offset-4 {\n    margin-left: 33.3333% !important;\n  }\n  .md\\:col-offset-5 {\n    margin-left: 41.6667% !important;\n  }\n  .md\\:col-offset-6 {\n    margin-left: 50% !important;\n  }\n  .md\\:col-offset-7 {\n    margin-left: 58.3333% !important;\n  }\n  .md\\:col-offset-8 {\n    margin-left: 66.6667% !important;\n  }\n  .md\\:col-offset-9 {\n    margin-left: 75% !important;\n  }\n  .md\\:col-offset-10 {\n    margin-left: 83.3333% !important;\n  }\n  .md\\:col-offset-11 {\n    margin-left: 91.6667% !important;\n  }\n  .md\\:col-offset-12 {\n    margin-left: 100% !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:col-offset-0 {\n    margin-left: 0 !important;\n  }\n  .lg\\:col-offset-1 {\n    margin-left: 8.3333% !important;\n  }\n  .lg\\:col-offset-2 {\n    margin-left: 16.6667% !important;\n  }\n  .lg\\:col-offset-3 {\n    margin-left: 25% !important;\n  }\n  .lg\\:col-offset-4 {\n    margin-left: 33.3333% !important;\n  }\n  .lg\\:col-offset-5 {\n    margin-left: 41.6667% !important;\n  }\n  .lg\\:col-offset-6 {\n    margin-left: 50% !important;\n  }\n  .lg\\:col-offset-7 {\n    margin-left: 58.3333% !important;\n  }\n  .lg\\:col-offset-8 {\n    margin-left: 66.6667% !important;\n  }\n  .lg\\:col-offset-9 {\n    margin-left: 75% !important;\n  }\n  .lg\\:col-offset-10 {\n    margin-left: 83.3333% !important;\n  }\n  .lg\\:col-offset-11 {\n    margin-left: 91.6667% !important;\n  }\n  .lg\\:col-offset-12 {\n    margin-left: 100% !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:col-offset-0 {\n    margin-left: 0 !important;\n  }\n  .xl\\:col-offset-1 {\n    margin-left: 8.3333% !important;\n  }\n  .xl\\:col-offset-2 {\n    margin-left: 16.6667% !important;\n  }\n  .xl\\:col-offset-3 {\n    margin-left: 25% !important;\n  }\n  .xl\\:col-offset-4 {\n    margin-left: 33.3333% !important;\n  }\n  .xl\\:col-offset-5 {\n    margin-left: 41.6667% !important;\n  }\n  .xl\\:col-offset-6 {\n    margin-left: 50% !important;\n  }\n  .xl\\:col-offset-7 {\n    margin-left: 58.3333% !important;\n  }\n  .xl\\:col-offset-8 {\n    margin-left: 66.6667% !important;\n  }\n  .xl\\:col-offset-9 {\n    margin-left: 75% !important;\n  }\n  .xl\\:col-offset-10 {\n    margin-left: 83.3333% !important;\n  }\n  .xl\\:col-offset-11 {\n    margin-left: 91.6667% !important;\n  }\n  .xl\\:col-offset-12 {\n    margin-left: 100% !important;\n  }\n}\n.text-0 {\n  color: var(--surface-0) !important;\n}\n\n.text-50 {\n  color: var(--surface-50) !important;\n}\n\n.text-100 {\n  color: var(--surface-100) !important;\n}\n\n.text-200 {\n  color: var(--surface-200) !important;\n}\n\n.text-300 {\n  color: var(--surface-300) !important;\n}\n\n.text-400 {\n  color: var(--surface-400) !important;\n}\n\n.text-500 {\n  color: var(--surface-500) !important;\n}\n\n.text-600 {\n  color: var(--surface-600) !important;\n}\n\n.text-700 {\n  color: var(--surface-700) !important;\n}\n\n.text-800 {\n  color: var(--surface-800) !important;\n}\n\n.text-900 {\n  color: var(--surface-900) !important;\n}\n\n.focus\\:text-0:focus {\n  color: var(--surface-0) !important;\n}\n\n.hover\\:text-0:hover {\n  color: var(--surface-0) !important;\n}\n\n.active\\:text-0:active {\n  color: var(--surface-0) !important;\n}\n\n.focus\\:text-50:focus {\n  color: var(--surface-50) !important;\n}\n\n.hover\\:text-50:hover {\n  color: var(--surface-50) !important;\n}\n\n.active\\:text-50:active {\n  color: var(--surface-50) !important;\n}\n\n.focus\\:text-100:focus {\n  color: var(--surface-100) !important;\n}\n\n.hover\\:text-100:hover {\n  color: var(--surface-100) !important;\n}\n\n.active\\:text-100:active {\n  color: var(--surface-100) !important;\n}\n\n.focus\\:text-200:focus {\n  color: var(--surface-200) !important;\n}\n\n.hover\\:text-200:hover {\n  color: var(--surface-200) !important;\n}\n\n.active\\:text-200:active {\n  color: var(--surface-200) !important;\n}\n\n.focus\\:text-300:focus {\n  color: var(--surface-300) !important;\n}\n\n.hover\\:text-300:hover {\n  color: var(--surface-300) !important;\n}\n\n.active\\:text-300:active {\n  color: var(--surface-300) !important;\n}\n\n.focus\\:text-400:focus {\n  color: var(--surface-400) !important;\n}\n\n.hover\\:text-400:hover {\n  color: var(--surface-400) !important;\n}\n\n.active\\:text-400:active {\n  color: var(--surface-400) !important;\n}\n\n.focus\\:text-500:focus {\n  color: var(--surface-500) !important;\n}\n\n.hover\\:text-500:hover {\n  color: var(--surface-500) !important;\n}\n\n.active\\:text-500:active {\n  color: var(--surface-500) !important;\n}\n\n.focus\\:text-600:focus {\n  color: var(--surface-600) !important;\n}\n\n.hover\\:text-600:hover {\n  color: var(--surface-600) !important;\n}\n\n.active\\:text-600:active {\n  color: var(--surface-600) !important;\n}\n\n.focus\\:text-700:focus {\n  color: var(--surface-700) !important;\n}\n\n.hover\\:text-700:hover {\n  color: var(--surface-700) !important;\n}\n\n.active\\:text-700:active {\n  color: var(--surface-700) !important;\n}\n\n.focus\\:text-800:focus {\n  color: var(--surface-800) !important;\n}\n\n.hover\\:text-800:hover {\n  color: var(--surface-800) !important;\n}\n\n.active\\:text-800:active {\n  color: var(--surface-800) !important;\n}\n\n.focus\\:text-900:focus {\n  color: var(--surface-900) !important;\n}\n\n.hover\\:text-900:hover {\n  color: var(--surface-900) !important;\n}\n\n.active\\:text-900:active {\n  color: var(--surface-900) !important;\n}\n\n.surface-0 {\n  background-color: var(--surface-0) !important;\n}\n\n.surface-50 {\n  background-color: var(--surface-50) !important;\n}\n\n.surface-100 {\n  background-color: var(--surface-100) !important;\n}\n\n.surface-200 {\n  background-color: var(--surface-200) !important;\n}\n\n.surface-300 {\n  background-color: var(--surface-300) !important;\n}\n\n.surface-400 {\n  background-color: var(--surface-400) !important;\n}\n\n.surface-500 {\n  background-color: var(--surface-500) !important;\n}\n\n.surface-600 {\n  background-color: var(--surface-600) !important;\n}\n\n.surface-700 {\n  background-color: var(--surface-700) !important;\n}\n\n.surface-800 {\n  background-color: var(--surface-800) !important;\n}\n\n.surface-900 {\n  background-color: var(--surface-900) !important;\n}\n\n.focus\\:surface-0:focus {\n  background-color: var(--surface-0) !important;\n}\n\n.hover\\:surface-0:hover {\n  background-color: var(--surface-0) !important;\n}\n\n.active\\:surface-0:active {\n  background-color: var(--surface-0) !important;\n}\n\n.focus\\:surface-50:focus {\n  background-color: var(--surface-50) !important;\n}\n\n.hover\\:surface-50:hover {\n  background-color: var(--surface-50) !important;\n}\n\n.active\\:surface-50:active {\n  background-color: var(--surface-50) !important;\n}\n\n.focus\\:surface-100:focus {\n  background-color: var(--surface-100) !important;\n}\n\n.hover\\:surface-100:hover {\n  background-color: var(--surface-100) !important;\n}\n\n.active\\:surface-100:active {\n  background-color: var(--surface-100) !important;\n}\n\n.focus\\:surface-200:focus {\n  background-color: var(--surface-200) !important;\n}\n\n.hover\\:surface-200:hover {\n  background-color: var(--surface-200) !important;\n}\n\n.active\\:surface-200:active {\n  background-color: var(--surface-200) !important;\n}\n\n.focus\\:surface-300:focus {\n  background-color: var(--surface-300) !important;\n}\n\n.hover\\:surface-300:hover {\n  background-color: var(--surface-300) !important;\n}\n\n.active\\:surface-300:active {\n  background-color: var(--surface-300) !important;\n}\n\n.focus\\:surface-400:focus {\n  background-color: var(--surface-400) !important;\n}\n\n.hover\\:surface-400:hover {\n  background-color: var(--surface-400) !important;\n}\n\n.active\\:surface-400:active {\n  background-color: var(--surface-400) !important;\n}\n\n.focus\\:surface-500:focus {\n  background-color: var(--surface-500) !important;\n}\n\n.hover\\:surface-500:hover {\n  background-color: var(--surface-500) !important;\n}\n\n.active\\:surface-500:active {\n  background-color: var(--surface-500) !important;\n}\n\n.focus\\:surface-600:focus {\n  background-color: var(--surface-600) !important;\n}\n\n.hover\\:surface-600:hover {\n  background-color: var(--surface-600) !important;\n}\n\n.active\\:surface-600:active {\n  background-color: var(--surface-600) !important;\n}\n\n.focus\\:surface-700:focus {\n  background-color: var(--surface-700) !important;\n}\n\n.hover\\:surface-700:hover {\n  background-color: var(--surface-700) !important;\n}\n\n.active\\:surface-700:active {\n  background-color: var(--surface-700) !important;\n}\n\n.focus\\:surface-800:focus {\n  background-color: var(--surface-800) !important;\n}\n\n.hover\\:surface-800:hover {\n  background-color: var(--surface-800) !important;\n}\n\n.active\\:surface-800:active {\n  background-color: var(--surface-800) !important;\n}\n\n.focus\\:surface-900:focus {\n  background-color: var(--surface-900) !important;\n}\n\n.hover\\:surface-900:hover {\n  background-color: var(--surface-900) !important;\n}\n\n.active\\:surface-900:active {\n  background-color: var(--surface-900) !important;\n}\n\n.border-0 {\n  border-color: var(--surface-0) !important;\n}\n\n.border-50 {\n  border-color: var(--surface-50) !important;\n}\n\n.border-100 {\n  border-color: var(--surface-100) !important;\n}\n\n.border-200 {\n  border-color: var(--surface-200) !important;\n}\n\n.border-300 {\n  border-color: var(--surface-300) !important;\n}\n\n.border-400 {\n  border-color: var(--surface-400) !important;\n}\n\n.border-500 {\n  border-color: var(--surface-500) !important;\n}\n\n.border-600 {\n  border-color: var(--surface-600) !important;\n}\n\n.border-700 {\n  border-color: var(--surface-700) !important;\n}\n\n.border-800 {\n  border-color: var(--surface-800) !important;\n}\n\n.border-900 {\n  border-color: var(--surface-900) !important;\n}\n\n.focus\\:border-0:focus {\n  border-color: var(--surface-0) !important;\n}\n\n.hover\\:border-0:hover {\n  border-color: var(--surface-0) !important;\n}\n\n.active\\:border-0:active {\n  border-color: var(--surface-0) !important;\n}\n\n.focus\\:border-50:focus {\n  border-color: var(--surface-50) !important;\n}\n\n.hover\\:border-50:hover {\n  border-color: var(--surface-50) !important;\n}\n\n.active\\:border-50:active {\n  border-color: var(--surface-50) !important;\n}\n\n.focus\\:border-100:focus {\n  border-color: var(--surface-100) !important;\n}\n\n.hover\\:border-100:hover {\n  border-color: var(--surface-100) !important;\n}\n\n.active\\:border-100:active {\n  border-color: var(--surface-100) !important;\n}\n\n.focus\\:border-200:focus {\n  border-color: var(--surface-200) !important;\n}\n\n.hover\\:border-200:hover {\n  border-color: var(--surface-200) !important;\n}\n\n.active\\:border-200:active {\n  border-color: var(--surface-200) !important;\n}\n\n.focus\\:border-300:focus {\n  border-color: var(--surface-300) !important;\n}\n\n.hover\\:border-300:hover {\n  border-color: var(--surface-300) !important;\n}\n\n.active\\:border-300:active {\n  border-color: var(--surface-300) !important;\n}\n\n.focus\\:border-400:focus {\n  border-color: var(--surface-400) !important;\n}\n\n.hover\\:border-400:hover {\n  border-color: var(--surface-400) !important;\n}\n\n.active\\:border-400:active {\n  border-color: var(--surface-400) !important;\n}\n\n.focus\\:border-500:focus {\n  border-color: var(--surface-500) !important;\n}\n\n.hover\\:border-500:hover {\n  border-color: var(--surface-500) !important;\n}\n\n.active\\:border-500:active {\n  border-color: var(--surface-500) !important;\n}\n\n.focus\\:border-600:focus {\n  border-color: var(--surface-600) !important;\n}\n\n.hover\\:border-600:hover {\n  border-color: var(--surface-600) !important;\n}\n\n.active\\:border-600:active {\n  border-color: var(--surface-600) !important;\n}\n\n.focus\\:border-700:focus {\n  border-color: var(--surface-700) !important;\n}\n\n.hover\\:border-700:hover {\n  border-color: var(--surface-700) !important;\n}\n\n.active\\:border-700:active {\n  border-color: var(--surface-700) !important;\n}\n\n.focus\\:border-800:focus {\n  border-color: var(--surface-800) !important;\n}\n\n.hover\\:border-800:hover {\n  border-color: var(--surface-800) !important;\n}\n\n.active\\:border-800:active {\n  border-color: var(--surface-800) !important;\n}\n\n.focus\\:border-900:focus {\n  border-color: var(--surface-900) !important;\n}\n\n.hover\\:border-900:hover {\n  border-color: var(--surface-900) !important;\n}\n\n.active\\:border-900:active {\n  border-color: var(--surface-900) !important;\n}\n\n.bg-transparent {\n  background-color: transparent !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:bg-transparent {\n    background-color: transparent !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:bg-transparent {\n    background-color: transparent !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:bg-transparent {\n    background-color: transparent !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:bg-transparent {\n    background-color: transparent !important;\n  }\n}\n.border-transparent {\n  border-color: transparent !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:border-transparent {\n    border-color: transparent !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:border-transparent {\n    border-color: transparent !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:border-transparent {\n    border-color: transparent !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:border-transparent {\n    border-color: transparent !important;\n  }\n}\n.text-blue-50 {\n  color: var(--blue-50) !important;\n}\n.text-blue-100 {\n  color: var(--blue-100) !important;\n}\n.text-blue-200 {\n  color: var(--blue-200) !important;\n}\n.text-blue-300 {\n  color: var(--blue-300) !important;\n}\n.text-blue-400 {\n  color: var(--blue-400) !important;\n}\n.text-blue-500 {\n  color: var(--blue-500) !important;\n}\n.text-blue-600 {\n  color: var(--blue-600) !important;\n}\n.text-blue-700 {\n  color: var(--blue-700) !important;\n}\n.text-blue-800 {\n  color: var(--blue-800) !important;\n}\n.text-blue-900 {\n  color: var(--blue-900) !important;\n}\n\n.focus\\:text-blue-50:focus {\n  color: var(--blue-50) !important;\n}\n.focus\\:text-blue-100:focus {\n  color: var(--blue-100) !important;\n}\n.focus\\:text-blue-200:focus {\n  color: var(--blue-200) !important;\n}\n.focus\\:text-blue-300:focus {\n  color: var(--blue-300) !important;\n}\n.focus\\:text-blue-400:focus {\n  color: var(--blue-400) !important;\n}\n.focus\\:text-blue-500:focus {\n  color: var(--blue-500) !important;\n}\n.focus\\:text-blue-600:focus {\n  color: var(--blue-600) !important;\n}\n.focus\\:text-blue-700:focus {\n  color: var(--blue-700) !important;\n}\n.focus\\:text-blue-800:focus {\n  color: var(--blue-800) !important;\n}\n.focus\\:text-blue-900:focus {\n  color: var(--blue-900) !important;\n}\n\n.hover\\:text-blue-50:hover {\n  color: var(--blue-50) !important;\n}\n.hover\\:text-blue-100:hover {\n  color: var(--blue-100) !important;\n}\n.hover\\:text-blue-200:hover {\n  color: var(--blue-200) !important;\n}\n.hover\\:text-blue-300:hover {\n  color: var(--blue-300) !important;\n}\n.hover\\:text-blue-400:hover {\n  color: var(--blue-400) !important;\n}\n.hover\\:text-blue-500:hover {\n  color: var(--blue-500) !important;\n}\n.hover\\:text-blue-600:hover {\n  color: var(--blue-600) !important;\n}\n.hover\\:text-blue-700:hover {\n  color: var(--blue-700) !important;\n}\n.hover\\:text-blue-800:hover {\n  color: var(--blue-800) !important;\n}\n.hover\\:text-blue-900:hover {\n  color: var(--blue-900) !important;\n}\n\n.active\\:text-blue-50:active {\n  color: var(--blue-50) !important;\n}\n.active\\:text-blue-100:active {\n  color: var(--blue-100) !important;\n}\n.active\\:text-blue-200:active {\n  color: var(--blue-200) !important;\n}\n.active\\:text-blue-300:active {\n  color: var(--blue-300) !important;\n}\n.active\\:text-blue-400:active {\n  color: var(--blue-400) !important;\n}\n.active\\:text-blue-500:active {\n  color: var(--blue-500) !important;\n}\n.active\\:text-blue-600:active {\n  color: var(--blue-600) !important;\n}\n.active\\:text-blue-700:active {\n  color: var(--blue-700) !important;\n}\n.active\\:text-blue-800:active {\n  color: var(--blue-800) !important;\n}\n.active\\:text-blue-900:active {\n  color: var(--blue-900) !important;\n}\n\n.text-green-50 {\n  color: var(--green-50) !important;\n}\n.text-green-100 {\n  color: var(--green-100) !important;\n}\n.text-green-200 {\n  color: var(--green-200) !important;\n}\n.text-green-300 {\n  color: var(--green-300) !important;\n}\n.text-green-400 {\n  color: var(--green-400) !important;\n}\n.text-green-500 {\n  color: var(--green-500) !important;\n}\n.text-green-600 {\n  color: var(--green-600) !important;\n}\n.text-green-700 {\n  color: var(--green-700) !important;\n}\n.text-green-800 {\n  color: var(--green-800) !important;\n}\n.text-green-900 {\n  color: var(--green-900) !important;\n}\n\n.focus\\:text-green-50:focus {\n  color: var(--green-50) !important;\n}\n.focus\\:text-green-100:focus {\n  color: var(--green-100) !important;\n}\n.focus\\:text-green-200:focus {\n  color: var(--green-200) !important;\n}\n.focus\\:text-green-300:focus {\n  color: var(--green-300) !important;\n}\n.focus\\:text-green-400:focus {\n  color: var(--green-400) !important;\n}\n.focus\\:text-green-500:focus {\n  color: var(--green-500) !important;\n}\n.focus\\:text-green-600:focus {\n  color: var(--green-600) !important;\n}\n.focus\\:text-green-700:focus {\n  color: var(--green-700) !important;\n}\n.focus\\:text-green-800:focus {\n  color: var(--green-800) !important;\n}\n.focus\\:text-green-900:focus {\n  color: var(--green-900) !important;\n}\n\n.hover\\:text-green-50:hover {\n  color: var(--green-50) !important;\n}\n.hover\\:text-green-100:hover {\n  color: var(--green-100) !important;\n}\n.hover\\:text-green-200:hover {\n  color: var(--green-200) !important;\n}\n.hover\\:text-green-300:hover {\n  color: var(--green-300) !important;\n}\n.hover\\:text-green-400:hover {\n  color: var(--green-400) !important;\n}\n.hover\\:text-green-500:hover {\n  color: var(--green-500) !important;\n}\n.hover\\:text-green-600:hover {\n  color: var(--green-600) !important;\n}\n.hover\\:text-green-700:hover {\n  color: var(--green-700) !important;\n}\n.hover\\:text-green-800:hover {\n  color: var(--green-800) !important;\n}\n.hover\\:text-green-900:hover {\n  color: var(--green-900) !important;\n}\n\n.active\\:text-green-50:active {\n  color: var(--green-50) !important;\n}\n.active\\:text-green-100:active {\n  color: var(--green-100) !important;\n}\n.active\\:text-green-200:active {\n  color: var(--green-200) !important;\n}\n.active\\:text-green-300:active {\n  color: var(--green-300) !important;\n}\n.active\\:text-green-400:active {\n  color: var(--green-400) !important;\n}\n.active\\:text-green-500:active {\n  color: var(--green-500) !important;\n}\n.active\\:text-green-600:active {\n  color: var(--green-600) !important;\n}\n.active\\:text-green-700:active {\n  color: var(--green-700) !important;\n}\n.active\\:text-green-800:active {\n  color: var(--green-800) !important;\n}\n.active\\:text-green-900:active {\n  color: var(--green-900) !important;\n}\n\n.text-yellow-50 {\n  color: var(--yellow-50) !important;\n}\n.text-yellow-100 {\n  color: var(--yellow-100) !important;\n}\n.text-yellow-200 {\n  color: var(--yellow-200) !important;\n}\n.text-yellow-300 {\n  color: var(--yellow-300) !important;\n}\n.text-yellow-400 {\n  color: var(--yellow-400) !important;\n}\n.text-yellow-500 {\n  color: var(--yellow-500) !important;\n}\n.text-yellow-600 {\n  color: var(--yellow-600) !important;\n}\n.text-yellow-700 {\n  color: var(--yellow-700) !important;\n}\n.text-yellow-800 {\n  color: var(--yellow-800) !important;\n}\n.text-yellow-900 {\n  color: var(--yellow-900) !important;\n}\n\n.focus\\:text-yellow-50:focus {\n  color: var(--yellow-50) !important;\n}\n.focus\\:text-yellow-100:focus {\n  color: var(--yellow-100) !important;\n}\n.focus\\:text-yellow-200:focus {\n  color: var(--yellow-200) !important;\n}\n.focus\\:text-yellow-300:focus {\n  color: var(--yellow-300) !important;\n}\n.focus\\:text-yellow-400:focus {\n  color: var(--yellow-400) !important;\n}\n.focus\\:text-yellow-500:focus {\n  color: var(--yellow-500) !important;\n}\n.focus\\:text-yellow-600:focus {\n  color: var(--yellow-600) !important;\n}\n.focus\\:text-yellow-700:focus {\n  color: var(--yellow-700) !important;\n}\n.focus\\:text-yellow-800:focus {\n  color: var(--yellow-800) !important;\n}\n.focus\\:text-yellow-900:focus {\n  color: var(--yellow-900) !important;\n}\n\n.hover\\:text-yellow-50:hover {\n  color: var(--yellow-50) !important;\n}\n.hover\\:text-yellow-100:hover {\n  color: var(--yellow-100) !important;\n}\n.hover\\:text-yellow-200:hover {\n  color: var(--yellow-200) !important;\n}\n.hover\\:text-yellow-300:hover {\n  color: var(--yellow-300) !important;\n}\n.hover\\:text-yellow-400:hover {\n  color: var(--yellow-400) !important;\n}\n.hover\\:text-yellow-500:hover {\n  color: var(--yellow-500) !important;\n}\n.hover\\:text-yellow-600:hover {\n  color: var(--yellow-600) !important;\n}\n.hover\\:text-yellow-700:hover {\n  color: var(--yellow-700) !important;\n}\n.hover\\:text-yellow-800:hover {\n  color: var(--yellow-800) !important;\n}\n.hover\\:text-yellow-900:hover {\n  color: var(--yellow-900) !important;\n}\n\n.active\\:text-yellow-50:active {\n  color: var(--yellow-50) !important;\n}\n.active\\:text-yellow-100:active {\n  color: var(--yellow-100) !important;\n}\n.active\\:text-yellow-200:active {\n  color: var(--yellow-200) !important;\n}\n.active\\:text-yellow-300:active {\n  color: var(--yellow-300) !important;\n}\n.active\\:text-yellow-400:active {\n  color: var(--yellow-400) !important;\n}\n.active\\:text-yellow-500:active {\n  color: var(--yellow-500) !important;\n}\n.active\\:text-yellow-600:active {\n  color: var(--yellow-600) !important;\n}\n.active\\:text-yellow-700:active {\n  color: var(--yellow-700) !important;\n}\n.active\\:text-yellow-800:active {\n  color: var(--yellow-800) !important;\n}\n.active\\:text-yellow-900:active {\n  color: var(--yellow-900) !important;\n}\n\n.text-cyan-50 {\n  color: var(--cyan-50) !important;\n}\n.text-cyan-100 {\n  color: var(--cyan-100) !important;\n}\n.text-cyan-200 {\n  color: var(--cyan-200) !important;\n}\n.text-cyan-300 {\n  color: var(--cyan-300) !important;\n}\n.text-cyan-400 {\n  color: var(--cyan-400) !important;\n}\n.text-cyan-500 {\n  color: var(--cyan-500) !important;\n}\n.text-cyan-600 {\n  color: var(--cyan-600) !important;\n}\n.text-cyan-700 {\n  color: var(--cyan-700) !important;\n}\n.text-cyan-800 {\n  color: var(--cyan-800) !important;\n}\n.text-cyan-900 {\n  color: var(--cyan-900) !important;\n}\n\n.focus\\:text-cyan-50:focus {\n  color: var(--cyan-50) !important;\n}\n.focus\\:text-cyan-100:focus {\n  color: var(--cyan-100) !important;\n}\n.focus\\:text-cyan-200:focus {\n  color: var(--cyan-200) !important;\n}\n.focus\\:text-cyan-300:focus {\n  color: var(--cyan-300) !important;\n}\n.focus\\:text-cyan-400:focus {\n  color: var(--cyan-400) !important;\n}\n.focus\\:text-cyan-500:focus {\n  color: var(--cyan-500) !important;\n}\n.focus\\:text-cyan-600:focus {\n  color: var(--cyan-600) !important;\n}\n.focus\\:text-cyan-700:focus {\n  color: var(--cyan-700) !important;\n}\n.focus\\:text-cyan-800:focus {\n  color: var(--cyan-800) !important;\n}\n.focus\\:text-cyan-900:focus {\n  color: var(--cyan-900) !important;\n}\n\n.hover\\:text-cyan-50:hover {\n  color: var(--cyan-50) !important;\n}\n.hover\\:text-cyan-100:hover {\n  color: var(--cyan-100) !important;\n}\n.hover\\:text-cyan-200:hover {\n  color: var(--cyan-200) !important;\n}\n.hover\\:text-cyan-300:hover {\n  color: var(--cyan-300) !important;\n}\n.hover\\:text-cyan-400:hover {\n  color: var(--cyan-400) !important;\n}\n.hover\\:text-cyan-500:hover {\n  color: var(--cyan-500) !important;\n}\n.hover\\:text-cyan-600:hover {\n  color: var(--cyan-600) !important;\n}\n.hover\\:text-cyan-700:hover {\n  color: var(--cyan-700) !important;\n}\n.hover\\:text-cyan-800:hover {\n  color: var(--cyan-800) !important;\n}\n.hover\\:text-cyan-900:hover {\n  color: var(--cyan-900) !important;\n}\n\n.active\\:text-cyan-50:active {\n  color: var(--cyan-50) !important;\n}\n.active\\:text-cyan-100:active {\n  color: var(--cyan-100) !important;\n}\n.active\\:text-cyan-200:active {\n  color: var(--cyan-200) !important;\n}\n.active\\:text-cyan-300:active {\n  color: var(--cyan-300) !important;\n}\n.active\\:text-cyan-400:active {\n  color: var(--cyan-400) !important;\n}\n.active\\:text-cyan-500:active {\n  color: var(--cyan-500) !important;\n}\n.active\\:text-cyan-600:active {\n  color: var(--cyan-600) !important;\n}\n.active\\:text-cyan-700:active {\n  color: var(--cyan-700) !important;\n}\n.active\\:text-cyan-800:active {\n  color: var(--cyan-800) !important;\n}\n.active\\:text-cyan-900:active {\n  color: var(--cyan-900) !important;\n}\n\n.text-pink-50 {\n  color: var(--pink-50) !important;\n}\n.text-pink-100 {\n  color: var(--pink-100) !important;\n}\n.text-pink-200 {\n  color: var(--pink-200) !important;\n}\n.text-pink-300 {\n  color: var(--pink-300) !important;\n}\n.text-pink-400 {\n  color: var(--pink-400) !important;\n}\n.text-pink-500 {\n  color: var(--pink-500) !important;\n}\n.text-pink-600 {\n  color: var(--pink-600) !important;\n}\n.text-pink-700 {\n  color: var(--pink-700) !important;\n}\n.text-pink-800 {\n  color: var(--pink-800) !important;\n}\n.text-pink-900 {\n  color: var(--pink-900) !important;\n}\n\n.focus\\:text-pink-50:focus {\n  color: var(--pink-50) !important;\n}\n.focus\\:text-pink-100:focus {\n  color: var(--pink-100) !important;\n}\n.focus\\:text-pink-200:focus {\n  color: var(--pink-200) !important;\n}\n.focus\\:text-pink-300:focus {\n  color: var(--pink-300) !important;\n}\n.focus\\:text-pink-400:focus {\n  color: var(--pink-400) !important;\n}\n.focus\\:text-pink-500:focus {\n  color: var(--pink-500) !important;\n}\n.focus\\:text-pink-600:focus {\n  color: var(--pink-600) !important;\n}\n.focus\\:text-pink-700:focus {\n  color: var(--pink-700) !important;\n}\n.focus\\:text-pink-800:focus {\n  color: var(--pink-800) !important;\n}\n.focus\\:text-pink-900:focus {\n  color: var(--pink-900) !important;\n}\n\n.hover\\:text-pink-50:hover {\n  color: var(--pink-50) !important;\n}\n.hover\\:text-pink-100:hover {\n  color: var(--pink-100) !important;\n}\n.hover\\:text-pink-200:hover {\n  color: var(--pink-200) !important;\n}\n.hover\\:text-pink-300:hover {\n  color: var(--pink-300) !important;\n}\n.hover\\:text-pink-400:hover {\n  color: var(--pink-400) !important;\n}\n.hover\\:text-pink-500:hover {\n  color: var(--pink-500) !important;\n}\n.hover\\:text-pink-600:hover {\n  color: var(--pink-600) !important;\n}\n.hover\\:text-pink-700:hover {\n  color: var(--pink-700) !important;\n}\n.hover\\:text-pink-800:hover {\n  color: var(--pink-800) !important;\n}\n.hover\\:text-pink-900:hover {\n  color: var(--pink-900) !important;\n}\n\n.active\\:text-pink-50:active {\n  color: var(--pink-50) !important;\n}\n.active\\:text-pink-100:active {\n  color: var(--pink-100) !important;\n}\n.active\\:text-pink-200:active {\n  color: var(--pink-200) !important;\n}\n.active\\:text-pink-300:active {\n  color: var(--pink-300) !important;\n}\n.active\\:text-pink-400:active {\n  color: var(--pink-400) !important;\n}\n.active\\:text-pink-500:active {\n  color: var(--pink-500) !important;\n}\n.active\\:text-pink-600:active {\n  color: var(--pink-600) !important;\n}\n.active\\:text-pink-700:active {\n  color: var(--pink-700) !important;\n}\n.active\\:text-pink-800:active {\n  color: var(--pink-800) !important;\n}\n.active\\:text-pink-900:active {\n  color: var(--pink-900) !important;\n}\n\n.text-indigo-50 {\n  color: var(--indigo-50) !important;\n}\n.text-indigo-100 {\n  color: var(--indigo-100) !important;\n}\n.text-indigo-200 {\n  color: var(--indigo-200) !important;\n}\n.text-indigo-300 {\n  color: var(--indigo-300) !important;\n}\n.text-indigo-400 {\n  color: var(--indigo-400) !important;\n}\n.text-indigo-500 {\n  color: var(--indigo-500) !important;\n}\n.text-indigo-600 {\n  color: var(--indigo-600) !important;\n}\n.text-indigo-700 {\n  color: var(--indigo-700) !important;\n}\n.text-indigo-800 {\n  color: var(--indigo-800) !important;\n}\n.text-indigo-900 {\n  color: var(--indigo-900) !important;\n}\n\n.focus\\:text-indigo-50:focus {\n  color: var(--indigo-50) !important;\n}\n.focus\\:text-indigo-100:focus {\n  color: var(--indigo-100) !important;\n}\n.focus\\:text-indigo-200:focus {\n  color: var(--indigo-200) !important;\n}\n.focus\\:text-indigo-300:focus {\n  color: var(--indigo-300) !important;\n}\n.focus\\:text-indigo-400:focus {\n  color: var(--indigo-400) !important;\n}\n.focus\\:text-indigo-500:focus {\n  color: var(--indigo-500) !important;\n}\n.focus\\:text-indigo-600:focus {\n  color: var(--indigo-600) !important;\n}\n.focus\\:text-indigo-700:focus {\n  color: var(--indigo-700) !important;\n}\n.focus\\:text-indigo-800:focus {\n  color: var(--indigo-800) !important;\n}\n.focus\\:text-indigo-900:focus {\n  color: var(--indigo-900) !important;\n}\n\n.hover\\:text-indigo-50:hover {\n  color: var(--indigo-50) !important;\n}\n.hover\\:text-indigo-100:hover {\n  color: var(--indigo-100) !important;\n}\n.hover\\:text-indigo-200:hover {\n  color: var(--indigo-200) !important;\n}\n.hover\\:text-indigo-300:hover {\n  color: var(--indigo-300) !important;\n}\n.hover\\:text-indigo-400:hover {\n  color: var(--indigo-400) !important;\n}\n.hover\\:text-indigo-500:hover {\n  color: var(--indigo-500) !important;\n}\n.hover\\:text-indigo-600:hover {\n  color: var(--indigo-600) !important;\n}\n.hover\\:text-indigo-700:hover {\n  color: var(--indigo-700) !important;\n}\n.hover\\:text-indigo-800:hover {\n  color: var(--indigo-800) !important;\n}\n.hover\\:text-indigo-900:hover {\n  color: var(--indigo-900) !important;\n}\n\n.active\\:text-indigo-50:active {\n  color: var(--indigo-50) !important;\n}\n.active\\:text-indigo-100:active {\n  color: var(--indigo-100) !important;\n}\n.active\\:text-indigo-200:active {\n  color: var(--indigo-200) !important;\n}\n.active\\:text-indigo-300:active {\n  color: var(--indigo-300) !important;\n}\n.active\\:text-indigo-400:active {\n  color: var(--indigo-400) !important;\n}\n.active\\:text-indigo-500:active {\n  color: var(--indigo-500) !important;\n}\n.active\\:text-indigo-600:active {\n  color: var(--indigo-600) !important;\n}\n.active\\:text-indigo-700:active {\n  color: var(--indigo-700) !important;\n}\n.active\\:text-indigo-800:active {\n  color: var(--indigo-800) !important;\n}\n.active\\:text-indigo-900:active {\n  color: var(--indigo-900) !important;\n}\n\n.text-teal-50 {\n  color: var(--teal-50) !important;\n}\n.text-teal-100 {\n  color: var(--teal-100) !important;\n}\n.text-teal-200 {\n  color: var(--teal-200) !important;\n}\n.text-teal-300 {\n  color: var(--teal-300) !important;\n}\n.text-teal-400 {\n  color: var(--teal-400) !important;\n}\n.text-teal-500 {\n  color: var(--teal-500) !important;\n}\n.text-teal-600 {\n  color: var(--teal-600) !important;\n}\n.text-teal-700 {\n  color: var(--teal-700) !important;\n}\n.text-teal-800 {\n  color: var(--teal-800) !important;\n}\n.text-teal-900 {\n  color: var(--teal-900) !important;\n}\n\n.focus\\:text-teal-50:focus {\n  color: var(--teal-50) !important;\n}\n.focus\\:text-teal-100:focus {\n  color: var(--teal-100) !important;\n}\n.focus\\:text-teal-200:focus {\n  color: var(--teal-200) !important;\n}\n.focus\\:text-teal-300:focus {\n  color: var(--teal-300) !important;\n}\n.focus\\:text-teal-400:focus {\n  color: var(--teal-400) !important;\n}\n.focus\\:text-teal-500:focus {\n  color: var(--teal-500) !important;\n}\n.focus\\:text-teal-600:focus {\n  color: var(--teal-600) !important;\n}\n.focus\\:text-teal-700:focus {\n  color: var(--teal-700) !important;\n}\n.focus\\:text-teal-800:focus {\n  color: var(--teal-800) !important;\n}\n.focus\\:text-teal-900:focus {\n  color: var(--teal-900) !important;\n}\n\n.hover\\:text-teal-50:hover {\n  color: var(--teal-50) !important;\n}\n.hover\\:text-teal-100:hover {\n  color: var(--teal-100) !important;\n}\n.hover\\:text-teal-200:hover {\n  color: var(--teal-200) !important;\n}\n.hover\\:text-teal-300:hover {\n  color: var(--teal-300) !important;\n}\n.hover\\:text-teal-400:hover {\n  color: var(--teal-400) !important;\n}\n.hover\\:text-teal-500:hover {\n  color: var(--teal-500) !important;\n}\n.hover\\:text-teal-600:hover {\n  color: var(--teal-600) !important;\n}\n.hover\\:text-teal-700:hover {\n  color: var(--teal-700) !important;\n}\n.hover\\:text-teal-800:hover {\n  color: var(--teal-800) !important;\n}\n.hover\\:text-teal-900:hover {\n  color: var(--teal-900) !important;\n}\n\n.active\\:text-teal-50:active {\n  color: var(--teal-50) !important;\n}\n.active\\:text-teal-100:active {\n  color: var(--teal-100) !important;\n}\n.active\\:text-teal-200:active {\n  color: var(--teal-200) !important;\n}\n.active\\:text-teal-300:active {\n  color: var(--teal-300) !important;\n}\n.active\\:text-teal-400:active {\n  color: var(--teal-400) !important;\n}\n.active\\:text-teal-500:active {\n  color: var(--teal-500) !important;\n}\n.active\\:text-teal-600:active {\n  color: var(--teal-600) !important;\n}\n.active\\:text-teal-700:active {\n  color: var(--teal-700) !important;\n}\n.active\\:text-teal-800:active {\n  color: var(--teal-800) !important;\n}\n.active\\:text-teal-900:active {\n  color: var(--teal-900) !important;\n}\n\n.text-orange-50 {\n  color: var(--orange-50) !important;\n}\n.text-orange-100 {\n  color: var(--orange-100) !important;\n}\n.text-orange-200 {\n  color: var(--orange-200) !important;\n}\n.text-orange-300 {\n  color: var(--orange-300) !important;\n}\n.text-orange-400 {\n  color: var(--orange-400) !important;\n}\n.text-orange-500 {\n  color: var(--orange-500) !important;\n}\n.text-orange-600 {\n  color: var(--orange-600) !important;\n}\n.text-orange-700 {\n  color: var(--orange-700) !important;\n}\n.text-orange-800 {\n  color: var(--orange-800) !important;\n}\n.text-orange-900 {\n  color: var(--orange-900) !important;\n}\n\n.focus\\:text-orange-50:focus {\n  color: var(--orange-50) !important;\n}\n.focus\\:text-orange-100:focus {\n  color: var(--orange-100) !important;\n}\n.focus\\:text-orange-200:focus {\n  color: var(--orange-200) !important;\n}\n.focus\\:text-orange-300:focus {\n  color: var(--orange-300) !important;\n}\n.focus\\:text-orange-400:focus {\n  color: var(--orange-400) !important;\n}\n.focus\\:text-orange-500:focus {\n  color: var(--orange-500) !important;\n}\n.focus\\:text-orange-600:focus {\n  color: var(--orange-600) !important;\n}\n.focus\\:text-orange-700:focus {\n  color: var(--orange-700) !important;\n}\n.focus\\:text-orange-800:focus {\n  color: var(--orange-800) !important;\n}\n.focus\\:text-orange-900:focus {\n  color: var(--orange-900) !important;\n}\n\n.hover\\:text-orange-50:hover {\n  color: var(--orange-50) !important;\n}\n.hover\\:text-orange-100:hover {\n  color: var(--orange-100) !important;\n}\n.hover\\:text-orange-200:hover {\n  color: var(--orange-200) !important;\n}\n.hover\\:text-orange-300:hover {\n  color: var(--orange-300) !important;\n}\n.hover\\:text-orange-400:hover {\n  color: var(--orange-400) !important;\n}\n.hover\\:text-orange-500:hover {\n  color: var(--orange-500) !important;\n}\n.hover\\:text-orange-600:hover {\n  color: var(--orange-600) !important;\n}\n.hover\\:text-orange-700:hover {\n  color: var(--orange-700) !important;\n}\n.hover\\:text-orange-800:hover {\n  color: var(--orange-800) !important;\n}\n.hover\\:text-orange-900:hover {\n  color: var(--orange-900) !important;\n}\n\n.active\\:text-orange-50:active {\n  color: var(--orange-50) !important;\n}\n.active\\:text-orange-100:active {\n  color: var(--orange-100) !important;\n}\n.active\\:text-orange-200:active {\n  color: var(--orange-200) !important;\n}\n.active\\:text-orange-300:active {\n  color: var(--orange-300) !important;\n}\n.active\\:text-orange-400:active {\n  color: var(--orange-400) !important;\n}\n.active\\:text-orange-500:active {\n  color: var(--orange-500) !important;\n}\n.active\\:text-orange-600:active {\n  color: var(--orange-600) !important;\n}\n.active\\:text-orange-700:active {\n  color: var(--orange-700) !important;\n}\n.active\\:text-orange-800:active {\n  color: var(--orange-800) !important;\n}\n.active\\:text-orange-900:active {\n  color: var(--orange-900) !important;\n}\n\n.text-bluegray-50 {\n  color: var(--bluegray-50) !important;\n}\n.text-bluegray-100 {\n  color: var(--bluegray-100) !important;\n}\n.text-bluegray-200 {\n  color: var(--bluegray-200) !important;\n}\n.text-bluegray-300 {\n  color: var(--bluegray-300) !important;\n}\n.text-bluegray-400 {\n  color: var(--bluegray-400) !important;\n}\n.text-bluegray-500 {\n  color: var(--bluegray-500) !important;\n}\n.text-bluegray-600 {\n  color: var(--bluegray-600) !important;\n}\n.text-bluegray-700 {\n  color: var(--bluegray-700) !important;\n}\n.text-bluegray-800 {\n  color: var(--bluegray-800) !important;\n}\n.text-bluegray-900 {\n  color: var(--bluegray-900) !important;\n}\n\n.focus\\:text-bluegray-50:focus {\n  color: var(--bluegray-50) !important;\n}\n.focus\\:text-bluegray-100:focus {\n  color: var(--bluegray-100) !important;\n}\n.focus\\:text-bluegray-200:focus {\n  color: var(--bluegray-200) !important;\n}\n.focus\\:text-bluegray-300:focus {\n  color: var(--bluegray-300) !important;\n}\n.focus\\:text-bluegray-400:focus {\n  color: var(--bluegray-400) !important;\n}\n.focus\\:text-bluegray-500:focus {\n  color: var(--bluegray-500) !important;\n}\n.focus\\:text-bluegray-600:focus {\n  color: var(--bluegray-600) !important;\n}\n.focus\\:text-bluegray-700:focus {\n  color: var(--bluegray-700) !important;\n}\n.focus\\:text-bluegray-800:focus {\n  color: var(--bluegray-800) !important;\n}\n.focus\\:text-bluegray-900:focus {\n  color: var(--bluegray-900) !important;\n}\n\n.hover\\:text-bluegray-50:hover {\n  color: var(--bluegray-50) !important;\n}\n.hover\\:text-bluegray-100:hover {\n  color: var(--bluegray-100) !important;\n}\n.hover\\:text-bluegray-200:hover {\n  color: var(--bluegray-200) !important;\n}\n.hover\\:text-bluegray-300:hover {\n  color: var(--bluegray-300) !important;\n}\n.hover\\:text-bluegray-400:hover {\n  color: var(--bluegray-400) !important;\n}\n.hover\\:text-bluegray-500:hover {\n  color: var(--bluegray-500) !important;\n}\n.hover\\:text-bluegray-600:hover {\n  color: var(--bluegray-600) !important;\n}\n.hover\\:text-bluegray-700:hover {\n  color: var(--bluegray-700) !important;\n}\n.hover\\:text-bluegray-800:hover {\n  color: var(--bluegray-800) !important;\n}\n.hover\\:text-bluegray-900:hover {\n  color: var(--bluegray-900) !important;\n}\n\n.active\\:text-bluegray-50:active {\n  color: var(--bluegray-50) !important;\n}\n.active\\:text-bluegray-100:active {\n  color: var(--bluegray-100) !important;\n}\n.active\\:text-bluegray-200:active {\n  color: var(--bluegray-200) !important;\n}\n.active\\:text-bluegray-300:active {\n  color: var(--bluegray-300) !important;\n}\n.active\\:text-bluegray-400:active {\n  color: var(--bluegray-400) !important;\n}\n.active\\:text-bluegray-500:active {\n  color: var(--bluegray-500) !important;\n}\n.active\\:text-bluegray-600:active {\n  color: var(--bluegray-600) !important;\n}\n.active\\:text-bluegray-700:active {\n  color: var(--bluegray-700) !important;\n}\n.active\\:text-bluegray-800:active {\n  color: var(--bluegray-800) !important;\n}\n.active\\:text-bluegray-900:active {\n  color: var(--bluegray-900) !important;\n}\n\n.text-purple-50 {\n  color: var(--purple-50) !important;\n}\n.text-purple-100 {\n  color: var(--purple-100) !important;\n}\n.text-purple-200 {\n  color: var(--purple-200) !important;\n}\n.text-purple-300 {\n  color: var(--purple-300) !important;\n}\n.text-purple-400 {\n  color: var(--purple-400) !important;\n}\n.text-purple-500 {\n  color: var(--purple-500) !important;\n}\n.text-purple-600 {\n  color: var(--purple-600) !important;\n}\n.text-purple-700 {\n  color: var(--purple-700) !important;\n}\n.text-purple-800 {\n  color: var(--purple-800) !important;\n}\n.text-purple-900 {\n  color: var(--purple-900) !important;\n}\n\n.focus\\:text-purple-50:focus {\n  color: var(--purple-50) !important;\n}\n.focus\\:text-purple-100:focus {\n  color: var(--purple-100) !important;\n}\n.focus\\:text-purple-200:focus {\n  color: var(--purple-200) !important;\n}\n.focus\\:text-purple-300:focus {\n  color: var(--purple-300) !important;\n}\n.focus\\:text-purple-400:focus {\n  color: var(--purple-400) !important;\n}\n.focus\\:text-purple-500:focus {\n  color: var(--purple-500) !important;\n}\n.focus\\:text-purple-600:focus {\n  color: var(--purple-600) !important;\n}\n.focus\\:text-purple-700:focus {\n  color: var(--purple-700) !important;\n}\n.focus\\:text-purple-800:focus {\n  color: var(--purple-800) !important;\n}\n.focus\\:text-purple-900:focus {\n  color: var(--purple-900) !important;\n}\n\n.hover\\:text-purple-50:hover {\n  color: var(--purple-50) !important;\n}\n.hover\\:text-purple-100:hover {\n  color: var(--purple-100) !important;\n}\n.hover\\:text-purple-200:hover {\n  color: var(--purple-200) !important;\n}\n.hover\\:text-purple-300:hover {\n  color: var(--purple-300) !important;\n}\n.hover\\:text-purple-400:hover {\n  color: var(--purple-400) !important;\n}\n.hover\\:text-purple-500:hover {\n  color: var(--purple-500) !important;\n}\n.hover\\:text-purple-600:hover {\n  color: var(--purple-600) !important;\n}\n.hover\\:text-purple-700:hover {\n  color: var(--purple-700) !important;\n}\n.hover\\:text-purple-800:hover {\n  color: var(--purple-800) !important;\n}\n.hover\\:text-purple-900:hover {\n  color: var(--purple-900) !important;\n}\n\n.active\\:text-purple-50:active {\n  color: var(--purple-50) !important;\n}\n.active\\:text-purple-100:active {\n  color: var(--purple-100) !important;\n}\n.active\\:text-purple-200:active {\n  color: var(--purple-200) !important;\n}\n.active\\:text-purple-300:active {\n  color: var(--purple-300) !important;\n}\n.active\\:text-purple-400:active {\n  color: var(--purple-400) !important;\n}\n.active\\:text-purple-500:active {\n  color: var(--purple-500) !important;\n}\n.active\\:text-purple-600:active {\n  color: var(--purple-600) !important;\n}\n.active\\:text-purple-700:active {\n  color: var(--purple-700) !important;\n}\n.active\\:text-purple-800:active {\n  color: var(--purple-800) !important;\n}\n.active\\:text-purple-900:active {\n  color: var(--purple-900) !important;\n}\n\n.text-gray-50 {\n  color: var(--gray-50) !important;\n}\n.text-gray-100 {\n  color: var(--gray-100) !important;\n}\n.text-gray-200 {\n  color: var(--gray-200) !important;\n}\n.text-gray-300 {\n  color: var(--gray-300) !important;\n}\n.text-gray-400 {\n  color: var(--gray-400) !important;\n}\n.text-gray-500 {\n  color: var(--gray-500) !important;\n}\n.text-gray-600 {\n  color: var(--gray-600) !important;\n}\n.text-gray-700 {\n  color: var(--gray-700) !important;\n}\n.text-gray-800 {\n  color: var(--gray-800) !important;\n}\n.text-gray-900 {\n  color: var(--gray-900) !important;\n}\n\n.focus\\:text-gray-50:focus {\n  color: var(--gray-50) !important;\n}\n.focus\\:text-gray-100:focus {\n  color: var(--gray-100) !important;\n}\n.focus\\:text-gray-200:focus {\n  color: var(--gray-200) !important;\n}\n.focus\\:text-gray-300:focus {\n  color: var(--gray-300) !important;\n}\n.focus\\:text-gray-400:focus {\n  color: var(--gray-400) !important;\n}\n.focus\\:text-gray-500:focus {\n  color: var(--gray-500) !important;\n}\n.focus\\:text-gray-600:focus {\n  color: var(--gray-600) !important;\n}\n.focus\\:text-gray-700:focus {\n  color: var(--gray-700) !important;\n}\n.focus\\:text-gray-800:focus {\n  color: var(--gray-800) !important;\n}\n.focus\\:text-gray-900:focus {\n  color: var(--gray-900) !important;\n}\n\n.hover\\:text-gray-50:hover {\n  color: var(--gray-50) !important;\n}\n.hover\\:text-gray-100:hover {\n  color: var(--gray-100) !important;\n}\n.hover\\:text-gray-200:hover {\n  color: var(--gray-200) !important;\n}\n.hover\\:text-gray-300:hover {\n  color: var(--gray-300) !important;\n}\n.hover\\:text-gray-400:hover {\n  color: var(--gray-400) !important;\n}\n.hover\\:text-gray-500:hover {\n  color: var(--gray-500) !important;\n}\n.hover\\:text-gray-600:hover {\n  color: var(--gray-600) !important;\n}\n.hover\\:text-gray-700:hover {\n  color: var(--gray-700) !important;\n}\n.hover\\:text-gray-800:hover {\n  color: var(--gray-800) !important;\n}\n.hover\\:text-gray-900:hover {\n  color: var(--gray-900) !important;\n}\n\n.active\\:text-gray-50:active {\n  color: var(--gray-50) !important;\n}\n.active\\:text-gray-100:active {\n  color: var(--gray-100) !important;\n}\n.active\\:text-gray-200:active {\n  color: var(--gray-200) !important;\n}\n.active\\:text-gray-300:active {\n  color: var(--gray-300) !important;\n}\n.active\\:text-gray-400:active {\n  color: var(--gray-400) !important;\n}\n.active\\:text-gray-500:active {\n  color: var(--gray-500) !important;\n}\n.active\\:text-gray-600:active {\n  color: var(--gray-600) !important;\n}\n.active\\:text-gray-700:active {\n  color: var(--gray-700) !important;\n}\n.active\\:text-gray-800:active {\n  color: var(--gray-800) !important;\n}\n.active\\:text-gray-900:active {\n  color: var(--gray-900) !important;\n}\n\n.bg-blue-50 {\n  background-color: var(--blue-50) !important;\n}\n.bg-blue-100 {\n  background-color: var(--blue-100) !important;\n}\n.bg-blue-200 {\n  background-color: var(--blue-200) !important;\n}\n.bg-blue-300 {\n  background-color: var(--blue-300) !important;\n}\n.bg-blue-400 {\n  background-color: var(--blue-400) !important;\n}\n.bg-blue-500 {\n  background-color: var(--blue-500) !important;\n}\n.bg-blue-600 {\n  background-color: var(--blue-600) !important;\n}\n.bg-blue-700 {\n  background-color: var(--blue-700) !important;\n}\n.bg-blue-800 {\n  background-color: var(--blue-800) !important;\n}\n.bg-blue-900 {\n  background-color: var(--blue-900) !important;\n}\n\n.focus\\:bg-blue-50:focus {\n  background-color: var(--blue-50) !important;\n}\n.focus\\:bg-blue-100:focus {\n  background-color: var(--blue-100) !important;\n}\n.focus\\:bg-blue-200:focus {\n  background-color: var(--blue-200) !important;\n}\n.focus\\:bg-blue-300:focus {\n  background-color: var(--blue-300) !important;\n}\n.focus\\:bg-blue-400:focus {\n  background-color: var(--blue-400) !important;\n}\n.focus\\:bg-blue-500:focus {\n  background-color: var(--blue-500) !important;\n}\n.focus\\:bg-blue-600:focus {\n  background-color: var(--blue-600) !important;\n}\n.focus\\:bg-blue-700:focus {\n  background-color: var(--blue-700) !important;\n}\n.focus\\:bg-blue-800:focus {\n  background-color: var(--blue-800) !important;\n}\n.focus\\:bg-blue-900:focus {\n  background-color: var(--blue-900) !important;\n}\n\n.hover\\:bg-blue-50:hover {\n  background-color: var(--blue-50) !important;\n}\n.hover\\:bg-blue-100:hover {\n  background-color: var(--blue-100) !important;\n}\n.hover\\:bg-blue-200:hover {\n  background-color: var(--blue-200) !important;\n}\n.hover\\:bg-blue-300:hover {\n  background-color: var(--blue-300) !important;\n}\n.hover\\:bg-blue-400:hover {\n  background-color: var(--blue-400) !important;\n}\n.hover\\:bg-blue-500:hover {\n  background-color: var(--blue-500) !important;\n}\n.hover\\:bg-blue-600:hover {\n  background-color: var(--blue-600) !important;\n}\n.hover\\:bg-blue-700:hover {\n  background-color: var(--blue-700) !important;\n}\n.hover\\:bg-blue-800:hover {\n  background-color: var(--blue-800) !important;\n}\n.hover\\:bg-blue-900:hover {\n  background-color: var(--blue-900) !important;\n}\n\n.active\\:bg-blue-50:active {\n  background-color: var(--blue-50) !important;\n}\n.active\\:bg-blue-100:active {\n  background-color: var(--blue-100) !important;\n}\n.active\\:bg-blue-200:active {\n  background-color: var(--blue-200) !important;\n}\n.active\\:bg-blue-300:active {\n  background-color: var(--blue-300) !important;\n}\n.active\\:bg-blue-400:active {\n  background-color: var(--blue-400) !important;\n}\n.active\\:bg-blue-500:active {\n  background-color: var(--blue-500) !important;\n}\n.active\\:bg-blue-600:active {\n  background-color: var(--blue-600) !important;\n}\n.active\\:bg-blue-700:active {\n  background-color: var(--blue-700) !important;\n}\n.active\\:bg-blue-800:active {\n  background-color: var(--blue-800) !important;\n}\n.active\\:bg-blue-900:active {\n  background-color: var(--blue-900) !important;\n}\n\n.bg-green-50 {\n  background-color: var(--green-50) !important;\n}\n.bg-green-100 {\n  background-color: var(--green-100) !important;\n}\n.bg-green-200 {\n  background-color: var(--green-200) !important;\n}\n.bg-green-300 {\n  background-color: var(--green-300) !important;\n}\n.bg-green-400 {\n  background-color: var(--green-400) !important;\n}\n.bg-green-500 {\n  background-color: var(--green-500) !important;\n}\n.bg-green-600 {\n  background-color: var(--green-600) !important;\n}\n.bg-green-700 {\n  background-color: var(--green-700) !important;\n}\n.bg-green-800 {\n  background-color: var(--green-800) !important;\n}\n.bg-green-900 {\n  background-color: var(--green-900) !important;\n}\n\n.focus\\:bg-green-50:focus {\n  background-color: var(--green-50) !important;\n}\n.focus\\:bg-green-100:focus {\n  background-color: var(--green-100) !important;\n}\n.focus\\:bg-green-200:focus {\n  background-color: var(--green-200) !important;\n}\n.focus\\:bg-green-300:focus {\n  background-color: var(--green-300) !important;\n}\n.focus\\:bg-green-400:focus {\n  background-color: var(--green-400) !important;\n}\n.focus\\:bg-green-500:focus {\n  background-color: var(--green-500) !important;\n}\n.focus\\:bg-green-600:focus {\n  background-color: var(--green-600) !important;\n}\n.focus\\:bg-green-700:focus {\n  background-color: var(--green-700) !important;\n}\n.focus\\:bg-green-800:focus {\n  background-color: var(--green-800) !important;\n}\n.focus\\:bg-green-900:focus {\n  background-color: var(--green-900) !important;\n}\n\n.hover\\:bg-green-50:hover {\n  background-color: var(--green-50) !important;\n}\n.hover\\:bg-green-100:hover {\n  background-color: var(--green-100) !important;\n}\n.hover\\:bg-green-200:hover {\n  background-color: var(--green-200) !important;\n}\n.hover\\:bg-green-300:hover {\n  background-color: var(--green-300) !important;\n}\n.hover\\:bg-green-400:hover {\n  background-color: var(--green-400) !important;\n}\n.hover\\:bg-green-500:hover {\n  background-color: var(--green-500) !important;\n}\n.hover\\:bg-green-600:hover {\n  background-color: var(--green-600) !important;\n}\n.hover\\:bg-green-700:hover {\n  background-color: var(--green-700) !important;\n}\n.hover\\:bg-green-800:hover {\n  background-color: var(--green-800) !important;\n}\n.hover\\:bg-green-900:hover {\n  background-color: var(--green-900) !important;\n}\n\n.active\\:bg-green-50:active {\n  background-color: var(--green-50) !important;\n}\n.active\\:bg-green-100:active {\n  background-color: var(--green-100) !important;\n}\n.active\\:bg-green-200:active {\n  background-color: var(--green-200) !important;\n}\n.active\\:bg-green-300:active {\n  background-color: var(--green-300) !important;\n}\n.active\\:bg-green-400:active {\n  background-color: var(--green-400) !important;\n}\n.active\\:bg-green-500:active {\n  background-color: var(--green-500) !important;\n}\n.active\\:bg-green-600:active {\n  background-color: var(--green-600) !important;\n}\n.active\\:bg-green-700:active {\n  background-color: var(--green-700) !important;\n}\n.active\\:bg-green-800:active {\n  background-color: var(--green-800) !important;\n}\n.active\\:bg-green-900:active {\n  background-color: var(--green-900) !important;\n}\n\n.bg-yellow-50 {\n  background-color: var(--yellow-50) !important;\n}\n.bg-yellow-100 {\n  background-color: var(--yellow-100) !important;\n}\n.bg-yellow-200 {\n  background-color: var(--yellow-200) !important;\n}\n.bg-yellow-300 {\n  background-color: var(--yellow-300) !important;\n}\n.bg-yellow-400 {\n  background-color: var(--yellow-400) !important;\n}\n.bg-yellow-500 {\n  background-color: var(--yellow-500) !important;\n}\n.bg-yellow-600 {\n  background-color: var(--yellow-600) !important;\n}\n.bg-yellow-700 {\n  background-color: var(--yellow-700) !important;\n}\n.bg-yellow-800 {\n  background-color: var(--yellow-800) !important;\n}\n.bg-yellow-900 {\n  background-color: var(--yellow-900) !important;\n}\n\n.focus\\:bg-yellow-50:focus {\n  background-color: var(--yellow-50) !important;\n}\n.focus\\:bg-yellow-100:focus {\n  background-color: var(--yellow-100) !important;\n}\n.focus\\:bg-yellow-200:focus {\n  background-color: var(--yellow-200) !important;\n}\n.focus\\:bg-yellow-300:focus {\n  background-color: var(--yellow-300) !important;\n}\n.focus\\:bg-yellow-400:focus {\n  background-color: var(--yellow-400) !important;\n}\n.focus\\:bg-yellow-500:focus {\n  background-color: var(--yellow-500) !important;\n}\n.focus\\:bg-yellow-600:focus {\n  background-color: var(--yellow-600) !important;\n}\n.focus\\:bg-yellow-700:focus {\n  background-color: var(--yellow-700) !important;\n}\n.focus\\:bg-yellow-800:focus {\n  background-color: var(--yellow-800) !important;\n}\n.focus\\:bg-yellow-900:focus {\n  background-color: var(--yellow-900) !important;\n}\n\n.hover\\:bg-yellow-50:hover {\n  background-color: var(--yellow-50) !important;\n}\n.hover\\:bg-yellow-100:hover {\n  background-color: var(--yellow-100) !important;\n}\n.hover\\:bg-yellow-200:hover {\n  background-color: var(--yellow-200) !important;\n}\n.hover\\:bg-yellow-300:hover {\n  background-color: var(--yellow-300) !important;\n}\n.hover\\:bg-yellow-400:hover {\n  background-color: var(--yellow-400) !important;\n}\n.hover\\:bg-yellow-500:hover {\n  background-color: var(--yellow-500) !important;\n}\n.hover\\:bg-yellow-600:hover {\n  background-color: var(--yellow-600) !important;\n}\n.hover\\:bg-yellow-700:hover {\n  background-color: var(--yellow-700) !important;\n}\n.hover\\:bg-yellow-800:hover {\n  background-color: var(--yellow-800) !important;\n}\n.hover\\:bg-yellow-900:hover {\n  background-color: var(--yellow-900) !important;\n}\n\n.active\\:bg-yellow-50:active {\n  background-color: var(--yellow-50) !important;\n}\n.active\\:bg-yellow-100:active {\n  background-color: var(--yellow-100) !important;\n}\n.active\\:bg-yellow-200:active {\n  background-color: var(--yellow-200) !important;\n}\n.active\\:bg-yellow-300:active {\n  background-color: var(--yellow-300) !important;\n}\n.active\\:bg-yellow-400:active {\n  background-color: var(--yellow-400) !important;\n}\n.active\\:bg-yellow-500:active {\n  background-color: var(--yellow-500) !important;\n}\n.active\\:bg-yellow-600:active {\n  background-color: var(--yellow-600) !important;\n}\n.active\\:bg-yellow-700:active {\n  background-color: var(--yellow-700) !important;\n}\n.active\\:bg-yellow-800:active {\n  background-color: var(--yellow-800) !important;\n}\n.active\\:bg-yellow-900:active {\n  background-color: var(--yellow-900) !important;\n}\n\n.bg-cyan-50 {\n  background-color: var(--cyan-50) !important;\n}\n.bg-cyan-100 {\n  background-color: var(--cyan-100) !important;\n}\n.bg-cyan-200 {\n  background-color: var(--cyan-200) !important;\n}\n.bg-cyan-300 {\n  background-color: var(--cyan-300) !important;\n}\n.bg-cyan-400 {\n  background-color: var(--cyan-400) !important;\n}\n.bg-cyan-500 {\n  background-color: var(--cyan-500) !important;\n}\n.bg-cyan-600 {\n  background-color: var(--cyan-600) !important;\n}\n.bg-cyan-700 {\n  background-color: var(--cyan-700) !important;\n}\n.bg-cyan-800 {\n  background-color: var(--cyan-800) !important;\n}\n.bg-cyan-900 {\n  background-color: var(--cyan-900) !important;\n}\n\n.focus\\:bg-cyan-50:focus {\n  background-color: var(--cyan-50) !important;\n}\n.focus\\:bg-cyan-100:focus {\n  background-color: var(--cyan-100) !important;\n}\n.focus\\:bg-cyan-200:focus {\n  background-color: var(--cyan-200) !important;\n}\n.focus\\:bg-cyan-300:focus {\n  background-color: var(--cyan-300) !important;\n}\n.focus\\:bg-cyan-400:focus {\n  background-color: var(--cyan-400) !important;\n}\n.focus\\:bg-cyan-500:focus {\n  background-color: var(--cyan-500) !important;\n}\n.focus\\:bg-cyan-600:focus {\n  background-color: var(--cyan-600) !important;\n}\n.focus\\:bg-cyan-700:focus {\n  background-color: var(--cyan-700) !important;\n}\n.focus\\:bg-cyan-800:focus {\n  background-color: var(--cyan-800) !important;\n}\n.focus\\:bg-cyan-900:focus {\n  background-color: var(--cyan-900) !important;\n}\n\n.hover\\:bg-cyan-50:hover {\n  background-color: var(--cyan-50) !important;\n}\n.hover\\:bg-cyan-100:hover {\n  background-color: var(--cyan-100) !important;\n}\n.hover\\:bg-cyan-200:hover {\n  background-color: var(--cyan-200) !important;\n}\n.hover\\:bg-cyan-300:hover {\n  background-color: var(--cyan-300) !important;\n}\n.hover\\:bg-cyan-400:hover {\n  background-color: var(--cyan-400) !important;\n}\n.hover\\:bg-cyan-500:hover {\n  background-color: var(--cyan-500) !important;\n}\n.hover\\:bg-cyan-600:hover {\n  background-color: var(--cyan-600) !important;\n}\n.hover\\:bg-cyan-700:hover {\n  background-color: var(--cyan-700) !important;\n}\n.hover\\:bg-cyan-800:hover {\n  background-color: var(--cyan-800) !important;\n}\n.hover\\:bg-cyan-900:hover {\n  background-color: var(--cyan-900) !important;\n}\n\n.active\\:bg-cyan-50:active {\n  background-color: var(--cyan-50) !important;\n}\n.active\\:bg-cyan-100:active {\n  background-color: var(--cyan-100) !important;\n}\n.active\\:bg-cyan-200:active {\n  background-color: var(--cyan-200) !important;\n}\n.active\\:bg-cyan-300:active {\n  background-color: var(--cyan-300) !important;\n}\n.active\\:bg-cyan-400:active {\n  background-color: var(--cyan-400) !important;\n}\n.active\\:bg-cyan-500:active {\n  background-color: var(--cyan-500) !important;\n}\n.active\\:bg-cyan-600:active {\n  background-color: var(--cyan-600) !important;\n}\n.active\\:bg-cyan-700:active {\n  background-color: var(--cyan-700) !important;\n}\n.active\\:bg-cyan-800:active {\n  background-color: var(--cyan-800) !important;\n}\n.active\\:bg-cyan-900:active {\n  background-color: var(--cyan-900) !important;\n}\n\n.bg-pink-50 {\n  background-color: var(--pink-50) !important;\n}\n.bg-pink-100 {\n  background-color: var(--pink-100) !important;\n}\n.bg-pink-200 {\n  background-color: var(--pink-200) !important;\n}\n.bg-pink-300 {\n  background-color: var(--pink-300) !important;\n}\n.bg-pink-400 {\n  background-color: var(--pink-400) !important;\n}\n.bg-pink-500 {\n  background-color: var(--pink-500) !important;\n}\n.bg-pink-600 {\n  background-color: var(--pink-600) !important;\n}\n.bg-pink-700 {\n  background-color: var(--pink-700) !important;\n}\n.bg-pink-800 {\n  background-color: var(--pink-800) !important;\n}\n.bg-pink-900 {\n  background-color: var(--pink-900) !important;\n}\n\n.focus\\:bg-pink-50:focus {\n  background-color: var(--pink-50) !important;\n}\n.focus\\:bg-pink-100:focus {\n  background-color: var(--pink-100) !important;\n}\n.focus\\:bg-pink-200:focus {\n  background-color: var(--pink-200) !important;\n}\n.focus\\:bg-pink-300:focus {\n  background-color: var(--pink-300) !important;\n}\n.focus\\:bg-pink-400:focus {\n  background-color: var(--pink-400) !important;\n}\n.focus\\:bg-pink-500:focus {\n  background-color: var(--pink-500) !important;\n}\n.focus\\:bg-pink-600:focus {\n  background-color: var(--pink-600) !important;\n}\n.focus\\:bg-pink-700:focus {\n  background-color: var(--pink-700) !important;\n}\n.focus\\:bg-pink-800:focus {\n  background-color: var(--pink-800) !important;\n}\n.focus\\:bg-pink-900:focus {\n  background-color: var(--pink-900) !important;\n}\n\n.hover\\:bg-pink-50:hover {\n  background-color: var(--pink-50) !important;\n}\n.hover\\:bg-pink-100:hover {\n  background-color: var(--pink-100) !important;\n}\n.hover\\:bg-pink-200:hover {\n  background-color: var(--pink-200) !important;\n}\n.hover\\:bg-pink-300:hover {\n  background-color: var(--pink-300) !important;\n}\n.hover\\:bg-pink-400:hover {\n  background-color: var(--pink-400) !important;\n}\n.hover\\:bg-pink-500:hover {\n  background-color: var(--pink-500) !important;\n}\n.hover\\:bg-pink-600:hover {\n  background-color: var(--pink-600) !important;\n}\n.hover\\:bg-pink-700:hover {\n  background-color: var(--pink-700) !important;\n}\n.hover\\:bg-pink-800:hover {\n  background-color: var(--pink-800) !important;\n}\n.hover\\:bg-pink-900:hover {\n  background-color: var(--pink-900) !important;\n}\n\n.active\\:bg-pink-50:active {\n  background-color: var(--pink-50) !important;\n}\n.active\\:bg-pink-100:active {\n  background-color: var(--pink-100) !important;\n}\n.active\\:bg-pink-200:active {\n  background-color: var(--pink-200) !important;\n}\n.active\\:bg-pink-300:active {\n  background-color: var(--pink-300) !important;\n}\n.active\\:bg-pink-400:active {\n  background-color: var(--pink-400) !important;\n}\n.active\\:bg-pink-500:active {\n  background-color: var(--pink-500) !important;\n}\n.active\\:bg-pink-600:active {\n  background-color: var(--pink-600) !important;\n}\n.active\\:bg-pink-700:active {\n  background-color: var(--pink-700) !important;\n}\n.active\\:bg-pink-800:active {\n  background-color: var(--pink-800) !important;\n}\n.active\\:bg-pink-900:active {\n  background-color: var(--pink-900) !important;\n}\n\n.bg-indigo-50 {\n  background-color: var(--indigo-50) !important;\n}\n.bg-indigo-100 {\n  background-color: var(--indigo-100) !important;\n}\n.bg-indigo-200 {\n  background-color: var(--indigo-200) !important;\n}\n.bg-indigo-300 {\n  background-color: var(--indigo-300) !important;\n}\n.bg-indigo-400 {\n  background-color: var(--indigo-400) !important;\n}\n.bg-indigo-500 {\n  background-color: var(--indigo-500) !important;\n}\n.bg-indigo-600 {\n  background-color: var(--indigo-600) !important;\n}\n.bg-indigo-700 {\n  background-color: var(--indigo-700) !important;\n}\n.bg-indigo-800 {\n  background-color: var(--indigo-800) !important;\n}\n.bg-indigo-900 {\n  background-color: var(--indigo-900) !important;\n}\n\n.focus\\:bg-indigo-50:focus {\n  background-color: var(--indigo-50) !important;\n}\n.focus\\:bg-indigo-100:focus {\n  background-color: var(--indigo-100) !important;\n}\n.focus\\:bg-indigo-200:focus {\n  background-color: var(--indigo-200) !important;\n}\n.focus\\:bg-indigo-300:focus {\n  background-color: var(--indigo-300) !important;\n}\n.focus\\:bg-indigo-400:focus {\n  background-color: var(--indigo-400) !important;\n}\n.focus\\:bg-indigo-500:focus {\n  background-color: var(--indigo-500) !important;\n}\n.focus\\:bg-indigo-600:focus {\n  background-color: var(--indigo-600) !important;\n}\n.focus\\:bg-indigo-700:focus {\n  background-color: var(--indigo-700) !important;\n}\n.focus\\:bg-indigo-800:focus {\n  background-color: var(--indigo-800) !important;\n}\n.focus\\:bg-indigo-900:focus {\n  background-color: var(--indigo-900) !important;\n}\n\n.hover\\:bg-indigo-50:hover {\n  background-color: var(--indigo-50) !important;\n}\n.hover\\:bg-indigo-100:hover {\n  background-color: var(--indigo-100) !important;\n}\n.hover\\:bg-indigo-200:hover {\n  background-color: var(--indigo-200) !important;\n}\n.hover\\:bg-indigo-300:hover {\n  background-color: var(--indigo-300) !important;\n}\n.hover\\:bg-indigo-400:hover {\n  background-color: var(--indigo-400) !important;\n}\n.hover\\:bg-indigo-500:hover {\n  background-color: var(--indigo-500) !important;\n}\n.hover\\:bg-indigo-600:hover {\n  background-color: var(--indigo-600) !important;\n}\n.hover\\:bg-indigo-700:hover {\n  background-color: var(--indigo-700) !important;\n}\n.hover\\:bg-indigo-800:hover {\n  background-color: var(--indigo-800) !important;\n}\n.hover\\:bg-indigo-900:hover {\n  background-color: var(--indigo-900) !important;\n}\n\n.active\\:bg-indigo-50:active {\n  background-color: var(--indigo-50) !important;\n}\n.active\\:bg-indigo-100:active {\n  background-color: var(--indigo-100) !important;\n}\n.active\\:bg-indigo-200:active {\n  background-color: var(--indigo-200) !important;\n}\n.active\\:bg-indigo-300:active {\n  background-color: var(--indigo-300) !important;\n}\n.active\\:bg-indigo-400:active {\n  background-color: var(--indigo-400) !important;\n}\n.active\\:bg-indigo-500:active {\n  background-color: var(--indigo-500) !important;\n}\n.active\\:bg-indigo-600:active {\n  background-color: var(--indigo-600) !important;\n}\n.active\\:bg-indigo-700:active {\n  background-color: var(--indigo-700) !important;\n}\n.active\\:bg-indigo-800:active {\n  background-color: var(--indigo-800) !important;\n}\n.active\\:bg-indigo-900:active {\n  background-color: var(--indigo-900) !important;\n}\n\n.bg-teal-50 {\n  background-color: var(--teal-50) !important;\n}\n.bg-teal-100 {\n  background-color: var(--teal-100) !important;\n}\n.bg-teal-200 {\n  background-color: var(--teal-200) !important;\n}\n.bg-teal-300 {\n  background-color: var(--teal-300) !important;\n}\n.bg-teal-400 {\n  background-color: var(--teal-400) !important;\n}\n.bg-teal-500 {\n  background-color: var(--teal-500) !important;\n}\n.bg-teal-600 {\n  background-color: var(--teal-600) !important;\n}\n.bg-teal-700 {\n  background-color: var(--teal-700) !important;\n}\n.bg-teal-800 {\n  background-color: var(--teal-800) !important;\n}\n.bg-teal-900 {\n  background-color: var(--teal-900) !important;\n}\n\n.focus\\:bg-teal-50:focus {\n  background-color: var(--teal-50) !important;\n}\n.focus\\:bg-teal-100:focus {\n  background-color: var(--teal-100) !important;\n}\n.focus\\:bg-teal-200:focus {\n  background-color: var(--teal-200) !important;\n}\n.focus\\:bg-teal-300:focus {\n  background-color: var(--teal-300) !important;\n}\n.focus\\:bg-teal-400:focus {\n  background-color: var(--teal-400) !important;\n}\n.focus\\:bg-teal-500:focus {\n  background-color: var(--teal-500) !important;\n}\n.focus\\:bg-teal-600:focus {\n  background-color: var(--teal-600) !important;\n}\n.focus\\:bg-teal-700:focus {\n  background-color: var(--teal-700) !important;\n}\n.focus\\:bg-teal-800:focus {\n  background-color: var(--teal-800) !important;\n}\n.focus\\:bg-teal-900:focus {\n  background-color: var(--teal-900) !important;\n}\n\n.hover\\:bg-teal-50:hover {\n  background-color: var(--teal-50) !important;\n}\n.hover\\:bg-teal-100:hover {\n  background-color: var(--teal-100) !important;\n}\n.hover\\:bg-teal-200:hover {\n  background-color: var(--teal-200) !important;\n}\n.hover\\:bg-teal-300:hover {\n  background-color: var(--teal-300) !important;\n}\n.hover\\:bg-teal-400:hover {\n  background-color: var(--teal-400) !important;\n}\n.hover\\:bg-teal-500:hover {\n  background-color: var(--teal-500) !important;\n}\n.hover\\:bg-teal-600:hover {\n  background-color: var(--teal-600) !important;\n}\n.hover\\:bg-teal-700:hover {\n  background-color: var(--teal-700) !important;\n}\n.hover\\:bg-teal-800:hover {\n  background-color: var(--teal-800) !important;\n}\n.hover\\:bg-teal-900:hover {\n  background-color: var(--teal-900) !important;\n}\n\n.active\\:bg-teal-50:active {\n  background-color: var(--teal-50) !important;\n}\n.active\\:bg-teal-100:active {\n  background-color: var(--teal-100) !important;\n}\n.active\\:bg-teal-200:active {\n  background-color: var(--teal-200) !important;\n}\n.active\\:bg-teal-300:active {\n  background-color: var(--teal-300) !important;\n}\n.active\\:bg-teal-400:active {\n  background-color: var(--teal-400) !important;\n}\n.active\\:bg-teal-500:active {\n  background-color: var(--teal-500) !important;\n}\n.active\\:bg-teal-600:active {\n  background-color: var(--teal-600) !important;\n}\n.active\\:bg-teal-700:active {\n  background-color: var(--teal-700) !important;\n}\n.active\\:bg-teal-800:active {\n  background-color: var(--teal-800) !important;\n}\n.active\\:bg-teal-900:active {\n  background-color: var(--teal-900) !important;\n}\n\n.bg-orange-50 {\n  background-color: var(--orange-50) !important;\n}\n.bg-orange-100 {\n  background-color: var(--orange-100) !important;\n}\n.bg-orange-200 {\n  background-color: var(--orange-200) !important;\n}\n.bg-orange-300 {\n  background-color: var(--orange-300) !important;\n}\n.bg-orange-400 {\n  background-color: var(--orange-400) !important;\n}\n.bg-orange-500 {\n  background-color: var(--orange-500) !important;\n}\n.bg-orange-600 {\n  background-color: var(--orange-600) !important;\n}\n.bg-orange-700 {\n  background-color: var(--orange-700) !important;\n}\n.bg-orange-800 {\n  background-color: var(--orange-800) !important;\n}\n.bg-orange-900 {\n  background-color: var(--orange-900) !important;\n}\n\n.focus\\:bg-orange-50:focus {\n  background-color: var(--orange-50) !important;\n}\n.focus\\:bg-orange-100:focus {\n  background-color: var(--orange-100) !important;\n}\n.focus\\:bg-orange-200:focus {\n  background-color: var(--orange-200) !important;\n}\n.focus\\:bg-orange-300:focus {\n  background-color: var(--orange-300) !important;\n}\n.focus\\:bg-orange-400:focus {\n  background-color: var(--orange-400) !important;\n}\n.focus\\:bg-orange-500:focus {\n  background-color: var(--orange-500) !important;\n}\n.focus\\:bg-orange-600:focus {\n  background-color: var(--orange-600) !important;\n}\n.focus\\:bg-orange-700:focus {\n  background-color: var(--orange-700) !important;\n}\n.focus\\:bg-orange-800:focus {\n  background-color: var(--orange-800) !important;\n}\n.focus\\:bg-orange-900:focus {\n  background-color: var(--orange-900) !important;\n}\n\n.hover\\:bg-orange-50:hover {\n  background-color: var(--orange-50) !important;\n}\n.hover\\:bg-orange-100:hover {\n  background-color: var(--orange-100) !important;\n}\n.hover\\:bg-orange-200:hover {\n  background-color: var(--orange-200) !important;\n}\n.hover\\:bg-orange-300:hover {\n  background-color: var(--orange-300) !important;\n}\n.hover\\:bg-orange-400:hover {\n  background-color: var(--orange-400) !important;\n}\n.hover\\:bg-orange-500:hover {\n  background-color: var(--orange-500) !important;\n}\n.hover\\:bg-orange-600:hover {\n  background-color: var(--orange-600) !important;\n}\n.hover\\:bg-orange-700:hover {\n  background-color: var(--orange-700) !important;\n}\n.hover\\:bg-orange-800:hover {\n  background-color: var(--orange-800) !important;\n}\n.hover\\:bg-orange-900:hover {\n  background-color: var(--orange-900) !important;\n}\n\n.active\\:bg-orange-50:active {\n  background-color: var(--orange-50) !important;\n}\n.active\\:bg-orange-100:active {\n  background-color: var(--orange-100) !important;\n}\n.active\\:bg-orange-200:active {\n  background-color: var(--orange-200) !important;\n}\n.active\\:bg-orange-300:active {\n  background-color: var(--orange-300) !important;\n}\n.active\\:bg-orange-400:active {\n  background-color: var(--orange-400) !important;\n}\n.active\\:bg-orange-500:active {\n  background-color: var(--orange-500) !important;\n}\n.active\\:bg-orange-600:active {\n  background-color: var(--orange-600) !important;\n}\n.active\\:bg-orange-700:active {\n  background-color: var(--orange-700) !important;\n}\n.active\\:bg-orange-800:active {\n  background-color: var(--orange-800) !important;\n}\n.active\\:bg-orange-900:active {\n  background-color: var(--orange-900) !important;\n}\n\n.bg-bluegray-50 {\n  background-color: var(--bluegray-50) !important;\n}\n.bg-bluegray-100 {\n  background-color: var(--bluegray-100) !important;\n}\n.bg-bluegray-200 {\n  background-color: var(--bluegray-200) !important;\n}\n.bg-bluegray-300 {\n  background-color: var(--bluegray-300) !important;\n}\n.bg-bluegray-400 {\n  background-color: var(--bluegray-400) !important;\n}\n.bg-bluegray-500 {\n  background-color: var(--bluegray-500) !important;\n}\n.bg-bluegray-600 {\n  background-color: var(--bluegray-600) !important;\n}\n.bg-bluegray-700 {\n  background-color: var(--bluegray-700) !important;\n}\n.bg-bluegray-800 {\n  background-color: var(--bluegray-800) !important;\n}\n.bg-bluegray-900 {\n  background-color: var(--bluegray-900) !important;\n}\n\n.focus\\:bg-bluegray-50:focus {\n  background-color: var(--bluegray-50) !important;\n}\n.focus\\:bg-bluegray-100:focus {\n  background-color: var(--bluegray-100) !important;\n}\n.focus\\:bg-bluegray-200:focus {\n  background-color: var(--bluegray-200) !important;\n}\n.focus\\:bg-bluegray-300:focus {\n  background-color: var(--bluegray-300) !important;\n}\n.focus\\:bg-bluegray-400:focus {\n  background-color: var(--bluegray-400) !important;\n}\n.focus\\:bg-bluegray-500:focus {\n  background-color: var(--bluegray-500) !important;\n}\n.focus\\:bg-bluegray-600:focus {\n  background-color: var(--bluegray-600) !important;\n}\n.focus\\:bg-bluegray-700:focus {\n  background-color: var(--bluegray-700) !important;\n}\n.focus\\:bg-bluegray-800:focus {\n  background-color: var(--bluegray-800) !important;\n}\n.focus\\:bg-bluegray-900:focus {\n  background-color: var(--bluegray-900) !important;\n}\n\n.hover\\:bg-bluegray-50:hover {\n  background-color: var(--bluegray-50) !important;\n}\n.hover\\:bg-bluegray-100:hover {\n  background-color: var(--bluegray-100) !important;\n}\n.hover\\:bg-bluegray-200:hover {\n  background-color: var(--bluegray-200) !important;\n}\n.hover\\:bg-bluegray-300:hover {\n  background-color: var(--bluegray-300) !important;\n}\n.hover\\:bg-bluegray-400:hover {\n  background-color: var(--bluegray-400) !important;\n}\n.hover\\:bg-bluegray-500:hover {\n  background-color: var(--bluegray-500) !important;\n}\n.hover\\:bg-bluegray-600:hover {\n  background-color: var(--bluegray-600) !important;\n}\n.hover\\:bg-bluegray-700:hover {\n  background-color: var(--bluegray-700) !important;\n}\n.hover\\:bg-bluegray-800:hover {\n  background-color: var(--bluegray-800) !important;\n}\n.hover\\:bg-bluegray-900:hover {\n  background-color: var(--bluegray-900) !important;\n}\n\n.active\\:bg-bluegray-50:active {\n  background-color: var(--bluegray-50) !important;\n}\n.active\\:bg-bluegray-100:active {\n  background-color: var(--bluegray-100) !important;\n}\n.active\\:bg-bluegray-200:active {\n  background-color: var(--bluegray-200) !important;\n}\n.active\\:bg-bluegray-300:active {\n  background-color: var(--bluegray-300) !important;\n}\n.active\\:bg-bluegray-400:active {\n  background-color: var(--bluegray-400) !important;\n}\n.active\\:bg-bluegray-500:active {\n  background-color: var(--bluegray-500) !important;\n}\n.active\\:bg-bluegray-600:active {\n  background-color: var(--bluegray-600) !important;\n}\n.active\\:bg-bluegray-700:active {\n  background-color: var(--bluegray-700) !important;\n}\n.active\\:bg-bluegray-800:active {\n  background-color: var(--bluegray-800) !important;\n}\n.active\\:bg-bluegray-900:active {\n  background-color: var(--bluegray-900) !important;\n}\n\n.bg-purple-50 {\n  background-color: var(--purple-50) !important;\n}\n.bg-purple-100 {\n  background-color: var(--purple-100) !important;\n}\n.bg-purple-200 {\n  background-color: var(--purple-200) !important;\n}\n.bg-purple-300 {\n  background-color: var(--purple-300) !important;\n}\n.bg-purple-400 {\n  background-color: var(--purple-400) !important;\n}\n.bg-purple-500 {\n  background-color: var(--purple-500) !important;\n}\n.bg-purple-600 {\n  background-color: var(--purple-600) !important;\n}\n.bg-purple-700 {\n  background-color: var(--purple-700) !important;\n}\n.bg-purple-800 {\n  background-color: var(--purple-800) !important;\n}\n.bg-purple-900 {\n  background-color: var(--purple-900) !important;\n}\n\n.focus\\:bg-purple-50:focus {\n  background-color: var(--purple-50) !important;\n}\n.focus\\:bg-purple-100:focus {\n  background-color: var(--purple-100) !important;\n}\n.focus\\:bg-purple-200:focus {\n  background-color: var(--purple-200) !important;\n}\n.focus\\:bg-purple-300:focus {\n  background-color: var(--purple-300) !important;\n}\n.focus\\:bg-purple-400:focus {\n  background-color: var(--purple-400) !important;\n}\n.focus\\:bg-purple-500:focus {\n  background-color: var(--purple-500) !important;\n}\n.focus\\:bg-purple-600:focus {\n  background-color: var(--purple-600) !important;\n}\n.focus\\:bg-purple-700:focus {\n  background-color: var(--purple-700) !important;\n}\n.focus\\:bg-purple-800:focus {\n  background-color: var(--purple-800) !important;\n}\n.focus\\:bg-purple-900:focus {\n  background-color: var(--purple-900) !important;\n}\n\n.hover\\:bg-purple-50:hover {\n  background-color: var(--purple-50) !important;\n}\n.hover\\:bg-purple-100:hover {\n  background-color: var(--purple-100) !important;\n}\n.hover\\:bg-purple-200:hover {\n  background-color: var(--purple-200) !important;\n}\n.hover\\:bg-purple-300:hover {\n  background-color: var(--purple-300) !important;\n}\n.hover\\:bg-purple-400:hover {\n  background-color: var(--purple-400) !important;\n}\n.hover\\:bg-purple-500:hover {\n  background-color: var(--purple-500) !important;\n}\n.hover\\:bg-purple-600:hover {\n  background-color: var(--purple-600) !important;\n}\n.hover\\:bg-purple-700:hover {\n  background-color: var(--purple-700) !important;\n}\n.hover\\:bg-purple-800:hover {\n  background-color: var(--purple-800) !important;\n}\n.hover\\:bg-purple-900:hover {\n  background-color: var(--purple-900) !important;\n}\n\n.active\\:bg-purple-50:active {\n  background-color: var(--purple-50) !important;\n}\n.active\\:bg-purple-100:active {\n  background-color: var(--purple-100) !important;\n}\n.active\\:bg-purple-200:active {\n  background-color: var(--purple-200) !important;\n}\n.active\\:bg-purple-300:active {\n  background-color: var(--purple-300) !important;\n}\n.active\\:bg-purple-400:active {\n  background-color: var(--purple-400) !important;\n}\n.active\\:bg-purple-500:active {\n  background-color: var(--purple-500) !important;\n}\n.active\\:bg-purple-600:active {\n  background-color: var(--purple-600) !important;\n}\n.active\\:bg-purple-700:active {\n  background-color: var(--purple-700) !important;\n}\n.active\\:bg-purple-800:active {\n  background-color: var(--purple-800) !important;\n}\n.active\\:bg-purple-900:active {\n  background-color: var(--purple-900) !important;\n}\n\n.bg-gray-50 {\n  background-color: var(--gray-50) !important;\n}\n.bg-gray-100 {\n  background-color: var(--gray-100) !important;\n}\n.bg-gray-200 {\n  background-color: var(--gray-200) !important;\n}\n.bg-gray-300 {\n  background-color: var(--gray-300) !important;\n}\n.bg-gray-400 {\n  background-color: var(--gray-400) !important;\n}\n.bg-gray-500 {\n  background-color: var(--gray-500) !important;\n}\n.bg-gray-600 {\n  background-color: var(--gray-600) !important;\n}\n.bg-gray-700 {\n  background-color: var(--gray-700) !important;\n}\n.bg-gray-800 {\n  background-color: var(--gray-800) !important;\n}\n.bg-gray-900 {\n  background-color: var(--gray-900) !important;\n}\n\n.focus\\:bg-gray-50:focus {\n  background-color: var(--gray-50) !important;\n}\n.focus\\:bg-gray-100:focus {\n  background-color: var(--gray-100) !important;\n}\n.focus\\:bg-gray-200:focus {\n  background-color: var(--gray-200) !important;\n}\n.focus\\:bg-gray-300:focus {\n  background-color: var(--gray-300) !important;\n}\n.focus\\:bg-gray-400:focus {\n  background-color: var(--gray-400) !important;\n}\n.focus\\:bg-gray-500:focus {\n  background-color: var(--gray-500) !important;\n}\n.focus\\:bg-gray-600:focus {\n  background-color: var(--gray-600) !important;\n}\n.focus\\:bg-gray-700:focus {\n  background-color: var(--gray-700) !important;\n}\n.focus\\:bg-gray-800:focus {\n  background-color: var(--gray-800) !important;\n}\n.focus\\:bg-gray-900:focus {\n  background-color: var(--gray-900) !important;\n}\n\n.hover\\:bg-gray-50:hover {\n  background-color: var(--gray-50) !important;\n}\n.hover\\:bg-gray-100:hover {\n  background-color: var(--gray-100) !important;\n}\n.hover\\:bg-gray-200:hover {\n  background-color: var(--gray-200) !important;\n}\n.hover\\:bg-gray-300:hover {\n  background-color: var(--gray-300) !important;\n}\n.hover\\:bg-gray-400:hover {\n  background-color: var(--gray-400) !important;\n}\n.hover\\:bg-gray-500:hover {\n  background-color: var(--gray-500) !important;\n}\n.hover\\:bg-gray-600:hover {\n  background-color: var(--gray-600) !important;\n}\n.hover\\:bg-gray-700:hover {\n  background-color: var(--gray-700) !important;\n}\n.hover\\:bg-gray-800:hover {\n  background-color: var(--gray-800) !important;\n}\n.hover\\:bg-gray-900:hover {\n  background-color: var(--gray-900) !important;\n}\n\n.active\\:bg-gray-50:active {\n  background-color: var(--gray-50) !important;\n}\n.active\\:bg-gray-100:active {\n  background-color: var(--gray-100) !important;\n}\n.active\\:bg-gray-200:active {\n  background-color: var(--gray-200) !important;\n}\n.active\\:bg-gray-300:active {\n  background-color: var(--gray-300) !important;\n}\n.active\\:bg-gray-400:active {\n  background-color: var(--gray-400) !important;\n}\n.active\\:bg-gray-500:active {\n  background-color: var(--gray-500) !important;\n}\n.active\\:bg-gray-600:active {\n  background-color: var(--gray-600) !important;\n}\n.active\\:bg-gray-700:active {\n  background-color: var(--gray-700) !important;\n}\n.active\\:bg-gray-800:active {\n  background-color: var(--gray-800) !important;\n}\n.active\\:bg-gray-900:active {\n  background-color: var(--gray-900) !important;\n}\n\n.border-blue-50 {\n  border-color: var(--blue-50) !important;\n}\n.border-blue-100 {\n  border-color: var(--blue-100) !important;\n}\n.border-blue-200 {\n  border-color: var(--blue-200) !important;\n}\n.border-blue-300 {\n  border-color: var(--blue-300) !important;\n}\n.border-blue-400 {\n  border-color: var(--blue-400) !important;\n}\n.border-blue-500 {\n  border-color: var(--blue-500) !important;\n}\n.border-blue-600 {\n  border-color: var(--blue-600) !important;\n}\n.border-blue-700 {\n  border-color: var(--blue-700) !important;\n}\n.border-blue-800 {\n  border-color: var(--blue-800) !important;\n}\n.border-blue-900 {\n  border-color: var(--blue-900) !important;\n}\n\n.focus\\:border-blue-50:focus {\n  border-color: var(--blue-50) !important;\n}\n.focus\\:border-blue-100:focus {\n  border-color: var(--blue-100) !important;\n}\n.focus\\:border-blue-200:focus {\n  border-color: var(--blue-200) !important;\n}\n.focus\\:border-blue-300:focus {\n  border-color: var(--blue-300) !important;\n}\n.focus\\:border-blue-400:focus {\n  border-color: var(--blue-400) !important;\n}\n.focus\\:border-blue-500:focus {\n  border-color: var(--blue-500) !important;\n}\n.focus\\:border-blue-600:focus {\n  border-color: var(--blue-600) !important;\n}\n.focus\\:border-blue-700:focus {\n  border-color: var(--blue-700) !important;\n}\n.focus\\:border-blue-800:focus {\n  border-color: var(--blue-800) !important;\n}\n.focus\\:border-blue-900:focus {\n  border-color: var(--blue-900) !important;\n}\n\n.hover\\:border-blue-50:hover {\n  border-color: var(--blue-50) !important;\n}\n.hover\\:border-blue-100:hover {\n  border-color: var(--blue-100) !important;\n}\n.hover\\:border-blue-200:hover {\n  border-color: var(--blue-200) !important;\n}\n.hover\\:border-blue-300:hover {\n  border-color: var(--blue-300) !important;\n}\n.hover\\:border-blue-400:hover {\n  border-color: var(--blue-400) !important;\n}\n.hover\\:border-blue-500:hover {\n  border-color: var(--blue-500) !important;\n}\n.hover\\:border-blue-600:hover {\n  border-color: var(--blue-600) !important;\n}\n.hover\\:border-blue-700:hover {\n  border-color: var(--blue-700) !important;\n}\n.hover\\:border-blue-800:hover {\n  border-color: var(--blue-800) !important;\n}\n.hover\\:border-blue-900:hover {\n  border-color: var(--blue-900) !important;\n}\n\n.active\\:border-blue-50:active {\n  border-color: var(--blue-50) !important;\n}\n.active\\:border-blue-100:active {\n  border-color: var(--blue-100) !important;\n}\n.active\\:border-blue-200:active {\n  border-color: var(--blue-200) !important;\n}\n.active\\:border-blue-300:active {\n  border-color: var(--blue-300) !important;\n}\n.active\\:border-blue-400:active {\n  border-color: var(--blue-400) !important;\n}\n.active\\:border-blue-500:active {\n  border-color: var(--blue-500) !important;\n}\n.active\\:border-blue-600:active {\n  border-color: var(--blue-600) !important;\n}\n.active\\:border-blue-700:active {\n  border-color: var(--blue-700) !important;\n}\n.active\\:border-blue-800:active {\n  border-color: var(--blue-800) !important;\n}\n.active\\:border-blue-900:active {\n  border-color: var(--blue-900) !important;\n}\n\n.border-green-50 {\n  border-color: var(--green-50) !important;\n}\n.border-green-100 {\n  border-color: var(--green-100) !important;\n}\n.border-green-200 {\n  border-color: var(--green-200) !important;\n}\n.border-green-300 {\n  border-color: var(--green-300) !important;\n}\n.border-green-400 {\n  border-color: var(--green-400) !important;\n}\n.border-green-500 {\n  border-color: var(--green-500) !important;\n}\n.border-green-600 {\n  border-color: var(--green-600) !important;\n}\n.border-green-700 {\n  border-color: var(--green-700) !important;\n}\n.border-green-800 {\n  border-color: var(--green-800) !important;\n}\n.border-green-900 {\n  border-color: var(--green-900) !important;\n}\n\n.focus\\:border-green-50:focus {\n  border-color: var(--green-50) !important;\n}\n.focus\\:border-green-100:focus {\n  border-color: var(--green-100) !important;\n}\n.focus\\:border-green-200:focus {\n  border-color: var(--green-200) !important;\n}\n.focus\\:border-green-300:focus {\n  border-color: var(--green-300) !important;\n}\n.focus\\:border-green-400:focus {\n  border-color: var(--green-400) !important;\n}\n.focus\\:border-green-500:focus {\n  border-color: var(--green-500) !important;\n}\n.focus\\:border-green-600:focus {\n  border-color: var(--green-600) !important;\n}\n.focus\\:border-green-700:focus {\n  border-color: var(--green-700) !important;\n}\n.focus\\:border-green-800:focus {\n  border-color: var(--green-800) !important;\n}\n.focus\\:border-green-900:focus {\n  border-color: var(--green-900) !important;\n}\n\n.hover\\:border-green-50:hover {\n  border-color: var(--green-50) !important;\n}\n.hover\\:border-green-100:hover {\n  border-color: var(--green-100) !important;\n}\n.hover\\:border-green-200:hover {\n  border-color: var(--green-200) !important;\n}\n.hover\\:border-green-300:hover {\n  border-color: var(--green-300) !important;\n}\n.hover\\:border-green-400:hover {\n  border-color: var(--green-400) !important;\n}\n.hover\\:border-green-500:hover {\n  border-color: var(--green-500) !important;\n}\n.hover\\:border-green-600:hover {\n  border-color: var(--green-600) !important;\n}\n.hover\\:border-green-700:hover {\n  border-color: var(--green-700) !important;\n}\n.hover\\:border-green-800:hover {\n  border-color: var(--green-800) !important;\n}\n.hover\\:border-green-900:hover {\n  border-color: var(--green-900) !important;\n}\n\n.active\\:border-green-50:active {\n  border-color: var(--green-50) !important;\n}\n.active\\:border-green-100:active {\n  border-color: var(--green-100) !important;\n}\n.active\\:border-green-200:active {\n  border-color: var(--green-200) !important;\n}\n.active\\:border-green-300:active {\n  border-color: var(--green-300) !important;\n}\n.active\\:border-green-400:active {\n  border-color: var(--green-400) !important;\n}\n.active\\:border-green-500:active {\n  border-color: var(--green-500) !important;\n}\n.active\\:border-green-600:active {\n  border-color: var(--green-600) !important;\n}\n.active\\:border-green-700:active {\n  border-color: var(--green-700) !important;\n}\n.active\\:border-green-800:active {\n  border-color: var(--green-800) !important;\n}\n.active\\:border-green-900:active {\n  border-color: var(--green-900) !important;\n}\n\n.border-yellow-50 {\n  border-color: var(--yellow-50) !important;\n}\n.border-yellow-100 {\n  border-color: var(--yellow-100) !important;\n}\n.border-yellow-200 {\n  border-color: var(--yellow-200) !important;\n}\n.border-yellow-300 {\n  border-color: var(--yellow-300) !important;\n}\n.border-yellow-400 {\n  border-color: var(--yellow-400) !important;\n}\n.border-yellow-500 {\n  border-color: var(--yellow-500) !important;\n}\n.border-yellow-600 {\n  border-color: var(--yellow-600) !important;\n}\n.border-yellow-700 {\n  border-color: var(--yellow-700) !important;\n}\n.border-yellow-800 {\n  border-color: var(--yellow-800) !important;\n}\n.border-yellow-900 {\n  border-color: var(--yellow-900) !important;\n}\n\n.focus\\:border-yellow-50:focus {\n  border-color: var(--yellow-50) !important;\n}\n.focus\\:border-yellow-100:focus {\n  border-color: var(--yellow-100) !important;\n}\n.focus\\:border-yellow-200:focus {\n  border-color: var(--yellow-200) !important;\n}\n.focus\\:border-yellow-300:focus {\n  border-color: var(--yellow-300) !important;\n}\n.focus\\:border-yellow-400:focus {\n  border-color: var(--yellow-400) !important;\n}\n.focus\\:border-yellow-500:focus {\n  border-color: var(--yellow-500) !important;\n}\n.focus\\:border-yellow-600:focus {\n  border-color: var(--yellow-600) !important;\n}\n.focus\\:border-yellow-700:focus {\n  border-color: var(--yellow-700) !important;\n}\n.focus\\:border-yellow-800:focus {\n  border-color: var(--yellow-800) !important;\n}\n.focus\\:border-yellow-900:focus {\n  border-color: var(--yellow-900) !important;\n}\n\n.hover\\:border-yellow-50:hover {\n  border-color: var(--yellow-50) !important;\n}\n.hover\\:border-yellow-100:hover {\n  border-color: var(--yellow-100) !important;\n}\n.hover\\:border-yellow-200:hover {\n  border-color: var(--yellow-200) !important;\n}\n.hover\\:border-yellow-300:hover {\n  border-color: var(--yellow-300) !important;\n}\n.hover\\:border-yellow-400:hover {\n  border-color: var(--yellow-400) !important;\n}\n.hover\\:border-yellow-500:hover {\n  border-color: var(--yellow-500) !important;\n}\n.hover\\:border-yellow-600:hover {\n  border-color: var(--yellow-600) !important;\n}\n.hover\\:border-yellow-700:hover {\n  border-color: var(--yellow-700) !important;\n}\n.hover\\:border-yellow-800:hover {\n  border-color: var(--yellow-800) !important;\n}\n.hover\\:border-yellow-900:hover {\n  border-color: var(--yellow-900) !important;\n}\n\n.active\\:border-yellow-50:active {\n  border-color: var(--yellow-50) !important;\n}\n.active\\:border-yellow-100:active {\n  border-color: var(--yellow-100) !important;\n}\n.active\\:border-yellow-200:active {\n  border-color: var(--yellow-200) !important;\n}\n.active\\:border-yellow-300:active {\n  border-color: var(--yellow-300) !important;\n}\n.active\\:border-yellow-400:active {\n  border-color: var(--yellow-400) !important;\n}\n.active\\:border-yellow-500:active {\n  border-color: var(--yellow-500) !important;\n}\n.active\\:border-yellow-600:active {\n  border-color: var(--yellow-600) !important;\n}\n.active\\:border-yellow-700:active {\n  border-color: var(--yellow-700) !important;\n}\n.active\\:border-yellow-800:active {\n  border-color: var(--yellow-800) !important;\n}\n.active\\:border-yellow-900:active {\n  border-color: var(--yellow-900) !important;\n}\n\n.border-cyan-50 {\n  border-color: var(--cyan-50) !important;\n}\n.border-cyan-100 {\n  border-color: var(--cyan-100) !important;\n}\n.border-cyan-200 {\n  border-color: var(--cyan-200) !important;\n}\n.border-cyan-300 {\n  border-color: var(--cyan-300) !important;\n}\n.border-cyan-400 {\n  border-color: var(--cyan-400) !important;\n}\n.border-cyan-500 {\n  border-color: var(--cyan-500) !important;\n}\n.border-cyan-600 {\n  border-color: var(--cyan-600) !important;\n}\n.border-cyan-700 {\n  border-color: var(--cyan-700) !important;\n}\n.border-cyan-800 {\n  border-color: var(--cyan-800) !important;\n}\n.border-cyan-900 {\n  border-color: var(--cyan-900) !important;\n}\n\n.focus\\:border-cyan-50:focus {\n  border-color: var(--cyan-50) !important;\n}\n.focus\\:border-cyan-100:focus {\n  border-color: var(--cyan-100) !important;\n}\n.focus\\:border-cyan-200:focus {\n  border-color: var(--cyan-200) !important;\n}\n.focus\\:border-cyan-300:focus {\n  border-color: var(--cyan-300) !important;\n}\n.focus\\:border-cyan-400:focus {\n  border-color: var(--cyan-400) !important;\n}\n.focus\\:border-cyan-500:focus {\n  border-color: var(--cyan-500) !important;\n}\n.focus\\:border-cyan-600:focus {\n  border-color: var(--cyan-600) !important;\n}\n.focus\\:border-cyan-700:focus {\n  border-color: var(--cyan-700) !important;\n}\n.focus\\:border-cyan-800:focus {\n  border-color: var(--cyan-800) !important;\n}\n.focus\\:border-cyan-900:focus {\n  border-color: var(--cyan-900) !important;\n}\n\n.hover\\:border-cyan-50:hover {\n  border-color: var(--cyan-50) !important;\n}\n.hover\\:border-cyan-100:hover {\n  border-color: var(--cyan-100) !important;\n}\n.hover\\:border-cyan-200:hover {\n  border-color: var(--cyan-200) !important;\n}\n.hover\\:border-cyan-300:hover {\n  border-color: var(--cyan-300) !important;\n}\n.hover\\:border-cyan-400:hover {\n  border-color: var(--cyan-400) !important;\n}\n.hover\\:border-cyan-500:hover {\n  border-color: var(--cyan-500) !important;\n}\n.hover\\:border-cyan-600:hover {\n  border-color: var(--cyan-600) !important;\n}\n.hover\\:border-cyan-700:hover {\n  border-color: var(--cyan-700) !important;\n}\n.hover\\:border-cyan-800:hover {\n  border-color: var(--cyan-800) !important;\n}\n.hover\\:border-cyan-900:hover {\n  border-color: var(--cyan-900) !important;\n}\n\n.active\\:border-cyan-50:active {\n  border-color: var(--cyan-50) !important;\n}\n.active\\:border-cyan-100:active {\n  border-color: var(--cyan-100) !important;\n}\n.active\\:border-cyan-200:active {\n  border-color: var(--cyan-200) !important;\n}\n.active\\:border-cyan-300:active {\n  border-color: var(--cyan-300) !important;\n}\n.active\\:border-cyan-400:active {\n  border-color: var(--cyan-400) !important;\n}\n.active\\:border-cyan-500:active {\n  border-color: var(--cyan-500) !important;\n}\n.active\\:border-cyan-600:active {\n  border-color: var(--cyan-600) !important;\n}\n.active\\:border-cyan-700:active {\n  border-color: var(--cyan-700) !important;\n}\n.active\\:border-cyan-800:active {\n  border-color: var(--cyan-800) !important;\n}\n.active\\:border-cyan-900:active {\n  border-color: var(--cyan-900) !important;\n}\n\n.border-pink-50 {\n  border-color: var(--pink-50) !important;\n}\n.border-pink-100 {\n  border-color: var(--pink-100) !important;\n}\n.border-pink-200 {\n  border-color: var(--pink-200) !important;\n}\n.border-pink-300 {\n  border-color: var(--pink-300) !important;\n}\n.border-pink-400 {\n  border-color: var(--pink-400) !important;\n}\n.border-pink-500 {\n  border-color: var(--pink-500) !important;\n}\n.border-pink-600 {\n  border-color: var(--pink-600) !important;\n}\n.border-pink-700 {\n  border-color: var(--pink-700) !important;\n}\n.border-pink-800 {\n  border-color: var(--pink-800) !important;\n}\n.border-pink-900 {\n  border-color: var(--pink-900) !important;\n}\n\n.focus\\:border-pink-50:focus {\n  border-color: var(--pink-50) !important;\n}\n.focus\\:border-pink-100:focus {\n  border-color: var(--pink-100) !important;\n}\n.focus\\:border-pink-200:focus {\n  border-color: var(--pink-200) !important;\n}\n.focus\\:border-pink-300:focus {\n  border-color: var(--pink-300) !important;\n}\n.focus\\:border-pink-400:focus {\n  border-color: var(--pink-400) !important;\n}\n.focus\\:border-pink-500:focus {\n  border-color: var(--pink-500) !important;\n}\n.focus\\:border-pink-600:focus {\n  border-color: var(--pink-600) !important;\n}\n.focus\\:border-pink-700:focus {\n  border-color: var(--pink-700) !important;\n}\n.focus\\:border-pink-800:focus {\n  border-color: var(--pink-800) !important;\n}\n.focus\\:border-pink-900:focus {\n  border-color: var(--pink-900) !important;\n}\n\n.hover\\:border-pink-50:hover {\n  border-color: var(--pink-50) !important;\n}\n.hover\\:border-pink-100:hover {\n  border-color: var(--pink-100) !important;\n}\n.hover\\:border-pink-200:hover {\n  border-color: var(--pink-200) !important;\n}\n.hover\\:border-pink-300:hover {\n  border-color: var(--pink-300) !important;\n}\n.hover\\:border-pink-400:hover {\n  border-color: var(--pink-400) !important;\n}\n.hover\\:border-pink-500:hover {\n  border-color: var(--pink-500) !important;\n}\n.hover\\:border-pink-600:hover {\n  border-color: var(--pink-600) !important;\n}\n.hover\\:border-pink-700:hover {\n  border-color: var(--pink-700) !important;\n}\n.hover\\:border-pink-800:hover {\n  border-color: var(--pink-800) !important;\n}\n.hover\\:border-pink-900:hover {\n  border-color: var(--pink-900) !important;\n}\n\n.active\\:border-pink-50:active {\n  border-color: var(--pink-50) !important;\n}\n.active\\:border-pink-100:active {\n  border-color: var(--pink-100) !important;\n}\n.active\\:border-pink-200:active {\n  border-color: var(--pink-200) !important;\n}\n.active\\:border-pink-300:active {\n  border-color: var(--pink-300) !important;\n}\n.active\\:border-pink-400:active {\n  border-color: var(--pink-400) !important;\n}\n.active\\:border-pink-500:active {\n  border-color: var(--pink-500) !important;\n}\n.active\\:border-pink-600:active {\n  border-color: var(--pink-600) !important;\n}\n.active\\:border-pink-700:active {\n  border-color: var(--pink-700) !important;\n}\n.active\\:border-pink-800:active {\n  border-color: var(--pink-800) !important;\n}\n.active\\:border-pink-900:active {\n  border-color: var(--pink-900) !important;\n}\n\n.border-indigo-50 {\n  border-color: var(--indigo-50) !important;\n}\n.border-indigo-100 {\n  border-color: var(--indigo-100) !important;\n}\n.border-indigo-200 {\n  border-color: var(--indigo-200) !important;\n}\n.border-indigo-300 {\n  border-color: var(--indigo-300) !important;\n}\n.border-indigo-400 {\n  border-color: var(--indigo-400) !important;\n}\n.border-indigo-500 {\n  border-color: var(--indigo-500) !important;\n}\n.border-indigo-600 {\n  border-color: var(--indigo-600) !important;\n}\n.border-indigo-700 {\n  border-color: var(--indigo-700) !important;\n}\n.border-indigo-800 {\n  border-color: var(--indigo-800) !important;\n}\n.border-indigo-900 {\n  border-color: var(--indigo-900) !important;\n}\n\n.focus\\:border-indigo-50:focus {\n  border-color: var(--indigo-50) !important;\n}\n.focus\\:border-indigo-100:focus {\n  border-color: var(--indigo-100) !important;\n}\n.focus\\:border-indigo-200:focus {\n  border-color: var(--indigo-200) !important;\n}\n.focus\\:border-indigo-300:focus {\n  border-color: var(--indigo-300) !important;\n}\n.focus\\:border-indigo-400:focus {\n  border-color: var(--indigo-400) !important;\n}\n.focus\\:border-indigo-500:focus {\n  border-color: var(--indigo-500) !important;\n}\n.focus\\:border-indigo-600:focus {\n  border-color: var(--indigo-600) !important;\n}\n.focus\\:border-indigo-700:focus {\n  border-color: var(--indigo-700) !important;\n}\n.focus\\:border-indigo-800:focus {\n  border-color: var(--indigo-800) !important;\n}\n.focus\\:border-indigo-900:focus {\n  border-color: var(--indigo-900) !important;\n}\n\n.hover\\:border-indigo-50:hover {\n  border-color: var(--indigo-50) !important;\n}\n.hover\\:border-indigo-100:hover {\n  border-color: var(--indigo-100) !important;\n}\n.hover\\:border-indigo-200:hover {\n  border-color: var(--indigo-200) !important;\n}\n.hover\\:border-indigo-300:hover {\n  border-color: var(--indigo-300) !important;\n}\n.hover\\:border-indigo-400:hover {\n  border-color: var(--indigo-400) !important;\n}\n.hover\\:border-indigo-500:hover {\n  border-color: var(--indigo-500) !important;\n}\n.hover\\:border-indigo-600:hover {\n  border-color: var(--indigo-600) !important;\n}\n.hover\\:border-indigo-700:hover {\n  border-color: var(--indigo-700) !important;\n}\n.hover\\:border-indigo-800:hover {\n  border-color: var(--indigo-800) !important;\n}\n.hover\\:border-indigo-900:hover {\n  border-color: var(--indigo-900) !important;\n}\n\n.active\\:border-indigo-50:active {\n  border-color: var(--indigo-50) !important;\n}\n.active\\:border-indigo-100:active {\n  border-color: var(--indigo-100) !important;\n}\n.active\\:border-indigo-200:active {\n  border-color: var(--indigo-200) !important;\n}\n.active\\:border-indigo-300:active {\n  border-color: var(--indigo-300) !important;\n}\n.active\\:border-indigo-400:active {\n  border-color: var(--indigo-400) !important;\n}\n.active\\:border-indigo-500:active {\n  border-color: var(--indigo-500) !important;\n}\n.active\\:border-indigo-600:active {\n  border-color: var(--indigo-600) !important;\n}\n.active\\:border-indigo-700:active {\n  border-color: var(--indigo-700) !important;\n}\n.active\\:border-indigo-800:active {\n  border-color: var(--indigo-800) !important;\n}\n.active\\:border-indigo-900:active {\n  border-color: var(--indigo-900) !important;\n}\n\n.border-teal-50 {\n  border-color: var(--teal-50) !important;\n}\n.border-teal-100 {\n  border-color: var(--teal-100) !important;\n}\n.border-teal-200 {\n  border-color: var(--teal-200) !important;\n}\n.border-teal-300 {\n  border-color: var(--teal-300) !important;\n}\n.border-teal-400 {\n  border-color: var(--teal-400) !important;\n}\n.border-teal-500 {\n  border-color: var(--teal-500) !important;\n}\n.border-teal-600 {\n  border-color: var(--teal-600) !important;\n}\n.border-teal-700 {\n  border-color: var(--teal-700) !important;\n}\n.border-teal-800 {\n  border-color: var(--teal-800) !important;\n}\n.border-teal-900 {\n  border-color: var(--teal-900) !important;\n}\n\n.focus\\:border-teal-50:focus {\n  border-color: var(--teal-50) !important;\n}\n.focus\\:border-teal-100:focus {\n  border-color: var(--teal-100) !important;\n}\n.focus\\:border-teal-200:focus {\n  border-color: var(--teal-200) !important;\n}\n.focus\\:border-teal-300:focus {\n  border-color: var(--teal-300) !important;\n}\n.focus\\:border-teal-400:focus {\n  border-color: var(--teal-400) !important;\n}\n.focus\\:border-teal-500:focus {\n  border-color: var(--teal-500) !important;\n}\n.focus\\:border-teal-600:focus {\n  border-color: var(--teal-600) !important;\n}\n.focus\\:border-teal-700:focus {\n  border-color: var(--teal-700) !important;\n}\n.focus\\:border-teal-800:focus {\n  border-color: var(--teal-800) !important;\n}\n.focus\\:border-teal-900:focus {\n  border-color: var(--teal-900) !important;\n}\n\n.hover\\:border-teal-50:hover {\n  border-color: var(--teal-50) !important;\n}\n.hover\\:border-teal-100:hover {\n  border-color: var(--teal-100) !important;\n}\n.hover\\:border-teal-200:hover {\n  border-color: var(--teal-200) !important;\n}\n.hover\\:border-teal-300:hover {\n  border-color: var(--teal-300) !important;\n}\n.hover\\:border-teal-400:hover {\n  border-color: var(--teal-400) !important;\n}\n.hover\\:border-teal-500:hover {\n  border-color: var(--teal-500) !important;\n}\n.hover\\:border-teal-600:hover {\n  border-color: var(--teal-600) !important;\n}\n.hover\\:border-teal-700:hover {\n  border-color: var(--teal-700) !important;\n}\n.hover\\:border-teal-800:hover {\n  border-color: var(--teal-800) !important;\n}\n.hover\\:border-teal-900:hover {\n  border-color: var(--teal-900) !important;\n}\n\n.active\\:border-teal-50:active {\n  border-color: var(--teal-50) !important;\n}\n.active\\:border-teal-100:active {\n  border-color: var(--teal-100) !important;\n}\n.active\\:border-teal-200:active {\n  border-color: var(--teal-200) !important;\n}\n.active\\:border-teal-300:active {\n  border-color: var(--teal-300) !important;\n}\n.active\\:border-teal-400:active {\n  border-color: var(--teal-400) !important;\n}\n.active\\:border-teal-500:active {\n  border-color: var(--teal-500) !important;\n}\n.active\\:border-teal-600:active {\n  border-color: var(--teal-600) !important;\n}\n.active\\:border-teal-700:active {\n  border-color: var(--teal-700) !important;\n}\n.active\\:border-teal-800:active {\n  border-color: var(--teal-800) !important;\n}\n.active\\:border-teal-900:active {\n  border-color: var(--teal-900) !important;\n}\n\n.border-orange-50 {\n  border-color: var(--orange-50) !important;\n}\n.border-orange-100 {\n  border-color: var(--orange-100) !important;\n}\n.border-orange-200 {\n  border-color: var(--orange-200) !important;\n}\n.border-orange-300 {\n  border-color: var(--orange-300) !important;\n}\n.border-orange-400 {\n  border-color: var(--orange-400) !important;\n}\n.border-orange-500 {\n  border-color: var(--orange-500) !important;\n}\n.border-orange-600 {\n  border-color: var(--orange-600) !important;\n}\n.border-orange-700 {\n  border-color: var(--orange-700) !important;\n}\n.border-orange-800 {\n  border-color: var(--orange-800) !important;\n}\n.border-orange-900 {\n  border-color: var(--orange-900) !important;\n}\n\n.focus\\:border-orange-50:focus {\n  border-color: var(--orange-50) !important;\n}\n.focus\\:border-orange-100:focus {\n  border-color: var(--orange-100) !important;\n}\n.focus\\:border-orange-200:focus {\n  border-color: var(--orange-200) !important;\n}\n.focus\\:border-orange-300:focus {\n  border-color: var(--orange-300) !important;\n}\n.focus\\:border-orange-400:focus {\n  border-color: var(--orange-400) !important;\n}\n.focus\\:border-orange-500:focus {\n  border-color: var(--orange-500) !important;\n}\n.focus\\:border-orange-600:focus {\n  border-color: var(--orange-600) !important;\n}\n.focus\\:border-orange-700:focus {\n  border-color: var(--orange-700) !important;\n}\n.focus\\:border-orange-800:focus {\n  border-color: var(--orange-800) !important;\n}\n.focus\\:border-orange-900:focus {\n  border-color: var(--orange-900) !important;\n}\n\n.hover\\:border-orange-50:hover {\n  border-color: var(--orange-50) !important;\n}\n.hover\\:border-orange-100:hover {\n  border-color: var(--orange-100) !important;\n}\n.hover\\:border-orange-200:hover {\n  border-color: var(--orange-200) !important;\n}\n.hover\\:border-orange-300:hover {\n  border-color: var(--orange-300) !important;\n}\n.hover\\:border-orange-400:hover {\n  border-color: var(--orange-400) !important;\n}\n.hover\\:border-orange-500:hover {\n  border-color: var(--orange-500) !important;\n}\n.hover\\:border-orange-600:hover {\n  border-color: var(--orange-600) !important;\n}\n.hover\\:border-orange-700:hover {\n  border-color: var(--orange-700) !important;\n}\n.hover\\:border-orange-800:hover {\n  border-color: var(--orange-800) !important;\n}\n.hover\\:border-orange-900:hover {\n  border-color: var(--orange-900) !important;\n}\n\n.active\\:border-orange-50:active {\n  border-color: var(--orange-50) !important;\n}\n.active\\:border-orange-100:active {\n  border-color: var(--orange-100) !important;\n}\n.active\\:border-orange-200:active {\n  border-color: var(--orange-200) !important;\n}\n.active\\:border-orange-300:active {\n  border-color: var(--orange-300) !important;\n}\n.active\\:border-orange-400:active {\n  border-color: var(--orange-400) !important;\n}\n.active\\:border-orange-500:active {\n  border-color: var(--orange-500) !important;\n}\n.active\\:border-orange-600:active {\n  border-color: var(--orange-600) !important;\n}\n.active\\:border-orange-700:active {\n  border-color: var(--orange-700) !important;\n}\n.active\\:border-orange-800:active {\n  border-color: var(--orange-800) !important;\n}\n.active\\:border-orange-900:active {\n  border-color: var(--orange-900) !important;\n}\n\n.border-bluegray-50 {\n  border-color: var(--bluegray-50) !important;\n}\n.border-bluegray-100 {\n  border-color: var(--bluegray-100) !important;\n}\n.border-bluegray-200 {\n  border-color: var(--bluegray-200) !important;\n}\n.border-bluegray-300 {\n  border-color: var(--bluegray-300) !important;\n}\n.border-bluegray-400 {\n  border-color: var(--bluegray-400) !important;\n}\n.border-bluegray-500 {\n  border-color: var(--bluegray-500) !important;\n}\n.border-bluegray-600 {\n  border-color: var(--bluegray-600) !important;\n}\n.border-bluegray-700 {\n  border-color: var(--bluegray-700) !important;\n}\n.border-bluegray-800 {\n  border-color: var(--bluegray-800) !important;\n}\n.border-bluegray-900 {\n  border-color: var(--bluegray-900) !important;\n}\n\n.focus\\:border-bluegray-50:focus {\n  border-color: var(--bluegray-50) !important;\n}\n.focus\\:border-bluegray-100:focus {\n  border-color: var(--bluegray-100) !important;\n}\n.focus\\:border-bluegray-200:focus {\n  border-color: var(--bluegray-200) !important;\n}\n.focus\\:border-bluegray-300:focus {\n  border-color: var(--bluegray-300) !important;\n}\n.focus\\:border-bluegray-400:focus {\n  border-color: var(--bluegray-400) !important;\n}\n.focus\\:border-bluegray-500:focus {\n  border-color: var(--bluegray-500) !important;\n}\n.focus\\:border-bluegray-600:focus {\n  border-color: var(--bluegray-600) !important;\n}\n.focus\\:border-bluegray-700:focus {\n  border-color: var(--bluegray-700) !important;\n}\n.focus\\:border-bluegray-800:focus {\n  border-color: var(--bluegray-800) !important;\n}\n.focus\\:border-bluegray-900:focus {\n  border-color: var(--bluegray-900) !important;\n}\n\n.hover\\:border-bluegray-50:hover {\n  border-color: var(--bluegray-50) !important;\n}\n.hover\\:border-bluegray-100:hover {\n  border-color: var(--bluegray-100) !important;\n}\n.hover\\:border-bluegray-200:hover {\n  border-color: var(--bluegray-200) !important;\n}\n.hover\\:border-bluegray-300:hover {\n  border-color: var(--bluegray-300) !important;\n}\n.hover\\:border-bluegray-400:hover {\n  border-color: var(--bluegray-400) !important;\n}\n.hover\\:border-bluegray-500:hover {\n  border-color: var(--bluegray-500) !important;\n}\n.hover\\:border-bluegray-600:hover {\n  border-color: var(--bluegray-600) !important;\n}\n.hover\\:border-bluegray-700:hover {\n  border-color: var(--bluegray-700) !important;\n}\n.hover\\:border-bluegray-800:hover {\n  border-color: var(--bluegray-800) !important;\n}\n.hover\\:border-bluegray-900:hover {\n  border-color: var(--bluegray-900) !important;\n}\n\n.active\\:border-bluegray-50:active {\n  border-color: var(--bluegray-50) !important;\n}\n.active\\:border-bluegray-100:active {\n  border-color: var(--bluegray-100) !important;\n}\n.active\\:border-bluegray-200:active {\n  border-color: var(--bluegray-200) !important;\n}\n.active\\:border-bluegray-300:active {\n  border-color: var(--bluegray-300) !important;\n}\n.active\\:border-bluegray-400:active {\n  border-color: var(--bluegray-400) !important;\n}\n.active\\:border-bluegray-500:active {\n  border-color: var(--bluegray-500) !important;\n}\n.active\\:border-bluegray-600:active {\n  border-color: var(--bluegray-600) !important;\n}\n.active\\:border-bluegray-700:active {\n  border-color: var(--bluegray-700) !important;\n}\n.active\\:border-bluegray-800:active {\n  border-color: var(--bluegray-800) !important;\n}\n.active\\:border-bluegray-900:active {\n  border-color: var(--bluegray-900) !important;\n}\n\n.border-purple-50 {\n  border-color: var(--purple-50) !important;\n}\n.border-purple-100 {\n  border-color: var(--purple-100) !important;\n}\n.border-purple-200 {\n  border-color: var(--purple-200) !important;\n}\n.border-purple-300 {\n  border-color: var(--purple-300) !important;\n}\n.border-purple-400 {\n  border-color: var(--purple-400) !important;\n}\n.border-purple-500 {\n  border-color: var(--purple-500) !important;\n}\n.border-purple-600 {\n  border-color: var(--purple-600) !important;\n}\n.border-purple-700 {\n  border-color: var(--purple-700) !important;\n}\n.border-purple-800 {\n  border-color: var(--purple-800) !important;\n}\n.border-purple-900 {\n  border-color: var(--purple-900) !important;\n}\n\n.focus\\:border-purple-50:focus {\n  border-color: var(--purple-50) !important;\n}\n.focus\\:border-purple-100:focus {\n  border-color: var(--purple-100) !important;\n}\n.focus\\:border-purple-200:focus {\n  border-color: var(--purple-200) !important;\n}\n.focus\\:border-purple-300:focus {\n  border-color: var(--purple-300) !important;\n}\n.focus\\:border-purple-400:focus {\n  border-color: var(--purple-400) !important;\n}\n.focus\\:border-purple-500:focus {\n  border-color: var(--purple-500) !important;\n}\n.focus\\:border-purple-600:focus {\n  border-color: var(--purple-600) !important;\n}\n.focus\\:border-purple-700:focus {\n  border-color: var(--purple-700) !important;\n}\n.focus\\:border-purple-800:focus {\n  border-color: var(--purple-800) !important;\n}\n.focus\\:border-purple-900:focus {\n  border-color: var(--purple-900) !important;\n}\n\n.hover\\:border-purple-50:hover {\n  border-color: var(--purple-50) !important;\n}\n.hover\\:border-purple-100:hover {\n  border-color: var(--purple-100) !important;\n}\n.hover\\:border-purple-200:hover {\n  border-color: var(--purple-200) !important;\n}\n.hover\\:border-purple-300:hover {\n  border-color: var(--purple-300) !important;\n}\n.hover\\:border-purple-400:hover {\n  border-color: var(--purple-400) !important;\n}\n.hover\\:border-purple-500:hover {\n  border-color: var(--purple-500) !important;\n}\n.hover\\:border-purple-600:hover {\n  border-color: var(--purple-600) !important;\n}\n.hover\\:border-purple-700:hover {\n  border-color: var(--purple-700) !important;\n}\n.hover\\:border-purple-800:hover {\n  border-color: var(--purple-800) !important;\n}\n.hover\\:border-purple-900:hover {\n  border-color: var(--purple-900) !important;\n}\n\n.active\\:border-purple-50:active {\n  border-color: var(--purple-50) !important;\n}\n.active\\:border-purple-100:active {\n  border-color: var(--purple-100) !important;\n}\n.active\\:border-purple-200:active {\n  border-color: var(--purple-200) !important;\n}\n.active\\:border-purple-300:active {\n  border-color: var(--purple-300) !important;\n}\n.active\\:border-purple-400:active {\n  border-color: var(--purple-400) !important;\n}\n.active\\:border-purple-500:active {\n  border-color: var(--purple-500) !important;\n}\n.active\\:border-purple-600:active {\n  border-color: var(--purple-600) !important;\n}\n.active\\:border-purple-700:active {\n  border-color: var(--purple-700) !important;\n}\n.active\\:border-purple-800:active {\n  border-color: var(--purple-800) !important;\n}\n.active\\:border-purple-900:active {\n  border-color: var(--purple-900) !important;\n}\n\n.border-gray-50 {\n  border-color: var(--gray-50) !important;\n}\n.border-gray-100 {\n  border-color: var(--gray-100) !important;\n}\n.border-gray-200 {\n  border-color: var(--gray-200) !important;\n}\n.border-gray-300 {\n  border-color: var(--gray-300) !important;\n}\n.border-gray-400 {\n  border-color: var(--gray-400) !important;\n}\n.border-gray-500 {\n  border-color: var(--gray-500) !important;\n}\n.border-gray-600 {\n  border-color: var(--gray-600) !important;\n}\n.border-gray-700 {\n  border-color: var(--gray-700) !important;\n}\n.border-gray-800 {\n  border-color: var(--gray-800) !important;\n}\n.border-gray-900 {\n  border-color: var(--gray-900) !important;\n}\n\n.focus\\:border-gray-50:focus {\n  border-color: var(--gray-50) !important;\n}\n.focus\\:border-gray-100:focus {\n  border-color: var(--gray-100) !important;\n}\n.focus\\:border-gray-200:focus {\n  border-color: var(--gray-200) !important;\n}\n.focus\\:border-gray-300:focus {\n  border-color: var(--gray-300) !important;\n}\n.focus\\:border-gray-400:focus {\n  border-color: var(--gray-400) !important;\n}\n.focus\\:border-gray-500:focus {\n  border-color: var(--gray-500) !important;\n}\n.focus\\:border-gray-600:focus {\n  border-color: var(--gray-600) !important;\n}\n.focus\\:border-gray-700:focus {\n  border-color: var(--gray-700) !important;\n}\n.focus\\:border-gray-800:focus {\n  border-color: var(--gray-800) !important;\n}\n.focus\\:border-gray-900:focus {\n  border-color: var(--gray-900) !important;\n}\n\n.hover\\:border-gray-50:hover {\n  border-color: var(--gray-50) !important;\n}\n.hover\\:border-gray-100:hover {\n  border-color: var(--gray-100) !important;\n}\n.hover\\:border-gray-200:hover {\n  border-color: var(--gray-200) !important;\n}\n.hover\\:border-gray-300:hover {\n  border-color: var(--gray-300) !important;\n}\n.hover\\:border-gray-400:hover {\n  border-color: var(--gray-400) !important;\n}\n.hover\\:border-gray-500:hover {\n  border-color: var(--gray-500) !important;\n}\n.hover\\:border-gray-600:hover {\n  border-color: var(--gray-600) !important;\n}\n.hover\\:border-gray-700:hover {\n  border-color: var(--gray-700) !important;\n}\n.hover\\:border-gray-800:hover {\n  border-color: var(--gray-800) !important;\n}\n.hover\\:border-gray-900:hover {\n  border-color: var(--gray-900) !important;\n}\n\n.active\\:border-gray-50:active {\n  border-color: var(--gray-50) !important;\n}\n.active\\:border-gray-100:active {\n  border-color: var(--gray-100) !important;\n}\n.active\\:border-gray-200:active {\n  border-color: var(--gray-200) !important;\n}\n.active\\:border-gray-300:active {\n  border-color: var(--gray-300) !important;\n}\n.active\\:border-gray-400:active {\n  border-color: var(--gray-400) !important;\n}\n.active\\:border-gray-500:active {\n  border-color: var(--gray-500) !important;\n}\n.active\\:border-gray-600:active {\n  border-color: var(--gray-600) !important;\n}\n.active\\:border-gray-700:active {\n  border-color: var(--gray-700) !important;\n}\n.active\\:border-gray-800:active {\n  border-color: var(--gray-800) !important;\n}\n.active\\:border-gray-900:active {\n  border-color: var(--gray-900) !important;\n}\n\n.bg-white-alpha-10 {\n  background-color: rgba(255,255,255,0.1) !important;\n}\n.bg-white-alpha-20 {\n  background-color: rgba(255,255,255,0.2) !important;\n}\n.bg-white-alpha-30 {\n  background-color: rgba(255,255,255,0.3) !important;\n}\n.bg-white-alpha-40 {\n  background-color: rgba(255,255,255,0.4) !important;\n}\n.bg-white-alpha-50 {\n  background-color: rgba(255,255,255,0.5) !important;\n}\n.bg-white-alpha-60 {\n  background-color: rgba(255,255,255,0.6) !important;\n}\n.bg-white-alpha-70 {\n  background-color: rgba(255,255,255,0.7) !important;\n}\n.bg-white-alpha-80 {\n  background-color: rgba(255,255,255,0.8) !important;\n}\n.bg-white-alpha-90 {\n  background-color: rgba(255,255,255,0.9) !important;\n}\n\n.hover\\:bg-white-alpha-10:hover {\n  background-color: rgba(255,255,255,0.1) !important;\n}\n.hover\\:bg-white-alpha-20:hover {\n  background-color: rgba(255,255,255,0.2) !important;\n}\n.hover\\:bg-white-alpha-30:hover {\n  background-color: rgba(255,255,255,0.3) !important;\n}\n.hover\\:bg-white-alpha-40:hover {\n  background-color: rgba(255,255,255,0.4) !important;\n}\n.hover\\:bg-white-alpha-50:hover {\n  background-color: rgba(255,255,255,0.5) !important;\n}\n.hover\\:bg-white-alpha-60:hover {\n  background-color: rgba(255,255,255,0.6) !important;\n}\n.hover\\:bg-white-alpha-70:hover {\n  background-color: rgba(255,255,255,0.7) !important;\n}\n.hover\\:bg-white-alpha-80:hover {\n  background-color: rgba(255,255,255,0.8) !important;\n}\n.hover\\:bg-white-alpha-90:hover {\n  background-color: rgba(255,255,255,0.9) !important;\n}\n\n.focus\\:bg-white-alpha-10:focus {\n  background-color: rgba(255,255,255,0.1) !important;\n}\n.focus\\:bg-white-alpha-20:focus {\n  background-color: rgba(255,255,255,0.2) !important;\n}\n.focus\\:bg-white-alpha-30:focus {\n  background-color: rgba(255,255,255,0.3) !important;\n}\n.focus\\:bg-white-alpha-40:focus {\n  background-color: rgba(255,255,255,0.4) !important;\n}\n.focus\\:bg-white-alpha-50:focus {\n  background-color: rgba(255,255,255,0.5) !important;\n}\n.focus\\:bg-white-alpha-60:focus {\n  background-color: rgba(255,255,255,0.6) !important;\n}\n.focus\\:bg-white-alpha-70:focus {\n  background-color: rgba(255,255,255,0.7) !important;\n}\n.focus\\:bg-white-alpha-80:focus {\n  background-color: rgba(255,255,255,0.8) !important;\n}\n.focus\\:bg-white-alpha-90:focus {\n  background-color: rgba(255,255,255,0.9) !important;\n}\n\n.active\\:bg-white-alpha-10:active {\n  background-color: rgba(255,255,255,0.1) !important;\n}\n.active\\:bg-white-alpha-20:active {\n  background-color: rgba(255,255,255,0.2) !important;\n}\n.active\\:bg-white-alpha-30:active {\n  background-color: rgba(255,255,255,0.3) !important;\n}\n.active\\:bg-white-alpha-40:active {\n  background-color: rgba(255,255,255,0.4) !important;\n}\n.active\\:bg-white-alpha-50:active {\n  background-color: rgba(255,255,255,0.5) !important;\n}\n.active\\:bg-white-alpha-60:active {\n  background-color: rgba(255,255,255,0.6) !important;\n}\n.active\\:bg-white-alpha-70:active {\n  background-color: rgba(255,255,255,0.7) !important;\n}\n.active\\:bg-white-alpha-80:active {\n  background-color: rgba(255,255,255,0.8) !important;\n}\n.active\\:bg-white-alpha-90:active {\n  background-color: rgba(255,255,255,0.9) !important;\n}\n\n.bg-black-alpha-10 {\n  background-color: rgba(0,0,0,0.1) !important;\n}\n.bg-black-alpha-20 {\n  background-color: rgba(0,0,0,0.2) !important;\n}\n.bg-black-alpha-30 {\n  background-color: rgba(0,0,0,0.3) !important;\n}\n.bg-black-alpha-40 {\n  background-color: rgba(0,0,0,0.4) !important;\n}\n.bg-black-alpha-50 {\n  background-color: rgba(0,0,0,0.5) !important;\n}\n.bg-black-alpha-60 {\n  background-color: rgba(0,0,0,0.6) !important;\n}\n.bg-black-alpha-70 {\n  background-color: rgba(0,0,0,0.7) !important;\n}\n.bg-black-alpha-80 {\n  background-color: rgba(0,0,0,0.8) !important;\n}\n.bg-black-alpha-90 {\n  background-color: rgba(0,0,0,0.9) !important;\n}\n\n.hover\\:bg-black-alpha-10:hover {\n  background-color: rgba(0,0,0,0.1) !important;\n}\n.hover\\:bg-black-alpha-20:hover {\n  background-color: rgba(0,0,0,0.2) !important;\n}\n.hover\\:bg-black-alpha-30:hover {\n  background-color: rgba(0,0,0,0.3) !important;\n}\n.hover\\:bg-black-alpha-40:hover {\n  background-color: rgba(0,0,0,0.4) !important;\n}\n.hover\\:bg-black-alpha-50:hover {\n  background-color: rgba(0,0,0,0.5) !important;\n}\n.hover\\:bg-black-alpha-60:hover {\n  background-color: rgba(0,0,0,0.6) !important;\n}\n.hover\\:bg-black-alpha-70:hover {\n  background-color: rgba(0,0,0,0.7) !important;\n}\n.hover\\:bg-black-alpha-80:hover {\n  background-color: rgba(0,0,0,0.8) !important;\n}\n.hover\\:bg-black-alpha-90:hover {\n  background-color: rgba(0,0,0,0.9) !important;\n}\n\n.focus\\:bg-black-alpha-10:focus {\n  background-color: rgba(0,0,0,0.1) !important;\n}\n.focus\\:bg-black-alpha-20:focus {\n  background-color: rgba(0,0,0,0.2) !important;\n}\n.focus\\:bg-black-alpha-30:focus {\n  background-color: rgba(0,0,0,0.3) !important;\n}\n.focus\\:bg-black-alpha-40:focus {\n  background-color: rgba(0,0,0,0.4) !important;\n}\n.focus\\:bg-black-alpha-50:focus {\n  background-color: rgba(0,0,0,0.5) !important;\n}\n.focus\\:bg-black-alpha-60:focus {\n  background-color: rgba(0,0,0,0.6) !important;\n}\n.focus\\:bg-black-alpha-70:focus {\n  background-color: rgba(0,0,0,0.7) !important;\n}\n.focus\\:bg-black-alpha-80:focus {\n  background-color: rgba(0,0,0,0.8) !important;\n}\n.focus\\:bg-black-alpha-90:focus {\n  background-color: rgba(0,0,0,0.9) !important;\n}\n\n.active\\:bg-black-alpha-10:active {\n  background-color: rgba(0,0,0,0.1) !important;\n}\n.active\\:bg-black-alpha-20:active {\n  background-color: rgba(0,0,0,0.2) !important;\n}\n.active\\:bg-black-alpha-30:active {\n  background-color: rgba(0,0,0,0.3) !important;\n}\n.active\\:bg-black-alpha-40:active {\n  background-color: rgba(0,0,0,0.4) !important;\n}\n.active\\:bg-black-alpha-50:active {\n  background-color: rgba(0,0,0,0.5) !important;\n}\n.active\\:bg-black-alpha-60:active {\n  background-color: rgba(0,0,0,0.6) !important;\n}\n.active\\:bg-black-alpha-70:active {\n  background-color: rgba(0,0,0,0.7) !important;\n}\n.active\\:bg-black-alpha-80:active {\n  background-color: rgba(0,0,0,0.8) !important;\n}\n.active\\:bg-black-alpha-90:active {\n  background-color: rgba(0,0,0,0.9) !important;\n}\n\n.border-white-alpha-10 {\n  border-color: rgba(255,255,255,0.1) !important;\n}\n.border-white-alpha-20 {\n  border-color: rgba(255,255,255,0.2) !important;\n}\n.border-white-alpha-30 {\n  border-color: rgba(255,255,255,0.3) !important;\n}\n.border-white-alpha-40 {\n  border-color: rgba(255,255,255,0.4) !important;\n}\n.border-white-alpha-50 {\n  border-color: rgba(255,255,255,0.5) !important;\n}\n.border-white-alpha-60 {\n  border-color: rgba(255,255,255,0.6) !important;\n}\n.border-white-alpha-70 {\n  border-color: rgba(255,255,255,0.7) !important;\n}\n.border-white-alpha-80 {\n  border-color: rgba(255,255,255,0.8) !important;\n}\n.border-white-alpha-90 {\n  border-color: rgba(255,255,255,0.9) !important;\n}\n\n.hover\\:border-white-alpha-10:hover {\n  border-color: rgba(255,255,255,0.1) !important;\n}\n.hover\\:border-white-alpha-20:hover {\n  border-color: rgba(255,255,255,0.2) !important;\n}\n.hover\\:border-white-alpha-30:hover {\n  border-color: rgba(255,255,255,0.3) !important;\n}\n.hover\\:border-white-alpha-40:hover {\n  border-color: rgba(255,255,255,0.4) !important;\n}\n.hover\\:border-white-alpha-50:hover {\n  border-color: rgba(255,255,255,0.5) !important;\n}\n.hover\\:border-white-alpha-60:hover {\n  border-color: rgba(255,255,255,0.6) !important;\n}\n.hover\\:border-white-alpha-70:hover {\n  border-color: rgba(255,255,255,0.7) !important;\n}\n.hover\\:border-white-alpha-80:hover {\n  border-color: rgba(255,255,255,0.8) !important;\n}\n.hover\\:border-white-alpha-90:hover {\n  border-color: rgba(255,255,255,0.9) !important;\n}\n\n.focus\\:border-white-alpha-10:focus {\n  border-color: rgba(255,255,255,0.1) !important;\n}\n.focus\\:border-white-alpha-20:focus {\n  border-color: rgba(255,255,255,0.2) !important;\n}\n.focus\\:border-white-alpha-30:focus {\n  border-color: rgba(255,255,255,0.3) !important;\n}\n.focus\\:border-white-alpha-40:focus {\n  border-color: rgba(255,255,255,0.4) !important;\n}\n.focus\\:border-white-alpha-50:focus {\n  border-color: rgba(255,255,255,0.5) !important;\n}\n.focus\\:border-white-alpha-60:focus {\n  border-color: rgba(255,255,255,0.6) !important;\n}\n.focus\\:border-white-alpha-70:focus {\n  border-color: rgba(255,255,255,0.7) !important;\n}\n.focus\\:border-white-alpha-80:focus {\n  border-color: rgba(255,255,255,0.8) !important;\n}\n.focus\\:border-white-alpha-90:focus {\n  border-color: rgba(255,255,255,0.9) !important;\n}\n\n.active\\:border-white-alpha-10:active {\n  border-color: rgba(255,255,255,0.1) !important;\n}\n.active\\:border-white-alpha-20:active {\n  border-color: rgba(255,255,255,0.2) !important;\n}\n.active\\:border-white-alpha-30:active {\n  border-color: rgba(255,255,255,0.3) !important;\n}\n.active\\:border-white-alpha-40:active {\n  border-color: rgba(255,255,255,0.4) !important;\n}\n.active\\:border-white-alpha-50:active {\n  border-color: rgba(255,255,255,0.5) !important;\n}\n.active\\:border-white-alpha-60:active {\n  border-color: rgba(255,255,255,0.6) !important;\n}\n.active\\:border-white-alpha-70:active {\n  border-color: rgba(255,255,255,0.7) !important;\n}\n.active\\:border-white-alpha-80:active {\n  border-color: rgba(255,255,255,0.8) !important;\n}\n.active\\:border-white-alpha-90:active {\n  border-color: rgba(255,255,255,0.9) !important;\n}\n\n.border-black-alpha-10 {\n  border-color: rgba(0,0,0,0.1) !important;\n}\n.border-black-alpha-20 {\n  border-color: rgba(0,0,0,0.2) !important;\n}\n.border-black-alpha-30 {\n  border-color: rgba(0,0,0,0.3) !important;\n}\n.border-black-alpha-40 {\n  border-color: rgba(0,0,0,0.4) !important;\n}\n.border-black-alpha-50 {\n  border-color: rgba(0,0,0,0.5) !important;\n}\n.border-black-alpha-60 {\n  border-color: rgba(0,0,0,0.6) !important;\n}\n.border-black-alpha-70 {\n  border-color: rgba(0,0,0,0.7) !important;\n}\n.border-black-alpha-80 {\n  border-color: rgba(0,0,0,0.8) !important;\n}\n.border-black-alpha-90 {\n  border-color: rgba(0,0,0,0.9) !important;\n}\n\n.hover\\:border-black-alpha-10:hover {\n  border-color: rgba(0,0,0,0.1) !important;\n}\n.hover\\:border-black-alpha-20:hover {\n  border-color: rgba(0,0,0,0.2) !important;\n}\n.hover\\:border-black-alpha-30:hover {\n  border-color: rgba(0,0,0,0.3) !important;\n}\n.hover\\:border-black-alpha-40:hover {\n  border-color: rgba(0,0,0,0.4) !important;\n}\n.hover\\:border-black-alpha-50:hover {\n  border-color: rgba(0,0,0,0.5) !important;\n}\n.hover\\:border-black-alpha-60:hover {\n  border-color: rgba(0,0,0,0.6) !important;\n}\n.hover\\:border-black-alpha-70:hover {\n  border-color: rgba(0,0,0,0.7) !important;\n}\n.hover\\:border-black-alpha-80:hover {\n  border-color: rgba(0,0,0,0.8) !important;\n}\n.hover\\:border-black-alpha-90:hover {\n  border-color: rgba(0,0,0,0.9) !important;\n}\n\n.focus\\:border-black-alpha-10:focus {\n  border-color: rgba(0,0,0,0.1) !important;\n}\n.focus\\:border-black-alpha-20:focus {\n  border-color: rgba(0,0,0,0.2) !important;\n}\n.focus\\:border-black-alpha-30:focus {\n  border-color: rgba(0,0,0,0.3) !important;\n}\n.focus\\:border-black-alpha-40:focus {\n  border-color: rgba(0,0,0,0.4) !important;\n}\n.focus\\:border-black-alpha-50:focus {\n  border-color: rgba(0,0,0,0.5) !important;\n}\n.focus\\:border-black-alpha-60:focus {\n  border-color: rgba(0,0,0,0.6) !important;\n}\n.focus\\:border-black-alpha-70:focus {\n  border-color: rgba(0,0,0,0.7) !important;\n}\n.focus\\:border-black-alpha-80:focus {\n  border-color: rgba(0,0,0,0.8) !important;\n}\n.focus\\:border-black-alpha-90:focus {\n  border-color: rgba(0,0,0,0.9) !important;\n}\n\n.active\\:border-black-alpha-10:active {\n  border-color: rgba(0,0,0,0.1) !important;\n}\n.active\\:border-black-alpha-20:active {\n  border-color: rgba(0,0,0,0.2) !important;\n}\n.active\\:border-black-alpha-30:active {\n  border-color: rgba(0,0,0,0.3) !important;\n}\n.active\\:border-black-alpha-40:active {\n  border-color: rgba(0,0,0,0.4) !important;\n}\n.active\\:border-black-alpha-50:active {\n  border-color: rgba(0,0,0,0.5) !important;\n}\n.active\\:border-black-alpha-60:active {\n  border-color: rgba(0,0,0,0.6) !important;\n}\n.active\\:border-black-alpha-70:active {\n  border-color: rgba(0,0,0,0.7) !important;\n}\n.active\\:border-black-alpha-80:active {\n  border-color: rgba(0,0,0,0.8) !important;\n}\n.active\\:border-black-alpha-90:active {\n  border-color: rgba(0,0,0,0.9) !important;\n}\n\n.text-white-alpha-10 {\n  color: rgba(255,255,255,0.1) !important;\n}\n.text-white-alpha-20 {\n  color: rgba(255,255,255,0.2) !important;\n}\n.text-white-alpha-30 {\n  color: rgba(255,255,255,0.3) !important;\n}\n.text-white-alpha-40 {\n  color: rgba(255,255,255,0.4) !important;\n}\n.text-white-alpha-50 {\n  color: rgba(255,255,255,0.5) !important;\n}\n.text-white-alpha-60 {\n  color: rgba(255,255,255,0.6) !important;\n}\n.text-white-alpha-70 {\n  color: rgba(255,255,255,0.7) !important;\n}\n.text-white-alpha-80 {\n  color: rgba(255,255,255,0.8) !important;\n}\n.text-white-alpha-90 {\n  color: rgba(255,255,255,0.9) !important;\n}\n\n.hover\\:text-white-alpha-10:hover {\n  color: rgba(255,255,255,0.1) !important;\n}\n.hover\\:text-white-alpha-20:hover {\n  color: rgba(255,255,255,0.2) !important;\n}\n.hover\\:text-white-alpha-30:hover {\n  color: rgba(255,255,255,0.3) !important;\n}\n.hover\\:text-white-alpha-40:hover {\n  color: rgba(255,255,255,0.4) !important;\n}\n.hover\\:text-white-alpha-50:hover {\n  color: rgba(255,255,255,0.5) !important;\n}\n.hover\\:text-white-alpha-60:hover {\n  color: rgba(255,255,255,0.6) !important;\n}\n.hover\\:text-white-alpha-70:hover {\n  color: rgba(255,255,255,0.7) !important;\n}\n.hover\\:text-white-alpha-80:hover {\n  color: rgba(255,255,255,0.8) !important;\n}\n.hover\\:text-white-alpha-90:hover {\n  color: rgba(255,255,255,0.9) !important;\n}\n\n.focus\\:text-white-alpha-10:focus {\n  color: rgba(255,255,255,0.1) !important;\n}\n.focus\\:text-white-alpha-20:focus {\n  color: rgba(255,255,255,0.2) !important;\n}\n.focus\\:text-white-alpha-30:focus {\n  color: rgba(255,255,255,0.3) !important;\n}\n.focus\\:text-white-alpha-40:focus {\n  color: rgba(255,255,255,0.4) !important;\n}\n.focus\\:text-white-alpha-50:focus {\n  color: rgba(255,255,255,0.5) !important;\n}\n.focus\\:text-white-alpha-60:focus {\n  color: rgba(255,255,255,0.6) !important;\n}\n.focus\\:text-white-alpha-70:focus {\n  color: rgba(255,255,255,0.7) !important;\n}\n.focus\\:text-white-alpha-80:focus {\n  color: rgba(255,255,255,0.8) !important;\n}\n.focus\\:text-white-alpha-90:focus {\n  color: rgba(255,255,255,0.9) !important;\n}\n\n.active\\:text-white-alpha-10:active {\n  color: rgba(255,255,255,0.1) !important;\n}\n.active\\:text-white-alpha-20:active {\n  color: rgba(255,255,255,0.2) !important;\n}\n.active\\:text-white-alpha-30:active {\n  color: rgba(255,255,255,0.3) !important;\n}\n.active\\:text-white-alpha-40:active {\n  color: rgba(255,255,255,0.4) !important;\n}\n.active\\:text-white-alpha-50:active {\n  color: rgba(255,255,255,0.5) !important;\n}\n.active\\:text-white-alpha-60:active {\n  color: rgba(255,255,255,0.6) !important;\n}\n.active\\:text-white-alpha-70:active {\n  color: rgba(255,255,255,0.7) !important;\n}\n.active\\:text-white-alpha-80:active {\n  color: rgba(255,255,255,0.8) !important;\n}\n.active\\:text-white-alpha-90:active {\n  color: rgba(255,255,255,0.9) !important;\n}\n\n.text-black-alpha-10 {\n  color: rgba(0,0,0,0.1) !important;\n}\n.text-black-alpha-20 {\n  color: rgba(0,0,0,0.2) !important;\n}\n.text-black-alpha-30 {\n  color: rgba(0,0,0,0.3) !important;\n}\n.text-black-alpha-40 {\n  color: rgba(0,0,0,0.4) !important;\n}\n.text-black-alpha-50 {\n  color: rgba(0,0,0,0.5) !important;\n}\n.text-black-alpha-60 {\n  color: rgba(0,0,0,0.6) !important;\n}\n.text-black-alpha-70 {\n  color: rgba(0,0,0,0.7) !important;\n}\n.text-black-alpha-80 {\n  color: rgba(0,0,0,0.8) !important;\n}\n.text-black-alpha-90 {\n  color: rgba(0,0,0,0.9) !important;\n}\n\n.hover\\:text-black-alpha-10:hover {\n  color: rgba(0,0,0,0.1) !important;\n}\n.hover\\:text-black-alpha-20:hover {\n  color: rgba(0,0,0,0.2) !important;\n}\n.hover\\:text-black-alpha-30:hover {\n  color: rgba(0,0,0,0.3) !important;\n}\n.hover\\:text-black-alpha-40:hover {\n  color: rgba(0,0,0,0.4) !important;\n}\n.hover\\:text-black-alpha-50:hover {\n  color: rgba(0,0,0,0.5) !important;\n}\n.hover\\:text-black-alpha-60:hover {\n  color: rgba(0,0,0,0.6) !important;\n}\n.hover\\:text-black-alpha-70:hover {\n  color: rgba(0,0,0,0.7) !important;\n}\n.hover\\:text-black-alpha-80:hover {\n  color: rgba(0,0,0,0.8) !important;\n}\n.hover\\:text-black-alpha-90:hover {\n  color: rgba(0,0,0,0.9) !important;\n}\n\n.focus\\:text-black-alpha-10:focus {\n  color: rgba(0,0,0,0.1) !important;\n}\n.focus\\:text-black-alpha-20:focus {\n  color: rgba(0,0,0,0.2) !important;\n}\n.focus\\:text-black-alpha-30:focus {\n  color: rgba(0,0,0,0.3) !important;\n}\n.focus\\:text-black-alpha-40:focus {\n  color: rgba(0,0,0,0.4) !important;\n}\n.focus\\:text-black-alpha-50:focus {\n  color: rgba(0,0,0,0.5) !important;\n}\n.focus\\:text-black-alpha-60:focus {\n  color: rgba(0,0,0,0.6) !important;\n}\n.focus\\:text-black-alpha-70:focus {\n  color: rgba(0,0,0,0.7) !important;\n}\n.focus\\:text-black-alpha-80:focus {\n  color: rgba(0,0,0,0.8) !important;\n}\n.focus\\:text-black-alpha-90:focus {\n  color: rgba(0,0,0,0.9) !important;\n}\n\n.active\\:text-black-alpha-10:active {\n  color: rgba(0,0,0,0.1) !important;\n}\n.active\\:text-black-alpha-20:active {\n  color: rgba(0,0,0,0.2) !important;\n}\n.active\\:text-black-alpha-30:active {\n  color: rgba(0,0,0,0.3) !important;\n}\n.active\\:text-black-alpha-40:active {\n  color: rgba(0,0,0,0.4) !important;\n}\n.active\\:text-black-alpha-50:active {\n  color: rgba(0,0,0,0.5) !important;\n}\n.active\\:text-black-alpha-60:active {\n  color: rgba(0,0,0,0.6) !important;\n}\n.active\\:text-black-alpha-70:active {\n  color: rgba(0,0,0,0.7) !important;\n}\n.active\\:text-black-alpha-80:active {\n  color: rgba(0,0,0,0.8) !important;\n}\n.active\\:text-black-alpha-90:active {\n  color: rgba(0,0,0,0.9) !important;\n}\n\n.text-primary {\n  color: var(--primary-color) !important;\n}\n\n.hover\\:text-primary:hover {\n  color: var(--primary-color) !important;\n}\n\n.bg-primary {\n  background-color: var(--primary-color) !important;\n  color: var(--primary-color-text) !important;\n}\n\n.hover\\:bg-primary:hover {\n  background-color: var(--primary-color) !important;\n  color: var(--primary-color-text) !important;\n}\n\n.border-primary {\n  border-color: var(--primary-color) !important;\n}\n\n.hover\\:border-primary:hover {\n  border-color: var(--primary-color) !important;\n}\n\n.bg-primary-reverse {\n  background-color: var(--primary-color-text) !important;\n  color: var(--primary-color) !important;\n}\n\n.hover\\:bg-primary-reverse:hover {\n  background-color: var(--primary-color-text) !important;\n  color: var(--primary-color) !important;\n}\n\n.text-white {\n  color: #ffffff !important;\n}\n\n.hover\\:text-white:hover {\n  color: #ffffff !important;\n}\n\n.bg-white {\n  background-color: #ffffff !important;\n}\n\n.hover\\:bg-white:hover {\n  background-color: #ffffff !important;\n}\n\n.border-white {\n  border-color: #ffffff !important;\n}\n\n.hover\\:border-white:hover {\n  border-color: #ffffff !important;\n}\n\n.surface-ground {\n  background-color: var(--surface-ground);\n}\n\n.surface-section {\n  background-color: var(--surface-section);\n}\n\n.surface-card {\n  background-color: var(--surface-card);\n}\n\n.surface-overlay {\n  background-color: var(--surface-overlay);\n}\n\n.surface-border {\n  border-color: var(--surface-border);\n}\n\n.surface-hover {\n  border-color: var(--surface-hover);\n}\n\n.field {\n  margin-bottom: 1rem;\n}\n\n.field > label {\n  display: inline-block;\n  margin-bottom: 0.5rem;\n}\n\n.field.grid > label {\n  display: flex;\n  align-items: center;\n}\n\n.field > small {\n  margin-top: 0.25rem;\n}\n\n.field.grid,\n.formgrid.grid {\n  margin-top: 0;\n}\n\n.field.grid .col-fixed,\n.formgrid.grid .col-fixed,\n.field.grid .col,\n.formgrid.grid .col,\n.field.grid .col-1,\n.formgrid.grid .col-1,\n.field.grid .col-2,\n.formgrid.grid .col-2,\n.field.grid .col-3,\n.formgrid.grid .col-3,\n.field.grid .col-4,\n.formgrid.grid .col-4,\n.field.grid .col-5,\n.formgrid.grid .col-5,\n.field.grid .col-6,\n.formgrid.grid .col-6,\n.field.grid .col-7,\n.formgrid.grid .col-7,\n.field.grid .col-8,\n.formgrid.grid .col-8,\n.field.grid .col-9,\n.formgrid.grid .col-9,\n.field.grid .col-10,\n.formgrid.grid .col-10,\n.field.grid .col-11,\n.formgrid.grid .col-11,\n.field.grid .col-12,\n.formgrid.grid .col-12 {\n  padding-top: 0;\n  padding-bottom: 0;\n}\n\n.formgroup-inline {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: flex-start;\n}\n\n.formgroup-inline .field,\n.formgroup-inline .field-checkbox,\n.formgroup-inline .field-radiobutton {\n  margin-right: 1rem;\n}\n\n.formgroup-inline .field > label,\n.formgroup-inline .field-checkbox > label,\n.formgroup-inline .field-radiobutton > label {\n  margin-right: 0.5rem;\n  margin-bottom: 0;\n}\n\n.field-checkbox,\n.field-radiobutton {\n  margin-bottom: 1rem;\n  display: flex;\n  align-items: center;\n}\n\n.field-checkbox > label,\n.field-radiobutton > label {\n  margin-left: 0.5rem;\n  line-height: 1;\n}\n\n.hidden {\n  display: none !important;\n}\n\n.block {\n  display: block !important;\n}\n\n.inline {\n  display: inline !important;\n}\n\n.inline-block {\n  display: inline-block !important;\n}\n\n.flex {\n  display: flex !important;\n}\n\n.inline-flex {\n  display: inline-flex !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:hidden {\n    display: none !important;\n  }\n  .sm\\:block {\n    display: block !important;\n  }\n  .sm\\:inline {\n    display: inline !important;\n  }\n  .sm\\:inline-block {\n    display: inline-block !important;\n  }\n  .sm\\:flex {\n    display: flex !important;\n  }\n  .sm\\:inline-flex {\n    display: inline-flex !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:hidden {\n    display: none !important;\n  }\n  .md\\:block {\n    display: block !important;\n  }\n  .md\\:inline {\n    display: inline !important;\n  }\n  .md\\:inline-block {\n    display: inline-block !important;\n  }\n  .md\\:flex {\n    display: flex !important;\n  }\n  .md\\:inline-flex {\n    display: inline-flex !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:hidden {\n    display: none !important;\n  }\n  .lg\\:block {\n    display: block !important;\n  }\n  .lg\\:inline {\n    display: inline !important;\n  }\n  .lg\\:inline-block {\n    display: inline-block !important;\n  }\n  .lg\\:flex {\n    display: flex !important;\n  }\n  .lg\\:inline-flex {\n    display: inline-flex !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:hidden {\n    display: none !important;\n  }\n  .xl\\:block {\n    display: block !important;\n  }\n  .xl\\:inline {\n    display: inline !important;\n  }\n  .xl\\:inline-block {\n    display: inline-block !important;\n  }\n  .xl\\:flex {\n    display: flex !important;\n  }\n  .xl\\:inline-flex {\n    display: inline-flex !important;\n  }\n}\n.text-center {\n  text-align: center !important;\n}\n\n.text-justify {\n  text-align: justify !important;\n}\n\n.text-left {\n  text-align: left !important;\n}\n\n.text-right {\n  text-align: right !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:text-center {\n    text-align: center !important;\n  }\n  .sm\\:text-justify {\n    text-align: justify !important;\n  }\n  .sm\\:text-left {\n    text-align: left !important;\n  }\n  .sm\\:text-right {\n    text-align: right !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:text-center {\n    text-align: center !important;\n  }\n  .md\\:text-justify {\n    text-align: justify !important;\n  }\n  .md\\:text-left {\n    text-align: left !important;\n  }\n  .md\\:text-right {\n    text-align: right !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:text-center {\n    text-align: center !important;\n  }\n  .lg\\:text-justify {\n    text-align: justify !important;\n  }\n  .lg\\:text-left {\n    text-align: left !important;\n  }\n  .lg\\:text-right {\n    text-align: right !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:text-center {\n    text-align: center !important;\n  }\n  .xl\\:text-justify {\n    text-align: justify !important;\n  }\n  .xl\\:text-left {\n    text-align: left !important;\n  }\n  .xl\\:text-right {\n    text-align: right !important;\n  }\n}\n.underline {\n  text-decoration: underline !important;\n}\n\n.line-through {\n  text-decoration: line-through !important;\n}\n\n.no-underline {\n  text-decoration: none !important;\n}\n\n.lowercase {\n  text-transform: lowercase !important;\n}\n\n.uppercase {\n  text-transform: uppercase !important;\n}\n\n.capitalize {\n  text-transform: capitalize !important;\n}\n\n.text-overflow-clip {\n  text-overflow: clip !important;\n}\n\n.text-overflow-ellipsis {\n  text-overflow: ellipsis !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:text-overflow-clip {\n    text-overflow: clip !important;\n  }\n  .sm\\:text-overflow-ellipsis {\n    text-overflow: ellipsis !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:text-overflow-clip {\n    text-overflow: clip !important;\n  }\n  .md\\:text-overflow-ellipsis {\n    text-overflow: ellipsis !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:text-overflow-clip {\n    text-overflow: clip !important;\n  }\n  .lg\\:text-overflow-ellipsis {\n    text-overflow: ellipsis !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:text-overflow-clip {\n    text-overflow: clip !important;\n  }\n  .xl\\:text-overflow-ellipsis {\n    text-overflow: ellipsis !important;\n  }\n}\n.font-light {\n  font-weight: 300 !important;\n}\n\n.font-normal {\n  font-weight: 400 !important;\n}\n\n.font-medium {\n  font-weight: 500 !important;\n}\n\n.font-semibold {\n  font-weight: 600 !important;\n}\n\n.font-bold {\n  font-weight: 700 !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:font-light {\n    font-weight: 300 !important;\n  }\n  .sm\\:font-normal {\n    font-weight: 400 !important;\n  }\n  .sm\\:font-medium {\n    font-weight: 500 !important;\n  }\n  .sm\\:font-semibold {\n    font-weight: 600 !important;\n  }\n  .sm\\:font-bold {\n    font-weight: 700 !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:font-light {\n    font-weight: 300 !important;\n  }\n  .md\\:font-normal {\n    font-weight: 400 !important;\n  }\n  .md\\:font-medium {\n    font-weight: 500 !important;\n  }\n  .md\\:font-semibold {\n    font-weight: 600 !important;\n  }\n  .md\\:font-bold {\n    font-weight: 700 !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:font-light {\n    font-weight: 300 !important;\n  }\n  .lg\\:font-normal {\n    font-weight: 400 !important;\n  }\n  .lg\\:font-medium {\n    font-weight: 500 !important;\n  }\n  .lg\\:font-semibold {\n    font-weight: 600 !important;\n  }\n  .lg\\:font-bold {\n    font-weight: 700 !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:font-light {\n    font-weight: 300 !important;\n  }\n  .xl\\:font-normal {\n    font-weight: 400 !important;\n  }\n  .xl\\:font-medium {\n    font-weight: 500 !important;\n  }\n  .xl\\:font-semibold {\n    font-weight: 600 !important;\n  }\n  .xl\\:font-bold {\n    font-weight: 700 !important;\n  }\n}\n.font-italic {\n  font-style: italic !important;\n}\n\n.text-xs {\n  font-size: 0.75rem !important;\n}\n\n.text-sm {\n  font-size: 0.875rem !important;\n}\n\n.text-base {\n  font-size: 1rem !important;\n}\n\n.text-lg {\n  font-size: 1.125rem !important;\n}\n\n.text-xl {\n  font-size: 1.25rem !important;\n}\n\n.text-2xl {\n  font-size: 1.5rem !important;\n}\n\n.text-3xl {\n  font-size: 1.75rem !important;\n}\n\n.text-4xl {\n  font-size: 2rem !important;\n}\n\n.text-5xl {\n  font-size: 2.5rem !important;\n}\n\n.text-6xl {\n  font-size: 3rem !important;\n}\n\n.text-7xl {\n  font-size: 4rem !important;\n}\n\n.text-8xl {\n  font-size: 6rem !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:text-xs {\n    font-size: 0.75rem !important;\n  }\n  .sm\\:text-sm {\n    font-size: 0.875rem !important;\n  }\n  .sm\\:text-base {\n    font-size: 1rem !important;\n  }\n  .sm\\:text-lg {\n    font-size: 1.125rem !important;\n  }\n  .sm\\:text-xl {\n    font-size: 1.25rem !important;\n  }\n  .sm\\:text-2xl {\n    font-size: 1.5rem !important;\n  }\n  .sm\\:text-3xl {\n    font-size: 1.75rem !important;\n  }\n  .sm\\:text-4xl {\n    font-size: 2rem !important;\n  }\n  .sm\\:text-5xl {\n    font-size: 2.5rem !important;\n  }\n  .sm\\:text-6xl {\n    font-size: 3rem !important;\n  }\n  .sm\\:text-7xl {\n    font-size: 4rem !important;\n  }\n  .sm\\:text-8xl {\n    font-size: 6rem !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:text-xs {\n    font-size: 0.75rem !important;\n  }\n  .md\\:text-sm {\n    font-size: 0.875rem !important;\n  }\n  .md\\:text-base {\n    font-size: 1rem !important;\n  }\n  .md\\:text-lg {\n    font-size: 1.125rem !important;\n  }\n  .md\\:text-xl {\n    font-size: 1.25rem !important;\n  }\n  .md\\:text-2xl {\n    font-size: 1.5rem !important;\n  }\n  .md\\:text-3xl {\n    font-size: 1.75rem !important;\n  }\n  .md\\:text-4xl {\n    font-size: 2rem !important;\n  }\n  .md\\:text-5xl {\n    font-size: 2.5rem !important;\n  }\n  .md\\:text-6xl {\n    font-size: 3rem !important;\n  }\n  .md\\:text-7xl {\n    font-size: 4rem !important;\n  }\n  .md\\:text-8xl {\n    font-size: 6rem !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:text-xs {\n    font-size: 0.75rem !important;\n  }\n  .lg\\:text-sm {\n    font-size: 0.875rem !important;\n  }\n  .lg\\:text-base {\n    font-size: 1rem !important;\n  }\n  .lg\\:text-lg {\n    font-size: 1.125rem !important;\n  }\n  .lg\\:text-xl {\n    font-size: 1.25rem !important;\n  }\n  .lg\\:text-2xl {\n    font-size: 1.5rem !important;\n  }\n  .lg\\:text-3xl {\n    font-size: 1.75rem !important;\n  }\n  .lg\\:text-4xl {\n    font-size: 2rem !important;\n  }\n  .lg\\:text-5xl {\n    font-size: 2.5rem !important;\n  }\n  .lg\\:text-6xl {\n    font-size: 3rem !important;\n  }\n  .lg\\:text-7xl {\n    font-size: 4rem !important;\n  }\n  .lg\\:text-8xl {\n    font-size: 6rem !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:text-xs {\n    font-size: 0.75rem !important;\n  }\n  .xl\\:text-sm {\n    font-size: 0.875rem !important;\n  }\n  .xl\\:text-base {\n    font-size: 1rem !important;\n  }\n  .xl\\:text-lg {\n    font-size: 1.125rem !important;\n  }\n  .xl\\:text-xl {\n    font-size: 1.25rem !important;\n  }\n  .xl\\:text-2xl {\n    font-size: 1.5rem !important;\n  }\n  .xl\\:text-3xl {\n    font-size: 1.75rem !important;\n  }\n  .xl\\:text-4xl {\n    font-size: 2rem !important;\n  }\n  .xl\\:text-5xl {\n    font-size: 2.5rem !important;\n  }\n  .xl\\:text-6xl {\n    font-size: 3rem !important;\n  }\n  .xl\\:text-7xl {\n    font-size: 4rem !important;\n  }\n  .xl\\:text-8xl {\n    font-size: 6rem !important;\n  }\n}\n.line-height-1 {\n  line-height: 1 !important;\n}\n\n.line-height-2 {\n  line-height: 1.25 !important;\n}\n\n.line-height-3 {\n  line-height: 1.5 !important;\n}\n\n.line-height-4 {\n  line-height: 2 !important;\n}\n\n.white-space-normal {\n  white-space: normal !important;\n}\n\n.white-space-nowrap {\n  white-space: nowrap !important;\n}\n\n.flex-row {\n  flex-direction: row !important;\n}\n\n.flex-row-reverse {\n  flex-direction: row-reverse !important;\n}\n\n.flex-column {\n  flex-direction: column !important;\n}\n\n.flex-column-reverse {\n  flex-direction: column-reverse !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:flex-row {\n    flex-direction: row !important;\n  }\n  .sm\\:flex-row-reverse {\n    flex-direction: row-reverse !important;\n  }\n  .sm\\:flex-column {\n    flex-direction: column !important;\n  }\n  .sm\\:flex-column-reverse {\n    flex-direction: column-reverse !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:flex-row {\n    flex-direction: row !important;\n  }\n  .md\\:flex-row-reverse {\n    flex-direction: row-reverse !important;\n  }\n  .md\\:flex-column {\n    flex-direction: column !important;\n  }\n  .md\\:flex-column-reverse {\n    flex-direction: column-reverse !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:flex-row {\n    flex-direction: row !important;\n  }\n  .lg\\:flex-row-reverse {\n    flex-direction: row-reverse !important;\n  }\n  .lg\\:flex-column {\n    flex-direction: column !important;\n  }\n  .lg\\:flex-column-reverse {\n    flex-direction: column-reverse !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:flex-row {\n    flex-direction: row !important;\n  }\n  .xl\\:flex-row-reverse {\n    flex-direction: row-reverse !important;\n  }\n  .xl\\:flex-column {\n    flex-direction: column !important;\n  }\n  .xl\\:flex-column-reverse {\n    flex-direction: column-reverse !important;\n  }\n}\n.flex-wrap {\n  flex-wrap: wrap !important;\n}\n\n.flex-wrap-reverse {\n  flex-wrap: wrap-reverse !important;\n}\n\n.flex-nowrap {\n  flex-wrap: nowrap !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:flex-wrap {\n    flex-wrap: wrap !important;\n  }\n  .sm\\:flex-wrap-reverse {\n    flex-wrap: wrap-reverse !important;\n  }\n  .sm\\:flex-nowrap {\n    flex-wrap: nowrap !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:flex-wrap {\n    flex-wrap: wrap !important;\n  }\n  .md\\:flex-wrap-reverse {\n    flex-wrap: wrap-reverse !important;\n  }\n  .md\\:flex-nowrap {\n    flex-wrap: nowrap !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:flex-wrap {\n    flex-wrap: wrap !important;\n  }\n  .lg\\:flex-wrap-reverse {\n    flex-wrap: wrap-reverse !important;\n  }\n  .lg\\:flex-nowrap {\n    flex-wrap: nowrap !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:flex-wrap {\n    flex-wrap: wrap !important;\n  }\n  .xl\\:flex-wrap-reverse {\n    flex-wrap: wrap-reverse !important;\n  }\n  .xl\\:flex-nowrap {\n    flex-wrap: nowrap !important;\n  }\n}\n.justify-content-start {\n  justify-content: flex-start !important;\n}\n\n.justify-content-end {\n  justify-content: flex-end !important;\n}\n\n.justify-content-center {\n  justify-content: center !important;\n}\n\n.justify-content-between {\n  justify-content: space-between !important;\n}\n\n.justify-content-around {\n  justify-content: space-around !important;\n}\n\n.justify-content-evenly {\n  justify-content: space-evenly !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:justify-content-start {\n    justify-content: flex-start !important;\n  }\n  .sm\\:justify-content-end {\n    justify-content: flex-end !important;\n  }\n  .sm\\:justify-content-center {\n    justify-content: center !important;\n  }\n  .sm\\:justify-content-between {\n    justify-content: space-between !important;\n  }\n  .sm\\:justify-content-around {\n    justify-content: space-around !important;\n  }\n  .sm\\:justify-content-evenly {\n    justify-content: space-evenly !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:justify-content-start {\n    justify-content: flex-start !important;\n  }\n  .md\\:justify-content-end {\n    justify-content: flex-end !important;\n  }\n  .md\\:justify-content-center {\n    justify-content: center !important;\n  }\n  .md\\:justify-content-between {\n    justify-content: space-between !important;\n  }\n  .md\\:justify-content-around {\n    justify-content: space-around !important;\n  }\n  .md\\:justify-content-evenly {\n    justify-content: space-evenly !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:justify-content-start {\n    justify-content: flex-start !important;\n  }\n  .lg\\:justify-content-end {\n    justify-content: flex-end !important;\n  }\n  .lg\\:justify-content-center {\n    justify-content: center !important;\n  }\n  .lg\\:justify-content-between {\n    justify-content: space-between !important;\n  }\n  .lg\\:justify-content-around {\n    justify-content: space-around !important;\n  }\n  .lg\\:justify-content-evenly {\n    justify-content: space-evenly !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:justify-content-start {\n    justify-content: flex-start !important;\n  }\n  .xl\\:justify-content-end {\n    justify-content: flex-end !important;\n  }\n  .xl\\:justify-content-center {\n    justify-content: center !important;\n  }\n  .xl\\:justify-content-between {\n    justify-content: space-between !important;\n  }\n  .xl\\:justify-content-around {\n    justify-content: space-around !important;\n  }\n  .xl\\:justify-content-evenly {\n    justify-content: space-evenly !important;\n  }\n}\n.align-content-start {\n  align-content: flex-start !important;\n}\n\n.align-content-end {\n  align-content: flex-end !important;\n}\n\n.align-content-center {\n  align-content: center !important;\n}\n\n.align-content-between {\n  align-content: space-between !important;\n}\n\n.align-content-around {\n  align-content: space-around !important;\n}\n\n.align-content-evenly {\n  align-content: space-evenly !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:align-content-start {\n    align-content: flex-start !important;\n  }\n  .sm\\:align-content-end {\n    align-content: flex-end !important;\n  }\n  .sm\\:align-content-center {\n    align-content: center !important;\n  }\n  .sm\\:align-content-between {\n    align-content: space-between !important;\n  }\n  .sm\\:align-content-around {\n    align-content: space-around !important;\n  }\n  .sm\\:align-content-evenly {\n    align-content: space-evenly !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:align-content-start {\n    align-content: flex-start !important;\n  }\n  .md\\:align-content-end {\n    align-content: flex-end !important;\n  }\n  .md\\:align-content-center {\n    align-content: center !important;\n  }\n  .md\\:align-content-between {\n    align-content: space-between !important;\n  }\n  .md\\:align-content-around {\n    align-content: space-around !important;\n  }\n  .md\\:align-content-evenly {\n    align-content: space-evenly !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:align-content-start {\n    align-content: flex-start !important;\n  }\n  .lg\\:align-content-end {\n    align-content: flex-end !important;\n  }\n  .lg\\:align-content-center {\n    align-content: center !important;\n  }\n  .lg\\:align-content-between {\n    align-content: space-between !important;\n  }\n  .lg\\:align-content-around {\n    align-content: space-around !important;\n  }\n  .lg\\:align-content-evenly {\n    align-content: space-evenly !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:align-content-start {\n    align-content: flex-start !important;\n  }\n  .xl\\:align-content-end {\n    align-content: flex-end !important;\n  }\n  .xl\\:align-content-center {\n    align-content: center !important;\n  }\n  .xl\\:align-content-between {\n    align-content: space-between !important;\n  }\n  .xl\\:align-content-around {\n    align-content: space-around !important;\n  }\n  .xl\\:align-content-evenly {\n    align-content: space-evenly !important;\n  }\n}\n.align-items-stretch {\n  align-items: stretch !important;\n}\n\n.align-items-start {\n  align-items: flex-start !important;\n}\n\n.align-items-center {\n  align-items: center !important;\n}\n\n.align-items-end {\n  align-items: flex-end !important;\n}\n\n.align-items-baseline {\n  align-items: baseline !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:align-items-stretch {\n    align-items: stretch !important;\n  }\n  .sm\\:align-items-start {\n    align-items: flex-start !important;\n  }\n  .sm\\:align-items-center {\n    align-items: center !important;\n  }\n  .sm\\:align-items-end {\n    align-items: flex-end !important;\n  }\n  .sm\\:align-items-baseline {\n    align-items: baseline !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:align-items-stretch {\n    align-items: stretch !important;\n  }\n  .md\\:align-items-start {\n    align-items: flex-start !important;\n  }\n  .md\\:align-items-center {\n    align-items: center !important;\n  }\n  .md\\:align-items-end {\n    align-items: flex-end !important;\n  }\n  .md\\:align-items-baseline {\n    align-items: baseline !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:align-items-stretch {\n    align-items: stretch !important;\n  }\n  .lg\\:align-items-start {\n    align-items: flex-start !important;\n  }\n  .lg\\:align-items-center {\n    align-items: center !important;\n  }\n  .lg\\:align-items-end {\n    align-items: flex-end !important;\n  }\n  .lg\\:align-items-baseline {\n    align-items: baseline !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:align-items-stretch {\n    align-items: stretch !important;\n  }\n  .xl\\:align-items-start {\n    align-items: flex-start !important;\n  }\n  .xl\\:align-items-center {\n    align-items: center !important;\n  }\n  .xl\\:align-items-end {\n    align-items: flex-end !important;\n  }\n  .xl\\:align-items-baseline {\n    align-items: baseline !important;\n  }\n}\n.align-self-auto {\n  align-self: auto !important;\n}\n\n.align-self-start {\n  align-self: flex-start !important;\n}\n\n.align-self-end {\n  align-self: flex-end !important;\n}\n\n.align-self-center {\n  align-self: center !important;\n}\n\n.align-self-stretch {\n  align-self: stretch !important;\n}\n\n.align-self-baseline {\n  align-self: baseline !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:align-self-auto {\n    align-self: auto !important;\n  }\n  .sm\\:align-self-start {\n    align-self: flex-start !important;\n  }\n  .sm\\:align-self-end {\n    align-self: flex-end !important;\n  }\n  .sm\\:align-self-center {\n    align-self: center !important;\n  }\n  .sm\\:align-self-stretch {\n    align-self: stretch !important;\n  }\n  .sm\\:align-self-baseline {\n    align-self: baseline !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:align-self-auto {\n    align-self: auto !important;\n  }\n  .md\\:align-self-start {\n    align-self: flex-start !important;\n  }\n  .md\\:align-self-end {\n    align-self: flex-end !important;\n  }\n  .md\\:align-self-center {\n    align-self: center !important;\n  }\n  .md\\:align-self-stretch {\n    align-self: stretch !important;\n  }\n  .md\\:align-self-baseline {\n    align-self: baseline !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:align-self-auto {\n    align-self: auto !important;\n  }\n  .lg\\:align-self-start {\n    align-self: flex-start !important;\n  }\n  .lg\\:align-self-end {\n    align-self: flex-end !important;\n  }\n  .lg\\:align-self-center {\n    align-self: center !important;\n  }\n  .lg\\:align-self-stretch {\n    align-self: stretch !important;\n  }\n  .lg\\:align-self-baseline {\n    align-self: baseline !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:align-self-auto {\n    align-self: auto !important;\n  }\n  .xl\\:align-self-start {\n    align-self: flex-start !important;\n  }\n  .xl\\:align-self-end {\n    align-self: flex-end !important;\n  }\n  .xl\\:align-self-center {\n    align-self: center !important;\n  }\n  .xl\\:align-self-stretch {\n    align-self: stretch !important;\n  }\n  .xl\\:align-self-baseline {\n    align-self: baseline !important;\n  }\n}\n.flex-order-0 {\n  order: 0 !important;\n}\n\n.flex-order-1 {\n  order: 1 !important;\n}\n\n.flex-order-2 {\n  order: 2 !important;\n}\n\n.flex-order-3 {\n  order: 3 !important;\n}\n\n.flex-order-4 {\n  order: 4 !important;\n}\n\n.flex-order-5 {\n  order: 5 !important;\n}\n\n.flex-order-6 {\n  order: 6 !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:flex-order-0 {\n    order: 0 !important;\n  }\n  .sm\\:flex-order-1 {\n    order: 1 !important;\n  }\n  .sm\\:flex-order-2 {\n    order: 2 !important;\n  }\n  .sm\\:flex-order-3 {\n    order: 3 !important;\n  }\n  .sm\\:flex-order-4 {\n    order: 4 !important;\n  }\n  .sm\\:flex-order-5 {\n    order: 5 !important;\n  }\n  .sm\\:flex-order-6 {\n    order: 6 !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:flex-order-0 {\n    order: 0 !important;\n  }\n  .md\\:flex-order-1 {\n    order: 1 !important;\n  }\n  .md\\:flex-order-2 {\n    order: 2 !important;\n  }\n  .md\\:flex-order-3 {\n    order: 3 !important;\n  }\n  .md\\:flex-order-4 {\n    order: 4 !important;\n  }\n  .md\\:flex-order-5 {\n    order: 5 !important;\n  }\n  .md\\:flex-order-6 {\n    order: 6 !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:flex-order-0 {\n    order: 0 !important;\n  }\n  .lg\\:flex-order-1 {\n    order: 1 !important;\n  }\n  .lg\\:flex-order-2 {\n    order: 2 !important;\n  }\n  .lg\\:flex-order-3 {\n    order: 3 !important;\n  }\n  .lg\\:flex-order-4 {\n    order: 4 !important;\n  }\n  .lg\\:flex-order-5 {\n    order: 5 !important;\n  }\n  .lg\\:flex-order-6 {\n    order: 6 !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:flex-order-0 {\n    order: 0 !important;\n  }\n  .xl\\:flex-order-1 {\n    order: 1 !important;\n  }\n  .xl\\:flex-order-2 {\n    order: 2 !important;\n  }\n  .xl\\:flex-order-3 {\n    order: 3 !important;\n  }\n  .xl\\:flex-order-4 {\n    order: 4 !important;\n  }\n  .xl\\:flex-order-5 {\n    order: 5 !important;\n  }\n  .xl\\:flex-order-6 {\n    order: 6 !important;\n  }\n}\n.flex-1 {\n  flex: 1 1 0% !important;\n}\n\n.flex-auto {\n  flex: 1 1 auto !important;\n}\n\n.flex-initial {\n  flex: 0 1 auto !important;\n}\n\n.flex-none {\n  flex: none !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:flex-1 {\n    flex: 1 1 0% !important;\n  }\n  .sm\\:flex-auto {\n    flex: 1 1 auto !important;\n  }\n  .sm\\:flex-initial {\n    flex: 0 1 auto !important;\n  }\n  .sm\\:flex-none {\n    flex: none !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:flex-1 {\n    flex: 1 1 0% !important;\n  }\n  .md\\:flex-auto {\n    flex: 1 1 auto !important;\n  }\n  .md\\:flex-initial {\n    flex: 0 1 auto !important;\n  }\n  .md\\:flex-none {\n    flex: none !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:flex-1 {\n    flex: 1 1 0% !important;\n  }\n  .lg\\:flex-auto {\n    flex: 1 1 auto !important;\n  }\n  .lg\\:flex-initial {\n    flex: 0 1 auto !important;\n  }\n  .lg\\:flex-none {\n    flex: none !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:flex-1 {\n    flex: 1 1 0% !important;\n  }\n  .xl\\:flex-auto {\n    flex: 1 1 auto !important;\n  }\n  .xl\\:flex-initial {\n    flex: 0 1 auto !important;\n  }\n  .xl\\:flex-none {\n    flex: none !important;\n  }\n}\n.flex-grow-0 {\n  flex-grow: 0 !important;\n}\n\n.flex-grow-1 {\n  flex-grow: 1 !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:flex-grow-0 {\n    flex-grow: 0 !important;\n  }\n  .sm\\:flex-grow-1 {\n    flex-grow: 1 !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:flex-grow-0 {\n    flex-grow: 0 !important;\n  }\n  .md\\:flex-grow-1 {\n    flex-grow: 1 !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:flex-grow-0 {\n    flex-grow: 0 !important;\n  }\n  .lg\\:flex-grow-1 {\n    flex-grow: 1 !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:flex-grow-0 {\n    flex-grow: 0 !important;\n  }\n  .xl\\:flex-grow-1 {\n    flex-grow: 1 !important;\n  }\n}\n.flex-shrink-0 {\n  flex-shrink: 0 !important;\n}\n\n.flex-shrink-1 {\n  flex-shrink: 1 !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:flex-shrink-0 {\n    flex-shrink: 0 !important;\n  }\n  .sm\\:flex-shrink-1 {\n    flex-shrink: 1 !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:flex-shrink-0 {\n    flex-shrink: 0 !important;\n  }\n  .md\\:flex-shrink-1 {\n    flex-shrink: 1 !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:flex-shrink-0 {\n    flex-shrink: 0 !important;\n  }\n  .lg\\:flex-shrink-1 {\n    flex-shrink: 1 !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:flex-shrink-0 {\n    flex-shrink: 0 !important;\n  }\n  .xl\\:flex-shrink-1 {\n    flex-shrink: 1 !important;\n  }\n}\n.p-0 {\n  padding: 0rem !important;\n}\n\n.p-1 {\n  padding: 0.25rem !important;\n}\n\n.p-2 {\n  padding: 0.5rem !important;\n}\n\n.p-3 {\n  padding: 1rem !important;\n}\n\n.p-4 {\n  padding: 1.5rem !important;\n}\n\n.p-5 {\n  padding: 2rem !important;\n}\n\n.p-6 {\n  padding: 3rem !important;\n}\n\n.p-7 {\n  padding: 4rem !important;\n}\n\n.p-8 {\n  padding: 5rem !important;\n}\n\n.pt-0 {\n  padding-top: 0rem !important;\n}\n\n.pt-1 {\n  padding-top: 0.25rem !important;\n}\n\n.pt-2 {\n  padding-top: 0.5rem !important;\n}\n\n.pt-3 {\n  padding-top: 1rem !important;\n}\n\n.pt-4 {\n  padding-top: 1.5rem !important;\n}\n\n.pt-5 {\n  padding-top: 2rem !important;\n}\n\n.pt-6 {\n  padding-top: 3rem !important;\n}\n\n.pt-7 {\n  padding-top: 4rem !important;\n}\n\n.pt-8 {\n  padding-top: 5rem !important;\n}\n\n.pr-0 {\n  padding-right: 0rem !important;\n}\n\n.pr-1 {\n  padding-right: 0.25rem !important;\n}\n\n.pr-2 {\n  padding-right: 0.5rem !important;\n}\n\n.pr-3 {\n  padding-right: 1rem !important;\n}\n\n.pr-4 {\n  padding-right: 1.5rem !important;\n}\n\n.pr-5 {\n  padding-right: 2rem !important;\n}\n\n.pr-6 {\n  padding-right: 3rem !important;\n}\n\n.pr-7 {\n  padding-right: 4rem !important;\n}\n\n.pr-8 {\n  padding-right: 5rem !important;\n}\n\n.pl-0 {\n  padding-left: 0rem !important;\n}\n\n.pl-1 {\n  padding-left: 0.25rem !important;\n}\n\n.pl-2 {\n  padding-left: 0.5rem !important;\n}\n\n.pl-3 {\n  padding-left: 1rem !important;\n}\n\n.pl-4 {\n  padding-left: 1.5rem !important;\n}\n\n.pl-5 {\n  padding-left: 2rem !important;\n}\n\n.pl-6 {\n  padding-left: 3rem !important;\n}\n\n.pl-7 {\n  padding-left: 4rem !important;\n}\n\n.pl-8 {\n  padding-left: 5rem !important;\n}\n\n.pb-0 {\n  padding-bottom: 0rem !important;\n}\n\n.pb-1 {\n  padding-bottom: 0.25rem !important;\n}\n\n.pb-2 {\n  padding-bottom: 0.5rem !important;\n}\n\n.pb-3 {\n  padding-bottom: 1rem !important;\n}\n\n.pb-4 {\n  padding-bottom: 1.5rem !important;\n}\n\n.pb-5 {\n  padding-bottom: 2rem !important;\n}\n\n.pb-6 {\n  padding-bottom: 3rem !important;\n}\n\n.pb-7 {\n  padding-bottom: 4rem !important;\n}\n\n.pb-8 {\n  padding-bottom: 5rem !important;\n}\n\n.px-0 {\n  padding-left: 0rem !important;\n  padding-right: 0rem !important;\n}\n\n.px-1 {\n  padding-left: 0.25rem !important;\n  padding-right: 0.25rem !important;\n}\n\n.px-2 {\n  padding-left: 0.5rem !important;\n  padding-right: 0.5rem !important;\n}\n\n.px-3 {\n  padding-left: 1rem !important;\n  padding-right: 1rem !important;\n}\n\n.px-4 {\n  padding-left: 1.5rem !important;\n  padding-right: 1.5rem !important;\n}\n\n.px-5 {\n  padding-left: 2rem !important;\n  padding-right: 2rem !important;\n}\n\n.px-6 {\n  padding-left: 3rem !important;\n  padding-right: 3rem !important;\n}\n\n.px-7 {\n  padding-left: 4rem !important;\n  padding-right: 4rem !important;\n}\n\n.px-8 {\n  padding-left: 5rem !important;\n  padding-right: 5rem !important;\n}\n\n.py-0 {\n  padding-top: 0rem !important;\n  padding-bottom: 0rem !important;\n}\n\n.py-1 {\n  padding-top: 0.25rem !important;\n  padding-bottom: 0.25rem !important;\n}\n\n.py-2 {\n  padding-top: 0.5rem !important;\n  padding-bottom: 0.5rem !important;\n}\n\n.py-3 {\n  padding-top: 1rem !important;\n  padding-bottom: 1rem !important;\n}\n\n.py-4 {\n  padding-top: 1.5rem !important;\n  padding-bottom: 1.5rem !important;\n}\n\n.py-5 {\n  padding-top: 2rem !important;\n  padding-bottom: 2rem !important;\n}\n\n.py-6 {\n  padding-top: 3rem !important;\n  padding-bottom: 3rem !important;\n}\n\n.py-7 {\n  padding-top: 4rem !important;\n  padding-bottom: 4rem !important;\n}\n\n.py-8 {\n  padding-top: 5rem !important;\n  padding-bottom: 5rem !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:p-0 {\n    padding: 0rem !important;\n  }\n\n  .sm\\:p-1 {\n    padding: 0.25rem !important;\n  }\n\n  .sm\\:p-2 {\n    padding: 0.5rem !important;\n  }\n\n  .sm\\:p-3 {\n    padding: 1rem !important;\n  }\n\n  .sm\\:p-4 {\n    padding: 1.5rem !important;\n  }\n\n  .sm\\:p-5 {\n    padding: 2rem !important;\n  }\n\n  .sm\\:p-6 {\n    padding: 3rem !important;\n  }\n\n  .sm\\:p-7 {\n    padding: 4rem !important;\n  }\n\n  .sm\\:p-8 {\n    padding: 5rem !important;\n  }\n\n  .sm\\:pt-0 {\n    padding-top: 0rem !important;\n  }\n\n  .sm\\:pt-1 {\n    padding-top: 0.25rem !important;\n  }\n\n  .sm\\:pt-2 {\n    padding-top: 0.5rem !important;\n  }\n\n  .sm\\:pt-3 {\n    padding-top: 1rem !important;\n  }\n\n  .sm\\:pt-4 {\n    padding-top: 1.5rem !important;\n  }\n\n  .sm\\:pt-5 {\n    padding-top: 2rem !important;\n  }\n\n  .sm\\:pt-6 {\n    padding-top: 3rem !important;\n  }\n\n  .sm\\:pt-7 {\n    padding-top: 4rem !important;\n  }\n\n  .sm\\:pt-8 {\n    padding-top: 5rem !important;\n  }\n\n  .sm\\:pr-0 {\n    padding-right: 0rem !important;\n  }\n\n  .sm\\:pr-1 {\n    padding-right: 0.25rem !important;\n  }\n\n  .sm\\:pr-2 {\n    padding-right: 0.5rem !important;\n  }\n\n  .sm\\:pr-3 {\n    padding-right: 1rem !important;\n  }\n\n  .sm\\:pr-4 {\n    padding-right: 1.5rem !important;\n  }\n\n  .sm\\:pr-5 {\n    padding-right: 2rem !important;\n  }\n\n  .sm\\:pr-6 {\n    padding-right: 3rem !important;\n  }\n\n  .sm\\:pr-7 {\n    padding-right: 4rem !important;\n  }\n\n  .sm\\:pr-8 {\n    padding-right: 5rem !important;\n  }\n\n  .sm\\:pl-0 {\n    padding-left: 0rem !important;\n  }\n\n  .sm\\:pl-1 {\n    padding-left: 0.25rem !important;\n  }\n\n  .sm\\:pl-2 {\n    padding-left: 0.5rem !important;\n  }\n\n  .sm\\:pl-3 {\n    padding-left: 1rem !important;\n  }\n\n  .sm\\:pl-4 {\n    padding-left: 1.5rem !important;\n  }\n\n  .sm\\:pl-5 {\n    padding-left: 2rem !important;\n  }\n\n  .sm\\:pl-6 {\n    padding-left: 3rem !important;\n  }\n\n  .sm\\:pl-7 {\n    padding-left: 4rem !important;\n  }\n\n  .sm\\:pl-8 {\n    padding-left: 5rem !important;\n  }\n\n  .sm\\:pb-0 {\n    padding-bottom: 0rem !important;\n  }\n\n  .sm\\:pb-1 {\n    padding-bottom: 0.25rem !important;\n  }\n\n  .sm\\:pb-2 {\n    padding-bottom: 0.5rem !important;\n  }\n\n  .sm\\:pb-3 {\n    padding-bottom: 1rem !important;\n  }\n\n  .sm\\:pb-4 {\n    padding-bottom: 1.5rem !important;\n  }\n\n  .sm\\:pb-5 {\n    padding-bottom: 2rem !important;\n  }\n\n  .sm\\:pb-6 {\n    padding-bottom: 3rem !important;\n  }\n\n  .sm\\:pb-7 {\n    padding-bottom: 4rem !important;\n  }\n\n  .sm\\:pb-8 {\n    padding-bottom: 5rem !important;\n  }\n\n  .sm\\:px-0 {\n    padding-left: 0rem !important;\n    padding-right: 0rem !important;\n  }\n\n  .sm\\:px-1 {\n    padding-left: 0.25rem !important;\n    padding-right: 0.25rem !important;\n  }\n\n  .sm\\:px-2 {\n    padding-left: 0.5rem !important;\n    padding-right: 0.5rem !important;\n  }\n\n  .sm\\:px-3 {\n    padding-left: 1rem !important;\n    padding-right: 1rem !important;\n  }\n\n  .sm\\:px-4 {\n    padding-left: 1.5rem !important;\n    padding-right: 1.5rem !important;\n  }\n\n  .sm\\:px-5 {\n    padding-left: 2rem !important;\n    padding-right: 2rem !important;\n  }\n\n  .sm\\:px-6 {\n    padding-left: 3rem !important;\n    padding-right: 3rem !important;\n  }\n\n  .sm\\:px-7 {\n    padding-left: 4rem !important;\n    padding-right: 4rem !important;\n  }\n\n  .sm\\:px-8 {\n    padding-left: 5rem !important;\n    padding-right: 5rem !important;\n  }\n\n  .sm\\:py-0 {\n    padding-top: 0rem !important;\n    padding-bottom: 0rem !important;\n  }\n\n  .sm\\:py-1 {\n    padding-top: 0.25rem !important;\n    padding-bottom: 0.25rem !important;\n  }\n\n  .sm\\:py-2 {\n    padding-top: 0.5rem !important;\n    padding-bottom: 0.5rem !important;\n  }\n\n  .sm\\:py-3 {\n    padding-top: 1rem !important;\n    padding-bottom: 1rem !important;\n  }\n\n  .sm\\:py-4 {\n    padding-top: 1.5rem !important;\n    padding-bottom: 1.5rem !important;\n  }\n\n  .sm\\:py-5 {\n    padding-top: 2rem !important;\n    padding-bottom: 2rem !important;\n  }\n\n  .sm\\:py-6 {\n    padding-top: 3rem !important;\n    padding-bottom: 3rem !important;\n  }\n\n  .sm\\:py-7 {\n    padding-top: 4rem !important;\n    padding-bottom: 4rem !important;\n  }\n\n  .sm\\:py-8 {\n    padding-top: 5rem !important;\n    padding-bottom: 5rem !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:p-0 {\n    padding: 0rem !important;\n  }\n\n  .md\\:p-1 {\n    padding: 0.25rem !important;\n  }\n\n  .md\\:p-2 {\n    padding: 0.5rem !important;\n  }\n\n  .md\\:p-3 {\n    padding: 1rem !important;\n  }\n\n  .md\\:p-4 {\n    padding: 1.5rem !important;\n  }\n\n  .md\\:p-5 {\n    padding: 2rem !important;\n  }\n\n  .md\\:p-6 {\n    padding: 3rem !important;\n  }\n\n  .md\\:p-7 {\n    padding: 4rem !important;\n  }\n\n  .md\\:p-8 {\n    padding: 5rem !important;\n  }\n\n  .md\\:pt-0 {\n    padding-top: 0rem !important;\n  }\n\n  .md\\:pt-1 {\n    padding-top: 0.25rem !important;\n  }\n\n  .md\\:pt-2 {\n    padding-top: 0.5rem !important;\n  }\n\n  .md\\:pt-3 {\n    padding-top: 1rem !important;\n  }\n\n  .md\\:pt-4 {\n    padding-top: 1.5rem !important;\n  }\n\n  .md\\:pt-5 {\n    padding-top: 2rem !important;\n  }\n\n  .md\\:pt-6 {\n    padding-top: 3rem !important;\n  }\n\n  .md\\:pt-7 {\n    padding-top: 4rem !important;\n  }\n\n  .md\\:pt-8 {\n    padding-top: 5rem !important;\n  }\n\n  .md\\:pr-0 {\n    padding-right: 0rem !important;\n  }\n\n  .md\\:pr-1 {\n    padding-right: 0.25rem !important;\n  }\n\n  .md\\:pr-2 {\n    padding-right: 0.5rem !important;\n  }\n\n  .md\\:pr-3 {\n    padding-right: 1rem !important;\n  }\n\n  .md\\:pr-4 {\n    padding-right: 1.5rem !important;\n  }\n\n  .md\\:pr-5 {\n    padding-right: 2rem !important;\n  }\n\n  .md\\:pr-6 {\n    padding-right: 3rem !important;\n  }\n\n  .md\\:pr-7 {\n    padding-right: 4rem !important;\n  }\n\n  .md\\:pr-8 {\n    padding-right: 5rem !important;\n  }\n\n  .md\\:pl-0 {\n    padding-left: 0rem !important;\n  }\n\n  .md\\:pl-1 {\n    padding-left: 0.25rem !important;\n  }\n\n  .md\\:pl-2 {\n    padding-left: 0.5rem !important;\n  }\n\n  .md\\:pl-3 {\n    padding-left: 1rem !important;\n  }\n\n  .md\\:pl-4 {\n    padding-left: 1.5rem !important;\n  }\n\n  .md\\:pl-5 {\n    padding-left: 2rem !important;\n  }\n\n  .md\\:pl-6 {\n    padding-left: 3rem !important;\n  }\n\n  .md\\:pl-7 {\n    padding-left: 4rem !important;\n  }\n\n  .md\\:pl-8 {\n    padding-left: 5rem !important;\n  }\n\n  .md\\:pb-0 {\n    padding-bottom: 0rem !important;\n  }\n\n  .md\\:pb-1 {\n    padding-bottom: 0.25rem !important;\n  }\n\n  .md\\:pb-2 {\n    padding-bottom: 0.5rem !important;\n  }\n\n  .md\\:pb-3 {\n    padding-bottom: 1rem !important;\n  }\n\n  .md\\:pb-4 {\n    padding-bottom: 1.5rem !important;\n  }\n\n  .md\\:pb-5 {\n    padding-bottom: 2rem !important;\n  }\n\n  .md\\:pb-6 {\n    padding-bottom: 3rem !important;\n  }\n\n  .md\\:pb-7 {\n    padding-bottom: 4rem !important;\n  }\n\n  .md\\:pb-8 {\n    padding-bottom: 5rem !important;\n  }\n\n  .md\\:px-0 {\n    padding-left: 0rem !important;\n    padding-right: 0rem !important;\n  }\n\n  .md\\:px-1 {\n    padding-left: 0.25rem !important;\n    padding-right: 0.25rem !important;\n  }\n\n  .md\\:px-2 {\n    padding-left: 0.5rem !important;\n    padding-right: 0.5rem !important;\n  }\n\n  .md\\:px-3 {\n    padding-left: 1rem !important;\n    padding-right: 1rem !important;\n  }\n\n  .md\\:px-4 {\n    padding-left: 1.5rem !important;\n    padding-right: 1.5rem !important;\n  }\n\n  .md\\:px-5 {\n    padding-left: 2rem !important;\n    padding-right: 2rem !important;\n  }\n\n  .md\\:px-6 {\n    padding-left: 3rem !important;\n    padding-right: 3rem !important;\n  }\n\n  .md\\:px-7 {\n    padding-left: 4rem !important;\n    padding-right: 4rem !important;\n  }\n\n  .md\\:px-8 {\n    padding-left: 5rem !important;\n    padding-right: 5rem !important;\n  }\n\n  .md\\:py-0 {\n    padding-top: 0rem !important;\n    padding-bottom: 0rem !important;\n  }\n\n  .md\\:py-1 {\n    padding-top: 0.25rem !important;\n    padding-bottom: 0.25rem !important;\n  }\n\n  .md\\:py-2 {\n    padding-top: 0.5rem !important;\n    padding-bottom: 0.5rem !important;\n  }\n\n  .md\\:py-3 {\n    padding-top: 1rem !important;\n    padding-bottom: 1rem !important;\n  }\n\n  .md\\:py-4 {\n    padding-top: 1.5rem !important;\n    padding-bottom: 1.5rem !important;\n  }\n\n  .md\\:py-5 {\n    padding-top: 2rem !important;\n    padding-bottom: 2rem !important;\n  }\n\n  .md\\:py-6 {\n    padding-top: 3rem !important;\n    padding-bottom: 3rem !important;\n  }\n\n  .md\\:py-7 {\n    padding-top: 4rem !important;\n    padding-bottom: 4rem !important;\n  }\n\n  .md\\:py-8 {\n    padding-top: 5rem !important;\n    padding-bottom: 5rem !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:p-0 {\n    padding: 0rem !important;\n  }\n\n  .lg\\:p-1 {\n    padding: 0.25rem !important;\n  }\n\n  .lg\\:p-2 {\n    padding: 0.5rem !important;\n  }\n\n  .lg\\:p-3 {\n    padding: 1rem !important;\n  }\n\n  .lg\\:p-4 {\n    padding: 1.5rem !important;\n  }\n\n  .lg\\:p-5 {\n    padding: 2rem !important;\n  }\n\n  .lg\\:p-6 {\n    padding: 3rem !important;\n  }\n\n  .lg\\:p-7 {\n    padding: 4rem !important;\n  }\n\n  .lg\\:p-8 {\n    padding: 5rem !important;\n  }\n\n  .lg\\:pt-0 {\n    padding-top: 0rem !important;\n  }\n\n  .lg\\:pt-1 {\n    padding-top: 0.25rem !important;\n  }\n\n  .lg\\:pt-2 {\n    padding-top: 0.5rem !important;\n  }\n\n  .lg\\:pt-3 {\n    padding-top: 1rem !important;\n  }\n\n  .lg\\:pt-4 {\n    padding-top: 1.5rem !important;\n  }\n\n  .lg\\:pt-5 {\n    padding-top: 2rem !important;\n  }\n\n  .lg\\:pt-6 {\n    padding-top: 3rem !important;\n  }\n\n  .lg\\:pt-7 {\n    padding-top: 4rem !important;\n  }\n\n  .lg\\:pt-8 {\n    padding-top: 5rem !important;\n  }\n\n  .lg\\:pr-0 {\n    padding-right: 0rem !important;\n  }\n\n  .lg\\:pr-1 {\n    padding-right: 0.25rem !important;\n  }\n\n  .lg\\:pr-2 {\n    padding-right: 0.5rem !important;\n  }\n\n  .lg\\:pr-3 {\n    padding-right: 1rem !important;\n  }\n\n  .lg\\:pr-4 {\n    padding-right: 1.5rem !important;\n  }\n\n  .lg\\:pr-5 {\n    padding-right: 2rem !important;\n  }\n\n  .lg\\:pr-6 {\n    padding-right: 3rem !important;\n  }\n\n  .lg\\:pr-7 {\n    padding-right: 4rem !important;\n  }\n\n  .lg\\:pr-8 {\n    padding-right: 5rem !important;\n  }\n\n  .lg\\:pl-0 {\n    padding-left: 0rem !important;\n  }\n\n  .lg\\:pl-1 {\n    padding-left: 0.25rem !important;\n  }\n\n  .lg\\:pl-2 {\n    padding-left: 0.5rem !important;\n  }\n\n  .lg\\:pl-3 {\n    padding-left: 1rem !important;\n  }\n\n  .lg\\:pl-4 {\n    padding-left: 1.5rem !important;\n  }\n\n  .lg\\:pl-5 {\n    padding-left: 2rem !important;\n  }\n\n  .lg\\:pl-6 {\n    padding-left: 3rem !important;\n  }\n\n  .lg\\:pl-7 {\n    padding-left: 4rem !important;\n  }\n\n  .lg\\:pl-8 {\n    padding-left: 5rem !important;\n  }\n\n  .lg\\:pb-0 {\n    padding-bottom: 0rem !important;\n  }\n\n  .lg\\:pb-1 {\n    padding-bottom: 0.25rem !important;\n  }\n\n  .lg\\:pb-2 {\n    padding-bottom: 0.5rem !important;\n  }\n\n  .lg\\:pb-3 {\n    padding-bottom: 1rem !important;\n  }\n\n  .lg\\:pb-4 {\n    padding-bottom: 1.5rem !important;\n  }\n\n  .lg\\:pb-5 {\n    padding-bottom: 2rem !important;\n  }\n\n  .lg\\:pb-6 {\n    padding-bottom: 3rem !important;\n  }\n\n  .lg\\:pb-7 {\n    padding-bottom: 4rem !important;\n  }\n\n  .lg\\:pb-8 {\n    padding-bottom: 5rem !important;\n  }\n\n  .lg\\:px-0 {\n    padding-left: 0rem !important;\n    padding-right: 0rem !important;\n  }\n\n  .lg\\:px-1 {\n    padding-left: 0.25rem !important;\n    padding-right: 0.25rem !important;\n  }\n\n  .lg\\:px-2 {\n    padding-left: 0.5rem !important;\n    padding-right: 0.5rem !important;\n  }\n\n  .lg\\:px-3 {\n    padding-left: 1rem !important;\n    padding-right: 1rem !important;\n  }\n\n  .lg\\:px-4 {\n    padding-left: 1.5rem !important;\n    padding-right: 1.5rem !important;\n  }\n\n  .lg\\:px-5 {\n    padding-left: 2rem !important;\n    padding-right: 2rem !important;\n  }\n\n  .lg\\:px-6 {\n    padding-left: 3rem !important;\n    padding-right: 3rem !important;\n  }\n\n  .lg\\:px-7 {\n    padding-left: 4rem !important;\n    padding-right: 4rem !important;\n  }\n\n  .lg\\:px-8 {\n    padding-left: 5rem !important;\n    padding-right: 5rem !important;\n  }\n\n  .lg\\:py-0 {\n    padding-top: 0rem !important;\n    padding-bottom: 0rem !important;\n  }\n\n  .lg\\:py-1 {\n    padding-top: 0.25rem !important;\n    padding-bottom: 0.25rem !important;\n  }\n\n  .lg\\:py-2 {\n    padding-top: 0.5rem !important;\n    padding-bottom: 0.5rem !important;\n  }\n\n  .lg\\:py-3 {\n    padding-top: 1rem !important;\n    padding-bottom: 1rem !important;\n  }\n\n  .lg\\:py-4 {\n    padding-top: 1.5rem !important;\n    padding-bottom: 1.5rem !important;\n  }\n\n  .lg\\:py-5 {\n    padding-top: 2rem !important;\n    padding-bottom: 2rem !important;\n  }\n\n  .lg\\:py-6 {\n    padding-top: 3rem !important;\n    padding-bottom: 3rem !important;\n  }\n\n  .lg\\:py-7 {\n    padding-top: 4rem !important;\n    padding-bottom: 4rem !important;\n  }\n\n  .lg\\:py-8 {\n    padding-top: 5rem !important;\n    padding-bottom: 5rem !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:p-0 {\n    padding: 0rem !important;\n  }\n\n  .xl\\:p-1 {\n    padding: 0.25rem !important;\n  }\n\n  .xl\\:p-2 {\n    padding: 0.5rem !important;\n  }\n\n  .xl\\:p-3 {\n    padding: 1rem !important;\n  }\n\n  .xl\\:p-4 {\n    padding: 1.5rem !important;\n  }\n\n  .xl\\:p-5 {\n    padding: 2rem !important;\n  }\n\n  .xl\\:p-6 {\n    padding: 3rem !important;\n  }\n\n  .xl\\:p-7 {\n    padding: 4rem !important;\n  }\n\n  .xl\\:p-8 {\n    padding: 5rem !important;\n  }\n\n  .xl\\:pt-0 {\n    padding-top: 0rem !important;\n  }\n\n  .xl\\:pt-1 {\n    padding-top: 0.25rem !important;\n  }\n\n  .xl\\:pt-2 {\n    padding-top: 0.5rem !important;\n  }\n\n  .xl\\:pt-3 {\n    padding-top: 1rem !important;\n  }\n\n  .xl\\:pt-4 {\n    padding-top: 1.5rem !important;\n  }\n\n  .xl\\:pt-5 {\n    padding-top: 2rem !important;\n  }\n\n  .xl\\:pt-6 {\n    padding-top: 3rem !important;\n  }\n\n  .xl\\:pt-7 {\n    padding-top: 4rem !important;\n  }\n\n  .xl\\:pt-8 {\n    padding-top: 5rem !important;\n  }\n\n  .xl\\:pr-0 {\n    padding-right: 0rem !important;\n  }\n\n  .xl\\:pr-1 {\n    padding-right: 0.25rem !important;\n  }\n\n  .xl\\:pr-2 {\n    padding-right: 0.5rem !important;\n  }\n\n  .xl\\:pr-3 {\n    padding-right: 1rem !important;\n  }\n\n  .xl\\:pr-4 {\n    padding-right: 1.5rem !important;\n  }\n\n  .xl\\:pr-5 {\n    padding-right: 2rem !important;\n  }\n\n  .xl\\:pr-6 {\n    padding-right: 3rem !important;\n  }\n\n  .xl\\:pr-7 {\n    padding-right: 4rem !important;\n  }\n\n  .xl\\:pr-8 {\n    padding-right: 5rem !important;\n  }\n\n  .xl\\:pl-0 {\n    padding-left: 0rem !important;\n  }\n\n  .xl\\:pl-1 {\n    padding-left: 0.25rem !important;\n  }\n\n  .xl\\:pl-2 {\n    padding-left: 0.5rem !important;\n  }\n\n  .xl\\:pl-3 {\n    padding-left: 1rem !important;\n  }\n\n  .xl\\:pl-4 {\n    padding-left: 1.5rem !important;\n  }\n\n  .xl\\:pl-5 {\n    padding-left: 2rem !important;\n  }\n\n  .xl\\:pl-6 {\n    padding-left: 3rem !important;\n  }\n\n  .xl\\:pl-7 {\n    padding-left: 4rem !important;\n  }\n\n  .xl\\:pl-8 {\n    padding-left: 5rem !important;\n  }\n\n  .xl\\:pb-0 {\n    padding-bottom: 0rem !important;\n  }\n\n  .xl\\:pb-1 {\n    padding-bottom: 0.25rem !important;\n  }\n\n  .xl\\:pb-2 {\n    padding-bottom: 0.5rem !important;\n  }\n\n  .xl\\:pb-3 {\n    padding-bottom: 1rem !important;\n  }\n\n  .xl\\:pb-4 {\n    padding-bottom: 1.5rem !important;\n  }\n\n  .xl\\:pb-5 {\n    padding-bottom: 2rem !important;\n  }\n\n  .xl\\:pb-6 {\n    padding-bottom: 3rem !important;\n  }\n\n  .xl\\:pb-7 {\n    padding-bottom: 4rem !important;\n  }\n\n  .xl\\:pb-8 {\n    padding-bottom: 5rem !important;\n  }\n\n  .xl\\:px-0 {\n    padding-left: 0rem !important;\n    padding-right: 0rem !important;\n  }\n\n  .xl\\:px-1 {\n    padding-left: 0.25rem !important;\n    padding-right: 0.25rem !important;\n  }\n\n  .xl\\:px-2 {\n    padding-left: 0.5rem !important;\n    padding-right: 0.5rem !important;\n  }\n\n  .xl\\:px-3 {\n    padding-left: 1rem !important;\n    padding-right: 1rem !important;\n  }\n\n  .xl\\:px-4 {\n    padding-left: 1.5rem !important;\n    padding-right: 1.5rem !important;\n  }\n\n  .xl\\:px-5 {\n    padding-left: 2rem !important;\n    padding-right: 2rem !important;\n  }\n\n  .xl\\:px-6 {\n    padding-left: 3rem !important;\n    padding-right: 3rem !important;\n  }\n\n  .xl\\:px-7 {\n    padding-left: 4rem !important;\n    padding-right: 4rem !important;\n  }\n\n  .xl\\:px-8 {\n    padding-left: 5rem !important;\n    padding-right: 5rem !important;\n  }\n\n  .xl\\:py-0 {\n    padding-top: 0rem !important;\n    padding-bottom: 0rem !important;\n  }\n\n  .xl\\:py-1 {\n    padding-top: 0.25rem !important;\n    padding-bottom: 0.25rem !important;\n  }\n\n  .xl\\:py-2 {\n    padding-top: 0.5rem !important;\n    padding-bottom: 0.5rem !important;\n  }\n\n  .xl\\:py-3 {\n    padding-top: 1rem !important;\n    padding-bottom: 1rem !important;\n  }\n\n  .xl\\:py-4 {\n    padding-top: 1.5rem !important;\n    padding-bottom: 1.5rem !important;\n  }\n\n  .xl\\:py-5 {\n    padding-top: 2rem !important;\n    padding-bottom: 2rem !important;\n  }\n\n  .xl\\:py-6 {\n    padding-top: 3rem !important;\n    padding-bottom: 3rem !important;\n  }\n\n  .xl\\:py-7 {\n    padding-top: 4rem !important;\n    padding-bottom: 4rem !important;\n  }\n\n  .xl\\:py-8 {\n    padding-top: 5rem !important;\n    padding-bottom: 5rem !important;\n  }\n}\n.m-0 {\n  margin: 0rem !important;\n}\n\n.m-1 {\n  margin: 0.25rem !important;\n}\n\n.m-2 {\n  margin: 0.5rem !important;\n}\n\n.m-3 {\n  margin: 1rem !important;\n}\n\n.m-4 {\n  margin: 1.5rem !important;\n}\n\n.m-5 {\n  margin: 2rem !important;\n}\n\n.m-6 {\n  margin: 3rem !important;\n}\n\n.m-7 {\n  margin: 4rem !important;\n}\n\n.m-8 {\n  margin: 5rem !important;\n}\n\n.-m-1 {\n  margin: -0.25rem !important;\n}\n\n.-m-2 {\n  margin: -0.5rem !important;\n}\n\n.-m-3 {\n  margin: -1rem !important;\n}\n\n.-m-4 {\n  margin: -1.5rem !important;\n}\n\n.-m-5 {\n  margin: -2rem !important;\n}\n\n.-m-6 {\n  margin: -3rem !important;\n}\n\n.-m-7 {\n  margin: -4rem !important;\n}\n\n.-m-8 {\n  margin: -5rem !important;\n}\n\n.m-auto {\n  margin: auto !important;\n}\n\n.mt-0 {\n  margin-top: 0rem !important;\n}\n\n.mt-1 {\n  margin-top: 0.25rem !important;\n}\n\n.mt-2 {\n  margin-top: 0.5rem !important;\n}\n\n.mt-3 {\n  margin-top: 1rem !important;\n}\n\n.mt-4 {\n  margin-top: 1.5rem !important;\n}\n\n.mt-5 {\n  margin-top: 2rem !important;\n}\n\n.mt-6 {\n  margin-top: 3rem !important;\n}\n\n.mt-7 {\n  margin-top: 4rem !important;\n}\n\n.mt-8 {\n  margin-top: 5rem !important;\n}\n\n.-mt-1 {\n  margin-top: -0.25rem !important;\n}\n\n.-mt-2 {\n  margin-top: -0.5rem !important;\n}\n\n.-mt-3 {\n  margin-top: -1rem !important;\n}\n\n.-mt-4 {\n  margin-top: -1.5rem !important;\n}\n\n.-mt-5 {\n  margin-top: -2rem !important;\n}\n\n.-mt-6 {\n  margin-top: -3rem !important;\n}\n\n.-mt-7 {\n  margin-top: -4rem !important;\n}\n\n.-mt-8 {\n  margin-top: -5rem !important;\n}\n\n.mt-auto {\n  margin-top: auto !important;\n}\n\n.mr-0 {\n  margin-right: 0rem !important;\n}\n\n.mr-1 {\n  margin-right: 0.25rem !important;\n}\n\n.mr-2 {\n  margin-right: 0.5rem !important;\n}\n\n.mr-3 {\n  margin-right: 1rem !important;\n}\n\n.mr-4 {\n  margin-right: 1.5rem !important;\n}\n\n.mr-5 {\n  margin-right: 2rem !important;\n}\n\n.mr-6 {\n  margin-right: 3rem !important;\n}\n\n.mr-7 {\n  margin-right: 4rem !important;\n}\n\n.mr-8 {\n  margin-right: 5rem !important;\n}\n\n.-mr-1 {\n  margin-right: -0.25rem !important;\n}\n\n.-mr-2 {\n  margin-right: -0.5rem !important;\n}\n\n.-mr-3 {\n  margin-right: -1rem !important;\n}\n\n.-mr-4 {\n  margin-right: -1.5rem !important;\n}\n\n.-mr-5 {\n  margin-right: -2rem !important;\n}\n\n.-mr-6 {\n  margin-right: -3rem !important;\n}\n\n.-mr-7 {\n  margin-right: -4rem !important;\n}\n\n.-mr-8 {\n  margin-right: -5rem !important;\n}\n\n.mr-auto {\n  margin-right: auto !important;\n}\n\n.ml-0 {\n  margin-left: 0rem !important;\n}\n\n.ml-1 {\n  margin-left: 0.25rem !important;\n}\n\n.ml-2 {\n  margin-left: 0.5rem !important;\n}\n\n.ml-3 {\n  margin-left: 1rem !important;\n}\n\n.ml-4 {\n  margin-left: 1.5rem !important;\n}\n\n.ml-5 {\n  margin-left: 2rem !important;\n}\n\n.ml-6 {\n  margin-left: 3rem !important;\n}\n\n.ml-7 {\n  margin-left: 4rem !important;\n}\n\n.ml-8 {\n  margin-left: 5rem !important;\n}\n\n.-ml-1 {\n  margin-left: -0.25rem !important;\n}\n\n.-ml-2 {\n  margin-left: -0.5rem !important;\n}\n\n.-ml-3 {\n  margin-left: -1rem !important;\n}\n\n.-ml-4 {\n  margin-left: -1.5rem !important;\n}\n\n.-ml-5 {\n  margin-left: -2rem !important;\n}\n\n.-ml-6 {\n  margin-left: -3rem !important;\n}\n\n.-ml-7 {\n  margin-left: -4rem !important;\n}\n\n.-ml-8 {\n  margin-left: -5rem !important;\n}\n\n.ml-auto {\n  margin-left: auto !important;\n}\n\n.mb-0 {\n  margin-bottom: 0rem !important;\n}\n\n.mb-1 {\n  margin-bottom: 0.25rem !important;\n}\n\n.mb-2 {\n  margin-bottom: 0.5rem !important;\n}\n\n.mb-3 {\n  margin-bottom: 1rem !important;\n}\n\n.mb-4 {\n  margin-bottom: 1.5rem !important;\n}\n\n.mb-5 {\n  margin-bottom: 2rem !important;\n}\n\n.mb-6 {\n  margin-bottom: 3rem !important;\n}\n\n.mb-7 {\n  margin-bottom: 4rem !important;\n}\n\n.mb-8 {\n  margin-bottom: 5rem !important;\n}\n\n.-mb-1 {\n  margin-bottom: -0.25rem !important;\n}\n\n.-mb-2 {\n  margin-bottom: -0.5rem !important;\n}\n\n.-mb-3 {\n  margin-bottom: -1rem !important;\n}\n\n.-mb-4 {\n  margin-bottom: -1.5rem !important;\n}\n\n.-mb-5 {\n  margin-bottom: -2rem !important;\n}\n\n.-mb-6 {\n  margin-bottom: -3rem !important;\n}\n\n.-mb-7 {\n  margin-bottom: -4rem !important;\n}\n\n.-mb-8 {\n  margin-bottom: -5rem !important;\n}\n\n.mb-auto {\n  margin-bottom: auto !important;\n}\n\n.mx-0 {\n  margin-left: 0rem !important;\n  margin-right: 0rem !important;\n}\n\n.mx-1 {\n  margin-left: 0.25rem !important;\n  margin-right: 0.25rem !important;\n}\n\n.mx-2 {\n  margin-left: 0.5rem !important;\n  margin-right: 0.5rem !important;\n}\n\n.mx-3 {\n  margin-left: 1rem !important;\n  margin-right: 1rem !important;\n}\n\n.mx-4 {\n  margin-left: 1.5rem !important;\n  margin-right: 1.5rem !important;\n}\n\n.mx-5 {\n  margin-left: 2rem !important;\n  margin-right: 2rem !important;\n}\n\n.mx-6 {\n  margin-left: 3rem !important;\n  margin-right: 3rem !important;\n}\n\n.mx-7 {\n  margin-left: 4rem !important;\n  margin-right: 4rem !important;\n}\n\n.mx-8 {\n  margin-left: 5rem !important;\n  margin-right: 5rem !important;\n}\n\n.-mx-1 {\n  margin-left: -0.25rem !important;\n  margin-right: -0.25rem !important;\n}\n\n.-mx-2 {\n  margin-left: -0.5rem !important;\n  margin-right: -0.5rem !important;\n}\n\n.-mx-3 {\n  margin-left: -1rem !important;\n  margin-right: -1rem !important;\n}\n\n.-mx-4 {\n  margin-left: -1.5rem !important;\n  margin-right: -1.5rem !important;\n}\n\n.-mx-5 {\n  margin-left: -2rem !important;\n  margin-right: -2rem !important;\n}\n\n.-mx-6 {\n  margin-left: -3rem !important;\n  margin-right: -3rem !important;\n}\n\n.-mx-7 {\n  margin-left: -4rem !important;\n  margin-right: -4rem !important;\n}\n\n.-mx-8 {\n  margin-left: -5rem !important;\n  margin-right: -5rem !important;\n}\n\n.mx-auto {\n  margin-left: auto !important;\n  margin-right: auto !important;\n}\n\n.my-0 {\n  margin-top: 0rem !important;\n  margin-bottom: 0rem !important;\n}\n\n.my-1 {\n  margin-top: 0.25rem !important;\n  margin-bottom: 0.25rem !important;\n}\n\n.my-2 {\n  margin-top: 0.5rem !important;\n  margin-bottom: 0.5rem !important;\n}\n\n.my-3 {\n  margin-top: 1rem !important;\n  margin-bottom: 1rem !important;\n}\n\n.my-4 {\n  margin-top: 1.5rem !important;\n  margin-bottom: 1.5rem !important;\n}\n\n.my-5 {\n  margin-top: 2rem !important;\n  margin-bottom: 2rem !important;\n}\n\n.my-6 {\n  margin-top: 3rem !important;\n  margin-bottom: 3rem !important;\n}\n\n.my-7 {\n  margin-top: 4rem !important;\n  margin-bottom: 4rem !important;\n}\n\n.my-8 {\n  margin-top: 5rem !important;\n  margin-bottom: 5rem !important;\n}\n\n.-my-1 {\n  margin-top: -0.25rem !important;\n  margin-bottom: -0.25rem !important;\n}\n\n.-my-2 {\n  margin-top: -0.5rem !important;\n  margin-bottom: -0.5rem !important;\n}\n\n.-my-3 {\n  margin-top: -1rem !important;\n  margin-bottom: -1rem !important;\n}\n\n.-my-4 {\n  margin-top: -1.5rem !important;\n  margin-bottom: -1.5rem !important;\n}\n\n.-my-5 {\n  margin-top: -2rem !important;\n  margin-bottom: -2rem !important;\n}\n\n.-my-6 {\n  margin-top: -3rem !important;\n  margin-bottom: -3rem !important;\n}\n\n.-my-7 {\n  margin-top: -4rem !important;\n  margin-bottom: -4rem !important;\n}\n\n.-my-8 {\n  margin-top: -5rem !important;\n  margin-bottom: -5rem !important;\n}\n\n.my-auto {\n  margin-top: auto !important;\n  margin-bottom: auto !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:m-0 {\n    margin: 0rem !important;\n  }\n\n  .sm\\:m-1 {\n    margin: 0.25rem !important;\n  }\n\n  .sm\\:m-2 {\n    margin: 0.5rem !important;\n  }\n\n  .sm\\:m-3 {\n    margin: 1rem !important;\n  }\n\n  .sm\\:m-4 {\n    margin: 1.5rem !important;\n  }\n\n  .sm\\:m-5 {\n    margin: 2rem !important;\n  }\n\n  .sm\\:m-6 {\n    margin: 3rem !important;\n  }\n\n  .sm\\:m-7 {\n    margin: 4rem !important;\n  }\n\n  .sm\\:m-8 {\n    margin: 5rem !important;\n  }\n\n  .sm\\:-m-1 {\n    margin: -0.25rem !important;\n  }\n\n  .sm\\:-m-2 {\n    margin: -0.5rem !important;\n  }\n\n  .sm\\:-m-3 {\n    margin: -1rem !important;\n  }\n\n  .sm\\:-m-4 {\n    margin: -1.5rem !important;\n  }\n\n  .sm\\:-m-5 {\n    margin: -2rem !important;\n  }\n\n  .sm\\:-m-6 {\n    margin: -3rem !important;\n  }\n\n  .sm\\:-m-7 {\n    margin: -4rem !important;\n  }\n\n  .sm\\:-m-8 {\n    margin: -5rem !important;\n  }\n\n  .sm\\:m-auto {\n    margin: auto !important;\n  }\n\n  .sm\\:mt-0 {\n    margin-top: 0rem !important;\n  }\n\n  .sm\\:mt-1 {\n    margin-top: 0.25rem !important;\n  }\n\n  .sm\\:mt-2 {\n    margin-top: 0.5rem !important;\n  }\n\n  .sm\\:mt-3 {\n    margin-top: 1rem !important;\n  }\n\n  .sm\\:mt-4 {\n    margin-top: 1.5rem !important;\n  }\n\n  .sm\\:mt-5 {\n    margin-top: 2rem !important;\n  }\n\n  .sm\\:mt-6 {\n    margin-top: 3rem !important;\n  }\n\n  .sm\\:mt-7 {\n    margin-top: 4rem !important;\n  }\n\n  .sm\\:mt-8 {\n    margin-top: 5rem !important;\n  }\n\n  .sm\\:-mt-1 {\n    margin-top: -0.25rem !important;\n  }\n\n  .sm\\:-mt-2 {\n    margin-top: -0.5rem !important;\n  }\n\n  .sm\\:-mt-3 {\n    margin-top: -1rem !important;\n  }\n\n  .sm\\:-mt-4 {\n    margin-top: -1.5rem !important;\n  }\n\n  .sm\\:-mt-5 {\n    margin-top: -2rem !important;\n  }\n\n  .sm\\:-mt-6 {\n    margin-top: -3rem !important;\n  }\n\n  .sm\\:-mt-7 {\n    margin-top: -4rem !important;\n  }\n\n  .sm\\:-mt-8 {\n    margin-top: -5rem !important;\n  }\n\n  .sm\\:mt-auto {\n    margin-top: auto !important;\n  }\n\n  .sm\\:mr-0 {\n    margin-right: 0rem !important;\n  }\n\n  .sm\\:mr-1 {\n    margin-right: 0.25rem !important;\n  }\n\n  .sm\\:mr-2 {\n    margin-right: 0.5rem !important;\n  }\n\n  .sm\\:mr-3 {\n    margin-right: 1rem !important;\n  }\n\n  .sm\\:mr-4 {\n    margin-right: 1.5rem !important;\n  }\n\n  .sm\\:mr-5 {\n    margin-right: 2rem !important;\n  }\n\n  .sm\\:mr-6 {\n    margin-right: 3rem !important;\n  }\n\n  .sm\\:mr-7 {\n    margin-right: 4rem !important;\n  }\n\n  .sm\\:mr-8 {\n    margin-right: 5rem !important;\n  }\n\n  .sm\\:-mr-1 {\n    margin-right: -0.25rem !important;\n  }\n\n  .sm\\:-mr-2 {\n    margin-right: -0.5rem !important;\n  }\n\n  .sm\\:-mr-3 {\n    margin-right: -1rem !important;\n  }\n\n  .sm\\:-mr-4 {\n    margin-right: -1.5rem !important;\n  }\n\n  .sm\\:-mr-5 {\n    margin-right: -2rem !important;\n  }\n\n  .sm\\:-mr-6 {\n    margin-right: -3rem !important;\n  }\n\n  .sm\\:-mr-7 {\n    margin-right: -4rem !important;\n  }\n\n  .sm\\:-mr-8 {\n    margin-right: -5rem !important;\n  }\n\n  .sm\\:mr-auto {\n    margin-right: auto !important;\n  }\n\n  .sm\\:ml-0 {\n    margin-left: 0rem !important;\n  }\n\n  .sm\\:ml-1 {\n    margin-left: 0.25rem !important;\n  }\n\n  .sm\\:ml-2 {\n    margin-left: 0.5rem !important;\n  }\n\n  .sm\\:ml-3 {\n    margin-left: 1rem !important;\n  }\n\n  .sm\\:ml-4 {\n    margin-left: 1.5rem !important;\n  }\n\n  .sm\\:ml-5 {\n    margin-left: 2rem !important;\n  }\n\n  .sm\\:ml-6 {\n    margin-left: 3rem !important;\n  }\n\n  .sm\\:ml-7 {\n    margin-left: 4rem !important;\n  }\n\n  .sm\\:ml-8 {\n    margin-left: 5rem !important;\n  }\n\n  .sm\\:-ml-1 {\n    margin-left: -0.25rem !important;\n  }\n\n  .sm\\:-ml-2 {\n    margin-left: -0.5rem !important;\n  }\n\n  .sm\\:-ml-3 {\n    margin-left: -1rem !important;\n  }\n\n  .sm\\:-ml-4 {\n    margin-left: -1.5rem !important;\n  }\n\n  .sm\\:-ml-5 {\n    margin-left: -2rem !important;\n  }\n\n  .sm\\:-ml-6 {\n    margin-left: -3rem !important;\n  }\n\n  .sm\\:-ml-7 {\n    margin-left: -4rem !important;\n  }\n\n  .sm\\:-ml-8 {\n    margin-left: -5rem !important;\n  }\n\n  .sm\\:ml-auto {\n    margin-left: auto !important;\n  }\n\n  .sm\\:mb-0 {\n    margin-bottom: 0rem !important;\n  }\n\n  .sm\\:mb-1 {\n    margin-bottom: 0.25rem !important;\n  }\n\n  .sm\\:mb-2 {\n    margin-bottom: 0.5rem !important;\n  }\n\n  .sm\\:mb-3 {\n    margin-bottom: 1rem !important;\n  }\n\n  .sm\\:mb-4 {\n    margin-bottom: 1.5rem !important;\n  }\n\n  .sm\\:mb-5 {\n    margin-bottom: 2rem !important;\n  }\n\n  .sm\\:mb-6 {\n    margin-bottom: 3rem !important;\n  }\n\n  .sm\\:mb-7 {\n    margin-bottom: 4rem !important;\n  }\n\n  .sm\\:mb-8 {\n    margin-bottom: 5rem !important;\n  }\n\n  .sm\\:-mb-1 {\n    margin-bottom: -0.25rem !important;\n  }\n\n  .sm\\:-mb-2 {\n    margin-bottom: -0.5rem !important;\n  }\n\n  .sm\\:-mb-3 {\n    margin-bottom: -1rem !important;\n  }\n\n  .sm\\:-mb-4 {\n    margin-bottom: -1.5rem !important;\n  }\n\n  .sm\\:-mb-5 {\n    margin-bottom: -2rem !important;\n  }\n\n  .sm\\:-mb-6 {\n    margin-bottom: -3rem !important;\n  }\n\n  .sm\\:-mb-7 {\n    margin-bottom: -4rem !important;\n  }\n\n  .sm\\:-mb-8 {\n    margin-bottom: -5rem !important;\n  }\n\n  .sm\\:mb-auto {\n    margin-bottom: auto !important;\n  }\n\n  .sm\\:mx-0 {\n    margin-left: 0rem !important;\n    margin-right: 0rem !important;\n  }\n\n  .sm\\:mx-1 {\n    margin-left: 0.25rem !important;\n    margin-right: 0.25rem !important;\n  }\n\n  .sm\\:mx-2 {\n    margin-left: 0.5rem !important;\n    margin-right: 0.5rem !important;\n  }\n\n  .sm\\:mx-3 {\n    margin-left: 1rem !important;\n    margin-right: 1rem !important;\n  }\n\n  .sm\\:mx-4 {\n    margin-left: 1.5rem !important;\n    margin-right: 1.5rem !important;\n  }\n\n  .sm\\:mx-5 {\n    margin-left: 2rem !important;\n    margin-right: 2rem !important;\n  }\n\n  .sm\\:mx-6 {\n    margin-left: 3rem !important;\n    margin-right: 3rem !important;\n  }\n\n  .sm\\:mx-7 {\n    margin-left: 4rem !important;\n    margin-right: 4rem !important;\n  }\n\n  .sm\\:mx-8 {\n    margin-left: 5rem !important;\n    margin-right: 5rem !important;\n  }\n\n  .sm\\:-mx-1 {\n    margin-left: -0.25rem !important;\n    margin-right: -0.25rem !important;\n  }\n\n  .sm\\:-mx-2 {\n    margin-left: -0.5rem !important;\n    margin-right: -0.5rem !important;\n  }\n\n  .sm\\:-mx-3 {\n    margin-left: -1rem !important;\n    margin-right: -1rem !important;\n  }\n\n  .sm\\:-mx-4 {\n    margin-left: -1.5rem !important;\n    margin-right: -1.5rem !important;\n  }\n\n  .sm\\:-mx-5 {\n    margin-left: -2rem !important;\n    margin-right: -2rem !important;\n  }\n\n  .sm\\:-mx-6 {\n    margin-left: -3rem !important;\n    margin-right: -3rem !important;\n  }\n\n  .sm\\:-mx-7 {\n    margin-left: -4rem !important;\n    margin-right: -4rem !important;\n  }\n\n  .sm\\:-mx-8 {\n    margin-left: -5rem !important;\n    margin-right: -5rem !important;\n  }\n\n  .sm\\:mx-auto {\n    margin-left: auto !important;\n    margin-right: auto !important;\n  }\n\n  .sm\\:my-0 {\n    margin-top: 0rem !important;\n    margin-bottom: 0rem !important;\n  }\n\n  .sm\\:my-1 {\n    margin-top: 0.25rem !important;\n    margin-bottom: 0.25rem !important;\n  }\n\n  .sm\\:my-2 {\n    margin-top: 0.5rem !important;\n    margin-bottom: 0.5rem !important;\n  }\n\n  .sm\\:my-3 {\n    margin-top: 1rem !important;\n    margin-bottom: 1rem !important;\n  }\n\n  .sm\\:my-4 {\n    margin-top: 1.5rem !important;\n    margin-bottom: 1.5rem !important;\n  }\n\n  .sm\\:my-5 {\n    margin-top: 2rem !important;\n    margin-bottom: 2rem !important;\n  }\n\n  .sm\\:my-6 {\n    margin-top: 3rem !important;\n    margin-bottom: 3rem !important;\n  }\n\n  .sm\\:my-7 {\n    margin-top: 4rem !important;\n    margin-bottom: 4rem !important;\n  }\n\n  .sm\\:my-8 {\n    margin-top: 5rem !important;\n    margin-bottom: 5rem !important;\n  }\n\n  .sm\\:-my-1 {\n    margin-top: -0.25rem !important;\n    margin-bottom: -0.25rem !important;\n  }\n\n  .sm\\:-my-2 {\n    margin-top: -0.5rem !important;\n    margin-bottom: -0.5rem !important;\n  }\n\n  .sm\\:-my-3 {\n    margin-top: -1rem !important;\n    margin-bottom: -1rem !important;\n  }\n\n  .sm\\:-my-4 {\n    margin-top: -1.5rem !important;\n    margin-bottom: -1.5rem !important;\n  }\n\n  .sm\\:-my-5 {\n    margin-top: -2rem !important;\n    margin-bottom: -2rem !important;\n  }\n\n  .sm\\:-my-6 {\n    margin-top: -3rem !important;\n    margin-bottom: -3rem !important;\n  }\n\n  .sm\\:-my-7 {\n    margin-top: -4rem !important;\n    margin-bottom: -4rem !important;\n  }\n\n  .sm\\:-my-8 {\n    margin-top: -5rem !important;\n    margin-bottom: -5rem !important;\n  }\n\n  .sm\\:my-auto {\n    margin-top: auto !important;\n    margin-bottom: auto !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:m-0 {\n    margin: 0rem !important;\n  }\n\n  .md\\:m-1 {\n    margin: 0.25rem !important;\n  }\n\n  .md\\:m-2 {\n    margin: 0.5rem !important;\n  }\n\n  .md\\:m-3 {\n    margin: 1rem !important;\n  }\n\n  .md\\:m-4 {\n    margin: 1.5rem !important;\n  }\n\n  .md\\:m-5 {\n    margin: 2rem !important;\n  }\n\n  .md\\:m-6 {\n    margin: 3rem !important;\n  }\n\n  .md\\:m-7 {\n    margin: 4rem !important;\n  }\n\n  .md\\:m-8 {\n    margin: 5rem !important;\n  }\n\n  .md\\:-m-1 {\n    margin: -0.25rem !important;\n  }\n\n  .md\\:-m-2 {\n    margin: -0.5rem !important;\n  }\n\n  .md\\:-m-3 {\n    margin: -1rem !important;\n  }\n\n  .md\\:-m-4 {\n    margin: -1.5rem !important;\n  }\n\n  .md\\:-m-5 {\n    margin: -2rem !important;\n  }\n\n  .md\\:-m-6 {\n    margin: -3rem !important;\n  }\n\n  .md\\:-m-7 {\n    margin: -4rem !important;\n  }\n\n  .md\\:-m-8 {\n    margin: -5rem !important;\n  }\n\n  .md\\:m-auto {\n    margin: auto !important;\n  }\n\n  .md\\:mt-0 {\n    margin-top: 0rem !important;\n  }\n\n  .md\\:mt-1 {\n    margin-top: 0.25rem !important;\n  }\n\n  .md\\:mt-2 {\n    margin-top: 0.5rem !important;\n  }\n\n  .md\\:mt-3 {\n    margin-top: 1rem !important;\n  }\n\n  .md\\:mt-4 {\n    margin-top: 1.5rem !important;\n  }\n\n  .md\\:mt-5 {\n    margin-top: 2rem !important;\n  }\n\n  .md\\:mt-6 {\n    margin-top: 3rem !important;\n  }\n\n  .md\\:mt-7 {\n    margin-top: 4rem !important;\n  }\n\n  .md\\:mt-8 {\n    margin-top: 5rem !important;\n  }\n\n  .md\\:-mt-1 {\n    margin-top: -0.25rem !important;\n  }\n\n  .md\\:-mt-2 {\n    margin-top: -0.5rem !important;\n  }\n\n  .md\\:-mt-3 {\n    margin-top: -1rem !important;\n  }\n\n  .md\\:-mt-4 {\n    margin-top: -1.5rem !important;\n  }\n\n  .md\\:-mt-5 {\n    margin-top: -2rem !important;\n  }\n\n  .md\\:-mt-6 {\n    margin-top: -3rem !important;\n  }\n\n  .md\\:-mt-7 {\n    margin-top: -4rem !important;\n  }\n\n  .md\\:-mt-8 {\n    margin-top: -5rem !important;\n  }\n\n  .md\\:mt-auto {\n    margin-top: auto !important;\n  }\n\n  .md\\:mr-0 {\n    margin-right: 0rem !important;\n  }\n\n  .md\\:mr-1 {\n    margin-right: 0.25rem !important;\n  }\n\n  .md\\:mr-2 {\n    margin-right: 0.5rem !important;\n  }\n\n  .md\\:mr-3 {\n    margin-right: 1rem !important;\n  }\n\n  .md\\:mr-4 {\n    margin-right: 1.5rem !important;\n  }\n\n  .md\\:mr-5 {\n    margin-right: 2rem !important;\n  }\n\n  .md\\:mr-6 {\n    margin-right: 3rem !important;\n  }\n\n  .md\\:mr-7 {\n    margin-right: 4rem !important;\n  }\n\n  .md\\:mr-8 {\n    margin-right: 5rem !important;\n  }\n\n  .md\\:-mr-1 {\n    margin-right: -0.25rem !important;\n  }\n\n  .md\\:-mr-2 {\n    margin-right: -0.5rem !important;\n  }\n\n  .md\\:-mr-3 {\n    margin-right: -1rem !important;\n  }\n\n  .md\\:-mr-4 {\n    margin-right: -1.5rem !important;\n  }\n\n  .md\\:-mr-5 {\n    margin-right: -2rem !important;\n  }\n\n  .md\\:-mr-6 {\n    margin-right: -3rem !important;\n  }\n\n  .md\\:-mr-7 {\n    margin-right: -4rem !important;\n  }\n\n  .md\\:-mr-8 {\n    margin-right: -5rem !important;\n  }\n\n  .md\\:mr-auto {\n    margin-right: auto !important;\n  }\n\n  .md\\:ml-0 {\n    margin-left: 0rem !important;\n  }\n\n  .md\\:ml-1 {\n    margin-left: 0.25rem !important;\n  }\n\n  .md\\:ml-2 {\n    margin-left: 0.5rem !important;\n  }\n\n  .md\\:ml-3 {\n    margin-left: 1rem !important;\n  }\n\n  .md\\:ml-4 {\n    margin-left: 1.5rem !important;\n  }\n\n  .md\\:ml-5 {\n    margin-left: 2rem !important;\n  }\n\n  .md\\:ml-6 {\n    margin-left: 3rem !important;\n  }\n\n  .md\\:ml-7 {\n    margin-left: 4rem !important;\n  }\n\n  .md\\:ml-8 {\n    margin-left: 5rem !important;\n  }\n\n  .md\\:-ml-1 {\n    margin-left: -0.25rem !important;\n  }\n\n  .md\\:-ml-2 {\n    margin-left: -0.5rem !important;\n  }\n\n  .md\\:-ml-3 {\n    margin-left: -1rem !important;\n  }\n\n  .md\\:-ml-4 {\n    margin-left: -1.5rem !important;\n  }\n\n  .md\\:-ml-5 {\n    margin-left: -2rem !important;\n  }\n\n  .md\\:-ml-6 {\n    margin-left: -3rem !important;\n  }\n\n  .md\\:-ml-7 {\n    margin-left: -4rem !important;\n  }\n\n  .md\\:-ml-8 {\n    margin-left: -5rem !important;\n  }\n\n  .md\\:ml-auto {\n    margin-left: auto !important;\n  }\n\n  .md\\:mb-0 {\n    margin-bottom: 0rem !important;\n  }\n\n  .md\\:mb-1 {\n    margin-bottom: 0.25rem !important;\n  }\n\n  .md\\:mb-2 {\n    margin-bottom: 0.5rem !important;\n  }\n\n  .md\\:mb-3 {\n    margin-bottom: 1rem !important;\n  }\n\n  .md\\:mb-4 {\n    margin-bottom: 1.5rem !important;\n  }\n\n  .md\\:mb-5 {\n    margin-bottom: 2rem !important;\n  }\n\n  .md\\:mb-6 {\n    margin-bottom: 3rem !important;\n  }\n\n  .md\\:mb-7 {\n    margin-bottom: 4rem !important;\n  }\n\n  .md\\:mb-8 {\n    margin-bottom: 5rem !important;\n  }\n\n  .md\\:-mb-1 {\n    margin-bottom: -0.25rem !important;\n  }\n\n  .md\\:-mb-2 {\n    margin-bottom: -0.5rem !important;\n  }\n\n  .md\\:-mb-3 {\n    margin-bottom: -1rem !important;\n  }\n\n  .md\\:-mb-4 {\n    margin-bottom: -1.5rem !important;\n  }\n\n  .md\\:-mb-5 {\n    margin-bottom: -2rem !important;\n  }\n\n  .md\\:-mb-6 {\n    margin-bottom: -3rem !important;\n  }\n\n  .md\\:-mb-7 {\n    margin-bottom: -4rem !important;\n  }\n\n  .md\\:-mb-8 {\n    margin-bottom: -5rem !important;\n  }\n\n  .md\\:mb-auto {\n    margin-bottom: auto !important;\n  }\n\n  .md\\:mx-0 {\n    margin-left: 0rem !important;\n    margin-right: 0rem !important;\n  }\n\n  .md\\:mx-1 {\n    margin-left: 0.25rem !important;\n    margin-right: 0.25rem !important;\n  }\n\n  .md\\:mx-2 {\n    margin-left: 0.5rem !important;\n    margin-right: 0.5rem !important;\n  }\n\n  .md\\:mx-3 {\n    margin-left: 1rem !important;\n    margin-right: 1rem !important;\n  }\n\n  .md\\:mx-4 {\n    margin-left: 1.5rem !important;\n    margin-right: 1.5rem !important;\n  }\n\n  .md\\:mx-5 {\n    margin-left: 2rem !important;\n    margin-right: 2rem !important;\n  }\n\n  .md\\:mx-6 {\n    margin-left: 3rem !important;\n    margin-right: 3rem !important;\n  }\n\n  .md\\:mx-7 {\n    margin-left: 4rem !important;\n    margin-right: 4rem !important;\n  }\n\n  .md\\:mx-8 {\n    margin-left: 5rem !important;\n    margin-right: 5rem !important;\n  }\n\n  .md\\:-mx-1 {\n    margin-left: -0.25rem !important;\n    margin-right: -0.25rem !important;\n  }\n\n  .md\\:-mx-2 {\n    margin-left: -0.5rem !important;\n    margin-right: -0.5rem !important;\n  }\n\n  .md\\:-mx-3 {\n    margin-left: -1rem !important;\n    margin-right: -1rem !important;\n  }\n\n  .md\\:-mx-4 {\n    margin-left: -1.5rem !important;\n    margin-right: -1.5rem !important;\n  }\n\n  .md\\:-mx-5 {\n    margin-left: -2rem !important;\n    margin-right: -2rem !important;\n  }\n\n  .md\\:-mx-6 {\n    margin-left: -3rem !important;\n    margin-right: -3rem !important;\n  }\n\n  .md\\:-mx-7 {\n    margin-left: -4rem !important;\n    margin-right: -4rem !important;\n  }\n\n  .md\\:-mx-8 {\n    margin-left: -5rem !important;\n    margin-right: -5rem !important;\n  }\n\n  .md\\:mx-auto {\n    margin-left: auto !important;\n    margin-right: auto !important;\n  }\n\n  .md\\:my-0 {\n    margin-top: 0rem !important;\n    margin-bottom: 0rem !important;\n  }\n\n  .md\\:my-1 {\n    margin-top: 0.25rem !important;\n    margin-bottom: 0.25rem !important;\n  }\n\n  .md\\:my-2 {\n    margin-top: 0.5rem !important;\n    margin-bottom: 0.5rem !important;\n  }\n\n  .md\\:my-3 {\n    margin-top: 1rem !important;\n    margin-bottom: 1rem !important;\n  }\n\n  .md\\:my-4 {\n    margin-top: 1.5rem !important;\n    margin-bottom: 1.5rem !important;\n  }\n\n  .md\\:my-5 {\n    margin-top: 2rem !important;\n    margin-bottom: 2rem !important;\n  }\n\n  .md\\:my-6 {\n    margin-top: 3rem !important;\n    margin-bottom: 3rem !important;\n  }\n\n  .md\\:my-7 {\n    margin-top: 4rem !important;\n    margin-bottom: 4rem !important;\n  }\n\n  .md\\:my-8 {\n    margin-top: 5rem !important;\n    margin-bottom: 5rem !important;\n  }\n\n  .md\\:-my-1 {\n    margin-top: -0.25rem !important;\n    margin-bottom: -0.25rem !important;\n  }\n\n  .md\\:-my-2 {\n    margin-top: -0.5rem !important;\n    margin-bottom: -0.5rem !important;\n  }\n\n  .md\\:-my-3 {\n    margin-top: -1rem !important;\n    margin-bottom: -1rem !important;\n  }\n\n  .md\\:-my-4 {\n    margin-top: -1.5rem !important;\n    margin-bottom: -1.5rem !important;\n  }\n\n  .md\\:-my-5 {\n    margin-top: -2rem !important;\n    margin-bottom: -2rem !important;\n  }\n\n  .md\\:-my-6 {\n    margin-top: -3rem !important;\n    margin-bottom: -3rem !important;\n  }\n\n  .md\\:-my-7 {\n    margin-top: -4rem !important;\n    margin-bottom: -4rem !important;\n  }\n\n  .md\\:-my-8 {\n    margin-top: -5rem !important;\n    margin-bottom: -5rem !important;\n  }\n\n  .md\\:my-auto {\n    margin-top: auto !important;\n    margin-bottom: auto !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:m-0 {\n    margin: 0rem !important;\n  }\n\n  .lg\\:m-1 {\n    margin: 0.25rem !important;\n  }\n\n  .lg\\:m-2 {\n    margin: 0.5rem !important;\n  }\n\n  .lg\\:m-3 {\n    margin: 1rem !important;\n  }\n\n  .lg\\:m-4 {\n    margin: 1.5rem !important;\n  }\n\n  .lg\\:m-5 {\n    margin: 2rem !important;\n  }\n\n  .lg\\:m-6 {\n    margin: 3rem !important;\n  }\n\n  .lg\\:m-7 {\n    margin: 4rem !important;\n  }\n\n  .lg\\:m-8 {\n    margin: 5rem !important;\n  }\n\n  .lg\\:-m-1 {\n    margin: -0.25rem !important;\n  }\n\n  .lg\\:-m-2 {\n    margin: -0.5rem !important;\n  }\n\n  .lg\\:-m-3 {\n    margin: -1rem !important;\n  }\n\n  .lg\\:-m-4 {\n    margin: -1.5rem !important;\n  }\n\n  .lg\\:-m-5 {\n    margin: -2rem !important;\n  }\n\n  .lg\\:-m-6 {\n    margin: -3rem !important;\n  }\n\n  .lg\\:-m-7 {\n    margin: -4rem !important;\n  }\n\n  .lg\\:-m-8 {\n    margin: -5rem !important;\n  }\n\n  .lg\\:m-auto {\n    margin: auto !important;\n  }\n\n  .lg\\:mt-0 {\n    margin-top: 0rem !important;\n  }\n\n  .lg\\:mt-1 {\n    margin-top: 0.25rem !important;\n  }\n\n  .lg\\:mt-2 {\n    margin-top: 0.5rem !important;\n  }\n\n  .lg\\:mt-3 {\n    margin-top: 1rem !important;\n  }\n\n  .lg\\:mt-4 {\n    margin-top: 1.5rem !important;\n  }\n\n  .lg\\:mt-5 {\n    margin-top: 2rem !important;\n  }\n\n  .lg\\:mt-6 {\n    margin-top: 3rem !important;\n  }\n\n  .lg\\:mt-7 {\n    margin-top: 4rem !important;\n  }\n\n  .lg\\:mt-8 {\n    margin-top: 5rem !important;\n  }\n\n  .lg\\:-mt-1 {\n    margin-top: -0.25rem !important;\n  }\n\n  .lg\\:-mt-2 {\n    margin-top: -0.5rem !important;\n  }\n\n  .lg\\:-mt-3 {\n    margin-top: -1rem !important;\n  }\n\n  .lg\\:-mt-4 {\n    margin-top: -1.5rem !important;\n  }\n\n  .lg\\:-mt-5 {\n    margin-top: -2rem !important;\n  }\n\n  .lg\\:-mt-6 {\n    margin-top: -3rem !important;\n  }\n\n  .lg\\:-mt-7 {\n    margin-top: -4rem !important;\n  }\n\n  .lg\\:-mt-8 {\n    margin-top: -5rem !important;\n  }\n\n  .lg\\:mt-auto {\n    margin-top: auto !important;\n  }\n\n  .lg\\:mr-0 {\n    margin-right: 0rem !important;\n  }\n\n  .lg\\:mr-1 {\n    margin-right: 0.25rem !important;\n  }\n\n  .lg\\:mr-2 {\n    margin-right: 0.5rem !important;\n  }\n\n  .lg\\:mr-3 {\n    margin-right: 1rem !important;\n  }\n\n  .lg\\:mr-4 {\n    margin-right: 1.5rem !important;\n  }\n\n  .lg\\:mr-5 {\n    margin-right: 2rem !important;\n  }\n\n  .lg\\:mr-6 {\n    margin-right: 3rem !important;\n  }\n\n  .lg\\:mr-7 {\n    margin-right: 4rem !important;\n  }\n\n  .lg\\:mr-8 {\n    margin-right: 5rem !important;\n  }\n\n  .lg\\:-mr-1 {\n    margin-right: -0.25rem !important;\n  }\n\n  .lg\\:-mr-2 {\n    margin-right: -0.5rem !important;\n  }\n\n  .lg\\:-mr-3 {\n    margin-right: -1rem !important;\n  }\n\n  .lg\\:-mr-4 {\n    margin-right: -1.5rem !important;\n  }\n\n  .lg\\:-mr-5 {\n    margin-right: -2rem !important;\n  }\n\n  .lg\\:-mr-6 {\n    margin-right: -3rem !important;\n  }\n\n  .lg\\:-mr-7 {\n    margin-right: -4rem !important;\n  }\n\n  .lg\\:-mr-8 {\n    margin-right: -5rem !important;\n  }\n\n  .lg\\:mr-auto {\n    margin-right: auto !important;\n  }\n\n  .lg\\:ml-0 {\n    margin-left: 0rem !important;\n  }\n\n  .lg\\:ml-1 {\n    margin-left: 0.25rem !important;\n  }\n\n  .lg\\:ml-2 {\n    margin-left: 0.5rem !important;\n  }\n\n  .lg\\:ml-3 {\n    margin-left: 1rem !important;\n  }\n\n  .lg\\:ml-4 {\n    margin-left: 1.5rem !important;\n  }\n\n  .lg\\:ml-5 {\n    margin-left: 2rem !important;\n  }\n\n  .lg\\:ml-6 {\n    margin-left: 3rem !important;\n  }\n\n  .lg\\:ml-7 {\n    margin-left: 4rem !important;\n  }\n\n  .lg\\:ml-8 {\n    margin-left: 5rem !important;\n  }\n\n  .lg\\:-ml-1 {\n    margin-left: -0.25rem !important;\n  }\n\n  .lg\\:-ml-2 {\n    margin-left: -0.5rem !important;\n  }\n\n  .lg\\:-ml-3 {\n    margin-left: -1rem !important;\n  }\n\n  .lg\\:-ml-4 {\n    margin-left: -1.5rem !important;\n  }\n\n  .lg\\:-ml-5 {\n    margin-left: -2rem !important;\n  }\n\n  .lg\\:-ml-6 {\n    margin-left: -3rem !important;\n  }\n\n  .lg\\:-ml-7 {\n    margin-left: -4rem !important;\n  }\n\n  .lg\\:-ml-8 {\n    margin-left: -5rem !important;\n  }\n\n  .lg\\:ml-auto {\n    margin-left: auto !important;\n  }\n\n  .lg\\:mb-0 {\n    margin-bottom: 0rem !important;\n  }\n\n  .lg\\:mb-1 {\n    margin-bottom: 0.25rem !important;\n  }\n\n  .lg\\:mb-2 {\n    margin-bottom: 0.5rem !important;\n  }\n\n  .lg\\:mb-3 {\n    margin-bottom: 1rem !important;\n  }\n\n  .lg\\:mb-4 {\n    margin-bottom: 1.5rem !important;\n  }\n\n  .lg\\:mb-5 {\n    margin-bottom: 2rem !important;\n  }\n\n  .lg\\:mb-6 {\n    margin-bottom: 3rem !important;\n  }\n\n  .lg\\:mb-7 {\n    margin-bottom: 4rem !important;\n  }\n\n  .lg\\:mb-8 {\n    margin-bottom: 5rem !important;\n  }\n\n  .lg\\:-mb-1 {\n    margin-bottom: -0.25rem !important;\n  }\n\n  .lg\\:-mb-2 {\n    margin-bottom: -0.5rem !important;\n  }\n\n  .lg\\:-mb-3 {\n    margin-bottom: -1rem !important;\n  }\n\n  .lg\\:-mb-4 {\n    margin-bottom: -1.5rem !important;\n  }\n\n  .lg\\:-mb-5 {\n    margin-bottom: -2rem !important;\n  }\n\n  .lg\\:-mb-6 {\n    margin-bottom: -3rem !important;\n  }\n\n  .lg\\:-mb-7 {\n    margin-bottom: -4rem !important;\n  }\n\n  .lg\\:-mb-8 {\n    margin-bottom: -5rem !important;\n  }\n\n  .lg\\:mb-auto {\n    margin-bottom: auto !important;\n  }\n\n  .lg\\:mx-0 {\n    margin-left: 0rem !important;\n    margin-right: 0rem !important;\n  }\n\n  .lg\\:mx-1 {\n    margin-left: 0.25rem !important;\n    margin-right: 0.25rem !important;\n  }\n\n  .lg\\:mx-2 {\n    margin-left: 0.5rem !important;\n    margin-right: 0.5rem !important;\n  }\n\n  .lg\\:mx-3 {\n    margin-left: 1rem !important;\n    margin-right: 1rem !important;\n  }\n\n  .lg\\:mx-4 {\n    margin-left: 1.5rem !important;\n    margin-right: 1.5rem !important;\n  }\n\n  .lg\\:mx-5 {\n    margin-left: 2rem !important;\n    margin-right: 2rem !important;\n  }\n\n  .lg\\:mx-6 {\n    margin-left: 3rem !important;\n    margin-right: 3rem !important;\n  }\n\n  .lg\\:mx-7 {\n    margin-left: 4rem !important;\n    margin-right: 4rem !important;\n  }\n\n  .lg\\:mx-8 {\n    margin-left: 5rem !important;\n    margin-right: 5rem !important;\n  }\n\n  .lg\\:-mx-1 {\n    margin-left: -0.25rem !important;\n    margin-right: -0.25rem !important;\n  }\n\n  .lg\\:-mx-2 {\n    margin-left: -0.5rem !important;\n    margin-right: -0.5rem !important;\n  }\n\n  .lg\\:-mx-3 {\n    margin-left: -1rem !important;\n    margin-right: -1rem !important;\n  }\n\n  .lg\\:-mx-4 {\n    margin-left: -1.5rem !important;\n    margin-right: -1.5rem !important;\n  }\n\n  .lg\\:-mx-5 {\n    margin-left: -2rem !important;\n    margin-right: -2rem !important;\n  }\n\n  .lg\\:-mx-6 {\n    margin-left: -3rem !important;\n    margin-right: -3rem !important;\n  }\n\n  .lg\\:-mx-7 {\n    margin-left: -4rem !important;\n    margin-right: -4rem !important;\n  }\n\n  .lg\\:-mx-8 {\n    margin-left: -5rem !important;\n    margin-right: -5rem !important;\n  }\n\n  .lg\\:mx-auto {\n    margin-left: auto !important;\n    margin-right: auto !important;\n  }\n\n  .lg\\:my-0 {\n    margin-top: 0rem !important;\n    margin-bottom: 0rem !important;\n  }\n\n  .lg\\:my-1 {\n    margin-top: 0.25rem !important;\n    margin-bottom: 0.25rem !important;\n  }\n\n  .lg\\:my-2 {\n    margin-top: 0.5rem !important;\n    margin-bottom: 0.5rem !important;\n  }\n\n  .lg\\:my-3 {\n    margin-top: 1rem !important;\n    margin-bottom: 1rem !important;\n  }\n\n  .lg\\:my-4 {\n    margin-top: 1.5rem !important;\n    margin-bottom: 1.5rem !important;\n  }\n\n  .lg\\:my-5 {\n    margin-top: 2rem !important;\n    margin-bottom: 2rem !important;\n  }\n\n  .lg\\:my-6 {\n    margin-top: 3rem !important;\n    margin-bottom: 3rem !important;\n  }\n\n  .lg\\:my-7 {\n    margin-top: 4rem !important;\n    margin-bottom: 4rem !important;\n  }\n\n  .lg\\:my-8 {\n    margin-top: 5rem !important;\n    margin-bottom: 5rem !important;\n  }\n\n  .lg\\:-my-1 {\n    margin-top: -0.25rem !important;\n    margin-bottom: -0.25rem !important;\n  }\n\n  .lg\\:-my-2 {\n    margin-top: -0.5rem !important;\n    margin-bottom: -0.5rem !important;\n  }\n\n  .lg\\:-my-3 {\n    margin-top: -1rem !important;\n    margin-bottom: -1rem !important;\n  }\n\n  .lg\\:-my-4 {\n    margin-top: -1.5rem !important;\n    margin-bottom: -1.5rem !important;\n  }\n\n  .lg\\:-my-5 {\n    margin-top: -2rem !important;\n    margin-bottom: -2rem !important;\n  }\n\n  .lg\\:-my-6 {\n    margin-top: -3rem !important;\n    margin-bottom: -3rem !important;\n  }\n\n  .lg\\:-my-7 {\n    margin-top: -4rem !important;\n    margin-bottom: -4rem !important;\n  }\n\n  .lg\\:-my-8 {\n    margin-top: -5rem !important;\n    margin-bottom: -5rem !important;\n  }\n\n  .lg\\:my-auto {\n    margin-top: auto !important;\n    margin-bottom: auto !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:m-0 {\n    margin: 0rem !important;\n  }\n\n  .xl\\:m-1 {\n    margin: 0.25rem !important;\n  }\n\n  .xl\\:m-2 {\n    margin: 0.5rem !important;\n  }\n\n  .xl\\:m-3 {\n    margin: 1rem !important;\n  }\n\n  .xl\\:m-4 {\n    margin: 1.5rem !important;\n  }\n\n  .xl\\:m-5 {\n    margin: 2rem !important;\n  }\n\n  .xl\\:m-6 {\n    margin: 3rem !important;\n  }\n\n  .xl\\:m-7 {\n    margin: 4rem !important;\n  }\n\n  .xl\\:m-8 {\n    margin: 5rem !important;\n  }\n\n  .xl\\:-m-1 {\n    margin: -0.25rem !important;\n  }\n\n  .xl\\:-m-2 {\n    margin: -0.5rem !important;\n  }\n\n  .xl\\:-m-3 {\n    margin: -1rem !important;\n  }\n\n  .xl\\:-m-4 {\n    margin: -1.5rem !important;\n  }\n\n  .xl\\:-m-5 {\n    margin: -2rem !important;\n  }\n\n  .xl\\:-m-6 {\n    margin: -3rem !important;\n  }\n\n  .xl\\:-m-7 {\n    margin: -4rem !important;\n  }\n\n  .xl\\:-m-8 {\n    margin: -5rem !important;\n  }\n\n  .xl\\:m-auto {\n    margin: auto !important;\n  }\n\n  .xl\\:mt-0 {\n    margin-top: 0rem !important;\n  }\n\n  .xl\\:mt-1 {\n    margin-top: 0.25rem !important;\n  }\n\n  .xl\\:mt-2 {\n    margin-top: 0.5rem !important;\n  }\n\n  .xl\\:mt-3 {\n    margin-top: 1rem !important;\n  }\n\n  .xl\\:mt-4 {\n    margin-top: 1.5rem !important;\n  }\n\n  .xl\\:mt-5 {\n    margin-top: 2rem !important;\n  }\n\n  .xl\\:mt-6 {\n    margin-top: 3rem !important;\n  }\n\n  .xl\\:mt-7 {\n    margin-top: 4rem !important;\n  }\n\n  .xl\\:mt-8 {\n    margin-top: 5rem !important;\n  }\n\n  .xl\\:-mt-1 {\n    margin-top: -0.25rem !important;\n  }\n\n  .xl\\:-mt-2 {\n    margin-top: -0.5rem !important;\n  }\n\n  .xl\\:-mt-3 {\n    margin-top: -1rem !important;\n  }\n\n  .xl\\:-mt-4 {\n    margin-top: -1.5rem !important;\n  }\n\n  .xl\\:-mt-5 {\n    margin-top: -2rem !important;\n  }\n\n  .xl\\:-mt-6 {\n    margin-top: -3rem !important;\n  }\n\n  .xl\\:-mt-7 {\n    margin-top: -4rem !important;\n  }\n\n  .xl\\:-mt-8 {\n    margin-top: -5rem !important;\n  }\n\n  .xl\\:mt-auto {\n    margin-top: auto !important;\n  }\n\n  .xl\\:mr-0 {\n    margin-right: 0rem !important;\n  }\n\n  .xl\\:mr-1 {\n    margin-right: 0.25rem !important;\n  }\n\n  .xl\\:mr-2 {\n    margin-right: 0.5rem !important;\n  }\n\n  .xl\\:mr-3 {\n    margin-right: 1rem !important;\n  }\n\n  .xl\\:mr-4 {\n    margin-right: 1.5rem !important;\n  }\n\n  .xl\\:mr-5 {\n    margin-right: 2rem !important;\n  }\n\n  .xl\\:mr-6 {\n    margin-right: 3rem !important;\n  }\n\n  .xl\\:mr-7 {\n    margin-right: 4rem !important;\n  }\n\n  .xl\\:mr-8 {\n    margin-right: 5rem !important;\n  }\n\n  .xl\\:-mr-1 {\n    margin-right: -0.25rem !important;\n  }\n\n  .xl\\:-mr-2 {\n    margin-right: -0.5rem !important;\n  }\n\n  .xl\\:-mr-3 {\n    margin-right: -1rem !important;\n  }\n\n  .xl\\:-mr-4 {\n    margin-right: -1.5rem !important;\n  }\n\n  .xl\\:-mr-5 {\n    margin-right: -2rem !important;\n  }\n\n  .xl\\:-mr-6 {\n    margin-right: -3rem !important;\n  }\n\n  .xl\\:-mr-7 {\n    margin-right: -4rem !important;\n  }\n\n  .xl\\:-mr-8 {\n    margin-right: -5rem !important;\n  }\n\n  .xl\\:mr-auto {\n    margin-right: auto !important;\n  }\n\n  .xl\\:ml-0 {\n    margin-left: 0rem !important;\n  }\n\n  .xl\\:ml-1 {\n    margin-left: 0.25rem !important;\n  }\n\n  .xl\\:ml-2 {\n    margin-left: 0.5rem !important;\n  }\n\n  .xl\\:ml-3 {\n    margin-left: 1rem !important;\n  }\n\n  .xl\\:ml-4 {\n    margin-left: 1.5rem !important;\n  }\n\n  .xl\\:ml-5 {\n    margin-left: 2rem !important;\n  }\n\n  .xl\\:ml-6 {\n    margin-left: 3rem !important;\n  }\n\n  .xl\\:ml-7 {\n    margin-left: 4rem !important;\n  }\n\n  .xl\\:ml-8 {\n    margin-left: 5rem !important;\n  }\n\n  .xl\\:-ml-1 {\n    margin-left: -0.25rem !important;\n  }\n\n  .xl\\:-ml-2 {\n    margin-left: -0.5rem !important;\n  }\n\n  .xl\\:-ml-3 {\n    margin-left: -1rem !important;\n  }\n\n  .xl\\:-ml-4 {\n    margin-left: -1.5rem !important;\n  }\n\n  .xl\\:-ml-5 {\n    margin-left: -2rem !important;\n  }\n\n  .xl\\:-ml-6 {\n    margin-left: -3rem !important;\n  }\n\n  .xl\\:-ml-7 {\n    margin-left: -4rem !important;\n  }\n\n  .xl\\:-ml-8 {\n    margin-left: -5rem !important;\n  }\n\n  .xl\\:ml-auto {\n    margin-left: auto !important;\n  }\n\n  .xl\\:mb-0 {\n    margin-bottom: 0rem !important;\n  }\n\n  .xl\\:mb-1 {\n    margin-bottom: 0.25rem !important;\n  }\n\n  .xl\\:mb-2 {\n    margin-bottom: 0.5rem !important;\n  }\n\n  .xl\\:mb-3 {\n    margin-bottom: 1rem !important;\n  }\n\n  .xl\\:mb-4 {\n    margin-bottom: 1.5rem !important;\n  }\n\n  .xl\\:mb-5 {\n    margin-bottom: 2rem !important;\n  }\n\n  .xl\\:mb-6 {\n    margin-bottom: 3rem !important;\n  }\n\n  .xl\\:mb-7 {\n    margin-bottom: 4rem !important;\n  }\n\n  .xl\\:mb-8 {\n    margin-bottom: 5rem !important;\n  }\n\n  .xl\\:-mb-1 {\n    margin-bottom: -0.25rem !important;\n  }\n\n  .xl\\:-mb-2 {\n    margin-bottom: -0.5rem !important;\n  }\n\n  .xl\\:-mb-3 {\n    margin-bottom: -1rem !important;\n  }\n\n  .xl\\:-mb-4 {\n    margin-bottom: -1.5rem !important;\n  }\n\n  .xl\\:-mb-5 {\n    margin-bottom: -2rem !important;\n  }\n\n  .xl\\:-mb-6 {\n    margin-bottom: -3rem !important;\n  }\n\n  .xl\\:-mb-7 {\n    margin-bottom: -4rem !important;\n  }\n\n  .xl\\:-mb-8 {\n    margin-bottom: -5rem !important;\n  }\n\n  .xl\\:mb-auto {\n    margin-bottom: auto !important;\n  }\n\n  .xl\\:mx-0 {\n    margin-left: 0rem !important;\n    margin-right: 0rem !important;\n  }\n\n  .xl\\:mx-1 {\n    margin-left: 0.25rem !important;\n    margin-right: 0.25rem !important;\n  }\n\n  .xl\\:mx-2 {\n    margin-left: 0.5rem !important;\n    margin-right: 0.5rem !important;\n  }\n\n  .xl\\:mx-3 {\n    margin-left: 1rem !important;\n    margin-right: 1rem !important;\n  }\n\n  .xl\\:mx-4 {\n    margin-left: 1.5rem !important;\n    margin-right: 1.5rem !important;\n  }\n\n  .xl\\:mx-5 {\n    margin-left: 2rem !important;\n    margin-right: 2rem !important;\n  }\n\n  .xl\\:mx-6 {\n    margin-left: 3rem !important;\n    margin-right: 3rem !important;\n  }\n\n  .xl\\:mx-7 {\n    margin-left: 4rem !important;\n    margin-right: 4rem !important;\n  }\n\n  .xl\\:mx-8 {\n    margin-left: 5rem !important;\n    margin-right: 5rem !important;\n  }\n\n  .xl\\:-mx-1 {\n    margin-left: -0.25rem !important;\n    margin-right: -0.25rem !important;\n  }\n\n  .xl\\:-mx-2 {\n    margin-left: -0.5rem !important;\n    margin-right: -0.5rem !important;\n  }\n\n  .xl\\:-mx-3 {\n    margin-left: -1rem !important;\n    margin-right: -1rem !important;\n  }\n\n  .xl\\:-mx-4 {\n    margin-left: -1.5rem !important;\n    margin-right: -1.5rem !important;\n  }\n\n  .xl\\:-mx-5 {\n    margin-left: -2rem !important;\n    margin-right: -2rem !important;\n  }\n\n  .xl\\:-mx-6 {\n    margin-left: -3rem !important;\n    margin-right: -3rem !important;\n  }\n\n  .xl\\:-mx-7 {\n    margin-left: -4rem !important;\n    margin-right: -4rem !important;\n  }\n\n  .xl\\:-mx-8 {\n    margin-left: -5rem !important;\n    margin-right: -5rem !important;\n  }\n\n  .xl\\:mx-auto {\n    margin-left: auto !important;\n    margin-right: auto !important;\n  }\n\n  .xl\\:my-0 {\n    margin-top: 0rem !important;\n    margin-bottom: 0rem !important;\n  }\n\n  .xl\\:my-1 {\n    margin-top: 0.25rem !important;\n    margin-bottom: 0.25rem !important;\n  }\n\n  .xl\\:my-2 {\n    margin-top: 0.5rem !important;\n    margin-bottom: 0.5rem !important;\n  }\n\n  .xl\\:my-3 {\n    margin-top: 1rem !important;\n    margin-bottom: 1rem !important;\n  }\n\n  .xl\\:my-4 {\n    margin-top: 1.5rem !important;\n    margin-bottom: 1.5rem !important;\n  }\n\n  .xl\\:my-5 {\n    margin-top: 2rem !important;\n    margin-bottom: 2rem !important;\n  }\n\n  .xl\\:my-6 {\n    margin-top: 3rem !important;\n    margin-bottom: 3rem !important;\n  }\n\n  .xl\\:my-7 {\n    margin-top: 4rem !important;\n    margin-bottom: 4rem !important;\n  }\n\n  .xl\\:my-8 {\n    margin-top: 5rem !important;\n    margin-bottom: 5rem !important;\n  }\n\n  .xl\\:-my-1 {\n    margin-top: -0.25rem !important;\n    margin-bottom: -0.25rem !important;\n  }\n\n  .xl\\:-my-2 {\n    margin-top: -0.5rem !important;\n    margin-bottom: -0.5rem !important;\n  }\n\n  .xl\\:-my-3 {\n    margin-top: -1rem !important;\n    margin-bottom: -1rem !important;\n  }\n\n  .xl\\:-my-4 {\n    margin-top: -1.5rem !important;\n    margin-bottom: -1.5rem !important;\n  }\n\n  .xl\\:-my-5 {\n    margin-top: -2rem !important;\n    margin-bottom: -2rem !important;\n  }\n\n  .xl\\:-my-6 {\n    margin-top: -3rem !important;\n    margin-bottom: -3rem !important;\n  }\n\n  .xl\\:-my-7 {\n    margin-top: -4rem !important;\n    margin-bottom: -4rem !important;\n  }\n\n  .xl\\:-my-8 {\n    margin-top: -5rem !important;\n    margin-bottom: -5rem !important;\n  }\n\n  .xl\\:my-auto {\n    margin-top: auto !important;\n    margin-bottom: auto !important;\n  }\n}\n.shadow-none {\n  box-shadow: none !important;\n}\n\n.shadow-1 {\n  box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.02), 0px 0px 2px rgba(0, 0, 0, 0.05), 0px 1px 4px rgba(0, 0, 0, 0.08) !important;\n}\n\n.shadow-2 {\n  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.03), 0px 0px 2px rgba(0, 0, 0, 0.06), 0px 2px 6px rgba(0, 0, 0, 0.12) !important;\n}\n\n.shadow-3 {\n  box-shadow: 0px 1px 8px rgba(0, 0, 0, 0.08), 0px 3px 4px rgba(0, 0, 0, 0.1), 0px 1px 4px -1px rgba(0, 0, 0, 0.1) !important;\n}\n\n.shadow-4 {\n  box-shadow: 0px 1px 10px rgba(0, 0, 0, 0.12), 0px 4px 5px rgba(0, 0, 0, 0.14), 0px 2px 4px -1px rgba(0, 0, 0, 0.2) !important;\n}\n\n.shadow-5 {\n  box-shadow: 0px 1px 7px rgba(0, 0, 0, 0.1), 0px 4px 5px -2px rgba(0, 0, 0, 0.12), 0px 10px 15px -5px rgba(0, 0, 0, 0.2) !important;\n}\n\n.shadow-6 {\n  box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.06), 0px 7px 9px rgba(0, 0, 0, 0.12), 0px 20px 25px -8px rgba(0, 0, 0, 0.18) !important;\n}\n\n.shadow-7 {\n  box-shadow: 0px 7px 30px rgba(0, 0, 0, 0.08), 0px 22px 30px 2px rgba(0, 0, 0, 0.15), 0px 8px 10px rgba(0, 0, 0, 0.15) !important;\n}\n\n.shadow-8 {\n  box-shadow: 0px 9px 46px 8px rgba(0, 0, 0, 0.12), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 11px 15px rgba(0, 0, 0, 0.2) !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:shadow-none {\n    box-shadow: none !important;\n  }\n  .sm\\:shadow-1 {\n    box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.02), 0px 0px 2px rgba(0, 0, 0, 0.05), 0px 1px 4px rgba(0, 0, 0, 0.08) !important;\n  }\n  .sm\\:shadow-2 {\n    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.03), 0px 0px 2px rgba(0, 0, 0, 0.06), 0px 2px 6px rgba(0, 0, 0, 0.12) !important;\n  }\n  .sm\\:shadow-3 {\n    box-shadow: 0px 1px 8px rgba(0, 0, 0, 0.08), 0px 3px 4px rgba(0, 0, 0, 0.1), 0px 1px 4px -1px rgba(0, 0, 0, 0.1) !important;\n  }\n  .sm\\:shadow-4 {\n    box-shadow: 0px 1px 10px rgba(0, 0, 0, 0.12), 0px 4px 5px rgba(0, 0, 0, 0.14), 0px 2px 4px -1px rgba(0, 0, 0, 0.2) !important;\n  }\n  .sm\\:shadow-5 {\n    box-shadow: 0px 1px 7px rgba(0, 0, 0, 0.1), 0px 4px 5px -2px rgba(0, 0, 0, 0.12), 0px 10px 15px -5px rgba(0, 0, 0, 0.2) !important;\n  }\n  .sm\\:shadow-6 {\n    box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.06), 0px 7px 9px rgba(0, 0, 0, 0.12), 0px 20px 25px -8px rgba(0, 0, 0, 0.18) !important;\n  }\n  .sm\\:shadow-7 {\n    box-shadow: 0px 7px 30px rgba(0, 0, 0, 0.08), 0px 22px 30px 2px rgba(0, 0, 0, 0.15), 0px 8px 10px rgba(0, 0, 0, 0.15) !important;\n  }\n  .sm\\:shadow-8 {\n    box-shadow: 0px 9px 46px 8px rgba(0, 0, 0, 0.12), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 11px 15px rgba(0, 0, 0, 0.2) !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:shadow-none {\n    box-shadow: none !important;\n  }\n  .md\\:shadow-1 {\n    box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.02), 0px 0px 2px rgba(0, 0, 0, 0.05), 0px 1px 4px rgba(0, 0, 0, 0.08) !important;\n  }\n  .md\\:shadow-2 {\n    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.03), 0px 0px 2px rgba(0, 0, 0, 0.06), 0px 2px 6px rgba(0, 0, 0, 0.12) !important;\n  }\n  .md\\:shadow-3 {\n    box-shadow: 0px 1px 8px rgba(0, 0, 0, 0.08), 0px 3px 4px rgba(0, 0, 0, 0.1), 0px 1px 4px -1px rgba(0, 0, 0, 0.1) !important;\n  }\n  .md\\:shadow-4 {\n    box-shadow: 0px 1px 10px rgba(0, 0, 0, 0.12), 0px 4px 5px rgba(0, 0, 0, 0.14), 0px 2px 4px -1px rgba(0, 0, 0, 0.2) !important;\n  }\n  .md\\:shadow-5 {\n    box-shadow: 0px 1px 7px rgba(0, 0, 0, 0.1), 0px 4px 5px -2px rgba(0, 0, 0, 0.12), 0px 10px 15px -5px rgba(0, 0, 0, 0.2) !important;\n  }\n  .md\\:shadow-6 {\n    box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.06), 0px 7px 9px rgba(0, 0, 0, 0.12), 0px 20px 25px -8px rgba(0, 0, 0, 0.18) !important;\n  }\n  .md\\:shadow-7 {\n    box-shadow: 0px 7px 30px rgba(0, 0, 0, 0.08), 0px 22px 30px 2px rgba(0, 0, 0, 0.15), 0px 8px 10px rgba(0, 0, 0, 0.15) !important;\n  }\n  .md\\:shadow-8 {\n    box-shadow: 0px 9px 46px 8px rgba(0, 0, 0, 0.12), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 11px 15px rgba(0, 0, 0, 0.2) !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:shadow-none {\n    box-shadow: none !important;\n  }\n  .lg\\:shadow-1 {\n    box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.02), 0px 0px 2px rgba(0, 0, 0, 0.05), 0px 1px 4px rgba(0, 0, 0, 0.08) !important;\n  }\n  .lg\\:shadow-2 {\n    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.03), 0px 0px 2px rgba(0, 0, 0, 0.06), 0px 2px 6px rgba(0, 0, 0, 0.12) !important;\n  }\n  .lg\\:shadow-3 {\n    box-shadow: 0px 1px 8px rgba(0, 0, 0, 0.08), 0px 3px 4px rgba(0, 0, 0, 0.1), 0px 1px 4px -1px rgba(0, 0, 0, 0.1) !important;\n  }\n  .lg\\:shadow-4 {\n    box-shadow: 0px 1px 10px rgba(0, 0, 0, 0.12), 0px 4px 5px rgba(0, 0, 0, 0.14), 0px 2px 4px -1px rgba(0, 0, 0, 0.2) !important;\n  }\n  .lg\\:shadow-5 {\n    box-shadow: 0px 1px 7px rgba(0, 0, 0, 0.1), 0px 4px 5px -2px rgba(0, 0, 0, 0.12), 0px 10px 15px -5px rgba(0, 0, 0, 0.2) !important;\n  }\n  .lg\\:shadow-6 {\n    box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.06), 0px 7px 9px rgba(0, 0, 0, 0.12), 0px 20px 25px -8px rgba(0, 0, 0, 0.18) !important;\n  }\n  .lg\\:shadow-7 {\n    box-shadow: 0px 7px 30px rgba(0, 0, 0, 0.08), 0px 22px 30px 2px rgba(0, 0, 0, 0.15), 0px 8px 10px rgba(0, 0, 0, 0.15) !important;\n  }\n  .lg\\:shadow-8 {\n    box-shadow: 0px 9px 46px 8px rgba(0, 0, 0, 0.12), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 11px 15px rgba(0, 0, 0, 0.2) !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:shadow-none {\n    box-shadow: none !important;\n  }\n  .xl\\:shadow-1 {\n    box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.02), 0px 0px 2px rgba(0, 0, 0, 0.05), 0px 1px 4px rgba(0, 0, 0, 0.08) !important;\n  }\n  .xl\\:shadow-2 {\n    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.03), 0px 0px 2px rgba(0, 0, 0, 0.06), 0px 2px 6px rgba(0, 0, 0, 0.12) !important;\n  }\n  .xl\\:shadow-3 {\n    box-shadow: 0px 1px 8px rgba(0, 0, 0, 0.08), 0px 3px 4px rgba(0, 0, 0, 0.1), 0px 1px 4px -1px rgba(0, 0, 0, 0.1) !important;\n  }\n  .xl\\:shadow-4 {\n    box-shadow: 0px 1px 10px rgba(0, 0, 0, 0.12), 0px 4px 5px rgba(0, 0, 0, 0.14), 0px 2px 4px -1px rgba(0, 0, 0, 0.2) !important;\n  }\n  .xl\\:shadow-5 {\n    box-shadow: 0px 1px 7px rgba(0, 0, 0, 0.1), 0px 4px 5px -2px rgba(0, 0, 0, 0.12), 0px 10px 15px -5px rgba(0, 0, 0, 0.2) !important;\n  }\n  .xl\\:shadow-6 {\n    box-shadow: 0px 3px 5px rgba(0, 0, 0, 0.06), 0px 7px 9px rgba(0, 0, 0, 0.12), 0px 20px 25px -8px rgba(0, 0, 0, 0.18) !important;\n  }\n  .xl\\:shadow-7 {\n    box-shadow: 0px 7px 30px rgba(0, 0, 0, 0.08), 0px 22px 30px 2px rgba(0, 0, 0, 0.15), 0px 8px 10px rgba(0, 0, 0, 0.15) !important;\n  }\n  .xl\\:shadow-8 {\n    box-shadow: 0px 9px 46px 8px rgba(0, 0, 0, 0.12), 0px 24px 38px 3px rgba(0, 0, 0, 0.14), 0px 11px 15px rgba(0, 0, 0, 0.2) !important;\n  }\n}\n.border-none {\n  border-width: 0px !important;\n  border-style: none;\n}\n\n.border-1 {\n  border-width: 1px !important;\n  border-style: solid;\n}\n\n.border-2 {\n  border-width: 2px !important;\n  border-style: solid;\n}\n\n.border-3 {\n  border-width: 3px !important;\n  border-style: solid;\n}\n\n.border-top-none {\n  border-top-width: 0px !important;\n  border-top-style: none;\n}\n\n.border-top-1 {\n  border-top-width: 1px !important;\n  border-top-style: solid;\n}\n\n.border-top-2 {\n  border-top-width: 2px !important;\n  border-top-style: solid;\n}\n\n.border-top-3 {\n  border-top-width: 3px !important;\n  border-top-style: solid;\n}\n\n.border-right-none {\n  border-right-width: 0px !important;\n  border-right-style: none;\n}\n\n.border-right-1 {\n  border-right-width: 1px !important;\n  border-right-style: solid;\n}\n\n.border-right-2 {\n  border-right-width: 2px !important;\n  border-right-style: solid;\n}\n\n.border-right-3 {\n  border-right-width: 3px !important;\n  border-right-style: solid;\n}\n\n.border-left-none {\n  border-left-width: 0px !important;\n  border-left-style: none;\n}\n\n.border-left-1 {\n  border-left-width: 1px !important;\n  border-left-style: solid;\n}\n\n.border-left-2 {\n  border-left-width: 2px !important;\n  border-left-style: solid;\n}\n\n.border-left-3 {\n  border-left-width: 3px !important;\n  border-left-style: solid;\n}\n\n.border-bottom-none {\n  border-bottom-width: 0px !important;\n  border-bottom-style: none;\n}\n\n.border-bottom-1 {\n  border-bottom-width: 1px !important;\n  border-bottom-style: solid;\n}\n\n.border-bottom-2 {\n  border-bottom-width: 2px !important;\n  border-bottom-style: solid;\n}\n\n.border-bottom-3 {\n  border-bottom-width: 3px !important;\n  border-bottom-style: solid;\n}\n\n.border-x-none {\n  border-left-width: 0px !important;\n  border-left-style: none;\n  border-right-width: 0px !important;\n  border-right-style: none;\n}\n\n.border-x-1 {\n  border-left-width: 1px !important;\n  border-left-style: solid;\n  border-right-width: 1px !important;\n  border-right-style: solid;\n}\n\n.border-x-2 {\n  border-left-width: 2px !important;\n  border-left-style: solid;\n  border-right-width: 2px !important;\n  border-right-style: solid;\n}\n\n.border-x-3 {\n  border-left-width: 3px !important;\n  border-left-style: solid;\n  border-right-width: 3px !important;\n  border-right-style: solid;\n}\n\n.border-y-none {\n  border-top-width: 0px !important;\n  border-top-style: none;\n  border-bottom-width: 0px !important;\n  border-bottom-style: none;\n}\n\n.border-y-1 {\n  border-top-width: 1px !important;\n  border-top-style: solid;\n  border-bottom-width: 1px !important;\n  border-bottom-style: solid;\n}\n\n.border-y-2 {\n  border-top-width: 2px !important;\n  border-top-style: solid;\n  border-bottom-width: 2px !important;\n  border-bottom-style: solid;\n}\n\n.border-y-3 {\n  border-top-width: 3px !important;\n  border-top-style: solid;\n  border-bottom-width: 3px !important;\n  border-bottom-style: solid;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:border-none {\n    border-width: 0px !important;\n    border-style: none;\n  }\n  .sm\\:border-1 {\n    border-width: 1px !important;\n    border-style: solid;\n  }\n  .sm\\:border-2 {\n    border-width: 2px !important;\n    border-style: solid;\n  }\n  .sm\\:border-3 {\n    border-width: 3px !important;\n    border-style: solid;\n  }\n  .sm\\:border-top-none {\n    border-top-width: 0px !important;\n    border-top-style: none;\n  }\n  .sm\\:border-top-1 {\n    border-top-width: 1px !important;\n    border-top-style: solid;\n  }\n  .sm\\:border-top-2 {\n    border-top-width: 2px !important;\n    border-top-style: solid;\n  }\n  .sm\\:border-top-3 {\n    border-top-width: 3px !important;\n    border-top-style: solid;\n  }\n  .sm\\:border-right-none {\n    border-right-width: 0px !important;\n    border-right-style: none;\n  }\n  .sm\\:border-right-1 {\n    border-right-width: 1px !important;\n    border-right-style: solid;\n  }\n  .sm\\:border-right-2 {\n    border-right-width: 2px !important;\n    border-right-style: solid;\n  }\n  .sm\\:border-right-3 {\n    border-right-width: 3px !important;\n    border-right-style: solid;\n  }\n  .sm\\:border-left-none {\n    border-left-width: 0px !important;\n    border-left-style: none;\n  }\n  .sm\\:border-left-1 {\n    border-left-width: 1px !important;\n    border-left-style: solid;\n  }\n  .sm\\:border-left-2 {\n    border-left-width: 2px !important;\n    border-left-style: solid;\n  }\n  .sm\\:border-left-3 {\n    border-left-width: 3px !important;\n    border-left-style: solid;\n  }\n  .sm\\:border-bottom-none {\n    border-bottom-width: 0px !important;\n    border-bottom-style: none;\n  }\n  .sm\\:border-bottom-1 {\n    border-bottom-width: 1px !important;\n    border-bottom-style: solid;\n  }\n  .sm\\:border-bottom-2 {\n    border-bottom-width: 2px !important;\n    border-bottom-style: solid;\n  }\n  .sm\\:border-bottom-3 {\n    border-bottom-width: 3px !important;\n    border-bottom-style: solid;\n  }\n  .sm\\:border-x-none {\n    border-left-width: 0px !important;\n    border-left-style: none;\n    border-right-width: 0px !important;\n    border-right-style: none;\n  }\n  .sm\\:border-x-1 {\n    border-left-width: 1px !important;\n    border-left-style: solid;\n    border-right-width: 1px !important;\n    border-right-style: solid;\n  }\n  .sm\\:border-x-2 {\n    border-left-width: 2px !important;\n    border-left-style: solid;\n    border-right-width: 2px !important;\n    border-right-style: solid;\n  }\n  .sm\\:border-x-3 {\n    border-left-width: 3px !important;\n    border-left-style: solid;\n    border-right-width: 3px !important;\n    border-right-style: solid;\n  }\n  .sm\\:border-y-none {\n    border-top-width: 0px !important;\n    border-top-style: none;\n    border-bottom-width: 0px !important;\n    border-bottom-style: none;\n  }\n  .sm\\:border-y-1 {\n    border-top-width: 1px !important;\n    border-top-style: solid;\n    border-bottom-width: 1px !important;\n    border-bottom-style: solid;\n  }\n  .sm\\:border-y-2 {\n    border-top-width: 2px !important;\n    border-top-style: solid;\n    border-bottom-width: 2px !important;\n    border-bottom-style: solid;\n  }\n  .sm\\:border-y-3 {\n    border-top-width: 3px !important;\n    border-top-style: solid;\n    border-bottom-width: 3px !important;\n    border-bottom-style: solid;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:border-none {\n    border-width: 0px !important;\n    border-style: none;\n  }\n  .md\\:border-1 {\n    border-width: 1px !important;\n    border-style: solid;\n  }\n  .md\\:border-2 {\n    border-width: 2px !important;\n    border-style: solid;\n  }\n  .md\\:border-3 {\n    border-width: 3px !important;\n    border-style: solid;\n  }\n  .md\\:border-top-none {\n    border-top-width: 0px !important;\n    border-top-style: none;\n  }\n  .md\\:border-top-1 {\n    border-top-width: 1px !important;\n    border-top-style: solid;\n  }\n  .md\\:border-top-2 {\n    border-top-width: 2px !important;\n    border-top-style: solid;\n  }\n  .md\\:border-top-3 {\n    border-top-width: 3px !important;\n    border-top-style: solid;\n  }\n  .md\\:border-right-none {\n    border-right-width: 0px !important;\n    border-right-style: none;\n  }\n  .md\\:border-right-1 {\n    border-right-width: 1px !important;\n    border-right-style: solid;\n  }\n  .md\\:border-right-2 {\n    border-right-width: 2px !important;\n    border-right-style: solid;\n  }\n  .md\\:border-right-3 {\n    border-right-width: 3px !important;\n    border-right-style: solid;\n  }\n  .md\\:border-left-none {\n    border-left-width: 0px !important;\n    border-left-style: none;\n  }\n  .md\\:border-left-1 {\n    border-left-width: 1px !important;\n    border-left-style: solid;\n  }\n  .md\\:border-left-2 {\n    border-left-width: 2px !important;\n    border-left-style: solid;\n  }\n  .md\\:border-left-3 {\n    border-left-width: 3px !important;\n    border-left-style: solid;\n  }\n  .md\\:border-bottom-none {\n    border-bottom-width: 0px !important;\n    border-bottom-style: none;\n  }\n  .md\\:border-bottom-1 {\n    border-bottom-width: 1px !important;\n    border-bottom-style: solid;\n  }\n  .md\\:border-bottom-2 {\n    border-bottom-width: 2px !important;\n    border-bottom-style: solid;\n  }\n  .md\\:border-bottom-3 {\n    border-bottom-width: 3px !important;\n    border-bottom-style: solid;\n  }\n  .md\\:border-x-none {\n    border-left-width: 0px !important;\n    border-left-style: none;\n    border-right-width: 0px !important;\n    border-right-style: none;\n  }\n  .md\\:border-x-1 {\n    border-left-width: 1px !important;\n    border-left-style: solid;\n    border-right-width: 1px !important;\n    border-right-style: solid;\n  }\n  .md\\:border-x-2 {\n    border-left-width: 2px !important;\n    border-left-style: solid;\n    border-right-width: 2px !important;\n    border-right-style: solid;\n  }\n  .md\\:border-x-3 {\n    border-left-width: 3px !important;\n    border-left-style: solid;\n    border-right-width: 3px !important;\n    border-right-style: solid;\n  }\n  .md\\:border-y-none {\n    border-top-width: 0px !important;\n    border-top-style: none;\n    border-bottom-width: 0px !important;\n    border-bottom-style: none;\n  }\n  .md\\:border-y-1 {\n    border-top-width: 1px !important;\n    border-top-style: solid;\n    border-bottom-width: 1px !important;\n    border-bottom-style: solid;\n  }\n  .md\\:border-y-2 {\n    border-top-width: 2px !important;\n    border-top-style: solid;\n    border-bottom-width: 2px !important;\n    border-bottom-style: solid;\n  }\n  .md\\:border-y-3 {\n    border-top-width: 3px !important;\n    border-top-style: solid;\n    border-bottom-width: 3px !important;\n    border-bottom-style: solid;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:border-none {\n    border-width: 0px !important;\n    border-style: none;\n  }\n  .lg\\:border-1 {\n    border-width: 1px !important;\n    border-style: solid;\n  }\n  .lg\\:border-2 {\n    border-width: 2px !important;\n    border-style: solid;\n  }\n  .lg\\:border-3 {\n    border-width: 3px !important;\n    border-style: solid;\n  }\n  .lg\\:border-top-none {\n    border-top-width: 0px !important;\n    border-top-style: none;\n  }\n  .lg\\:border-top-1 {\n    border-top-width: 1px !important;\n    border-top-style: solid;\n  }\n  .lg\\:border-top-2 {\n    border-top-width: 2px !important;\n    border-top-style: solid;\n  }\n  .lg\\:border-top-3 {\n    border-top-width: 3px !important;\n    border-top-style: solid;\n  }\n  .lg\\:border-right-none {\n    border-right-width: 0px !important;\n    border-right-style: none;\n  }\n  .lg\\:border-right-1 {\n    border-right-width: 1px !important;\n    border-right-style: solid;\n  }\n  .lg\\:border-right-2 {\n    border-right-width: 2px !important;\n    border-right-style: solid;\n  }\n  .lg\\:border-right-3 {\n    border-right-width: 3px !important;\n    border-right-style: solid;\n  }\n  .lg\\:border-left-none {\n    border-left-width: 0px !important;\n    border-left-style: none;\n  }\n  .lg\\:border-left-1 {\n    border-left-width: 1px !important;\n    border-left-style: solid;\n  }\n  .lg\\:border-left-2 {\n    border-left-width: 2px !important;\n    border-left-style: solid;\n  }\n  .lg\\:border-left-3 {\n    border-left-width: 3px !important;\n    border-left-style: solid;\n  }\n  .lg\\:border-bottom-none {\n    border-bottom-width: 0px !important;\n    border-bottom-style: none;\n  }\n  .lg\\:border-bottom-1 {\n    border-bottom-width: 1px !important;\n    border-bottom-style: solid;\n  }\n  .lg\\:border-bottom-2 {\n    border-bottom-width: 2px !important;\n    border-bottom-style: solid;\n  }\n  .lg\\:border-bottom-3 {\n    border-bottom-width: 3px !important;\n    border-bottom-style: solid;\n  }\n  .lg\\:border-x-none {\n    border-left-width: 0px !important;\n    border-left-style: none;\n    border-right-width: 0px !important;\n    border-right-style: none;\n  }\n  .lg\\:border-x-1 {\n    border-left-width: 1px !important;\n    border-left-style: solid;\n    border-right-width: 1px !important;\n    border-right-style: solid;\n  }\n  .lg\\:border-x-2 {\n    border-left-width: 2px !important;\n    border-left-style: solid;\n    border-right-width: 2px !important;\n    border-right-style: solid;\n  }\n  .lg\\:border-x-3 {\n    border-left-width: 3px !important;\n    border-left-style: solid;\n    border-right-width: 3px !important;\n    border-right-style: solid;\n  }\n  .lg\\:border-y-none {\n    border-top-width: 0px !important;\n    border-top-style: none;\n    border-bottom-width: 0px !important;\n    border-bottom-style: none;\n  }\n  .lg\\:border-y-1 {\n    border-top-width: 1px !important;\n    border-top-style: solid;\n    border-bottom-width: 1px !important;\n    border-bottom-style: solid;\n  }\n  .lg\\:border-y-2 {\n    border-top-width: 2px !important;\n    border-top-style: solid;\n    border-bottom-width: 2px !important;\n    border-bottom-style: solid;\n  }\n  .lg\\:border-y-3 {\n    border-top-width: 3px !important;\n    border-top-style: solid;\n    border-bottom-width: 3px !important;\n    border-bottom-style: solid;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:border-none {\n    border-width: 0px !important;\n    border-style: none;\n  }\n  .xl\\:border-1 {\n    border-width: 1px !important;\n    border-style: solid;\n  }\n  .xl\\:border-2 {\n    border-width: 2px !important;\n    border-style: solid;\n  }\n  .xl\\:border-3 {\n    border-width: 3px !important;\n    border-style: solid;\n  }\n  .xl\\:border-top-none {\n    border-top-width: 0px !important;\n    border-top-style: none;\n  }\n  .xl\\:border-top-1 {\n    border-top-width: 1px !important;\n    border-top-style: solid;\n  }\n  .xl\\:border-top-2 {\n    border-top-width: 2px !important;\n    border-top-style: solid;\n  }\n  .xl\\:border-top-3 {\n    border-top-width: 3px !important;\n    border-top-style: solid;\n  }\n  .xl\\:border-right-none {\n    border-right-width: 0px !important;\n    border-right-style: none;\n  }\n  .xl\\:border-right-1 {\n    border-right-width: 1px !important;\n    border-right-style: solid;\n  }\n  .xl\\:border-right-2 {\n    border-right-width: 2px !important;\n    border-right-style: solid;\n  }\n  .xl\\:border-right-3 {\n    border-right-width: 3px !important;\n    border-right-style: solid;\n  }\n  .xl\\:border-left-none {\n    border-left-width: 0px !important;\n    border-left-style: none;\n  }\n  .xl\\:border-left-1 {\n    border-left-width: 1px !important;\n    border-left-style: solid;\n  }\n  .xl\\:border-left-2 {\n    border-left-width: 2px !important;\n    border-left-style: solid;\n  }\n  .xl\\:border-left-3 {\n    border-left-width: 3px !important;\n    border-left-style: solid;\n  }\n  .xl\\:border-bottom-none {\n    border-bottom-width: 0px !important;\n    border-bottom-style: none;\n  }\n  .xl\\:border-bottom-1 {\n    border-bottom-width: 1px !important;\n    border-bottom-style: solid;\n  }\n  .xl\\:border-bottom-2 {\n    border-bottom-width: 2px !important;\n    border-bottom-style: solid;\n  }\n  .xl\\:border-bottom-3 {\n    border-bottom-width: 3px !important;\n    border-bottom-style: solid;\n  }\n  .xl\\:border-x-none {\n    border-left-width: 0px !important;\n    border-left-style: none;\n    border-right-width: 0px !important;\n    border-right-style: none;\n  }\n  .xl\\:border-x-1 {\n    border-left-width: 1px !important;\n    border-left-style: solid;\n    border-right-width: 1px !important;\n    border-right-style: solid;\n  }\n  .xl\\:border-x-2 {\n    border-left-width: 2px !important;\n    border-left-style: solid;\n    border-right-width: 2px !important;\n    border-right-style: solid;\n  }\n  .xl\\:border-x-3 {\n    border-left-width: 3px !important;\n    border-left-style: solid;\n    border-right-width: 3px !important;\n    border-right-style: solid;\n  }\n  .xl\\:border-y-none {\n    border-top-width: 0px !important;\n    border-top-style: none;\n    border-bottom-width: 0px !important;\n    border-bottom-style: none;\n  }\n  .xl\\:border-y-1 {\n    border-top-width: 1px !important;\n    border-top-style: solid;\n    border-bottom-width: 1px !important;\n    border-bottom-style: solid;\n  }\n  .xl\\:border-y-2 {\n    border-top-width: 2px !important;\n    border-top-style: solid;\n    border-bottom-width: 2px !important;\n    border-bottom-style: solid;\n  }\n  .xl\\:border-y-3 {\n    border-top-width: 3px !important;\n    border-top-style: solid;\n    border-bottom-width: 3px !important;\n    border-bottom-style: solid;\n  }\n}\n.border-solid {\n  border-style: solid !important;\n}\n\n.border-dashed {\n  border-style: dashed !important;\n}\n\n.border-dotted {\n  border-style: dotted !important;\n}\n\n.border-double {\n  border-style: double !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:border-solid {\n    border-style: solid !important;\n  }\n  .sm\\:border-dashed {\n    border-style: dashed !important;\n  }\n  .sm\\:border-dotted {\n    border-style: dotted !important;\n  }\n  .sm\\:border-double {\n    border-style: double !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:border-solid {\n    border-style: solid !important;\n  }\n  .md\\:border-dashed {\n    border-style: dashed !important;\n  }\n  .md\\:border-dotted {\n    border-style: dotted !important;\n  }\n  .md\\:border-double {\n    border-style: double !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:border-solid {\n    border-style: solid !important;\n  }\n  .lg\\:border-dashed {\n    border-style: dashed !important;\n  }\n  .lg\\:border-dotted {\n    border-style: dotted !important;\n  }\n  .lg\\:border-double {\n    border-style: double !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:border-solid {\n    border-style: solid !important;\n  }\n  .xl\\:border-dashed {\n    border-style: dashed !important;\n  }\n  .xl\\:border-dotted {\n    border-style: dotted !important;\n  }\n  .xl\\:border-double {\n    border-style: double !important;\n  }\n}\n.border-round-left {\n  border-top-left-radius: var(--border-radius);\n  border-bottom-left-radius: var(--border-radius);\n}\n\n.border-round-top {\n  border-top-left-radius: var(--border-radius);\n  border-top-right-radius: var(--border-radius);\n}\n\n.border-round-right {\n  border-top-right-radius: var(--border-radius);\n  border-bottom-right-radius: var(--border-radius);\n}\n\n.border-round-bottom {\n  border-bottom-left-radius: var(--border-radius);\n  border-bottom-right-radius: var(--border-radius);\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:border-round-left {\n    border-top-left-radius: var(--border-radius);\n    border-bottom-left-radius: var(--border-radius);\n  }\n  .sm\\:border-round-top {\n    border-top-left-radius: var(--border-radius);\n    border-top-right-radius: var(--border-radius);\n  }\n  .sm\\:border-round-right {\n    border-top-right-radius: var(--border-radius);\n    border-bottom-right-radius: var(--border-radius);\n  }\n  .sm\\:border-round-bottom {\n    border-bottom-left-radius: var(--border-radius);\n    border-bottom-right-radius: var(--border-radius);\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:border-round-left {\n    border-top-left-radius: var(--border-radius);\n    border-bottom-left-radius: var(--border-radius);\n  }\n  .md\\:border-round-top {\n    border-top-left-radius: var(--border-radius);\n    border-top-right-radius: var(--border-radius);\n  }\n  .md\\:border-round-right {\n    border-top-right-radius: var(--border-radius);\n    border-bottom-right-radius: var(--border-radius);\n  }\n  .md\\:border-round-bottom {\n    border-bottom-left-radius: var(--border-radius);\n    border-bottom-right-radius: var(--border-radius);\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:border-round-left {\n    border-top-left-radius: var(--border-radius);\n    border-bottom-left-radius: var(--border-radius);\n  }\n  .lg\\:border-round-top {\n    border-top-left-radius: var(--border-radius);\n    border-top-right-radius: var(--border-radius);\n  }\n  .lg\\:border-round-right {\n    border-top-right-radius: var(--border-radius);\n    border-bottom-right-radius: var(--border-radius);\n  }\n  .lg\\:border-round-bottom {\n    border-bottom-left-radius: var(--border-radius);\n    border-bottom-right-radius: var(--border-radius);\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:border-round-left {\n    border-top-left-radius: var(--border-radius);\n    border-bottom-left-radius: var(--border-radius);\n  }\n  .xl\\:border-round-top {\n    border-top-left-radius: var(--border-radius);\n    border-top-right-radius: var(--border-radius);\n  }\n  .xl\\:border-round-right {\n    border-top-right-radius: var(--border-radius);\n    border-bottom-right-radius: var(--border-radius);\n  }\n  .xl\\:border-round-bottom {\n    border-bottom-left-radius: var(--border-radius);\n    border-bottom-right-radius: var(--border-radius);\n  }\n}\n.border-noround {\n  border-radius: 0 !important;\n}\n\n.border-round {\n  border-radius: var(--border-radius) !important;\n}\n\n.border-circle {\n  border-radius: 50% !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:border-noround {\n    border-radius: 0 !important;\n  }\n  .sm\\:border-round {\n    border-radius: var(--border-radius) !important;\n  }\n  .sm\\:border-circle {\n    border-radius: 50% !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:border-noround {\n    border-radius: 0 !important;\n  }\n  .md\\:border-round {\n    border-radius: var(--border-radius) !important;\n  }\n  .md\\:border-circle {\n    border-radius: 50% !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:border-noround {\n    border-radius: 0 !important;\n  }\n  .lg\\:border-round {\n    border-radius: var(--border-radius) !important;\n  }\n  .lg\\:border-circle {\n    border-radius: 50% !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:border-noround {\n    border-radius: 0 !important;\n  }\n  .xl\\:border-round {\n    border-radius: var(--border-radius) !important;\n  }\n  .xl\\:border-circle {\n    border-radius: 50% !important;\n  }\n}\n.w-full {\n  width: 100% !important;\n}\n\n.w-screen {\n  width: 100vw !important;\n}\n\n.w-auto {\n  width: auto !important;\n}\n\n.w-min {\n  width: min-content !important;\n}\n\n.w-max {\n  width: max-content !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:w-full {\n    width: 100% !important;\n  }\n  .sm\\:w-screen {\n    width: 100vw !important;\n  }\n  .sm\\:w-auto {\n    width: auto !important;\n  }\n  .sm\\:w-min {\n    width: min-content !important;\n  }\n  .sm\\:w-max {\n    width: max-content !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:w-full {\n    width: 100% !important;\n  }\n  .md\\:w-screen {\n    width: 100vw !important;\n  }\n  .md\\:w-auto {\n    width: auto !important;\n  }\n  .md\\:w-min {\n    width: min-content !important;\n  }\n  .md\\:w-max {\n    width: max-content !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:w-full {\n    width: 100% !important;\n  }\n  .lg\\:w-screen {\n    width: 100vw !important;\n  }\n  .lg\\:w-auto {\n    width: auto !important;\n  }\n  .lg\\:w-min {\n    width: min-content !important;\n  }\n  .lg\\:w-max {\n    width: max-content !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:w-full {\n    width: 100% !important;\n  }\n  .xl\\:w-screen {\n    width: 100vw !important;\n  }\n  .xl\\:w-auto {\n    width: auto !important;\n  }\n  .xl\\:w-min {\n    width: min-content !important;\n  }\n  .xl\\:w-max {\n    width: max-content !important;\n  }\n}\n.h-full {\n  height: 100% !important;\n}\n\n.h-screen {\n  height: 100vh !important;\n}\n\n.h-auto {\n  height: auto !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:h-full {\n    height: 100% !important;\n  }\n  .sm\\:h-screen {\n    height: 100vh !important;\n  }\n  .sm\\:h-auto {\n    height: auto !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:h-full {\n    height: 100% !important;\n  }\n  .md\\:h-screen {\n    height: 100vh !important;\n  }\n  .md\\:h-auto {\n    height: auto !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:h-full {\n    height: 100% !important;\n  }\n  .lg\\:h-screen {\n    height: 100vh !important;\n  }\n  .lg\\:h-auto {\n    height: auto !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:h-full {\n    height: 100% !important;\n  }\n  .xl\\:h-screen {\n    height: 100vh !important;\n  }\n  .xl\\:h-auto {\n    height: auto !important;\n  }\n}\n.min-w-0 {\n  min-width: 0px !important;\n}\n\n.min-w-full {\n  min-width: 100% !important;\n}\n\n.min-w-screen {\n  min-width: 100vw !important;\n}\n\n.min-w-min {\n  min-width: min-content !important;\n}\n\n.min-w-max {\n  min-width: max-content !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:min-w-0 {\n    min-width: 0px !important;\n  }\n  .sm\\:min-w-full {\n    min-width: 100% !important;\n  }\n  .sm\\:min-w-screen {\n    min-width: 100vw !important;\n  }\n  .sm\\:min-w-min {\n    min-width: min-content !important;\n  }\n  .sm\\:min-w-max {\n    min-width: max-content !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:min-w-0 {\n    min-width: 0px !important;\n  }\n  .md\\:min-w-full {\n    min-width: 100% !important;\n  }\n  .md\\:min-w-screen {\n    min-width: 100vw !important;\n  }\n  .md\\:min-w-min {\n    min-width: min-content !important;\n  }\n  .md\\:min-w-max {\n    min-width: max-content !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:min-w-0 {\n    min-width: 0px !important;\n  }\n  .lg\\:min-w-full {\n    min-width: 100% !important;\n  }\n  .lg\\:min-w-screen {\n    min-width: 100vw !important;\n  }\n  .lg\\:min-w-min {\n    min-width: min-content !important;\n  }\n  .lg\\:min-w-max {\n    min-width: max-content !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:min-w-0 {\n    min-width: 0px !important;\n  }\n  .xl\\:min-w-full {\n    min-width: 100% !important;\n  }\n  .xl\\:min-w-screen {\n    min-width: 100vw !important;\n  }\n  .xl\\:min-w-min {\n    min-width: min-content !important;\n  }\n  .xl\\:min-w-max {\n    min-width: max-content !important;\n  }\n}\n.max-w-0 {\n  max-width: 0px !important;\n}\n\n.max-w-full {\n  max-width: 100% !important;\n}\n\n.max-w-screen {\n  max-width: 100vw !important;\n}\n\n.max-w-min {\n  max-width: min-content !important;\n}\n\n.max-w-max {\n  max-width: max-content !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:max-w-0 {\n    max-width: 0px !important;\n  }\n  .sm\\:max-w-full {\n    max-width: 100% !important;\n  }\n  .sm\\:max-w-screen {\n    max-width: 100vw !important;\n  }\n  .sm\\:max-w-min {\n    max-width: min-content !important;\n  }\n  .sm\\:max-w-max {\n    max-width: max-content !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:max-w-0 {\n    max-width: 0px !important;\n  }\n  .md\\:max-w-full {\n    max-width: 100% !important;\n  }\n  .md\\:max-w-screen {\n    max-width: 100vw !important;\n  }\n  .md\\:max-w-min {\n    max-width: min-content !important;\n  }\n  .md\\:max-w-max {\n    max-width: max-content !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:max-w-0 {\n    max-width: 0px !important;\n  }\n  .lg\\:max-w-full {\n    max-width: 100% !important;\n  }\n  .lg\\:max-w-screen {\n    max-width: 100vw !important;\n  }\n  .lg\\:max-w-min {\n    max-width: min-content !important;\n  }\n  .lg\\:max-w-max {\n    max-width: max-content !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:max-w-0 {\n    max-width: 0px !important;\n  }\n  .xl\\:max-w-full {\n    max-width: 100% !important;\n  }\n  .xl\\:max-w-screen {\n    max-width: 100vw !important;\n  }\n  .xl\\:max-w-min {\n    max-width: min-content !important;\n  }\n  .xl\\:max-w-max {\n    max-width: max-content !important;\n  }\n}\n.min-h-0 {\n  min-height: 0px !important;\n}\n\n.min-h-full {\n  min-height: 100% !important;\n}\n\n.min-h-screen {\n  min-height: 100vh !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:min-h-0 {\n    min-height: 0px !important;\n  }\n  .sm\\:min-h-full {\n    min-height: 100% !important;\n  }\n  .sm\\:min-h-screen {\n    min-height: 100vh !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:min-h-0 {\n    min-height: 0px !important;\n  }\n  .md\\:min-h-full {\n    min-height: 100% !important;\n  }\n  .md\\:min-h-screen {\n    min-height: 100vh !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:min-h-0 {\n    min-height: 0px !important;\n  }\n  .lg\\:min-h-full {\n    min-height: 100% !important;\n  }\n  .lg\\:min-h-screen {\n    min-height: 100vh !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:min-h-0 {\n    min-height: 0px !important;\n  }\n  .xl\\:min-h-full {\n    min-height: 100% !important;\n  }\n  .xl\\:min-h-screen {\n    min-height: 100vh !important;\n  }\n}\n.max-h-0 {\n  max-height: 0px !important;\n}\n\n.max-h-full {\n  max-height: 100% !important;\n}\n\n.max-h-screen {\n  max-height: 100vh !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:max-h-0 {\n    max-height: 0px !important;\n  }\n  .sm\\:max-h-full {\n    max-height: 100% !important;\n  }\n  .sm\\:max-h-screen {\n    max-height: 100vh !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:max-h-0 {\n    max-height: 0px !important;\n  }\n  .md\\:max-h-full {\n    max-height: 100% !important;\n  }\n  .md\\:max-h-screen {\n    max-height: 100vh !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:max-h-0 {\n    max-height: 0px !important;\n  }\n  .lg\\:max-h-full {\n    max-height: 100% !important;\n  }\n  .lg\\:max-h-screen {\n    max-height: 100vh !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:max-h-0 {\n    max-height: 0px !important;\n  }\n  .xl\\:max-h-full {\n    max-height: 100% !important;\n  }\n  .xl\\:max-h-screen {\n    max-height: 100vh !important;\n  }\n}\n.w-1 {\n  width: 8.3333% !important;\n}\n\n.w-2 {\n  width: 16.6667% !important;\n}\n\n.w-3 {\n  width: 25% !important;\n}\n\n.w-4 {\n  width: 33.3333% !important;\n}\n\n.w-5 {\n  width: 41.6667% !important;\n}\n\n.w-6 {\n  width: 50% !important;\n}\n\n.w-7 {\n  width: 58.3333% !important;\n}\n\n.w-8 {\n  width: 66.6667% !important;\n}\n\n.w-9 {\n  width: 75% !important;\n}\n\n.w-10 {\n  width: 83.3333% !important;\n}\n\n.w-11 {\n  width: 91.6667% !important;\n}\n\n.w-12 {\n  width: 100% !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:w-1 {\n    width: 8.3333% !important;\n  }\n  .sm\\:w-2 {\n    width: 16.6667% !important;\n  }\n  .sm\\:w-3 {\n    width: 25% !important;\n  }\n  .sm\\:w-4 {\n    width: 33.3333% !important;\n  }\n  .sm\\:w-5 {\n    width: 41.6667% !important;\n  }\n  .sm\\:w-6 {\n    width: 50% !important;\n  }\n  .sm\\:w-7 {\n    width: 58.3333% !important;\n  }\n  .sm\\:w-8 {\n    width: 66.6667% !important;\n  }\n  .sm\\:w-9 {\n    width: 75% !important;\n  }\n  .sm\\:w-10 {\n    width: 83.3333% !important;\n  }\n  .sm\\:w-11 {\n    width: 91.6667% !important;\n  }\n  .sm\\:w-12 {\n    width: 100% !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:w-1 {\n    width: 8.3333% !important;\n  }\n  .md\\:w-2 {\n    width: 16.6667% !important;\n  }\n  .md\\:w-3 {\n    width: 25% !important;\n  }\n  .md\\:w-4 {\n    width: 33.3333% !important;\n  }\n  .md\\:w-5 {\n    width: 41.6667% !important;\n  }\n  .md\\:w-6 {\n    width: 50% !important;\n  }\n  .md\\:w-7 {\n    width: 58.3333% !important;\n  }\n  .md\\:w-8 {\n    width: 66.6667% !important;\n  }\n  .md\\:w-9 {\n    width: 75% !important;\n  }\n  .md\\:w-10 {\n    width: 83.3333% !important;\n  }\n  .md\\:w-11 {\n    width: 91.6667% !important;\n  }\n  .md\\:w-12 {\n    width: 100% !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:w-1 {\n    width: 8.3333% !important;\n  }\n  .lg\\:w-2 {\n    width: 16.6667% !important;\n  }\n  .lg\\:w-3 {\n    width: 25% !important;\n  }\n  .lg\\:w-4 {\n    width: 33.3333% !important;\n  }\n  .lg\\:w-5 {\n    width: 41.6667% !important;\n  }\n  .lg\\:w-6 {\n    width: 50% !important;\n  }\n  .lg\\:w-7 {\n    width: 58.3333% !important;\n  }\n  .lg\\:w-8 {\n    width: 66.6667% !important;\n  }\n  .lg\\:w-9 {\n    width: 75% !important;\n  }\n  .lg\\:w-10 {\n    width: 83.3333% !important;\n  }\n  .lg\\:w-11 {\n    width: 91.6667% !important;\n  }\n  .lg\\:w-12 {\n    width: 100% !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:w-1 {\n    width: 8.3333% !important;\n  }\n  .xl\\:w-2 {\n    width: 16.6667% !important;\n  }\n  .xl\\:w-3 {\n    width: 25% !important;\n  }\n  .xl\\:w-4 {\n    width: 33.3333% !important;\n  }\n  .xl\\:w-5 {\n    width: 41.6667% !important;\n  }\n  .xl\\:w-6 {\n    width: 50% !important;\n  }\n  .xl\\:w-7 {\n    width: 58.3333% !important;\n  }\n  .xl\\:w-8 {\n    width: 66.6667% !important;\n  }\n  .xl\\:w-9 {\n    width: 75% !important;\n  }\n  .xl\\:w-10 {\n    width: 83.3333% !important;\n  }\n  .xl\\:w-11 {\n    width: 91.6667% !important;\n  }\n  .xl\\:w-12 {\n    width: 100% !important;\n  }\n}\n.w-1rem {\n  width: 1rem !important;\n}\n\n.w-2rem {\n  width: 2rem !important;\n}\n\n.w-3rem {\n  width: 3rem !important;\n}\n\n.w-4rem {\n  width: 4rem !important;\n}\n\n.w-5rem {\n  width: 5rem !important;\n}\n\n.w-6rem {\n  width: 6rem !important;\n}\n\n.w-7rem {\n  width: 7rem !important;\n}\n\n.w-8rem {\n  width: 8rem !important;\n}\n\n.w-9rem {\n  width: 9rem !important;\n}\n\n.w-10rem {\n  width: 10rem !important;\n}\n\n.w-11rem {\n  width: 11rem !important;\n}\n\n.w-12rem {\n  width: 12rem !important;\n}\n\n.w-13rem {\n  width: 13rem !important;\n}\n\n.w-14rem {\n  width: 14rem !important;\n}\n\n.w-15rem {\n  width: 15rem !important;\n}\n\n.w-16rem {\n  width: 16rem !important;\n}\n\n.w-17rem {\n  width: 17rem !important;\n}\n\n.w-18rem {\n  width: 18rem !important;\n}\n\n.w-19rem {\n  width: 19rem !important;\n}\n\n.w-20rem {\n  width: 20rem !important;\n}\n\n.w-21rem {\n  width: 21rem !important;\n}\n\n.w-22rem {\n  width: 22rem !important;\n}\n\n.w-23rem {\n  width: 23rem !important;\n}\n\n.w-24rem {\n  width: 24rem !important;\n}\n\n.w-25rem {\n  width: 25rem !important;\n}\n\n.w-26rem {\n  width: 26rem !important;\n}\n\n.w-27rem {\n  width: 27rem !important;\n}\n\n.w-28rem {\n  width: 28rem !important;\n}\n\n.w-29rem {\n  width: 29rem !important;\n}\n\n.w-30rem {\n  width: 30rem !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:w-1rem {\n    width: 1rem !important;\n  }\n  .sm\\:w-2rem {\n    width: 2rem !important;\n  }\n  .sm\\:w-3rem {\n    width: 3rem !important;\n  }\n  .sm\\:w-4rem {\n    width: 4rem !important;\n  }\n  .sm\\:w-5rem {\n    width: 5rem !important;\n  }\n  .sm\\:w-6rem {\n    width: 6rem !important;\n  }\n  .sm\\:w-7rem {\n    width: 7rem !important;\n  }\n  .sm\\:w-8rem {\n    width: 8rem !important;\n  }\n  .sm\\:w-9rem {\n    width: 9rem !important;\n  }\n  .sm\\:w-10rem {\n    width: 10rem !important;\n  }\n  .sm\\:w-11rem {\n    width: 11rem !important;\n  }\n  .sm\\:w-12rem {\n    width: 12rem !important;\n  }\n  .sm\\:w-13rem {\n    width: 13rem !important;\n  }\n  .sm\\:w-14rem {\n    width: 14rem !important;\n  }\n  .sm\\:w-15rem {\n    width: 15rem !important;\n  }\n  .sm\\:w-16rem {\n    width: 16rem !important;\n  }\n  .sm\\:w-17rem {\n    width: 17rem !important;\n  }\n  .sm\\:w-18rem {\n    width: 18rem !important;\n  }\n  .sm\\:w-19rem {\n    width: 19rem !important;\n  }\n  .sm\\:w-20rem {\n    width: 20rem !important;\n  }\n  .sm\\:w-21rem {\n    width: 21rem !important;\n  }\n  .sm\\:w-22rem {\n    width: 22rem !important;\n  }\n  .sm\\:w-23rem {\n    width: 23rem !important;\n  }\n  .sm\\:w-24rem {\n    width: 24rem !important;\n  }\n  .sm\\:w-25rem {\n    width: 25rem !important;\n  }\n  .sm\\:w-26rem {\n    width: 26rem !important;\n  }\n  .sm\\:w-27rem {\n    width: 27rem !important;\n  }\n  .sm\\:w-28rem {\n    width: 28rem !important;\n  }\n  .sm\\:w-29rem {\n    width: 29rem !important;\n  }\n  .sm\\:w-30rem {\n    width: 30rem !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:w-1rem {\n    width: 1rem !important;\n  }\n  .md\\:w-2rem {\n    width: 2rem !important;\n  }\n  .md\\:w-3rem {\n    width: 3rem !important;\n  }\n  .md\\:w-4rem {\n    width: 4rem !important;\n  }\n  .md\\:w-5rem {\n    width: 5rem !important;\n  }\n  .md\\:w-6rem {\n    width: 6rem !important;\n  }\n  .md\\:w-7rem {\n    width: 7rem !important;\n  }\n  .md\\:w-8rem {\n    width: 8rem !important;\n  }\n  .md\\:w-9rem {\n    width: 9rem !important;\n  }\n  .md\\:w-10rem {\n    width: 10rem !important;\n  }\n  .md\\:w-11rem {\n    width: 11rem !important;\n  }\n  .md\\:w-12rem {\n    width: 12rem !important;\n  }\n  .md\\:w-13rem {\n    width: 13rem !important;\n  }\n  .md\\:w-14rem {\n    width: 14rem !important;\n  }\n  .md\\:w-15rem {\n    width: 15rem !important;\n  }\n  .md\\:w-16rem {\n    width: 16rem !important;\n  }\n  .md\\:w-17rem {\n    width: 17rem !important;\n  }\n  .md\\:w-18rem {\n    width: 18rem !important;\n  }\n  .md\\:w-19rem {\n    width: 19rem !important;\n  }\n  .md\\:w-20rem {\n    width: 20rem !important;\n  }\n  .md\\:w-21rem {\n    width: 21rem !important;\n  }\n  .md\\:w-22rem {\n    width: 22rem !important;\n  }\n  .md\\:w-23rem {\n    width: 23rem !important;\n  }\n  .md\\:w-24rem {\n    width: 24rem !important;\n  }\n  .md\\:w-25rem {\n    width: 25rem !important;\n  }\n  .md\\:w-26rem {\n    width: 26rem !important;\n  }\n  .md\\:w-27rem {\n    width: 27rem !important;\n  }\n  .md\\:w-28rem {\n    width: 28rem !important;\n  }\n  .md\\:w-29rem {\n    width: 29rem !important;\n  }\n  .md\\:w-30rem {\n    width: 30rem !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:w-1rem {\n    width: 1rem !important;\n  }\n  .lg\\:w-2rem {\n    width: 2rem !important;\n  }\n  .lg\\:w-3rem {\n    width: 3rem !important;\n  }\n  .lg\\:w-4rem {\n    width: 4rem !important;\n  }\n  .lg\\:w-5rem {\n    width: 5rem !important;\n  }\n  .lg\\:w-6rem {\n    width: 6rem !important;\n  }\n  .lg\\:w-7rem {\n    width: 7rem !important;\n  }\n  .lg\\:w-8rem {\n    width: 8rem !important;\n  }\n  .lg\\:w-9rem {\n    width: 9rem !important;\n  }\n  .lg\\:w-10rem {\n    width: 10rem !important;\n  }\n  .lg\\:w-11rem {\n    width: 11rem !important;\n  }\n  .lg\\:w-12rem {\n    width: 12rem !important;\n  }\n  .lg\\:w-13rem {\n    width: 13rem !important;\n  }\n  .lg\\:w-14rem {\n    width: 14rem !important;\n  }\n  .lg\\:w-15rem {\n    width: 15rem !important;\n  }\n  .lg\\:w-16rem {\n    width: 16rem !important;\n  }\n  .lg\\:w-17rem {\n    width: 17rem !important;\n  }\n  .lg\\:w-18rem {\n    width: 18rem !important;\n  }\n  .lg\\:w-19rem {\n    width: 19rem !important;\n  }\n  .lg\\:w-20rem {\n    width: 20rem !important;\n  }\n  .lg\\:w-21rem {\n    width: 21rem !important;\n  }\n  .lg\\:w-22rem {\n    width: 22rem !important;\n  }\n  .lg\\:w-23rem {\n    width: 23rem !important;\n  }\n  .lg\\:w-24rem {\n    width: 24rem !important;\n  }\n  .lg\\:w-25rem {\n    width: 25rem !important;\n  }\n  .lg\\:w-26rem {\n    width: 26rem !important;\n  }\n  .lg\\:w-27rem {\n    width: 27rem !important;\n  }\n  .lg\\:w-28rem {\n    width: 28rem !important;\n  }\n  .lg\\:w-29rem {\n    width: 29rem !important;\n  }\n  .lg\\:w-30rem {\n    width: 30rem !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:w-1rem {\n    width: 1rem !important;\n  }\n  .xl\\:w-2rem {\n    width: 2rem !important;\n  }\n  .xl\\:w-3rem {\n    width: 3rem !important;\n  }\n  .xl\\:w-4rem {\n    width: 4rem !important;\n  }\n  .xl\\:w-5rem {\n    width: 5rem !important;\n  }\n  .xl\\:w-6rem {\n    width: 6rem !important;\n  }\n  .xl\\:w-7rem {\n    width: 7rem !important;\n  }\n  .xl\\:w-8rem {\n    width: 8rem !important;\n  }\n  .xl\\:w-9rem {\n    width: 9rem !important;\n  }\n  .xl\\:w-10rem {\n    width: 10rem !important;\n  }\n  .xl\\:w-11rem {\n    width: 11rem !important;\n  }\n  .xl\\:w-12rem {\n    width: 12rem !important;\n  }\n  .xl\\:w-13rem {\n    width: 13rem !important;\n  }\n  .xl\\:w-14rem {\n    width: 14rem !important;\n  }\n  .xl\\:w-15rem {\n    width: 15rem !important;\n  }\n  .xl\\:w-16rem {\n    width: 16rem !important;\n  }\n  .xl\\:w-17rem {\n    width: 17rem !important;\n  }\n  .xl\\:w-18rem {\n    width: 18rem !important;\n  }\n  .xl\\:w-19rem {\n    width: 19rem !important;\n  }\n  .xl\\:w-20rem {\n    width: 20rem !important;\n  }\n  .xl\\:w-21rem {\n    width: 21rem !important;\n  }\n  .xl\\:w-22rem {\n    width: 22rem !important;\n  }\n  .xl\\:w-23rem {\n    width: 23rem !important;\n  }\n  .xl\\:w-24rem {\n    width: 24rem !important;\n  }\n  .xl\\:w-25rem {\n    width: 25rem !important;\n  }\n  .xl\\:w-26rem {\n    width: 26rem !important;\n  }\n  .xl\\:w-27rem {\n    width: 27rem !important;\n  }\n  .xl\\:w-28rem {\n    width: 28rem !important;\n  }\n  .xl\\:w-29rem {\n    width: 29rem !important;\n  }\n  .xl\\:w-30rem {\n    width: 30rem !important;\n  }\n}\n.h-1rem {\n  height: 1rem !important;\n}\n\n.h-2rem {\n  height: 2rem !important;\n}\n\n.h-3rem {\n  height: 3rem !important;\n}\n\n.h-4rem {\n  height: 4rem !important;\n}\n\n.h-5rem {\n  height: 5rem !important;\n}\n\n.h-6rem {\n  height: 6rem !important;\n}\n\n.h-7rem {\n  height: 7rem !important;\n}\n\n.h-8rem {\n  height: 8rem !important;\n}\n\n.h-9rem {\n  height: 9rem !important;\n}\n\n.h-10rem {\n  height: 10rem !important;\n}\n\n.h-11rem {\n  height: 11rem !important;\n}\n\n.h-12rem {\n  height: 12rem !important;\n}\n\n.h-13rem {\n  height: 13rem !important;\n}\n\n.h-14rem {\n  height: 14rem !important;\n}\n\n.h-15rem {\n  height: 15rem !important;\n}\n\n.h-16rem {\n  height: 16rem !important;\n}\n\n.h-17rem {\n  height: 17rem !important;\n}\n\n.h-18rem {\n  height: 18rem !important;\n}\n\n.h-19rem {\n  height: 19rem !important;\n}\n\n.h-20rem {\n  height: 20rem !important;\n}\n\n.h-21rem {\n  height: 21rem !important;\n}\n\n.h-22rem {\n  height: 22rem !important;\n}\n\n.h-23rem {\n  height: 23rem !important;\n}\n\n.h-24rem {\n  height: 24rem !important;\n}\n\n.h-25rem {\n  height: 25rem !important;\n}\n\n.h-26rem {\n  height: 26rem !important;\n}\n\n.h-27rem {\n  height: 27rem !important;\n}\n\n.h-28rem {\n  height: 28rem !important;\n}\n\n.h-29rem {\n  height: 29rem !important;\n}\n\n.h-30rem {\n  height: 30rem !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:h-1rem {\n    height: 1rem !important;\n  }\n  .sm\\:h-2rem {\n    height: 2rem !important;\n  }\n  .sm\\:h-3rem {\n    height: 3rem !important;\n  }\n  .sm\\:h-4rem {\n    height: 4rem !important;\n  }\n  .sm\\:h-5rem {\n    height: 5rem !important;\n  }\n  .sm\\:h-6rem {\n    height: 6rem !important;\n  }\n  .sm\\:h-7rem {\n    height: 7rem !important;\n  }\n  .sm\\:h-8rem {\n    height: 8rem !important;\n  }\n  .sm\\:h-9rem {\n    height: 9rem !important;\n  }\n  .sm\\:h-10rem {\n    height: 10rem !important;\n  }\n  .sm\\:h-11rem {\n    height: 11rem !important;\n  }\n  .sm\\:h-12rem {\n    height: 12rem !important;\n  }\n  .sm\\:h-13rem {\n    height: 13rem !important;\n  }\n  .sm\\:h-14rem {\n    height: 14rem !important;\n  }\n  .sm\\:h-15rem {\n    height: 15rem !important;\n  }\n  .sm\\:h-16rem {\n    height: 16rem !important;\n  }\n  .sm\\:h-17rem {\n    height: 17rem !important;\n  }\n  .sm\\:h-18rem {\n    height: 18rem !important;\n  }\n  .sm\\:h-19rem {\n    height: 19rem !important;\n  }\n  .sm\\:h-20rem {\n    height: 20rem !important;\n  }\n  .sm\\:h-21rem {\n    height: 21rem !important;\n  }\n  .sm\\:h-22rem {\n    height: 22rem !important;\n  }\n  .sm\\:h-23rem {\n    height: 23rem !important;\n  }\n  .sm\\:h-24rem {\n    height: 24rem !important;\n  }\n  .sm\\:h-25rem {\n    height: 25rem !important;\n  }\n  .sm\\:h-26rem {\n    height: 26rem !important;\n  }\n  .sm\\:h-27rem {\n    height: 27rem !important;\n  }\n  .sm\\:h-28rem {\n    height: 28rem !important;\n  }\n  .sm\\:h-29rem {\n    height: 29rem !important;\n  }\n  .sm\\:h-30rem {\n    height: 30rem !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:h-1rem {\n    height: 1rem !important;\n  }\n  .md\\:h-2rem {\n    height: 2rem !important;\n  }\n  .md\\:h-3rem {\n    height: 3rem !important;\n  }\n  .md\\:h-4rem {\n    height: 4rem !important;\n  }\n  .md\\:h-5rem {\n    height: 5rem !important;\n  }\n  .md\\:h-6rem {\n    height: 6rem !important;\n  }\n  .md\\:h-7rem {\n    height: 7rem !important;\n  }\n  .md\\:h-8rem {\n    height: 8rem !important;\n  }\n  .md\\:h-9rem {\n    height: 9rem !important;\n  }\n  .md\\:h-10rem {\n    height: 10rem !important;\n  }\n  .md\\:h-11rem {\n    height: 11rem !important;\n  }\n  .md\\:h-12rem {\n    height: 12rem !important;\n  }\n  .md\\:h-13rem {\n    height: 13rem !important;\n  }\n  .md\\:h-14rem {\n    height: 14rem !important;\n  }\n  .md\\:h-15rem {\n    height: 15rem !important;\n  }\n  .md\\:h-16rem {\n    height: 16rem !important;\n  }\n  .md\\:h-17rem {\n    height: 17rem !important;\n  }\n  .md\\:h-18rem {\n    height: 18rem !important;\n  }\n  .md\\:h-19rem {\n    height: 19rem !important;\n  }\n  .md\\:h-20rem {\n    height: 20rem !important;\n  }\n  .md\\:h-21rem {\n    height: 21rem !important;\n  }\n  .md\\:h-22rem {\n    height: 22rem !important;\n  }\n  .md\\:h-23rem {\n    height: 23rem !important;\n  }\n  .md\\:h-24rem {\n    height: 24rem !important;\n  }\n  .md\\:h-25rem {\n    height: 25rem !important;\n  }\n  .md\\:h-26rem {\n    height: 26rem !important;\n  }\n  .md\\:h-27rem {\n    height: 27rem !important;\n  }\n  .md\\:h-28rem {\n    height: 28rem !important;\n  }\n  .md\\:h-29rem {\n    height: 29rem !important;\n  }\n  .md\\:h-30rem {\n    height: 30rem !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:h-1rem {\n    height: 1rem !important;\n  }\n  .lg\\:h-2rem {\n    height: 2rem !important;\n  }\n  .lg\\:h-3rem {\n    height: 3rem !important;\n  }\n  .lg\\:h-4rem {\n    height: 4rem !important;\n  }\n  .lg\\:h-5rem {\n    height: 5rem !important;\n  }\n  .lg\\:h-6rem {\n    height: 6rem !important;\n  }\n  .lg\\:h-7rem {\n    height: 7rem !important;\n  }\n  .lg\\:h-8rem {\n    height: 8rem !important;\n  }\n  .lg\\:h-9rem {\n    height: 9rem !important;\n  }\n  .lg\\:h-10rem {\n    height: 10rem !important;\n  }\n  .lg\\:h-11rem {\n    height: 11rem !important;\n  }\n  .lg\\:h-12rem {\n    height: 12rem !important;\n  }\n  .lg\\:h-13rem {\n    height: 13rem !important;\n  }\n  .lg\\:h-14rem {\n    height: 14rem !important;\n  }\n  .lg\\:h-15rem {\n    height: 15rem !important;\n  }\n  .lg\\:h-16rem {\n    height: 16rem !important;\n  }\n  .lg\\:h-17rem {\n    height: 17rem !important;\n  }\n  .lg\\:h-18rem {\n    height: 18rem !important;\n  }\n  .lg\\:h-19rem {\n    height: 19rem !important;\n  }\n  .lg\\:h-20rem {\n    height: 20rem !important;\n  }\n  .lg\\:h-21rem {\n    height: 21rem !important;\n  }\n  .lg\\:h-22rem {\n    height: 22rem !important;\n  }\n  .lg\\:h-23rem {\n    height: 23rem !important;\n  }\n  .lg\\:h-24rem {\n    height: 24rem !important;\n  }\n  .lg\\:h-25rem {\n    height: 25rem !important;\n  }\n  .lg\\:h-26rem {\n    height: 26rem !important;\n  }\n  .lg\\:h-27rem {\n    height: 27rem !important;\n  }\n  .lg\\:h-28rem {\n    height: 28rem !important;\n  }\n  .lg\\:h-29rem {\n    height: 29rem !important;\n  }\n  .lg\\:h-30rem {\n    height: 30rem !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:h-1rem {\n    height: 1rem !important;\n  }\n  .xl\\:h-2rem {\n    height: 2rem !important;\n  }\n  .xl\\:h-3rem {\n    height: 3rem !important;\n  }\n  .xl\\:h-4rem {\n    height: 4rem !important;\n  }\n  .xl\\:h-5rem {\n    height: 5rem !important;\n  }\n  .xl\\:h-6rem {\n    height: 6rem !important;\n  }\n  .xl\\:h-7rem {\n    height: 7rem !important;\n  }\n  .xl\\:h-8rem {\n    height: 8rem !important;\n  }\n  .xl\\:h-9rem {\n    height: 9rem !important;\n  }\n  .xl\\:h-10rem {\n    height: 10rem !important;\n  }\n  .xl\\:h-11rem {\n    height: 11rem !important;\n  }\n  .xl\\:h-12rem {\n    height: 12rem !important;\n  }\n  .xl\\:h-13rem {\n    height: 13rem !important;\n  }\n  .xl\\:h-14rem {\n    height: 14rem !important;\n  }\n  .xl\\:h-15rem {\n    height: 15rem !important;\n  }\n  .xl\\:h-16rem {\n    height: 16rem !important;\n  }\n  .xl\\:h-17rem {\n    height: 17rem !important;\n  }\n  .xl\\:h-18rem {\n    height: 18rem !important;\n  }\n  .xl\\:h-19rem {\n    height: 19rem !important;\n  }\n  .xl\\:h-20rem {\n    height: 20rem !important;\n  }\n  .xl\\:h-21rem {\n    height: 21rem !important;\n  }\n  .xl\\:h-22rem {\n    height: 22rem !important;\n  }\n  .xl\\:h-23rem {\n    height: 23rem !important;\n  }\n  .xl\\:h-24rem {\n    height: 24rem !important;\n  }\n  .xl\\:h-25rem {\n    height: 25rem !important;\n  }\n  .xl\\:h-26rem {\n    height: 26rem !important;\n  }\n  .xl\\:h-27rem {\n    height: 27rem !important;\n  }\n  .xl\\:h-28rem {\n    height: 28rem !important;\n  }\n  .xl\\:h-29rem {\n    height: 29rem !important;\n  }\n  .xl\\:h-30rem {\n    height: 30rem !important;\n  }\n}\n.static {\n  position: static !important;\n}\n\n.fixed {\n  position: fixed !important;\n}\n\n.absolute {\n  position: absolute !important;\n}\n\n.relative {\n  position: relative !important;\n}\n\n.sticky {\n  position: sticky !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:static {\n    position: static !important;\n  }\n  .sm\\:fixed {\n    position: fixed !important;\n  }\n  .sm\\:absolute {\n    position: absolute !important;\n  }\n  .sm\\:relative {\n    position: relative !important;\n  }\n  .sm\\:sticky {\n    position: sticky !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:static {\n    position: static !important;\n  }\n  .md\\:fixed {\n    position: fixed !important;\n  }\n  .md\\:absolute {\n    position: absolute !important;\n  }\n  .md\\:relative {\n    position: relative !important;\n  }\n  .md\\:sticky {\n    position: sticky !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:static {\n    position: static !important;\n  }\n  .lg\\:fixed {\n    position: fixed !important;\n  }\n  .lg\\:absolute {\n    position: absolute !important;\n  }\n  .lg\\:relative {\n    position: relative !important;\n  }\n  .lg\\:sticky {\n    position: sticky !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:static {\n    position: static !important;\n  }\n  .xl\\:fixed {\n    position: fixed !important;\n  }\n  .xl\\:absolute {\n    position: absolute !important;\n  }\n  .xl\\:relative {\n    position: relative !important;\n  }\n  .xl\\:sticky {\n    position: sticky !important;\n  }\n}\n.top-auto {\n  top: auto !important;\n}\n\n.top-0 {\n  top: 0px !important;\n}\n\n.top-50 {\n  top: 50% !important;\n}\n\n.top-100 {\n  top: 100% !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:top-auto {\n    top: auto !important;\n  }\n  .sm\\:top-0 {\n    top: 0px !important;\n  }\n  .sm\\:top-50 {\n    top: 50% !important;\n  }\n  .sm\\:top-100 {\n    top: 100% !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:top-auto {\n    top: auto !important;\n  }\n  .md\\:top-0 {\n    top: 0px !important;\n  }\n  .md\\:top-50 {\n    top: 50% !important;\n  }\n  .md\\:top-100 {\n    top: 100% !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:top-auto {\n    top: auto !important;\n  }\n  .lg\\:top-0 {\n    top: 0px !important;\n  }\n  .lg\\:top-50 {\n    top: 50% !important;\n  }\n  .lg\\:top-100 {\n    top: 100% !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:top-auto {\n    top: auto !important;\n  }\n  .xl\\:top-0 {\n    top: 0px !important;\n  }\n  .xl\\:top-50 {\n    top: 50% !important;\n  }\n  .xl\\:top-100 {\n    top: 100% !important;\n  }\n}\n.left-auto {\n  left: auto !important;\n}\n\n.left-0 {\n  left: 0px !important;\n}\n\n.left-50 {\n  left: 50% !important;\n}\n\n.left-100 {\n  left: 100% !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:left-auto {\n    left: auto !important;\n  }\n  .sm\\:left-0 {\n    left: 0px !important;\n  }\n  .sm\\:left-50 {\n    left: 50% !important;\n  }\n  .sm\\:left-100 {\n    left: 100% !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:left-auto {\n    left: auto !important;\n  }\n  .md\\:left-0 {\n    left: 0px !important;\n  }\n  .md\\:left-50 {\n    left: 50% !important;\n  }\n  .md\\:left-100 {\n    left: 100% !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:left-auto {\n    left: auto !important;\n  }\n  .lg\\:left-0 {\n    left: 0px !important;\n  }\n  .lg\\:left-50 {\n    left: 50% !important;\n  }\n  .lg\\:left-100 {\n    left: 100% !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:left-auto {\n    left: auto !important;\n  }\n  .xl\\:left-0 {\n    left: 0px !important;\n  }\n  .xl\\:left-50 {\n    left: 50% !important;\n  }\n  .xl\\:left-100 {\n    left: 100% !important;\n  }\n}\n.right-auto {\n  right: auto !important;\n}\n\n.right-0 {\n  right: 0px !important;\n}\n\n.right-50 {\n  right: 50% !important;\n}\n\n.right-100 {\n  right: 100% !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:right-auto {\n    right: auto !important;\n  }\n  .sm\\:right-0 {\n    right: 0px !important;\n  }\n  .sm\\:right-50 {\n    right: 50% !important;\n  }\n  .sm\\:right-100 {\n    right: 100% !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:right-auto {\n    right: auto !important;\n  }\n  .md\\:right-0 {\n    right: 0px !important;\n  }\n  .md\\:right-50 {\n    right: 50% !important;\n  }\n  .md\\:right-100 {\n    right: 100% !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:right-auto {\n    right: auto !important;\n  }\n  .lg\\:right-0 {\n    right: 0px !important;\n  }\n  .lg\\:right-50 {\n    right: 50% !important;\n  }\n  .lg\\:right-100 {\n    right: 100% !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:right-auto {\n    right: auto !important;\n  }\n  .xl\\:right-0 {\n    right: 0px !important;\n  }\n  .xl\\:right-50 {\n    right: 50% !important;\n  }\n  .xl\\:right-100 {\n    right: 100% !important;\n  }\n}\n.bottom-auto {\n  bottom: auto !important;\n}\n\n.bottom-0 {\n  bottom: 0px !important;\n}\n\n.bottom-50 {\n  bottom: 50% !important;\n}\n\n.bottom-100 {\n  bottom: 100% !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:bottom-auto {\n    bottom: auto !important;\n  }\n  .sm\\:bottom-0 {\n    bottom: 0px !important;\n  }\n  .sm\\:bottom-50 {\n    bottom: 50% !important;\n  }\n  .sm\\:bottom-100 {\n    bottom: 100% !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:bottom-auto {\n    bottom: auto !important;\n  }\n  .md\\:bottom-0 {\n    bottom: 0px !important;\n  }\n  .md\\:bottom-50 {\n    bottom: 50% !important;\n  }\n  .md\\:bottom-100 {\n    bottom: 100% !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:bottom-auto {\n    bottom: auto !important;\n  }\n  .lg\\:bottom-0 {\n    bottom: 0px !important;\n  }\n  .lg\\:bottom-50 {\n    bottom: 50% !important;\n  }\n  .lg\\:bottom-100 {\n    bottom: 100% !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:bottom-auto {\n    bottom: auto !important;\n  }\n  .xl\\:bottom-0 {\n    bottom: 0px !important;\n  }\n  .xl\\:bottom-50 {\n    bottom: 50% !important;\n  }\n  .xl\\:bottom-100 {\n    bottom: 100% !important;\n  }\n}\n.overflow-auto {\n  overflow: auto !important;\n}\n\n.overflow-hidden {\n  overflow: hidden !important;\n}\n\n.overflow-visible {\n  overflow: visible !important;\n}\n\n.overflow-scroll {\n  overflow: scroll !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:overflow-auto {\n    overflow: auto !important;\n  }\n  .sm\\:overflow-hidden {\n    overflow: hidden !important;\n  }\n  .sm\\:overflow-visible {\n    overflow: visible !important;\n  }\n  .sm\\:overflow-scroll {\n    overflow: scroll !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:overflow-auto {\n    overflow: auto !important;\n  }\n  .md\\:overflow-hidden {\n    overflow: hidden !important;\n  }\n  .md\\:overflow-visible {\n    overflow: visible !important;\n  }\n  .md\\:overflow-scroll {\n    overflow: scroll !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:overflow-auto {\n    overflow: auto !important;\n  }\n  .lg\\:overflow-hidden {\n    overflow: hidden !important;\n  }\n  .lg\\:overflow-visible {\n    overflow: visible !important;\n  }\n  .lg\\:overflow-scroll {\n    overflow: scroll !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:overflow-auto {\n    overflow: auto !important;\n  }\n  .xl\\:overflow-hidden {\n    overflow: hidden !important;\n  }\n  .xl\\:overflow-visible {\n    overflow: visible !important;\n  }\n  .xl\\:overflow-scroll {\n    overflow: scroll !important;\n  }\n}\n.overflow-x-auto {\n  overflow-x: auto !important;\n}\n\n.overflow-x-hidden {\n  overflow-x: hidden !important;\n}\n\n.overflow-x-visible {\n  overflow-x: visible !important;\n}\n\n.overflow-x-scroll {\n  overflow-x: scroll !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:overflow-x-auto {\n    overflow-x: auto !important;\n  }\n  .sm\\:overflow-x-hidden {\n    overflow-x: hidden !important;\n  }\n  .sm\\:overflow-x-visible {\n    overflow-x: visible !important;\n  }\n  .sm\\:overflow-x-scroll {\n    overflow-x: scroll !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:overflow-x-auto {\n    overflow-x: auto !important;\n  }\n  .md\\:overflow-x-hidden {\n    overflow-x: hidden !important;\n  }\n  .md\\:overflow-x-visible {\n    overflow-x: visible !important;\n  }\n  .md\\:overflow-x-scroll {\n    overflow-x: scroll !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:overflow-x-auto {\n    overflow-x: auto !important;\n  }\n  .lg\\:overflow-x-hidden {\n    overflow-x: hidden !important;\n  }\n  .lg\\:overflow-x-visible {\n    overflow-x: visible !important;\n  }\n  .lg\\:overflow-x-scroll {\n    overflow-x: scroll !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:overflow-x-auto {\n    overflow-x: auto !important;\n  }\n  .xl\\:overflow-x-hidden {\n    overflow-x: hidden !important;\n  }\n  .xl\\:overflow-x-visible {\n    overflow-x: visible !important;\n  }\n  .xl\\:overflow-x-scroll {\n    overflow-x: scroll !important;\n  }\n}\n.overflow-y-auto {\n  overflow-y: auto !important;\n}\n\n.overflow-y-hidden {\n  overflow-y: hidden !important;\n}\n\n.overflow-y-visible {\n  overflow-y: visible !important;\n}\n\n.overflow-y-scroll {\n  overflow-y: scroll !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:overflow-y-auto {\n    overflow-y: auto !important;\n  }\n  .sm\\:overflow-y-hidden {\n    overflow-y: hidden !important;\n  }\n  .sm\\:overflow-y-visible {\n    overflow-y: visible !important;\n  }\n  .sm\\:overflow-y-scroll {\n    overflow-y: scroll !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:overflow-y-auto {\n    overflow-y: auto !important;\n  }\n  .md\\:overflow-y-hidden {\n    overflow-y: hidden !important;\n  }\n  .md\\:overflow-y-visible {\n    overflow-y: visible !important;\n  }\n  .md\\:overflow-y-scroll {\n    overflow-y: scroll !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:overflow-y-auto {\n    overflow-y: auto !important;\n  }\n  .lg\\:overflow-y-hidden {\n    overflow-y: hidden !important;\n  }\n  .lg\\:overflow-y-visible {\n    overflow-y: visible !important;\n  }\n  .lg\\:overflow-y-scroll {\n    overflow-y: scroll !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:overflow-y-auto {\n    overflow-y: auto !important;\n  }\n  .xl\\:overflow-y-hidden {\n    overflow-y: hidden !important;\n  }\n  .xl\\:overflow-y-visible {\n    overflow-y: visible !important;\n  }\n  .xl\\:overflow-y-scroll {\n    overflow-y: scroll !important;\n  }\n}\n.z-auto {\n  z-index: auto !important;\n}\n\n.z-0 {\n  z-index: 0 !important;\n}\n\n.z-1 {\n  z-index: 1 !important;\n}\n\n.z-2 {\n  z-index: 2 !important;\n}\n\n.z-3 {\n  z-index: 3 !important;\n}\n\n.z-4 {\n  z-index: 4 !important;\n}\n\n.z-5 {\n  z-index: 5 !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:z-auto {\n    z-index: auto !important;\n  }\n  .sm\\:z-0 {\n    z-index: 0 !important;\n  }\n  .sm\\:z-1 {\n    z-index: 1 !important;\n  }\n  .sm\\:z-2 {\n    z-index: 2 !important;\n  }\n  .sm\\:z-3 {\n    z-index: 3 !important;\n  }\n  .sm\\:z-4 {\n    z-index: 4 !important;\n  }\n  .sm\\:z-5 {\n    z-index: 5 !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:z-auto {\n    z-index: auto !important;\n  }\n  .md\\:z-0 {\n    z-index: 0 !important;\n  }\n  .md\\:z-1 {\n    z-index: 1 !important;\n  }\n  .md\\:z-2 {\n    z-index: 2 !important;\n  }\n  .md\\:z-3 {\n    z-index: 3 !important;\n  }\n  .md\\:z-4 {\n    z-index: 4 !important;\n  }\n  .md\\:z-5 {\n    z-index: 5 !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:z-auto {\n    z-index: auto !important;\n  }\n  .lg\\:z-0 {\n    z-index: 0 !important;\n  }\n  .lg\\:z-1 {\n    z-index: 1 !important;\n  }\n  .lg\\:z-2 {\n    z-index: 2 !important;\n  }\n  .lg\\:z-3 {\n    z-index: 3 !important;\n  }\n  .lg\\:z-4 {\n    z-index: 4 !important;\n  }\n  .lg\\:z-5 {\n    z-index: 5 !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:z-auto {\n    z-index: auto !important;\n  }\n  .xl\\:z-0 {\n    z-index: 0 !important;\n  }\n  .xl\\:z-1 {\n    z-index: 1 !important;\n  }\n  .xl\\:z-2 {\n    z-index: 2 !important;\n  }\n  .xl\\:z-3 {\n    z-index: 3 !important;\n  }\n  .xl\\:z-4 {\n    z-index: 4 !important;\n  }\n  .xl\\:z-5 {\n    z-index: 5 !important;\n  }\n}\n.bg-repeat {\n  background-repeat: repeat !important;\n}\n\n.bg-no-repeat {\n  background-repeat: no-repeat !important;\n}\n\n.bg-repeat-x {\n  background-repeat: repeat-x !important;\n}\n\n.bg-repeat-y {\n  background-repeat: repeat-y !important;\n}\n\n.bg-repeat-round {\n  background-repeat: round !important;\n}\n\n.bg-repeat-space {\n  background-repeat: space !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:bg-repeat {\n    background-repeat: repeat !important;\n  }\n  .sm\\:bg-no-repeat {\n    background-repeat: no-repeat !important;\n  }\n  .sm\\:bg-repeat-x {\n    background-repeat: repeat-x !important;\n  }\n  .sm\\:bg-repeat-y {\n    background-repeat: repeat-y !important;\n  }\n  .sm\\:bg-repeat-round {\n    background-repeat: round !important;\n  }\n  .sm\\:bg-repeat-space {\n    background-repeat: space !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:bg-repeat {\n    background-repeat: repeat !important;\n  }\n  .md\\:bg-no-repeat {\n    background-repeat: no-repeat !important;\n  }\n  .md\\:bg-repeat-x {\n    background-repeat: repeat-x !important;\n  }\n  .md\\:bg-repeat-y {\n    background-repeat: repeat-y !important;\n  }\n  .md\\:bg-repeat-round {\n    background-repeat: round !important;\n  }\n  .md\\:bg-repeat-space {\n    background-repeat: space !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:bg-repeat {\n    background-repeat: repeat !important;\n  }\n  .lg\\:bg-no-repeat {\n    background-repeat: no-repeat !important;\n  }\n  .lg\\:bg-repeat-x {\n    background-repeat: repeat-x !important;\n  }\n  .lg\\:bg-repeat-y {\n    background-repeat: repeat-y !important;\n  }\n  .lg\\:bg-repeat-round {\n    background-repeat: round !important;\n  }\n  .lg\\:bg-repeat-space {\n    background-repeat: space !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:bg-repeat {\n    background-repeat: repeat !important;\n  }\n  .xl\\:bg-no-repeat {\n    background-repeat: no-repeat !important;\n  }\n  .xl\\:bg-repeat-x {\n    background-repeat: repeat-x !important;\n  }\n  .xl\\:bg-repeat-y {\n    background-repeat: repeat-y !important;\n  }\n  .xl\\:bg-repeat-round {\n    background-repeat: round !important;\n  }\n  .xl\\:bg-repeat-space {\n    background-repeat: space !important;\n  }\n}\n.bg-auto {\n  background-size: auto !important;\n}\n\n.bg-cover {\n  background-size: cover !important;\n}\n\n.bg-contain {\n  background-size: contain !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:bg-auto {\n    background-size: auto !important;\n  }\n  .sm\\:bg-cover {\n    background-size: cover !important;\n  }\n  .sm\\:bg-contain {\n    background-size: contain !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:bg-auto {\n    background-size: auto !important;\n  }\n  .md\\:bg-cover {\n    background-size: cover !important;\n  }\n  .md\\:bg-contain {\n    background-size: contain !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:bg-auto {\n    background-size: auto !important;\n  }\n  .lg\\:bg-cover {\n    background-size: cover !important;\n  }\n  .lg\\:bg-contain {\n    background-size: contain !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:bg-auto {\n    background-size: auto !important;\n  }\n  .xl\\:bg-cover {\n    background-size: cover !important;\n  }\n  .xl\\:bg-contain {\n    background-size: contain !important;\n  }\n}\n.bg-bottom {\n  background-position: bottom !important;\n}\n\n.bg-center {\n  background-position: center !important;\n}\n\n.bg-left {\n  background-position: left !important;\n}\n\n.bg-left-bottom {\n  background-position: left bottom !important;\n}\n\n.bg-left-top {\n  background-position: left top !important;\n}\n\n.bg-right {\n  background-position: right !important;\n}\n\n.bg-right-bottom {\n  background-position: right bottom !important;\n}\n\n.bg-right-top {\n  background-position: right top !important;\n}\n\n.bg-top {\n  background-position: top !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:bg-bottom {\n    background-position: bottom !important;\n  }\n  .sm\\:bg-center {\n    background-position: center !important;\n  }\n  .sm\\:bg-left {\n    background-position: left !important;\n  }\n  .sm\\:bg-left-bottom {\n    background-position: left bottom !important;\n  }\n  .sm\\:bg-left-top {\n    background-position: left top !important;\n  }\n  .sm\\:bg-right {\n    background-position: right !important;\n  }\n  .sm\\:bg-right-bottom {\n    background-position: right bottom !important;\n  }\n  .sm\\:bg-right-top {\n    background-position: right top !important;\n  }\n  .sm\\:bg-top {\n    background-position: top !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:bg-bottom {\n    background-position: bottom !important;\n  }\n  .md\\:bg-center {\n    background-position: center !important;\n  }\n  .md\\:bg-left {\n    background-position: left !important;\n  }\n  .md\\:bg-left-bottom {\n    background-position: left bottom !important;\n  }\n  .md\\:bg-left-top {\n    background-position: left top !important;\n  }\n  .md\\:bg-right {\n    background-position: right !important;\n  }\n  .md\\:bg-right-bottom {\n    background-position: right bottom !important;\n  }\n  .md\\:bg-right-top {\n    background-position: right top !important;\n  }\n  .md\\:bg-top {\n    background-position: top !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:bg-bottom {\n    background-position: bottom !important;\n  }\n  .lg\\:bg-center {\n    background-position: center !important;\n  }\n  .lg\\:bg-left {\n    background-position: left !important;\n  }\n  .lg\\:bg-left-bottom {\n    background-position: left bottom !important;\n  }\n  .lg\\:bg-left-top {\n    background-position: left top !important;\n  }\n  .lg\\:bg-right {\n    background-position: right !important;\n  }\n  .lg\\:bg-right-bottom {\n    background-position: right bottom !important;\n  }\n  .lg\\:bg-right-top {\n    background-position: right top !important;\n  }\n  .lg\\:bg-top {\n    background-position: top !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:bg-bottom {\n    background-position: bottom !important;\n  }\n  .xl\\:bg-center {\n    background-position: center !important;\n  }\n  .xl\\:bg-left {\n    background-position: left !important;\n  }\n  .xl\\:bg-left-bottom {\n    background-position: left bottom !important;\n  }\n  .xl\\:bg-left-top {\n    background-position: left top !important;\n  }\n  .xl\\:bg-right {\n    background-position: right !important;\n  }\n  .xl\\:bg-right-bottom {\n    background-position: right bottom !important;\n  }\n  .xl\\:bg-right-top {\n    background-position: right top !important;\n  }\n  .xl\\:bg-top {\n    background-position: top !important;\n  }\n}\n.select-none {\n  user-select: none !important;\n}\n\n.select-text {\n  user-select: text !important;\n}\n\n.select-all {\n  user-select: all !important;\n}\n\n.select-auto {\n  user-select: auto !important;\n}\n\n.list-none {\n  list-style: none !important;\n}\n\n.list-disc {\n  list-style: disc !important;\n}\n\n.list-decimal {\n  list-style: decimal !important;\n}\n\n.appearance-none {\n  appearance: none !important;\n}\n\n.outline-none {\n  outline: none !important;\n}\n\n.pointer-events-none {\n  pointer-events: none !important;\n}\n\n.pointer-events-auto {\n  pointer-events: auto !important;\n}\n\n.cursor-auto {\n  cursor: auto !important;\n}\n\n.cursor-pointer {\n  cursor: pointer !important;\n}\n\n.cursor-wait {\n  cursor: wait !important;\n}\n\n.cursor-move {\n  cursor: move !important;\n}\n\n.select-none {\n  user-select: none !important;\n}\n\n.select-text {\n  user-select: text !important;\n}\n\n.select-all {\n  user-select: all !important;\n}\n\n.select-auto {\n  user-select: auto !important;\n}\n\n.opacity-0 {\n  opacity: 0 !important;\n}\n\n.opacity-10 {\n  opacity: .1 !important;\n}\n\n.opacity-20 {\n  opacity: .2 !important;\n}\n\n.opacity-30 {\n  opacity: .3 !important;\n}\n\n.opacity-40 {\n  opacity: .4 !important;\n}\n\n.opacity-50 {\n  opacity: .5 !important;\n}\n\n.opacity-60 {\n  opacity: .6 !important;\n}\n\n.opacity-70 {\n  opacity: .7 !important;\n}\n\n.opacity-80 {\n  opacity: .8 !important;\n}\n\n.opacity-90 {\n  opacity: .9 !important;\n}\n\n.opacity-100 {\n  opacity: 1 !important;\n}\n\n.transition-none {\n  transition-property: none !important;\n}\n\n.transition-all {\n  transition-property: all !important;\n}\n\n.transition-colors {\n  transition-property: background-color,border-color,color !important;\n}\n\n.transition-transform {\n  transition-property: transform !important;\n}\n\n.transition-duration-100 {\n  transition-duration: 100ms !important;\n}\n\n.transition-duration-150 {\n  transition-duration: 150ms !important;\n}\n\n.transition-duration-200 {\n  transition-duration: 200ms !important;\n}\n\n.transition-duration-300 {\n  transition-duration: 300ms !important;\n}\n\n.transition-duration-400 {\n  transition-duration: 400ms !important;\n}\n\n.transition-duration-500 {\n  transition-duration: 500ms !important;\n}\n\n.transition-duration-1000 {\n  transition-duration: 1000ms !important;\n}\n\n.transition-duration-2000 {\n  transition-duration: 2000ms !important;\n}\n\n.transition-duration-3000 {\n  transition-duration: 3000ms !important;\n}\n\n.transition-linear {\n  transition-timing-function: linear !important;\n}\n\n.transition-ease-in {\n  transition-timing-function: cubic-bezier(0.4, 0, 1, 1) !important;\n}\n\n.transition-ease-out {\n  transition-timing-function: cubic-bezier(0, 0, 0.2, 1) !important;\n}\n\n.transition-ease-in-out {\n  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;\n}\n\n.transition-delay-100 {\n  transition-delay: 100ms !important;\n}\n\n.transition-delay-150 {\n  transition-delay: 150ms !important;\n}\n\n.transition-delay-200 {\n  transition-delay: 200ms !important;\n}\n\n.transition-delay-300 {\n  transition-delay: 300ms !important;\n}\n\n.transition-delay-400 {\n  transition-delay: 400ms !important;\n}\n\n.transition-delay-500 {\n  transition-delay: 500ms !important;\n}\n\n.transition-delay-1000 {\n  transition-delay: 1000ms !important;\n}\n\n.translate-x-0 {\n  transform: translateX(0%) !important;\n}\n\n.translate-x-100 {\n  transform: translateX(100%) !important;\n}\n\n.-translate-x-100 {\n  transform: translateX(-100%) !important;\n}\n\n.translate-y-0 {\n  transform: translateY(0%) !important;\n}\n\n.translate-y-100 {\n  transform: translateY(100%) !important;\n}\n\n.-translate-y-100 {\n  transform: translateY(-100%) !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:translate-x-0 {\n    transform: translateX(0%) !important;\n  }\n  .sm\\:translate-x-100 {\n    transform: translateX(100%) !important;\n  }\n  .sm\\:-translate-x-100 {\n    transform: translateX(-100%) !important;\n  }\n  .sm\\:translate-y-0 {\n    transform: translateY(0%) !important;\n  }\n  .sm\\:translate-y-100 {\n    transform: translateY(100%) !important;\n  }\n  .sm\\:-translate-y-100 {\n    transform: translateY(-100%) !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:translate-x-0 {\n    transform: translateX(0%) !important;\n  }\n  .md\\:translate-x-100 {\n    transform: translateX(100%) !important;\n  }\n  .md\\:-translate-x-100 {\n    transform: translateX(-100%) !important;\n  }\n  .md\\:translate-y-0 {\n    transform: translateY(0%) !important;\n  }\n  .md\\:translate-y-100 {\n    transform: translateY(100%) !important;\n  }\n  .md\\:-translate-y-100 {\n    transform: translateY(-100%) !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:translate-x-0 {\n    transform: translateX(0%) !important;\n  }\n  .lg\\:translate-x-100 {\n    transform: translateX(100%) !important;\n  }\n  .lg\\:-translate-x-100 {\n    transform: translateX(-100%) !important;\n  }\n  .lg\\:translate-y-0 {\n    transform: translateY(0%) !important;\n  }\n  .lg\\:translate-y-100 {\n    transform: translateY(100%) !important;\n  }\n  .lg\\:-translate-y-100 {\n    transform: translateY(-100%) !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:translate-x-0 {\n    transform: translateX(0%) !important;\n  }\n  .xl\\:translate-x-100 {\n    transform: translateX(100%) !important;\n  }\n  .xl\\:-translate-x-100 {\n    transform: translateX(-100%) !important;\n  }\n  .xl\\:translate-y-0 {\n    transform: translateY(0%) !important;\n  }\n  .xl\\:translate-y-100 {\n    transform: translateY(100%) !important;\n  }\n  .xl\\:-translate-y-100 {\n    transform: translateY(-100%) !important;\n  }\n}\n.rotate-45 {\n  transform: rotate(45deg) !important;\n}\n\n.-rotate-45 {\n  transform: rotate(-45deg) !important;\n}\n\n.rotate-90 {\n  transform: rotate(90deg) !important;\n}\n\n.-rotate-90 {\n  transform: rotate(-90deg) !important;\n}\n\n.rotate-180 {\n  transform: rotate(180deg) !important;\n}\n\n.-rotate-180 {\n  transform: rotate(-180deg) !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:rotate-45 {\n    transform: rotate(45deg) !important;\n  }\n  .sm\\:-rotate-45 {\n    transform: rotate(-45deg) !important;\n  }\n  .sm\\:rotate-90 {\n    transform: rotate(90deg) !important;\n  }\n  .sm\\:-rotate-90 {\n    transform: rotate(-90deg) !important;\n  }\n  .sm\\:rotate-180 {\n    transform: rotate(180deg) !important;\n  }\n  .sm\\:-rotate-180 {\n    transform: rotate(-180deg) !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:rotate-45 {\n    transform: rotate(45deg) !important;\n  }\n  .md\\:-rotate-45 {\n    transform: rotate(-45deg) !important;\n  }\n  .md\\:rotate-90 {\n    transform: rotate(90deg) !important;\n  }\n  .md\\:-rotate-90 {\n    transform: rotate(-90deg) !important;\n  }\n  .md\\:rotate-180 {\n    transform: rotate(180deg) !important;\n  }\n  .md\\:-rotate-180 {\n    transform: rotate(-180deg) !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:rotate-45 {\n    transform: rotate(45deg) !important;\n  }\n  .lg\\:-rotate-45 {\n    transform: rotate(-45deg) !important;\n  }\n  .lg\\:rotate-90 {\n    transform: rotate(90deg) !important;\n  }\n  .lg\\:-rotate-90 {\n    transform: rotate(-90deg) !important;\n  }\n  .lg\\:rotate-180 {\n    transform: rotate(180deg) !important;\n  }\n  .lg\\:-rotate-180 {\n    transform: rotate(-180deg) !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:rotate-45 {\n    transform: rotate(45deg) !important;\n  }\n  .xl\\:-rotate-45 {\n    transform: rotate(-45deg) !important;\n  }\n  .xl\\:rotate-90 {\n    transform: rotate(90deg) !important;\n  }\n  .xl\\:-rotate-90 {\n    transform: rotate(-90deg) !important;\n  }\n  .xl\\:rotate-180 {\n    transform: rotate(180deg) !important;\n  }\n  .xl\\:-rotate-180 {\n    transform: rotate(-180deg) !important;\n  }\n}\n.origin-center {\n  transform-origin: center !important;\n}\n\n.origin-top {\n  transform-origin: top !important;\n}\n\n.origin-top-right {\n  transform-origin: top right !important;\n}\n\n.origin-right {\n  transform-origin: right !important;\n}\n\n.origin-bottom-right {\n  transform-origin: bottom right !important;\n}\n\n.origin-bottom {\n  transform-origin: bottom !important;\n}\n\n.origin-bottom-left {\n  transform-origin: bottom left !important;\n}\n\n.origin-left {\n  transform-origin: left !important;\n}\n\n.origin-top-left {\n  transform-origin: top-left !important;\n}\n\n@media screen and (min-width: 576px) {\n  .sm\\:origin-center {\n    transform-origin: center !important;\n  }\n  .sm\\:origin-top {\n    transform-origin: top !important;\n  }\n  .sm\\:origin-top-right {\n    transform-origin: top right !important;\n  }\n  .sm\\:origin-right {\n    transform-origin: right !important;\n  }\n  .sm\\:origin-bottom-right {\n    transform-origin: bottom right !important;\n  }\n  .sm\\:origin-bottom {\n    transform-origin: bottom !important;\n  }\n  .sm\\:origin-bottom-left {\n    transform-origin: bottom left !important;\n  }\n  .sm\\:origin-left {\n    transform-origin: left !important;\n  }\n  .sm\\:origin-top-left {\n    transform-origin: top-left !important;\n  }\n}\n@media screen and (min-width: 768px) {\n  .md\\:origin-center {\n    transform-origin: center !important;\n  }\n  .md\\:origin-top {\n    transform-origin: top !important;\n  }\n  .md\\:origin-top-right {\n    transform-origin: top right !important;\n  }\n  .md\\:origin-right {\n    transform-origin: right !important;\n  }\n  .md\\:origin-bottom-right {\n    transform-origin: bottom right !important;\n  }\n  .md\\:origin-bottom {\n    transform-origin: bottom !important;\n  }\n  .md\\:origin-bottom-left {\n    transform-origin: bottom left !important;\n  }\n  .md\\:origin-left {\n    transform-origin: left !important;\n  }\n  .md\\:origin-top-left {\n    transform-origin: top-left !important;\n  }\n}\n@media screen and (min-width: 992px) {\n  .lg\\:origin-center {\n    transform-origin: center !important;\n  }\n  .lg\\:origin-top {\n    transform-origin: top !important;\n  }\n  .lg\\:origin-top-right {\n    transform-origin: top right !important;\n  }\n  .lg\\:origin-right {\n    transform-origin: right !important;\n  }\n  .lg\\:origin-bottom-right {\n    transform-origin: bottom right !important;\n  }\n  .lg\\:origin-bottom {\n    transform-origin: bottom !important;\n  }\n  .lg\\:origin-bottom-left {\n    transform-origin: bottom left !important;\n  }\n  .lg\\:origin-left {\n    transform-origin: left !important;\n  }\n  .lg\\:origin-top-left {\n    transform-origin: top-left !important;\n  }\n}\n@media screen and (min-width: 1200px) {\n  .xl\\:origin-center {\n    transform-origin: center !important;\n  }\n  .xl\\:origin-top {\n    transform-origin: top !important;\n  }\n  .xl\\:origin-top-right {\n    transform-origin: top right !important;\n  }\n  .xl\\:origin-right {\n    transform-origin: right !important;\n  }\n  .xl\\:origin-bottom-right {\n    transform-origin: bottom right !important;\n  }\n  .xl\\:origin-bottom {\n    transform-origin: bottom !important;\n  }\n  .xl\\:origin-bottom-left {\n    transform-origin: bottom left !important;\n  }\n  .xl\\:origin-left {\n    transform-origin: left !important;\n  }\n  .xl\\:origin-top-left {\n    transform-origin: top-left !important;\n  }\n}\n@keyframes fadein {\n  0% {\n    opacity: 0;\n  }\n  100% {\n    opacity: 1;\n  }\n}\n@keyframes fadeout {\n  0% {\n    opacity: 1;\n  }\n  100% {\n    opacity: 0;\n  }\n}\n@keyframes scalein {\n  0% {\n    opacity: 0;\n    transform: scaleY(0.8);\n    transition: transform 0.12s cubic-bezier(0, 0, 0.2, 1), opacity 0.12s cubic-bezier(0, 0, 0.2, 1);\n  }\n  100% {\n    opacity: 1;\n    transform: scaleY(1);\n  }\n}\n@keyframes slidedown {\n  0% {\n    max-height: 0;\n  }\n  100% {\n    max-height: auto;\n  }\n}\n@keyframes slideup {\n  0% {\n    max-height: 1000px;\n  }\n  100% {\n    max-height: 0;\n  }\n}\n@keyframes fadeinleft {\n  0% {\n    opacity: 0;\n    transform: translateX(-100%);\n    transition: transform 0.12s cubic-bezier(0, 0, 0.2, 1), opacity 0.12s cubic-bezier(0, 0, 0.2, 1);\n  }\n  100% {\n    opacity: 1;\n    transform: translateX(0%);\n  }\n}\n@keyframes fadeoutleft {\n  0% {\n    opacity: 1;\n    transform: translateX(0%);\n    transition: transform 0.12s cubic-bezier(0, 0, 0.2, 1), opacity 0.12s cubic-bezier(0, 0, 0.2, 1);\n  }\n  100% {\n    opacity: 0;\n    transform: translateX(-100%);\n  }\n}\n@keyframes fadeinright {\n  0% {\n    opacity: 0;\n    transform: translateX(100%);\n    transition: transform 0.12s cubic-bezier(0, 0, 0.2, 1), opacity 0.12s cubic-bezier(0, 0, 0.2, 1);\n  }\n  100% {\n    opacity: 1;\n    transform: translateX(0%);\n  }\n}\n@keyframes fadeoutright {\n  0% {\n    opacity: 1;\n    transform: translateX(0%);\n    transition: transform 0.12s cubic-bezier(0, 0, 0.2, 1), opacity 0.12s cubic-bezier(0, 0, 0.2, 1);\n  }\n  100% {\n    opacity: 0;\n    transform: translateX(100%);\n  }\n}\n@keyframes fadeinup {\n  0% {\n    opacity: 0;\n    transform: translateY(-100%);\n    transition: transform 0.12s cubic-bezier(0, 0, 0.2, 1), opacity 0.12s cubic-bezier(0, 0, 0.2, 1);\n  }\n  100% {\n    opacity: 1;\n    transform: translateY(0%);\n  }\n}\n@keyframes fadeoutup {\n  0% {\n    opacity: 1;\n    transform: translateY(0%);\n    transition: transform 0.12s cubic-bezier(0, 0, 0.2, 1), opacity 0.12s cubic-bezier(0, 0, 0.2, 1);\n  }\n  100% {\n    opacity: 0;\n    transform: translateY(-100%);\n  }\n}\n@keyframes fadeindown {\n  0% {\n    opacity: 0;\n    transform: translateY(100%);\n    transition: transform 0.12s cubic-bezier(0, 0, 0.2, 1), opacity 0.12s cubic-bezier(0, 0, 0.2, 1);\n  }\n  100% {\n    opacity: 1;\n    transform: translateY(0%);\n  }\n}\n@keyframes fadeoutdown {\n  0% {\n    opacity: 1;\n    transform: translateY(0%);\n    transition: transform 0.12s cubic-bezier(0, 0, 0.2, 1), opacity 0.12s cubic-bezier(0, 0, 0.2, 1);\n  }\n  100% {\n    opacity: 0;\n    transform: translateY(100%);\n  }\n}\n@keyframes animate-width {\n  0% {\n    width: 0;\n  }\n  100% {\n    width: 100%;\n  }\n}\n.fadein {\n  animation: fadein 0.15s linear;\n}\n\n.fadeout {\n  animation: fadeout 0.15s linear;\n}\n\n.slidedown {\n  animation: slidedown 0.45s ease-in-out;\n}\n\n.slideup {\n  animation: slideup 0.45s cubic-bezier(0, 1, 0, 1);\n}\n\n.scalein {\n  animation: scalein 0.15s linear;\n}\n\n.fadeinleft {\n  animation: fadeinleft 0.15s linear;\n}\n\n.fadeoutleft {\n  animation: fadeoutleft 0.15s linear;\n}\n\n.fadeinright {\n  animation: fadeinright 0.15s linear;\n}\n\n.fadeoutright {\n  animation: fadeoutright 0.15s linear;\n}\n\n.fadeinup {\n  animation: fadeinup 0.15s linear;\n}\n\n.fadeoutup {\n  animation: fadeoutup 0.15s linear;\n}\n\n.fadeindown {\n  animation: fadeindown 0.15s linear;\n}\n\n.fadeoutdown {\n  animation: fadeoutdown 0.15s linear;\n}\n\n.animate-width {\n  animation: animate-width 1000ms linear;\n}\n\n.animation-duration-100 {\n  animation-duration: 100ms !important;\n}\n\n.animation-duration-150 {\n  animation-duration: 150ms !important;\n}\n\n.animation-duration-200 {\n  animation-duration: 200ms !important;\n}\n\n.animation-duration-300 {\n  animation-duration: 300ms !important;\n}\n\n.animation-duration-400 {\n  animation-duration: 400ms !important;\n}\n\n.animation-duration-500 {\n  animation-duration: 500ms !important;\n}\n\n.animation-duration-1000 {\n  animation-duration: 1000ms !important;\n}\n\n.animation-duration-2000 {\n  animation-duration: 2000ms !important;\n}\n\n.animation-duration-3000 {\n  animation-duration: 3000ms !important;\n}\n\n.animation-delay-100 {\n  animation-delay: 100ms !important;\n}\n\n.animation-delay-150 {\n  animation-delay: 150ms !important;\n}\n\n.animation-delay-200 {\n  animation-delay: 200ms !important;\n}\n\n.animation-delay-300 {\n  animation-delay: 300ms !important;\n}\n\n.animation-delay-400 {\n  animation-delay: 400ms !important;\n}\n\n.animation-delay-500 {\n  animation-delay: 500ms !important;\n}\n\n.animation-delay-1000 {\n  animation-delay: 1000ms !important;\n}\n\n.animation-iteration-1 {\n  animation-iteration-count: 1 !important;\n}\n\n.animation-iteration-2 {\n  animation-iteration-count: 2 !important;\n}\n\n.animation-iteration-infinite {\n  animation-iteration-count: infinite !important;\n}\n\n.animation-linear {\n  animation-timing-function: linear !important;\n}\n\n.animation-ease-in {\n  animation-timing-function: cubic-bezier(0.4, 0, 1, 1) !important;\n}\n\n.animation-ease-out {\n  animation-timing-function: cubic-bezier(0, 0, 0.2, 1) !important;\n}\n\n.animation-ease-in-out {\n  animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1) !important;\n}\n\n.animation-fill-none {\n  animation-fill-mode: none !important;\n}\n\n.animation-fill-forwards {\n  animation-fill-mode: forwards !important;\n}\n\n.animation-fill-backwards {\n  animation-fill-mode: backwards !important;\n}\n\n.animation-fill-both {\n  animation-fill-mode: both !important;\n}\n";
var primeicons = `@font-face {
    font-family: 'primeicons';
    font-display: block;
    src: url('__VITE_ASSET__c9eaf535__');
    src: url('__VITE_ASSET__c9eaf535__$_?#iefix__') format('embedded-opentype'), url('__VITE_ASSET__788dba0a__') format('truetype'), url('__VITE_ASSET__feb68bf6__') format('woff'), url('__VITE_ASSET__2ab98f70__$_?#primeicons__') format('svg');
    font-weight: normal;
    font-style: normal;
}

.pi {
    font-family: 'primeicons';
    speak: none;
    font-style: normal;
    font-weight: normal;
    font-variant: normal;
    text-transform: none;
    line-height: 1;
    display: inline-block;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

.pi:before {
    --webkit-backface-visibility:hidden;
    backface-visibility: hidden;
}

.pi-fw {
    width: 1.28571429em;
    text-align: center;
}

.pi-spin {
    -webkit-animation: fa-spin 2s infinite linear;
    animation: fa-spin 2s infinite linear;
}

@-webkit-keyframes fa-spin {
    0% {
        -webkit-transform: rotate(0deg);
        transform: rotate(0deg);
    }
    100% {
        -webkit-transform: rotate(359deg);
        transform: rotate(359deg);
    }
}

@keyframes fa-spin {
    0% {
        -webkit-transform: rotate(0deg);
        transform: rotate(0deg);
    }
    100% {
        -webkit-transform: rotate(359deg);
        transform: rotate(359deg);
    }
}

.pi-sort-alt-slash:before {
    content: "\\e9ee";
}

.pi-arrows-h:before {
    content: "\\e9ec";
}

.pi-arrows-v:before {
    content: "\\e9ed";
}

.pi-pound:before {
    content: "\\e9eb";
}

.pi-prime:before {
    content: "\\e9ea";
}

.pi-chart-pie:before {
    content: "\\e9e9";
}

.pi-reddit:before {
    content: "\\e9e8";
}

.pi-code:before {
    content: "\\e9e7";
}

.pi-sync:before {
    content: "\\e9e6";
}

.pi-shopping-bag:before {
    content: "\\e9e5";
}

.pi-server:before {
    content: "\\e9e4";
}

.pi-database:before {
    content: "\\e9e3";
}

.pi-hashtag:before {
    content: "\\e9e2";
}

.pi-bookmark-fill:before {
    content: "\\e9df";
}

.pi-filter-fill:before {
    content: "\\e9e0";
}

.pi-heart-fill:before {
    content: "\\e9e1";
}

.pi-flag-fill:before {
    content: "\\e9de";
}

.pi-circle:before {
    content: "\\e9dc";
}

.pi-circle-fill:before {
    content: "\\e9dd";
}

.pi-bolt:before {
    content: "\\e9db";
}

.pi-history:before {
    content: "\\e9da";
}

.pi-box:before {
    content: "\\e9d9";
}

.pi-at:before {
    content: "\\e9d8";
}

.pi-arrow-up-right:before {
    content: "\\e9d4";
}

.pi-arrow-up-left:before {
    content: "\\e9d5";
}

.pi-arrow-down-left:before {
    content: "\\e9d6";
}

.pi-arrow-down-right:before {
    content: "\\e9d7";
}

.pi-telegram:before {
    content: "\\e9d3";
}

.pi-stop-circle:before {
    content: "\\e9d2";
}

.pi-stop:before {
    content: "\\e9d1";
}

.pi-whatsapp:before {
    content: "\\e9d0";
}

.pi-building:before {
    content: "\\e9cf";
}

.pi-qrcode:before {
    content: "\\e9ce";
}

.pi-car:before {
    content: "\\e9cd";
}

.pi-instagram:before {
    content: "\\e9cc";
}

.pi-linkedin:before {
    content: "\\e9cb";
}

.pi-send:before {
    content: "\\e9ca";
}

.pi-slack:before {
    content: "\\e9c9";
}

.pi-sun:before {
    content: "\\e9c8";
}

.pi-moon:before {
    content: "\\e9c7";
}

.pi-vimeo:before {
    content: "\\e9c6";
}

.pi-youtube:before {
    content: "\\e9c5";
}

.pi-flag:before {
    content: "\\e9c4";
}

.pi-wallet:before {
    content: "\\e9c3";
}

.pi-map:before {
    content: "\\e9c2";
}

.pi-link:before {
    content: "\\e9c1";
}

.pi-credit-card:before {
    content: "\\e9bf";
}

.pi-discord:before {
    content: "\\e9c0";
}

.pi-percentage:before {
    content: "\\e9be";
}

.pi-euro:before {
    content: "\\e9bd";
}

.pi-book:before {
    content: "\\e9ba";
}

.pi-shield:before {
    content: "\\e9b9";
}

.pi-paypal:before {
    content: "\\e9bb";
}

.pi-amazon:before {
    content: "\\e9bc";
}

.pi-phone:before {
    content: "\\e9b8";
}

.pi-filter-slash:before {
    content: "\\e9b7";
}

.pi-facebook:before {
    content: "\\e9b4";
}

.pi-github:before {
    content: "\\e9b5";
}

.pi-twitter:before {
    content: "\\e9b6";
}

.pi-step-backward-alt:before {
    content: "\\e9ac";
}

.pi-step-forward-alt:before {
    content: "\\e9ad";
}

.pi-forward:before {
    content: "\\e9ae";
}

.pi-backward:before {
    content: "\\e9af";
}

.pi-fast-backward:before {
    content: "\\e9b0";
}

.pi-fast-forward:before {
    content: "\\e9b1";
}

.pi-pause:before {
    content: "\\e9b2";
}

.pi-play:before {
    content: "\\e9b3";
}

.pi-compass:before {
    content: "\\e9ab";
}

.pi-id-card:before {
    content: "\\e9aa";
}

.pi-ticket:before {
    content: "\\e9a9";
}

.pi-file-o:before {
    content: "\\e9a8";
}

.pi-reply:before {
    content: "\\e9a7";
}

.pi-directions-alt:before {
    content: "\\e9a5";
}

.pi-directions:before {
    content: "\\e9a6";
}

.pi-thumbs-up:before {
    content: "\\e9a3";
}

.pi-thumbs-down:before {
    content: "\\e9a4";
}

.pi-sort-numeric-down-alt:before {
    content: "\\e996";
}

.pi-sort-numeric-up-alt:before {
    content: "\\e997";
}

.pi-sort-alpha-down-alt:before {
    content: "\\e998";
}

.pi-sort-alpha-up-alt:before {
    content: "\\e999";
}

.pi-sort-numeric-down:before {
    content: "\\e99a";
}

.pi-sort-numeric-up:before {
    content: "\\e99b";
}

.pi-sort-alpha-down:before {
    content: "\\e99c";
}

.pi-sort-alpha-up:before {
    content: "\\e99d";
}

.pi-sort-alt:before {
    content: "\\e99e";
}

.pi-sort-amount-up:before {
    content: "\\e99f";
}

.pi-sort-amount-down:before {
    content: "\\e9a0";
}

.pi-sort-amount-down-alt:before {
    content: "\\e9a1";
}

.pi-sort-amount-up-alt:before {
    content: "\\e9a2";
}

.pi-palette:before {
    content: "\\e995";
}

.pi-undo:before {
    content: "\\e994";
}

.pi-desktop:before {
    content: "\\e993";
}

.pi-sliders-v:before {
    content: "\\e991";
}

.pi-sliders-h:before {
    content: "\\e992";
}

.pi-search-plus:before {
    content: "\\e98f";
}

.pi-search-minus:before {
    content: "\\e990";
}

.pi-file-excel:before {
    content: "\\e98e";
}

.pi-file-pdf:before {
    content: "\\e98d";
}

.pi-check-square:before {
    content: "\\e98c";
}

.pi-chart-line:before {
    content: "\\e98b";
}

.pi-user-edit:before {
    content: "\\e98a";
}

.pi-exclamation-circle:before {
    content: "\\e989";
}

.pi-android:before {
    content: "\\e985";
}

.pi-google:before {
    content: "\\e986";
}

.pi-apple:before {
    content: "\\e987";
}

.pi-microsoft:before {
    content: "\\e988";
}

.pi-heart:before {
    content: "\\e984";
}

.pi-mobile:before {
    content: "\\e982";
}

.pi-tablet:before {
    content: "\\e983";
}

.pi-key:before {
    content: "\\e981";
}

.pi-shopping-cart:before {
    content: "\\e980";
}

.pi-comments:before {
    content: "\\e97e";
}

.pi-comment:before {
    content: "\\e97f";
}

.pi-briefcase:before {
    content: "\\e97d";
}

.pi-bell:before {
    content: "\\e97c";
}

.pi-paperclip:before {
    content: "\\e97b";
}

.pi-share-alt:before {
    content: "\\e97a";
}

.pi-envelope:before {
    content: "\\e979";
}

.pi-volume-down:before {
    content: "\\e976";
}

.pi-volume-up:before {
    content: "\\e977";
}

.pi-volume-off:before {
    content: "\\e978";
}

.pi-eject:before {
    content: "\\e975";
}

.pi-money-bill:before {
    content: "\\e974";
}

.pi-images:before {
    content: "\\e973";
}

.pi-image:before {
    content: "\\e972";
}

.pi-sign-in:before {
    content: "\\e970";
}

.pi-sign-out:before {
    content: "\\e971";
}

.pi-wifi:before {
    content: "\\e96f";
}

.pi-sitemap:before {
    content: "\\e96e";
}

.pi-chart-bar:before {
    content: "\\e96d";
}

.pi-camera:before {
    content: "\\e96c";
}

.pi-dollar:before {
    content: "\\e96b";
}

.pi-lock-open:before {
    content: "\\e96a";
}

.pi-table:before {
    content: "\\e969";
}

.pi-map-marker:before {
    content: "\\e968";
}

.pi-list:before {
    content: "\\e967";
}

.pi-eye-slash:before {
    content: "\\e965";
}

.pi-eye:before {
    content: "\\e966";
}

.pi-folder-open:before {
    content: "\\e964";
}

.pi-folder:before {
    content: "\\e963";
}

.pi-video:before {
    content: "\\e962";
}

.pi-inbox:before {
    content: "\\e961";
}

.pi-lock:before {
    content: "\\e95f";
}

.pi-unlock:before {
    content: "\\e960";
}

.pi-tags:before {
    content: "\\e95d";
}

.pi-tag:before {
    content: "\\e95e";
}

.pi-power-off:before {
    content: "\\e95c";
}

.pi-save:before {
    content: "\\e95b";
}

.pi-question-circle:before {
    content: "\\e959";
}

.pi-question:before {
    content: "\\e95a";
}

.pi-copy:before {
    content: "\\e957";
}

.pi-file:before {
    content: "\\e958";
}

.pi-clone:before {
    content: "\\e955";
}

.pi-calendar-times:before {
    content: "\\e952";
}

.pi-calendar-minus:before {
    content: "\\e953";
}

.pi-calendar-plus:before {
    content: "\\e954";
}

.pi-ellipsis-v:before {
    content: "\\e950";
}

.pi-ellipsis-h:before {
    content: "\\e951";
}

.pi-bookmark:before {
    content: "\\e94e";
}

.pi-globe:before {
    content: "\\e94f";
}

.pi-replay:before {
    content: "\\e94d";
}

.pi-filter:before {
    content: "\\e94c";
}

.pi-print:before {
    content: "\\e94b";
}

.pi-align-right:before {
    content: "\\e946";
}

.pi-align-left:before {
    content: "\\e947";
}

.pi-align-center:before {
    content: "\\e948";
}

.pi-align-justify:before {
    content: "\\e949";
}

.pi-cog:before {
    content: "\\e94a";
}

.pi-cloud-download:before {
    content: "\\e943";
}

.pi-cloud-upload:before {
    content: "\\e944";
}

.pi-cloud:before {
    content: "\\e945";
}

.pi-pencil:before {
    content: "\\e942";
}

.pi-users:before {
    content: "\\e941";
}

.pi-clock:before {
    content: "\\e940";
}

.pi-user-minus:before {
    content: "\\e93e";
}

.pi-user-plus:before {
    content: "\\e93f";
}

.pi-trash:before {
    content: "\\e93d";
}

.pi-external-link:before {
    content: "\\e93c";
}

.pi-window-maximize:before {
    content: "\\e93b";
}

.pi-window-minimize:before {
    content: "\\e93a";
}

.pi-refresh:before {
    content: "\\e938";
}
  
.pi-user:before {
    content: "\\e939";
}

.pi-exclamation-triangle:before {
    content: "\\e922";
}

.pi-calendar:before {
    content: "\\e927";
}

.pi-chevron-circle-left:before {
    content: "\\e928";
}

.pi-chevron-circle-down:before {
    content: "\\e929";
}

.pi-chevron-circle-right:before {
    content: "\\e92a";
}

.pi-chevron-circle-up:before {
    content: "\\e92b";
}

.pi-angle-double-down:before {
    content: "\\e92c";
}

.pi-angle-double-left:before {
    content: "\\e92d";
}

.pi-angle-double-right:before {
    content: "\\e92e";
}

.pi-angle-double-up:before {
    content: "\\e92f";
}

.pi-angle-down:before {
    content: "\\e930";
}

.pi-angle-left:before {
    content: "\\e931";
}

.pi-angle-right:before {
    content: "\\e932";
}

.pi-angle-up:before {
    content: "\\e933";
}

.pi-upload:before {
    content: "\\e934";
}

.pi-download:before {
    content: "\\e956";
}

.pi-ban:before {
    content: "\\e935";
}

.pi-star-fill:before {
    content: "\\e936";
}

.pi-star:before {
    content: "\\e937";
}

.pi-chevron-left:before {
    content: "\\e900";
}

.pi-chevron-right:before {
    content: "\\e901";
}

.pi-chevron-down:before {
    content: "\\e902";
}

.pi-chevron-up:before {
    content: "\\e903";
}

.pi-caret-left:before {
    content: "\\e904";
}

.pi-caret-right:before {
    content: "\\e905";
}

.pi-caret-down:before {
    content: "\\e906";
}

.pi-caret-up:before {
    content: "\\e907";
}

.pi-search:before {
    content: "\\e908";
}

.pi-check:before {
    content: "\\e909";
}

.pi-check-circle:before {
    content: "\\e90a";
}

.pi-times:before {
    content: "\\e90b";
}

.pi-times-circle:before {
    content: "\\e90c";
}

.pi-plus:before {
    content: "\\e90d";
}

.pi-plus-circle:before {
    content: "\\e90e";
}

.pi-minus:before {
    content: "\\e90f";
}

.pi-minus-circle:before {
    content: "\\e910";
}

.pi-circle-on:before {
    content: "\\e911";
}

.pi-circle-off:before {
    content: "\\e912";
}

.pi-sort-down:before {
    content: "\\e913";
}

.pi-sort-up:before {
    content: "\\e914";
}

.pi-sort:before {
    content: "\\e915";
}

.pi-step-backward:before {
    content: "\\e916";
}

.pi-step-forward:before {
    content: "\\e917";
}

.pi-th-large:before {
    content: "\\e918";
}

.pi-arrow-down:before {
    content: "\\e919";
}

.pi-arrow-left:before {
    content: "\\e91a";
}

.pi-arrow-right:before {
    content: "\\e91b";
}

.pi-arrow-up:before {
    content: "\\e91c";
}

.pi-bars:before {
    content: "\\e91d";
}

.pi-arrow-circle-down:before {
    content: "\\e91e";
}

.pi-arrow-circle-left:before {
    content: "\\e91f";
}

.pi-arrow-circle-right:before {
    content: "\\e920";
}

.pi-arrow-circle-up:before {
    content: "\\e921";
}

.pi-info:before {
    content: "\\e923";
}

.pi-info-circle:before {
    content: "\\e924";
}

.pi-home:before {
    content: "\\e925";
}

.pi-spinner:before {
    content: "\\e926";
}
`;
var _imports_0$1 = "/images/logo.svg";
var _imports_1 = "/images/empty-user-photo.svg";
var script$7 = {
  name: "Badge",
  props: {
    value: null,
    severity: null,
    size: null
  },
  computed: {
    containerClass() {
      return this.$slots.default ? "p-overlay-badge" : this.badgeClass;
    },
    badgeClass() {
      return ["p-badge p-component", {
        "p-badge-no-gutter": this.value && String(this.value).length === 1,
        "p-badge-dot": !this.value && !this.$slots.default,
        "p-badge-lg": this.size === "large",
        "p-badge-xl": this.size === "xlarge",
        "p-badge-info": this.severity === "info",
        "p-badge-success": this.severity === "success",
        "p-badge-warning": this.severity === "warning",
        "p-badge-danger": this.severity === "danger"
      }];
    }
  }
};
function render$8(_ctx, _cache, $props, $setup, $data, $options) {
  return vue.openBlock(), vue.createBlock("span", { class: $options.badgeClass }, [
    vue.renderSlot(_ctx.$slots, "default", {}, () => [
      vue.createTextVNode(vue.toDisplayString($props.value), 1)
    ])
  ], 2);
}
script$7.render = render$8;
const _sfc_main$k = {
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({
        class: "surface-overlay py-3 px-6 shadow-2 flex align-items-center justify-content-between relative lg:static",
        style: { "min-height": "80px" },
        key: "navbar"
      }, _attrs))}><img${serverRenderer.ssrRenderAttr("src", _imports_0$1)} alt="Image" height="40" class="mr-0 lg:mr-6"><a class="cursor-pointer block lg:hidden text-700 p-ripple"><i class="pi pi-bars text-4xl"></i></a><div class="align-items-center flex-grow-1 justify-content-between hidden lg:flex absolute lg:static w-full surface-overlay left-0 top-100 z-1 shadow-2 lg:shadow-none"><ul class="list-none p-0 m-0 flex lg:align-items-center select-none flex-column lg:flex-row"><li><a class="flex px-6 p-3 lg:px-3 lg:py-2 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple"><i class="pi pi-home mr-2"></i><span>Home</span></a></li><li class="lg:relative"><a class="flex px-6 p-3 lg:px-3 lg:py-2 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple"><i class="pi pi-users mr-2"></i><span>Customers</span><i class="pi pi-angle-down ml-auto lg:ml-3"></i></a><ul class="list-none py-3 px-6 m-0 lg:px-0 lg:py-0 border-round shadow-0 lg:shadow-2 lg:border-1 border-50 lg:absolute surface-overlay hidden origin-top w-full lg:w-15rem cursor-pointer"><li><a class="flex p-3 align-items-center text-600 hover:text-900 hover:surface-100 transition-colors transition-duration-150 p-ripple"><i class="pi pi-user-plus mr-2"></i><span class="font-medium">Add New</span></a></li><li class="relative"><a class="flex p-3 align-items-center text-600 hover:text-900 hover:surface-100 transition-colors transition-duration-150 p-ripple"><i class="pi pi-search mr-2"></i><span class="font-medium">Search</span><i class="pi pi-angle-down ml-auto lg:-rotate-90"></i></a><ul class="list-none py-3 pl-3 m-0 lg:px-0 lg:py-0 border-round shadow-0 lg:shadow-2 lg:border-1 border-50 lg:absolute surface-overlay hidden origin-top w-full lg:w-15rem cursor-pointer left-100 top-0"><li><a class="flex p-3 align-items-center text-600 hover:text-900 hover:surface-100 transition-colors transition-duration-150 p-ripple"><i class="pi pi-shopping-cart mr-2"></i><span class="font-medium">Purchases</span></a></li><li class="relative"><a class="flex p-3 align-items-center text-600 hover:text-900 hover:surface-100 transition-colors transition-duration-150 p-ripple"><i class="pi pi-comments mr-2"></i><span class="font-medium">Messages</span></a></li></ul></li></ul></li><li><a class="flex px-6 p-3 lg:px-3 lg:py-2 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple"><i class="pi pi-calendar mr-2"></i><span>Calendar</span></a></li><li><a class="flex px-6 p-3 lg:px-3 lg:py-2 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple"><i class="pi pi-chart-line mr-2"></i><span>Stats</span></a></li></ul><ul class="list-none p-0 m-0 flex lg:align-items-center select-none flex-column lg:flex-row border-top-1 surface-border lg:border-top-none"><li><a class="flex px-6 p-3 lg:px-3 lg:py-2 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple"><i class="pi pi-inbox text-base lg:text-2xl mr-2 lg:mr-0"></i><span class="block lg:hidden font-medium">Inbox</span></a></li><li><a class="flex px-6 p-3 lg:px-3 lg:py-3 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple"><i class="pi pi-bell text-base lg:text-2xl mr-2 lg:mr-0 p-overlay-badge">`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$7), { value: "2" }, null, _parent));
      _push(`</i><span class="block lg:hidden font-medium">Notifications</span></a></li><li class="border-top-1 surface-border lg:border-top-none"><a class="flex px-6 p-3 lg:px-3 lg:py-2 align-items-center hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple"><img${serverRenderer.ssrRenderAttr("src", _imports_1)} class="mr-3 lg:mr-0 border-circle" style="${serverRenderer.ssrRenderStyle({ "width": "28px", "height": "28px" })}"><div class="block lg:hidden"><div class="text-900 font-medium">Josephine Lillard</div><span class="text-600 font-medium text-sm">Marketing Specialist</span></div></a></li></ul></div></div>`);
    };
  }
};
const _sfc_setup$k = _sfc_main$k.setup;
_sfc_main$k.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/NavBar.vue");
  return _sfc_setup$k ? _sfc_setup$k(props, ctx) : void 0;
};
const _sfc_main$j = {
  __ssrInlineRender: true,
  setup(__props) {
    console.log("SETUP PAGE!!!");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({ class: "min-h-screen flex flex-column surface-ground" }, _attrs))}>`);
      _push(serverRenderer.ssrRenderComponent(_sfc_main$k, null, null, _parent));
      _push(`<div class="p-5 flex flex-column flex-auto align-items-center">`);
      serverRenderer.ssrRenderSlot(_ctx.$slots, "default", {}, null, _push, _parent);
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup$j = _sfc_main$j.setup;
_sfc_main$j.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/Page.vue");
  return _sfc_setup$j ? _sfc_setup$j(props, ctx) : void 0;
};
const isClientSide = vue.ref(false);
var App_vue_vue_type_style_index_0_lang = "\nbody {\n    margin: 0;\n    height: 100%;\n    overflow-x: hidden;\n    overflow-y: auto;\n    background-color: var(--surface-a);\n    font-family: var(--font-family);\n    font-weight: 400;\n    color: var(--text-color);\n}\n";
const _sfc_main$i = {
  __ssrInlineRender: true,
  setup(__props) {
    useMeta({
      title: "Title",
      meta: [
        { charset: "utf-8" },
        {
          name: "viewport",
          content: "user-scalable=no, initial-scale=1, maximum-scale=1, minimum-scale=1, width=device-width, viewport-fit=cover"
        }
      ],
      htmlAttrs: {
        lang: "en",
        amp: true
      }
    });
    vue.onMounted(() => isClientSide.value = true);
    return (_ctx, _push, _parent, _attrs) => {
      const _component_router_view = vue.resolveComponent("router-view");
      const _component_loading_zone = vue.resolveComponent("loading-zone");
      const _component_working_zone = vue.resolveComponent("working-zone");
      _push(serverRenderer.ssrRenderComponent(_component_router_view, _attrs, {
        default: vue.withCtx(({ route, Component }, _push2, _parent2, _scopeId) => {
          var _a, _b;
          if (_push2) {
            if ((_a = route == null ? void 0 : route.meta) == null ? void 0 : _a.raw) {
              serverRenderer.ssrRenderVNode(_push2, vue.createVNode(vue.resolveDynamicComponent(Component), null, null), _parent2, _scopeId);
            } else {
              _push2(serverRenderer.ssrRenderComponent(_component_loading_zone, { suspense: "" }, {
                loading: vue.withCtx((_, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(`<div class="loading"${_scopeId2}>Loading! Please wait!</div>`);
                  } else {
                    return [
                      vue.createVNode("div", { class: "loading" }, "Loading! Please wait!")
                    ];
                  }
                }),
                default: vue.withCtx((_, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    _push3(serverRenderer.ssrRenderComponent(_sfc_main$j, null, {
                      default: vue.withCtx((_2, _push4, _parent4, _scopeId3) => {
                        if (_push4) {
                          _push4(serverRenderer.ssrRenderComponent(_component_working_zone, null, {
                            working: vue.withCtx((_3, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                _push5(`<div class="loading"${_scopeId4}>Working! Please wait!</div>`);
                              } else {
                                return [
                                  vue.createVNode("div", { class: "loading" }, "Working! Please wait!")
                                ];
                              }
                            }),
                            default: vue.withCtx((_3, _push5, _parent5, _scopeId4) => {
                              if (_push5) {
                                serverRenderer.ssrRenderVNode(_push5, vue.createVNode(vue.resolveDynamicComponent(Component), null, null), _parent5, _scopeId4);
                              } else {
                                return [
                                  (vue.openBlock(), vue.createBlock(vue.resolveDynamicComponent(Component)))
                                ];
                              }
                            }),
                            _: 2
                          }, _parent4, _scopeId3));
                        } else {
                          return [
                            vue.createVNode(_component_working_zone, null, {
                              working: vue.withCtx(() => [
                                vue.createVNode("div", { class: "loading" }, "Working! Please wait!")
                              ]),
                              default: vue.withCtx(() => [
                                (vue.openBlock(), vue.createBlock(vue.resolveDynamicComponent(Component)))
                              ]),
                              _: 2
                            }, 1024)
                          ];
                        }
                      }),
                      _: 2
                    }, _parent3, _scopeId2));
                  } else {
                    return [
                      vue.createVNode(_sfc_main$j, null, {
                        default: vue.withCtx(() => [
                          vue.createVNode(_component_working_zone, null, {
                            working: vue.withCtx(() => [
                              vue.createVNode("div", { class: "loading" }, "Working! Please wait!")
                            ]),
                            default: vue.withCtx(() => [
                              (vue.openBlock(), vue.createBlock(vue.resolveDynamicComponent(Component)))
                            ]),
                            _: 2
                          }, 1024)
                        ]),
                        _: 2
                      }, 1024)
                    ];
                  }
                }),
                _: 2
              }, _parent2, _scopeId));
            }
          } else {
            return [
              ((_b = route == null ? void 0 : route.meta) == null ? void 0 : _b.raw) ? (vue.openBlock(), vue.createBlock(vue.resolveDynamicComponent(Component), { key: 0 })) : (vue.openBlock(), vue.createBlock(_component_loading_zone, {
                key: 1,
                suspense: ""
              }, {
                loading: vue.withCtx(() => [
                  vue.createVNode("div", { class: "loading" }, "Loading! Please wait!")
                ]),
                default: vue.withCtx(() => [
                  vue.createVNode(_sfc_main$j, null, {
                    default: vue.withCtx(() => [
                      vue.createVNode(_component_working_zone, null, {
                        working: vue.withCtx(() => [
                          vue.createVNode("div", { class: "loading" }, "Working! Please wait!")
                        ]),
                        default: vue.withCtx(() => [
                          (vue.openBlock(), vue.createBlock(vue.resolveDynamicComponent(Component)))
                        ]),
                        _: 2
                      }, 1024)
                    ]),
                    _: 2
                  }, 1024)
                ]),
                _: 2
              }, 1024))
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
};
const _sfc_setup$i = _sfc_main$i.setup;
_sfc_main$i.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/App.vue");
  return _sfc_setup$i ? _sfc_setup$i(props, ctx) : void 0;
};
function routes(config = {}) {
  const { prefix: prefix2 = "", route = (r) => r } = config;
  return [
    route({
      name: "user:sent",
      path: prefix2 + "/sent/:message",
      props: true,
      component: () => Promise.resolve().then(function() {
        return MessageSent;
      })
    }),
    route({
      name: "user:link",
      path: prefix2 + "/link/:key",
      props: true,
      component: () => Promise.resolve().then(function() {
        return MessageLink;
      })
    }),
    route({
      name: "user:email",
      path: prefix2 + "/_email/:action/:contact/:data",
      props: true,
      meta: { raw: true },
      component: () => Promise.resolve().then(function() {
        return MessageEmail$1;
      })
    }),
    route({
      name: "user:signIn",
      path: prefix2 + "/sign-in",
      component: () => Promise.resolve().then(function() {
        return SignIn;
      })
    }),
    route({
      name: "user:signInFinished",
      path: prefix2 + "/sign-in-finished",
      component: () => Promise.resolve().then(function() {
        return SignInFinished$1;
      })
    }),
    route({
      name: "user:signUp",
      path: prefix2 + "/sign-up",
      component: () => Promise.resolve().then(function() {
        return SignUp;
      })
    }),
    route({
      name: "user:signUpFinished",
      path: prefix2 + "/sign-up-finished",
      component: () => Promise.resolve().then(function() {
        return SignUpFinished$1;
      })
    }),
    route({
      name: "user:resetPassword",
      path: prefix2 + "/reset-password",
      component: () => Promise.resolve().then(function() {
        return ResetPassword;
      })
    }),
    route({
      name: "user:resetPasswordForm",
      path: prefix2 + "/set-new-password",
      component: () => Promise.resolve().then(function() {
        return ResetPasswordForm;
      })
    }),
    route({
      name: "user:resetPasswordFinished",
      path: prefix2 + "/reset-password-finished",
      component: () => Promise.resolve().then(function() {
        return ResetPasswordFinished$1;
      })
    }),
    route({
      name: "user:changePassword",
      path: prefix2 + "/change-password",
      component: () => Promise.resolve().then(function() {
        return ChangePassword;
      })
    }),
    route({
      name: "user:changePasswordFinished",
      path: prefix2 + "/change-password-finished",
      component: () => Promise.resolve().then(function() {
        return ChangePassword;
      })
    }),
    route({
      name: "user:connectedAccounts",
      path: prefix2 + "/connected-accounts",
      component: () => Promise.resolve().then(function() {
        return ConnectedAccounts;
      })
    }),
    route({
      name: "user:connectAccount",
      path: prefix2 + "/connect-account",
      component: () => Promise.resolve().then(function() {
        return ConnectAccount;
      })
    }),
    route({
      name: "user:connectAccountFinished",
      path: prefix2 + "/account-connected",
      component: () => Promise.resolve().then(function() {
        return ConnectAccountFinished$1;
      })
    }),
    route({
      name: "user:deleteAccount",
      path: prefix2 + "/delete-account",
      component: () => Promise.resolve().then(function() {
        return DeleteAccount;
      })
    }),
    route({
      name: "user:deleteAccountFinished",
      path: prefix2 + "/account-deleted",
      component: () => Promise.resolve().then(function() {
        return DeleteAccountFinished;
      })
    }),
    route({
      name: "user:deleteAccountFeedbackSent",
      path: prefix2 + "/account-deleted-feedback-sent",
      component: () => Promise.resolve().then(function() {
        return DeleteAccountFeedbackSent$1;
      })
    })
  ];
}
function createRouter(config) {
  const router = vueRouter.createRouter({
    history: vueRouter.createMemoryHistory(),
    routes: routes(config)
  });
  return router;
}
var emailValidator = (settings) => (email) => {
  if (!email || !email.trim())
    return;
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!re.test(String(email).toLowerCase()))
    return "wrongEmail";
};
function createApp(api) {
  api.validators.email = emailValidator;
  const app = vue.createSSRApp(_sfc_main$i);
  app.config.devtools = true;
  api.installInstanceProperties(app.config.globalProperties);
  registerComponents(app);
  app.use(ReactiveDaoVue, { dao: api });
  const router = createRouter();
  app.use(router);
  app.use(PrimeVue, {
    ripple: true
  });
  app.use(ConfirmationService);
  app.provide(PrimeVueConfirmSymbol, app.config.globalProperties.$confirm);
  app.use(ToastService);
  app.provide(PrimeVueToastSymbol, app.config.globalProperties.$toast);
  app.directive("styleclass", StyleClass);
  app.directive("ripple", Ripple);
  app.directive("badge", BadgeDirective);
  const meta = createMetaManager({
    isSSR: true
  });
  app.use(meta);
  return { app, router };
}
function escapeHtml(unsafe) {
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
async function render$7({ url, dao, windowId }) {
  const api = await serverApi(dao, {
    use: []
  });
  const { app, router } = createApp(api);
  router.push(url);
  await router.isReady();
  await api.preFetchRoute(router.currentRoute, router);
  const ctx = {};
  const html = await serverRenderer.renderToString(app, ctx);
  await renderMetaToString(app, ctx);
  const data = api.prerenderCache.cacheData();
  console.log("PRERENDER CACHE", Array.from(api.prerenderCache.cache.keys()));
  console.log("PRERENDER CACHE EXTENDED", Array.from(api.prerenderCache.extendedCache.keys()));
  const metaManager = app.config.globalProperties.$metaManager;
  const activeMeta = metaManager.target.context.active;
  console.log("ACTIVE META", activeMeta);
  console.log("TELEPORTS", ctx.teleports);
  ctx.teleports.head = [
    ...activeMeta.title ? [`<title data-vm-ssr="true">${escapeHtml(activeMeta.title)}</title>`] : [],
    ...(activeMeta.meta || []).map((meta) => `<meta ${Object.keys(meta).map((key) => `${escapeHtml(key)}="${escapeHtml(meta[key])}"`).join(" ")}>`)
  ].join("\n");
  return { html, data, meta: ctx.teleports, modules: ctx.modules };
}
var script$6 = {
  name: "InputMask",
  emits: ["update:modelValue", "focus", "blur", "keydown", "complete", "keypress", "paste"],
  props: {
    modelValue: null,
    slotChar: {
      type: String,
      default: "_"
    },
    mask: {
      type: String,
      default: null
    },
    autoClear: {
      type: Boolean,
      default: true
    },
    unmask: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    onInput(event) {
      if (this.androidChrome)
        this.handleAndroidInput(event);
      else
        this.handleInputChange(event);
      this.$emit("update:modelValue", event.target.value);
    },
    onFocus(event) {
      if (this.$attrs.readonly) {
        return;
      }
      this.focus = true;
      clearTimeout(this.caretTimeoutId);
      let pos;
      this.focusText = this.$el.value;
      pos = this.checkVal();
      this.caretTimeoutId = setTimeout(() => {
        if (this.$el !== document.activeElement) {
          return;
        }
        this.writeBuffer();
        if (pos === this.mask.replace("?", "").length) {
          this.caret(0, pos);
        } else {
          this.caret(pos);
        }
      }, 10);
      this.$emit("focus", event);
    },
    onBlur(event) {
      this.focus = false;
      this.checkVal();
      this.updateModel(event);
      if (this.$el.value !== this.focusText) {
        let e = document.createEvent("HTMLEvents");
        e.initEvent("change", true, false);
        this.$el.dispatchEvent(e);
      }
      this.$emit("blur", event);
    },
    onKeyDown(event) {
      if (this.$attrs.readonly) {
        return;
      }
      let k = event.which || event.keyCode, pos, begin, end;
      let iPhone = /iphone/i.test(DomHandler.getUserAgent());
      this.oldVal = this.$el.value;
      if (k === 8 || k === 46 || iPhone && k === 127) {
        pos = this.caret();
        begin = pos.begin;
        end = pos.end;
        if (end - begin === 0) {
          begin = k !== 46 ? this.seekPrev(begin) : end = this.seekNext(begin - 1);
          end = k === 46 ? this.seekNext(end) : end;
        }
        this.clearBuffer(begin, end);
        this.shiftL(begin, end - 1);
        this.updateModel(event);
        event.preventDefault();
      } else if (k === 13) {
        this.$el.blur();
        this.updateModel(event);
      } else if (k === 27) {
        this.$el.value = this.focusText;
        this.caret(0, this.checkVal());
        this.updateModel(event);
        event.preventDefault();
      }
      this.$emit("keydown", event);
    },
    onKeyPress(event) {
      if (this.$attrs.readonly) {
        return;
      }
      var k = event.which || event.keyCode, pos = this.caret(), p, c, next, completed;
      if (event.ctrlKey || event.altKey || event.metaKey || k < 32) {
        return;
      } else if (k && k !== 13) {
        if (pos.end - pos.begin !== 0) {
          this.clearBuffer(pos.begin, pos.end);
          this.shiftL(pos.begin, pos.end - 1);
        }
        p = this.seekNext(pos.begin - 1);
        if (p < this.len) {
          c = String.fromCharCode(k);
          if (this.tests[p].test(c)) {
            this.shiftR(p);
            this.buffer[p] = c;
            this.writeBuffer();
            next = this.seekNext(p);
            if (/android/i.test(DomHandler.getUserAgent())) {
              let proxy = () => {
                this.caret(next);
              };
              setTimeout(proxy, 0);
            } else {
              this.caret(next);
            }
            if (pos.begin <= this.lastRequiredNonMaskPos) {
              completed = this.isCompleted();
            }
          }
        }
        event.preventDefault();
      }
      this.updateModel(event);
      if (completed) {
        this.$emit("complete", event);
      }
      this.$emit("keypress", event);
    },
    onPaste(event) {
      this.handleInputChange(event);
      this.$emit("paste", event);
    },
    caret(first, last) {
      let range, begin, end;
      if (!this.$el.offsetParent || this.$el !== document.activeElement) {
        return;
      }
      if (typeof first === "number") {
        begin = first;
        end = typeof last === "number" ? last : begin;
        if (this.$el.setSelectionRange) {
          this.$el.setSelectionRange(begin, end);
        } else if (this.$el["createTextRange"]) {
          range = this.$el["createTextRange"]();
          range.collapse(true);
          range.moveEnd("character", end);
          range.moveStart("character", begin);
          range.select();
        }
      } else {
        if (this.$el.setSelectionRange) {
          begin = this.$el.selectionStart;
          end = this.$el.selectionEnd;
        } else if (document["selection"] && document["selection"].createRange) {
          range = document["selection"].createRange();
          begin = 0 - range.duplicate().moveStart("character", -1e5);
          end = begin + range.text.length;
        }
        return { begin, end };
      }
    },
    isCompleted() {
      for (let i = this.firstNonMaskPos; i <= this.lastRequiredNonMaskPos; i++) {
        if (this.tests[i] && this.buffer[i] === this.getPlaceholder(i)) {
          return false;
        }
      }
      return true;
    },
    getPlaceholder(i) {
      if (i < this.slotChar.length) {
        return this.slotChar.charAt(i);
      }
      return this.slotChar.charAt(0);
    },
    seekNext(pos) {
      while (++pos < this.len && !this.tests[pos])
        ;
      return pos;
    },
    seekPrev(pos) {
      while (--pos >= 0 && !this.tests[pos])
        ;
      return pos;
    },
    shiftL(begin, end) {
      let i, j;
      if (begin < 0) {
        return;
      }
      for (i = begin, j = this.seekNext(end); i < this.len; i++) {
        if (this.tests[i]) {
          if (j < this.len && this.tests[i].test(this.buffer[j])) {
            this.buffer[i] = this.buffer[j];
            this.buffer[j] = this.getPlaceholder(j);
          } else {
            break;
          }
          j = this.seekNext(j);
        }
      }
      this.writeBuffer();
      this.caret(Math.max(this.firstNonMaskPos, begin));
    },
    shiftR(pos) {
      let i, c, j, t;
      for (i = pos, c = this.getPlaceholder(pos); i < this.len; i++) {
        if (this.tests[i]) {
          j = this.seekNext(i);
          t = this.buffer[i];
          this.buffer[i] = c;
          if (j < this.len && this.tests[j].test(t)) {
            c = t;
          } else {
            break;
          }
        }
      }
    },
    handleAndroidInput(event) {
      var curVal = this.$el.value;
      var pos = this.caret();
      if (this.oldVal && this.oldVal.length && this.oldVal.length > curVal.length) {
        this.checkVal(true);
        while (pos.begin > 0 && !this.tests[pos.begin - 1])
          pos.begin--;
        if (pos.begin === 0) {
          while (pos.begin < this.firstNonMaskPos && !this.tests[pos.begin])
            pos.begin++;
        }
        this.caret(pos.begin, pos.begin);
      } else {
        this.checkVal(true);
        while (pos.begin < this.len && !this.tests[pos.begin])
          pos.begin++;
        this.caret(pos.begin, pos.begin);
      }
      if (this.isCompleted()) {
        this.$emit("complete", event);
      }
    },
    clearBuffer(start, end) {
      let i;
      for (i = start; i < end && i < this.len; i++) {
        if (this.tests[i]) {
          this.buffer[i] = this.getPlaceholder(i);
        }
      }
    },
    writeBuffer() {
      this.$el.value = this.buffer.join("");
    },
    checkVal(allow) {
      this.isValueChecked = true;
      let test = this.$el.value, lastMatch = -1, i, c, pos;
      for (i = 0, pos = 0; i < this.len; i++) {
        if (this.tests[i]) {
          this.buffer[i] = this.getPlaceholder(i);
          while (pos++ < test.length) {
            c = test.charAt(pos - 1);
            if (this.tests[i].test(c)) {
              this.buffer[i] = c;
              lastMatch = i;
              break;
            }
          }
          if (pos > test.length) {
            this.clearBuffer(i + 1, this.len);
            break;
          }
        } else {
          if (this.buffer[i] === test.charAt(pos)) {
            pos++;
          }
          if (i < this.partialPosition) {
            lastMatch = i;
          }
        }
      }
      if (allow) {
        this.writeBuffer();
      } else if (lastMatch + 1 < this.partialPosition) {
        if (this.autoClear || this.buffer.join("") === this.defaultBuffer) {
          if (this.$el.value)
            this.$el.value = "";
          this.clearBuffer(0, this.len);
        } else {
          this.writeBuffer();
        }
      } else {
        this.writeBuffer();
        this.$el.value = this.$el.value.substring(0, lastMatch + 1);
      }
      return this.partialPosition ? i : this.firstNonMaskPos;
    },
    handleInputChange(event) {
      if (this.$attrs.readonly) {
        return;
      }
      var pos = this.checkVal(true);
      this.caret(pos);
      this.updateModel(event);
      if (this.isCompleted()) {
        this.$emit("complete", event);
      }
    },
    getUnmaskedValue() {
      let unmaskedBuffer = [];
      for (let i = 0; i < this.buffer.length; i++) {
        let c = this.buffer[i];
        if (this.tests[i] && c !== this.getPlaceholder(i)) {
          unmaskedBuffer.push(c);
        }
      }
      return unmaskedBuffer.join("");
    },
    updateModel(e) {
      let val = this.unmask ? this.getUnmaskedValue() : e.target.value;
      this.$emit("update:modelValue", this.defaultBuffer !== val ? val : "");
    },
    updateValue(updateModel = true) {
      if (this.$el) {
        if (this.modelValue == null) {
          this.$el.value = "";
          updateModel && this.$emit("update:modelValue", "");
        } else {
          this.$el.value = this.modelValue;
          this.checkVal();
          setTimeout(() => {
            if (this.$el) {
              this.writeBuffer();
              this.checkVal();
              if (updateModel) {
                let val = this.unmask ? this.getUnmaskedValue() : this.$el.value;
                this.$emit("update:modelValue", this.defaultBuffer !== val ? val : "");
              }
            }
          }, 10);
        }
        this.focusText = this.$el.value;
      }
    },
    isValueUpdated() {
      return this.unmask ? this.modelValue != this.getUnmaskedValue() : this.defaultBuffer !== this.$el.value && this.$el.value !== this.modelValue;
    }
  },
  mounted() {
    this.tests = [];
    this.partialPosition = this.mask.length;
    this.len = this.mask.length;
    this.firstNonMaskPos = null;
    this.defs = {
      "9": "[0-9]",
      "a": "[A-Za-z]",
      "*": "[A-Za-z0-9]"
    };
    let ua = DomHandler.getUserAgent();
    this.androidChrome = /chrome/i.test(ua) && /android/i.test(ua);
    let maskTokens = this.mask.split("");
    for (let i = 0; i < maskTokens.length; i++) {
      let c = maskTokens[i];
      if (c === "?") {
        this.len--;
        this.partialPosition = i;
      } else if (this.defs[c]) {
        this.tests.push(new RegExp(this.defs[c]));
        if (this.firstNonMaskPos === null) {
          this.firstNonMaskPos = this.tests.length - 1;
        }
        if (i < this.partialPosition) {
          this.lastRequiredNonMaskPos = this.tests.length - 1;
        }
      } else {
        this.tests.push(null);
      }
    }
    this.buffer = [];
    for (let i = 0; i < maskTokens.length; i++) {
      let c = maskTokens[i];
      if (c !== "?") {
        if (this.defs[c])
          this.buffer.push(this.getPlaceholder(i));
        else
          this.buffer.push(c);
      }
    }
    this.defaultBuffer = this.buffer.join("");
    this.updateValue(false);
  },
  updated() {
    if (this.isValueUpdated()) {
      this.updateValue();
    }
  },
  computed: {
    filled() {
      return this.modelValue != null && this.modelValue.toString().length > 0;
    },
    inputClass() {
      return ["p-inputmask p-inputtext p-component", {
        "p-filled": this.filled
      }];
    }
  }
};
function render$6(_ctx, _cache, $props, $setup, $data, $options) {
  return vue.openBlock(), vue.createBlock("input", vue.mergeProps({ class: $options.inputClass }, _ctx.$attrs, {
    onInput: _cache[1] || (_cache[1] = (...args) => $options.onInput && $options.onInput(...args)),
    onFocus: _cache[2] || (_cache[2] = (...args) => $options.onFocus && $options.onFocus(...args)),
    onBlur: _cache[3] || (_cache[3] = (...args) => $options.onBlur && $options.onBlur(...args)),
    onKeydown: _cache[4] || (_cache[4] = (...args) => $options.onKeyDown && $options.onKeyDown(...args)),
    onKeypress: _cache[5] || (_cache[5] = (...args) => $options.onKeyPress && $options.onKeyPress(...args)),
    onPaste: _cache[6] || (_cache[6] = (...args) => $options.onPaste && $options.onPaste(...args))
  }), null, 16);
}
script$6.render = render$6;
var script$5 = {
  name: "Button",
  props: {
    label: {
      type: String
    },
    icon: {
      type: String
    },
    iconPos: {
      type: String,
      default: "left"
    },
    badge: {
      type: String
    },
    badgeClass: {
      type: String,
      default: null
    },
    loading: {
      type: Boolean,
      default: false
    },
    loadingIcon: {
      type: String,
      default: "pi pi-spinner pi-spin"
    }
  },
  computed: {
    buttonClass() {
      return {
        "p-button p-component": true,
        "p-button-icon-only": this.icon && !this.label,
        "p-button-vertical": (this.iconPos === "top" || this.iconPos === "bottom") && this.label,
        "p-disabled": this.$attrs.disabled || this.loading,
        "p-button-loading": this.loading,
        "p-button-loading-label-only": this.loading && !this.icon && this.label
      };
    },
    iconClass() {
      return [
        this.loading ? "p-button-loading-icon " + this.loadingIcon : this.icon,
        "p-button-icon",
        {
          "p-button-icon-left": this.iconPos === "left" && this.label,
          "p-button-icon-right": this.iconPos === "right" && this.label,
          "p-button-icon-top": this.iconPos === "top" && this.label,
          "p-button-icon-bottom": this.iconPos === "bottom" && this.label
        }
      ];
    },
    badgeStyleClass() {
      return [
        "p-badge p-component",
        this.badgeClass,
        {
          "p-badge-no-gutter": this.badge && String(this.badge).length === 1
        }
      ];
    },
    disabled() {
      return this.$attrs.disabled || this.loading;
    }
  },
  directives: {
    "ripple": Ripple
  }
};
const _hoisted_1$3 = { class: "p-button-label" };
function render$5(_ctx, _cache, $props, $setup, $data, $options) {
  const _directive_ripple = vue.resolveDirective("ripple");
  return vue.withDirectives((vue.openBlock(), vue.createBlock("button", {
    class: $options.buttonClass,
    type: "button",
    disabled: $options.disabled
  }, [
    vue.renderSlot(_ctx.$slots, "default", {}, () => [
      $props.loading && !$props.icon ? (vue.openBlock(), vue.createBlock("span", {
        key: 0,
        class: $options.iconClass
      }, null, 2)) : vue.createCommentVNode("", true),
      $props.icon ? (vue.openBlock(), vue.createBlock("span", {
        key: 1,
        class: $options.iconClass
      }, null, 2)) : vue.createCommentVNode("", true),
      vue.createVNode("span", _hoisted_1$3, vue.toDisplayString($props.label || "\xA0"), 1),
      $props.badge ? (vue.openBlock(), vue.createBlock("span", {
        key: 2,
        class: $options.badgeStyleClass
      }, vue.toDisplayString($props.badge), 3)) : vue.createCommentVNode("", true)
    ])
  ], 10, ["disabled"])), [
    [_directive_ripple]
  ]);
}
script$5.render = render$5;
const _sfc_main$h = {
  __ssrInlineRender: true,
  props: {
    message: {
      type: String,
      required: true
    }
  },
  setup(__props) {
    const code = vue.ref("");
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({ class: "w-full lg:w-6 md:w-9" }, _attrs))}><div class="surface-card border-round shadow-2 p-4"><div class="text-900 font-medium mb-3 text-xl">Message sent</div><p class="mt-0 mb-1 p-0 line-height-3">We sent special secret message to your email.</p><p class="mt-0 mb-4 p-0 line-height-3">Click on the link or enter the code you found in that message.</p><div class="flex justify-content-center"><div class="p-field mr-1"><label for="code" class="p-sr-only">Code</label>`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$6), {
        id: "code",
        class: "p-inputtext-lg",
        mask: "999999",
        slotChar: "######",
        placeholder: "Enter code",
        modelValue: code.value,
        "onUpdate:modelValue": ($event) => code.value = $event
      }, null, _parent));
      _push(`</div>`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
        label: "OK",
        class: "p-button-lg"
      }, null, _parent));
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup$h = _sfc_main$h.setup;
_sfc_main$h.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/MessageSent.vue");
  return _sfc_setup$h ? _sfc_setup$h(props, ctx) : void 0;
};
var MessageSent = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _sfc_main$h
});
const _sfc_main$g = {
  __ssrInlineRender: true,
  props: {
    message: {
      type: String,
      required: true
    }
  },
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({ class: "w-full lg:w-6 md:w-9" }, _attrs))}><div class="surface-card border-round shadow-2 p-4"><div class="text-900 font-medium mb-3 text-xl">Link expired</div><p class="mt-0 mb-4 p-0 line-height-3">Your secret link already expired. To send another link click button below.</p>`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
        label: "Resend",
        class: "p-button-lg"
      }, null, _parent));
      _push(`</div><div class="surface-card border-round shadow-2 p-4"><div class="text-900 font-medium mb-3 text-xl">Unknown link</div><p class="mt-0 mb-2 p-0 line-height-3">We can&#39;t find your secret link. Check if you copied the address correctly.</p></div><div class="surface-card border-round shadow-2 p-4"><div class="text-900 font-medium mb-3 text-xl">Link used</div><p class="mt-0 mb-2 p-0 line-height-3">This link was already used.</p></div></div>`);
    };
  }
};
const _sfc_setup$g = _sfc_main$g.setup;
_sfc_main$g.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/MessageLink.vue");
  return _sfc_setup$g ? _sfc_setup$g(props, ctx) : void 0;
};
var MessageLink = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _sfc_main$g
});
var _imports_0 = "/images/logo128.png";
var MessageEmail_vue_vue_type_style_index_0_scoped_true_lang = "\nimg[data-v-2a961452] {\n    width: 100%;\n    max-width: 100px;\n}\n.message[data-v-2a961452] {\n    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol;\n    color: #495057;\n    font-weight: 400;\n}\npre[data-v-2a961452] {\n    border-top: 1px solid black;\n    border-bottom: 1px solid black;\n}\n";
const _sfc_main$f = {
  __ssrInlineRender: true,
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
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<!--[--><pre data-headers data-v-2a961452>${serverRenderer.ssrInterpolate(JSON.stringify(metadata, null, "  "))}</pre><div data-html class="message m-6" data-v-2a961452><p class="text-lg" data-v-2a961452> Hello username! </p><p data-v-2a961452> We are glad to see you have just signed up for DEMO with your email. In order to confirm that, please click the button below: </p><div data-v-2a961452>`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
        label: "Confirm email",
        class: "p-button-lg"
      }, null, _parent));
      _push(`</div><p data-v-2a961452> Or copy this address to your browser address bar:<br data-v-2a961452><a${serverRenderer.ssrRenderAttr("href", linkAddress)} data-v-2a961452>${serverRenderer.ssrInterpolate(linkAddress)}</a></p><p data-v-2a961452> Let us know in case it&#39;s not you. </p><p data-v-2a961452> See you soon<br data-v-2a961452> Live Change Team </p><img${serverRenderer.ssrRenderAttr("src", _imports_0)} data-v-2a961452></div><pre class="message" data-text data-v-2a961452>    Hello username!

    We are glad to see you have just signed up for DEMO with your email.
    In order to confirm that, please click link below or copy address to your browser address bar:

    ${serverRenderer.ssrInterpolate(linkAddress)}

    Let us know in case it&#39;s not you.

    See you soon
    Live Change Team
  </pre><!--]-->`);
    };
  }
};
const _sfc_setup$f = _sfc_main$f.setup;
_sfc_main$f.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/MessageEmail.vue");
  return _sfc_setup$f ? _sfc_setup$f(props, ctx) : void 0;
};
var MessageEmail = /* @__PURE__ */ _export_sfc(_sfc_main$f, [["__scopeId", "data-v-2a961452"]]);
var MessageEmail$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": MessageEmail
});
var script$4 = {
  name: "InputText",
  emits: ["update:modelValue"],
  props: {
    modelValue: null
  },
  methods: {
    onInput(event) {
      this.$emit("update:modelValue", event.target.value);
    }
  },
  computed: {
    filled() {
      return this.modelValue != null && this.modelValue.toString().length > 0;
    }
  }
};
function render$4(_ctx, _cache, $props, $setup, $data, $options) {
  return vue.openBlock(), vue.createBlock("input", {
    class: ["p-inputtext p-component", { "p-filled": $options.filled }],
    value: $props.modelValue,
    onInput: _cache[1] || (_cache[1] = (...args) => $options.onInput && $options.onInput(...args))
  }, null, 42, ["value"]);
}
script$4.render = render$4;
var script$3 = {
  name: "Checkbox",
  inheritAttrs: false,
  emits: ["click", "update:modelValue", "change", "input"],
  props: {
    value: null,
    modelValue: null,
    binary: Boolean,
    class: null,
    style: null,
    trueValue: {
      type: null,
      default: true
    },
    falseValue: {
      type: null,
      default: false
    }
  },
  data() {
    return {
      focused: false
    };
  },
  methods: {
    onClick(event) {
      if (!this.$attrs.disabled) {
        let newModelValue;
        if (this.binary) {
          newModelValue = this.checked ? this.falseValue : this.trueValue;
        } else {
          if (this.checked)
            newModelValue = this.modelValue.filter((val) => !ObjectUtils.equals(val, this.value));
          else
            newModelValue = this.modelValue ? [...this.modelValue, this.value] : [this.value];
        }
        this.$emit("click", event);
        this.$emit("update:modelValue", newModelValue);
        this.$emit("change", event);
        this.$emit("input", newModelValue);
        this.$refs.input.focus();
      }
    },
    onFocus() {
      this.focused = true;
    },
    onBlur() {
      this.focused = false;
    }
  },
  computed: {
    checked() {
      return this.binary ? this.modelValue === this.trueValue : ObjectUtils.contains(this.value, this.modelValue);
    },
    containerClass() {
      return ["p-checkbox p-component", this.class, { "p-checkbox-checked": this.checked, "p-checkbox-disabled": this.$attrs.disabled, "p-checkbox-focused": this.focused }];
    }
  }
};
const _hoisted_1$2 = { class: "p-hidden-accessible" };
function render$3(_ctx, _cache, $props, $setup, $data, $options) {
  return vue.openBlock(), vue.createBlock("div", {
    class: $options.containerClass,
    onClick: _cache[3] || (_cache[3] = ($event) => $options.onClick($event)),
    style: $props.style
  }, [
    vue.createVNode("div", _hoisted_1$2, [
      vue.createVNode("input", vue.mergeProps({
        ref: "input",
        type: "checkbox",
        checked: $options.checked,
        value: $props.value
      }, _ctx.$attrs, {
        onFocus: _cache[1] || (_cache[1] = (...args) => $options.onFocus && $options.onFocus(...args)),
        onBlur: _cache[2] || (_cache[2] = (...args) => $options.onBlur && $options.onBlur(...args))
      }), null, 16, ["checked", "value"])
    ]),
    vue.createVNode("div", {
      ref: "box",
      class: ["p-checkbox-box", { "p-highlight": $options.checked, "p-disabled": _ctx.$attrs.disabled, "p-focus": $data.focused }],
      role: "checkbox",
      "aria-checked": $options.checked
    }, [
      vue.createVNode("span", {
        class: ["p-checkbox-icon", { "pi pi-check": $options.checked }]
      }, null, 2)
    ], 10, ["aria-checked"])
  ], 6);
}
script$3.render = render$3;
var script$2 = {
  name: "Divider",
  props: {
    align: {
      type: String,
      default: null
    },
    layout: {
      type: String,
      default: "horizontal"
    },
    type: {
      type: String,
      default: "solid"
    }
  },
  computed: {
    containerClass() {
      return [
        "p-divider p-component",
        "p-divider-" + this.layout,
        "p-divider-" + this.type,
        { "p-divider-left": this.layout === "horizontal" && (!this.align || this.align === "left") },
        { "p-divider-center": this.layout === "horizontal" && this.align === "center" },
        { "p-divider-right": this.layout === "horizontal" && this.align === "right" },
        { "p-divider-top": this.layout === "vertical" && this.align === "top" },
        { "p-divider-center": this.layout === "vertical" && (!this.align || this.align === "center") },
        { "p-divider-bottom": this.layout === "vertical" && this.align === "bottom" }
      ];
    }
  }
};
const _hoisted_1$1 = {
  key: 0,
  class: "p-divider-content"
};
function render$2(_ctx, _cache, $props, $setup, $data, $options) {
  return vue.openBlock(), vue.createBlock("div", {
    class: $options.containerClass,
    role: "separator"
  }, [
    _ctx.$slots.default ? (vue.openBlock(), vue.createBlock("div", _hoisted_1$1, [
      vue.renderSlot(_ctx.$slots, "default")
    ])) : vue.createCommentVNode("", true)
  ], 2);
}
function styleInject$2(css, ref2) {
  if (ref2 === void 0)
    ref2 = {};
  var insertAt = ref2.insertAt;
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
var css_248z$2 = '\n.p-divider-horizontal {\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n    width: 100%;\n    position: relative;\n    -webkit-box-align: center;\n        -ms-flex-align: center;\n            align-items: center;\n}\n.p-divider-horizontal:before {\n    position: absolute;\n    display: block;\n    top: 50%;\n    left: 0;\n    width: 100%;\n    content: "";\n}\n.p-divider-horizontal.p-divider-left {\n    -webkit-box-pack: start;\n        -ms-flex-pack: start;\n            justify-content: flex-start;\n}\n.p-divider-horizontal.p-divider-right {\n    -webkit-box-pack: end;\n        -ms-flex-pack: end;\n            justify-content: flex-end;\n}\n.p-divider-horizontal.p-divider-center {\n    -webkit-box-pack: center;\n        -ms-flex-pack: center;\n            justify-content: center;\n}\n.p-divider-content {\n    z-index: 1;\n}\n.p-divider-vertical {\n    min-height: 100%;\n    margin: 0 1rem;\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n    position: relative;\n    -webkit-box-pack: center;\n        -ms-flex-pack: center;\n            justify-content: center;\n}\n.p-divider-vertical:before {\n    position: absolute;\n    display: block;\n    top: 0;\n    left: 50%;\n    height: 100%;\n    content: "";\n}\n.p-divider-vertical.p-divider-top {\n    -webkit-box-align: start;\n        -ms-flex-align: start;\n            align-items: flex-start;\n}\n.p-divider-vertical.p-divider-center {\n    -webkit-box-align: center;\n        -ms-flex-align: center;\n            align-items: center;\n}\n.p-divider-vertical.p-divider-bottom {\n    -webkit-box-align: end;\n        -ms-flex-align: end;\n            align-items: flex-end;\n}\n.p-divider-solid.p-divider-horizontal:before {\n    border-top-style: solid;\n}\n.p-divider-solid.p-divider-vertical:before {\n    border-left-style: solid;\n}\n.p-divider-dashed.p-divider-horizontal:before {\n    border-top-style: dashed;\n}\n.p-divider-dashed.p-divider-vertical:before {\n    border-left-style: dashed;\n}\n.p-divider-dotted.p-divider-horizontal:before {\n    border-top-style: dotted;\n}\n.p-divider-dotted.p-divider-horizontal:before {\n    border-left-style: dotted;\n}\n';
styleInject$2(css_248z$2);
script$2.render = render$2;
var OverlayEventBus = primebus();
var script$1 = {
  name: "Password",
  emits: ["update:modelValue"],
  inheritAttrs: false,
  props: {
    modelValue: String,
    promptLabel: {
      type: String,
      default: null
    },
    mediumRegex: {
      type: String,
      default: "^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{6,})"
    },
    strongRegex: {
      type: String,
      default: "^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})"
    },
    weakLabel: {
      type: String,
      default: null
    },
    mediumLabel: {
      type: String,
      default: null
    },
    strongLabel: {
      type: String,
      default: null
    },
    feedback: {
      type: Boolean,
      default: true
    },
    appendTo: {
      type: String,
      default: "body"
    },
    toggleMask: {
      type: Boolean,
      default: false
    },
    hideIcon: {
      type: String,
      default: "pi pi-eye-slash"
    },
    showIcon: {
      type: String,
      default: "pi pi-eye"
    },
    inputClass: String,
    inputStyle: null,
    style: null,
    class: String,
    panelClass: String
  },
  data() {
    return {
      overlayVisible: false,
      meter: null,
      infoText: null,
      focused: false,
      unmasked: false
    };
  },
  mediumCheckRegExp: null,
  strongCheckRegExp: null,
  resizeListener: null,
  scrollHandler: null,
  overlay: null,
  mounted() {
    this.infoText = this.promptText;
    this.mediumCheckRegExp = new RegExp(this.mediumRegex);
    this.strongCheckRegExp = new RegExp(this.strongRegex);
  },
  beforeUnmount() {
    this.unbindResizeListener();
    if (this.scrollHandler) {
      this.scrollHandler.destroy();
      this.scrollHandler = null;
    }
    if (this.overlay) {
      ZIndexUtils.clear(this.overlay);
      this.overlay = null;
    }
  },
  methods: {
    onOverlayEnter(el) {
      ZIndexUtils.set("overlay", el, this.$primevue.config.zIndex.overlay);
      this.alignOverlay();
      this.bindScrollListener();
      this.bindResizeListener();
    },
    onOverlayLeave() {
      this.unbindScrollListener();
      this.unbindResizeListener();
      this.overlay = null;
    },
    onOverlayAfterLeave(el) {
      ZIndexUtils.clear(el);
    },
    alignOverlay() {
      if (this.appendDisabled) {
        DomHandler.relativePosition(this.overlay, this.$refs.input.$el);
      } else {
        this.overlay.style.minWidth = DomHandler.getOuterWidth(this.$refs.input.$el) + "px";
        DomHandler.absolutePosition(this.overlay, this.$refs.input.$el);
      }
    },
    testStrength(str) {
      let level = 0;
      if (this.strongCheckRegExp.test(str))
        level = 3;
      else if (this.mediumCheckRegExp.test(str))
        level = 2;
      else if (str.length)
        level = 1;
      return level;
    },
    onInput(event) {
      this.$emit("update:modelValue", event.target.value);
    },
    onFocus() {
      this.focused = true;
      if (this.feedback) {
        this.overlayVisible = true;
      }
    },
    onBlur() {
      this.focused = false;
      if (this.feedback) {
        this.overlayVisible = false;
      }
    },
    onKeyUp(event) {
      if (this.feedback) {
        const value = event.target.value;
        let label = null;
        let meter = null;
        switch (this.testStrength(value)) {
          case 1:
            label = this.weakText;
            meter = {
              strength: "weak",
              width: "33.33%"
            };
            break;
          case 2:
            label = this.mediumText;
            meter = {
              strength: "medium",
              width: "66.66%"
            };
            break;
          case 3:
            label = this.strongText;
            meter = {
              strength: "strong",
              width: "100%"
            };
            break;
          default:
            label = this.promptText;
            meter = null;
            break;
        }
        this.meter = meter;
        this.infoText = label;
        if (!this.overlayVisible) {
          this.overlayVisible = true;
        }
      }
    },
    bindScrollListener() {
      if (!this.scrollHandler) {
        this.scrollHandler = new ConnectedOverlayScrollHandler(this.$refs.input.$el, () => {
          if (this.overlayVisible) {
            this.overlayVisible = false;
          }
        });
      }
      this.scrollHandler.bindScrollListener();
    },
    unbindScrollListener() {
      if (this.scrollHandler) {
        this.scrollHandler.unbindScrollListener();
      }
    },
    bindResizeListener() {
      if (!this.resizeListener) {
        this.resizeListener = () => {
          if (this.overlayVisible) {
            this.overlayVisible = false;
          }
        };
        window.addEventListener("resize", this.resizeListener);
      }
    },
    unbindResizeListener() {
      if (this.resizeListener) {
        window.removeEventListener("resize", this.resizeListener);
        this.resizeListener = null;
      }
    },
    overlayRef(el) {
      this.overlay = el;
    },
    onMaskToggle() {
      this.unmasked = !this.unmasked;
    },
    onOverlayClick(event) {
      OverlayEventBus.emit("overlay-click", {
        originalEvent: event,
        target: this.$el
      });
    }
  },
  computed: {
    containerClass() {
      return ["p-password p-component p-inputwrapper", this.class, {
        "p-inputwrapper-filled": this.filled,
        "p-inputwrapper-focus": this.focused,
        "p-input-icon-right": this.toggleMask
      }];
    },
    inputFieldClass() {
      return ["p-password-input", this.inputClass, {
        "p-disabled": this.$attrs.disabled
      }];
    },
    panelStyleClass() {
      return ["p-password-panel p-component", this.panelClass, {
        "p-input-filled": this.$primevue.config.inputStyle === "filled",
        "p-ripple-disabled": this.$primevue.config.ripple === false
      }];
    },
    toggleIconClass() {
      return this.unmasked ? this.hideIcon : this.showIcon;
    },
    strengthClass() {
      return `p-password-strength ${this.meter ? this.meter.strength : ""}`;
    },
    inputType() {
      return this.unmasked ? "text" : "password";
    },
    filled() {
      return this.modelValue != null && this.modelValue.toString().length > 0;
    },
    weakText() {
      return this.weakLabel || this.$primevue.config.locale.weak;
    },
    mediumText() {
      return this.mediumLabel || this.$primevue.config.locale.medium;
    },
    strongText() {
      return this.strongLabel || this.$primevue.config.locale.strong;
    },
    promptText() {
      return this.promptLabel || this.$primevue.config.locale.passwordPrompt;
    },
    appendDisabled() {
      return this.appendTo === "self";
    },
    appendTarget() {
      return this.appendDisabled ? null : this.appendTo;
    }
  },
  components: {
    "PInputText": script$4
  }
};
const _hoisted_1 = { class: "p-password-meter" };
const _hoisted_2 = { class: "p-password-info" };
function render$1(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_PInputText = vue.resolveComponent("PInputText");
  return vue.openBlock(), vue.createBlock("div", {
    class: $options.containerClass,
    style: $props.style
  }, [
    vue.createVNode(_component_PInputText, vue.mergeProps({
      ref: "input",
      class: $options.inputFieldClass,
      style: $props.inputStyle,
      type: $options.inputType,
      value: $props.modelValue,
      onInput: $options.onInput,
      onFocus: $options.onFocus,
      onBlur: $options.onBlur,
      onKeyup: $options.onKeyUp
    }, _ctx.$attrs), null, 16, ["class", "style", "type", "value", "onInput", "onFocus", "onBlur", "onKeyup"]),
    $props.toggleMask ? (vue.openBlock(), vue.createBlock("i", {
      key: 0,
      class: $options.toggleIconClass,
      onClick: _cache[1] || (_cache[1] = (...args) => $options.onMaskToggle && $options.onMaskToggle(...args))
    }, null, 2)) : vue.createCommentVNode("", true),
    (vue.openBlock(), vue.createBlock(vue.Teleport, {
      to: $options.appendTarget,
      disabled: $options.appendDisabled
    }, [
      vue.createVNode(vue.Transition, {
        name: "p-connected-overlay",
        onEnter: $options.onOverlayEnter,
        onLeave: $options.onOverlayLeave,
        onAfterLeave: $options.onOverlayAfterLeave
      }, {
        default: vue.withCtx(() => [
          $data.overlayVisible ? (vue.openBlock(), vue.createBlock("div", {
            key: 0,
            ref: $options.overlayRef,
            class: $options.panelStyleClass,
            onClick: _cache[2] || (_cache[2] = (...args) => $options.onOverlayClick && $options.onOverlayClick(...args))
          }, [
            vue.renderSlot(_ctx.$slots, "header"),
            vue.renderSlot(_ctx.$slots, "content", {}, () => [
              vue.createVNode("div", _hoisted_1, [
                vue.createVNode("div", {
                  class: $options.strengthClass,
                  style: { "width": $data.meter ? $data.meter.width : "" }
                }, null, 6)
              ]),
              vue.createVNode("div", _hoisted_2, vue.toDisplayString($data.infoText), 1)
            ]),
            vue.renderSlot(_ctx.$slots, "footer")
          ], 2)) : vue.createCommentVNode("", true)
        ]),
        _: 3
      }, 8, ["onEnter", "onLeave", "onAfterLeave"])
    ], 8, ["to", "disabled"]))
  ], 6);
}
function styleInject$1(css, ref2) {
  if (ref2 === void 0)
    ref2 = {};
  var insertAt = ref2.insertAt;
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
var css_248z$1 = "\n.p-password {\n    position: relative;\n    display: -webkit-inline-box;\n    display: -ms-inline-flexbox;\n    display: inline-flex;\n}\n.p-password-panel {\n    position: absolute;\n    top: 0;\n    left: 0;\n}\n.p-password .p-password-panel {\n    min-width: 100%;\n}\n.p-password-meter {\n    height: 10px;\n}\n.p-password-strength {\n    height: 100%;\n    width: 0;\n    -webkit-transition: width 1s ease-in-out;\n    transition: width 1s ease-in-out;\n}\n.p-fluid .p-password {\n    display: -webkit-box;\n    display: -ms-flexbox;\n    display: flex;\n}\n";
styleInject$1(css_248z$1);
script$1.render = render$1;
const _sfc_main$e = {
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_router_link = vue.resolveComponent("router-link");
      _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({ class: "w-full lg:w-6 md:w-9" }, _attrs))}><div class="surface-card p-4 shadow-2 border-round"><div class="text-center mb-5"><div class="text-900 text-3xl font-medium mb-3">Welcome Back</div><span class="text-600 font-medium line-height-3">Don&#39;t have an account?</span>`);
      _push(serverRenderer.ssrRenderComponent(_component_router_link, {
        to: { name: "user:signUp" },
        class: "font-medium no-underline ml-2 text-blue-500 cursor-pointer"
      }, {
        default: vue.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Create today!`);
          } else {
            return [
              vue.createTextVNode(" Create today!")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div>`);
      if (vue.unref(isClientSide)) {
        _push(`<div><div class="p-field mb-3"><label for="email" class="block text-900 font-medium mb-2"> Email address </label>`);
        _push(serverRenderer.ssrRenderComponent(vue.unref(script$4), {
          id: "email",
          type: "text",
          class: "w-full p-invalid",
          "aria-describedby": "email-help"
        }, null, _parent));
        _push(`<small id="email-help" class="p-error">email not found.</small></div><div class="p-field mb-3"><label for="password" class="block text-900 font-medium mb-2">Password (optional)</label>`);
        _push(serverRenderer.ssrRenderComponent(vue.unref(script$1), {
          id: "password",
          class: "w-full p-invalid",
          inputClass: "w-full",
          toggleMask: ""
        }, null, _parent));
        _push(`<small id="password-help" class="p-error">password-error.</small></div><div class="flex align-items-center justify-content-between mb-6"><div class="flex align-items-center">`);
        _push(serverRenderer.ssrRenderComponent(vue.unref(script$3), {
          id: "rememberme",
          binary: true,
          class: "mr-2"
        }, null, _parent));
        _push(`<label for="rememberme">Remember me</label></div>`);
        _push(serverRenderer.ssrRenderComponent(_component_router_link, {
          to: { name: "user:resetPassword" },
          class: "font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer"
        }, {
          default: vue.withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Forgot password? `);
            } else {
              return [
                vue.createTextVNode(" Forgot password? ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
        _push(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
          label: "Sign In",
          icon: "pi pi-user",
          class: "w-full"
        }, null, _parent));
        _push(serverRenderer.ssrRenderComponent(vue.unref(script$2), {
          align: "center",
          class: "my-4"
        }, {
          default: vue.withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="text-600 font-normal text-sm"${_scopeId}>OR</span>`);
            } else {
              return [
                vue.createVNode("span", { class: "text-600 font-normal text-sm" }, "OR")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
          label: "Sign In with GitHub",
          icon: "pi pi-github",
          class: "w-full p-button-secondary mb-2"
        }, null, _parent));
        _push(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
          label: "Sign In with Google",
          icon: "pi pi-google",
          class: "w-full p-button-secondary mb-1"
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup$e = _sfc_main$e.setup;
_sfc_main$e.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/SignIn.vue");
  return _sfc_setup$e ? _sfc_setup$e(props, ctx) : void 0;
};
var SignIn = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _sfc_main$e
});
const _sfc_main$d = {};
function _sfc_ssrRender$4(_ctx, _push, _parent, _attrs) {
  _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({ class: "w-full lg:w-6 md:w-9" }, _attrs))}><div class="surface-card border-round shadow-2 p-4"><div class="text-900 font-medium mb-3 text-xl mb-4">Signed In</div><p class="mt-0 p-0 line-height-3">Congratulations! You have successfully logged in to your account.</p></div></div>`);
}
const _sfc_setup$d = _sfc_main$d.setup;
_sfc_main$d.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/SignInFinished.vue");
  return _sfc_setup$d ? _sfc_setup$d(props, ctx) : void 0;
};
var SignInFinished = /* @__PURE__ */ _export_sfc(_sfc_main$d, [["ssrRender", _sfc_ssrRender$4]]);
var SignInFinished$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": SignInFinished
});
const _sfc_main$c = {
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_command_form = vue.resolveComponent("command-form");
      _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({ class: "w-full lg:w-6 md:w-9" }, _attrs))}><div class="surface-card p-4 shadow-2 border-round"><div class="text-center mb-5"><div class="text-900 text-3xl font-medium mb-3">Sign Up</div></div>`);
      _push(serverRenderer.ssrRenderComponent(_component_command_form, {
        service: "message-authentication",
        action: "signUpEmail"
      }, {
        default: vue.withCtx(({ data, submit }, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="p-field mb-3"${_scopeId}><label for="email" class="block text-900 font-medium mb-2"${_scopeId}> Email address </label>`);
            _push2(serverRenderer.ssrRenderComponent(vue.unref(script$4), {
              id: "email",
              type: "text",
              class: ["w-full", { "p-invalid": data.emailError }],
              "aria-describedby": "email-help",
              modelValue: data.email,
              "onUpdate:modelValue": ($event) => data.email = $event
            }, null, _parent2, _scopeId));
            if (data.emailError) {
              _push2(`<small id="email-help" class="p-error"${_scopeId}>${serverRenderer.ssrInterpolate(data.emailError)}</small>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
            _push2(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
              label: "Connect Email",
              icon: "pi pi-user",
              class: "w-full"
            }, null, _parent2, _scopeId));
          } else {
            return [
              vue.createVNode("div", { class: "p-field mb-3" }, [
                vue.createVNode("label", {
                  for: "email",
                  class: "block text-900 font-medium mb-2"
                }, " Email address "),
                vue.createVNode(vue.unref(script$4), {
                  id: "email",
                  type: "text",
                  class: ["w-full", { "p-invalid": data.emailError }],
                  "aria-describedby": "email-help",
                  modelValue: data.email,
                  "onUpdate:modelValue": ($event) => data.email = $event
                }, null, 8, ["class", "modelValue", "onUpdate:modelValue"]),
                data.emailError ? (vue.openBlock(), vue.createBlock("small", {
                  key: 0,
                  id: "email-help",
                  class: "p-error"
                }, vue.toDisplayString(data.emailError), 1)) : vue.createCommentVNode("", true)
              ]),
              vue.createVNode(vue.unref(script$5), {
                label: "Connect Email",
                icon: "pi pi-user",
                class: "w-full",
                onClick: submit
              }, null, 8, ["onClick"])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup$c = _sfc_main$c.setup;
_sfc_main$c.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/SignUp.vue");
  return _sfc_setup$c ? _sfc_setup$c(props, ctx) : void 0;
};
var SignUp = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _sfc_main$c
});
const _sfc_main$b = {};
function _sfc_ssrRender$3(_ctx, _push, _parent, _attrs) {
  _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({ class: "w-full lg:w-6 md:w-9" }, _attrs))}><div class="surface-card border-round shadow-2 p-4"><div class="text-900 font-medium mb-3 text-xl mb-4">Signed Up</div><p class="mt-0 p-0 line-height-3">Congratulations! You have successfully created your account.</p></div></div>`);
}
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/SignUpFinished.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
var SignUpFinished = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["ssrRender", _sfc_ssrRender$3]]);
var SignUpFinished$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": SignUpFinished
});
const _sfc_main$a = {
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({ class: "w-full lg:w-6 md:w-9" }, _attrs))}><div class="surface-card p-4 shadow-2 border-round"><div class="text-center mb-5"><div class="text-900 text-3xl font-medium mb-3">Reset password</div></div><div><div class="p-field mb-3"><label for="email" class="block text-900 font-medium mb-2"> Email address </label>`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$4), {
        id: "email",
        type: "text",
        class: "w-full p-invalid",
        "aria-describedby": "email-help"
      }, null, _parent));
      _push(`<small id="email-help" class="p-error">email not found.</small></div>`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
        label: "Reset password",
        icon: "pi pi-key",
        class: "w-full"
      }, null, _parent));
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/ResetPassword.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
var ResetPassword = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _sfc_main$a
});
const _sfc_main$9 = {
  __ssrInlineRender: true,
  setup(__props) {
    ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({ class: "w-full lg:w-6 md:w-9" }, _attrs))}><div class="surface-card p-4 shadow-2 border-round"><div class="text-center mb-5"><div class="text-900 text-3xl font-medium mb-3">Reset password</div></div><div><div class="p-field mb-3"><label for="password" class="block text-900 font-medium mb-2">New password</label>`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$1), {
        id: "password",
        class: "w-full p-invalid",
        inputClass: "w-full",
        toggleMask: ""
      }, {
        footer: vue.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(serverRenderer.ssrRenderComponent(vue.unref(script$2), null, null, _parent2, _scopeId));
            _push2(`<p class="p-mt-2"${_scopeId}>Suggestions</p><ul class="p-pl-2 p-ml-2 p-mt-0" style="${serverRenderer.ssrRenderStyle({ "line-height": "1.5" })}"${_scopeId}><li${_scopeId}>At least one lowercase</li><li${_scopeId}>At least one uppercase</li><li${_scopeId}>At least one numeric</li><li${_scopeId}>Minimum 8 characters</li></ul>`);
          } else {
            return [
              vue.createVNode(vue.unref(script$2)),
              vue.createVNode("p", { class: "p-mt-2" }, "Suggestions"),
              vue.createVNode("ul", {
                class: "p-pl-2 p-ml-2 p-mt-0",
                style: { "line-height": "1.5" }
              }, [
                vue.createVNode("li", null, "At least one lowercase"),
                vue.createVNode("li", null, "At least one uppercase"),
                vue.createVNode("li", null, "At least one numeric"),
                vue.createVNode("li", null, "Minimum 8 characters")
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<small id="password-help" class="p-error">password-error.</small></div><div class="p-field mb-3"><label for="reenterPassword" class="block text-900 font-medium mb-2">Re-enter password</label>`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$1), {
        id: "reenterPassword",
        class: "w-full p-invalid",
        inputClass: "w-full",
        feedback: false,
        toggleMask: ""
      }, null, _parent));
      _push(`<small id="reenterPassword-help" class="p-error">password-error.</small></div>`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
        label: "Reset password",
        icon: "pi pi-key",
        class: "w-full"
      }, null, _parent));
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/ResetPasswordForm.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
var ResetPasswordForm = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _sfc_main$9
});
const _sfc_main$8 = {};
function _sfc_ssrRender$2(_ctx, _push, _parent, _attrs) {
  _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({ class: "w-full lg:w-6 md:w-9" }, _attrs))}><div class="surface-card border-round shadow-2 p-4"><div class="text-900 font-medium mb-3 text-xl mb-4">Password changed</div><p class="mt-0 p-0 line-height-3">You have successfully changed your password.</p></div></div>`);
}
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/ResetPasswordFinished.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
var ResetPasswordFinished = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["ssrRender", _sfc_ssrRender$2]]);
var ResetPasswordFinished$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": ResetPasswordFinished
});
const _sfc_main$7 = {
  __ssrInlineRender: true,
  setup(__props) {
    const route = vueRouter.useRoute();
    vueRouter.useRouter();
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
    return (_ctx, _push, _parent, _attrs) => {
      const _component_router_link = vue.resolveComponent("router-link");
      _push(`<ul${serverRenderer.ssrRenderAttrs(vue.mergeProps({ class: "surface-card p-0 m-0 list-none flex overflow-x-auto select-none" }, _attrs))}><!--[-->`);
      serverRenderer.ssrRenderList(tabs, (tab) => {
        _push(`<li>`);
        _push(serverRenderer.ssrRenderComponent(_component_router_link, {
          to: { name: tab.route },
          class: ["cursor-pointer px-4 py-3 flex align-items-center border-bottom-2 hover:border-500 transition-colors transition-duration-150 p-ripple", isActive(tab) ? "border-blue-500 text-blue-500 hover:border-blue-500" : "text-700 border-transparent"],
          style: { "text-decoration": "none" }
        }, {
          default: vue.withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<i class="${serverRenderer.ssrRenderClass([tab.icon, "pi mr-2"])}"${_scopeId}></i><span class="font-medium"${_scopeId}>${serverRenderer.ssrInterpolate(tab.title)}</span>`);
            } else {
              return [
                vue.createVNode("i", {
                  class: ["pi mr-2", tab.icon]
                }, null, 2),
                vue.createVNode("span", { class: "font-medium" }, vue.toDisplayString(tab.title), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</li>`);
      });
      _push(`<!--]--></ul>`);
    };
  }
};
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/SettingsTabs.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const _sfc_main$6 = {
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({ class: "w-full lg:w-6 md:w-9" }, _attrs))}>`);
      _push(serverRenderer.ssrRenderComponent(_sfc_main$7, null, null, _parent));
      _push(`<div class="surface-card p-4 shadow-2 border-round"><div class="text-center mb-5"><div class="text-900 text-3xl font-medium mb-3">Change password</div></div>`);
      if (vue.unref(isClientSide)) {
        _push(`<div><div class="p-field mb-3"><label for="password" class="block text-900 font-medium mb-2">Current password</label>`);
        _push(serverRenderer.ssrRenderComponent(vue.unref(script$1), {
          id: "password",
          class: "w-full p-invalid",
          inputClass: "w-full",
          toggleMask: ""
        }, null, _parent));
        _push(`<small id="password-help" class="p-error">password-error.</small></div><div class="p-field mb-3"><label for="password" class="block text-900 font-medium mb-2">New password</label>`);
        _push(serverRenderer.ssrRenderComponent(vue.unref(script$1), {
          id: "password",
          class: "w-full p-invalid",
          inputClass: "w-full",
          toggleMask: ""
        }, {
          footer: vue.withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(serverRenderer.ssrRenderComponent(vue.unref(script$2), null, null, _parent2, _scopeId));
              _push2(`<p class="p-mt-2"${_scopeId}>Suggestions</p><ul class="p-pl-2 p-ml-2 p-mt-0" style="${serverRenderer.ssrRenderStyle({ "line-height": "1.5" })}"${_scopeId}><li${_scopeId}>At least one lowercase</li><li${_scopeId}>At least one uppercase</li><li${_scopeId}>At least one numeric</li><li${_scopeId}>Minimum 8 characters</li></ul>`);
            } else {
              return [
                vue.createVNode(vue.unref(script$2)),
                vue.createVNode("p", { class: "p-mt-2" }, "Suggestions"),
                vue.createVNode("ul", {
                  class: "p-pl-2 p-ml-2 p-mt-0",
                  style: { "line-height": "1.5" }
                }, [
                  vue.createVNode("li", null, "At least one lowercase"),
                  vue.createVNode("li", null, "At least one uppercase"),
                  vue.createVNode("li", null, "At least one numeric"),
                  vue.createVNode("li", null, "Minimum 8 characters")
                ])
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<small id="password-help" class="p-error">password-error.</small></div><div class="p-field mb-3"><label for="reenterPassword" class="block text-900 font-medium mb-2">Re-enter password</label>`);
        _push(serverRenderer.ssrRenderComponent(vue.unref(script$1), {
          id: "reenterPassword",
          class: "w-full p-invalid",
          inputClass: "w-full",
          feedback: false,
          toggleMask: ""
        }, null, _parent));
        _push(`<small id="reenterPassword-help" class="p-error">password-error.</small></div>`);
        _push(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
          label: "Change password",
          icon: "pi pi-key",
          class: "w-full"
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div></div>`);
    };
  }
};
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/ChangePassword.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
var ChangePassword = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _sfc_main$6
});
const _sfc_main$5 = {
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      const _component_router_link = vue.resolveComponent("router-link");
      _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({ class: "w-full lg:w-6 md:w-9" }, _attrs))}>`);
      _push(serverRenderer.ssrRenderComponent(_sfc_main$7, null, null, _parent));
      _push(`<div class="surface-card border-round shadow-2 p-4"><div class="text-900 font-medium mb-3 text-xl">Connected accounts</div><ul class="list-none p-0 m-0 mt-5 mb-4"><li class="flex flex-row align-items-center justify-content-between mb-2"><div class="flex flex-row align-items-center"><i class="pi pi-envelope mr-2"></i><span class="block text-900 font-medium text-lg">m8@em8.pl</span></div>`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
        class: "p-button-text p-button-plain p-button-rounded mr-1",
        icon: "pi pi-times"
      }, null, _parent));
      _push(`</li><li class="flex flex-row align-items-center justify-content-between mb-2"><div class="flex flex-row align-items-center"><i class="pi pi-envelope mr-2"></i><span class="block text-900 font-medium text-lg">michal@laszczewski.pl</span></div>`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
        class: "p-button-text p-button-plain p-button-rounded mr-1",
        icon: "pi pi-times"
      }, null, _parent));
      _push(`</li><li class="flex flex-row align-items-center justify-content-between mb-2"><div class="flex flex-row align-items-center"><i class="pi pi-phone mr-2"></i><span class="block text-900 font-medium text-lg">+27 123 456 789</span></div>`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
        class: "p-button-text p-button-plain p-button-rounded mr-1",
        icon: "pi pi-times"
      }, null, _parent));
      _push(`</li><li class="flex flex-row align-items-center justify-content-between mb-2"><div class="flex flex-row align-items-center"><i class="pi pi-google mr-2"></i><span class="block text-900 font-medium text-lg">michal8.m8@gmail.com</span></div>`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
        class: "p-button-text p-button-plain p-button-rounded mr-1",
        icon: "pi pi-trash"
      }, null, _parent));
      _push(`</li></ul><div class="flex flex-row">`);
      _push(serverRenderer.ssrRenderComponent(_component_router_link, {
        to: { name: "user:connectAccount" },
        class: "mr-2 no-underline"
      }, {
        default: vue.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
              label: "Connect Account",
              icon: "pi pi-user-plus",
              class: "p-button-lg"
            }, null, _parent2, _scopeId));
          } else {
            return [
              vue.createVNode(vue.unref(script$5), {
                label: "Connect Account",
                icon: "pi pi-user-plus",
                class: "p-button-lg"
              })
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/ConnectedAccounts.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
var ConnectedAccounts = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _sfc_main$5
});
const _sfc_main$4 = {
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({ class: "w-full lg:w-6 md:w-9" }, _attrs))}><div class="surface-card p-4 shadow-2 border-round"><div class="text-center mb-5"><div class="text-900 text-3xl font-medium mb-3">Connect account</div></div><div><div class="p-field mb-3"><label for="email" class="block text-900 font-medium mb-2"> Email address </label>`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$4), {
        id: "email",
        type: "text",
        class: "w-full p-invalid",
        "aria-describedby": "email-help"
      }, null, _parent));
      _push(`<small id="email-help" class="p-error">email not found.</small></div>`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
        label: "Connect",
        icon: "pi pi-user",
        class: "w-full"
      }, null, _parent));
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$2), {
        align: "center",
        class: "my-4"
      }, {
        default: vue.withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<span class="text-600 font-normal text-sm"${_scopeId}>OR</span>`);
          } else {
            return [
              vue.createVNode("span", { class: "text-600 font-normal text-sm" }, "OR")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
        label: "Connect GitHub account",
        icon: "pi pi-github",
        class: "w-full p-button-secondary mb-2"
      }, null, _parent));
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
        label: "Connect Google account",
        icon: "pi pi-google",
        class: "w-full p-button-secondary mb-1"
      }, null, _parent));
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/ConnectAccount.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
var ConnectAccount = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _sfc_main$4
});
const _sfc_main$3 = {};
function _sfc_ssrRender$1(_ctx, _push, _parent, _attrs) {
  _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({ class: "w-full lg:w-6 md:w-9" }, _attrs))}><div class="surface-card border-round shadow-2 p-4"><div class="text-900 font-medium mb-4 text-xl">Account connected</div><div class="mt-0 p-0 line-height-3">Congratulations! You have successfully connected accounts.</div></div></div>`);
}
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/ConnectAccountFinished.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
var ConnectAccountFinished = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["ssrRender", _sfc_ssrRender$1]]);
var ConnectAccountFinished$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": ConnectAccountFinished
});
const _sfc_main$2 = {
  __ssrInlineRender: true,
  setup(__props) {
    const wantDelete = vue.ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({ class: "w-full lg:w-6 md:w-9" }, _attrs))}><div class="surface-card p-4 shadow-2 border-round"><div class="text-center mb-5"><div class="text-900 text-3xl font-medium mb-3">Delete account</div></div><div><p> Account deletion is irreversible, check the box below only if you are 100% sure that you want to delete your account. </p><div class="p-field-checkbox mb-3">`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$3), {
        id: "delete",
        modelValue: wantDelete.value,
        "onUpdate:modelValue": ($event) => wantDelete.value = $event,
        binary: true
      }, null, _parent));
      _push(`<label for="delete">\xA0 I want to delete my account.</label></div>`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
        label: "Delete account",
        icon: "pi pi-user-plus",
        class: "p-button-lg",
        disabled: !wantDelete.value
      }, null, _parent));
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/DeleteAccount.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
var DeleteAccount = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _sfc_main$2
});
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
  return vue.openBlock(), vue.createBlock("textarea", vue.mergeProps({
    class: ["p-inputtextarea p-inputtext p-component", { "p-filled": $options.filled, "p-inputtextarea-resizable ": $props.autoResize }]
  }, _ctx.$attrs, {
    value: $props.modelValue,
    onInput: _cache[1] || (_cache[1] = (...args) => $options.onInput && $options.onInput(...args))
  }), null, 16, ["value"]);
}
function styleInject(css, ref2) {
  if (ref2 === void 0)
    ref2 = {};
  var insertAt = ref2.insertAt;
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
const _sfc_main$1 = {
  __ssrInlineRender: true,
  setup(__props) {
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({ class: "w-full lg:w-6 md:w-9" }, _attrs))}><div class="surface-card p-4 shadow-2 border-round"><div class="text-center mb-5"><div class="text-900 text-3xl font-medium mb-3">Account deleted</div></div><div class="mb-3"> Account has been deleted, please leave feedback why you are leaving us. </div>`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script), {
        class: "w-full",
        autoResize: true,
        rows: "4",
        cols: "30"
      }, null, _parent));
      _push(`<div class="flex flex-row align-items-end">`);
      _push(serverRenderer.ssrRenderComponent(vue.unref(script$5), {
        label: "Send",
        icon: "pi pi-send",
        class: "ml-auto p-button-lg"
      }, null, _parent));
      _push(`</div></div></div>`);
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/DeleteFinished.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
var DeleteAccountFinished = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": _sfc_main$1
});
const _sfc_main = {};
function _sfc_ssrRender(_ctx, _push, _parent, _attrs) {
  _push(`<div${serverRenderer.ssrRenderAttrs(vue.mergeProps({ class: "w-full lg:w-6 md:w-9" }, _attrs))}><div class="surface-card border-round shadow-2 p-4"><div class="text-900 font-medium mb-3 text-xl mb-4">Feedback sent</div><p class="mt-0 p-0 line-height-3">Thank you for your feedback.</p></div></div>`);
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = vue.useSSRContext();
  (ssrContext.modules || (ssrContext.modules = new Set())).add("src/DeleteAccountFeedbackSent.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
var DeleteAccountFeedbackSent = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", _sfc_ssrRender]]);
var DeleteAccountFeedbackSent$1 = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  [Symbol.toStringTag]: "Module",
  "default": DeleteAccountFeedbackSent
});
exports.render = render$7;
