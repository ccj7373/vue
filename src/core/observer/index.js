/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 * 
 * 在组件的计算期间,某些情况下,我们可能需要禁用观察,
 * 
 */
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}

/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value

    // 定义一个收集依赖的“筐”。这个“筐”并不属于某一个字段，这个框是属于某一个对象或数组的。
    this.dep = new Dep()
    this.vmCount = 0 // 初始化计数器

    // def 函数定义 __ob__ 属性,使之不可枚举(防止遍历)
    // def 函数处理之后，data 对象应该变成如下这个样子
    // const data = {
    //   a: 1,
    //   // __ob__ 是不可枚举的属性
    //   __ob__: {
    //     value: data, // value 属性指向 data 数据对象本身，这是一个循环引用
    //     dep: dep实例对象, // new Dep()
    //     vmCount: 0
    //   }
    // }    
    def(value, '__ob__', this)

    // 判断data是否为数组
    if (Array.isArray(value)) {
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   * value的类型为Object时才被调用bianl3
   * 遍历所有属性,设置getter/setters(调用了 defineReactive 函数)
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * Attempt to create an observer instance for a value,
 * returns the new observer if successfully observed,
 * or the existing observer if the value already has one.
 * 
 * 尝试为观测的数据(value)创建观察者(observer)实例(instance)
 * 如果已绑定了观察者(observer),则使用现有的
 * 否则返回新的观察者(observer)
 * 
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {

  // 观测的数据(value)不是一个对象或者是 VNode 实例则,return
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void

  // 观测的数据(value)是否已绑定了观察者(observer)
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    // 使用现有的
    ob = value.__ob__
  } else if (
    shouldObserve && // 检测开关
    !isServerRendering() && // 当不是服务端渲染的时候才会观测数据
    (Array.isArray(value) || isPlainObject(value)) && // 只有当数据对象是数组或纯对象的时候，才有必要对其进行观测
    Object.isExtensible(value) && // 被观测的数据对象必须是可扩展的.Object.preventExtensions()、Object.freeze() 以及 Object.seal() 使对象变得不可扩展
    !value._isVue
  ) {
    // 创建一个 Observer 实例
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 * 定义一个有响应的属性
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {

  // “筐” 每一个数据字段都通过闭包引用着属于自己的 dep 常量
  const dep = new Dep()

  // 获取属性描述对象，并将该对象保存在 property 常量中
  const property = Object.getOwnPropertyDescriptor(obj, key)

  // 如果存在属性描述,并且不可配置则return
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  // 缓存之前定义的getter/setters
  // defineProperty 会覆盖原有的getter/setters,因此要先缓存,从而做到不影响属性的原有读写操作。
  const getter = property && property.get
  const setter = property && property.set


  // 当只传递两个参数时，说明没有传递第三个参数 val
  if ((!getter || setter) && arguments.length === 2) {
    // 根据 key 主动去对象上获取相应的值
    val = obj[key]
  }

  // val 本身有可能也是一个对象,递归继续调用 observe(val)深度观测
  // shallow 为真时才会继续调用 observe 函数,shallow默认undefined,也就是默认深度观察
  // Vue 实例对象上定义 $attrs 属性和 $listeners 属性时就是非深度观
  // defineReactive(vm, '$attrs', parentData && parentData.attrs || emptyObject, null, true) // 最后一个参数 shallow 为 true
  // defineReactive(vm, '$listeners', options._parentListeners || emptyObject, null, true)
  let childOb = !shallow && observe(val)


  // const data = {
  //   a: {
  //     b: 1
  //   }
  // }
  // 该数据对象经过观测处理之后，将被添加 __ob__ 属性，如下：
  // const data = {
  //   a: {
  //     b: 1,
  //     __ob__: {value, dep, vmCount}
  //   },
  //   __ob__: {value, dep, vmCount}
  // }

  // a的dep=


  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {

      // getter 存在那么直接调用该函数，并以该函数的返回值作为属性的值
      const value = getter ? getter.call(obj) : val

      // Dep.target 中保存的值就是要被收集的依赖(观察者)
      if (Dep.target) {
        // 收集依赖
        dep.depend()
        if (childOb) {
          // 收集子对象依赖
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      childOb = !shallow && observe(newVal)
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 * 
 * 设置一个对象(object)的属性(property)
 * 当属性(property)不存在,新增属性(property)及手动的触发依赖通知
 */
export function set (target: Array<any> | Object, key: any, val: any): any {

  // 非空及基本类型(string,number,symbol,boolean)校验
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {Primitive(
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  
  // 校验target是否为数组及key是否为有效的索引
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    // 索引(key)大于素组长度时,扩张数组
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }

  // key属于target对象并且不是Object的原型对象(__proto__ ,constructor等)
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }

  // 获取target的__ob__(observer)
  const ob = (target: any).__ob__

  // 校验target是否是vue实例及root $data
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  // 如果target已经绑定了__ob__(observer)则直接返回
  if (!ob) {
    target[key] = val
    return val
  }

  // 把新添加的属性变成响应式对象
  defineReactive(ob.value, key, val)

  // 手动的触发依赖通知
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
