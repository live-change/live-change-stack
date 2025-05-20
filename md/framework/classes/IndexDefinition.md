[**@live-change/framework v0.9.84**](../README.md)

***

[@live-change/framework](../README.md) / IndexDefinition

# Class: IndexDefinition\<T\>

Defined in: [lib/definition/IndexDefinition.ts:11](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/IndexDefinition.ts#L11)

## Type Parameters

### T

`T` *extends* [`IndexDefinitionSpecification`](../interfaces/IndexDefinitionSpecification.md)

## Indexable

\[`key`: `string`\]: `any`

## Constructors

### Constructor

> **new IndexDefinition**\<`T`\>(`definition`): `IndexDefinition`\<`T`\>

Defined in: [lib/definition/IndexDefinition.ts:14](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/IndexDefinition.ts#L14)

#### Parameters

##### definition

`T`

#### Returns

`IndexDefinition`\<`T`\>

## Methods

### computeChanges()

> **computeChanges**(`oldIndexParam`): `Record`\<`string`, `any`\>[]

Defined in: [lib/definition/IndexDefinition.ts:27](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/IndexDefinition.ts#L27)

#### Parameters

##### oldIndexParam

`any`

#### Returns

`Record`\<`string`, `any`\>[]

***

### toJSON()

> **toJSON**(): `IndexDefinition`\<`T`\> & `object`

Defined in: [lib/definition/IndexDefinition.ts:20](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/IndexDefinition.ts#L20)

#### Returns

`IndexDefinition`\<`T`\> & `object`
