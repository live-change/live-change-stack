[**@live-change/framework v0.9.84**](../README.md)

***

[@live-change/framework](../README.md) / ViewDefinitionSpecificationObservable

# Interface: ViewDefinitionSpecificationObservable

Defined in: [lib/definition/ViewDefinition.ts:18](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L18)

## Extends

- [`ViewDefinitionSpecificationBase`](ViewDefinitionSpecificationBase.md)

## Properties

### access?

> `optional` **access**: [`AccessSpecification`](../type-aliases/AccessSpecification.md)

Defined in: [lib/definition/ViewDefinition.ts:13](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L13)

#### Inherited from

[`ViewDefinitionSpecificationBase`](ViewDefinitionSpecificationBase.md).[`access`](ViewDefinitionSpecificationBase.md#access)

***

### get()

> **get**: (`parameters`, `context`) => `Promise`\<`any`\>

Defined in: [lib/definition/ViewDefinition.ts:20](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L20)

#### Parameters

##### parameters

`Record`\<`string`, `any`\>

##### context

[`ViewContext`](ViewContext.md)

#### Returns

`Promise`\<`any`\>

***

### global?

> `optional` **global**: `boolean`

Defined in: [lib/definition/ViewDefinition.ts:12](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L12)

#### Inherited from

[`ViewDefinitionSpecificationBase`](ViewDefinitionSpecificationBase.md).[`global`](ViewDefinitionSpecificationBase.md#global)

***

### internal?

> `optional` **internal**: `boolean`

Defined in: [lib/definition/ViewDefinition.ts:11](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L11)

#### Inherited from

[`ViewDefinitionSpecificationBase`](ViewDefinitionSpecificationBase.md).[`internal`](ViewDefinitionSpecificationBase.md#internal)

***

### name

> **name**: `string`

Defined in: [lib/definition/ViewDefinition.ts:8](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L8)

#### Inherited from

[`ViewDefinitionSpecificationBase`](ViewDefinitionSpecificationBase.md).[`name`](ViewDefinitionSpecificationBase.md#name)

***

### observable()

> **observable**: (`parameters`, `context`) => `any`

Defined in: [lib/definition/ViewDefinition.ts:19](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L19)

#### Parameters

##### parameters

`Record`\<`string`, `any`\>

##### context

[`ViewContext`](ViewContext.md)

#### Returns

`any`

***

### properties

> **properties**: `Record`\<`string`, [`PropertyDefinitionSpecification`](PropertyDefinitionSpecification.md)\>

Defined in: [lib/definition/ViewDefinition.ts:9](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L9)

#### Inherited from

[`ViewDefinitionSpecificationBase`](ViewDefinitionSpecificationBase.md).[`properties`](ViewDefinitionSpecificationBase.md#properties)

***

### returns

> **returns**: [`PropertyDefinitionSpecification`](PropertyDefinitionSpecification.md)

Defined in: [lib/definition/ViewDefinition.ts:10](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L10)

#### Inherited from

[`ViewDefinitionSpecificationBase`](ViewDefinitionSpecificationBase.md).[`returns`](ViewDefinitionSpecificationBase.md#returns)

***

### skipValidation?

> `optional` **skipValidation**: `boolean`

Defined in: [lib/definition/ViewDefinition.ts:14](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L14)

#### Inherited from

[`ViewDefinitionSpecificationBase`](ViewDefinitionSpecificationBase.md).[`skipValidation`](ViewDefinitionSpecificationBase.md#skipvalidation)

***

### validation()?

> `optional` **validation**: (`parameters`, `context`) => `Promise`\<`any`\>

Defined in: [lib/definition/ViewDefinition.ts:15](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L15)

#### Parameters

##### parameters

`Record`\<`string`, `any`\>

##### context

[`ViewContext`](ViewContext.md)

#### Returns

`Promise`\<`any`\>

#### Inherited from

[`ViewDefinitionSpecificationBase`](ViewDefinitionSpecificationBase.md).[`validation`](ViewDefinitionSpecificationBase.md#validation)
