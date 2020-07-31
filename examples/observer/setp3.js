// 比如目前的代码仅仅能够实现对字段 a 的观测，如果添加一个字段 b 呢？
const data = {
  a: 1,
  b: 2,
};

// 使用一个循环将定义访问器属性的代码包裹起来
for (const key in data) {
  // dep 数组就是我们所谓的“筐”
  const dep = [];

  let val = data[key]; // 缓存字段原有的值

  Object.defineProperty(data, key, {
    set(newVal) {
      // 如果值没有变什么都不做
      if (newVal === val) return;
      // 使用新值替换旧值
      val = newVal;
      // 当属性被设置的时候，将“筐”里的依赖都执行一次
      dep.forEach((fn) => fn());
      console.log(`设置了属性${key}`);
    },
    get() {
      // 当属性被获取的时候，把依赖放到“筐”里
      dep.push(Target);
      console.log(`读取了属性${key}`);
      return val; // 将该值返回
    },
  });
}

// Target 是全局变量
let Target = null;
function $watch(exp, fn) {
  // 将 Target 的值设置为 fn
  Target = fn;
  // 读取字段值，触发 get 函数
  data[exp];
}

$watch("a", () => {
  console.log("第一个依赖");
});

$watch("a", () => {
  console.log("第二个依赖");
});

$watch("b", () => {
  console.log("第三个依赖");
});

data.a = 12345;
data.b = 999999;
console.log("data.a", data.a);
console.log("data.b", data.b);
