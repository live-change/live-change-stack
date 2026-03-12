---
title: Describe command
---

# Describe command

The `describe` CLI command inspects the structure of your services after all definitions have been processed. It shows models, indexes, triggers, events, actions, views and queries — including those generated automatically by relation plugins. This makes it the primary tool for understanding what the framework has built from your definitions.

## Running describe

```bash
# All services, text overview
node server/start.js describe

# One service, text
node server/start.js describe --service speedDating

# YAML output (full definition including generated code)
node server/start.js describe --service speedDating --output yaml

# JSON output
node server/start.js describe --service speedDating --output json
```

## Text output

When run without filters, `describe` prints a compact tree of every entity in the service:

```
Service speedDating
  models:
    Event ( name, description, startTime, status )
      byStartTime
    EventState ( round, phase )
  indexes:
    speedDating_Event_byStartTime
  actions:
    createEvent ( name, description, startTime )
    updateEvent ( event, name, description )
    deleteEvent ( event )
  views:
    event ( event )
    eventsByStartTime ( gt, lt, gte, lte, limit, reverse )
  triggers:
    eventCreated ( event )
    eventUpdated ( event )
  events:
    eventCreated ( event )
    eventUpdated ( event )
```

Each entity line shows its name and the property names in parentheses. Model entries also list their indexes indented below.

## Filtering by entity type

You can filter the output to a single entity type. Filters require a concrete `--service` (not `*`):

```bash
# Show a specific model with all its properties and indexes
node server/start.js describe --service speedDating --model Event

# Show a specific index
node server/start.js describe --service speedDating --index byStartTime

# Show a specific trigger
node server/start.js describe --service speedDating --trigger eventCreated

# Show a specific event
node server/start.js describe --service speedDating --event eventCreated
```

When a filter is active, the output switches to YAML (or JSON with `--output json`) and shows the full definition of the matched entity — properties, types, defaults, validation, indexes, and all generated metadata.

## Available filters

| Flag | What it shows |
|---|---|
| `--model <name>` | Model definition with properties, indexes, relations |
| `--index <name>` | Index definition (checks both global indexes and model-level indexes) |
| `--trigger <name>` | Trigger definition with properties |
| `--event <name>` | Event definition with properties |
| `--action <name>` | Action definition with properties |
| `--view <name>` | View definition with properties, flags (global, internal, remote) |
| `--query <name>` | Query definition with properties |

## Output formats

| Flag | Format |
|---|---|
| (default) | Compact text tree (no filters) or YAML (with filters) |
| `--output yaml` | Full YAML dump |
| `--output json` | Full JSON dump |
| `--json` | Deprecated alias for `--output json` |

## When to use describe

### Understanding generated code

Relations like `userItem`, `itemOf`, `propertyOf` generate models, views, actions, triggers, indexes and events automatically. Use `describe` to see exactly what was generated:

```bash
# See what userItem generated for the Device model
node server/start.js describe --service deviceManager --model Device --output yaml
```

This reveals the full model definition including generated indexes, access control settings, and relation metadata.

### Checking index names

Indexes are often referenced by name in views and actions. Use `describe` to find the exact index name:

```bash
node server/start.js describe --service speedDating --model Event
```

Model-level indexes appear under the model. Global indexes (cross-model) appear in the top-level `indexes` section with a prefixed name like `speedDating_Event_byStartTime`.

### Verifying triggers and events

After defining triggers and events, verify they were registered correctly:

```bash
node server/start.js describe --service speedDating --trigger eventCreated
node server/start.js describe --service speedDating --event eventCreated
```

### Debugging service startup issues

If a service doesn't behave as expected, dump the full definition to see what the framework sees:

```bash
node server/start.js describe --service speedDating --output yaml > speedDating-definition.yaml
```

## Related commands

Two other CLI commands work with service definitions:

| Command | Description |
|---|---|
| `changes --service <name>` | Show pending schema changes (what would be applied on next update) |
| `update --service <name>` | Apply schema changes to the database |

These are used during development when you modify models or indexes and need to update the database schema.

```bash
# See what changed
node server/start.js changes --service speedDating --withDb

# Apply changes
node server/start.js update --service speedDating --withDb
```
