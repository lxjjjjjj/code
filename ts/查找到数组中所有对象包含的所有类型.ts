// npm install -g typescript
// tsc test.ts // 会在当前目录下生成对应的 test.js 文件
// node test.js
const users = [
    {
      name: "Max Mustermann",
      age: 25,
      occupation: "Chimney sweep",
    },
    {
      name: "Kate Müller",
      age: 23,
      occupation: "Astronaut"
    },
  ]
  type User = typeof users[number]

  const users2 = [
    {
      name: "Max Mustermann",
      age: 25,
      occupation: "Chimney sweep",
    },
    {
      name: "Kate Müller",
      age: 23,
      occupation: "Astronaut",
      aaaa: "aaaaa",
      bbbb: "aaaaa"
    },
  ]
  type User2 = typeof users2[number]
  // 查找出 users 的所有数字下标对应的值的类型集合。
  const aa:User2 = {
    name: "Kate Müller",
    age: 23,
    occupation: "Astronaut",
    bbbb: "aaaaa"
  }