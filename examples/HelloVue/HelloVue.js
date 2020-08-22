const data = {
  message: "Hello Vue!",
  arr: [
    { a: 1 }
  ]
};

// Object.defineProperty(data, "getterProp", {
//   enumerable: true,
//   configurable: true,
//   get: () => {
//     return {
//       a: 1,
//     };
//   },
// });

var app = new Vue({
  el: "#app",
  render: function (createElement) {
    return createElement(
      "div",
      {
        attrs: {
          id: "app",
        },
        on: {
          click: this.clickHandler,
        },
      },
      this.message
    );
  },
  data,
  methods: {
    clickHandler() {
      this.getterProp = { c: 3, b: 5 };

      console.log(this.getterProp);

      this.$watch("getterProp.c", () => {
        console.log("getterProp.c");
      });
    },
  },
});

// 要拦截的数组变异方法
const mutationMethods = [
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
];

const arrayMethods = Object.create(Array.prototype); // 实现 arrayMethods.__proto__ === Array.prototype
const arrayProto = Array.prototype; // 缓存 Array.prototype

// mutationMethods.forEach(method => {
//   arrayMethods[method] = function (...args) {
//     const result = arrayProto[method].apply(this, args)

//     console.log(`执行了代理原型的 ${method} 函数`)

//     return result
//   }
// })

mutationMethods.forEach((method) => {
  // cache original method
  const original = arrayProto[method];
  Object.defineProperty(arrayMethods, method, {
    enumerable: false,
    writable: true,
    configurable: true,
    value: function (...args) {
      const result = original.apply(this, args);

      console.log(`执行了代理原型的 ${method} 函数`);

      return result;
    },
  });
});

const arr = [];
arr.__proto__ = arrayMethods;

arr.push(1);
// 兼容邏輯
const arr2 = [];
const arrayKeys = Object.getOwnPropertyNames(arrayMethods);

// 這種方法是可以枚举
arrayKeys.forEach((method) => {
  arr2[method] = arrayMethods[method];
});

arr2.push(1);

const arr3 = [];

// 更好的方法
arrayKeys.forEach((method) => {
  Object.defineProperty(arr3, method, {
    enumerable: false,
    writable: true,
    configurable: true,
    value: arrayMethods[method],
  });
});

arr3.push(1);

{
  [
    { a: 1, __ob__ /* 我们将该 __ob__ 称为 ob2 */ },
    __ob__ /* 我们将该 __ob__ 称为 ob1 */,
  ];
  __ob__
}
