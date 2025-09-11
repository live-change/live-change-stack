
export interface ClientContext {
  session: string
  user: string
  ip: string
  roles: string[]
}

export interface ContextBase {
  client: ClientContext
  service: any,
  visibilityTest: boolean
}

export interface ViewContext extends ContextBase {
  view: any,
}

export type ActionParameters = Record<string, any>
export type TriggerParameters = Record<string, any>
export type EventParameters = Record<string, any>
export type QueryParameters = Record<string, any>

export interface TriggerSettings {
  service?: string,
  type: string,
}

export interface TriggerServiceSettings {
  service: string,
  type: string,
}

type ContextTriggerFunction = (triggerSettings: TriggerSettings, parameters: ActionParameters) => void
type ContextTriggerServiceFunction = (triggerSettings: TriggerServiceSettings, parameters: ActionParameters) => void
export interface ActionContext extends ContextBase {
  action: any,
  trigger: ContextTriggerFunction,
  triggerService: ContextTriggerServiceFunction,
}

export interface TriggerContext extends ContextBase {
  reaction: any,
  trigger: ContextTriggerFunction,
  triggerService: ContextTriggerServiceFunction,
}
