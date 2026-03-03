import { hideMarksPlugin } from './hideMarks.js'
import { hideHeaderMarkPlugin } from './hideHeaderMark.js'

export function markdownLivePreviewExtensions() {
  return [
    hideMarksPlugin(),
    hideHeaderMarkPlugin()
  ]
}

