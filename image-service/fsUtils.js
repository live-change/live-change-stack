const fs = require('fs')

function move(from, to) {
  return new Promise((resolve,reject) => {
    fs.rename(from, to, (err) => {
      if(err) return reject(err)
      resolve(to)
    })
  })
}

function copy(from, to) {
  return new Promise((resolve,reject) => {
    fs.copyFile(from, to, (err) => {
      if(err) return reject(err)
      resolve(to)
    })
  })
}

function mkdir(name) {
  return new Promise( (resolve, reject) => {
    fs.mkdir(name, { recursive: true }, (err) => {
      if(err) return reject(err)
      resolve(name)
    })
  })
}

function rmdir(path) {
  return new Promise( (resolve, reject) => {
    rimraf("/some/directory", (err) => {
      if(err) return reject(err)
      resolve(path)
    })
  })
}

module.exports = { move, copy, mkdir, rmdir }