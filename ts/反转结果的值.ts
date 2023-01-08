// https://juejin.cn/post/6844904183003349005
function swap(v1, v2) {
    return [v2, v1]
  }
  
  function test1() {
    const [secondUser, firstAdmin] = swap(admins[0], users[1])
    logUser(secondUser)
    logAdmin(firstAdmin)
  }
  
  function test2() {
    const [secondAdmin, firstUser] = swap(users[0], admins[1])
    logAdmin(secondAdmin)
    logUser(firstUser)
  }

//   本题的关键点是 swap 这个方法，它即可以接受Admin类型为参数，也可以接受 User 类型为参数，并且还需要根据传入参数的顺序把它们倒过来放在数组中放回。
// 也就是说传入的是 v1: User, v2: Admin，需要返回 [Admin, User] 类型。
// 这题就比较有难度了，首先需要用到泛型 来推断出参数类型，并且和结果关联起来：
function swap<T, K>(v1: T, v2: K) {
  return [v2, v1]
}
function swap<Admin, User>(v1: Admin, v2: User): readonly [User, Admin]