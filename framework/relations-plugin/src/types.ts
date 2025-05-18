import { 
  ViewContext, ViewDefinitionSpecificationObservable, ViewDefinitionSpecificationDaoPath,
    ViewDefinitionSpecificationFetch, 
  ActionDefinitionSpecification, 
  TriggerDefinitionSpecification,
  ModelDefinitionSpecification
} from "@live-change/framework"

export type PreparedAccessControlSettings = {
  roles: string | string[]
  objects?: (properties: any) => any[]
  objParams?: { names: string[], types: string[] }
}

export type AccessControlSettings = string | string[] | PreparedAccessControlSettings
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

export interface CrudSettings {
  read?: string
  create?: string
  update?: string
  delete?: string
  range?: string
}

export interface Identifier {
  name: string
  field: string
}

export interface ModelDefinitionSpecificationExtended extends ModelDefinitionSpecification {
  crud: CrudSettings,
  identifiers: Identifier[]
}

export interface ModelDefinitionSpecificationWithAccessControl extends ModelDefinitionSpecificationExtended {
  accessControlParents?: (what: { object: string }) => Promise<{ objectType: string, object: any }[]>
  accessControlParentsSource?: { property: string, type: string }[]
  accessRoles?: string[]
}

