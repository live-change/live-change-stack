export class ModelConfig {
    constructor() {
        Object.defineProperty(this, "crud", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "identifiers", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "name", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "properties", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "indexes", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "onChange", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "accessControlParents", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "accessControlParentsSource", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "itemOf", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "propertyOf", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "itemOfAny", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "propertyOfAny", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "relatedTo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "relatedToAny", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "boundTo", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "boundToAny", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "saveAuthor", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
    }
}
export const modelConfigSymbol = Symbol("modelConfig");
export const modelServiceDefinitionSymbol = Symbol("modelServiceDefinition");
export function Property(config = undefined) {
    return function actualDecorator(target, context) {
        const modelConfig = context.metadata[modelConfigSymbol] ?? (context.metadata[modelConfigSymbol] = new ModelConfig());
        modelConfig.properties = modelConfig.properties ?? {};
        modelConfig.properties[context.name.toString()] = config ?? {};
    };
}
export function Model(serviceDefinition, additionalConfig = {}) {
    return function actualDecorator(target, context) {
        context.metadata[modelServiceDefinitionSymbol] = serviceDefinition;
        const modelConfig = context.metadata[modelConfigSymbol] ?? (context.metadata[modelConfigSymbol] = new ModelConfig());
        for (const key in additionalConfig) {
            modelConfig[key] = additionalConfig[key];
        }
    };
}
export function ItemOf(config) {
    return function actualDecorator(target, context) {
        const modelConfig = context.metadata[modelConfigSymbol] ?? (context.metadata[modelConfigSymbol] = new ModelConfig());
        modelConfig.itemOf = config;
    };
}
export function ItemOfAny(config) {
    return function actualDecorator(target, context) {
        const modelConfig = context.metadata[modelConfigSymbol] ?? (context.metadata[modelConfigSymbol] = new ModelConfig());
        modelConfig.itemOfAny = config;
    };
}
export function PropertyOf(config) {
    return function actualDecorator(target, context) {
        const modelConfig = context.metadata[modelConfigSymbol] ?? (context.metadata[modelConfigSymbol] = new ModelConfig());
        modelConfig.propertyOf = config;
    };
}
export function PropertyOfAny(config) {
    return function actualDecorator(target, context) {
        const modelConfig = context.metadata[modelConfigSymbol] ?? (context.metadata[modelConfigSymbol] = new ModelConfig());
        modelConfig.propertyOfAny = config;
    };
}
export function RelatedTo(config) {
    return function actualDecorator(target, context) {
        const modelConfig = context.metadata[modelConfigSymbol] ?? (context.metadata[modelConfigSymbol] = new ModelConfig());
        modelConfig.relatedTo = config;
    };
}
export function RelatedToAny(config) {
    return function actualDecorator(target, context) {
        const modelConfig = context.metadata[modelConfigSymbol] ?? (context.metadata[modelConfigSymbol] = new ModelConfig());
        modelConfig.relatedToAny = config;
    };
}
export function BoundTo(config) {
    return function actualDecorator(target, context) {
        const modelConfig = context.metadata[modelConfigSymbol] ?? (context.metadata[modelConfigSymbol] = new ModelConfig());
        modelConfig.boundTo = config;
    };
}
export function BoundToAny(config) {
    return function actualDecorator(target, context) {
        const modelConfig = context.metadata[modelConfigSymbol] ?? (context.metadata[modelConfigSymbol] = new ModelConfig());
        modelConfig.boundToAny = config;
    };
}
export function SaveAuthor(config) {
    return function actualDecorator(target, context) {
        const modelConfig = context.metadata[modelConfigSymbol] ?? (context.metadata[modelConfigSymbol] = new ModelConfig());
        modelConfig.saveAuthor = config;
    };
}
//# sourceMappingURL=modelDecorators.js.map