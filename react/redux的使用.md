[原文链接](https://juejin.cn/post/6844903722233888782)

将需要修改的state都存入到store里，发起一个action用来描述发生了什么，用reducers描述action如何改变state tree 。创建store的时候需要传入reducer，真正能改变store中数据的是store.dispatch API。

1. action

动作对象
包含两个属性  {type: '', data: ''}

type：标识属性，字符串，必须是唯一的，必要属性
data：数据，任意类型，可选

action 分为同步action 和 异步 action

同步action值是一个Object对象
异步action值是一个函数

2. reducer
reducer(state, action)
传两个参数：

第一个参数用于初始化状态
第二个参数用于加工状态

必须有返回值，加工之后的根据旧的state和action，返回新的state的纯函数。

3. store

将 state，action，reducer，联系在一起的对象。
store 的重要 API

store.getState() 获取状态
store.subscribe(() => {this.setState({})})  订阅更新状态

可以用它包裹整个ReactDOM.render() 方法
也可以将他放在 componentDidMount()中


store.dispatch({type: '', data: ''}) 触发更新状态的动作（action）

4. Provider

用于将 store 传递到全局组件
<Provider store={store}>
      <App />
 </Provider>,

5. connect
容器组件，用于用于包裹UI组件，并给UI组件传递props。
使用 connect(mapStateToProps, mapDispatchToProps)(countUI)

mapStateToProps：必须返回一个对象，对象的 key 作为传递给UI组件的props的key。通过key可以取出state。用于传递 redux 中保存的状态。
```
function mapStateToProps(state) { 
    return {key: state} 
}

mapDispatchToProps：返回一个对象，对象里是一个操作改变状态的函数方法


function mapDispatchToProps(dispatch) { 
    return {key: (data) => { dispatch(action(data))} } 
}
```
connect的简写方式
```
import {connect} from 'react-redux'
import {add_person, del_person_async} from '../../store/actions/person'

function PersonRedux (props) {
    ...
    {props.state}
    {props.addPerson}
}

export default connect(
  state => ({persons: state.personReducer}),
  {
    addPerson: add_person,
    delPerson: del_person_async
  }
)(PersonRedux)
```

# 完整使用redux的demo代码

## store.js

```
import {createStore, applyMiddleware, combineReducers} from 'redux'
import thunk from 'redux-thunk'
import personReducer from './reducers/person'

// 合并rudecer
const reducers = combineReducers({
  personReducer: personReducer
})

export default createStore(reducers, applyMiddleware(thunk))
```
## constant.js
```
export const ADD_PERSON = 'add_person'
export const DEL_PERSON = 'del_person'
```

## reducers (person.js)

```
import {ADD_PERSON, DEL_PERSON} from '../constant'

const initState = [{id: '001', name: '小明', age: 18}]
const personReducer = (preState=initState, action) => {
  const {type, data} = action
  switch (type) {
    case ADD_PERSON:
      return [data, ...preState]
    case DEL_PERSON :
      return preState.filter(sta => sta.name !== data)
    default:
      return preState
  }
}

export default personReducer
```

## actions (person.js)
```
import {ADD_PERSON, DEL_PERSON} from '../constant'

// 同步 action
export const add_person = data => ({type: ADD_PERSON, data})
export const del_person = data => ({type: DEL_PERSON, data})

// 异步 action
export const del_person_async = data => {
  return dispatch => {
    setTimeout(() => {
      dispatch(del_person(data))
    }, 500);
  }
}
```
## 使用共享状态
Provider 提供全局状态
```
import React from 'react';
import ReactDOM from 'react-dom';
import {Provider} from 'react-redux'
import App from './App';
import store from './store/store'


ReactDOM.render(
  <Provider store={store}>
     <App />
  </Provider>,
  document.getElementById('root')
);
```
## connect UI组件使用状态，将状态传递给UI组件的props
```
import{useRef} from 'react'
import {connect} from 'react-redux'
import {add_person, del_person_async} from '../../store/actions/person'

const PersonRedux = (props) => {
 const nameRef = useRef()
 const ageRef = useRef()

 const addPerson = () => {
   props.addPerson({id: Date.now().toString(), name: nameRef.current.value, age: ageRef.current.value})
 }

 const delPerson = () => {
   props.delPerson(nameRef.current.value)
 } 

 return (
   <>
     <h3>redux 中取出的 person 列表</h3>
     <input ref={nameRef} placeholder="姓名" />
     <input ref={ageRef} placeholder="年龄" />
     <button onClick={addPerson}>添加</button>
     <button onClick={delPerson}>删除</button>
     <ul>
       {
         props.persons.map(p => {
           return <li key={p.id}>{p.name}---{p.age}</li>
         })
       }
     </ul>
   </>
 )
}

export default connect(
 state => ({persons: state.personReducer}),
 {
   addPerson: add_person,
   delPerson: del_person_async
 }
)(PersonRedux)
```
