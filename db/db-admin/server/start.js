import App from "@live-change/framework"
const app = App.app()

app.config = {}
const appConfig = app.config

import init from './init.js'
appConfig.init = init

import { starter } from '@live-change/cli'

starter(appConfig)
