# HTTP Strict Transport Security

[原文链接](https://juejin.cn/post/6844903952211771405)
想当年没有HTTPS的是时候，我们在浏览器输入一个域名，请求服务器内容，正常情况下可以进行数据的返回。但是如果在浏览器和服务器之间出现劫持者，也就是中间人劫持或者中间人攻击，我们的数据就会被劫持篡改。自从有了HTTPS，感觉放心不少，但是有了HTTPS我们的请求难道就高枕无忧了吗？

[劫持图片链接](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/9/24/16d63eda4deadde8~tplv-t2oaga2asx-zoom-in-crop-mark:4536:0:0:0.image)

在我们平时访问网页时。我们一般不会在地址栏输入 www.fenqile.com而是习惯性输入 fenqile.com，此时浏览器走的是 http，请求到达服务器之后，服务器告诉浏览器 302 跳转。然后浏览器重新请求，通过 HTTPS 方式，443 端口通讯。

[实际访问过程](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/9/25/16d6402bc1a3761e~tplv-t2oaga2asx-zoom-in-crop-mark:4536:0:0:0.image)

而正因为用户不是直接输入 // 链接，劫持者利用这一点：也可以进行一个劫持的操作 首先劫持用户的 80 端口，当用户向目标页发起请求时，劫持者模拟正常的 https 请求向源服务器获取数据，然后通过 80 端口返回给用户。

[劫持后的访问过程](https://p1-jj.byteimg.com/tos-cn-i-t2oaga2asx/gold-user-assets/2019/9/25/16d640c0684526cd~tplv-t2oaga2asx-zoom-in-crop-mark:4536:0:0:0.image)

这种劫持出现在两种情况下：

用户没有通过准确的方式访问页面，除非输入 // ，否则浏览器默认以 http 方式访问。
HTTPS 页面的链接中包含 http，这个 http 页面可能被劫持。

## 启用HSTS
HTTP Strict Transport Security (通常简称为HSTS) 是一个安全功能，它告诉浏览器只能通过HTTPS访问当前资源, 禁止HTTP方式。

### 原理

在服务器响应头中添加 Strict-Transport-Security，可以设置 max-age。用户访问时，服务器种下这个头。下次如果使用 http 访问，只要 max-age 未过期，客户端会进行内部跳转，可以看到 307 Redirect Internel 的响应码。变成 https 访问源服务器

### HSTS的优点

启用 HSTS 不仅仅可以有效防范中间人攻击。为浏览器节省来一次 302/301 的跳转请求，收益还是很高的。我们的很多页面，难以避免地出现 http 的链接，比如 help 中的链接、运营填写的链接等，这些链接的请求都会经历一次 302，对于用户也是一样，收藏夹中的链接保存的可能也是 http 的。

### HSTS的缺点
HSTS这个过程有效避免了中间人对 80 端口的劫持。但是这里存在一个问题：如果用户在劫持状态，并且没有访问过源服务器，那么源服务器是没有办法给客户端种下 Strict-Transport-Security 响应头的（都被中间人挡下来了）。

### HSTS 存在的坑

* IP 的请求，HSTS 无法处理，例如http://1.1.1.1 响应头中设置了STS，浏览器也不会理会。

* HSTS 只能在 80 和 443 端口之间切换，如果服务是 8080 端口，即便设置了 STS，也无效。

* 如果浏览器证书错误，一般情况会提醒存在安全风险，然是依然给一个链接进入目标页，而 HSTS 则没有目标页入口，所以一旦证书配置错误，就是很大的故障了

* 如果服务器的 HTTPS 没有配置好就开启了 STS 的响应头，并且还设置了很长的过期时间，那么在你服务器 HTTPS 配置好之前，用户都是没办法连接到你的服务器的，除非 max-age 过期了。


