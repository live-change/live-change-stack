[**@live-change/relations-plugin v0.9.84**](../README.md)

***

[@live-change/relations-plugin](../globals.md) / MotelWithRelations

# Interface: MotelWithRelations

Defined in: [relations-plugin/src/index.ts:36](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/relations-plugin/src/index.ts#L36)

## Extends

- `ModelDefinitionSpecificationWithAccessControl`

## Properties

### accessControlParents()?

> `optional` **accessControlParents**: (`what`) => `Promise`\<`object`[]\>

Defined in: [relations-plugin/src/types.ts:61](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/relations-plugin/src/types.ts#L61)

#### Parameters

##### what

###### object

`string`

#### Returns

`Promise`\<`object`[]\>

#### Inherited from

`ModelDefinitionSpecificationWithAccessControl.accessControlParents`

***

### accessControlParentsSource?

> `optional` **accessControlParentsSource**: `object`[]

Defined in: [relations-plugin/src/types.ts:62](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/relations-plugin/src/types.ts#L62)

#### property

> **property**: `string`

#### type

> **type**: `string`

#### Inherited from

`ModelDefinitionSpecificationWithAccessControl.accessControlParentsSource`

***

### accessRoles?

> `optional` **accessRoles**: `string`[]

Defined in: [relations-plugin/src/types.ts:63](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/relations-plugin/src/types.ts#L63)

#### Inherited from

`ModelDefinitionSpecificationWithAccessControl.accessRoles`

***

### boundTo

> **boundTo**: [`BoundToConfig`](BoundToConfig.md)

Defined in: [relations-plugin/src/index.ts:43](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/relations-plugin/src/index.ts#L43)

***

### boundToAny

> **boundToAny**: [`BoundToAnyConfig`](BoundToAnyConfig.md)

Defined in: [relations-plugin/src/index.ts:44](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/relations-plugin/src/index.ts#L44)

***

### crud

> **crud**: `CrudSettings`

Defined in: [relations-plugin/src/types.ts:56](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/relations-plugin/src/types.ts#L56)

#### Inherited from

`ModelDefinitionSpecificationWithAccessControl.crud`

***

### identifiers

> **identifiers**: `Identifier`[]

Defined in: [relations-plugin/src/types.ts:57](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/relations-plugin/src/types.ts#L57)

#### Inherited from

`ModelDefinitionSpecificationWithAccessControl.identifiers`

***

### indexes

> **indexes**: `Record`\<`string`, `ModelIndexDefinitionSpecification`\>

Defined in: [framework/lib/definition/ModelDefinition.ts:21](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/framework/lib/definition/ModelDefinition.ts#L21)

#### Inherited from

`ModelDefinitionSpecificationWithAccessControl.indexes`

***

### itemOf

> **itemOf**: [`ItemOfConfig`](ItemOfConfig.md)

Defined in: [relations-plugin/src/index.ts:38](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/relations-plugin/src/index.ts#L38)

***

### itemOfAny

> **itemOfAny**: [`ItemOfAnyConfig`](ItemOfAnyConfig.md)

Defined in: [relations-plugin/src/index.ts:40](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/relations-plugin/src/index.ts#L40)

***

### name

> **name**: `string`

Defined in: [framework/lib/definition/ModelDefinition.ts:19](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/framework/lib/definition/ModelDefinition.ts#L19)

#### Inherited from

`ModelDefinitionSpecificationWithAccessControl.name`

***

### onChange

> **onChange**: () => `void`[]

Defined in: [framework/lib/definition/ModelDefinition.ts:22](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/framework/lib/definition/ModelDefinition.ts#L22)

#### Returns

`void`

#### Inherited from

`ModelDefinitionSpecificationWithAccessControl.onChange`

***

### properties

> **properties**: `Record`\<`string`, `ModelPropertyDefinitionSpecification`\>

Defined in: [framework/lib/definition/ModelDefinition.ts:20](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/framework/lib/definition/ModelDefinition.ts#L20)

#### Inherited from

`ModelDefinitionSpecificationWithAccessControl.properties`

***

### propertyOf

> **propertyOf**: [`PropertyOfConfig`](PropertyOfConfig.md)

Defined in: [relations-plugin/src/index.ts:37](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/relations-plugin/src/index.ts#L37)

***

### propertyOfAny

> **propertyOfAny**: [`PropertyOfAnyConfig`](PropertyOfAnyConfig.md)

Defined in: [relations-plugin/src/index.ts:39](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/relations-plugin/src/index.ts#L39)

***

### relatedTo

> **relatedTo**: [`RelatedToConfig`](RelatedToConfig.md)

Defined in: [relations-plugin/src/index.ts:41](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/relations-plugin/src/index.ts#L41)

***

### relatedToAny

> **relatedToAny**: [`RelatedToAnyConfig`](RelatedToAnyConfig.md)

Defined in: [relations-plugin/src/index.ts:42](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/relations-plugin/src/index.ts#L42)

***

### saveAuthor

> **saveAuthor**: [`SaveAuthorConfig`](SaveAuthorConfig.md)

Defined in: [relations-plugin/src/index.ts:45](https://github.com/live-change/live-change-stack/blob/master/framework/relations-plugin/framework/relations-plugin/src/index.ts#L45)
