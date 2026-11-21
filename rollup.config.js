import node from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import meta from "./package.json" with {type: "json"};

const copyright = `// @observablehq/inspector v${meta.version} Copyright ${(new Date).getFullYear()} Observable, Inc.`;

export default [
  {
    input: "build/index.js", // compiled by tsc
    plugins: [
      node(),
      terser({format: {preamble: copyright}})
    ],
    output: {
      format: "es",
      file: "dist/inspector.js"
    }
  }
];
