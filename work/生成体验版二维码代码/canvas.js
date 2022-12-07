const fs = require('fs')
const moment = require('moment')
// const { createCanvas, loadImage } = require('canvas')
const getDirName = require('path').dirname
const mkdirp = require('mkdirp')

const MODE_MAP = {
  wx: [25, 'm'],
  ali: [6, 'd']
}

function getTime(mode) {
  const cur = new moment()
  const [dur, unit] = MODE_MAP[mode]
  // 为现有的时间增加时间变成过期时间，比如 [25, 'm'] 25分钟的意思 [6, 'd'] 6天的意思
  const time = cur.add(dur, unit)
  return time.format('MM/DD HH:mm')
}

function tryLoadCanvas() {
  try {
    // const { createCanvas, loadImage } = eval('require')('canvas')
    const { createCanvas, loadImage } = require('canvas')
    return {
      createCanvas,
      loadImage
    }
  } catch (e) {
    return {}
  }
}

module.exports = {
  async drawImage(option = {}) {
    const { createCanvas, loadImage } = tryLoadCanvas()
    if (!createCanvas || !loadImage) {
      // console.log('为提升用户体验，可升级ms工具: npm i -g @didi/myshell')
      return
    }
    const {
      mode, // wx / ali
      branch, // 分支
      imgPath, // 图片路径
      outputDest, // 存储路径
      commitTime, // 构建完成时间 
      consumeTime // 耗时
    } = option

    const width = 600
    const height = 700

    const canvas = createCanvas(width, height)
    const context = canvas.getContext('2d')

    context.fillStyle = '#383838'
    context.fillRect(0, 0, width, height)

    context.font = '24px #9c9c9c'
    context.textAlign = 'center'

    let top = 480

    const paintText = (text, top, color = '#9c9c9c', x) => {
      context.fillStyle = color
      const textWidth = context.measureText(text).width
      context.fillText(text, x || (100 + textWidth / 2), top)
    }

    // paintText(`将于 ${getTime(mode)} 时失效`, top, '#9c9c9c', width / 2)
    paintText(`将于 ${getTime(mode)} 失效`, top, '#9c9c9c')

    if (branch) {
      top = top + 50
      paintText(`分支: ${branch}`, top)
    }

    if (commitTime) {
      top = top + 50
      paintText(`构建完成时间: ${commitTime}`, top)
    }

    if (consumeTime) {
      top = top + 50
      paintText(`耗时: ${consumeTime}s`, top)
    }

    const image = await loadImage(imgPath)
    const imageWidth = 400
    context.fillStyle = '#fff'
    context.fillRect((width - imageWidth) / 2, 20, imageWidth, imageWidth)
    context.drawImage(image, (width - imageWidth) / 2, 20, imageWidth, imageWidth)
    const buffer = canvas.toBuffer('image/png')

    const dir = getDirName(outputDest)
    mkdirp.sync(dir)
    fs.writeFileSync(outputDest, buffer)
    console.log('dra canvas done...')
  }
}
