import appConfig from './app.config.js'

import * as services from './services.list.js'
for(const serviceConfig of appConfig.services) {
  serviceConfig.module = services[serviceConfig.name]
}
appConfig.init = services['init']

import { starter } from '@live-change/cli'

starter(appConfig)

import os from 'os'
const formatMemoryUsage = (data) => `${Math.round(data / 1024 / 1024 * 100) / 100} MB`;
const formatUptime = (data) => // dd:hh:mm:ss
  `${Math.floor(data / 86400)}:`
  +`${Math.floor(data % 86400 / 3600)}:${Math.floor(data % 3600 / 60)}:${Math.floor(data % 60)}`
setInterval(() => {
  const memoryData = process.memoryUsage()
  if(typeof gc != 'undefined') {
    console.log("Running GC!")
    gc()
  }
  console.log(`Memory usage:`)
  console.log(`  rss: ${formatMemoryUsage(memoryData.rss)}`)
  console.log(`  heapTotal: ${formatMemoryUsage(memoryData.heapTotal)}`)
  console.log(`  heapUsed: ${formatMemoryUsage(memoryData.heapUsed)}`)
  console.log(`  external: ${formatMemoryUsage(memoryData.external)}`)
  console.log(`  arrayBuffers: ${formatMemoryUsage(memoryData.arrayBuffers)}`)
  console.log(`  os total: ${formatMemoryUsage(os.totalmem())}`)
  console.log(`  os free: ${formatMemoryUsage(os.freemem())}`)
  console.log(`  os uptime: ${formatUptime(os.uptime())}`)
  console.log(`---------------------------------`)
}, 5000)

