[**@live-change/framework v0.9.84**](../README.md)

***

[@live-change/framework](../README.md) / TriggerDefinitionSpecification

# Interface: TriggerDefinitionSpecification

Defined in: [lib/definition/TriggerDefinition.ts:5](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/TriggerDefinition.ts#L5)

## Properties

### execute()

> **execute**: (`parameters`, `context`, `emit`) => `any`

Defined in: [lib/definition/TriggerDefinition.ts:12](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/TriggerDefinition.ts#L12)

#### Parameters

##### parameters

[`TriggerParameters`](../type-aliases/TriggerParameters.md)

##### context

[`TriggerContext`](TriggerContext.md)

##### emit

(`event`) => `void`

#### Returns

`any`

***

### name

> **name**: `string`

Defined in: [lib/definition/TriggerDefinition.ts:6](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/TriggerDefinition.ts#L6)

***

### properties

> **properties**: `Record`\<`string`, [`PropertyDefinitionSpecification`](PropertyDefinitionSpecification.md)\>

Defined in: [lib/definition/TriggerDefinition.ts:7](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/TriggerDefinition.ts#L7)

***

### returns?

> `optional` **returns**: [`PropertyDefinitionSpecification`](PropertyDefinitionSpecification.md)

Defined in: [lib/definition/TriggerDefinition.ts:8](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/TriggerDefinition.ts#L8)

***

### skipValidation?

> `optional` **skipValidation**: `boolean`

Defined in: [lib/definition/TriggerDefinition.ts:10](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/TriggerDefinition.ts#L10)

***

### validation()?

> `optional` **validation**: (`parameters`, `context`) => `Promise`\<`any`\>

Defined in: [lib/definition/TriggerDefinition.ts:11](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/TriggerDefinition.ts#L11)

#### Parameters

##### parameters

[`TriggerParameters`](../type-aliases/TriggerParameters.md)

##### context

[`TriggerContext`](TriggerContext.md)

#### Returns

`Promise`\<`any`\>

***

### waitForEvents?

> `optional` **waitForEvents**: `boolean`

Defined in: [lib/definition/TriggerDefinition.ts:9](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/TriggerDefinition.ts#L9)
