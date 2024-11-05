import App from '@live-change/framework'
const app = App.app()

import definition from './definition.js'
import config from './config.js'

const SurveyDesign = definition.model({
  name: "SurveyDesign",
  propertyOfAny: {
    to: ['topic'],
    writeAccessControl: {
      roles: config.adminRoles
    },
    readAccessControl: {
      roles: []
    },
    extendedWith: ['topic']
  },
  properties: {
    name: {
      type: String,
      validation: ['nonEmpty', { name: 'maxLength', length: 128 }]
    },
    title: {
      type: String,
      validation: ['nonEmpty', { name: 'maxLength', length: 128 }]
    },
    introduction: {
      type: String,
      input: 'textarea',
      validation: ['nonEmpty', { name: 'maxLength', length: 512 }]
    },
    questions: {
      type: Array,
      of: {
        type: Object,
        properties: {
          type: {
            type: String,
            validation: ['nonEmpty'],
            options: ['text', 'textarea', 'choice', 'multipleChoice']
          },
          name: {
            type: String,
            validation: ['nonEmpty', { name: 'maxLength', length: 128 }]
          },
          label: {
            type: String,
            validation: ['nonEmpty', { name: 'maxLength', length: 128 }]
          },
          description: {
            type: String,
            input: 'textarea',
            validation: ['nonEmpty', { name: 'maxLength', length: 512 }]
          },
          required: {
            type: Boolean,
            default: false
          },
          minLength: {
            if: App.isomorphic(
              ({ props, propName }) => ['text', 'textarea']
                .includes(props.questions[+(propName.split('.')[1])].type)
            ),
            input: 'integer',
            type: Number
          },
          maxLength: {
            if: App.isomorphic(
              ({ props, propName }) => ['text', 'textarea']
                .includes(props.questions[+(propName.split('.')[1])].type)
            ),
            input: 'integer',
            type: Number
          },
          options: {
            if: App.isomorphic(
              ({ props, propName }) => ['choice', 'multipleChoice']
                .includes(props.questions[+(propName.split('.')[1])].type)
            ),
            type: Array,
            of: {
              type: Object,
              properties: {
                name: {
                  type: String,
                  validation: ['nonEmpty', { name: 'maxLength', length: 128 }]
                },
                label: {
                  type: String,
                  input: 'textarea',
                  validation: ['nonEmpty', { name: 'maxLength', length: 512 }]
                }
              }
            }
          }
        }
      }
    }
  }
})

const Survey = definition.model({
  name: "Survey",
  sessionOrUserProperty: {
    ownerCreateAccess: () => true,
    extendedWith: ['topic']
  },
  properties: {

  },
})

export { Survey }