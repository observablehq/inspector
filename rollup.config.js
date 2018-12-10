import node from "rollup-plugin-node-resolve";
import {terser} from "rollup-plugin-terser";

const copyright = `// @observablehq/inspector Copyright ${(new Date).getFullYear()} Observable, Inc.`;

function config(output) {
  return {
    input: "src/index.js",
    plugins: [
      node(),
      terser({output: {preamble: copyright}})
    ],
    output
  };
}

export default [
  config({
    format: "es",
    file: "dist/inspector.js"
  }),
  config({
    format: "umd",
    extend: true,
    name: "observablehq",
    file: "dist/inspector.umd.js"
  })
];
