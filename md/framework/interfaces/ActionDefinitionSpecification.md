[**@live-change/framework v0.9.84**](../README.md)

***

[@live-change/framework](../README.md) / ActionDefinitionSpecification

# Interface: ActionDefinitionSpecification

Defined in: [lib/definition/ActionDefinition.ts:5](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ActionDefinition.ts#L5)

## Properties

### access?

> `optional` **access**: [`AccessSpecification`](../type-aliases/AccessSpecification.md)

Defined in: [lib/definition/ActionDefinition.ts:10](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ActionDefinition.ts#L10)

***

### execute()

> **execute**: (`parameters`, `context`, `emit`) => `any`

Defined in: [lib/definition/ActionDefinition.ts:9](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ActionDefinition.ts#L9)

#### Parameters

##### parameters

[`ActionParameters`](../type-aliases/ActionParameters.md)

##### context

[`ActionContext`](ActionContext.md)

##### emit

(`event`) => `void`

#### Returns

`any`

***

### name

> **name**: `string`

Defined in: [lib/definition/ActionDefinition.ts:6](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ActionDefinition.ts#L6)

***

### properties

> **properties**: `Record`\<`string`, [`PropertyDefinitionSpecification`](PropertyDefinitionSpecification.md)\>

Defined in: [lib/definition/ActionDefinition.ts:7](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ActionDefinition.ts#L7)

***

### returns?

> `optional` **returns**: [`PropertyDefinitionSpecification`](PropertyDefinitionSpecification.md)

Defined in: [lib/definition/ActionDefinition.ts:8](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ActionDefinition.ts#L8)

***

### skipValidation?

> `optional` **skipValidation**: `boolean`

Defined in: [lib/definition/ActionDefinition.ts:11](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ActionDefinition.ts#L11)

***

### validation()?

> `optional` **validation**: (`parameters`, `context`) => `Promise`\<`any`\>

Defined in: [lib/definition/ActionDefinition.ts:12](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ActionDefinition.ts#L12)

#### Parameters

##### parameters

[`ActionParameters`](../type-aliases/ActionParameters.md)

##### context

[`ActionContext`](ActionContext.md)

#### Returns

`Promise`\<`any`\>

***

### waitForEvents?

> `optional` **waitForEvents**: `boolean`

Defined in: [lib/definition/ActionDefinition.ts:13](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ActionDefinition.ts#L13)
