import pica from 'pica'

const imageResizer = pica({
  createCanvas: (w, h) => new OffscreenCanvas(w, h)
})

export default imageResizer