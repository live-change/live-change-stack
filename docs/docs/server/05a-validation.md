---
title: Property validation
---

# Property validation

Model properties, action parameters, view parameters, and event payloads can declare **`validation`** (hard) and **`softValidation`** (warnings-style, same mechanism, different key). Values are an **array** of rules, or a single rule. Each rule is either a **string** (built-in name, no extra settings) or an **object** `{ name: 'validatorName', ...params }` merged into the factory call.

Resolution: `live-change-stack/framework/framework/lib/utils/validation.js` looks up `context.service.validators[name]`. Every service starts with a copy of the default set from `live-change-stack/framework/framework/lib/utils/validators.js` (`ServiceDefinition` in the framework).

## `validation` vs `softValidation`

- **`validation`** — enforced before persisting or executing; failures block the operation.
- **`softValidation`** — same validator list and codes; use for UX hints (e.g. “please fill in later”) while still allowing save, depending on how the client treats `softValidation` vs `validation` in `validateData`.
- **`if` interaction** — auto-validation skips a property (and its nested subtree) when that property's `if` condition evaluates to `false`. This applies both on frontend `validateData` and backend auto-validation runtime.

Example (from [Models](/server/05-models.html)):

```javascript
name: { type: String, softValidation: ['nonEmpty', { name: 'maxLength', length: 128 }] }
```

## Built-in validators (framework)

Source of truth: `@live-change/framework/lib/utils/validators.js`.

| Name | Params | Meaning |
|------|--------|---------|
| `nonEmpty` | — | Required / non-empty string, array, object (see `nonEmpty` export). |
| `minLength` | `length` | String shorter than `length` → `tooShort`. |
| `maxLength` | `length` | String longer than `length` → `tooLong`. |
| `number` | — | `isNaN(value)` → `notANumber`. |
| `integer` | — | Not an integer → `notAnInteger`. |
| `min` | `value` | Numeric lower bound: empty skipped; non-numeric skipped (use with `number`); `Number(v) < value` → `tooSmall`. |
| `max` | `value` | Numeric upper bound; `Number(v) > value` → `tooLarge`. |
| `elementsNonEmpty` | — | Each array element must be non-empty → `someEmpty`. |
| `minTextLength` | `length` | Plain-text length (HTML stripped) below `length` → `tooShort`. |
| `maxTextLength` | `length` | Plain-text length above `length` → `tooLong`. |
| `nonEmptyText` | — | Non-empty after stripping HTML. |
| `ifEq` | `prop`, `to`, `then` | If another field equals `to`, run nested validators in `then`. |
| `switchBy` | `prop`, `cases` | Branch validators by another field’s value. |
| `ifNotOneOf` | `prop`, `what`, `then` | If field not in `what`, run `then`. |
| `ifEmpty` | `prop`, `then` | If other field empty, run `then`. |
| `ifIncludes` | `prop`, `that`, `then` | If array field includes `that`, run `then`. |
| `httpUrl` | — | Must parse as `http:` / `https:` → `wrongUrl`. |
| `httpUrlSoft` | — | Like `httpUrl`, prefixes `https://` before parse. |

Numeric bounds example:

```javascript
salary: { type: Number, validation: ['nonEmpty', 'number', { name: 'min', value: 0 }] }
```

## Service-defined validators (backend)

Register a **factory** with the same shape as built-ins: `(settings, context) => (value, context) => errorCode | undefined`.

In the service module (after `createServiceDefinition` / `definition` exists):

```javascript
import emailValidator from './emailValidator.js'
definition.validator('email', emailValidator)
```

Real examples in the stack:

- Email — `live-change-stack/services/email-service/emailValidator.js`, registered in `live-change-stack/services/email-service/index.js`.
- Password — `live-change-stack/services/password-authentication-service` uses `definition.validator('password', passwordValidator)`.
- Phone — `live-change-stack/services/phone-service` registers `phone`.
- Session — `live-change-stack/services/session-service` registers `localId`.

## Propagating validator names across services

When the app loads all service definitions, **each service’s `validators` map is filled from other services** for any name still missing locally: the **first** definition encountered wins for a given name (see `live-change-stack/framework/server/lib/Services.js`, loop “push validators from services to other services”). Avoid **collisions** on the same validator name across unrelated services.

## Frontend: matching validators for `validateData`

`@live-change/vue-api` seeds `api.validators` / `$validators` from the **same** default `validators.js`. Built-in names work on the client immediately.

For **service-specific** validators (`email`, `password`, …), assign the **client** factory onto the API object after the API is created (same keys as on the server), e.g. in `App.vue`:

```javascript
import emailValidator from '@live-change/email-service/clientEmailValidator.js'
import passwordValidator from '@live-change/password-authentication-service/clientPasswordValidator.js'

api.validators.email = emailValidator
api.validators.password = passwordValidator
```

The client implementation can be simpler than the server’s, but it should return the **same error codes** as the backend so i18n and `AutoField` stay consistent.

More detail: [Frontend – Logic and data layer](/frontend/04-logic-and-data-layer.html) and [Forms and auto-form](/frontend/05-forms-and-auto-form.html).
