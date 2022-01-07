function nonEmpty(value) {
  console.log("NON EMPTY", value)
  if(!value) return 'empty'
  if(typeof value == 'string') {
    if(!value.trim()) return 'empty'
  }
  if(Array.isArray(value)) {
    if(value.length == 0) return 'empty'
  } else if(value instanceof Date) {
    return
  } if(typeof value == 'object') {
    if(Object.keys(value).length == 0) return 'empty'
  }
}

nonEmpty.isRequired = () => true

module.exports = {

  nonEmpty: (settings) => nonEmpty,

  minLength: ({ length }) => (value) => value.length < length ? 'tooShort' : undefined,
  maxLength: ({ length }) => (value) => value.length > length ? 'tooLong' : undefined,

}