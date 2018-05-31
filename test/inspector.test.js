/* eslint-env jest */
var Inspector = require("../dist/notebook-inspector.umd.js").Inspector;

describe("basic inspector", () => {
  let inspector;
  beforeEach(() => {
    const elem = document.createElement("div");
    inspector = new Inspector(elem);
  });

  test("initial state", () => {
    expect(inspector).toMatchSnapshot();
  });

  test("pending state", () => {
    inspector.pending();
    expect(inspector).toMatchSnapshot();
  });

  test("fulfilled with an element", () => {
    const span = document.createElement("span");
    span.textContent = "Surprise!";
    inspector.fulfilled(span);
    expect(inspector).toMatchSnapshot();
  });

  test("fulfilled with a complex vlaue", () => {
    inspector.fulfilled([1, 2, 3]);
    expect(inspector).toMatchSnapshot();
  });

  test("rejected state", () => {
    inspector.rejected(new Error("Danger!"));
    expect(inspector).toMatchSnapshot();
  });
});
