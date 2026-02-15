---
title: boundTo and relatedTo
---

# boundTo and relatedTo

From **relations plugin** (`use: [ relationsPlugin ]`).

- **boundTo** — Like propertyOf: one child record per parent. Used when the child is “bound” to a single parent entity.
- **relatedTo** — Many-to-many style: model has a relation to another model (or several) with a joint index; used for “related” or “friend” links rather than strict ownership.

## boundTo — configuration

Same style of options as propertyOf:

- **what** — Parent model.
- **readAccess**, **writeAccess**, **listAccess**, **setAccess**, **updateAccess**, **setOrUpdateAccess**, **resetAccess**, **readAllAccess**
- **readAccessControl**, **writeAccessControl**, **listAccessControl**, **setAccessControl**, **updateAccessControl**, **resetAccessControl**, **setOrUpdateAccessControl**
- **views** — Optional list of view configs (type: 'range' | 'object', internal?, readAccess?, readAccessControl?, fields?).

## relatedTo — configuration

- **what** — Related model (or array of models for multiple relations).
- **readAccess**, **writeAccess**, **createAccess**, **updateAccess**, **deleteAccess**, **copyAccess**, **readAllAccess**
- **readAccessControl**, **writeAccessControl**, **createAccessControl**, **updateAccessControl**, **deleteAccessControl**, **copyAccessControl**, **readAllAccessControl**
- **sortBy** — Optional sort fields for range views.

The plugin adds identifiers, a joint index, and Created/Updated/Deleted/Transferred events and actions for the relation. Use when the relationship is symmetric or many-to-many (e.g. “related items”) rather than strict parent-child ownership.

## saveAuthor

The relations plugin also provides **saveAuthor** — annotate a model so that the current user/session is stored as the “author” of a record (e.g. createdBy, updatedBy). See plugin source for options.
