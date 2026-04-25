export { default as CodeEditor } from './front/src/components/CodeEditor.vue'
export { default as Editor } from './front/src/components/Editor.vue'
export { default as RemoteAuthority } from './front/src/codemirror/RemoteAuthority.js'

import en from './front/locales/en.json'
import pl from './front/locales/pl.json'
const locales = { en, pl }
export { locales }
