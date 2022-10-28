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


# Token认证机制

```
1.客户端使用用户名跟密码请求登录
2.服务端收到请求，去验证用户名与密码
3.验证成功后，服务端会签发一个 token 并把这个 token 发送给客户端
4.客户端收到 token 以后，会把它存储起来，比如放在 cookie 里或者 localStorage 里
5.客户端每次向服务端请求资源的时候需要带着服务端签发的 token
6.服务端收到请求，然后去验证客户端请求里面带着的 token ，如果验证成功，就向客户端返回请求的数据
```
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

JSON Web Token（简称 JWT）是目前最流行的跨域认证解决方案。是一种认证授权机制。
JWT 是为了在网络应用环境间传递声明而执行的一种基于 JSON 的开放标准（RFC 7519）。JWT 的声明一般被用来在身份提供者和服务提供者间传递被认证的用户身份信息，以便于从资源服务器获取资源。比如用在用户登录上。可以使用 HMAC 算法或者是 RSA 的公/私秘钥对 JWT 进行签名。因为数字签名的存在，这些传递的信息是可信的。

**jwt认证的构成**

Header header典型的由两部分组成：token的类型（“JWT”）和算法名称（比如：HMAC SHA256或者RSA等等）。
{
    'alg': "HS256",
    'typ': "JWT"
}

标准声明：这里有一组预定义的声明，它们不是强制的，但是推荐。
iss（jwt 签发者）、sub（jwt 所面向的用户）、aud（接收 jwt 的一方）、exp（jwt 过期时间，必须大于签发时间）nbf（定于在什么时间之前，该 jwt 不可用）、iat（jwt 的签发时间）、jti（jwt 唯一身份表示，主要用来作为一次性 token，从而回避重放攻击）

公有声明：可以 添加任何信息，一般添加用户相关信息或者其他业务需要的必要信息，不建议加敏感信息，因为在客户端可解密

私有声明：提供者和消费者共同定义的声明，一般不建议存放敏感信息，这意味着可归类于敏文信息。用于在同意使用它们的各方之间共享信息，并且不是注册的或公开的声明。

签证（signature）

header（base64 后的）
payload（base64 后的）
secret 秘钥（盐）
注意：secret是保存在服务器端的，jwt的签发生成也是在服务器端的，secret就是用来进行jwt的签发和jwt的验证，所以，它就是你服务端的私钥，在任何场景都不应该流露出去。一旦客户端得知这个secret, 那就意味着客户端是可以自我签发jwt了。

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

```
是一个行业的标准授权协议。OAuth 2.0 专注于简化客户端开发人员，同时为 Web 应用程序，桌面应用程序，手机和客厅设备提供特定的授权流程。
它的最终目的是为第三方应用颁发一个有时效性的令牌 token。使得第三方应用能够通过该令牌获取相关的资源。常见的场景就是：第三方登录。当你想要登录某个论坛，但没有账号，而这个论坛接入了如 QQ、Facebook 等登录功能，在你使用 QQ 登录的过程中就使用的 OAuth 2.0 协议。

A 网站让用户跳转到 GitHub。
GitHub 要求用户登录，然后询问"A 网站要求获得 xx 权限，你是否同意？"
用户同意，GitHub 就会重定向回 A 网站，同时发回一个授权码。
A 网站使用授权码，向 GitHub 请求令牌。
GitHub 返回令牌.
A 网站使用令牌，向 GitHub 请求用户数据。
```
