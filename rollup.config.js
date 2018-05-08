import node from "rollup-plugin-node-resolve";

export default {
  input: "src/index.js",
  plugins: [
    node()
  ],
  output: {
    extend: true,
    banner: `// @observablehq/notebook-inspector Copyright ${(new Date).getFullYear()} Observable, Inc.`,
    file: "dist/notebook-inspector.js",
    format: "umd",
    name: "Observable"
  }
};
