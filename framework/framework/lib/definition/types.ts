
export interface ClientContext {
  session: string
  user: string
  ip: string
  roles: string[]
}

export interface ExecutionContext {
  client: ClientContext
  service: any
}