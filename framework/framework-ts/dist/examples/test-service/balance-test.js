var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
try {
    // @ts-ignore
    Symbol.metadata ?? (Symbol.metadata = Symbol("Symbol.metadata"));
}
catch (e) { }
import { PropertyOfAny, Model, Property, modelConfigSymbol } from '../../src/index.js';
/* @PropertyOfAny({
  readAccessControl: {
    roles: ['owner', 'admin']
  }
}) */
const definition = "!";
const currencyZero = 0;
const currencyConfig = {
    type: Number,
    default: currencyZero
};
let Balance = (() => {
    let _classDecorators = [PropertyOfAny({
            readAccessControl: {
                roles: ['owner', 'admin']
            }
        }), Model(definition)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _available_decorators;
    let _available_initializers = [];
    let _available_extraInitializers = [];
    let _amount_decorators;
    let _amount_initializers = [];
    let _amount_extraInitializers = [];
    let _lastUpdate_decorators;
    let _lastUpdate_initializers = [];
    let _lastUpdate_extraInitializers = [];
    var Balance = _classThis = class {
        constructor() {
            Object.defineProperty(this, "owner", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            }); /// will be auto-generated
            Object.defineProperty(this, "ownerType", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: void 0
            }); /// will be auto-generated
            Object.defineProperty(this, "available", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: __runInitializers(this, _available_initializers, void 0)
            });
            Object.defineProperty(this, "amount", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: (__runInitializers(this, _available_extraInitializers), __runInitializers(this, _amount_initializers, void 0))
            });
            Object.defineProperty(this, "lastUpdate", {
                enumerable: true,
                configurable: true,
                writable: true,
                value: (__runInitializers(this, _amount_extraInitializers), __runInitializers(this, _lastUpdate_initializers, void 0))
            });
            __runInitializers(this, _lastUpdate_extraInitializers);
        }
    };
    __setFunctionName(_classThis, "Balance");
    (() => {
        const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        _available_decorators = [Property(currencyConfig)];
        _amount_decorators = [Property(currencyConfig)];
        _lastUpdate_decorators = [Property()];
        __esDecorate(null, null, _available_decorators, { kind: "field", name: "available", static: false, private: false, access: { has: obj => "available" in obj, get: obj => obj.available, set: (obj, value) => { obj.available = value; } }, metadata: _metadata }, _available_initializers, _available_extraInitializers);
        __esDecorate(null, null, _amount_decorators, { kind: "field", name: "amount", static: false, private: false, access: { has: obj => "amount" in obj, get: obj => obj.amount, set: (obj, value) => { obj.amount = value; } }, metadata: _metadata }, _amount_initializers, _amount_extraInitializers);
        __esDecorate(null, null, _lastUpdate_decorators, { kind: "field", name: "lastUpdate", static: false, private: false, access: { has: obj => "lastUpdate" in obj, get: obj => obj.lastUpdate, set: (obj, value) => { obj.lastUpdate = value; } }, metadata: _metadata }, _lastUpdate_initializers, _lastUpdate_extraInitializers);
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        Balance = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return Balance = _classThis;
})();
export { Balance };
setTimeout(() => {
    console.log("KURWA");
    console.log('B!!', Balance);
    console.log('BP!', Balance.prototype);
    console.log("M", Balance[Symbol.metadata]);
    let b = Balance;
    let md = Balance[Symbol.metadata];
    console.log("MC", md[modelConfigSymbol]);
}, 100);
//# sourceMappingURL=balance-test.js.map