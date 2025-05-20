[**@live-change/framework v0.9.84**](../README.md)

***

[@live-change/framework](../README.md) / ModelDefinition

# Class: ModelDefinition\<T\>

Defined in: [lib/definition/ModelDefinition.ts:25](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ModelDefinition.ts#L25)

## Type Parameters

### T

`T` *extends* [`ModelDefinitionSpecification`](../interfaces/ModelDefinitionSpecification.md)

## Indexable

\[`key`: `string`\]: `any`

## Constructors

### Constructor

> **new ModelDefinition**\<`T`\>(`definition`, `serviceName`): `ModelDefinition`\<`T`\>

Defined in: [lib/definition/ModelDefinition.ts:28](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ModelDefinition.ts#L28)

#### Parameters

##### definition

`any`

##### serviceName

`any`

#### Returns

`ModelDefinition`\<`T`\>

## Methods

### computeChanges()

> **computeChanges**(`oldModelParam`): `Record`\<`string`, `any`\>[]

Defined in: [lib/definition/ModelDefinition.ts:77](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ModelDefinition.ts#L77)

#### Parameters

##### oldModelParam

`any`

#### Returns

`Record`\<`string`, `any`\>[]

***

### createAndAddProperty()

> **createAndAddProperty**(`name`, `definition`): `void`

Defined in: [lib/definition/ModelDefinition.ts:47](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ModelDefinition.ts#L47)

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

Defined in: [lib/definition/ModelDefinition.ts:43](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ModelDefinition.ts#L43)

#### Returns

`string`

***

### toJSON()

> **toJSON**(): `any`

Defined in: [lib/definition/ModelDefinition.ts:52](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ModelDefinition.ts#L52)

#### Returns

`any`
