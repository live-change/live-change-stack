[**@live-change/framework v0.9.194**](../README.md)

***

[@live-change/framework](../README.md) / QueryDefinitionSpecification

# Interface: QueryDefinitionSpecification

Defined in: [lib/definition/QueryDefinition.ts:7](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/QueryDefinition.ts#L7)

## Properties

### code

> **code**: `QueryCode`

Defined in: [lib/definition/QueryDefinition.ts:11](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/QueryDefinition.ts#L11)

***

### config?

> `optional` **config**: `Record`\<`string`, `any`\>

Defined in: [lib/definition/QueryDefinition.ts:19](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/QueryDefinition.ts#L19)

***

### name

> **name**: `string`

Defined in: [lib/definition/QueryDefinition.ts:8](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/QueryDefinition.ts#L8)

***

### properties

> **properties**: `Record`\<`string`, [`PropertyDefinitionSpecification`](PropertyDefinitionSpecification.md)\>

Defined in: [lib/definition/QueryDefinition.ts:9](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/QueryDefinition.ts#L9)

***

### requestTimeout?

> `optional` **requestTimeout**: `number`

Defined in: [lib/definition/QueryDefinition.ts:17](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/QueryDefinition.ts#L17)

***

### returns?

> `optional` **returns**: [`PropertyDefinitionSpecification`](PropertyDefinitionSpecification.md)

Defined in: [lib/definition/QueryDefinition.ts:10](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/QueryDefinition.ts#L10)

***

### sourceName

> **sourceName**: `string`

Defined in: [lib/definition/QueryDefinition.ts:12](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/QueryDefinition.ts#L12)

***

### timeout?

> `optional` **timeout**: `number`

Defined in: [lib/definition/QueryDefinition.ts:16](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/QueryDefinition.ts#L16)

***

### update

> **update**: `boolean`

Defined in: [lib/definition/QueryDefinition.ts:13](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/QueryDefinition.ts#L13)

***

### validation()?

> `optional` **validation**: (`parameters`, `context`) => `Promise`\<`any`\>

Defined in: [lib/definition/QueryDefinition.ts:15](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/QueryDefinition.ts#L15)

#### Parameters

##### parameters

[`QueryParameters`](../type-aliases/QueryParameters.md)

##### context

[`ContextBase`](ContextBase.md)

#### Returns

`Promise`\<`any`\>
