/* eslint-disable no-sparse-arrays */
import * as flechette from "@uwdata/flechette";
import {tableFromArrays} from "apache-arrow";
import {Inspector} from "../src/index.js";

function inspectFulfilled(value: unknown, name?: string) {
  const div = document.createElement("div");
  const inspector = new Inspector(div);
  inspector.fulfilled(value, name);
  return div;
}

function inspectRejected(value: unknown, name?: string) {
  const div = document.createElement("div");
  const inspector = new Inspector(div);
  inspector.rejected(value, name);
  return div;
}

function click(element: Element | null) {
  if (!element) throw new Error("element not found");
  element.dispatchEvent(new Event("mouseup"));
}

function open(div: HTMLElement) {
  click(div.querySelector("a"));
  return div;
}

function lines(n: number) {
  return Array.from({length: n}, (_, i) => `hi ${i}`).join("\n");
}

class A {
  b() {}
}

Object.assign(A.prototype, {hi: "hi"});

export function fulfilledArray() {
  return inspectFulfilled([1, 2, 3]);
}

export function fulfilledArrayOpen() {
  return open(inspectFulfilled([1, 2, 3]));
}

export function fulfilledArrayOpenClose() {
  return open(open(inspectFulfilled([1, 2, 3])));
}

export function fulfilledArrayOpenUpdate() {
  const div = open(inspectFulfilled([1, 2, 3]));
  new Inspector(div).fulfilled([4, 5, 6]); // stays expanded
  return div;
}

export function fulfilledArrayNested() {
  return inspectFulfilled([1, 2, 3, [2, 3]]);
}


export function fulfilledArrayNestedOpen() {
  return open(inspectFulfilled([1, 2, 3, [2, 3]]));
}

export function fulfilledArrayNestedOpenNested() {
  const div = open(inspectFulfilled([1, 2, 3, [2, 3]]));
  click(div.querySelector(".observablehq--field .observablehq--collapsed"));
  return div;
}

export function fulfilledArrayNamed() {
  return inspectFulfilled([1, 2, 3], "b");
}

export function fulfilledArrayNamedOpen() {
  return open(inspectFulfilled([1, 2, 3], "b"));
}

export function fulfilledArrayOfString() {
  return inspectFulfilled(["A short string"]);
}

export function fulfilledArraySparse() {
  return inspectFulfilled([1, , , 4, , 6]);
}

export function fulfilledArraySparseOpen() {
  return open(inspectFulfilled([1, , , 4, , 6]));
}

export function fulfilledArrayWithProperties() {
  return inspectFulfilled(Object.assign([1, 2], {foo: "bar", "foo bar": 42}));
}

export function fulfilledArray100() {
  return inspectFulfilled(Array.from({length: 100}, (_, i) => i));
}

export function fulfilledArray100Open() {
  return open(inspectFulfilled(Array.from({length: 100}, (_, i) => i)));
}

export function fulfilledArray100OpenMore() {
  const div = open(inspectFulfilled(Array.from({length: 100}, (_, i) => i)));
  click(div.querySelector("a.observablehq--field"));
  return div;
}

export function fulfilledArray30OpenMore() {
  const div = open(inspectFulfilled(Array.from({length: 30}, (_, i) => i)));
  click(div.querySelector("a.observablehq--field")); // removes “more”
  return div;
}

export function fulfilledUint8Array() {
  return inspectFulfilled(new Uint8Array([1, 2, 3]));
}

export function fulfilledUint16Array() {
  return inspectFulfilled(new Uint16Array([1, 2, 3]));
}

export function fulfilledObject() {
  return inspectFulfilled({a: 2, [Symbol("hi")]: 3});
}

export function fulfilledObjectOpen() {
  return open(inspectFulfilled({a: 2, [Symbol("hi")]: 3}));
}

export function fulfilledObjectNamed() {
  return inspectFulfilled({a: 2}, "q");
}

export function fulfilledObjectString() {
  return inspectFulfilled({objProp: "A short string"});
}

export function fulfilledObjectString1000Lines() {
  return inspectFulfilled({obProp: lines(1000)});
}

export function fulfilledObjectString1000LinesOpen() {
  return open(inspectFulfilled({obProp: lines(1000)}));
}

export function fulfilledObjectForbidden() {
  return inspectFulfilled(
    Object.defineProperty({}, "foo", {
      enumerable: true,
      get() {
        throw new Error("forbidden");
      }
    })
  );
}

function element() {
  const div = document.createElement("div");
  const b = document.createElement("b");
  b.textContent = "world";
  div.className = "foo";
  div.append("hello, ", b, document.createComment("comment"));
  return div;
}

export function fulfilledObjectElement() {
  return inspectFulfilled({div: element()});
}

export function fulfilledObjectElementOpen() {
  const root = open(inspectFulfilled({div: element()}));
  click(root.querySelector(".observablehq--field .observablehq--collapsed"));
  return root;
}

export function fulfilledClass() {
  return inspectFulfilled(A);
}

export function fulfilledClassInstance() {
  return inspectFulfilled(new A());
}

export function fulfilledClassInstanceOpen() {
  return open(inspectFulfilled(new A()));
}

export function fulfilledFunction() {
  return inspectFulfilled(function a() {});
}

export function fulfilledFunctionNamed() {
  return inspectFulfilled(function a() {}, "a");
}

export function fulfilledFunctionArrow() {
  return inspectFulfilled((a: unknown) => a);
}

export function fulfilledFunctionArrowArgs() {
  return inspectFulfilled((a: number, b: number) => a + b);
}

export function fulfilledFunctionDestructuring() {
  return inspectFulfilled(({a}: {a: unknown}) => a);
}

export function fulfilledFunctionGenerator() {
  return inspectFulfilled(function* a() {});
}

export function fulfilledFunctionAsync() {
  return inspectFulfilled(async function a() {});
}

export function fulfilledFunctionAsyncGenerator() {
  return inspectFulfilled(async function* a() {});
}

export function fulfilledBoolean() {
  return inspectFulfilled(true);
}

export function fulfilledNull() {
  return inspectFulfilled(null);
}

export function fulfilledUndefined() {
  return inspectFulfilled(undefined);
}

export function fulfilledBigInt() {
  return inspectFulfilled(100n);
}

export function fulfilledSymbol() {
  return inspectFulfilled(Symbol("foo"));
}

export function fulfilledRegExp() {
  return inspectFulfilled(/baz/g);
}

export function fulfilledDate() {
  return inspectFulfilled(new Date(Date.UTC(2020, 0, 1)));
}

export function fulfilledError() {
  const error = new Error("Danger!");
  error.stack = "Error: Danger!\n    at test (inspectors.js:1:1)"; // stable across machines
  return inspectFulfilled(error);
}

export function fulfilledElement() {
  const span = document.createElement("span");
  span.textContent = "Surprise!";
  return inspectFulfilled(span);
}

export function fulfilledDocumentFragment() {
  const fragment = document.createDocumentFragment();
  fragment.append(document.createElement("span"), "text");
  return inspectFulfilled(fragment);
}

export function fulfilledNumber() {
  return inspectFulfilled(42);
}

export function fulfilledNegativeZero() {
  return inspectFulfilled(-0);
}

export function fulfilledString() {
  return inspectFulfilled("hi");
}

export function fulfilledStringNamed() {
  return inspectFulfilled("A short string", "myString");
}

export function fulfilledString1000Lines() {
  return inspectFulfilled(lines(1000));
}

export function fulfilledString10Lines() {
  return inspectFulfilled(Array.from({length: 10}, () => "hi").join("\n"));
}

export function fulfilledString21Lines() {
  return inspectFulfilled(Array.from({length: 21}, () => "hi").join("\n"));
}

export function fulfilledString30Lines() {
  return inspectFulfilled(Array.from({length: 30}, () => "hi").join("\n"));
}

export function fulfilledString30LinesOpen() {
  const div = inspectFulfilled(Array.from({length: 30}, () => "hi").join("\n"));
  click(div.querySelector(".observablehq--string-expand"));
  return div;
}

export function fulfilledMap() {
  return inspectFulfilled(new Map([["foo", 1], ["bar", 2]])); // prettier-ignore
}

export function fulfilledMapOpen() {
  return open(inspectFulfilled(new Map([["foo", {a: 1}], ["bar", [2]]]))); // prettier-ignore
}

export function fulfilledMapProto() {
  class SubMap extends Map {}
  return inspectFulfilled(Object.getPrototypeOf(new SubMap()));
}

export function fulfilledMapSymbolKey() {
  return inspectFulfilled(new Map<unknown, unknown>([[1, 2], [Symbol("yeah"), "yeah"]])); // prettier-ignore
}

export function fulfilledMapSymbolKeyOpen() {
  return open(inspectFulfilled(new Map<unknown, unknown>([[1, 2], [Symbol("yeah"), "yeah"]]))); // prettier-ignore
}

export function fulfilledSet() {
  return inspectFulfilled(new Set(["foo", "bar"]));
}

export function fulfilledSetOpen() {
  return open(inspectFulfilled(new Set(["foo", "bar"])));
}

export function fulfilledSetProto() {
  class SubSet extends Set {}
  return inspectFulfilled(Object.getPrototypeOf(new SubSet()));
}

export function fulfilledArrowTable() {
  return inspectFulfilled(tableFromArrays({a: [1, 2, 3], b: ["x", "y", "z"]}));
}

export function fulfilledArrowTableOpen() {
  return open(inspectFulfilled(tableFromArrays({a: [1, 2, 3], b: ["x", "y", "z"]})));
}

function flechetteTableUnsafeInt64() {
  return flechette.tableFromArrays(
    {id: [1n, 1870084251657671040n, null], x: [0.5, 1.5, 2.5]},
    {types: {id: flechette.int64(), x: flechette.float64()}}
  );
}

export function fulfilledFlechetteTableUnsafeInt64() {
  return inspectFulfilled(flechetteTableUnsafeInt64());
}

export function fulfilledFlechetteTableUnsafeInt64Open() {
  return open(inspectFulfilled(flechetteTableUnsafeInt64()));
}

export function pending() {
  const div = document.createElement("div");
  const inspector = new Inspector(div);
  inspector.pending();
  return div;
}

export function rejectedError() {
  return inspectRejected(new Error("Danger!"));
}

export function rejectedErrorNamed() {
  return inspectRejected(new Error("Danger!"), "myErrorCell");
}

export function rejectedString() {
  return inspectRejected("Danger!");
}
