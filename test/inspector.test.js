/* eslint-env jest */
const { Inspector } = require("../dist/inspector.js");
const Immutable = require("immutable");

describe("Inspector", () => {
  let inspector, elem;
  beforeEach(() => {
    elem = document.createElement("div");
    inspector = new Inspector(elem);
    window.getSelection = () => {
      return {
        type: "Caret",
        removeAllRanges: () => {},
        containsNode: () => false
      };
    };
  });

  test("initial state", () => {
    expect(elem).toMatchSnapshot();
  });

  test(".pending()", () => {
    inspector.pending();
    expect(elem).toMatchSnapshot();
  });

  test(".fulfilled(element)", () => {
    const span = document.createElement("span");
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

  test("formats a string with template syntax if it has multiple newlines", () => {
    const container = document.createElement("div");
    const inspector = Inspector.into(container)();
    inspector.fulfilled(Array.from({ length: 10 }, () => "hi").join("\n"));
    expect(container).toMatchSnapshot();
  });

  test("formats a string with JSON syntax if it doesn’t have many newlines", () => {
    const container = document.createElement("div");
    const inspector = Inspector.into(container)();
    inspector.fulfilled(Array.from({ length: 10 }, () => "hi").join(" "));
    expect(container).toMatchSnapshot();
  });

  test("truncates a string with > 20 newlines", () => {
    const container = document.createElement("div");
    const inspector = Inspector.into(container)();
    inspector.fulfilled(
      Array.from({ length: 30 }, () => "hi").join("\n"),
      "myString"
    );
    expect(container).toMatchSnapshot();
    container
      .querySelector(".observablehq--string-expand")
      .dispatchEvent(new MouseEvent("mouseup"));
    expect(container).toMatchSnapshot();
  });

  test("truncates a string with > 20 newlines", () => {
    const container = document.createElement("div");
    const inspector = Inspector.into(container)();
    inspector.fulfilled(
      Array.from({ length: 21 }, () => "hi").join("\n"),
      "myString"
    );
    expect(container).toMatchSnapshot();
  });
});

describe("immutable", () => {
  let inspector, elem;
  beforeEach(() => {
    elem = document.createElement("div");
    inspector = new Inspector(elem);
    window.getSelection = () => {
      return {
        type: "Caret",
        removeAllRanges: () => {},
        containsNode: () => false
      };
    };
  });
  test("Immutable.Set", () => {
    inspector.fulfilled(Immutable.Set([1, 2, 3]));
    expect(elem).toMatchSnapshot();
    elem.querySelector("a").dispatchEvent(new MouseEvent("mouseup"));
    expect(elem).toMatchSnapshot();
  });
  test("Immutable.Map", () => {
    inspector.fulfilled(Immutable.Map([[1, 2]]));
    expect(elem).toMatchSnapshot();
    elem.querySelector("a").dispatchEvent(new MouseEvent("mouseup"));
    expect(elem).toMatchSnapshot();
  });
  test("Immutable.List", () => {
    inspector.fulfilled(Immutable.List([1, 2]));
    expect(elem).toMatchSnapshot();
    elem.querySelector("a").dispatchEvent(new MouseEvent("mouseup"));
    expect(elem).toMatchSnapshot();
  });
  test("Immutable.Record", () => {
    inspector.fulfilled(Immutable.Record({ a: 1 })({ a: 21 }));
    expect(elem).toMatchSnapshot();
    elem.querySelector("a").dispatchEvent(new MouseEvent("mouseup"));
    expect(elem).toMatchSnapshot();
  });
});
