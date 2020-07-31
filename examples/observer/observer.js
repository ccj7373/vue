// 当数据 data 是嵌套的对象时，我们的程序只能检测到第一层对象的属性
// 使用递归定义
const data = {
  a: {
    b: 1,
  },
};

function walk(data) {
  // 使用一个循环将定义访问器属性的代码包裹起来

  for (const key in data) {
    // dep 数组就是我们所谓的“筐”
    const dep = [];
    let val = data[key]; // 缓存字段原有的值

    // 如果 val 是对象，递归调用 walk 函数将其转为访问器属性
    const nativeString = Object.prototype.toString.call(val);
    if (nativeString === "[object Object]") {
      walk(val);
    }

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
}
walk(data);

// Target 是全局变量
let Target = null;
function $watch (exp, fn) {
  Target = fn
  let pathArr,
      obj = data
  // 检查 exp 中是否包含 .
  if (/\./.test(exp)) {
    // 将字符串转为数组，例：'a.b' => ['a', 'b']
    pathArr = exp.split('.')
    // 使用循环读取到 data.a.b
    pathArr.forEach(p => {
      obj = obj[p]
    })
    return
  }
  data[exp]
}

$watch("a.b", () => {
  console.log("第一个依赖");
});

data.a.b = 12345;
console.log("data.a.b", data.a.b);
