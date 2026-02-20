[**@live-change/framework v0.9.194**](../README.md)

***

[@live-change/framework](../README.md) / ViewDefinition

# Class: ViewDefinition\<T\>

Defined in: [lib/definition/ViewDefinition.ts:34](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L34)

## Type Parameters

### T

`T` *extends* [`ViewDefinitionSpecification`](../type-aliases/ViewDefinitionSpecification.md)

## Indexable

\[`key`: `string`\]: `any`

## Constructors

### Constructor

> **new ViewDefinition**\<`T`\>(`definition`): `ViewDefinition`\<`T`\>

Defined in: [lib/definition/ViewDefinition.ts:37](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L37)

#### Parameters

##### definition

`T`

#### Returns

`ViewDefinition`\<`T`\>

## Methods

### createAndAddProperty()

> **createAndAddProperty**(`name`, `definition`): `void`

Defined in: [lib/definition/ViewDefinition.ts:52](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L52)

#### Parameters

##### name

`any`

##### definition

`any`

#### Returns

`void`

***

### toJSON()

> **toJSON**(): `ViewDefinition`\<`T`\> & `object`

Defined in: [lib/definition/ViewDefinition.ts:57](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L57)

#### Returns

`ViewDefinition`\<`T`\> & `object`
