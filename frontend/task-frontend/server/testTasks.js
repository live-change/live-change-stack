import App from '@live-change/framework'
const app = App.app()

import relationsPlugin from '@live-change/relations-plugin'
import accessControlService from '@live-change/access-control-service'

const definition = app.createServiceDefinition({
  name: "testTasks",
  use: [ relationsPlugin, accessControlService ]
})

import { task } from '@live-change/task-service'

import PQueue from 'p-queue'

const workersCount = 2
const workDuration = 1000
const pauseDuration = 500


const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const workerQueue = new PQueue({ concurrency: workersCount })

const getWood = task({
  name: 'getWood',
  properties: {
    woodType: {
      type: String,
      validation: ['nonEmpty']
    },
  },
  returns: {
    type: 'Wood',
    properties: {
      type: {
        type: String
      }
    }
  },
  async execute({ woodType }, { service, task }, emit) {
    await sleep(workDuration)
    return {
      type: 'Wood',
      woodType
    }
  }
})

const cutWood = task({
  name: 'cutWood',
  properties: {
    wood: {
      type: 'Wood',
      properties: {
        woodType: {
          type: String
        }
      }
    },
  },
  returns: {
    type: Array,
    of: {
      type: 'Plank',
      properties: {
        type: {
          type: String
        }
      }
    }
  },
  async execute({ wood }, { service, task }, emit) {
    await sleep(workDuration)
    return Array(4).fill(0).map(() => ({
      type: 'Plank',
      woodType: wood.woodType
    }))
  }
})

const makePlanks = task({
  name: 'makePlanks',
  properties: {
    woodType: {
      type: String,
      validation: ['nonEmpty']
    },
  },
  returns: {
    type: Array,
    of: {
      type: 'Plank',
      properties: {
        type: {
          type: String
        }
      }
    }
  },
  async execute({ woodType }, { service, task }, emit) {
    console.log("GETTING WOOD!", woodType)
    const wood = await workerQueue.add(() => task.run(getWood, { woodType, to: task.id }))
    console.log("GOT WOOD!", woodType, wood)
    await sleep(pauseDuration)
    const planks = await workerQueue.add(() => task.run(cutWood, { wood, to: task.id }))
    await sleep(pauseDuration)
    return planks
  }
})

const placePlank = task({
  name: 'placePlank',
  properties: {
    plank: {
      type: 'Plank'
    },
    to: {
      type: String
    },
    index: {
      type: Number
    }
  },
  async execute({ plank, to, index }, { service, task }, emit) {
    await sleep(workDuration)
    return {
      type: 'placedPlank',
      plank, index
    }
  }
})

const buildWall = task({
  name: 'buildWall',
  properties: {
    planks: {
      type: Array,
      of: {
        type: 'Plank'
      }
    },
    wallSize: {
      type: Number
    }
  },
  returns: {
    type: 'Wall',
    properties: {
      size: {
        type: Number
      }
    }
  },
  async execute({ planks, wallSize }, { service, task }, emit) {
    await sleep(pauseDuration)
    await Promise.all(planks.map((plank, index) => workerQueue.add(
      () => task.run(placePlank, { plank, to: task.id, index })
    )))
    await sleep(pauseDuration)
    return {
      type: 'Wall',
      size: wallSize
    }
  }
})

const buildRoof = task({
  name: 'buildRoof',
  properties: {
    planks: {
      type: Array,
      of: {
        type: 'Plank'
      }
    },
    roofSize: {
      type: Number
    }
  },
  returns: {
    type: 'Roof',
    properties: {
      size: {
        type: Number
      }
    }
  },
  async execute({ planks, roofSize }, { service, task }, emit) {
    await sleep(pauseDuration)
    await Promise.all(planks.map((plank, index) => workerQueue.add(
      () => task.run(placePlank, { plank, to: task.id, index })
    )))
    await sleep(pauseDuration)
    return {
      type: 'Roof',
      size: roofSize
    }
  }
})

const buildShelter = task({
  name: "buildShelter",
  properties: {
    size: {
      type: Object,
      properties: {
        width: { type: Number },
        height: { type: Number },
        length: { type: Number }
      },
      validation: ['nonEmpty']
    },
    woodType: {
      type: String,
      options: ['acacia', 'oak', 'birch', 'spruce'],
      validation: ['nonEmpty']
    },
  },
  returns: {
    type: 'Shelter',
    properties: {
      walls: {
        type: Array,
        of: {
          type: 'Wall'
        }
      },
      roof: {
        type: 'Roof'
      }
    }
  },
  async execute({ size: { width, height, length }, woodType }, { service, task }, emit) {
    //// Probably useless
    // compute wall sizes
    const wall1Size = width * height
    const wall2Size = length * height
    // compute roof size
    const roofSize = width * length
    // compute total plank blocks amount
    const howManyPlanks = wall1Size * 2 + wall2Size * 2 + roofSize

    let planksCounter = 0
    task.progress(planksCounter, howManyPlanks * 2)
    // gather planks
    const planks = await Promise.all( // do planks in parallel
      Array(howManyPlanks / 4)
        .fill(0)
        .map(
          async (v, index) => {
            const planks = await task.run(makePlanks, { woodType, to: task.id, index })
            planksCounter += 4
            await task.progress(planksCounter, howManyPlanks * 2)
            return planks
          }
        )
    )

    await sleep(pauseDuration)

    // build walls
    const walls = await Promise.all( // do walls in parallel
      [wall1Size, wall2Size, wall1Size, wall2Size].map(
        async (wallSize) => {
          const wall = await task.run(buildWall, { planks, wallSize })
          planksCounter += wallSize
          await task.progress(planksCounter, howManyPlanks * 2)
          return wall
        }
      )
    )

    await sleep(pauseDuration)

    // build roof
    const roof =
      await (async () => {
        const roof = await task.run(buildRoof, { planks, roofSize })
        planksCounter += roofSize
        await task.progress(planksCounter, howManyPlanks * 2)
        return roof
      })()

    console.log("ROOF", roof)
    
    await sleep(pauseDuration)

    return {
      type: 'Shelter',
      walls,
      roof
    }
  }
})

definition.action({
  name: "buildShelter",
  properties: {
    size: {
      type: Object,
      properties: {
        width: {
          type: Number,
          default: 4
        },
        height: {
          type: Number,
          default: 3
        },
        length: {
          type: Number,
          default: 4
        }
      },
      validation: ['nonEmpty']
    },
    woodType: {
      type: String,
      validation: ['nonEmpty'],
      options: ['acacia', 'oak', 'birch', 'spruce'],
      default: 'oak'
    },
    place: {
      type: String,
      validation: ['nonEmpty'],
      default: 'forest'
    }
  },
  async execute({ size, woodType, place }, { service, client, command }, emit) {
    await buildShelter.start({ size, woodType, place }, 'userAction', command.id)
  }
})

const Shelter = definition.model({
  name: "Shelter",
  properties: {
    size: {
      type: Object,
      properties: {
        width: { type: Number },
        height: { type: Number },
        length: { type: Number }
      },
      validation: ['nonEmpty']
    },
    woodType: {
      type: String,
      options: ['acacia', 'oak', 'birch', 'spruce'],
      validation: ['nonEmpty']
    },
    walls: {
      type: Array,
      of: {
        type: 'Wall'
      }
    },
    roof: {
      type: 'Roof'
    }
  }
})

definition.trigger({
  name: 'taskBuildShelterDone',
  properties: {
    shelter: {
      type: 'Shelter'
    }
  },
  async execute(props, { service, client }, emit) {
    console.log("Task done", props)
    const { result } = props
    console.log("Shelter built", result)
  }
})


export default definition
