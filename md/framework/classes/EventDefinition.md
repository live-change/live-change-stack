[**@live-change/framework v0.9.84**](../README.md)

***

[@live-change/framework](../README.md) / EventDefinition

# Class: EventDefinition\<T\>

Defined in: [lib/definition/EventDefinition.ts:11](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/EventDefinition.ts#L11)

## Type Parameters

### T

`T` *extends* [`EventDefinitionSpecification`](../interfaces/EventDefinitionSpecification.md)

## Indexable

\[`key`: `string`\]: `any`

## Constructors

### Constructor

> **new EventDefinition**\<`T`\>(`definition`): `EventDefinition`\<`T`\>

Defined in: [lib/definition/EventDefinition.ts:14](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/EventDefinition.ts#L14)

#### Parameters

##### definition

`T`

#### Returns

`EventDefinition`\<`T`\>

## Methods

### createAndAddProperty()

> **createAndAddProperty**(`name`, `definition`): `void`

Defined in: [lib/definition/EventDefinition.ts:26](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/EventDefinition.ts#L26)

#### Parameters

##### name

`any`

##### definition

`any`

#### Returns

`void`

***

### event()

> **event**(`params`): `any`

Defined in: [lib/definition/EventDefinition.ts:44](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/EventDefinition.ts#L44)

#### Parameters

##### params

`any`

#### Returns

`any`

***

### toJSON()

> **toJSON**(): `EventDefinition`\<`T`\> & `object`

Defined in: [lib/definition/EventDefinition.ts:31](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/EventDefinition.ts#L31)

#### Returns

`EventDefinition`\<`T`\> & `object`
