import { fireChangeTriggers as fireChangeTriggersInternal } from './changeTriggers.js'

export type ModelChangeType = 'create' | 'update' | 'delete'

export interface ModelChangeTriggerPayload {
  objectType: string
  object: string
  identifiers: Record<string, unknown> | null
  data: Record<string, unknown> | null
  oldData: Record<string, unknown> | null
  changeType: ModelChangeType
}

export type ChangeTriggerFn = (
  spec: { type: string },
  payload: ModelChangeTriggerPayload
) => Promise<unknown>

export interface FireChangeTriggersParams {
  service: { name: string }
  modelName: string
  app?: unknown
  objectType: string
  object: string
  identifiers: Record<string, unknown> | null
  oldData: Record<string, unknown> | null
  data: Record<string, unknown> | null
  trigger: ChangeTriggerFn
}

/**
 * Fire lifecycle change triggers for a model write (create / update / delete).
 * Call from action or trigger execute handlers before emit(), with trigger from context.
 */
export async function fireChangeTriggers(params: FireChangeTriggersParams): Promise<void> {
  const { service, modelName, app, objectType, object, identifiers, oldData, data, trigger } = params
  const context = { service, modelName, app }
  await fireChangeTriggersInternal(
    context,
    objectType,
    identifiers,
    object,
    oldData,
    data,
    trigger
  )
}

export { extractObjectData, extractIdentifiers } from './dataUtils.js'
