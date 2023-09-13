# babel-plugin-custom-transform-imports

## 安装

```
$ yarn add babel-plugin-custom-transform-imports -D

or

$ npm install babel-plugin-custom-transform-imports -D
```

## 使用

`babel.config.js`:

```javascript
module.exports = {
  presets: ["@babel/preset-env"],
  plugins: [
    [
      "custom-transform-imports",
      {
        "react-bootstrap": {
          transform: (importName) =>
            importName ? `bootstrap/lib/${importName}` : "bootstrap",
        },
        lodash: {
          transform: "lodash-es",
        },
      },
    ],
  ],
};
```

转换前:

```javascript
import Bootstrap, { Row as MyRow, Col } from "react-bootstrap";
import * as bootstrap from "react-bootstrap";
import { pick } from "lodash";
```

转换后:

```javascript
import Bootstrap from "bootstrap";
import MyRow from "bootstrap/lib/Row";
import Col from "bootstrap/lib/Col";
import * as bootstrap from "bootstrap";
import pick from "lodash-es/pick";
```

## Webpack

作为一个插件与 babel-loader 一起使用

webpack.config.js:

```javascript
module: {
  rules: [
    {
      test: /\.[jt]sx?$/,
      exclude: /(node_modules)/,
      use: {
        loader: "babel-loader",
        options: {
          presets: ["@babel/preset-env"],
          plugins: [
            [
              require.resolve("babel-plugin-custom-transform-imports"),
              {
                "react-bootstrap": {
                  transform: (importName) =>
                    importName ? `bootstrap/lib/${importName}` : "bootstrap",
                },
                lodash: {
                  transform: "lodash-es",
                },
              },
            ],
          ],
        },
      },
    },
  ];
}
```

## 配置

| 字段名    | 类型                                     | 必填 | 默认值 | 描述                                                                                                                                                                                                 |
| --------- | ---------------------------------------- | ---- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| transform | string \| (importName: string) => string | 否   | 库名称 | 转换的库名称，而不是在 import 语句中指定的库名。importName 变量代表导入名称，importName 为空表示默认导入（import Bootstrap from "react-bootstrap"）或者全量导入（import \* as lodash from "lodash"） |
