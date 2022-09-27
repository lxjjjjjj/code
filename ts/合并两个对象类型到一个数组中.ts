// 我们在数据库中只有 User 类型，后来引入了 Admin 类型。把这两个类型组合成 Person 类型以修复错误。
interface UserOne {
    name: string
    age: number
    occupation: string
  }
  
  interface Admin {
    name: string
    age: number
    role: string
  }
  type Person = UserOne | Admin
  const persons: Person[] /* <- Person[] */ = [
    {
      name: "Jane Doe",
      age: 32,
      role: "Administrator",
    },
    {
      name: "Kate Müller",
      age: 23,
      occupation: "Astronaut",
    }
  ]
  
  // 根据上题中定义出的 Person 类型，现在需要一个方法打印出它的实例

  function logPerson(person: Person) {
    let additionalInformation: string
    if (person.role) {
      // ❌ 报错 Person 类型中不一定有 role 属性
      additionalInformation = person.role
    } else {
      // ❌ 报错 Person 类型中不一定有 occupation 属性
      additionalInformation = person.occupation
    }
  }
  // 本题考查 TypeScript 中的「类型保护」
  function logPerson2(person: Person) {
    let additionalInformation: string
    if ("role" in person) {
      additionalInformation = person.role
    } else {
      additionalInformation = person.occupation
    }
  }
  function isUser(user: Person): user is UserOne {
    return user.hasOwnProperty("role")
  }
  function filterUsers(persons: Person[], criteria: User): User[] {
    return persons.filter(isUser).filter((user) => {
      let criteriaKeys = Object.keys(criteria) as (keyof User)[]
      return criteriaKeys.every((fieldName) => {
        return user[fieldName] === criteria[fieldName]
      })
    })
  }
  
  filterUsers(
    persons,
    // ❌ 报错，criteria 定义的是精确的 User 类型，少字段了。
    {
      age: 23,
    },
  ).forEach(logPerson)

  // 可以看出，由于 filterUsers 的第二个筛选参数的类型被精确的定义为 User，所以只传入它的一部分字段 age 就会报错

  type Criteria = {
    [K in keyof User]?: User[K]
  }
  
  function filterUsersTwo(persons: Person[], criteria: Criteria): User[] {
    return persons.filter(isUser).filter((user) => {
      let criteriaKeys = Object.keys(criteria) as (keyof User)[]
      return criteriaKeys.every((fieldName) => {
        return user[fieldName] === criteria[fieldName]
      })
    })
  }

  filterUsersTwo(
    persons,
    // 不会报错，criteria 定义的是 Criteria 类型
    {
      age: 23,
    },
  ).forEach(logPerson)

  function filterUsersThree(persons: Person[], criteria: Partial<User>): User[] {
    return persons.filter(isUser).filter((user) => {
      let criteriaKeys = Object.keys(criteria) as (keyof User)[]
      return criteriaKeys.every((fieldName) => {
        return user[fieldName] === criteria[fieldName]
      })
    })
  }

  filterUsersThree(
    persons,
    // 不会报错，criteria 定义的是 Criteria 类型
    {
      age: 23,
    },
  ).forEach(logPerson)