[原文链接](https://jishuin.proginn.com/p/763bfbd6a89b)
Windi CSS 不会一次生成所有的 CSS，而是只会生成你在代码中实际使用到的原子化 CSS。
自动值推导[16]，可变修饰组[17]，Shortcuts[18]，在 DevTools 中进行设计[19]，属性化模式[20] 等。作为结果，Tailwind 也 因此[21] 使用了同样的技术并推出了自己的 JIT 按需引擎[22]。

Tailwind也是在v2之后才有了JIT模式（Just In Time）

# 制作原子化 CSS 的传统方案
```
// style.scss

@for $i from 1 through 10 {
  .m-#{$i} {
    margin: $i / 4 rem;
  }
}
编译结果为：

.m-1 { margin: 0.25 rem; }
.m-2 { margin: 0.5 rem; }
/* ... */
.m-10 { margin: 2.5 rem; }
```
现在你可以直接使用 class="m-1" 来设置边距。但正如你所见，用这种方法的情况下，你不能使用除了 1 到 10 之外的边距，而且，即使你只使用了其中一条 CSS 规则，但还是要为其余几条规则的文件体积买单。如果之后你还想支持不同的 margin 方向，使用比如 mt 代表 margin-top，mb 代表 margin-bottom 等，加上这 4 个方向以后，你的 CSS 大小会变成原来的 5 倍。如果再有使用到像 :hover 和 :focus 这样的伪类时，体积还会得更变大。以此类推，每多加一个工具类，往往意味着你 CSS 文件的大小也会随之增加。这也就是为什么传统的 Tailwind 生成的 CSS 文件会有数 MB 的大小。

为了解决这个问题，Tailwind 通过使用 PurgeCSS[23] 来扫描你的大包产物并删除你不需要的规则。这得以使其在生产环境中 CSS 文件缩减为几 KB。然而，请注意，这个清除操作仅在生成构建下有效，而开发环境下仍要使用包含了所有规则巨大的 CSS 文件。这在 Webpack 中表现可能并不明显，但在 Vite 中却有着巨大的影响，毕竟其他内容的加载都非常迅捷。

# Windicss的按需生成
通过调换 "生成" 和 "扫描" 的顺序，"按需" 会为你节省浪费的计算开销和传输成本，同时可以灵活地实现预生成无法实现的动态需求。另外，这种方法可以同时在开发和生产中使用，提供了一致的开发体验，使得 HMR (Hot Module Replacement, 热更新) 更加高效。为了实现这一点，Windi CSS 和 Tailwind JIT 都采用了预先扫描源代码的方式。通过按需生成方式，Windi CSS 获得了比传统的 Tailwind CSS 快 100 倍左右[25] 的性能。


# Tailwind需要配置很多内容，虽然windicss有自动值推导功能但是为了兼容tailwind还是需要很多配置，unocss出现了

UnoCSS 是一个引擎，而非一款框架，因为它并未提供核心工具类，所有功能可以通过预设和内联配置提供。

## 静态规则
原子化 CSS 可能数量相当庞大。因此，规则定义直接了当对于阅读和维护非常重要。如需为 UnoCSS 创建一个自定义规则，你可以这样写：
```
rules: [
  ['m-1', { margin: '0.25rem' }]
]
```
当在用户代码库中检测到 m-1 时，就会产生如下 CSS：
```
.m-1 { margin: 0.25rem; }
```
## 动态规则
想要使其动态化，可以将匹配器修改为正则表达式，将主体改为一个函数：
```
rules: [
  [/^m-(\d)$/, ([, d]) => ({ margin: `${d / 4}rem` })],
  [/^p-(\d)$/, (match) => ({ padding: `${match[1] / 4}rem` })],
]
```
其中，主题函数的第一个参数为匹配结果，所以你可以对它进行解构以获得正则表达式的匹配组。

例如，当你使用：
```
<div class="m-100">
  <button class="m-3">
    <icon class="p-5" />
    My Button
  </button>
</div>
就会产生相应的 CSS：

.m-100 { margin: 25rem; }
.m-3 { margin: 0.75rem; }
.p-5 { padding: 1.25rem; }
```
这样就行了。而现在，你只需要使用相同的模式添加更多的实用工具类，你就拥有了属于自己的原子化 CSS！

### 跳过解析，不使用 AST
从内部实现上看，Tailwind 依赖于 PostCSS 的 AST 进行修改，而 Windi 则是编写了一个自定义解析器和 AST。考虑到在开发过程中，这些工具 CSS 的并不经常变化，UnoCSS 通过非常高效的字符串拼接来直接生成对应的 CSS 而非引入整个编译过程。同时，UnoCSS 对类名和生成的 CSS 字符串进行了缓存，当再次遇到相同的实用工具类时，它可以绕过整个匹配和生成的过程。

### 单次迭代

正如前文所述，Windi CSS 和 Tailwind JIT 都依赖于对文件系统的预扫描，并使用文件系统监听器来实现 HMR。文件 I/O 不可避免地会引入开销，而你的构建工具实际上需要再次加载它们。那么我们为什么不直接利用已经被工具读取过的内容呢？

除了独立的生成器核心以外，UnoCSS 有意只提供了 Vite 插件（以后可能考虑其他的集成），这使得它能够专注于与 Vite 的最佳集成。

在 Vite 中，transform 的钩子将与所有的文件及其内容一起被迭代。因此，我们可以写一个插件来收集它们
```
export default {
  plugins: [
    {
      name: 'unocss',
      transform(code, id) {
        // 过滤掉无需扫描的文件
        if (!filter(id)) return

        // 扫描代码（同时也可以处理开发中的无效内容）
        scan(code, id)

        // 我们只需要内容，所以不需要对代码进行转换
        return null
      },
      resolveId(id) {
        return id === VIRTUAL_CSS_ID ? id : null
      },
      async load(id) {
        // 生成的 css 会作为一个虚拟模块供后续使用
        if (id === VIRTUAL_CSS_ID) {
          return { code: await generate() }
        }
      }
    }
  ]
}
```
由于 Vite 也会处理 HMR，并在文件变化时再次执行 transform 钩子，这使得 UnoCSS 可以在一次加载中就完成所有的工作，没有重复的文件 I/O 和文件系统监听器。此外，通过这种方式，扫描会依赖于模块图而非文件 glob。这意味着只有构建在你应用程序中的模块才会影响生成的 CSS，而并非你文件夹下的任何文件。