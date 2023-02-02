[http文章](https://juejin.cn/post/7166870049066582053)
# 发展史
## http 0.9 
最早时候只支持传输html，请求中没有任何请求头没有描述数据的信息。只有一个get请求。服务器发送完毕，就关闭TCP连接，同一个TCP连接只能发送一个http请求。

## http 1.0 （不是正式版）
引入了请求头和响应头，增加了status code和header等描述信息。增加了post put 请求，多字符集的支持，多部分的发送，权限，缓存。

## http 1.1(正式版)
持久连接,创建tcp连接后可以不关闭。在http 1.1中默认开启了一个请求头connect:keep-alive进行在一个tcp链接的复用。pipeline一个tcp连接可以发送多个http请求。当然即使引入了长链接keep-alive，还存在一个问题就是基于http 1.0中是一个请求发送得到响应后才开始发送下一个请求，针对这个机制1.1提出了管线化pipelining机制，但是需要注意的是服务器对应同一tcp链接上的请求是一个一个去处理的，服务端都是按照请求顺序处理的第二个请求要等第一个请求处理完才能被处理。所以这就会导致一个比较严重的问题队头阻塞。

如果说第一个发送的请求丢包了，那么服务器会等待这个请求重新发送过来在进行返回处理。之后才会处理下一个请求。即使浏览器是基于pipelining去多个请求同时发送的。

pipeling虽然可以一次发多个请求 但是这几个请求是有顺序的，但是http2打破了这种顺序
## http 2.0 
提出了很多个优化点，其中最著名的就是解决了http1.1中的队头阻塞问题。一个TCP连接上完成承载任意数量的双向数据流

### 二进制分帧
  
先解释一下，就是将一条连接上所有传输的信息，分割为更小的消息和帧(消息则是由一个或者多个帧组成的)，并对他们采用二进制格式编码。首部信息放在Headers帧中，而主体信息被封装在Data帧中。而且在每个帧的首部都有一个标识位。那么问题就来了。

1.为什么2.0可以对所有的内容进行二进制转换？

因为二进制分帧层是在应用层和传输层之间的中间层，所有的信息都会从中经过，进而可以转换。

2.为什要用二进制？

首先就是效率会更高，计算机最喜欢处理二进制数了。除此之外就是可以根据帧头部的八个位来定义额外的帧。除了数据帧和头部帧，实际上还有PING帧、SETTING帧、优先级帧等等，为之后的多路复用打上坚实的基础。

3.有什么其他的好处？

还可以在一个连接上实现双向数据流以及乱序发送。因为在，每一个帧上都有一个标记位。浏览器和服务端双方可以前期乱序接收消息和帧。接收完毕按照标记位的排列来拼接成一整条信息。所以，浏览器并行发送的请求，服务器可以并行返回，而不需要按照顺序返回。


### 多路复用
  
支持使用同一个tcp链接，基于二进制(之前是字符串传输)分帧层进行发送多个请求，支持同时发送多个请求,同时服务器也可以处理不同顺序的请求而不必按照请每个请求的顺序进行处理返回。这就解决了http 1.1中的队头阻塞问题。多路复用就是在一条tcp连接上，请求可以并行发送，而无需等待前面的响应返回。
  
和1.0的管道的区别？

管道也可以并行发送请求，但是返回响应的顺序则必须是发送时候的顺序。例如，发送A,B,C三个请求，那么返回的顺序就是A,B,C哪怕A返回之前，B,C已经准备好，依然要等到A返回，也容易造成阻塞。实际上，多路复用的基础就是二进制分帧，因为可以乱序发送和接收，所以就不必担心接收错误消息的问题，接收完毕直接拼接。

[原文链接](https://blog.csdn.net/m0_60360320/article/details/119812431)

### 头部压缩
在http2协议中对于请求头进行了压缩达到提交传输性能。通讯双方各自缓存一份头部字段表，既避免了重复header的传输，又减小了需要传输的大小。首部压缩实现的一个核心预设就是，在第一次请求之后，大部分的字段可以复用的。而且随着页面越来越复杂，同一个页面发出的请求会越来越多。如果头部不压缩的话，会造成很大的流量开销。对于相同的数据，不再通过每次请求和响应发送，通信期间几乎不会改变通用键-值对(用户代理、可接受的媒体类型，等等)只需发送一次。如果首部发生了变化，则只需将变化的部分加入到header帧中，改变的部分会加入到头部字段表中。实现原理：支持http2.0的浏览器和服务器会维护一个相同的静态表和一个动态表，以及内置一个霍夫曼编码表。静态表存储的是常见的一些头部，和一些很常见的头部键值对，例如method：get以及cookie。动态表开始是空的，如果头部命中静态表中的名称，那么就回将这份键值对加入动态表中，例如cookie：xxxx。这样做的原因在于，请求或则响应头命中了静态或者动态表的时候，只需要一个字节就能表示，可想而知，这个字节就是一个地址，指向表中的数据。来张大佬的图或许更加清晰(https://img-blog.csdnimg.cn/20210820095502815.png?x-oss-process=image/watermark,type_ZmFuZ3poZW5naGVpdGk,shadow_10,text_aHR0cHM6Ly9ibG9nLmNzZG4ubmV0L20wXzYwMzYwMzIw,size_16,color_FFFFFF,t_70)
  
### http2.0推送实现---Server push
[原文链接](https://www.ruanyifeng.com/blog/2018/03/http2_server_push.html)
http2中支持通过服务端主动推送给客户端对应的资源从而让浏览器提前下载缓存对应资源。如果正常客户端请求index.html的话，这个html里面有请求css和js文件，所以，需要重新请求css和js文件，但是http2.0能够“预测”主请求的依赖资源，在响应主请求的同时，主动并发推送依赖资源至客户端。推送将js和css文件一起和index.html一起返回。减少了请求。
#### 配置文件写法
```
server {
    listen 443 ssl http2;
    server_name  localhost;

    ssl                      on;
    ssl_certificate          /etc/nginx/certs/example.crt;
    ssl_certificate_key      /etc/nginx/certs/example.key;

    ssl_session_timeout  5m;

    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_protocols SSLv3 TLSv1 TLSv1.1 TLSv1.2;
    ssl_prefer_server_ciphers   on;

    location / {
      root   /usr/share/nginx/html;
      index  index.html index.htm;
      http2_push /style.css;
      http2_push /example.png;
    }
}
```
其实就是最后多了两行http2_push命令。它的意思是，如果用户请求根路径/，就推送style.css和example.png。

现在可以启动容器了。


$ docker container run \
  --rm \
  --name mynginx \
  --volume "$PWD/html":/usr/share/nginx/html \
  --volume "$PWD/conf":/etc/nginx \
  -p 127.0.0.2:8080:80 \
  -p 127.0.0.2:8081:443 \
  -d \
  nginx
打开浏览器，访问 https://127.0.0.2:8081 。浏览器会提示证书不安全，不去管它，继续访问，就能看到网页了。

网页上看不出来服务器推送，必须打开"开发者工具"，切换到 Network 面板，就可以看到其实只发出了一次请求，style.css和example.png都是推送过来的。
[服务端推送图片链接](https://www.ruanyifeng.com/blogimg/asset/2018/bg2018030502.png)
#### 后端实现
上面的服务器推送，需要写在服务器的配置文件里面。这显然很不方便，每次修改都要重启服务，而且应用与服务器的配置不应该混在一起。
服务器推送还有另一个实现方法，就是后端应用产生 HTTP 回应的头信息Link命令。服务器发现有这个头信息，就会进行服务器推送。

```
Link: </styles.css>; rel=preload; as=style
如果要推送多个资源，就写成下面这样。
Link: </styles.css>; rel=preload; as=style, </example.png>; rel=preload; as=image
```
这时，Nginx 的配置改成下面这样。
```
server {
    listen 443 ssl http2;

    # ...

    root /var/www/html;

    location = / {
        proxy_pass http://upstream;
        http2_push_preload on;
    }
}
```
如果服务器或者浏览器不支持 HTTP/2，那么浏览器就会按照 preload 来处理这个头信息，预加载指定的资源文件。事实上，这个头信息就是 preload 标准提出的，它的语法和as属性的值都写在了标准里面。

#### 缓存问题
服务器推送有一个很麻烦的问题。所要推送的资源文件，如果浏览器已经有缓存，推送就是浪费带宽。即使推送的文件版本更新，浏览器也会优先使用本地缓存。一种解决办法是，只对第一次访问的用户开启服务器推送。下面是 Nginx 官方给出的示例，根据 Cookie 判断是否为第一次访问。

```
server {
    listen 443 ssl http2 default_server;

    ssl_certificate ssl/certificate.pem;
    ssl_certificate_key ssl/key.pem;

    root /var/www/html;
    http2_push_preload on;

    location = /demo.html {
        add_header Set-Cookie "session=1";
        add_header Link $resources;
    }
}


map $http_cookie $resources {
    "~*session=1" "";
    default "</style.css>; as=style; rel=preload";
}
```
服务器推送可以提高性能。网上测评的结果是，打开这项功能，比不打开时的 HTTP/2 快了8%，比将资源都嵌入网页的 HTTP/1 快了5%。可以看到，提升程度也不是特别多，大概是几百毫秒。而且，也不建议一次推送太多资源，这样反而会拖累性能，因为浏览器不得不处理所有推送过来的资源。只推送 CSS 样式表可能是一个比较好的选择。

#### 服务器推送的缺点

服务器推送在实践中并没有真正发挥作用，流和优先级通常实施得很糟糕，因此，（减少）资源 捆绑甚至分片在某些情况下仍然是很好的做法。
因为在有客户端缓存的情况下，仍然有服务器推送就属于浪费带宽了。

### 请求优先级
[原文链接](https://juejin.cn/post/6844903745218674695)

以正确的顺序请求页面资源对于快速的用户体验至关重要。想象一下，如果一个网页上有一堆图片，还有一个外部样式表，一些自定义Web字体和一些在head中的脚本。如果浏览器首先下载了所有图片并且最后加载了样式表，在所有内容都加载完毕前，页面将完全是空白页。如果浏览器首先加载了所有阻塞资源，接着是Web字体和图片，那么它可以更早地呈现页面，并让用户开始看到内容，同时加载其余的图片。我在Chrome浏览器性能工作上的大部分时间都花在了尝试优化加载资源的顺序以获得最佳用户体验上。

使用HTTP/1.x，浏览器可以完全控制资源加载顺序。每个连接一次只能支持一个资源请求，服务器会尽快返回请求的内容。浏览器可以通过决定何时请求资源以及打开多少个并行连接来安排请求。
HTTP/2让这些事情变得更好也更复杂了。浏览器可以一次请求多个资源，指定一些优先级信息来帮助确定应该如何处理这些资源，然后等待服务器发回所有数据，而不是一次请求一个。如果浏览器和服务器都支持优先级，则应使用浏览器指定的规则并使用所有可用带宽来传递资源，而不会有资源之间的相互竞争。

首先是chrome、Firefox、Safari都内置了对于资源请求的优先级。但是ie并没有，所有请求一样的优先级

浏览器通过HEADERS帧和PRIORITY帧携带了优先级信息，服务器据此可以生成优先级树，并指导自己的资源分配。资源包括CPU、内存、带宽等等。
HTTP/2协议定义了这颗优先级树的各种特性，却没有给出一个具体实现，如何分配CPU？如何分配内存？数据准备好之后，如何决定传输数据？这些都依赖于工程师去具体实现。

nginx相关配置
指令：http2_streams_index_size
默认：http2_streams_index_size 31
上下文：http、server
所有的stream放到一个简易的hash数组中，
hash数组的大小为http2_streams_index_size+1
hash函数为 ((sid >> 1) & h2scf->streams_index_mask)     等价于sid%32
冲突处理函数为链表

### http2.0 没有被广泛使用的原因

1.服务器推送没有考虑到客户端缓存的优化,[原文](https://www.ctrl.blog/entry/http2-push-chromium-deprecation.html)
2.多路复用在多个小资源和合并成一个大资源的情况下并没有优势[原文](https://jakearchibald.com/2021/f1-perf-part-7/#lots-of-little-resources-vs-one-big-resource)

## 关于http 1.1的pipelining机制和http 2.0的多路复用
HTTP/1.1 without pipelining： 必须响应 TCP 连接上的每个 HTTP 请求，然后才能发出下一个请求。响应将以相同的顺序返回。
HTTP/2 multiplexing:  TCP 连接上的每个 HTTP 请求都可以立即发出，而无需等待先前的响应返回。响应可以按任何顺序返回。

## http3.0
[原文链接](https://www.smashingmagazine.com/2021/08/http3-core-concepts-part1/)
### 协议的改变QUIC
[QUIC：基于 UDP 的多路复用和安全传输](https://www.rfc-editor.org/rfc/rfc9000.html)
HTTP/3 本身是对 HTTP/2 的一个相对较小的改编，以使其与新的 QUIC 协议兼容。之所以需要 QUIC，是因为 TCP 自 Internet 早期就已经存在，并没有真正考虑到最大效率。例如，TCP 需要一个“握手”来建立一个新的连接。这样做是为了确保客户端和服务器都存在并且他们愿意并且能够交换数据。然而，它也需要一个完整的网络往返才能完成，然后才能对连接进行任何其他操作。如果客户端和服务器在地理上相距遥远，则每次往返时间 (RTT) 可能会花费超过 100 毫秒，从而导致明显的延迟。作为第二个示例，TCP 将其传输的所有数据视为单个“文件”或字节流，即使我们实际上是在同时使用它来传输多个文件（例如，当下载由以下内容组成的网页时）很多资源）。实际上，这意味着如果包含单个文件数据的 TCP 数据包丢失，那么所有其他文件也会延迟，直到这些数据包被恢复。这称为线头 (HoL) 阻塞。虽然这些低效率在实践中是可以控制的（否则，我们不会使用 TCP 超过 30 年），它们确实会以明显的方式影响更高级别的协议，例如 HTTP。这里的关键点是，我们需要的不是真正的 HTTP/3，而是“TCP/2”，我们在此过程中“免费”获得了 HTTP/3。我们对 HTTP/3 感到兴奋的主要特性（更快的连接设置、更少的 HoL 阻塞、连接迁移等）实际上都来自 QUIC。您可能听说过的一件事是 QUIC 在另一个协议之上运行，称为用户数据报协议(UDP)。这是真的，但不是出于许多人声称的（性能）原因。理想情况下，QUIC 应该是一个完全独立的新传输协议，直接在我上面分享的图片中显示的协议栈中的 IP 之上运行。但是，这样做会导致我们在尝试发展 TCP 时遇到的相同问题：首先必须更新 Internet 上的所有设备才能识别和允许 QUIC。幸运的是，我们可以在 Internet 上另一种广泛支持的传输层协议：UDP 之上构建 QUIC。在 UDP 之上，QUIC 基本上重新实现了几乎所有使 TCP 成为如此强大和流行（但速度较慢）协议的特性。QUIC 是绝对可靠的，它使用对接收到的数据包和重传的确认来确保丢失的数据包仍然到达。QUIC 也仍然建立连接并且具有高度复杂的握手。没有 TLS（安全传输协议） 就没有 QUIC 。

QUIC 还使用所谓的流量控制和拥塞控制机制来防止发送方使网络或接收方过载，但这也会使 TCP 比使用原始 UDP 时慢。关键是 QUIC 以比 TCP 更智能、更高效的方式实现这些功能。

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

### 加密方式

**对称加密**
这种方式加密和解密同用一个密钥。加密和解密都会用到密钥。没有密钥就无法对密码解密，反过来说，任何人只要持有密钥就能解密了。
以对称加密方式加密时必须将密钥也发给对方。可究竟怎样才能安全地转交？在互联网上转发密钥时，如果通信被监听那么密钥就可会落人攻击者之手，同时也就失去了加密的意义。另外还得设法安全地保管接收到的密钥。

**非对称加密**
公开密钥加密使用一对非对称的密钥。一把叫做私有密钥，另一把叫做公开密钥。顾名思义，私有密钥不能让其他任何人知道，而公开密钥则可以随意发布，任何人都可以获得。
使用公开密钥加密方式，发送密文的一方使用对方的公开密钥进行加密处理，对方收到被加密的信息后，再使用自己的私有密钥进行解密。利用这种方式，不需要发送用来解密的私有密钥，也不必担心密钥被攻击者窃听而盗走。

非对称加密的特点是信息传输一对多，服务器只需要维持一个私钥就能够和多个客户端进行加密通信。
这种方式有以下缺点：

公钥是公开的，所以针对私钥加密的信息，黑客截获后可以使用公钥进行解密，获取其中的内容；
公钥并不包含服务器的信息，使用非对称加密算法无法确保服务器身份的合法性，存在中间人攻击的风险，服务器发送给客户端的公钥可能在传送过程中被中间人截获并篡改；
使用非对称加密在数据加密解密过程需要消耗一定时间，降低了数据传输效率；

**对称加密+非对称加密(HTTPS采用这种方式)**

使用对称密钥的好处是解密的效率比较快，使用非对称密钥的好处是可以使得传输的内容不能被破解，因为就算你拦截到了数据，但是没有对应的私钥，也是不能破解内容的。就比如说你抢到了一个保险柜，但是没有保险柜的钥匙也不能打开保险柜。那我们就将对称加密与非对称加密结合起来,充分利用两者各自的优势，在交换密钥环节使用非对称加密方式，之后的建立通信交换报文阶段则使用对称加密方式。


### https工作流程

1.Client发起一个HTTPS,Client知道需要连接Server的443（默认）端口。
2.Server把事先配置好的公钥证书返回给客户端。
3.Client验证公钥证书：比如是否在有效期内等信息如果验证通过则继续，不通过则显示警告信息。
4.Client使用伪随机数生成器生成加密所使用的对称密钥，然后用证书的公钥加密这个对称密钥，发给Server。
5.Server使用自己的私钥（private key）解密这个消息，得到对称密钥。至此，Client和Server双方都持有了相同的对称密钥。
6.Server使用对称密钥加密“明文内容A”，发送给Client。
7.Client使用对称密钥解密响应的密文，得到“明文内容A”。
8.Client再次发起HTTPS的请求，使用对称密钥加密请求的“明文内容B”，然后Server使用对称密钥解密密文，得到“明文内容B”。

HTTPS比HTTP更加安全，对搜索引擎更友好，利于SEO,谷歌、百度优先索引HTTPS网页;
HTTPS需要用到SSL证书，而HTTP不用;
HTTPS标准端口443，HTTP标准端口80;
HTTPS基于传输层，HTTP基于应用层;
HTTPS在浏览器显示绿色安全锁，HTTP没有显示;


# http状态码
http 状态码 204 301 302 304 400 401 403 404 含义

http 状态码 204 （无内容） 服务器成功处理了请求，但没有返回任何内容
http 状态码 301 （永久移动） 请求的网页已永久移动到新位置。 服务器返回此响应（对 GET 或 HEAD 请求的响应）时，会自动将请求者转到新位置。
新的永久性的 URI 应当在响应的 Location 域中返回。除非这是一个 HEAD 请求，否则响应的实体中应当包含指向新的 URI 的超链接及简短说明。 　　

如果这不是一个 GET 或者 HEAD 请求，因此浏览器禁止自动进行重定向，除非得到用户的确认，因为请求的条件可能因此发生变化。

注意：对于某些使用 HTTP/1.0 协议的浏览器，当它们发送的 POST 请求得到了一个301响应的话，接下来的重定向请求将会变成 GET 方式。

http 状态码 302 （临时移动） 服务器目前从不同位置的网页响应请求，但请求者应继续使用原有位置来进行以后的请求。
请求的资源现在临时从不同的 URI 响应请求。由于这样的重定向是临时的，客户端应当继续向原有地址发送以后的请求。只有在Cache-Control或Expires中进行了指定的情况下，这个响应才是可缓存的。 　　

新的临时性的 URI 应当在响应的 Location 域中返回。除非这是一个 HEAD 请求，否则响应的实体中应当包含指向新的 URI 的超链接及简短说明。 　　

如果这不是一个 GET 或者 HEAD 请求，那么浏览器禁止自动进行重定向，除非得到用户的确认，因为请求的条件可能因此发生变化。 　　

301和302的区别

301重定向是永久的重定向，搜索引擎在抓取新内容的同时也将旧的网址替换为重定向之后的网址。

302重定向是临时的重定向，搜索引擎会抓取新的内容而保留旧的网址。因为服务器返回302代码，搜索引擎认为新的网址只是暂时的。

使用场景

场景一 
        301 -- 想换个域名，旧的域名不用啦，这样用户访问旧域名时用301就重定向到新的域名。其实也是告诉搜索引擎收录的域名需要对新的域名进行收录。

场景二 
        302 -- 登录后重定向到指定的页面，这种场景比较常见就是登录成功跳转到具体的系统页面。

场景三 
        301 -- 有时候需要自动刷新页面，比如5秒后回到订单详细页面之类。

场景四 
        302 -- 有时系统进行升级或者切换某些功能时，需要临时更换地址。

场景五 
        302 -- 像微博之类的使用短域名，用户浏览后需要重定向到真实的地址之类。

302 重定向和网址劫持（URL hijacking） 
从网址A 做一个302 重定向到网址B 时，主机服务器的隐含意思是网址A 随时有可能改主意，重新显示本身的内容或转向其他的地方。大部分的搜索引擎在大部分情况下，当收到302重定向时，一般只要去抓取目标网址就可以了，也就是说网址B。如果搜索引擎在遇到302 转向时，百分之百的都抓取目标网址B 的话，就不用担心网址URL 劫持了。问题就在于，有的时候搜索引擎，尤其是Google，并不能总是抓取目标网址。比如说，有的时候A 网址很短，但是它做了一个302重定向到B网址，而B网址是一个很长的乱七八糟的URL网址，甚至还有可能包含一些问号之类的参数。很自然的，A网址更加用户友好，而B网址既难看，又不用户友好。这时Google很有可能会仍然显示网址A。由于搜索引擎排名算法只是程序而不是人，在遇到302重定向的时候，并不能像人一样的去准确判定哪一个网址更适当，这就造成了网址URL劫持的可能性。也就是说，**一个不道德的人在他自己的网址A做一个302重定向到你的网址B**，出于某种原因， Google搜索结果所显示的仍然是网址A，但是所用的网页内容却是你的网址B上的内容，这种情况就叫做网址URL 劫持。你辛辛苦苦所写的内容就这样被别人偷走了。302重定向所造成的网址URL劫持现象，已经存在一段时间了。不过到目前为止，似乎也没有什么更好的解决方法。在正在进行的谷歌大爸爸数据中心转换中，302 重定向问题也是要被解决的目标之一。从一些搜索结果来看，网址劫持现象有所改善，但是并没有完全解决。

大体意思是会引起搜索引擎的排名，而且**302重定向很容易被搜索引擎误认为是利用多个域名指向同一网站，那么你的网站就会被封掉。**

**是说除非真是临时重定向使用302，其他的情况最好还是使用301吧**

http 状态码 304 （未修改） 自从上次请求后，请求的网页未修改过。 服务器返回此响应时，不会返回网页内容。
http 状态码 400 （错误请求） 服务器不理解请求的语法（一般为参数错误）。
http 状态码 401 （未授权） 请求要求身份验证。 对于需要登录的网页，服务器可能返回此响应。
http 状态码 403 （禁止） 服务器拒绝请求。（一般为客户端的用户权限不够）
http 状态码 404 （未找到） 服务器找不到请求的网页。


# 跨域CORS
[跨域解决方案](https://juejin.cn/post/7017614708832206878#heading-5)
cors是解决跨域问题的常见解决方法，关键是服务器要设置Access-Control-Allow-Origin，控制哪些域名可以共享资源。origin是cors的重要标识，只要是非同源或者POST请求都会带上Origin字段】

接口返回后服务器也可以将Access-Control-Allow-Origin设置为请求的Origin，解决cors如何指定多个域名的问题。

CORS将请求分为**简单请求**和**非简单请求**

* 简单请求
1）只支持HEAD，GET、POST请求方式
2）没有自定义的请求头；对CORS安全的首部集合 Accept Accept-Language Content-Language Range Content-Type
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

## JSONP跨域

jsonp优点:

完美解决在测试或者开发中获取不同域下的数据,用户传递一个callback参数给服务端，然后服务端返回数据时会将这个callback参数作为函数名来包裹住JSON数据，这样客户端就可以随意定制自己的函数来自动处理返回数据了。简单来说数据的格式没有发生很大变化

jsonp缺点:

1.jsonp只支持get请求而不支持post请求,也即是说如果想传给后台一个json格式的数据,此时问题就来了,浏览器会报一个http状态码415错误,告诉你请求格式不正确。

2.在登录模块中需要用到session来判断当前用户的登录状态,这时候由于是跨域的原因,前后台的取到的session是不一样的,那么就不能就行session来判断

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
[原文链接](https://juejin.cn/post/7127194919235485733)
## 1.可缓存性 
1.Cache-Control: public 代表http请求返回的内容所经过的任何路径中，http代理服务器，客户端，服务器都可以缓存、表示资源即可以被浏览器缓存也可以被代理服务器缓存
2.Cache-Control: private 只有发起请求的浏览器才能缓存
3.Cache-Control: no-cache 强制进行协商缓存
4.Cache-Control: no-store 是本地和proxy服务器都不能缓存
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

max-age：即最大有效时间，在上面的例子中我们可以看到
must-revalidate：如果超过了 max-age 的时间，浏览器必须向服务器发送请求，验证资源是否还有效。
no-cache：虽然字面意思是“不要缓存”，但实际上还是要求客户端缓存内容的，只是是否使用这个内容由后续的对比来决定。
no-store: 真正意义上的“不要缓存”。所有内容都不走缓存，包括强制和对比。
public：所有的内容都可以被缓存 (包括客户端和代理服务器， 如 CDN)
private：所有的内容只有客户端才可以缓存，代理服务器不能缓存。默认值。

# 浏览器的缓存机制
[原文介绍](https://juejin.cn/post/6844903747357769742)
重点看原文的一些案例
## 缓存位置
[PWA主要是优化web APP使用service worker](https://juejin.cn/post/6896426453303476238)
从缓存位置上来说分为四种，并且各自有优先级，当依次查找缓存且都没有命中的时候，才会去请求网络。
浏览器中的缓存位置一共有四种，按优先级从高到低排列分别是：

Service Worker PC端会Service Worker为主 移动端会 强缓存为主
Memory Cache 
Disk Cache
Push Cache

### Service Worker
是运行在浏览器背后的独立线程，一般可以用来实现缓存功能。使用 Service Worker的话，传输协议必须为 HTTPS。Service Worker 的缓存与浏览器其他内建的缓存机制不同，它可以让我们自由控制缓存哪些文件、如何匹配缓存、如何读取缓存，并且缓存是持续性的。由于它脱离了浏览器的窗体，因此无法直接访问DOM。虽然如此，但它仍然能帮助我们完成很多有用的功能，比如离线缓存、消息推送和网络代理等功能。其中的离线缓存就是 Service Worker Cache

和Memory Cache不同的是Service Worker没有任何预设的规则，它完全取决于开发者如何设置它。

Service Worker和Memory Cache主要的区别就是它是持久化的，即使tab页关闭或者浏览器重启，保存在Service Worker缓存里的资源不会消失。

一种删除Service Worker缓存的方法是使用JS代码，cache.delete(resource)；还有一种导致缓存被删除的情况是触发了系统的存储空间上限，此时页面的Service Worker缓存连同indexedDB, localStorage等都会一起被回收掉。

Service Worker仅仅在某个限定的作用域内生效，大多数情况下仅对单个host内的文档发起的请求生效。
### Memory Cache
几乎所有的网络请求资源都会被浏览器自动加入到 memory cache 中。但是也正因为数量很大但是浏览器占用的内存不能无限扩大这样两个因素，memory cache 注定只能是个“短期存储”。常规情况下，浏览器的 TAB 关闭后该次浏览的 memory cache 便告失效 (为了给其他 TAB 腾出位置)。而如果极端情况下 (例如一个页面的缓存就占用了超级多的内存)，那可能在 TAB 没关闭之前，排在前面的缓存就已经失效了。
刚才提过，几乎所有的请求资源 都能进入 memory cache，这里细分一下主要有两块：

preloader。如果你对这个机制不太了解，这里做一个简单的介绍，详情可以参阅这篇文章。
熟悉浏览器处理流程的同学们应该了解，在浏览器打开网页的过程中，会先请求 HTML 然后解析。之后如果浏览器发现了 js, css 等需要解析和执行的资源时，它会使用 CPU 资源对它们进行解析和执行。在古老的年代(大约 2007 年以前)，“请求 js/css - 解析执行 - 请求下一个 js/css - 解析执行下一个 js/css” 这样的“串行”操作模式在每次打开页面之前进行着。很明显在解析执行的时候，网络请求是空闲的，这就有了发挥的空间：我们能不能一边解析执行 js/css，一边去请求下一个(或下一批)资源呢？
这就是 preloader 要做的事情。不过 preloader 没有一个官方标准，所以每个浏览器的处理都略有区别。例如有些浏览器还会下载 css 中的 @import 内容或者 <video> 的 poster等。
而这些被 preloader 请求够来的资源就会被放入 memory cache 中，供之后的解析执行操作使用。

preload (虽然看上去和刚才的 preloader 就差了俩字母)。实际上这个大家应该更加熟悉一些，例如 <link rel="preload">。这些显式指定的预加载资源，也会被放入 memory cache 中。

memory cache 机制保证了一个页面中如果有两个相同的请求 (例如两个 src 相同的 <img>，两个 href 相同的 <link>)都实际只会被请求最多一次，避免浪费。
不过在匹配缓存时，除了匹配完全相同的 URL 之外，还会比对他们的类型，CORS 中的域名规则等。因此一个作为脚本 (script) 类型被缓存的资源是不能用在图片 (image) 类型的请求中的，即便他们 src 相等。
在从 memory cache 获取缓存内容时，浏览器会忽视例如 max-age=0, no-cache 等头部配置。例如页面上存在几个相同 src 的图片，即便它们可能被设置为不缓存，但依然会从 memory cache 中读取。这是因为 memory cache 只是短期使用，大部分情况生命周期只有一次浏览而已。而 max-age=0 在语义上普遍被解读为“不要在下次浏览时使用”，所以和 memory cache 并不冲突。
但如果站长是真心不想让一个资源进入缓存，就连短期也不行，那就需要使用 no-store。存在这个头部配置的话，即便是 memory cache 也不会存储，自然也不会从中读取了。(后面的第二个示例有关于这点的体现)

在preload的情况下 如果资源有强缓存字段 那么资源会被缓存在Disk Cache 中 
### Disk Cache
HTTP Cache也被叫做Disk Cache。

首先，HTTP Cache是持久化的，并且允许跨session甚至是跨站点地重用。如果一个资源被一个站点缓存在HTTP Cache中，另一个站点如果有相同的请求，是可以重用的。

其次，HTTP Cache是遵循HTTP语义的。它总是会储存最新的资源，验证需要被验证的资源，拒绝储存它不应该储存的资源，这些都是由资源的响应头决定的。

既然它是一个持久化的缓存，就需要某种机制去删除缓存。和Service Worker不同的是它可以逐条删除，当浏览器需要空间去储存更加新鲜或者更加重要的缓存的时候，旧的缓存就会被删除。

HTTP Cache有一个基于缓存的组件，用来匹配请求的资源是否命中它已有的缓存资源，如果有发现命中的资源，它需要从硬盘里取获取这个资源，这是一个昂贵的操作。

我们之前提到HTTP Cache是遵循HTTP语义的，这几乎是完全正常的，只有一个例外的情况：当一个资源是为了下个导航被预抓取回来的（通过<link rel=prefetch> 或者浏览器的其他内部逻辑）,即使它是不可储存的，它也将会被保留到下个导航。所以当这些预抓取资源到达HTTP Cache时，它将被保留大约5分钟，并且期间不会被重新验证。

disk cache 也叫 HTTP cache，顾名思义是存储在硬盘上的缓存，因此它是持久存储的，是实际存在于文件系统中的。而且它允许相同的资源在跨会话，甚至跨站点的情况下使用，例如两个站点都使用了同一张图片。

disk cache 会严格根据 HTTP 头信息中的各类字段来判定哪些资源可以缓存，哪些资源不可以缓存；哪些资源是仍然可用的，哪些资源是过时需要重新请求的。当命中缓存之后，浏览器会从硬盘中读取资源，虽然比起从内存中读取慢了一些，但比起网络请求还是快了不少的。绝大部分的缓存都来自 disk cache。

凡是持久性存储都会面临容量增长的问题，disk cache 也不例外。在浏览器自动清理时，会有神秘的算法去把“最老的”或者“最可能过时的”资源删除，因此是一个一个删除的。不过每个浏览器识别“最老的”和“最可能过时的”资源的算法不尽相同，可能也是它们差异性的体现。

### Push Cache
推送缓存）是 HTTP/2 中的内容，当以上三种缓存都没有命中时，它才会被使用。它只在会话（Session）中存在，一旦会话结束就被释放，并且缓存时间也很短暂

Push Cache是HTTP/2推送的资源存储的地方。它是HTTP/2会话的一部分。如果HTTP/2会话关闭了，储存在其中的资源都会消失。从不同的会话发起的请求将不会命中Push Cache中的资源。所有未被使用的资源在Push Cache会储存优先的时间（Chromium浏览器大约5分钟）。

Push Cache根据请求的URL以及请求表头来匹配资源，但是不是严格遵守HTTP语义的。

如果一个请求命中了Push Cache里的资源，那么这个资源将会从Push Cache里移除，然后经过HTTP Cache时，会保留一份拷贝缓存下来，再经过Service Worker（如果有）时，也会保留一份拷贝储存下来，最后请求的资源回到渲染引擎时，Memory Cache会存储一份对该资源的引用，如果将来本导航会话中的相同的资源请求，这份引用就可以直接被分配给该请求。
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

Etag的缺点：

ETag需要计算文件指纹这样意味着，服务端需要更多的计算开销。。如果文件尺寸大，数量多，并且计算频繁，那么ETag的计算就会影响服务器的性能。显然，ETag在这样的场景下就不是很适合。ETag有强验证和弱验证，所谓将强验证，ETag生成的哈希码深入到每个字节。哪怕文件中只有一个字节改变了，也会生成不同的哈希值，它可以保证文件内容绝对的不变。但是，强验证非常消耗计算量。ETag还有一个弱验证，弱验证是提取文件的部分属性来生成哈希值。因为不必精确到每个字节，所以他的整体速度会比强验证快，但是准确率不高。会降低协商缓存的有效性。


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

模式 1：不常变化的资源
Cache-Control: max-age=31536000
复制代码通常在处理这类资源资源时，给它们的 Cache-Control 配置一个很大的 max-age=31536000 (一年)，这样浏览器之后请求相同的 URL 会命中强制缓存。而为了解决更新的问题，就需要在文件名(或者路径)中添加 hash， 版本号等动态字符，之后更改动态字符，达到更改引用 URL 的目的，从而让之前的强制缓存失效 (其实并未立即失效，只是不再使用了而已)。
在线提供的类库 (如 jquery-3.3.1.min.js, lodash.min.js 等) 均采用这个模式。如果配置中还增加 public 的话，CDN 也可以缓存起来，效果拔群。
这个模式的一个变体是在引用 URL 后面添加参数 (例如 ?v=xxx 或者 ?_=xxx)，这样就不必在文件名或者路径中包含动态参数，满足某些完美主义者的喜好。在项目每次构建时，更新额外的参数 (例如设置为构建时的当前时间)，则能保证每次构建后总能让浏览器请求最新的内容。
特别注意： 在处理 Service Worker 时，对待 sw-register.js(注册 Service Worker) 和 serviceWorker.js (Service Worker 本身) 需要格外的谨慎。如果这两个文件也使用这种模式，你必须多多考虑日后可能的更新及对策。
模式 2：经常变化的资源
Cache-Control: no-cache
复制代码这里的资源不单单指静态资源，也可能是网页资源，例如博客文章。这类资源的特点是：URL 不能变化，但内容可以(且经常)变化。我们可以设置 Cache-Control: no-cache 来迫使浏览器每次请求都必须找服务器验证资源是否有效。
既然提到了验证，就必须 ETag 或者 Last-Modified 出场。这些字段都会由专门处理静态资源的常用类库(例如 koa-static)自动添加，无需开发者过多关心。
也正如上文中提到协商缓存那样，这种模式下，节省的并不是请求数，而是请求体的大小。所以它的优化效果不如模式 1 来的显著。
模式 3：非常危险的模式 1 和 2 的结合 （反例）
Cache-Control: max-age=600, must-revalidate
复制代码不知道是否有开发者从模式 1 和 2 获得一些启发：模式 2 中，设置了 no-cache，相当于 max-age=0, must-revalidate。我的应用时效性没有那么强，但又不想做过于长久的强制缓存，我能不能配置例如 max-age=600, must-revalidate 这样折中的设置呢？
表面上看这很美好：资源可以缓存 10 分钟，10 分钟内读取缓存，10 分钟后和服务器进行一次验证，集两种模式之大成，但实际线上暗存风险。因为上面提过，浏览器的缓存有自动清理机制，开发者并不能控制。
举个例子：当我们有 3 种资源： index.html, index.js, index.css。我们对这 3 者进行上述配置之后，假设在某次访问时，index.js 已经被缓存清理而不存在，但 index.html, index.css 仍然存在于缓存中。这时候浏览器会向服务器请求新的 index.js，然后配上老的 index.html, index.css 展现给用户。这其中的风险显而易见：不同版本的资源组合在一起，报错是极有可能的结局。
除了自动清理引发问题，不同资源的请求时间不同也能导致问题。例如 A 页面请求的是 A.js 和 all.css，而 B 页面是 B.js 和 all.css。如果我们以 A -> B 的顺序访问页面，势必导致 all.css 的缓存时间早于 B.js。那么以后访问 B 页面就同样存在资源版本失配的隐患。

如果我不使用must-revalidate，只是Cache-Control: max-age=600，浏览器缓存的自动清理机制就不会执行么？如果浏览器缓存的自动清理机制执行的话那后续的index.js被清掉的所引发的情况都是一样的呀！


'max-age=600' 和 'max-age=600,must-revalidate' 有什么区别？
没有区别。在列出 max-age 了之后，must-revalidate 是否列出效果相同，浏览器都会在超过 max-age 之后进行校验，验证缓存是否可用。
在 HTTP 的规范中，只阐述了 must-revalidate 的作用，却没有阐述不列出 must-revalidate 时，浏览器应该如何解决缓存过期的问题，因此这其实是浏览器实现时的自主决策。（可能有少数浏览器选择在源站点无法访问时继续使用过期缓存，但这取决于浏览器自身）

那 'max-age=600' 是不是也会引发问题？
是的。问题的出现和是否列出 'must-revalidate' 无关，依然会存在 JS CSS等文件版本失配的问题。因此常规的网站在不同页面需要使用不同的 JS CSS 文件时，如果要使用 max-age 做强缓存，不要设置一个太短的时间。

那这类比较短的 max-age 到底能用在哪里呢？
既然版本存在失配的问题，那么要避开这个问题，就有两种方法。

整站都使用相同的 JS 和 CSS，即合并后的文件。这个比较适合小型站点，否则可能过于冗余，影响性能。（不过可能还是会因为浏览器自身的清理策略被清理，依然有隐患）

资源是独立使用的，并不需要和其他文件配合生效。例如 RSS 就归在此类。

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

# POST和PUT请求的区别

让我们从解释 PUT 请求的关键特征开始：幂等性。

如果您多次调用 PUT 请求，则结果不变。 因此，假设你创建了一个资源：一本书。如果你调用该方法两次，结果仍是相同的。更准确地说，在数据库中一本书只存在一次。每本书都是唯一的。
一个 POST 请求有些不同。如果你创建了一本书，然后再创建同一本书，你将拥有两本书。换句话说，第二次请求时你将会得到不同的结果。

两种方法各有千秋，但 PUT 方法在防止副作用方面非常好用。

为了给让你有个更清晰的概念，让我描述一个场景：Juliette 想购买三明治，她点击一个按钮。因为网店的响应有点慢，她再次按下了同一个按钮。同一个请求两次到达服务器。因为你已经使用 PUT 请求实现了该方法，所以它在第二次访问服务器时没有造成任何的影响。Juliette 不必吃两顿饭，她也省下了一笔钱。很棒，对吧？

在许多情况下，PUT 请求非常适合用于防止不必要的更新。

备注：注意，即使你使用 PUT 方法，你仍有可能违反幂等性。如果你用和 POST 方法一样的方式来实现 PUT 方法，两者之间将没有任何区别。这违反了 PUT 的原则。作为一个 API 开发人员，你有责任创建好一个有效的 PUT 请求。

举一个简单的例子，假如有一个博客系统提供一个Web API，模式是这样http://superblogging/blogs/post/{blog-name}，很简单，将{blog-name}替换为我们的blog名字，往这个URI发送一个HTTP PUT或者POST请求，HTTP的body部分就是博文，这是一个很简单的REST API例子。我们应该用PUT方法还是POST方法？取决于这个REST服务的行为是否是idempotent的，假如我们发送两个http://superblogging/blogs/post/Sample请求，服务器端是什么样的行为？如果产生了两个博客帖子，那就说明这个服务不是idempotent的，因为多次使用产生了副作用了嘛；如果后一个请求把第一个请求覆盖掉了，那这个服务就是idempotent的。前一种情况，应该使用POST方法，后一种情况，应该使用PUT方法。
# 关于post请求产生的preflight request小记
[原文链接](https://juejin.cn/post/6844904164124786701)
## 问题背景

本地启动的前端vue项目使用axios发送post请求去获取一个展示列表，对于可能会产生的跨域请求后端项目中已经配置了如下
```
response.setHeader("Access-Control-Allow-Origin",request.getHeader("Origin"));
response.setHeader("Access-Control-Allow-Methods", "*");
response.setHeader("Access-Control-Allow-Credentials", "true");
response.setHeader("Access-Control-Allow-Headers", "Authorization,Origin, X-Requested-With, Content-Type, Accept,Access-Token");
```
前端请求为
```
axios.post(myUrl, {
    token: myToken,
}).then( res => {
    // do sth success
}).catch( err => {
    // do sth error
})
```
然后浏览器控制台显示为
origin xxxx has been blocked by CORS policy Response to preflight request doesnt pass access control check Redirect is not allowed for a preflight request

接着看报错的文字Redirect is not allowed for a preflight request.，其中有个关键字应该是preflight request

axios使用post请求时，会默认先发送一个option请求
axios使用post请求时，默认的Content-Type是application/json
使用FormData格式的参数作为post请求的参数时，不会出现跨域问题和preflight request报错

preflight request是为确保服务器是否允许发起对服务器数据产生副作用的HTTP请求方法，而预先由浏览器发起OPTIONS方法的一个预检请求，如果允许就发送真实的请求，如果不允许则直接拒绝发起真实请求。

## 尝试解决

### 方法一
在发送axios发送post请求时，配置header属性 + axios的data字段

注意：这个配置application/x-www-form-urlencoded后，浏览器不会报错preflight request，但后端可能会获取不到数据，因为虽然格式是application/x-www-form-urlencoded，但发送的参数还是JSON字符串

[如何解决原文链接](https://juejin.cn/post/6844903633151229959)

近期在利用axios向后台传数据时，axios默认传的是用application/json格式，若后台需要的数据格式为key/value格式，可以在axios的config中进行配置，也可以用qs.stringify()方法进行转换。

注：若用原生的<form>标签对后台进行post传输数据，默认即为key/value格式

方法一：在vue中axios的配置
```
this.$axios({
  method: 'post',
  url: 'https://jsonplaceholder.typicode.com/posts',
  // 利用 transformRequest 进行转换配置
  transformRequest: [
    function(oldData){
      // console.log(oldData)
      let newStr = ''
      for (let item in oldData){
        newStr += encodeURIComponent(item) + '=' + encodeURIComponent(oldData[item]) + '&'
      }
      newStr = newStr.slice(0, -1)
      return newStr
    }
  ],
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  data: dataObj,
})
```
方法二：利用qs.stringify()进行转换
```
import qs from 'qs' // qs在安装axios后会自动安装，只需要组件里import一下即可

// 代码省略...

dataObj = qs.stringify(dataObj) // 得到转换后的数据为 string 类型

this.$axios({
  method: 'post',
  url: 'https://jsonplaceholder.typicode.com/posts',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  data: dataObj,  // 直接提交转换后的数据即可
})
```

方法三：利用URLSearchParams()进行转换

```
let param = {
    aa: 'aaaa',
    bb: 'bbbb'
}
// 组件内直接使用URLSearchParams()

let params = new URLSearchParams()
params.append('aa', 'aaaa')
params.append('bb', 'bbbb')

this.$axios.post('https://jsonplaceholder.typicode.com/posts', params: params).then(()=>{})

```

### 方法二
使用FormData参数格式 + axios的data字段
```
let formData = new FormData();
formData.append('token', myToken);
axios({
    method: 'post',
    url: myUrl,
    data: formData,
})
```
使用formData发送请求时，axios不会预先发送option请求，直接只有一个post请求

### 方法三
直接使用axios的params字段
axios({
    method: 'post',
    url: myUrl,
    params: {
        token: myToken,
    },
})
复制代码使用params字段发送请求时，axios不会预先发送option请求，直接只有一个post请求

补充：如果axios用post请求且直接使用data字段，浏览器会报preflight request错误，而且浏览器会先发送一个option请求

# url编码的三种方式和区别
[原文链接](https://www.ruanyifeng.com/blog/2010/02/url_encoding.html)

为什么要编码 --- 网络标准RFC 1738做了硬性规定：

"只有字母和数字[0-9a-zA-Z]、一些特殊符号"$-_.+!*'(),"[不包括双引号]、以及某些保留字，才可以不经过编码直接用于URL。"

不同的操作系统、不同的浏览器、不同的网页字符集，将导致完全不同的编码结果。如果程序员要把每一种结果都考虑进去，是不是太恐怖了？有没有办法，能够保证客户端只用一种编码方法向服务器发出请求。回答是有的，就是使用Javascript先对URL编码，然后再向服务器提交，不要给浏览器插手的机会。因为Javascript的输出总是一致的，所以就保证了服务器得到的数据是格式统一的。

一旦被Javascript编码（以下三种编码方式），就都变为unicode字符。也就是说，Javascipt函数的输入和输出，默认都是Unicode字符
## escape()
实际上，escape()不能直接用于URL编码，它的真正作用是返回一个字符的Unicode编码值。比如"春节"的返回结果是%u6625%u8282，也就是说在Unicode字符集中，"春"是第6625个（十六进制）字符，"节"是第8282个（十六进制）字符。

它的具体规则是，除了ASCII字母、数字、标点符号"@ * _ + - . /"以外，对其他所有字符进行编码。在\u0000到\u00ff之间的符号被转成%xx的形式，其余符号被转成%uxxxx的形式。对应的解码函数是unescape()。

所以，"Hello World"的escape()编码就是"Hello%20World"。因为空格的Unicode值是20（十六进制）。


## encodeURI()
encodeURI()是Javascript中真正用来对URL编码的函数。

它着眼于对整个URL进行编码，因此除了常见的符号以外，对其他一些在网址中有特殊含义的符号"; / ? : @ & = + $ , #"，也不进行编码。编码后，它输出符号的utf-8形式，并且在每个字节前加上%。

需要注意的是，它不对单引号'编码。

## encodeURIComponent()
最后一个Javascript编码函数是encodeURIComponent()。与encodeURI()的区别是，它用于对URL的组成部分进行个别编码，而不用于对整个URL进行编码。

因此，"; / ? : @ & = + $ , #"，这些在encodeURI()中不被编码的符号，在encodeURIComponent()中统统会被编码。至于具体的编码方法，两者是一样。

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
