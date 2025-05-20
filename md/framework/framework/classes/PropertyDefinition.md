[**@live-change/framework v0.9.84**](../README.md)

***

[@live-change/framework](../README.md) / PropertyDefinition

# Class: PropertyDefinition\<T\>

Defined in: [lib/definition/PropertyDefinition.ts:21](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/PropertyDefinition.ts#L21)

## Type Parameters

### T

`T` *extends* [`PropertyDefinitionSpecification`](../interfaces/PropertyDefinitionSpecification.md)

## Indexable

\[`key`: `string`\]: `any`

## Constructors

### Constructor

> **new PropertyDefinition**\<`T`\>(`definition`): `PropertyDefinition`\<`T`\>

Defined in: [lib/definition/PropertyDefinition.ts:24](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/PropertyDefinition.ts#L24)

#### Parameters

##### definition

`T`

#### Returns

`PropertyDefinition`\<`T`\>

## Methods

### computeChanges()

> **computeChanges**(`oldProperty`, `params`, `name`): `Record`\<`string`, `any`\>[]

Defined in: [lib/definition/PropertyDefinition.ts:69](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/PropertyDefinition.ts#L69)

#### Parameters

##### oldProperty

`any`

##### params

`any`

##### name

`any`

#### Returns

`Record`\<`string`, `any`\>[]

***

### createAndAddProperty()

> **createAndAddProperty**(`name`, `definition`): `void`

Defined in: [lib/definition/PropertyDefinition.ts:41](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/PropertyDefinition.ts#L41)

#### Parameters

##### name

`any`

##### definition

`any`

#### Returns

`void`

***

### toJSON()

> **toJSON**(): `any`

Defined in: [lib/definition/PropertyDefinition.ts:46](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/PropertyDefinition.ts#L46)

#### Returns

`any`
