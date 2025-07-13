try {
  // @ts-ignore
  Symbol.metadata ??= Symbol("Symbol.metadata") 
} catch (e) { }

import { 
  PropertyOfAny, Model, Property, modelConfigSymbol, Index, TypeAndId, Validation, Updated, Default, RangeIndex
} from '../../src/index.js'

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
@Model(definition)
@PropertyOfAny({
  readAccessControl: {
    roles: ['owner', 'admin']
  }
})
export class Balance {
  owner: TypeAndId

  @Property(currencyConfig)
  available: Currency

  @Property(currencyConfig)
  amount: Currency

  @Validation('nonEmpty')
  @Updated(() => new Date())
  @Property()
  lastUpdate: Date

  @Index({
    property: ['owner', 'lastUpdate']
  }) 
  static byOwnerAndLastUpdate: RangeIndex<( owner: TypeAndId, lastUpdate: Date ) => Balance[]>
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