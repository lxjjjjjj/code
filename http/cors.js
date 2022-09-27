// server1.js

const http =require('http')
const fs =require('fs')
http.createServer(function(request,response){
    console.log('request come',request.url)
    const html = fs.readFileSync('test.html','utf-8')
    response.writeHead(200,{
        'Content-Type':'text/html'
    })
    //text/plain 显示原文件内容
    response.end(html)
}).listen(8888)
console.log('server listening on 8888')

// server2
const http =require('http')
http.createServer(function(request,response){
    console.log('request come',request.url)
    response.writeHead(200,{
        'Access-Control-Allow-Origin':'*',
        'Access-Control-Allow-Headers':'X-Test-Cors',
        'Access-Control-Allow-Method':'POST PUT DELETE',
        'Access-Control-Max-Age':'1000'
    })
    response.end('123')
}).listen(8887)
console.log('server listening on 8887')

// html

// <!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <meta http-equiv="X-UA-Compatible" content="ie=edge">
//     <title>Document</title>
// </head>
// <body>
//     <div>123</div>
//     <div>456</div>
//     <script>
//         // var xhr=new XMLHttpRequest()
//         // xhr.open('GET','http://127.0.0.1:8887/')
//         // xhr.send()
//         fetch('http://localhost:8887/',{
//             method:'POST',
//             headers:{
//                 'X-Test-Cors':'123'
//             }
//         })
//     </script>
//     <!-- <script src='http://127.0.0.1:8887/'></script> -->
// </body>
// </html>