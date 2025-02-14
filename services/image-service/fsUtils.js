import fs from 'fs/promises'

function move(from, to) {
  return fs.rename(from, to)
}

function copy(from, to) {
  return fs.copyFile(from, to)
}

function mkdir(name) {
  return fs.mkdir(name, { recursive: true })
}

function rmdir(path) {
  return fs.rm(path, { recursive: true, force: true })
}

export { move, copy, mkdir, rmdir }