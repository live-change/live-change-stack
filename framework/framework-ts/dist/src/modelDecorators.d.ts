import { ModelIndexDefinitionSpecification, ModelPropertyDefinitionSpecification } from "@live-change/framework/lib/definition/ModelDefinition.js";
import { BoundToAnyConfig, BoundToConfig, ItemOfAnyConfig, ItemOfConfig, ModelWithRelations, PropertyOfAnyConfig, PropertyOfConfig, RelatedToAnyConfig, RelatedToConfig, SaveAuthorConfig } from "@live-change/relations-plugin";
import { CrudSettings, Identifier } from "@live-change/relations-plugin/src/types.js";
export declare class ModelConfig implements ModelWithRelations {
    crud: CrudSettings;
    identifiers: Identifier[];
    name: string;
    properties: Record<string, ModelPropertyDefinitionSpecification>;
    indexes: Record<string, ModelIndexDefinitionSpecification>;
    onChange: (() => void)[];
    accessControlParents?: (what: {
        object: string;
    }) => Promise<{
        objectType: string;
        object: any;
    }[]>;
    accessControlParentsSource?: {
        property: string;
        type: string;
    }[];
    itemOf?: ItemOfConfig;
    propertyOf?: PropertyOfConfig;
    itemOfAny?: ItemOfAnyConfig;
    propertyOfAny?: PropertyOfAnyConfig;
    relatedTo?: RelatedToConfig;
    relatedToAny?: RelatedToAnyConfig;
    boundTo?: BoundToConfig;
    boundToAny?: BoundToAnyConfig;
    saveAuthor?: SaveAuthorConfig;
}
export declare const modelConfigSymbol: unique symbol;
export declare const modelServiceDefinitionSymbol: unique symbol;
export declare function Property(config?: ModelPropertyDefinitionSpecification | undefined): (target: any, context: ClassFieldDecoratorContext) => void;
export declare function Model(serviceDefinition: any, additionalConfig?: {}): (target: any, context: ClassDecoratorContext) => void;
export declare function ItemOf(config: ItemOfConfig): (target: any, context: ClassFieldDecoratorContext) => void;
export declare function ItemOfAny(config: ItemOfAnyConfig): (target: any, context: ClassDecoratorContext) => void;
export declare function PropertyOf(config: PropertyOfConfig): (target: any, context: ClassFieldDecoratorContext) => void;
export declare function PropertyOfAny(config: PropertyOfAnyConfig): (target: any, context: ClassDecoratorContext) => void;
export declare function RelatedTo(config: RelatedToConfig): (target: any, context: ClassFieldDecoratorContext) => void;
export declare function RelatedToAny(config: RelatedToAnyConfig): (target: any, context: ClassDecoratorContext) => void;
export declare function BoundTo(config: BoundToConfig): (target: any, context: ClassFieldDecoratorContext) => void;
export declare function BoundToAny(config: BoundToAnyConfig): (target: any, context: ClassDecoratorContext) => void;
export declare function SaveAuthor(config: SaveAuthorConfig): (target: any, context: ClassDecoratorContext) => void;
