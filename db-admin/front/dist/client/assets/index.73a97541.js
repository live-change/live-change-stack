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
import { o as openBlock, c as createElementBlock, r as renderSlot, a as createCommentVNode, F as Fragment, b as createBaseVNode, d as createDebug, e as reactive, f as onErrorCaptured, g as createBlock, w as withCtx, n as normalizeProps, h as guardReactiveProps, S as Suspense, m as mergeProps, i as renderList, t as toDisplayString, j as createTextVNode, k as resolveDynamicComponent, l as normalizeClass, p as normalizeStyle, q as resolveComponent, s as computed, u as watch, v as browser, x as resolveDirective, y as withDirectives, z as createVNode, A as unref, B as script, C as ref, D as useMeta, E as onMounted, G as createRouter$1, H as createWebHistory, I as createSSRApp, P as PrimeVue, J as ConfirmationService, K as PrimeVueConfirmSymbol, T as ToastService, L as PrimeVueToastSymbol, M as StyleClass, R as Ripple, N as BadgeDirective, O as createMetaManager, Q as sockjs_min, U as createSharedElementDirective, V as SharedElementRouteGuard } from "./vendor.e995dee7.js";
const p = function polyfill() {
  const relList = document.createElement("link").relList;
  if (relList && relList.supports && relList.supports("modulepreload")) {
    return;
  }
  for (const link of document.querySelectorAll('link[rel="modulepreload"]')) {
    processPreload(link);
  }
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type !== "childList") {
        continue;
      }
      for (const node of mutation.addedNodes) {
        if (node.tagName === "LINK" && node.rel === "modulepreload")
          processPreload(node);
      }
    }
  }).observe(document, { childList: true, subtree: true });
  function getFetchOpts(script2) {
    const fetchOpts = {};
    if (script2.integrity)
      fetchOpts.integrity = script2.integrity;
    if (script2.referrerpolicy)
      fetchOpts.referrerPolicy = script2.referrerpolicy;
    if (script2.crossorigin === "use-credentials")
      fetchOpts.credentials = "include";
    else if (script2.crossorigin === "anonymous")
      fetchOpts.credentials = "omit";
    else
      fetchOpts.credentials = "same-origin";
    return fetchOpts;
  }
  function processPreload(link) {
    if (link.ep)
      return;
    link.ep = true;
    const fetchOpts = getFetchOpts(link);
    fetch(link.href, fetchOpts);
  }
};
p();
var _export_sfc = (sfc, props) => {
  for (const [key, val] of props) {
    sfc[key] = val;
  }
  return sfc;
};
const _sfc_main$b = {
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
const _hoisted_1$9 = /* @__PURE__ */ createBaseVNode("div", {
  class: "alert alert-danger",
  role: "alert"
}, "error", -1);
function _sfc_render$8(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock(Fragment, null, [
    $data.state == "ready" ? renderSlot(_ctx.$slots, "default", {
      key: 0,
      value: $props.what
    }) : createCommentVNode("", true),
    $data.state == "error" ? renderSlot(_ctx.$slots, "error", { key: 1 }, () => [
      _hoisted_1$9
    ]) : createCommentVNode("", true),
    $data.state == "loading" ? renderSlot(_ctx.$slots, "loading", { key: 2 }) : createCommentVNode("", true)
  ], 64);
}
var Loading = /* @__PURE__ */ _export_sfc(_sfc_main$b, [["render", _sfc_render$8]]);
const info$1 = createDebug("loading:info");
const debug$b = createDebug("loading:debug");
const _sfc_main$a = {
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
    const errors = reactive([]);
    onErrorCaptured((e) => {
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
      debug$b(`task started ${task.name}`);
      this.loading.push(task);
      if (this.$allLoadingTasks)
        this.$allLoadingTasks.push(task);
      return task;
    },
    loadingFinished(task) {
      let id = this.loading.indexOf(task);
      debug$b(`task finished ${task.name}`);
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
      debug$b(`task failed ${task.name} because ${reason}`);
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
    addLoadingPromise(name, promise2) {
      let task = this.loadingStarted({ name, promise: promise2 });
      promise2.catch((reason) => {
        console.error("LOADING OF", name, "FAILED", reason);
        this.loadingFailed(task, reason);
      });
      promise2.then((result) => this.loadingFinished(task));
      return promise2;
    }
  },
  provide() {
    return {
      loadingZone: {
        started: (task) => this.loadingStarted(task),
        finished: (task) => this.loadingFinished(task),
        failed: (task, reason) => this.loadingFailed(task, reason),
        addPromise: (name, promise2) => this.addLoadingPromise(name, promise2)
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
const _hoisted_1$8 = /* @__PURE__ */ createTextVNode(" Loading... ");
const _hoisted_2$6 = /* @__PURE__ */ createTextVNode(" Loading... ");
const _hoisted_3$2 = /* @__PURE__ */ createBaseVNode("h1", null, "Loading errors!", -1);
const _hoisted_4$2 = /* @__PURE__ */ createTextVNode(" Loading of ");
const _hoisted_5$1 = /* @__PURE__ */ createTextVNode(" failed because of error ");
function _sfc_render$7(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock(Fragment, null, [
    $props.suspense ? (openBlock(), createBlock(Suspense, { key: 0 }, {
      default: withCtx(() => [
        createBaseVNode("div", null, [
          renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps({ isLoading: !!$data.loading.length, loading: $data.loading, errors: $setup.errors }))),
          $data.loading.length && !$setup.errors.length ? renderSlot(_ctx.$slots, "loading", { key: 0 }, () => [
            _hoisted_1$8
          ]) : createCommentVNode("", true)
        ])
      ]),
      fallback: withCtx(() => [
        createBaseVNode("div", null, [
          renderSlot(_ctx.$slots, "loading", {}, () => [
            _hoisted_2$6
          ])
        ])
      ]),
      _: 3
    })) : renderSlot(_ctx.$slots, "default", normalizeProps(mergeProps({ key: 1 }, { isLoading: !!$data.loading.length, loading: $data.loading, errors: $setup.errors }))),
    $setup.errors.length ? renderSlot(_ctx.$slots, "error", normalizeProps(mergeProps({ key: 2 }, { errors: $setup.errors })), () => [
      _hoisted_3$2,
      createBaseVNode("ol", null, [
        (openBlock(true), createElementBlock(Fragment, null, renderList($setup.errors, (error) => {
          return openBlock(), createElementBlock("li", {
            key: error.task.name + ":" + error.reason,
            class: "error"
          }, [
            _hoisted_4$2,
            createBaseVNode("b", null, toDisplayString(error.task.name), 1),
            _hoisted_5$1,
            createBaseVNode("b", null, toDisplayString(error.reason), 1)
          ]);
        }), 128))
      ])
    ]) : createCommentVNode("", true)
  ], 64);
}
var LoadingZone = /* @__PURE__ */ _export_sfc(_sfc_main$a, [["render", _sfc_render$7]]);
const info = createDebug("working:info");
const debug$a = createDebug("working:debug");
const _sfc_main$9 = {
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
      debug$a(`task started ${task.name}`);
      this.working.push(task);
      if (this.$allWorkingTasks)
        this.$allWorkingTasks.push(task);
      return task;
    },
    workingFinished(task) {
      let id = this.working.indexOf(task);
      debug$a(`task finished ${task.name}`);
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
      debug$a(`task failed ${task.name} because ${reason}`);
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
    addWorkingPromise(name, promise2) {
      let task = this.workingStarted({ name, promise: promise2 });
      promise2.catch((reason) => {
        console.error("WORKING OF", name, "FAILED", reason);
        this.workingFailed(task, reason);
      });
      promise2.then((result) => this.workingFinished(task));
      return promise2;
    }
  },
  provide() {
    return {
      workingZone: {
        started: (task) => this.workingStarted(task),
        finished: (task) => this.workingFinished(task),
        failed: (task, reason) => this.workingFailed(task, reason),
        addPromise: (name, promise2) => this.addWorkingPromise(name, promise2)
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
const _hoisted_1$7 = /* @__PURE__ */ createTextVNode(" Processing... ");
const _hoisted_2$5 = /* @__PURE__ */ createBaseVNode("h1", null, "Processing errors!", -1);
const _hoisted_3$1 = /* @__PURE__ */ createTextVNode(" Processing of ");
const _hoisted_4$1 = /* @__PURE__ */ createTextVNode(" failed because of error ");
function _sfc_render$6(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock(Fragment, null, [
    renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps({ isWorking: !!$data.working.length, working: $data.working, errors: $data.errors }))),
    $data.working.length && !$data.errors.length ? renderSlot(_ctx.$slots, "working", { key: 0 }, () => [
      _hoisted_1$7
    ]) : createCommentVNode("", true),
    $data.errors.length ? renderSlot(_ctx.$slots, "error", normalizeProps(mergeProps({ key: 1 }, { errors: $data.errors })), () => [
      _hoisted_2$5,
      createBaseVNode("ol", null, [
        (openBlock(true), createElementBlock(Fragment, null, renderList($data.errors, (error) => {
          return openBlock(), createElementBlock("li", {
            key: error.task.name + ":" + error.reason,
            class: "error"
          }, [
            _hoisted_3$1,
            createBaseVNode("b", null, toDisplayString(error.task.name), 1),
            _hoisted_4$1,
            createBaseVNode("b", null, toDisplayString(error.reason), 1)
          ]);
        }), 128))
      ])
    ]) : createCommentVNode("", true)
  ], 64);
}
var WorkingZone = /* @__PURE__ */ _export_sfc(_sfc_main$9, [["render", _sfc_render$6]]);
const _sfc_main$8 = {
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
const _hoisted_1$6 = /* @__PURE__ */ createBaseVNode("div", {
  class: "alert alert-danger",
  role: "alert"
}, "error", -1);
const _hoisted_2$4 = /* @__PURE__ */ createBaseVNode("div", {
  class: "alert alert-danger",
  role: "alert"
}, "error", -1);
function _sfc_render$5(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock(Fragment, null, [
    $props.tag ? (openBlock(), createBlock(resolveDynamicComponent($props.tag), {
      key: 0,
      onSubmit: _cache[0] || (_cache[0] = (ev) => _ctx.$emit("submit", ev))
    }, {
      default: withCtx(() => [
        $options.state == "ready" ? renderSlot(_ctx.$slots, "default", normalizeProps(mergeProps({ key: 0 }, { value: _ctx.value }))) : createCommentVNode("", true),
        $options.state == "error" ? renderSlot(_ctx.$slots, "error", { key: 1 }, () => [
          _hoisted_1$6
        ]) : createCommentVNode("", true),
        $options.state == "loading" ? renderSlot(_ctx.$slots, "loading", { key: 2 }) : createCommentVNode("", true)
      ]),
      _: 3
    })) : createCommentVNode("", true),
    !$props.tag && $options.state == "ready" ? renderSlot(_ctx.$slots, "default", normalizeProps(mergeProps({ key: 1 }, { value: _ctx.value }))) : createCommentVNode("", true),
    !$props.tag && $options.state == "error" ? renderSlot(_ctx.$slots, "error", { key: 2 }, () => [
      _hoisted_2$4
    ]) : createCommentVNode("", true),
    !$props.tag && $options.state == "loading" ? renderSlot(_ctx.$slots, "loading", { key: 3 }) : createCommentVNode("", true)
  ], 64);
}
var Observe = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["render", _sfc_render$5]]);
function registerLogicComponents(app2) {
  app2.component("loading", Loading);
  app2.component("loading-zone", LoadingZone);
  app2.component("working-zone", WorkingZone);
  app2.component("observe", Observe);
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
const _sfc_main$7 = {
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
      for (let p2 of np) {
        if (node.properties)
          node = node.properties[p2];
        else if (node.elements)
          node = node.elements[p2];
        if (!node)
          throw new Error(`form field ${name} not found`);
      }
      return node;
    },
    getNodeIfExists(name) {
      let np = name.split(".");
      let node = this.formRoot;
      for (let p2 of np) {
        if (node.properties)
          node = node.properties[p2];
        else if (node.elements)
          node = node.elements[p2];
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
      let validators2 = this.getNode(name).validators;
      let id = validators2.indexOf(validator);
      if (id == -1)
        throw new Error("validator not found");
      validators2.splice(id);
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
function _sfc_render$4(_ctx, _cache, $props, $setup, $data, $options) {
  return $props.tag ? (openBlock(), createBlock(resolveDynamicComponent($props.tag), {
    key: 0,
    onSubmit: _cache[0] || (_cache[0] = (ev) => _ctx.$emit("submit", ev)),
    class: normalizeClass($props.class),
    style: normalizeStyle($props.style)
  }, {
    default: withCtx(() => [
      renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps({ data: $data.data })))
    ]),
    _: 3
  }, 8, ["class", "style"])) : renderSlot(_ctx.$slots, "default", normalizeProps(mergeProps({ key: 1 }, { data: $data.data })));
}
var DefinedForm = /* @__PURE__ */ _export_sfc(_sfc_main$7, [["render", _sfc_render$4]]);
const debug$9 = createDebug("live-change/command-form");
const _sfc_main$6 = {
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
      let validators2 = this.getNode(name).validators;
      let id = validators2.indexOf(validator);
      if (id == -1)
        throw new Error("validator not found");
      validators2.splice(id);
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
        debug$9("VALIDATION ERROR?", validationError);
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
        debug$9("SUBMIT DATA:\n" + JSON.stringify(parameters, null, "  "));
        this.$emit("submit", { parameters });
        return this.$api.request([this.service, this.action], parameters).then((result) => {
          debug$9("DATA SUBMITED");
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
const _hoisted_1$5 = /* @__PURE__ */ createBaseVNode("div", {
  class: "alert alert-danger",
  role: "alert"
}, "error", -1);
const _hoisted_2$3 = /* @__PURE__ */ createBaseVNode("div", {
  class: "alert alert-success",
  role: "alert"
}, "success", -1);
function _sfc_render$3(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_defined_form = resolveComponent("defined-form");
  return openBlock(), createElementBlock(Fragment, null, [
    $options.actionDefinition && ($data.state == "ready" || $data.state == "working") ? (openBlock(), createBlock(_component_defined_form, {
      key: 0,
      tag: $props.formTag,
      onSubmit: $options.handleSubmitEvent,
      ref: "defined",
      provided: { service: $props.service, action: $props.action, submit: $options.submit, getAction: () => $options.actionDefinition },
      parameters: $props.parameters,
      definition: $options.actionDefinition,
      "initial-values": $props.initialValues,
      class: normalizeClass($props.class),
      style: normalizeStyle($props.style)
    }, {
      default: withCtx(({ data }) => [
        renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps({ data, submit: $options.submit })))
      ]),
      _: 3
    }, 8, ["tag", "onSubmit", "provided", "parameters", "definition", "initial-values", "class", "style"])) : createCommentVNode("", true),
    $data.state == "error" ? renderSlot(_ctx.$slots, "error", { key: 1 }, () => [
      _hoisted_1$5
    ]) : createCommentVNode("", true),
    $data.state == "done" ? renderSlot(_ctx.$slots, "done", { key: 2 }, () => [
      _hoisted_2$3
    ]) : createCommentVNode("", true)
  ], 64);
}
var CommandForm = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["render", _sfc_render$3]]);
const _sfc_main$5 = {
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
function _sfc_render$2(_ctx, _cache, $props, $setup, $data, $options) {
  return renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps({ value: $options.value, error: $options.error, setValue: $options.setValue, setError: $options.setError })));
}
var FormBind = /* @__PURE__ */ _export_sfc(_sfc_main$5, [["render", _sfc_render$2]]);
function registerFormComponents(app2) {
  app2.component("defined-form", DefinedForm);
  app2.component("command-form", CommandForm);
  app2.component("form-bind", FormBind);
}
const _sfc_main$4 = {
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
const _hoisted_1$4 = {
  class: "visible-area",
  ref: "area"
};
function _sfc_render$1(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createElementBlock("div", _hoisted_1$4, [
    renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps($data.visibleArea)))
  ], 512);
}
var VisibleArea = /* @__PURE__ */ _export_sfc(_sfc_main$4, [["render", _sfc_render$1]]);
function createReactiveObject(...definitions) {
  let data = {};
  for (const definition of definitions) {
    if (typeof definition.data == "function")
      data = __spreadValues(__spreadValues({}, data), definition.data.apply({ $options: definition }));
    if (typeof definition.data == "object" && definition.data)
      data = __spreadValues(__spreadValues({}, data), definition.data);
  }
  const object = reactive(data);
  object.$options = definitions[0];
  for (const definition of definitions) {
    for (const key in definition.computed)
      object[key] = computed(definition.computed[key].bind(object));
  }
  for (const definition of definitions) {
    for (const key in definition.watch)
      watch(() => object[key], (n, o) => definition.watch[key].apply(object));
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
const _sfc_main$3 = {
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
      const bucket = reactive({
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
const _hoisted_1$3 = ["id"];
function _sfc_render(_ctx, _cache, $props, $setup, $data, $options) {
  const _component_visible_area = resolveComponent("visible-area");
  return openBlock(), createBlock(_component_visible_area, {
    onUpdate: $options.setVisibleArea,
    ref: "area"
  }, {
    default: withCtx(() => [
      createBaseVNode("div", {
        class: "scroll-top-fill",
        style: normalizeStyle({ height: $data.topFill + "px" })
      }, null, 4),
      $options.isLoadingTop ? renderSlot(_ctx.$slots, "loadingTop", mergeProps({ key: 0 }, { connectionProblem: $options.isLoadingTopTooLong }, { ref: "topLoading" })) : createCommentVNode("", true),
      (openBlock(true), createElementBlock(Fragment, null, renderList($options.visibleState.rows, (row, index) => {
        return openBlock(), createElementBlock("div", {
          class: "scroll-data",
          ref: "row_" + index,
          id: $options.rowId(row),
          key: $props.rowKey(row)
        }, [
          renderSlot(_ctx.$slots, "default", normalizeProps(guardReactiveProps({ row, index, rows: $options.visibleState.rows })))
        ], 8, _hoisted_1$3);
      }), 128)),
      $options.isLoadingBottom ? renderSlot(_ctx.$slots, "loadingBottom", mergeProps({ key: 1 }, { connectionProblem: $options.isLoadingBottomTooLong }, { ref: "bottomLoading" })) : createCommentVNode("", true),
      createBaseVNode("div", {
        class: "scroll-bottom-fill",
        style: normalizeStyle({ height: $data.bottomFill + "px" })
      }, null, 4)
    ]),
    _: 3
  }, 8, ["onUpdate"]);
}
var ScrollLoader = /* @__PURE__ */ _export_sfc(_sfc_main$3, [["render", _sfc_render]]);
function registerViewComponents(app2) {
  app2.component("scroll-loader", ScrollLoader);
  app2.component("visible-area", VisibleArea);
}
function registerComponents(app2, settings = {}) {
  registerLogicComponents(app2);
  registerFormComponents(app2);
  registerViewComponents(app2);
}
const prefix$1 = "$lcDaoPath_";
const reactiveMixin = (dao2) => ({
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
        let p2 = this[prefix$1 + key];
        if (p2) {
          reactiveObservables[key] = dao2.observable(p2);
          reactiveObservables[key].bindProperty(this, key);
          reactiveObservables[key].bindErrorProperty(this, key + "Error");
        }
        let oldPathJson;
        watch(() => this[prefix$1 + key], (newPath) => {
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
            reactiveObservables[key] = dao2.observable(newPath);
            reactiveObservables[key].bindProperty(this, key);
            reactiveObservables[key].bindErrorProperty(this, key + "Error");
          } else {
            this[key] = void 0;
          }
        });
      } else if (typeof path == "string") {
        reactiveObservables[key] = dao2.observable(path);
        reactiveObservables[key].bindProperty(this, key);
        reactiveObservables[key].bindErrorProperty(this, key + "Error");
      } else if (path.length !== void 0) {
        reactiveObservables[key] = dao2.observable(path);
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
const reactivePrefetchMixin = (dao2) => ({
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
      this.reactivePreFetchObservable = dao2.observable({ paths });
      this.reactivePreFetchObservable.bindProperty(this, "reactivePreFetchedPaths");
      this.reactivePreFetchObservable.bindErrorProperty(this, "reactivePreFetchError");
    }
    watch(() => this[prefix + "_reactivePreFetch"], (paths2) => {
      if (this.reactivePreFetchObservable) {
        this.reactivePreFetchObservable.unbindProperty(this, "reactivePreFetchedPaths");
        this.reactivePreFetchObservable.unbindErrorProperty(this, "reactivePreFetchError");
      }
      delete this.reactivePreFetchObservable;
      if (paths2) {
        this.reactivePreFetchObservable = dao2.observable({ paths: paths2 });
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
var Dao$2 = { exports: {} };
class EventEmitter$5 {
  constructor() {
    this.events = {};
  }
  listeners(event) {
    let listeners = this.events[event];
    if (listeners)
      return listeners;
    listeners = [];
    this.events[event] = listeners;
    return listeners;
  }
  on(event, listener) {
    this.listeners(event).push(listener);
  }
  removeListener(event, listener) {
    let listeners = this.events[event];
    if (!listeners)
      return;
    const id = listeners.indexOf(listener);
    if (id == -1)
      return;
    listeners.splice(id, 1);
    if (listeners.length == 0)
      delete this.events[event];
  }
  emit(event, ...args) {
    let listeners = this.events[event];
    if (!listeners)
      return;
    listeners = listeners.slice();
    for (let listener of listeners)
      listener(...args);
  }
  once(event, listener) {
    let g = () => {
      this.removeListener(event, g);
      listener.apply(this, arguments);
    };
    this.on(event, g);
  }
}
var EventEmitter_1 = EventEmitter$5;
class RemoteDataSource$1 {
  constructor(connection, definition) {
    this.definition = definition;
    this.connection = connection;
    this.generator = definition.generator;
    this.redirect = definition.redirect || ((x) => x);
  }
  observable(what) {
    return this.connection.observable(this.redirect(what), this.generator);
  }
  get(what) {
    return this.connection.get(this.redirect(what));
  }
  request(method, ...args) {
    return this.connection.request(this.redirect(method), ...args);
  }
  requestWithSettings(settings, method, ...args) {
    return this.connection.requestWithSettings(settings, this.redirect(method), ...args);
  }
  event(method, ...args) {
    return this.connection.event(this.redirect(method), ...args);
  }
}
var RemoteDataSource_1 = RemoteDataSource$1;
var utils$2 = {};
function errorToJSON(error) {
  if (typeof error == "object") {
    let obj = {};
    Object.getOwnPropertyNames(error).forEach(function(key) {
      obj[key] = error[key];
    });
    return obj;
  }
  return error;
}
utils$2.errorToJSON = errorToJSON;
function nextTickMicrotask(handler, ...args) {
  queueMicrotask(() => handler(...args));
}
function nextTickPromise(handler, ...args) {
  Promise.resolve().then(() => handler(...args)).catch((err) => setTimeout(() => {
    throw err;
  }, 0));
}
const supportMicrotask = typeof queueMicrotask !== "undefined";
const supportNextTick = typeof process !== "undefined" && process.nextTick;
utils$2.nextTick = supportNextTick ? process.nextTick : supportMicrotask ? nextTickMicrotask : nextTickPromise;
const EventEmitter$4 = EventEmitter_1;
const debug$8 = browser.exports("dao");
const utils$1 = utils$2;
let lastUid = 0;
class Observation$1 {
  constructor(connection, what, pushed) {
    this.what = what;
    this.uid = ++lastUid;
    this.connection = connection;
    this.pushed = pushed;
    this.observables = [];
    this.receivedSignals = [];
    this.disposed = false;
  }
  addObservable(observable) {
    if (this.disposed)
      throw new Error("observation use after disposal");
    this.observables.push(observable);
    observable.observation = this;
    if (this.observables.length == 1 && this.connection.connected) {
      this.connection.sendObserve(this);
    }
    for (let { signal, args } of this.receivedSignals) {
      if (typeof observable == "function")
        observable(signal, ...args);
      else if (observable.notify)
        observable.notify(signal, ...args);
      else
        observable[signal](...args);
    }
  }
  observable(clazz) {
    if (this.disposed)
      throw new Error("observation use after disposal");
    let observable = this.observables.find((o) => o.clazz == clazz);
    if (observable)
      return observable;
    const what = this.what;
    const connection = this.connection;
    const dispose2 = () => {
      observable.observation.removeObservable(observable);
      oldDispose.call(observable);
    };
    const respawn = () => {
      observable.observation = connection.observation(what);
      observable.observation.addObservable(observable);
      oldRespawn.call(observable);
    };
    observable = new clazz(void 0, what, dispose2);
    observable.clazz = clazz;
    const oldDispose = observable.dispose;
    const oldRespawn = observable.respawn;
    observable.dispose = dispose2;
    observable.respawn = respawn;
    observable.observation = this;
    this.addObservable(observable);
    return observable;
  }
  removeObservable(observable) {
    if (this.disposed)
      throw new Error(`observation ${JSON.stringify(this.what)} use after disposal`);
    let id = this.observables.indexOf(observable);
    if (id == -1)
      throw new Error("could not remove not existing observable");
    this.observables.splice(id, 1);
    if (this.connection.connected && this.observables.length == 0) {
      this.connection.sendUnobserve(this);
    }
    if (this.observables.length == 0 && !this.pushed) {
      const whatId = JSON.stringify(this.what);
      this.connection.observations.delete(whatId);
      this.disposed = true;
    }
  }
  handleDisconnect() {
    if (this.disposed)
      throw new Error(`observation ${JSON.stringify(this.what)} use after disposal`);
    this.pushed = false;
    if (this.observables.length == 0) {
      const whatId = JSON.stringify(this.what);
      this.connection.observations.delete(whatId);
      this.disposed = true;
    }
  }
  handleConnect() {
    if (this.disposed)
      throw new Error(`observation ${JSON.stringify(this.what)} use after disposal`);
    this.receivedSignals = [];
    if (this.connection.settings.logLevel > 0)
      debug$8("refresh", this.what);
    if (this.observables.length > 0) {
      this.connection.sendObserve(this);
    }
  }
  handleNotifyMessage({ signal, args }) {
    if (this.disposed)
      return;
    this.receivedSignals.push({ signal, args });
    for (let observable of this.observables) {
      utils$1.nextTick(function() {
        if (typeof observable == "function")
          observable(signal, ...args);
        else if (observable.notify)
          observable.notify(signal, ...args);
        else
          observable[signal](...args);
      });
    }
  }
}
class Connection$2 extends EventEmitter$4 {
  constructor(credentials, settings) {
    super();
    this.settings = settings || {};
    if (!this.settings.fastAuth && !credentials)
      throw new Error("credentials not defined!");
    this.credentials = credentials;
    this.connectedCounter = 0;
    this.connected = false;
    this.lastRequestId = 0;
    this.requestsQueue = [];
    this.waitingRequests = new Map();
    this.observations = new Map();
    this.messageHandlers = {};
    this.remoteObserveSent = new Map();
    this.remoteUnobserveSent = new Map();
    this.activeTimeouts = new Set();
    this.autoReconnect = true;
    this.finished = false;
    this.connectionMonitor = this.settings.connectionMonitorFactory ? this.settings.connectionMonitorFactory(this) : null;
    if (this.settings.timeSynchronization)
      this.settings.timeSynchronization.setConnection(this);
    this.on("disconnect", () => this.settings.onDisconnect && this.settings.onDisconnect());
    this.on("connect", () => this.settings.onConnect && this.settings.onConnect());
  }
  sendRequest(msg, settings) {
    settings = __spreadValues(__spreadValues({}, this.settings), settings);
    return new Promise((resolve2, reject2) => {
      msg.requestId = ++this.lastRequestId;
      let handler = (err, resp) => {
        if (err) {
          this.waitingRequests.delete(msg.requestId);
          return reject2(err);
        }
        if (resp.type == "error") {
          reject2(resp.error);
          return false;
        }
        resolve2(resp.response);
        return false;
      };
      const request = { msg, handler, settings };
      if (!this.connected) {
        if (settings.disconnectDebug)
          console.error("SEND REQUEST", msg, "WHEN NOT CONNECTED WITH SETTINGS", request.settings);
        if (settings.queueRequestsWhenDisconnected) {
          let queuedConnectionId = this.connectedCounter;
          let queueId = this.requestsQueue.length;
          this.requestsQueue.push(request);
          if (settings.requestSendTimeout && settings.requestSendTimeout < Infinity) {
            setTimeout(() => {
              if (queuedConnectionId == this.connectedCounter) {
                this.requestsQueue[queueId] = null;
                reject2("disconnected");
              }
            }, settings.requestSendTimeout || 2300);
          }
        } else {
          return reject2("disconnected");
        }
      }
      if (settings.requestTimeout && settings.requestTimeout < Infinity) {
        const timeout = setTimeout(() => {
          this.activeTimeouts.delete(timeout);
          let waiting = this.waitingRequests.get(msg.requestId);
          if (waiting) {
            waiting.handler("timeout");
            this.waitingRequests.delete(msg.requestId);
          }
          for (let i = 0; i < this.requestsQueue.length; i++) {
            let req = this.requestsQueue[i];
            if (!req)
              continue;
            if (req.msg.requestId == msg.requestId) {
              const req2 = this.requestsQueue[i];
              this.requestsQueue[i] = null;
              req2.handler("timeout");
            }
          }
        }, settings.requestTimeout);
        this.activeTimeouts.add(timeout);
      }
      if (this.connected) {
        this.waitingRequests.set(msg.requestId, request);
        this.send(msg);
      }
    });
  }
  request(method, ...args) {
    const msg = {
      type: "request",
      method,
      args
    };
    return this.sendRequest(msg);
  }
  requestWithSettings(settings, method, ...args) {
    const msg = {
      type: "request",
      method,
      args
    };
    return this.sendRequest(msg, settings);
  }
  get(what) {
    const msg = {
      type: "get",
      what
    };
    return this.sendRequest(msg);
  }
  getMore(what, more) {
    const msg = {
      type: "getMore",
      what,
      more
    };
    return this.sendRequest(msg);
  }
  getAll(paths) {
    const msg = {
      type: "getMore",
      paths
    };
    return this.sendRequest(msg);
  }
  event(method, ...args) {
    this.send({
      type: "event",
      method,
      args
    });
  }
  handleMessage(message) {
    if (message.type == "pong") {
      this.emit("pong", message);
    }
    if (message.type == "ping") {
      this.emit("ping", message);
      message.type = "pong";
      this.send(message);
    }
    if (message.type == "timeSync") {
      this.emit("timeSync", message);
    }
    if (message.type == "authenticationError") {
      this.finished = true;
      this.closeConnection();
      this.emit("authenticationError", message.error);
    }
    if (message.responseId) {
      const request = this.waitingRequests.get(message.responseId);
      if (!request)
        return;
      this.waitingRequests.delete(message.responseId);
      request.handler(null, message);
      return;
    }
    if (message.type == "notify") {
      const whatId = JSON.stringify(message.what);
      const observation = this.observations.get(whatId);
      if (observation)
        observation.handleNotifyMessage(message);
    }
    if (message.type == "push") {
      const whatId = JSON.stringify(message.what);
      const observation = this.observations.get(whatId);
      if (observation) {
        observation.pushed = true;
      } else {
        const observation2 = new Observation$1(this, message.what, true);
        this.observations.set(whatId, observation2);
      }
    }
    if (message.type == "unpush") {
      const whatId = JSON.stringify(message.what);
      const observation = this.observations.get(whatId);
      if (!observation || !observation.pushed)
        throw Error("observation that is not pushed can not be unpushed");
      observation.pushed = false;
      if (observation.observables.length == 0) {
        this.observations.delete(whatId);
        this.observations.disposed = true;
      }
    }
    const handler = this.messageHandlers[message.type];
    if (handler)
      handler(message);
  }
  handleDisconnect() {
    if (this.settings.logLevel > 0)
      debug$8("disconnected");
    this.connected = false;
    const queuedConnectionId = this.connectedCounter;
    this.emit("disconnect");
    for (const req of this.waitingRequests.values()) {
      if (req.settings.disconnectDebug)
        console.error("SENT REQUEST", req.msg, "BEFORE DISCONNECTED WITH SETTINGS", req.settings);
      if (req.settings.queueActiveRequestsOnDisconnect) {
        const queuedId = this.requestsQueue.length;
        this.requestsQueue.push(req);
        if (req.settings.requestSendTimeout < Infinity) {
          setTimeout(() => {
            if (queuedConnectionId == this.connectedCounter && this.requestsQueue[queuedId]) {
              req.handler("disconnected");
              this.requestsQueue[queuedId] = null;
            }
          }, req.settings.requestSendTimeout || 2300);
        }
      } else {
        req.handler("disconnected");
      }
    }
    for (let observation of this.observations.values()) {
      observation.handleDisconnect();
    }
    this.waitingRequests = new Map();
    if (this.finished)
      return;
    if (this.autoReconnect) {
      setTimeout(function() {
        this.emit("reconnect");
        this.initialize();
      }.bind(this), this.settings.autoReconnectDelay || 200);
    }
  }
  observation(what) {
    const whatId = JSON.stringify(what);
    what = JSON.parse(whatId);
    let observation = this.observations.get(whatId);
    if (observation)
      return observation;
    observation = new Observation$1(this, what, false);
    this.observations.set(whatId, observation);
    return observation;
  }
  observable(what, observableClazz) {
    return this.observation(what).observable(observableClazz);
  }
  handleConnect() {
    this.remoteObserveSent = new Map();
    this.remoteUnobserveSent = new Map();
    this.connectedCounter++;
    if (this.settings.logLevel > 0)
      debug$8("connected");
    this.connected = true;
    if (!this.settings.fastAuth) {
      this.send(__spreadValues({}, this.credentials));
    }
    for (let observation of this.observations.values()) {
      observation.handleConnect();
    }
    for (let request of this.requestsQueue) {
      if (!request)
        continue;
      this.waitingRequests.set(request.msg.requestId, request);
      this.send(request.msg);
    }
    this.requestsQueue = [];
    this.emit("connect");
  }
  sendPing(data = {}) {
    this.send(__spreadProps(__spreadValues({}, data), {
      type: "ping"
    }));
  }
  sendObserve(observation) {
    if (this.settings.unobserveDebug) {
      const observationKey = JSON.stringify(observation.what);
      let remoteObserves = this.remoteObserveSent.get(observationKey);
      if (remoteObserves) {
        console.error("Observe duplication! existing observations", remoteObserves.map(({ what, uid: uid2, disposed, observablbes }) => ({ what, uid: uid2, disposed, observables: observablbes.length })), "new observation", { what: observation.what, uid: observation.uid });
        console.trace("OBSERVE DUPLICATION");
        throw new Error("OBSERVE DUPLICATION");
      } else {
        remoteObserves = [];
        this.remoteObserveSent.set(observationKey, remoteObserves);
      }
      remoteObserves.push(observation);
      this.remoteUnobserveSent.delete(observationKey);
    }
    this.send({
      type: "observe",
      what: observation.what,
      pushed: observation.pushed
    });
  }
  sendUnobserve(observation) {
    if (this.settings.unobserveDebug) {
      const observationKey = JSON.stringify(observation.what);
      let remoteUnobserves = this.remoteUnobserveSent.get(observationKey);
      if (remoteUnobserves) {
        console.error("unobserve duplication! removed observations", { what: remoteUnobserves.what, uid: remoteUnobserves.uid }, "next observation", { what: observation.what, uid: observation.uid });
        console.trace("UNOBSERVE DUPLICATION");
        throw new Error("UNOBSERVE DUPLICATION");
      } else {
        remoteUnobserves = [];
        this.remoteUnobserveSent.set(observationKey, remoteUnobserves);
      }
      remoteUnobserves.push(observation);
      this.remoteObserveSent.delete(observationKey);
    }
    this.send({
      type: "unobserve",
      what: observation.what,
      pushed: observation.pushed
    });
  }
  sendTimeSync(timestamp) {
    this.send({
      clientTimestamp: timestamp,
      type: "timeSync"
    });
  }
  dispose() {
    console.log("DISPOSE REACTIVE CONNECTION");
    this.finished = true;
    for (const timeout of this.activeTimeouts)
      clearTimeout(timeout);
  }
}
var ReactiveConnection$1 = Connection$2;
const debug$7 = browser.exports("dao");
class Observable$6 {
  constructor() {
    this.observers = [];
    this.errorObservers = [];
    this.disposed = false;
  }
  fireObserver(observer, signal, ...args) {
    if (typeof observer == "function")
      return observer(signal, ...args);
    if (observer.notify) {
      return observer.notify(signal, ...args);
    }
    if (observer[signal]) {
      observer[signal](...args);
      return true;
    }
    return false;
  }
  fireObservers(signal, ...args) {
    if (this.disposed)
      return;
    let handled = false;
    for (var observer of this.observers)
      handled = this.fireObserver(observer, signal, ...args) || handled;
    if (signal == "error") {
      let error = args[0];
      handled = this.handleError(error) || handled;
      if (!handled)
        debug$7("Unhandled observable error: " + (error.message || error));
    }
  }
  handleError(error) {
    let handled = false;
    for (var observer of this.errorObservers) {
      handled = true;
      observer(error);
    }
    return handled;
  }
  error(error) {
    this.fireObservers("error", error);
  }
  catch(errorObserver2) {
    this.errorObservers.push(errorObserver2);
  }
  uncatch(errorObserver2) {
    let id = this.errorObservers.indexOf(errorObserver2);
    if (id == -1)
      throw new Error("error observer not found");
    this.errorObservers.splice(id, 1);
  }
  observe(observer) {
    this.observers.push(observer);
    if (this.isDisposed())
      this.respawn();
  }
  unobserve(observer) {
    let id = this.observers.indexOf(observer);
    if (id == -1)
      throw new Error("observer not found");
    this.observers.splice(id, 1);
    if (this.isUseless())
      this.dispose();
  }
  isUseless() {
    return this.observers.length == 0;
  }
  isDisposed() {
    return this.disposed;
  }
  dispose() {
    this.disposed = true;
  }
  respawn() {
    this.disposed = false;
  }
  useCount() {
    return this.observers.length;
  }
  getValue() {
    return void 0;
  }
  wait() {
    let finished = false;
    const waitPromise = new Promise((resolve2, reject2) => {
      const resultObserver2 = (signal) => {
        finished = true;
        this.unobserve(resultObserver2);
        this.uncatch(errorObserver2);
        resolve2(signal);
      };
      const errorObserver2 = (error) => {
        finished = true;
        this.unobserve(resultObserver2);
        this.uncatch(errorObserver2);
        reject2(error);
      };
      if (!finished)
        this.catch(errorObserver2);
      if (!finished)
        this.observe(resultObserver2);
    });
    waitPromise.cancel = () => {
      finished = true;
      this.unobserve(resultObserver);
      this.uncatch(errorObserver);
      reject("canceled");
    };
    return waitPromise;
  }
}
var Observable_1 = Observable$6;
const Observable$5 = Observable_1;
class ObservableList$4 extends Observable$5 {
  constructor(list, _what, _dispose, valueActivator) {
    super();
    this.valueActivator = valueActivator;
    this.list = this.valueActivator ? this.valueActivator(list) : list;
    this.savedError = null;
    this.properties = [];
    this.errorProperties = [];
  }
  observe(observer) {
    if (this.isDisposed())
      this.respawn();
    this.observers.push(observer);
    if (this.savedError)
      return this.fireObserver(observer, "error", this.savedError);
    if (typeof this.list != "undefined")
      this.fireObserver(observer, "set", this.list);
  }
  set(list) {
    if (list === this.list)
      return;
    try {
      if (JSON.stringify(list) == JSON.stringify(this.list))
        return;
    } catch (e) {
    }
    this.list = this.valueActivator ? this.valueActivator(list) : list;
    this.fireObservers("set", list);
    for (const [object, property] of this.properties) {
      object[property] = this.list;
    }
  }
  push(value) {
    this.list.push(value);
    this.fireObservers("push", value);
  }
  unshift(value) {
    this.list.unshift(value);
    this.fireObservers("unshift", value);
  }
  pop() {
    this.list.pop();
    this.fireObservers("pop");
  }
  shift() {
    this.list.shift();
    this.fireObservers("shift");
  }
  splice(at, del, ...values) {
    this.list.splice(at, del, ...values);
    this.fireObservers("splice", at, del, ...values);
  }
  putByField(field, value, element, reverse = false, oldElement) {
    if (!reverse) {
      let i, l;
      for (i = 0, l = this.list.length; i < l; i++) {
        if (this.list[i][field] == value) {
          oldElement = this.list[i];
          this.list.splice(i, 1, element);
          break;
        } else if (this.list[i][field] > value) {
          this.list.splice(i, 0, element);
          break;
        }
      }
      if (i == l)
        this.list.push(element);
    } else {
      let i;
      for (i = this.list.length - 1; i >= 0; i--) {
        if (this.list[i][field] == value) {
          oldElement = this.list[i];
          this.list.splice(i, 1, element);
          break;
        } else if (this.list[i][field] > value) {
          this.list.splice(i + 1, 0, element);
          break;
        }
      }
      if (i < 0)
        this.list.splice(0, 0, element);
    }
    this.fireObservers("putByField", field, value, element, reverse, oldElement);
  }
  remove(exact) {
    let json = JSON.stringify(exact);
    for (let i = 0, l = this.list.length; i < l; i++) {
      if (JSON.stringify(this.list[i]) == json)
        this.list.splice(i, 1);
    }
    this.fireObservers("remove", exact);
  }
  removeByField(field, value, oldElement) {
    let json = JSON.stringify(value);
    for (let i = 0, l = this.list.length; i < l; i++) {
      if (JSON.stringify(this.list[i][field]) == json) {
        oldElement = this.list[i];
        this.list.splice(i, 1);
        i--;
        l--;
      }
    }
    this.fireObservers("removeByField", field, value, oldElement);
  }
  removeBy(fields) {
    let jsonf = [];
    for (var k in fields) {
      jsonf.push([k, JSON.stringify(fields[k])]);
    }
    for (let i = 0, l = this.list.length; i < l; i++) {
      let found = true;
      for (let [key, json] of jsonf) {
        found = found && JSON.stringify(this.list[i][key]) == json;
      }
      if (found) {
        this.list.splice(i, 1);
        i--;
        l--;
      }
    }
    this.fireObservers("removeBy", fields);
  }
  update(exact, element) {
    let json = JSON.stringify(exact);
    for (let i = 0, l = this.list.length; i < l; i++) {
      if (JSON.stringify(this.list[i]) == json)
        this.list.splice(i, 1, element);
    }
    this.fireObservers("update", exact, element);
  }
  updateByField(field, value, element) {
    let json = JSON.stringify(value);
    for (let i = 0, l = this.list.length; i < l; i++) {
      if (JSON.stringify(this.list[i][field]) == json)
        this.list.splice(i, 1, element);
    }
    this.fireObservers("updateByField", field, value, element);
  }
  updateBy(fields, element) {
    let jsonf = [];
    for (const k in fields) {
      jsonf.push([k, JSON.stringify(fields[k])]);
    }
    for (let i = 0, l = this.list.length; i < l; i++) {
      let found = true;
      for (let [key, json] of jsonf) {
        found = found && JSON.stringify(this.list[i][key]) == json;
      }
      if (found)
        this.list.splice(i, 1, element);
    }
    this.fireObservers("updateBy", fields, element);
  }
  bindProperty(object, property) {
    if (this.isDisposed())
      this.respawn();
    this.properties.push([object, property]);
    if (this.list !== void 0)
      object[property] = this.list;
  }
  unbindProperty(object, property) {
    for (let i = 0; i < this.properties.length; i++) {
      const prop = this.properties[i];
      if (prop[0] == object && prop[1] == property) {
        this.properties.splice(i, 1);
        i--;
        if (this.isUseless())
          this.dispose();
        return;
      }
    }
    throw new Error("cannot unbind not bound property " + property);
  }
  bindErrorProperty(object, property) {
    if (this.isDisposed())
      this.respawn();
    this.errorProperties.push([object, property]);
    if (this.savedError !== void 0)
      object[property] = this.savedError;
  }
  unbindErrorProperty(object, property) {
    for (let i = 0; i < this.errorProperties.length; i++) {
      const prop = this.errorProperties[i];
      if (prop[0] == object && prop[1] == property) {
        this.errorProperties.splice(i, 1);
        i--;
        if (this.isUseless())
          this.dispose();
        return;
      }
    }
    throw new Error("cannot unbind not bound property " + property);
  }
  handleError(error) {
    this.savedError = error;
    let handled = super.handleError(error);
    for (const [object, property] of this.errorProperties) {
      handled = true;
      object[property] = error;
    }
    return handled;
  }
  isUseless() {
    return this.observers.length == 0 && this.properties.length == 0 && this.errorProperties.length == 0;
  }
  save() {
    return this.list;
  }
  restore(list) {
    this.set(list);
  }
  isInitialized() {
    return typeof this.list !== "undefined";
  }
  next(fun) {
    let obs = new ObservableList$4(null);
    function setRetPromised(ret) {
      if (!ret || typeof ret != "object")
        return obs.set(ret);
      if (ret.then) {
        return ret.then((result) => setRet(result)).catch((error) => obs.error(error));
      }
      obs.set(ret);
    }
    let resultObservable;
    let resultObserver2 = (signal, ...args) => {
      obs[signal](...args);
    };
    function setRet(ret) {
      if (!ret || typeof ret != "object") {
        if (resultObservable) {
          resultObservable.unobserve(resultObserver2);
          resultObservable = null;
        }
        obs.set(ret);
        return;
      }
      if (ret.observe) {
        if (resultObservable)
          resultObservable.unobserve(resultObserver2);
        resultObservable = ret;
        resultObservable.observe(resultObserver2);
        return;
      } else {
        if (resultObservable) {
          resultObservable.unobserve(resultObserver2);
          resultObservable = null;
        }
      }
      if (ret.then) {
        return ret.then((result) => setRetPromised(result)).catch((error) => obs.error(error));
      }
      obs.set(ret);
    }
    setRet(fun(this.list));
    let oldDispose = obs.dispose;
    let oldRespawn = obs.respawn;
    obs.dispose = () => {
      oldDispose.call(obs);
      this.unobserve(observer);
      if (resultObservable)
        resultObservable.unobserve(resultObserver2);
    };
    obs.respawn = () => {
      oldRespawn.call(obs);
      this.observe(observer);
      if (resultObservable)
        resultObservable.observe(resultObserver2);
    };
    let observer = (signal) => setRet(fun(this.list));
    this.observe(observer);
    return obs;
  }
  useCount() {
    return this.observers.length + this.properties.length;
  }
  getValue() {
    return this.list;
  }
}
var ObservableList_1 = ObservableList$4;
const EventEmitter$3 = EventEmitter_1;
const RemoteDataSource = RemoteDataSource_1;
const ObservableList$3 = ObservableList_1;
const debug$6 = browser.exports("dao");
class Dao$1 extends EventEmitter$3 {
  constructor(credentials, definition) {
    super();
    this.definition = definition;
    this.credentials = credentials;
    this.connections = new Map();
    if (!this.definition.protocols)
      this.definition.protocols = {};
  }
  connect(defn) {
    const url = defn.url || this.definition.remoteUrl || document.location.protocol + "//" + document.location.host + "/reactive-dao";
    const proto = defn.protocol || this.definition.defaultProtocol || Object.keys(this.definition.protocols)[0];
    const connectionId = proto + ":" + url;
    let connection = this.connections.get(connectionId);
    if (connection)
      return connection;
    const protocol = this.definition.protocols[proto];
    if (!protocol)
      throw new Error("Protocol " + proto + " not supported");
    debug$6("connecting to " + url);
    connection = new protocol(this.credentials, url, this.definition.connectionSettings);
    this.connections.set(connectionId, connection);
    connection.on("connect", (...args) => this.emit("connect", connection, ...args));
    connection.on("disconnect", (...args) => this.emit("disconnect", connection, ...args));
    return connection;
  }
  findDefinition(what) {
    if (Array.isArray(what)) {
      for (let i = what.length; i > 0; i--) {
        const part = what.slice(0, i);
        let defn = this.definition[part.join(".")];
        if (defn)
          return defn;
        defn = this.definition[JSON.stringify(part)];
        if (defn)
          return defn;
      }
    }
    if (this.definition.defaultRoute)
      return this.definition.defaultRoute;
    throw new Error("definition of " + JSON.stringify(what) + " data access object not found");
  }
  prepareSource(defn) {
    if (defn.source)
      return defn;
    switch (defn.type) {
      case "remote":
        const connection = this.connect(defn);
        if (!defn.generator)
          defn.generator = (value, what) => new ObservableList$3(value);
        defn.source = new RemoteDataSource(connection, defn);
        return defn;
    }
    throw new Error("SOURCE TYPE " + defn.type + " UNKNOWN");
  }
  observable(what) {
    let defn = this.findDefinition(what);
    defn = this.prepareSource(defn);
    return defn.source.observable(what);
  }
  get(what) {
    let defn = this.findDefinition(what);
    defn = this.prepareSource(defn);
    return defn.source.get(what);
  }
  request(method, ...args) {
    let defn = this.findDefinition(method);
    defn = this.prepareSource(defn);
    return defn.source.request(method, ...args);
  }
  requestWithSettings(settings, method, ...args) {
    let defn = this.findDefinition(method);
    defn = this.prepareSource(defn);
    return defn.source.requestWithSettings(settings, method, ...args);
  }
  event(method, ...args) {
    let defn = this.findDefinition(method);
    defn = this.prepareSource(defn);
    return defn.source.event(method, ...args);
  }
  dispose() {
    for (let [to, connection] of this.connections.entries()) {
      debug$6("CLOSE CONNECTION TO", to);
      connection.dispose();
    }
  }
}
Dao$2.exports = Dao$1;
Dao$2.exports.default = Dao$1;
const Observable$4 = Observable_1;
class ObservableValue$4 extends Observable$4 {
  constructor(value) {
    super();
    this.savedError = null;
    this.value = value;
    this.properties = [];
    this.errorProperties = [];
  }
  observe(observer) {
    if (this.isDisposed())
      this.respawn();
    this.observers.push(observer);
    if (this.savedError)
      return this.fireObserver(observer, "error", this.savedError);
    if (typeof this.value != "undefined")
      this.fireObserver(observer, "set", this.value);
  }
  set(value) {
    if (value === this.value)
      return;
    try {
      if (JSON.stringify(value) == JSON.stringify(this.value))
        return;
    } catch (e) {
    }
    this.value = value;
    this.fireObservers("set", value);
    for (const [object, property] of this.properties) {
      object[property] = value;
    }
  }
  bindProperty(object, property) {
    if (this.isDisposed())
      this.respawn();
    this.properties.push([object, property]);
    if (this.value !== void 0)
      object[property] = this.value;
  }
  unbindProperty(object, property) {
    for (let i = 0; i < this.properties.length; i++) {
      var prop = this.properties[i];
      if (prop[0] == object && prop[1] == property) {
        this.properties.splice(i, 1);
        if (this.isUseless())
          this.dispose();
        return;
      }
    }
    throw new Error("cannot unbind not bound property " + property);
  }
  bindErrorProperty(object, property) {
    if (this.isDisposed())
      this.respawn();
    this.errorProperties.push([object, property]);
    if (this.savedError !== void 0)
      object[property] = this.savedError;
  }
  unbindErrorProperty(object, property) {
    for (var i = 0; i < this.errorProperties.length; i++) {
      var prop = this.errorProperties[i];
      if (prop[0] == object && prop[1] == property) {
        this.errorProperties.splice(i, 1);
        if (this.isUseless())
          this.dispose();
        return;
      }
    }
    throw new Error("cannot unbind not bound property " + property);
  }
  handleError(error) {
    this.savedError = error;
    let handled = super.handleError(error);
    for (var [object, property] of this.errorProperties) {
      handled = true;
      object[property] = error;
    }
    return handled;
  }
  isUseless() {
    return this.observers.length == 0 && this.properties.length == 0 && this.errorProperties.length == 0;
  }
  save() {
    return this.value;
  }
  restore(value) {
    this.set(value);
  }
  isInitialized() {
    return typeof this.value !== "undefined";
  }
  next(fun) {
    let obs = new ObservableValue$4(null);
    function setRetPromised(ret) {
      if (!ret || typeof ret != "object")
        return obs.set(ret);
      if (ret.then) {
        return ret.then((result) => setRet(result)).catch((error) => obs.error(error));
      }
      obs.set(ret);
    }
    let resultObservable;
    let resultObserver2 = (signal, ...args) => {
      obs[signal](...args);
    };
    function setRet(ret) {
      if (!ret || typeof ret != "object") {
        if (resultObservable) {
          resultObservable.unobserve(resultObserver2);
          resultObservable = null;
        }
        obs.set(ret);
        return;
      }
      if (ret.observe) {
        if (resultObservable)
          resultObservable.unobserve(resultObserver2);
        resultObservable = ret;
        resultObservable.observe(resultObserver2);
        return;
      } else {
        if (resultObservable) {
          resultObservable.unobserve(resultObserver2);
          resultObservable = null;
        }
      }
      if (ret.then) {
        return ret.then((result) => setRetPromised(result)).catch((error) => obs.error(error));
      }
      obs.set(ret);
    }
    setRet(fun(this.value));
    let oldDispose = obs.dispose;
    let oldRespawn = obs.respawn;
    obs.dispose = () => {
      oldDispose.call(obs);
      this.unobserve(observer);
      if (resultObservable)
        resultObservable.unobserve(resultObserver2);
    };
    obs.respawn = () => {
      oldRespawn.call(obs);
      this.observe(observer);
      if (resultObservable)
        resultObservable.observe(resultObserver2);
    };
    let observer = (signal) => setRet(fun(this.value));
    this.observe(observer);
    return obs;
  }
  useCount() {
    return this.observers.length + this.properties.length;
  }
  getValue() {
    return this.value;
  }
}
var ObservableValue_1 = ObservableValue$4;
const ObservableList$2 = ObservableList_1;
class ExtendedObservableList$1 extends ObservableList$2 {
  constructor(observableList, elementActivator, elementDispose, valueActivator = observableList.valueActivator) {
    let list = observableList.list;
    if (elementActivator) {
      list = Array.isArray(list) ? list.map(elementActivator) : elementActivator(list);
    }
    super(list, void 0, void 0, valueActivator);
    this.observableList = observableList;
    this.elementActivator = elementActivator;
    this.elementDispose = elementDispose;
    this.valueActivator = valueActivator;
    this.savedError = null;
    this.properties = [];
    this.errorProperties = [];
    this.observableList.observe(this);
  }
  dispose() {
    this.observableList.unobserve(this);
    if (this.elementDispose) {
      if (Array.isArray(this.list)) {
        for (const disposed of this.list)
          this.elementDispose(disposed);
      } else {
        this.elementDispose(this.list);
      }
      this.list = void 0;
    }
    ObservableList$2.dispose.apply(this);
  }
  respawn() {
    ObservableList$2.respawn.apply(this);
    this.observableList.observe(this);
  }
  extend(elementFunc, elementDispose) {
    const extendedList = new ExtendedObservableList$1(this.value, null, null, this.valueActivator, elementFunc, elementDispose);
    const oldDispose = extendedList.dispose;
    const oldRespawn = extendedList.respawn;
    this.observe(extendedList);
    extendedList.dispose = () => {
      this.unobserve(extendedList);
      oldDispose.apply(extendedList);
    };
    extendedList.respawn = () => {
      oldRespawn.apply(extendedList);
      this.observe(extendedList);
    };
    return extendedList;
  }
  set(list) {
    if (list === this.list)
      return;
    try {
      if (JSON.stringify(list) == JSON.stringify(this.list))
        return;
    } catch (e) {
    }
    if (this.elementDispose) {
      if (Array.isArray(this.list)) {
        for (const disposed of this.list)
          this.elementDispose(disposed);
      } else {
        this.elementDispose(this.list);
      }
    }
    if (this.elementActivator) {
      list = Array.isArray(list) ? list.map(this.elementActivator) : this.elementActivator(list);
    }
    this.list = this.valueActivator ? this.valueActivator(list) : list;
    this.fireObservers("set", list);
    for (const [object, property] of this.properties) {
      object[property] = this.list;
    }
  }
  push(value) {
    if (this.elementActivator)
      value = this.elementActivator(value);
    this.list.push(value);
    this.fireObservers("push", value);
  }
  unshift(value) {
    if (this.elementActivator)
      value = this.elementActivator(value);
    this.list.unshift(value);
    this.fireObservers("unshift", value);
  }
  pop() {
    if (this.elementDispose)
      this.elementDispose(this.list[this.list.length - 1]);
    this.list.pop();
    this.fireObservers("pop");
  }
  shift() {
    if (this.elementDispose)
      this.elementDispose(this.list[0]);
    this.list.shift();
    this.fireObservers("shift");
  }
  splice(at, del, ...values) {
    const removed = this.list.splice(at, del, ...values);
    if (this.elementDispose)
      for (const disposed of removed)
        this.elementDispose(dispose);
    this.fireObservers("splice", at, del, ...values);
  }
  putByField(field, value, element, reverse = false, oldElement) {
    if (this.elementActivator)
      element = this.elementActivator(element);
    if (!reverse) {
      let i, l;
      for (i = 0, l = this.list.length; i < l; i++) {
        if (this.list[i][field] == value) {
          oldElement = this.list[i];
          if (this.elementDispose)
            this.elementDispose(oldElement);
          this.list.splice(i, 1, element);
          break;
        } else if (this.list[i][field] > value) {
          this.list.splice(i, 0, element);
          break;
        }
      }
      if (i == l)
        this.list.push(element);
    } else {
      let i;
      for (i = this.list.length - 1; i >= 0; i--) {
        if (this.list[i][field] == value) {
          oldElement = this.list[i];
          if (this.elementDispose)
            this.elementDispose(oldElement);
          this.list.splice(i, 1, element);
          break;
        } else if (this.list[i][field] > value) {
          this.list.splice(i + 1, 0, element);
          break;
        }
      }
      if (i < 0)
        this.list.splice(0, 0, element);
    }
    this.fireObservers("putByField", field, value, element, reverse, oldElement);
  }
  remove(exact) {
    let json = JSON.stringify(exact);
    for (let i = 0, l = this.list.length; i < l; i++) {
      if (JSON.stringify(this.list[i]) == json) {
        if (this.elementDispose)
          this.elementDispose(this.list[i]);
        this.list.splice(i, 1);
      }
    }
    this.fireObservers("remove", exact);
  }
  removeByField(field, value, oldElement) {
    let json = JSON.stringify(value);
    for (let i = 0, l = this.list.length; i < l; i++) {
      if (JSON.stringify(this.list[i][field]) == json) {
        oldElement = this.list[i];
        if (this.elementDispose)
          this.elementDispose(oldElement);
        this.list.splice(i, 1);
        i--;
        l--;
      }
    }
    this.fireObservers("removeByField", field, value, oldElement);
  }
  removeBy(fields) {
    let jsonf = [];
    for (var k in fields) {
      jsonf.push([k, JSON.stringify(fields[k])]);
    }
    for (let i = 0, l = this.list.length; i < l; i++) {
      let found = true;
      for (let [key, json] of jsonf) {
        found = found && JSON.stringify(this.list[i][key]) == json;
      }
      if (found) {
        if (this.elementDispose)
          this.elementDispose(this.list[i]);
        this.list.splice(i, 1);
        i--;
        l--;
      }
    }
    this.fireObservers("removeBy", fields);
  }
  update(exact, element) {
    let json = JSON.stringify(exact);
    for (let i = 0, l = this.list.length; i < l; i++) {
      if (JSON.stringify(this.list[i]) == json) {
        if (this.elementDispose)
          this.elementDispose(this.list[i]);
        if (this.elementActivator)
          element = this.elementActivator(element);
        this.list.splice(i, 1, element);
      }
    }
    this.fireObservers("update", exact, element);
  }
  updateByField(field, value, element) {
    let json = JSON.stringify(value);
    for (let i = 0, l = this.list.length; i < l; i++) {
      if (JSON.stringify(this.list[i][field]) == json) {
        if (this.elementDispose)
          this.elementDispose(this.list[i]);
        if (this.elementActivator)
          element = this.elementActivator(element);
        this.list.splice(i, 1, element);
      }
    }
    this.fireObservers("updateByField", field, value, element);
  }
  updateBy(fields, element) {
    let jsonf = [];
    for (const k in fields) {
      jsonf.push([k, JSON.stringify(fields[k])]);
    }
    for (let i = 0, l = this.list.length; i < l; i++) {
      let found = true;
      for (let [key, json] of jsonf) {
        found = found && JSON.stringify(this.list[i][key]) == json;
      }
      if (found) {
        if (this.elementDispose)
          this.elementDispose(this.list[i]);
        if (this.elementActivator)
          element = this.elementActivator(element);
        this.list.splice(i, 1, element);
      }
    }
    this.fireObservers("updateBy", fields, element);
  }
}
var ExtendedObservableList_1 = ExtendedObservableList$1;
function flatMap(source, fun) {
  let results = source.map(fun);
  let count = 0;
  let many = source.many;
  for (let result of results) {
    count += result.length;
    many = many || result.many;
  }
  if (count > 1 && !many)
    throw new Error("too many results from not many");
  let out = new Array(count);
  out.many = many;
  let p2 = 0;
  for (let result of results) {
    for (let element of result)
      out[p2++] = element;
  }
  return out;
}
function getPropertyValues(source, property) {
  if (Array.isArray(source)) {
    return flatMap(markMany(source), (v) => getPropertyValues(v, property));
  } else {
    if (source === void 0)
      return [];
    if (source === null)
      return [];
    let v = source[property];
    if (Array.isArray(v))
      return markMany(v);
    if (v === void 0)
      return [];
    return [v];
  }
}
function getNestedPropertyValues(source, property) {
  let accumulator = [source];
  for (let part of property) {
    accumulator = flatMap(accumulator, (s) => getPropertyValues(s, part));
  }
  return accumulator;
}
function markMany(arr) {
  arr = arr.slice();
  arr.many = true;
  return arr;
}
function cross(lists) {
  let count = 1;
  let many = false;
  for (let list of lists) {
    count *= list.length;
    many = many || list.many;
  }
  let out = new Array(count);
  out.many = many;
  if (count > 1 && !many)
    throw new Error("more than one result for non array fields");
  for (let i = 0; i < count; i++) {
    let res = new Array(lists.length);
    let a = i;
    for (let j = lists.length - 1; j >= 0; j--) {
      let list = lists[j];
      res[j] = list[a % list.length];
      a = a / list.length | 0;
    }
    out[i] = res;
  }
  return out;
}
function collect(source, schema, getSource) {
  if (typeof schema == "string") {
    return [schema];
  } else if (typeof schema != "object") {
    return [schema];
  } else if (Array.isArray(schema)) {
    let partValues = new Array(schema.length);
    for (let i = 0; i < schema.length; i++) {
      partValues[i] = collect(source, schema[i], getSource);
    }
    return cross(partValues);
  } else {
    if (schema.source) {
      const sourcePointers = collect(source, schema.source, getSource);
      return flatMap(sourcePointers, (ptr) => {
        const source2 = getSource(ptr);
        const results = collect(source2, schema.schema, getSource);
        return results;
      });
    } else if (schema.nonEmpty) {
      const collected = collect(source, schema.nonEmpty, getSource);
      const result = collected.filter((x) => !!x);
      result.many = collected.many;
      return result;
    } else if (schema.identity) {
      if (typeof source == "undefined" || source === null)
        return [];
      return Array.isArray(source) ? markMany(source) : [source];
    } else if (schema.array) {
      return [collect(source, schema.array, getSource)];
    } else if (schema.property) {
      if (typeof source == "undefined" || source === null)
        return [];
      if (Array.isArray(schema.property)) {
        let values = getNestedPropertyValues(source, schema.property);
        return values;
      } else {
        let values = getPropertyValues(source, schema.property);
        return values;
      }
    } else if (schema.switch) {
      const values = collect(source, schema.value, getSource);
      return flatMap(values, (v) => {
        const found = schema.switch[v];
        if (found)
          return collect(source, found, getSource);
        if (schema.default)
          return collect(source, schema.default, getSource);
        return [];
      });
    } else if (schema.static) {
      return [schema.static];
    } else {
      let objectSchema = schema.object ? schema.object : schema;
      let propValues = [];
      let propId = 0;
      for (let key in objectSchema) {
        let values = collect(source, objectSchema[key], getSource);
        propValues[propId] = values;
        propId++;
      }
      let crossed = cross(propValues);
      let results = new Array(crossed.length);
      for (let i = 0; i < crossed.length; i++) {
        let result = {};
        let j = 0;
        for (let key in objectSchema) {
          result[key] = crossed[i][j++];
        }
        results[i] = result;
      }
      results.many = crossed.many;
      return results;
    }
  }
}
function collectPointers$2(source, schemas, getSource) {
  let results = [];
  for (let schema of schemas) {
    const collected = collect(source, schema, getSource);
    const many = results.many || collected.many;
    results = results.concat(collected);
    results.many = many;
  }
  return results;
}
var collectPointers_1 = collectPointers$2;
const EventEmitter$2 = EventEmitter_1;
const ObservableList$1 = ObservableList_1;
const utils = utils$2;
const collectPointers$1 = collectPointers_1;
const debug$5 = browser.exports("reactive-dao");
class PushObservableTrigger {
  constructor(po, what, more) {
    this.po = po;
    this.what = what;
    this.more = more;
    this.observation = this.po.pushObservation(this.what);
    this.pointers = new Map();
    this.triggers = new Map();
    if (this.more && this.more.length > 0) {
      this.localList = new ObservableList$1();
      this.pointerMethods = {
        set: (value) => this.setPointers(this.findPointers(value)),
        push: (value) => this.addPointers(this.findPointers(value)),
        unshift: (value) => this.addPointers(this.findPointers(value)),
        shift: () => this.removePointers(this.findPointers(this.localList.list[0])),
        pop: () => this.removePointers(this.findPointers(this.localList.list[this.localList.list.length - 1])),
        splice: (at, count, ...add) => this.replacePointers(this.findPointers(this.localList.list.slice(at, at + count)), this.findPointers(add)),
        remove: (value) => this.removePointers(this.findPointers(this.localList.list.filter((v) => v == value))),
        removeByField: (fieldName, value) => this.removePointers(this.findPointers(this.localList.list.filter((v) => v[fieldName] == value))),
        update: (value, update) => this.replacePointers(this.findPointers(this.localList.list.filter((v) => v == value)), this.findPointers(this.localList.list.filter((v) => v == value).map((u) => update))),
        updateByField: (fieldName, value, update) => this.replacePointers(this.findPointers(this.localList.list.filter((v) => v[fieldName] == value)), this.findPointers(this.localList.list.filter((v) => v[fieldName] == value).map((u) => update)))
      };
      this.observer = (signal, ...args) => {
        if (this.pointerMethods[signal])
          this.pointerMethods[signal](...args);
        if (this.localList[signal])
          this.localList[signal](...args);
      };
      this.observation.observable.observe(this.observer);
    }
  }
  findPointers(value) {
    let depsPointers = [];
    let count = 0;
    for (let dep of this.more) {
      const pointers = collectPointers$1(value, dep.schema);
      depsPointers.push({ pointers, more: dep.more });
      count += pointers.length;
    }
    let p2 = 0;
    let allPointers = new Array(count);
    for (let dep of depsPointers)
      for (let pt of dep.pointers)
        allPointers[p2++] = JSON.stringify({
          what: pt,
          more: dep.more
        });
    return allPointers;
  }
  setPointers(allPointers) {
    let removed = Array.from(this.pointers.keys());
    this.pointers = new Map();
    for (let pointer of allPointers) {
      let p2 = this.pointers.get(pointer);
      this.pointers.set(pointer, (p2 || 0) + 1);
    }
    let added = Array.from(this.pointers.keys());
    this.commitPointersUpdate(added, removed);
  }
  replacePointers(oldPointers, newPointers) {
    let added = [];
    let removed = [];
    for (let pointer of newPointers) {
      let p2 = this.pointers.get(pointer);
      if (!p2)
        added.push(pointer);
      this.pointers.set(pointer, (p2 || 0) + 1);
    }
    for (let pointer of oldPointers) {
      let p2 = this.pointers.get(pointer);
      this.pointers.set(pointer, (p2 || 0) - 1);
    }
    added.filter((pointer) => this.pointers.get(pointer));
    for (let [pointer, count] of this.pointers.entries()) {
      if (count < 0)
        throw new Error("deleted not existing pointer: " + pointer);
      if (count == 0)
        removed.push(pointer);
    }
    for (let rm of removed)
      this.pointers.delete(rm);
    this.commitPointersUpdate(added, removed);
  }
  addPointers(pointers) {
    this.replacePointers([], pointers);
  }
  removePointers(pointers) {
    this.replacePointers(pointers, []);
  }
  commitPointersUpdate(added, removed) {
    for (let rm of removed) {
      let trigger = this.triggers.get(rm);
      if (!trigger)
        throw new Error("removing not existing trigger: " + rm);
      trigger.dispose();
      this.triggers.delete(rm);
    }
    for (let n of added) {
      if (this.triggers.has(n))
        throw new Error("could not replace existing trigger");
      let path = JSON.parse(n);
      this.triggers.set(n, new PushObservableTrigger(this.po, path.what, path.more));
    }
  }
  dispose() {
    if (this.disposed)
      throw new Error("DOUBLE DISPOSE " + JSON.stringify(this.what));
    this.disposed = true;
    for (let trigger of this.triggers.values()) {
      trigger.dispose();
    }
    if (this.more)
      this.observation.observable.unobserve(this.observer);
    this.po.unpushObservation(this.what);
  }
}
class DepsScanner {
  constructor(po, schema, more) {
    this.po = po;
    this.schema = schema;
    this.more = more;
    this.dependencies = new Map();
    this.triggers = new Map();
    this.depsObserver = () => this.scanDeps();
    this.scanDeps();
  }
  scanDeps() {
    let newDeps = new Map();
    const newPointers = collectPointers$1(void 0, this.schema, (dep) => {
      const key = JSON.stringify(dep);
      newDeps.set(key, dep);
      const depObservation = this.dependencies.get(key);
      if (depObservation && depObservation.observable)
        return depObservation.observable.value || depObservation.observable.list;
    });
    let newPointersSet = new Map();
    for (let pointer of newPointers)
      newPointersSet.set(JSON.stringify(pointer), pointer);
    for (let [key, pointer] of newPointersSet.entries()) {
      if (!this.triggers.has(key)) {
        this.triggers.set(key, this.po.addTrigger({ what: pointer, more: this.more }));
      }
    }
    for (let [key, trigger] of this.triggers.entries()) {
      if (!newPointersSet.has(key)) {
        this.triggers.delete(key);
        this.po.removeTrigger({ what: trigger.what, more: this.more });
      }
    }
    let newObservables = [];
    for (let [key, dep] of newDeps.entries()) {
      if (!this.dependencies.has(key)) {
        let observation = this.po.pushObservation(dep);
        this.dependencies.set(key, observation);
        newObservables.push(observation.observable);
      }
    }
    for (let [key, observation] of this.dependencies.entries()) {
      if (!newDeps.has(key)) {
        observation.observable.unobserve(this.depsObserver);
        this.po.unpushObservation(observation.what);
        this.dependencies.delete(key);
      }
    }
    for (let observable of newObservables)
      observable.observe(this.depsObserver);
  }
  dispose() {
    for (let [key, trigger] of this.triggers.entries()) {
      this.po.removeTrigger({ what: trigger.what, more: this.more });
    }
    for (let [key, observation] of this.dependencies.entries()) {
      this.po.unpushObservation(observation.what);
    }
  }
}
class PushObservable extends ObservableList$1 {
  constructor(connection, paths) {
    super([]);
    this.connection = connection;
    this.paths = paths;
    this.depsScanners = new Map();
    this.triggers = new Map();
    this.observations = new Map();
    for (let path of paths) {
      if (path.schema) {
        this.addDepsScanner(path);
      } else {
        this.addTrigger(path);
      }
    }
  }
  addDepsScanner(path) {
    const key = JSON.stringify(path);
    this.depsScanners.set(key, new DepsScanner(this, path.schema, path.more));
  }
  removeDepsScanner(path) {
    const key = JSON.stringify(path);
    this.depsScanners.get(key).dispose();
    this.depsScanners.delete(key);
  }
  addTrigger(path) {
    const key = JSON.stringify(path);
    let trigger = this.triggers.get(key);
    if (trigger) {
      trigger.uses++;
    } else {
      trigger = new PushObservableTrigger(this, path.what, path.more);
      trigger.uses = 1;
      this.triggers.set(key, trigger);
    }
    return trigger;
  }
  removeTrigger(path) {
    const key = JSON.stringify(path);
    const trigger = this.triggers.get(key);
    if (!trigger)
      throw new Error("could not remove not existing trigger");
    trigger.uses--;
    if (trigger.uses == 0) {
      trigger.dispose();
      this.triggers.delete(key);
    }
  }
  pushObservation(what) {
    const whatId = JSON.stringify(what);
    let observationInfo = this.observations.get(whatId);
    if (!observationInfo) {
      const observation = this.connection.push(what);
      observationInfo = {
        observation,
        uses: 0
      };
      this.observations.set(whatId, observationInfo);
      this.push(what);
    }
    observationInfo.uses++;
    return observationInfo.observation;
  }
  unpushObservation(what) {
    const whatId = JSON.stringify(what);
    let observationInfo = this.observations.get(whatId);
    if (!observationInfo)
      throw new Error("could not unpush not existing observation");
    observationInfo.uses--;
    if (observationInfo.uses == 0) {
      this.observations.delete(whatId);
      observationInfo.observation.unpush();
      this.remove(what);
    }
  }
  dispose() {
    ObservableList$1.prototype.dispose.call(this);
    for (let depsScanner of this.depsScanners.values()) {
      depsScanner.dispose();
    }
    for (let trigger of this.triggers.values()) {
      trigger.dispose();
    }
    if (this.observations.size > 0)
      throw new Error("cleanup failed, memory leak in PushObservable");
  }
  respawn() {
    throw new Error("respawn not implemented");
  }
}
class Observation {
  constructor(connection, what, observable, observed) {
    this.connection = connection;
    this.what = what;
    this.pushCount = 0;
    this.observed = observed;
    this.observable = observable;
    if (!observed)
      this.push();
    this.observer = (signal, ...args) => {
      this.connection.send({
        type: "notify",
        what,
        signal,
        args
      });
      return true;
    };
    this.observable.observe(this.observer);
  }
  observe(pushed) {
    if (this.disposed) {
      console.error("PREVIOUS DISPOSE", this.deleted, this.disposed);
      throw new Error("Observe of disposed observation " + JSON.stringify(this.what) + " pushed " + this.pushCount);
    }
    if (this.observed) {
      throw new Error("Observe of already observed " + JSON.stringify(this.what) + " pushed " + this.pushCount);
    }
    this.observed = true;
  }
  unobserve(pushed) {
    if (!this.observed)
      throw new Error("Unobserve of not observed " + JSON.stringify(this.what) + " pushed " + this.pushCount);
    this.observed = false;
    if (this.pushCount == 0) {
      this.dispose();
    } else if (!pushed) {
      this.observable.unobserve(this.observer);
      this.observable.observe(this.observer);
    }
  }
  unpush() {
    this.pushCount--;
    if (this.pushCount == 0) {
      this.connection.send({
        type: "unpush",
        what: this.what
      });
      if (!this.observed)
        this.dispose();
    }
  }
  push() {
    this.pushCount++;
    if (this.pushCount == 1) {
      this.connection.send({
        type: "push",
        what: this.what
      });
    }
  }
  dispose() {
    if (this.disposed) {
      console.error("PREVIOUS DISPOSE", this.deleted, this.disposed);
      throw new Error("DOUBLE DISPOSE " + JSON.stringify(this.what));
    }
    this.disposed = true;
    try {
      throw new Error();
    } catch (e) {
      this.disposed = e;
    }
    this.observable.unobserve(this.observer);
    this.connection.observations.delete(JSON.stringify(this.what));
    this.deleted = true;
  }
}
class ReactiveServerConnection$1 extends EventEmitter$2 {
  constructor(server, id, connection, daoFactory, settings) {
    super();
    this.server = server;
    this.id = id;
    this.connection = connection;
    this.connected = true;
    this.settings = settings || {};
    this.daoFactory = daoFactory;
    this.dao = null;
    this.daoPromise = null;
    this.daoGenerationQueue = [];
    this.observations = new Map();
    this.context = null;
    this.connectionMonitor = this.settings.connectionMonitorFactory ? settings.connectionMonitorFactory(this) : null;
    connection.on("data", (data) => {
      const message = JSON.parse(data);
      this.handleMessage(message);
      this.connected = false;
    });
    connection.on("close", () => {
      for (let observation of this.observations.values()) {
        if (observation.observed)
          observation.dispose();
      }
      if (this.dao)
        this.dao.dispose();
      this.server.handleConnectionClose(this);
    });
    if (this.settings.fastAuth) {
      try {
        this.handleDaoPromise(this.daoFactory(this.credentials, this.connection, this));
      } catch (error) {
        return this.handleDaoFactoryError(error);
      }
    }
  }
  send(message) {
    try {
      const serialized = JSON.stringify(message);
      this.connection.write(serialized);
    } catch (error) {
      console.error("MESSAGE SERIALIZATION ERROR", error, "\nMessage: ", message);
    }
  }
  push(what) {
    const whatId = JSON.stringify(what);
    let observation = this.observations.get(whatId);
    if (!observation) {
      const observable = this.dao.observable(what);
      observation = new Observation(this, what, observable, false);
      this.observations.set(whatId, observation);
      return observation;
    }
    observation.push();
    return observation;
  }
  unpush(what) {
    const whatId = JSON.stringify(what);
    let observation = this.observations.get(whatId);
    if (!observation)
      throw new Error("unpush of non-existing observation");
    observation.unpush();
  }
  handleServerError(message, error) {
    debug$5("MESSAGE", message);
    debug$5("SERVER ERROR", error);
    if (this.settings.logErrors) {
      console.error("MESSAGE", message);
      console.error("SERVER ERROR", error);
    }
    this.emit("serverError", error, message);
  }
  handleClientError(message, error) {
    debug$5("MESSAGE", message);
    debug$5("CLIENT ERROR", error);
    debug$5("CLOSING CONNECTION");
    if (this.settings.logErrors) {
      console.error("MESSAGE", message);
      console.error("CLIENT ERROR", error);
      console.error("CLOSING CONNECTION");
    }
    this.emit("clientError", error, message);
    this.closeConnection();
  }
  handleRequest(message) {
    const path = message.method;
    try {
      this.dao.request(path, ...message.args).then((result) => this.send({
        type: "response",
        responseId: message.requestId,
        response: result
      }), (error) => {
        this.handleServerError(message, error);
        this.send({
          type: "error",
          responseId: message.requestId,
          error: utils.errorToJSON(error)
        });
      });
    } catch (error) {
      this.handleServerError(message, error);
      this.send({
        type: "error",
        responseId: message.requestId,
        error: utils.errorToJSON(error)
      });
    }
  }
  handleObserve(message) {
    const path = message.what;
    const spath = JSON.stringify(path);
    let observation = this.observations.get(spath);
    if (observation) {
      if (observation.observed) {
        this.handleClientError(message, "Second observation of the same observable");
        return;
      } else {
        observation.observe(message.pushed);
      }
    } else {
      try {
        let observable;
        if (typeof path == "object" && !Array.isArray(path) && path.paths) {
          let paths = message.what.paths;
          observable = new PushObservable(this, paths);
        } else {
          observable = this.dao.observable(path);
        }
        observation = new Observation(this, path, observable, true);
        this.observations.set(spath, observation);
      } catch (error) {
        debug$5("Observe error", error);
        this.send({
          type: "notify",
          what: message.what,
          signal: "error",
          args: [utils.errorToJSON(error)]
        });
      }
    }
  }
  handleUnobserve(message) {
    const path = message.what;
    const spath = JSON.stringify(path);
    const observation = this.observations.get(spath);
    if (!observation)
      throw new Error("Unobserve of not observed " + spath);
    observation.unobserve(message.pushed);
  }
  handleGet(message) {
    const path = message.what;
    if (typeof path == "object" && !Array.isArray(path) && path.paths) {
      let paths = path.paths;
      return this.handleGetMore(message.requestId, paths);
    }
    try {
      Promise.resolve(this.dao.get(path)).then((result) => this.send({
        type: "response",
        responseId: message.requestId,
        response: result
      }), (error) => this.send({
        type: "error",
        responseId: message.requestId,
        error: utils.errorToJSON(error)
      }));
    } catch (error) {
      this.handleServerError(message, error);
      this.send({
        type: "error",
        responseId: message.requestId,
        error: utils.errorToJSON(error)
      });
    }
  }
  handleGetMore(requestId, paths) {
    let fetchMap = new Map();
    let resultsMap = new Map();
    let results = [];
    const dao2 = this.dao;
    function fetchDeps(source, schema) {
      let moreDeps = [];
      const pointers = collectPointers$1(source, schema, (dep) => {
        const key = JSON.stringify(dep);
        const value = resultsMap.get(key);
        if (typeof value != "undefined")
          return value;
        moreDeps.push(dep);
        return void 0;
      });
      if (moreDeps.length == 0)
        return Promise.resolve(pointers);
      return Promise.all(moreDeps.map((dep) => {
        const result = fetch2({ what: dep }).catch((error) => {
          error.stack += `
While fetching ${JSON.stringify(dep)} from source${JSON.stringify(source, null, "  ")} with schema ${JSON.stringify(schema)}`;
          throw error;
        });
        return result;
      })).then((gotSomeDeps) => fetchDeps(source, schema));
    }
    function fetchMore(result, more) {
      return Promise.all(more.map((mm) => fetchDeps(result, mm.schema).then((pointers) => Promise.all(pointers.map((pointer) => fetch2({ what: pointer, more: mm.more }))))));
    }
    function fetch2(path) {
      if (path.what) {
        const what = path.what;
        const key = JSON.stringify(what);
        let dataPromise = fetchMap.get(key);
        if (!dataPromise) {
          dataPromise = dao2.get(what);
          fetchMap.set(key, dataPromise);
        }
        return dataPromise.then((result) => {
          if (!resultsMap.has(key)) {
            results.push({
              what,
              data: result
            });
            resultsMap.set(key, result);
          }
          if (path.more) {
            return fetchMore(result, path.more).then((m) => result);
          } else
            return Promise.resolve(result);
        });
      } else if (path.schema) {
        return fetchDeps(void 0, path.schema).then((pointers) => {
          return Promise.all(pointers.map((pointer) => fetch2({ what: pointer }))).then((results2) => {
            if (path.more) {
              return fetchMore(results2, path.more).then((m) => results2);
            } else
              return Promise.resolve(results2);
          });
        });
      } else
        throw new Error("Unknown path format: " + JSON.stringify(path));
    }
    Promise.all(paths.map((path) => fetch2(path))).then(() => {
      this.send({
        type: "response",
        responseId: requestId,
        response: results
      });
    }).catch((error) => this.send({
      type: "error",
      responseId: requestId,
      error: utils.errorToJSON(error)
    }));
  }
  handleAuthorizedMessage(message) {
    try {
      switch (message.type) {
        case "request":
          this.handleRequest(message);
          break;
        case "ping":
          this.emit("ping", message);
          message.type = "pong";
          this.send(message);
          break;
        case "pong":
          this.emit("pong", message);
          break;
        case "timeSync":
          const now = Date.now();
          message.serverTimestamp = now;
          this.send(message);
          break;
        case "event":
          const path = message.method;
          this.dao.request(path, ...message.args);
          break;
        case "observe":
          this.handleObserve(message);
          break;
        case "unobserve":
          this.handleUnobserve(message);
          break;
        case "get":
          this.handleGet(message);
          return;
        case "getMore":
          this.handleGetMore(message);
          return;
      }
    } catch (error) {
      this.handleProtocolError(error, message);
    }
  }
  handleProtocolError(error, message) {
    console.error("PROTOCOL ERROR", error, "credentials", this.credentials);
    this.send({
      type: "malformedMessageError",
      error: utils.errorToJSON(error),
      message
    });
    this.closeConnection();
  }
  handleDaoFactoryError(error) {
    debug$5("DAO Factory error", error);
    console.error("DAO FACTORY ERROR", error);
    this.send({
      type: "authenticationError",
      error: utils.errorToJSON(error)
    });
    this.closeConnection();
  }
  handleDaoPromise(daoPromise) {
    this.daoPromise = daoPromise;
    if (!this.daoPromise.then) {
      this.dao = this.daoPromise;
      this.daoPromise = null;
    } else {
      this.daoPromise.catch((error) => this.handleDaoFactoryError(error)).then((dd) => {
        if (!dd)
          return this.handleDaoFactoryError("dao not defined");
        this.dao = dd;
        this.daoPromise = null;
        for (const message of this.daoGenerationQueue)
          this.handleAuthorizedMessage(message);
      });
    }
  }
  handleMessage(message) {
    if (!this.dao && !this.daoPromise) {
      if (!message) {
        this.handleClientError(message, "Got empty packet, expected credentials");
        return;
      }
      try {
        this.credentials = message;
        this.handleDaoPromise(this.daoFactory(this.credentials, this.connection, this));
      } catch (error) {
        return this.handleDaoFactoryError(error);
      }
    } else if (this.daoPromise && !this.dao) {
      this.daoGenerationQueue.push(message);
    } else {
      this.handleAuthorizedMessage(message);
    }
  }
  closeConnection() {
    if (this.settings.logErrors)
      console.trace("DISCONNECTED BY SERVER!");
    this.connection.close();
  }
  sendPing(data = {}) {
    this.send(__spreadProps(__spreadValues({}, data), {
      type: "ping"
    }));
  }
}
var ReactiveServerConnection_1 = ReactiveServerConnection$1;
const ReactiveServerConnection = ReactiveServerConnection_1;
class ReactiveServer$1 {
  constructor(daoFactory, settings) {
    this.settings = settings || {};
    this.daoFactory = daoFactory;
    this.connections = new Map();
    this.lastConnectionId = 0;
  }
  handleConnection(connection) {
    let id = ++this.lastConnectionId;
    let reactiveConnection = new ReactiveServerConnection(this, id, connection, this.daoFactory, this.settings);
    this.connections.set(reactiveConnection.id, reactiveConnection);
  }
  handleConnectionClose(reactiveConnection) {
    this.connections.delete(reactiveConnection.id);
  }
}
var ReactiveServer_1 = ReactiveServer$1;
const debug$4 = browser.exports("reactive-dao:cache");
const ObservableValue$3 = ObservableValue_1;
class DaoPrerenderCache$2 {
  constructor(dao2, mode) {
    this.dao = dao2;
    this.cache = new Map();
    this.extendedCache = new Map();
    this.mode = mode;
    this.observables = new Map();
  }
  setCache(data) {
    this.cache = new Map(data);
    for (const [keyJson, value] of data) {
      const key = JSON.parse(keyJson);
      if (key.paths) {
        for (const { what, data: data2 } of value) {
          this.extendedCache.set(JSON.stringify(what), data2);
        }
      }
    }
    for (const [what, observable] of this.observables.entries()) {
      if (observable.isDisposed()) {
        observable.set(this.cache.get(what));
      }
    }
    this.observables.clear();
  }
  observable(what) {
    const cacheKey = JSON.stringify(what);
    debug$4("OBSERVABLE", cacheKey, "MODE", this.mode);
    let observable = this.observables.get(cacheKey);
    if (observable) {
      debug$4("OBSERVABLE EXISTS", cacheKey);
      return observable;
    }
    if (this.mode == "save") {
      observable = new ObservableValue$3();
      this.get(what).then((value) => observable.set(value)).catch((error) => observable.error(error));
    } else {
      observable = this.dao.observable(what);
    }
    this.observables.set(cacheKey, observable);
    if (this.cache.has(cacheKey))
      observable.restore(this.cache.get(cacheKey));
    if (this.extendedCache.has(cacheKey)) {
      observable.restore(this.extendedCache.get(cacheKey));
      return observable;
    }
    if (observable.isInitialized && observable.isInitialized()) {
      if (this.mode == "save") {
        this.cache.set(cacheKey, observable.save());
      }
      return observable;
    }
    if (this.mode == "load")
      ;
    return observable;
  }
  get(what) {
    const cacheKey = JSON.stringify(what);
    debug$4("GET", cacheKey);
    if (this.cache.has(cacheKey)) {
      const value = this.cache.get(cacheKey);
      debug$4("GET FROM CACHE", cacheKey, " => ", value);
      return Promise.resolve(value);
    }
    if (this.extendedCache.has(cacheKey)) {
      const value = this.extendedCache.get(cacheKey);
      debug$4("GET FROM EXTENDED CACHE", cacheKey, " => ", value);
      return Promise.resolve(value);
    }
    if (this.mode == "load")
      ;
    const promise2 = this.dao.get(what);
    if (this.mode == "save") {
      if (!promise2)
        throw new Error("GET NOT FOUND: " + what);
      promise2.then((result) => {
        let observable = this.observables.get(cacheKey);
        if (observable) {
          if (typeof observable == "function") {
            observable("set", result);
          } else if (observable.notify) {
            observable.notify("set", result);
          } else {
            observable.set(result);
          }
        }
        this.cache.set(cacheKey, result);
        if (what.paths) {
          for (const { what: what2, data } of result) {
            let observable2 = this.observables.get(cacheKey);
            if (observable2) {
              if (typeof observable2 == "function") {
                observable2("set", data);
              } else if (observable2.notify) {
                observable2.notify("set", data);
              } else {
                observable2.set(data);
              }
            }
            this.extendedCache.set(JSON.stringify(what2), data);
          }
        }
      });
    }
    return promise2;
  }
  set(what, value) {
    const cacheKey = JSON.stringify(what);
    debug$4("SET CACHE", cacheKey, " => ", value);
    let observable = this.observables.get(cacheKey);
    if (observable) {
      if (typeof observable == "function")
        return observable("set", value);
      if (observable.notify) {
        return observable.notify("set", value);
      }
      observable.set(value);
      debug$4("SET CACHE", cacheKey, " OBSERVABLE ", observable);
    }
    this.cache.set(cacheKey, value);
  }
  cacheData() {
    return Array.from(this.cache.entries());
  }
  request(method, ...args) {
    return this.dao.request(method, ...args);
  }
  requestWithSettings(settings, method, ...args) {
    return this.dao.requestWithSettings(settings, method, ...args);
  }
  event(method, ...args) {
    return this.dao.event(method, ...args);
  }
  clear() {
    console.log("CLEAR CACHE!");
    this.setCache([]);
  }
}
var DaoPrerenderCache_1 = DaoPrerenderCache$2;
const Connection$1 = ReactiveConnection$1;
const debug$3 = browser.exports("reactive-dao:loopback-connection");
class LoopbackConnection$1 extends Connection$1 {
  constructor(credentials, server, settings) {
    super(credentials, settings);
    this.packetFilter = settings.packetFilter;
    this.server = server;
    this.delay = settings.delay || 0;
    this.serverMessageListener = null;
    this.serverCloseListener = null;
    this.headers = {};
    this.initialize();
  }
  next(fn) {
    if (this.delay) {
      setTimeout(fn, this.delay);
    } else {
      fn();
    }
  }
  initialize() {
    if (this.initPromise)
      return this.initPromise;
    delete this.events["data"];
    this.initPromise = new Promise((resolve2, reject2) => {
      this.next(() => {
        this.server.handleConnection(this);
        this.handleConnect();
        this.initPromise = null;
        resolve2(true);
      });
    });
  }
  send(message) {
    if (!this.connected)
      return;
    const data = JSON.stringify(message);
    debug$3("CLIENT => SERVER Message", message);
    if (this.packetFilter && !this.packetFilter(message, true)) {
      debug$3("Message filtered");
      return;
    }
    this.next(() => {
      this.emit("data", data);
    });
  }
  reconnect() {
    debug$3("reconnect!");
    this.handleDisconnect();
    this.serverCloseListener();
    if (this.autoReconnect)
      return;
    this.initialize();
  }
  dispose() {
    super.dispose();
    this.handleDisconnect();
    this.emit("close");
  }
  closeConnection() {
    this.emit("close");
    this.handleDisconnect();
  }
  close() {
    this.emit("close");
    this.handleDisconnect();
  }
  write(json) {
    if (!this.connected)
      return;
    const message = JSON.parse(json);
    debug$3("SERVER => CLIENT Message", message);
    if (this.packetFilter && !this.packetFilter(message, false)) {
      debug$3("Message filtered");
      return;
    }
    this.next(() => {
      this.handleMessage(message);
    }, this.delay);
  }
}
var LoopbackConnection_1 = LoopbackConnection$1;
const Observable$3 = Observable_1;
class ObservableError$3 extends Observable$3 {
  constructor(error) {
    super();
    this.error = error;
  }
  observe(observer) {
    this.fireObserver(observer, "error", this.error);
  }
  unobserve(observer) {
  }
  wait() {
    return Promise.reject(this.error);
  }
}
var ObservableError_1 = ObservableError$3;
const Observable$2 = Observable_1;
const ObservableValue$2 = ObservableValue_1;
const ObservableError$2 = ObservableError_1;
const debug$2 = browser.exports("dao");
class ObservablePromiseProxy$2 extends Observable$2 {
  constructor(promise2, errorMapper2 = (v) => v) {
    super();
    this.observable = null;
    this.observer = (signal, ...args) => {
      this.fireObservers(signal, ...args);
    };
    promise2.then((result) => {
      if (result.observe) {
        this.init(result);
      } else {
        this.init(new ObservableValue$2(result));
      }
    }).catch((error) => {
      debug$2("ERROR ON OBSERVE", error);
      this.init(new ObservableError$2(errorMapper2(error)));
    });
  }
  init(observable) {
    this.observable = observable;
    if (!this.disposed)
      this.observable.observe(this.observer);
  }
  dispose() {
    this.disposed = true;
    if (this.observable)
      this.observable.unobserve(this.observer);
  }
  respawn() {
    this.disposed = false;
    if (this.observable)
      this.observable.observe(this.observer);
  }
  observe(observer) {
    if (this.observable) {
      this.observable.observe(observer);
    } else {
      super.observe(observer);
    }
  }
  unobserve(observer) {
    if (this.observers.indexOf(observer) == -1) {
      this.observable.unobserve(observer);
    } else {
      super.unobserve(observer);
    }
  }
  getValue() {
    return promise.then((r) => r.getValue());
  }
}
var ObservablePromiseProxy_1 = ObservablePromiseProxy$2;
const ObservableValue$1 = ObservableValue_1;
const ObservablePromiseProxy$1 = ObservablePromiseProxy_1;
const ObservableError$1 = ObservableError_1;
const debug$1 = browser.exports("reactive-dao");
const errorMapper = (e) => "" + (e.stack || e.message || e);
class SimpleDao$1 {
  constructor(defn) {
    this.defn = defn;
  }
  observable(what) {
    let ret;
    try {
      const source = this.defn.values[what[1]];
      if (!source)
        throw new Error(`source ${what[1]} is not defined`);
      ret = source.observable(...what.slice(2));
      if (ret.observe)
        return ret;
      if (ret.then)
        return new ObservablePromiseProxy$1(ret, errorMapper);
    } catch (e) {
      debug$1("ERROR ON OBSERVE", what);
      debug$1(e);
      return new ObservableError$1(errorMapper(e));
    }
    return new ObservableValue$1(ret);
  }
  get(what) {
    const source = this.defn.values[what[1]];
    if (!source)
      throw new Error(`source ${what[1]} is not defined`);
    return source.get(...what.slice(2));
  }
  request(what, ...args) {
    let method = this.defn.methods[what[1]];
    if (!method)
      throw new Error("methodNotFound");
    let res = method(...what.slice(2).concat(args));
    if (res && res.then)
      return res;
    return Promise.resolve(res);
  }
}
var SimpleDao_1 = SimpleDao$1;
browser.exports("dao");
const Observable$1 = Observable_1;
class ObservableProxy$2 extends Observable$1 {
  constructor(observable) {
    super();
    this.disposed = true;
    this.observer = (signal, ...args) => {
      this.fireObservers(signal, ...args);
    };
    this.properties = [];
    this.errorProperties = [];
    this.setTarget(observable);
  }
  setTarget(observable) {
    if (this === observable)
      throw new Error("infinite loop");
    if (!this.disposed && this.observable) {
      this.observable.unobserve(this.observer);
      for (let [object, property] of this.properties) {
        this.observable.unbindProperty(object, property);
      }
      for (let [object, property] of this.errorProperties) {
        this.observable.unbindErrorProperty(object, property);
      }
    }
    this.observable = observable;
    if (!this.disposed && this.observable) {
      this.observable.observe(this.observer);
      for (let [object, property] of this.properties) {
        this.observable.bindProperty(object, property);
      }
      for (let [object, property] of this.errorProperties) {
        this.observable.bindErrorProperty(object, property);
      }
    }
  }
  dispose() {
    if (this.disposed)
      return;
    this.disposed = true;
    if (this.observable)
      this.observable.unobserve(this.observer);
  }
  respawn() {
    if (!this.disposed)
      return;
    this.disposed = false;
    if (this.observable)
      this.observable.observe(this.observer);
  }
  reobserveTarget() {
    if (!this.disposed && this.observable) {
      this.observable.unobserve(this.observer);
      this.observable.observe(this.observer);
    }
  }
  isUseless() {
    return this.observers.length == 0 && this.properties.length == 0 && this.errorProperties.length == 0;
  }
  catch(...args) {
    let beenDisposed = this.disposed;
    Observable$1.prototype.catch.apply(this, args);
    if (!beenDisposed)
      this.reobserveTarget();
  }
  observe(...args) {
    let beenDisposed = this.disposed;
    Observable$1.prototype.observe.apply(this, args);
    if (!beenDisposed)
      this.reobserveTarget();
  }
  bindProperty(object, property) {
    if (this.isDisposed())
      this.respawn();
    this.properties.push([object, property]);
    if (this.observable)
      this.observable.bindProperty(object, property);
  }
  unbindProperty(object, property) {
    for (var i = 0; i < this.properties.length; i++) {
      var prop = this.properties[i];
      if (prop[0] === object && prop[1] === property) {
        this.properties.splice(i, 1);
        if (this.observable)
          this.observable.unbindProperty(object, property);
        if (this.isUseless())
          this.dispose();
        return;
      }
    }
    throw new Error("cannot unbind not bound property " + property);
  }
  bindErrorProperty(object, property) {
    if (this.isDisposed())
      this.respawn();
    this.errorProperties.push([object, property]);
    if (this.observable)
      this.observable.bindErrorProperty(object, property);
  }
  unbindErrorProperty(object, property) {
    for (var i = 0; i < this.errorProperties.length; i++) {
      var prop = this.errorProperties[i];
      if (prop[0] == object && prop[1] == property) {
        this.errorProperties.splice(i, 1);
        if (this.observable)
          this.observable.unbindErrorProperty(object, property);
        if (this.isUseless())
          this.dispose();
        return;
      }
    }
    throw new Error("cannot unbind not bound property " + property);
  }
  getValue() {
    if (!this.observable)
      return void 0;
    return this.observable.getValue();
  }
}
var ObservableProxy_1 = ObservableProxy$2;
class ConnectionMonitorPinger$1 {
  constructor(connection, settings) {
    this.settings = settings || {};
    this.pingInterval = this.settings.pingInterval || 1e4;
    this.pongInterval = this.settings.pongInterval || 1e4;
    this.connection = connection;
    this.checkTimer = null;
    this.connection.on("pong", () => this.handlePong());
    this.connection.on("connect", () => this.start());
    if (this.connection.connected)
      this.start();
  }
  start() {
    let now = Date.now();
    this.lastPing = now;
    this.lastPong = now;
    this.work();
  }
  work() {
    if (this.checkTimer !== null)
      clearTimeout(this.checkTimer);
    if (!this.connection.connected)
      return;
    const now = Date.now();
    let nextPing = this.lastPing + this.pingInterval;
    let nextPong = this.lastPong + this.pongInterval;
    if (nextPong <= now) {
      this.connection.closeConnection();
      return;
    }
    if (nextPing <= now) {
      this.connection.sendPing();
      this.lastPing = now;
      nextPing = this.lastPing + this.pingInterval;
    }
    let nextCheck = Math.min(nextPing, nextPong);
    if (nextCheck < Infinity) {
      this.checkTimer = setTimeout(() => this.work(), nextCheck - now);
    }
  }
  handlePong() {
    this.lastPong = Date.now();
    this.work();
  }
}
var ConnectionMonitorPinger_1 = ConnectionMonitorPinger$1;
class ConnectionMonitorPingReceiver$1 {
  constructor(connection, settings) {
    this.connection = connection;
    this.pingInterval = settings.pingInterval | 1e4;
    this.connection.on("ping", () => this.handlePing());
    if (this.connection.connected)
      this.start();
    this.connection.on("connect", () => this.start());
  }
  start() {
    this.lastPing = Date.now();
    this.work();
  }
  work() {
    if (this.checkTimer !== null)
      clearTimeout(this.checkTimer);
    const now = Date.now();
    let nextPing = this.lastPing + this.pingInterval;
    if (nextPing < now) {
      this.connection.closeConnection();
      return;
    }
    if (nextPing < Infinity) {
      this.checkTimer = setTimeout(() => this.work(), nextPing - now);
    }
  }
  handlePing() {
    this.lastPing = Date.now();
    this.work();
  }
}
var ConnectionMonitorPingReceiver_1 = ConnectionMonitorPingReceiver$1;
class TimeSynchronization$1 {
  constructor(settings) {
    this.connection = null;
    this.minimalDiff = -Infinity;
    this.maximalDiff = Infinity;
    this.timeDiff = 0;
    this.pongCount = 0;
    settings = settings || {};
    this.sendInterval = settings.pingInterval || 1e3;
    this.sendIntervalIncrement = settings.pingIntervalIncrement === void 0 ? 250 : settings.pingIntervalIncrement;
    this.maxSendInterval = settings.maxPingInterval || 1e5;
    this.minPongCount = settings.minPongCount || 1;
    this.phases = settings.phases || [];
    this.nextPhaseId = 0;
    this.promise = new Promise((resolve2, reject2) => this.promiseCallback = resolve2);
  }
  setConnection(connection) {
    this.connection = connection;
    this.connection.on("timeSync", (msg) => this.handleTimeSync(msg.clientTimestamp, msg.serverTimestamp));
    this.run();
  }
  sendSyncPing() {
    let now = Date.now();
    this.connection.sendTimeSync(now);
  }
  handleTimeSync(clientTs, serverTs) {
    let clientNow = Date.now();
    let zeroReply = serverTs - clientNow;
    if (zeroReply > this.minimalDiff)
      this.minimalDiff = zeroReply;
    let zeroSend = serverTs - clientTs;
    if (zeroSend < this.maximalDiff)
      this.maximalDiff = zeroSend;
    let ping = clientNow - clientTs;
    let pingDiff = serverTs - (clientNow - ping / 2);
    if (this.minimalDiff > this.maximalDiff) {
      let middle = (this.minimalDiff + this.maximalDiff) / 2;
      this.timeDiff = middle;
    } else {
      this.timeDiff = pingDiff;
      if (this.timeDiff < this.minimalDiff)
        this.timeDiff = this.minimalDiff;
      if (this.timeDiff > this.maximalDiff)
        this.timeDiff = this.maximalDiff;
    }
    this.pongCount++;
    if (this.pongCount == this.minPongCount)
      this.promiseCallback(this.timeDiff);
    if (this.phases.length > this.nextPhaseId) {
      let phase = this.phases[this.nextPhaseId];
      if (this.pongCount >= phase.afterPongCount) {
        this.nextPhaseId++;
        this.sendInterval = phase.pingInterval || 1e3;
        this.sendIntervalIncrement = phase.pingIntervalIncrement || 0;
        this.maxSendInterval = phase.maxPingInterval || 1e5;
      }
    }
  }
  run() {
    if (this.connection.connected) {
      this.sendSyncPing();
    }
    let interval = this.sendInterval + this.pongCount * this.sendIntervalIncrement;
    if (interval > this.maxSendInterval)
      interval = this.maxSendInterval;
    setTimeout(() => this.run(), interval);
  }
  serverToLocal(ts) {
    if (this.pongCount < this.minPongCount)
      throw new Error("Time not synchronized");
    return ts - this.timeDiff;
  }
  localToServer(ts) {
    if (this.pongCount < this.minPongCount)
      throw new Error("Time not synchronized");
    return ts + this.timeDiff;
  }
  synchronizedPromise() {
    return this.promise;
  }
}
var TimeSynchronization_1 = TimeSynchronization$1;
const EventEmitter$1 = EventEmitter_1;
const ObservableProxy$1 = ObservableProxy_1;
class DaoProxy$2 extends EventEmitter$1 {
  constructor(dao2) {
    super();
    this.observables = new Map();
    this.onConnect = (...args) => this.emit("connect", ...args);
    this.onDisconnect = (...args) => this.emit("disconnect", ...args);
    this.setDao(dao2);
  }
  setDao(dao2) {
    if (this.dao && this.dao.removeListener) {
      this.dao.removeListener("connect", this.onConnect);
      this.dao.removeListener("disconnect", this.onDisconnect);
    }
    this.dao = dao2;
    if (this.dao) {
      for (let [id, observable] of this.observables.entries()) {
        if (!observable.disposed) {
          let what = JSON.parse(id);
          const target = this.dao.observable(what);
          observable.setTarget(target);
        }
      }
      if (this.dao.on) {
        this.dao.on("connect", this.onConnect);
        this.dao.on("disconnect", this.onDisconnect);
      }
    } else {
      for (let [id, observable] of this.observables.entries()) {
        observable.setTarget(null);
      }
    }
  }
  observable(what) {
    const spath = JSON.stringify(what);
    let observable = this.observables.get(spath);
    if (observable)
      return observable;
    if (this.dao) {
      const target = this.dao.observable(what);
      observable = new ObservableProxy$1(target);
    } else {
      observable = new ObservableProxy$1();
    }
    const oldDispose = observable.dispose;
    observable.dispose = (...args) => {
      this.observables.delete(spath);
      oldDispose.call(observable, ...args);
    };
    const oldRespawn = observable.respawn;
    observable.respawn = (...args) => {
      const newObservable = this.observables.get(spath);
      if (newObservable && newObservable !== observable) {
        observable.target = newObservable;
      } else if (this.dao) {
        observable.target = this.dao.observable(what);
      } else {
        observable.target = null;
      }
      oldRespawn.call(observable, ...args);
    };
    this.observables.set(JSON.stringify(what), observable);
    return observable;
  }
  get(what) {
    return this.dao.get(what);
  }
  request(method, ...args) {
    return this.dao.request(method, ...args);
  }
  requestWithSettings(settings, method, ...args) {
    return this.dao.requestWithSettings(settings, method, ...args);
  }
  event(method, ...args) {
    return this.dao.request(method, ...args);
  }
  dispose() {
    for (let observable of this.observables.values()) {
      observable.dispose();
    }
    this.dao.dispose();
  }
}
var DaoProxy_1 = DaoProxy$2;
const EventEmitter = EventEmitter_1;
class CacheState {
  constructor(cache, what, settings) {
    this.cache = cache;
    this.what = what;
    this.settings = settings;
    this.cached = false;
    this.observerCount = 0;
    this.score = 0;
    this.scoreTime = Date.now();
    this.observable = null;
  }
  updateScore() {
    const minScore = this.minScore();
    if (this.score < minScore) {
      this.score = minScore;
      return;
    }
    const now = Date.now();
    const elapsedTime = now - this.scoreTime;
    this.scoreTime = now;
    let scoreOverMin = this.score - minScore;
    scoreOverMin = scoreOverMin * Math.pow(1 - this.settings.fadeFactor, 1e-3 * elapsedTime);
    this.score = minScore + scoreOverMin;
  }
  turnOff() {
    if (!this.cached)
      throw new Error("uncache of not cached");
    if (!this.observable)
      throw new Error("race condition");
    this.cached = false;
    this.cache.cachedCount--;
    const observable = this.observable;
    this.observable = null;
    observable.unobserve(this.cache.dummyObserver);
  }
  turnOn() {
    if (this.cached)
      throw new Error("already cached");
    if (this.observable)
      throw new Error("race condition");
    this.cached = true;
    this.cache.cachedCount++;
    this.cache.cache.push(this);
    this.observable = this.cache.observable(this.what);
    this.observable.observe(this.cache.dummyObserver);
    if (this.cache.cachedCount >= this.cache.settings.cacheSize)
      this.cache.clean();
  }
  updateCacheState() {
    if (this.score < this.settings.minScore) {
      if (this.cached) {
        this.turnOff();
      }
      return;
    }
    if (this.score > this.cache.cacheAddLevel) {
      if (!this.cached) {
        this.turnOn();
      }
    }
  }
  minScore() {
    const realObserversCount = this.cached ? this.observerCount - 1 : this.observerCount;
    const minScore = realObserversCount > 0 ? this.settings.firstObserverScore + (realObserversCount - 1) * this.settings.observerScore : 0;
    return minScore;
  }
  noticeSingleRead() {
    this.updateScore();
    this.score += this.settings.singleReadScore;
    this.updateCacheState();
  }
  setObserversCount(count, delta) {
    this.updateScore();
    this.observerCount = count;
    const minScore = this.minScore();
    if (this.score < minScore)
      this.score = minScore;
    if (delta > 0) {
      this.score += delta * this.settings.singleReadScore;
    }
    setTimeout(() => this.updateCacheState(), 0);
  }
}
const defaultSettings = {
  cacheSize: 1e3,
  cleanReductionFactor: 0.1,
  priority: 1,
  firstObserverScore: 1,
  observerScore: 0.2,
  singleReadScore: 0.5,
  fadeFactor: 0.1,
  minScore: 0.7,
  deleteStatsScore: 0.2,
  cleanInterval: 1e3,
  cacheAdaptationFactor: 0.5
};
class DaoCache$2 extends EventEmitter {
  constructor(dao2, settings = {}) {
    super();
    this.dao = dao2;
    this.settings = __spreadProps(__spreadValues(__spreadValues({}, defaultSettings), settings), {
      perObject: (what) => __spreadValues(__spreadValues({}, this.settings), settings.perObject ? settings.perObject(what) : "")
    });
    this.cacheAddLevel = this.settings.minScore;
    this.cacheState = new Map();
    this.cachedCount = 0;
    this.cache = [];
    this.hitsCounter = 0;
    this.missesCounter = 0;
    this.hitsPerMinute = 0;
    this.missesPerMinute = 0;
    this.statsInterval = setInterval(() => this.computeStats(), 60 * 1e3);
    this.onConnect = (...args) => this.emit("connect", ...args);
    this.onDisconnect = (...args) => this.emit("disconnect", ...args);
    this.interval = setInterval(() => this.clean(), this.settings.cleanInterval);
    this.dummyObserver = () => 0;
  }
  clear() {
    const now = Date.now();
    for (const cacheState of this.cache) {
      cacheState.score = 0;
      cacheState.scoreTime = now;
      if (cacheState.cached)
        cacheState.turnOff();
    }
    this.cache = [];
  }
  clean() {
    for (const cached of this.cache) {
      cached.updateScore();
    }
    this.cache.sort((a, b) => b.cached * b.score - a.cached * a.score);
    const newSize = this.settings.cacheSize * (1 - this.settings.cleanReductionFactor) | 0;
    const minScore = newSize < this.cache.length ? this.cache[newSize].score : this.settings.minScore;
    this.cacheAddLevel = this.settings.minScore + (minScore + this.settings.minScore) * this.settings.cacheAdaptationFactor;
    let deleteStart = Infinity;
    for (let i = 0; i < this.cache.length; i++) {
      const cacheState = this.cache[i];
      if (cacheState.score < cacheState.settings.minScore && i < deleteStart) {
        deleteStart = i;
      }
      if (i >= newSize)
        deleteStart = i;
      if (i >= deleteStart && cacheState.cached) {
        cacheState.turnOff();
      }
    }
    if (deleteStart != Infinity) {
      this.cache.length = deleteStart;
    }
    for (const [key, value] of this.cacheState.entries()) {
      if (value.score < value.settings.deleteStatsScore) {
        this.cacheState.delete(key);
      }
    }
  }
  getOrCreateCacheState(what) {
    const path = JSON.stringify(what);
    let cacheState = this.cacheState.get(path);
    if (!cacheState) {
      const settings = this.settings.perObject(what);
      if (settings === false)
        return false;
      cacheState = new CacheState(this, what, settings);
      this.cacheState.set(path, cacheState);
    }
    return cacheState;
  }
  noticeObserverCount(what, count, delta) {
    let cacheState = this.getOrCreateCacheState(what);
    if (!cacheState && delta <= 0)
      return;
    cacheState = this.getOrCreateCacheState(what);
    if (delta > 0) {
      if (cacheState.observable) {
        this.hitsCounter++;
      } else {
        this.missesCounter++;
      }
    }
    cacheState.setObserversCount(count, delta);
  }
  computeStats() {
    this.hitsPerMinute = this.hitsCounter;
    this.missesPerMinute = this.missesCounter;
    this.hitsCounter = 0;
    this.missesCounter = 0;
    console.log(`CACHE STATS hit rate ${this.hitsPerMinute / (this.hitsPerMinute + this.missesPerMinute) * 100}%
  hits=${this.hitsPerMinute} misses=${this.missesPerMinute} cacheSize=${this.cachedCount} stats=${this.cacheState.size}`);
  }
  observable(what) {
    const observable = this.dao.observable(what);
    const oldObserve = observable.observe;
    const oldUnobserve = observable.unobserve;
    observable.observe = (...args) => {
      oldObserve.apply(observable, args);
      this.noticeObserverCount(what, observable.useCount(), 1);
    };
    observable.unobserve = (...args) => {
      oldUnobserve.apply(observable, args);
      this.noticeObserverCount(what, observable.useCount(), 0);
    };
    return observable;
  }
  get(what) {
    const cacheState = this.getOrCreateCacheState(what);
    if (cacheState) {
      cacheState.noticeSingleRead();
      if (cacheState.observable) {
        const value = cacheState.observable.getValue();
        this.hitsCounter++;
        if (value !== void 0)
          return value;
      }
      this.missesCounter++;
    }
    return this.dao.get(what);
  }
  request(method, ...args) {
    return this.dao.request(method, ...args);
  }
  requestWithSettings(settings, method, ...args) {
    return this.dao.requestWithSettings(settings, method, ...args);
  }
  event(method, ...args) {
    return this.dao.request(method, ...args);
  }
  dispose() {
    clear();
    clearInterval(this.interval);
    this.dao.dispose();
  }
}
var DaoCache_1 = DaoCache$2;
function sourceProxy(to) {
  const proxy = new Proxy({
    $toPath() {
      return to;
    },
    $nonEmpty() {
      return sourceProxy({ nonEmpty: to });
    }
  }, {
    get(target, name) {
      if (name[0] == "$") {
        return target[name];
      } else {
        if (to && to.property)
          return sourceProxy({
            property: [...Array.isArray(to.property) ? to.property : [to.property], name]
          });
        return sourceProxy({ property: name });
      }
    }
  });
  return proxy;
}
function resolve(schema) {
  if (Array.isArray(schema)) {
    return schema.map(resolve);
  }
  if (typeof schema == "object") {
    if (schema.$toPath)
      return schema.$toPath();
    const out = {};
    for (const key in schema)
      out[key] = resolve(schema[key]);
    return out;
  }
  return schema;
}
class Path$2 {
  constructor(what, more = void 0, to = void 0) {
    this.what = what;
    this.more = more;
    this.to = to;
  }
  with(...funcs) {
    let newMore = this.more ? this.more.slice() : [];
    for (const func of funcs) {
      const source = sourceProxy();
      const fetchObject = func(source);
      const path = fetchObject.what.slice(0, -1);
      const params = fetchObject.what[fetchObject.what.length - 1];
      let processedParams = {};
      for (const key in params) {
        const param = params[key];
        const resolvedParam = resolve(param);
        processedParams[key] = resolvedParam;
      }
      const more = {
        schema: [[...path, { object: processedParams }]],
        more: fetchObject.more,
        to: fetchObject.to
      };
      newMore.push(more);
    }
    return new Path$2(this.what, newMore);
  }
  get(func) {
    const source = sourceProxy();
    const outputObject = func(source);
    return {
      source: this.what,
      schema: resolve(outputObject)
    };
  }
  bind(to) {
    return new Path$2(this.what, this.more, to);
  }
}
var Path_1 = Path$2;
const Dao = Dao$2.exports;
Dao.Dao = Dao;
const Observable = Observable_1;
Dao.Observable = Observable;
const ObservableValue = ObservableValue_1;
Dao.ObservableValue = ObservableValue;
const ObservableList = ObservableList_1;
Dao.ObservableList = ObservableList;
const ExtendedObservableList = ExtendedObservableList_1;
Dao.ExtendedObservableList = ExtendedObservableList;
const ReactiveServer = ReactiveServer_1;
Dao.ReactiveServer = ReactiveServer;
const DaoPrerenderCache$1 = DaoPrerenderCache_1;
Dao.DaoPrerenderCache = DaoPrerenderCache$1;
Dao.ReactiveCache = DaoPrerenderCache$1;
const ReactiveConnection = ReactiveConnection$1;
Dao.ReactiveConnection = ReactiveConnection;
const LoopbackConnection = LoopbackConnection_1;
Dao.LoopbackConnection = LoopbackConnection;
const SimpleDao = SimpleDao_1;
Dao.SimpleDao = SimpleDao;
const ObservableProxy = ObservableProxy_1;
Dao.ObservableProxy = ObservableProxy;
const ObservablePromiseProxy = ObservablePromiseProxy_1;
Dao.ObservablePromiseProxy = ObservablePromiseProxy;
const ObservableError = ObservableError_1;
Dao.ObservableError = ObservableError;
const ConnectionMonitorPinger = ConnectionMonitorPinger_1;
Dao.ConnectionMonitorPinger = ConnectionMonitorPinger;
const ConnectionMonitorPingReceiver = ConnectionMonitorPingReceiver_1;
Dao.ConnectionMonitorPingReceiver = ConnectionMonitorPingReceiver;
const TimeSynchronization = TimeSynchronization_1;
Dao.TimeSynchronization = TimeSynchronization;
const DaoProxy$1 = DaoProxy_1;
Dao.ReactiveDaoProxy = DaoProxy$1;
Dao.DaoProxy = DaoProxy$1;
const DaoCache$1 = DaoCache_1;
Dao.DaoCache = DaoCache$1;
const Path$1 = Path_1;
Dao.Path = Path$1;
const collectPointers = collectPointers_1;
Dao.collectPointers = collectPointers;
Dao.global = Dao;
var dao = Dao;
class ReactiveObservableList extends dao.ObservableList {
  constructor(value, what, dispose2) {
    super(value, what, dispose2, (data) => {
      if (data && typeof data == "object") {
        const activated = reactive(data);
        return activated;
      }
      return data;
    });
  }
}
const ReactiveDaoVue = {
  install(Vue, options) {
    if (!options || !options.dao)
      throw new Error("dao option required");
    const dao2 = options.dao;
    Vue.mixin(reactiveMixin(dao2));
    Vue.mixin(reactivePrefetchMixin(dao2));
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
var _imports_0 = "/images/logo.svg";
var _imports_1 = "/images/empty-user-photo.svg";
const _hoisted_1$2 = {
  class: "surface-overlay py-3 px-6 shadow-2 flex align-items-center justify-content-between relative lg:static",
  style: { "min-height": "80px" },
  key: "navbar"
};
const _hoisted_2$2 = /* @__PURE__ */ createBaseVNode("img", {
  src: _imports_0,
  alt: "Image",
  height: "40",
  class: "mr-0 lg:mr-6"
}, null, -1);
const _hoisted_3 = { class: "cursor-pointer block lg:hidden text-700 p-ripple" };
const _hoisted_4 = /* @__PURE__ */ createBaseVNode("i", { class: "pi pi-bars text-4xl" }, null, -1);
const _hoisted_5 = [
  _hoisted_4
];
const _hoisted_6 = { class: "align-items-center flex-grow-1 justify-content-between hidden lg:flex absolute lg:static w-full surface-overlay left-0 top-100 z-1 shadow-2 lg:shadow-none" };
const _hoisted_7 = { class: "list-none p-0 m-0 flex lg:align-items-center select-none flex-column lg:flex-row" };
const _hoisted_8 = { class: "flex px-6 p-3 lg:px-3 lg:py-2 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple" };
const _hoisted_9 = /* @__PURE__ */ createBaseVNode("i", { class: "pi pi-home mr-2" }, null, -1);
const _hoisted_10 = /* @__PURE__ */ createBaseVNode("span", null, "Home", -1);
const _hoisted_11 = [
  _hoisted_9,
  _hoisted_10
];
const _hoisted_12 = { class: "lg:relative" };
const _hoisted_13 = { class: "flex px-6 p-3 lg:px-3 lg:py-2 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple" };
const _hoisted_14 = /* @__PURE__ */ createBaseVNode("i", { class: "pi pi-users mr-2" }, null, -1);
const _hoisted_15 = /* @__PURE__ */ createBaseVNode("span", null, "Customers", -1);
const _hoisted_16 = /* @__PURE__ */ createBaseVNode("i", { class: "pi pi-angle-down ml-auto lg:ml-3" }, null, -1);
const _hoisted_17 = [
  _hoisted_14,
  _hoisted_15,
  _hoisted_16
];
const _hoisted_18 = { class: "list-none py-3 px-6 m-0 lg:px-0 lg:py-0 border-round shadow-0 lg:shadow-2 lg:border-1 border-50 lg:absolute surface-overlay hidden origin-top w-full lg:w-15rem cursor-pointer" };
const _hoisted_19 = { class: "flex p-3 align-items-center text-600 hover:text-900 hover:surface-100 transition-colors transition-duration-150 p-ripple" };
const _hoisted_20 = /* @__PURE__ */ createBaseVNode("i", { class: "pi pi-user-plus mr-2" }, null, -1);
const _hoisted_21 = /* @__PURE__ */ createBaseVNode("span", { class: "font-medium" }, "Add New", -1);
const _hoisted_22 = [
  _hoisted_20,
  _hoisted_21
];
const _hoisted_23 = { class: "relative" };
const _hoisted_24 = { class: "flex p-3 align-items-center text-600 hover:text-900 hover:surface-100 transition-colors transition-duration-150 p-ripple" };
const _hoisted_25 = /* @__PURE__ */ createBaseVNode("i", { class: "pi pi-search mr-2" }, null, -1);
const _hoisted_26 = /* @__PURE__ */ createBaseVNode("span", { class: "font-medium" }, "Search", -1);
const _hoisted_27 = /* @__PURE__ */ createBaseVNode("i", { class: "pi pi-angle-down ml-auto lg:-rotate-90" }, null, -1);
const _hoisted_28 = [
  _hoisted_25,
  _hoisted_26,
  _hoisted_27
];
const _hoisted_29 = { class: "list-none py-3 pl-3 m-0 lg:px-0 lg:py-0 border-round shadow-0 lg:shadow-2 lg:border-1 border-50 lg:absolute surface-overlay hidden origin-top w-full lg:w-15rem cursor-pointer left-100 top-0" };
const _hoisted_30 = { class: "flex p-3 align-items-center text-600 hover:text-900 hover:surface-100 transition-colors transition-duration-150 p-ripple" };
const _hoisted_31 = /* @__PURE__ */ createBaseVNode("i", { class: "pi pi-shopping-cart mr-2" }, null, -1);
const _hoisted_32 = /* @__PURE__ */ createBaseVNode("span", { class: "font-medium" }, "Purchases", -1);
const _hoisted_33 = [
  _hoisted_31,
  _hoisted_32
];
const _hoisted_34 = { class: "relative" };
const _hoisted_35 = { class: "flex p-3 align-items-center text-600 hover:text-900 hover:surface-100 transition-colors transition-duration-150 p-ripple" };
const _hoisted_36 = /* @__PURE__ */ createBaseVNode("i", { class: "pi pi-comments mr-2" }, null, -1);
const _hoisted_37 = /* @__PURE__ */ createBaseVNode("span", { class: "font-medium" }, "Messages", -1);
const _hoisted_38 = [
  _hoisted_36,
  _hoisted_37
];
const _hoisted_39 = { class: "flex px-6 p-3 lg:px-3 lg:py-2 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple" };
const _hoisted_40 = /* @__PURE__ */ createBaseVNode("i", { class: "pi pi-calendar mr-2" }, null, -1);
const _hoisted_41 = /* @__PURE__ */ createBaseVNode("span", null, "Calendar", -1);
const _hoisted_42 = [
  _hoisted_40,
  _hoisted_41
];
const _hoisted_43 = { class: "flex px-6 p-3 lg:px-3 lg:py-2 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple" };
const _hoisted_44 = /* @__PURE__ */ createBaseVNode("i", { class: "pi pi-chart-line mr-2" }, null, -1);
const _hoisted_45 = /* @__PURE__ */ createBaseVNode("span", null, "Stats", -1);
const _hoisted_46 = [
  _hoisted_44,
  _hoisted_45
];
const _hoisted_47 = { class: "list-none p-0 m-0 flex lg:align-items-center select-none flex-column lg:flex-row border-top-1 surface-border lg:border-top-none" };
const _hoisted_48 = { class: "flex px-6 p-3 lg:px-3 lg:py-2 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple" };
const _hoisted_49 = /* @__PURE__ */ createBaseVNode("i", { class: "pi pi-inbox text-base lg:text-2xl mr-2 lg:mr-0" }, null, -1);
const _hoisted_50 = /* @__PURE__ */ createBaseVNode("span", { class: "block lg:hidden font-medium" }, "Inbox", -1);
const _hoisted_51 = [
  _hoisted_49,
  _hoisted_50
];
const _hoisted_52 = { class: "flex px-6 p-3 lg:px-3 lg:py-3 align-items-center text-600 hover:text-900 hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple" };
const _hoisted_53 = { class: "pi pi-bell text-base lg:text-2xl mr-2 lg:mr-0 p-overlay-badge" };
const _hoisted_54 = /* @__PURE__ */ createBaseVNode("span", { class: "block lg:hidden font-medium" }, "Notifications", -1);
const _hoisted_55 = { class: "border-top-1 surface-border lg:border-top-none" };
const _hoisted_56 = { class: "flex px-6 p-3 lg:px-3 lg:py-2 align-items-center hover:surface-100 font-medium border-round cursor-pointer transition-colors transition-duration-150 p-ripple" };
const _hoisted_57 = /* @__PURE__ */ createBaseVNode("img", {
  src: _imports_1,
  class: "mr-3 lg:mr-0 border-circle",
  style: { "width": "28px", "height": "28px" }
}, null, -1);
const _hoisted_58 = /* @__PURE__ */ createBaseVNode("div", { class: "block lg:hidden" }, [
  /* @__PURE__ */ createBaseVNode("div", { class: "text-900 font-medium" }, "Josephine Lillard"),
  /* @__PURE__ */ createBaseVNode("span", { class: "text-600 font-medium text-sm" }, "Marketing Specialist")
], -1);
const _hoisted_59 = [
  _hoisted_57,
  _hoisted_58
];
const _sfc_main$2 = {
  setup(__props) {
    return (_ctx, _cache) => {
      const _directive_ripple = resolveDirective("ripple");
      const _directive_styleclass = resolveDirective("styleclass");
      return openBlock(), createElementBlock("div", _hoisted_1$2, [
        _hoisted_2$2,
        withDirectives(createBaseVNode("a", _hoisted_3, _hoisted_5, 512), [
          [_directive_ripple],
          [_directive_styleclass, { selector: "@next", enterClass: "hidden", leaveToClass: "hidden", hideOnOutsideClick: true }]
        ]),
        createBaseVNode("div", _hoisted_6, [
          createBaseVNode("ul", _hoisted_7, [
            createBaseVNode("li", null, [
              withDirectives(createBaseVNode("a", _hoisted_8, _hoisted_11, 512), [
                [_directive_ripple]
              ])
            ]),
            createBaseVNode("li", _hoisted_12, [
              withDirectives(createBaseVNode("a", _hoisted_13, _hoisted_17, 512), [
                [_directive_ripple],
                [_directive_styleclass, { selector: "@next", enterClass: "hidden", enterActiveClass: "scalein", leaveToClass: "hidden", leaveActiveClass: "fadeout", hideOnOutsideClick: true }]
              ]),
              createBaseVNode("ul", _hoisted_18, [
                createBaseVNode("li", null, [
                  withDirectives(createBaseVNode("a", _hoisted_19, _hoisted_22, 512), [
                    [_directive_ripple]
                  ])
                ]),
                createBaseVNode("li", _hoisted_23, [
                  withDirectives(createBaseVNode("a", _hoisted_24, _hoisted_28, 512), [
                    [_directive_ripple],
                    [_directive_styleclass, { selector: "@next", enterClass: "hidden", enterActiveClass: "scalein", leaveToClass: "hidden", leaveActiveClass: "fadeout", hideOnOutsideClick: true }]
                  ]),
                  createBaseVNode("ul", _hoisted_29, [
                    createBaseVNode("li", null, [
                      withDirectives(createBaseVNode("a", _hoisted_30, _hoisted_33, 512), [
                        [_directive_ripple]
                      ])
                    ]),
                    createBaseVNode("li", _hoisted_34, [
                      withDirectives(createBaseVNode("a", _hoisted_35, _hoisted_38, 512), [
                        [_directive_ripple]
                      ])
                    ])
                  ])
                ])
              ])
            ]),
            createBaseVNode("li", null, [
              withDirectives(createBaseVNode("a", _hoisted_39, _hoisted_42, 512), [
                [_directive_ripple]
              ])
            ]),
            createBaseVNode("li", null, [
              withDirectives(createBaseVNode("a", _hoisted_43, _hoisted_46, 512), [
                [_directive_ripple]
              ])
            ])
          ]),
          createBaseVNode("ul", _hoisted_47, [
            createBaseVNode("li", null, [
              withDirectives(createBaseVNode("a", _hoisted_48, _hoisted_51, 512), [
                [_directive_ripple]
              ])
            ]),
            createBaseVNode("li", null, [
              withDirectives(createBaseVNode("a", _hoisted_52, [
                createBaseVNode("i", _hoisted_53, [
                  createVNode(unref(script), { value: "2" })
                ]),
                _hoisted_54
              ], 512), [
                [_directive_ripple]
              ])
            ]),
            createBaseVNode("li", _hoisted_55, [
              withDirectives(createBaseVNode("a", _hoisted_56, _hoisted_59, 512), [
                [_directive_ripple]
              ])
            ])
          ])
        ])
      ]);
    };
  }
};
const _hoisted_1$1 = { class: "min-h-screen flex flex-column surface-ground" };
const _hoisted_2$1 = { class: "p-5 flex flex-column flex-auto align-items-center" };
const _sfc_main$1 = {
  setup(__props) {
    console.log("SETUP PAGE!!!");
    return (_ctx, _cache) => {
      return openBlock(), createElementBlock("div", _hoisted_1$1, [
        createVNode(_sfc_main$2),
        createBaseVNode("div", _hoisted_2$1, [
          renderSlot(_ctx.$slots, "default")
        ])
      ]);
    };
  }
};
const isClientSide = ref(false);
var App_vue_vue_type_style_index_0_lang = "\nbody {\n    margin: 0;\n    height: 100%;\n    overflow-x: hidden;\n    overflow-y: auto;\n    background-color: var(--surface-a);\n    font-family: var(--font-family);\n    font-weight: 400;\n    color: var(--text-color);\n}\n";
const _hoisted_1 = /* @__PURE__ */ createBaseVNode("div", { class: "loading" }, "Loading! Please wait!", -1);
const _hoisted_2 = /* @__PURE__ */ createBaseVNode("div", { class: "loading" }, "Working! Please wait!", -1);
const _sfc_main = {
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
    onMounted(() => isClientSide.value = true);
    return (_ctx, _cache) => {
      const _component_working_zone = resolveComponent("working-zone");
      const _component_loading_zone = resolveComponent("loading-zone");
      const _component_router_view = resolveComponent("router-view");
      return openBlock(), createBlock(_component_router_view, null, {
        default: withCtx(({ route, Component }) => {
          var _a;
          return [
            ((_a = route == null ? void 0 : route.meta) == null ? void 0 : _a.raw) ? (openBlock(), createBlock(resolveDynamicComponent(Component), { key: 0 })) : (openBlock(), createBlock(_component_loading_zone, {
              key: 1,
              suspense: ""
            }, {
              loading: withCtx(() => [
                _hoisted_1
              ]),
              default: withCtx(() => [
                createVNode(_sfc_main$1, null, {
                  default: withCtx(() => [
                    createVNode(_component_working_zone, null, {
                      working: withCtx(() => [
                        _hoisted_2
                      ]),
                      default: withCtx(() => [
                        (openBlock(), createBlock(resolveDynamicComponent(Component)))
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
        }),
        _: 1
      });
    };
  }
};
const scriptRel = "modulepreload";
const seen = {};
const base = "/";
const __vitePreload = function preload(baseModule, deps) {
  if (!deps || deps.length === 0) {
    return baseModule();
  }
  return Promise.all(deps.map((dep) => {
    dep = `${base}${dep}`;
    if (dep in seen)
      return;
    seen[dep] = true;
    const isCss = dep.endsWith(".css");
    const cssSelector = isCss ? '[rel="stylesheet"]' : "";
    if (document.querySelector(`link[href="${dep}"]${cssSelector}`)) {
      return;
    }
    const link = document.createElement("link");
    link.rel = isCss ? "stylesheet" : scriptRel;
    if (!isCss) {
      link.as = "script";
      link.crossOrigin = "";
    }
    link.href = dep;
    document.head.appendChild(link);
    if (isCss) {
      return new Promise((res, rej) => {
        link.addEventListener("load", res);
        link.addEventListener("error", rej);
      });
    }
  })).then(() => baseModule());
};
function routes(config = {}) {
  const { prefix: prefix2 = "", route = (r) => r } = config;
  return [
    route({
      name: "user:sent",
      path: prefix2 + "/sent/:message",
      props: true,
      component: () => __vitePreload(() => import("./MessageSent.ff26f715.js"), true ? ["assets/MessageSent.ff26f715.js","assets/vendor.e995dee7.js","assets/button.esm.d105ba0e.js"] : void 0)
    }),
    route({
      name: "user:link",
      path: prefix2 + "/link/:key",
      props: true,
      component: () => __vitePreload(() => import("./MessageLink.bf7b4131.js"), true ? ["assets/MessageLink.bf7b4131.js","assets/button.esm.d105ba0e.js","assets/vendor.e995dee7.js"] : void 0)
    }),
    route({
      name: "user:email",
      path: prefix2 + "/_email/:action/:contact/:data",
      props: true,
      meta: { raw: true },
      component: () => __vitePreload(() => import("./MessageEmail.d82cf70c.js"), true ? ["assets/MessageEmail.d82cf70c.js","assets/MessageEmail.d407fd03.css","assets/button.esm.d105ba0e.js","assets/vendor.e995dee7.js"] : void 0)
    }),
    route({
      name: "user:signIn",
      path: prefix2 + "/sign-in",
      component: () => __vitePreload(() => import("./SignIn.a17b2c45.js"), true ? ["assets/SignIn.a17b2c45.js","assets/divider.esm.3d885e30.js","assets/vendor.e995dee7.js","assets/button.esm.d105ba0e.js","assets/password.esm.c83b8514.js"] : void 0)
    }),
    route({
      name: "user:signInFinished",
      path: prefix2 + "/sign-in-finished",
      component: () => __vitePreload(() => import("./SignInFinished.48c76b7a.js"), true ? ["assets/SignInFinished.48c76b7a.js","assets/vendor.e995dee7.js"] : void 0)
    }),
    route({
      name: "user:signUp",
      path: prefix2 + "/sign-up",
      component: () => __vitePreload(() => import("./SignUp.432c3335.js"), true ? ["assets/SignUp.432c3335.js","assets/divider.esm.3d885e30.js","assets/vendor.e995dee7.js","assets/button.esm.d105ba0e.js"] : void 0)
    }),
    route({
      name: "user:signUpFinished",
      path: prefix2 + "/sign-up-finished",
      component: () => __vitePreload(() => import("./SignUpFinished.49297683.js"), true ? ["assets/SignUpFinished.49297683.js","assets/vendor.e995dee7.js"] : void 0)
    }),
    route({
      name: "user:resetPassword",
      path: prefix2 + "/reset-password",
      component: () => __vitePreload(() => import("./ResetPassword.e863c000.js"), true ? ["assets/ResetPassword.e863c000.js","assets/divider.esm.3d885e30.js","assets/vendor.e995dee7.js","assets/button.esm.d105ba0e.js"] : void 0)
    }),
    route({
      name: "user:resetPasswordForm",
      path: prefix2 + "/set-new-password",
      component: () => __vitePreload(() => import("./ResetPasswordForm.853d735d.js"), true ? ["assets/ResetPasswordForm.853d735d.js","assets/divider.esm.3d885e30.js","assets/vendor.e995dee7.js","assets/button.esm.d105ba0e.js","assets/password.esm.c83b8514.js"] : void 0)
    }),
    route({
      name: "user:resetPasswordFinished",
      path: prefix2 + "/reset-password-finished",
      component: () => __vitePreload(() => import("./ResetPasswordFinished.323d58f6.js"), true ? ["assets/ResetPasswordFinished.323d58f6.js","assets/vendor.e995dee7.js"] : void 0)
    }),
    route({
      name: "user:changePassword",
      path: prefix2 + "/change-password",
      component: () => __vitePreload(() => import("./ChangePassword.49f6107c.js"), true ? ["assets/ChangePassword.49f6107c.js","assets/divider.esm.3d885e30.js","assets/vendor.e995dee7.js","assets/button.esm.d105ba0e.js","assets/password.esm.c83b8514.js","assets/SettingsTabs.44422c5d.js"] : void 0)
    }),
    route({
      name: "user:changePasswordFinished",
      path: prefix2 + "/change-password-finished",
      component: () => __vitePreload(() => import("./ChangePassword.49f6107c.js"), true ? ["assets/ChangePassword.49f6107c.js","assets/divider.esm.3d885e30.js","assets/vendor.e995dee7.js","assets/button.esm.d105ba0e.js","assets/password.esm.c83b8514.js","assets/SettingsTabs.44422c5d.js"] : void 0)
    }),
    route({
      name: "user:connectedAccounts",
      path: prefix2 + "/connected-accounts",
      component: () => __vitePreload(() => import("./ConnectedAccounts.a795a76e.js"), true ? ["assets/ConnectedAccounts.a795a76e.js","assets/button.esm.d105ba0e.js","assets/vendor.e995dee7.js","assets/SettingsTabs.44422c5d.js"] : void 0)
    }),
    route({
      name: "user:connectAccount",
      path: prefix2 + "/connect-account",
      component: () => __vitePreload(() => import("./ConnectAccount.c2fda5f7.js"), true ? ["assets/ConnectAccount.c2fda5f7.js","assets/divider.esm.3d885e30.js","assets/vendor.e995dee7.js","assets/button.esm.d105ba0e.js"] : void 0)
    }),
    route({
      name: "user:connectAccountFinished",
      path: prefix2 + "/account-connected",
      component: () => __vitePreload(() => import("./ConnectAccountFinished.1168da8d.js"), true ? ["assets/ConnectAccountFinished.1168da8d.js","assets/vendor.e995dee7.js"] : void 0)
    }),
    route({
      name: "user:deleteAccount",
      path: prefix2 + "/delete-account",
      component: () => __vitePreload(() => import("./DeleteAccount.2e83f495.js"), true ? ["assets/DeleteAccount.2e83f495.js","assets/divider.esm.3d885e30.js","assets/vendor.e995dee7.js","assets/button.esm.d105ba0e.js"] : void 0)
    }),
    route({
      name: "user:deleteAccountFinished",
      path: prefix2 + "/account-deleted",
      component: () => __vitePreload(() => import("./DeleteAccountFinished.3b7b073a.js"), true ? ["assets/DeleteAccountFinished.3b7b073a.js","assets/divider.esm.3d885e30.js","assets/vendor.e995dee7.js","assets/button.esm.d105ba0e.js"] : void 0)
    }),
    route({
      name: "user:deleteAccountFeedbackSent",
      path: prefix2 + "/account-deleted-feedback-sent",
      component: () => __vitePreload(() => import("./DeleteAccountFeedbackSent.155540c9.js"), true ? ["assets/DeleteAccountFeedbackSent.155540c9.js","assets/vendor.e995dee7.js"] : void 0)
    })
  ];
}
function createRouter(config) {
  const router2 = createRouter$1({
    history: createWebHistory(),
    routes: routes(config)
  });
  return router2;
}
var emailValidator = (settings) => (email) => {
  if (!email || !email.trim())
    return;
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (!re.test(String(email).toLowerCase()))
    return "wrongEmail";
};
function createApp(api2) {
  api2.validators.email = emailValidator;
  const app2 = createSSRApp(_sfc_main);
  app2.config.devtools = true;
  api2.installInstanceProperties(app2.config.globalProperties);
  registerComponents(app2);
  app2.use(ReactiveDaoVue, { dao: api2 });
  const router2 = createRouter();
  app2.use(router2);
  app2.use(PrimeVue, {
    ripple: true
  });
  app2.use(ConfirmationService);
  app2.provide(PrimeVueConfirmSymbol, app2.config.globalProperties.$confirm);
  app2.use(ToastService);
  app2.provide(PrimeVueToastSymbol, app2.config.globalProperties.$toast);
  app2.directive("styleclass", StyleClass);
  app2.directive("ripple", Ripple);
  app2.directive("badge", BadgeDirective);
  const meta = createMetaManager({
    isSSR: false
  });
  app2.use(meta);
  return { app: app2, router: router2 };
}
function nonEmpty(value) {
  if (!value)
    return "empty";
  if (typeof value == "string") {
    if (!value.trim())
      return "empty";
  }
  if (Array.isArray(value)) {
    if (value.length == 0)
      return "empty";
  } else if (value instanceof Date) {
    return;
  }
  if (typeof value == "object") {
    if (Object.keys(value).length == 0)
      return "empty";
  }
}
nonEmpty.isRequired = () => true;
let validators$1 = {
  nonEmpty: (settings) => nonEmpty,
  minLength: ({ length }) => (value) => value.length < length ? "tooShort" : void 0,
  maxLength: ({ length }) => (value) => value.length > length ? "tooLong" : void 0,
  elementsNonEmpty: (settings) => (value) => {
    if (!value)
      return;
    for (let el of value) {
      if (nonEmpty(el))
        return "someEmpty";
    }
  },
  minTextLength: ({ length }) => (value) => typeof value == "string" && value.replace(/<[^>]*>/g, "").length < length ? "tooShort" : void 0,
  maxTextLength: ({ length }) => (value) => value && value.replace(/<[^>]*>/g, "").length > length ? "tooLong" : void 0,
  nonEmptyText: (settings) => (value) => {
    if (!value)
      return "empty";
    if (typeof value != "string")
      return "empty";
    value = value.replace(/<[^>]*>/g, "");
    if (!value.trim())
      return "empty";
  },
  ifEq: ({ prop, to, then }, { getValidator }) => {
    then.map(getValidator);
    return;
  }
};
var validators_1 = validators$1;
const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
function decodeCharacter(c) {
  if (c < "A")
    return c.charCodeAt(0) - 48;
  if (c < "a")
    return c.charCodeAt(0) - 65 + 10;
  return c.charCodeAt(0) - 97 + 36;
}
function encodeNumber$1(number) {
  let out = "";
  let n = number;
  do {
    out = characters[n % characters.length] + out;
    n = n / characters.length | 0;
  } while (n > 0);
  return out;
}
function decodeNumber(str) {
  let out = 0;
  let factor = 1;
  for (let i = str.length - 1; i >= 0; i--) {
    out += decodeCharacter(str[i]) * factor;
    factor *= characters.length;
  }
  return out;
}
function encodeDate(date = new Date()) {
  return "" + encodeNumber$1(date.getUTCFullYear()).padStart(2, "0") + characters[date.getUTCMonth() + 1] + characters[date.getUTCDate()] + characters[date.getUTCHours()] + characters[date.getUTCMinutes()] + characters[date.getUTCSeconds()] + characters[date.getUTCMilliseconds() / 60 | 0] + characters[date.getUTCMilliseconds() % 60];
}
function decodeDate(str = encodeDate(new Date())) {
  const date = new Date();
  date.setUTCFullYear(decodeNumber(str.slice(0, 2)));
  date.setUTCMonth(decodeCharacter(str[2]) - 1);
  date.setUTCDate(decodeCharacter(str[3]));
  date.setUTCHours(decodeCharacter(str[4]));
  date.setUTCMinutes(decodeCharacter(str[5]));
  date.setUTCSeconds(decodeCharacter(str[6]));
  date.setUTCMilliseconds(decodeCharacter(str[7]) * 60 + decodeCharacter(str[7]));
  return date;
}
function randomString(length = 8) {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += characters[Math.random() * characters.length | 0];
  }
  return out;
}
function hashCode$1(str) {
  let hash = 0;
  if (str.length == 0)
    return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash | 0;
  }
  return Math.abs(hash);
}
function uidGenerator$1(fingerprint = randomString(4), numberLength = 0) {
  let lastMillisecond = Date.now(), lastId = 0;
  function next() {
    const date = new Date();
    const now = date.getTime();
    if (now == lastMillisecond) {
      lastId++;
    } else {
      lastId = 0;
      lastMillisecond = now;
    }
    return "{" + encodeDate(date) + "." + encodeNumber$1(lastId).padStart(numberLength, "0") + "@" + fingerprint + "}";
  }
  return next;
}
function decodeUid(uid2) {
  const dotIndex = uid2.indexOf(".");
  const atIndex = uid2.indexOf("@");
  const date = decodeDate(uid2.slice(1, dotIndex));
  const number = decodeNumber(uid2.slice(dotIndex + 1, atIndex));
  const at = uid2.slice(atIndex + 1, -1);
  return { date, number, at };
}
function verifyUidSource(uid2, source) {
  const { at } = decodeUid(uid2);
  return at.slice(0, source.length) == source;
}
var uid = {
  encodeDate,
  decodeDate,
  encodeNumber: encodeNumber$1,
  hashCode: hashCode$1,
  randomString,
  uidGenerator: uidGenerator$1,
  decodeUid,
  verifyUidSource
};
const { DaoProxy, DaoPrerenderCache, DaoCache, Path } = dao;
const validators = validators_1;
const { hashCode, encodeNumber, uidGenerator } = uid;
function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
  }
  return s4() + s4() + "-" + s4() + "-" + s4() + "-" + s4() + "-" + s4() + s4() + s4();
}
class Api$1 extends DaoProxy {
  constructor(source, settings = {}) {
    super();
    this.source = source;
    this.settings = settings;
    this.uidGenerator = () => {
      throw new Error("uid generator not initialized yet");
    };
    this.createReactiveObject = this.settings.createReactiveObject;
    this.preFetchComponents = [];
    this.afterPreFetch = [];
    this.validators = validators;
    this.globals = {
      $validators: validators
    };
    this.globalInstances = [];
  }
  setup(settings = this.settings) {
    this.settings = settings;
    this.createReactiveObject = this.settings.createReactiveObject;
    this.setupCaches();
    this.setupMetadata();
  }
  guid() {
    return guid();
  }
  setupCaches() {
    let dao2 = this.source;
    if (this.settings.cache) {
      const cacheSettings = typeof this.settings.cache == "object" ? this.settings.cache : {};
      this.dataCache = new DaoCache(dao2, cacheSettings);
      dao2 = this.dataCache;
    }
    if (this.settings.ssr) {
      this.prerenderCache = new DaoPrerenderCache(dao2);
      dao2 = this.prerenderCache;
      if (typeof window == "undefined") {
        this.prerenderCache.mode = "save";
      } else {
        this.prerenderCache.mode = "load";
        this.prerenderCache.setCache(window[this.settings.ssrCacheGlobal || "__DAO_CACHE__"]);
      }
    }
    this.setDao(dao2);
  }
  setupMetadata() {
    const api2 = this;
    api2.metadata = this.settings.createReactiveObject({
      reactive: {
        api: ["metadata", "api"],
        version: ["version", "version"]
      },
      computed: {
        softwareVersion() {
          if (typeof window == "undefined")
            return;
          return window[api2.settings.ssrVersionGlobal || "__VERSION__"];
        },
        apiVersion() {
          return this.version;
        },
        versionMismatch() {
          const software = this.softwareVersion;
          const api3 = this.apiVersion;
          if (!api3)
            return;
          if (!software)
            return;
          return api3 != software;
        },
        client() {
          return this.api.client;
        }
      },
      reactivePreFetch() {
        return [
          { what: ["metadata", "api"] }
        ];
      },
      watch: {
        api(api3) {
          if (!api3)
            return;
          api3.generateServicesApi();
        }
      }
    });
    this.preFetchComponents.push(api2.metadata);
    this.afterPreFetch.push(() => api2.generateServicesApi());
  }
  generateServicesApi() {
    const api2 = this;
    let apiInfo = api2.metadata.api;
    if (!apiInfo) {
      const cachePath = '["metadata","api"]';
      if (typeof window != "undefined") {
        const ssrCache = window[this.settings.ssrCacheGlobal || "__DAO_CACHE__"];
        if (ssrCache) {
          for (const [daoPath, value] of ssrCache) {
            if (daoPath == cachePath)
              apiInfo = value;
          }
        }
      } else {
        apiInfo = this.prerenderCache.cache.get(cachePath);
      }
    }
    console.log("GENERATE SERVICES API", apiInfo);
    const definitions = apiInfo == null ? void 0 : apiInfo.services;
    if (JSON.stringify(definitions) == JSON.stringify(api2.servicesApiDefinitions))
      return;
    if (!definitions)
      throw new Error("API DEFINITIONS NOT FOUND! UNABLE TO GENERATE API!");
    api2.uidGenerator = uidGenerator(apiInfo.client.user || apiInfo.client.session.slice(0, 16), 1);
    api2.servicesApiDefinitions = definitions;
    let globalViews = {};
    let globalFetch = (...args) => new Path(...args);
    let globalActions = {};
    for (const serviceDefinition of definitions) {
      let views = {};
      globalViews[serviceDefinition.name] = views;
      for (const viewName in serviceDefinition.views) {
        views[viewName] = (params) => [serviceDefinition.name, viewName, params];
        views[viewName].definition = serviceDefinition.views[viewName];
      }
      let fetch2 = {};
      globalFetch[serviceDefinition.name] = fetch2;
      for (const viewName in serviceDefinition.views) {
        fetch2[viewName] = (params) => new Path([serviceDefinition.name, viewName, params]);
        fetch2[viewName].definition = serviceDefinition.views[viewName];
      }
      let actions = {};
      globalActions[serviceDefinition.name] = actions;
      for (const actionName in serviceDefinition.actions) {
        actions[actionName] = (params) => api2.command([serviceDefinition.name, actionName], params);
        actions[actionName].definition = serviceDefinition.actions[actionName];
      }
    }
    api2.views = globalViews;
    api2.fetch = globalFetch;
    api2.actions = globalActions;
    api2.client = this.metadata.client;
    api2.uid = api2.uidGenerator;
    api2.globals.$lc = api2;
    api2.globals.$api = this;
    api2.globals.$views = this.views;
    api2.globals.$actions = this.actions;
    api2.globals.$fetch = this.fetch;
    for (const glob of this.globalInstances) {
      this.installInstanceProperties(glob);
    }
  }
  addGlobalInstance(globalProperties) {
    this.globalInstances.push(globalProperties);
    this.installInstanceProperties(globalProperties);
  }
  installInstanceProperties(globalProperties) {
    for (const key in this.globals) {
      globalProperties[key] = this.globals[key];
    }
  }
  async preFetch() {
    let preFetchPromises = [];
    for (const component of this.preFetchComponents) {
      if (component.$options.reactivePreFetch) {
        const paths = component.$options.reactivePreFetch.apply(this.globals);
        console.log("PREFETCH PATHS", JSON.stringify(paths));
        const promise2 = this.get({ paths });
        preFetchPromises.push(promise2);
      }
    }
    await Promise.all(preFetchPromises);
    for (const afterPreFetch of this.afterPreFetch) {
      afterPreFetch();
    }
  }
  async preFetchRoute(route, router2) {
    let preFetchPromises = [];
    for (const matched of route.value.matched) {
      for (const name in matched.components) {
        const component = matched.components[name];
        if (component.reactivePreFetch) {
          let paths = component.reactivePreFetch.call(this.globals, route.value, router2);
          const promise2 = this.get({ paths }).then((results) => {
            for (let { what, data } of results) {
              this.prerenderCache.set(what, data);
            }
          });
          preFetchPromises.push(promise2);
        }
      }
    }
    return Promise.all(preFetchPromises);
  }
  command(method, args = {}) {
    const _commandId = args._commandId || guid();
    console.trace("COMMAND " + _commandId + ":" + JSON.stringify(method));
    return this.request(method, __spreadProps(__spreadValues({}, args), { _commandId }));
  }
  reverseRange(range) {
    return {
      gt: range.lt,
      gte: range.lte,
      lt: range.gt == "" ? "\xFF\xFF\xFF\xFF" : range.gt,
      lte: range.gte,
      limit: range.limit,
      reverse: !range.reverse
    };
  }
}
var Api_1 = { Api: Api$1 };
const Api = Api_1;
var vueApi = Api;
var daoSockjs = { exports: {} };
const SockJS = sockjs_min.exports;
const rd = dao;
const Connection = rd.ReactiveConnection;
const debug = browser.exports("dao:sockjs");
class SockJsConnection extends Connection {
  constructor(credentials, url, settings) {
    super(credentials, settings);
    this.url = url;
    this.initialize();
  }
  initialize() {
    this.connection = new SockJS(this.url);
    const connection = this.connection;
    connection.onopen = function() {
      if (connection.readyState === SockJS.CONNECTING)
        return setTimeout(connection.onopen, 230);
      this.handleConnect();
    }.bind(this);
    connection.onclose = function() {
      const ef = function() {
      };
      connection.onclose = ef;
      connection.onmessage = ef;
      connection.onheartbeat = ef;
      connection.onopen = ef;
      this.handleDisconnect();
    }.bind(this);
    this.connection.onmessage = function(e) {
      debug("MSG IN:", e.data);
      const message = JSON.parse(e.data);
      this.handleMessage(message);
    }.bind(this);
  }
  send(message) {
    const data = JSON.stringify(message);
    debug("MSG OUT:", data);
    this.connection.send(data);
  }
  reconnect() {
    this.connection.close();
    if (this.autoReconnect)
      return;
    this.initialize();
  }
  dispose() {
    super.dispose();
    this.connection.close();
  }
  closeConnection() {
    this.connection.close();
  }
}
daoSockjs.exports = SockJsConnection;
daoSockjs.exports.SockJsConnection = SockJsConnection;
var SockJsConnection$1 = daoSockjs.exports;
function clientApi(settings = {}) {
  const dao$1 = new dao.Dao(window.__CREDENTIALS__, __spreadProps(__spreadValues({
    remoteUrl: document.location.protocol + "//" + document.location.host + "/api/sockjs",
    protocols: {
      "sockjs": SockJsConnection$1
    }
  }, settings), {
    connectionSettings: __spreadValues({
      fastAuth: !window.hasOwnProperty("__CREDENTIALS__"),
      queueRequestsWhenDisconnected: true,
      requestSendTimeout: Infinity,
      requestTimeout: Infinity,
      queueActiveRequestsOnDisconnect: true,
      autoReconnectDelay: 200,
      logLevel: 1
    }, settings && settings.connectionSettings),
    defaultRoute: {
      type: "remote",
      generator: ReactiveObservableList
    }
  }));
  const api2 = new vueApi.Api(dao$1);
  api2.setup({
    ssr: true,
    createReactiveObject(definition) {
      return createReactiveObject(definition, reactiveMixin(api2), reactivePrefetchMixin(api2));
    }
  });
  for (const plugin of settings.use || []) {
    plugin(api2);
  }
  api2.generateServicesApi();
  return api2;
}
window.api = clientApi({
  use: []
});
const { app, router } = createApp(api);
app.use(createSharedElementDirective());
router.beforeEach(SharedElementRouteGuard);
router.isReady().then(() => {
  const instance = app.mount("#app", true);
  app._container._vnode = instance.$.vnode;
});
export { _export_sfc as _, isClientSide as i };
