# 优化API

API 优化到底指的是什么
```
优化包含了改善 API 的响应时间。响应时间越短，API 的速度越快。

1.缩短响应时间
2.降低延迟管理错误和吞吐量
3.并且最大限度地减少 CPU 和内存的使用

```
## 始终使用异步函数

优化 CPU 使用率的最佳方法就是编写异步函数来执行非阻塞 I/O 操作

```
I/O 操作包括对数据的读和写。它可以在数据库、云存储或者任何本地磁盘上进行。
在大量使用 I/O 操作的应用使用异步函数可以提高效率。因为由于没有阻塞I/O，当一个请求在做输入/输出操作的时候，CPU 可以同时处理多个请求。

var fs = require('fs');
// 执行阻塞I/O
var file = fs.readFileSync('/etc/passwd');
console.log(file);
// 执行非阻塞I/O
fs.readFile('/etc/passwd', function(err, file) {
    if (err) return err;
    console.log(file);
});

使用 Node 包 fs 来处理文件
readFileSync() 是同步函数，会在执行完成前阻塞线程
readFile() 是异步函数，会立刻返回并在后台运行
```
## 避免在 API 中使用 session 和 cookie，仅在 API 响应中发送数据

```
当我们使用 cookie 或者 session 来存储临时状态的时候，会占用非常多的服务器内存。
现在通用无状态 API，并且也有 JWT、OAuth 等验证机制。验证令牌保存在客户端以便服务器管理状态。
JWT 是基于 JSON 的用于 API 验证的安全令牌。JWT 可以被看到，但一旦发送就无法修改。JWT 只是一个序列并没有加密。OAuth 不是 API 或服务——相反，它是授权的开放标准。OAuth 是一组用于获取令牌的标准步骤。
同时，也不要把时间浪费在使用 Node.js 来服务静态文件。这方面 NGINX 和 Apache 做得更好。
使用 Node 搭建 API 的时候，不要在响应中发送完整的 HTML 页面。当仅有数据通过 API 发送的时候，Node 服务得会更好。大部分 Node 应用都使用 JSON 数据。
```
## 优化数据库查询---慢查询优化---索引查询
索引是一种优化数据库性能的方法，通过最小化处理查询时所需的磁盘访问次数来实现。它是一种数据结构技术，用于快速定位和访问数据库中的数据。索引是使用几个数据库列创建的。

举例一个慢查询例子

```
select
   count(*) 
from
   task 
where
   status=2 
   and operator_id=20839 
   and operate_time>1371169729 
   and operate_time<1371174603 
   and type=2;
   
```
我们知道索引能够提高查询效率，但应该如何建立索引？索引的顺序如何？许多人却只知道大概

### MySQL索引原理

[美团技术团队mysql索引查询的优化](https://tech.meituan.com/2014/06/30/mysql-index.html)
[华为云索引是什么](https://bbs.huaweicloud.com/blogs/303909)

将多个数据建立分组，像字典一样找mysql就先找到m开头的然后再找m下面y开头的。每次查找数据时把磁盘IO次数控制在一个很小的数量级，最好是常数数量级一个高度可控的多路搜索树b+树

#### 建索引的几大原则
```

1.最左前缀匹配原则，非常重要的原则，mysql会一直向右匹配直到遇到范围查询(>、<、between、like)就停止匹配，比如a = 1 and b = 2 and c > 3 and d = 4 如果建立(a,b,c,d)顺序的索引，d是用不到索引的，如果建立(a,b,d,c)的索引则都可以用到，a,b,d的顺序可以任意调整。

2.=和in可以乱序，比如a = 1 and b = 2 and c = 3 建立(a,b,c)索引可以任意顺序，mysql的查询优化器会帮你优化成索引可以识别的形式。

3.尽量选择区分度高的列作为索引，区分度的公式是count(distinct col)/count(*)，表示字段不重复的比例，比例越大我们扫描的记录数越少，唯一键的区分度是1，而一些状态、性别字段可能在大数据面前区分度就是0，那可能有人会问，这个比例有什么经验值吗？使用场景不同，这个值也很难确定，一般需要join的字段我们都要求是0.1以上，即平均1条扫描10条记录。

4.索引列不能参与计算，保持列“干净”，比如from_unixtime(create_time) = ’2014-05-29’就不能使用到索引，原因很简单，b+树中存的都是数据表中的字段值，但进行检索时，需要把所有元素都应用函数才能比较，显然成本太大。所以语句应该写成create_time = unix_timestamp(’2014-05-29’)。

5.尽量的扩展索引，不要新建索引。比如表中已经有a的索引，现在要加(a,b)的索引，那么只需要修改原来的索引即可。
```
#### 慢查询例子

**案例一**
```
select
   count(*) 
from
   task 
where
   status=2 
   and operator_id=20839 
   and operate_time>1371169729 
   and operate_time<1371174603 
   and type=2;
```
改成

```
那么索引建立成(status,type,operator_id,operate_time)就是非常正确的，因为可以覆盖到所有情况。这个就是利用了索引的最左匹配的原则

select
   count(*) 
from
   task 
where
   status=2 
   and type=2
   and operator_id=20839 
   and operate_time>1371169729 
   and operate_time<1371174603;
```

#### 查询优化神器 - explain命令
explain命令

#### 慢查询优化的基本步骤

```
0.先运行看看是否真的很慢，注意设置SQL_NO_CACHE

1.where条件单表查，锁定最小返回记录表。这句话的意思是把查询语句的where都应用到表中返回的记录数最小的表开始查起，单表每个字段分别查询，看哪个字段的区分度最高

2.explain查看执行计划，是否与1预期一致（从锁定记录较少的表开始查询）

3.order by limit 形式的sql语句让排序的表优先查

4.了解业务方使用场景

5.加索引时参照建索引的几大原则

6.观察结果，不符合预期继续从0分析
```
## 使用PM2集群模式优化API

[Node的Cluster模块和PM2 的原理介绍](https://juejin.cn/post/6983596738451882014)


```
PM2 是为 Node.js 应用程序设计的生产流程管理器。它内置了负载平衡器，允许应用程序在不修改代码的情况下，作为多个进程运行。
使用 PM2 时的应用停机时间几乎为零。总体来说，PM2 确实可以提升 API 性能和并发性。
在生产环境中部署代码并运行以下命令以查看 PM2 集群如何在所有可用 CPU 上进行扩展：pm2 start  app.js -i 0

```


## 减少 TTFB（第一字节时间）

```
第一字节时间是一种测量方式，用作表示 Web 服务器或者其他网络资源的响应时间。TTFB 测量从用户或客户发出 HTTP 请求到客户的浏览器收到页面的第一个字节的时间。
所有用户访问浏览器的同一页面加载速度不可能在 100 毫秒之内，这仅仅是因为服务器和用户之间的物理距离。
我们可以通过使用 CDN 和全球本地数据中心缓存内容来减少第一个字节的时间。这有助于用户以最小的延迟访问内容。你可以从 Cloudflare 提供的 CDN 解决方案开始着手。
```
## 使用带日志的错误脚本

```
监视 API 是否正常工作最好的办法是记录行为，于是记录日志就派上用场。
一个常见的办法是将记录打印在控制台上（使用console.log()）。
比console.log()更高效的方法是使用 Morgan、Buyan 和 Winston。我将在这里以 Winston 为例。

如何使用 Winston 记录 – 功能

支持 4 个可以自由选择的日志等级，如：info、error、verbose、debug、silly 和 warn
支持查询日志
简单的分析
可以使用相同的类型进行多个 transports 输出
捕获并记录 uncaughtException
可以使用以下命令行设置 Winston：
npm install winston --save
这里是使用 Winston 记录的基本配置：
const winston = require('winston');

let logger = new winston.Logger({
  transports: [
    new winston.transports.File({
      level: 'verbose',
      timestamp: new Date(),
      filename: 'filelog-verbose.log',
      json: false,
    }),
    new winston.transports.File({
      level: 'error',
      timestamp: new Date(),
      filename: 'filelog-error.log',
      json: false,
    })
  ]
});

logger.stream = {
  write: function(message, encoding) {
    logger.info(message);
  }
};

```
## 使用 HTTP/2 而不是 HTTP

```
除了上述使用的这些技巧，我们还可以使用 HTTP/2 而不是 HTTP，因为它具备以下优势：
多路复用
头部压缩
服务器推送
二进制格式
它专注提高性能，并解决 HTTP 的问题。它使网页浏览更快、更容易，并且消耗更少的带宽。
```
## 并行任务

使用 async.js 来运行任务。并行任务对 API 的性能有很大改善，它减少了延迟并最大限度地减少了阻塞操作。
并行意味着同时运行多个任务。当你并行任务的时候，不需要控制程序的执行顺序。

```
const async = require("async");
// 使用对象而不是数组
async.parallel({
  task1: function(callback) {
    setTimeout(function() {
      console.log('Task One');
      callback(null, 1);
    }, 200);
  },
  task2: function(callback) {
    setTimeout(function() {
      console.log('Task Two');
      callback(null, 2);
    }, 100);
    }
}, function(err, results) {
  console.log(results);
  // 结果相当于: {task2: 2, task1: 1}
});
```
## 使用 Redis 缓存应用

使用redis 0.621ms 不使用redis 900ms

不使用redis

```
'use strict';

//定义需要的所有依赖项
const express = require('express');
const responseTime = require('response-time')
const axios = require('axios');

//加载 Express 框架
var app = express();

//创建在响应头中添加 X-Response-Time 的中间件
app.use(responseTime());

const getBook = (req, res) => {
  let isbn = req.query.isbn;
  let url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
  axios.get(url)
    .then(response => {
      let book = response.data.items
      res.send(book);
    })
    .catch(err => {
      res.send('The book you are looking for is not found !!!');
    });
};

app.get('/book', getBook);

app.listen(3000, function() {
  console.log('Your node is running on port 3000 !!!')
});
```
使用redis

```
'use strict';

//定义需要的所有依赖项
const express = require('express');
const responseTime = require('response-time')
const axios = require('axios');
const redis = require('redis');
const client = redis.createClient();

//加载 Express 框架
var app = express();

//创建在响应头中添加 X-Response-Time 的中间件
app.use(responseTime());

const getBook = (req, res) => {
  let isbn = req.query.isbn;
  let url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`;
  return axios.get(url)
    .then(response => {
      let book = response.data.items;
      //设置string-key:缓存中的 isbn。以及缓存的内容: title
      // 设置缓存的过期时间为 1 个小时（60分钟）
      client.setex(isbn, 3600, JSON.stringify(book));

      res.send(book);
    })
    .catch(err => {
      res.send('The book you are looking for is not found !!!');
    });
};

const getCache = (req, res) => {
  let isbn = req.query.isbn;
  //对照服务器的 redis 检查缓存数据
  client.get(isbn, (err, result) => {
    if (result) {
      res.send(result);
    } else {
      getBook(req, res);
    }
  });
}
app.get('/book', getCache);

app.listen(3000, function() {
  console.log('Your node is running on port 3000 !!!')
)};
```
**redis的应用场景**

```
1.热点数据 高频读、低频写
2.计数器
3.消息队列
4.排行榜
5.社交网络和实时系统
```
**redis的数据类型以及主要特性**

```
String类型
哈希类型
列表类型
集合类型
顺序集合类型
```
