function parseList(str, sep = '.') {
  if(str[0] == '[' && str[str.length-1] == ']') {
    return eval(`(${str})`)
  } else {
    return str.split(sep).map(p => p.trim()).filter(p => !!p).map(v => {
      try {
        return eval(`(${v})`)
      } catch(err) {
        return v
      }
    })
  }
}

module.exports = parseList