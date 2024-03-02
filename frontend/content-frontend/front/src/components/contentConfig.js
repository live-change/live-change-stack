import { config } from "@live-change/wysiwyg-frontend"

const { basicMarks, pageNodes } = config

const contentConfig = {
  marks: {
    ...basicMarks
  },
  nodes: {
    //...messageNodes,
    //...richEditorNodes
    ...pageNodes
  }
}

export default contentConfig
