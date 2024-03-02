import { Extension } from '@tiptap/core'
import { collab } from '@tiptap/pm/collab'

const ProseMirrorCollab = Extension.create({
  addOptions() {
    return {
      version: 0,
      clientID: ''
    }
  },
  addProseMirrorPlugins() {
    const version = this.options.version
    const clientID = this.options.clientID
    if(!clientID) throw new Error('prosemirror collab clientId is required')
    return [
      collab({ version, clientID }),
    ]
  },
})

export default ProseMirrorCollab
