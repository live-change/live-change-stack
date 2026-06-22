import { defaultHighlightStyle } from '@codemirror/language'
import { StyleModule } from 'style-mod'

let mounted = false

export function ensureCodeMirrorHighlightStyles() {
  if (typeof window === 'undefined' || mounted) return
  StyleModule.mount(window.document, defaultHighlightStyle.module)
  mounted = true
}
