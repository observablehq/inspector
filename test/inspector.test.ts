import {expect, test} from "vitest";
import * as inspectors from "./inspectors.js";

for (const [name, inspector] of Object.entries(inspectors)) {
  test(`inspector ${name}`, async () => {
    const root = inspector();
    const actual = `<link rel=stylesheet href="../../src/style.css">\n${root.outerHTML}`;
    await expect(actual).toMatchFileSnapshot(`./output/${name}.html`);
  });
}
