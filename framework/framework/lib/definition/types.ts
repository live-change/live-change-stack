
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

export interface ActionContext extends ContextBase {
  action: any
}
