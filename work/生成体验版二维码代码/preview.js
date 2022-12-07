const resolveCiLibPath = require('./resolveCiLibPath')
const fs = require('fs')
const path = require('path')
const mkdirp = require('mkdirp')

/**
 * 微信生成二维码
 * @param config https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html
 * @returns {Promise<{errno: number, data: {platform: string, url: *}, errmsg: string}|{errno: number, data: *, errmsg: string}>}
 */
async function wxPreviewHandler (config = {}) {
  let {
    appId,
    qrcodeOutputDest,
    projectPath,
    desc,
    qrcodeFormat,
    privateKey,
    pagePath,
    searchQuery,
    scene,
    robot
  } = config

  createDir(qrcodeOutputDest)
  let ciPath = resolveCiLibPath('miniprogram-ci')
  const ci = eval('require')(ciPath)
  const start = Date.now()
  const project = new ci.Project({
    appid: appId,
    type: 'miniProgram',
    projectPath,
    privateKey: privateKey
  })

  console.log(`wx开始生成二维码`)
  try {
    await ci.preview({
      project,
      desc,
      qrcodeFormat,
      qrcodeOutputDest,
      pagePath,
      searchQuery,
      scene,
      useCOS: true,
      robot,
      onProgressUpdate: function (){}
    })
    console.log('wx构建二维码成功')
    const time = (Date.now() - start) / 1000
    return {
      errno: 0,
      errmsg: 'ok',
      mode: 'wx',
      url: qrcodeOutputDest,
      time
    }
  } catch (e) {
    console.log('wx构建二维码失败: ', e)
    return {
      errno: 2,
      mode: 'wx',
      errMsg: e
    }
  }
}

/**
 * 支付宝生成二维码
 * @param config https://opendocs.alipay.com/mini/01q7sb#%E5%B0%8F%E7%A8%8B%E5%BA%8F%E9%A2%84%E8%A7%88(sdk)
 * @returns {Promise<{errno: number, data: {platform: string, url: *}, errmsg: string}|{errno: number, data: *, errmsg: string}>}
 */
async function aliPreviewHandler (config ={}) {
  let {
    appId,
    toolId,
    privateKey,
    qrcodeOutputDest,
    projectPath,
    qrcodeFormat,
    searchQuery,
    page = ''
  } = config

  createDir(qrcodeOutputDest)
  let minidevPath = resolveCiLibPath('minidev')
  // console.log('minidevPath: ', minidevPath)
  const { minidev } = eval('require')(minidevPath)
  // minidev.setConfig({
  //   toolId,
  //   privateKey
  // })
  await minidev.config.useRuntime({
    'alipay.authentication.privateKey': privateKey,
    'alipay.authentication.toolId': toolId
  })

  console.log('ali 二维码开始生成')

  if (page && searchQuery) {
    page = page + '?' + searchQuery
  }
  const start = Date.now()
  try {
    const res = await minidev.preview({
      project: projectPath,
      appId,
      qrcodeFormat,
      localBuild: true,
      qrcodeOutput: qrcodeOutputDest,
      page,
      onProgressUpdate: () => {}
    })
    console.log('ali构建二维码成功')
    const time = (Date.now() - start) / 1000
    return {
      errno: 0,
      errmsg: 'ok',
      mode: 'ali',
      url: res.qrcodeUrl,
      time
    }
  } catch (e) {
    console.log('ali构建二维码失败')
    console.error(e)
    return {
      errno: 2,
      mode: 'ali',
      errmsg: e
    }
  }
}

function createDir (filePath) {
  const p = path.dirname(filePath)
  if (!fs.existsSync(p)) {
    mkdirp.sync(p)
  }
}

module.exports = {
  wxPreviewHandler,
  aliPreviewHandler
}


const path = require('path')
const cp = require('child_process')

const entryPath = {
  'miniprogram-ci': 'dist/index.js',
  minidev: 'lib/index.js'
}

module.exports = function (lib) {
  try {
    const prefix = cp.execSync('npm config get prefix', { encoding: 'utf8' }).replace(/[\r\n]/g, '')
    return path.join(prefix, 'lib/node_modules', lib, entryPath[lib])
  } catch (e) {
    console.log(e)
    return ''
  }
}
