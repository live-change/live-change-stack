import { mergeDeep } from "../utils.js"

function nonEmpty(value) {
  if(!value) return 'empty'
  if(typeof value == 'string') {
    if(!value.trim()) return 'empty'
  }
  if(Array.isArray(value)) {
    if(value.length === 0) return 'empty'
  } else if(value instanceof Date) {
    return
  } if(typeof value == 'object') {
    if(Object.keys(value).length === 0) return 'empty'
  }
}

function getField(context, fieldName) {
  const propPath = context.propName ? context.propName.split('.') : []
  propPath.pop()
  let path
  if(fieldName[0] === '/') {
    path = fieldName.slice(1).split('.')
  } else {
    path = propPath.concat(fieldName.split('.'))
  }
  let p = mergeDeep(context.props, context.parameters)
  for(let part of path) p = p[part]
  return p
}

nonEmpty.isRequired = () => true

const validators = {
  nonEmpty: (settings) => nonEmpty,

  minLength: ({ length }) => (value) => value && (value.length < length ? 'tooShort' : undefined),
  maxLength: ({ length }) => (value) => value && (value.length > length ? 'tooLong' : undefined),

  number: () => (value) => isNaN(value) ? 'notANumber' : undefined,
  integer: () => (value) => !Number.isInteger(value) ? 'notAnInteger' : undefined,

  elementsNonEmpty: (settings) => (value) => {
    if(!value) return
    for(let el of value) {
      if(nonEmpty(el)) return 'someEmpty'
    }
  },

  minTextLength: ({ length }) =>
      (value) => (typeof value == 'string')
      && value.replace(/<[^>]*>/g,'').length < length ? 'tooShort' : undefined,
  maxTextLength: ({ length }) =>
      (value) => value && value.replace(/<[^>]*>/g,'').length > length ? 'tooLong' : undefined,
  nonEmptyText: (settings) => (value) => {
    if(!value) return 'empty'
    if(typeof value != 'string') return 'empty'
    value = value.replace(/<[^>]*>/g, "")
    if(!value.trim()) return 'empty'
  },

  ifEq: ({ prop, to, then }, { getValidator }) => {
    let validators = then.map(getValidator)
    const validator = (value, context) => {
      if(getField(context, prop) === to) {
        for(let v of validators) {
          const err = v(value, context)
          if(err) return err
        }
      }
    }
    validator.isRequired = (context) => {
      if(getField(context, prop) === to) {
        for(let v of validators) {
          if(v.isRequired && v.isRequired(context)) return true
        }
        return false
      }
    }
    return validator
  },

  switchBy: ({ prop, cases }, { getValidator }) => {
    let validators = {}
    for(let [value, then] of Object.entries(cases)) {
      validators[value] = then.map(getValidator)
    }
    const validator = (value, context) => {
      let selectorValue = getField(context, prop)
      for(let v of (validators[selectorValue] || [])) {
        const err = v(value, context)
        if(err) return err
      }
    }
    validator.isRequired = (context) => {
      let value = getField(context, prop)
      for(let v of validators[value]) {
        if(v.isRequired && v.isRequired(context)) return true
      }
      return false
    }
    return validator
  },

  ifNotOneOf: ({ prop, what, then }, { getValidator }) => {
    let validators = then.map(getValidator)
    const validator = (value, context) => {
      //console.error("VIF NOT ONE OF", getField(context, prop), what, what.includes(getField(context, prop)))
      if(!what.includes(getField(context, prop))) {
        //console.log("V", validators)
        for(let v of validators) {
          const err = v(value, context)
          if(err) return err
        }
      }
    }
    validator.isRequired = (context) => {
      if(!what.includes(getField(context, prop))) {
        for(let v of validators) {
          if(v.isRequired && v.isRequired(context)) return true
        }
        return false
      }
    }
    return validator
  },

  ifEmpty: ({ prop, then }, { getValidator }) => {
    let validators = then.map(getValidator)
    const validator = (value, context) => {
      if(!getField(context, prop)) {
        for(let v of validators) {
          const err = v(value, context)
          if(err) return err
        }
      }
    }
    validator.isRequired = (context) => {
      if(!getField(context, prop)) {
        for(let v of validators) {
          if(v.isRequired && v.isRequired(context)) return true
        }
        return false
      }
    }
    return validator
  },


  ifIncludes: ({ prop, that, then }, { getValidator }) => {
    let validators = then.map(getValidator)
    const validator = (value, context) => {
      if(getField(context, prop).includes(that)) {
        for(let v of validators) {
          const err = v(value, context)
          if(err) return err
        }
      }
    }
    validator.isRequired = (context) => {
      if(getField(context, prop).includes(that)) {
        for(let v of validators) {
          if(v.isRequired && v.isRequired(context)) return true
        }
        return false
      }
    }
    return validator
  },

  httpUrl: (settings) => (value) => {
    if(!value) return false // ignore empty
    try {
      const url = new URL(value)
      if(url.protocol !== 'http:' && url.protocol !== 'https:') return 'wrongUrl'
    } catch(e) {
      return 'wrongUrl'
    }
  }
}

export default validators
