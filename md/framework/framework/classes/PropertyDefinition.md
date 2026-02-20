[**@live-change/framework v0.9.194**](../README.md)

***

[@live-change/framework](../README.md) / PropertyDefinition

# Class: PropertyDefinition\<T\>

Defined in: [lib/definition/PropertyDefinition.ts:22](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/PropertyDefinition.ts#L22)

## Type Parameters

### T

`T` *extends* [`PropertyDefinitionSpecification`](../interfaces/PropertyDefinitionSpecification.md)

## Indexable

\[`key`: `string`\]: `any`

## Constructors

### Constructor

> **new PropertyDefinition**\<`T`\>(`definition`): `PropertyDefinition`\<`T`\>

Defined in: [lib/definition/PropertyDefinition.ts:25](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/PropertyDefinition.ts#L25)

#### Parameters

##### definition

`T`

#### Returns

`PropertyDefinition`\<`T`\>

## Methods

### computeChanges()

> **computeChanges**(`oldProperty`, `params`, `name`): `Record`\<`string`, `any`\>[]

Defined in: [lib/definition/PropertyDefinition.ts:70](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/PropertyDefinition.ts#L70)

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

Defined in: [lib/definition/PropertyDefinition.ts:42](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/PropertyDefinition.ts#L42)

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

Defined in: [lib/definition/PropertyDefinition.ts:47](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/PropertyDefinition.ts#L47)

#### Returns

`any`
