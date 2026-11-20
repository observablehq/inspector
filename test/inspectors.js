import {Inspector} from "@observablehq/inspector";
import Immutable from "immutable";

function inspectFulfilled(value, name) {
  const div = document.createElement("div");
  const inspector = new Inspector(div);
  inspector.fulfilled(value, name);
  return div;
}

function inspectRejected(value, name) {
  const div = document.createElement("div");
  const inspector = new Inspector(div);
  inspector.rejected(value, name);
  return div;
}

function open(div) {
  div.querySelector("a").dispatchEvent(new Event("mouseup"));
  return div;
}

function lines(n) {
  return Array.from({length: n}, (_, i) => `hi ${i}`).join("\n");
}

class A { b() {} }
A.prototype.hi = "hi";

export function fulfilledArray() {
  return inspectFulfilled([1, 2, 3]);
}

export function fulfilledArrayOpen() {
  const div = inspectFulfilled([1, 2, 3]);
  div.querySelector("a").dispatchEvent(new Event("mouseup"));
  return div;
}

export function fulfilledArrayNested() {
  return inspectFulfilled([1, 2, 3, [2, 3]]);
}

export function fulfilledArrayNestedOpen() {
  return open(inspectFulfilled([1, 2, 3, [2, 3]]));
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
  return inspectFulfilled(a => a);
}

export function fulfilledFunctionArrowArgs() {
  return inspectFulfilled((a, b) => a + b);
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

export function fulfilledUndefined() {
  return inspectFulfilled(undefined);
}

export function fulfilledBigInt() {
  return inspectFulfilled(100n);
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

export function fulfilledIntoMultiple() {
  const div = document.createElement("div");
  const createInspector = Inspector.into(div);
  createInspector().fulfilled(1);
  createInspector().fulfilled(2);
  createInspector().fulfilled(3);
  return div;
}

export function fulfilledElement() {
  const span = document.createElement("span");
  span.textContent = "Surprise!";
  return inspectFulfilled(span);
}

export function fulfilledNumber() {
  return inspectFulfilled(42);
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
  div.querySelector(".observablehq--string-expand").dispatchEvent(new Event("mouseup"));
  return div;
}

export function fulfilledMap() {
  return inspectFulfilled(new Map([["foo", 1], ["bar", 2]]));
}

export function fulfilledMapProto() {
  class SubMap extends Map {}
  return inspectFulfilled(Object.getPrototypeOf(new SubMap()));
}

export function fulfilledMapSymbolKey() {
  return inspectFulfilled(new Map([[1, 2], [Symbol("yeah"), "yeah"]]));
}

export function fulfilledMapSymbolKeyOpen() {
  return open(inspectFulfilled(new Map([[1, 2], [Symbol("yeah"), "yeah"]])));
}

export function fulfilledSet() {
  return inspectFulfilled(new Set(["foo", "bar"]));
}

export function fulfilledSetProto() {
  class SubSet extends Set {}
  return inspectFulfilled(Object.getPrototypeOf(new SubSet()));
}

export function fulfilledImmutableMap() {
  return inspectFulfilled(Immutable.Map([["foo", 1], ["bar", 2]]));
}

export function fulfilledImmutableMapOpen() {
  const div = inspectFulfilled(Immutable.Map([["foo", 1], ["bar", 2]]));
  div.querySelector("a").dispatchEvent(new Event("mouseup"));
  return div;
}

export function fulfilledImmutableMapListKey() {
  return inspectFulfilled(Immutable.Map([[Immutable.List([1, 2, 3]), 2], [2, 3], [3, 4]]));
}

export function fulfilledImmutableMapListKeyOpen() {
  return open(inspectFulfilled(Immutable.Map([[Immutable.List([1, 2, 3]), 2], [2, 3], [3, 4]])));
}

export function fulfilledImmutableOrderedMap() {
  return inspectFulfilled(Immutable.OrderedMap([[1, 2], [2, 3], [3, 4]]));
}

export function fulfilledImmutableSet() {
  return inspectFulfilled(Immutable.Set([1, 2, 3]));
}

export function fulfilledImmutableSetOpen() {
  const div = inspectFulfilled(Immutable.Set([1, 2, 3]));
  div.querySelector("a").dispatchEvent(new Event("mouseup"));
  return div;
}

export function fulfilledImmutableSet100() {
  return inspectFulfilled(Immutable.Set(Array.from({length: 100}, (_, i) => i)));
}

export function fulfilledImmutableSet100Open() {
  return open(inspectFulfilled(Immutable.Set(Array.from({length: 100}, (_, i) => i))));
}

export function fulfilledImmutableOrderedSet() {
  return inspectFulfilled(Immutable.OrderedSet([1, 2, 3]));
}

export function fulfilledImmutableStack() {
  return inspectFulfilled(Immutable.Stack([1, 2, 3]));
}

export function fulfilledImmutableList() {
  return inspectFulfilled(Immutable.List([1, 2, 3]));
}

export function fulfilledImmutableListOpen() {
  const div = inspectFulfilled(Immutable.List([1, 2, 3]));
  div.querySelector("a").dispatchEvent(new Event("mouseup"));
  return div;
}

export function fulfilledImmutableListNested() {
  return inspectFulfilled(Immutable.List([1, Immutable.List([1, 2, 3]), 3]));
}

export function fulfilledImmutableListNestedOpen() {
  return open(inspectFulfilled(Immutable.List([1, Immutable.List([1, 2, 3]), 3])));
}

export function fulfilledImmutableRecordUnknownKey() {
  return inspectFulfilled(Immutable.Record({a: 1})({b: 2}));
}

export function fulfilledImmutableRecord() {
  return inspectFulfilled(Immutable.Record({a: 1})({a: 21}));
}

export function fulfilledImmutableRecordOpen() {
  const div = inspectFulfilled(Immutable.Record({a: 1})({a: 21}));
  div.querySelector("a").dispatchEvent(new Event("mouseup"));
  return div;
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
