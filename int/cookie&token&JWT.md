[原文链接](https://juejin.cn/post/6844904034181070861)
[csrf攻击](https://tech.meituan.com/2018/10/11/fe-security-csrf.html)

# Cookie认证机制

```
1、用户向服务器发送用户名和密码。
2、服务器验证通过后，在当前对话（session）里面保存相关数据，比如用户角色、登录时间等等。
3、服务器向用户返回一个session_id，写入用户的Cookie。
4、用户随后的每一次请求，都会通过 Cookie，将 session_id 传回服务器。
5、服务器收到 session_id，找到前期保存的数据，由此得知用户的身份。
```
## cookie
HTTP 是无状态的协议（对于事务处理没有记忆能力，每次客户端和服务端会话完成时，服务端不会保存任何会话信息）：每个请求都是完全独立的，服务端无法确认当前访问者的身份信息，无法分辨上一次的请求发送者和这一次的发送者是不是同一个人。所以服务器与浏览器为了进行会话跟踪（知道是谁在访问我），就必须主动的去维护一个状态，这个状态用于告知服务端前后两个请求是否来自同一浏览器。而这个状态需要通过 cookie 或者 session 去实现。
cookie 存储在客户端： cookie 是服务器发送到用户浏览器并保存在本地的一小块数据，它会在浏览器下次向同一服务器再发起请求时被携带并发送到服务器上。
cookie 是不可跨域的： 每个 cookie 都会绑定单一的域名，无法在别的域名下获取使用，一级域名和二级域名之间是允许共享使用的（靠的是 domain）。


name=value
键值对，设置 Cookie 的名称及相对应的值，都必须是字符串类型- 如果值为 Unicode 字符，需要为字符编码。- 如果值为二进制数据，则需要使用 BASE64 编码。


domain
指定 cookie 所属域名，默认是当前域名


path
指定 cookie 在哪个路径（路由）下生效，默认是 '/'。如果设置为 /abc，则只有 /abc 下的路由可以访问到该 cookie，如：/abc/read。


maxAge
cookie 失效的时间，单位秒。如果为整数，则该 cookie 在 maxAge 秒后失效。如果为负数，该 cookie 为临时 cookie ，关闭浏览器即失效，浏览器也不会以任何形式保存该 cookie 。如果为 0，表示删除该 cookie 。默认为 -1。- 比 expires 好用。


expires
过期时间，在设置的某个时间点后该 cookie 就会失效。一般浏览器的 cookie 都是默认储存的，当关闭浏览器结束这个会话的时候，这个 cookie 也就会被删除


secure
该 cookie 是否仅被使用安全协议传输。安全协议有 HTTPS，SSL等，在网络上传输数据之前先将数据加密。默认为false。当 secure 值为 true 时，cookie 在 HTTP 中是无效，在 HTTPS 中才有效。


httpOnly
如果给某个 cookie 设置了 httpOnly 属性，则无法通过 JS 脚本 读取到该 cookie 的信息，但还是能通过 Application 中手动修改 cookie，所以只是在一定程度上可以防止 XSS 攻击，不是绝对的安全

### cookie缺点

Cookie 存储在客户端，可随意篡改，不安全
有大小限制，最大为 4kb
有数量限制，一般一个浏览器对于一个网站只能存不超过 20 个 Cookie，浏览器一般只允许存放 300个 Cookie
Android 和 IOS 对 Cookie 支持性不好 Cookie 是不可跨域的，但是一级域名和二级域名是允许共享使用的（靠的是 domain）

## 什么是 Session
session 是另一种记录服务器和客户端会话状态的机制
session 是基于 cookie 实现的，session 存储在服务器端，sessionId 会被存储到客户端的cookie 中
SessionID 是连接 Cookie 和 Session 的一道桥梁

## Session和Cookie的区别

Cookie 和 Session 的区别

安全性： Session 比 Cookie 安全，Session 是存储在服务器端的，Cookie 是存储在客户端的。
存取值的类型不同：Cookie 只支持存字符串数据，想要设置其他类型的数据，需要将其转换成字符串，Session 可以存任意数据类型。
有效期不同： Cookie 可设置为长时间保持，比如我们经常使用的默认登录功能，Session 一般失效时间较短，客户端关闭（默认情况下）或者 Session 超时都会失效。
存储大小不同： 单个 Cookie 保存的数据不能超过 4K，Session 可存储数据远高于 Cookie，但是当访问量过多，会占用过多的服务器资源。
存取值的类型不同： Cookie 只支持字符串数据，Session 可以存任意数据类型；
有效期不同：Cookie可设置为长时间保持，Session 一般失效时间较短；
# Token认证机制

```
1.客户端使用用户名跟密码请求登录
2.服务端收到请求，去验证用户名与密码
3.验证成功后，服务端会签发一个 token 并把这个 token 发送给客户端
4.客户端收到 token 以后，会把它存储起来，比如放在 cookie 里或者 localStorage 里
5.客户端每次向服务端请求资源的时候需要带着服务端签发的 token
6.服务端收到请求，然后去验证客户端请求里面带着的 token ，如果验证成功，就向客户端返回请求的数据
```
## 优点
1.服务端无状态化、可扩展性好： Token 机制在服务端不需要存储会话（Session）信息，因为 Token 自身包含了其所标识用户的相关信息，这有利于在多个服务间共享用户状态

2.支持 APP 移动端设备；

3.安全性好： 有效避免 CSRF 攻击（因为不需要 Cookie）

4.支持跨程序调用： 因为 Cookie 是不允许跨域访问的，而 Token 则不存在这个问题

## 缺点

1.配合： 需要前后端配合处理；
2.占带宽： 正常情况下比 sid 更大，消耗更多流量，挤占更多宽带
3.性能问题： 虽说验证 Token 时不用再去访问数据库或远程服务进行权限校验，但是需要对 Token 加解密等操作，所以会更耗性能；
4.有效期短： 为了避免 Token 被盗用，一般 Token 的有效期会设置的较短，所以就有了 Refresh Token；
## token认证机制出现的原因
```
- cookie认证需要后台存一份session_id到数据库，多服务器时需要session共享。Session是在服务器端的，而 token 是在客户端的。
- cookie有跨域限制，并且cookie存在默认存储和默认发送行为有安全性问题
- 但是token可以自己存储自己发送不存在跨域限制更加灵活。如果token是在授权头（Authorization header）中发送的，那么跨源资源共享(CORS)将不会成为问题，因为它不使用cookie。所以多用于单点登陆。
- 在安全性上也能做更多优化
- Cookie 由于存储的内存空间只有 4kb，因此存储的主要是一个用户 id，其他的用户信息都存储在服务器的 Session 中，而 Token 没有内存限制，用户信息可以存储 Token 中，返回给用户自行存储，因此可以看出，采用 Cookie 的话，由于所有用户都需要在服务器的 Session 中存储相对应的用户信息，所以如果用户量非常大，这对于服务器来说，将是非常大的性能压力，而Token 将用户信息返回给客户端各自存储，也就完全避开这个问题了

token认证则不需要后台保存，token一般放在HTTP请求头的Authorization中。
```

## Access-Token
访问资源接口（API）时所需要的资源凭证
简单 token 的组成： uid(用户唯一的身份标识)、time(当前时间的时间戳)、sign（签名，token 的前几位以哈希算法压缩成的一定长度的十六进制字符串）
特点：

* 服务端无状态化、可扩展性好
* 支持移动端设备
* 安全
* 支持跨程序调用

## Refresh Token
refresh token 是专用于刷新 access token 的 token。如果没有 refresh token，也可以刷新 access token，但每次刷新都要用户输入登录用户名与密码，会很麻烦。有了 refresh token，可以减少这个麻烦，客户端直接用 refresh token 去更新 access token，无需用户进行额外的操作。

```
1.客户端使用用户名跟密码请求登录
2.服务端收到请求，去验证用户名与密码
3.验证成功后，服务端会签发一个 Access-token（过期时间一周）  和 refresh-token（过期时间一个月） 并把这两个 token 发送给客户端
4.客户端使用Access-token发送请求验证信息，如果Access-token过期了，那么就会发送refresh_token验证是否过期，如果refresh_token没过期，refresh_token通过验证就生成新的Access-token。
5.refresh_token过期需要重新输入用户名密码登陆
```
## Token 和 Session 的区别
Session 是一种记录服务器和客户端会话状态的机制，使服务端有状态化，可以记录会话信息。而 Token 是令牌，访问资源接口（API）时所需要的资源凭证。Token 使服务端无状态化，不会存储会话信息。

Session 和 Token 并不矛盾，作为身份认证 Token 安全性比 Session 好，因为每一个请求都有签名还能防止监听以及重放攻击，而 Session 就必须依赖链路层来保障通讯安全了。如果你需要实现有状态的会话，仍然可以增加 Session 来在服务器端保存一些状态。

所谓 Session 认证只是简单的把 User 信息存储到 Session 里，因为 SessionID 的不可预测性，暂且认为是安全的。而 Token ，如果指的是 OAuth Token 或类似的机制的话，提供的是 认证 和 授权 ，认证是针对用户，授权是针对 App 。其目的是让某 App 有权利访问某用户的信息。这里的 Token 是唯一的。不可以转移到其它 App上，也不可以转到其它用户上。Session 只提供一种简单的认证，即只要有此 SessionID ，即认为有此 User 的全部权利。是需要严格保密的，这个数据应该只保存在站方，不应该共享给其它网站或者第三方 App。所以简单来说：如果你的用户数据可能需要和第三方共享，或者允许第三方调用 API 接口，用 Token 。如果永远只是自己的网站，自己的 App，用什么就无所谓了。

## JWT认证

Token 的使用方式以及组成，我们不难发现，服务端验证客户端发送过来的 Token 时，还需要查询数据库获取用户基本信息，然后验证 Token 是否有效；这样每次请求验证都要查询数据库，增加了查库带来的延迟等性能消耗；那么这时候业界常用的 JWT 就应运而生了！！！

JSON Web Token（简称 JWT）是目前最流行的跨域认证解决方案。是一种认证授权机制。

JWT 是为了在网络应用环境间传递声明而执行的一种基于 JSON 的开放标准（RFC 7519）。JWT 的声明一般被用来在身份提供者和服务提供者间传递被认证的用户身份信息，以便于从资源服务器获取资源。比如用在用户登录上。可以使用 HMAC 算法或者是 RSA 的公/私秘钥对 JWT 进行签名。因为数字签名的存在，这些传递的信息是可信的。

### 什么是JWT

JWT 是 Auth0 提出的通过 对 JSON 进行加密签名来实现授权验证的方案；

就是登录成功后将相关用户信息组成 JSON 对象，然后对这个对象进行某种方式的加密，返回给客户端；

客户端在下次请求时带上这个 Token；

服务端再收到请求时校验 token 合法性，其实也就是在校验请求的合法性。

**jwt认证的构成**
JWT 由三部分组成： Header 头部、 Payload 负载 和 Signature 签名

它是一个很长的字符串，中间用点（.）分隔成三个部分。列如 ：

 eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c

#### Header header典型的由两部分组成
token的类型（“JWT”）和算法名称（比如：HMAC SHA256或者RSA等等）。
{
    'alg': "HS256", // alg：使用的 Hash 算法，例如 HMAC SHA256 或 RSA.
    'typ': "JWT" // typ：代表 Token 的类型，这里使用的是 JWT 类型；
}

#### Payload 负载
它包含一些声明 Claim (实体的描述，通常是一个 User 信息，还包括一些其他的元数据) ，用来存放实际需要传递的数据，JWT 规定了7个官方字段：

iss (issuer)：签发人
exp (expiration time)：过期时间
sub (subject)：主题
aud (audience)：受众
nbf (Not Before)：生效时间
iat (Issued At)：签发时间
jti (JWT ID)：编号
除了官方字段，你还可以在这个部分定义私有字段，下面就是一个例子。

 {
   "sub": "1234567890",
   "name": "John Doe",
   "admin": true
 }
#### Signature 签名
Signature 部分是对前两部分的签名，防止数据篡改。 首先，需要指定一个密钥（secret）。这个密钥只有服务器才知道，不能泄露给用户。然后，使用 Header 里面指定的签名算法（默认是 HMAC SHA256），按照下面的公式产生签名。

 HMACSHA256(
   base64UrlEncode(header) + "." +
   base64UrlEncode(payload),
   secret)

### 方式一

当用户希望访问一个受保护的路由或者资源的时候，可以把它放在 Cookie 里面自动发送，但是这样不能跨域，所以更好的做法是放在 HTTP 请求头信息的 Authorization 字段里，使用 Bearer 模式添加 JWT。
GET /calendar/v1/events
Host: api.example.com
Authorization: Bearer <token>
用户的状态不会存储在服务端的内存中，这是一种 无状态的认证机制
服务端的保护路由将会检查请求头 Authorization 中的 JWT 信息，如果合法，则允许用户的行为。
由于 JWT 是自包含的，因此减少了需要查询数据库的需要
JWT 的这些特性使得我们可以完全依赖其无状态的特性提供数据 API 服务，甚至是创建一个下载流服务。
因为 JWT 并不使用 Cookie ，所以你可以使用任何域名提供你的 API 服务而不需要担心跨域资源共享问题（CORS）

### 方式二

跨域的时候，可以把 JWT 放在 POST 请求的数据体里。
### 方式三

通过 URL 传输 http://www.example.com/user?token=xxx

## Token 和 JWT 的区别 
### 相同：

都是访问资源的令牌
都可以记录用户的信息
都是使服务端无状态化
都是只有验证成功后，客户端才能访问服务端上受保护的资源

### 区别：

Token：服务端验证客户端发送过来的 Token 时，还需要查询数据库获取用户信息，然后验证 Token 是否有效。
JWT： 将 Token 和 Payload 加密后存储于客户端，服务端只需要使用密钥解密进行校验（校验也是 JWT 自己实现的）即可，不需要查询或者减少查询数据库，因为 JWT 自包含了用户信息和加密的数据。

## node中使用jwt实现token认证

在项目中安装jsonwebtoken依赖
```
npm i jsonwebtoken --save
```

新建authorization.js
```
const jwt = require("jsonwebtoken");

const secretKey = "secretKey";

// 生成token
module.exports.generateToken = function (payload) { 
  const token =
    "Bearer " +
    jwt.sign(payload, secretKey, {
      expiresIn: 60 * 60,
    });
  return token;
};

// 验证token
module.exports.verifyToken = function (req, res, next) {
  const token = req.headers.authorization.split(" ")[1];
  jwt.verify(token, secretKey, function (err, decoded) {
    if (err) {
      console.log("verify error", err);
      return res.json({ code: "404", msg: "token无效" });
    }
    console.log("verify decoded", decoded);
    next();
  });
};
生成 token 时加了前缀'Bearer '，验证时要把'Bearer '去掉， req.headers.authorization.split(" ")[1]，不然会出现JsonWebTokenError: invalid token的错误，验证失败。

```
登录接口生成token返回给前端

```
// login.js
const express = require("express");
const router = express.Router();
const { generateToken } = require("./authorization");

// 路由
router.post("/", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const token = generateToken({ username: username });
  res.json({
    code: 200,
    msg: "登录成功",
    data: { token },
  });
});

module.exports = router;
```
在app.js中注册中间件

```
const loginRouter = require("./login");
const auth = require("./authorization");
const userRouter = require("./user");

app.use("/api/login", loginRouter);
app.use("/api/*", auth.verifyToken); // 注册token验证中间件
app.use("/api/user", userRouter);

验证token的中间件要放在login路由之后，其他需要验证的路由之前
```
# 使用中需要注意的问题
## 使用 cookie 时需要考虑的问题

因为存储在客户端，容易被客户端篡改，使用前需要验证合法性
不要存储敏感数据，比如用户密码，账户余额
使用 httpOnly 在一定程度上提高安全性
尽量减少 cookie 的体积，能存储的数据量不能超过 4kb
设置正确的 domain 和 path，减少数据传输
cookie 无法跨域
一个浏览器针对一个网站最多存 20 个Cookie，浏览器一般只允许存放 300 个Cookie
移动端对 cookie 的支持不是很好，而 session 需要基于 cookie 实现，所以移动端常用的是 token


## 使用 session 时需要考虑的问题

将 session 存储在服务器里面，当用户同时在线量比较多时，这些 session 会占据较多的内存，需要在服务端定期的去清理过期的 session
当网站采用集群部署的时候，会遇到多台 web 服务器之间如何做 session 共享的问题。因为 session 是由单个服务器创建的，但是处理用户请求的服务器不一定是那个创建 session 的服务器，那么该服务器就无法拿到之前已经放入到 session 中的登录凭证之类的信息了。
当多个应用要共享 session 时，除了以上问题，还会遇到跨域问题，因为不同的应用可能部署的主机不一样，需要在各个应用做好 cookie 跨域的处理。
sessionId 是存储在 cookie 中的，假如浏览器禁止 cookie 或不支持 cookie 怎么办？ 一般会把 sessionId 跟在 url 参数后面即重写 url，所以 session 不一定非得需要靠 cookie 实现
移动端对 cookie 的支持不是很好，而 session 需要基于 cookie 实现，所以移动端常用的是 token


## 使用 token 时需要考虑的问题

如果你认为用数据库来存储 token 会导致查询时间太长，可以选择放在内存当中。比如 redis 很适合你对 token 查询的需求。
token 完全由应用管理，所以它可以避开同源策略
token 可以避免 CSRF 攻击(因为不需要 cookie 了)
移动端对 cookie 的支持不是很好，而 session 需要基于 cookie 实现，所以移动端常用的是 token


## 使用 JWT 时需要考虑的问题

因为 JWT 并不依赖 Cookie 的，所以你可以使用任何域名提供你的 API 服务而不需要担心跨域资源共享问题（CORS）
JWT 默认是不加密，但也是可以加密的。生成原始 Token 以后，可以用密钥再加密一次。
JWT 不加密的情况下，不能将秘密数据写入 JWT。
JWT 不仅可以用于认证，也可以用于交换信息。有效使用 JWT，可以降低服务器查询数据库的次数。
JWT 最大的优势是服务器不再需要存储 Session，使得服务器认证鉴权业务可以方便扩展。但这也是 JWT 最大的缺点：由于服务器不需要存储 Session 状态，因此使用过程中无法废弃某个 Token 或者更改 Token 的权限。也就是说一旦 JWT 签发了，到期之前就会始终有效，除非服务器部署额外的逻辑。
JWT 本身包含了认证信息，一旦泄露，任何人都可以获得该令牌的所有权限。为了减少盗用，JWT的有效期应该设置得比较短。对于一些比较重要的权限，使用时应该再次对用户进行认证。
JWT 适合一次性的命令认证，颁发一个有效期极短的 JWT，即使暴露了危险也很小，由于每次操作都会生成新的 JWT，因此也没必要保存 JWT，真正实现无状态。
为了减少盗用，JWT 不应该使用 HTTP 协议明码传输，要使用 HTTPS 协议传输。


## 使用加密算法时需要考虑的问题

绝不要以明文存储密码
永远使用 哈希算法 来处理密码，绝不要使用 Base64 或其他编码方式来存储密码，这和以明文存储密码是一样的，使用哈希，而不要使用编码。编码以及加密，都是双向的过程，而密码是保密的，应该只被它的所有者知道， 这个过程必须是单向的。哈希正是用于做这个的，从来没有解哈希这种说法， 但是编码就存在解码，加密就存在解密。
绝不要使用弱哈希或已被破解的哈希算法，像 MD5 或 SHA1 ，只使用强密码哈希算法。
绝不要以明文形式显示或发送密码，即使是对密码的所有者也应该这样。如果你需要 “忘记密码” 的功能，可以随机生成一个新的 一次性的（这点很重要）密码，然后把这个密码发送给用户。

# OAuth 2.0 

[原文链接](https://mp.weixin.qq.com/s?__biz=MzU2Mjg0NDY5Ng==&mid=2247487991&idx=1&sn=9d231fd2ffca433e9c4059450f6d1e6c&chksm=fc621480cb159d96408f75505f0385dd4e7b48eae389c2e5397ee781212581138164826ab21f&cur_album_id=1791804093934469123&scene=189#wechat_redirect)

OAuth 是一个开放标准，允许用户授权第三方网站 (CSDN、思否等) 访问他们存储在另外的服务提供者上的信息，而不需要将用户名和密码提供给第三方网站；

常见的提供 OAuth 认证服务的厂商：支付宝、QQ、微信、微博

简单说，OAuth 就是一种授权机制。数据的所有者告诉系统，同意授权第三方应用进入系统，获取这些数据。系统从而产生一个短期的进入令牌（Token），用来代替密码，供第三方应用使用。

令牌（Token） 与 密码（Password） 的作用是一样的，都可以进入系统，但是有三点差异:

令牌是短期的，到期会自动失效：用户自己无法修改。密码一般长期有效，用户不修改，就不会发生变化。
令牌可以被数据所有者撤销，会立即失效。
令牌有权限范围（scope）：对于网络服务来说，只读令牌就比读写令牌更安全。密码一般是完整权限。

OAuth 2.0 对于如何颁发令牌的细节，规定得非常详细。具体来说，一共分成四种授权模式 （Authorization Grant） ，适用于不同的互联网场景。

无论哪个模式都拥有三个必要角色：客户端、授权服务器、资源服务器，有的还有用户（资源拥有者），下面简单介绍下四种授权模式。

## 授权码模式

授权码（Authorization Code Grant) 方式，指的是第三方应用先申请一个授权码，然后再用该码获取令牌。

这种方式是最常用的流程，安全性也最高，它适用于那些有后端服务的 Web 应用。授权码通过前端传送，令牌则是储存在后端，而且所有与资源服务器的通信都在后端完成。这样的前后端分离，可以避免令牌泄漏。

一句话概括：客户端换取授权码，客户端使用授权码换token，客户端使用token访问资源

授权码模式的步骤详解

1、客户端：

打开网站 A，点击登录按钮，请求 A 服务，A 服务重定向 (重定向地址如下) 至授权服务器 (如QQ、微信授权服务)。

 https://qq.com/oauth/authorize?
   response_type=code&
   client_id=CLIENT_ID&
   redirect_uri=CALLBACK_URL&
   scope=read
上面 URL 中，response_type 参数表示要求返回授权码（code），client_id 参数让 B 知道是谁在请求，redirect_uri 参数是 B 接受或拒绝请求后的跳转网址，scope 参数表示要求的授权范围（这里是只读）

2、授权服务器：

授权服务网站 会要求用户登录，然后询问是否同意给予 A 网站授权。用户表示同意，这时授权服务网站 就会跳回 redirect_uri 参数指定的网址。跳转时，会传回一个授权码，就像下面这样。

https://a.com/callback?code=AUTHORIZATION_CODE
上面URL中，code 参数就是授权码。


3、网站 A 服务器：

拿到授权码以后，就可以向 授权服务器 (qq.com) 请求令牌，请求地址如下：

 https://qq.com/oauth/token?
  client_id=CLIENT_ID&
  client_secret=CLIENT_SECRET&
  grant_type=authorization_code&
  code=AUTHORIZATION_CODE&
  redirect_uri=CALLBACK_URL
上面 URL 中，client_id 参数和client_secret参数用来让授权服务器 确认 A 的身份（client_secret 参数是保密的，因此只能在后端发请求），grant_type参数的值是AUTHORIZATION_CODE，表示采用的授权方式是授权码，code 参数是上一步拿到的授权码，redirect_uri 参数是令牌颁发后的回调网址。


4、授权服务器：

收到请求以后，验证通过，就会颁发令牌。具体做法是向 redirect_uri 指定的网址，发送一段 JSON 数据。

 {    
   "access_token":"ACCESS_TOKEN",
   "token_type":"bearer",
   "expires_in":2592000,
   "refresh_token":"REFRESH_TOKEN",
   "scope":"read",
   "uid":100101,
   "info":{...}
 }
上面 JSON 数据中，access_token 字段就是令牌，A 网站在后端拿到了，然后返回给客户端即可。
