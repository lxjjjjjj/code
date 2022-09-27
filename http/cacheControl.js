const http =require('http')
const fs =require('fs')
http.createServer(function(request,response){
    console.log('request come',request.url)
    if(request.url==='/'){
        const html = fs.readFileSync('test.html','utf-8')
        response.writeHead(200,{
            'Content-Type':'text/html'
        })
        //text/plain 显示原文件内容
        response.end(html)
    }
    if(request.url==='/script.js'){
        response.writeHead(200,{
            'Content-Type':'text/javascript',
            'Catch-Control':'max-age=200,public,...'
        })
        //text/plain 显示原文件内容
        response.end('console.log("script loaded twice")')
    }
}).listen(8888)
console.log('server listening on 8888')