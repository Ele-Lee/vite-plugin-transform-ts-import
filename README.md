# vite-plugin-transform-ts-import

The plugin just do one thing. It add a 'type' keyword in form of your ts interface declaration or type declaration;

It may solve the error like "`xxx does not provide an export named 'xxx'`" when vite running;

```
<!-- will be transformed like this -->
// import {YourType} from 'typesFile' // ← old
import type {TestType} from 'typesFile'; // ← after transformed


<!-- content in typesFile.ts -->
export type TestType = Array<{a: number}>
```

- help you upgrade or migrate ts project which used webpack
- does not want to add "type" keyword after `VSCode` quick import

> make sure that there is no file which suffix is 'd.ts' in your project. the plugin will not be effective.

### Install

```js
yarn add vite-plugin-transform-ts-import -D
```

or

```
npm i vite-plugin-transform-ts-import -D
```

### Usage

```js
import { defineConfig } from 'vite';
import viteTransformTS from 'vite-plugin-transform-ts-import';

export default defineConfig({
  plugins: [viteTransformTS()],
});
```

### Options

### **tsInDeps**

type: `{ [k: string]: Array<{path?: string;matching?: RegExp}>}`

default: `undefined`

developers need to input manually interface declaration or type declaration that from deps.

> The plugin traverse your project directory and storage ts record.But does not support to identify exported name from dependence.

for example：

```js
tsInDeps: {
  SelectProps: [
    {
      path: 'antd',
    },
  ],
  FormInstance: [
    {
      matching: /^antd/
    }
  ],
  }
})
``` 

### **exclude**
type: `string[]`

default: []

Sometimes, `vitejs` still show error when running, because of some deps. You can try this way.

```js
exclude: ['monaco-editor', 'commonjsHelpers']
```

### **plugins**
type: `ParserPlugin[]`
> the babel plugin (`import { ParserPlugin } from "@babel/parser"`)
default: []

supplement babel plugins to parse your code.

```js
// parse ts code
import parser from '@babel/parser';
const ast = parser.parse(codeStr, {
  sourceType: 'module',
  // default setting -> ['typescript', 'jsx', 'classProperties']
  plugins: ['typescript', 'jsx', 'classProperties'].concat(plugins),
});
```