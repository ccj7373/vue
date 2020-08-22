/*
 * not type checking this file because flow doesn't play well with
 * dynamically accessing methods on Array prototype
 */

import { def } from '../util/index'

const arrayProto = Array.prototype // 缓存 Array.prototyp
export const arrayMethods = Object.create(arrayProto) // 实现 arrayMethods.__proto__ === Array.prototype

// 要拦截的数组变异方法
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

/**
 * Intercept mutating methods and emit events
 */
methodsToPatch.forEach(function (method) {
  // cache original method
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator (...args) {
    const result = original.apply(this, args)

    // Observer 中
    // def(value, '__ob__', this)
    // 无论是否为数组都会创建__ob__对象
    const ob = this.__ob__

    // 判断被拦截的数组操作是否新增
    let inserted
    switch (method) {
      case 'push': // 数组尾部新增
      case 'unshift': // 数组头部新增
        inserted = args
        break
      case 'splice':
         // splice() 方法向/从数组中添加/删除项目，然后返回被删除的项目。
         // 语法 arrayObject.splice(index,howmany,item1,.....,itemX)
         // 因此只要splice第三个参数有值则说明是新增的
        inserted = args.slice(2)
        break
    }
    // 对新增元素重新绑定观察者
    if (inserted) ob.observeArray(inserted)
    // notify change
    // 通知是收集的依赖
    ob.dep.notify()
    return result
  })
})
