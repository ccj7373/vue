const data = {
  message: "Hello Vue!",
};

Object.defineProperty(data, "getterProp", {
  enumerable: true,
  configurable: true,
  get: () => {
    return {
      a: 1,
    };
  },
});

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
