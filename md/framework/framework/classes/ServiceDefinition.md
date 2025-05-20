[**@live-change/framework v0.9.84**](../README.md)

***

[@live-change/framework](../README.md) / ServiceDefinition

# Class: ServiceDefinition\<T\>

Defined in: [lib/definition/ServiceDefinition.ts:79](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L79)

## Type Parameters

### T

`T` *extends* [`ServiceDefinitionSpecification`](../interfaces/ServiceDefinitionSpecification.md)

## Indexable

\[`key`: `string`\]: `any`

## Constructors

### Constructor

> **new ServiceDefinition**\<`T`\>(`definition`): `ServiceDefinition`\<`T`\>

Defined in: [lib/definition/ServiceDefinition.ts:82](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L82)

#### Parameters

##### definition

`T`

#### Returns

`ServiceDefinition`\<`T`\>

## Methods

### action()

> **action**\<`T`\>(`definition`): [`ActionDefinition`](ActionDefinition.md)\<`T`\>

Defined in: [lib/definition/ServiceDefinition.ts:130](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L130)

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

Defined in: [lib/definition/ServiceDefinition.ts:176](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L176)

#### Parameters

##### callback

`any`

#### Returns

`void`

***

### authenticator()

> **authenticator**(`authenticator`): `void`

Defined in: [lib/definition/ServiceDefinition.ts:168](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L168)

#### Parameters

##### authenticator

`any`

#### Returns

`void`

***

### beforeStart()

> **beforeStart**(`callback`): `void`

Defined in: [lib/definition/ServiceDefinition.ts:172](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L172)

#### Parameters

##### callback

`any`

#### Returns

`void`

***

### callTrigger()

> **callTrigger**(`trigger`, `data`): `void`

Defined in: [lib/definition/ServiceDefinition.ts:225](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L225)

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

Defined in: [lib/definition/ServiceDefinition.ts:190](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L190)

#### Parameters

##### filter

`any`

#### Returns

`void`

***

### computeChanges()

> **computeChanges**(`oldModuleParam`): `Record`\<`string`, `any`\>[]

Defined in: [lib/definition/ServiceDefinition.ts:230](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L230)

#### Parameters

##### oldModuleParam

`any`

#### Returns

`Record`\<`string`, `any`\>[]

***

### endpoint()

> **endpoint**(`endpoint`): `void`

Defined in: [lib/definition/ServiceDefinition.ts:180](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L180)

#### Parameters

##### endpoint

`any`

#### Returns

`void`

***

### event()

> **event**(`definition`): [`EventDefinition`](EventDefinition.md)\<`any`\>

Defined in: [lib/definition/ServiceDefinition.ts:137](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L137)

#### Parameters

##### definition

`any`

#### Returns

[`EventDefinition`](EventDefinition.md)\<`any`\>

***

### foreignIndex()

> **foreignIndex**(`serviceName`, `indexName`): `any`

Defined in: [lib/definition/ServiceDefinition.ts:124](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L124)

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

Defined in: [lib/definition/ServiceDefinition.ts:111](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L111)

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

Defined in: [lib/definition/ServiceDefinition.ts:117](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L117)

#### Parameters

##### definition

`any`

#### Returns

`any`

***

### model()

> **model**\<`T`\>(`definition`): `any`

Defined in: [lib/definition/ServiceDefinition.ts:104](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L104)

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

Defined in: [lib/definition/ServiceDefinition.ts:158](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L158)

#### Parameters

##### processor

`any`

#### Returns

`void`

***

### toJSON()

> **toJSON**(): `ServiceDefinition`\<`T`\> & `object`

Defined in: [lib/definition/ServiceDefinition.ts:194](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L194)

#### Returns

`ServiceDefinition`\<`T`\> & `object`

***

### trigger()

> **trigger**\<`T`\>(`definition`): [`TriggerDefinition`](TriggerDefinition.md)\<`T`\>

Defined in: [lib/definition/ServiceDefinition.ts:151](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L151)

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

Defined in: [lib/definition/ServiceDefinition.ts:184](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L184)

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

Defined in: [lib/definition/ServiceDefinition.ts:144](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ServiceDefinition.ts#L144)

#### Type Parameters

##### T

`T` *extends* [`ViewDefinitionSpecification`](../type-aliases/ViewDefinitionSpecification.md)

#### Parameters

##### definition

`T`

#### Returns

[`ViewDefinition`](ViewDefinition.md)\<`T`\>
