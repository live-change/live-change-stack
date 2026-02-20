[**@live-change/framework v0.9.194**](../README.md)

***

[@live-change/framework](../README.md) / ModelDefinition

# Class: ModelDefinition\<T\>

Defined in: [lib/definition/ModelDefinition.ts:33](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ModelDefinition.ts#L33)

## Type Parameters

### T

`T` *extends* [`ModelDefinitionSpecification`](../interfaces/ModelDefinitionSpecification.md)

## Indexable

\[`key`: `string`\]: `any`

## Constructors

### Constructor

> **new ModelDefinition**\<`T`\>(`definition`, `serviceName`): `ModelDefinition`\<`T`\>

Defined in: [lib/definition/ModelDefinition.ts:37](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ModelDefinition.ts#L37)

#### Parameters

##### definition

`any`

##### serviceName

`any`

#### Returns

`ModelDefinition`\<`T`\>

## Properties

### serviceName

> **serviceName**: `string`

Defined in: [lib/definition/ModelDefinition.ts:34](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ModelDefinition.ts#L34)

## Methods

### $\_toQueryDescription()

> **$\_toQueryDescription**(): `string`

Defined in: [lib/definition/ModelDefinition.ts:56](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ModelDefinition.ts#L56)

#### Returns

`string`

***

### computeChanges()

> **computeChanges**(`oldModelParam`): `Record`\<`string`, `any`\>[]

Defined in: [lib/definition/ModelDefinition.ts:90](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ModelDefinition.ts#L90)

#### Parameters

##### oldModelParam

`any`

#### Returns

`Record`\<`string`, `any`\>[]

***

### createAndAddProperty()

> **createAndAddProperty**(`name`, `definition`): `void`

Defined in: [lib/definition/ModelDefinition.ts:60](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ModelDefinition.ts#L60)

#### Parameters

##### name

`any`

##### definition

`any`

#### Returns

`void`

***

### getTypeName()

> **getTypeName**(): `string`

Defined in: [lib/definition/ModelDefinition.ts:52](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ModelDefinition.ts#L52)

#### Returns

`string`

***

### toJSON()

> **toJSON**(): `any`

Defined in: [lib/definition/ModelDefinition.ts:65](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ModelDefinition.ts#L65)

#### Returns

`any`

***

### toString()

> **toString**(): `string`

Defined in: [lib/definition/ModelDefinition.ts:116](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ModelDefinition.ts#L116)

#### Returns

`string`
