const data = {
  a: 1,
};

Object.defineProperty(data, "a", {
  set() {
    console.log("设置了属性 a");
  },
  get() {
    console.log("读取了属性 a");
  },
});

//比如如何避免收集重复的依赖，如何深度观测，如何处理数组以及其他边界条件等等。简单在于如果不考虑那么多边界条件的话，要实现这样一个功能还是很容易的
