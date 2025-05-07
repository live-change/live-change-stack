import { 
  ViewContext, ViewDefinitionSpecificationObservable, ViewDefinitionSpecificationDaoPath,
    ViewDefinitionSpecificationFetch, 
  ActionDefinitionSpecification, 
  TriggerDefinitionSpecification 
} from "@live-change/framework"

export type AccessControlSettings = string | string[] | {
  roles: string | string[]
  objects?: (properties: any) => any[]
}
export interface ViewDefinitionSpecificationObservableAC extends ViewDefinitionSpecificationObservable {
  accessControl?: AccessControlSettings
}
export interface ViewDefinitionSpecificationDaoPathAC extends ViewDefinitionSpecificationDaoPath {
  daoPath: (parameters: Record<string, any>, context: ViewContext) => any[]
  accessControl?: AccessControlSettings
}
export interface ViewDefinitionSpecificationFetchAC extends ViewDefinitionSpecificationFetch {
  fetch: (parameters: Record<string, any>, context: ViewContext) => Promise<any>
  accessControl?: AccessControlSettings
}

export type ViewDefinitionSpecificationAC = 
  ViewDefinitionSpecificationObservableAC
   | ViewDefinitionSpecificationDaoPathAC
    | ViewDefinitionSpecificationFetchAC


export interface ActionDefinitionSpecificationAC extends ActionDefinitionSpecification {
  accessControl?: AccessControlSettings
}

export interface TriggerDefinitionSpecificationAC extends TriggerDefinitionSpecification {
  accessControl?: AccessControlSettings
}