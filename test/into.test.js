import {Inspector} from "@observablehq/inspector";
import {expect, test} from "vitest";

test(`Inspector.into(selector) throws an error if no element is found`, () => {
  expect(() => Inspector.into("unknown-id")).toThrow(/container not found/);
});
