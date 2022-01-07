#!/usr/bin/env node
const SegfaultHandler = require('segfault-handler')

const dump = require('../lib/dump.js')
const exec = require('../lib/exec.js')
const request = require('../lib/request.js')
const get = require('../lib/get.js')
const observe = require('../lib/observe.js')

const parseList = require('../lib/parseList.js')

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason)
})

process.on('uncaughtException', function (err) {
  console.error(err.stack)
})

SegfaultHandler.registerHandler("crash.log");

function clientOptions(yargs) {
  yargs.option('serverUrl', {
    describe: 'database api url',
    type: 'string',
    default: 'http://localhost:9417/api/ws'
  })
}

function dumpOptions(yargs) {
  yargs.option('table', {
    describe: 'table name',
    type: 'string'
  })
  yargs.option('log', {
    describe: 'log name',
    type: 'string'
  })
  yargs.option('structure', {
    describe: 'dump structure',
    type: 'boolean'
  })
  yargs.option('metadata', {
    describe: 'dump only metadata',
    type: 'boolean'
  })
  yargs.option('targetDb', {
    describe: 'target database name'
  })
}

function execOptions(yargs) {
  yargs.option('targetDb', {
    describe: 'target database name'
  })
}

const argv = require('yargs') // eslint-disable-line
    .command('request <method> [args..]', 'request method on server', (yargs) => {
      clientOptions(yargs)
      yargs.positional('method', {
        describe: 'method to request',
        type: 'string'
      })
      yargs.positional('args', {
        describe: 'method arguments',
        type: 'string'
      })
      yargs.array('args')
    }, argv => {
      const method = parseList(argv.method)
      const args = argv.args.length == 1 ? parseList(argv.args[0]) : argv.args.map(v => {
        try {
          return eval(`(${v})`)
        } catch(err) {
          return v
        }
      })
      //console.dir({ method, args })
      request({ serverUrl: argv.serverUrl, method, args, verbose: argv.verbose })
    })
    .command('get <path>', 'gets value', (yargs) => {
      clientOptions(yargs)
      yargs.positional('path', {
        describe: 'value path',
        type: 'string'
      })
    }, argv => {
      const path = parseList(argv.path)
      //console.dir({ method, args })
      get({ serverUrl: argv.serverUrl, path, verbose: argv.verbose })
    })
    .command('observe <path>', 'observes value', (yargs) => {
      clientOptions(yargs)
      yargs.positional('path', {
        describe: 'value path',
        type: 'string'
      })
    }, argv => {
      const path = parseList(argv.path)
      //console.dir({ method, args })
      observe({ serverUrl: argv.serverUrl, path, verbose: argv.verbose })
    })
    .command('dump <db>', 'dump objects as requests json', (yargs) => {
      clientOptions(yargs)
      dumpOptions(yargs)
      yargs.positional('db', {
        describe: 'database name',
        type: 'string'
      })
    }, argv => {
      const db = argv.db
      dump({
        serverUrl: argv.serverUrl, verbose: argv.verbose, db: db, metadata: argv.metadata, structure: argv.structure,
        targetDb: argv.targetDb,
        tables: argv.table && (Array.isArray(argv.table) ? argv.table : [argv.table]),
        logs: argv.log && (Array.isArray(argv.log) ? argv.log : [argv.log])
      })
    })
    .command('exec [file]', 'exec commands from file', (yargs) => {
      clientOptions(yargs)
      execOptions(yargs)
      yargs.positional('file', {
        describe: 'file to with commands to execute',
        default: '-'
      })
    }, argv => {
      exec({
        serverUrl: argv.serverUrl, verbose: argv.verbose, file: argv.file,
        targetDb: argv.targetDb
      })
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Run with verbose logging'
    }).argv
