import {expect, test} from "vitest";
import {format, inspect} from "../src/index.js";
import * as values from "./values.js";

// Each snapshot contains the formatted value at several maximum lengths, one per
// line. A fresh value is inspected for each line since inspections are
// consumed by formatting.
const maxLengths = [Infinity, 80, 40, 20];

for (const [name, value] of Object.entries(values)) {
  test(`format ${name}`, async () => {
    const actual = maxLengths.map((m) => `${format(inspect(value()), m)}\n`).join("");
    await expect(actual).toMatchFileSnapshot(`./output/format/${name}.txt`);
  });
}
