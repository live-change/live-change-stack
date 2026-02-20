[**@live-change/framework v0.9.194**](../README.md)

***

[@live-change/framework](../README.md) / QueryDefinition

# Class: QueryDefinition\<T\>

Defined in: [lib/definition/QueryDefinition.ts:22](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/QueryDefinition.ts#L22)

## Type Parameters

### T

`T` *extends* [`QueryDefinitionSpecification`](../interfaces/QueryDefinitionSpecification.md)

## Indexable

\[`key`: `string`\]: `any`

## Constructors

### Constructor

> **new QueryDefinition**\<`T`\>(`definition`): `QueryDefinition`\<`T`\>

Defined in: [lib/definition/QueryDefinition.ts:25](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/QueryDefinition.ts#L25)

#### Parameters

##### definition

`T`

#### Returns

`QueryDefinition`\<`T`\>

## Methods

### createAndAddProperty()

> **createAndAddProperty**(`name`, `definition`): `void`

Defined in: [lib/definition/QueryDefinition.ts:40](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/QueryDefinition.ts#L40)

#### Parameters

##### name

`any`

##### definition

`any`

#### Returns

`void`

***

### toJSON()

> **toJSON**(): `QueryDefinition`\<`T`\> & `object`

Defined in: [lib/definition/QueryDefinition.ts:45](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/QueryDefinition.ts#L45)

#### Returns

`QueryDefinition`\<`T`\> & `object`
