import * as config from './front/src/tiptap/contentConfig.js'
import * as extensions from './front/src/tiptap/contentConfigExtensions.js'
export { config, extensions }

import ContentView from "./front/src/components/ContentView.js"
export { ContentView }

import ImageComponent from "./front/src/tiptap/ImageComponent.vue"
import ImageNode from "./front/src/tiptap/ImageNode.js"
import components from "./front/src/tiptap/components.js"

export { ImageComponent, ImageNode }

import DocumentEditor from "./front/src/components/DocumentEditor.vue"
import Editor from "./front/src/components/Editor.vue"
import EditorMenu from "./front/src/components/EditorMenu.vue"

export { DocumentEditor, Editor, EditorMenu }

import en from "./front/locales/en.json"
import pl from "./front/locales/pl.json"
const locales = { en, pl }
export { locales }
