

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

 const testURL = 'https://www.youzan.com?name=coder&age=20&callback=https%3A%2F%2Fyouzan.com%3Fname%3Dtest&list[]=a&list[]=b&json=%7B%22str%22%3A%22abc%22,%22num%22%3A123%7D&illegal=C%9E5%H__a100373__b4';

 function parseQueryString(url) {
     const params = url.split('?')[1]
     const parseParams = params.split('&')
     const res = {}
     for (let i = 0; i < parseParams.length; i++) {
         const parseObj = parseParams[i].split('=')
         const parsedValue = parseObj[1]
         if (res[parseObj[0]]) {
             res[parseObj[0]] = parsedValue
         } else if (typeof res[parseObj[0]] === 'string') {
             const orginal = res[parseObj[0]]
             res[parseObj[0]] = [orginal]
             res[parseObj[0]].push(parsedValue)
         } else if (Array.isArray(res[parseObj[0]])) {
             res[parseObj[0]].concat([parsedValue])
         }
     }
     return res
 }
 console.log(parseQueryString(testURL));
 
 