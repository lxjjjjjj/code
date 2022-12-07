/**
 * 在用户提交之前将lock文件里面的无效resolved更改还原，防止出现不同人修改后合并代码冲突的情况
 */
 const fs = require('fs')
 const exec = require('child_process').exec
 let jsonLockRawData = fs.readFileSync('package-lock.json')
 const tempfileName = '.templock.json'
 const chalk = require('chalk')
 let jsonLock = JSON.parse(jsonLockRawData)
 let diffs = 0
 
 function biggerThan (sourceVersion, targetVersion) {
   let targetVs = targetVersion.replace(/[\r\n]/g, '').split('.')
   let srcVs = sourceVersion.replace(/[\r\n]/g, '').split('.')
   let bigger = false
   for (let index in srcVs) {
     if (+srcVs[index] > +targetVs[index]) {
       bigger = true
     }
   }
   return bigger
 }
 
 function updateResolve(nowJsonLock, formerJsonLock) {
   // npm7
   if (nowJsonLock.packages) {
     for (let depKey in nowJsonLock.packages) {
       const packageItem = nowJsonLock.packages[depKey]
       const formerPackageItem = formerJsonLock.packages ? formerJsonLock.packages[depKey] : {}
       if (depKey &&
         packageItem.version === formerPackageItem.version &&
         packageItem.integrity === formerPackageItem.integrity &&
         packageItem.resolved !== formerPackageItem.resolved
       ) {
         packageItem.resolved = formerPackageItem.resolved
         diffs++
       }
     }
   }
   for (let depKey in nowJsonLock.dependencies) {
     const nowDep = nowJsonLock.dependencies[depKey]
     const formerDep = (formerJsonLock.dependencies ? formerJsonLock.dependencies[depKey] : {}) || {}
     if (
       nowDep.version === formerDep.version &&
       nowDep.integrity === formerDep.integrity &&
       nowDep.resolved !== formerDep.resolved
     ) {
       nowDep.resolved = formerDep.resolved
       diffs++
     }
     if (nowDep.dependencies) {
       updateResolve(nowDep, formerDep)
     }
   }
 }
 // 和上一次的做比对的时候，发现中途用lock-veri的人没法解决与master之间的冲突了，所以考虑把参考的文件改成master
 
 // 1、先查看package-lock是否在舞台区域
 let checkcmd = 'git diff --name-only --cached'
 // 2、读取未修改之前的package-lock并存储
 // let cmd = `git show HEAD:package-lock.json > ${tempfileName}`
 let cmd = `git show master:package-lock.json > ${tempfileName}`
 // 3、校准之后重新添加lock文件到缓存区
 let addlockcmd = 'git add package-lock.json'
 // 4、完毕后删掉临时存储的temp lock文件
 let rmcmd = `rm -rf ${tempfileName}`
 exec(checkcmd, (error, stdout, stderr) => {
   if (!error && stdout.indexOf('package-lock.json') > -1) {
     exec('npm -v', (error, stdout, stderr) => {
       if (!error) {
         if (biggerThan(stdout, '6.0.0') && biggerThan('8.0.0', stdout)) {
           exec(cmd, (error, stdout, stderr) => {
             if (!error) {
               let formerJsonLock = JSON.parse(fs.readFileSync(tempfileName))
               updateResolve(jsonLock, formerJsonLock)
               if (diffs) {
                 console.log('precommit: package-lock文件防冲突校准中...')
                 fs.writeFileSync('package-lock.json', JSON.stringify(jsonLock, null, 2))
                 exec(addlockcmd, (error, stdout, stderr) => {
                   if (!error) console.log('precommit: package-lock文件防冲突校准完成')
                 })
               }
             }
             // 获取命令执行的输出
             exec(rmcmd)
           })
         } else {
           console.log(chalk.red('precommit校验失败：项目npm版本只支持npm6与npm7，您当前版本为' + stdout + ',请调整npm版本'))
           process.exit(1)
         }
       }
     })
   }
 })
 