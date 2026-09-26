import App from '@live-change/framework'

import definition from './definition.js'
import config from './config.js'
import { Progress } from './progress.js'
import { Unlock } from './unlock.js'

const open = config.readAccess

definition.view({
  name: 'progressByRecipient',
  properties: {
    recipientType: {
      type: String,
      validation: ['nonEmpty']
    },
    recipient: {
      type: String,
      validation: ['nonEmpty']
    },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: {
      type: Progress
    }
  },
  access: open,
  async daoPath({ recipientType, recipient, ...props }) {
    const range = App.extractRange(props)
    return Progress.sortedIndexRangePath('byRecipient', [recipientType, recipient], range)
  }
})

definition.view({
  name: 'unlocksByRecipient',
  properties: {
    recipientType: {
      type: String,
      validation: ['nonEmpty']
    },
    recipient: {
      type: String,
      validation: ['nonEmpty']
    },
    ...App.rangeProperties
  },
  returns: {
    type: Array,
    of: {
      type: Unlock
    }
  },
  access: open,
  async daoPath({ recipientType, recipient, ...props }) {
    const range = App.extractRange(props)
    return Unlock.sortedIndexRangePath('byRecipient', [recipientType, recipient], range)
  }
})
