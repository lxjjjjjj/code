#!/usr/bin/env node
require('./check')()
const args = process.argv.slice(2)
const rawBranch = args[0]
const mode = args[1] || 'wx'
const robot = args[2] || 0
const app = 'didi'

if (!rawBranch) {
  console.log('请输入分支名')
  process.exit(0)
}
console.log([rawBranch, mode])

const fs = require('fs')
const path = require('path')
const compressing = require('compressing')
const axios = require('axios')
const open = require('open')
const rimraf = require('rimraf')
const prepareEnv = require('./prepareEnv')
const config = require('../config/index')
const { downDist } = require('./down')
// const { drawImage } = require('./canvas')

const log = console.log

const downHost = 'http://10.96.86.117/miniprogram'
const MODE_MAP = {
  wx: '微信',
  ali: '支付宝'
}
const libMap = {
  wx: 'miniprogram-ci',
  ali: 'minidev'
}

const isBranch = !fs.existsSync(rawBranch) // 是分支: true 本地代码: false
const branch = isBranch ? rawBranch.replace(/\//g, '_') : rawBranch

let fileStorePath = ''

const { wxPreviewHandler, aliPreviewHandler } = require('./preview')

run().then()

async function run() {
  let t = prepareEnv(libMap[mode])
  if (t) {
    log('\x1B[33m%s\x1b[0m:', 'Please run the following command to install the dependency \r\n ', `sudo npm i -g ${libMap[mode]}`)
    process.exit(1)
  }

  let filePath = ''
  let stamp = ''
  let projectPath = ''
  let doneCb = () => {}

  if (isBranch) {
    stamp = branch + '_' + mode + '_' + Math.floor(Math.random() * 10000)
    await requestUnZip()
    projectPath = path.join(filePath, `dist/${mode}`)
  } else {
    // 路径
    stamp = mode + '_' + Math.floor(Math.random() * 10000)
    projectPath = path.resolve(branch)
    log('项目文件路径: ', projectPath)
  }

  async function requestUnZip() {
    const url = `${downHost}/${rawBranch}/${mode}/${mode}.zip`
    log(`下载源码: ${url}`)
    const storePath = path.join(config[app].distPath, stamp)
    const suffix = 'zip'
    fileStorePath = storePath
    try {
      let downRes = await downDist({ url, mode, storePath, suffix })
      filePath = downRes.filePath
    } catch (e) {
      log(e.response.status, e.response.config.url)
      clearFiles()
      process.exit(0)
      return
    }

    try {
      log(`开始解压: ${filePath}.${suffix}`)
      await compressing[suffix].uncompress(`${filePath}.${suffix}`, filePath)
      log(`解压完成: ${filePath}`)
      doneCb = () => {
        clearFiles() // 解压成功时，在等到构建完成时，才需要清除文件夹
      }
    } catch (e) {
      log('解压失败: ', e)
      clearFiles()
      process.exit(0)
    }
  }

  const outputDest = path.join(config[app].previewPath, `${stamp}.png`)
  let res
  if (mode === 'wx') {
    res = await wxPreviewHandler({
      appId: config[app].appId[mode],
      qrcodeOutputDest: outputDest,
      projectPath,
      qrcodeFormat: 'image',
      privateKey: config[app].private.wx,
      robot
    })
  } else {
    res = await aliPreviewHandler({
      appId: config[app].appId[mode],
      qrcodeOutputDest: outputDest,
      projectPath,
      qrcodeFormat: 'image',
      ...config[app].private.ali
    })
  }
  await dealRes(res, outputDest)
  doneCb()
  process.exit(0)
}

async function dealRes(data, outputDest) {
  try {
    const { errno, mode, url, time } = data
    if (errno === 0) {
      let pre = '本地代码'
      let buildTime
      if (isBranch) {
        buildTime = await getBuildTimer(mode)
        buildTime && log(`分支提交构建时间: ${buildTime}`)
        pre = `${rawBranch}分支`
      }
      /*await drawImage({
        mode: mode,
        branch: isBranch ? rawBranch : null,
        imgPath: url,
        outputDest,
        commitTime: buildTime,
        consumeTime: time
      })*/
      log(`${pre} ${MODE_MAP[data.mode]} 二维码构建完毕`)
      log(`构建二维码用时: ${data.time}s`)
      mode === 'ali' && log('url: ' + data.url)
      open(outputDest)
    } else {
      log(data.e)
    }
  } catch (e) {
    log(e)
  }
}

function clearFiles() {
  if (fileStorePath) {
    log('清空文件夹: ', fileStorePath)
    rimraf.sync(fileStorePath)
  }
}

async function getBuildTimer(mode) {
  try {
    const url = `${downHost}/${rawBranch}/${mode}/timer.txt`
    const { data } = await axios({ url })
    return data
  } catch (e) {
    e = e || {}
    console.error('获取分支构建时间失败: ', e.response)
  }
  return ''
}

重点 如何生成一个命令执行 在package.json下的bin指令写响应文件的路径就可以了
比如
"bin": {
    "mpCommonClass": "bin/index.js"
  },