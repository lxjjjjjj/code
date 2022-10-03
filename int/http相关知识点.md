# 发展史
## http 0.9 
最早时候只支持传输html，请求中没有任何请求头没有描述数据的信息。只有一个get请求。服务器发送完毕，就关闭TCP连接，同一个TCP连接只能发送一个http请求。

## http 1.0 
引入了请求头和响应头，增加了status code和header等描述信息。增加了post put 请求，多字符集的支持，多部分的发送，权限，缓存。

## http 1.1
持久连接,创建tcp连接后可以不关闭。在http 1.1中默认开启了一个请求头connect:keep-alive进行在一个tcp链接的复用。pipeline一个tcp连接可以发送多个http请求。当然即使引入了长链接keep-alive，还存在一个问题就是基于http 1.0中是一个请求发送得到响应后才开始发送下一个请求，针对这个机制1.1提出了管线化pipelining机制，但是需要注意的是服务器对应同一tcp链接上的请求是一个一个去处理的，服务端都是按照请求顺序处理的第二个请求要等第一个请求处理完才能被处理。所以这就会导致一个比较严重的问题队头阻塞。

如果说第一个发送的请求丢包了，那么服务器会等待这个请求重新发送过来在进行返回处理。之后才会处理下一个请求。即使浏览器是基于pipelining去多个请求同时发送的。


## http 2.0 
提出了很多个优化点，其中最著名的就是解决了http1.1中的队头阻塞问题。一个TCP连接上完成承载任意数量的双向数据流

* 多路复用: 支持使用同一个tcp链接，基于二进制(之前是字符串传输)分帧层进行发送多个请求，支持同时发送多个请求,同时服务器也可以处理不同顺序的请求而不必按照请每个请求的顺序进行处理返回。这就解决了http 1.1中的队头阻塞问题。

* 头部压缩: 在http2协议中对于请求头进行了压缩达到提交传输性能。通讯双方各自缓存一份头部字段表，既避免了重复header的传输，又减小了需要传输的大小。
对于相同的数据，不再通过每次请求和响应发送，通信期间几乎不会改变通用键-值对(用户代理、可接受的媒体类型，等等)只需发送一次。如果首部发生了变化，则只需将变化的部分加入到header帧中，改变的部分会加入到头部字段表中。

* Server push: http2中支持通过服务端主动推送给客户端对应的资源从而让浏览器提前下载缓存对应资源。如果正常客户端请求index.html的话，这个html里面有请求css和js文件，所以，需要重新请求css和js文件，但是http2.0能够“预测”主请求的依赖资源，在响应主请求的同时，主动并发推送依赖资源至客户端。推送将js和css文件一起和index.html一起返回。减少了请求。
### http2.0推送实现
#### 1、标识依赖资源
```
W3C候选推荐标准（https://www.w3.org/TR/preload/）建议了依赖资源的两种做法：文件内<link>标签和HTTP头部携带, 表示该资源后续会被使用, 可以预请求, 关键字preload修饰这个资源, 写法如下：
a) 静态Link标签法:
<link rel="preload" href="push.css" as="style">
b) HTTP头表示法：
Link: <push.css>; rel=preload; as=style
其中rel表明了资源</push.css>是预加载的，as表明了资源的文件类型。另外，link还可以用nopush修饰，表示浏览器可能已经有该资源缓存，指示有推送能力的服务端不主动推送资源，只有当浏览器先检查到没有缓存，才去指示服务端推送资源，nopush格式写成：
Link: </app/script.js>; rel=preload; as=script;nopush。
```
#### 2、推送资源
```
用户访问CDN，主要包括直接访问的边缘节点, 若干中间节点和客户源站，路径中的每层都可以对请求做分析，预测可能的依赖资源，通过插入静态<link>标签或者增加响应头部返回给浏览器。 CDN的推送主要采用头部携带推送信息。
a) 客户端指定推送资源
客户端通过url或者请求头说明需要的资源url，写法如下：
Url：http://http2push.gtimg.com/simple_push.html?req-push=simple_push.js
或者：
GET /simple_push.html HTTP/1.1
Host: http://http2push.gtimg.com
User-Agent: curl/7.49.1
Accept: /
X-Push-Url: simple_push.js
b) CDN节点指定推送资源
CDN节点针对请求资源配置推送资源, 基础配置如下:
location ~ “/simple_push.html$” {
http2_server_push_url /simple_push.js
}
c) 源站指定推送资源
通过增加响应头link通知客户端或者CDN节点，后续希望推送的依赖资源，中间具有 推送功能的节点(如CDN节点)可以基于此信息进行资源请求与推送.
```

[preload和push的区别](https://zhuanlan.zhihu.com/p/48521680)
### http3.0
基于tcp下就难免存在阻塞问题，如果发生丢包就需要等待上一个包。在http3彻底解决了tcp的队头阻塞问题，它是基于udp协议并且在上层增加了一层QUIC协议。

http3.0 新特性

1）多路复用，彻底解决TCP中队头阻塞的问题
2）集成了TLS加密功能
3）向前纠错机制
## 关于http 1.1的pipelining机制和http 2.0的多路复用
HTTP/1.1 without pipelining： 必须响应 TCP 连接上的每个 HTTP 请求，然后才能发出下一个请求。


HTTP/1.1 with pipelining: 可以立即发出 TCP 连接上的每个 HTTP 请求，而无需等待前一个请求的响应返回。响应将以相同的顺序返回。


HTTP/2 multiplexing:  TCP 连接上的每个 HTTP 请求都可以立即发出，而无需等待先前的响应返回。响应可以按任何顺序返回。

## https
在HTTP协议中有可能存在信息窃取或身份伪装等安全问题。数据隐私性，内容经过对称加密，每个连接生成一个唯一的加密密钥。并建立一个信息安全通道，来保证传输过程中的数据安全。对网站服务器进行真实身份认证。第三方无法伪造服务端（客户端）身份。数据完整性：内容传输经过完整性校验。

[https](https://juejin.cn/post/6844903830916694030)

HTTP直接和TCP通信。当使用SSL时，则演变成先和SSL通信，再由SSL和TCP通信了。

### 解决内容可能被窃听的问题——加密
https利用TLS/SSL进行对称加密+非对称加密,对称密钥的好处是解密的效率比较快,非对称密钥的好处是可以使得传输的内容不能被破解，因为就算你拦截到了数据，但是没有对应的私钥，也是不能破解内容的。在交换密钥环节使用非对称加密方式，之后的建立通信交换报文阶段则使用对称加密方式。

### 解决报文可能遭篡改问题——数字签名

网络传输过程中需要经过很多中间节点，虽然数据无法被解密，但可能被篡改，那如何校验数据的完整性呢？----校验数字签名。

数字签名有两种功效：

能确定消息确实是由发送方签名并发出来的，因为别人假冒不了发送方的签名。
数字签名能确定消息的完整性,证明数据是否未被篡改过。

数字签名如何生成

将一段文本先用Hash函数生成消息摘要，然后用发送者的私钥加密生成数字签名，与原文文一起传送给接收者。接下来就是接收者校验数字签名的流程了。

接收者只有用发送者的公钥才能解密被加密的摘要信息，然后用HASH函数对收到的原文产生一个摘要信息，与上一步得到的摘要信息对比。如果相同，则说明收到的

### 解决通信方身份可能被伪装的问题——数字证书

数字证书认证机构处于客户端与服务器双方都可信赖的第三方机构的立场上。
数字证书验证流程
服务器的运营人员向第三方机构CA提交公钥、组织信息、个人信息(域名)等信息并申请认证;
如果信息审核通过，CA会向申请者签发认证文件-证书。
客户端 Client 向服务器 Server 发出请求时，Server 返回证书文件;
客户端 Client 读取证书中的相关的明文信息，采用相同的散列函数计算得到信息摘要，然后，利用对应 CA的公钥解密签名数据，对比证书的信息摘要，如果一致，

### https工作流程

1.Client发起一个HTTPS,Client知道需要连接Server的443（默认）端口。
2.Server把事先配置好的公钥证书返回给客户端。
3.Client验证公钥证书：比如是否在有效期内等信息如果验证通过则继续，不通过则显示警告信息。
4.Client使用伪随机数生成器生成加密所使用的对称密钥，然后用证书的公钥加密这个对称密钥，发给Server。
5.Server使用自己的私钥（private key）解密这个消息，得到对称密钥。至此，Client和Server双方都持有了相同的对称密钥。
6.Server使用对称密钥加密“明文内容A”，发送给Client。
7.Client使用对称密钥解密响应的密文，得到“明文内容A”。
8.Client再次发起HTTPS的请求，使用对称密钥加密请求的“明文内容B”，然后Server使用对称密钥解密密文，得到“明文内容B”。


# 跨域CORS
[跨域解决方案](https://juejin.cn/post/7017614708832206878#heading-5)
cors是解决跨域问题的常见解决方法，关键是服务器要设置Access-Control-Allow-Origin，控制哪些域名可以共享资源。origin是cors的重要标识，只要是非同源或者POST请求都会带上Origin字段，接口返回后服务器也可以将Access-Control-Allow-Origin设置为请求的Origin，解决cors如何指定多个域名的问题。

CORS将请求分为**简单请求**和**非简单请求**

* 简单请求
）只支持HEAD，get、post请求方式；
2）没有自定义的请求头；Accept  Accept-Language Content-Language Last-Event-ID Content-Type
3）Content-Type：只限于三个值application/x-www-form-urlencoded、multipart/form-data、text/plain
对于简单请求，浏览器直接发出CORS请求。具体来说，就是在头信息之中，增加一个Origin字段。如果浏览器发现这个接口回应的头信息没有包含Access-Control-Allow-Origin字段的话就会报跨域错误。

* 非简单请求的跨域处理

非简单请求，会在正式通信之前，增加一次HTTP查询请求，称为"预检"请求（options）,用来判断当前网页所在的域名是否在服务器的许可名单之中。如果在许可名单中，就会发正式请求；如果不在，就会报跨越错误。

（1）Access-Control-Allow-Origin

该字段是必须的。它的值要么是请求时Origin字段的值，要么是一个*，表示接受任意域名的请求。

（2）Access-Control-Allow-Credentials

该字段可选。它的值是一个布尔值，表示是否允许发送Cookie。默认情况下，Cookie不包括在CORS请求之中。设为true，即表示服务器明确许可，Cookie可以包含在请求中，一起发给服务器。这个值也只能设为true，如果服务器不要浏览器发送Cookie，删除该字段即可。

（3）Access-Control-Expose-Headers

该字段可选。CORS请求时，XMLHttpRequest对象的getResponseHeader()方法只能拿到6个基本字段：Cache-Control、Content-Language、Content-Type、Expires、Last-Modified、Pragma。如果想拿到其他字段，就必须在Access-Control-Expose-Headers里面指定。上面的例子指定，getResponseHeader('FooBar')可以返回FooBar字段的值。


"预检"请求用的请求方法是OPTIONS，表示这个请求是用来询问的。头信息里面，关键字段是Origin，表示请求来自哪个源。除了Origin字段，"预检"请求的头信息包括两个特殊字段。

（1）Access-Control-Request-Method

该字段是必须的，用来列出浏览器的CORS请求会用到哪些HTTP方法，上例是PUT。

（2）Access-Control-Request-Headers

该字段是一个逗号分隔的字符串，指定浏览器CORS请求会额外发送的头信息字段，上例是X-Custom-Header。


## 同源策略
同源 = 协议、域名、端口相同。
同源政策的目的，是为了保证用户信息的安全，防止恶意的网站窃取数据。设想这样一种情况：A网站是一家银行，用户登录以后，又去浏览其他网站。如果其他网站可以读取A网站的 Cookie，会发生什么？很显然，如果 Cookie 包含隐私（比如存款总额），这些信息就会泄漏。更可怕的是，Cookie 往往用来保存用户的登录状态，如果用户没有退出登录，其他网站就可以冒充用户，为所欲为。因为浏览器同时还规定，提交表单不受同源政策的限制。


## cookie

Cookie 主要用于以下三个方面：

会话状态管理（如用户登录状态、购物车、游戏分数或其它需要记录的信息）
个性化设置（如用户自定义设置、主题等）
浏览器行为跟踪（如跟踪分析用户行为等）

Cookie 的缺点
大小有限5M、不安全容易被劫持、增加请求大小等

### Cookies 的属性

#### Name/Value 
用 JavaScript 操作 Cookie 的时候注意对 Value 进行编码处理。

#### Expires 
##### Expires有值
用于设置 Cookie 的过期时间。比如：Set-Cookie: id=a3fWa; Expires=Wed, 21 Oct 2015 07:28:00 GMT;

##### Expires无值----会话cookie
当 Expires 属性缺省时，表示是会话性 Cookie，像上图 Expires 的值为 Session，表示的就是会话性 Cookie。当为会话性 Cookie 的时候，值保存在客户端内存中，并在用户关闭浏览器时失效。需要注意的是，有些浏览器提供了会话恢复功能，这种情况下即使关闭了浏览器，会话期 Cookie 也会被保留下来，就好像浏览器从来没有关闭一样。

##### 持久化cookie
与会话性 Cookie 相对的是持久性 Cookie，持久性 Cookies 会保存在用户的硬盘中，直至过期或者清除 Cookie。这里值得注意的是，设定的日期和时间只与客户端相关，而不是服务端。

#### Max-Age 

用于设置在 Cookie 失效之前需要经过的秒数。比如：Set-Cookie: id=a3fWa; Max-Age=604800; Max-Age 可以为正数、负数、甚至是 0。

##### 正值

如果 max-Age 属性为正数时，浏览器会将其持久化，即写到对应的 Cookie 文件中。

##### 负值

当 max-Age 属性为负数，则表示该 Cookie 只是一个会话性 Cookie。
##### 0

当 max-Age 为 0 时，则会立即删除这个 Cookie。

#### 假如 Expires 和 Max-Age 都存在，Max-Age 优先级更高
#### Domain

Domain 指定了 Cookie 可以送达的主机名。假如没有指定，那么默认值为当前文档访问地址中的主机部分（但是不包含子域名）。像淘宝首页设置的 Domain 就是 .taobao.com，这样无论是 a.taobao.com 还是 b.taobao.com 都可以使用 Cookie。在这里注意的是，不能跨域设置 Cookie，比如阿里域名下的页面把 Domain 设置成百度是无效的：Set-Cookie: qwerty=219ffwef9w0f; Domain=baidu.com; Path=/; Expires=Wed, 30 Aug 2020 00:00:00 GMT

#### Path

Path 指定了一个 URL 路径，这个路径必须出现在要请求的资源的路径中才可以发送 Cookie 首部。比如设置 Path=/docs，/docs/Web/ 下的资源会带 Cookie 首部，/test 则不会携带 Cookie 首部。Domain 和 Path 标识共同定义了 Cookie 的作用域：即 Cookie 应该发送给哪些 URL。

#### Secure属性

标记为 Secure 的 Cookie 只应通过被HTTPS协议加密过的请求发送给服务端。使用 HTTPS 安全协议，可以保护 Cookie 在浏览器和 Web 服务器间的传输过程中不被窃取和篡改。

#### HTTPOnly

设置 HTTPOnly 属性可以防止客户端脚本通过 document.cookie 等方式访问 Cookie，有助于避免 XSS 攻击。

#### SameSite
Chrome80 版本中默认屏蔽了第三方的 Cookie，SameSite 属性可以让 Cookie 在跨站请求时不会被发送，从而可以阻止跨站请求伪造攻击（CSRF）。

##### 属性值

SameSite 可以有下面三种值：

Strict 仅允许一方请求携带 Cookie，即浏览器将只发送相同站点请求的 Cookie，即当前网页 URL 与请求目标 URL 完全一致。
Lax 允许部分第三方请求携带 Cookie
None 无论是否跨站都会发送 Cookie

之前默认是 None 的，Chrome80 后默认是 Lax。

接下来看下从 None 改成 Lax 到底影响了哪些地方的 Cookies 的发送？直接来一个图表：

[图表图片](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2020/3/18/170eb95c97d98564~tplv-t2oaga2asx-zoom-in-crop-mark:3024:0:0:0.awebp)

same-site:lax的具体规则如下：

类型例子                                     是否发送 
a链接<a href="..."></a>                       发送
预加载<link rel="prerender" href="..."/>      发送
GET 表单<form method="GET" action="...">      发送
POST 表单<form method="POST" action="...">   不发送
iframe<iframe src="..."></iframe>           不发送
AJAX axios.post                             不发送
图片<img src="..."></image>                  不发送

而在这之前是会全部发送的。

从上图可以看出，对大部分 web 应用而言，Post 表单，iframe，AJAX，Image 这四种情况从以前的跨站会发送三方 Cookie，变成了不发送。

* Post表单：应该的，学 CSRF 总会举表单的例子。
* iframe：iframe 嵌入的 web 应用有很多是跨站的，都会受到影响。
* AJAX：可能会影响部分前端取值的行为和结果。
* Image：图片一般放 CDN，大部分情况不需要 Cookie，故影响有限。但如果引用了需要鉴权的图片，可能会受到影响。

除了这些还有 script 的方式，这种方式也不会发送 Cookie，像淘宝的大部分请求都是 jsonp，如果涉及到跨站也有可能会被影响。

##### 如果不修改由None到Lax将引发的问题

```
1.天猫和飞猪的页面靠请求淘宝域名下的接口获取登录信息，由于 Cookie 丢失，用户无法登录，页面还会误判断成是由于用户开启了浏览器的“禁止第三方 Cookie”功能导致而给与错误的提示

2.淘宝部分页面内嵌支付宝确认付款和确认收货页面、天猫内嵌淘宝的登录页面等，由于 Cookie 失效，付款、登录等操作都会失败

3.阿里妈妈在各大网站比如今日头条，网易，微博等投放的广告，也是用 iframe 嵌入的，没有了 Cookie，就不能准确的进行推荐

4.一些埋点系统会把用户 id 信息埋到 Cookie 中，用于日志上报，这种系统一般走的都是单独的域名，与业务域名分开，所以也会受到影响。

5.一些用于防止恶意请求的系统，对判断为恶意请求的访问会弹出验证码让用户进行安全验证，通过安全验证后会在请求所在域种一个Cookie，请求中带上这个Cookie之后，短时间内不再弹安全验证码。在Chrome80以上如果因为Samesite的原因请求没办法带上这个Cookie，则会出现一直弹出验证码进行安全验证。

6.天猫商家后台请求了跨域的接口，因为没有 Cookie，接口不会返回数据

7.像a链接这种，没有受到影响，依旧会带上三方cookie，这样可以保证从百度搜索中打开淘宝，是有登录状态的。
```
##### 设置SameSite=none要注意的问题

1、HTTP 接口不支持 SameSite=none
如果你想加 SameSite=none 属性，那么该 Cookie 就必须同时加上 Secure 属性，表示只有在 HTTPS 协议下该 Cookie 才会被发送。

2、需要 UA 检测，部分浏览器不能加 SameSite=none
IOS 12 的 Safari 以及老版本的一些 Chrome 会把 SameSite=none 识别成 SameSite=Strict，所以服务端必须在下发 Set-Cookie 响应头时进行 User-Agent 检测，对这些浏览器不下发 SameSite=none 属性

##### same-party
[原文链接](https://juejin.cn/post/7087206796351242248)
将same-site:Lax改成same-site:None 这不是长久之策，一来，浏览器把same-site的默认值从从none调整到lax可以避免CSRF攻击，保障安全，可我们为了业务正常运行，却又走了回头路；二来，chrome承诺2022年，也就是今年，会全面禁用三方cookie，届时和在safari一样，我们没法再用这种方法去hack。
如果我们不想使用same-site:none，或者说，未来用不了这种方式了，same-party将是我们的唯一选择。

继续沿用阿里系的例子，same-party可以把.taobao.com、.tmall.com和.alimama.com三个站合起来，它们设置的cookie在这个集合内部不会被当作第三方cookie对待。
首先需要定义First-Party集合：在.taobao.com、.tmall.com和.alimama.com三个站的服务器下都加一个配置文件，放在/.well-know/目录下，命名为first-party-set。其中一个是“组长”，暂定为.taobao.com，在它的的服务器下写入
```
// /.well-know/first-party-set
{
  "owner": ".taobao.com",
  "members": [".tmall.com", ".alimama.com"]
}
```
另外两个是组员：
```
// /.well-know/first-party-set
{
  "owner": ".taobao.com",
}
```

并且，在下发cookie时，需要注明same-party属性：
```
Set-Cookie: id=nian; SameParty; Secure; SameSite=Lax; domain=.taobao.com
```
这样，我们打开.tmall.com的网站，向.taobao.com发起AJAX请求，都会带上这个cookie，即使当前的same-site属性是lax，因为这集合中的三个域名都会被当作一个站对待，也就是说，在浏览器眼中，这个cookie现在就是第一方cookie。而不在集合中的baidu.com发起的AJAX请求则不会带上。需要注意的是，使用same-party属性时，必须要同时使用https(secure属性)，并且same-site不能是strict。

##### 第三方cookie，
现在有三个请求：

网页www.a.com/index.html的前端页面，去请求接口www.b.com/api
网页www.b.com/index.html的前端页面，去请求接口www.a.com/api
网页www.a.com/index.html的前端页面，去请求接口www.a.com/api

哪个请求会带上之前设置的cookie呢？答案是2、3都会带上cookie，因为cookie的取用规则是去看请求的目的地，2、3请求的都是www.a.com/api命中domain=.a.com规则。
这就是「不认来源，只看目的」的意思，不管请求来源是哪里，只要请求的目的是a站，cookie都会携带上。通过这个案例也可以再回顾一下：3的这种情况的叫第一方cookie，2的这种情况叫第三方cookie。

###### 限制三方cookie的携带

「不认来源，只看目的」规矩在2020年开始被打破，这种变化体现在浏览器将same-site:lax设置为默认属性。chrome操作比较平缓，目前可以手动设置same-site:none恢复之前规则。但在safari中如果这样设置，会被当作same-site:strict。可以看到，在safari中使用的全是第一方cookie，直观的体验就是在天猫登录完，打开淘宝，还需要再登录一次。也就是说（strict模式）现在cookie的取用是「既看来源，又看目的」了。none代表完全不做限制，即之前「不认来源，只看目的」的cookie取用原则。

### 判断两个域名属于SameSite
[原文链接](https://juejin.cn/post/6844904095711494151)

站（Site）= eTLD(有效顶级域名) + 1

比如 https://www.example.com:443  .com是eTLD  example.com是eTLD+1

TLD 表示顶级域名，例如 .com、.org、.cn 等等，不过顶级域名并不是一成不变的，会随着时间推移增加，例如前段时间就增加了 .gay 顶级域名。

www.a.taobao.com 和 www.b.taobao.com 是同站，a.github.io 和 b.github.io 是跨站(注意是跨站)。

TLD+1 表示顶级域名和它前面二级域名的组合，例如

* https://www.example.com:443/foo TLD 是 .com TLD+1 是 example.com 

* https://www.example.com.cn TLD+1 就是 com.cn，并不能表示这个站点，真正能表示这个站点的应该是 example.com.cn 才对，所以衍生出 eTLD 的概念，eTLD：com.cn，eTLD+1：example.com.cn。eTLD是有效顶级域名，而「站」的定义就是 eTLD+1。

以 https://www.example.com:443 为例，下面给出了一系列的网址是否与其同源或同站的解释
对比网址                         是否同源                  是否同站 
https://www.other.com:443       否，因为 hostname 不同    否，因为 eTLD+1 不同
https://example.com:443         否，因为 hostname 不同    是，子域名不影响 
https://login.example.com:443   否，因为 hostname 不同    是，子域名不影响
http://www.example.com:443      否，因为 scheme 不同      是，协议不影响 
www.example.com:80              否，因为 port 不同        是，端口号不影响 
www.example.com:443             是，完全匹配              是，完全匹配
www.example.com                 是，隐式完全匹配 (https端口号是443)是，端口号不影响

### same-site如何防止csrf攻击
1、用户 A 在网站 a.com 登录后，浏览器存储 a.com 的 cookie
2、用户 A 在网站 a.com 进行交易操作，携带 cookie 调用接口 a.com/api/transfer
3、用户 A 同时打开了 b.com，一个欺诈网站
4、b.com 引导用户 A 点击按钮，携带了 a.com 的 cookie 调用 a.com/api/transfer
5、用户在 b.com 触发了 a.com 上的交易操作，用户却完全不知情。

same-site 的默认值是 lax，这种情况下，不属于 same site 的请求，就不会携带 cookie。

### SameSite=None时不声明Secure导致set-cookie失败
SameSite=None，则必须声明Secure，并且是https安全协议，否则无法写入cookie。

### chrome运行本地项目无法携带跨域cookie问题解决方案-SameSite=None无法设置问题

chrome 80版本后浏览器默认的SameSite策略为Lax，该策略中对于当前域名向第三方域名中发送跨域请求时无法携带cookie，因此本地管理台项目的请求发出去时都没有携带cookie，导致后端接口检测不到该请求携带的用户信息。
[解决方案](https://juejin.cn/post/6974593447395065886)


# Cache-Control请求头

## 1.可缓存性 
1.Cache-Control: public 代表http请求返回的内容所经过的任何路径中，http代理服务器，客户端，服务器都可以缓存
2.Cache-Control: private 只有发起请求的浏览器才能缓存
3.Cache-Control: no-catch 本地，proxy服务器可以缓存 但是使用之前要去服务器验证
4.Cache-Control: no-store是本地和proxy服务器都不能缓存
## 2.到期max-age=<seconds>
Cache-Control: max-age=<seconds>可以代替max-age在服务器才生效
Cache-Control: s-maxage=<seconds>可以代替max-age但是只有在代理服务器才生效，优先级比max-age高
在代理服务器中s-maxage优先级高于max-age
Cache-Control: max-stale=<seconds> 在max-age过期之后，发起请求一方主动写有max-stale的话代表即便缓存过期了，只要在max-stale时间内，也可以使用缓存的内容，而不需要去服务器重新请求内容
## 3.重新验证
Cache-Control: must-revalidate 如果max-age到期了 那么必须去服务端重新验证内容是否真的过期了 不能直接使用本地缓存
Cache-Control: proxy-revalidate 用于缓存服务器 过期时去服务器重新请求数据
## 4.压缩格式转换
Cache-Control: no-transform 是返回内容过大时，不允许代理服务器压缩格式转换

头只是一个限制声明性的作用，没有强制约束.使用nginx做代理时，做catch 可以配置代理服务器如何做缓存操作配置如何生效


# 浏览器的缓存机制

## 缓存位置

从缓存位置上来说分为四种，并且各自有优先级，当依次查找缓存且都没有命中的时候，才会去请求网络。
浏览器中的缓存位置一共有四种，按优先级从高到低排列分别是：

Service Worker
Memory Cache
Disk Cache
Push Cache

### Service Worker
是运行在浏览器背后的独立线程，一般可以用来实现缓存功能。使用 Service Worker的话，传输协议必须为 HTTPS。Service Worker 的缓存与浏览器其他内建的缓存机制不同，它可以让我们自由控制缓存哪些文件、如何匹配缓存、如何读取缓存，并且缓存是持续性的
由于它脱离了浏览器的窗体，因此无法直接访问DOM。虽然如此，但它仍然能帮助我们完成很多有用的功能，比如离线缓存、消息推送和网络代理等功能。其中的离线缓存就是 Service Worker Cache

### Memory Cache
是内存中的缓存，主要包含的是当前中页面中已经抓取到的资源,例如页面上已经下载的样式、脚本、图片等。一旦我们关闭 Tab 页面，内存中的缓存也就被释放了。内存缓存在缓存资源时并不关心返回资源的HTTP缓存头Cache-Control是什么值，同时资源的匹配也并非仅仅是对URL做匹配，还可能会对Content-Type，CORS等其他特征做校验。
Memory Cache指的是内存缓存，从效率上讲它是最快的。但是从存活时间来讲又是最短的，当渲染进程结束后，内存缓存也就不存在了。

### Disk Cache
存储在硬盘中的缓存，读取速度慢点，但是什么都能存储到磁盘中，比之 Memory Cache 胜在容量和存储时效性上。会根据 HTTP Herder 中的字段判断哪些资源需要缓存，哪些资源可以不请求直接使用，哪些资源已经过期需要重新请求。并且即使在跨站点的情况下，相同地址的资源一旦被硬盘缓存下来，就不会再次去请求数据 优势在于存储容量和存储时长。
比较大的JS、CSS文件会直接被丢进磁盘，反之丢进内存
内存使用率比较高的时候，文件优先进入磁盘

### Push Cache
推送缓存）是 HTTP/2 中的内容，当以上三种缓存都没有命中时，它才会被使用。它只在会话（Session）中存在，一旦会话结束就被释放，并且缓存时间也很短暂

## 缓存过程分析
浏览器对于缓存的处理是根据第一次请求资源时返回的响应头来确定的

        第一次发起http请求
浏览器----------------------->浏览器缓存      
浏览器<-----------------------没有缓存的结果和缓存标识
                   发起http请求
浏览器--------------------------------------->服务器
       返回缓存结果和缓存标识
服务器------------------------>浏览器

浏览器将结果和缓存标识存入浏览器缓存中，浏览器每次发起请求，都会先在浏览器缓存中查找该请求的结果以及缓存标识，浏览器每次拿到返回的请求结果都会将该结果和缓存标识存入浏览器缓存中。

## 强缓存

不会向服务器发送请求，直接从缓存中读取资源，在chrome控制台的Network选项中可以看到该请求返回200的状态码，并且Size显示from disk cache或from memory cache。强缓存可以通过设置两种 HTTP Header 实现：Expires 和 Cache-Control。

1.Expires
缓存过期时间，用来指定资源到期的时间，是服务器端的具体的时间点。也就是说，Expires=max-age + 请求时间，需要和Last-modified结合使用。Expires是Web服务器响应消息头字段，在响应http请求时告诉浏览器在过期时间前浏览器可以直接从浏览器缓存取数据，而无需再次请求。
Expires 是 HTTP/1 的产物，受限于本地时间，如果修改了本地时间，可能会造成缓存失效。Expires: Wed, 22 Oct 2018 08:41:00 GMT表示资源会在 Wed, 22 Oct 2018 08:41:00 GMT 后过期，需要再次请求。

2.Cache-Control
在HTTP/1.1中，Cache-Control是最重要的规则，主要用于控制网页缓存。比如当Cache-Control:max-age=300时，则代表在这个请求正确返回时间（浏览器也会记录下来）的5分钟内再次加载资源，就会命中强缓存

两者同时存在的话，Cache-Control优先级高于Expires；在某些不支持HTTP1.1的环境下，Expires就会发挥用处。

强缓存不关心服务器端文件是否已经更新，这可能会导致加载文件不是服务器端最新的内容，那我们如何获知服务器端内容是否已经发生了更新呢？此时我们需要用到协商缓存策略。

## 协商缓存
协商缓存就是强制缓存失效后，浏览器携带缓存标识向服务器发起请求，由服务器根据缓存标识决定是否使用缓存的过程，主要有以下两种情况： 协商缓存可以通过设置两种 HTTP Header 实现：Last-Modified 和 ETag 。

协商缓存生效，返回304和Not Modified
          发起http请求                      缓存失效返回缓存标识                 携带缓存标识发起http请求
浏览器-----------------------> 浏览器缓存  ----------------------->  浏览器  --------------------------> 服务器 304该资源无更新 获取该请求的缓存结果

协商缓存失效，返回200和请求结果
          发起http请求                      缓存失效返回缓存标识               携带缓存标识发起http请求            200该资源更新了返回请求结果，将请求结果和标识存入缓存
浏览器-----------------------> 浏览器缓存  -----------------------> 浏览器 ---------------------------> 浏览器  --------------------------------------------> 浏览器缓存

### Last-Modified 和 If-Modified-Since
Last-Modified值是这个资源在服务器上的最后修改时间,浏览器下一次请求这个资源，浏览器检测到有 Last-Modified这个header，于是添加If-Modified-Since这个header，值就是Last-Modified中的值；服务器再次收到这个资源请求，会根据 If-Modified-Since 中的值与服务器中这个资源的最后修改时间对比，如果没有变化，返回304和空的响应体，直接从缓存读取，如果If-Modified-Since的时间小于服务器中这个资源的最后修改时间，说明文件有更新，于是返回新的资源文件和200。
### ETag和If-None-Match
Etag是服务器响应请求时，返回当前资源文件的一个唯一标识(由服务器生成)，只要资源有变化，Etag就会重新生成。浏览器在下一次加载资源向服务器发送请求时，会将上一次返回的Etag值放到request header里的If-None-Match里，服务器只需要比较客户端传来的If-None-Match跟自己服务器上该资源的ETag是否一致

首先在精确度上，Etag要优于Last-Modified。 第二在性能上，Etag要逊于Last-Modified，毕竟Last-Modified只需要记录时间，而Etag需要服务器通过算法来计算出一个hash值。 第三在优先级上，服务器校验优先考虑Etag

如果什么缓存策略都没设置，那么浏览器会怎么处理？ 对于这种情况，浏览器会采用一个启发式的算法，通常会取响应头中的 Date 减去 Last-Modified 值的 10% 作为缓存时间。

### 实际场景应用缓存策略

频繁变动的资源 Cache-Control: no-cache，使浏览器每次都请求服务器，然后配合 ETag 或者 Last-Modified 来验证资源是否有效。这样的做法虽然不能节省请求数量，但是能显著减少响应数据大小。

不常变化的资源 Cache-Control: max-age=31536000，为了解决更新的问题，就需要在文件名(或者路径)中添加 hash， 版本号等动态字符，之后更改动态字符，从而达到更改引用 URL 的目的，让之前的强制缓存失效

用户在浏览器如何操作时，会触发怎样的缓存策略。主要有 3 种：

打开网页，地址栏输入地址： 查找 disk cache 中是否有匹配。如有则使用；如没有则发送网络请求。
普通刷新 (F5)：因为 TAB 并没有关闭，因此 memory cache 是可用的，会被优先使用(如果匹配的话)。其次才是 disk cache。
强制刷新 (Ctrl + F5)：浏览器不使用缓存，因此发送的请求头部均带有 Cache-control: no-cache(为了兼容，还带了 Pragma: no-cache),服务器直接返回 200 和最新内容。


# 资源验证
浏览器创建请求后->本地缓存中如果命中就在本地缓存中取值->如果没有命中的话->代理缓存中找->如果代理服务器没有命中->向服务器请求数据

# get & post 区别
1. GET在浏览器回退时是无害的，而POST会再次提交请求。
2. GET产生的URL地址可以被Bookmark，而POST不可以。
3. GET请求会被浏览器主动cache，而POST不会，除非手动设置。
4. GET请求只能进行url编码，而POST支持多种编码方式。
5. GET请求参数会被完整保留在浏览器历史记录里，而POST中的参数不会被保留。
6. GET请求在URL中传送的参数是有长度限制的，而POST么有。
7. 对参数的数据类型，GET只接受ASCII字符，而POST没有限制。
8. GET比POST更不安全，因为参数直接暴露在URL上，所以不能用来传递敏感信息。
9. GET参数通过URL传递，POST放在Request body中。
10. GET产生一个TCP数据包；POST产生两个TCP数据包。
11. GET在请求的时候会一次性将header和data发出去，然后服务器响应200（返回数据）；而POST会先发header，等到服务器响应100（continue）的时候再发送data，然后服务器返回200（返回数据）。



# TCP和UDP的区别

相同点：  UDP协议和TCP协议都是传输层协议
不同点：
1）TCP 面向有连接； UDP：面向无连接
2）TCP 要提供可靠的、面向连接的传输服务。TCP在建立通信前，必须建立一个TCP连接，之后才能传输数据。TCP建立一个连接需要3次握手，断开连接需要4次挥手，并且提供超时重发，丢弃重复数据，检验数据，流量控制等功能，保证数据能从一端传到另一端
3）UDP不可靠性，只是把应用程序传给IP层的数据报发送出去，但是不能保证它们能到达目的地
4）应用场景
TCP效率要求相对低，但对准确性要求相对高的场景。如常见的接口调用、文件传输、远程登录等
UDP效率要求相对高，对准确性要求相对低的场景。如在线视频、网络语音电话等

# WebSocket
WebSocket是HTML5提供的一种浏览器与服务器进行全双工通讯的网络技术，属于应用层协议，WebSocket没有跨域的限制
相比于接口轮训，需要不断的建立 http 连接，严重浪费了服务器端和客户端的资源
WebSocket基于TCP传输协议，并复用HTTP的握手通道。浏览器和服务器只需要建立一次http连接，两者之间就直接可以创建持久性的连接，并进行双向数据传输。
缺点
websocket 不稳定，要建立心跳检测机制，如果断开，自动连接

# TCP的三次握手和四次挥手

## 三次握手的过程：
1）第一次握手：客户端向服务端发送连接请求报文，请求发送后，客户端便进入 SYN-SENT 状态
2）第二次握手：服务端收到连接请求报文段后，如果同意连接，则会发送一个应答，发送完成后便进入 SYN-RECEIVED 状态
3）第三次握手：当客户端收到连接同意的应答后，还要向服务端发送一个确认报文。客户端发完这个报文段后便进入 ESTABLISHED(已建立的) 状态，服务端收到这个应答后也进入 ESTABLISHED 状态，此时连接建立成功
## 为什么需要三次握手？
三次握手之所以是三次，是保证client和server均让对方知道自己的接收和发送能力没问题而保证的最小次数。两次不安全，四次浪费资源

## 四次挥手的过程
当服务端收到客户端关闭报文时，并不会立即关闭，先回复一个报文，告诉客户端，"你发的FIN报文我收到了"。只有等到我Server端所有的报文都发送完了，我才能发送连接释放请求，因此不能一起发送。故需要四步挥手
举例：
Browser:先告诉服务器 “我数据都发完了，你可以关闭连接了。”
Server:回复浏览器 “关闭的请求我收到了，我先看看我这边还有没有数据没传完。”
Server:确认过以后，再次回复浏览器 “我这边数据传输完成了，你可以关闭连接了。”
Browser:告诉服务器 “好的，那我关闭了。不用回复了。”
客户端又等了2MSL，确认确实没有再收到请求了，才会真的关闭TCP连接。
## 为什么需要四次挥手？

1）TCP 使用四次挥手的原因，是因为 TCP 的连接是全双工的，所以需要双方分别释放掉对方的连接
2）单独一方的连接释放，只代 表不能再向对方发送数据，连接处于的是半释放的状态
3）最后一次挥手中，客户端会等待一段时间再关闭的原因，是为了防止客户端发送给服务器的确认报文段丢失或者出错，从而导致服务器端不能正常关闭
## 什么是2MSL？
MSL是Maximum Segment Lifetime英文的缩写，中文可以译为“报文最大生存时间”
## 四次挥手后，为什么客户端最后还要等待2MSL？
1）保证客户端发送的最后一个ACK报文能够到达服务器，因为这个ACK报文可能丢失，如果服务端没有收到，服务端会重发一次，而客户端就能在这个2MSL时间段内收到这个重传的报文，接着给出回应报文，并且会重启2MSL计时器
2）防止“已经失效的连接请求报文段”出现在本连接中
客户端发送完最后一个确认报文后，在这个2MSL时间中，就可以使本连接持续的所产生的所有报文都从网络中消失。这样新的连接中不会出现旧连接的请求报文


# XSS(跨站脚本攻击)
XSS攻击介绍： 攻击者通过在页面注入恶意脚本，使之在用户的浏览器上运行
攻击案例：
```
<div><script>alert('XSS')</script></div>
<a href="javascript:alert('XSS')">123456</a>   
<a onclick='alert("xss攻击")'>链接</a>
```
XSS 攻击的几种方式

```
1）常见于带有用户提交数据的网站功能，如填写基本信息、论坛发帖、商品评论等；在可输入内容的地方提交如<script>alert('XSS')</script>之类的代码
XSS 的恶意代码存在数据库里，浏览器接收到响应后解析执行，混在其中的恶意代码也被执行
2）用户点击http://xxx/search?keyword="><script>alert('XSS');</script>，前端直接从url中将keyword后的参数取出来，并显示到页面上，但是没有做转义，就造成了XSS攻击。
```
XSS攻击的防范
```
1）前端尽量对用户输入内容长度控制、输入内容限制（比如电话号码、邮箱、包括特殊字符的限制）

2）服务器对前端提交的内容做好必要的转义，避免将恶意代码存储到数据库中，造成存储性xss攻击

3）前端对服务器返回的数据做好必要的转义，保证显示到页面的内容正常
```
# CSRF跨站请求伪造
csrf的攻击原理：
诱导受害者进入钓鱼网站，在钓鱼网站中利用你在被攻击网站已登录的凭证（凭证存在cookie中），冒充用户发送恶意请求，这些请求因为携带有用户的登录信息，会被服务器当做正常的请求处理，从而使你的个人隐私泄露或财产损失。

csrf的攻击过程：
1）受害者登录A站点，并保留了登录凭证（Cookie）
2）攻击者诱导受害者访问了站点B
3）站点B向站点A发送了一个请求，浏览器会默认携带站点A的Cookie信息
4）站点A接收到请求后，对请求进行验证，并确认是受害者的凭证，误以为是受害者发送的请求
5）站点A以受害者的名义执行了站点B的请求，攻击完成，攻击者在受害者不知情的情况下，冒充受害者完成了攻击

csrf的攻击的必要条件：

1）用户已登录过某网站，并且没有退出，登录信息存储在cookie中（发送请求时，浏览器会自动在请求头上带上要请求域名的cookie）
2）在不登出A的情况下，访问危险网站B

CSRF如何防御
1）根据攻击的原理可以看出，csrf通常是跨域请求（从钓鱼网站B发送请求网站A的请求），请求头上的Referer或origin字段可以判断请求的来源，如果服务器判断请求的域名不在白名单中，就拒绝对应的请求
2）添加token验证
CSRF攻击之所以能够成功，是因为用户验证信息都存在cookie中，攻击者可以完全伪造用户的请求。从请求头或请求参数中添加用户的token用来验证用户，如果请求没有或token不对，就拒绝对应的请求
3）验证码
对于转账或支付的环节，强制用户必须与应用进行交互，才能完成最终请求

# jsonp安全防范

jsonp是以callback的形式，返回服务端的数据 如http://www.qq.com/getUserInfo?callback=action
1）白名单验证
通过请求头上的Referer或origin字段可以判断请求的来源，如果服务器判断请求的域名不在白名单中，就拒绝对应的请求
2）对返回的内容进行验证或转义
根据jsonp的原理，当拿到callback的参数后，会直接当js代码执行，如果callback后面的参数是script标签，就会变成xss攻击了，所以要对返回的内容进行转义并限制长度，防范类似的攻击
例如http://youdomain.com?callback=<script>alert(1)</script>

# csp内容安全策略
内容安全策略 CSP (Content Security Policy) ，CSP 防止 XSS 攻击， 浏览器自动禁止外部脚本注入
CSP 的实质就是白名单制度，开发者明确告诉客户端，哪些外部资源可以加载和执行，等同于提供白名单。它的实现和执行全部由浏览器完成，开发者只需提供配置
CSP 大大增强了网页的安全性。攻击者即使发现了漏洞，也没法注入脚本，除非还控制了一台列入了白名单的可信主机
配置方式：
1）通过 HTTP 头信息的Content-Security-Policy的字段
Content-Security-Policy: script-src 'self'; object-src 'none';  style-src cdn.example.org third-party.org; child-src https:
2）通过网页的标签
<meta http-equiv="Content-Security-Policy" content="script-src 'self'; object-src 'none'; style-src cdn.example.org third-party.org; child-src https:">
两种配置方式的效果一样

