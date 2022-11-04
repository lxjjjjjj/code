# CAS认证流程
[认证流程图](https://mmbiz.qpic.cn/mmbiz_png/83d3vL8fIica3cwmfl6rcqWT3Nt0BNIBWiaoARgxqEVbk7EVicNpvT3cJ0gyeRxCbibKNEic5tIZRTG7wt66elFhEcw/640?wx_fmt=png&wxfrom=5&wx_lazy=1&wx_co=1)

[原文](https://mp.weixin.qq.com/s/OWcY6q-aQefCvT-a1yfD2Q)
[原文2](https://juejin.cn/post/6945277725066133534)

## CAS 生成的票据基本概念介绍
* TGT（Ticket Grangting Ticket） ：TGT 是 CAS 为用户签发的 登录票据，拥有了 TGT，用户就可以证明自己在 CAS 成功登录过。
* TGC：Ticket Granting Cookie： CAS Server 生成TGT放入自己的 Session 中，而 TGC 就是这个 Session 的唯一标识（SessionId），以 Cookie 形式放到浏览器端，是 CAS Server 用来明确用户身份的凭证。
* ST（Service Ticket） ：ST 是 CAS 为用户签发的访问某个 Service 的票据。
## 单点登录下的 CAS 认证步骤详解：

* 客户端： 开始访问系统 A；
* 系统 A： 发现用户未登录，重定向至 CAS 认证服务（sso.com），同时 URL 地址参数携带登录成功后回跳到系统 A 的页面链接(sso.com/login?redir…)
* CAS 认证服务： 发现请求 Cookie 中没有携带登录的票据凭证（TGC），所以 CAS 认证服务判定用户处于 未登录 状态，302重定向用户页面至 CAS 的登录界面，用户在 CAS 的登录页面上进行登录操作。
* 客户端： 输入用户名密码进行 CAS 系统认证；
* CAS 认证服务： 校验用户信息，并且 生成 TGC 放入自己的 Session 中，同时以 Set-Cookie 形式写入 Domain 为 sso.com 的域下 ；同时生成一个 授权令牌 ST (Service Ticket) ，然后重定向至系统 A 的地址，重定向的地址中包含生成的 ST（重定向地址：www.taobao.com?token=ST-345678）
系统 A： 拿着 ST 向 CAS 认证服务发送请求，CAS 认证服务验证票据 (ST) 的有效性。验证成功后，系统 A 知道用户已经在 CAS 登录了（其中的 ST 可以保存到 Cookie 或者本地中），系统 A 服务器使用该票据 (ST) 创建与用户的会话，称为局部会话，返回受保护资源；

* 客户端： 开始访问系统 B；
* 系统 B： 发现用户未登录，重定向至 SSO 认证服务，并将自己的地址作为参数传递，并附上在 sso.com 域下的 cookie 值是第五步生成的 TGC；
* CAS 认证服务： CAS 认证服务中心发现用户已登录，跳转回系统 B 的地址，并附上票据 (ST) ;
系统 B： 拿到票据 (ST)，去 CAS 认证服务验证票据 (ST) 的有效性。验证成功后，客户端也可以跟系统 B 交往了 ~