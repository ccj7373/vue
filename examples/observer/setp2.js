const data = {
  a: 1,
};


// 使用场景data.a 肯能被添加很多监控
// 以vue为例, 属性可以被watch
// watch:{
//   a(val, oldVal){//普通的watch监听
//       console.log("a: "+val, oldVal);
//   },
// }
// 可以能在被赋值时动态渲染
// 能不能在获取属性 a 的时候收集依赖，然后在设置属性 a 的时候触发之前收集的依赖呢？
// 我们起码需要一个”筐“，然后将所有收集到的依赖通通放到这个”筐”里，当属性被设置的时候将“筐”里所有的依赖都拿出来执行就可以了


// dep 数组就是我们所谓的“筐”
const dep = [];
Object.defineProperty(data, "a", {
  set() {
    // 当属性被设置的时候，将“筐”里的依赖都执行一次
    dep.forEach((fn) => fn());
    console.log("设置了属性 a");
  },
  get() {
    // 当属性被获取的时候，把依赖放到“筐”里
    dep.push(Target);
    console.log("读取了属性 a");
  },
});


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

data.a=2;

console.log('data.a',data.a);