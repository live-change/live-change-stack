import { ModelIndexDefinitionSpecification, ModelPropertyDefinitionSpecification, ValidationConfig } from "@live-change/framework/lib/definition/ModelDefinition.js"
import { BoundToAnyConfig, BoundToConfig, ItemOfAnyConfig, ItemOfConfig, ModelWithRelations, PropertyOfAnyConfig, PropertyOfConfig, RelatedToAnyConfig, RelatedToConfig, SaveAuthorConfig } from "@live-change/relations-plugin"
import { CrudSettings, Identifier } from "@live-change/relations-plugin/src/types.js"

export class ModelConfig implements ModelWithRelations {
  crud: CrudSettings
  identifiers: Identifier[]
  name: string
  properties: Record<string, ModelPropertyDefinitionSpecification> = {}
  indexes: Record<string, ModelIndexDefinitionSpecification> = {}
  onChange: (() => void)[] = []
  accessControlParents?: (what: { object: string }) => Promise<{ objectType: string, object: any }[]>
  accessControlParentsSource?: { property: string, type: string }[]
  itemOf?: ItemOfConfig
  propertyOf?: PropertyOfConfig
  itemOfAny?: ItemOfAnyConfig
  propertyOfAny?: PropertyOfAnyConfig
  relatedTo?: RelatedToConfig
  relatedToAny?: RelatedToAnyConfig
  boundTo?: BoundToConfig
  boundToAny?: BoundToAnyConfig
  saveAuthor?: SaveAuthorConfig
}

export const modelConfigSymbol = Symbol("modelConfig")
export const modelServiceDefinitionSymbol = Symbol("modelServiceDefinition")

export function Property(config: ModelPropertyDefinitionSpecification | undefined = undefined) {
  return function actualDecorator(target: any, context: ClassFieldDecoratorContext) {
    const modelConfig : ModelConfig = (context.metadata[modelConfigSymbol] as ModelConfig | undefined) ??= new ModelConfig();
    modelConfig.properties = modelConfig.properties ?? {}
    modelConfig.properties[context.name.toString()] = config ?? ({} as ModelPropertyDefinitionSpecification)
  }
}


export function Model(serviceDefinition, additionalConfig = {}) {
  return function actualDecorator(target: any, context: ClassDecoratorContext) {    
    context.metadata[modelServiceDefinitionSymbol] = serviceDefinition
    const modelConfig : ModelConfig = (context.metadata[modelConfigSymbol] as ModelConfig | undefined) ??= new ModelConfig();
    for(const key in additionalConfig) {
      modelConfig[key] = additionalConfig[key]
    }
    console.log("Model decorator", target, context, JSON.stringify(modelConfig, null, 2))
  } 
}

export function ItemOf(config: ItemOfConfig) {
  return function actualDecorator(target: any, context: ClassFieldDecoratorContext) {
    const modelConfig : ModelConfig = (context.metadata[modelConfigSymbol] as ModelConfig | undefined) ??= new ModelConfig();
    modelConfig.itemOf = config
  }
}

export function ItemOfAny(config: ItemOfAnyConfig) {
  return function actualDecorator(target: any, context: ClassDecoratorContext) {
    const modelConfig : ModelConfig = (context.metadata[modelConfigSymbol] as ModelConfig | undefined) ??= new ModelConfig();
    modelConfig.itemOfAny = config
  }
}

export function PropertyOf(config: PropertyOfConfig) {
  return function actualDecorator(target: any, context: ClassFieldDecoratorContext) {
    const modelConfig : ModelConfig = (context.metadata[modelConfigSymbol] as ModelConfig | undefined) ??= new ModelConfig();
    modelConfig.propertyOf = config
  }
}

export function PropertyOfAny(config: PropertyOfAnyConfig) {
  return function actualDecorator(target: any, context: ClassDecoratorContext) {
    const modelConfig : ModelConfig = (context.metadata[modelConfigSymbol] as ModelConfig | undefined) ??= new ModelConfig();
    modelConfig.propertyOfAny = {
      ...config,
      typeAndId: true
    }
  }
}

export function RelatedTo(config: RelatedToConfig) {
  return function actualDecorator(target: any, context: ClassFieldDecoratorContext) {
    const modelConfig : ModelConfig = (context.metadata[modelConfigSymbol] as ModelConfig | undefined) ??= new ModelConfig();
    modelConfig.relatedTo = config
  }
}

export function RelatedToAny(config: RelatedToAnyConfig) {
  return function actualDecorator(target: any, context: ClassDecoratorContext) {
    const modelConfig : ModelConfig = (context.metadata[modelConfigSymbol] as ModelConfig | undefined) ??= new ModelConfig();
    modelConfig.relatedToAny = { 
      ...config,
      typeAndId: true
    }
  }
}

export function BoundTo(config: BoundToConfig) {
  return function actualDecorator(target: any, context: ClassFieldDecoratorContext) {
    const modelConfig : ModelConfig = (context.metadata[modelConfigSymbol] as ModelConfig | undefined) ??= new ModelConfig();
    modelConfig.boundTo = config
  }
}

export function BoundToAny(config: BoundToAnyConfig) {
  return function actualDecorator(target: any, context: ClassDecoratorContext) {
    const modelConfig : ModelConfig = (context.metadata[modelConfigSymbol] as ModelConfig | undefined) ??= new ModelConfig();
    modelConfig.boundToAny = {
      ...config,
      typeAndId: true
    }
  }
}

export function SaveAuthor(config: SaveAuthorConfig) {
  return function actualDecorator(target: any, context: ClassDecoratorContext) {
    const modelConfig : ModelConfig = (context.metadata[modelConfigSymbol] as ModelConfig | undefined) ??= new ModelConfig();
    modelConfig.saveAuthor = config
  }
}

export function Index(config: ModelIndexDefinitionSpecification) {
  return function actualDecorator(target: any, context: ClassFieldDecoratorContext) {
    console.log("Index decorator", ...arguments)
    const modelConfig : ModelConfig = (context.metadata[modelConfigSymbol] as ModelConfig | undefined) ??= new ModelConfig();
    modelConfig.indexes[context.name.toString()] = config
  }
}

export function Default(valueOrFunction: any) {
  return function actualDecorator(target: any, context: ClassFieldDecoratorContext) {
    const modelConfig : ModelConfig = (context.metadata[modelConfigSymbol] as ModelConfig | undefined) ??= new ModelConfig();
    modelConfig.properties[context.name.toString()] = {
      ...modelConfig.properties[context.name.toString()],
      default: valueOrFunction
    }
  }
}

export function Updated(valueOrFunction: any) {
  return function actualDecorator(target: any, context: ClassFieldDecoratorContext) {
    const modelConfig : ModelConfig = (context.metadata[modelConfigSymbol] as ModelConfig | undefined) ??= new ModelConfig();
    modelConfig.properties[context.name.toString()] = {
      ...modelConfig.properties[context.name.toString()],
      updated: valueOrFunction
    }
  }
}

export function Validation(validation: ValidationConfig[] | ValidationConfig) {
  const validationConfig = Array.isArray(validation) ? validation : [validation]
  return function actualDecorator(target: any, context: ClassFieldDecoratorContext) {
    const modelConfig : ModelConfig = (context.metadata[modelConfigSymbol] as ModelConfig | undefined) ??= new ModelConfig();
    modelConfig.properties[context.name.toString()] = {
      ...modelConfig.properties[context.name.toString()],
      validation: [
        ...(modelConfig.properties[context.name.toString()].validation ?? []),
        ...validationConfig]        
    }
  }
}