

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
 // escape编码 = & : / {} "" []编码
 // 不会对 ASCII字母 数字 @*/+ 编码
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

 // 对url编码最常用的encodeURI和encodeURIComponent
 // encodeURI方法不会对下列字符编码  ASCII字母  数字  ~!@#$&*()=:/,;?+'
 // encodeURIComponent方法不会对下列字符编码 ASCII字母  数字  ~!*()'
 // 所以encodeURIComponent比encodeURI编码的范围更大。
 // 实际例子来说，encodeURIComponent会把 http://  编码成  http%3A%2F%2F 而encodeURI却不会。

 // 如果只是编码字符串，不和URL有半毛钱关系，那么用escape。
 // 如果你需要编码整个URL，然后需要使用这个URL，那么用encodeURI。比如encodeURI("http://www.cnblogs.com/season-huang/some other thing");
 // 编码后会变为"http://www.cnblogs.com/season-huang/some%20other%20thing";
 // 其中，空格被编码成了%20。但是如果你用了encodeURIComponent，
 // 那么结果变为"http%3A%2F%2Fwww.cnblogs.com%2Fseason-huang%2Fsome%20other%20thing"
 // 看到了区别吗，连 "/" 都被编码了，整个URL已经没法用了。

 // 当你需要编码URL中的参数的时候，那么encodeURIComponent是最好方法。
 // var param = "http://www.cnblogs.com/season-huang/"; //param为参数
 // param = encodeURIComponent(param);
 // var url = "http://www.cnblogs.com?next=" + param;
 // console.log(url) //"http://www.cnblogs.com?next=http%3A%2F%2Fwww.cnblogs.com%2Fseason-huang%2F"
 // 看到了把，参数中的 "/" 可以编码，如果用encodeURI肯定要出问题，因为后面的/是需要编码的。


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

 // escape 编码
 // escape是对字符串(string)进行编码(而另外两种是对URL)，作用是让它们在所有电脑上可读。
 // 编码之后的效果是%XX或者%uXXXX这种形式。其中 ASCII字母  数字  @*/+   这几个字符不会被编码，
 // 其余的都会。最关键的是，当你需要对URL编码时，请忘记这个方法，这个方法是针对字符串使用的，不适用于URL。
 const a = 'name=coder&age=20&callback=https://youzan.com?name=test&list[]=a&list[]=b&json={"str":"abc","num":123}&illegal=C�5%H__a100373__b4'; 
 console.log(escape(a));
 // name%3Dcoder%26age%3D20%26callback%3Dhttps%3A//youzan.com%3Fname%3Dtest%26list%5B%5D%3Da%26list%5B%5D%3Db%26json%3D%7B%22str%22%3A%22abc%22%2C%22num%22%3A123%7D%26illegal%3DC%9E5%25H__a100373__b4