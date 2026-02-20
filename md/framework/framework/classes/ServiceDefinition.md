[**@live-change/framework v0.9.194**](../README.md)

***

[@live-change/framework](../README.md) / ServiceDefinition

# Class: ServiceDefinition\<T\>

Defined in: [lib/definition/ServiceDefinition.ts:103](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L103)

## Type Parameters

### T

`T` *extends* [`ServiceDefinitionSpecification`](../interfaces/ServiceDefinitionSpecification.md)

## Indexable

\[`key`: `string`\]: `any`

## Constructors

### Constructor

> **new ServiceDefinition**\<`T`\>(`definition`): `ServiceDefinition`\<`T`\>

Defined in: [lib/definition/ServiceDefinition.ts:106](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L106)

#### Parameters

##### definition

`T`

#### Returns

`ServiceDefinition`\<`T`\>

## Methods

### action()

> **action**\<`T`\>(`definition`): [`ActionDefinition`](ActionDefinition.md)\<`T`\>

Defined in: [lib/definition/ServiceDefinition.ts:155](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L155)

#### Type Parameters

##### T

`T` *extends* [`ActionDefinitionSpecification`](../interfaces/ActionDefinitionSpecification.md)

#### Parameters

##### definition

`T`

#### Returns

[`ActionDefinition`](ActionDefinition.md)\<`T`\>

***

### afterStart()

> **afterStart**(`callback`): `void`

Defined in: [lib/definition/ServiceDefinition.ts:201](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L201)

#### Parameters

##### callback

`any`

#### Returns

`void`

***

### authenticator()

> **authenticator**(`authenticator`): `void`

Defined in: [lib/definition/ServiceDefinition.ts:193](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L193)

#### Parameters

##### authenticator

`any`

#### Returns

`void`

***

### beforeStart()

> **beforeStart**(`callback`): `void`

Defined in: [lib/definition/ServiceDefinition.ts:197](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L197)

#### Parameters

##### callback

`any`

#### Returns

`void`

***

### callTrigger()

> **callTrigger**(`trigger`, `data`): `void`

Defined in: [lib/definition/ServiceDefinition.ts:259](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L259)

#### Parameters

##### trigger

`any`

##### data

`any`

#### Returns

`void`

***

### clientSideFilter()

> **clientSideFilter**(`filter`): `void`

Defined in: [lib/definition/ServiceDefinition.ts:215](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L215)

#### Parameters

##### filter

`any`

#### Returns

`void`

***

### computeChanges()

> **computeChanges**(`oldModuleParam`): `Record`\<`string`, `any`\>[]

Defined in: [lib/definition/ServiceDefinition.ts:264](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L264)

#### Parameters

##### oldModuleParam

`any`

#### Returns

`Record`\<`string`, `any`\>[]

***

### endpoint()

> **endpoint**(`endpoint`): `void`

Defined in: [lib/definition/ServiceDefinition.ts:205](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L205)

#### Parameters

##### endpoint

`any`

#### Returns

`void`

***

### event()

> **event**(`definition`): [`EventDefinition`](EventDefinition.md)\<`any`\>

Defined in: [lib/definition/ServiceDefinition.ts:162](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L162)

#### Parameters

##### definition

`any`

#### Returns

[`EventDefinition`](EventDefinition.md)\<`any`\>

***

### foreignIndex()

> **foreignIndex**(`serviceName`, `indexName`): `any`

Defined in: [lib/definition/ServiceDefinition.ts:149](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L149)

#### Parameters

##### serviceName

`any`

##### indexName

`any`

#### Returns

`any`

***

### foreignModel()

> **foreignModel**(`serviceName`, `modelName`): `any`

Defined in: [lib/definition/ServiceDefinition.ts:136](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L136)

#### Parameters

##### serviceName

`any`

##### modelName

`any`

#### Returns

`any`

***

### index()

> **index**(`definition`): `any`

Defined in: [lib/definition/ServiceDefinition.ts:142](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L142)

#### Parameters

##### definition

`any`

#### Returns

`any`

***

### model()

> **model**\<`T`\>(`definition`): `any`

Defined in: [lib/definition/ServiceDefinition.ts:129](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L129)

#### Type Parameters

##### T

`T` *extends* [`ModelDefinitionSpecification`](../interfaces/ModelDefinitionSpecification.md)

#### Parameters

##### definition

`T`

#### Returns

`any`

***

### processor()

> **processor**(`processor`): `void`

Defined in: [lib/definition/ServiceDefinition.ts:183](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L183)

#### Parameters

##### processor

`any`

#### Returns

`void`

***

### query()

> **query**\<`T`\>(`definition`): `any`

Defined in: [lib/definition/ServiceDefinition.ts:219](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L219)

#### Type Parameters

##### T

`T` *extends* [`QueryDefinitionSpecification`](../interfaces/QueryDefinitionSpecification.md)

#### Parameters

##### definition

`T`

#### Returns

`any`

***

### toJSON()

> **toJSON**(): `any`

Defined in: [lib/definition/ServiceDefinition.ts:226](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L226)

#### Returns

`any`

***

### trigger()

> **trigger**\<`T`\>(`definition`): [`TriggerDefinition`](TriggerDefinition.md)\<`T`\>

Defined in: [lib/definition/ServiceDefinition.ts:176](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L176)

#### Type Parameters

##### T

`T` *extends* [`TriggerDefinitionSpecification`](../interfaces/TriggerDefinitionSpecification.md)

#### Parameters

##### definition

`T`

#### Returns

[`TriggerDefinition`](TriggerDefinition.md)\<`T`\>

***

### validator()

> **validator**(`name`, `validator`): `void`

Defined in: [lib/definition/ServiceDefinition.ts:209](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L209)

#### Parameters

##### name

`any`

##### validator

`any`

#### Returns

`void`

***

### view()

> **view**\<`T`\>(`definition`): [`ViewDefinition`](ViewDefinition.md)\<`T`\>

Defined in: [lib/definition/ServiceDefinition.ts:169](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L169)

#### Type Parameters

##### T

`T` *extends* [`ViewDefinitionSpecification`](../type-aliases/ViewDefinitionSpecification.md)

#### Parameters

##### definition

`T`

#### Returns

[`ViewDefinition`](ViewDefinition.md)\<`T`\>
