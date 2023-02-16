[原文链接](https://juejin.cn/post/6844903870678695943)
在我们写完一个应用程序后，需要发布到npm上，大多数人可能仅仅使用npm publish就完成了，在这里我讲一下如何更好的发布包。
# 1. registry
在下载包的时候，很多人喜欢设置taobao镜像，因为npm仓库服务器在国外，下载速度真是急死个人。发布的时候也一样，一般开源应用基本都发布到npmjs，公司内部包的话就会发到私有Npm仓库，我们可以在package.json设置一下你想要的发布的地址：
"publishConfig": {
    "registry": "http://registry.npm.xxx.com/"
 }
也可以设置别名
alias ynpm="npm --registry=http://registry.npm.xxx.com"
// 发布的时候
ynpm publish
# 2. 权限相关
发布包需要验证你的账号权限，第一次执行npm adduser,后面就只需要npm login了。有时候我们遇到说你用户名密码错误，但实际并没错，可能是因为你的registry设置成了淘宝镜像的url，npm配置可以前往~/.npmrc查看，可以通过npm config delete registry删除掉。如果你需要一个人帮你一起发包，可以使用npm owner add <user> [<@scope>/]<pkg>去添加一个用户，不过最好还是把发布权限收紧，其他人提MR，包的owner进行code review，然后发包。
# 3. 发布哪些文件？
发布一个包，考虑到别人的下载速度，包体积肯定需要尽量小，所以源文件最好不包括，那如何控制只发哪些文件呢？
第一种方式是在 package.json 里 files 字段来控制，files 字段的值是一个数组，你可以写具体文件名，也可以写目录，还支持 glob 模式。
第二种就是使用 .npmignore 配置文件，他类似于 .gitignore 文件，其实如果没有 .npmignore，会使用.gitignore来取代他的功能。在包的根目录下，.npmignore不会覆盖 files 字段，但在子目录中会覆盖。
有些文件不能无法通过配置排除或者包含：

package.json
README
CHANGES / CHANGELOG / HISTORY
LICENSE / LICENCE
NOTICE
main字段中的文件

以上文件无法忽略。

.git
CVS
.svn
.DS_Store
._*
等等

以上文件无法发布到 npm。
# 4. 版本管理
npm的发包需要遵循语义化版本，一个版本号包含三个部分：MAJOR.MINOR.PATCH，

MAJOR 表示主版本号，当你做了不兼容的API修改；
MINOR 表示次版本号，当你做了向下兼容的功能性新增；
PATCH 表示修订号,当你做了向下兼容的问题修正;

我们可以使用npm version 命令来自动修改版本号，比如：
// version = v1.0.0
npm version patch
// v1.0.1
npm version prepatch
// v1.0.2-0
npm version minor
// v1.1.0
npm version major
// v2.0.0
一般来说还有先行版本，测试版本等，他们这样命名

3.1.0-beta.0
3.1.0-alpha.0

如果我们发布先行版本，npm version prepatch 命令得出的版本号好像就不够规范了，我们只能使用 npm version 1.0.0-alpha.1 指定版本号，不过还好，在 npm 6.4.0 之后，我们可以使用 --preid 参数：
npm version prerelease --preid=alpha
# 5. Changelog
包发布了很多次后，使用者升级就需要知道他是否需要升级，需要查看文档看看有哪些不兼容性改动，所以需要一个 Changelog 来记录每次发布改了些什么。如果手动的维护肯定会有忘记的时候，所以需要使用工具来自动生成，我们可以使用standard-version 这个包来生成，这个包的作用是自动更新版本和生成CHANGELOG。
standard-version --prerelease alpha
✔ bumping version in package.json from 3.0.2-0 to 3.0.2-alpha.0
✔ created CHANGELOG.md
✔ outputting changes to CHANGELOG.md
✔ committing package.json and CHANGELOG.md
✔ tagging release v3.0.2-alpha.0
ℹ Run `git push --follow-tags origin master && npm publish --tag alpha` to publish
// 再看下生成的Changelog

### Bug Fixes

* 添加功能1 75e2808

### [3.0.2-alpha.0](///compare/v3.0.2-0...v3.0.2-alpha.0) (2019-06-18)
有了这个工具我们都不需要使用npm version prepatch了。standard-version会根据你的git commit信息，自动生成日志，比如新增啥啥功能，修复啥啥啥bug。自动生成的同时，也就意味着你git commit需要遵循一定格式，比如：

feat:     A new feature
fix:      A bug fix
docs:     Documentation only changes
style:    Changes that do not affect the meaning of the code (white-space, formatting, missing semi-co
lons, etc)
refactor: A code change that neither fixes a bug nor adds a feature
perf:     A code change that improves performance

我们可以使用 commitlint搭配 husky 来校验你commit的信息是否符合标准
{
  "husky": {
    "hooks": {
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
    }  
  }
}
也可以使用交互式的方式来生成commit，commitizen这个包就可以。
# 6. Tag
在说明npm的tag之前需要先将一讲git的tag：
git的tag
git上打标签我们应该比较熟悉，特别是开发sdk或者APP软件的同学。我们在使用npm version prepatch的时候就会默认执行一次git tag version，我们也可以手动打一个标签git tag -a <tag名> -m <注释文字>，通过git push — tags origin master 将标签推到远程。
npm的tag
我们可以通过 npm dist-tag ls [<pkg>] 来查看一个包的tag，一般来说我们至少会有三种类型的标签

latest：最后版本，npm install的就是这个
beta：测试版本，一般内测使用，需要指定版本号install，例如3.1.0-beta.0
next: 先行版本，npm install foo@next安装，例如3.0.2-alpha.0

如果我们需要发布一个测试版本，在发布的时候需要执行
npm publish --tag beta
复制代码如果你直接执行npm publish，那么即使你的版本号是-beta.n，默认会打上latest的标签，别人install的时候也会下载到。这个时候需要我们只要改一下tag：
// 不小心发错了
latest: 1.0.1-beta.0
// 将1.0.1-beta.0设置为beta
npm dist-tag add my-package@1.0.1-beta.0 beta
npm dist-tag add my-package@1.0.0 latest