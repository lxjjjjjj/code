### Cookie认证机制

```
1、用户向服务器发送用户名和密码。
2、服务器验证通过后，在当前对话（session）里面保存相关数据，比如用户角色、登录时间等等。
3、服务器向用户返回一个session_id，写入用户的Cookie。
4、用户随后的每一次请求，都会通过 Cookie，将 session_id 传回服务器。
5、服务器收到 session_id，找到前期保存的数据，由此得知用户的身份。
```
### Token认证机制

token认证流程

```
1. 客户端第一次发送请求（用户名和密码）
2. 登录成功后，服务器将登录凭证做数字签名，加密后得到 token 值返回给客户端
3. 客户端后续请求，将受到的 token 值放到数据包的 cookie 中，发送给服务器
4. 服务器提取客户端的 token值，做解密操作和签名认证后，拿到其中的登录凭证，判断其有效性

```

```
token认证机制出现的原因

- cookie认证需要后台存一份session_id到数据库，多服务器时需要session共享。Session是在服务器端的，而JWT token 是在客户端的。
- cookie有跨域限制，并且cookie存在默认存储和默认发送行为有安全性问题
- 但是token可以自己存储自己发送不存在跨域限制更加灵活。如果token是在授权头（Authorization header）中发送的，那么跨源资源共享(CORS)将不会成为问题，因为它不使用cookie。所以多用于单点登陆。
- 在安全性上也能做更多优化
- Cookie 由于存储的内存空间只有 4kb，因此存储的主要是一个用户 id，其他的用户信息都存储在服务器的 Session 中，而 Token 没有内存限制，用户信息可以存储 Token 中，返回给用户自行存储，因此可以看出，采用 Cookie 的话，由于所有用户都需要在服务器的 Session 中存储相对应的用户信息，所以如果用户量非常大，这对于服务器来说，将是非常大的性能压力，而Token 将用户信息返回给客户端各自存储，也就完全避开这个问题了


token认证则不需要后台保存，token一般放在HTTP请求头的Authorization中。
```
#### JWT认证

```
该token被设计为紧凑且安全的，特别适用于分布式站点的单点登录（SSO）场景。JWT的声明一般被用来在身份提供者和服务提供者间传递被认证的用户身份信息，以便于从资源服务器获取资源，也可以增加一些额外的其它业务逻辑所必须的声明信息，该token也可直接被用于认证，也可被加密。
```
**jwt认证的构成**

```
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
```

### node中使用jwt实现token认证

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
### OAuth 2.0 

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
