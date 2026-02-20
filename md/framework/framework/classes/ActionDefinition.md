[**@live-change/framework v0.9.194**](../README.md)

***

[@live-change/framework](../README.md) / ActionDefinition

# Class: ActionDefinition\<T\>

Defined in: [lib/definition/ActionDefinition.ts:18](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ActionDefinition.ts#L18)

## Type Parameters

### T

`T` *extends* [`ActionDefinitionSpecification`](../interfaces/ActionDefinitionSpecification.md)

## Indexable

\[`key`: `string`\]: `any`

## Constructors

### Constructor

> **new ActionDefinition**\<`T`\>(`definition`): `ActionDefinition`\<`T`\>

Defined in: [lib/definition/ActionDefinition.ts:21](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ActionDefinition.ts#L21)

#### Parameters

##### definition

`T`

#### Returns

`ActionDefinition`\<`T`\>

## Methods

### createAndAddProperty()

> **createAndAddProperty**(`name`, `definition`): `void`

Defined in: [lib/definition/ActionDefinition.ts:36](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ActionDefinition.ts#L36)

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

Defined in: [lib/definition/ActionDefinition.ts:41](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ActionDefinition.ts#L41)

#### Returns

`ActionDefinition`\<`T`\> & `object`
