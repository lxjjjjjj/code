const cp = require('child_process')
const { compare } = require('compare-versions')

module.exports = function () {
  try{
    cp.execSync('miniprogram-ci --version')
    let version = cp.execSync('minidev -v', { encoding: 'utf-8' })
    version = (version || '').trim()
    // minidev 是支付宝的cli工具 可以预览
    if (compare(version, '1.6.1', '<')) { // 当前 minidev 的版本小于 1.6.1，则需要重新安装
      console.log('当前版本过低，需要更新 minidev: ', version)
      cp.execSync('sudo npm i -g minidev@latest', { stdio: 'inherit' })
      console.log('安装完成，请重试')
      process.exit(0)
    }
  } catch {
    console.log('需要安装依赖，请输入密码:')
    cp.execSync('sudo npm i miniprogram-ci -g', { stdio: 'inherit' })
    cp.execSync('npm i -g minidev@latest --registry=https://registry.npmmirror.com', { stdio: 'inherit' })
    console.log('安装完成，请重试')
    process.exit(0)
  }
}