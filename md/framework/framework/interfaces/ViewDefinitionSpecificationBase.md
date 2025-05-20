[**@live-change/framework v0.9.84**](../README.md)

***

[@live-change/framework](../README.md) / ViewDefinitionSpecificationBase

# Interface: ViewDefinitionSpecificationBase

Defined in: [lib/definition/ViewDefinition.ts:7](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L7)

## Extended by

- [`ViewDefinitionSpecificationObservable`](ViewDefinitionSpecificationObservable.md)
- [`ViewDefinitionSpecificationDaoPath`](ViewDefinitionSpecificationDaoPath.md)
- [`ViewDefinitionSpecificationFetch`](ViewDefinitionSpecificationFetch.md)

## Properties

### access?

> `optional` **access**: [`AccessSpecification`](../type-aliases/AccessSpecification.md)

Defined in: [lib/definition/ViewDefinition.ts:13](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L13)

***

### global?

> `optional` **global**: `boolean`

Defined in: [lib/definition/ViewDefinition.ts:12](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L12)

***

### internal?

> `optional` **internal**: `boolean`

Defined in: [lib/definition/ViewDefinition.ts:11](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L11)

***

### name

> **name**: `string`

Defined in: [lib/definition/ViewDefinition.ts:8](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L8)

***

### properties

> **properties**: `Record`\<`string`, [`PropertyDefinitionSpecification`](PropertyDefinitionSpecification.md)\>

Defined in: [lib/definition/ViewDefinition.ts:9](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L9)

***

### returns

> **returns**: [`PropertyDefinitionSpecification`](PropertyDefinitionSpecification.md)

Defined in: [lib/definition/ViewDefinition.ts:10](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L10)

***

### skipValidation?

> `optional` **skipValidation**: `boolean`

Defined in: [lib/definition/ViewDefinition.ts:14](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L14)

***

### validation()?

> `optional` **validation**: (`parameters`, `context`) => `Promise`\<`any`\>

Defined in: [lib/definition/ViewDefinition.ts:15](https://github.com/live-change/live-change-stack/blob/master/framework/framework/framework/framework/lib/definition/ViewDefinition.ts#L15)

#### Parameters

##### parameters

`Record`\<`string`, `any`\>

##### context

[`ViewContext`](ViewContext.md)

#### Returns

`Promise`\<`any`\>
