try {
  // @ts-ignore
  Symbol.metadata ??= Symbol("Symbol.metadata") 
} catch (e) { }

import { PropertyOfAny, Model, Property, modelConfigSymbol, Index } from '../../src/index.js'

/* @PropertyOfAny({
  readAccessControl: {
    roles: ['owner', 'admin']
  }
}) */

const definition = "!"

const currencyZero = 0

type Currency = typeof currencyZero

const currencyConfig = {
  type: Number,
  default: currencyZero
}

type RelationProperties<T extends Record<string, any>> = {
  [K in keyof T as `${Extract<K, string>}`]: any
  //[K in keyof T as `${Extract<K, string>}Type`]: any
}
type RelationPropertiesTypes<T extends Record<string, any>> = {
  [K in keyof T as `${Extract<K, string>}Type`]: any
}

type RelationPropertiesWithTypes<T extends Record<string, any>> = RelationProperties<T> & RelationPropertiesTypes<T>

@Model(definition)
@PropertyOfAny({
  readAccessControl: {
    roles: ['owner', 'admin']
  }
})
export class Balance implements RelationPropertiesWithTypes<{ owner: string }> {  
  owner: string /// will be auto-generated
  ownerType: string /// will be auto-generated

  @Property(currencyConfig)
  available: Currency

  @Property(currencyConfig)
  amount: Currency

  @Property()
  lastUpdate: Date

  @Index({
    property: ['owner', 'lastUpdate']
  }) 
  static byOwnerAndLastUpdate /// TODO: model index runtime type
}


setTimeout(() => {
  console.log("KURWA")
  console.log('B!!', Balance)
  console.log('BP!', Balance.prototype)   
  console.log("M", Balance[Symbol.metadata])
  let b = Balance
  let md = Balance[Symbol.metadata]
  console.log("MC", md[modelConfigSymbol])
  
}, 100)