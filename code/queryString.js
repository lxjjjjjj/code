

/**
 * 1. 解析 URL 中的 queryString，返回一个对象
 * 
 * @example
 * {
 *  name: 'coder',
 *  age: '20',
 *  callback: 'https://youzan.com?name=test',
 *  list: [a,b], 
 *  json: { str: 'abc', num: 123 },
 * } 
 */
 const { unescape } = require('node:querystring');
 const querystring = require('node:querystring');
 // escape编码 = & : / {} ""编码
 // 不会对 [] 编码
 const testURL = 'https://www.youzan.com?name=coder&age=20&callback=https%3A%2F%2Fyouzan.com%3Fname%3Dtest&list[]=a&list[]=b&json=%7B%22str%22%3A%22abc%22,%22num%22%3A123%7D&illegal=C%9E5%H__a100373__b4';

 function parseQueryString(url) {
    const params = url.split('?')[1]
    //  const decodeParams = querystring.decode(params) nodejs 直接变成对象返回即可
    const decodeParams = unescape(params)
    const splitParams = decodeParams.split('&')
    const obj = {}
    for(let i = 0; i < splitParams.length; i++) {
        const parmsObj = splitParams[i].split('=')
        const key = parmsObj[0]
        if (!obj[key]) {
           if (key.includes('[]')) {
              const index = key.indexOf('[]')
              const final_key = key.splice(index, key.length)
              obj[final_key] = [parmsObj[1]]
           } else {
              obj[key] = parmsObj[1]
           }
        } else {
            if(key.includes('[]')) {
                obj[key].push(parmsObj[1])
            } else {
                obj[key] = parmsObj[1]
            }
        }
    }
 }
 console.log(parseQueryString(testURL));

 // encodeURI 编码 
 const URI = 'name=coder&age=20&callback=https://youzan.com?name=test&list[]=a&list[]=b&json={"str":"abc","num":123}&illegal=C5%H__a100373__b4'
 console.log(encodeURI(URI))
 // 会对[] {} / "" 编码 
 // 不会对 ? , & : 编码
 // name=coder&age=20&callback=https://youzan.com?name=test&list%5B%5D=a&list%5B%5D=b&json=%7B%22str%22:%22abc%22,%22num%22:123%7D&illegal=C%C2%9E5%25H__a100373__b4
 
 // encodeURIComponent 编码

 const URI2 = 'name=coder&age=20&callback=https://youzan.com?name=test&list[]=a&list[]=b&json={"str":"abc","num":123}&illegal=C5%H__a100373__b4'
 console.log(encodeURIComponent(URI2))
 // 会对 = & : / , [] {} "" 编码 
 // name%3Dcoder%26age%3D20%26callback%3Dhttps%3A%2F%2Fyouzan.com%3Fname%3Dtest%26list%5B%5D%3Da%26list%5B%5D%3Db%26json%3D%7B%22str%22%3A%22abc%22%2C%22num%22%3A123%7D%26illegal%3DC%C2%9E5%25H__a100373__b4