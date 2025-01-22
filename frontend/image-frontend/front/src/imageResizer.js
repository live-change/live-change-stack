import pica from 'pica'

const imageResizer = pica({
  features    : ['js', 'wasm', 'ww'],
  createCanvas: (w, h) => {
/*    if(window.OffscreenCanvas) {
      return new OffscreenCanvas(w, h)
    }*/
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    return canvas
  }
})

export default imageResizer