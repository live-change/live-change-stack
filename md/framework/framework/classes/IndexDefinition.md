[**@live-change/framework v0.9.194**](../README.md)

***

[@live-change/framework](../README.md) / IndexDefinition

# Class: IndexDefinition\<T\>

Defined in: [lib/definition/IndexDefinition.ts:12](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/IndexDefinition.ts#L12)

## Type Parameters

### T

`T` *extends* [`IndexDefinitionSpecification`](../interfaces/IndexDefinitionSpecification.md)

## Indexable

\[`key`: `string`\]: `any`

## Constructors

### Constructor

> **new IndexDefinition**\<`T`\>(`definition`, `serviceName`): `IndexDefinition`\<`T`\>

Defined in: [lib/definition/IndexDefinition.ts:16](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/IndexDefinition.ts#L16)

#### Parameters

##### definition

`T`

##### serviceName

`string`

#### Returns

`IndexDefinition`\<`T`\>

## Properties

### serviceName

> **serviceName**: `string`

Defined in: [lib/definition/IndexDefinition.ts:13](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/IndexDefinition.ts#L13)

## Methods

### $\_toQueryDescription()

> **$\_toQueryDescription**(): `string`

Defined in: [lib/definition/IndexDefinition.ts:53](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/IndexDefinition.ts#L53)

#### Returns

`string`

***

### computeChanges()

> **computeChanges**(`oldIndexParam`): `Record`\<`string`, `any`\>[]

Defined in: [lib/definition/IndexDefinition.ts:30](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/IndexDefinition.ts#L30)

#### Parameters

##### oldIndexParam

`any`

#### Returns

`Record`\<`string`, `any`\>[]

***

### toJSON()

> **toJSON**(): `IndexDefinition`\<`T`\> & `object`

Defined in: [lib/definition/IndexDefinition.ts:23](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/IndexDefinition.ts#L23)

#### Returns

`IndexDefinition`\<`T`\> & `object`
