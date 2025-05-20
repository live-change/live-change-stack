[**@live-change/framework v0.9.84**](../README.md)

***

[@live-change/framework](../README.md) / ActionDefinition

# Class: ActionDefinition\<T\>

Defined in: [lib/definition/ActionDefinition.ts:16](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ActionDefinition.ts#L16)

## Type Parameters

### T

`T` *extends* [`ActionDefinitionSpecification`](../interfaces/ActionDefinitionSpecification.md)

## Indexable

\[`key`: `string`\]: `any`

## Constructors

### Constructor

> **new ActionDefinition**\<`T`\>(`definition`): `ActionDefinition`\<`T`\>

Defined in: [lib/definition/ActionDefinition.ts:19](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ActionDefinition.ts#L19)

#### Parameters

##### definition

`T`

#### Returns

`ActionDefinition`\<`T`\>

## Methods

### createAndAddProperty()

> **createAndAddProperty**(`name`, `definition`): `void`

Defined in: [lib/definition/ActionDefinition.ts:34](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ActionDefinition.ts#L34)

#### Parameters

##### name

`any`

##### definition

`any`

#### Returns

`void`

***

### toJSON()

> **toJSON**(): `ActionDefinition`\<`T`\> & `object`

Defined in: [lib/definition/ActionDefinition.ts:39](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ActionDefinition.ts#L39)

#### Returns

`ActionDefinition`\<`T`\> & `object`
