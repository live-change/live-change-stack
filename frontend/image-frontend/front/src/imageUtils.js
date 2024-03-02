
function hasAlpha(canvas) {
  const context = canvas.getContext('2d')
  const data = context.getImageData(0, 0, canvas.width, canvas.height).data
  for (let i = 3, n = data.length; i < n; i+=4) {
    if (data[i] < 255) {
      return true
    }
  }
}

function getOrientation(jpegData) {
  if(window.forceOrientation) return window.forceOrientation

  let view = new DataView(jpegData)
  if (view.getUint16(0, false) != 0xFFD8) return undefined
  let length = view.byteLength, offset = 2
  while (offset < length) {
    let marker = view.getUint16(offset, false)
    offset += 2
    if (marker == 0xFFE1) {
      if (view.getUint32(offset += 2, false) != 0x45786966) return undefined
      let little = view.getUint16(offset += 6, false) == 0x4949
      offset += view.getUint32(offset + 4, little)
      let tags = view.getUint16(offset, little)
      offset += 2
      for (let i = 0; i < tags; i++)
        if (view.getUint16(offset + (i * 12), little) == 0x0112)
          return (view.getUint16(offset + (i * 12) + 8, little))
    }
    else if ((marker & 0xFF00) != 0xFF00) break;
    else offset += view.getUint16(offset, false)
  }
  return undefined
}

function blobToDataUrl(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader()
    reader.onload = function(e) {
      resolve(e.target.result)
    }
    reader.onerror = function(e) {
      reject(e.target.error)
    }
    reader.readAsDataURL(file)
  })
}

function loadImageUpload(file) {
  return new Promise(function(resolve, reject) {
    let img = document.createElement("img")
    let reader = new FileReader()
    reader.onload = async function(e) {
      if(file.type == "image/jpeg") {
        let headerReader = new FileReader()
        headerReader.onload=function(he) {
          let orientation = getOrientation(he.target.result)
          img.onload = function(e) {
            resolve({
              image: img,
              type: file.type,
              orientation: orientation,
              sizeSwap: orientation>4,
              width: orientation>4 ? img.height : img.width,
              height: orientation>4 ? img.width : img.height
            })
          }
          img.src = e.target.result
        }
        headerReader.onerror = function(e) {
          reject(e.target.error)
        }
        headerReader.readAsArrayBuffer(file.slice(0, 64 * 1024))
      } else {
        img.onload = function(e) {
          resolve({
            image: img,
            type: file.type,
            width: img.width,
            height: img.height
          })
        }
        img.src = e.target.result
      }
    }
    reader.onerror = function(e) {
      reject(e.target.error)
    }
    reader.readAsDataURL(file)
  })
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    let image = new Image
    image.onload = () => {
      resolve(image)
    }
    image.onerror = (ev) => {
      reject(ev)
    }
    image.src = url
  })
}

function resize(img, w, h) {
  let canvas=imageUtils.imageToCanvas(img)
  resizeCanvas(canvas,w,h)
  return canvas.toDataURL("image/jpeg",1)
}

                          // 0  1  2  3  4  5  6  7  8
const reverseOrientations = [0, 0, 2, 3, 4, 5, 8, 7, 6]

let exifOrientationSupportPromise = null
async function isExifOrientationSupported() {
  if(!exifOrientationSupportPromise) exifOrientationSupportPromise = new Promise((resolve, reject) => {
    const img = new Image()
    img.onerror = function() {
      resolve(false)
    }
    img.onload = function() {
      resolve(img.width !== 2)
    }
    img.src = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QAiRXhpZgAASUkqAAgAAAABABIBAwABAAAABgASAAAAAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAIDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+/iiiigD/2Q==';
  })
  return exifOrientationSupportPromise
}

function cancelOrientation(canvas, orientation) {
  const change = reverseOrientations[orientation]
  if(change) return changeOrientation(canvas, change)
  return canvas
}

function changeOrientation(canvas, orientation) {
  console.log("CHANGE ORIENTATION", orientation, canvas.width, canvas.height, canvas)
  const w = canvas.width
  const h = canvas.height
  let w2 = 0
  let h2 = 0
  const fromIData = canvas.getContext("2d").getImageData(0, 0, w, h)
  const fromData = fromIData.data
  let toIData
  switch(orientation) {
    case 2 : {
      w2=w
      h2=h
      canvas.width = w2
      canvas.height = h2
      toIData = canvas.getContext("2d").getImageData(0, 0, w2, h2)
      const toData = toIData.data
      for(let y=0; y<h; y++) {
        for(let x=0; x<w; x++) {
          const from=x+y*w
          const to=(w-x-1)+y*w
          toData[(to<<2)+0] = fromData[(from<<2)+0]
          toData[(to<<2)+1] = fromData[(from<<2)+1]
          toData[(to<<2)+2] = fromData[(from<<2)+2]
          toData[(to<<2)+3] = fromData[(from<<2)+3]
        }
      }
    } break;
    case 3 : {
      w2 = w
      h2 = h
      canvas.width = w2
      canvas.height = h2
      toIData = canvas.getContext("2d").getImageData(0, 0, w2, h2)
      const toData = toIData.data
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const from = (w - x - 1) + y * w
          const to = x + (h - y - 1) * w
          toData[(to << 2) + 0] = fromData[(from << 2) + 0]
          toData[(to << 2) + 1] = fromData[(from << 2) + 1]
          toData[(to << 2) + 2] = fromData[(from << 2) + 2]
          toData[(to << 2) + 3] = fromData[(from << 2) + 3]
        }
      }
    }break;
    case 4 : {
      w2=w
      h2=h
      canvas.width = w2
      canvas.height = h2
      toIData = canvas.getContext("2d").getImageData(0, 0, w2, h2)
      const toData = toIData.data
      for(let y=0; y<h; y++) {
        for(let x=0; x<w; x++) {
          const from = x+y*w
          const to = x+(h-y-1)*w
          toData[(to<<2)+0] = fromData[(from<<2)+0]
          toData[(to<<2)+1] = fromData[(from<<2)+1]
          toData[(to<<2)+2] = fromData[(from<<2)+2]
          toData[(to<<2)+3] = fromData[(from<<2)+3]
        }
      }
    } break;
    case 5 : {
      w2 = h
      h2 = w
      canvas.width = w2
      canvas.height = h2
      toIData = canvas.getContext("2d").getImageData(0, 0, w2, h2)
      const toData = toIData.data
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const from = x + y * w
          const to = y + x * w2
          toData[(to << 2) + 0] = fromData[(from << 2) + 0]
          toData[(to << 2) + 1] = fromData[(from << 2) + 1]
          toData[(to << 2) + 2] = fromData[(from << 2) + 2]
          toData[(to << 2) + 3] = fromData[(from << 2) + 3]
        }
      }
    } break;
    case 6 : {
      w2 = h
      h2 = w
      canvas.width = w2
      canvas.height = h2
      toIData = canvas.getContext("2d").getImageData(0, 0, w2, h2)
      const toData = toIData.data
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const from = x + y * w
          const to = y + (h2 - x - 1) * w2
          toData[(to << 2) + 0] = fromData[(from << 2) + 0]
          toData[(to << 2) + 1] = fromData[(from << 2) + 1]
          toData[(to << 2) + 2] = fromData[(from << 2) + 2]
          toData[(to << 2) + 3] = fromData[(from << 2) + 3]
        }
      }
    } break;
    case 7 : {
      w2 = h
      h2 = w
      canvas.width = w2
      canvas.height = h2
      toIData = canvas.getContext("2d").getImageData(0, 0, w2, h2)
      const toData = toIData.data
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const from = x + y * w
          const to = (w2 - y - 1) + (h2 - x - 1) * w2
          toData[(to << 2) + 0] = fromData[(from << 2) + 0]
          toData[(to << 2) + 1] = fromData[(from << 2) + 1]
          toData[(to << 2) + 2] = fromData[(from << 2) + 2]
          toData[(to << 2) + 3] = fromData[(from << 2) + 3]
        }
      }
    } break;
    case 8 : {
      w2 = h
      h2 = w
      canvas.width = w2
      canvas.height = h2
      toIData = canvas.getContext("2d").getImageData(0, 0, w2, h2)
      const toData = toIData.data
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const from = x + y * w
          const to = (w2 - y - 1) + x * w2
          toData[(to << 2) + 0] = fromData[(from << 2) + 0]
          toData[(to << 2) + 1] = fromData[(from << 2) + 1]
          toData[(to << 2) + 2] = fromData[(from << 2) + 2]
          toData[(to << 2) + 3] = fromData[(from << 2) + 3]
        }
      }
    } break;
    default: {
      w2 = w
      h2 = h
      canvas.width = w2
      canvas.height = h2
      toIData = canvas.getContext("2d").getImageData(0, 0, w2, h2)
      const toData = toIData.data
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const from = x + y * w
          const to = x + y * w
          toData[(to << 2) + 0] = fromData[(from << 2) + 0]
          toData[(to << 2) + 1] = fromData[(from << 2) + 1]
          toData[(to << 2) + 2] = fromData[(from << 2) + 2]
          toData[(to << 2) + 3] = fromData[(from << 2) + 3]
        }
      }
    } break;
  }

  canvas.getContext("2d").putImageData(toIData, 0, 0)
  return canvas
}

function imageToCanvas(image) {
  const canvas= document.createElement("canvas")
  canvas.width = image.width
  canvas.height = image.height
  const ctx = canvas.getContext("2d")
  ctx.save()
  ctx.drawImage(image, 0, 0)
  return canvas
}

function resizeCanvas(canvas, w, h) {
  const img = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height)
  const img2 = canvas.getContext("2d").getImageData(0, 0, w, h)
  const inputData = img.data
  const outputData = img2.data
  resampleHermite(inputData, canvas.width, canvas.height, outputData, w, h)
  canvas.getContext("2d").clearRect(0, 0, Math.max(canvas.width, w), Math.max(canvas.height, h))
  canvas.width = w
  canvas.height = h
  canvas.getContext("2d").putImageData(img2, 0, 0);
}

function cropCanvas(canvas, x, y, w, h) {
  const img = canvas.getContext("2d").getImageData(x, y, w, h)
  canvas.width=w
  canvas.height=h
  canvas.getContext("2d").putImageData(img, 0, 0)
}

function resampleHermite(src, w, h, dest, w2, h2){
  const startTime = Date.now()
  const ratio_w = w / w2
  const ratio_h = h / h2
  const ratio_w_half = Math.ceil(ratio_w/2)
  const ratio_h_half = Math.ceil(ratio_h/2)

  for(let j = 0; j < h2; j++){
    for(let i = 0; i < w2; i++){
      const x2 = (i + j*w2) * 4;
      const center_y = (j + 0.5) * ratio_h

      let weight = 0;
      let weights = 0;
      let weights_alpha = 0;
      let gx_r = 0
      let gx_g = 0
      let gx_b = 0
      let gx_a = 0

      for(let yy = Math.floor(j * ratio_h); yy < (j + 1) * ratio_h; yy++){
        const dy = Math.abs(center_y - (yy + 0.5)) / ratio_h_half
        const center_x = (i + 0.5) * ratio_w
        const f0 = dy*dy //pre-calc part of f
        for(let xx = Math.floor(i * ratio_w); xx < (i + 1) * ratio_w; xx++){
          let dx = Math.abs(center_x - (xx + 0.5)) / ratio_w_half
          const f = Math.sqrt(f0 + dx*dx)
          if(f >= -1 && f <= 1){
            //hermite filter
            weight = 2 * f*f*f - 3*f*f + 1
            if(weight > 0){
              dx = 4*(xx + yy*f)
              //alpha
              gx_a += weight * src[dx + 3]
              weights_alpha += weight
              //colors
              if(src[dx + 3] < 255)
                weight = weight * src[dx + 3] / 250
              gx_r += weight * src[dx]
              gx_g += weight * src[dx + 1]
              gx_b += weight * src[dx + 2]
              weights += weight
            }
          }
        }
      }
      dest[x2]     = gx_r / weights
      dest[x2 + 1] = gx_g / weights
      dest[x2 + 2] = gx_b / weights
      dest[x2 + 3] = gx_a / weights_alpha
    }
  }
  console.log(`hermite resample took ${Date.now() - startTime}ms`)

}

function getDataURIData(dataURI) {
  // convert base64/URLEncoded data component to raw binary data held in a string
  let byteString
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(dataURI.split(',')[1])
  else
    byteString = unescape(dataURI.split(',')[1])
  // write the bytes of the string to a typed array
  let ia = new Uint8Array(byteString.length)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return ia
}

function getDataURIMime(dataURI) {
  return dataURI.split(',')[0].split(':')[1].split(';')[0]
}


const methods = {
  getOrientation,
  loadImageUpload,
  resize,
  changeOrientation,
  cancelOrientation,
  imageToCanvas,
  resizeCanvas,
  cropCanvas,
  resampleHermite,
  getDataURIData,
  getDataURIMime,
  blobToDataUrl,
  hasAlpha,
  isExifOrientationSupported,
  loadImage
}

export {
  getOrientation,
  loadImageUpload,
  resize,
  changeOrientation,
  cancelOrientation,
  imageToCanvas,
  resizeCanvas,
  cropCanvas,
  resampleHermite,
  getDataURIData,
  getDataURIMime,
  blobToDataUrl,
  hasAlpha,
  isExifOrientationSupported,
  loadImage
}

export default methods
