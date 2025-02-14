#!/usr/bin/env node

import fs from "fs/promises"

const packageData = JSON.parse(await fs.readFile(process.argv[2] || "package.json"))

const { dependencies, devDependencies } = packageData

console.log(JSON.stringify({
  dependencies,
  devDependencies
}, null, 2))
