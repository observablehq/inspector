import node from "rollup-plugin-node-resolve";
import uglify from "rollup-plugin-uglify";

const copyright = `// @observablehq/notebook-inspector Copyright ${(new Date).getFullYear()} Observable, Inc.`;

function config(output) {
  return {
    input: "src/index.js",
    plugins: [
      node(),
      uglify({output: {preamble: copyright}})
    ],
    output
  };
}

export default [
  config({
    format: "es",
    file: "dist/notebook-inspector.js"
  }),
  config({
    format: "umd",
    extend: true,
    name: "observablehq",
    file: "dist/notebook-inspector.umd.js"
  })
];
