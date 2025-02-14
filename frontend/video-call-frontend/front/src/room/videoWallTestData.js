let lastVideoId = 0
function testVideos(idPrefix, sizes) {
  return sizes.map(size => {
    const id = idPrefix + (++lastVideoId)
    const [width, height] = size.split('x').map(Number)
    return {
      id,
      size: { width, height },
      image: `/video-test/${size}.png`,
    }
  })
}

export default {
  mainVideos: testVideos('mainVideo-', [
    '1280x960',
    '2048x1080',
    '1280x720',
    '1280x720'
  ]),
  topVideos: testVideos('topVideo-', [
    '1280x960',
    '1280x720',
    '2048x1080',
  ]),
  myVideos: testVideos('myVideo-', [
    '2048x1080'
  ])
}
