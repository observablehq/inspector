/* eslint-env jest */
const { Inspector } = require("../dist/notebook-inspector.umd.js");

describe("Inspector", () => {
  let inspector, elem;
  beforeEach(() => {
    elem = document.createElement("div");
    inspector = new Inspector(elem);
  });

  test("initial state", () => {
    expect(elem).toMatchSnapshot();
  });

  test(".pending()", () => {
    inspector.pending();
    expect(elem).toMatchSnapshot();
  });

  test(".fulfilled(element)", () => { const span = document.createElement("span");
    span.textContent = "Surprise!";
    inspector.fulfilled(span);
    expect(elem).toMatchSnapshot();
  });

  test(".fulfilled(value)", () => {
    inspector.fulfilled([1, 2, 3]);
    expect(elem).toMatchSnapshot();
    elem.querySelector("a").dispatchEvent(new MouseEvent("mouseup"));
    expect(elem).toMatchSnapshot();
  });

  test(".rejected(Error)", () => {
    inspector.rejected(new Error("Danger!"));
    expect(elem).toMatchSnapshot();
  });
});

describe("into", () => {
  test("into('invalid id')", () => {
    expect(() => {
      Inspector.into("unknown-id");
    }).toThrow();
  });

  test("into(div)", () => {
    const container = document.createElement("div");
    const inspector = Inspector.into(container)();
    inspector.fulfilled(42);
    expect(container).toMatchSnapshot();
  });
});
