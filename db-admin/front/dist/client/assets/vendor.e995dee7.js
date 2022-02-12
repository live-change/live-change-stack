var __defProp = Object.defineProperty;
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
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
function makeMap(str, expectsLowerCase) {
  const map = Object.create(null);
  const list = str.split(",");
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val];
}
const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
const isSpecialBooleanAttr = /* @__PURE__ */ makeMap(specialBooleanAttrs);
function includeBooleanAttr(value) {
  return !!value || value === "";
}
function normalizeStyle(value) {
  if (isArray$1(value)) {
    const res = {};
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const normalized = isString$1(item) ? parseStringStyle(item) : normalizeStyle(item);
      if (normalized) {
        for (const key in normalized) {
          res[key] = normalized[key];
        }
      }
    }
    return res;
  } else if (isString$1(value)) {
    return value;
  } else if (isObject$1(value)) {
    return value;
  }
}
const listDelimiterRE = /;(?![^(]*\))/g;
const propertyDelimiterRE = /:(.+)/;
function parseStringStyle(cssText) {
  const ret = {};
  cssText.split(listDelimiterRE).forEach((item) => {
    if (item) {
      const tmp = item.split(propertyDelimiterRE);
      tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
    }
  });
  return ret;
}
function normalizeClass(value) {
  let res = "";
  if (isString$1(value)) {
    res = value;
  } else if (isArray$1(value)) {
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i]);
      if (normalized) {
        res += normalized + " ";
      }
    }
  } else if (isObject$1(value)) {
    for (const name in value) {
      if (value[name]) {
        res += name + " ";
      }
    }
  }
  return res.trim();
}
function normalizeProps(props) {
  if (!props)
    return null;
  let { class: klass, style } = props;
  if (klass && !isString$1(klass)) {
    props.class = normalizeClass(klass);
  }
  if (style) {
    props.style = normalizeStyle(style);
  }
  return props;
}
const toDisplayString = (val) => {
  return val == null ? "" : isArray$1(val) || isObject$1(val) && (val.toString === objectToString$1 || !isFunction$1(val.toString)) ? JSON.stringify(val, replacer, 2) : String(val);
};
const replacer = (_key, val) => {
  if (val && val.__v_isRef) {
    return replacer(_key, val.value);
  } else if (isMap(val)) {
    return {
      [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val2]) => {
        entries[`${key} =>`] = val2;
        return entries;
      }, {})
    };
  } else if (isSet(val)) {
    return {
      [`Set(${val.size})`]: [...val.values()]
    };
  } else if (isObject$1(val) && !isArray$1(val) && !isPlainObject$1(val)) {
    return String(val);
  }
  return val;
};
const EMPTY_OBJ = {};
const EMPTY_ARR = [];
const NOOP = () => {
};
const NO = () => false;
const onRE = /^on[^a-z]/;
const isOn = (key) => onRE.test(key);
const isModelListener = (key) => key.startsWith("onUpdate:");
const extend = Object.assign;
const remove$1 = (arr, el) => {
  const i = arr.indexOf(el);
  if (i > -1) {
    arr.splice(i, 1);
  }
};
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
const isArray$1 = Array.isArray;
const isMap = (val) => toTypeString$1(val) === "[object Map]";
const isSet = (val) => toTypeString$1(val) === "[object Set]";
const isFunction$1 = (val) => typeof val === "function";
const isString$1 = (val) => typeof val === "string";
const isSymbol = (val) => typeof val === "symbol";
const isObject$1 = (val) => val !== null && typeof val === "object";
const isPromise = (val) => {
  return isObject$1(val) && isFunction$1(val.then) && isFunction$1(val.catch);
};
const objectToString$1 = Object.prototype.toString;
const toTypeString$1 = (value) => objectToString$1.call(value);
const toRawType = (value) => {
  return toTypeString$1(value).slice(8, -1);
};
const isPlainObject$1 = (val) => toTypeString$1(val) === "[object Object]";
const isIntegerKey = (key) => isString$1(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
const isReservedProp = /* @__PURE__ */ makeMap(",key,ref,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted");
const cacheStringFunction = (fn) => {
  const cache = Object.create(null);
  return (str) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  };
};
const camelizeRE = /-(\w)/g;
const camelize = cacheStringFunction((str) => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : "");
});
const hyphenateRE = /\B([A-Z])/g;
const hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, "-$1").toLowerCase());
const capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));
const toHandlerKey = cacheStringFunction((str) => str ? `on${capitalize(str)}` : ``);
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
const invokeArrayFns = (fns, arg) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](arg);
  }
};
const def = (obj, key, value) => {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    value
  });
};
const toNumber = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? val : n;
};
let _globalThis;
const getGlobalThis = () => {
  return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : {});
};
let activeEffectScope;
const effectScopeStack = [];
class EffectScope {
  constructor(detached = false) {
    this.active = true;
    this.effects = [];
    this.cleanups = [];
    if (!detached && activeEffectScope) {
      this.parent = activeEffectScope;
      this.index = (activeEffectScope.scopes || (activeEffectScope.scopes = [])).push(this) - 1;
    }
  }
  run(fn) {
    if (this.active) {
      try {
        this.on();
        return fn();
      } finally {
        this.off();
      }
    }
  }
  on() {
    if (this.active) {
      effectScopeStack.push(this);
      activeEffectScope = this;
    }
  }
  off() {
    if (this.active) {
      effectScopeStack.pop();
      activeEffectScope = effectScopeStack[effectScopeStack.length - 1];
    }
  }
  stop(fromParent) {
    if (this.active) {
      this.effects.forEach((e) => e.stop());
      this.cleanups.forEach((cleanup) => cleanup());
      if (this.scopes) {
        this.scopes.forEach((e) => e.stop(true));
      }
      if (this.parent && !fromParent) {
        const last = this.parent.scopes.pop();
        if (last && last !== this) {
          this.parent.scopes[this.index] = last;
          last.index = this.index;
        }
      }
      this.active = false;
    }
  }
}
function recordEffectScope(effect, scope) {
  scope = scope || activeEffectScope;
  if (scope && scope.active) {
    scope.effects.push(effect);
  }
}
const createDep = (effects) => {
  const dep = new Set(effects);
  dep.w = 0;
  dep.n = 0;
  return dep;
};
const wasTracked = (dep) => (dep.w & trackOpBit) > 0;
const newTracked = (dep) => (dep.n & trackOpBit) > 0;
const initDepMarkers = ({ deps }) => {
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].w |= trackOpBit;
    }
  }
};
const finalizeDepMarkers = (effect) => {
  const { deps } = effect;
  if (deps.length) {
    let ptr = 0;
    for (let i = 0; i < deps.length; i++) {
      const dep = deps[i];
      if (wasTracked(dep) && !newTracked(dep)) {
        dep.delete(effect);
      } else {
        deps[ptr++] = dep;
      }
      dep.w &= ~trackOpBit;
      dep.n &= ~trackOpBit;
    }
    deps.length = ptr;
  }
};
const targetMap = new WeakMap();
let effectTrackDepth = 0;
let trackOpBit = 1;
const maxMarkerBits = 30;
const effectStack = [];
let activeEffect;
const ITERATE_KEY = Symbol("");
const MAP_KEY_ITERATE_KEY = Symbol("");
class ReactiveEffect {
  constructor(fn, scheduler = null, scope) {
    this.fn = fn;
    this.scheduler = scheduler;
    this.active = true;
    this.deps = [];
    recordEffectScope(this, scope);
  }
  run() {
    if (!this.active) {
      return this.fn();
    }
    if (!effectStack.includes(this)) {
      try {
        effectStack.push(activeEffect = this);
        enableTracking();
        trackOpBit = 1 << ++effectTrackDepth;
        if (effectTrackDepth <= maxMarkerBits) {
          initDepMarkers(this);
        } else {
          cleanupEffect(this);
        }
        return this.fn();
      } finally {
        if (effectTrackDepth <= maxMarkerBits) {
          finalizeDepMarkers(this);
        }
        trackOpBit = 1 << --effectTrackDepth;
        resetTracking();
        effectStack.pop();
        const n = effectStack.length;
        activeEffect = n > 0 ? effectStack[n - 1] : void 0;
      }
    }
  }
  stop() {
    if (this.active) {
      cleanupEffect(this);
      if (this.onStop) {
        this.onStop();
      }
      this.active = false;
    }
  }
}
function cleanupEffect(effect) {
  const { deps } = effect;
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect);
    }
    deps.length = 0;
  }
}
let shouldTrack = true;
const trackStack = [];
function pauseTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = false;
}
function enableTracking() {
  trackStack.push(shouldTrack);
  shouldTrack = true;
}
function resetTracking() {
  const last = trackStack.pop();
  shouldTrack = last === void 0 ? true : last;
}
function track(target, type, key) {
  if (!isTracking()) {
    return;
  }
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, depsMap = new Map());
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, dep = createDep());
  }
  trackEffects(dep);
}
function isTracking() {
  return shouldTrack && activeEffect !== void 0;
}
function trackEffects(dep, debuggerEventExtraInfo) {
  let shouldTrack2 = false;
  if (effectTrackDepth <= maxMarkerBits) {
    if (!newTracked(dep)) {
      dep.n |= trackOpBit;
      shouldTrack2 = !wasTracked(dep);
    }
  } else {
    shouldTrack2 = !dep.has(activeEffect);
  }
  if (shouldTrack2) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
  }
}
function trigger$1(target, type, key, newValue, oldValue, oldTarget) {
  const depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let deps = [];
  if (type === "clear") {
    deps = [...depsMap.values()];
  } else if (key === "length" && isArray$1(target)) {
    depsMap.forEach((dep, key2) => {
      if (key2 === "length" || key2 >= newValue) {
        deps.push(dep);
      }
    });
  } else {
    if (key !== void 0) {
      deps.push(depsMap.get(key));
    }
    switch (type) {
      case "add":
        if (!isArray$1(target)) {
          deps.push(depsMap.get(ITERATE_KEY));
          if (isMap(target)) {
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
          }
        } else if (isIntegerKey(key)) {
          deps.push(depsMap.get("length"));
        }
        break;
      case "delete":
        if (!isArray$1(target)) {
          deps.push(depsMap.get(ITERATE_KEY));
          if (isMap(target)) {
            deps.push(depsMap.get(MAP_KEY_ITERATE_KEY));
          }
        }
        break;
      case "set":
        if (isMap(target)) {
          deps.push(depsMap.get(ITERATE_KEY));
        }
        break;
    }
  }
  if (deps.length === 1) {
    if (deps[0]) {
      {
        triggerEffects(deps[0]);
      }
    }
  } else {
    const effects = [];
    for (const dep of deps) {
      if (dep) {
        effects.push(...dep);
      }
    }
    {
      triggerEffects(createDep(effects));
    }
  }
}
function triggerEffects(dep, debuggerEventExtraInfo) {
  for (const effect of isArray$1(dep) ? dep : [...dep]) {
    if (effect !== activeEffect || effect.allowRecurse) {
      if (effect.scheduler) {
        effect.scheduler();
      } else {
        effect.run();
      }
    }
  }
}
const isNonTrackableKeys = /* @__PURE__ */ makeMap(`__proto__,__v_isRef,__isVue`);
const builtInSymbols = new Set(Object.getOwnPropertyNames(Symbol).map((key) => Symbol[key]).filter(isSymbol));
const get = /* @__PURE__ */ createGetter();
const shallowGet = /* @__PURE__ */ createGetter(false, true);
const readonlyGet = /* @__PURE__ */ createGetter(true);
const arrayInstrumentations = /* @__PURE__ */ createArrayInstrumentations();
function createArrayInstrumentations() {
  const instrumentations = {};
  ["includes", "indexOf", "lastIndexOf"].forEach((key) => {
    instrumentations[key] = function(...args) {
      const arr = toRaw(this);
      for (let i = 0, l = this.length; i < l; i++) {
        track(arr, "get", i + "");
      }
      const res = arr[key](...args);
      if (res === -1 || res === false) {
        return arr[key](...args.map(toRaw));
      } else {
        return res;
      }
    };
  });
  ["push", "pop", "shift", "unshift", "splice"].forEach((key) => {
    instrumentations[key] = function(...args) {
      pauseTracking();
      const res = toRaw(this)[key].apply(this, args);
      resetTracking();
      return res;
    };
  });
  return instrumentations;
}
function createGetter(isReadonly2 = false, shallow = false) {
  return function get2(target, key, receiver) {
    if (key === "__v_isReactive") {
      return !isReadonly2;
    } else if (key === "__v_isReadonly") {
      return isReadonly2;
    } else if (key === "__v_raw" && receiver === (isReadonly2 ? shallow ? shallowReadonlyMap : readonlyMap : shallow ? shallowReactiveMap : reactiveMap).get(target)) {
      return target;
    }
    const targetIsArray = isArray$1(target);
    if (!isReadonly2 && targetIsArray && hasOwn(arrayInstrumentations, key)) {
      return Reflect.get(arrayInstrumentations, key, receiver);
    }
    const res = Reflect.get(target, key, receiver);
    if (isSymbol(key) ? builtInSymbols.has(key) : isNonTrackableKeys(key)) {
      return res;
    }
    if (!isReadonly2) {
      track(target, "get", key);
    }
    if (shallow) {
      return res;
    }
    if (isRef(res)) {
      const shouldUnwrap = !targetIsArray || !isIntegerKey(key);
      return shouldUnwrap ? res.value : res;
    }
    if (isObject$1(res)) {
      return isReadonly2 ? readonly(res) : reactive(res);
    }
    return res;
  };
}
const set = /* @__PURE__ */ createSetter();
const shallowSet = /* @__PURE__ */ createSetter(true);
function createSetter(shallow = false) {
  return function set2(target, key, value, receiver) {
    let oldValue = target[key];
    if (!shallow) {
      value = toRaw(value);
      oldValue = toRaw(oldValue);
      if (!isArray$1(target) && isRef(oldValue) && !isRef(value)) {
        oldValue.value = value;
        return true;
      }
    }
    const hadKey = isArray$1(target) && isIntegerKey(key) ? Number(key) < target.length : hasOwn(target, key);
    const result = Reflect.set(target, key, value, receiver);
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        trigger$1(target, "add", key, value);
      } else if (hasChanged(value, oldValue)) {
        trigger$1(target, "set", key, value);
      }
    }
    return result;
  };
}
function deleteProperty(target, key) {
  const hadKey = hasOwn(target, key);
  target[key];
  const result = Reflect.deleteProperty(target, key);
  if (result && hadKey) {
    trigger$1(target, "delete", key, void 0);
  }
  return result;
}
function has(target, key) {
  const result = Reflect.has(target, key);
  if (!isSymbol(key) || !builtInSymbols.has(key)) {
    track(target, "has", key);
  }
  return result;
}
function ownKeys(target) {
  track(target, "iterate", isArray$1(target) ? "length" : ITERATE_KEY);
  return Reflect.ownKeys(target);
}
const mutableHandlers = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
};
const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    return true;
  },
  deleteProperty(target, key) {
    return true;
  }
};
const shallowReactiveHandlers = /* @__PURE__ */ extend({}, mutableHandlers, {
  get: shallowGet,
  set: shallowSet
});
const toShallow = (value) => value;
const getProto = (v) => Reflect.getPrototypeOf(v);
function get$1(target, key, isReadonly2 = false, isShallow = false) {
  target = target["__v_raw"];
  const rawTarget = toRaw(target);
  const rawKey = toRaw(key);
  if (key !== rawKey) {
    !isReadonly2 && track(rawTarget, "get", key);
  }
  !isReadonly2 && track(rawTarget, "get", rawKey);
  const { has: has2 } = getProto(rawTarget);
  const wrap = isShallow ? toShallow : isReadonly2 ? toReadonly : toReactive;
  if (has2.call(rawTarget, key)) {
    return wrap(target.get(key));
  } else if (has2.call(rawTarget, rawKey)) {
    return wrap(target.get(rawKey));
  } else if (target !== rawTarget) {
    target.get(key);
  }
}
function has$1(key, isReadonly2 = false) {
  const target = this["__v_raw"];
  const rawTarget = toRaw(target);
  const rawKey = toRaw(key);
  if (key !== rawKey) {
    !isReadonly2 && track(rawTarget, "has", key);
  }
  !isReadonly2 && track(rawTarget, "has", rawKey);
  return key === rawKey ? target.has(key) : target.has(key) || target.has(rawKey);
}
function size(target, isReadonly2 = false) {
  target = target["__v_raw"];
  !isReadonly2 && track(toRaw(target), "iterate", ITERATE_KEY);
  return Reflect.get(target, "size", target);
}
function add(value) {
  value = toRaw(value);
  const target = toRaw(this);
  const proto = getProto(target);
  const hadKey = proto.has.call(target, value);
  if (!hadKey) {
    target.add(value);
    trigger$1(target, "add", value, value);
  }
  return this;
}
function set$1(key, value) {
  value = toRaw(value);
  const target = toRaw(this);
  const { has: has2, get: get2 } = getProto(target);
  let hadKey = has2.call(target, key);
  if (!hadKey) {
    key = toRaw(key);
    hadKey = has2.call(target, key);
  }
  const oldValue = get2.call(target, key);
  target.set(key, value);
  if (!hadKey) {
    trigger$1(target, "add", key, value);
  } else if (hasChanged(value, oldValue)) {
    trigger$1(target, "set", key, value);
  }
  return this;
}
function deleteEntry(key) {
  const target = toRaw(this);
  const { has: has2, get: get2 } = getProto(target);
  let hadKey = has2.call(target, key);
  if (!hadKey) {
    key = toRaw(key);
    hadKey = has2.call(target, key);
  }
  get2 ? get2.call(target, key) : void 0;
  const result = target.delete(key);
  if (hadKey) {
    trigger$1(target, "delete", key, void 0);
  }
  return result;
}
function clear() {
  const target = toRaw(this);
  const hadItems = target.size !== 0;
  const result = target.clear();
  if (hadItems) {
    trigger$1(target, "clear", void 0, void 0);
  }
  return result;
}
function createForEach(isReadonly2, isShallow) {
  return function forEach(callback, thisArg) {
    const observed = this;
    const target = observed["__v_raw"];
    const rawTarget = toRaw(target);
    const wrap = isShallow ? toShallow : isReadonly2 ? toReadonly : toReactive;
    !isReadonly2 && track(rawTarget, "iterate", ITERATE_KEY);
    return target.forEach((value, key) => {
      return callback.call(thisArg, wrap(value), wrap(key), observed);
    });
  };
}
function createIterableMethod(method, isReadonly2, isShallow) {
  return function(...args) {
    const target = this["__v_raw"];
    const rawTarget = toRaw(target);
    const targetIsMap = isMap(rawTarget);
    const isPair = method === "entries" || method === Symbol.iterator && targetIsMap;
    const isKeyOnly = method === "keys" && targetIsMap;
    const innerIterator = target[method](...args);
    const wrap = isShallow ? toShallow : isReadonly2 ? toReadonly : toReactive;
    !isReadonly2 && track(rawTarget, "iterate", isKeyOnly ? MAP_KEY_ITERATE_KEY : ITERATE_KEY);
    return {
      next() {
        const { value, done } = innerIterator.next();
        return done ? { value, done } : {
          value: isPair ? [wrap(value[0]), wrap(value[1])] : wrap(value),
          done
        };
      },
      [Symbol.iterator]() {
        return this;
      }
    };
  };
}
function createReadonlyMethod(type) {
  return function(...args) {
    return type === "delete" ? false : this;
  };
}
function createInstrumentations() {
  const mutableInstrumentations2 = {
    get(key) {
      return get$1(this, key);
    },
    get size() {
      return size(this);
    },
    has: has$1,
    add,
    set: set$1,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, false)
  };
  const shallowInstrumentations2 = {
    get(key) {
      return get$1(this, key, false, true);
    },
    get size() {
      return size(this);
    },
    has: has$1,
    add,
    set: set$1,
    delete: deleteEntry,
    clear,
    forEach: createForEach(false, true)
  };
  const readonlyInstrumentations2 = {
    get(key) {
      return get$1(this, key, true);
    },
    get size() {
      return size(this, true);
    },
    has(key) {
      return has$1.call(this, key, true);
    },
    add: createReadonlyMethod("add"),
    set: createReadonlyMethod("set"),
    delete: createReadonlyMethod("delete"),
    clear: createReadonlyMethod("clear"),
    forEach: createForEach(true, false)
  };
  const shallowReadonlyInstrumentations2 = {
    get(key) {
      return get$1(this, key, true, true);
    },
    get size() {
      return size(this, true);
    },
    has(key) {
      return has$1.call(this, key, true);
    },
    add: createReadonlyMethod("add"),
    set: createReadonlyMethod("set"),
    delete: createReadonlyMethod("delete"),
    clear: createReadonlyMethod("clear"),
    forEach: createForEach(true, true)
  };
  const iteratorMethods = ["keys", "values", "entries", Symbol.iterator];
  iteratorMethods.forEach((method) => {
    mutableInstrumentations2[method] = createIterableMethod(method, false, false);
    readonlyInstrumentations2[method] = createIterableMethod(method, true, false);
    shallowInstrumentations2[method] = createIterableMethod(method, false, true);
    shallowReadonlyInstrumentations2[method] = createIterableMethod(method, true, true);
  });
  return [
    mutableInstrumentations2,
    readonlyInstrumentations2,
    shallowInstrumentations2,
    shallowReadonlyInstrumentations2
  ];
}
const [mutableInstrumentations, readonlyInstrumentations, shallowInstrumentations, shallowReadonlyInstrumentations] = /* @__PURE__ */ createInstrumentations();
function createInstrumentationGetter(isReadonly2, shallow) {
  const instrumentations = shallow ? isReadonly2 ? shallowReadonlyInstrumentations : shallowInstrumentations : isReadonly2 ? readonlyInstrumentations : mutableInstrumentations;
  return (target, key, receiver) => {
    if (key === "__v_isReactive") {
      return !isReadonly2;
    } else if (key === "__v_isReadonly") {
      return isReadonly2;
    } else if (key === "__v_raw") {
      return target;
    }
    return Reflect.get(hasOwn(instrumentations, key) && key in target ? instrumentations : target, key, receiver);
  };
}
const mutableCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, false)
};
const shallowCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(false, true)
};
const readonlyCollectionHandlers = {
  get: /* @__PURE__ */ createInstrumentationGetter(true, false)
};
const reactiveMap = new WeakMap();
const shallowReactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
const shallowReadonlyMap = new WeakMap();
function targetTypeMap(rawType) {
  switch (rawType) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
function getTargetType(value) {
  return value["__v_skip"] || !Object.isExtensible(value) ? 0 : targetTypeMap(toRawType(value));
}
function reactive(target) {
  if (target && target["__v_isReadonly"]) {
    return target;
  }
  return createReactiveObject(target, false, mutableHandlers, mutableCollectionHandlers, reactiveMap);
}
function shallowReactive(target) {
  return createReactiveObject(target, false, shallowReactiveHandlers, shallowCollectionHandlers, shallowReactiveMap);
}
function readonly(target) {
  return createReactiveObject(target, true, readonlyHandlers, readonlyCollectionHandlers, readonlyMap);
}
function createReactiveObject(target, isReadonly2, baseHandlers, collectionHandlers, proxyMap) {
  if (!isObject$1(target)) {
    return target;
  }
  if (target["__v_raw"] && !(isReadonly2 && target["__v_isReactive"])) {
    return target;
  }
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  const targetType = getTargetType(target);
  if (targetType === 0) {
    return target;
  }
  const proxy = new Proxy(target, targetType === 2 ? collectionHandlers : baseHandlers);
  proxyMap.set(target, proxy);
  return proxy;
}
function isReactive(value) {
  if (isReadonly(value)) {
    return isReactive(value["__v_raw"]);
  }
  return !!(value && value["__v_isReactive"]);
}
function isReadonly(value) {
  return !!(value && value["__v_isReadonly"]);
}
function isProxy(value) {
  return isReactive(value) || isReadonly(value);
}
function toRaw(observed) {
  const raw = observed && observed["__v_raw"];
  return raw ? toRaw(raw) : observed;
}
function markRaw(value) {
  def(value, "__v_skip", true);
  return value;
}
const toReactive = (value) => isObject$1(value) ? reactive(value) : value;
const toReadonly = (value) => isObject$1(value) ? readonly(value) : value;
function trackRefValue(ref2) {
  if (isTracking()) {
    ref2 = toRaw(ref2);
    if (!ref2.dep) {
      ref2.dep = createDep();
    }
    {
      trackEffects(ref2.dep);
    }
  }
}
function triggerRefValue(ref2, newVal) {
  ref2 = toRaw(ref2);
  if (ref2.dep) {
    {
      triggerEffects(ref2.dep);
    }
  }
}
function isRef(r) {
  return Boolean(r && r.__v_isRef === true);
}
function ref(value) {
  return createRef(value, false);
}
function shallowRef(value) {
  return createRef(value, true);
}
function createRef(rawValue, shallow) {
  if (isRef(rawValue)) {
    return rawValue;
  }
  return new RefImpl(rawValue, shallow);
}
class RefImpl {
  constructor(value, _shallow) {
    this._shallow = _shallow;
    this.dep = void 0;
    this.__v_isRef = true;
    this._rawValue = _shallow ? value : toRaw(value);
    this._value = _shallow ? value : toReactive(value);
  }
  get value() {
    trackRefValue(this);
    return this._value;
  }
  set value(newVal) {
    newVal = this._shallow ? newVal : toRaw(newVal);
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal;
      this._value = this._shallow ? newVal : toReactive(newVal);
      triggerRefValue(this);
    }
  }
}
function unref(ref2) {
  return isRef(ref2) ? ref2.value : ref2;
}
const shallowUnwrapHandlers = {
  get: (target, key, receiver) => unref(Reflect.get(target, key, receiver)),
  set: (target, key, value, receiver) => {
    const oldValue = target[key];
    if (isRef(oldValue) && !isRef(value)) {
      oldValue.value = value;
      return true;
    } else {
      return Reflect.set(target, key, value, receiver);
    }
  }
};
function proxyRefs(objectWithRefs) {
  return isReactive(objectWithRefs) ? objectWithRefs : new Proxy(objectWithRefs, shallowUnwrapHandlers);
}
class ComputedRefImpl {
  constructor(getter, _setter, isReadonly2) {
    this._setter = _setter;
    this.dep = void 0;
    this._dirty = true;
    this.__v_isRef = true;
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
        triggerRefValue(this);
      }
    });
    this["__v_isReadonly"] = isReadonly2;
  }
  get value() {
    const self2 = toRaw(this);
    trackRefValue(self2);
    if (self2._dirty) {
      self2._dirty = false;
      self2._value = self2.effect.run();
    }
    return self2._value;
  }
  set value(newValue) {
    this._setter(newValue);
  }
}
function computed(getterOrOptions, debugOptions) {
  let getter;
  let setter;
  const onlyGetter = isFunction$1(getterOrOptions);
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = NOOP;
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }
  const cRef = new ComputedRefImpl(getter, setter, onlyGetter || !setter);
  return cRef;
}
function emit$1(instance, event, ...rawArgs) {
  const props = instance.vnode.props || EMPTY_OBJ;
  let args = rawArgs;
  const isModelListener2 = event.startsWith("update:");
  const modelArg = isModelListener2 && event.slice(7);
  if (modelArg && modelArg in props) {
    const modifiersKey = `${modelArg === "modelValue" ? "model" : modelArg}Modifiers`;
    const { number, trim } = props[modifiersKey] || EMPTY_OBJ;
    if (trim) {
      args = rawArgs.map((a) => a.trim());
    } else if (number) {
      args = rawArgs.map(toNumber);
    }
  }
  let handlerName;
  let handler2 = props[handlerName = toHandlerKey(event)] || props[handlerName = toHandlerKey(camelize(event))];
  if (!handler2 && isModelListener2) {
    handler2 = props[handlerName = toHandlerKey(hyphenate(event))];
  }
  if (handler2) {
    callWithAsyncErrorHandling(handler2, instance, 6, args);
  }
  const onceHandler = props[handlerName + `Once`];
  if (onceHandler) {
    if (!instance.emitted) {
      instance.emitted = {};
    } else if (instance.emitted[handlerName]) {
      return;
    }
    instance.emitted[handlerName] = true;
    callWithAsyncErrorHandling(onceHandler, instance, 6, args);
  }
}
function normalizeEmitsOptions(comp, appContext, asMixin = false) {
  const cache = appContext.emitsCache;
  const cached = cache.get(comp);
  if (cached !== void 0) {
    return cached;
  }
  const raw = comp.emits;
  let normalized = {};
  let hasExtends = false;
  if (!isFunction$1(comp)) {
    const extendEmits = (raw2) => {
      const normalizedFromExtend = normalizeEmitsOptions(raw2, appContext, true);
      if (normalizedFromExtend) {
        hasExtends = true;
        extend(normalized, normalizedFromExtend);
      }
    };
    if (!asMixin && appContext.mixins.length) {
      appContext.mixins.forEach(extendEmits);
    }
    if (comp.extends) {
      extendEmits(comp.extends);
    }
    if (comp.mixins) {
      comp.mixins.forEach(extendEmits);
    }
  }
  if (!raw && !hasExtends) {
    cache.set(comp, null);
    return null;
  }
  if (isArray$1(raw)) {
    raw.forEach((key) => normalized[key] = null);
  } else {
    extend(normalized, raw);
  }
  cache.set(comp, normalized);
  return normalized;
}
function isEmitListener(options, key) {
  if (!options || !isOn(key)) {
    return false;
  }
  key = key.slice(2).replace(/Once$/, "");
  return hasOwn(options, key[0].toLowerCase() + key.slice(1)) || hasOwn(options, hyphenate(key)) || hasOwn(options, key);
}
let currentRenderingInstance = null;
let currentScopeId = null;
function setCurrentRenderingInstance(instance) {
  const prev = currentRenderingInstance;
  currentRenderingInstance = instance;
  currentScopeId = instance && instance.type.__scopeId || null;
  return prev;
}
function pushScopeId(id) {
  currentScopeId = id;
}
function popScopeId() {
  currentScopeId = null;
}
function withCtx(fn, ctx = currentRenderingInstance, isNonScopedSlot) {
  if (!ctx)
    return fn;
  if (fn._n) {
    return fn;
  }
  const renderFnWithContext = (...args) => {
    if (renderFnWithContext._d) {
      setBlockTracking(-1);
    }
    const prevInstance = setCurrentRenderingInstance(ctx);
    const res = fn(...args);
    setCurrentRenderingInstance(prevInstance);
    if (renderFnWithContext._d) {
      setBlockTracking(1);
    }
    return res;
  };
  renderFnWithContext._n = true;
  renderFnWithContext._c = true;
  renderFnWithContext._d = true;
  return renderFnWithContext;
}
function markAttrsAccessed() {
}
function renderComponentRoot(instance) {
  const { type: Component, vnode, proxy, withProxy, props, propsOptions: [propsOptions], slots, attrs, emit, render: render2, renderCache, data, setupState, ctx, inheritAttrs } = instance;
  let result;
  let fallthroughAttrs;
  const prev = setCurrentRenderingInstance(instance);
  try {
    if (vnode.shapeFlag & 4) {
      const proxyToUse = withProxy || proxy;
      result = normalizeVNode(render2.call(proxyToUse, proxyToUse, renderCache, props, setupState, data, ctx));
      fallthroughAttrs = attrs;
    } else {
      const render3 = Component;
      if (false)
        ;
      result = normalizeVNode(render3.length > 1 ? render3(props, false ? {
        get attrs() {
          markAttrsAccessed();
          return attrs;
        },
        slots,
        emit
      } : { attrs, slots, emit }) : render3(props, null));
      fallthroughAttrs = Component.props ? attrs : getFunctionalFallthrough(attrs);
    }
  } catch (err) {
    blockStack.length = 0;
    handleError(err, instance, 1);
    result = createVNode(Comment);
  }
  let root = result;
  if (fallthroughAttrs && inheritAttrs !== false) {
    const keys = Object.keys(fallthroughAttrs);
    const { shapeFlag } = root;
    if (keys.length) {
      if (shapeFlag & (1 | 6)) {
        if (propsOptions && keys.some(isModelListener)) {
          fallthroughAttrs = filterModelListeners(fallthroughAttrs, propsOptions);
        }
        root = cloneVNode(root, fallthroughAttrs);
      }
    }
  }
  if (vnode.dirs) {
    root.dirs = root.dirs ? root.dirs.concat(vnode.dirs) : vnode.dirs;
  }
  if (vnode.transition) {
    root.transition = vnode.transition;
  }
  {
    result = root;
  }
  setCurrentRenderingInstance(prev);
  return result;
}
function filterSingleRoot(children) {
  let singleRoot;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (isVNode(child)) {
      if (child.type !== Comment || child.children === "v-if") {
        if (singleRoot) {
          return;
        } else {
          singleRoot = child;
        }
      }
    } else {
      return;
    }
  }
  return singleRoot;
}
const getFunctionalFallthrough = (attrs) => {
  let res;
  for (const key in attrs) {
    if (key === "class" || key === "style" || isOn(key)) {
      (res || (res = {}))[key] = attrs[key];
    }
  }
  return res;
};
const filterModelListeners = (attrs, props) => {
  const res = {};
  for (const key in attrs) {
    if (!isModelListener(key) || !(key.slice(9) in props)) {
      res[key] = attrs[key];
    }
  }
  return res;
};
function shouldUpdateComponent(prevVNode, nextVNode, optimized) {
  const { props: prevProps, children: prevChildren, component } = prevVNode;
  const { props: nextProps, children: nextChildren, patchFlag } = nextVNode;
  const emits = component.emitsOptions;
  if (nextVNode.dirs || nextVNode.transition) {
    return true;
  }
  if (optimized && patchFlag >= 0) {
    if (patchFlag & 1024) {
      return true;
    }
    if (patchFlag & 16) {
      if (!prevProps) {
        return !!nextProps;
      }
      return hasPropsChanged(prevProps, nextProps, emits);
    } else if (patchFlag & 8) {
      const dynamicProps = nextVNode.dynamicProps;
      for (let i = 0; i < dynamicProps.length; i++) {
        const key = dynamicProps[i];
        if (nextProps[key] !== prevProps[key] && !isEmitListener(emits, key)) {
          return true;
        }
      }
    }
  } else {
    if (prevChildren || nextChildren) {
      if (!nextChildren || !nextChildren.$stable) {
        return true;
      }
    }
    if (prevProps === nextProps) {
      return false;
    }
    if (!prevProps) {
      return !!nextProps;
    }
    if (!nextProps) {
      return true;
    }
    return hasPropsChanged(prevProps, nextProps, emits);
  }
  return false;
}
function hasPropsChanged(prevProps, nextProps, emitsOptions) {
  const nextKeys = Object.keys(nextProps);
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true;
  }
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];
    if (nextProps[key] !== prevProps[key] && !isEmitListener(emitsOptions, key)) {
      return true;
    }
  }
  return false;
}
function updateHOCHostEl({ vnode, parent: parent2 }, el) {
  while (parent2 && parent2.subTree === vnode) {
    (vnode = parent2.vnode).el = el;
    parent2 = parent2.parent;
  }
}
const isSuspense = (type) => type.__isSuspense;
const SuspenseImpl = {
  name: "Suspense",
  __isSuspense: true,
  process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, rendererInternals) {
    if (n1 == null) {
      mountSuspense(n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, rendererInternals);
    } else {
      patchSuspense(n1, n2, container, anchor, parentComponent, isSVG, slotScopeIds, optimized, rendererInternals);
    }
  },
  hydrate: hydrateSuspense,
  create: createSuspenseBoundary,
  normalize: normalizeSuspenseChildren
};
const Suspense = SuspenseImpl;
function triggerEvent(vnode, name) {
  const eventListener = vnode.props && vnode.props[name];
  if (isFunction$1(eventListener)) {
    eventListener();
  }
}
function mountSuspense(vnode, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, rendererInternals) {
  const { p: patch, o: { createElement } } = rendererInternals;
  const hiddenContainer = createElement("div");
  const suspense = vnode.suspense = createSuspenseBoundary(vnode, parentSuspense, parentComponent, container, hiddenContainer, anchor, isSVG, slotScopeIds, optimized, rendererInternals);
  patch(null, suspense.pendingBranch = vnode.ssContent, hiddenContainer, null, parentComponent, suspense, isSVG, slotScopeIds);
  if (suspense.deps > 0) {
    triggerEvent(vnode, "onPending");
    triggerEvent(vnode, "onFallback");
    patch(null, vnode.ssFallback, container, anchor, parentComponent, null, isSVG, slotScopeIds);
    setActiveBranch(suspense, vnode.ssFallback);
  } else {
    suspense.resolve();
  }
}
function patchSuspense(n1, n2, container, anchor, parentComponent, isSVG, slotScopeIds, optimized, { p: patch, um: unmount, o: { createElement } }) {
  const suspense = n2.suspense = n1.suspense;
  suspense.vnode = n2;
  n2.el = n1.el;
  const newBranch = n2.ssContent;
  const newFallback = n2.ssFallback;
  const { activeBranch, pendingBranch, isInFallback, isHydrating } = suspense;
  if (pendingBranch) {
    suspense.pendingBranch = newBranch;
    if (isSameVNodeType(newBranch, pendingBranch)) {
      patch(pendingBranch, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, isSVG, slotScopeIds, optimized);
      if (suspense.deps <= 0) {
        suspense.resolve();
      } else if (isInFallback) {
        patch(activeBranch, newFallback, container, anchor, parentComponent, null, isSVG, slotScopeIds, optimized);
        setActiveBranch(suspense, newFallback);
      }
    } else {
      suspense.pendingId++;
      if (isHydrating) {
        suspense.isHydrating = false;
        suspense.activeBranch = pendingBranch;
      } else {
        unmount(pendingBranch, parentComponent, suspense);
      }
      suspense.deps = 0;
      suspense.effects.length = 0;
      suspense.hiddenContainer = createElement("div");
      if (isInFallback) {
        patch(null, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, isSVG, slotScopeIds, optimized);
        if (suspense.deps <= 0) {
          suspense.resolve();
        } else {
          patch(activeBranch, newFallback, container, anchor, parentComponent, null, isSVG, slotScopeIds, optimized);
          setActiveBranch(suspense, newFallback);
        }
      } else if (activeBranch && isSameVNodeType(newBranch, activeBranch)) {
        patch(activeBranch, newBranch, container, anchor, parentComponent, suspense, isSVG, slotScopeIds, optimized);
        suspense.resolve(true);
      } else {
        patch(null, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, isSVG, slotScopeIds, optimized);
        if (suspense.deps <= 0) {
          suspense.resolve();
        }
      }
    }
  } else {
    if (activeBranch && isSameVNodeType(newBranch, activeBranch)) {
      patch(activeBranch, newBranch, container, anchor, parentComponent, suspense, isSVG, slotScopeIds, optimized);
      setActiveBranch(suspense, newBranch);
    } else {
      triggerEvent(n2, "onPending");
      suspense.pendingBranch = newBranch;
      suspense.pendingId++;
      patch(null, newBranch, suspense.hiddenContainer, null, parentComponent, suspense, isSVG, slotScopeIds, optimized);
      if (suspense.deps <= 0) {
        suspense.resolve();
      } else {
        const { timeout, pendingId } = suspense;
        if (timeout > 0) {
          setTimeout(() => {
            if (suspense.pendingId === pendingId) {
              suspense.fallback(newFallback);
            }
          }, timeout);
        } else if (timeout === 0) {
          suspense.fallback(newFallback);
        }
      }
    }
  }
}
function createSuspenseBoundary(vnode, parent2, parentComponent, container, hiddenContainer, anchor, isSVG, slotScopeIds, optimized, rendererInternals, isHydrating = false) {
  const { p: patch, m: move, um: unmount, n: next, o: { parentNode, remove: remove2 } } = rendererInternals;
  const timeout = toNumber(vnode.props && vnode.props.timeout);
  const suspense = {
    vnode,
    parent: parent2,
    parentComponent,
    isSVG,
    container,
    hiddenContainer,
    anchor,
    deps: 0,
    pendingId: 0,
    timeout: typeof timeout === "number" ? timeout : -1,
    activeBranch: null,
    pendingBranch: null,
    isInFallback: true,
    isHydrating,
    isUnmounted: false,
    effects: [],
    resolve(resume = false) {
      const { vnode: vnode2, activeBranch, pendingBranch, pendingId, effects, parentComponent: parentComponent2, container: container2 } = suspense;
      if (suspense.isHydrating) {
        suspense.isHydrating = false;
      } else if (!resume) {
        const delayEnter = activeBranch && pendingBranch.transition && pendingBranch.transition.mode === "out-in";
        if (delayEnter) {
          activeBranch.transition.afterLeave = () => {
            if (pendingId === suspense.pendingId) {
              move(pendingBranch, container2, anchor2, 0);
            }
          };
        }
        let { anchor: anchor2 } = suspense;
        if (activeBranch) {
          anchor2 = next(activeBranch);
          unmount(activeBranch, parentComponent2, suspense, true);
        }
        if (!delayEnter) {
          move(pendingBranch, container2, anchor2, 0);
        }
      }
      setActiveBranch(suspense, pendingBranch);
      suspense.pendingBranch = null;
      suspense.isInFallback = false;
      let parent3 = suspense.parent;
      let hasUnresolvedAncestor = false;
      while (parent3) {
        if (parent3.pendingBranch) {
          parent3.effects.push(...effects);
          hasUnresolvedAncestor = true;
          break;
        }
        parent3 = parent3.parent;
      }
      if (!hasUnresolvedAncestor) {
        queuePostFlushCb(effects);
      }
      suspense.effects = [];
      triggerEvent(vnode2, "onResolve");
    },
    fallback(fallbackVNode) {
      if (!suspense.pendingBranch) {
        return;
      }
      const { vnode: vnode2, activeBranch, parentComponent: parentComponent2, container: container2, isSVG: isSVG2 } = suspense;
      triggerEvent(vnode2, "onFallback");
      const anchor2 = next(activeBranch);
      const mountFallback = () => {
        if (!suspense.isInFallback) {
          return;
        }
        patch(null, fallbackVNode, container2, anchor2, parentComponent2, null, isSVG2, slotScopeIds, optimized);
        setActiveBranch(suspense, fallbackVNode);
      };
      const delayEnter = fallbackVNode.transition && fallbackVNode.transition.mode === "out-in";
      if (delayEnter) {
        activeBranch.transition.afterLeave = mountFallback;
      }
      suspense.isInFallback = true;
      unmount(activeBranch, parentComponent2, null, true);
      if (!delayEnter) {
        mountFallback();
      }
    },
    move(container2, anchor2, type) {
      suspense.activeBranch && move(suspense.activeBranch, container2, anchor2, type);
      suspense.container = container2;
    },
    next() {
      return suspense.activeBranch && next(suspense.activeBranch);
    },
    registerDep(instance, setupRenderEffect) {
      const isInPendingSuspense = !!suspense.pendingBranch;
      if (isInPendingSuspense) {
        suspense.deps++;
      }
      const hydratedEl = instance.vnode.el;
      instance.asyncDep.catch((err) => {
        handleError(err, instance, 0);
      }).then((asyncSetupResult) => {
        if (instance.isUnmounted || suspense.isUnmounted || suspense.pendingId !== instance.suspenseId) {
          return;
        }
        instance.asyncResolved = true;
        const { vnode: vnode2 } = instance;
        handleSetupResult(instance, asyncSetupResult, false);
        if (hydratedEl) {
          vnode2.el = hydratedEl;
        }
        const placeholder = !hydratedEl && instance.subTree.el;
        setupRenderEffect(instance, vnode2, parentNode(hydratedEl || instance.subTree.el), hydratedEl ? null : next(instance.subTree), suspense, isSVG, optimized);
        if (placeholder) {
          remove2(placeholder);
        }
        updateHOCHostEl(instance, vnode2.el);
        if (isInPendingSuspense && --suspense.deps === 0) {
          suspense.resolve();
        }
      });
    },
    unmount(parentSuspense, doRemove) {
      suspense.isUnmounted = true;
      if (suspense.activeBranch) {
        unmount(suspense.activeBranch, parentComponent, parentSuspense, doRemove);
      }
      if (suspense.pendingBranch) {
        unmount(suspense.pendingBranch, parentComponent, parentSuspense, doRemove);
      }
    }
  };
  return suspense;
}
function hydrateSuspense(node, vnode, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, rendererInternals, hydrateNode) {
  const suspense = vnode.suspense = createSuspenseBoundary(vnode, parentSuspense, parentComponent, node.parentNode, document.createElement("div"), null, isSVG, slotScopeIds, optimized, rendererInternals, true);
  const result = hydrateNode(node, suspense.pendingBranch = vnode.ssContent, parentComponent, suspense, slotScopeIds, optimized);
  if (suspense.deps === 0) {
    suspense.resolve();
  }
  return result;
}
function normalizeSuspenseChildren(vnode) {
  const { shapeFlag, children } = vnode;
  const isSlotChildren = shapeFlag & 32;
  vnode.ssContent = normalizeSuspenseSlot(isSlotChildren ? children.default : children);
  vnode.ssFallback = isSlotChildren ? normalizeSuspenseSlot(children.fallback) : createVNode(Comment);
}
function normalizeSuspenseSlot(s2) {
  let block;
  if (isFunction$1(s2)) {
    const trackBlock = isBlockTreeEnabled && s2._c;
    if (trackBlock) {
      s2._d = false;
      openBlock();
    }
    s2 = s2();
    if (trackBlock) {
      s2._d = true;
      block = currentBlock;
      closeBlock();
    }
  }
  if (isArray$1(s2)) {
    const singleChild = filterSingleRoot(s2);
    s2 = singleChild;
  }
  s2 = normalizeVNode(s2);
  if (block && !s2.dynamicChildren) {
    s2.dynamicChildren = block.filter((c) => c !== s2);
  }
  return s2;
}
function queueEffectWithSuspense(fn, suspense) {
  if (suspense && suspense.pendingBranch) {
    if (isArray$1(fn)) {
      suspense.effects.push(...fn);
    } else {
      suspense.effects.push(fn);
    }
  } else {
    queuePostFlushCb(fn);
  }
}
function setActiveBranch(suspense, branch) {
  suspense.activeBranch = branch;
  const { vnode, parentComponent } = suspense;
  const el = vnode.el = branch.el;
  if (parentComponent && parentComponent.subTree === vnode) {
    parentComponent.vnode.el = el;
    updateHOCHostEl(parentComponent, el);
  }
}
function provide(key, value) {
  if (!currentInstance)
    ;
  else {
    let provides = currentInstance.provides;
    const parentProvides = currentInstance.parent && currentInstance.parent.provides;
    if (parentProvides === provides) {
      provides = currentInstance.provides = Object.create(parentProvides);
    }
    provides[key] = value;
  }
}
function inject(key, defaultValue, treatDefaultAsFactory = false) {
  const instance = currentInstance || currentRenderingInstance;
  if (instance) {
    const provides = instance.parent == null ? instance.vnode.appContext && instance.vnode.appContext.provides : instance.parent.provides;
    if (provides && key in provides) {
      return provides[key];
    } else if (arguments.length > 1) {
      return treatDefaultAsFactory && isFunction$1(defaultValue) ? defaultValue.call(instance.proxy) : defaultValue;
    } else
      ;
  }
}
function useTransitionState() {
  const state = {
    isMounted: false,
    isLeaving: false,
    isUnmounting: false,
    leavingVNodes: new Map()
  };
  onMounted(() => {
    state.isMounted = true;
  });
  onBeforeUnmount(() => {
    state.isUnmounting = true;
  });
  return state;
}
const TransitionHookValidator = [Function, Array];
const BaseTransitionImpl = {
  name: `BaseTransition`,
  props: {
    mode: String,
    appear: Boolean,
    persisted: Boolean,
    onBeforeEnter: TransitionHookValidator,
    onEnter: TransitionHookValidator,
    onAfterEnter: TransitionHookValidator,
    onEnterCancelled: TransitionHookValidator,
    onBeforeLeave: TransitionHookValidator,
    onLeave: TransitionHookValidator,
    onAfterLeave: TransitionHookValidator,
    onLeaveCancelled: TransitionHookValidator,
    onBeforeAppear: TransitionHookValidator,
    onAppear: TransitionHookValidator,
    onAfterAppear: TransitionHookValidator,
    onAppearCancelled: TransitionHookValidator
  },
  setup(props, { slots }) {
    const instance = getCurrentInstance();
    const state = useTransitionState();
    let prevTransitionKey;
    return () => {
      const children = slots.default && getTransitionRawChildren(slots.default(), true);
      if (!children || !children.length) {
        return;
      }
      const rawProps = toRaw(props);
      const { mode } = rawProps;
      const child = children[0];
      if (state.isLeaving) {
        return emptyPlaceholder(child);
      }
      const innerChild = getKeepAliveChild(child);
      if (!innerChild) {
        return emptyPlaceholder(child);
      }
      const enterHooks = resolveTransitionHooks(innerChild, rawProps, state, instance);
      setTransitionHooks(innerChild, enterHooks);
      const oldChild = instance.subTree;
      const oldInnerChild = oldChild && getKeepAliveChild(oldChild);
      let transitionKeyChanged = false;
      const { getTransitionKey } = innerChild.type;
      if (getTransitionKey) {
        const key = getTransitionKey();
        if (prevTransitionKey === void 0) {
          prevTransitionKey = key;
        } else if (key !== prevTransitionKey) {
          prevTransitionKey = key;
          transitionKeyChanged = true;
        }
      }
      if (oldInnerChild && oldInnerChild.type !== Comment && (!isSameVNodeType(innerChild, oldInnerChild) || transitionKeyChanged)) {
        const leavingHooks = resolveTransitionHooks(oldInnerChild, rawProps, state, instance);
        setTransitionHooks(oldInnerChild, leavingHooks);
        if (mode === "out-in") {
          state.isLeaving = true;
          leavingHooks.afterLeave = () => {
            state.isLeaving = false;
            instance.update();
          };
          return emptyPlaceholder(child);
        } else if (mode === "in-out" && innerChild.type !== Comment) {
          leavingHooks.delayLeave = (el, earlyRemove, delayedLeave) => {
            const leavingVNodesCache = getLeavingNodesForType(state, oldInnerChild);
            leavingVNodesCache[String(oldInnerChild.key)] = oldInnerChild;
            el._leaveCb = () => {
              earlyRemove();
              el._leaveCb = void 0;
              delete enterHooks.delayedLeave;
            };
            enterHooks.delayedLeave = delayedLeave;
          };
        }
      }
      return child;
    };
  }
};
const BaseTransition = BaseTransitionImpl;
function getLeavingNodesForType(state, vnode) {
  const { leavingVNodes } = state;
  let leavingVNodesCache = leavingVNodes.get(vnode.type);
  if (!leavingVNodesCache) {
    leavingVNodesCache = Object.create(null);
    leavingVNodes.set(vnode.type, leavingVNodesCache);
  }
  return leavingVNodesCache;
}
function resolveTransitionHooks(vnode, props, state, instance) {
  const { appear, mode, persisted = false, onBeforeEnter, onEnter, onAfterEnter, onEnterCancelled, onBeforeLeave, onLeave, onAfterLeave, onLeaveCancelled, onBeforeAppear, onAppear, onAfterAppear, onAppearCancelled } = props;
  const key = String(vnode.key);
  const leavingVNodesCache = getLeavingNodesForType(state, vnode);
  const callHook2 = (hook, args) => {
    hook && callWithAsyncErrorHandling(hook, instance, 9, args);
  };
  const hooks = {
    mode,
    persisted,
    beforeEnter(el) {
      let hook = onBeforeEnter;
      if (!state.isMounted) {
        if (appear) {
          hook = onBeforeAppear || onBeforeEnter;
        } else {
          return;
        }
      }
      if (el._leaveCb) {
        el._leaveCb(true);
      }
      const leavingVNode = leavingVNodesCache[key];
      if (leavingVNode && isSameVNodeType(vnode, leavingVNode) && leavingVNode.el._leaveCb) {
        leavingVNode.el._leaveCb();
      }
      callHook2(hook, [el]);
    },
    enter(el) {
      let hook = onEnter;
      let afterHook = onAfterEnter;
      let cancelHook = onEnterCancelled;
      if (!state.isMounted) {
        if (appear) {
          hook = onAppear || onEnter;
          afterHook = onAfterAppear || onAfterEnter;
          cancelHook = onAppearCancelled || onEnterCancelled;
        } else {
          return;
        }
      }
      let called = false;
      const done = el._enterCb = (cancelled) => {
        if (called)
          return;
        called = true;
        if (cancelled) {
          callHook2(cancelHook, [el]);
        } else {
          callHook2(afterHook, [el]);
        }
        if (hooks.delayedLeave) {
          hooks.delayedLeave();
        }
        el._enterCb = void 0;
      };
      if (hook) {
        hook(el, done);
        if (hook.length <= 1) {
          done();
        }
      } else {
        done();
      }
    },
    leave(el, remove2) {
      const key2 = String(vnode.key);
      if (el._enterCb) {
        el._enterCb(true);
      }
      if (state.isUnmounting) {
        return remove2();
      }
      callHook2(onBeforeLeave, [el]);
      let called = false;
      const done = el._leaveCb = (cancelled) => {
        if (called)
          return;
        called = true;
        remove2();
        if (cancelled) {
          callHook2(onLeaveCancelled, [el]);
        } else {
          callHook2(onAfterLeave, [el]);
        }
        el._leaveCb = void 0;
        if (leavingVNodesCache[key2] === vnode) {
          delete leavingVNodesCache[key2];
        }
      };
      leavingVNodesCache[key2] = vnode;
      if (onLeave) {
        onLeave(el, done);
        if (onLeave.length <= 1) {
          done();
        }
      } else {
        done();
      }
    },
    clone(vnode2) {
      return resolveTransitionHooks(vnode2, props, state, instance);
    }
  };
  return hooks;
}
function emptyPlaceholder(vnode) {
  if (isKeepAlive(vnode)) {
    vnode = cloneVNode(vnode);
    vnode.children = null;
    return vnode;
  }
}
function getKeepAliveChild(vnode) {
  return isKeepAlive(vnode) ? vnode.children ? vnode.children[0] : void 0 : vnode;
}
function setTransitionHooks(vnode, hooks) {
  if (vnode.shapeFlag & 6 && vnode.component) {
    setTransitionHooks(vnode.component.subTree, hooks);
  } else if (vnode.shapeFlag & 128) {
    vnode.ssContent.transition = hooks.clone(vnode.ssContent);
    vnode.ssFallback.transition = hooks.clone(vnode.ssFallback);
  } else {
    vnode.transition = hooks;
  }
}
function getTransitionRawChildren(children, keepComment = false) {
  let ret = [];
  let keyedFragmentCount = 0;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.type === Fragment) {
      if (child.patchFlag & 128)
        keyedFragmentCount++;
      ret = ret.concat(getTransitionRawChildren(child.children, keepComment));
    } else if (keepComment || child.type !== Comment) {
      ret.push(child);
    }
  }
  if (keyedFragmentCount > 1) {
    for (let i = 0; i < ret.length; i++) {
      ret[i].patchFlag = -2;
    }
  }
  return ret;
}
function defineComponent(options) {
  return isFunction$1(options) ? { setup: options, name: options.name } : options;
}
const isAsyncWrapper = (i) => !!i.type.__asyncLoader;
const isKeepAlive = (vnode) => vnode.type.__isKeepAlive;
function onActivated(hook, target) {
  registerKeepAliveHook(hook, "a", target);
}
function onDeactivated(hook, target) {
  registerKeepAliveHook(hook, "da", target);
}
function registerKeepAliveHook(hook, type, target = currentInstance) {
  const wrappedHook = hook.__wdc || (hook.__wdc = () => {
    let current = target;
    while (current) {
      if (current.isDeactivated) {
        return;
      }
      current = current.parent;
    }
    hook();
  });
  injectHook(type, wrappedHook, target);
  if (target) {
    let current = target.parent;
    while (current && current.parent) {
      if (isKeepAlive(current.parent.vnode)) {
        injectToKeepAliveRoot(wrappedHook, type, target, current);
      }
      current = current.parent;
    }
  }
}
function injectToKeepAliveRoot(hook, type, target, keepAliveRoot) {
  const injected = injectHook(type, hook, keepAliveRoot, true);
  onUnmounted(() => {
    remove$1(keepAliveRoot[type], injected);
  }, target);
}
function injectHook(type, hook, target = currentInstance, prepend = false) {
  if (target) {
    const hooks = target[type] || (target[type] = []);
    const wrappedHook = hook.__weh || (hook.__weh = (...args) => {
      if (target.isUnmounted) {
        return;
      }
      pauseTracking();
      setCurrentInstance(target);
      const res = callWithAsyncErrorHandling(hook, target, type, args);
      unsetCurrentInstance();
      resetTracking();
      return res;
    });
    if (prepend) {
      hooks.unshift(wrappedHook);
    } else {
      hooks.push(wrappedHook);
    }
    return wrappedHook;
  }
}
const createHook = (lifecycle) => (hook, target = currentInstance) => (!isInSSRComponentSetup || lifecycle === "sp") && injectHook(lifecycle, hook, target);
const onBeforeMount = createHook("bm");
const onMounted = createHook("m");
const onBeforeUpdate = createHook("bu");
const onUpdated = createHook("u");
const onBeforeUnmount = createHook("bum");
const onUnmounted = createHook("um");
const onServerPrefetch = createHook("sp");
const onRenderTriggered = createHook("rtg");
const onRenderTracked = createHook("rtc");
function onErrorCaptured(hook, target = currentInstance) {
  injectHook("ec", hook, target);
}
let shouldCacheAccess = true;
function applyOptions(instance) {
  const options = resolveMergedOptions(instance);
  const publicThis = instance.proxy;
  const ctx = instance.ctx;
  shouldCacheAccess = false;
  if (options.beforeCreate) {
    callHook$1(options.beforeCreate, instance, "bc");
  }
  const {
    data: dataOptions,
    computed: computedOptions,
    methods,
    watch: watchOptions,
    provide: provideOptions,
    inject: injectOptions,
    created,
    beforeMount,
    mounted,
    beforeUpdate,
    updated,
    activated,
    deactivated,
    beforeDestroy,
    beforeUnmount,
    destroyed,
    unmounted,
    render: render2,
    renderTracked,
    renderTriggered,
    errorCaptured,
    serverPrefetch,
    expose,
    inheritAttrs,
    components,
    directives,
    filters
  } = options;
  const checkDuplicateProperties = null;
  if (injectOptions) {
    resolveInjections(injectOptions, ctx, checkDuplicateProperties, instance.appContext.config.unwrapInjectedRef);
  }
  if (methods) {
    for (const key in methods) {
      const methodHandler = methods[key];
      if (isFunction$1(methodHandler)) {
        {
          ctx[key] = methodHandler.bind(publicThis);
        }
      }
    }
  }
  if (dataOptions) {
    const data = dataOptions.call(publicThis, publicThis);
    if (!isObject$1(data))
      ;
    else {
      instance.data = reactive(data);
    }
  }
  shouldCacheAccess = true;
  if (computedOptions) {
    for (const key in computedOptions) {
      const opt = computedOptions[key];
      const get2 = isFunction$1(opt) ? opt.bind(publicThis, publicThis) : isFunction$1(opt.get) ? opt.get.bind(publicThis, publicThis) : NOOP;
      const set2 = !isFunction$1(opt) && isFunction$1(opt.set) ? opt.set.bind(publicThis) : NOOP;
      const c = computed({
        get: get2,
        set: set2
      });
      Object.defineProperty(ctx, key, {
        enumerable: true,
        configurable: true,
        get: () => c.value,
        set: (v) => c.value = v
      });
    }
  }
  if (watchOptions) {
    for (const key in watchOptions) {
      createWatcher(watchOptions[key], ctx, publicThis, key);
    }
  }
  if (provideOptions) {
    const provides = isFunction$1(provideOptions) ? provideOptions.call(publicThis) : provideOptions;
    Reflect.ownKeys(provides).forEach((key) => {
      provide(key, provides[key]);
    });
  }
  if (created) {
    callHook$1(created, instance, "c");
  }
  function registerLifecycleHook(register, hook) {
    if (isArray$1(hook)) {
      hook.forEach((_hook) => register(_hook.bind(publicThis)));
    } else if (hook) {
      register(hook.bind(publicThis));
    }
  }
  registerLifecycleHook(onBeforeMount, beforeMount);
  registerLifecycleHook(onMounted, mounted);
  registerLifecycleHook(onBeforeUpdate, beforeUpdate);
  registerLifecycleHook(onUpdated, updated);
  registerLifecycleHook(onActivated, activated);
  registerLifecycleHook(onDeactivated, deactivated);
  registerLifecycleHook(onErrorCaptured, errorCaptured);
  registerLifecycleHook(onRenderTracked, renderTracked);
  registerLifecycleHook(onRenderTriggered, renderTriggered);
  registerLifecycleHook(onBeforeUnmount, beforeUnmount);
  registerLifecycleHook(onUnmounted, unmounted);
  registerLifecycleHook(onServerPrefetch, serverPrefetch);
  if (isArray$1(expose)) {
    if (expose.length) {
      const exposed = instance.exposed || (instance.exposed = {});
      expose.forEach((key) => {
        Object.defineProperty(exposed, key, {
          get: () => publicThis[key],
          set: (val) => publicThis[key] = val
        });
      });
    } else if (!instance.exposed) {
      instance.exposed = {};
    }
  }
  if (render2 && instance.render === NOOP) {
    instance.render = render2;
  }
  if (inheritAttrs != null) {
    instance.inheritAttrs = inheritAttrs;
  }
  if (components)
    instance.components = components;
  if (directives)
    instance.directives = directives;
}
function resolveInjections(injectOptions, ctx, checkDuplicateProperties = NOOP, unwrapRef = false) {
  if (isArray$1(injectOptions)) {
    injectOptions = normalizeInject(injectOptions);
  }
  for (const key in injectOptions) {
    const opt = injectOptions[key];
    let injected;
    if (isObject$1(opt)) {
      if ("default" in opt) {
        injected = inject(opt.from || key, opt.default, true);
      } else {
        injected = inject(opt.from || key);
      }
    } else {
      injected = inject(opt);
    }
    if (isRef(injected)) {
      if (unwrapRef) {
        Object.defineProperty(ctx, key, {
          enumerable: true,
          configurable: true,
          get: () => injected.value,
          set: (v) => injected.value = v
        });
      } else {
        ctx[key] = injected;
      }
    } else {
      ctx[key] = injected;
    }
  }
}
function callHook$1(hook, instance, type) {
  callWithAsyncErrorHandling(isArray$1(hook) ? hook.map((h2) => h2.bind(instance.proxy)) : hook.bind(instance.proxy), instance, type);
}
function createWatcher(raw, ctx, publicThis, key) {
  const getter = key.includes(".") ? createPathGetter(publicThis, key) : () => publicThis[key];
  if (isString$1(raw)) {
    const handler2 = ctx[raw];
    if (isFunction$1(handler2)) {
      watch(getter, handler2);
    }
  } else if (isFunction$1(raw)) {
    watch(getter, raw.bind(publicThis));
  } else if (isObject$1(raw)) {
    if (isArray$1(raw)) {
      raw.forEach((r) => createWatcher(r, ctx, publicThis, key));
    } else {
      const handler2 = isFunction$1(raw.handler) ? raw.handler.bind(publicThis) : ctx[raw.handler];
      if (isFunction$1(handler2)) {
        watch(getter, handler2, raw);
      }
    }
  } else
    ;
}
function resolveMergedOptions(instance) {
  const base = instance.type;
  const { mixins, extends: extendsOptions } = base;
  const { mixins: globalMixins, optionsCache: cache, config: { optionMergeStrategies } } = instance.appContext;
  const cached = cache.get(base);
  let resolved;
  if (cached) {
    resolved = cached;
  } else if (!globalMixins.length && !mixins && !extendsOptions) {
    {
      resolved = base;
    }
  } else {
    resolved = {};
    if (globalMixins.length) {
      globalMixins.forEach((m2) => mergeOptions$1(resolved, m2, optionMergeStrategies, true));
    }
    mergeOptions$1(resolved, base, optionMergeStrategies);
  }
  cache.set(base, resolved);
  return resolved;
}
function mergeOptions$1(to, from, strats, asMixin = false) {
  const { mixins, extends: extendsOptions } = from;
  if (extendsOptions) {
    mergeOptions$1(to, extendsOptions, strats, true);
  }
  if (mixins) {
    mixins.forEach((m2) => mergeOptions$1(to, m2, strats, true));
  }
  for (const key in from) {
    if (asMixin && key === "expose")
      ;
    else {
      const strat = internalOptionMergeStrats[key] || strats && strats[key];
      to[key] = strat ? strat(to[key], from[key]) : from[key];
    }
  }
  return to;
}
const internalOptionMergeStrats = {
  data: mergeDataFn,
  props: mergeObjectOptions,
  emits: mergeObjectOptions,
  methods: mergeObjectOptions,
  computed: mergeObjectOptions,
  beforeCreate: mergeAsArray,
  created: mergeAsArray,
  beforeMount: mergeAsArray,
  mounted: mergeAsArray,
  beforeUpdate: mergeAsArray,
  updated: mergeAsArray,
  beforeDestroy: mergeAsArray,
  beforeUnmount: mergeAsArray,
  destroyed: mergeAsArray,
  unmounted: mergeAsArray,
  activated: mergeAsArray,
  deactivated: mergeAsArray,
  errorCaptured: mergeAsArray,
  serverPrefetch: mergeAsArray,
  components: mergeObjectOptions,
  directives: mergeObjectOptions,
  watch: mergeWatchOptions,
  provide: mergeDataFn,
  inject: mergeInject
};
function mergeDataFn(to, from) {
  if (!from) {
    return to;
  }
  if (!to) {
    return from;
  }
  return function mergedDataFn() {
    return extend(isFunction$1(to) ? to.call(this, this) : to, isFunction$1(from) ? from.call(this, this) : from);
  };
}
function mergeInject(to, from) {
  return mergeObjectOptions(normalizeInject(to), normalizeInject(from));
}
function normalizeInject(raw) {
  if (isArray$1(raw)) {
    const res = {};
    for (let i = 0; i < raw.length; i++) {
      res[raw[i]] = raw[i];
    }
    return res;
  }
  return raw;
}
function mergeAsArray(to, from) {
  return to ? [...new Set([].concat(to, from))] : from;
}
function mergeObjectOptions(to, from) {
  return to ? extend(extend(Object.create(null), to), from) : from;
}
function mergeWatchOptions(to, from) {
  if (!to)
    return from;
  if (!from)
    return to;
  const merged = extend(Object.create(null), to);
  for (const key in from) {
    merged[key] = mergeAsArray(to[key], from[key]);
  }
  return merged;
}
function initProps(instance, rawProps, isStateful, isSSR = false) {
  const props = {};
  const attrs = {};
  def(attrs, InternalObjectKey, 1);
  instance.propsDefaults = Object.create(null);
  setFullProps(instance, rawProps, props, attrs);
  for (const key in instance.propsOptions[0]) {
    if (!(key in props)) {
      props[key] = void 0;
    }
  }
  if (isStateful) {
    instance.props = isSSR ? props : shallowReactive(props);
  } else {
    if (!instance.type.props) {
      instance.props = attrs;
    } else {
      instance.props = props;
    }
  }
  instance.attrs = attrs;
}
function updateProps(instance, rawProps, rawPrevProps, optimized) {
  const { props, attrs, vnode: { patchFlag } } = instance;
  const rawCurrentProps = toRaw(props);
  const [options] = instance.propsOptions;
  let hasAttrsChanged = false;
  if ((optimized || patchFlag > 0) && !(patchFlag & 16)) {
    if (patchFlag & 8) {
      const propsToUpdate = instance.vnode.dynamicProps;
      for (let i = 0; i < propsToUpdate.length; i++) {
        let key = propsToUpdate[i];
        const value = rawProps[key];
        if (options) {
          if (hasOwn(attrs, key)) {
            if (value !== attrs[key]) {
              attrs[key] = value;
              hasAttrsChanged = true;
            }
          } else {
            const camelizedKey = camelize(key);
            props[camelizedKey] = resolvePropValue(options, rawCurrentProps, camelizedKey, value, instance, false);
          }
        } else {
          if (value !== attrs[key]) {
            attrs[key] = value;
            hasAttrsChanged = true;
          }
        }
      }
    }
  } else {
    if (setFullProps(instance, rawProps, props, attrs)) {
      hasAttrsChanged = true;
    }
    let kebabKey;
    for (const key in rawCurrentProps) {
      if (!rawProps || !hasOwn(rawProps, key) && ((kebabKey = hyphenate(key)) === key || !hasOwn(rawProps, kebabKey))) {
        if (options) {
          if (rawPrevProps && (rawPrevProps[key] !== void 0 || rawPrevProps[kebabKey] !== void 0)) {
            props[key] = resolvePropValue(options, rawCurrentProps, key, void 0, instance, true);
          }
        } else {
          delete props[key];
        }
      }
    }
    if (attrs !== rawCurrentProps) {
      for (const key in attrs) {
        if (!rawProps || !hasOwn(rawProps, key)) {
          delete attrs[key];
          hasAttrsChanged = true;
        }
      }
    }
  }
  if (hasAttrsChanged) {
    trigger$1(instance, "set", "$attrs");
  }
}
function setFullProps(instance, rawProps, props, attrs) {
  const [options, needCastKeys] = instance.propsOptions;
  let hasAttrsChanged = false;
  let rawCastValues;
  if (rawProps) {
    for (let key in rawProps) {
      if (isReservedProp(key)) {
        continue;
      }
      const value = rawProps[key];
      let camelKey;
      if (options && hasOwn(options, camelKey = camelize(key))) {
        if (!needCastKeys || !needCastKeys.includes(camelKey)) {
          props[camelKey] = value;
        } else {
          (rawCastValues || (rawCastValues = {}))[camelKey] = value;
        }
      } else if (!isEmitListener(instance.emitsOptions, key)) {
        if (value !== attrs[key]) {
          attrs[key] = value;
          hasAttrsChanged = true;
        }
      }
    }
  }
  if (needCastKeys) {
    const rawCurrentProps = toRaw(props);
    const castValues = rawCastValues || EMPTY_OBJ;
    for (let i = 0; i < needCastKeys.length; i++) {
      const key = needCastKeys[i];
      props[key] = resolvePropValue(options, rawCurrentProps, key, castValues[key], instance, !hasOwn(castValues, key));
    }
  }
  return hasAttrsChanged;
}
function resolvePropValue(options, props, key, value, instance, isAbsent) {
  const opt = options[key];
  if (opt != null) {
    const hasDefault = hasOwn(opt, "default");
    if (hasDefault && value === void 0) {
      const defaultValue = opt.default;
      if (opt.type !== Function && isFunction$1(defaultValue)) {
        const { propsDefaults } = instance;
        if (key in propsDefaults) {
          value = propsDefaults[key];
        } else {
          setCurrentInstance(instance);
          value = propsDefaults[key] = defaultValue.call(null, props);
          unsetCurrentInstance();
        }
      } else {
        value = defaultValue;
      }
    }
    if (opt[0]) {
      if (isAbsent && !hasDefault) {
        value = false;
      } else if (opt[1] && (value === "" || value === hyphenate(key))) {
        value = true;
      }
    }
  }
  return value;
}
function normalizePropsOptions(comp, appContext, asMixin = false) {
  const cache = appContext.propsCache;
  const cached = cache.get(comp);
  if (cached) {
    return cached;
  }
  const raw = comp.props;
  const normalized = {};
  const needCastKeys = [];
  let hasExtends = false;
  if (!isFunction$1(comp)) {
    const extendProps = (raw2) => {
      hasExtends = true;
      const [props, keys] = normalizePropsOptions(raw2, appContext, true);
      extend(normalized, props);
      if (keys)
        needCastKeys.push(...keys);
    };
    if (!asMixin && appContext.mixins.length) {
      appContext.mixins.forEach(extendProps);
    }
    if (comp.extends) {
      extendProps(comp.extends);
    }
    if (comp.mixins) {
      comp.mixins.forEach(extendProps);
    }
  }
  if (!raw && !hasExtends) {
    cache.set(comp, EMPTY_ARR);
    return EMPTY_ARR;
  }
  if (isArray$1(raw)) {
    for (let i = 0; i < raw.length; i++) {
      const normalizedKey = camelize(raw[i]);
      if (validatePropName(normalizedKey)) {
        normalized[normalizedKey] = EMPTY_OBJ;
      }
    }
  } else if (raw) {
    for (const key in raw) {
      const normalizedKey = camelize(key);
      if (validatePropName(normalizedKey)) {
        const opt = raw[key];
        const prop = normalized[normalizedKey] = isArray$1(opt) || isFunction$1(opt) ? { type: opt } : opt;
        if (prop) {
          const booleanIndex = getTypeIndex(Boolean, prop.type);
          const stringIndex = getTypeIndex(String, prop.type);
          prop[0] = booleanIndex > -1;
          prop[1] = stringIndex < 0 || booleanIndex < stringIndex;
          if (booleanIndex > -1 || hasOwn(prop, "default")) {
            needCastKeys.push(normalizedKey);
          }
        }
      }
    }
  }
  const res = [normalized, needCastKeys];
  cache.set(comp, res);
  return res;
}
function validatePropName(key) {
  if (key[0] !== "$") {
    return true;
  }
  return false;
}
function getType(ctor) {
  const match = ctor && ctor.toString().match(/^\s*function (\w+)/);
  return match ? match[1] : ctor === null ? "null" : "";
}
function isSameType(a, b) {
  return getType(a) === getType(b);
}
function getTypeIndex(type, expectedTypes) {
  if (isArray$1(expectedTypes)) {
    return expectedTypes.findIndex((t) => isSameType(t, type));
  } else if (isFunction$1(expectedTypes)) {
    return isSameType(expectedTypes, type) ? 0 : -1;
  }
  return -1;
}
const isInternalKey = (key) => key[0] === "_" || key === "$stable";
const normalizeSlotValue = (value) => isArray$1(value) ? value.map(normalizeVNode) : [normalizeVNode(value)];
const normalizeSlot$1 = (key, rawSlot, ctx) => {
  const normalized = withCtx((...args) => {
    return normalizeSlotValue(rawSlot(...args));
  }, ctx);
  normalized._c = false;
  return normalized;
};
const normalizeObjectSlots = (rawSlots, slots, instance) => {
  const ctx = rawSlots._ctx;
  for (const key in rawSlots) {
    if (isInternalKey(key))
      continue;
    const value = rawSlots[key];
    if (isFunction$1(value)) {
      slots[key] = normalizeSlot$1(key, value, ctx);
    } else if (value != null) {
      const normalized = normalizeSlotValue(value);
      slots[key] = () => normalized;
    }
  }
};
const normalizeVNodeSlots = (instance, children) => {
  const normalized = normalizeSlotValue(children);
  instance.slots.default = () => normalized;
};
const initSlots = (instance, children) => {
  if (instance.vnode.shapeFlag & 32) {
    const type = children._;
    if (type) {
      instance.slots = toRaw(children);
      def(children, "_", type);
    } else {
      normalizeObjectSlots(children, instance.slots = {});
    }
  } else {
    instance.slots = {};
    if (children) {
      normalizeVNodeSlots(instance, children);
    }
  }
  def(instance.slots, InternalObjectKey, 1);
};
const updateSlots = (instance, children, optimized) => {
  const { vnode, slots } = instance;
  let needDeletionCheck = true;
  let deletionComparisonTarget = EMPTY_OBJ;
  if (vnode.shapeFlag & 32) {
    const type = children._;
    if (type) {
      if (optimized && type === 1) {
        needDeletionCheck = false;
      } else {
        extend(slots, children);
        if (!optimized && type === 1) {
          delete slots._;
        }
      }
    } else {
      needDeletionCheck = !children.$stable;
      normalizeObjectSlots(children, slots);
    }
    deletionComparisonTarget = children;
  } else if (children) {
    normalizeVNodeSlots(instance, children);
    deletionComparisonTarget = { default: 1 };
  }
  if (needDeletionCheck) {
    for (const key in slots) {
      if (!isInternalKey(key) && !(key in deletionComparisonTarget)) {
        delete slots[key];
      }
    }
  }
};
function withDirectives(vnode, directives) {
  const internalInstance = currentRenderingInstance;
  if (internalInstance === null) {
    return vnode;
  }
  const instance = internalInstance.proxy;
  const bindings = vnode.dirs || (vnode.dirs = []);
  for (let i = 0; i < directives.length; i++) {
    let [dir, value, arg, modifiers = EMPTY_OBJ] = directives[i];
    if (isFunction$1(dir)) {
      dir = {
        mounted: dir,
        updated: dir
      };
    }
    if (dir.deep) {
      traverse(value);
    }
    bindings.push({
      dir,
      instance,
      value,
      oldValue: void 0,
      arg,
      modifiers
    });
  }
  return vnode;
}
function invokeDirectiveHook(vnode, prevVNode, instance, name) {
  const bindings = vnode.dirs;
  const oldBindings = prevVNode && prevVNode.dirs;
  for (let i = 0; i < bindings.length; i++) {
    const binding = bindings[i];
    if (oldBindings) {
      binding.oldValue = oldBindings[i].value;
    }
    let hook = binding.dir[name];
    if (hook) {
      pauseTracking();
      callWithAsyncErrorHandling(hook, instance, 8, [
        vnode.el,
        binding,
        vnode,
        prevVNode
      ]);
      resetTracking();
    }
  }
}
function createAppContext() {
  return {
    app: null,
    config: {
      isNativeTag: NO,
      performance: false,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {}
    },
    mixins: [],
    components: {},
    directives: {},
    provides: Object.create(null),
    optionsCache: new WeakMap(),
    propsCache: new WeakMap(),
    emitsCache: new WeakMap()
  };
}
let uid = 0;
function createAppAPI(render2, hydrate) {
  return function createApp(rootComponent, rootProps = null) {
    if (rootProps != null && !isObject$1(rootProps)) {
      rootProps = null;
    }
    const context = createAppContext();
    const installedPlugins = new Set();
    let isMounted = false;
    const app = context.app = {
      _uid: uid++,
      _component: rootComponent,
      _props: rootProps,
      _container: null,
      _context: context,
      _instance: null,
      version,
      get config() {
        return context.config;
      },
      set config(v) {
      },
      use(plugin, ...options) {
        if (installedPlugins.has(plugin))
          ;
        else if (plugin && isFunction$1(plugin.install)) {
          installedPlugins.add(plugin);
          plugin.install(app, ...options);
        } else if (isFunction$1(plugin)) {
          installedPlugins.add(plugin);
          plugin(app, ...options);
        } else
          ;
        return app;
      },
      mixin(mixin) {
        {
          if (!context.mixins.includes(mixin)) {
            context.mixins.push(mixin);
          }
        }
        return app;
      },
      component(name, component) {
        if (!component) {
          return context.components[name];
        }
        context.components[name] = component;
        return app;
      },
      directive(name, directive) {
        if (!directive) {
          return context.directives[name];
        }
        context.directives[name] = directive;
        return app;
      },
      mount(rootContainer, isHydrate, isSVG) {
        if (!isMounted) {
          const vnode = createVNode(rootComponent, rootProps);
          vnode.appContext = context;
          if (isHydrate && hydrate) {
            hydrate(vnode, rootContainer);
          } else {
            render2(vnode, rootContainer, isSVG);
          }
          isMounted = true;
          app._container = rootContainer;
          rootContainer.__vue_app__ = app;
          return getExposeProxy(vnode.component) || vnode.component.proxy;
        }
      },
      unmount() {
        if (isMounted) {
          render2(null, app._container);
          delete app._container.__vue_app__;
        }
      },
      provide(key, value) {
        context.provides[key] = value;
        return app;
      }
    };
    return app;
  };
}
let hasMismatch = false;
const isSVGContainer = (container) => /svg/.test(container.namespaceURI) && container.tagName !== "foreignObject";
const isComment = (node) => node.nodeType === 8;
function createHydrationFunctions(rendererInternals) {
  const { mt: mountComponent, p: patch, o: { patchProp: patchProp2, nextSibling, parentNode, remove: remove2, insert, createComment } } = rendererInternals;
  const hydrate = (vnode, container) => {
    if (!container.hasChildNodes()) {
      patch(null, vnode, container);
      flushPostFlushCbs();
      return;
    }
    hasMismatch = false;
    hydrateNode(container.firstChild, vnode, null, null, null);
    flushPostFlushCbs();
    if (hasMismatch && true) {
      console.error(`Hydration completed but contains mismatches.`);
    }
  };
  const hydrateNode = (node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized = false) => {
    const isFragmentStart = isComment(node) && node.data === "[";
    const onMismatch = () => handleMismatch(node, vnode, parentComponent, parentSuspense, slotScopeIds, isFragmentStart);
    const { type, ref: ref2, shapeFlag } = vnode;
    const domType = node.nodeType;
    vnode.el = node;
    let nextNode = null;
    switch (type) {
      case Text:
        if (domType !== 3) {
          nextNode = onMismatch();
        } else {
          if (node.data !== vnode.children) {
            hasMismatch = true;
            node.data = vnode.children;
          }
          nextNode = nextSibling(node);
        }
        break;
      case Comment:
        if (domType !== 8 || isFragmentStart) {
          nextNode = onMismatch();
        } else {
          nextNode = nextSibling(node);
        }
        break;
      case Static:
        if (domType !== 1) {
          nextNode = onMismatch();
        } else {
          nextNode = node;
          const needToAdoptContent = !vnode.children.length;
          for (let i = 0; i < vnode.staticCount; i++) {
            if (needToAdoptContent)
              vnode.children += nextNode.outerHTML;
            if (i === vnode.staticCount - 1) {
              vnode.anchor = nextNode;
            }
            nextNode = nextSibling(nextNode);
          }
          return nextNode;
        }
        break;
      case Fragment:
        if (!isFragmentStart) {
          nextNode = onMismatch();
        } else {
          nextNode = hydrateFragment(node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized);
        }
        break;
      default:
        if (shapeFlag & 1) {
          if (domType !== 1 || vnode.type.toLowerCase() !== node.tagName.toLowerCase()) {
            nextNode = onMismatch();
          } else {
            nextNode = hydrateElement(node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized);
          }
        } else if (shapeFlag & 6) {
          vnode.slotScopeIds = slotScopeIds;
          const container = parentNode(node);
          mountComponent(vnode, container, null, parentComponent, parentSuspense, isSVGContainer(container), optimized);
          nextNode = isFragmentStart ? locateClosingAsyncAnchor(node) : nextSibling(node);
          if (isAsyncWrapper(vnode)) {
            let subTree;
            if (isFragmentStart) {
              subTree = createVNode(Fragment);
              subTree.anchor = nextNode ? nextNode.previousSibling : container.lastChild;
            } else {
              subTree = node.nodeType === 3 ? createTextVNode("") : createVNode("div");
            }
            subTree.el = node;
            vnode.component.subTree = subTree;
          }
        } else if (shapeFlag & 64) {
          if (domType !== 8) {
            nextNode = onMismatch();
          } else {
            nextNode = vnode.type.hydrate(node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized, rendererInternals, hydrateChildren);
          }
        } else if (shapeFlag & 128) {
          nextNode = vnode.type.hydrate(node, vnode, parentComponent, parentSuspense, isSVGContainer(parentNode(node)), slotScopeIds, optimized, rendererInternals, hydrateNode);
        } else
          ;
    }
    if (ref2 != null) {
      setRef(ref2, null, parentSuspense, vnode);
    }
    return nextNode;
  };
  const hydrateElement = (el, vnode, parentComponent, parentSuspense, slotScopeIds, optimized) => {
    optimized = optimized || !!vnode.dynamicChildren;
    const { type, props, patchFlag, shapeFlag, dirs } = vnode;
    const forcePatchValue = type === "input" && dirs || type === "option";
    if (forcePatchValue || patchFlag !== -1) {
      if (dirs) {
        invokeDirectiveHook(vnode, null, parentComponent, "created");
      }
      if (props) {
        if (forcePatchValue || !optimized || patchFlag & (16 | 32)) {
          for (const key in props) {
            if (forcePatchValue && key.endsWith("value") || isOn(key) && !isReservedProp(key)) {
              patchProp2(el, key, null, props[key], false, void 0, parentComponent);
            }
          }
        } else if (props.onClick) {
          patchProp2(el, "onClick", null, props.onClick, false, void 0, parentComponent);
        }
      }
      let vnodeHooks;
      if (vnodeHooks = props && props.onVnodeBeforeMount) {
        invokeVNodeHook(vnodeHooks, parentComponent, vnode);
      }
      if (dirs) {
        invokeDirectiveHook(vnode, null, parentComponent, "beforeMount");
      }
      if ((vnodeHooks = props && props.onVnodeMounted) || dirs) {
        queueEffectWithSuspense(() => {
          vnodeHooks && invokeVNodeHook(vnodeHooks, parentComponent, vnode);
          dirs && invokeDirectiveHook(vnode, null, parentComponent, "mounted");
        }, parentSuspense);
      }
      if (shapeFlag & 16 && !(props && (props.innerHTML || props.textContent))) {
        let next = hydrateChildren(el.firstChild, vnode, el, parentComponent, parentSuspense, slotScopeIds, optimized);
        while (next) {
          hasMismatch = true;
          const cur = next;
          next = next.nextSibling;
          remove2(cur);
        }
      } else if (shapeFlag & 8) {
        if (el.textContent !== vnode.children) {
          hasMismatch = true;
          el.textContent = vnode.children;
        }
      }
    }
    return el.nextSibling;
  };
  const hydrateChildren = (node, parentVNode, container, parentComponent, parentSuspense, slotScopeIds, optimized) => {
    optimized = optimized || !!parentVNode.dynamicChildren;
    const children = parentVNode.children;
    const l = children.length;
    for (let i = 0; i < l; i++) {
      const vnode = optimized ? children[i] : children[i] = normalizeVNode(children[i]);
      if (node) {
        node = hydrateNode(node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized);
      } else if (vnode.type === Text && !vnode.children) {
        continue;
      } else {
        hasMismatch = true;
        patch(null, vnode, container, null, parentComponent, parentSuspense, isSVGContainer(container), slotScopeIds);
      }
    }
    return node;
  };
  const hydrateFragment = (node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized) => {
    const { slotScopeIds: fragmentSlotScopeIds } = vnode;
    if (fragmentSlotScopeIds) {
      slotScopeIds = slotScopeIds ? slotScopeIds.concat(fragmentSlotScopeIds) : fragmentSlotScopeIds;
    }
    const container = parentNode(node);
    const next = hydrateChildren(nextSibling(node), vnode, container, parentComponent, parentSuspense, slotScopeIds, optimized);
    if (next && isComment(next) && next.data === "]") {
      return nextSibling(vnode.anchor = next);
    } else {
      hasMismatch = true;
      insert(vnode.anchor = createComment(`]`), container, next);
      return next;
    }
  };
  const handleMismatch = (node, vnode, parentComponent, parentSuspense, slotScopeIds, isFragment) => {
    hasMismatch = true;
    vnode.el = null;
    if (isFragment) {
      const end = locateClosingAsyncAnchor(node);
      while (true) {
        const next2 = nextSibling(node);
        if (next2 && next2 !== end) {
          remove2(next2);
        } else {
          break;
        }
      }
    }
    const next = nextSibling(node);
    const container = parentNode(node);
    remove2(node);
    patch(null, vnode, container, next, parentComponent, parentSuspense, isSVGContainer(container), slotScopeIds);
    return next;
  };
  const locateClosingAsyncAnchor = (node) => {
    let match = 0;
    while (node) {
      node = nextSibling(node);
      if (node && isComment(node)) {
        if (node.data === "[")
          match++;
        if (node.data === "]") {
          if (match === 0) {
            return nextSibling(node);
          } else {
            match--;
          }
        }
      }
    }
    return node;
  };
  return [hydrate, hydrateNode];
}
const queuePostRenderEffect = queueEffectWithSuspense;
function createHydrationRenderer(options) {
  return baseCreateRenderer(options, createHydrationFunctions);
}
function baseCreateRenderer(options, createHydrationFns) {
  const target = getGlobalThis();
  target.__VUE__ = true;
  const { insert: hostInsert, remove: hostRemove, patchProp: hostPatchProp, createElement: hostCreateElement, createText: hostCreateText, createComment: hostCreateComment, setText: hostSetText, setElementText: hostSetElementText, parentNode: hostParentNode, nextSibling: hostNextSibling, setScopeId: hostSetScopeId = NOOP, cloneNode: hostCloneNode, insertStaticContent: hostInsertStaticContent } = options;
  const patch = (n1, n2, container, anchor = null, parentComponent = null, parentSuspense = null, isSVG = false, slotScopeIds = null, optimized = !!n2.dynamicChildren) => {
    if (n1 === n2) {
      return;
    }
    if (n1 && !isSameVNodeType(n1, n2)) {
      anchor = getNextHostNode(n1);
      unmount(n1, parentComponent, parentSuspense, true);
      n1 = null;
    }
    if (n2.patchFlag === -2) {
      optimized = false;
      n2.dynamicChildren = null;
    }
    const { type, ref: ref2, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container, anchor);
        break;
      case Comment:
        processCommentNode(n1, n2, container, anchor);
        break;
      case Static:
        if (n1 == null) {
          mountStaticNode(n2, container, anchor, isSVG);
        }
        break;
      case Fragment:
        processFragment(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
        break;
      default:
        if (shapeFlag & 1) {
          processElement(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
        } else if (shapeFlag & 6) {
          processComponent(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
        } else if (shapeFlag & 64) {
          type.process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, internals);
        } else if (shapeFlag & 128) {
          type.process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, internals);
        } else
          ;
    }
    if (ref2 != null && parentComponent) {
      setRef(ref2, n1 && n1.ref, parentSuspense, n2 || n1, !n2);
    }
  };
  const processText = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert(n2.el = hostCreateText(n2.children), container, anchor);
    } else {
      const el = n2.el = n1.el;
      if (n2.children !== n1.children) {
        hostSetText(el, n2.children);
      }
    }
  };
  const processCommentNode = (n1, n2, container, anchor) => {
    if (n1 == null) {
      hostInsert(n2.el = hostCreateComment(n2.children || ""), container, anchor);
    } else {
      n2.el = n1.el;
    }
  };
  const mountStaticNode = (n2, container, anchor, isSVG) => {
    [n2.el, n2.anchor] = hostInsertStaticContent(n2.children, container, anchor, isSVG);
  };
  const moveStaticNode = ({ el, anchor }, container, nextSibling) => {
    let next;
    while (el && el !== anchor) {
      next = hostNextSibling(el);
      hostInsert(el, container, nextSibling);
      el = next;
    }
    hostInsert(anchor, container, nextSibling);
  };
  const removeStaticNode = ({ el, anchor }) => {
    let next;
    while (el && el !== anchor) {
      next = hostNextSibling(el);
      hostRemove(el);
      el = next;
    }
    hostRemove(anchor);
  };
  const processElement = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
    isSVG = isSVG || n2.type === "svg";
    if (n1 == null) {
      mountElement(n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
    } else {
      patchElement(n1, n2, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
    }
  };
  const mountElement = (vnode, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
    let el;
    let vnodeHook;
    const { type, props, shapeFlag, transition, patchFlag, dirs } = vnode;
    if (vnode.el && hostCloneNode !== void 0 && patchFlag === -1) {
      el = vnode.el = hostCloneNode(vnode.el);
    } else {
      el = vnode.el = hostCreateElement(vnode.type, isSVG, props && props.is, props);
      if (shapeFlag & 8) {
        hostSetElementText(el, vnode.children);
      } else if (shapeFlag & 16) {
        mountChildren(vnode.children, el, null, parentComponent, parentSuspense, isSVG && type !== "foreignObject", slotScopeIds, optimized);
      }
      if (dirs) {
        invokeDirectiveHook(vnode, null, parentComponent, "created");
      }
      if (props) {
        for (const key in props) {
          if (key !== "value" && !isReservedProp(key)) {
            hostPatchProp(el, key, null, props[key], isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
          }
        }
        if ("value" in props) {
          hostPatchProp(el, "value", null, props.value);
        }
        if (vnodeHook = props.onVnodeBeforeMount) {
          invokeVNodeHook(vnodeHook, parentComponent, vnode);
        }
      }
      setScopeId(el, vnode, vnode.scopeId, slotScopeIds, parentComponent);
    }
    if (dirs) {
      invokeDirectiveHook(vnode, null, parentComponent, "beforeMount");
    }
    const needCallTransitionHooks = (!parentSuspense || parentSuspense && !parentSuspense.pendingBranch) && transition && !transition.persisted;
    if (needCallTransitionHooks) {
      transition.beforeEnter(el);
    }
    hostInsert(el, container, anchor);
    if ((vnodeHook = props && props.onVnodeMounted) || needCallTransitionHooks || dirs) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
        needCallTransitionHooks && transition.enter(el);
        dirs && invokeDirectiveHook(vnode, null, parentComponent, "mounted");
      }, parentSuspense);
    }
  };
  const setScopeId = (el, vnode, scopeId, slotScopeIds, parentComponent) => {
    if (scopeId) {
      hostSetScopeId(el, scopeId);
    }
    if (slotScopeIds) {
      for (let i = 0; i < slotScopeIds.length; i++) {
        hostSetScopeId(el, slotScopeIds[i]);
      }
    }
    if (parentComponent) {
      let subTree = parentComponent.subTree;
      if (vnode === subTree) {
        const parentVNode = parentComponent.vnode;
        setScopeId(el, parentVNode, parentVNode.scopeId, parentVNode.slotScopeIds, parentComponent.parent);
      }
    }
  };
  const mountChildren = (children, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, start = 0) => {
    for (let i = start; i < children.length; i++) {
      const child = children[i] = optimized ? cloneIfMounted(children[i]) : normalizeVNode(children[i]);
      patch(null, child, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
    }
  };
  const patchElement = (n1, n2, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
    const el = n2.el = n1.el;
    let { patchFlag, dynamicChildren, dirs } = n2;
    patchFlag |= n1.patchFlag & 16;
    const oldProps = n1.props || EMPTY_OBJ;
    const newProps = n2.props || EMPTY_OBJ;
    let vnodeHook;
    if (vnodeHook = newProps.onVnodeBeforeUpdate) {
      invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
    }
    if (dirs) {
      invokeDirectiveHook(n2, n1, parentComponent, "beforeUpdate");
    }
    const areChildrenSVG = isSVG && n2.type !== "foreignObject";
    if (dynamicChildren) {
      patchBlockChildren(n1.dynamicChildren, dynamicChildren, el, parentComponent, parentSuspense, areChildrenSVG, slotScopeIds);
    } else if (!optimized) {
      patchChildren(n1, n2, el, null, parentComponent, parentSuspense, areChildrenSVG, slotScopeIds, false);
    }
    if (patchFlag > 0) {
      if (patchFlag & 16) {
        patchProps(el, n2, oldProps, newProps, parentComponent, parentSuspense, isSVG);
      } else {
        if (patchFlag & 2) {
          if (oldProps.class !== newProps.class) {
            hostPatchProp(el, "class", null, newProps.class, isSVG);
          }
        }
        if (patchFlag & 4) {
          hostPatchProp(el, "style", oldProps.style, newProps.style, isSVG);
        }
        if (patchFlag & 8) {
          const propsToUpdate = n2.dynamicProps;
          for (let i = 0; i < propsToUpdate.length; i++) {
            const key = propsToUpdate[i];
            const prev = oldProps[key];
            const next = newProps[key];
            if (next !== prev || key === "value") {
              hostPatchProp(el, key, prev, next, isSVG, n1.children, parentComponent, parentSuspense, unmountChildren);
            }
          }
        }
      }
      if (patchFlag & 1) {
        if (n1.children !== n2.children) {
          hostSetElementText(el, n2.children);
        }
      }
    } else if (!optimized && dynamicChildren == null) {
      patchProps(el, n2, oldProps, newProps, parentComponent, parentSuspense, isSVG);
    }
    if ((vnodeHook = newProps.onVnodeUpdated) || dirs) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, n2, n1);
        dirs && invokeDirectiveHook(n2, n1, parentComponent, "updated");
      }, parentSuspense);
    }
  };
  const patchBlockChildren = (oldChildren, newChildren, fallbackContainer, parentComponent, parentSuspense, isSVG, slotScopeIds) => {
    for (let i = 0; i < newChildren.length; i++) {
      const oldVNode = oldChildren[i];
      const newVNode = newChildren[i];
      const container = oldVNode.el && (oldVNode.type === Fragment || !isSameVNodeType(oldVNode, newVNode) || oldVNode.shapeFlag & (6 | 64)) ? hostParentNode(oldVNode.el) : fallbackContainer;
      patch(oldVNode, newVNode, container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, true);
    }
  };
  const patchProps = (el, vnode, oldProps, newProps, parentComponent, parentSuspense, isSVG) => {
    if (oldProps !== newProps) {
      for (const key in newProps) {
        if (isReservedProp(key))
          continue;
        const next = newProps[key];
        const prev = oldProps[key];
        if (next !== prev && key !== "value") {
          hostPatchProp(el, key, prev, next, isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
        }
      }
      if (oldProps !== EMPTY_OBJ) {
        for (const key in oldProps) {
          if (!isReservedProp(key) && !(key in newProps)) {
            hostPatchProp(el, key, oldProps[key], null, isSVG, vnode.children, parentComponent, parentSuspense, unmountChildren);
          }
        }
      }
      if ("value" in newProps) {
        hostPatchProp(el, "value", oldProps.value, newProps.value);
      }
    }
  };
  const processFragment = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
    const fragmentStartAnchor = n2.el = n1 ? n1.el : hostCreateText("");
    const fragmentEndAnchor = n2.anchor = n1 ? n1.anchor : hostCreateText("");
    let { patchFlag, dynamicChildren, slotScopeIds: fragmentSlotScopeIds } = n2;
    if (fragmentSlotScopeIds) {
      slotScopeIds = slotScopeIds ? slotScopeIds.concat(fragmentSlotScopeIds) : fragmentSlotScopeIds;
    }
    if (n1 == null) {
      hostInsert(fragmentStartAnchor, container, anchor);
      hostInsert(fragmentEndAnchor, container, anchor);
      mountChildren(n2.children, container, fragmentEndAnchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
    } else {
      if (patchFlag > 0 && patchFlag & 64 && dynamicChildren && n1.dynamicChildren) {
        patchBlockChildren(n1.dynamicChildren, dynamicChildren, container, parentComponent, parentSuspense, isSVG, slotScopeIds);
        if (n2.key != null || parentComponent && n2 === parentComponent.subTree) {
          traverseStaticChildren(n1, n2, true);
        }
      } else {
        patchChildren(n1, n2, container, fragmentEndAnchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
      }
    }
  };
  const processComponent = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
    n2.slotScopeIds = slotScopeIds;
    if (n1 == null) {
      if (n2.shapeFlag & 512) {
        parentComponent.ctx.activate(n2, container, anchor, isSVG, optimized);
      } else {
        mountComponent(n2, container, anchor, parentComponent, parentSuspense, isSVG, optimized);
      }
    } else {
      updateComponent(n1, n2, optimized);
    }
  };
  const mountComponent = (initialVNode, container, anchor, parentComponent, parentSuspense, isSVG, optimized) => {
    const instance = initialVNode.component = createComponentInstance(initialVNode, parentComponent, parentSuspense);
    if (isKeepAlive(initialVNode)) {
      instance.ctx.renderer = internals;
    }
    {
      setupComponent(instance);
    }
    if (instance.asyncDep) {
      parentSuspense && parentSuspense.registerDep(instance, setupRenderEffect);
      if (!initialVNode.el) {
        const placeholder = instance.subTree = createVNode(Comment);
        processCommentNode(null, placeholder, container, anchor);
      }
      return;
    }
    setupRenderEffect(instance, initialVNode, container, anchor, parentSuspense, isSVG, optimized);
  };
  const updateComponent = (n1, n2, optimized) => {
    const instance = n2.component = n1.component;
    if (shouldUpdateComponent(n1, n2, optimized)) {
      if (instance.asyncDep && !instance.asyncResolved) {
        updateComponentPreRender(instance, n2, optimized);
        return;
      } else {
        instance.next = n2;
        invalidateJob(instance.update);
        instance.update();
      }
    } else {
      n2.component = n1.component;
      n2.el = n1.el;
      instance.vnode = n2;
    }
  };
  const setupRenderEffect = (instance, initialVNode, container, anchor, parentSuspense, isSVG, optimized) => {
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        let vnodeHook;
        const { el, props } = initialVNode;
        const { bm, m: m2, parent: parent2 } = instance;
        const isAsyncWrapperVNode = isAsyncWrapper(initialVNode);
        effect.allowRecurse = false;
        if (bm) {
          invokeArrayFns(bm);
        }
        if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeBeforeMount)) {
          invokeVNodeHook(vnodeHook, parent2, initialVNode);
        }
        effect.allowRecurse = true;
        if (el && hydrateNode) {
          const hydrateSubTree = () => {
            instance.subTree = renderComponentRoot(instance);
            hydrateNode(el, instance.subTree, instance, parentSuspense, null);
          };
          if (isAsyncWrapperVNode) {
            initialVNode.type.__asyncLoader().then(() => !instance.isUnmounted && hydrateSubTree());
          } else {
            hydrateSubTree();
          }
        } else {
          const subTree = instance.subTree = renderComponentRoot(instance);
          patch(null, subTree, container, anchor, instance, parentSuspense, isSVG);
          initialVNode.el = subTree.el;
        }
        if (m2) {
          queuePostRenderEffect(m2, parentSuspense);
        }
        if (!isAsyncWrapperVNode && (vnodeHook = props && props.onVnodeMounted)) {
          const scopedInitialVNode = initialVNode;
          queuePostRenderEffect(() => invokeVNodeHook(vnodeHook, parent2, scopedInitialVNode), parentSuspense);
        }
        if (initialVNode.shapeFlag & 256) {
          instance.a && queuePostRenderEffect(instance.a, parentSuspense);
        }
        instance.isMounted = true;
        initialVNode = container = anchor = null;
      } else {
        let { next, bu, u, parent: parent2, vnode } = instance;
        let originNext = next;
        let vnodeHook;
        effect.allowRecurse = false;
        if (next) {
          next.el = vnode.el;
          updateComponentPreRender(instance, next, optimized);
        } else {
          next = vnode;
        }
        if (bu) {
          invokeArrayFns(bu);
        }
        if (vnodeHook = next.props && next.props.onVnodeBeforeUpdate) {
          invokeVNodeHook(vnodeHook, parent2, next, vnode);
        }
        effect.allowRecurse = true;
        const nextTree = renderComponentRoot(instance);
        const prevTree = instance.subTree;
        instance.subTree = nextTree;
        patch(prevTree, nextTree, hostParentNode(prevTree.el), getNextHostNode(prevTree), instance, parentSuspense, isSVG);
        next.el = nextTree.el;
        if (originNext === null) {
          updateHOCHostEl(instance, nextTree.el);
        }
        if (u) {
          queuePostRenderEffect(u, parentSuspense);
        }
        if (vnodeHook = next.props && next.props.onVnodeUpdated) {
          queuePostRenderEffect(() => invokeVNodeHook(vnodeHook, parent2, next, vnode), parentSuspense);
        }
      }
    };
    const effect = new ReactiveEffect(componentUpdateFn, () => queueJob(instance.update), instance.scope);
    const update = instance.update = effect.run.bind(effect);
    update.id = instance.uid;
    effect.allowRecurse = update.allowRecurse = true;
    update();
  };
  const updateComponentPreRender = (instance, nextVNode, optimized) => {
    nextVNode.component = instance;
    const prevProps = instance.vnode.props;
    instance.vnode = nextVNode;
    instance.next = null;
    updateProps(instance, nextVNode.props, prevProps, optimized);
    updateSlots(instance, nextVNode.children, optimized);
    pauseTracking();
    flushPreFlushCbs(void 0, instance.update);
    resetTracking();
  };
  const patchChildren = (n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized = false) => {
    const c1 = n1 && n1.children;
    const prevShapeFlag = n1 ? n1.shapeFlag : 0;
    const c2 = n2.children;
    const { patchFlag, shapeFlag } = n2;
    if (patchFlag > 0) {
      if (patchFlag & 128) {
        patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
        return;
      } else if (patchFlag & 256) {
        patchUnkeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
        return;
      }
    }
    if (shapeFlag & 8) {
      if (prevShapeFlag & 16) {
        unmountChildren(c1, parentComponent, parentSuspense);
      }
      if (c2 !== c1) {
        hostSetElementText(container, c2);
      }
    } else {
      if (prevShapeFlag & 16) {
        if (shapeFlag & 16) {
          patchKeyedChildren(c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
        } else {
          unmountChildren(c1, parentComponent, parentSuspense, true);
        }
      } else {
        if (prevShapeFlag & 8) {
          hostSetElementText(container, "");
        }
        if (shapeFlag & 16) {
          mountChildren(c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
        }
      }
    }
  };
  const patchUnkeyedChildren = (c1, c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
    c1 = c1 || EMPTY_ARR;
    c2 = c2 || EMPTY_ARR;
    const oldLength = c1.length;
    const newLength = c2.length;
    const commonLength = Math.min(oldLength, newLength);
    let i;
    for (i = 0; i < commonLength; i++) {
      const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
      patch(c1[i], nextChild, container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
    }
    if (oldLength > newLength) {
      unmountChildren(c1, parentComponent, parentSuspense, true, false, commonLength);
    } else {
      mountChildren(c2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, commonLength);
    }
  };
  const patchKeyedChildren = (c1, c2, container, parentAnchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized) => {
    let i = 0;
    const l2 = c2.length;
    let e1 = c1.length - 1;
    let e2 = l2 - 1;
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
      } else {
        break;
      }
      i++;
    }
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2] = optimized ? cloneIfMounted(c2[e2]) : normalizeVNode(c2[e2]);
      if (isSameVNodeType(n1, n2)) {
        patch(n1, n2, container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    if (i > e1) {
      if (i <= e2) {
        const nextPos = e2 + 1;
        const anchor = nextPos < l2 ? c2[nextPos].el : parentAnchor;
        while (i <= e2) {
          patch(null, c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]), container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
          i++;
        }
      }
    } else if (i > e2) {
      while (i <= e1) {
        unmount(c1[i], parentComponent, parentSuspense, true);
        i++;
      }
    } else {
      const s1 = i;
      const s2 = i;
      const keyToNewIndexMap = new Map();
      for (i = s2; i <= e2; i++) {
        const nextChild = c2[i] = optimized ? cloneIfMounted(c2[i]) : normalizeVNode(c2[i]);
        if (nextChild.key != null) {
          keyToNewIndexMap.set(nextChild.key, i);
        }
      }
      let j;
      let patched = 0;
      const toBePatched = e2 - s2 + 1;
      let moved = false;
      let maxNewIndexSoFar = 0;
      const newIndexToOldIndexMap = new Array(toBePatched);
      for (i = 0; i < toBePatched; i++)
        newIndexToOldIndexMap[i] = 0;
      for (i = s1; i <= e1; i++) {
        const prevChild = c1[i];
        if (patched >= toBePatched) {
          unmount(prevChild, parentComponent, parentSuspense, true);
          continue;
        }
        let newIndex;
        if (prevChild.key != null) {
          newIndex = keyToNewIndexMap.get(prevChild.key);
        } else {
          for (j = s2; j <= e2; j++) {
            if (newIndexToOldIndexMap[j - s2] === 0 && isSameVNodeType(prevChild, c2[j])) {
              newIndex = j;
              break;
            }
          }
        }
        if (newIndex === void 0) {
          unmount(prevChild, parentComponent, parentSuspense, true);
        } else {
          newIndexToOldIndexMap[newIndex - s2] = i + 1;
          if (newIndex >= maxNewIndexSoFar) {
            maxNewIndexSoFar = newIndex;
          } else {
            moved = true;
          }
          patch(prevChild, c2[newIndex], container, null, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
          patched++;
        }
      }
      const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : EMPTY_ARR;
      j = increasingNewIndexSequence.length - 1;
      for (i = toBePatched - 1; i >= 0; i--) {
        const nextIndex = s2 + i;
        const nextChild = c2[nextIndex];
        const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : parentAnchor;
        if (newIndexToOldIndexMap[i] === 0) {
          patch(null, nextChild, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
        } else if (moved) {
          if (j < 0 || i !== increasingNewIndexSequence[j]) {
            move(nextChild, container, anchor, 2);
          } else {
            j--;
          }
        }
      }
    }
  };
  const move = (vnode, container, anchor, moveType, parentSuspense = null) => {
    const { el, type, transition, children, shapeFlag } = vnode;
    if (shapeFlag & 6) {
      move(vnode.component.subTree, container, anchor, moveType);
      return;
    }
    if (shapeFlag & 128) {
      vnode.suspense.move(container, anchor, moveType);
      return;
    }
    if (shapeFlag & 64) {
      type.move(vnode, container, anchor, internals);
      return;
    }
    if (type === Fragment) {
      hostInsert(el, container, anchor);
      for (let i = 0; i < children.length; i++) {
        move(children[i], container, anchor, moveType);
      }
      hostInsert(vnode.anchor, container, anchor);
      return;
    }
    if (type === Static) {
      moveStaticNode(vnode, container, anchor);
      return;
    }
    const needTransition = moveType !== 2 && shapeFlag & 1 && transition;
    if (needTransition) {
      if (moveType === 0) {
        transition.beforeEnter(el);
        hostInsert(el, container, anchor);
        queuePostRenderEffect(() => transition.enter(el), parentSuspense);
      } else {
        const { leave: leave2, delayLeave, afterLeave } = transition;
        const remove3 = () => hostInsert(el, container, anchor);
        const performLeave = () => {
          leave2(el, () => {
            remove3();
            afterLeave && afterLeave();
          });
        };
        if (delayLeave) {
          delayLeave(el, remove3, performLeave);
        } else {
          performLeave();
        }
      }
    } else {
      hostInsert(el, container, anchor);
    }
  };
  const unmount = (vnode, parentComponent, parentSuspense, doRemove = false, optimized = false) => {
    const { type, props, ref: ref2, children, dynamicChildren, shapeFlag, patchFlag, dirs } = vnode;
    if (ref2 != null) {
      setRef(ref2, null, parentSuspense, vnode, true);
    }
    if (shapeFlag & 256) {
      parentComponent.ctx.deactivate(vnode);
      return;
    }
    const shouldInvokeDirs = shapeFlag & 1 && dirs;
    const shouldInvokeVnodeHook = !isAsyncWrapper(vnode);
    let vnodeHook;
    if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeBeforeUnmount)) {
      invokeVNodeHook(vnodeHook, parentComponent, vnode);
    }
    if (shapeFlag & 6) {
      unmountComponent(vnode.component, parentSuspense, doRemove);
    } else {
      if (shapeFlag & 128) {
        vnode.suspense.unmount(parentSuspense, doRemove);
        return;
      }
      if (shouldInvokeDirs) {
        invokeDirectiveHook(vnode, null, parentComponent, "beforeUnmount");
      }
      if (shapeFlag & 64) {
        vnode.type.remove(vnode, parentComponent, parentSuspense, optimized, internals, doRemove);
      } else if (dynamicChildren && (type !== Fragment || patchFlag > 0 && patchFlag & 64)) {
        unmountChildren(dynamicChildren, parentComponent, parentSuspense, false, true);
      } else if (type === Fragment && patchFlag & (128 | 256) || !optimized && shapeFlag & 16) {
        unmountChildren(children, parentComponent, parentSuspense);
      }
      if (doRemove) {
        remove2(vnode);
      }
    }
    if (shouldInvokeVnodeHook && (vnodeHook = props && props.onVnodeUnmounted) || shouldInvokeDirs) {
      queuePostRenderEffect(() => {
        vnodeHook && invokeVNodeHook(vnodeHook, parentComponent, vnode);
        shouldInvokeDirs && invokeDirectiveHook(vnode, null, parentComponent, "unmounted");
      }, parentSuspense);
    }
  };
  const remove2 = (vnode) => {
    const { type, el, anchor, transition } = vnode;
    if (type === Fragment) {
      removeFragment(el, anchor);
      return;
    }
    if (type === Static) {
      removeStaticNode(vnode);
      return;
    }
    const performRemove = () => {
      hostRemove(el);
      if (transition && !transition.persisted && transition.afterLeave) {
        transition.afterLeave();
      }
    };
    if (vnode.shapeFlag & 1 && transition && !transition.persisted) {
      const { leave: leave2, delayLeave } = transition;
      const performLeave = () => leave2(el, performRemove);
      if (delayLeave) {
        delayLeave(vnode.el, performRemove, performLeave);
      } else {
        performLeave();
      }
    } else {
      performRemove();
    }
  };
  const removeFragment = (cur, end) => {
    let next;
    while (cur !== end) {
      next = hostNextSibling(cur);
      hostRemove(cur);
      cur = next;
    }
    hostRemove(end);
  };
  const unmountComponent = (instance, parentSuspense, doRemove) => {
    const { bum, scope, update, subTree, um } = instance;
    if (bum) {
      invokeArrayFns(bum);
    }
    scope.stop();
    if (update) {
      update.active = false;
      unmount(subTree, instance, parentSuspense, doRemove);
    }
    if (um) {
      queuePostRenderEffect(um, parentSuspense);
    }
    queuePostRenderEffect(() => {
      instance.isUnmounted = true;
    }, parentSuspense);
    if (parentSuspense && parentSuspense.pendingBranch && !parentSuspense.isUnmounted && instance.asyncDep && !instance.asyncResolved && instance.suspenseId === parentSuspense.pendingId) {
      parentSuspense.deps--;
      if (parentSuspense.deps === 0) {
        parentSuspense.resolve();
      }
    }
  };
  const unmountChildren = (children, parentComponent, parentSuspense, doRemove = false, optimized = false, start = 0) => {
    for (let i = start; i < children.length; i++) {
      unmount(children[i], parentComponent, parentSuspense, doRemove, optimized);
    }
  };
  const getNextHostNode = (vnode) => {
    if (vnode.shapeFlag & 6) {
      return getNextHostNode(vnode.component.subTree);
    }
    if (vnode.shapeFlag & 128) {
      return vnode.suspense.next();
    }
    return hostNextSibling(vnode.anchor || vnode.el);
  };
  const render2 = (vnode, container, isSVG) => {
    if (vnode == null) {
      if (container._vnode) {
        unmount(container._vnode, null, null, true);
      }
    } else {
      patch(container._vnode || null, vnode, container, null, null, null, isSVG);
    }
    flushPostFlushCbs();
    container._vnode = vnode;
  };
  const internals = {
    p: patch,
    um: unmount,
    m: move,
    r: remove2,
    mt: mountComponent,
    mc: mountChildren,
    pc: patchChildren,
    pbc: patchBlockChildren,
    n: getNextHostNode,
    o: options
  };
  let hydrate;
  let hydrateNode;
  if (createHydrationFns) {
    [hydrate, hydrateNode] = createHydrationFns(internals);
  }
  return {
    render: render2,
    hydrate,
    createApp: createAppAPI(render2, hydrate)
  };
}
function setRef(rawRef, oldRawRef, parentSuspense, vnode, isUnmount = false) {
  if (isArray$1(rawRef)) {
    rawRef.forEach((r, i) => setRef(r, oldRawRef && (isArray$1(oldRawRef) ? oldRawRef[i] : oldRawRef), parentSuspense, vnode, isUnmount));
    return;
  }
  if (isAsyncWrapper(vnode) && !isUnmount) {
    return;
  }
  const refValue = vnode.shapeFlag & 4 ? getExposeProxy(vnode.component) || vnode.component.proxy : vnode.el;
  const value = isUnmount ? null : refValue;
  const { i: owner, r: ref2 } = rawRef;
  const oldRef = oldRawRef && oldRawRef.r;
  const refs = owner.refs === EMPTY_OBJ ? owner.refs = {} : owner.refs;
  const setupState = owner.setupState;
  if (oldRef != null && oldRef !== ref2) {
    if (isString$1(oldRef)) {
      refs[oldRef] = null;
      if (hasOwn(setupState, oldRef)) {
        setupState[oldRef] = null;
      }
    } else if (isRef(oldRef)) {
      oldRef.value = null;
    }
  }
  if (isString$1(ref2)) {
    const doSet = () => {
      {
        refs[ref2] = value;
      }
      if (hasOwn(setupState, ref2)) {
        setupState[ref2] = value;
      }
    };
    if (value) {
      doSet.id = -1;
      queuePostRenderEffect(doSet, parentSuspense);
    } else {
      doSet();
    }
  } else if (isRef(ref2)) {
    const doSet = () => {
      ref2.value = value;
    };
    if (value) {
      doSet.id = -1;
      queuePostRenderEffect(doSet, parentSuspense);
    } else {
      doSet();
    }
  } else if (isFunction$1(ref2)) {
    callWithErrorHandling(ref2, owner, 12, [value, refs]);
  } else
    ;
}
function invokeVNodeHook(hook, instance, vnode, prevVNode = null) {
  callWithAsyncErrorHandling(hook, instance, 7, [
    vnode,
    prevVNode
  ]);
}
function traverseStaticChildren(n1, n2, shallow = false) {
  const ch1 = n1.children;
  const ch2 = n2.children;
  if (isArray$1(ch1) && isArray$1(ch2)) {
    for (let i = 0; i < ch1.length; i++) {
      const c1 = ch1[i];
      let c2 = ch2[i];
      if (c2.shapeFlag & 1 && !c2.dynamicChildren) {
        if (c2.patchFlag <= 0 || c2.patchFlag === 32) {
          c2 = ch2[i] = cloneIfMounted(ch2[i]);
          c2.el = c1.el;
        }
        if (!shallow)
          traverseStaticChildren(c1, c2);
      }
    }
  }
}
function getSequence(arr) {
  const p2 = arr.slice();
  const result = [0];
  let i, j, u, v, c;
  const len = arr.length;
  for (i = 0; i < len; i++) {
    const arrI = arr[i];
    if (arrI !== 0) {
      j = result[result.length - 1];
      if (arr[j] < arrI) {
        p2[i] = j;
        result.push(i);
        continue;
      }
      u = 0;
      v = result.length - 1;
      while (u < v) {
        c = u + v >> 1;
        if (arr[result[c]] < arrI) {
          u = c + 1;
        } else {
          v = c;
        }
      }
      if (arrI < arr[result[u]]) {
        if (u > 0) {
          p2[i] = result[u - 1];
        }
        result[u] = i;
      }
    }
  }
  u = result.length;
  v = result[u - 1];
  while (u-- > 0) {
    result[u] = v;
    v = p2[v];
  }
  return result;
}
const isTeleport = (type) => type.__isTeleport;
const isTeleportDisabled = (props) => props && (props.disabled || props.disabled === "");
const isTargetSVG = (target) => typeof SVGElement !== "undefined" && target instanceof SVGElement;
const resolveTarget$1 = (props, select) => {
  const targetSelector = props && props.to;
  if (isString$1(targetSelector)) {
    if (!select) {
      return null;
    } else {
      const target = select(targetSelector);
      return target;
    }
  } else {
    return targetSelector;
  }
};
const TeleportImpl = {
  __isTeleport: true,
  process(n1, n2, container, anchor, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized, internals) {
    const { mc: mountChildren, pc: patchChildren, pbc: patchBlockChildren, o: { insert, querySelector, createText, createComment } } = internals;
    const disabled = isTeleportDisabled(n2.props);
    let { shapeFlag, children, dynamicChildren } = n2;
    if (n1 == null) {
      const placeholder = n2.el = createText("");
      const mainAnchor = n2.anchor = createText("");
      insert(placeholder, container, anchor);
      insert(mainAnchor, container, anchor);
      const target = n2.target = resolveTarget$1(n2.props, querySelector);
      const targetAnchor = n2.targetAnchor = createText("");
      if (target) {
        insert(targetAnchor, target);
        isSVG = isSVG || isTargetSVG(target);
      }
      const mount = (container2, anchor2) => {
        if (shapeFlag & 16) {
          mountChildren(children, container2, anchor2, parentComponent, parentSuspense, isSVG, slotScopeIds, optimized);
        }
      };
      if (disabled) {
        mount(container, mainAnchor);
      } else if (target) {
        mount(target, targetAnchor);
      }
    } else {
      n2.el = n1.el;
      const mainAnchor = n2.anchor = n1.anchor;
      const target = n2.target = n1.target;
      const targetAnchor = n2.targetAnchor = n1.targetAnchor;
      const wasDisabled = isTeleportDisabled(n1.props);
      const currentContainer = wasDisabled ? container : target;
      const currentAnchor = wasDisabled ? mainAnchor : targetAnchor;
      isSVG = isSVG || isTargetSVG(target);
      if (dynamicChildren) {
        patchBlockChildren(n1.dynamicChildren, dynamicChildren, currentContainer, parentComponent, parentSuspense, isSVG, slotScopeIds);
        traverseStaticChildren(n1, n2, true);
      } else if (!optimized) {
        patchChildren(n1, n2, currentContainer, currentAnchor, parentComponent, parentSuspense, isSVG, slotScopeIds, false);
      }
      if (disabled) {
        if (!wasDisabled) {
          moveTeleport(n2, container, mainAnchor, internals, 1);
        }
      } else {
        if ((n2.props && n2.props.to) !== (n1.props && n1.props.to)) {
          const nextTarget = n2.target = resolveTarget$1(n2.props, querySelector);
          if (nextTarget) {
            moveTeleport(n2, nextTarget, null, internals, 0);
          }
        } else if (wasDisabled) {
          moveTeleport(n2, target, targetAnchor, internals, 1);
        }
      }
    }
  },
  remove(vnode, parentComponent, parentSuspense, optimized, { um: unmount, o: { remove: hostRemove } }, doRemove) {
    const { shapeFlag, children, anchor, targetAnchor, target, props } = vnode;
    if (target) {
      hostRemove(targetAnchor);
    }
    if (doRemove || !isTeleportDisabled(props)) {
      hostRemove(anchor);
      if (shapeFlag & 16) {
        for (let i = 0; i < children.length; i++) {
          const child = children[i];
          unmount(child, parentComponent, parentSuspense, true, !!child.dynamicChildren);
        }
      }
    }
  },
  move: moveTeleport,
  hydrate: hydrateTeleport
};
function moveTeleport(vnode, container, parentAnchor, { o: { insert }, m: move }, moveType = 2) {
  if (moveType === 0) {
    insert(vnode.targetAnchor, container, parentAnchor);
  }
  const { el, anchor, shapeFlag, children, props } = vnode;
  const isReorder = moveType === 2;
  if (isReorder) {
    insert(el, container, parentAnchor);
  }
  if (!isReorder || isTeleportDisabled(props)) {
    if (shapeFlag & 16) {
      for (let i = 0; i < children.length; i++) {
        move(children[i], container, parentAnchor, 2);
      }
    }
  }
  if (isReorder) {
    insert(anchor, container, parentAnchor);
  }
}
function hydrateTeleport(node, vnode, parentComponent, parentSuspense, slotScopeIds, optimized, { o: { nextSibling, parentNode, querySelector } }, hydrateChildren) {
  const target = vnode.target = resolveTarget$1(vnode.props, querySelector);
  if (target) {
    const targetNode = target._lpa || target.firstChild;
    if (vnode.shapeFlag & 16) {
      if (isTeleportDisabled(vnode.props)) {
        vnode.anchor = hydrateChildren(nextSibling(node), vnode, parentNode(node), parentComponent, parentSuspense, slotScopeIds, optimized);
        vnode.targetAnchor = targetNode;
      } else {
        vnode.anchor = nextSibling(node);
        vnode.targetAnchor = hydrateChildren(targetNode, vnode, target, parentComponent, parentSuspense, slotScopeIds, optimized);
      }
      target._lpa = vnode.targetAnchor && nextSibling(vnode.targetAnchor);
    }
  }
  return vnode.anchor && nextSibling(vnode.anchor);
}
const Teleport = TeleportImpl;
const COMPONENTS = "components";
const DIRECTIVES = "directives";
function resolveComponent(name, maybeSelfReference) {
  return resolveAsset(COMPONENTS, name, true, maybeSelfReference) || name;
}
const NULL_DYNAMIC_COMPONENT = Symbol();
function resolveDynamicComponent(component) {
  if (isString$1(component)) {
    return resolveAsset(COMPONENTS, component, false) || component;
  } else {
    return component || NULL_DYNAMIC_COMPONENT;
  }
}
function resolveDirective(name) {
  return resolveAsset(DIRECTIVES, name);
}
function resolveAsset(type, name, warnMissing = true, maybeSelfReference = false) {
  const instance = currentRenderingInstance || currentInstance;
  if (instance) {
    const Component = instance.type;
    if (type === COMPONENTS) {
      const selfName = getComponentName(Component);
      if (selfName && (selfName === name || selfName === camelize(name) || selfName === capitalize(camelize(name)))) {
        return Component;
      }
    }
    const res = resolve$1(instance[type] || Component[type], name) || resolve$1(instance.appContext[type], name);
    if (!res && maybeSelfReference) {
      return Component;
    }
    return res;
  }
}
function resolve$1(registry, name) {
  return registry && (registry[name] || registry[camelize(name)] || registry[capitalize(camelize(name))]);
}
const Fragment = Symbol(void 0);
const Text = Symbol(void 0);
const Comment = Symbol(void 0);
const Static = Symbol(void 0);
const blockStack = [];
let currentBlock = null;
function openBlock(disableTracking = false) {
  blockStack.push(currentBlock = disableTracking ? null : []);
}
function closeBlock() {
  blockStack.pop();
  currentBlock = blockStack[blockStack.length - 1] || null;
}
let isBlockTreeEnabled = 1;
function setBlockTracking(value) {
  isBlockTreeEnabled += value;
}
function setupBlock(vnode) {
  vnode.dynamicChildren = isBlockTreeEnabled > 0 ? currentBlock || EMPTY_ARR : null;
  closeBlock();
  if (isBlockTreeEnabled > 0 && currentBlock) {
    currentBlock.push(vnode);
  }
  return vnode;
}
function createElementBlock(type, props, children, patchFlag, dynamicProps, shapeFlag) {
  return setupBlock(createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, true));
}
function createBlock(type, props, children, patchFlag, dynamicProps) {
  return setupBlock(createVNode(type, props, children, patchFlag, dynamicProps, true));
}
function isVNode(value) {
  return value ? value.__v_isVNode === true : false;
}
function isSameVNodeType(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}
const InternalObjectKey = `__vInternal`;
const normalizeKey = ({ key }) => key != null ? key : null;
const normalizeRef = ({ ref: ref2 }) => {
  return ref2 != null ? isString$1(ref2) || isRef(ref2) || isFunction$1(ref2) ? { i: currentRenderingInstance, r: ref2 } : ref2 : null;
};
function createBaseVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, shapeFlag = type === Fragment ? 0 : 1, isBlockNode = false, needFullChildrenNormalization = false) {
  const vnode = {
    __v_isVNode: true,
    __v_skip: true,
    type,
    props,
    key: props && normalizeKey(props),
    ref: props && normalizeRef(props),
    scopeId: currentScopeId,
    slotScopeIds: null,
    children,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag,
    patchFlag,
    dynamicProps,
    dynamicChildren: null,
    appContext: null
  };
  if (needFullChildrenNormalization) {
    normalizeChildren(vnode, children);
    if (shapeFlag & 128) {
      type.normalize(vnode);
    }
  } else if (children) {
    vnode.shapeFlag |= isString$1(children) ? 8 : 16;
  }
  if (isBlockTreeEnabled > 0 && !isBlockNode && currentBlock && (vnode.patchFlag > 0 || shapeFlag & 6) && vnode.patchFlag !== 32) {
    currentBlock.push(vnode);
  }
  return vnode;
}
const createVNode = _createVNode;
function _createVNode(type, props = null, children = null, patchFlag = 0, dynamicProps = null, isBlockNode = false) {
  if (!type || type === NULL_DYNAMIC_COMPONENT) {
    type = Comment;
  }
  if (isVNode(type)) {
    const cloned = cloneVNode(type, props, true);
    if (children) {
      normalizeChildren(cloned, children);
    }
    return cloned;
  }
  if (isClassComponent(type)) {
    type = type.__vccOpts;
  }
  if (props) {
    props = guardReactiveProps(props);
    let { class: klass, style } = props;
    if (klass && !isString$1(klass)) {
      props.class = normalizeClass(klass);
    }
    if (isObject$1(style)) {
      if (isProxy(style) && !isArray$1(style)) {
        style = extend({}, style);
      }
      props.style = normalizeStyle(style);
    }
  }
  const shapeFlag = isString$1(type) ? 1 : isSuspense(type) ? 128 : isTeleport(type) ? 64 : isObject$1(type) ? 4 : isFunction$1(type) ? 2 : 0;
  return createBaseVNode(type, props, children, patchFlag, dynamicProps, shapeFlag, isBlockNode, true);
}
function guardReactiveProps(props) {
  if (!props)
    return null;
  return isProxy(props) || InternalObjectKey in props ? extend({}, props) : props;
}
function cloneVNode(vnode, extraProps, mergeRef = false) {
  const { props, ref: ref2, patchFlag, children } = vnode;
  const mergedProps = extraProps ? mergeProps(props || {}, extraProps) : props;
  const cloned = {
    __v_isVNode: true,
    __v_skip: true,
    type: vnode.type,
    props: mergedProps,
    key: mergedProps && normalizeKey(mergedProps),
    ref: extraProps && extraProps.ref ? mergeRef && ref2 ? isArray$1(ref2) ? ref2.concat(normalizeRef(extraProps)) : [ref2, normalizeRef(extraProps)] : normalizeRef(extraProps) : ref2,
    scopeId: vnode.scopeId,
    slotScopeIds: vnode.slotScopeIds,
    children,
    target: vnode.target,
    targetAnchor: vnode.targetAnchor,
    staticCount: vnode.staticCount,
    shapeFlag: vnode.shapeFlag,
    patchFlag: extraProps && vnode.type !== Fragment ? patchFlag === -1 ? 16 : patchFlag | 16 : patchFlag,
    dynamicProps: vnode.dynamicProps,
    dynamicChildren: vnode.dynamicChildren,
    appContext: vnode.appContext,
    dirs: vnode.dirs,
    transition: vnode.transition,
    component: vnode.component,
    suspense: vnode.suspense,
    ssContent: vnode.ssContent && cloneVNode(vnode.ssContent),
    ssFallback: vnode.ssFallback && cloneVNode(vnode.ssFallback),
    el: vnode.el,
    anchor: vnode.anchor
  };
  return cloned;
}
function createTextVNode(text = " ", flag = 0) {
  return createVNode(Text, null, text, flag);
}
function createStaticVNode(content, numberOfNodes) {
  const vnode = createVNode(Static, null, content);
  vnode.staticCount = numberOfNodes;
  return vnode;
}
function createCommentVNode(text = "", asBlock = false) {
  return asBlock ? (openBlock(), createBlock(Comment, null, text)) : createVNode(Comment, null, text);
}
function normalizeVNode(child) {
  if (child == null || typeof child === "boolean") {
    return createVNode(Comment);
  } else if (isArray$1(child)) {
    return createVNode(Fragment, null, child.slice());
  } else if (typeof child === "object") {
    return cloneIfMounted(child);
  } else {
    return createVNode(Text, null, String(child));
  }
}
function cloneIfMounted(child) {
  return child.el === null || child.memo ? child : cloneVNode(child);
}
function normalizeChildren(vnode, children) {
  let type = 0;
  const { shapeFlag } = vnode;
  if (children == null) {
    children = null;
  } else if (isArray$1(children)) {
    type = 16;
  } else if (typeof children === "object") {
    if (shapeFlag & (1 | 64)) {
      const slot = children.default;
      if (slot) {
        slot._c && (slot._d = false);
        normalizeChildren(vnode, slot());
        slot._c && (slot._d = true);
      }
      return;
    } else {
      type = 32;
      const slotFlag = children._;
      if (!slotFlag && !(InternalObjectKey in children)) {
        children._ctx = currentRenderingInstance;
      } else if (slotFlag === 3 && currentRenderingInstance) {
        if (currentRenderingInstance.slots._ === 1) {
          children._ = 1;
        } else {
          children._ = 2;
          vnode.patchFlag |= 1024;
        }
      }
    }
  } else if (isFunction$1(children)) {
    children = { default: children, _ctx: currentRenderingInstance };
    type = 32;
  } else {
    children = String(children);
    if (shapeFlag & 64) {
      type = 16;
      children = [createTextVNode(children)];
    } else {
      type = 8;
    }
  }
  vnode.children = children;
  vnode.shapeFlag |= type;
}
function mergeProps(...args) {
  const ret = {};
  for (let i = 0; i < args.length; i++) {
    const toMerge = args[i];
    for (const key in toMerge) {
      if (key === "class") {
        if (ret.class !== toMerge.class) {
          ret.class = normalizeClass([ret.class, toMerge.class]);
        }
      } else if (key === "style") {
        ret.style = normalizeStyle([ret.style, toMerge.style]);
      } else if (isOn(key)) {
        const existing = ret[key];
        const incoming = toMerge[key];
        if (existing !== incoming) {
          ret[key] = existing ? [].concat(existing, incoming) : incoming;
        }
      } else if (key !== "") {
        ret[key] = toMerge[key];
      }
    }
  }
  return ret;
}
function renderList(source, renderItem, cache, index) {
  let ret;
  const cached = cache && cache[index];
  if (isArray$1(source) || isString$1(source)) {
    ret = new Array(source.length);
    for (let i = 0, l = source.length; i < l; i++) {
      ret[i] = renderItem(source[i], i, void 0, cached && cached[i]);
    }
  } else if (typeof source === "number") {
    ret = new Array(source);
    for (let i = 0; i < source; i++) {
      ret[i] = renderItem(i + 1, i, void 0, cached && cached[i]);
    }
  } else if (isObject$1(source)) {
    if (source[Symbol.iterator]) {
      ret = Array.from(source, (item, i) => renderItem(item, i, void 0, cached && cached[i]));
    } else {
      const keys = Object.keys(source);
      ret = new Array(keys.length);
      for (let i = 0, l = keys.length; i < l; i++) {
        const key = keys[i];
        ret[i] = renderItem(source[key], key, i, cached && cached[i]);
      }
    }
  } else {
    ret = [];
  }
  if (cache) {
    cache[index] = ret;
  }
  return ret;
}
function renderSlot(slots, name, props = {}, fallback, noSlotted) {
  if (currentRenderingInstance.isCE) {
    return createVNode("slot", name === "default" ? null : { name }, fallback && fallback());
  }
  let slot = slots[name];
  if (slot && slot._c) {
    slot._d = false;
  }
  openBlock();
  const validSlotContent = slot && ensureValidVNode(slot(props));
  const rendered = createBlock(Fragment, { key: props.key || `_${name}` }, validSlotContent || (fallback ? fallback() : []), validSlotContent && slots._ === 1 ? 64 : -2);
  if (!noSlotted && rendered.scopeId) {
    rendered.slotScopeIds = [rendered.scopeId + "-s"];
  }
  if (slot && slot._c) {
    slot._d = true;
  }
  return rendered;
}
function ensureValidVNode(vnodes) {
  return vnodes.some((child) => {
    if (!isVNode(child))
      return true;
    if (child.type === Comment)
      return false;
    if (child.type === Fragment && !ensureValidVNode(child.children))
      return false;
    return true;
  }) ? vnodes : null;
}
const getPublicInstance = (i) => {
  if (!i)
    return null;
  if (isStatefulComponent(i))
    return getExposeProxy(i) || i.proxy;
  return getPublicInstance(i.parent);
};
const publicPropertiesMap = extend(Object.create(null), {
  $: (i) => i,
  $el: (i) => i.vnode.el,
  $data: (i) => i.data,
  $props: (i) => i.props,
  $attrs: (i) => i.attrs,
  $slots: (i) => i.slots,
  $refs: (i) => i.refs,
  $parent: (i) => getPublicInstance(i.parent),
  $root: (i) => getPublicInstance(i.root),
  $emit: (i) => i.emit,
  $options: (i) => resolveMergedOptions(i),
  $forceUpdate: (i) => () => queueJob(i.update),
  $nextTick: (i) => nextTick.bind(i.proxy),
  $watch: (i) => instanceWatch.bind(i)
});
const PublicInstanceProxyHandlers = {
  get({ _: instance }, key) {
    const { ctx, setupState, data, props, accessCache, type, appContext } = instance;
    let normalizedProps;
    if (key[0] !== "$") {
      const n = accessCache[key];
      if (n !== void 0) {
        switch (n) {
          case 0:
            return setupState[key];
          case 1:
            return data[key];
          case 3:
            return ctx[key];
          case 2:
            return props[key];
        }
      } else if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
        accessCache[key] = 0;
        return setupState[key];
      } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
        accessCache[key] = 1;
        return data[key];
      } else if ((normalizedProps = instance.propsOptions[0]) && hasOwn(normalizedProps, key)) {
        accessCache[key] = 2;
        return props[key];
      } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
        accessCache[key] = 3;
        return ctx[key];
      } else if (shouldCacheAccess) {
        accessCache[key] = 4;
      }
    }
    const publicGetter = publicPropertiesMap[key];
    let cssModule, globalProperties;
    if (publicGetter) {
      if (key === "$attrs") {
        track(instance, "get", key);
      }
      return publicGetter(instance);
    } else if ((cssModule = type.__cssModules) && (cssModule = cssModule[key])) {
      return cssModule;
    } else if (ctx !== EMPTY_OBJ && hasOwn(ctx, key)) {
      accessCache[key] = 3;
      return ctx[key];
    } else if (globalProperties = appContext.config.globalProperties, hasOwn(globalProperties, key)) {
      {
        return globalProperties[key];
      }
    } else
      ;
  },
  set({ _: instance }, key, value) {
    const { data, setupState, ctx } = instance;
    if (setupState !== EMPTY_OBJ && hasOwn(setupState, key)) {
      setupState[key] = value;
    } else if (data !== EMPTY_OBJ && hasOwn(data, key)) {
      data[key] = value;
    } else if (hasOwn(instance.props, key)) {
      return false;
    }
    if (key[0] === "$" && key.slice(1) in instance) {
      return false;
    } else {
      {
        ctx[key] = value;
      }
    }
    return true;
  },
  has({ _: { data, setupState, accessCache, ctx, appContext, propsOptions } }, key) {
    let normalizedProps;
    return accessCache[key] !== void 0 || data !== EMPTY_OBJ && hasOwn(data, key) || setupState !== EMPTY_OBJ && hasOwn(setupState, key) || (normalizedProps = propsOptions[0]) && hasOwn(normalizedProps, key) || hasOwn(ctx, key) || hasOwn(publicPropertiesMap, key) || hasOwn(appContext.config.globalProperties, key);
  }
};
const emptyAppContext = createAppContext();
let uid$1 = 0;
function createComponentInstance(vnode, parent2, suspense) {
  const type = vnode.type;
  const appContext = (parent2 ? parent2.appContext : vnode.appContext) || emptyAppContext;
  const instance = {
    uid: uid$1++,
    vnode,
    type,
    parent: parent2,
    appContext,
    root: null,
    next: null,
    subTree: null,
    update: null,
    scope: new EffectScope(true),
    render: null,
    proxy: null,
    exposed: null,
    exposeProxy: null,
    withProxy: null,
    provides: parent2 ? parent2.provides : Object.create(appContext.provides),
    accessCache: null,
    renderCache: [],
    components: null,
    directives: null,
    propsOptions: normalizePropsOptions(type, appContext),
    emitsOptions: normalizeEmitsOptions(type, appContext),
    emit: null,
    emitted: null,
    propsDefaults: EMPTY_OBJ,
    inheritAttrs: type.inheritAttrs,
    ctx: EMPTY_OBJ,
    data: EMPTY_OBJ,
    props: EMPTY_OBJ,
    attrs: EMPTY_OBJ,
    slots: EMPTY_OBJ,
    refs: EMPTY_OBJ,
    setupState: EMPTY_OBJ,
    setupContext: null,
    suspense,
    suspenseId: suspense ? suspense.pendingId : 0,
    asyncDep: null,
    asyncResolved: false,
    isMounted: false,
    isUnmounted: false,
    isDeactivated: false,
    bc: null,
    c: null,
    bm: null,
    m: null,
    bu: null,
    u: null,
    um: null,
    bum: null,
    da: null,
    a: null,
    rtg: null,
    rtc: null,
    ec: null,
    sp: null
  };
  {
    instance.ctx = { _: instance };
  }
  instance.root = parent2 ? parent2.root : instance;
  instance.emit = emit$1.bind(null, instance);
  if (vnode.ce) {
    vnode.ce(instance);
  }
  return instance;
}
let currentInstance = null;
const getCurrentInstance = () => currentInstance || currentRenderingInstance;
const setCurrentInstance = (instance) => {
  currentInstance = instance;
  instance.scope.on();
};
const unsetCurrentInstance = () => {
  currentInstance && currentInstance.scope.off();
  currentInstance = null;
};
function isStatefulComponent(instance) {
  return instance.vnode.shapeFlag & 4;
}
let isInSSRComponentSetup = false;
function setupComponent(instance, isSSR = false) {
  isInSSRComponentSetup = isSSR;
  const { props, children } = instance.vnode;
  const isStateful = isStatefulComponent(instance);
  initProps(instance, props, isStateful, isSSR);
  initSlots(instance, children);
  const setupResult = isStateful ? setupStatefulComponent(instance, isSSR) : void 0;
  isInSSRComponentSetup = false;
  return setupResult;
}
function setupStatefulComponent(instance, isSSR) {
  const Component = instance.type;
  instance.accessCache = Object.create(null);
  instance.proxy = markRaw(new Proxy(instance.ctx, PublicInstanceProxyHandlers));
  const { setup: setup2 } = Component;
  if (setup2) {
    const setupContext = instance.setupContext = setup2.length > 1 ? createSetupContext(instance) : null;
    setCurrentInstance(instance);
    pauseTracking();
    const setupResult = callWithErrorHandling(setup2, instance, 0, [instance.props, setupContext]);
    resetTracking();
    unsetCurrentInstance();
    if (isPromise(setupResult)) {
      setupResult.then(unsetCurrentInstance, unsetCurrentInstance);
      if (isSSR) {
        return setupResult.then((resolvedResult) => {
          handleSetupResult(instance, resolvedResult, isSSR);
        }).catch((e) => {
          handleError(e, instance, 0);
        });
      } else {
        instance.asyncDep = setupResult;
      }
    } else {
      handleSetupResult(instance, setupResult, isSSR);
    }
  } else {
    finishComponentSetup(instance, isSSR);
  }
}
function handleSetupResult(instance, setupResult, isSSR) {
  if (isFunction$1(setupResult)) {
    if (instance.type.__ssrInlineRender) {
      instance.ssrRender = setupResult;
    } else {
      instance.render = setupResult;
    }
  } else if (isObject$1(setupResult)) {
    instance.setupState = proxyRefs(setupResult);
  } else
    ;
  finishComponentSetup(instance, isSSR);
}
let compile;
function finishComponentSetup(instance, isSSR, skipOptions) {
  const Component = instance.type;
  if (!instance.render) {
    if (!isSSR && compile && !Component.render) {
      const template = Component.template;
      if (template) {
        const { isCustomElement, compilerOptions } = instance.appContext.config;
        const { delimiters, compilerOptions: componentCompilerOptions } = Component;
        extend(extend({
          isCustomElement,
          delimiters
        }, compilerOptions), componentCompilerOptions);
        Component.render = compile();
      }
    }
    instance.render = Component.render || NOOP;
  }
  {
    setCurrentInstance(instance);
    pauseTracking();
    applyOptions(instance);
    resetTracking();
    unsetCurrentInstance();
  }
}
function createAttrsProxy(instance) {
  return new Proxy(instance.attrs, {
    get(target, key) {
      track(instance, "get", "$attrs");
      return target[key];
    }
  });
}
function createSetupContext(instance) {
  const expose = (exposed) => {
    instance.exposed = exposed || {};
  };
  let attrs;
  {
    return {
      get attrs() {
        return attrs || (attrs = createAttrsProxy(instance));
      },
      slots: instance.slots,
      emit: instance.emit,
      expose
    };
  }
}
function getExposeProxy(instance) {
  if (instance.exposed) {
    return instance.exposeProxy || (instance.exposeProxy = new Proxy(proxyRefs(markRaw(instance.exposed)), {
      get(target, key) {
        if (key in target) {
          return target[key];
        } else if (key in publicPropertiesMap) {
          return publicPropertiesMap[key](instance);
        }
      }
    }));
  }
}
function getComponentName(Component) {
  return isFunction$1(Component) ? Component.displayName || Component.name : Component.name;
}
function isClassComponent(value) {
  return isFunction$1(value) && "__vccOpts" in value;
}
function callWithErrorHandling(fn, instance, type, args) {
  let res;
  try {
    res = args ? fn(...args) : fn();
  } catch (err) {
    handleError(err, instance, type);
  }
  return res;
}
function callWithAsyncErrorHandling(fn, instance, type, args) {
  if (isFunction$1(fn)) {
    const res = callWithErrorHandling(fn, instance, type, args);
    if (res && isPromise(res)) {
      res.catch((err) => {
        handleError(err, instance, type);
      });
    }
    return res;
  }
  const values = [];
  for (let i = 0; i < fn.length; i++) {
    values.push(callWithAsyncErrorHandling(fn[i], instance, type, args));
  }
  return values;
}
function handleError(err, instance, type, throwInDev = true) {
  const contextVNode = instance ? instance.vnode : null;
  if (instance) {
    let cur = instance.parent;
    const exposedInstance = instance.proxy;
    const errorInfo = type;
    while (cur) {
      const errorCapturedHooks = cur.ec;
      if (errorCapturedHooks) {
        for (let i = 0; i < errorCapturedHooks.length; i++) {
          if (errorCapturedHooks[i](err, exposedInstance, errorInfo) === false) {
            return;
          }
        }
      }
      cur = cur.parent;
    }
    const appErrorHandler = instance.appContext.config.errorHandler;
    if (appErrorHandler) {
      callWithErrorHandling(appErrorHandler, null, 10, [err, exposedInstance, errorInfo]);
      return;
    }
  }
  logError(err, type, contextVNode, throwInDev);
}
function logError(err, type, contextVNode, throwInDev = true) {
  {
    console.error(err);
  }
}
let isFlushing = false;
let isFlushPending = false;
const queue = [];
let flushIndex = 0;
const pendingPreFlushCbs = [];
let activePreFlushCbs = null;
let preFlushIndex = 0;
const pendingPostFlushCbs = [];
let activePostFlushCbs = null;
let postFlushIndex = 0;
const resolvedPromise = Promise.resolve();
let currentFlushPromise = null;
let currentPreFlushParentJob = null;
function nextTick(fn) {
  const p2 = currentFlushPromise || resolvedPromise;
  return fn ? p2.then(this ? fn.bind(this) : fn) : p2;
}
function findInsertionIndex(id) {
  let start = flushIndex + 1;
  let end = queue.length;
  while (start < end) {
    const middle = start + end >>> 1;
    const middleJobId = getId(queue[middle]);
    middleJobId < id ? start = middle + 1 : end = middle;
  }
  return start;
}
function queueJob(job) {
  if ((!queue.length || !queue.includes(job, isFlushing && job.allowRecurse ? flushIndex + 1 : flushIndex)) && job !== currentPreFlushParentJob) {
    if (job.id == null) {
      queue.push(job);
    } else {
      queue.splice(findInsertionIndex(job.id), 0, job);
    }
    queueFlush();
  }
}
function queueFlush() {
  if (!isFlushing && !isFlushPending) {
    isFlushPending = true;
    currentFlushPromise = resolvedPromise.then(flushJobs);
  }
}
function invalidateJob(job) {
  const i = queue.indexOf(job);
  if (i > flushIndex) {
    queue.splice(i, 1);
  }
}
function queueCb(cb, activeQueue, pendingQueue, index) {
  if (!isArray$1(cb)) {
    if (!activeQueue || !activeQueue.includes(cb, cb.allowRecurse ? index + 1 : index)) {
      pendingQueue.push(cb);
    }
  } else {
    pendingQueue.push(...cb);
  }
  queueFlush();
}
function queuePreFlushCb(cb) {
  queueCb(cb, activePreFlushCbs, pendingPreFlushCbs, preFlushIndex);
}
function queuePostFlushCb(cb) {
  queueCb(cb, activePostFlushCbs, pendingPostFlushCbs, postFlushIndex);
}
function flushPreFlushCbs(seen, parentJob = null) {
  if (pendingPreFlushCbs.length) {
    currentPreFlushParentJob = parentJob;
    activePreFlushCbs = [...new Set(pendingPreFlushCbs)];
    pendingPreFlushCbs.length = 0;
    for (preFlushIndex = 0; preFlushIndex < activePreFlushCbs.length; preFlushIndex++) {
      activePreFlushCbs[preFlushIndex]();
    }
    activePreFlushCbs = null;
    preFlushIndex = 0;
    currentPreFlushParentJob = null;
    flushPreFlushCbs(seen, parentJob);
  }
}
function flushPostFlushCbs(seen) {
  if (pendingPostFlushCbs.length) {
    const deduped = [...new Set(pendingPostFlushCbs)];
    pendingPostFlushCbs.length = 0;
    if (activePostFlushCbs) {
      activePostFlushCbs.push(...deduped);
      return;
    }
    activePostFlushCbs = deduped;
    activePostFlushCbs.sort((a, b) => getId(a) - getId(b));
    for (postFlushIndex = 0; postFlushIndex < activePostFlushCbs.length; postFlushIndex++) {
      activePostFlushCbs[postFlushIndex]();
    }
    activePostFlushCbs = null;
    postFlushIndex = 0;
  }
}
const getId = (job) => job.id == null ? Infinity : job.id;
function flushJobs(seen) {
  isFlushPending = false;
  isFlushing = true;
  flushPreFlushCbs(seen);
  queue.sort((a, b) => getId(a) - getId(b));
  const check = NOOP;
  try {
    for (flushIndex = 0; flushIndex < queue.length; flushIndex++) {
      const job = queue[flushIndex];
      if (job && job.active !== false) {
        if (false)
          ;
        callWithErrorHandling(job, null, 14);
      }
    }
  } finally {
    flushIndex = 0;
    queue.length = 0;
    flushPostFlushCbs();
    isFlushing = false;
    currentFlushPromise = null;
    if (queue.length || pendingPreFlushCbs.length || pendingPostFlushCbs.length) {
      flushJobs(seen);
    }
  }
}
const INITIAL_WATCHER_VALUE = {};
function watch(source, cb, options) {
  return doWatch(source, cb, options);
}
function doWatch(source, cb, { immediate, deep, flush, onTrack, onTrigger } = EMPTY_OBJ) {
  const instance = currentInstance;
  let getter;
  let forceTrigger = false;
  let isMultiSource = false;
  if (isRef(source)) {
    getter = () => source.value;
    forceTrigger = !!source._shallow;
  } else if (isReactive(source)) {
    getter = () => source;
    deep = true;
  } else if (isArray$1(source)) {
    isMultiSource = true;
    forceTrigger = source.some(isReactive);
    getter = () => source.map((s2) => {
      if (isRef(s2)) {
        return s2.value;
      } else if (isReactive(s2)) {
        return traverse(s2);
      } else if (isFunction$1(s2)) {
        return callWithErrorHandling(s2, instance, 2);
      } else
        ;
    });
  } else if (isFunction$1(source)) {
    if (cb) {
      getter = () => callWithErrorHandling(source, instance, 2);
    } else {
      getter = () => {
        if (instance && instance.isUnmounted) {
          return;
        }
        if (cleanup) {
          cleanup();
        }
        return callWithAsyncErrorHandling(source, instance, 3, [onInvalidate]);
      };
    }
  } else {
    getter = NOOP;
  }
  if (cb && deep) {
    const baseGetter = getter;
    getter = () => traverse(baseGetter());
  }
  let cleanup;
  let onInvalidate = (fn) => {
    cleanup = effect.onStop = () => {
      callWithErrorHandling(fn, instance, 4);
    };
  };
  if (isInSSRComponentSetup) {
    onInvalidate = NOOP;
    if (!cb) {
      getter();
    } else if (immediate) {
      callWithAsyncErrorHandling(cb, instance, 3, [
        getter(),
        isMultiSource ? [] : void 0,
        onInvalidate
      ]);
    }
    return NOOP;
  }
  let oldValue = isMultiSource ? [] : INITIAL_WATCHER_VALUE;
  const job = () => {
    if (!effect.active) {
      return;
    }
    if (cb) {
      const newValue = effect.run();
      if (deep || forceTrigger || (isMultiSource ? newValue.some((v, i) => hasChanged(v, oldValue[i])) : hasChanged(newValue, oldValue)) || false) {
        if (cleanup) {
          cleanup();
        }
        callWithAsyncErrorHandling(cb, instance, 3, [
          newValue,
          oldValue === INITIAL_WATCHER_VALUE ? void 0 : oldValue,
          onInvalidate
        ]);
        oldValue = newValue;
      }
    } else {
      effect.run();
    }
  };
  job.allowRecurse = !!cb;
  let scheduler;
  if (flush === "sync") {
    scheduler = job;
  } else if (flush === "post") {
    scheduler = () => queuePostRenderEffect(job, instance && instance.suspense);
  } else {
    scheduler = () => {
      if (!instance || instance.isMounted) {
        queuePreFlushCb(job);
      } else {
        job();
      }
    };
  }
  const effect = new ReactiveEffect(getter, scheduler);
  if (cb) {
    if (immediate) {
      job();
    } else {
      oldValue = effect.run();
    }
  } else if (flush === "post") {
    queuePostRenderEffect(effect.run.bind(effect), instance && instance.suspense);
  } else {
    effect.run();
  }
  return () => {
    effect.stop();
    if (instance && instance.scope) {
      remove$1(instance.scope.effects, effect);
    }
  };
}
function instanceWatch(source, value, options) {
  const publicThis = this.proxy;
  const getter = isString$1(source) ? source.includes(".") ? createPathGetter(publicThis, source) : () => publicThis[source] : source.bind(publicThis, publicThis);
  let cb;
  if (isFunction$1(value)) {
    cb = value;
  } else {
    cb = value.handler;
    options = value;
  }
  const cur = currentInstance;
  setCurrentInstance(this);
  const res = doWatch(getter, cb.bind(publicThis), options);
  if (cur) {
    setCurrentInstance(cur);
  } else {
    unsetCurrentInstance();
  }
  return res;
}
function createPathGetter(ctx, path) {
  const segments = path.split(".");
  return () => {
    let cur = ctx;
    for (let i = 0; i < segments.length && cur; i++) {
      cur = cur[segments[i]];
    }
    return cur;
  };
}
function traverse(value, seen) {
  if (!isObject$1(value) || value["__v_skip"]) {
    return value;
  }
  seen = seen || new Set();
  if (seen.has(value)) {
    return value;
  }
  seen.add(value);
  if (isRef(value)) {
    traverse(value.value, seen);
  } else if (isArray$1(value)) {
    for (let i = 0; i < value.length; i++) {
      traverse(value[i], seen);
    }
  } else if (isSet(value) || isMap(value)) {
    value.forEach((v) => {
      traverse(v, seen);
    });
  } else if (isPlainObject$1(value)) {
    for (const key in value) {
      traverse(value[key], seen);
    }
  }
  return value;
}
function h$2(type, propsOrChildren, children) {
  const l = arguments.length;
  if (l === 2) {
    if (isObject$1(propsOrChildren) && !isArray$1(propsOrChildren)) {
      if (isVNode(propsOrChildren)) {
        return createVNode(type, null, [propsOrChildren]);
      }
      return createVNode(type, propsOrChildren);
    } else {
      return createVNode(type, null, propsOrChildren);
    }
  } else {
    if (l > 3) {
      children = Array.prototype.slice.call(arguments, 2);
    } else if (l === 3 && isVNode(children)) {
      children = [children];
    }
    return createVNode(type, propsOrChildren, children);
  }
}
const version = "3.2.21";
const svgNS = "http://www.w3.org/2000/svg";
const doc = typeof document !== "undefined" ? document : null;
const staticTemplateCache = new Map();
const nodeOps = {
  insert: (child, parent2, anchor) => {
    parent2.insertBefore(child, anchor || null);
  },
  remove: (child) => {
    const parent2 = child.parentNode;
    if (parent2) {
      parent2.removeChild(child);
    }
  },
  createElement: (tag, isSVG, is, props) => {
    const el = isSVG ? doc.createElementNS(svgNS, tag) : doc.createElement(tag, is ? { is } : void 0);
    if (tag === "select" && props && props.multiple != null) {
      el.setAttribute("multiple", props.multiple);
    }
    return el;
  },
  createText: (text) => doc.createTextNode(text),
  createComment: (text) => doc.createComment(text),
  setText: (node, text) => {
    node.nodeValue = text;
  },
  setElementText: (el, text) => {
    el.textContent = text;
  },
  parentNode: (node) => node.parentNode,
  nextSibling: (node) => node.nextSibling,
  querySelector: (selector) => doc.querySelector(selector),
  setScopeId(el, id) {
    el.setAttribute(id, "");
  },
  cloneNode(el) {
    const cloned = el.cloneNode(true);
    if (`_value` in el) {
      cloned._value = el._value;
    }
    return cloned;
  },
  insertStaticContent(content, parent2, anchor, isSVG) {
    const before = anchor ? anchor.previousSibling : parent2.lastChild;
    let template = staticTemplateCache.get(content);
    if (!template) {
      const t = doc.createElement("template");
      t.innerHTML = isSVG ? `<svg>${content}</svg>` : content;
      template = t.content;
      if (isSVG) {
        const wrapper = template.firstChild;
        while (wrapper.firstChild) {
          template.appendChild(wrapper.firstChild);
        }
        template.removeChild(wrapper);
      }
      staticTemplateCache.set(content, template);
    }
    parent2.insertBefore(template.cloneNode(true), anchor);
    return [
      before ? before.nextSibling : parent2.firstChild,
      anchor ? anchor.previousSibling : parent2.lastChild
    ];
  }
};
function patchClass(el, value, isSVG) {
  const transitionClasses = el._vtc;
  if (transitionClasses) {
    value = (value ? [value, ...transitionClasses] : [...transitionClasses]).join(" ");
  }
  if (value == null) {
    el.removeAttribute("class");
  } else if (isSVG) {
    el.setAttribute("class", value);
  } else {
    el.className = value;
  }
}
function patchStyle(el, prev, next) {
  const style = el.style;
  const isCssString = isString$1(next);
  if (next && !isCssString) {
    for (const key in next) {
      setStyle(style, key, next[key]);
    }
    if (prev && !isString$1(prev)) {
      for (const key in prev) {
        if (next[key] == null) {
          setStyle(style, key, "");
        }
      }
    }
  } else {
    const currentDisplay = style.display;
    if (isCssString) {
      if (prev !== next) {
        style.cssText = next;
      }
    } else if (prev) {
      el.removeAttribute("style");
    }
    if ("_vod" in el) {
      style.display = currentDisplay;
    }
  }
}
const importantRE = /\s*!important$/;
function setStyle(style, name, val) {
  if (isArray$1(val)) {
    val.forEach((v) => setStyle(style, name, v));
  } else {
    if (name.startsWith("--")) {
      style.setProperty(name, val);
    } else {
      const prefixed = autoPrefix(style, name);
      if (importantRE.test(val)) {
        style.setProperty(hyphenate(prefixed), val.replace(importantRE, ""), "important");
      } else {
        style[prefixed] = val;
      }
    }
  }
}
const prefixes = ["Webkit", "Moz", "ms"];
const prefixCache = {};
function autoPrefix(style, rawName) {
  const cached = prefixCache[rawName];
  if (cached) {
    return cached;
  }
  let name = camelize(rawName);
  if (name !== "filter" && name in style) {
    return prefixCache[rawName] = name;
  }
  name = capitalize(name);
  for (let i = 0; i < prefixes.length; i++) {
    const prefixed = prefixes[i] + name;
    if (prefixed in style) {
      return prefixCache[rawName] = prefixed;
    }
  }
  return rawName;
}
const xlinkNS = "http://www.w3.org/1999/xlink";
function patchAttr(el, key, value, isSVG, instance) {
  if (isSVG && key.startsWith("xlink:")) {
    if (value == null) {
      el.removeAttributeNS(xlinkNS, key.slice(6, key.length));
    } else {
      el.setAttributeNS(xlinkNS, key, value);
    }
  } else {
    const isBoolean = isSpecialBooleanAttr(key);
    if (value == null || isBoolean && !includeBooleanAttr(value)) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, isBoolean ? "" : value);
    }
  }
}
function patchDOMProp(el, key, value, prevChildren, parentComponent, parentSuspense, unmountChildren) {
  if (key === "innerHTML" || key === "textContent") {
    if (prevChildren) {
      unmountChildren(prevChildren, parentComponent, parentSuspense);
    }
    el[key] = value == null ? "" : value;
    return;
  }
  if (key === "value" && el.tagName !== "PROGRESS") {
    el._value = value;
    const newValue = value == null ? "" : value;
    if (el.value !== newValue) {
      el.value = newValue;
    }
    if (value == null) {
      el.removeAttribute(key);
    }
    return;
  }
  if (value === "" || value == null) {
    const type = typeof el[key];
    if (type === "boolean") {
      el[key] = includeBooleanAttr(value);
      return;
    } else if (value == null && type === "string") {
      el[key] = "";
      el.removeAttribute(key);
      return;
    } else if (type === "number") {
      try {
        el[key] = 0;
      } catch (_a2) {
      }
      el.removeAttribute(key);
      return;
    }
  }
  try {
    el[key] = value;
  } catch (e) {
  }
}
let _getNow = Date.now;
let skipTimestampCheck = false;
if (typeof window !== "undefined") {
  if (_getNow() > document.createEvent("Event").timeStamp) {
    _getNow = () => performance.now();
  }
  const ffMatch = navigator.userAgent.match(/firefox\/(\d+)/i);
  skipTimestampCheck = !!(ffMatch && Number(ffMatch[1]) <= 53);
}
let cachedNow = 0;
const p = Promise.resolve();
const reset = () => {
  cachedNow = 0;
};
const getNow = () => cachedNow || (p.then(reset), cachedNow = _getNow());
function addEventListener(el, event, handler2, options) {
  el.addEventListener(event, handler2, options);
}
function removeEventListener(el, event, handler2, options) {
  el.removeEventListener(event, handler2, options);
}
function patchEvent(el, rawName, prevValue, nextValue, instance = null) {
  const invokers = el._vei || (el._vei = {});
  const existingInvoker = invokers[rawName];
  if (nextValue && existingInvoker) {
    existingInvoker.value = nextValue;
  } else {
    const [name, options] = parseName(rawName);
    if (nextValue) {
      const invoker = invokers[rawName] = createInvoker(nextValue, instance);
      addEventListener(el, name, invoker, options);
    } else if (existingInvoker) {
      removeEventListener(el, name, existingInvoker, options);
      invokers[rawName] = void 0;
    }
  }
}
const optionsModifierRE = /(?:Once|Passive|Capture)$/;
function parseName(name) {
  let options;
  if (optionsModifierRE.test(name)) {
    options = {};
    let m2;
    while (m2 = name.match(optionsModifierRE)) {
      name = name.slice(0, name.length - m2[0].length);
      options[m2[0].toLowerCase()] = true;
    }
  }
  return [hyphenate(name.slice(2)), options];
}
function createInvoker(initialValue, instance) {
  const invoker = (e) => {
    const timeStamp = e.timeStamp || _getNow();
    if (skipTimestampCheck || timeStamp >= invoker.attached - 1) {
      callWithAsyncErrorHandling(patchStopImmediatePropagation(e, invoker.value), instance, 5, [e]);
    }
  };
  invoker.value = initialValue;
  invoker.attached = getNow();
  return invoker;
}
function patchStopImmediatePropagation(e, value) {
  if (isArray$1(value)) {
    const originalStop = e.stopImmediatePropagation;
    e.stopImmediatePropagation = () => {
      originalStop.call(e);
      e._stopped = true;
    };
    return value.map((fn) => (e2) => !e2._stopped && fn(e2));
  } else {
    return value;
  }
}
const nativeOnRE = /^on[a-z]/;
const patchProp = (el, key, prevValue, nextValue, isSVG = false, prevChildren, parentComponent, parentSuspense, unmountChildren) => {
  if (key === "class") {
    patchClass(el, nextValue, isSVG);
  } else if (key === "style") {
    patchStyle(el, prevValue, nextValue);
  } else if (isOn(key)) {
    if (!isModelListener(key)) {
      patchEvent(el, key, prevValue, nextValue, parentComponent);
    }
  } else if (key[0] === "." ? (key = key.slice(1), true) : key[0] === "^" ? (key = key.slice(1), false) : shouldSetAsProp(el, key, nextValue, isSVG)) {
    patchDOMProp(el, key, nextValue, prevChildren, parentComponent, parentSuspense, unmountChildren);
  } else {
    if (key === "true-value") {
      el._trueValue = nextValue;
    } else if (key === "false-value") {
      el._falseValue = nextValue;
    }
    patchAttr(el, key, nextValue, isSVG);
  }
};
function shouldSetAsProp(el, key, value, isSVG) {
  if (isSVG) {
    if (key === "innerHTML" || key === "textContent") {
      return true;
    }
    if (key in el && nativeOnRE.test(key) && isFunction$1(value)) {
      return true;
    }
    return false;
  }
  if (key === "spellcheck" || key === "draggable") {
    return false;
  }
  if (key === "form") {
    return false;
  }
  if (key === "list" && el.tagName === "INPUT") {
    return false;
  }
  if (key === "type" && el.tagName === "TEXTAREA") {
    return false;
  }
  if (nativeOnRE.test(key) && isString$1(value)) {
    return false;
  }
  return key in el;
}
const TRANSITION = "transition";
const ANIMATION = "animation";
const Transition = (props, { slots }) => h$2(BaseTransition, resolveTransitionProps(props), slots);
Transition.displayName = "Transition";
const DOMTransitionPropsValidators = {
  name: String,
  type: String,
  css: {
    type: Boolean,
    default: true
  },
  duration: [String, Number, Object],
  enterFromClass: String,
  enterActiveClass: String,
  enterToClass: String,
  appearFromClass: String,
  appearActiveClass: String,
  appearToClass: String,
  leaveFromClass: String,
  leaveActiveClass: String,
  leaveToClass: String
};
Transition.props = /* @__PURE__ */ extend({}, BaseTransition.props, DOMTransitionPropsValidators);
const callHook = (hook, args = []) => {
  if (isArray$1(hook)) {
    hook.forEach((h2) => h2(...args));
  } else if (hook) {
    hook(...args);
  }
};
const hasExplicitCallback = (hook) => {
  return hook ? isArray$1(hook) ? hook.some((h2) => h2.length > 1) : hook.length > 1 : false;
};
function resolveTransitionProps(rawProps) {
  const baseProps = {};
  for (const key in rawProps) {
    if (!(key in DOMTransitionPropsValidators)) {
      baseProps[key] = rawProps[key];
    }
  }
  if (rawProps.css === false) {
    return baseProps;
  }
  const { name = "v", type, duration, enterFromClass = `${name}-enter-from`, enterActiveClass = `${name}-enter-active`, enterToClass = `${name}-enter-to`, appearFromClass = enterFromClass, appearActiveClass = enterActiveClass, appearToClass = enterToClass, leaveFromClass = `${name}-leave-from`, leaveActiveClass = `${name}-leave-active`, leaveToClass = `${name}-leave-to` } = rawProps;
  const durations = normalizeDuration(duration);
  const enterDuration = durations && durations[0];
  const leaveDuration = durations && durations[1];
  const { onBeforeEnter, onEnter, onEnterCancelled, onLeave, onLeaveCancelled, onBeforeAppear = onBeforeEnter, onAppear = onEnter, onAppearCancelled = onEnterCancelled } = baseProps;
  const finishEnter = (el, isAppear, done) => {
    removeTransitionClass(el, isAppear ? appearToClass : enterToClass);
    removeTransitionClass(el, isAppear ? appearActiveClass : enterActiveClass);
    done && done();
  };
  const finishLeave = (el, done) => {
    removeTransitionClass(el, leaveToClass);
    removeTransitionClass(el, leaveActiveClass);
    done && done();
  };
  const makeEnterHook = (isAppear) => {
    return (el, done) => {
      const hook = isAppear ? onAppear : onEnter;
      const resolve2 = () => finishEnter(el, isAppear, done);
      callHook(hook, [el, resolve2]);
      nextFrame$1(() => {
        removeTransitionClass(el, isAppear ? appearFromClass : enterFromClass);
        addTransitionClass(el, isAppear ? appearToClass : enterToClass);
        if (!hasExplicitCallback(hook)) {
          whenTransitionEnds(el, type, enterDuration, resolve2);
        }
      });
    };
  };
  return extend(baseProps, {
    onBeforeEnter(el) {
      callHook(onBeforeEnter, [el]);
      addTransitionClass(el, enterFromClass);
      addTransitionClass(el, enterActiveClass);
    },
    onBeforeAppear(el) {
      callHook(onBeforeAppear, [el]);
      addTransitionClass(el, appearFromClass);
      addTransitionClass(el, appearActiveClass);
    },
    onEnter: makeEnterHook(false),
    onAppear: makeEnterHook(true),
    onLeave(el, done) {
      const resolve2 = () => finishLeave(el, done);
      addTransitionClass(el, leaveFromClass);
      forceReflow();
      addTransitionClass(el, leaveActiveClass);
      nextFrame$1(() => {
        removeTransitionClass(el, leaveFromClass);
        addTransitionClass(el, leaveToClass);
        if (!hasExplicitCallback(onLeave)) {
          whenTransitionEnds(el, type, leaveDuration, resolve2);
        }
      });
      callHook(onLeave, [el, resolve2]);
    },
    onEnterCancelled(el) {
      finishEnter(el, false);
      callHook(onEnterCancelled, [el]);
    },
    onAppearCancelled(el) {
      finishEnter(el, true);
      callHook(onAppearCancelled, [el]);
    },
    onLeaveCancelled(el) {
      finishLeave(el);
      callHook(onLeaveCancelled, [el]);
    }
  });
}
function normalizeDuration(duration) {
  if (duration == null) {
    return null;
  } else if (isObject$1(duration)) {
    return [NumberOf(duration.enter), NumberOf(duration.leave)];
  } else {
    const n = NumberOf(duration);
    return [n, n];
  }
}
function NumberOf(val) {
  const res = toNumber(val);
  return res;
}
function addTransitionClass(el, cls) {
  cls.split(/\s+/).forEach((c) => c && el.classList.add(c));
  (el._vtc || (el._vtc = new Set())).add(cls);
}
function removeTransitionClass(el, cls) {
  cls.split(/\s+/).forEach((c) => c && el.classList.remove(c));
  const { _vtc } = el;
  if (_vtc) {
    _vtc.delete(cls);
    if (!_vtc.size) {
      el._vtc = void 0;
    }
  }
}
function nextFrame$1(cb) {
  requestAnimationFrame(() => {
    requestAnimationFrame(cb);
  });
}
let endId = 0;
function whenTransitionEnds(el, expectedType, explicitTimeout, resolve2) {
  const id = el._endId = ++endId;
  const resolveIfNotStale = () => {
    if (id === el._endId) {
      resolve2();
    }
  };
  if (explicitTimeout) {
    return setTimeout(resolveIfNotStale, explicitTimeout);
  }
  const { type, timeout, propCount } = getTransitionInfo(el, expectedType);
  if (!type) {
    return resolve2();
  }
  const endEvent = type + "end";
  let ended = 0;
  const end = () => {
    el.removeEventListener(endEvent, onEnd);
    resolveIfNotStale();
  };
  const onEnd = (e) => {
    if (e.target === el && ++ended >= propCount) {
      end();
    }
  };
  setTimeout(() => {
    if (ended < propCount) {
      end();
    }
  }, timeout + 1);
  el.addEventListener(endEvent, onEnd);
}
function getTransitionInfo(el, expectedType) {
  const styles = window.getComputedStyle(el);
  const getStyleProperties = (key) => (styles[key] || "").split(", ");
  const transitionDelays = getStyleProperties(TRANSITION + "Delay");
  const transitionDurations = getStyleProperties(TRANSITION + "Duration");
  const transitionTimeout = getTimeout(transitionDelays, transitionDurations);
  const animationDelays = getStyleProperties(ANIMATION + "Delay");
  const animationDurations = getStyleProperties(ANIMATION + "Duration");
  const animationTimeout = getTimeout(animationDelays, animationDurations);
  let type = null;
  let timeout = 0;
  let propCount = 0;
  if (expectedType === TRANSITION) {
    if (transitionTimeout > 0) {
      type = TRANSITION;
      timeout = transitionTimeout;
      propCount = transitionDurations.length;
    }
  } else if (expectedType === ANIMATION) {
    if (animationTimeout > 0) {
      type = ANIMATION;
      timeout = animationTimeout;
      propCount = animationDurations.length;
    }
  } else {
    timeout = Math.max(transitionTimeout, animationTimeout);
    type = timeout > 0 ? transitionTimeout > animationTimeout ? TRANSITION : ANIMATION : null;
    propCount = type ? type === TRANSITION ? transitionDurations.length : animationDurations.length : 0;
  }
  const hasTransform = type === TRANSITION && /\b(transform|all)(,|$)/.test(styles[TRANSITION + "Property"]);
  return {
    type,
    timeout,
    propCount,
    hasTransform
  };
}
function getTimeout(delays, durations) {
  while (delays.length < durations.length) {
    delays = delays.concat(delays);
  }
  return Math.max(...durations.map((d2, i) => toMs(d2) + toMs(delays[i])));
}
function toMs(s2) {
  return Number(s2.slice(0, -1).replace(",", ".")) * 1e3;
}
function forceReflow() {
  return document.body.offsetHeight;
}
const rendererOptions = extend({ patchProp }, nodeOps);
let renderer;
let enabledHydration = false;
function ensureHydrationRenderer() {
  renderer = enabledHydration ? renderer : createHydrationRenderer(rendererOptions);
  enabledHydration = true;
  return renderer;
}
const createSSRApp = (...args) => {
  const app = ensureHydrationRenderer().createApp(...args);
  const { mount } = app;
  app.mount = (containerOrSelector) => {
    const container = normalizeContainer(containerOrSelector);
    if (container) {
      return mount(container, true, container instanceof SVGElement);
    }
  };
  return app;
};
function normalizeContainer(container) {
  if (isString$1(container)) {
    const res = document.querySelector(container);
    return res;
  }
  return container;
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
const setup$2 = (context) => {
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
  setup: setup$2,
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
  const proxy = markRaw(new Proxy(target, handler2));
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
  const vnode = h$2(finalTag, attributes, content || void 0);
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
      vnode: h$2(`ssr-${attributesFor}`, data)
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
const hasSymbol$1 = typeof Symbol === "function" && typeof Symbol.toStringTag === "symbol";
const PolySymbol$1 = (name) => hasSymbol$1 ? Symbol("[vue-meta]: " + name) : "[vue-meta]: " + name;
const metaActiveKey = /* @__PURE__ */ PolySymbol$1("meta_active");
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
    vm = getCurrentInstance() || void 0;
  }
  if (!vm) {
    return void 0;
  }
  return vm.appContext.config.globalProperties.$metaManager;
}
function useMeta(source, manager) {
  const vm = getCurrentInstance() || void 0;
  if (!manager && vm) {
    manager = getCurrentManager(vm);
  }
  if (!manager) {
    throw new Error("No manager or current instance");
  }
  if (isProxy(source)) {
    watch(source, (newSource, oldSource) => {
      applyDifference(metaProxy.meta, newSource, oldSource);
    });
    source = source.value;
  }
  const metaProxy = manager.addMeta(source, vm);
  return metaProxy;
}
const MetainfoImpl = defineComponent({
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
      if (vnode.type === Comment) {
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
      vm = getCurrentInstance() || void 0;
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
      onUnmounted(unmount);
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
      return h$2(Teleport, { to }, teleport);
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
  const active = reactive({});
  const mergedObject = createMergedObject(resolve2, active);
  const manager = new _MetaManager(isSSR, config, mergedObject, resolver);
  return manager;
});
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function commonjsRequire(path) {
  throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var browser$1 = { exports: {} };
var s$1 = 1e3;
var m$1 = s$1 * 60;
var h$1 = m$1 * 60;
var d$1 = h$1 * 24;
var w$1 = d$1 * 7;
var y$1 = d$1 * 365.25;
var ms$1 = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === "string" && val.length > 0) {
    return parse$1(val);
  } else if (type === "number" && isFinite(val)) {
    return options.long ? fmtLong$1(val) : fmtShort$1(val);
  }
  throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
};
function parse$1(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || "ms").toLowerCase();
  switch (type) {
    case "years":
    case "year":
    case "yrs":
    case "yr":
    case "y":
      return n * y$1;
    case "weeks":
    case "week":
    case "w":
      return n * w$1;
    case "days":
    case "day":
    case "d":
      return n * d$1;
    case "hours":
    case "hour":
    case "hrs":
    case "hr":
    case "h":
      return n * h$1;
    case "minutes":
    case "minute":
    case "mins":
    case "min":
    case "m":
      return n * m$1;
    case "seconds":
    case "second":
    case "secs":
    case "sec":
    case "s":
      return n * s$1;
    case "milliseconds":
    case "millisecond":
    case "msecs":
    case "msec":
    case "ms":
      return n;
    default:
      return void 0;
  }
}
function fmtShort$1(ms2) {
  var msAbs = Math.abs(ms2);
  if (msAbs >= d$1) {
    return Math.round(ms2 / d$1) + "d";
  }
  if (msAbs >= h$1) {
    return Math.round(ms2 / h$1) + "h";
  }
  if (msAbs >= m$1) {
    return Math.round(ms2 / m$1) + "m";
  }
  if (msAbs >= s$1) {
    return Math.round(ms2 / s$1) + "s";
  }
  return ms2 + "ms";
}
function fmtLong$1(ms2) {
  var msAbs = Math.abs(ms2);
  if (msAbs >= d$1) {
    return plural$1(ms2, msAbs, d$1, "day");
  }
  if (msAbs >= h$1) {
    return plural$1(ms2, msAbs, h$1, "hour");
  }
  if (msAbs >= m$1) {
    return plural$1(ms2, msAbs, m$1, "minute");
  }
  if (msAbs >= s$1) {
    return plural$1(ms2, msAbs, s$1, "second");
  }
  return ms2 + " ms";
}
function plural$1(ms2, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms2 / n) + " " + name + (isPlural ? "s" : "");
}
function setup$1(env) {
  createDebug2.debug = createDebug2;
  createDebug2.default = createDebug2;
  createDebug2.coerce = coerce;
  createDebug2.disable = disable;
  createDebug2.enable = enable;
  createDebug2.enabled = enabled;
  createDebug2.humanize = ms$1;
  createDebug2.destroy = destroy;
  Object.keys(env).forEach((key) => {
    createDebug2[key] = env[key];
  });
  createDebug2.names = [];
  createDebug2.skips = [];
  createDebug2.formatters = {};
  function selectColor(namespace) {
    let hash = 0;
    for (let i = 0; i < namespace.length; i++) {
      hash = (hash << 5) - hash + namespace.charCodeAt(i);
      hash |= 0;
    }
    return createDebug2.colors[Math.abs(hash) % createDebug2.colors.length];
  }
  createDebug2.selectColor = selectColor;
  function createDebug2(namespace) {
    let prevTime;
    let enableOverride = null;
    let namespacesCache;
    let enabledCache;
    function debug(...args) {
      if (!debug.enabled) {
        return;
      }
      const self2 = debug;
      const curr = Number(new Date());
      const ms2 = curr - (prevTime || curr);
      self2.diff = ms2;
      self2.prev = prevTime;
      self2.curr = curr;
      prevTime = curr;
      args[0] = createDebug2.coerce(args[0]);
      if (typeof args[0] !== "string") {
        args.unshift("%O");
      }
      let index = 0;
      args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format2) => {
        if (match === "%%") {
          return "%";
        }
        index++;
        const formatter = createDebug2.formatters[format2];
        if (typeof formatter === "function") {
          const val = args[index];
          match = formatter.call(self2, val);
          args.splice(index, 1);
          index--;
        }
        return match;
      });
      createDebug2.formatArgs.call(self2, args);
      const logFn = self2.log || createDebug2.log;
      logFn.apply(self2, args);
    }
    debug.namespace = namespace;
    debug.useColors = createDebug2.useColors();
    debug.color = createDebug2.selectColor(namespace);
    debug.extend = extend2;
    debug.destroy = createDebug2.destroy;
    Object.defineProperty(debug, "enabled", {
      enumerable: true,
      configurable: false,
      get: () => {
        if (enableOverride !== null) {
          return enableOverride;
        }
        if (namespacesCache !== createDebug2.namespaces) {
          namespacesCache = createDebug2.namespaces;
          enabledCache = createDebug2.enabled(namespace);
        }
        return enabledCache;
      },
      set: (v) => {
        enableOverride = v;
      }
    });
    if (typeof createDebug2.init === "function") {
      createDebug2.init(debug);
    }
    return debug;
  }
  function extend2(namespace, delimiter) {
    const newDebug = createDebug2(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
    newDebug.log = this.log;
    return newDebug;
  }
  function enable(namespaces) {
    createDebug2.save(namespaces);
    createDebug2.namespaces = namespaces;
    createDebug2.names = [];
    createDebug2.skips = [];
    let i;
    const split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
    const len = split.length;
    for (i = 0; i < len; i++) {
      if (!split[i]) {
        continue;
      }
      namespaces = split[i].replace(/\*/g, ".*?");
      if (namespaces[0] === "-") {
        createDebug2.skips.push(new RegExp("^" + namespaces.substr(1) + "$"));
      } else {
        createDebug2.names.push(new RegExp("^" + namespaces + "$"));
      }
    }
  }
  function disable() {
    const namespaces = [
      ...createDebug2.names.map(toNamespace),
      ...createDebug2.skips.map(toNamespace).map((namespace) => "-" + namespace)
    ].join(",");
    createDebug2.enable("");
    return namespaces;
  }
  function enabled(name) {
    if (name[name.length - 1] === "*") {
      return true;
    }
    let i;
    let len;
    for (i = 0, len = createDebug2.skips.length; i < len; i++) {
      if (createDebug2.skips[i].test(name)) {
        return false;
      }
    }
    for (i = 0, len = createDebug2.names.length; i < len; i++) {
      if (createDebug2.names[i].test(name)) {
        return true;
      }
    }
    return false;
  }
  function toNamespace(regexp) {
    return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, "*");
  }
  function coerce(val) {
    if (val instanceof Error) {
      return val.stack || val.message;
    }
    return val;
  }
  function destroy() {
    console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
  }
  createDebug2.enable(createDebug2.load());
  return createDebug2;
}
var common$1 = setup$1;
(function(module, exports) {
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;
  exports.storage = localstorage();
  exports.destroy = (() => {
    let warned = false;
    return () => {
      if (!warned) {
        warned = true;
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
    };
  })();
  exports.colors = [
    "#0000CC",
    "#0000FF",
    "#0033CC",
    "#0033FF",
    "#0066CC",
    "#0066FF",
    "#0099CC",
    "#0099FF",
    "#00CC00",
    "#00CC33",
    "#00CC66",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3300FF",
    "#3333CC",
    "#3333FF",
    "#3366CC",
    "#3366FF",
    "#3399CC",
    "#3399FF",
    "#33CC00",
    "#33CC33",
    "#33CC66",
    "#33CC99",
    "#33CCCC",
    "#33CCFF",
    "#6600CC",
    "#6600FF",
    "#6633CC",
    "#6633FF",
    "#66CC00",
    "#66CC33",
    "#9900CC",
    "#9900FF",
    "#9933CC",
    "#9933FF",
    "#99CC00",
    "#99CC33",
    "#CC0000",
    "#CC0033",
    "#CC0066",
    "#CC0099",
    "#CC00CC",
    "#CC00FF",
    "#CC3300",
    "#CC3333",
    "#CC3366",
    "#CC3399",
    "#CC33CC",
    "#CC33FF",
    "#CC6600",
    "#CC6633",
    "#CC9900",
    "#CC9933",
    "#CCCC00",
    "#CCCC33",
    "#FF0000",
    "#FF0033",
    "#FF0066",
    "#FF0099",
    "#FF00CC",
    "#FF00FF",
    "#FF3300",
    "#FF3333",
    "#FF3366",
    "#FF3399",
    "#FF33CC",
    "#FF33FF",
    "#FF6600",
    "#FF6633",
    "#FF9900",
    "#FF9933",
    "#FFCC00",
    "#FFCC33"
  ];
  function useColors() {
    if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
      return true;
    }
    if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
      return false;
    }
    return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
  }
  function formatArgs(args) {
    args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
    if (!this.useColors) {
      return;
    }
    const c = "color: " + this.color;
    args.splice(1, 0, c, "color: inherit");
    let index = 0;
    let lastC = 0;
    args[0].replace(/%[a-zA-Z%]/g, (match) => {
      if (match === "%%") {
        return;
      }
      index++;
      if (match === "%c") {
        lastC = index;
      }
    });
    args.splice(lastC, 0, c);
  }
  exports.log = console.debug || console.log || (() => {
  });
  function save(namespaces) {
    try {
      if (namespaces) {
        exports.storage.setItem("debug", namespaces);
      } else {
        exports.storage.removeItem("debug");
      }
    } catch (error) {
    }
  }
  function load() {
    let r;
    try {
      r = exports.storage.getItem("debug");
    } catch (error) {
    }
    if (!r && typeof process !== "undefined" && "env" in process) {
      r = {}.DEBUG;
    }
    return r;
  }
  function localstorage() {
    try {
      return localStorage;
    } catch (error) {
    }
  }
  module.exports = common$1(exports);
  const { formatters } = module.exports;
  formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (error) {
      return "[UnexpectedJSONParseError]: " + error.message;
    }
  };
})(browser$1, browser$1.exports);
var createDebug = browser$1.exports;
var browser = { exports: {} };
var s = 1e3;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var w = d * 7;
var y = d * 365.25;
var ms = function(val, options) {
  options = options || {};
  var type = typeof val;
  if (type === "string" && val.length > 0) {
    return parse(val);
  } else if (type === "number" && isFinite(val)) {
    return options.long ? fmtLong(val) : fmtShort(val);
  }
  throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
};
function parse(str) {
  str = String(str);
  if (str.length > 100) {
    return;
  }
  var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
  if (!match) {
    return;
  }
  var n = parseFloat(match[1]);
  var type = (match[2] || "ms").toLowerCase();
  switch (type) {
    case "years":
    case "year":
    case "yrs":
    case "yr":
    case "y":
      return n * y;
    case "weeks":
    case "week":
    case "w":
      return n * w;
    case "days":
    case "day":
    case "d":
      return n * d;
    case "hours":
    case "hour":
    case "hrs":
    case "hr":
    case "h":
      return n * h;
    case "minutes":
    case "minute":
    case "mins":
    case "min":
    case "m":
      return n * m;
    case "seconds":
    case "second":
    case "secs":
    case "sec":
    case "s":
      return n * s;
    case "milliseconds":
    case "millisecond":
    case "msecs":
    case "msec":
    case "ms":
      return n;
    default:
      return void 0;
  }
}
function fmtShort(ms2) {
  var msAbs = Math.abs(ms2);
  if (msAbs >= d) {
    return Math.round(ms2 / d) + "d";
  }
  if (msAbs >= h) {
    return Math.round(ms2 / h) + "h";
  }
  if (msAbs >= m) {
    return Math.round(ms2 / m) + "m";
  }
  if (msAbs >= s) {
    return Math.round(ms2 / s) + "s";
  }
  return ms2 + "ms";
}
function fmtLong(ms2) {
  var msAbs = Math.abs(ms2);
  if (msAbs >= d) {
    return plural(ms2, msAbs, d, "day");
  }
  if (msAbs >= h) {
    return plural(ms2, msAbs, h, "hour");
  }
  if (msAbs >= m) {
    return plural(ms2, msAbs, m, "minute");
  }
  if (msAbs >= s) {
    return plural(ms2, msAbs, s, "second");
  }
  return ms2 + " ms";
}
function plural(ms2, msAbs, n, name) {
  var isPlural = msAbs >= n * 1.5;
  return Math.round(ms2 / n) + " " + name + (isPlural ? "s" : "");
}
function setup(env) {
  createDebug2.debug = createDebug2;
  createDebug2.default = createDebug2;
  createDebug2.coerce = coerce;
  createDebug2.disable = disable;
  createDebug2.enable = enable;
  createDebug2.enabled = enabled;
  createDebug2.humanize = ms;
  createDebug2.destroy = destroy;
  Object.keys(env).forEach((key) => {
    createDebug2[key] = env[key];
  });
  createDebug2.names = [];
  createDebug2.skips = [];
  createDebug2.formatters = {};
  function selectColor(namespace) {
    let hash = 0;
    for (let i = 0; i < namespace.length; i++) {
      hash = (hash << 5) - hash + namespace.charCodeAt(i);
      hash |= 0;
    }
    return createDebug2.colors[Math.abs(hash) % createDebug2.colors.length];
  }
  createDebug2.selectColor = selectColor;
  function createDebug2(namespace) {
    let prevTime;
    let enableOverride = null;
    function debug(...args) {
      if (!debug.enabled) {
        return;
      }
      const self2 = debug;
      const curr = Number(new Date());
      const ms2 = curr - (prevTime || curr);
      self2.diff = ms2;
      self2.prev = prevTime;
      self2.curr = curr;
      prevTime = curr;
      args[0] = createDebug2.coerce(args[0]);
      if (typeof args[0] !== "string") {
        args.unshift("%O");
      }
      let index = 0;
      args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format2) => {
        if (match === "%%") {
          return "%";
        }
        index++;
        const formatter = createDebug2.formatters[format2];
        if (typeof formatter === "function") {
          const val = args[index];
          match = formatter.call(self2, val);
          args.splice(index, 1);
          index--;
        }
        return match;
      });
      createDebug2.formatArgs.call(self2, args);
      const logFn = self2.log || createDebug2.log;
      logFn.apply(self2, args);
    }
    debug.namespace = namespace;
    debug.useColors = createDebug2.useColors();
    debug.color = createDebug2.selectColor(namespace);
    debug.extend = extend2;
    debug.destroy = createDebug2.destroy;
    Object.defineProperty(debug, "enabled", {
      enumerable: true,
      configurable: false,
      get: () => enableOverride === null ? createDebug2.enabled(namespace) : enableOverride,
      set: (v) => {
        enableOverride = v;
      }
    });
    if (typeof createDebug2.init === "function") {
      createDebug2.init(debug);
    }
    return debug;
  }
  function extend2(namespace, delimiter) {
    const newDebug = createDebug2(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
    newDebug.log = this.log;
    return newDebug;
  }
  function enable(namespaces) {
    createDebug2.save(namespaces);
    createDebug2.names = [];
    createDebug2.skips = [];
    let i;
    const split = (typeof namespaces === "string" ? namespaces : "").split(/[\s,]+/);
    const len = split.length;
    for (i = 0; i < len; i++) {
      if (!split[i]) {
        continue;
      }
      namespaces = split[i].replace(/\*/g, ".*?");
      if (namespaces[0] === "-") {
        createDebug2.skips.push(new RegExp("^" + namespaces.substr(1) + "$"));
      } else {
        createDebug2.names.push(new RegExp("^" + namespaces + "$"));
      }
    }
  }
  function disable() {
    const namespaces = [
      ...createDebug2.names.map(toNamespace),
      ...createDebug2.skips.map(toNamespace).map((namespace) => "-" + namespace)
    ].join(",");
    createDebug2.enable("");
    return namespaces;
  }
  function enabled(name) {
    if (name[name.length - 1] === "*") {
      return true;
    }
    let i;
    let len;
    for (i = 0, len = createDebug2.skips.length; i < len; i++) {
      if (createDebug2.skips[i].test(name)) {
        return false;
      }
    }
    for (i = 0, len = createDebug2.names.length; i < len; i++) {
      if (createDebug2.names[i].test(name)) {
        return true;
      }
    }
    return false;
  }
  function toNamespace(regexp) {
    return regexp.toString().substring(2, regexp.toString().length - 2).replace(/\.\*\?$/, "*");
  }
  function coerce(val) {
    if (val instanceof Error) {
      return val.stack || val.message;
    }
    return val;
  }
  function destroy() {
    console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
  }
  createDebug2.enable(createDebug2.load());
  return createDebug2;
}
var common = setup;
(function(module, exports) {
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;
  exports.storage = localstorage();
  exports.destroy = (() => {
    let warned = false;
    return () => {
      if (!warned) {
        warned = true;
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
    };
  })();
  exports.colors = [
    "#0000CC",
    "#0000FF",
    "#0033CC",
    "#0033FF",
    "#0066CC",
    "#0066FF",
    "#0099CC",
    "#0099FF",
    "#00CC00",
    "#00CC33",
    "#00CC66",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3300FF",
    "#3333CC",
    "#3333FF",
    "#3366CC",
    "#3366FF",
    "#3399CC",
    "#3399FF",
    "#33CC00",
    "#33CC33",
    "#33CC66",
    "#33CC99",
    "#33CCCC",
    "#33CCFF",
    "#6600CC",
    "#6600FF",
    "#6633CC",
    "#6633FF",
    "#66CC00",
    "#66CC33",
    "#9900CC",
    "#9900FF",
    "#9933CC",
    "#9933FF",
    "#99CC00",
    "#99CC33",
    "#CC0000",
    "#CC0033",
    "#CC0066",
    "#CC0099",
    "#CC00CC",
    "#CC00FF",
    "#CC3300",
    "#CC3333",
    "#CC3366",
    "#CC3399",
    "#CC33CC",
    "#CC33FF",
    "#CC6600",
    "#CC6633",
    "#CC9900",
    "#CC9933",
    "#CCCC00",
    "#CCCC33",
    "#FF0000",
    "#FF0033",
    "#FF0066",
    "#FF0099",
    "#FF00CC",
    "#FF00FF",
    "#FF3300",
    "#FF3333",
    "#FF3366",
    "#FF3399",
    "#FF33CC",
    "#FF33FF",
    "#FF6600",
    "#FF6633",
    "#FF9900",
    "#FF9933",
    "#FFCC00",
    "#FFCC33"
  ];
  function useColors() {
    if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
      return true;
    }
    if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
      return false;
    }
    return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
  }
  function formatArgs(args) {
    args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
    if (!this.useColors) {
      return;
    }
    const c = "color: " + this.color;
    args.splice(1, 0, c, "color: inherit");
    let index = 0;
    let lastC = 0;
    args[0].replace(/%[a-zA-Z%]/g, (match) => {
      if (match === "%%") {
        return;
      }
      index++;
      if (match === "%c") {
        lastC = index;
      }
    });
    args.splice(lastC, 0, c);
  }
  exports.log = console.debug || console.log || (() => {
  });
  function save(namespaces) {
    try {
      if (namespaces) {
        exports.storage.setItem("debug", namespaces);
      } else {
        exports.storage.removeItem("debug");
      }
    } catch (error) {
    }
  }
  function load() {
    let r;
    try {
      r = exports.storage.getItem("debug");
    } catch (error) {
    }
    if (!r && typeof process !== "undefined" && "env" in process) {
      r = {}.DEBUG;
    }
    return r;
  }
  function localstorage() {
    try {
      return localStorage;
    } catch (error) {
    }
  }
  module.exports = common(exports);
  const { formatters } = module.exports;
  formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (error) {
      return "[UnexpectedJSONParseError]: " + error.message;
    }
  };
})(browser, browser.exports);
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
    let doc2 = document.documentElement;
    return (window.pageYOffset || doc2.scrollTop) - (doc2.clientTop || 0);
  },
  getWindowScrollLeft() {
    let doc2 = document.documentElement;
    return (window.pageXOffset || doc2.scrollLeft) - (doc2.clientLeft || 0);
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
    let win = window, d2 = document, e = d2.documentElement, g = d2.getElementsByTagName("body")[0], w2 = win.innerWidth || e.clientWidth || g.clientWidth, h2 = win.innerHeight || e.clientHeight || g.clientHeight;
    return { width: w2, height: h2 };
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
      for (let parent2 of parents) {
        let scrollSelectors = parent2.nodeType === 1 && parent2.dataset["scrollselectors"];
        if (scrollSelectors) {
          let selectors = scrollSelectors.split(",");
          for (let selector of selectors) {
            let el = this.findSingle(parent2, selector);
            if (el && overflowCheck(el)) {
              scrollableParents.push(el);
            }
          }
        }
        if (parent2.nodeType !== 9 && overflowCheck(parent2)) {
          scrollableParents.push(parent2);
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
  fadeOut(element, ms2) {
    var opacity = 1, interval = 50, duration = ms2, gap = interval / duration;
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
function UniqueComponentId(prefix = "pv_id_") {
  lastId++;
  return `${prefix}${lastId}`;
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
      config: reactive(configOptions)
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
    let d2 = Math.max(DomHandler.getOuterWidth(target), DomHandler.getOuterHeight(target));
    ink.style.height = d2 + "px";
    ink.style.width = d2 + "px";
  }
  let offset = DomHandler.getOffset(target);
  let x = event.pageX - offset.left + document.body.scrollTop - DomHandler.getWidth(ink) / 2;
  let y2 = event.pageY - offset.top + document.body.scrollLeft - DomHandler.getHeight(ink) / 2;
  ink.style.top = y2 + "px";
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
var script = {
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
function render(_ctx, _cache, $props, $setup, $data, $options) {
  return openBlock(), createBlock("span", { class: $options.badgeClass }, [
    renderSlot(_ctx.$slots, "default", {}, () => [
      createTextVNode(toDisplayString($props.value), 1)
    ])
  ], 2);
}
script.render = render;
/*!
  * vue-router v4.0.11
  * (c) 2021 Eduardo San Martin Morote
  * @license MIT
  */
const hasSymbol = typeof Symbol === "function" && typeof Symbol.toStringTag === "symbol";
const PolySymbol = (name) => hasSymbol ? Symbol(name) : "_vr_" + name;
const matchedRouteKey = /* @__PURE__ */ PolySymbol("rvlm");
const viewDepthKey = /* @__PURE__ */ PolySymbol("rvd");
const routerKey = /* @__PURE__ */ PolySymbol("r");
const routeLocationKey = /* @__PURE__ */ PolySymbol("rl");
const routerViewLocationKey = /* @__PURE__ */ PolySymbol("rvl");
const isBrowser = typeof window !== "undefined";
function isESModule(obj) {
  return obj.__esModule || hasSymbol && obj[Symbol.toStringTag] === "Module";
}
const assign = Object.assign;
function applyToParams(fn, params) {
  const newParams = {};
  for (const key in params) {
    const value = params[key];
    newParams[key] = Array.isArray(value) ? value.map(fn) : fn(value);
  }
  return newParams;
}
const noop = () => {
};
const TRAILING_SLASH_RE = /\/$/;
const removeTrailingSlash = (path) => path.replace(TRAILING_SLASH_RE, "");
function parseURL(parseQuery2, location2, currentLocation = "/") {
  let path, query = {}, searchString = "", hash = "";
  const searchPos = location2.indexOf("?");
  const hashPos = location2.indexOf("#", searchPos > -1 ? searchPos : 0);
  if (searchPos > -1) {
    path = location2.slice(0, searchPos);
    searchString = location2.slice(searchPos + 1, hashPos > -1 ? hashPos : location2.length);
    query = parseQuery2(searchString);
  }
  if (hashPos > -1) {
    path = path || location2.slice(0, hashPos);
    hash = location2.slice(hashPos, location2.length);
  }
  path = resolveRelativePath(path != null ? path : location2, currentLocation);
  return {
    fullPath: path + (searchString && "?") + searchString + hash,
    path,
    query,
    hash
  };
}
function stringifyURL(stringifyQuery2, location2) {
  const query = location2.query ? stringifyQuery2(location2.query) : "";
  return location2.path + (query && "?") + query + (location2.hash || "");
}
function stripBase(pathname, base) {
  if (!base || !pathname.toLowerCase().startsWith(base.toLowerCase()))
    return pathname;
  return pathname.slice(base.length) || "/";
}
function isSameRouteLocation(stringifyQuery2, a, b) {
  const aLastIndex = a.matched.length - 1;
  const bLastIndex = b.matched.length - 1;
  return aLastIndex > -1 && aLastIndex === bLastIndex && isSameRouteRecord(a.matched[aLastIndex], b.matched[bLastIndex]) && isSameRouteLocationParams(a.params, b.params) && stringifyQuery2(a.query) === stringifyQuery2(b.query) && a.hash === b.hash;
}
function isSameRouteRecord(a, b) {
  return (a.aliasOf || a) === (b.aliasOf || b);
}
function isSameRouteLocationParams(a, b) {
  if (Object.keys(a).length !== Object.keys(b).length)
    return false;
  for (const key in a) {
    if (!isSameRouteLocationParamsValue(a[key], b[key]))
      return false;
  }
  return true;
}
function isSameRouteLocationParamsValue(a, b) {
  return Array.isArray(a) ? isEquivalentArray(a, b) : Array.isArray(b) ? isEquivalentArray(b, a) : a === b;
}
function isEquivalentArray(a, b) {
  return Array.isArray(b) ? a.length === b.length && a.every((value, i) => value === b[i]) : a.length === 1 && a[0] === b;
}
function resolveRelativePath(to, from) {
  if (to.startsWith("/"))
    return to;
  if (!to)
    return from;
  const fromSegments = from.split("/");
  const toSegments = to.split("/");
  let position = fromSegments.length - 1;
  let toPosition;
  let segment;
  for (toPosition = 0; toPosition < toSegments.length; toPosition++) {
    segment = toSegments[toPosition];
    if (position === 1 || segment === ".")
      continue;
    if (segment === "..")
      position--;
    else
      break;
  }
  return fromSegments.slice(0, position).join("/") + "/" + toSegments.slice(toPosition - (toPosition === toSegments.length ? 1 : 0)).join("/");
}
var NavigationType;
(function(NavigationType2) {
  NavigationType2["pop"] = "pop";
  NavigationType2["push"] = "push";
})(NavigationType || (NavigationType = {}));
var NavigationDirection;
(function(NavigationDirection2) {
  NavigationDirection2["back"] = "back";
  NavigationDirection2["forward"] = "forward";
  NavigationDirection2["unknown"] = "";
})(NavigationDirection || (NavigationDirection = {}));
function normalizeBase(base) {
  if (!base) {
    if (isBrowser) {
      const baseEl = document.querySelector("base");
      base = baseEl && baseEl.getAttribute("href") || "/";
      base = base.replace(/^\w+:\/\/[^\/]+/, "");
    } else {
      base = "/";
    }
  }
  if (base[0] !== "/" && base[0] !== "#")
    base = "/" + base;
  return removeTrailingSlash(base);
}
const BEFORE_HASH_RE = /^[^#]+#/;
function createHref(base, location2) {
  return base.replace(BEFORE_HASH_RE, "#") + location2;
}
function getElementPosition(el, offset) {
  const docRect = document.documentElement.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return {
    behavior: offset.behavior,
    left: elRect.left - docRect.left - (offset.left || 0),
    top: elRect.top - docRect.top - (offset.top || 0)
  };
}
const computeScrollPosition = () => ({
  left: window.pageXOffset,
  top: window.pageYOffset
});
function scrollToPosition(position) {
  let scrollToOptions;
  if ("el" in position) {
    const positionEl = position.el;
    const isIdSelector = typeof positionEl === "string" && positionEl.startsWith("#");
    const el = typeof positionEl === "string" ? isIdSelector ? document.getElementById(positionEl.slice(1)) : document.querySelector(positionEl) : positionEl;
    if (!el) {
      return;
    }
    scrollToOptions = getElementPosition(el, position);
  } else {
    scrollToOptions = position;
  }
  if ("scrollBehavior" in document.documentElement.style)
    window.scrollTo(scrollToOptions);
  else {
    window.scrollTo(scrollToOptions.left != null ? scrollToOptions.left : window.pageXOffset, scrollToOptions.top != null ? scrollToOptions.top : window.pageYOffset);
  }
}
function getScrollKey(path, delta) {
  const position = history.state ? history.state.position - delta : -1;
  return position + path;
}
const scrollPositions = new Map();
function saveScrollPosition(key, scrollPosition) {
  scrollPositions.set(key, scrollPosition);
}
function getSavedScrollPosition(key) {
  const scroll = scrollPositions.get(key);
  scrollPositions.delete(key);
  return scroll;
}
let createBaseLocation = () => location.protocol + "//" + location.host;
function createCurrentLocation(base, location2) {
  const { pathname, search, hash } = location2;
  const hashPos = base.indexOf("#");
  if (hashPos > -1) {
    let slicePos = hash.includes(base.slice(hashPos)) ? base.slice(hashPos).length : 1;
    let pathFromHash = hash.slice(slicePos);
    if (pathFromHash[0] !== "/")
      pathFromHash = "/" + pathFromHash;
    return stripBase(pathFromHash, "");
  }
  const path = stripBase(pathname, base);
  return path + search + hash;
}
function useHistoryListeners(base, historyState, currentLocation, replace) {
  let listeners = [];
  let teardowns = [];
  let pauseState = null;
  const popStateHandler = ({ state }) => {
    const to = createCurrentLocation(base, location);
    const from = currentLocation.value;
    const fromState = historyState.value;
    let delta = 0;
    if (state) {
      currentLocation.value = to;
      historyState.value = state;
      if (pauseState && pauseState === from) {
        pauseState = null;
        return;
      }
      delta = fromState ? state.position - fromState.position : 0;
    } else {
      replace(to);
    }
    listeners.forEach((listener) => {
      listener(currentLocation.value, from, {
        delta,
        type: NavigationType.pop,
        direction: delta ? delta > 0 ? NavigationDirection.forward : NavigationDirection.back : NavigationDirection.unknown
      });
    });
  };
  function pauseListeners() {
    pauseState = currentLocation.value;
  }
  function listen(callback) {
    listeners.push(callback);
    const teardown = () => {
      const index = listeners.indexOf(callback);
      if (index > -1)
        listeners.splice(index, 1);
    };
    teardowns.push(teardown);
    return teardown;
  }
  function beforeUnloadListener() {
    const { history: history2 } = window;
    if (!history2.state)
      return;
    history2.replaceState(assign({}, history2.state, { scroll: computeScrollPosition() }), "");
  }
  function destroy() {
    for (const teardown of teardowns)
      teardown();
    teardowns = [];
    window.removeEventListener("popstate", popStateHandler);
    window.removeEventListener("beforeunload", beforeUnloadListener);
  }
  window.addEventListener("popstate", popStateHandler);
  window.addEventListener("beforeunload", beforeUnloadListener);
  return {
    pauseListeners,
    listen,
    destroy
  };
}
function buildState(back, current, forward, replaced = false, computeScroll = false) {
  return {
    back,
    current,
    forward,
    replaced,
    position: window.history.length,
    scroll: computeScroll ? computeScrollPosition() : null
  };
}
function useHistoryStateNavigation(base) {
  const { history: history2, location: location2 } = window;
  const currentLocation = {
    value: createCurrentLocation(base, location2)
  };
  const historyState = { value: history2.state };
  if (!historyState.value) {
    changeLocation(currentLocation.value, {
      back: null,
      current: currentLocation.value,
      forward: null,
      position: history2.length - 1,
      replaced: true,
      scroll: null
    }, true);
  }
  function changeLocation(to, state, replace2) {
    const hashIndex = base.indexOf("#");
    const url = hashIndex > -1 ? (location2.host && document.querySelector("base") ? base : base.slice(hashIndex)) + to : createBaseLocation() + base + to;
    try {
      history2[replace2 ? "replaceState" : "pushState"](state, "", url);
      historyState.value = state;
    } catch (err) {
      {
        console.error(err);
      }
      location2[replace2 ? "replace" : "assign"](url);
    }
  }
  function replace(to, data) {
    const state = assign({}, history2.state, buildState(historyState.value.back, to, historyState.value.forward, true), data, { position: historyState.value.position });
    changeLocation(to, state, true);
    currentLocation.value = to;
  }
  function push(to, data) {
    const currentState = assign({}, historyState.value, history2.state, {
      forward: to,
      scroll: computeScrollPosition()
    });
    changeLocation(currentState.current, currentState, true);
    const state = assign({}, buildState(currentLocation.value, to, null), { position: currentState.position + 1 }, data);
    changeLocation(to, state, false);
    currentLocation.value = to;
  }
  return {
    location: currentLocation,
    state: historyState,
    push,
    replace
  };
}
function createWebHistory(base) {
  base = normalizeBase(base);
  const historyNavigation = useHistoryStateNavigation(base);
  const historyListeners = useHistoryListeners(base, historyNavigation.state, historyNavigation.location, historyNavigation.replace);
  function go(delta, triggerListeners = true) {
    if (!triggerListeners)
      historyListeners.pauseListeners();
    history.go(delta);
  }
  const routerHistory = assign({
    location: "",
    base,
    go,
    createHref: createHref.bind(null, base)
  }, historyNavigation, historyListeners);
  Object.defineProperty(routerHistory, "location", {
    enumerable: true,
    get: () => historyNavigation.location.value
  });
  Object.defineProperty(routerHistory, "state", {
    enumerable: true,
    get: () => historyNavigation.state.value
  });
  return routerHistory;
}
function isRouteLocation(route) {
  return typeof route === "string" || route && typeof route === "object";
}
function isRouteName(name) {
  return typeof name === "string" || typeof name === "symbol";
}
const START_LOCATION_NORMALIZED = {
  path: "/",
  name: void 0,
  params: {},
  query: {},
  hash: "",
  fullPath: "/",
  matched: [],
  meta: {},
  redirectedFrom: void 0
};
const NavigationFailureSymbol = /* @__PURE__ */ PolySymbol("nf");
var NavigationFailureType;
(function(NavigationFailureType2) {
  NavigationFailureType2[NavigationFailureType2["aborted"] = 4] = "aborted";
  NavigationFailureType2[NavigationFailureType2["cancelled"] = 8] = "cancelled";
  NavigationFailureType2[NavigationFailureType2["duplicated"] = 16] = "duplicated";
})(NavigationFailureType || (NavigationFailureType = {}));
function createRouterError(type, params) {
  {
    return assign(new Error(), {
      type,
      [NavigationFailureSymbol]: true
    }, params);
  }
}
function isNavigationFailure(error, type) {
  return error instanceof Error && NavigationFailureSymbol in error && (type == null || !!(error.type & type));
}
const BASE_PARAM_PATTERN = "[^/]+?";
const BASE_PATH_PARSER_OPTIONS = {
  sensitive: false,
  strict: false,
  start: true,
  end: true
};
const REGEX_CHARS_RE = /[.+*?^${}()[\]/\\]/g;
function tokensToParser(segments, extraOptions) {
  const options = assign({}, BASE_PATH_PARSER_OPTIONS, extraOptions);
  const score = [];
  let pattern = options.start ? "^" : "";
  const keys = [];
  for (const segment of segments) {
    const segmentScores = segment.length ? [] : [90];
    if (options.strict && !segment.length)
      pattern += "/";
    for (let tokenIndex = 0; tokenIndex < segment.length; tokenIndex++) {
      const token = segment[tokenIndex];
      let subSegmentScore = 40 + (options.sensitive ? 0.25 : 0);
      if (token.type === 0) {
        if (!tokenIndex)
          pattern += "/";
        pattern += token.value.replace(REGEX_CHARS_RE, "\\$&");
        subSegmentScore += 40;
      } else if (token.type === 1) {
        const { value, repeatable, optional, regexp } = token;
        keys.push({
          name: value,
          repeatable,
          optional
        });
        const re2 = regexp ? regexp : BASE_PARAM_PATTERN;
        if (re2 !== BASE_PARAM_PATTERN) {
          subSegmentScore += 10;
          try {
            new RegExp(`(${re2})`);
          } catch (err) {
            throw new Error(`Invalid custom RegExp for param "${value}" (${re2}): ` + err.message);
          }
        }
        let subPattern = repeatable ? `((?:${re2})(?:/(?:${re2}))*)` : `(${re2})`;
        if (!tokenIndex)
          subPattern = optional && segment.length < 2 ? `(?:/${subPattern})` : "/" + subPattern;
        if (optional)
          subPattern += "?";
        pattern += subPattern;
        subSegmentScore += 20;
        if (optional)
          subSegmentScore += -8;
        if (repeatable)
          subSegmentScore += -20;
        if (re2 === ".*")
          subSegmentScore += -50;
      }
      segmentScores.push(subSegmentScore);
    }
    score.push(segmentScores);
  }
  if (options.strict && options.end) {
    const i = score.length - 1;
    score[i][score[i].length - 1] += 0.7000000000000001;
  }
  if (!options.strict)
    pattern += "/?";
  if (options.end)
    pattern += "$";
  else if (options.strict)
    pattern += "(?:/|$)";
  const re = new RegExp(pattern, options.sensitive ? "" : "i");
  function parse2(path) {
    const match = path.match(re);
    const params = {};
    if (!match)
      return null;
    for (let i = 1; i < match.length; i++) {
      const value = match[i] || "";
      const key = keys[i - 1];
      params[key.name] = value && key.repeatable ? value.split("/") : value;
    }
    return params;
  }
  function stringify(params) {
    let path = "";
    let avoidDuplicatedSlash = false;
    for (const segment of segments) {
      if (!avoidDuplicatedSlash || !path.endsWith("/"))
        path += "/";
      avoidDuplicatedSlash = false;
      for (const token of segment) {
        if (token.type === 0) {
          path += token.value;
        } else if (token.type === 1) {
          const { value, repeatable, optional } = token;
          const param = value in params ? params[value] : "";
          if (Array.isArray(param) && !repeatable)
            throw new Error(`Provided param "${value}" is an array but it is not repeatable (* or + modifiers)`);
          const text = Array.isArray(param) ? param.join("/") : param;
          if (!text) {
            if (optional) {
              if (segment.length < 2) {
                if (path.endsWith("/"))
                  path = path.slice(0, -1);
                else
                  avoidDuplicatedSlash = true;
              }
            } else
              throw new Error(`Missing required param "${value}"`);
          }
          path += text;
        }
      }
    }
    return path;
  }
  return {
    re,
    score,
    keys,
    parse: parse2,
    stringify
  };
}
function compareScoreArray(a, b) {
  let i = 0;
  while (i < a.length && i < b.length) {
    const diff = b[i] - a[i];
    if (diff)
      return diff;
    i++;
  }
  if (a.length < b.length) {
    return a.length === 1 && a[0] === 40 + 40 ? -1 : 1;
  } else if (a.length > b.length) {
    return b.length === 1 && b[0] === 40 + 40 ? 1 : -1;
  }
  return 0;
}
function comparePathParserScore(a, b) {
  let i = 0;
  const aScore = a.score;
  const bScore = b.score;
  while (i < aScore.length && i < bScore.length) {
    const comp = compareScoreArray(aScore[i], bScore[i]);
    if (comp)
      return comp;
    i++;
  }
  return bScore.length - aScore.length;
}
const ROOT_TOKEN = {
  type: 0,
  value: ""
};
const VALID_PARAM_RE = /[a-zA-Z0-9_]/;
function tokenizePath(path) {
  if (!path)
    return [[]];
  if (path === "/")
    return [[ROOT_TOKEN]];
  if (!path.startsWith("/")) {
    throw new Error(`Invalid path "${path}"`);
  }
  function crash(message) {
    throw new Error(`ERR (${state})/"${buffer}": ${message}`);
  }
  let state = 0;
  let previousState = state;
  const tokens = [];
  let segment;
  function finalizeSegment() {
    if (segment)
      tokens.push(segment);
    segment = [];
  }
  let i = 0;
  let char;
  let buffer = "";
  let customRe = "";
  function consumeBuffer() {
    if (!buffer)
      return;
    if (state === 0) {
      segment.push({
        type: 0,
        value: buffer
      });
    } else if (state === 1 || state === 2 || state === 3) {
      if (segment.length > 1 && (char === "*" || char === "+"))
        crash(`A repeatable param (${buffer}) must be alone in its segment. eg: '/:ids+.`);
      segment.push({
        type: 1,
        value: buffer,
        regexp: customRe,
        repeatable: char === "*" || char === "+",
        optional: char === "*" || char === "?"
      });
    } else {
      crash("Invalid state to consume buffer");
    }
    buffer = "";
  }
  function addCharToBuffer() {
    buffer += char;
  }
  while (i < path.length) {
    char = path[i++];
    if (char === "\\" && state !== 2) {
      previousState = state;
      state = 4;
      continue;
    }
    switch (state) {
      case 0:
        if (char === "/") {
          if (buffer) {
            consumeBuffer();
          }
          finalizeSegment();
        } else if (char === ":") {
          consumeBuffer();
          state = 1;
        } else {
          addCharToBuffer();
        }
        break;
      case 4:
        addCharToBuffer();
        state = previousState;
        break;
      case 1:
        if (char === "(") {
          state = 2;
        } else if (VALID_PARAM_RE.test(char)) {
          addCharToBuffer();
        } else {
          consumeBuffer();
          state = 0;
          if (char !== "*" && char !== "?" && char !== "+")
            i--;
        }
        break;
      case 2:
        if (char === ")") {
          if (customRe[customRe.length - 1] == "\\")
            customRe = customRe.slice(0, -1) + char;
          else
            state = 3;
        } else {
          customRe += char;
        }
        break;
      case 3:
        consumeBuffer();
        state = 0;
        if (char !== "*" && char !== "?" && char !== "+")
          i--;
        customRe = "";
        break;
      default:
        crash("Unknown state");
        break;
    }
  }
  if (state === 2)
    crash(`Unfinished custom RegExp for param "${buffer}"`);
  consumeBuffer();
  finalizeSegment();
  return tokens;
}
function createRouteRecordMatcher(record, parent2, options) {
  const parser = tokensToParser(tokenizePath(record.path), options);
  const matcher = assign(parser, {
    record,
    parent: parent2,
    children: [],
    alias: []
  });
  if (parent2) {
    if (!matcher.record.aliasOf === !parent2.record.aliasOf)
      parent2.children.push(matcher);
  }
  return matcher;
}
function createRouterMatcher(routes, globalOptions) {
  const matchers = [];
  const matcherMap = new Map();
  globalOptions = mergeOptions({ strict: false, end: true, sensitive: false }, globalOptions);
  function getRecordMatcher(name) {
    return matcherMap.get(name);
  }
  function addRoute(record, parent2, originalRecord) {
    const isRootAdd = !originalRecord;
    const mainNormalizedRecord = normalizeRouteRecord(record);
    mainNormalizedRecord.aliasOf = originalRecord && originalRecord.record;
    const options = mergeOptions(globalOptions, record);
    const normalizedRecords = [
      mainNormalizedRecord
    ];
    if ("alias" in record) {
      const aliases = typeof record.alias === "string" ? [record.alias] : record.alias;
      for (const alias of aliases) {
        normalizedRecords.push(assign({}, mainNormalizedRecord, {
          components: originalRecord ? originalRecord.record.components : mainNormalizedRecord.components,
          path: alias,
          aliasOf: originalRecord ? originalRecord.record : mainNormalizedRecord
        }));
      }
    }
    let matcher;
    let originalMatcher;
    for (const normalizedRecord of normalizedRecords) {
      const { path } = normalizedRecord;
      if (parent2 && path[0] !== "/") {
        const parentPath = parent2.record.path;
        const connectingSlash = parentPath[parentPath.length - 1] === "/" ? "" : "/";
        normalizedRecord.path = parent2.record.path + (path && connectingSlash + path);
      }
      matcher = createRouteRecordMatcher(normalizedRecord, parent2, options);
      if (originalRecord) {
        originalRecord.alias.push(matcher);
      } else {
        originalMatcher = originalMatcher || matcher;
        if (originalMatcher !== matcher)
          originalMatcher.alias.push(matcher);
        if (isRootAdd && record.name && !isAliasRecord(matcher))
          removeRoute(record.name);
      }
      if ("children" in mainNormalizedRecord) {
        const children = mainNormalizedRecord.children;
        for (let i = 0; i < children.length; i++) {
          addRoute(children[i], matcher, originalRecord && originalRecord.children[i]);
        }
      }
      originalRecord = originalRecord || matcher;
      insertMatcher(matcher);
    }
    return originalMatcher ? () => {
      removeRoute(originalMatcher);
    } : noop;
  }
  function removeRoute(matcherRef) {
    if (isRouteName(matcherRef)) {
      const matcher = matcherMap.get(matcherRef);
      if (matcher) {
        matcherMap.delete(matcherRef);
        matchers.splice(matchers.indexOf(matcher), 1);
        matcher.children.forEach(removeRoute);
        matcher.alias.forEach(removeRoute);
      }
    } else {
      const index = matchers.indexOf(matcherRef);
      if (index > -1) {
        matchers.splice(index, 1);
        if (matcherRef.record.name)
          matcherMap.delete(matcherRef.record.name);
        matcherRef.children.forEach(removeRoute);
        matcherRef.alias.forEach(removeRoute);
      }
    }
  }
  function getRoutes() {
    return matchers;
  }
  function insertMatcher(matcher) {
    let i = 0;
    while (i < matchers.length && comparePathParserScore(matcher, matchers[i]) >= 0)
      i++;
    matchers.splice(i, 0, matcher);
    if (matcher.record.name && !isAliasRecord(matcher))
      matcherMap.set(matcher.record.name, matcher);
  }
  function resolve2(location2, currentLocation) {
    let matcher;
    let params = {};
    let path;
    let name;
    if ("name" in location2 && location2.name) {
      matcher = matcherMap.get(location2.name);
      if (!matcher)
        throw createRouterError(1, {
          location: location2
        });
      name = matcher.record.name;
      params = assign(paramsFromLocation(currentLocation.params, matcher.keys.filter((k) => !k.optional).map((k) => k.name)), location2.params);
      path = matcher.stringify(params);
    } else if ("path" in location2) {
      path = location2.path;
      matcher = matchers.find((m2) => m2.re.test(path));
      if (matcher) {
        params = matcher.parse(path);
        name = matcher.record.name;
      }
    } else {
      matcher = currentLocation.name ? matcherMap.get(currentLocation.name) : matchers.find((m2) => m2.re.test(currentLocation.path));
      if (!matcher)
        throw createRouterError(1, {
          location: location2,
          currentLocation
        });
      name = matcher.record.name;
      params = assign({}, currentLocation.params, location2.params);
      path = matcher.stringify(params);
    }
    const matched = [];
    let parentMatcher = matcher;
    while (parentMatcher) {
      matched.unshift(parentMatcher.record);
      parentMatcher = parentMatcher.parent;
    }
    return {
      name,
      path,
      params,
      matched,
      meta: mergeMetaFields(matched)
    };
  }
  routes.forEach((route) => addRoute(route));
  return { addRoute, resolve: resolve2, removeRoute, getRoutes, getRecordMatcher };
}
function paramsFromLocation(params, keys) {
  const newParams = {};
  for (const key of keys) {
    if (key in params)
      newParams[key] = params[key];
  }
  return newParams;
}
function normalizeRouteRecord(record) {
  return {
    path: record.path,
    redirect: record.redirect,
    name: record.name,
    meta: record.meta || {},
    aliasOf: void 0,
    beforeEnter: record.beforeEnter,
    props: normalizeRecordProps(record),
    children: record.children || [],
    instances: {},
    leaveGuards: new Set(),
    updateGuards: new Set(),
    enterCallbacks: {},
    components: "components" in record ? record.components || {} : { default: record.component }
  };
}
function normalizeRecordProps(record) {
  const propsObject = {};
  const props = record.props || false;
  if ("component" in record) {
    propsObject.default = props;
  } else {
    for (const name in record.components)
      propsObject[name] = typeof props === "boolean" ? props : props[name];
  }
  return propsObject;
}
function isAliasRecord(record) {
  while (record) {
    if (record.record.aliasOf)
      return true;
    record = record.parent;
  }
  return false;
}
function mergeMetaFields(matched) {
  return matched.reduce((meta, record) => assign(meta, record.meta), {});
}
function mergeOptions(defaults, partialOptions) {
  const options = {};
  for (const key in defaults) {
    options[key] = key in partialOptions ? partialOptions[key] : defaults[key];
  }
  return options;
}
const HASH_RE = /#/g;
const AMPERSAND_RE = /&/g;
const SLASH_RE = /\//g;
const EQUAL_RE = /=/g;
const IM_RE = /\?/g;
const PLUS_RE = /\+/g;
const ENC_BRACKET_OPEN_RE = /%5B/g;
const ENC_BRACKET_CLOSE_RE = /%5D/g;
const ENC_CARET_RE = /%5E/g;
const ENC_BACKTICK_RE = /%60/g;
const ENC_CURLY_OPEN_RE = /%7B/g;
const ENC_PIPE_RE = /%7C/g;
const ENC_CURLY_CLOSE_RE = /%7D/g;
const ENC_SPACE_RE = /%20/g;
function commonEncode(text) {
  return encodeURI("" + text).replace(ENC_PIPE_RE, "|").replace(ENC_BRACKET_OPEN_RE, "[").replace(ENC_BRACKET_CLOSE_RE, "]");
}
function encodeHash(text) {
  return commonEncode(text).replace(ENC_CURLY_OPEN_RE, "{").replace(ENC_CURLY_CLOSE_RE, "}").replace(ENC_CARET_RE, "^");
}
function encodeQueryValue(text) {
  return commonEncode(text).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CURLY_OPEN_RE, "{").replace(ENC_CURLY_CLOSE_RE, "}").replace(ENC_CARET_RE, "^");
}
function encodeQueryKey(text) {
  return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
}
function encodePath(text) {
  return commonEncode(text).replace(HASH_RE, "%23").replace(IM_RE, "%3F");
}
function encodeParam(text) {
  return text == null ? "" : encodePath(text).replace(SLASH_RE, "%2F");
}
function decode(text) {
  try {
    return decodeURIComponent("" + text);
  } catch (err) {
  }
  return "" + text;
}
function parseQuery(search) {
  const query = {};
  if (search === "" || search === "?")
    return query;
  const hasLeadingIM = search[0] === "?";
  const searchParams = (hasLeadingIM ? search.slice(1) : search).split("&");
  for (let i = 0; i < searchParams.length; ++i) {
    const searchParam = searchParams[i].replace(PLUS_RE, " ");
    const eqPos = searchParam.indexOf("=");
    const key = decode(eqPos < 0 ? searchParam : searchParam.slice(0, eqPos));
    const value = eqPos < 0 ? null : decode(searchParam.slice(eqPos + 1));
    if (key in query) {
      let currentValue = query[key];
      if (!Array.isArray(currentValue)) {
        currentValue = query[key] = [currentValue];
      }
      currentValue.push(value);
    } else {
      query[key] = value;
    }
  }
  return query;
}
function stringifyQuery(query) {
  let search = "";
  for (let key in query) {
    const value = query[key];
    key = encodeQueryKey(key);
    if (value == null) {
      if (value !== void 0) {
        search += (search.length ? "&" : "") + key;
      }
      continue;
    }
    const values = Array.isArray(value) ? value.map((v) => v && encodeQueryValue(v)) : [value && encodeQueryValue(value)];
    values.forEach((value2) => {
      if (value2 !== void 0) {
        search += (search.length ? "&" : "") + key;
        if (value2 != null)
          search += "=" + value2;
      }
    });
  }
  return search;
}
function normalizeQuery(query) {
  const normalizedQuery = {};
  for (const key in query) {
    const value = query[key];
    if (value !== void 0) {
      normalizedQuery[key] = Array.isArray(value) ? value.map((v) => v == null ? null : "" + v) : value == null ? value : "" + value;
    }
  }
  return normalizedQuery;
}
function useCallbacks() {
  let handlers = [];
  function add2(handler2) {
    handlers.push(handler2);
    return () => {
      const i = handlers.indexOf(handler2);
      if (i > -1)
        handlers.splice(i, 1);
    };
  }
  function reset2() {
    handlers = [];
  }
  return {
    add: add2,
    list: () => handlers,
    reset: reset2
  };
}
function guardToPromiseFn(guard, to, from, record, name) {
  const enterCallbackArray = record && (record.enterCallbacks[name] = record.enterCallbacks[name] || []);
  return () => new Promise((resolve2, reject) => {
    const next = (valid) => {
      if (valid === false)
        reject(createRouterError(4, {
          from,
          to
        }));
      else if (valid instanceof Error) {
        reject(valid);
      } else if (isRouteLocation(valid)) {
        reject(createRouterError(2, {
          from: to,
          to: valid
        }));
      } else {
        if (enterCallbackArray && record.enterCallbacks[name] === enterCallbackArray && typeof valid === "function")
          enterCallbackArray.push(valid);
        resolve2();
      }
    };
    const guardReturn = guard.call(record && record.instances[name], to, from, next);
    let guardCall = Promise.resolve(guardReturn);
    if (guard.length < 3)
      guardCall = guardCall.then(next);
    guardCall.catch((err) => reject(err));
  });
}
function extractComponentsGuards(matched, guardType, to, from) {
  const guards = [];
  for (const record of matched) {
    for (const name in record.components) {
      let rawComponent = record.components[name];
      if (guardType !== "beforeRouteEnter" && !record.instances[name])
        continue;
      if (isRouteComponent(rawComponent)) {
        const options = rawComponent.__vccOpts || rawComponent;
        const guard = options[guardType];
        guard && guards.push(guardToPromiseFn(guard, to, from, record, name));
      } else {
        let componentPromise = rawComponent();
        guards.push(() => componentPromise.then((resolved) => {
          if (!resolved)
            return Promise.reject(new Error(`Couldn't resolve component "${name}" at "${record.path}"`));
          const resolvedComponent = isESModule(resolved) ? resolved.default : resolved;
          record.components[name] = resolvedComponent;
          const options = resolvedComponent.__vccOpts || resolvedComponent;
          const guard = options[guardType];
          return guard && guardToPromiseFn(guard, to, from, record, name)();
        }));
      }
    }
  }
  return guards;
}
function isRouteComponent(component) {
  return typeof component === "object" || "displayName" in component || "props" in component || "__vccOpts" in component;
}
function useLink(props) {
  const router = inject(routerKey);
  const currentRoute = inject(routeLocationKey);
  const route = computed(() => router.resolve(unref(props.to)));
  const activeRecordIndex = computed(() => {
    const { matched } = route.value;
    const { length } = matched;
    const routeMatched = matched[length - 1];
    const currentMatched = currentRoute.matched;
    if (!routeMatched || !currentMatched.length)
      return -1;
    const index = currentMatched.findIndex(isSameRouteRecord.bind(null, routeMatched));
    if (index > -1)
      return index;
    const parentRecordPath = getOriginalPath(matched[length - 2]);
    return length > 1 && getOriginalPath(routeMatched) === parentRecordPath && currentMatched[currentMatched.length - 1].path !== parentRecordPath ? currentMatched.findIndex(isSameRouteRecord.bind(null, matched[length - 2])) : index;
  });
  const isActive = computed(() => activeRecordIndex.value > -1 && includesParams(currentRoute.params, route.value.params));
  const isExactActive = computed(() => activeRecordIndex.value > -1 && activeRecordIndex.value === currentRoute.matched.length - 1 && isSameRouteLocationParams(currentRoute.params, route.value.params));
  function navigate(e = {}) {
    if (guardEvent(e)) {
      return router[unref(props.replace) ? "replace" : "push"](unref(props.to)).catch(noop);
    }
    return Promise.resolve();
  }
  return {
    route,
    href: computed(() => route.value.href),
    isActive,
    isExactActive,
    navigate
  };
}
const RouterLinkImpl = /* @__PURE__ */ defineComponent({
  name: "RouterLink",
  props: {
    to: {
      type: [String, Object],
      required: true
    },
    replace: Boolean,
    activeClass: String,
    exactActiveClass: String,
    custom: Boolean,
    ariaCurrentValue: {
      type: String,
      default: "page"
    }
  },
  useLink,
  setup(props, { slots }) {
    const link = reactive(useLink(props));
    const { options } = inject(routerKey);
    const elClass = computed(() => ({
      [getLinkClass(props.activeClass, options.linkActiveClass, "router-link-active")]: link.isActive,
      [getLinkClass(props.exactActiveClass, options.linkExactActiveClass, "router-link-exact-active")]: link.isExactActive
    }));
    return () => {
      const children = slots.default && slots.default(link);
      return props.custom ? children : h$2("a", {
        "aria-current": link.isExactActive ? props.ariaCurrentValue : null,
        href: link.href,
        onClick: link.navigate,
        class: elClass.value
      }, children);
    };
  }
});
const RouterLink = RouterLinkImpl;
function guardEvent(e) {
  if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
    return;
  if (e.defaultPrevented)
    return;
  if (e.button !== void 0 && e.button !== 0)
    return;
  if (e.currentTarget && e.currentTarget.getAttribute) {
    const target = e.currentTarget.getAttribute("target");
    if (/\b_blank\b/i.test(target))
      return;
  }
  if (e.preventDefault)
    e.preventDefault();
  return true;
}
function includesParams(outer, inner) {
  for (const key in inner) {
    const innerValue = inner[key];
    const outerValue = outer[key];
    if (typeof innerValue === "string") {
      if (innerValue !== outerValue)
        return false;
    } else {
      if (!Array.isArray(outerValue) || outerValue.length !== innerValue.length || innerValue.some((value, i) => value !== outerValue[i]))
        return false;
    }
  }
  return true;
}
function getOriginalPath(record) {
  return record ? record.aliasOf ? record.aliasOf.path : record.path : "";
}
const getLinkClass = (propClass, globalClass, defaultClass) => propClass != null ? propClass : globalClass != null ? globalClass : defaultClass;
const RouterViewImpl = /* @__PURE__ */ defineComponent({
  name: "RouterView",
  inheritAttrs: false,
  props: {
    name: {
      type: String,
      default: "default"
    },
    route: Object
  },
  setup(props, { attrs, slots }) {
    const injectedRoute = inject(routerViewLocationKey);
    const routeToDisplay = computed(() => props.route || injectedRoute.value);
    const depth = inject(viewDepthKey, 0);
    const matchedRouteRef = computed(() => routeToDisplay.value.matched[depth]);
    provide(viewDepthKey, depth + 1);
    provide(matchedRouteKey, matchedRouteRef);
    provide(routerViewLocationKey, routeToDisplay);
    const viewRef = ref();
    watch(() => [viewRef.value, matchedRouteRef.value, props.name], ([instance, to, name], [oldInstance, from, oldName]) => {
      if (to) {
        to.instances[name] = instance;
        if (from && from !== to && instance && instance === oldInstance) {
          if (!to.leaveGuards.size) {
            to.leaveGuards = from.leaveGuards;
          }
          if (!to.updateGuards.size) {
            to.updateGuards = from.updateGuards;
          }
        }
      }
      if (instance && to && (!from || !isSameRouteRecord(to, from) || !oldInstance)) {
        (to.enterCallbacks[name] || []).forEach((callback) => callback(instance));
      }
    }, { flush: "post" });
    return () => {
      const route = routeToDisplay.value;
      const matchedRoute = matchedRouteRef.value;
      const ViewComponent = matchedRoute && matchedRoute.components[props.name];
      const currentName = props.name;
      if (!ViewComponent) {
        return normalizeSlot(slots.default, { Component: ViewComponent, route });
      }
      const routePropsOption = matchedRoute.props[props.name];
      const routeProps = routePropsOption ? routePropsOption === true ? route.params : typeof routePropsOption === "function" ? routePropsOption(route) : routePropsOption : null;
      const onVnodeUnmounted = (vnode) => {
        if (vnode.component.isUnmounted) {
          matchedRoute.instances[currentName] = null;
        }
      };
      const component = h$2(ViewComponent, assign({}, routeProps, attrs, {
        onVnodeUnmounted,
        ref: viewRef
      }));
      return normalizeSlot(slots.default, { Component: component, route }) || component;
    };
  }
});
function normalizeSlot(slot, data) {
  if (!slot)
    return null;
  const slotContent = slot(data);
  return slotContent.length === 1 ? slotContent[0] : slotContent;
}
const RouterView = RouterViewImpl;
function createRouter(options) {
  const matcher = createRouterMatcher(options.routes, options);
  const parseQuery$1 = options.parseQuery || parseQuery;
  const stringifyQuery$1 = options.stringifyQuery || stringifyQuery;
  const routerHistory = options.history;
  const beforeGuards = useCallbacks();
  const beforeResolveGuards = useCallbacks();
  const afterGuards = useCallbacks();
  const currentRoute = shallowRef(START_LOCATION_NORMALIZED);
  let pendingLocation = START_LOCATION_NORMALIZED;
  if (isBrowser && options.scrollBehavior && "scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  const normalizeParams = applyToParams.bind(null, (paramValue) => "" + paramValue);
  const encodeParams = applyToParams.bind(null, encodeParam);
  const decodeParams = applyToParams.bind(null, decode);
  function addRoute(parentOrRoute, route) {
    let parent2;
    let record;
    if (isRouteName(parentOrRoute)) {
      parent2 = matcher.getRecordMatcher(parentOrRoute);
      record = route;
    } else {
      record = parentOrRoute;
    }
    return matcher.addRoute(record, parent2);
  }
  function removeRoute(name) {
    const recordMatcher = matcher.getRecordMatcher(name);
    if (recordMatcher) {
      matcher.removeRoute(recordMatcher);
    }
  }
  function getRoutes() {
    return matcher.getRoutes().map((routeMatcher) => routeMatcher.record);
  }
  function hasRoute(name) {
    return !!matcher.getRecordMatcher(name);
  }
  function resolve2(rawLocation, currentLocation) {
    currentLocation = assign({}, currentLocation || currentRoute.value);
    if (typeof rawLocation === "string") {
      const locationNormalized = parseURL(parseQuery$1, rawLocation, currentLocation.path);
      const matchedRoute2 = matcher.resolve({ path: locationNormalized.path }, currentLocation);
      const href2 = routerHistory.createHref(locationNormalized.fullPath);
      return assign(locationNormalized, matchedRoute2, {
        params: decodeParams(matchedRoute2.params),
        hash: decode(locationNormalized.hash),
        redirectedFrom: void 0,
        href: href2
      });
    }
    let matcherLocation;
    if ("path" in rawLocation) {
      matcherLocation = assign({}, rawLocation, {
        path: parseURL(parseQuery$1, rawLocation.path, currentLocation.path).path
      });
    } else {
      const targetParams = assign({}, rawLocation.params);
      for (const key in targetParams) {
        if (targetParams[key] == null) {
          delete targetParams[key];
        }
      }
      matcherLocation = assign({}, rawLocation, {
        params: encodeParams(rawLocation.params)
      });
      currentLocation.params = encodeParams(currentLocation.params);
    }
    const matchedRoute = matcher.resolve(matcherLocation, currentLocation);
    const hash = rawLocation.hash || "";
    matchedRoute.params = normalizeParams(decodeParams(matchedRoute.params));
    const fullPath = stringifyURL(stringifyQuery$1, assign({}, rawLocation, {
      hash: encodeHash(hash),
      path: matchedRoute.path
    }));
    const href = routerHistory.createHref(fullPath);
    return assign({
      fullPath,
      hash,
      query: stringifyQuery$1 === stringifyQuery ? normalizeQuery(rawLocation.query) : rawLocation.query || {}
    }, matchedRoute, {
      redirectedFrom: void 0,
      href
    });
  }
  function locationAsObject(to) {
    return typeof to === "string" ? parseURL(parseQuery$1, to, currentRoute.value.path) : assign({}, to);
  }
  function checkCanceledNavigation(to, from) {
    if (pendingLocation !== to) {
      return createRouterError(8, {
        from,
        to
      });
    }
  }
  function push(to) {
    return pushWithRedirect(to);
  }
  function replace(to) {
    return push(assign(locationAsObject(to), { replace: true }));
  }
  function handleRedirectRecord(to) {
    const lastMatched = to.matched[to.matched.length - 1];
    if (lastMatched && lastMatched.redirect) {
      const { redirect } = lastMatched;
      let newTargetLocation = typeof redirect === "function" ? redirect(to) : redirect;
      if (typeof newTargetLocation === "string") {
        newTargetLocation = newTargetLocation.includes("?") || newTargetLocation.includes("#") ? newTargetLocation = locationAsObject(newTargetLocation) : { path: newTargetLocation };
        newTargetLocation.params = {};
      }
      return assign({
        query: to.query,
        hash: to.hash,
        params: to.params
      }, newTargetLocation);
    }
  }
  function pushWithRedirect(to, redirectedFrom) {
    const targetLocation = pendingLocation = resolve2(to);
    const from = currentRoute.value;
    const data = to.state;
    const force = to.force;
    const replace2 = to.replace === true;
    const shouldRedirect = handleRedirectRecord(targetLocation);
    if (shouldRedirect)
      return pushWithRedirect(assign(locationAsObject(shouldRedirect), {
        state: data,
        force,
        replace: replace2
      }), redirectedFrom || targetLocation);
    const toLocation = targetLocation;
    toLocation.redirectedFrom = redirectedFrom;
    let failure;
    if (!force && isSameRouteLocation(stringifyQuery$1, from, targetLocation)) {
      failure = createRouterError(16, { to: toLocation, from });
      handleScroll(from, from, true, false);
    }
    return (failure ? Promise.resolve(failure) : navigate(toLocation, from)).catch((error) => isNavigationFailure(error) ? error : triggerError(error, toLocation, from)).then((failure2) => {
      if (failure2) {
        if (isNavigationFailure(failure2, 2)) {
          return pushWithRedirect(assign(locationAsObject(failure2.to), {
            state: data,
            force,
            replace: replace2
          }), redirectedFrom || toLocation);
        }
      } else {
        failure2 = finalizeNavigation(toLocation, from, true, replace2, data);
      }
      triggerAfterEach(toLocation, from, failure2);
      return failure2;
    });
  }
  function checkCanceledNavigationAndReject(to, from) {
    const error = checkCanceledNavigation(to, from);
    return error ? Promise.reject(error) : Promise.resolve();
  }
  function navigate(to, from) {
    let guards;
    const [leavingRecords, updatingRecords, enteringRecords] = extractChangingRecords(to, from);
    guards = extractComponentsGuards(leavingRecords.reverse(), "beforeRouteLeave", to, from);
    for (const record of leavingRecords) {
      record.leaveGuards.forEach((guard) => {
        guards.push(guardToPromiseFn(guard, to, from));
      });
    }
    const canceledNavigationCheck = checkCanceledNavigationAndReject.bind(null, to, from);
    guards.push(canceledNavigationCheck);
    return runGuardQueue(guards).then(() => {
      guards = [];
      for (const guard of beforeGuards.list()) {
        guards.push(guardToPromiseFn(guard, to, from));
      }
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards);
    }).then(() => {
      guards = extractComponentsGuards(updatingRecords, "beforeRouteUpdate", to, from);
      for (const record of updatingRecords) {
        record.updateGuards.forEach((guard) => {
          guards.push(guardToPromiseFn(guard, to, from));
        });
      }
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards);
    }).then(() => {
      guards = [];
      for (const record of to.matched) {
        if (record.beforeEnter && !from.matched.includes(record)) {
          if (Array.isArray(record.beforeEnter)) {
            for (const beforeEnter of record.beforeEnter)
              guards.push(guardToPromiseFn(beforeEnter, to, from));
          } else {
            guards.push(guardToPromiseFn(record.beforeEnter, to, from));
          }
        }
      }
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards);
    }).then(() => {
      to.matched.forEach((record) => record.enterCallbacks = {});
      guards = extractComponentsGuards(enteringRecords, "beforeRouteEnter", to, from);
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards);
    }).then(() => {
      guards = [];
      for (const guard of beforeResolveGuards.list()) {
        guards.push(guardToPromiseFn(guard, to, from));
      }
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards);
    }).catch((err) => isNavigationFailure(err, 8) ? err : Promise.reject(err));
  }
  function triggerAfterEach(to, from, failure) {
    for (const guard of afterGuards.list())
      guard(to, from, failure);
  }
  function finalizeNavigation(toLocation, from, isPush, replace2, data) {
    const error = checkCanceledNavigation(toLocation, from);
    if (error)
      return error;
    const isFirstNavigation = from === START_LOCATION_NORMALIZED;
    const state = !isBrowser ? {} : history.state;
    if (isPush) {
      if (replace2 || isFirstNavigation)
        routerHistory.replace(toLocation.fullPath, assign({
          scroll: isFirstNavigation && state && state.scroll
        }, data));
      else
        routerHistory.push(toLocation.fullPath, data);
    }
    currentRoute.value = toLocation;
    handleScroll(toLocation, from, isPush, isFirstNavigation);
    markAsReady();
  }
  let removeHistoryListener;
  function setupListeners() {
    removeHistoryListener = routerHistory.listen((to, _from, info) => {
      const toLocation = resolve2(to);
      const shouldRedirect = handleRedirectRecord(toLocation);
      if (shouldRedirect) {
        pushWithRedirect(assign(shouldRedirect, { replace: true }), toLocation).catch(noop);
        return;
      }
      pendingLocation = toLocation;
      const from = currentRoute.value;
      if (isBrowser) {
        saveScrollPosition(getScrollKey(from.fullPath, info.delta), computeScrollPosition());
      }
      navigate(toLocation, from).catch((error) => {
        if (isNavigationFailure(error, 4 | 8)) {
          return error;
        }
        if (isNavigationFailure(error, 2)) {
          pushWithRedirect(error.to, toLocation).then((failure) => {
            if (isNavigationFailure(failure, 4 | 16) && !info.delta && info.type === NavigationType.pop) {
              routerHistory.go(-1, false);
            }
          }).catch(noop);
          return Promise.reject();
        }
        if (info.delta)
          routerHistory.go(-info.delta, false);
        return triggerError(error, toLocation, from);
      }).then((failure) => {
        failure = failure || finalizeNavigation(toLocation, from, false);
        if (failure) {
          if (info.delta) {
            routerHistory.go(-info.delta, false);
          } else if (info.type === NavigationType.pop && isNavigationFailure(failure, 4 | 16)) {
            routerHistory.go(-1, false);
          }
        }
        triggerAfterEach(toLocation, from, failure);
      }).catch(noop);
    });
  }
  let readyHandlers = useCallbacks();
  let errorHandlers = useCallbacks();
  let ready;
  function triggerError(error, to, from) {
    markAsReady(error);
    const list = errorHandlers.list();
    if (list.length) {
      list.forEach((handler2) => handler2(error, to, from));
    } else {
      console.error(error);
    }
    return Promise.reject(error);
  }
  function isReady() {
    if (ready && currentRoute.value !== START_LOCATION_NORMALIZED)
      return Promise.resolve();
    return new Promise((resolve3, reject) => {
      readyHandlers.add([resolve3, reject]);
    });
  }
  function markAsReady(err) {
    if (ready)
      return;
    ready = true;
    setupListeners();
    readyHandlers.list().forEach(([resolve3, reject]) => err ? reject(err) : resolve3());
    readyHandlers.reset();
  }
  function handleScroll(to, from, isPush, isFirstNavigation) {
    const { scrollBehavior } = options;
    if (!isBrowser || !scrollBehavior)
      return Promise.resolve();
    const scrollPosition = !isPush && getSavedScrollPosition(getScrollKey(to.fullPath, 0)) || (isFirstNavigation || !isPush) && history.state && history.state.scroll || null;
    return nextTick().then(() => scrollBehavior(to, from, scrollPosition)).then((position) => position && scrollToPosition(position)).catch((err) => triggerError(err, to, from));
  }
  const go = (delta) => routerHistory.go(delta);
  let started;
  const installedApps = new Set();
  const router = {
    currentRoute,
    addRoute,
    removeRoute,
    hasRoute,
    getRoutes,
    resolve: resolve2,
    options,
    push,
    replace,
    go,
    back: () => go(-1),
    forward: () => go(1),
    beforeEach: beforeGuards.add,
    beforeResolve: beforeResolveGuards.add,
    afterEach: afterGuards.add,
    onError: errorHandlers.add,
    isReady,
    install(app) {
      const router2 = this;
      app.component("RouterLink", RouterLink);
      app.component("RouterView", RouterView);
      app.config.globalProperties.$router = router2;
      Object.defineProperty(app.config.globalProperties, "$route", {
        enumerable: true,
        get: () => unref(currentRoute)
      });
      if (isBrowser && !started && currentRoute.value === START_LOCATION_NORMALIZED) {
        started = true;
        push(routerHistory.location).catch((err) => {
        });
      }
      const reactiveRoute = {};
      for (const key in START_LOCATION_NORMALIZED) {
        reactiveRoute[key] = computed(() => currentRoute.value[key]);
      }
      app.provide(routerKey, router2);
      app.provide(routeLocationKey, reactive(reactiveRoute));
      app.provide(routerViewLocationKey, currentRoute);
      const unmountApp = app.unmount;
      installedApps.add(app);
      app.unmount = function() {
        installedApps.delete(app);
        if (installedApps.size < 1) {
          pendingLocation = START_LOCATION_NORMALIZED;
          removeHistoryListener && removeHistoryListener();
          currentRoute.value = START_LOCATION_NORMALIZED;
          started = false;
          ready = false;
        }
        unmountApp();
      };
    }
  };
  return router;
}
function runGuardQueue(guards) {
  return guards.reduce((promise, guard) => promise.then(() => guard()), Promise.resolve());
}
function extractChangingRecords(to, from) {
  const leavingRecords = [];
  const updatingRecords = [];
  const enteringRecords = [];
  const len = Math.max(from.matched.length, to.matched.length);
  for (let i = 0; i < len; i++) {
    const recordFrom = from.matched[i];
    if (recordFrom) {
      if (to.matched.find((record) => isSameRouteRecord(record, recordFrom)))
        updatingRecords.push(recordFrom);
      else
        leavingRecords.push(recordFrom);
    }
    const recordTo = to.matched[i];
    if (recordTo) {
      if (!from.matched.find((record) => isSameRouteRecord(record, recordTo))) {
        enteringRecords.push(recordTo);
      }
    }
  }
  return [leavingRecords, updatingRecords, enteringRecords];
}
function useRouter() {
  return inject(routerKey);
}
function useRoute() {
  return inject(routeLocationKey);
}
var sockjs_min = { exports: {} };
(function(module, exports) {
  !function(e) {
    module.exports = e();
  }(function() {
    return function i(s2, a, l) {
      function u(t, e2) {
        if (!a[t]) {
          if (!s2[t]) {
            var n = typeof commonjsRequire == "function" && commonjsRequire;
            if (!e2 && n)
              return n(t, true);
            if (c)
              return c(t, true);
            var r = new Error("Cannot find module '" + t + "'");
            throw r.code = "MODULE_NOT_FOUND", r;
          }
          var o = a[t] = { exports: {} };
          s2[t][0].call(o.exports, function(e3) {
            return u(s2[t][1][e3] || e3);
          }, o, o.exports, i, s2, a, l);
        }
        return a[t].exports;
      }
      for (var c = typeof commonjsRequire == "function" && commonjsRequire, e = 0; e < l.length; e++)
        u(l[e]);
      return u;
    }({ 1: [function(n, r, e) {
      (function(e2) {
        var t = n("./transport-list");
        r.exports = n("./main")(t), "_sockjs_onload" in e2 && setTimeout(e2._sockjs_onload, 1);
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, { "./main": 14, "./transport-list": 16 }], 2: [function(e, t, n) {
      var r = e("inherits"), o = e("./event");
      function i() {
        o.call(this), this.initEvent("close", false, false), this.wasClean = false, this.code = 0, this.reason = "";
      }
      r(i, o), t.exports = i;
    }, { "./event": 4, "inherits": 54 }], 3: [function(e, t, n) {
      var r = e("inherits"), o = e("./eventtarget");
      function i() {
        o.call(this);
      }
      r(i, o), i.prototype.removeAllListeners = function(e2) {
        e2 ? delete this._listeners[e2] : this._listeners = {};
      }, i.prototype.once = function(t2, n2) {
        var r2 = this, o2 = false;
        this.on(t2, function e2() {
          r2.removeListener(t2, e2), o2 || (o2 = true, n2.apply(this, arguments));
        });
      }, i.prototype.emit = function() {
        var e2 = arguments[0], t2 = this._listeners[e2];
        if (t2) {
          for (var n2 = arguments.length, r2 = new Array(n2 - 1), o2 = 1; o2 < n2; o2++)
            r2[o2 - 1] = arguments[o2];
          for (var i2 = 0; i2 < t2.length; i2++)
            t2[i2].apply(this, r2);
        }
      }, i.prototype.on = i.prototype.addListener = o.prototype.addEventListener, i.prototype.removeListener = o.prototype.removeEventListener, t.exports.EventEmitter = i;
    }, { "./eventtarget": 5, "inherits": 54 }], 4: [function(e, t, n) {
      function r(e2) {
        this.type = e2;
      }
      r.prototype.initEvent = function(e2, t2, n2) {
        return this.type = e2, this.bubbles = t2, this.cancelable = n2, this.timeStamp = +new Date(), this;
      }, r.prototype.stopPropagation = function() {
      }, r.prototype.preventDefault = function() {
      }, r.CAPTURING_PHASE = 1, r.AT_TARGET = 2, r.BUBBLING_PHASE = 3, t.exports = r;
    }, {}], 5: [function(e, t, n) {
      function r() {
        this._listeners = {};
      }
      r.prototype.addEventListener = function(e2, t2) {
        e2 in this._listeners || (this._listeners[e2] = []);
        var n2 = this._listeners[e2];
        n2.indexOf(t2) === -1 && (n2 = n2.concat([t2])), this._listeners[e2] = n2;
      }, r.prototype.removeEventListener = function(e2, t2) {
        var n2 = this._listeners[e2];
        if (n2) {
          var r2 = n2.indexOf(t2);
          r2 === -1 || (1 < n2.length ? this._listeners[e2] = n2.slice(0, r2).concat(n2.slice(r2 + 1)) : delete this._listeners[e2]);
        }
      }, r.prototype.dispatchEvent = function() {
        var e2 = arguments[0], t2 = e2.type, n2 = arguments.length === 1 ? [e2] : Array.apply(null, arguments);
        if (this["on" + t2] && this["on" + t2].apply(this, n2), t2 in this._listeners)
          for (var r2 = this._listeners[t2], o = 0; o < r2.length; o++)
            r2[o].apply(this, n2);
      }, t.exports = r;
    }, {}], 6: [function(e, t, n) {
      var r = e("inherits"), o = e("./event");
      function i(e2) {
        o.call(this), this.initEvent("message", false, false), this.data = e2;
      }
      r(i, o), t.exports = i;
    }, { "./event": 4, "inherits": 54 }], 7: [function(e, t, n) {
      var r = e("json3"), o = e("./utils/iframe");
      function i(e2) {
        (this._transport = e2).on("message", this._transportMessage.bind(this)), e2.on("close", this._transportClose.bind(this));
      }
      i.prototype._transportClose = function(e2, t2) {
        o.postMessage("c", r.stringify([e2, t2]));
      }, i.prototype._transportMessage = function(e2) {
        o.postMessage("t", e2);
      }, i.prototype._send = function(e2) {
        this._transport.send(e2);
      }, i.prototype._close = function() {
        this._transport.close(), this._transport.removeAllListeners();
      }, t.exports = i;
    }, { "./utils/iframe": 47, "json3": 55 }], 8: [function(e, t, n) {
      var f = e("./utils/url"), r = e("./utils/event"), h2 = e("json3"), d2 = e("./facade"), o = e("./info-iframe-receiver"), p2 = e("./utils/iframe"), m2 = e("./location"), v = function() {
      };
      t.exports = function(l, e2) {
        var u, c = {};
        e2.forEach(function(e3) {
          e3.facadeTransport && (c[e3.facadeTransport.transportName] = e3.facadeTransport);
        }), c[o.transportName] = o, l.bootstrap_iframe = function() {
          var a;
          p2.currentWindowId = m2.hash.slice(1);
          r.attachEvent("message", function(t2) {
            if (t2.source === parent && (u === void 0 && (u = t2.origin), t2.origin === u)) {
              var n2;
              try {
                n2 = h2.parse(t2.data);
              } catch (e4) {
                return void v("bad json", t2.data);
              }
              if (n2.windowId === p2.currentWindowId)
                switch (n2.type) {
                  case "s":
                    var e3;
                    try {
                      e3 = h2.parse(n2.data);
                    } catch (e4) {
                      v("bad json", n2.data);
                      break;
                    }
                    var r2 = e3[0], o2 = e3[1], i = e3[2], s2 = e3[3];
                    if (r2 !== l.version)
                      throw new Error('Incompatible SockJS! Main site uses: "' + r2 + '", the iframe: "' + l.version + '".');
                    if (!f.isOriginEqual(i, m2.href) || !f.isOriginEqual(s2, m2.href))
                      throw new Error("Can't connect to different domain from within an iframe. (" + m2.href + ", " + i + ", " + s2 + ")");
                    a = new d2(new c[o2](i, s2));
                    break;
                  case "m":
                    a._send(n2.data);
                    break;
                  case "c":
                    a && a._close(), a = null;
                }
            }
          }), p2.postMessage("s");
        };
      };
    }, { "./facade": 7, "./info-iframe-receiver": 10, "./location": 13, "./utils/event": 46, "./utils/iframe": 47, "./utils/url": 52, "debug": void 0, "json3": 55 }], 9: [function(e, t, n) {
      var r = e("events").EventEmitter, o = e("inherits"), s2 = e("json3"), a = e("./utils/object");
      function i(e2, t2) {
        r.call(this);
        var o2 = this, i2 = +new Date();
        this.xo = new t2("GET", e2), this.xo.once("finish", function(e3, t3) {
          var n2, r2;
          if (e3 === 200) {
            if (r2 = +new Date() - i2, t3)
              try {
                n2 = s2.parse(t3);
              } catch (e4) {
              }
            a.isObject(n2) || (n2 = {});
          }
          o2.emit("finish", n2, r2), o2.removeAllListeners();
        });
      }
      o(i, r), i.prototype.close = function() {
        this.removeAllListeners(), this.xo.close();
      }, t.exports = i;
    }, { "./utils/object": 49, "debug": void 0, "events": 3, "inherits": 54, "json3": 55 }], 10: [function(e, t, n) {
      var r = e("inherits"), o = e("events").EventEmitter, i = e("json3"), s2 = e("./transport/sender/xhr-local"), a = e("./info-ajax");
      function l(e2) {
        var n2 = this;
        o.call(this), this.ir = new a(e2, s2), this.ir.once("finish", function(e3, t2) {
          n2.ir = null, n2.emit("message", i.stringify([e3, t2]));
        });
      }
      r(l, o), l.transportName = "iframe-info-receiver", l.prototype.close = function() {
        this.ir && (this.ir.close(), this.ir = null), this.removeAllListeners();
      }, t.exports = l;
    }, { "./info-ajax": 9, "./transport/sender/xhr-local": 37, "events": 3, "inherits": 54, "json3": 55 }], 11: [function(n, o, e) {
      (function(r) {
        var i = n("events").EventEmitter, e2 = n("inherits"), s2 = n("json3"), a = n("./utils/event"), l = n("./transport/iframe"), u = n("./info-iframe-receiver");
        function t(t2, n2) {
          var o2 = this;
          i.call(this);
          function e3() {
            var e4 = o2.ifr = new l(u.transportName, n2, t2);
            e4.once("message", function(t3) {
              if (t3) {
                var e5;
                try {
                  e5 = s2.parse(t3);
                } catch (e6) {
                  return o2.emit("finish"), void o2.close();
                }
                var n3 = e5[0], r2 = e5[1];
                o2.emit("finish", n3, r2);
              }
              o2.close();
            }), e4.once("close", function() {
              o2.emit("finish"), o2.close();
            });
          }
          r.document.body ? e3() : a.attachEvent("load", e3);
        }
        e2(t, i), t.enabled = function() {
          return l.enabled();
        }, t.prototype.close = function() {
          this.ifr && this.ifr.close(), this.removeAllListeners(), this.ifr = null;
        }, o.exports = t;
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, { "./info-iframe-receiver": 10, "./transport/iframe": 22, "./utils/event": 46, "debug": void 0, "events": 3, "inherits": 54, "json3": 55 }], 12: [function(e, t, n) {
      var r = e("events").EventEmitter, o = e("inherits"), i = e("./utils/url"), s2 = e("./transport/sender/xdr"), a = e("./transport/sender/xhr-cors"), l = e("./transport/sender/xhr-local"), u = e("./transport/sender/xhr-fake"), c = e("./info-iframe"), f = e("./info-ajax");
      function d2(e2, t2) {
        var n2 = this;
        r.call(this), setTimeout(function() {
          n2.doXhr(e2, t2);
        }, 0);
      }
      o(d2, r), d2._getReceiver = function(e2, t2, n2) {
        return n2.sameOrigin ? new f(t2, l) : a.enabled ? new f(t2, a) : s2.enabled && n2.sameScheme ? new f(t2, s2) : c.enabled() ? new c(e2, t2) : new f(t2, u);
      }, d2.prototype.doXhr = function(e2, t2) {
        var n2 = this, r2 = i.addPath(e2, "/info");
        this.xo = d2._getReceiver(e2, r2, t2), this.timeoutRef = setTimeout(function() {
          n2._cleanup(false), n2.emit("finish");
        }, d2.timeout), this.xo.once("finish", function(e3, t3) {
          n2._cleanup(true), n2.emit("finish", e3, t3);
        });
      }, d2.prototype._cleanup = function(e2) {
        clearTimeout(this.timeoutRef), this.timeoutRef = null, !e2 && this.xo && this.xo.close(), this.xo = null;
      }, d2.prototype.close = function() {
        this.removeAllListeners(), this._cleanup(false);
      }, d2.timeout = 8e3, t.exports = d2;
    }, { "./info-ajax": 9, "./info-iframe": 11, "./transport/sender/xdr": 34, "./transport/sender/xhr-cors": 35, "./transport/sender/xhr-fake": 36, "./transport/sender/xhr-local": 37, "./utils/url": 52, "debug": void 0, "events": 3, "inherits": 54 }], 13: [function(e, t, n) {
      (function(e2) {
        t.exports = e2.location || { origin: "http://localhost:80", protocol: "http:", host: "localhost", port: 80, href: "http://localhost/", hash: "" };
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, {}], 14: [function(_, E, e) {
      (function(i) {
        _("./shims");
        var r, l = _("url-parse"), e2 = _("inherits"), s2 = _("json3"), u = _("./utils/random"), t = _("./utils/escape"), c = _("./utils/url"), a = _("./utils/event"), n = _("./utils/transport"), o = _("./utils/object"), f = _("./utils/browser"), h2 = _("./utils/log"), d2 = _("./event/event"), p2 = _("./event/eventtarget"), m2 = _("./location"), v = _("./event/close"), b = _("./event/trans-message"), y2 = _("./info-receiver"), g = function() {
        };
        function w2(e3, t2, n2) {
          if (!(this instanceof w2))
            return new w2(e3, t2, n2);
          if (arguments.length < 1)
            throw new TypeError("Failed to construct 'SockJS: 1 argument required, but only 0 present");
          p2.call(this), this.readyState = w2.CONNECTING, this.extensions = "", this.protocol = "", (n2 = n2 || {}).protocols_whitelist && h2.warn("'protocols_whitelist' is DEPRECATED. Use 'transports' instead."), this._transportsWhitelist = n2.transports, this._transportOptions = n2.transportOptions || {}, this._timeout = n2.timeout || 0;
          var r2 = n2.sessionId || 8;
          if (typeof r2 == "function")
            this._generateSessionId = r2;
          else {
            if (typeof r2 != "number")
              throw new TypeError("If sessionId is used in the options, it needs to be a number or a function.");
            this._generateSessionId = function() {
              return u.string(r2);
            };
          }
          this._server = n2.server || u.numberString(1e3);
          var o2 = new l(e3);
          if (!o2.host || !o2.protocol)
            throw new SyntaxError("The URL '" + e3 + "' is invalid");
          if (o2.hash)
            throw new SyntaxError("The URL must not contain a fragment");
          if (o2.protocol !== "http:" && o2.protocol !== "https:")
            throw new SyntaxError("The URL's scheme must be either 'http:' or 'https:'. '" + o2.protocol + "' is not allowed.");
          var i2 = o2.protocol === "https:";
          if (m2.protocol === "https:" && !i2 && !c.isLoopbackAddr(o2.hostname))
            throw new Error("SecurityError: An insecure SockJS connection may not be initiated from a page loaded over HTTPS");
          t2 ? Array.isArray(t2) || (t2 = [t2]) : t2 = [];
          var s3 = t2.sort();
          s3.forEach(function(e4, t3) {
            if (!e4)
              throw new SyntaxError("The protocols entry '" + e4 + "' is invalid.");
            if (t3 < s3.length - 1 && e4 === s3[t3 + 1])
              throw new SyntaxError("The protocols entry '" + e4 + "' is duplicated.");
          });
          var a2 = c.getOrigin(m2.href);
          this._origin = a2 ? a2.toLowerCase() : null, o2.set("pathname", o2.pathname.replace(/\/+$/, "")), this.url = o2.href, g("using url", this.url), this._urlInfo = { nullOrigin: !f.hasDomain(), sameOrigin: c.isOriginEqual(this.url, m2.href), sameScheme: c.isSchemeEqual(this.url, m2.href) }, this._ir = new y2(this.url, this._urlInfo), this._ir.once("finish", this._receiveInfo.bind(this));
        }
        function x(e3) {
          return e3 === 1e3 || 3e3 <= e3 && e3 <= 4999;
        }
        e2(w2, p2), w2.prototype.close = function(e3, t2) {
          if (e3 && !x(e3))
            throw new Error("InvalidAccessError: Invalid code");
          if (t2 && 123 < t2.length)
            throw new SyntaxError("reason argument has an invalid length");
          if (this.readyState !== w2.CLOSING && this.readyState !== w2.CLOSED) {
            this._close(e3 || 1e3, t2 || "Normal closure", true);
          }
        }, w2.prototype.send = function(e3) {
          if (typeof e3 != "string" && (e3 = "" + e3), this.readyState === w2.CONNECTING)
            throw new Error("InvalidStateError: The connection has not been established yet");
          this.readyState === w2.OPEN && this._transport.send(t.quote(e3));
        }, w2.version = _("./version"), w2.CONNECTING = 0, w2.OPEN = 1, w2.CLOSING = 2, w2.CLOSED = 3, w2.prototype._receiveInfo = function(e3, t2) {
          if (this._ir = null, e3) {
            this._rto = this.countRTO(t2), this._transUrl = e3.base_url ? e3.base_url : this.url, e3 = o.extend(e3, this._urlInfo), g();
            var n2 = r.filterToEnabled(this._transportsWhitelist, e3);
            this._transports = n2.main, g(this._transports.length + " enabled transports"), this._connect();
          } else
            this._close(1002, "Cannot connect to server");
        }, w2.prototype._connect = function() {
          for (var e3 = this._transports.shift(); e3; e3 = this._transports.shift()) {
            if (g("attempt", e3.transportName), e3.needBody && (!i.document.body || i.document.readyState !== void 0 && i.document.readyState !== "complete" && i.document.readyState !== "interactive"))
              return this._transports.unshift(e3), void a.attachEvent("load", this._connect.bind(this));
            var t2 = Math.max(this._timeout, this._rto * e3.roundTrips || 5e3);
            this._transportTimeoutId = setTimeout(this._transportTimeout.bind(this), t2), g();
            var n2 = c.addPath(this._transUrl, "/" + this._server + "/" + this._generateSessionId()), r2 = this._transportOptions[e3.transportName];
            var o2 = new e3(n2, this._transUrl, r2);
            return o2.on("message", this._transportMessage.bind(this)), o2.once("close", this._transportClose.bind(this)), o2.transportName = e3.transportName, void (this._transport = o2);
          }
          this._close(2e3, "All transports failed", false);
        }, w2.prototype._transportTimeout = function() {
          this.readyState === w2.CONNECTING && (this._transport && this._transport.close(), this._transportClose(2007, "Transport timed out"));
        }, w2.prototype._transportMessage = function(e3) {
          var t2, n2 = this, r2 = e3.slice(0, 1), o2 = e3.slice(1);
          switch (r2) {
            case "o":
              return void this._open();
            case "h":
              return this.dispatchEvent(new d2("heartbeat")), void g("heartbeat", this.transport);
          }
          if (o2)
            try {
              t2 = s2.parse(o2);
            } catch (e4) {
            }
          if (t2 !== void 0)
            switch (r2) {
              case "a":
                Array.isArray(t2) && t2.forEach(function(e4) {
                  g("message", n2.transport), n2.dispatchEvent(new b(e4));
                });
                break;
              case "m":
                g("message", this.transport), this.dispatchEvent(new b(t2));
                break;
              case "c":
                Array.isArray(t2) && t2.length === 2 && this._close(t2[0], t2[1], true);
            }
        }, w2.prototype._transportClose = function(e3, t2) {
          g("_transportClose", this.transport), this._transport && (this._transport.removeAllListeners(), this._transport = null, this.transport = null), x(e3) || e3 === 2e3 || this.readyState !== w2.CONNECTING ? this._close(e3, t2) : this._connect();
        }, w2.prototype._open = function() {
          g("_open", this._transport && this._transport.transportName, this.readyState), this.readyState === w2.CONNECTING ? (this._transportTimeoutId && (clearTimeout(this._transportTimeoutId), this._transportTimeoutId = null), this.readyState = w2.OPEN, this.transport = this._transport.transportName, this.dispatchEvent(new d2("open")), g("connected", this.transport)) : this._close(1006, "Server lost session");
        }, w2.prototype._close = function(t2, n2, r2) {
          g("_close", this.transport, t2, n2, r2, this.readyState);
          var o2 = false;
          if (this._ir && (o2 = true, this._ir.close(), this._ir = null), this._transport && (this._transport.close(), this._transport = null, this.transport = null), this.readyState === w2.CLOSED)
            throw new Error("InvalidStateError: SockJS has already been closed");
          this.readyState = w2.CLOSING, setTimeout(function() {
            this.readyState = w2.CLOSED, o2 && this.dispatchEvent(new d2("error"));
            var e3 = new v("close");
            e3.wasClean = r2 || false, e3.code = t2 || 1e3, e3.reason = n2, this.dispatchEvent(e3), this.onmessage = this.onclose = this.onerror = null, g();
          }.bind(this), 0);
        }, w2.prototype.countRTO = function(e3) {
          return 100 < e3 ? 4 * e3 : 300 + e3;
        }, E.exports = function(e3) {
          return r = n(e3), _("./iframe-bootstrap")(w2, e3), w2;
        };
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, { "./event/close": 2, "./event/event": 4, "./event/eventtarget": 5, "./event/trans-message": 6, "./iframe-bootstrap": 8, "./info-receiver": 12, "./location": 13, "./shims": 15, "./utils/browser": 44, "./utils/escape": 45, "./utils/event": 46, "./utils/log": 48, "./utils/object": 49, "./utils/random": 50, "./utils/transport": 51, "./utils/url": 52, "./version": 53, "debug": void 0, "inherits": 54, "json3": 55, "url-parse": 58 }], 15: [function(e, t, n) {
      function a(e2) {
        return i.toString.call(e2) === "[object Function]";
      }
      function l(e2) {
        return f.call(e2) === "[object String]";
      }
      var o, c = Array.prototype, i = Object.prototype, r = Function.prototype, s2 = String.prototype, u = c.slice, f = i.toString, h2 = Object.defineProperty && function() {
        try {
          return Object.defineProperty({}, "x", {}), true;
        } catch (e2) {
          return false;
        }
      }();
      o = h2 ? function(e2, t2, n2, r2) {
        !r2 && t2 in e2 || Object.defineProperty(e2, t2, { configurable: true, enumerable: false, writable: true, value: n2 });
      } : function(e2, t2, n2, r2) {
        !r2 && t2 in e2 || (e2[t2] = n2);
      };
      function d2(e2, t2, n2) {
        for (var r2 in t2)
          i.hasOwnProperty.call(t2, r2) && o(e2, r2, t2[r2], n2);
      }
      function p2(e2) {
        if (e2 == null)
          throw new TypeError("can't convert " + e2 + " to object");
        return Object(e2);
      }
      function m2() {
      }
      d2(r, { bind: function(t2) {
        var n2 = this;
        if (!a(n2))
          throw new TypeError("Function.prototype.bind called on incompatible " + n2);
        for (var r2 = u.call(arguments, 1), e2 = Math.max(0, n2.length - r2.length), o2 = [], i2 = 0; i2 < e2; i2++)
          o2.push("$" + i2);
        var s3 = Function("binder", "return function (" + o2.join(",") + "){ return binder.apply(this, arguments); }")(function() {
          if (this instanceof s3) {
            var e3 = n2.apply(this, r2.concat(u.call(arguments)));
            return Object(e3) === e3 ? e3 : this;
          }
          return n2.apply(t2, r2.concat(u.call(arguments)));
        });
        return n2.prototype && (m2.prototype = n2.prototype, s3.prototype = new m2(), m2.prototype = null), s3;
      } }), d2(Array, { isArray: function(e2) {
        return f.call(e2) === "[object Array]";
      } });
      var v, b, y2, g = Object("a"), w2 = g[0] !== "a" || !(0 in g);
      d2(c, { forEach: function(e2, t2) {
        var n2 = p2(this), r2 = w2 && l(this) ? this.split("") : n2, o2 = t2, i2 = -1, s3 = r2.length >>> 0;
        if (!a(e2))
          throw new TypeError();
        for (; ++i2 < s3; )
          i2 in r2 && e2.call(o2, r2[i2], i2, n2);
      } }, (v = c.forEach, y2 = b = true, v && (v.call("foo", function(e2, t2, n2) {
        typeof n2 != "object" && (b = false);
      }), v.call([1], function() {
        y2 = typeof this == "string";
      }, "x")), !(v && b && y2)));
      var x = Array.prototype.indexOf && [0, 1].indexOf(1, 2) !== -1;
      d2(c, { indexOf: function(e2, t2) {
        var n2 = w2 && l(this) ? this.split("") : p2(this), r2 = n2.length >>> 0;
        if (!r2)
          return -1;
        var o2 = 0;
        for (1 < arguments.length && (o2 = function(e3) {
          var t3 = +e3;
          return t3 != t3 ? t3 = 0 : t3 !== 0 && t3 !== 1 / 0 && t3 !== -1 / 0 && (t3 = (0 < t3 || -1) * Math.floor(Math.abs(t3))), t3;
        }(t2)), o2 = 0 <= o2 ? o2 : Math.max(0, r2 + o2); o2 < r2; o2++)
          if (o2 in n2 && n2[o2] === e2)
            return o2;
        return -1;
      } }, x);
      var _, E = s2.split;
      "ab".split(/(?:ab)*/).length !== 2 || ".".split(/(.?)(.?)/).length !== 4 || "tesst".split(/(s)*/)[1] === "t" || "test".split(/(?:)/, -1).length !== 4 || "".split(/.?/).length || 1 < ".".split(/()()/).length ? (_ = /()??/.exec("")[1] === void 0, s2.split = function(e2, t2) {
        var n2 = this;
        if (e2 === void 0 && t2 === 0)
          return [];
        if (f.call(e2) !== "[object RegExp]")
          return E.call(this, e2, t2);
        var r2, o2, i2, s3, a2 = [], l2 = (e2.ignoreCase ? "i" : "") + (e2.multiline ? "m" : "") + (e2.extended ? "x" : "") + (e2.sticky ? "y" : ""), u2 = 0;
        for (e2 = new RegExp(e2.source, l2 + "g"), n2 += "", _ || (r2 = new RegExp("^" + e2.source + "$(?!\\s)", l2)), t2 = t2 === void 0 ? -1 >>> 0 : function(e3) {
          return e3 >>> 0;
        }(t2); (o2 = e2.exec(n2)) && !(u2 < (i2 = o2.index + o2[0].length) && (a2.push(n2.slice(u2, o2.index)), !_ && 1 < o2.length && o2[0].replace(r2, function() {
          for (var e3 = 1; e3 < arguments.length - 2; e3++)
            arguments[e3] === void 0 && (o2[e3] = void 0);
        }), 1 < o2.length && o2.index < n2.length && c.push.apply(a2, o2.slice(1)), s3 = o2[0].length, u2 = i2, a2.length >= t2)); )
          e2.lastIndex === o2.index && e2.lastIndex++;
        return u2 === n2.length ? !s3 && e2.test("") || a2.push("") : a2.push(n2.slice(u2)), a2.length > t2 ? a2.slice(0, t2) : a2;
      }) : "0".split(void 0, 0).length && (s2.split = function(e2, t2) {
        return e2 === void 0 && t2 === 0 ? [] : E.call(this, e2, t2);
      });
      var j = s2.substr, S = "".substr && "0b".substr(-1) !== "b";
      d2(s2, { substr: function(e2, t2) {
        return j.call(this, e2 < 0 && (e2 = this.length + e2) < 0 ? 0 : e2, t2);
      } }, S);
    }, {}], 16: [function(e, t, n) {
      t.exports = [e("./transport/websocket"), e("./transport/xhr-streaming"), e("./transport/xdr-streaming"), e("./transport/eventsource"), e("./transport/lib/iframe-wrap")(e("./transport/eventsource")), e("./transport/htmlfile"), e("./transport/lib/iframe-wrap")(e("./transport/htmlfile")), e("./transport/xhr-polling"), e("./transport/xdr-polling"), e("./transport/lib/iframe-wrap")(e("./transport/xhr-polling")), e("./transport/jsonp-polling")];
    }, { "./transport/eventsource": 20, "./transport/htmlfile": 21, "./transport/jsonp-polling": 23, "./transport/lib/iframe-wrap": 26, "./transport/websocket": 38, "./transport/xdr-polling": 39, "./transport/xdr-streaming": 40, "./transport/xhr-polling": 41, "./transport/xhr-streaming": 42 }], 17: [function(o, f, e) {
      (function(e2) {
        var i = o("events").EventEmitter, t = o("inherits"), s2 = o("../../utils/event"), a = o("../../utils/url"), l = e2.XMLHttpRequest, u = function() {
        };
        function c(e3, t2, n2, r2) {
          var o2 = this;
          i.call(this), setTimeout(function() {
            o2._start(e3, t2, n2, r2);
          }, 0);
        }
        t(c, i), c.prototype._start = function(e3, t2, n2, r2) {
          var o2 = this;
          try {
            this.xhr = new l();
          } catch (e4) {
          }
          if (!this.xhr)
            return this.emit("finish", 0, "no xhr support"), void this._cleanup();
          t2 = a.addQuery(t2, "t=" + +new Date()), this.unloadRef = s2.unloadAdd(function() {
            o2._cleanup(true);
          });
          try {
            this.xhr.open(e3, t2, true), this.timeout && "timeout" in this.xhr && (this.xhr.timeout = this.timeout, this.xhr.ontimeout = function() {
              u("xhr timeout"), o2.emit("finish", 0, ""), o2._cleanup(false);
            });
          } catch (e4) {
            return this.emit("finish", 0, ""), void this._cleanup(false);
          }
          if (r2 && r2.noCredentials || !c.supportsCORS || (this.xhr.withCredentials = true), r2 && r2.headers)
            for (var i2 in r2.headers)
              this.xhr.setRequestHeader(i2, r2.headers[i2]);
          this.xhr.onreadystatechange = function() {
            if (o2.xhr) {
              var e4, t3, n3 = o2.xhr;
              switch (u("readyState", n3.readyState), n3.readyState) {
                case 3:
                  try {
                    t3 = n3.status, e4 = n3.responseText;
                  } catch (e5) {
                  }
                  t3 === 1223 && (t3 = 204), t3 === 200 && e4 && 0 < e4.length && o2.emit("chunk", t3, e4);
                  break;
                case 4:
                  t3 = n3.status, t3 === 1223 && (t3 = 204), t3 !== 12005 && t3 !== 12029 || (t3 = 0), u("finish", t3, n3.responseText), o2.emit("finish", t3, n3.responseText), o2._cleanup(false);
              }
            }
          };
          try {
            o2.xhr.send(n2);
          } catch (e4) {
            o2.emit("finish", 0, ""), o2._cleanup(false);
          }
        }, c.prototype._cleanup = function(e3) {
          if (this.xhr) {
            if (this.removeAllListeners(), s2.unloadDel(this.unloadRef), this.xhr.onreadystatechange = function() {
            }, this.xhr.ontimeout && (this.xhr.ontimeout = null), e3)
              try {
                this.xhr.abort();
              } catch (e4) {
              }
            this.unloadRef = this.xhr = null;
          }
        }, c.prototype.close = function() {
          this._cleanup(true);
        }, c.enabled = !!l;
        var n = ["Active"].concat("Object").join("X");
        !c.enabled && n in e2 && (c.enabled = !!new (l = function() {
          try {
            return new e2[n]("Microsoft.XMLHTTP");
          } catch (e3) {
            return null;
          }
        })());
        var r = false;
        try {
          r = "withCredentials" in new l();
        } catch (e3) {
        }
        c.supportsCORS = r, f.exports = c;
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, { "../../utils/event": 46, "../../utils/url": 52, "debug": void 0, "events": 3, "inherits": 54 }], 18: [function(e, t, n) {
      (function(e2) {
        t.exports = e2.EventSource;
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, {}], 19: [function(e, n, t) {
      (function(e2) {
        var t2 = e2.WebSocket || e2.MozWebSocket;
        n.exports = t2 ? function(e3) {
          return new t2(e3);
        } : void 0;
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, {}], 20: [function(e, t, n) {
      var r = e("inherits"), o = e("./lib/ajax-based"), i = e("./receiver/eventsource"), s2 = e("./sender/xhr-cors"), a = e("eventsource");
      function l(e2) {
        if (!l.enabled())
          throw new Error("Transport created when disabled");
        o.call(this, e2, "/eventsource", i, s2);
      }
      r(l, o), l.enabled = function() {
        return !!a;
      }, l.transportName = "eventsource", l.roundTrips = 2, t.exports = l;
    }, { "./lib/ajax-based": 24, "./receiver/eventsource": 29, "./sender/xhr-cors": 35, "eventsource": 18, "inherits": 54 }], 21: [function(e, t, n) {
      var r = e("inherits"), o = e("./receiver/htmlfile"), i = e("./sender/xhr-local"), s2 = e("./lib/ajax-based");
      function a(e2) {
        if (!o.enabled)
          throw new Error("Transport created when disabled");
        s2.call(this, e2, "/htmlfile", o, i);
      }
      r(a, s2), a.enabled = function(e2) {
        return o.enabled && e2.sameOrigin;
      }, a.transportName = "htmlfile", a.roundTrips = 2, t.exports = a;
    }, { "./lib/ajax-based": 24, "./receiver/htmlfile": 30, "./sender/xhr-local": 37, "inherits": 54 }], 22: [function(e, t, n) {
      var r = e("inherits"), o = e("json3"), i = e("events").EventEmitter, s2 = e("../version"), a = e("../utils/url"), l = e("../utils/iframe"), u = e("../utils/event"), c = e("../utils/random"), f = function() {
      };
      function h2(e2, t2, n2) {
        if (!h2.enabled())
          throw new Error("Transport created when disabled");
        i.call(this);
        var r2 = this;
        this.origin = a.getOrigin(n2), this.baseUrl = n2, this.transUrl = t2, this.transport = e2, this.windowId = c.string(8);
        var o2 = a.addPath(n2, "/iframe.html") + "#" + this.windowId;
        this.iframeObj = l.createIframe(o2, function(e3) {
          r2.emit("close", 1006, "Unable to load an iframe (" + e3 + ")"), r2.close();
        }), this.onmessageCallback = this._message.bind(this), u.attachEvent("message", this.onmessageCallback);
      }
      r(h2, i), h2.prototype.close = function() {
        if (this.removeAllListeners(), this.iframeObj) {
          u.detachEvent("message", this.onmessageCallback);
          try {
            this.postMessage("c");
          } catch (e2) {
          }
          this.iframeObj.cleanup(), this.iframeObj = null, this.onmessageCallback = this.iframeObj = null;
        }
      }, h2.prototype._message = function(t2) {
        if (f("message", t2.data), a.isOriginEqual(t2.origin, this.origin)) {
          var n2;
          try {
            n2 = o.parse(t2.data);
          } catch (e3) {
            return void f("bad json", t2.data);
          }
          if (n2.windowId === this.windowId)
            switch (n2.type) {
              case "s":
                this.iframeObj.loaded(), this.postMessage("s", o.stringify([s2, this.transport, this.transUrl, this.baseUrl]));
                break;
              case "t":
                this.emit("message", n2.data);
                break;
              case "c":
                var e2;
                try {
                  e2 = o.parse(n2.data);
                } catch (e3) {
                  return void f("bad json", n2.data);
                }
                this.emit("close", e2[0], e2[1]), this.close();
            }
          else
            f("mismatched window id", n2.windowId, this.windowId);
        } else
          f("not same origin", t2.origin, this.origin);
      }, h2.prototype.postMessage = function(e2, t2) {
        this.iframeObj.post(o.stringify({ windowId: this.windowId, type: e2, data: t2 || "" }), this.origin);
      }, h2.prototype.send = function(e2) {
        this.postMessage("m", e2);
      }, h2.enabled = function() {
        return l.iframeEnabled;
      }, h2.transportName = "iframe", h2.roundTrips = 2, t.exports = h2;
    }, { "../utils/event": 46, "../utils/iframe": 47, "../utils/random": 50, "../utils/url": 52, "../version": 53, "debug": void 0, "events": 3, "inherits": 54, "json3": 55 }], 23: [function(s2, a, e) {
      (function(e2) {
        var t = s2("inherits"), n = s2("./lib/sender-receiver"), r = s2("./receiver/jsonp"), o = s2("./sender/jsonp");
        function i(e3) {
          if (!i.enabled())
            throw new Error("Transport created when disabled");
          n.call(this, e3, "/jsonp", o, r);
        }
        t(i, n), i.enabled = function() {
          return !!e2.document;
        }, i.transportName = "jsonp-polling", i.roundTrips = 1, i.needBody = true, a.exports = i;
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, { "./lib/sender-receiver": 28, "./receiver/jsonp": 31, "./sender/jsonp": 33, "inherits": 54 }], 24: [function(e, t, n) {
      var r = e("inherits"), a = e("../../utils/url"), o = e("./sender-receiver");
      function i(e2, t2, n2, r2) {
        o.call(this, e2, t2, function(s2) {
          return function(e3, t3, n3) {
            var r3 = {};
            typeof t3 == "string" && (r3.headers = { "Content-type": "text/plain" });
            var o2 = a.addPath(e3, "/xhr_send"), i2 = new s2("POST", o2, t3, r3);
            return i2.once("finish", function(e4) {
              if (i2 = null, e4 !== 200 && e4 !== 204)
                return n3(new Error("http status " + e4));
              n3();
            }), function() {
              i2.close(), i2 = null;
              var e4 = new Error("Aborted");
              e4.code = 1e3, n3(e4);
            };
          };
        }(r2), n2, r2);
      }
      r(i, o), t.exports = i;
    }, { "../../utils/url": 52, "./sender-receiver": 28, "debug": void 0, "inherits": 54 }], 25: [function(e, t, n) {
      var r = e("inherits"), o = e("events").EventEmitter, i = function() {
      };
      function s2(e2, t2) {
        o.call(this), this.sendBuffer = [], this.sender = t2, this.url = e2;
      }
      r(s2, o), s2.prototype.send = function(e2) {
        this.sendBuffer.push(e2), this.sendStop || this.sendSchedule();
      }, s2.prototype.sendScheduleWait = function() {
        var e2, t2 = this;
        this.sendStop = function() {
          t2.sendStop = null, clearTimeout(e2);
        }, e2 = setTimeout(function() {
          t2.sendStop = null, t2.sendSchedule();
        }, 25);
      }, s2.prototype.sendSchedule = function() {
        i("sendSchedule", this.sendBuffer.length);
        var t2 = this;
        if (0 < this.sendBuffer.length) {
          var e2 = "[" + this.sendBuffer.join(",") + "]";
          this.sendStop = this.sender(this.url, e2, function(e3) {
            t2.sendStop = null, e3 ? (t2.emit("close", e3.code || 1006, "Sending error: " + e3), t2.close()) : t2.sendScheduleWait();
          }), this.sendBuffer = [];
        }
      }, s2.prototype._cleanup = function() {
        this.removeAllListeners();
      }, s2.prototype.close = function() {
        this._cleanup(), this.sendStop && (this.sendStop(), this.sendStop = null);
      }, t.exports = s2;
    }, { "debug": void 0, "events": 3, "inherits": 54 }], 26: [function(e, n, t) {
      (function(o) {
        var t2 = e("inherits"), i = e("../iframe"), s2 = e("../../utils/object");
        n.exports = function(r) {
          function e2(e3, t3) {
            i.call(this, r.transportName, e3, t3);
          }
          return t2(e2, i), e2.enabled = function(e3, t3) {
            if (!o.document)
              return false;
            var n2 = s2.extend({}, t3);
            return n2.sameOrigin = true, r.enabled(n2) && i.enabled();
          }, e2.transportName = "iframe-" + r.transportName, e2.needBody = true, e2.roundTrips = i.roundTrips + r.roundTrips - 1, e2.facadeTransport = r, e2;
        };
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, { "../../utils/object": 49, "../iframe": 22, "inherits": 54 }], 27: [function(e, t, n) {
      var r = e("inherits"), o = e("events").EventEmitter, i = function() {
      };
      function s2(e2, t2, n2) {
        o.call(this), this.Receiver = e2, this.receiveUrl = t2, this.AjaxObject = n2, this._scheduleReceiver();
      }
      r(s2, o), s2.prototype._scheduleReceiver = function() {
        var n2 = this, r2 = this.poll = new this.Receiver(this.receiveUrl, this.AjaxObject);
        r2.on("message", function(e2) {
          n2.emit("message", e2);
        }), r2.once("close", function(e2, t2) {
          i("close", e2, t2, n2.pollIsClosing), n2.poll = r2 = null, n2.pollIsClosing || (t2 === "network" ? n2._scheduleReceiver() : (n2.emit("close", e2 || 1006, t2), n2.removeAllListeners()));
        });
      }, s2.prototype.abort = function() {
        this.removeAllListeners(), this.pollIsClosing = true, this.poll && this.poll.abort();
      }, t.exports = s2;
    }, { "debug": void 0, "events": 3, "inherits": 54 }], 28: [function(e, t, n) {
      var r = e("inherits"), a = e("../../utils/url"), l = e("./buffered-sender"), u = e("./polling");
      function o(e2, t2, n2, r2, o2) {
        var i = a.addPath(e2, t2);
        var s2 = this;
        l.call(this, e2, n2), this.poll = new u(r2, i, o2), this.poll.on("message", function(e3) {
          s2.emit("message", e3);
        }), this.poll.once("close", function(e3, t3) {
          s2.poll = null, s2.emit("close", e3, t3), s2.close();
        });
      }
      r(o, l), o.prototype.close = function() {
        l.prototype.close.call(this), this.removeAllListeners(), this.poll && (this.poll.abort(), this.poll = null);
      }, t.exports = o;
    }, { "../../utils/url": 52, "./buffered-sender": 25, "./polling": 27, "debug": void 0, "inherits": 54 }], 29: [function(e, t, n) {
      var r = e("inherits"), o = e("events").EventEmitter, i = e("eventsource"), s2 = function() {
      };
      function a(e2) {
        o.call(this);
        var n2 = this, r2 = this.es = new i(e2);
        r2.onmessage = function(e3) {
          s2("message", e3.data), n2.emit("message", decodeURI(e3.data));
        }, r2.onerror = function(e3) {
          var t2 = r2.readyState !== 2 ? "network" : "permanent";
          n2._cleanup(), n2._close(t2);
        };
      }
      r(a, o), a.prototype.abort = function() {
        this._cleanup(), this._close("user");
      }, a.prototype._cleanup = function() {
        var e2 = this.es;
        e2 && (e2.onmessage = e2.onerror = null, e2.close(), this.es = null);
      }, a.prototype._close = function(e2) {
        var t2 = this;
        setTimeout(function() {
          t2.emit("close", null, e2), t2.removeAllListeners();
        }, 200);
      }, t.exports = a;
    }, { "debug": void 0, "events": 3, "eventsource": 18, "inherits": 54 }], 30: [function(n, c, e) {
      (function(r) {
        var e2 = n("inherits"), o = n("../../utils/iframe"), i = n("../../utils/url"), s2 = n("events").EventEmitter, a = n("../../utils/random"), l = function() {
        };
        function u(e3) {
          s2.call(this);
          var t2 = this;
          o.polluteGlobalNamespace(), this.id = "a" + a.string(6), e3 = i.addQuery(e3, "c=" + decodeURIComponent(o.WPrefix + "." + this.id)), l();
          var n2 = u.htmlfileEnabled ? o.createHtmlfile : o.createIframe;
          r[o.WPrefix][this.id] = { start: function() {
            t2.iframeObj.loaded();
          }, message: function(e4) {
            t2.emit("message", e4);
          }, stop: function() {
            t2._cleanup(), t2._close("network");
          } }, this.iframeObj = n2(e3, function() {
            t2._cleanup(), t2._close("permanent");
          });
        }
        e2(u, s2), u.prototype.abort = function() {
          this._cleanup(), this._close("user");
        }, u.prototype._cleanup = function() {
          this.iframeObj && (this.iframeObj.cleanup(), this.iframeObj = null), delete r[o.WPrefix][this.id];
        }, u.prototype._close = function(e3) {
          this.emit("close", null, e3), this.removeAllListeners();
        }, u.htmlfileEnabled = false;
        var t = ["Active"].concat("Object").join("X");
        if (t in r)
          try {
            u.htmlfileEnabled = !!new r[t]("htmlfile");
          } catch (e3) {
          }
        u.enabled = u.htmlfileEnabled || o.iframeEnabled, c.exports = u;
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, { "../../utils/iframe": 47, "../../utils/random": 50, "../../utils/url": 52, "debug": void 0, "events": 3, "inherits": 54 }], 31: [function(t, n, e) {
      (function(i) {
        var r = t("../../utils/iframe"), s2 = t("../../utils/random"), a = t("../../utils/browser"), o = t("../../utils/url"), e2 = t("inherits"), l = t("events").EventEmitter, u = function() {
        };
        function c(e3) {
          var t2 = this;
          l.call(this), r.polluteGlobalNamespace(), this.id = "a" + s2.string(6);
          var n2 = o.addQuery(e3, "c=" + encodeURIComponent(r.WPrefix + "." + this.id));
          i[r.WPrefix][this.id] = this._callback.bind(this), this._createScript(n2), this.timeoutId = setTimeout(function() {
            t2._abort(new Error("JSONP script loaded abnormally (timeout)"));
          }, c.timeout);
        }
        e2(c, l), c.prototype.abort = function() {
          if (i[r.WPrefix][this.id]) {
            var e3 = new Error("JSONP user aborted read");
            e3.code = 1e3, this._abort(e3);
          }
        }, c.timeout = 35e3, c.scriptErrorTimeout = 1e3, c.prototype._callback = function(e3) {
          this._cleanup(), this.aborting || (e3 && this.emit("message", e3), this.emit("close", null, "network"), this.removeAllListeners());
        }, c.prototype._abort = function(e3) {
          this._cleanup(), this.aborting = true, this.emit("close", e3.code, e3.message), this.removeAllListeners();
        }, c.prototype._cleanup = function() {
          if (clearTimeout(this.timeoutId), this.script2 && (this.script2.parentNode.removeChild(this.script2), this.script2 = null), this.script) {
            var e3 = this.script;
            e3.parentNode.removeChild(e3), e3.onreadystatechange = e3.onerror = e3.onload = e3.onclick = null, this.script = null;
          }
          delete i[r.WPrefix][this.id];
        }, c.prototype._scriptError = function() {
          var e3 = this;
          this.errorTimer || (this.errorTimer = setTimeout(function() {
            e3.loadedOkay || e3._abort(new Error("JSONP script loaded abnormally (onerror)"));
          }, c.scriptErrorTimeout));
        }, c.prototype._createScript = function(e3) {
          var t2, n2 = this, r2 = this.script = i.document.createElement("script");
          if (r2.id = "a" + s2.string(8), r2.src = e3, r2.type = "text/javascript", r2.charset = "UTF-8", r2.onerror = this._scriptError.bind(this), r2.onload = function() {
            n2._abort(new Error("JSONP script loaded abnormally (onload)"));
          }, r2.onreadystatechange = function() {
            if (u("onreadystatechange", r2.readyState), /loaded|closed/.test(r2.readyState)) {
              if (r2 && r2.htmlFor && r2.onclick) {
                n2.loadedOkay = true;
                try {
                  r2.onclick();
                } catch (e4) {
                }
              }
              r2 && n2._abort(new Error("JSONP script loaded abnormally (onreadystatechange)"));
            }
          }, r2.async === void 0 && i.document.attachEvent)
            if (a.isOpera())
              (t2 = this.script2 = i.document.createElement("script")).text = "try{var a = document.getElementById('" + r2.id + "'); if(a)a.onerror();}catch(x){};", r2.async = t2.async = false;
            else {
              try {
                r2.htmlFor = r2.id, r2.event = "onclick";
              } catch (e4) {
              }
              r2.async = true;
            }
          r2.async !== void 0 && (r2.async = true);
          var o2 = i.document.getElementsByTagName("head")[0];
          o2.insertBefore(r2, o2.firstChild), t2 && o2.insertBefore(t2, o2.firstChild);
        }, n.exports = c;
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, { "../../utils/browser": 44, "../../utils/iframe": 47, "../../utils/random": 50, "../../utils/url": 52, "debug": void 0, "events": 3, "inherits": 54 }], 32: [function(e, t, n) {
      var r = e("inherits"), o = e("events").EventEmitter;
      function s2(e2, t2) {
        o.call(this);
        var r2 = this;
        this.bufferPosition = 0, this.xo = new t2("POST", e2, null), this.xo.on("chunk", this._chunkHandler.bind(this)), this.xo.once("finish", function(e3, t3) {
          r2._chunkHandler(e3, t3), r2.xo = null;
          var n2 = e3 === 200 ? "network" : "permanent";
          r2.emit("close", null, n2), r2._cleanup();
        });
      }
      r(s2, o), s2.prototype._chunkHandler = function(e2, t2) {
        if (e2 === 200 && t2)
          for (var n2 = -1; ; this.bufferPosition += n2 + 1) {
            var r2 = t2.slice(this.bufferPosition);
            if ((n2 = r2.indexOf("\n")) === -1)
              break;
            var o2 = r2.slice(0, n2);
            o2 && this.emit("message", o2);
          }
      }, s2.prototype._cleanup = function() {
        this.removeAllListeners();
      }, s2.prototype.abort = function() {
        this.xo && (this.xo.close(), this.emit("close", null, "user"), this.xo = null), this._cleanup();
      }, t.exports = s2;
    }, { "debug": void 0, "events": 3, "inherits": 54 }], 33: [function(e, t, n) {
      (function(s2) {
        var a, l, u = e("../../utils/random"), c = e("../../utils/url"), f = function() {
        };
        t.exports = function(e2, t2, n2) {
          a || ((a = s2.document.createElement("form")).style.display = "none", a.style.position = "absolute", a.method = "POST", a.enctype = "application/x-www-form-urlencoded", a.acceptCharset = "UTF-8", (l = s2.document.createElement("textarea")).name = "d", a.appendChild(l), s2.document.body.appendChild(a));
          var r = "a" + u.string(8);
          a.target = r, a.action = c.addQuery(c.addPath(e2, "/jsonp_send"), "i=" + r);
          var o = function(t3) {
            try {
              return s2.document.createElement('<iframe name="' + t3 + '">');
            } catch (e3) {
              var n3 = s2.document.createElement("iframe");
              return n3.name = t3, n3;
            }
          }(r);
          o.id = r, o.style.display = "none", a.appendChild(o);
          try {
            l.value = t2;
          } catch (e3) {
          }
          a.submit();
          function i(e3) {
            o.onerror && (o.onreadystatechange = o.onerror = o.onload = null, setTimeout(function() {
              o.parentNode.removeChild(o), o = null;
            }, 500), l.value = "", n2(e3));
          }
          return o.onerror = function() {
            i();
          }, o.onload = function() {
            i();
          }, o.onreadystatechange = function(e3) {
            f("onreadystatechange", r, o.readyState), o.readyState === "complete" && i();
          }, function() {
            i(new Error("Aborted"));
          };
        };
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, { "../../utils/random": 50, "../../utils/url": 52, "debug": void 0 }], 34: [function(r, u, e) {
      (function(i) {
        var o = r("events").EventEmitter, e2 = r("inherits"), s2 = r("../../utils/event"), t = r("../../utils/browser"), a = r("../../utils/url");
        function n(e3, t2, n2) {
          var r2 = this;
          o.call(this), setTimeout(function() {
            r2._start(e3, t2, n2);
          }, 0);
        }
        e2(n, o), n.prototype._start = function(e3, t2, n2) {
          var r2 = this, o2 = new i.XDomainRequest();
          t2 = a.addQuery(t2, "t=" + +new Date()), o2.onerror = function() {
            r2._error();
          }, o2.ontimeout = function() {
            r2._error();
          }, o2.onprogress = function() {
            r2.emit("chunk", 200, o2.responseText);
          }, o2.onload = function() {
            r2.emit("finish", 200, o2.responseText), r2._cleanup(false);
          }, this.xdr = o2, this.unloadRef = s2.unloadAdd(function() {
            r2._cleanup(true);
          });
          try {
            this.xdr.open(e3, t2), this.timeout && (this.xdr.timeout = this.timeout), this.xdr.send(n2);
          } catch (e4) {
            this._error();
          }
        }, n.prototype._error = function() {
          this.emit("finish", 0, ""), this._cleanup(false);
        }, n.prototype._cleanup = function(e3) {
          if (this.xdr) {
            if (this.removeAllListeners(), s2.unloadDel(this.unloadRef), this.xdr.ontimeout = this.xdr.onerror = this.xdr.onprogress = this.xdr.onload = null, e3)
              try {
                this.xdr.abort();
              } catch (e4) {
              }
            this.unloadRef = this.xdr = null;
          }
        }, n.prototype.close = function() {
          this._cleanup(true);
        }, n.enabled = !(!i.XDomainRequest || !t.hasDomain()), u.exports = n;
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, { "../../utils/browser": 44, "../../utils/event": 46, "../../utils/url": 52, "debug": void 0, "events": 3, "inherits": 54 }], 35: [function(e, t, n) {
      var r = e("inherits"), o = e("../driver/xhr");
      function i(e2, t2, n2, r2) {
        o.call(this, e2, t2, n2, r2);
      }
      r(i, o), i.enabled = o.enabled && o.supportsCORS, t.exports = i;
    }, { "../driver/xhr": 17, "inherits": 54 }], 36: [function(e, t, n) {
      var r = e("events").EventEmitter;
      function o() {
        var e2 = this;
        r.call(this), this.to = setTimeout(function() {
          e2.emit("finish", 200, "{}");
        }, o.timeout);
      }
      e("inherits")(o, r), o.prototype.close = function() {
        clearTimeout(this.to);
      }, o.timeout = 2e3, t.exports = o;
    }, { "events": 3, "inherits": 54 }], 37: [function(e, t, n) {
      var r = e("inherits"), o = e("../driver/xhr");
      function i(e2, t2, n2) {
        o.call(this, e2, t2, n2, { noCredentials: true });
      }
      r(i, o), i.enabled = o.enabled, t.exports = i;
    }, { "../driver/xhr": 17, "inherits": 54 }], 38: [function(e, t, n) {
      var i = e("../utils/event"), s2 = e("../utils/url"), r = e("inherits"), a = e("events").EventEmitter, l = e("./driver/websocket"), u = function() {
      };
      function c(e2, t2, n2) {
        if (!c.enabled())
          throw new Error("Transport created when disabled");
        a.call(this), u();
        var r2 = this, o = s2.addPath(e2, "/websocket");
        o = o.slice(0, 5) === "https" ? "wss" + o.slice(5) : "ws" + o.slice(4), this.url = o, this.ws = new l(this.url, [], n2), this.ws.onmessage = function(e3) {
          u("message event", e3.data), r2.emit("message", e3.data);
        }, this.unloadRef = i.unloadAdd(function() {
          r2.ws.close();
        }), this.ws.onclose = function(e3) {
          u("close event", e3.code, e3.reason), r2.emit("close", e3.code, e3.reason), r2._cleanup();
        }, this.ws.onerror = function(e3) {
          r2.emit("close", 1006, "WebSocket connection broken"), r2._cleanup();
        };
      }
      r(c, a), c.prototype.send = function(e2) {
        var t2 = "[" + e2 + "]";
        this.ws.send(t2);
      }, c.prototype.close = function() {
        var e2 = this.ws;
        this._cleanup(), e2 && e2.close();
      }, c.prototype._cleanup = function() {
        var e2 = this.ws;
        e2 && (e2.onmessage = e2.onclose = e2.onerror = null), i.unloadDel(this.unloadRef), this.unloadRef = this.ws = null, this.removeAllListeners();
      }, c.enabled = function() {
        return !!l;
      }, c.transportName = "websocket", c.roundTrips = 2, t.exports = c;
    }, { "../utils/event": 46, "../utils/url": 52, "./driver/websocket": 19, "debug": void 0, "events": 3, "inherits": 54 }], 39: [function(e, t, n) {
      var r = e("inherits"), o = e("./lib/ajax-based"), i = e("./xdr-streaming"), s2 = e("./receiver/xhr"), a = e("./sender/xdr");
      function l(e2) {
        if (!a.enabled)
          throw new Error("Transport created when disabled");
        o.call(this, e2, "/xhr", s2, a);
      }
      r(l, o), l.enabled = i.enabled, l.transportName = "xdr-polling", l.roundTrips = 2, t.exports = l;
    }, { "./lib/ajax-based": 24, "./receiver/xhr": 32, "./sender/xdr": 34, "./xdr-streaming": 40, "inherits": 54 }], 40: [function(e, t, n) {
      var r = e("inherits"), o = e("./lib/ajax-based"), i = e("./receiver/xhr"), s2 = e("./sender/xdr");
      function a(e2) {
        if (!s2.enabled)
          throw new Error("Transport created when disabled");
        o.call(this, e2, "/xhr_streaming", i, s2);
      }
      r(a, o), a.enabled = function(e2) {
        return !e2.cookie_needed && !e2.nullOrigin && (s2.enabled && e2.sameScheme);
      }, a.transportName = "xdr-streaming", a.roundTrips = 2, t.exports = a;
    }, { "./lib/ajax-based": 24, "./receiver/xhr": 32, "./sender/xdr": 34, "inherits": 54 }], 41: [function(e, t, n) {
      var r = e("inherits"), o = e("./lib/ajax-based"), i = e("./receiver/xhr"), s2 = e("./sender/xhr-cors"), a = e("./sender/xhr-local");
      function l(e2) {
        if (!a.enabled && !s2.enabled)
          throw new Error("Transport created when disabled");
        o.call(this, e2, "/xhr", i, s2);
      }
      r(l, o), l.enabled = function(e2) {
        return !e2.nullOrigin && (!(!a.enabled || !e2.sameOrigin) || s2.enabled);
      }, l.transportName = "xhr-polling", l.roundTrips = 2, t.exports = l;
    }, { "./lib/ajax-based": 24, "./receiver/xhr": 32, "./sender/xhr-cors": 35, "./sender/xhr-local": 37, "inherits": 54 }], 42: [function(l, u, e) {
      (function(e2) {
        var t = l("inherits"), n = l("./lib/ajax-based"), r = l("./receiver/xhr"), o = l("./sender/xhr-cors"), i = l("./sender/xhr-local"), s2 = l("../utils/browser");
        function a(e3) {
          if (!i.enabled && !o.enabled)
            throw new Error("Transport created when disabled");
          n.call(this, e3, "/xhr_streaming", r, o);
        }
        t(a, n), a.enabled = function(e3) {
          return !e3.nullOrigin && (!s2.isOpera() && o.enabled);
        }, a.transportName = "xhr-streaming", a.roundTrips = 2, a.needBody = !!e2.document, u.exports = a;
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, { "../utils/browser": 44, "./lib/ajax-based": 24, "./receiver/xhr": 32, "./sender/xhr-cors": 35, "./sender/xhr-local": 37, "inherits": 54 }], 43: [function(e, t, n) {
      (function(n2) {
        n2.crypto && n2.crypto.getRandomValues ? t.exports.randomBytes = function(e2) {
          var t2 = new Uint8Array(e2);
          return n2.crypto.getRandomValues(t2), t2;
        } : t.exports.randomBytes = function(e2) {
          for (var t2 = new Array(e2), n3 = 0; n3 < e2; n3++)
            t2[n3] = Math.floor(256 * Math.random());
          return t2;
        };
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, {}], 44: [function(e, t, n) {
      (function(e2) {
        t.exports = { isOpera: function() {
          return e2.navigator && /opera/i.test(e2.navigator.userAgent);
        }, isKonqueror: function() {
          return e2.navigator && /konqueror/i.test(e2.navigator.userAgent);
        }, hasDomain: function() {
          if (!e2.document)
            return true;
          try {
            return !!e2.document.domain;
          } catch (e3) {
            return false;
          }
        } };
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, {}], 45: [function(e, t, n) {
      var r, o = e("json3"), i = /[\x00-\x1f\ud800-\udfff\ufffe\uffff\u0300-\u0333\u033d-\u0346\u034a-\u034c\u0350-\u0352\u0357-\u0358\u035c-\u0362\u0374\u037e\u0387\u0591-\u05af\u05c4\u0610-\u0617\u0653-\u0654\u0657-\u065b\u065d-\u065e\u06df-\u06e2\u06eb-\u06ec\u0730\u0732-\u0733\u0735-\u0736\u073a\u073d\u073f-\u0741\u0743\u0745\u0747\u07eb-\u07f1\u0951\u0958-\u095f\u09dc-\u09dd\u09df\u0a33\u0a36\u0a59-\u0a5b\u0a5e\u0b5c-\u0b5d\u0e38-\u0e39\u0f43\u0f4d\u0f52\u0f57\u0f5c\u0f69\u0f72-\u0f76\u0f78\u0f80-\u0f83\u0f93\u0f9d\u0fa2\u0fa7\u0fac\u0fb9\u1939-\u193a\u1a17\u1b6b\u1cda-\u1cdb\u1dc0-\u1dcf\u1dfc\u1dfe\u1f71\u1f73\u1f75\u1f77\u1f79\u1f7b\u1f7d\u1fbb\u1fbe\u1fc9\u1fcb\u1fd3\u1fdb\u1fe3\u1feb\u1fee-\u1fef\u1ff9\u1ffb\u1ffd\u2000-\u2001\u20d0-\u20d1\u20d4-\u20d7\u20e7-\u20e9\u2126\u212a-\u212b\u2329-\u232a\u2adc\u302b-\u302c\uaab2-\uaab3\uf900-\ufa0d\ufa10\ufa12\ufa15-\ufa1e\ufa20\ufa22\ufa25-\ufa26\ufa2a-\ufa2d\ufa30-\ufa6d\ufa70-\ufad9\ufb1d\ufb1f\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufb4e\ufff0-\uffff]/g;
      t.exports = { quote: function(e2) {
        var t2 = o.stringify(e2);
        return i.lastIndex = 0, i.test(t2) ? (r = r || function(e3) {
          var t3, n2 = {}, r2 = [];
          for (t3 = 0; t3 < 65536; t3++)
            r2.push(String.fromCharCode(t3));
          return e3.lastIndex = 0, r2.join("").replace(e3, function(e4) {
            return n2[e4] = "\\u" + ("0000" + e4.charCodeAt(0).toString(16)).slice(-4), "";
          }), e3.lastIndex = 0, n2;
        }(i), t2.replace(i, function(e3) {
          return r[e3];
        })) : t2;
      } };
    }, { "json3": 55 }], 46: [function(e, t, n) {
      (function(n2) {
        var r = e("./random"), o = {}, i = false, s2 = n2.chrome && n2.chrome.app && n2.chrome.app.runtime;
        t.exports = { attachEvent: function(e2, t2) {
          n2.addEventListener !== void 0 ? n2.addEventListener(e2, t2, false) : n2.document && n2.attachEvent && (n2.document.attachEvent("on" + e2, t2), n2.attachEvent("on" + e2, t2));
        }, detachEvent: function(e2, t2) {
          n2.addEventListener !== void 0 ? n2.removeEventListener(e2, t2, false) : n2.document && n2.detachEvent && (n2.document.detachEvent("on" + e2, t2), n2.detachEvent("on" + e2, t2));
        }, unloadAdd: function(e2) {
          if (s2)
            return null;
          var t2 = r.string(8);
          return o[t2] = e2, i && setTimeout(this.triggerUnloadCallbacks, 0), t2;
        }, unloadDel: function(e2) {
          e2 in o && delete o[e2];
        }, triggerUnloadCallbacks: function() {
          for (var e2 in o)
            o[e2](), delete o[e2];
        } };
        s2 || t.exports.attachEvent("unload", function() {
          i || (i = true, t.exports.triggerUnloadCallbacks());
        });
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, { "./random": 50 }], 47: [function(t, p2, e) {
      (function(f) {
        var h2 = t("./event"), n = t("json3"), e2 = t("./browser"), d2 = function() {
        };
        p2.exports = { WPrefix: "_jp", currentWindowId: null, polluteGlobalNamespace: function() {
          p2.exports.WPrefix in f || (f[p2.exports.WPrefix] = {});
        }, postMessage: function(e3, t2) {
          f.parent !== f ? f.parent.postMessage(n.stringify({ windowId: p2.exports.currentWindowId, type: e3, data: t2 || "" }), "*") : d2();
        }, createIframe: function(e3, t2) {
          function n2() {
            clearTimeout(i);
            try {
              a.onload = null;
            } catch (e4) {
            }
            a.onerror = null;
          }
          function r() {
            a && (n2(), setTimeout(function() {
              a && a.parentNode.removeChild(a), a = null;
            }, 0), h2.unloadDel(s2));
          }
          function o(e4) {
            a && (r(), t2(e4));
          }
          var i, s2, a = f.document.createElement("iframe");
          return a.src = e3, a.style.display = "none", a.style.position = "absolute", a.onerror = function() {
            o("onerror");
          }, a.onload = function() {
            clearTimeout(i), i = setTimeout(function() {
              o("onload timeout");
            }, 2e3);
          }, f.document.body.appendChild(a), i = setTimeout(function() {
            o("timeout");
          }, 15e3), s2 = h2.unloadAdd(r), { post: function(e4, t3) {
            setTimeout(function() {
              try {
                a && a.contentWindow && a.contentWindow.postMessage(e4, t3);
              } catch (e5) {
              }
            }, 0);
          }, cleanup: r, loaded: n2 };
        }, createHtmlfile: function(e3, t2) {
          function n2() {
            clearTimeout(i), a.onerror = null;
          }
          function r() {
            u && (n2(), h2.unloadDel(s2), a.parentNode.removeChild(a), a = u = null, CollectGarbage());
          }
          function o(e4) {
            u && (r(), t2(e4));
          }
          var i, s2, a, l = ["Active"].concat("Object").join("X"), u = new f[l]("htmlfile");
          u.open(), u.write('<html><script>document.domain="' + f.document.domain + '";<\/script></html>'), u.close(), u.parentWindow[p2.exports.WPrefix] = f[p2.exports.WPrefix];
          var c = u.createElement("div");
          return u.body.appendChild(c), a = u.createElement("iframe"), c.appendChild(a), a.src = e3, a.onerror = function() {
            o("onerror");
          }, i = setTimeout(function() {
            o("timeout");
          }, 15e3), s2 = h2.unloadAdd(r), { post: function(e4, t3) {
            try {
              setTimeout(function() {
                a && a.contentWindow && a.contentWindow.postMessage(e4, t3);
              }, 0);
            } catch (e5) {
            }
          }, cleanup: r, loaded: n2 };
        } }, p2.exports.iframeEnabled = false, f.document && (p2.exports.iframeEnabled = (typeof f.postMessage == "function" || typeof f.postMessage == "object") && !e2.isKonqueror());
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, { "./browser": 44, "./event": 46, "debug": void 0, "json3": 55 }], 48: [function(e, t, n) {
      (function(n2) {
        var r = {};
        ["log", "debug", "warn"].forEach(function(e2) {
          var t2;
          try {
            t2 = n2.console && n2.console[e2] && n2.console[e2].apply;
          } catch (e3) {
          }
          r[e2] = t2 ? function() {
            return n2.console[e2].apply(n2.console, arguments);
          } : e2 === "log" ? function() {
          } : r.log;
        }), t.exports = r;
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, {}], 49: [function(e, t, n) {
      t.exports = { isObject: function(e2) {
        var t2 = typeof e2;
        return t2 == "function" || t2 == "object" && !!e2;
      }, extend: function(e2) {
        if (!this.isObject(e2))
          return e2;
        for (var t2, n2, r = 1, o = arguments.length; r < o; r++)
          for (n2 in t2 = arguments[r])
            Object.prototype.hasOwnProperty.call(t2, n2) && (e2[n2] = t2[n2]);
        return e2;
      } };
    }, {}], 50: [function(e, t, n) {
      var i = e("crypto"), s2 = "abcdefghijklmnopqrstuvwxyz012345";
      t.exports = { string: function(e2) {
        for (var t2 = s2.length, n2 = i.randomBytes(e2), r = [], o = 0; o < e2; o++)
          r.push(s2.substr(n2[o] % t2, 1));
        return r.join("");
      }, number: function(e2) {
        return Math.floor(Math.random() * e2);
      }, numberString: function(e2) {
        var t2 = ("" + (e2 - 1)).length;
        return (new Array(t2 + 1).join("0") + this.number(e2)).slice(-t2);
      } };
    }, { "crypto": 43 }], 51: [function(e, t, n) {
      var o = function() {
      };
      t.exports = function(e2) {
        return { filterToEnabled: function(t2, n2) {
          var r = { main: [], facade: [] };
          return t2 ? typeof t2 == "string" && (t2 = [t2]) : t2 = [], e2.forEach(function(e3) {
            e3 && (e3.transportName !== "websocket" || n2.websocket !== false ? t2.length && t2.indexOf(e3.transportName) === -1 ? o("not in whitelist", e3.transportName) : e3.enabled(n2) ? (o("enabled", e3.transportName), r.main.push(e3), e3.facadeTransport && r.facade.push(e3.facadeTransport)) : o("disabled", e3.transportName) : o());
          }), r;
        } };
      };
    }, { "debug": void 0 }], 52: [function(e, t, n) {
      var r = e("url-parse");
      t.exports = { getOrigin: function(e2) {
        if (!e2)
          return null;
        var t2 = new r(e2);
        if (t2.protocol === "file:")
          return null;
        var n2 = t2.port;
        return n2 = n2 || (t2.protocol === "https:" ? "443" : "80"), t2.protocol + "//" + t2.hostname + ":" + n2;
      }, isOriginEqual: function(e2, t2) {
        var n2 = this.getOrigin(e2) === this.getOrigin(t2);
        return n2;
      }, isSchemeEqual: function(e2, t2) {
        return e2.split(":")[0] === t2.split(":")[0];
      }, addPath: function(e2, t2) {
        var n2 = e2.split("?");
        return n2[0] + t2 + (n2[1] ? "?" + n2[1] : "");
      }, addQuery: function(e2, t2) {
        return e2 + (e2.indexOf("?") === -1 ? "?" + t2 : "&" + t2);
      }, isLoopbackAddr: function(e2) {
        return /^127\.([0-9]{1,3})\.([0-9]{1,3})\.([0-9]{1,3})$/i.test(e2) || /^\[::1\]$/.test(e2);
      } };
    }, { "debug": void 0, "url-parse": 58 }], 53: [function(e, t, n) {
      t.exports = "1.5.1";
    }, {}], 54: [function(e, t, n) {
      typeof Object.create == "function" ? t.exports = function(e2, t2) {
        t2 && (e2.super_ = t2, e2.prototype = Object.create(t2.prototype, { constructor: { value: e2, enumerable: false, writable: true, configurable: true } }));
      } : t.exports = function(e2, t2) {
        if (t2) {
          let n2 = function() {
          };
          e2.super_ = t2;
          n2.prototype = t2.prototype, e2.prototype = new n2(), e2.prototype.constructor = e2;
        }
      };
    }, {}], 55: [function(e, a, l) {
      (function(s2) {
        (function() {
          var J = { "function": true, "object": true }, e2 = J[typeof l] && l && !l.nodeType && l, B = J[typeof window] && window || this, t = e2 && J[typeof a] && a && !a.nodeType && typeof s2 == "object" && s2;
          function F(e3, l2) {
            e3 = e3 || B.Object(), l2 = l2 || B.Object();
            var u = e3.Number || B.Number, c = e3.String || B.String, t2 = e3.Object || B.Object, v = e3.Date || B.Date, n2 = e3.SyntaxError || B.SyntaxError, b = e3.TypeError || B.TypeError, d2 = e3.Math || B.Math, r2 = e3.JSON || B.JSON;
            typeof r2 == "object" && r2 && (l2.stringify = r2.stringify, l2.parse = r2.parse);
            var y2, o2 = t2.prototype, g = o2.toString, a2 = o2.hasOwnProperty;
            function w2(e4, t3) {
              try {
                e4();
              } catch (e5) {
                t3 && t3();
              }
            }
            var p2 = new v(-3509827334573292);
            function f(e4) {
              if (f[e4] != null)
                return f[e4];
              var t3;
              if (e4 == "bug-string-char-index")
                t3 = "a"[0] != "a";
              else if (e4 == "json")
                t3 = f("json-stringify") && f("date-serialization") && f("json-parse");
              else if (e4 == "date-serialization") {
                if (t3 = f("json-stringify") && p2) {
                  var n3 = l2.stringify;
                  w2(function() {
                    t3 = n3(new v(-864e13)) == '"-271821-04-20T00:00:00.000Z"' && n3(new v(864e13)) == '"+275760-09-13T00:00:00.000Z"' && n3(new v(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' && n3(new v(-1)) == '"1969-12-31T23:59:59.999Z"';
                  });
                }
              } else {
                var r3, o3 = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
                if (e4 == "json-stringify") {
                  var i3 = typeof (n3 = l2.stringify) == "function";
                  i3 && ((r3 = function() {
                    return 1;
                  }).toJSON = r3, w2(function() {
                    i3 = n3(0) === "0" && n3(new u()) === "0" && n3(new c()) == '""' && n3(g) === y2 && n3(y2) === y2 && n3() === y2 && n3(r3) === "1" && n3([r3]) == "[1]" && n3([y2]) == "[null]" && n3(null) == "null" && n3([y2, g, null]) == "[null,null,null]" && n3({ "a": [r3, true, false, null, "\0\b\n\f\r	"] }) == o3 && n3(null, r3) === "1" && n3([1, 2], null, 1) == "[\n 1,\n 2\n]";
                  }, function() {
                    i3 = false;
                  })), t3 = i3;
                }
                if (e4 == "json-parse") {
                  var s3, a3 = l2.parse;
                  typeof a3 == "function" && w2(function() {
                    a3("0") !== 0 || a3(false) || (r3 = a3(o3), (s3 = r3.a.length == 5 && r3.a[0] === 1) && (w2(function() {
                      s3 = !a3('"	"');
                    }), s3 && w2(function() {
                      s3 = a3("01") !== 1;
                    }), s3 && w2(function() {
                      s3 = a3("1.") !== 1;
                    })));
                  }, function() {
                    s3 = false;
                  }), t3 = s3;
                }
              }
              return f[e4] = !!t3;
            }
            if (w2(function() {
              p2 = p2.getUTCFullYear() == -109252 && p2.getUTCMonth() === 0 && p2.getUTCDate() === 1 && p2.getUTCHours() == 10 && p2.getUTCMinutes() == 37 && p2.getUTCSeconds() == 6 && p2.getUTCMilliseconds() == 708;
            }), f["bug-string-char-index"] = f["date-serialization"] = f.json = f["json-stringify"] = f["json-parse"] = null, !f("json")) {
              var h2 = "[object Function]", x = "[object Number]", _ = "[object String]", E = "[object Array]", m2 = f("bug-string-char-index"), j = function(e4, t3) {
                var n3, s3, r3, o3 = 0;
                for (r3 in (n3 = function() {
                  this.valueOf = 0;
                }).prototype.valueOf = 0, s3 = new n3())
                  a2.call(s3, r3) && o3++;
                return n3 = s3 = null, (j = o3 ? function(e5, t4) {
                  var n4, r4, o4 = g.call(e5) == h2;
                  for (n4 in e5)
                    o4 && n4 == "prototype" || !a2.call(e5, n4) || (r4 = n4 === "constructor") || t4(n4);
                  (r4 || a2.call(e5, n4 = "constructor")) && t4(n4);
                } : (s3 = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"], function(e5, t4) {
                  var n4, r4, o4 = g.call(e5) == h2, i3 = !o4 && typeof e5.constructor != "function" && J[typeof e5.hasOwnProperty] && e5.hasOwnProperty || a2;
                  for (n4 in e5)
                    o4 && n4 == "prototype" || !i3.call(e5, n4) || t4(n4);
                  for (r4 = s3.length; n4 = s3[--r4]; )
                    i3.call(e5, n4) && t4(n4);
                }))(e4, t3);
              };
              if (!f("json-stringify") && !f("date-serialization")) {
                let S = function(e4, t3) {
                  return ("000000" + (t3 || 0)).slice(-e4);
                };
                var i2 = { 92: "\\\\", 34: '\\"', 8: "\\b", 12: "\\f", 10: "\\n", 13: "\\r", 9: "\\t" }, T = function(e4) {
                  var t3, n3, r3, o3, i3, s3, a3, l3, u2;
                  if (p2)
                    t3 = function(e5) {
                      n3 = e5.getUTCFullYear(), r3 = e5.getUTCMonth(), o3 = e5.getUTCDate(), s3 = e5.getUTCHours(), a3 = e5.getUTCMinutes(), l3 = e5.getUTCSeconds(), u2 = e5.getUTCMilliseconds();
                    };
                  else {
                    let c2 = function(e5, t4) {
                      return h3[t4] + 365 * (e5 - 1970) + f2((e5 - 1969 + (t4 = +(1 < t4))) / 4) - f2((e5 - 1901 + t4) / 100) + f2((e5 - 1601 + t4) / 400);
                    };
                    var f2 = d2.floor, h3 = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
                    t3 = function(e5) {
                      for (o3 = f2(e5 / 864e5), n3 = f2(o3 / 365.2425) + 1970 - 1; c2(n3 + 1, 0) <= o3; n3++)
                        ;
                      for (r3 = f2((o3 - c2(n3, 0)) / 30.42); c2(n3, r3 + 1) <= o3; r3++)
                        ;
                      o3 = 1 + o3 - c2(n3, r3), s3 = f2((i3 = (e5 % 864e5 + 864e5) % 864e5) / 36e5) % 24, a3 = f2(i3 / 6e4) % 60, l3 = f2(i3 / 1e3) % 60, u2 = i3 % 1e3;
                    };
                  }
                  return (T = function(e5) {
                    return -1 / 0 < e5 && e5 < 1 / 0 ? (t3(e5), e5 = (n3 <= 0 || 1e4 <= n3 ? (n3 < 0 ? "-" : "+") + S(6, n3 < 0 ? -n3 : n3) : S(4, n3)) + "-" + S(2, r3 + 1) + "-" + S(2, o3) + "T" + S(2, s3) + ":" + S(2, a3) + ":" + S(2, l3) + "." + S(3, u2) + "Z", n3 = r3 = o3 = s3 = a3 = l3 = u2 = null) : e5 = null, e5;
                  })(e4);
                };
                if (f("json-stringify") && !f("date-serialization")) {
                  let s3 = function(e4) {
                    return T(this);
                  };
                  var O = l2.stringify;
                  l2.stringify = function(e4, t3, n3) {
                    var r3 = v.prototype.toJSON;
                    v.prototype.toJSON = s3;
                    var o3 = O(e4, t3, n3);
                    return v.prototype.toJSON = r3, o3;
                  };
                } else {
                  let C = function(e4) {
                    var t3 = e4.charCodeAt(0), n3 = i2[t3];
                    return n3 || "\\u00" + S(2, t3.toString(16));
                  }, N = function(e4) {
                    return A.lastIndex = 0, '"' + (A.test(e4) ? e4.replace(A, C) : e4) + '"';
                  };
                  var A = /[\x00-\x1f\x22\x5c]/g, k = function(e4, t3, n3, r3, o3, i3, s3) {
                    var a3, l3, u2, c2, f2, h3, d3, p3, m3;
                    if (w2(function() {
                      a3 = t3[e4];
                    }), typeof a3 == "object" && a3 && (a3.getUTCFullYear && g.call(a3) == "[object Date]" && a3.toJSON === v.prototype.toJSON ? a3 = T(a3) : typeof a3.toJSON == "function" && (a3 = a3.toJSON(e4))), n3 && (a3 = n3.call(t3, e4, a3)), a3 == y2)
                      return a3 === y2 ? a3 : "null";
                    switch ((l3 = typeof a3) == "object" && (u2 = g.call(a3)), u2 || l3) {
                      case "boolean":
                      case "[object Boolean]":
                        return "" + a3;
                      case "number":
                      case x:
                        return -1 / 0 < a3 && a3 < 1 / 0 ? "" + a3 : "null";
                      case "string":
                      case _:
                        return N("" + a3);
                    }
                    if (typeof a3 == "object") {
                      for (d3 = s3.length; d3--; )
                        if (s3[d3] === a3)
                          throw b();
                      if (s3.push(a3), c2 = [], p3 = i3, i3 += o3, u2 == E) {
                        for (h3 = 0, d3 = a3.length; h3 < d3; h3++)
                          f2 = k(h3, a3, n3, r3, o3, i3, s3), c2.push(f2 === y2 ? "null" : f2);
                        m3 = c2.length ? o3 ? "[\n" + i3 + c2.join(",\n" + i3) + "\n" + p3 + "]" : "[" + c2.join(",") + "]" : "[]";
                      } else
                        j(r3 || a3, function(e5) {
                          var t4 = k(e5, a3, n3, r3, o3, i3, s3);
                          t4 !== y2 && c2.push(N(e5) + ":" + (o3 ? " " : "") + t4);
                        }), m3 = c2.length ? o3 ? "{\n" + i3 + c2.join(",\n" + i3) + "\n" + p3 + "}" : "{" + c2.join(",") + "}" : "{}";
                      return s3.pop(), m3;
                    }
                  };
                  l2.stringify = function(e4, t3, n3) {
                    var r3, o3, i3, s3;
                    if (J[typeof t3] && t3) {
                      if ((s3 = g.call(t3)) == h2)
                        o3 = t3;
                      else if (s3 == E) {
                        i3 = {};
                        for (var a3, l3 = 0, u2 = t3.length; l3 < u2; )
                          a3 = t3[l3++], (s3 = g.call(a3)) != "[object String]" && s3 != "[object Number]" || (i3[a3] = 1);
                      }
                    }
                    if (n3)
                      if ((s3 = g.call(n3)) == x) {
                        if (0 < (n3 -= n3 % 1))
                          for (10 < n3 && (n3 = 10), r3 = ""; r3.length < n3; )
                            r3 += " ";
                      } else
                        s3 == _ && (r3 = n3.length <= 10 ? n3 : n3.slice(0, 10));
                    return k("", ((a3 = {})[""] = e4, a3), o3, i3, r3, "", []);
                  };
                }
              }
              if (!f("json-parse")) {
                let I = function() {
                  throw R = U = null, n2();
                }, L = function() {
                  for (var e4, t3, n3, r3, o3, i3 = U, s3 = i3.length; R < s3; )
                    switch (o3 = i3.charCodeAt(R)) {
                      case 9:
                      case 10:
                      case 13:
                      case 32:
                        R++;
                        break;
                      case 123:
                      case 125:
                      case 91:
                      case 93:
                      case 58:
                      case 44:
                        return e4 = m2 ? i3.charAt(R) : i3[R], R++, e4;
                      case 34:
                        for (e4 = "@", R++; R < s3; )
                          if ((o3 = i3.charCodeAt(R)) < 32)
                            I();
                          else if (o3 == 92)
                            switch (o3 = i3.charCodeAt(++R)) {
                              case 92:
                              case 34:
                              case 47:
                              case 98:
                              case 116:
                              case 110:
                              case 102:
                              case 114:
                                e4 += q[o3], R++;
                                break;
                              case 117:
                                for (t3 = ++R, n3 = R + 4; R < n3; R++)
                                  48 <= (o3 = i3.charCodeAt(R)) && o3 <= 57 || 97 <= o3 && o3 <= 102 || 65 <= o3 && o3 <= 70 || I();
                                e4 += M("0x" + i3.slice(t3, R));
                                break;
                              default:
                                I();
                            }
                          else {
                            if (o3 == 34)
                              break;
                            for (o3 = i3.charCodeAt(R), t3 = R; 32 <= o3 && o3 != 92 && o3 != 34; )
                              o3 = i3.charCodeAt(++R);
                            e4 += i3.slice(t3, R);
                          }
                        if (i3.charCodeAt(R) == 34)
                          return R++, e4;
                        I();
                      default:
                        if (t3 = R, o3 == 45 && (r3 = true, o3 = i3.charCodeAt(++R)), 48 <= o3 && o3 <= 57) {
                          for (o3 == 48 && (48 <= (o3 = i3.charCodeAt(R + 1)) && o3 <= 57) && I(), r3 = false; R < s3 && (48 <= (o3 = i3.charCodeAt(R)) && o3 <= 57); R++)
                            ;
                          if (i3.charCodeAt(R) == 46) {
                            for (n3 = ++R; n3 < s3 && !((o3 = i3.charCodeAt(n3)) < 48 || 57 < o3); n3++)
                              ;
                            n3 == R && I(), R = n3;
                          }
                          if ((o3 = i3.charCodeAt(R)) == 101 || o3 == 69) {
                            for ((o3 = i3.charCodeAt(++R)) != 43 && o3 != 45 || R++, n3 = R; n3 < s3 && !((o3 = i3.charCodeAt(n3)) < 48 || 57 < o3); n3++)
                              ;
                            n3 == R && I(), R = n3;
                          }
                          return +i3.slice(t3, R);
                        }
                        r3 && I();
                        var a3 = i3.slice(R, R + 4);
                        if (a3 == "true")
                          return R += 4, true;
                        if (a3 == "fals" && i3.charCodeAt(R + 4) == 101)
                          return R += 5, false;
                        if (a3 == "null")
                          return R += 4, null;
                        I();
                    }
                  return "$";
                }, P = function(e4, t3, n3) {
                  var r3 = W(e4, t3, n3);
                  r3 === y2 ? delete e4[t3] : e4[t3] = r3;
                };
                var R, U, M = c.fromCharCode, q = { 92: "\\", 34: '"', 47: "/", 98: "\b", 116: "	", 110: "\n", 102: "\f", 114: "\r" }, D = function(e4) {
                  var t3, n3;
                  if (e4 == "$" && I(), typeof e4 == "string") {
                    if ((m2 ? e4.charAt(0) : e4[0]) == "@")
                      return e4.slice(1);
                    if (e4 == "[") {
                      for (t3 = []; (e4 = L()) != "]"; )
                        n3 ? e4 == "," ? (e4 = L()) == "]" && I() : I() : n3 = true, e4 == "," && I(), t3.push(D(e4));
                      return t3;
                    }
                    if (e4 == "{") {
                      for (t3 = {}; (e4 = L()) != "}"; )
                        n3 ? e4 == "," ? (e4 = L()) == "}" && I() : I() : n3 = true, e4 != "," && typeof e4 == "string" && (m2 ? e4.charAt(0) : e4[0]) == "@" && L() == ":" || I(), t3[e4.slice(1)] = D(L());
                      return t3;
                    }
                    I();
                  }
                  return e4;
                }, W = function(e4, t3, n3) {
                  var r3, o3 = e4[t3];
                  if (typeof o3 == "object" && o3)
                    if (g.call(o3) == E)
                      for (r3 = o3.length; r3--; )
                        P(g, j, o3);
                    else
                      j(o3, function(e5) {
                        P(o3, e5, n3);
                      });
                  return n3.call(e4, t3, o3);
                };
                l2.parse = function(e4, t3) {
                  var n3, r3;
                  return R = 0, U = "" + e4, n3 = D(L()), L() != "$" && I(), R = U = null, t3 && g.call(t3) == h2 ? W(((r3 = {})[""] = n3, r3), "", t3) : n3;
                };
              }
            }
            return l2.runInContext = F, l2;
          }
          if (!t || t.global !== t && t.window !== t && t.self !== t || (B = t), e2)
            F(B, e2);
          else {
            var n = B.JSON, r = B.JSON3, o = false, i = F(B, B.JSON3 = { "noConflict": function() {
              return o || (o = true, B.JSON = n, B.JSON3 = r, n = r = null), i;
            } });
            B.JSON = { "parse": i.parse, "stringify": i.stringify };
          }
        }).call(this);
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, {}], 56: [function(e, t, n) {
      var i = Object.prototype.hasOwnProperty;
      function s2(e2) {
        try {
          return decodeURIComponent(e2.replace(/\+/g, " "));
        } catch (e3) {
          return null;
        }
      }
      n.stringify = function(e2, t2) {
        t2 = t2 || "";
        var n2, r, o = [];
        for (r in typeof t2 != "string" && (t2 = "?"), e2)
          if (i.call(e2, r)) {
            if ((n2 = e2[r]) || n2 != null && !isNaN(n2) || (n2 = ""), r = encodeURIComponent(r), n2 = encodeURIComponent(n2), r === null || n2 === null)
              continue;
            o.push(r + "=" + n2);
          }
        return o.length ? t2 + o.join("&") : "";
      }, n.parse = function(e2) {
        for (var t2, n2 = /([^=?&]+)=?([^&]*)/g, r = {}; t2 = n2.exec(e2); ) {
          var o = s2(t2[1]), i2 = s2(t2[2]);
          o === null || i2 === null || o in r || (r[o] = i2);
        }
        return r;
      };
    }, {}], 57: [function(e, t, n) {
      t.exports = function(e2, t2) {
        if (t2 = t2.split(":")[0], !(e2 = +e2))
          return false;
        switch (t2) {
          case "http":
          case "ws":
            return e2 !== 80;
          case "https":
          case "wss":
            return e2 !== 443;
          case "ftp":
            return e2 !== 21;
          case "gopher":
            return e2 !== 70;
          case "file":
            return false;
        }
        return e2 !== 0;
      };
    }, {}], 58: [function(e, r, t) {
      (function(i) {
        var d2 = e("requires-port"), p2 = e("querystringify"), s2 = /^[A-Za-z][A-Za-z0-9+-.]*:[\\/]+/, n = /^([a-z][a-z0-9.+-]*:)?([\\/]{1,})?([\S\s]*)/i, t2 = new RegExp("^[\\x09\\x0A\\x0B\\x0C\\x0D\\x20\\xA0\\u1680\\u180E\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A\\u202F\\u205F\\u3000\\u2028\\u2029\\uFEFF]+");
        function m2(e2) {
          return (e2 || "").toString().replace(t2, "");
        }
        var v = [["#", "hash"], ["?", "query"], function(e2) {
          return e2.replace("\\", "/");
        }, ["/", "pathname"], ["@", "auth", 1], [NaN, "host", void 0, 1, 1], [/:(\d+)$/, "port", void 0, 1], [NaN, "hostname", void 0, 1, 1]], a = { hash: 1, query: 1 };
        function b(e2) {
          var t3, n2 = (typeof window != "undefined" ? window : i !== void 0 ? i : typeof self != "undefined" ? self : {}).location || {}, r2 = {}, o = typeof (e2 = e2 || n2);
          if (e2.protocol === "blob:")
            r2 = new g(unescape(e2.pathname), {});
          else if (o == "string")
            for (t3 in r2 = new g(e2, {}), a)
              delete r2[t3];
          else if (o == "object") {
            for (t3 in e2)
              t3 in a || (r2[t3] = e2[t3]);
            r2.slashes === void 0 && (r2.slashes = s2.test(e2.href));
          }
          return r2;
        }
        function y2(e2) {
          e2 = m2(e2);
          var t3 = n.exec(e2);
          return { protocol: t3[1] ? t3[1].toLowerCase() : "", slashes: !!(t3[2] && 2 <= t3[2].length), rest: t3[2] && t3[2].length === 1 ? "/" + t3[3] : t3[3] };
        }
        function g(e2, t3, n2) {
          if (e2 = m2(e2), !(this instanceof g))
            return new g(e2, t3, n2);
          var r2, o, i2, s3, a2, l, u = v.slice(), c = typeof t3, f = this, h2 = 0;
          for (c != "object" && c != "string" && (n2 = t3, t3 = null), n2 && typeof n2 != "function" && (n2 = p2.parse), t3 = b(t3), r2 = !(o = y2(e2 || "")).protocol && !o.slashes, f.slashes = o.slashes || r2 && t3.slashes, f.protocol = o.protocol || t3.protocol || "", e2 = o.rest, o.slashes || (u[3] = [/(.*)/, "pathname"]); h2 < u.length; h2++)
            typeof (s3 = u[h2]) != "function" ? (i2 = s3[0], l = s3[1], i2 != i2 ? f[l] = e2 : typeof i2 == "string" ? ~(a2 = e2.indexOf(i2)) && (e2 = typeof s3[2] == "number" ? (f[l] = e2.slice(0, a2), e2.slice(a2 + s3[2])) : (f[l] = e2.slice(a2), e2.slice(0, a2))) : (a2 = i2.exec(e2)) && (f[l] = a2[1], e2 = e2.slice(0, a2.index)), f[l] = f[l] || r2 && s3[3] && t3[l] || "", s3[4] && (f[l] = f[l].toLowerCase())) : e2 = s3(e2);
          n2 && (f.query = n2(f.query)), r2 && t3.slashes && f.pathname.charAt(0) !== "/" && (f.pathname !== "" || t3.pathname !== "") && (f.pathname = function(e3, t4) {
            if (e3 === "")
              return t4;
            for (var n3 = (t4 || "/").split("/").slice(0, -1).concat(e3.split("/")), r3 = n3.length, o2 = n3[r3 - 1], i3 = false, s4 = 0; r3--; )
              n3[r3] === "." ? n3.splice(r3, 1) : n3[r3] === ".." ? (n3.splice(r3, 1), s4++) : s4 && (r3 === 0 && (i3 = true), n3.splice(r3, 1), s4--);
            return i3 && n3.unshift(""), o2 !== "." && o2 !== ".." || n3.push(""), n3.join("/");
          }(f.pathname, t3.pathname)), f.pathname.charAt(0) !== "/" && f.hostname && (f.pathname = "/" + f.pathname), d2(f.port, f.protocol) || (f.host = f.hostname, f.port = ""), f.username = f.password = "", f.auth && (s3 = f.auth.split(":"), f.username = s3[0] || "", f.password = s3[1] || ""), f.origin = f.protocol && f.host && f.protocol !== "file:" ? f.protocol + "//" + f.host : "null", f.href = f.toString();
        }
        g.prototype = { set: function(e2, t3, n2) {
          var r2 = this;
          switch (e2) {
            case "query":
              typeof t3 == "string" && t3.length && (t3 = (n2 || p2.parse)(t3)), r2[e2] = t3;
              break;
            case "port":
              r2[e2] = t3, d2(t3, r2.protocol) ? t3 && (r2.host = r2.hostname + ":" + t3) : (r2.host = r2.hostname, r2[e2] = "");
              break;
            case "hostname":
              r2[e2] = t3, r2.port && (t3 += ":" + r2.port), r2.host = t3;
              break;
            case "host":
              r2[e2] = t3, /:\d+$/.test(t3) ? (t3 = t3.split(":"), r2.port = t3.pop(), r2.hostname = t3.join(":")) : (r2.hostname = t3, r2.port = "");
              break;
            case "protocol":
              r2.protocol = t3.toLowerCase(), r2.slashes = !n2;
              break;
            case "pathname":
            case "hash":
              if (t3) {
                var o = e2 === "pathname" ? "/" : "#";
                r2[e2] = t3.charAt(0) !== o ? o + t3 : t3;
              } else
                r2[e2] = t3;
              break;
            default:
              r2[e2] = t3;
          }
          for (var i2 = 0; i2 < v.length; i2++) {
            var s3 = v[i2];
            s3[4] && (r2[s3[1]] = r2[s3[1]].toLowerCase());
          }
          return r2.origin = r2.protocol && r2.host && r2.protocol !== "file:" ? r2.protocol + "//" + r2.host : "null", r2.href = r2.toString(), r2;
        }, toString: function(e2) {
          e2 && typeof e2 == "function" || (e2 = p2.stringify);
          var t3, n2 = this, r2 = n2.protocol;
          r2 && r2.charAt(r2.length - 1) !== ":" && (r2 += ":");
          var o = r2 + (n2.slashes ? "//" : "");
          return n2.username && (o += n2.username, n2.password && (o += ":" + n2.password), o += "@"), o += n2.host + n2.pathname, (t3 = typeof n2.query == "object" ? e2(n2.query) : n2.query) && (o += t3.charAt(0) !== "?" ? "?" + t3 : t3), n2.hash && (o += n2.hash), o;
        } }, g.extractProtocol = y2, g.location = b, g.trimLeft = m2, g.qs = p2, r.exports = g;
      }).call(this, typeof commonjsGlobal != "undefined" ? commonjsGlobal : typeof self != "undefined" ? self : typeof window != "undefined" ? window : {});
    }, { "querystringify": 56, "requires-port": 57 }] }, {}, [1])(1);
  });
})(sockjs_min);
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
function __awaiter$1(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
const BORDER_RADIUS_REGEX = /^(\d+(?:\.\d+)?)([^\d\s.]+)(?:\s+(\d+(?:\.\d+)?)([^\d\s.]+))?$/;
function parseBorderRadius(borderRadius) {
  var _a2, _b, _c, _d;
  const parsedBorderRadius = BORDER_RADIUS_REGEX.exec(borderRadius);
  let x;
  let y2;
  x = {
    value: +((_a2 = parsedBorderRadius === null || parsedBorderRadius === void 0 ? void 0 : parsedBorderRadius[1]) !== null && _a2 !== void 0 ? _a2 : 0),
    unit: (_b = parsedBorderRadius === null || parsedBorderRadius === void 0 ? void 0 : parsedBorderRadius[2]) !== null && _b !== void 0 ? _b : "px"
  };
  if (parsedBorderRadius === null || parsedBorderRadius === void 0 ? void 0 : parsedBorderRadius[3])
    y2 = {
      value: +((_c = parsedBorderRadius === null || parsedBorderRadius === void 0 ? void 0 : parsedBorderRadius[3]) !== null && _c !== void 0 ? _c : 0),
      unit: (_d = parsedBorderRadius === null || parsedBorderRadius === void 0 ? void 0 : parsedBorderRadius[4]) !== null && _d !== void 0 ? _d : "px"
    };
  else
    y2 = Object.assign({}, x);
  return {
    x,
    y: y2
  };
}
function stringifyBorderRadius(radii) {
  return `${radii.x.value}${radii.x.unit} ${radii.y.value}${radii.y.unit}`;
}
function borderRadiusHandler(delta, borderRadius) {
  const radii = parseBorderRadius(borderRadius);
  if (radii.x.unit !== "%")
    radii.x.value = radii.x.value * delta.inverseScaleX;
  if (radii.y.unit !== "%")
    radii.y.value = radii.y.value * delta.inverseScaleY;
  return stringifyBorderRadius(radii);
}
function parseTransformOrigin(originString) {
  const origin = originString.split(" ").map(parseFloat);
  return {
    x: origin[0],
    y: origin[1]
  };
}
const DELTA_PASS_THROUGH_HANDLER = (_, __, thisStyle) => thisStyle;
function getDelta(start, end) {
  const origin = parseTransformOrigin(start.getStyle("transformOrigin"));
  const scaleX = end.rect.width / start.rect.width;
  const scaleY = end.rect.height / start.rect.height;
  const inverseScaleX = start.rect.width / end.rect.width;
  const inverseScaleY = start.rect.height / end.rect.height;
  const originDisplacementX = origin.x / start.rect.width * (end.rect.width * (1 - inverseScaleX));
  const originDisplacementY = origin.y / start.rect.height * (end.rect.height * (1 - inverseScaleY));
  const x = end.rect.left - start.rect.left + originDisplacementX;
  const y2 = end.rect.top - start.rect.top + originDisplacementY;
  return {
    x,
    y: y2,
    scaleX,
    scaleY,
    inverseScaleX,
    inverseScaleY
  };
}
/*! @license Rematrix v0.7.0

	Copyright 2020 Julian Lloyd.

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.
*/
function format(source) {
  if (source && source.constructor === Array) {
    var values = source.filter(function(value) {
      return typeof value === "number";
    }).filter(function(value) {
      return !isNaN(value);
    });
    if (source.length === 6 && values.length === 6) {
      var matrix = identity();
      matrix[0] = values[0];
      matrix[1] = values[1];
      matrix[4] = values[2];
      matrix[5] = values[3];
      matrix[12] = values[4];
      matrix[13] = values[5];
      return matrix;
    } else if (source.length === 16 && values.length === 16) {
      return source;
    }
  }
  throw new TypeError("Expected a `number[]` with length 6 or 16.");
}
function fromString(source) {
  if (typeof source === "string") {
    var match = source.match(/matrix(3d)?\(([^)]+)\)/);
    if (match) {
      var raw = match[2].split(", ").map(parseFloat);
      return format(raw);
    }
  }
  throw new TypeError("Expected a string containing `matrix()` or `matrix3d()");
}
function identity() {
  var matrix = [];
  for (var i = 0; i < 16; i++) {
    i % 5 == 0 ? matrix.push(1) : matrix.push(0);
  }
  return matrix;
}
function multiply(matrixA, matrixB) {
  var fma = format(matrixA);
  var fmb = format(matrixB);
  var product = [];
  for (var i = 0; i < 4; i++) {
    var row = [fma[i], fma[i + 4], fma[i + 8], fma[i + 12]];
    for (var j = 0; j < 4; j++) {
      var k = j * 4;
      var col = [fmb[k], fmb[k + 1], fmb[k + 2], fmb[k + 3]];
      var result = row[0] * col[0] + row[1] * col[1] + row[2] * col[2] + row[3] * col[3];
      product[i + k] = result;
    }
  }
  return product;
}
function scale(scalar, scalarY) {
  var matrix = identity();
  matrix[0] = scalar;
  matrix[5] = typeof scalarY === "number" ? scalarY : scalar;
  return matrix;
}
function toString(source) {
  return "matrix3d(" + format(source).join(", ") + ")";
}
function translate(distanceX, distanceY) {
  var matrix = identity();
  matrix[12] = distanceX;
  if (distanceY) {
    matrix[13] = distanceY;
  }
  return matrix;
}
const IDENTITY_MATRIX = identity();
function transformHandler(delta, deltaStyle) {
  let originalMatrixOfDeltaElement;
  if (deltaStyle.startsWith("matrix"))
    originalMatrixOfDeltaElement = fromString(deltaStyle);
  else
    originalMatrixOfDeltaElement = IDENTITY_MATRIX;
  const deltaMatrix = [translate(delta.x, delta.y), originalMatrixOfDeltaElement, scale(delta.scaleX, delta.scaleY)];
  let transformString;
  try {
    transformString = toString(deltaMatrix.reduce(multiply));
  } catch (e) {
    if (process && false)
      console.error("[illusory] Failed to construct transform matrix. Is the element in the DOM?");
    return "none";
  }
  return transformString;
}
const DEFAULT_OPTIONS$1 = {
  element: {
    includeChildren: true,
    ignoreTransparency: ["img"]
  },
  zIndex: 1,
  compositeOnly: false,
  duration: "300ms",
  easing: "ease",
  relativeTo: [document]
};
const RGBA_REGEX = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([01](?:\.\d+)?)\)$/i;
const isHex = (hex) => /^#([a-f0-9]{4}){1,2}$/i.test(hex);
const hexChunkSize = (hex) => Math.floor((hex.length - 1) / 3);
const separateHex = (hex) => hex.match(new RegExp(`.{${hexChunkSize(hex)}}`, "g"));
const hexToDec = (hex) => parseInt(hex.repeat(2 / hex.length), 16);
const getAlphaFloat = (a) => +(a / 256).toFixed(2);
const hexToRGBA = (hexArr) => {
  const [r, g, b, a] = hexArr.map(hexToDec);
  return [r, g, b, getAlphaFloat(a)];
};
function parseRGBA(color) {
  const rgba = RGBA_REGEX.exec(color);
  let r;
  let g;
  let b;
  let a;
  if (rgba) {
    [r, g, b, a] = rgba.slice(1, 5).map(parseFloat);
  } else if (isHex(color)) {
    const hexArray = separateHex(color.slice(1));
    if (!hexArray)
      return false;
    [r, g, b, a] = hexToRGBA(hexArray);
  } else
    return false;
  return { r, g, b, a };
}
const isHTMLOrSVG = (node) => node instanceof HTMLElement || node instanceof SVGElement;
function toKebab(str) {
  return str.split(/(?=[A-Z])/).join("-").toLowerCase();
}
function filterDataAttributes(element, filterFunction) {
  Object.keys(element.dataset).forEach((key) => {
    const attr = `data-${toKebab(key)}`;
    if (attr.indexOf("data-illusory") === 0)
      return;
    if (!filterFunction || !filterFunction(attr))
      element.removeAttribute(attr);
  });
}
function copyStyles(source, target) {
  const styles = window.getComputedStyle(source);
  if (styles.cssText !== "")
    target.style.cssText = styles.cssText;
  else {
    let mockCssText = "";
    for (let i = 0; i < styles.length; i++) {
      mockCssText += `${styles[i]}: ${styles.getPropertyValue(styles[i])}; `;
    }
    target.style.cssText = mockCssText;
  }
  target.style.transformOrigin = styles.transformOrigin;
}
function duplicateNode(node, options, depth = 0) {
  let clone2 = node.cloneNode(false);
  if (isHTMLOrSVG(node)) {
    copyStyles(node, clone2);
    if (options.preserveDataAttributes !== true)
      filterDataAttributes(clone2, options.preserveDataAttributes);
  }
  if (typeof options.processClone === "function") {
    const processedClone = options.processClone(clone2, depth);
    if (processedClone)
      clone2 = processedClone;
    else
      return null;
  }
  if (options.includeChildren) {
    node.childNodes.forEach((child) => {
      const duplicatedNode = duplicateNode(child, options, depth + 1);
      if (duplicatedNode)
        clone2.appendChild(duplicatedNode);
    });
  }
  return clone2;
}
function flushCSSUpdates(el1, el2) {
  el1.clone.clientWidth;
  el2 === null || el2 === void 0 ? void 0 : el2.clone.clientWidth;
}
function buildTransitionString(options) {
  if (options.compositeOnly)
    return `transform ${options.duration} ${options.easing} 0s, opacity ${options.duration} ${options.easing} 0s`;
  else
    return `all ${options.duration} ${options.easing} 0s`;
}
class IllusoryElement {
  constructor(el, options) {
    var _a2, _b;
    this.originalStyle = {};
    this.deltaHandlers = {
      transform: transformHandler,
      borderTopLeftRadius: borderRadiusHandler,
      borderTopRightRadius: borderRadiusHandler,
      borderBottomRightRadius: borderRadiusHandler,
      borderBottomLeftRadius: borderRadiusHandler
    };
    this.isAttached = false;
    this.natural = el;
    this.initialStyleAttributeValue = this.natural.getAttribute("style");
    this._shouldIgnoreTransparency = (_a2 = options === null || options === void 0 ? void 0 : options.ignoreTransparency) !== null && _a2 !== void 0 ? _a2 : DEFAULT_OPTIONS$1.element.ignoreTransparency;
    this.natural.style.transition = "none";
    this.natural.style.animation = "none";
    {
      const originalNaturalTransform = this.natural.style.transform;
      this.natural.style.transform = "none";
      this.rect = this.natural.getBoundingClientRect();
      this.natural.style.transform = originalNaturalTransform;
    }
    this.clone = duplicateNode(this.natural, {
      includeChildren: (_b = options === null || options === void 0 ? void 0 : options.includeChildren) !== null && _b !== void 0 ? _b : DEFAULT_OPTIONS$1.element.includeChildren,
      preserveDataAttributes: options === null || options === void 0 ? void 0 : options.preserveDataAttributes,
      processClone: options === null || options === void 0 ? void 0 : options.processClone
    });
    this.setStyle("left", "auto");
    this.setStyle("right", "auto");
    this.setStyle("top", "auto");
    this.setStyle("bottom", "auto");
    this.setStyle("margin", "0 0 0 0");
    this.setStyle("transition", "none");
    this.setStyle("animation", "none");
    this.setStyle("pointerEvents", "none");
    this.setStyle("position", "fixed");
    this.setStyle("left", `${this.rect.left}px`);
    this.setStyle("top", `${this.rect.top}px`);
    if (options === null || options === void 0 ? void 0 : options.attachImmediately)
      this.attach();
  }
  _makeCompositeOnly() {
    this.deltaHandlers = {
      transform: transformHandler,
      borderTopLeftRadius: DELTA_PASS_THROUGH_HANDLER,
      borderTopRightRadius: DELTA_PASS_THROUGH_HANDLER,
      borderBottomLeftRadius: DELTA_PASS_THROUGH_HANDLER,
      borderBottomRightRadius: DELTA_PASS_THROUGH_HANDLER
    };
  }
  get _ignoreTransparency() {
    if (this._shouldIgnoreTransparency === true)
      return true;
    if (Array.isArray(this._shouldIgnoreTransparency) && this._shouldIgnoreTransparency.indexOf(this.clone.tagName.toLowerCase()) !== -1)
      return true;
    return false;
  }
  _hasTransparentBackground() {
    if (this._ignoreTransparency)
      return false;
    const rgba = parseRGBA(this.getStyle("backgroundColor"));
    if (!rgba)
      return false;
    return rgba.a < 1;
  }
  _to(element) {
    const delta = getDelta(this, element);
    Object.keys(this.deltaHandlers).forEach((key) => {
      this.setStyle(key, this.deltaHandlers[key](delta, element.getStyle(key), this.getStyle(key)));
    });
  }
  _enableTransitions(options) {
    this.setStyle("transition", buildTransitionString(options));
  }
  _disableTransitions() {
    this.setStyle("transition", "none");
  }
  _setParent(element) {
    if (this.isAttached)
      this.detach();
    this.hideNatural();
    element.appendChild(this.clone);
    this.isAttached = true;
  }
  _resetNaturalStyleAttribute() {
    if (!this.initialStyleAttributeValue)
      this.natural.removeAttribute("style");
    else
      this.natural.setAttribute("style", this.initialStyleAttributeValue);
  }
  getStyle(property) {
    var _a2;
    return (_a2 = this.originalStyle[property]) !== null && _a2 !== void 0 ? _a2 : this.clone.style[property];
  }
  setStyle(property, value) {
    this.originalStyle[property] = this.getStyle(property);
    this.clone.style[property] = value;
  }
  waitFor(property) {
    return new Promise((resolve2) => {
      const cb = (e) => __awaiter$1(this, void 0, void 0, function* () {
        if (property !== "any" && e.propertyName !== property)
          return;
        if (property === "any")
          yield new Promise((r) => requestAnimationFrame(r));
        this.clone.removeEventListener("transitionend", cb);
        resolve2();
      });
      this.clone.addEventListener("transitionend", cb);
    });
  }
  hide() {
    this.setStyle("opacity", "0");
  }
  show() {
    this.setStyle("opacity", "1");
  }
  hideNatural() {
    this.natural.style.opacity = "0";
  }
  showNatural() {
    this.natural.style.opacity = "1";
  }
  flushCSS() {
    flushCSSUpdates(this);
  }
  attach() {
    this._setParent(document.body);
  }
  detach() {
    if (!this.isAttached)
      return;
    this.showNatural();
    this.flushCSS();
    this._resetNaturalStyleAttribute();
    this.clone.remove();
    this.isAttached = false;
  }
}
const targetManagers = new Map();
class TargetManager {
  constructor(target, listener) {
    this.listeners = [];
    this.initialPositions = new Map();
    this.target = target;
    this.add(listener);
  }
  static getCumulativeDelta(listener) {
    return listener.dependencies.reduce(({ x, y: y2 }, target) => {
      const delta = targetManagers.get(target).getDelta(listener);
      return {
        x: x + delta.x,
        y: y2 + delta.y
      };
    }, { x: 0, y: 0 });
  }
  get currentPosition() {
    return {
      x: this.target instanceof Document ? window.scrollX : this.target.scrollLeft,
      y: this.target instanceof Document ? window.scrollY : this.target.scrollTop
    };
  }
  getDelta(listener) {
    const initialPosition = this.initialPositions.get(listener);
    const currentPosition = this.currentPosition;
    return {
      x: initialPosition.x - currentPosition.x,
      y: initialPosition.y - currentPosition.y
    };
  }
  get listenerCount() {
    return this.listeners.length;
  }
  add(listener) {
    this.listeners.push(listener);
    this.initialPositions.set(listener, this.currentPosition);
  }
  remove(listener) {
    this.listeners.splice(this.listeners.indexOf(listener), 1);
    this.initialPositions.delete(listener);
  }
  dispatch() {
    this.listeners.forEach((listener) => {
      const delta = TargetManager.getCumulativeDelta(listener);
      listener.handler(delta);
    });
  }
}
let debounce = false;
const scrollHandler = (e) => {
  if (debounce)
    return;
  debounce = true;
  requestAnimationFrame(() => {
    debounce = false;
    const target = e.target;
    if (!targetManagers.has(target))
      return;
    targetManagers.get(target).dispatch();
  });
};
var ScrollManager = {
  add(listener) {
    listener.dependencies.forEach((target) => {
      if (!targetManagers.size)
        document.addEventListener("scroll", scrollHandler, true);
      if (targetManagers.has(target))
        targetManagers.get(target).add(listener);
      else
        targetManagers.set(target, new TargetManager(target, listener));
    });
  },
  remove(listener) {
    listener.dependencies.forEach((target) => {
      const manager = targetManagers.get(target);
      manager.remove(listener);
      if (!manager.listenerCount)
        targetManagers.delete(target);
    });
    if (!targetManagers.size)
      document.removeEventListener("scroll", scrollHandler, true);
  }
};
function createContainer(opts) {
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.top = "0";
  container.style.left = "0";
  container.style.zIndex = opts.zIndex.toString();
  container.style.transition = `opacity ${opts.duration} ${opts.easing} 0s`;
  document.body.appendChild(container);
  const scrollListener = {
    dependencies: opts.relativeTo,
    handler({ x, y: y2 }) {
      container.style.transform = `translate(${x}px, ${y2}px)`;
    }
  };
  ScrollManager.add(scrollListener);
  return {
    setOpacity(opacity) {
      container.style.opacity = opacity;
    },
    add(start, end) {
      [start, end].forEach((el) => {
        if (opts.compositeOnly)
          el._makeCompositeOnly();
        el._setParent(container);
        el.setStyle("opacity", 1);
      });
    },
    destroy(start, end, canceled) {
      return __awaiter$1(this, void 0, void 0, function* () {
        if (typeof opts.beforeDetach === "function") {
          yield opts.beforeDetach(start, end, canceled);
        }
        ScrollManager.remove(scrollListener);
        start.detach();
        end.detach();
        container.remove();
      });
    }
  };
}
function illusory(from, to, options) {
  const opts = Object.assign(Object.assign({}, DEFAULT_OPTIONS$1), options);
  const convert = (target) => target instanceof IllusoryElement ? target : new IllusoryElement(target, opts.element);
  const start = convert(from);
  const end = convert(to);
  start.setStyle("zIndex", 1);
  end.setStyle("zIndex", 2);
  const container = createContainer(opts);
  container.add(start, end);
  container.setOpacity(start.getStyle("opacity"));
  const ref2 = {
    cancel: () => {
      throw new Error("Cancel called before assigned");
    }
  };
  return {
    finished: animate(start, end, container, opts, ref2),
    cancel: () => {
      ref2.cancel();
    }
  };
}
function animate(start, end, container, opts, cancelRef) {
  return new Promise((finished) => __awaiter$1(this, void 0, void 0, function* () {
    let canceled = false;
    const cancel = () => __awaiter$1(this, void 0, void 0, function* () {
      canceled = true;
      yield container.destroy(start, end, canceled);
      finished(canceled);
    });
    cancelRef.cancel = cancel;
    end.hide();
    end._to(start);
    if (typeof opts.beforeAnimate === "function")
      yield Promise.resolve(opts.beforeAnimate(start, end));
    if (canceled)
      return;
    start._enableTransitions(opts);
    end._enableTransitions(opts);
    flushCSSUpdates(start, end);
    start._to(end);
    end._to(end);
    if (!end._ignoreTransparency && (end._hasTransparentBackground() || opts.compositeOnly))
      start.hide();
    end.show();
    container.setOpacity(end.getStyle("opacity"));
    yield end.waitFor("any");
    if (canceled)
      return;
    yield container.destroy(start, end, canceled);
    finished(canceled);
  }));
}
/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
var __assign = function() {
  __assign = Object.assign || function __assign2(t) {
    for (var s2, i = 1, n = arguments.length; i < n; i++) {
      s2 = arguments[i];
      for (var p2 in s2)
        if (Object.prototype.hasOwnProperty.call(s2, p2))
          t[p2] = s2[p2];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) {
    return value instanceof P ? value : new P(function(resolve2) {
      resolve2(value);
    });
  }
  return new (P || (P = Promise))(function(resolve2, reject) {
    function fulfilled(value) {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }
    function rejected(value) {
      try {
        step(generator["throw"](value));
      } catch (e) {
        reject(e);
      }
    }
    function step(result) {
      result.done ? resolve2(result.value) : adopt(result.value).then(fulfilled, rejected);
    }
    step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}
function __generator(thisArg, body) {
  var _ = { label: 0, sent: function() {
    if (t[0] & 1)
      throw t[1];
    return t[1];
  }, trys: [], ops: [] }, f, y2, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
    return this;
  }), g;
  function verb(n) {
    return function(v) {
      return step([n, v]);
    };
  }
  function step(op) {
    if (f)
      throw new TypeError("Generator is already executing.");
    while (_)
      try {
        if (f = 1, y2 && (t = op[0] & 2 ? y2["return"] : op[0] ? y2["throw"] || ((t = y2["return"]) && t.call(y2), 0) : y2.next) && !(t = t.call(y2, op[1])).done)
          return t;
        if (y2 = 0, t)
          op = [op[0] & 2, t.value];
        switch (op[0]) {
          case 0:
          case 1:
            t = op;
            break;
          case 4:
            _.label++;
            return { value: op[1], done: false };
          case 5:
            _.label++;
            y2 = op[1];
            op = [0];
            continue;
          case 7:
            op = _.ops.pop();
            _.trys.pop();
            continue;
          default:
            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
              _ = 0;
              continue;
            }
            if (op[0] === 3 && (!t || op[1] > t[0] && op[1] < t[3])) {
              _.label = op[1];
              break;
            }
            if (op[0] === 6 && _.label < t[1]) {
              _.label = t[1];
              t = op;
              break;
            }
            if (t && _.label < t[2]) {
              _.label = t[2];
              _.ops.push(op);
              break;
            }
            if (t[2])
              _.ops.pop();
            _.trys.pop();
            continue;
        }
        op = body.call(thisArg, _);
      } catch (e) {
        op = [6, e];
        y2 = 0;
      } finally {
        f = t = 0;
      }
    if (op[0] & 5)
      throw op[1];
    return { value: op[0] ? op[1] : void 0, done: true };
  }
}
var DEFAULT_OPTIONS = {
  easing: "ease",
  duration: "300ms",
  endDuration: "150ms",
  zIndex: 1,
  compositeOnly: false,
  includeChildren: true,
  ignoreTransparency: ["img"],
  restrictToViewport: true,
  restrictToRoutes: false
};
function hideElement(element) {
  element.style.animation = "none";
  element.style.transition = "none";
  element.style.opacity = "0";
}
function withinViewport(rect) {
  return rect.bottom >= 0 && rect.right >= 0 && rect.top <= window.innerHeight && rect.left <= window.innerWidth;
}
function createRouteGuard(sharedElementCandidates2, sharedElementCache2) {
  var SharedElementRouteGuard2 = function(to, from, next) {
    sharedElementCache2.clear();
    var subSharedElements = [];
    sharedElementCandidates2.forEach(function(candidate, id) {
      if (candidate.options.restrictToRoutes) {
        if (Array.isArray(candidate.options.restrictToRoutes)) {
          if (!candidate.options.restrictToRoutes.includes(to.path))
            return;
        } else if (typeof candidate.options.restrictToRoutes === "function") {
          if (!candidate.options.restrictToRoutes(to, from, id))
            return;
        }
      }
      if (candidate.options.restrictToViewport) {
        var bcr = candidate.element.getBoundingClientRect();
        if (!withinViewport(bcr))
          return;
      }
      var element = new IllusoryElement(candidate.element, {
        includeChildren: candidate.options.includeChildren,
        ignoreTransparency: candidate.options.ignoreTransparency,
        processClone: function(node, depth) {
          if (depth > 0 && (node instanceof HTMLElement || node instanceof SVGElement) && node.dataset.illusoryId && sharedElementCache2.has(node.dataset.illusoryId))
            subSharedElements.push(node);
          return node;
        }
      });
      sharedElementCache2.set(id, {
        id,
        element,
        options: candidate.options
      });
    });
    sharedElementCandidates2.clear();
    subSharedElements.forEach(function(el) {
      hideElement(el);
    });
    next();
  };
  var NuxtSharedElementRouteGuard = function(context) {
    var router = context.app.router;
    router.beforeEach(SharedElementRouteGuard2);
  };
  return { SharedElementRouteGuard: SharedElementRouteGuard2, NuxtSharedElementRouteGuard };
}
function nextFrame() {
  return new Promise(function(r) {
    return requestAnimationFrame(r);
  });
}
var sharedElementCandidates = new Map();
var sharedElementCache = new Map();
function trigger(activeElement, vnode, combinedOptions, id) {
  return __awaiter(this, void 0, void 0, function() {
    var cachedElement, finished;
    return __generator(this, function(_a2) {
      switch (_a2.label) {
        case 0:
          activeElement.dataset.illusoryId = id;
          sharedElementCandidates.set(id, {
            element: activeElement,
            options: combinedOptions
          });
          cachedElement = sharedElementCache.get(id);
          if (!cachedElement)
            return [2];
          finished = illusory(cachedElement.element, activeElement, {
            element: {
              includeChildren: combinedOptions.includeChildren,
              ignoreTransparency: cachedElement.options.ignoreTransparency,
              processClone: function(node, depth) {
                if (depth > 0 && (node instanceof HTMLElement || node instanceof SVGElement) && node.dataset.illusoryId && sharedElementCache.has(node.dataset.illusoryId)) {
                  hideElement(node);
                }
                return node;
              }
            },
            compositeOnly: cachedElement.options.compositeOnly,
            duration: cachedElement.options.duration,
            zIndex: cachedElement.options.zIndex,
            easing: cachedElement.options.easing,
            relativeTo: [],
            beforeAnimate: function(from, to) {
              return __awaiter(this, void 0, void 0, function() {
                return __generator(this, function(_a3) {
                  switch (_a3.label) {
                    case 0:
                      return [4, nextFrame()];
                    case 1:
                      _a3.sent();
                      to.rect = to.natural.getBoundingClientRect();
                      to.setStyle("left", to.rect.left + "px");
                      to.setStyle("top", to.rect.top + "px");
                      to._to(from);
                      return [4, nextFrame()];
                    case 2:
                      _a3.sent();
                      return [2];
                  }
                });
              });
            },
            beforeDetach: function(from, to) {
              if (combinedOptions.includeChildren || !combinedOptions.endDuration || parseFloat(combinedOptions.endDuration) <= 0)
                return;
              from.hide();
              to.showNatural();
              to.setStyle("transition", "opacity " + combinedOptions.endDuration);
              to.hide();
              return to.waitFor("opacity");
            }
          }).finished;
          return [4, finished];
        case 1:
          _a2.sent();
          return [2];
      }
    });
  });
}
var $createIllusoryElement = function(el, opts) {
  return new IllusoryElement(el, opts);
};
var insertedMounted = function(options) {
  if (options === void 0) {
    options = {};
  }
  return function(activeElement, binding, vnode) {
    return __awaiter(void 0, void 0, void 0, function() {
      var combinedOptions, id;
      var _a2;
      return __generator(this, function(_b) {
        combinedOptions = __assign(__assign(__assign({}, DEFAULT_OPTIONS), options), binding.value);
        id = binding.arg;
        if (!id)
          throw new Error("Missing ID on a v-shared-element. For usage see: https://github.com/justintaddei/v-shared-element#readme");
        if ((_a2 = binding.value) === null || _a2 === void 0 ? void 0 : _a2.$keepSharedElementAlive)
          binding.value.$keepSharedElementAlive(function() {
            trigger(activeElement, vnode, combinedOptions, id);
          });
        trigger(activeElement, vnode, combinedOptions, id);
        return [2];
      });
    });
  };
};
var isVue3 = function(app) {
  return "config" in app && "globalProperties" in app.config;
};
var SharedElementDirective = {
  install: function(app, options) {
    if (!isVue3(app)) {
      app.prototype.$illusory = illusory;
      app.prototype.$createIllusoryElement = $createIllusoryElement;
      app.directive("shared-element", {
        inserted: insertedMounted(options)
      });
      return;
    }
    app.config.globalProperties.$illusory = illusory;
    app.config.globalProperties.$createIllusoryElement = $createIllusoryElement;
    app.directive("shared-element", {
      mounted: insertedMounted(options)
    });
  }
};
var createSharedElementDirective = function(options) {
  if (options === void 0) {
    options = {};
  }
  return {
    install: function(app, _options) {
      return SharedElementDirective.install(app, options);
    }
  };
};
var _a = createRouteGuard(sharedElementCandidates, sharedElementCache), SharedElementRouteGuard = _a.SharedElementRouteGuard;
export { primebus as $, unref as A, script as B, ref as C, useMeta as D, onMounted as E, Fragment as F, createRouter as G, createWebHistory as H, createSSRApp as I, ConfirmationService as J, PrimeVueConfirmSymbol as K, PrimeVueToastSymbol as L, StyleClass as M, BadgeDirective as N, createMetaManager as O, PrimeVue as P, sockjs_min as Q, Ripple as R, Suspense as S, ToastService as T, createSharedElementDirective as U, SharedElementRouteGuard as V, DomHandler as W, createStaticVNode as X, pushScopeId as Y, popScopeId as Z, ObjectUtils as _, createCommentVNode as a, ZIndexUtils as a0, ConnectedOverlayScrollHandler as a1, Teleport as a2, Transition as a3, useRoute as a4, useRouter as a5, createBaseVNode as b, createElementBlock as c, createDebug as d, reactive as e, onErrorCaptured as f, createBlock as g, guardReactiveProps as h, renderList as i, createTextVNode as j, resolveDynamicComponent as k, normalizeClass as l, mergeProps as m, normalizeProps as n, openBlock as o, normalizeStyle as p, resolveComponent as q, renderSlot as r, computed as s, toDisplayString as t, watch as u, browser as v, withCtx as w, resolveDirective as x, withDirectives as y, createVNode as z };
