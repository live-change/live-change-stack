#!/usr/bin/env node
import path from 'path'
import fs from 'fs'
import Server from '../lib/Server.js'
import { client as WSClient } from "@live-change/dao-websocket"
import ReactiveDao from '@live-change/dao'
import * as db from "@live-change/db"
import profileOutput from "../lib/profileOutput.js"
import { performance } from 'perf_hooks'
import yargs from 'yargs'
import { fileURLToPath } from 'url'

import {
  SsrServer,
  createLoopbackDao
} from "@live-change/server"

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection',
      "reason", reason, "stack", reason.stack, "promise", promise)
  //process.exit(1) // TODO: database should not fail because of it, but it should be logged somewhere
})

process.on('uncaughtException', function (err) {
  console.error('uncaughtException', err)
})

function serverOptions(yargs) {
  yargs.option('port', {
    describe: 'port to bind on',
    type: 'number',
    default: 9417
  })
  yargs.option('host', {
    describe: 'bind host',
    type: 'string',
    default: '::'
  })
  yargs.option('master', {
    describe: 'replicate from master',
    type: 'string',
    default: null
  })
  yargs.option('slowStart', {
    type: 'boolean',
    description: 'start indexes one after another(better for debugging)'
  })
  yargs.option('profileLog', {
    type: 'string',
    description: 'profiling log file path'
  })
}

function storeOptions(yargs, defaults = {}) {
  yargs.option('dbRoot', {
    describe: 'server root directory',
    type: 'string',
    default: defaults.dbRoot || '.'
  })
  yargs.option('backend', {
    describe: 'database backend engine ( lmdb | leveldb | rocksdb | memdown | mem )',
    type: "string",
    default: defaults.backend || 'lmdb'
  })
  yargs.option('backendUrl', {
    describe: 'remote database backend address',
    type: "string"
  })
}

const argv = yargs(process.argv.slice(2)) // eslint-disable-line
    .command('create', 'create database root', (yargs) => {
      storeOptions(yargs)
    }, (argv) => create(argv))
    .command('serve', 'start server', (yargs) => {
      serverOptions(yargs)
      storeOptions(yargs)
    }, (argv) => {
      serve(argv)
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Run with verbose logging'
    }).argv

async function create({ dbRoot, backend, verbose }) {
  await fs.promises.mkdir(dbRoot, { recursive:true })
  if(verbose) console.info(`creating database in ${path.resolve(dbRoot)}`)
  let server = new Server({ dbRoot, backend })
  await server.initialize({ forceNew: true })
  if(verbose) console.info(`database server root directory created.`)
}

async function serve(argv) {
  const { dbRoot, backend, backendUrl, verbose, host, port, master, slowStart, profileLog } = argv
  if(profileLog) {
    const out = profileOutput(profileLog)
    await db.profileLog.startLog(out, performance)
  }
  const profileOp = await db.profileLog.begin({ operation: "startingDbServer", ...argv })
  if(verbose) console.info(`starting server in ${path.resolve(dbRoot)}`)
  let server = new Server({
    dbRoot, backend, backendUrl, master,
    slowStart
  })

  process.on('unhandledRejection', (reason, promise) => {
    if(reason.stack && reason.stack.match(/\s(userCode:([a-z0-9_.\/-]+):([0-9]+):([0-9]+))\n/i)) {
      server.handleUnhandledRejectionInQuery(reason, promise)
    } else {
      console.error('Unhandled Promise Rejection', (reason && reason.stack) || reason, "Promise:", promise)
      //process.exit(1) // TODO: database should not fail because of it, but it should be logged somewhere
    }
  })

  await server.initialize()
  if(verbose) console.info(`database initialized!`)
  if(verbose) console.info(`listening on: ${argv.host}:${argv.port}`)

  const ssrRoot = path.dirname(
      fileURLToPath(import.meta.resolve("@live-change/db-admin/front/vite.config.js"))
  )

  const http = await server.getHttp()
  const { app } = http

  const dev = await fs.promises.access(path.resolve(ssrRoot, './dist'), fs.constants.R_OK)
    .then(r => false).catch(r => true)
  if(dev) console.log("STARTING ADMIN IN DEV MODE!")
  const manifest = (dev || argv.spa)
      ? null
      : JSON.parse(fs.readFileSync((path.resolve(ssrRoot, 'dist/client/.vite/ssr-manifest.json'))))
  const admin = new SsrServer(app, manifest, {
    dev,
    fastAuth: true,
    root: ssrRoot,
    daoFactory: async (credentials, ip) => {
      return await createLoopbackDao(credentials, () => server.apiServer.daoFactory(credentials, ip))
    }
  })
  admin.start()
  http.server.listen(port, host)

  if(verbose) console.info(`server started!`)
  await db.profileLog.end(profileOp)
}
