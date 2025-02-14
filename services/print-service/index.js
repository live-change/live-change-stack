import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'

import "./authentication.js"
import { printToPdfFileTask } from "./printPdf.js"
import { screenshotToFileTask } from "./screenshot.js"

export { printToPdfFileTask, screenshotToFileTask }


export default definition
