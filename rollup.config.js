import node from "@rollup/plugin-node-resolve";
import {terser} from "rollup-plugin-terser";
import meta from "./package.json" assert {type: "json"};

const copyright = `// @observablehq/inspector v${meta.version} Copyright ${(new Date).getFullYear()} Observable, Inc.`;

export default [
  {
    input: "src/index.js",
    plugins: [
      node(),
      terser({output: {preamble: copyright}})
    ],
    output: {
      format: "umd",
      extend: true,
      name: "observablehq",
      file: "dist/inspector.js"
    }
  }
];
