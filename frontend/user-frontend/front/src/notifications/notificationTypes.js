import UnknownNotification from "./UnknownNotification.vue"
import TestNotification from "./TestNotification.vue"
import OpsMaintenanceNeeded from "./OpsMaintenanceNeeded.vue"
import TodoTaskNotification from "./TodoTaskNotification.vue"

export const notificationTypes = {
  unknown: {
    component: UnknownNotification
  },
  example_TestNotification: {
    component: TestNotification
  },
  ops_MaintenanceNeeded: {
    component: OpsMaintenanceNeeded
  },
  todo_TaskAssigned: {
    component: TodoTaskNotification
  }
}
