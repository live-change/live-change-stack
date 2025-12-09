import Task from './front/src/components/Task.vue'
import TaskModal from './front/src/components/TaskModal.vue'
import { taskAdminRoutes, cronAdminRoutes } from './front/src/router.js'

export { Task, TaskModal, taskAdminRoutes, cronAdminRoutes }

import en from "./front/locales/en.json"
import pl from "./front/locales/pl.json"
const locales = { en, pl }
export { locales }
