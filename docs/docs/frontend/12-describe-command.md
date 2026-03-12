---
title: Describe command for frontend development
---

# Describe command for frontend development

The `describe` CLI command shows you the structure of backend services — models, actions, views, and their properties. When building frontends, this is the primary way to discover what views are available to load data from and what actions you can call, including those generated automatically by relations.

## Running describe

Run the command from your project root (where `server/start.js` lives):

```bash
# List all services with their models, actions, views
node server/start.js describe

# One specific service
node server/start.js describe --service blog

# Full YAML output for a service
node server/start.js describe --service blog --output yaml
```

## Discovering views (what data can I load?)

Views are the endpoints you call with `live(path.serviceName.viewName(...))`. Use `describe` to see all available views and their parameters:

```bash
node server/start.js describe --service blog
```

Output:

```
Service blog
  ...
  views:
    article ( article )
    articlesByCreatedAt ( gt, lt, gte, lte, limit, reverse )
    myUserArticles ( gt, lt, gte, lte, limit, reverse )
    myUserArticle ( article )
  ...
```

The property names in parentheses are the parameters you pass when building the path:

```javascript
// article ( article ) → single object view
live(path.blog.article({ article: articleId }))

// articlesByCreatedAt ( gt, lt, gte, lte, limit, reverse ) → range view
live(path.blog.articlesByCreatedAt({ limit: 20 }))

// myUserArticle ( article ) → user-scoped single object
live(path.blog.myUserArticle({ article: articleId }))
```

Views with `gt, lt, gte, lte, limit, reverse` parameters are **range views** — use them with `RangeViewer` or `rangeBuckets` for paginated lists.

### Getting full view details

```bash
node server/start.js describe --service blog --view articlesByCreatedAt --output yaml
```

This shows the complete view definition including property types, whether it's `global`, `internal`, or `remote`.

## Discovering actions (what can I call?)

Actions are what you call with `api.command`, `actions.service.actionName`, `editorData`, or `actionData`. Use `describe` to see all available actions:

```bash
node server/start.js describe --service blog
```

Output:

```
Service blog
  ...
  actions:
    createMyUserArticle ( article, name, body, category )
    updateMyUserArticle ( article, name, body, category )
    deleteMyUserArticle ( article )
    publishArticle ( article, scheduleTime, message )
  ...
```

### Choosing the right frontend pattern based on describe output

Once you know the action name and its properties, pick the right frontend pattern:

| Action pattern | Frontend approach |
|---|---|
| `createMyUser*` / `updateMyUser*` (CRUD on model) | `editorData` — it detects create vs update automatically |
| `publishArticle` (one-shot, not CRUD) | `actionData` — submit once, show done state |
| `deleteMyUser*` (no form fields needed) | `api.command` + confirm dialog |

### Getting full action details

```bash
node server/start.js describe --service blog --action createMyUserArticle --output yaml
```

This shows property types, validation rules, and defaults — useful for understanding what `AutoField` will render.

## Discovering models (what's the data shape?)

Models tell you the shape of data returned by views. Use `describe` to see a model's properties:

```bash
node server/start.js describe --service blog --model Article --output yaml
```

This shows all properties with their types, defaults, and validation — the same metadata that `editorData` uses to build `editor.model.properties.*` for `AutoField`.

### Understanding generated names

Relations generate predictable naming patterns. If you define a model `Article` with `userItem` in service `blog`:

```bash
node server/start.js describe --service blog
```

You'll see generated entries like:

```
  actions:
    createMyUserArticle ( article, ... )
    updateMyUserArticle ( article, ... )
    deleteMyUserArticle ( article )
    setOrUpdateMyUserArticle ( article, ... )
  views:
    myUserArticles ( gt, lt, gte, lte, limit, reverse )
    myUserArticle ( article )
```

The naming convention is: `myUser` + model name for user-owned items. Knowing this helps you build frontend paths without guessing.

## Practical workflow

A typical frontend development workflow with `describe`:

1. **Starting a new page** — run `describe` to see available views and actions for the service.
2. **Building a list** — find the range view (one with `gt, lt, limit` params) and use it with `RangeViewer` or `live()`.
3. **Building a form** — find the create/update actions, check their properties with `--output yaml`, then use `editorData` or `actionData`.
4. **Debugging "view not found"** — run `describe --service <name>` to verify the exact view name and its parameters.
5. **Checking what `.with()` can load** — find related service views to attach with `.with()`.

## Output formats

| Flag | Format |
|---|---|
| (default) | Compact text tree (no filters) or YAML (with filters) |
| `--output yaml` | Full YAML dump of service definition |
| `--output json` | Full JSON dump |

When using entity filters (`--model`, `--action`, `--view`), you must specify a concrete `--service` (not `*`).
