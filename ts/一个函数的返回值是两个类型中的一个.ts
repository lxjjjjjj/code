function filterPersons(
    persons: Person[],
    personType: string,
    criteria: unknown,
  ): unknown[] {}
  
  let usersOfAge23: User[] = filterPersons(persons, "user", { age: 23 })
  let adminsOfAge23: Admin[] = filterPersons(persons, "admin", { age: 23 })
//   本题返回值类型即可以是 User,也可以是Admin，并且很明显这个结果是由第二个参数是 'user' 还是 'admin' 所决定。

// 利用函数重载的功能，可以轻松实现，针对每种不同的 personType 参数类型，我们给出不同的返回值类型：

function filterPersons(
    persons: Person[],
    personType: "admin",
    criteria: Partial<Person>,
  ): Admin[]
  function filterPersons(
    persons: Person[],
    personType: "user",
    criteria: Partial<Person>,
  ): User[]
  function filterPersons(
    persons: Person[],
    personType: string,
    criteria: Partial<Person>,
  ) {}
  
  let usersOfAge23: User[] = filterPersons(persons, "user", { age: 23 })
  let adminsOfAge23: Admin[] = filterPersons(persons, "admin", { age: 23 })