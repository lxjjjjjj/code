[部署自己项目的CICD](https://juejin.cn/post/7137143919418015751)
# 什么是CI持续集成
简单集成的弱点，多个人在相互隔离的分支长时间开发，最后一次集成所有代码，一起测试，最后可能会导致意想不到的结果。持续集成就是每次新的分支都是基于最新的master分支代码开发测试的，如果测试通过了将大大减少最后集成可能出现的问题。
### 优点
- 减少在合并 feature 时出现的意外次数。
- 解决“在我的机子上没问题”的问题
- 将测试周期切片到每个 feature 逐渐合并到主线中的阶段（而不是一次性的）

# 什么是CD持续交付
软件测试完很长时间不部署，只等到最后一次交付软件才部署，因为生产环境和测试环境的不同，所以会导致某些bug的出现，所以要持续交付。
### 优点
- 可以减少不同环境造成的bug

# CI/CD 可以做的事情
[字节原文链接](https://juejin.cn/post/6888636811237654536)
我们可以在每次代码提交后执行预置的任务，比如代码风格及质量检查，安全检查，构建产物检测，部署到集成环境，对部署后的环境跑各种测试（兼容性测试，真机测试，性能测试等），产出各种检测报告；我们也可以在几分钟内快速完成版本的上线，回滚，切换等操作。

前端服务跟后端服务有着本质区别。大部分前端项目（暂不考虑 BFF）都是静态资源的托管，不涉及到其他昂贵的计算资源，一个最简单的解决办法只需要一个 Nginx 就足够。前端托管显然不是提供 HTTP 服务就足够的。后来我们考虑到需要实现比较复杂的路由匹配、小流量等逻辑，也需要兼顾可维护性，我们选择了基于 golang 实现这个服务。这个服务可以作为公共服务直接使用，考虑到某些业务的高访问量，也能够单独部署以免影响到其他业务的稳定性。


# Gitlab CI

gitlab-ci配置文档：https://docs.gitlab.com/ee/ci/yaml/#keyword-reference-for-the-gitlab-ciyml-file

### 关键步骤解释

以下将对一些比较**关键和复杂**的点做一些解释。

#### Gitlab Runners

`Gitlab` 本身仅仅是一个代码平台，我们在使用它的 `CI/CD` 工作流时，`Gitlab` 本身并不会为我们提供 `CI/CD` 工作流的运行环境。

但是 `Gitlab` 允许我们自己创建 `CI/CD` 工作流的运行环境，这个环境被称为 `Gitlab-Runner`，后面我们简称为 `Runner。`

#### Runner 的创建

客观上来讲，`Gitlab` 仅仅是负责将我们的代码交给 `Runner` 去做操作，`Gitlab` 本身并不关心 `Runner` 上的任何过程以及环境问题。所以为了保证我们的 `Runner` 机器都具有**执行工作流的能力以及环境配置**（node、npm、ssh等），我们需要在 `Runner` 机器上提前准备好这些环境。

第二个问题是一台 `Runner` 机器理论上只能执行一条 `push` 所触发的 CI/CD 流程。好在 `Gitlab` 本身支持为项目注册多台 `Runner` 机器去并行执行多条 `push` 所触发的 `CI/CD` 流程。

结合以上两个问题，结论是我们必须维护若干台具有同样初始环境的 `Runner` 机器，才能保证 Gitlab `CI/CD` 流程的顺利运行。

#### 团队小程序上线服务

该服务目前存在**两条流水线**，并且都包含部署流程。流水线的过程分为两步：

1、执行编译构建流程，实际上是执行该服务下的 `build.sh` 文件，该文件会设置好node以及npm环境，并把**镜像文件**当作产出物打包。

2、执行部署流程，部署流程中每条流水线选择了**5台实例**进行部署，即产出物会部署在5台机器上，此步骤会根据项目的 [Dockerfile](http://eng.xiaojukeji.com/service/group/705/code/repo/34518/master/dockerfiles/Dockerfile?type=blob) 创建镜像，镜像包含了 `Gitlab Runner` 注册所需的环境，并执行 `Gitlab Runner` [注册脚本](http://eng.xiaojukeji.com/service/group/705/code/repo/34518/master/dockerfiles/start.sh?type=blob)。

该服务的两条流水线执行成功后会为主小程序创建 `10` 台环境相同的 `Runner` 机器，供 `Gitlab CD/CD` 流程使用。

#### gitlab-ci.yml文件

该文件决定了 `Gitlab CI/CD` 流程的执行过程。配置文档见： https://docs.gitlab.com/ee/ci/yaml/#keyword-reference-for-the-gitlab-ciyml-file

每次 `push` 触发时，`Gitlab` 会验证该文件，检查改动、分支等是否符合工作流程，如果有触发合适的 `jobs` ，则会将此 `CI/CD` 流程分配至空闲的 `Runner` 机器上去运行。

#### deploy-by-mode.sh脚本

该脚本会在 `gitlab-ci.yml` 文件配置的工作流中执行，当然，这个工作流是我们自己配置的。

该脚本的作用主要是将 `wx` 和 `ali` 的产出物压缩，并上传至 **117 服务器**，以供QA进行生产代码的拉取。

#### 117服务器

该服务器主要用于我们团队的静态资源存储，其中 `authorize_keys` 记录了我们通用镜像的一些`ssh keys`，方便免密上传文件和执行脚本。

#### @didi/myshell脚本管理工具

该工具主要用于脚本的管理，**统一下载和上传**，避免了一个脚本当作文件四处传播，出问题或是更新通知不及时的问题。

所有能下载的脚本都存放于 [ms-ecology](https://git.xiaojukeji.com/ms-ecology) 仓库，QA侧主要使用的是 [qa-script](https://git.xiaojukeji.com/ms-ecology/qa-script) 脚本，通过 `ms add qa-script` 添加后能获得**拉取117代码**的能力。

QA同学使用 `ms _main` 命令时，实际上是执行了从 [qa-script](https://git.xiaojukeji.com/ms-ecology/qa-script) 下载下来的 `main.sh` 脚本，该脚本的功能即是访问 **117 服务器**，下载对应分支的静态资源。


## 新版 OE 构建流程

### 背景

由于 webpack5 缓存服务的接入，Gitlab CI/CD 流程无法良好的应用 webpack 缓存进行构建，且 Gitlab Pipeline Triggers 服务无法再创建的情况下，Gitlab CI/CD 对于效率的提升已经微乎其微了，于是我们决定将构建流程迁移到OE上来。

这样有两个好处：

1、OE的构建没有 Runner 机器的上限限制。

2、OE每次构建都是基于同样的Docker镜像，可以保证缓存路径的一致性。

### 流程概览

![](https://dpubstatic.udache.com/static/dpubimg/fc4e399e-f425-4223-89c5-a8bd6dfdd74a.png)

### 关键步骤解释

新版OE构建步骤和 `Gitlab` 大体上是相似的，唯一的区别在于我们将 `Runner` 上运行的流程迁移到了 OE 容器当中。

#### 流水线

新版流程相比于原 `Gitlab CI/CD` 流程来讲，需要手动为分支创建流水线。

创建流水线的链接：http://eng.xiaojukeji.com/group/705/service/25740/pipeline

创建流水线步骤：**新建 -> 选择分支 -> 输入流水线名称（可以自己想）-> 选择模板：分支通用构建模板 -> 下一步 -> 生成流水线**

第一次需要手动触发，后续流水线会监听代码的 `push` 自动执行。

#### build.sh脚本

如果说 `Gitlab CI/CD` 流程中，`gitlab-ci.yml`文件决定了 `Runner` 机器上的执行流程，那么 `build.sh` 则是决定了 OE 中 Docker 镜像的执行流程。

#### Docker镜像

OE 流水线的 **「编译构建」** 流程会默认执行项目根目录下的 `build.sh` 文件，在执行前会初始化镜像环境，我们使用的镜像环境为：`hub.xiaojukeji.com/lihuanyu/fe-oe-runner:v0.7`，该环境集成了node、npm 以及 117 xiaoju 用户的免密登陆配置。

#### oe-deploy-by-mode.sh脚本

该脚本与 `deploy-by-mode.sh` 脚本功能类似，由于 Gitlab Runner 和 OE Docker 的环境变量会有一些差异，我们无法直接复用 `deploy-by-mode.sh` 脚本，所以我们新增了 `oe-deploy-by-mode.sh` 脚本在 OE Docker 环境中做代码上传。

该脚本也会将构建产出物上传至 117 服务器供 QA 进行代码拉取。

build.sh

```
#!/bin/bash

# OE_BRANCH_NAME 为空时退出，防止本地执行导致删库
if [ -z "${OE_BRANCH_NAME}" ]; then
    exit 1
fi

## get git origin head commit sha
#NOW_ORIGIN_SHA=`git rev-parse origin/$OE_BRANCH_NAME`
## OE_COMMIT_SHA 和 NOW_ORIGIN_SHA 不同时，退出
#if [ "${OE_COMMIT_SHA}" != "${NOW_ORIGIN_SHA}" ]; then
#    echo "请执行最新流水线，避免覆盖服务器最新产物"
#    exit 1
#fi

set -e

echo "set npm registry"
npm config set registry http://npm.intra.xiaojukeji.com/

echo "fix node-sass install"
export SASS_BINARY_PATH='/home/xiaoju/.npm/node-sass/4.14.1/linux-x64-83_binding.node'

echo "start install deps  \n\n\n"
npm ci || exit_code=$?
if [[ $exit_code ]]; then
  echo "ci出错";
  npm run dcRequest "$OE_TRIGGER_USER" "1" "$OE_GROUP_ID" "$OE_SERVICE_ID" "$OE_PIPELINE_ID" "$OE_BRANCH_NAME";
  exit 1;
fi;
#echo "run unit test case  \n\n\n"
#npm t
#npm run lint

#download cache for webpack5
sh scripts/downLoad.sh ${MODE}

# i18n 包更新
echo "start update i18n package"
npm run i18n # 拉取最新的i18n包
# MODE == "ali:hk" 时，更新i18n包
if [ "${MODE}" = "ali:hk" ]; then
  npm run build:i18n:hk # 更新i18n hk包
else
  npm run build:i18n # 更新i18n包
fi

# 执行prod命令
npm run prod --mode=${MODE} || exit_code=$?
if [[ $exit_code -eq 1 ]]; then
  echo "编译出错";
  npm run dcRequest "$OE_TRIGGER_USER" "2" "$OE_GROUP_ID" "$OE_SERVICE_ID" "$OE_PIPELINE_ID" "$OE_BRANCH_NAME";
  exit 1;
fi;
# 后续错误只输出，但是不中断代码包上传
if [[ $exit_code -eq 3 ]]; then
  echo -e "\033[31m 包体积校验失败 \033[0m";
  npm run dcRequest "$OE_TRIGGER_USER" "$exit_code" "$OE_GROUP_ID" "$OE_SERVICE_ID" "$OE_PIPELINE_ID" "$OE_BRANCH_NAME";
fi;
if [[ $exit_code -eq 4 ]]; then
  echo -e "\033[31m 存在冗余包版本 \033[0m";
  npm run dcRequest "$OE_TRIGGER_USER" "$exit_code" "$OE_GROUP_ID" "$OE_SERVICE_ID" "$OE_PIPELINE_ID" "$OE_BRANCH_NAME";
fi;

sh scripts/oe-deploy-by-mode.sh ${MODE}

# 产出物打包
mkdir output

cp -R dist/* output

exit $exit_code

#scp -r miniprogram.zip timer.txt webpack-analyze-wx-report.html webpack-analyze-ali-report.html xiaoju@10.96.86.117:/home/xiaoju/webroot/miniprogram/${OE_BRANCH_NAME}

```
dcRequest

```
const http = require('http')
const args = process.argv.splice(2)
const [pipeLineOwner, exitCode, groupId, serviceId, pipelineId, branchName] = args
console.log('pipeLineOwner, exitCode, groupId, serviceId, pipelineId, branchName', pipeLineOwner, exitCode, groupId, serviceId, pipelineId, branchName)
const reasonMap = {
  1: '依赖包安装',
  2: 'build构建',
  3: '包体积阈值检测',
  4: '依赖包冗余检测',
  5: 'esCheck语法检测'
}
console.log('args', args)
const data = JSON.stringify({
  token: 'mtq2yte4ztu2ntgymtawmaff',
  toUsers: pipeLineOwner,
  content: '滴滴小程序编译构建的错误消息',
  target: 'dc',
  dcp: {
    notifyType: 'news',
    markdown: false,
    messageBody: {
      title: '滴滴出行小程序通知',
      pcContentSourceUrl: `http://eng.xiaojukeji.com/group/${groupId}/service/${serviceId}/pipeline/${pipelineId}`,
      appContentSourceUrl: `http://eng.xiaojukeji.com/group/${groupId}/service/${serviceId}/pipeline/${pipelineId}`,
      description: `${branchName}分支构建失败,是${reasonMap[exitCode]}错误,可点击查看详情查看具体报错信息,根据文档http://wiki.intra.xiaojukeji.com/pages/viewpage.action?pageId=625033538修改对应错误`,
      senderName: '滴滴出行小程序构建通知',
      senderAvatar: 'https://dpubstatic.udache.com/static/dpubimg/1590e7c6-856a-4c37-bc1a-836093ff41b5.png',
      thumbnail: ''
    }
  }
})
const options = {
  hostname: '10.88.128.15',
  port: 8000,
  path: '/feige/sendDingNotify',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}

const send = http.request(options, res => {
  console.log(`状态码: ${res.statusCode}`)

  res.on('data', d => {
    process.stdout.write(d)
  })
  res.on('end', function () {
    process.stdout.write('end')
  })
})

send.on('error', error => {
  console.error(error)
})
console.log('已经执行到send了')
send.write(data)
send.end()

```
从远程分支下载.cache文件缩短构建流程

```
MODE=$1

# replace : into - for MODE
# ali:hk -> ali-hk
MODE=${MODE//:/-}

# 下载cache文件
#npm run cacheServer ${OE_BRANCH_NAME} ${MODE} 1
remotedir=${OE_BRANCH_NAME}_${MODE}
mkdir -p ".cache/${MODE}-compiler-production"
scp -r "root@10.96.76.161:/tmp/cache/${remotedir}/*" ".cache/${MODE}-compiler-production/"
if [ -d ".cache" ];then
  du -h .cache/
else
  echo -e "***********远程不存在.cache文件夹****************"
fi

ifconfig
```
du 查看文件或者目录所占用的磁盘空间

文件表达式
-e filename 如果 filename存在，则为真
-d filename 如果 filename为目录，则为真 
-f filename 如果 filename为常规文件，则为真
-L filename 如果 filename为符号链接，则为真
-r filename 如果 filename可读，则为真 
-w filename 如果 filename可写，则为真 
-x filename 如果 filename可执行，则为真
-s filename 如果文件长度不为0，则为真
-h filename 如果文件是软链接，则为真
filename1 -nt filename2 如果 filename1比 filename2新，则为真。
filename1 -ot filename2 如果 filename1比 filename2旧，则为真。


整数变量表达式
-eq 等于
-ne 不等于
-gt 大于
-ge 大于等于
-lt 小于
-le 小于等于


字符串变量表达式
If  [ $a = $b ]                 如果string1等于string2，则为真
                                字符串允许使用赋值号做等号
if  [ $string1 !=  $string2 ]   如果string1不等于string2，则为真       
if  [ -n $string  ]             如果string 非空(非0），返回0(true)  
if  [ -z $string  ]             如果string 为空，则为真
if  [ $sting ]                  如果string 非空，返回0 (和-n类似) 


    逻辑非 !                   条件表达式的相反
if [ ! 表达式 ]
if [ ! -d $num ]               如果不存在目录$num


    逻辑与 –a                   条件表达式的并列
if [ 表达式1  –a  表达式2 ]


    逻辑或 -o                   条件表达式的或
if [ 表达式1  –o 表达式2 ]


oe-deploy-by-mode.sh


```
MODE=$1

# replace : into - for MODE
# ali:hk -> ali-hk
MODE=${MODE//:/-}

# OE_BRANCH_NAME 为空时退出，防止本地执行导致删库
if [ -z "${OE_BRANCH_NAME}" ]; then
    exit 1
fi

echo "开始部署$MODE小程序包"
# 连接服务并删除已有的 MODE 包
ssh -t xiaoju@10.96.86.117 "mkdir -p /home/xiaoju/webroot/miniprogram/${OE_BRANCH_NAME}/${MODE} && rm -rf /home/xiaoju/webroot/miniprogram/${OE_BRANCH_NAME}/$MODE/*"
echo "----------"
echo ${OE_BRANCH_NAME}

scp dist/${MODE}-size-report.json .
scp dist/${MODE}-es-check.log .
scp dist/compileLog.json .

zip -rq ${MODE} dist/${MODE}

# 记录构建时间
echo $(date "+%Y-%m-%d %H:%M:%S") > timer.txt

# 这里不放到根目录，拆开成按模块上传之后如果放到根目录无法批量删除更新
scp -r ${MODE}.zip timer.txt ${MODE}-size-report.json ${MODE}-es-check.log compileLog.json xiaoju@10.96.86.117:/home/xiaoju/webroot/miniprogram/${OE_BRANCH_NAME}/$MODE

# add mode to modes.txt
# it will create a modes.txt file.
# and upload it to server.
sh scripts/addModes.sh ${MODE} "/home/xiaoju/webroot/miniprogram/${OE_BRANCH_NAME}"


#备份存储一份master的数据
if [ "master" = ${OE_BRANCH_NAME} ]; then
  ssh -t xiaoju@10.96.86.117 "mkdir -p /home/xiaoju/webroot/miniprogram/master_$(date "+%Y%m%d")/${MODE} && rm -rf /home/xiaoju/webroot/miniprogram/master_$(date "+%Y%m%d")/${MODE}/*"
  scp -r ${MODE}.zip timer.txt ${MODE}-size-report.json xiaoju@10.96.86.117:/home/xiaoju/webroot/miniprogram/master_$(date "+%Y%m%d")/${MODE}
  sh scripts/addModes.sh ${MODE} "/home/xiaoju/webroot/miniprogram/master_$(date "+%Y%m%d")"
  echo -e "******* master备份保存数据完毕 *******\n 备份地址：http://10.96.86.117/miniprogram/master_$(date "+%Y%m%d")"
  # 备份缓存利用率 + 缓存大小 测试没问题再放开
  sh scripts/cache.sh ${MODE}
fi
# 测试
# sh scripts/cache.sh ${MODE}

COMMIT_MESSAGE=`git log --pretty=format:"%s %b" ${OE_COMMIT_SHA} -1`
npm run uploadMaster ${MODE} "$OE_COMMIT_SHA" "$COMMIT_MESSAGE"

rm -f ${MODE}.zip


# cache start: webpack5备份cache文件,wx 和 ali的不同
echo -e "------------------------cache start--------------"

du -h  .cache/
if [ -d ".cache" ];then
  echo -e "*********存在.cache文件夹, 准备进行上传置于后台**********"
  ssh -t root@10.96.76.161 "rm -rf /tmp/cache/${OE_BRANCH_NAME}_${MODE}"
  scp -r .cache/${MODE}-compiler-production/. root@10.96.76.161:/tmp/cache/${OE_BRANCH_NAME}_${MODE} &
#  npm run cacheServer ${OE_BRANCH_NAME} ${MODE} 0
else
  echo -e "***********不存在.cache文件夹****************"
fi
echo -e "------------------------cache end--------------"
# cache end

echo -e "******* ${MODE}环境部署完成 *******\n 请通知QA同学执行脚本进行测试"
echo -e "体积分析平台地址：\n ${MODE}: http://mp-size-report.intra.xiaojukeji.com/page/home#/versions/manage?branch=${OE_BRANCH_NAME}&from=didi_ci"
echo -e "若有esCheck报错，请查看文件：\n ${MODE}: http://10.96.86.117/miniprogram/${OE_BRANCH_NAME}/${MODE}/${MODE}-es-check.log"
echo -e "若想查看项目中冗余包版本，请查看文件：\n ${MODE}: http://10.96.86.117/miniprogram/${OE_BRANCH_NAME}/${MODE}/compileLog.json"

echo -e "******* 环境部署完成 *******\n 请通知QA同学执行脚本进行测试"

#curl http://api-kylin-xg02.intra.xiaojukeji.com/webapp_pipeline_notice_feat_mp_ci_offline_with_network/api/mppreview?branch=${OE_BRANCH_NAME}

```
# 在提交代码前的校验

```
#!/bin/bash

currentBranch=`git rev-parse --abbrev-ref HEAD`
// 获取当前分支名

targetBranch='master'

if [ $currentBranch == $targetBranch ]
then
  echo 'error: master cannot push'
  exit 1
fi

exit 0
```
# git hooks钩子的使用

git hooks是一些自定义的脚本，用于控制git工作的流程，分为客户端钩子和服务端钩子。

Husky可以将git内置的钩子暴露出来，很方便地进行钩子命令注入，而不需要在.git/hooks目录下自己写shell脚本了。您可以使用它来lint您的提交消息、运行测试、lint代码等。当你commit或push的时候。husky触发所有git钩子脚本。

### 客户端钩子

```
客户端钩子分为很多种。 下面把它们分为：提交工作流钩子、电子邮件工作流钩子和其它钩子。主要介绍提交工作流钩子：pre-commit、prepare-commit-msg、commit-msg、post-commit。

pre-commit（常用）
在键入提交信息前运行。 它用于检查即将提交的快照。例如，检查是否有所遗漏，确保测试运行，以及核查代码。 如果该钩子以非零值退出，Git 将放弃此次提交，不过你可以用 git commit --no-verify 来绕过这个环节。 你可以利用该钩子，来检查代码风格是否一致（运行类似 lint 的程序）、尾随空白字符是否存在（自带的钩子就是这么做的），或新方法的文档是否适当。

```

[gitHooks详细解释](https://juejin.cn/post/6974301879731748900)


```
{
  "name": "mp-app-home",
  "version": "1.0.0",
  "productVersion": "6.3.16",
  "mpVersion": "0.0.18-2",
  "description": "A mpx project",
  "main": "index.js",
  "scripts": {
    "watch:wx": "npm run watch --mode=wx --mini=true",
    "watch": "node --max-old-space-size=8192 ./build/build.js -w",
    "help": "node ./build/build.js --help",
    "lint": "eslint --ext .js,.ts,.mpx ./src",
    "lintcommit": "eslint $(git diff --name-only | grep -E '\\.(js|ts|mpx)$' | xargs)",
    "release": "npm ci && npm run prod:cross",
    "offline": "npm run prod --offline",
    "uploadImg": "node ./scripts/gift.js imgs3 /dist/cdnImages/img img/ 1",
    "esCheck": "mpx-es-check --module --ecma=6 './dist/**/*.js'",
    "checkDev": "node ./build/checkDev.js",
    "uploadMaster": "node ./scripts/upload-file.js",
    "uploadGift": "node ./scripts/gift.js",
    "build:i18n": "node ./i18n/i18n.js > ./i18n/i18nFile.js",
    "build:i18n:hk": "node ./i18n/i18n.js hk > ./i18n/i18nFile.js",
    "checkLock": "node lock-veri.js",
    "dcRequest": "node ./scripts/dcRequest.js",
    "cacheServer": "node cacheServer/index.js",
    "jest:only": "jest test/subpackage/estimate/new-estimate/layout.spec.js --runInBand --no-cache",
    "jest:debug": "jest test/subpackage/sidebar/pages/mine.spec.js --runInBand --no-cache --coverage"
  },
  "author": "pengqingwen <pengqingwen@didichuxing.com>",
  "license": "ISC",
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged && npm run checkLock",
      "pre-push": "sh ./pre-push.sh"
    }
  },
  "lint-staged": {
    "*.{js,ts,mpx}": [
      "npm run lintcommit -- --fix"
    ]
  }
}
```
### npm版本检查

```
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

// 1、先查看package-lock是否在舞台区域  查看package.lock
文件是否更改 我只想获取两个修订版之间已更改文件的列表
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

```
# build 构建文件

```
const rm = require('rimraf')
const chalk = require('chalk')
const webpack = require('webpack')
const program = require('commander')
const { userConf, supportedModes } = require('../config/index')
const getWebpackConf = require('./getWebpackConf')
const getMockServer = require('./getMockServer')
const { resolveDist, getRootPath } = require('./utils')
const productVersion = require('../package.json').productVersion

/**
 * 1. 体积检查ERROR 3
 * 2. 打包warning 1
 * 3. 冗余包检测 4
*/
function setExitCode(code) {
  if (process.__codeSetted) return
  process.exitCode = code
  process.__codeSetted = true
}

program
  .option('-w, --watch', 'watch mode')
  .option('-p, --production', 'production release')
  .parse(process.argv)

const env = process.env

const ci = !!process.env.OE_PIPELINE_ID || !!process.env.CI

const modeStr = env.npm_config_mode || env.npm_config_modes || ''

const report = env.npm_config_report || false

const mock = env.npm_config_mock || false

const offline = env.npm_config_offline || false

const mini = env.npm_config_mini || ''

const gulf = env.npm_config_gulf || ''

const modes = modeStr.split(/[,|]/)
  .map((mode) => {
    const modeArr = mode.split(':')
    if (supportedModes.includes(modeArr[0])) {
      return {
        mode: modeArr[0],
        env: modeArr[1]
      }
    }
    return {
      mode: userConf.srcMode
    }
  }).filter((item) => item)

if (!modes.length) {
  modes.push({
    mode: userConf.srcMode
  })
}

// 开启子进程
if (userConf.openChildProcess && modes.length > 1) {
  let scriptType = ''
  const isProduct = program.production
  const isWatch = program.watch
  if (!isProduct && isWatch) scriptType = 'watch'
  if (isProduct && !isWatch) scriptType = 'build'
  if (isProduct && isWatch) scriptType = 'watch:prod'
  if (!isProduct && !isWatch) scriptType = 'build:dev'

  const spawn = require('child_process').spawn
  while (modes.length > 1) {
    const modeObj = modes.pop()
    const modeAndEnv = modeObj.env ? `${modeObj.mode}:${modeObj.env}` : modeObj.mode
    const ls = spawn('npm', ['run', scriptType, `--modes=${modeAndEnv}`, `--mode=${modeAndEnv}`], { stdio: 'inherit' })
    ls.on('close', (code) => {
      setExitCode(code)
      // process.exitCode = code
    })
  }
}

let webpackConfs = []

const baseConf = Object.assign({}, userConf, {
  production: program.production,
  watch: program.watch,
  report,
  mock,
  offline,
  mini,
  gulf,
  ci,
  productVersion,
  subDir: (userConf.isPlugin || userConf.cloudFunc) ? 'miniprogram' : ''
})

if (mock) getMockServer(baseConf)

modes.forEach(({ mode, env }) => {
  const options = Object.assign({}, baseConf, {
    mode,
    env
  })
  webpackConfs.push(getWebpackConf(options))
})

if (userConf.isPlugin) {
  // 目前支持的plugin构建平台
  modes.filter(({ mode }) => ['wx', 'ali'].includes(mode)).forEach(({ mode, env }) => {
    const options = Object.assign({}, baseConf, {
      mode,
      env,
      plugin: true,
      subDir: 'plugin'
    })
    webpackConfs.push(getWebpackConf(options))
  })
}

if (webpackConfs.length === 1) {
  webpackConfs = webpackConfs[0]
}

try {
  let mockStr = String(mock) === 'true' ? 'mock' : mock
  let offlineStr = String(offline) === 'true' ? 'offline' : offline
  let miniStr = String(mini) === 'true' ? 'mini' : mini
  modes.forEach(({ mode, env }) => {
    rm.sync(resolveDist(getRootPath(mode, env, mockStr, offlineStr, miniStr), '*'))
  })
} catch (e) {
  console.error(e)
  console.log('\n\n删除dist文件夹遇到了一些问题，如果遇到问题请手工删除dist重来\n\n')
}

if (program.watch) {
  webpack(webpackConfs).watch(undefined, callback)
} else {
  webpack(webpackConfs, callback)
}

function callback (err, stats) {
  if (err) {
    process.exitCode = 1
    return console.error(err)
  }
  if (Array.isArray(stats.stats)) {
    stats.stats.forEach(item => {
      console.log(item.compilation.name + '打包结果：')
      console.log(item.compilation.name + '-compiler 打包结果：')
      if (item.compilation.name === 'wx' && item.hasWarnings()) {
        setExitCode(1)
        // process.exitCode = 1
      }
      process.stdout.write(item.toString({
        colors: true,
        modules: false,
        children: false,
        chunks: false,
        chunkModules: false,
        entrypoints: false
      }) + '\n\n')
    })
  } else {
    process.stdout.write(stats.toString({
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false,
      entrypoints: false
    }) + '\n\n')
  }

  // 在体积检查出现问题的时候，抛出code为2 用于识别继续将包部署到dev机器上，方便查看体积diff
  const errs = stats.compilation.errors
  if (errs && errs.length > 0) {
    errs.forEach((item) => {
      if (typeof item === 'string' && item.indexOf('阈值') > -1) {
        setExitCode(3)
      }
    })
  }
  if (stats.hasErrors()) {
    console.log(chalk.red(' Build failed with errors.\n'))
    setExitCode(1)
  } else if (program.watch) {
    console.log(chalk.cyan(`  Build complete at ${new Date()}.\n  Still watching...\n`))
  } else {
    console.log(chalk.cyan('  Build complete.\n'))
  }
}

```


