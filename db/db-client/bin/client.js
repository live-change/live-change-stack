#!/usr/bin/env node

import dump from '../lib/dump.js'
import exec from '../lib/exec.js'
import filterDump from '../lib/filterDump.js'
import statsDump from '../lib/statsDump.js'
import request from '../lib/request.js'
import get from '../lib/get.js'
import observe from '../lib/observe.js'
import parseList from '../lib/parseList.js'

import yargs from 'yargs'

process.on('unhandledRejection', (reason, event) => {
  console.error('Unhandled Rejection at: Promise',
    "reason", reason, "stack", reason && reason.stack, "promise", reason && reason.promise)
})

process.on('uncaughtException', function (err) {
  console.error(err.stack)
})

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
  yargs.option('progressFile', {
    describe: 'progress file path (default lcdbc-exec.progress); set false to disable. line= is last successful request; after timeout use --fromLine <inFlightLine> to retry',
    type: 'string',
    default: 'lcdbc-exec.progress'
  })
  yargs.option('fromLine', {
    describe: '1-based inclusive file line to start from (matches progress line=). After success continue with line+1; after timeout retry with inFlightLine',
    type: 'number',
    default: 0
  })
  yargs.option('skipIndex', {
    describe: 'skip createIndex requests (restore tables/logs only)',
    type: 'boolean',
    default: false
  })
  yargs.option('onlyIndex', {
    describe: 'run only createIndex requests (and sync barriers)',
    type: 'boolean',
    default: false
  })
  yargs.option('requestTimeout', {
    describe: 'request timeout in ms (0 = no timeout)',
    type: 'number',
    default: 0
  })
  yargs.option('excludeTable', {
    describe: 'exclude put/putOldLog data for table or log name (repeatable)',
    type: 'string',
    array: true
  })
}

yargs(process.argv.slice(2)) // eslint-disable-line
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
      const args = argv.args.length === 1 ? parseList(argv.args[0]) : argv.args.map(v => {
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
        serverUrl: argv.serverUrl,
        verbose: argv.verbose,
        file: argv.file,
        targetDb: argv.targetDb,
        progressFile: argv.progressFile,
        fromLine: argv.fromLine,
        skipIndex: argv.skipIndex,
        onlyIndex: argv.onlyIndex,
        requestTimeout: argv.requestTimeout,
        excludeTable: argv.excludeTable
      }).catch((error) => {
        console.error(error && error.stack ? error.stack : error)
        process.exit(1)
      })
    })
    .command('filter [file]', 'filter dump jsonl to stdout (drop put/putOldLog for tables)', (yargs) => {
      yargs.positional('file', {
        describe: 'dump file (default stdin)',
        default: '-'
      })
      yargs.option('excludeTable', {
        describe: 'exclude put/putOldLog data for table or log name (repeatable)',
        type: 'string',
        array: true,
        demandOption: true
      })
    }, argv => {
      filterDump({
        file: argv.file,
        excludeTable: argv.excludeTable
      }).catch((error) => {
        console.error(error && error.stack ? error.stack : error)
        process.exit(1)
      })
    })
    .command('stats [file]', 'summarize dump put/putOldLog counts and sizes', (yargs) => {
      yargs.positional('file', {
        describe: 'dump file (default stdin)',
        default: '-'
      })
      yargs.option('sort', {
        describe: 'sort by bytes or entries (descending)',
        choices: ['bytes', 'entries'],
        default: 'bytes'
      })
      yargs.option('human', {
        describe: 'human-readable sizes (KiB/MiB/GiB)',
        type: 'boolean',
        default: false
      })
    }, argv => {
      statsDump({
        file: argv.file,
        sort: argv.sort,
        human: argv.human
      }).catch((error) => {
        console.error(error && error.stack ? error.stack : error)
        process.exit(1)
      })
    })
    .option('verbose', {
      alias: 'v',
      type: 'boolean',
      description: 'Run with verbose logging'
    }).argv
