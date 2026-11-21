// @vitest-environment jsdom

/* eslint-disable no-sparse-arrays */
import * as Arrow from "apache-arrow";
import {html} from "htl";
import {assert, test} from "vitest";
import type {Inspection} from "../src/inspect.js";
import {inspect} from "../src/inspect.js";

class FooError extends Error {
  name = "FooError";
}

type ElementType<T> = T extends Iterable<infer E> ? E : never;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ExcludeProperty<U, K extends PropertyKey> = U extends any ? K extends keyof U ? never : U : never; // prettier-ignore
type ChildlessInspection = ExcludeProperty<Inspection, "children">;

type ChildrenInspection =
  | ChildlessInspection
  | (Omit<Inspection & {type: "object"}, "children"> & {
      children: readonly (
        | readonly [type: "property", key: string, value: ChildrenInspection]
        | readonly [type: "symbol", key: symbol, value: ChildrenInspection]
      )[];
      truncated?: true;
    })
  | (Omit<Inspection & {type: "array"}, "children"> & {
      children: readonly (
        | readonly [type: "entry", value: ChildrenInspection]
        | readonly [type: "empty", length: number]
        | readonly [type: "property", key: string, value: ChildrenInspection]
        | readonly [type: "symbol", key: symbol, value: ChildrenInspection]
      )[];
      truncated?: true;
    })
  | (Omit<Inspection & {type: "map"}, "children"> & {
      children: readonly (
        | readonly [type: "entry", key: ChildrenInspection, value: ChildrenInspection]
        | readonly [type: "property", key: string, value: ChildrenInspection]
        | readonly [type: "symbol", key: symbol, value: ChildrenInspection]
      )[];
      truncated?: true;
    })
  | (Omit<Inspection & {type: "set"}, "children"> & {
      children: readonly (
        | readonly [type: "entry", value: ChildrenInspection]
        | readonly [type: "property", key: string, value: ChildrenInspection]
        | readonly [type: "symbol", key: symbol, value: ChildrenInspection]
      )[];
      truncated?: true;
    })
  | (Omit<Inspection & {type: "#node"}, "children"> & {
      children: readonly ChildrenInspection[];
      truncated?: true;
    })
  | (Omit<Inspection & {type: "#element"}, "children" | "attributes"> & {
      attributes: readonly (Inspection & {type: "#attribute"})[];
      children: readonly ChildrenInspection[];
      truncated?: true;
    })
  | (Omit<Inspection & {type: "#document"}, "children"> & {
      children: readonly ChildrenInspection[];
      truncated?: true;
    })
  | (Omit<Inspection & {type: "#document-fragment"}, "children"> & {
      children: readonly ChildrenInspection[];
      truncated?: true;
    })
  | (Omit<Inspection & {type: "arrow-table"}, "children" | "schema"> & {
      schema: ChildrenInspection;
      children: (
        | readonly [type: "entry", value: ChildrenInspection]
        | readonly [type: "property", key: string, value: ChildrenInspection]
        | readonly [type: "symbol", key: symbol, value: ChildrenInspection]
      )[];
      truncated?: true;
    });

type ChildInspection = ElementType<Exclude<Inspection, ChildlessInspection>["children"]> | (Inspection & {type: "#attribute"}); // prettier-ignore
type ChildChildrenInspection = ElementType<Exclude<ChildrenInspection, ChildlessInspection>["children"]>; // prettier-ignore

function inspectChildren(object: unknown, maxLength = 20): ChildrenInspection {
  return withChildren(inspect(object), maxLength);
}

function withChildren(inspection: Inspection, maxLength: number): ChildrenInspection {
  if (!("children" in inspection)) return inspection;
  const {children: generator, ...rest} = inspection;
  const children = toChildren(generator, maxLength);
  if ("attributes" in rest) {
    const {children: attributes} = toChildren(rest.attributes, Infinity);
    return {...rest, attributes, ...children} as ChildrenInspection;
  }
  if ("schema" in rest) {
    const schema = withChildren(rest.schema, Infinity);
    return {...rest, schema, ...children} as ChildrenInspection;
  }
  return {...rest, ...children} as ChildrenInspection;
}

function toChildren(
  generator: Generator<ChildInspection>,
  maxLength: number
): {
  children: ChildChildrenInspection[];
  truncated?: true;
} {
  const children: ChildChildrenInspection[] = [];
  let next: IteratorResult<ElementType<typeof generator>>;
  for (let i = 0; !(next = generator.next()).done && i < maxLength; ++i) {
    const value = next.value;
    if ("type" in value) {
      const child = withChildren(value, maxLength);
      children.push(child);
    } else {
      switch (value[0]) {
        case "property":
          children.push([value[0], value[1], withChildren(value[2], maxLength)]);
          break;
        case "symbol":
          children.push([value[0], value[1], withChildren(value[2], maxLength)]);
          break;
        case "entry":
          children.push(
            value.length === 2
              ? [value[0], withChildren(value[1], maxLength)]
              : [value[0], withChildren(value[1], maxLength), withChildren(value[2], maxLength)]
          );
          break;
        default:
          children.push(value);
          break;
      }
    }
  }
  generator.return(undefined);
  return {children, ...(!next.done && {truncated: true})};
}

test("inspects the given boolean", () => {
  assert.deepStrictEqual(inspect(true), {type: "boolean", value: true});
  assert.deepStrictEqual(inspect(false), {type: "boolean", value: false});
});

test("inspects the given bigint", () => {
  assert.deepStrictEqual(inspect(0n), {type: "bigint", value: 0n});
  assert.deepStrictEqual(inspect(42n), {type: "bigint", value: 42n});
});

test("inspects the given number", () => {
  assert.deepStrictEqual(inspect(0), {type: "number", value: 0});
  assert.deepStrictEqual(inspect(42), {type: "number", value: 42});
});

test("inspects the given symbol", () => {
  const s = Symbol();
  const foo = Symbol("foo");
  assert.deepStrictEqual(inspect(s), {type: "symbol", value: s});
  assert.deepStrictEqual(inspect(foo), {type: "symbol", value: foo});
});

test("inspects null or undefined", () => {
  assert.deepStrictEqual(inspect(null), {type: "null"});
  assert.deepStrictEqual(inspect(undefined), {type: "undefined"});
});

test("inspects the given date", () => {
  assert.deepStrictEqual(inspect(new Date("2024-01-01")), {type: "date", value: new Date("2024-01-01")}); // prettier-ignore
  assert.deepStrictEqual(inspect(new Date(NaN)), {type: "date", value: new Date(NaN)});
});

test("inspects the given regexp", () => {
  assert.deepStrictEqual(inspect(/test/), {type: "regexp", value: /test/});
  assert.deepStrictEqual(inspect(new RegExp("test")), {type: "regexp", value: /test/});
});

test("inspects the given error", () => {
  const e1 = new Error();
  const e2 = new Error("foo");
  const e3 = new DOMException("err");
  const e4 = new FooError("foo");
  assert.deepStrictEqual(inspect(e1), {type: "error", value: e1});
  assert.deepStrictEqual(inspect(e2), {type: "error", value: e2});
  assert.deepStrictEqual(inspect(e3), {type: "error", value: e3});
  assert.deepStrictEqual(inspect(e4), {type: "error", value: e4});
});

test("inspects the given function", () => {
  assert.deepStrictEqual(inspect(function () {}), {type: "function", async: false, generator: false, name: "", arguments: []}); // prettier-ignore
  assert.deepStrictEqual(inspect(async function () {}), {type: "function", async: true, generator: false, name: "", arguments: []}); // prettier-ignore
  assert.deepStrictEqual(inspect(function* () {}), {type: "function", async: false, generator: true, name: "", arguments: []}); // prettier-ignore
  assert.deepStrictEqual(inspect(async function* () {}), {type: "function", async: true, generator: true, name: "", arguments: []}); // prettier-ignore
  assert.deepStrictEqual(inspect(function foo() {}), {type: "function", async: false, generator: false, name: "foo", arguments: []}); // prettier-ignore
  assert.deepStrictEqual(inspect(async function foo() {}), {type: "function", async: true, generator: false, name: "foo", arguments: []}); // prettier-ignore
  assert.deepStrictEqual(inspect(function* foo() {}), {type: "function", async: false, generator: true, name: "foo", arguments: []}); // prettier-ignore
  assert.deepStrictEqual(inspect(async function* foo() {}), {type: "function", async: true, generator: true, name: "foo", arguments: []}); // prettier-ignore
  assert.deepStrictEqual(inspect(() => {}), {type: "function", async: false, generator: false, name: "", arguments: []}); // prettier-ignore
  assert.deepStrictEqual(inspect(async () => {}), {type: "function", async: true, generator: false, name: "", arguments: []}); // prettier-ignore
  assert.deepStrictEqual(inspect(class {}), {type: "class", name: ""}); // prettier-ignore
  assert.deepStrictEqual(inspect(class Foo {}), {type: "class", name: "Foo"}); // prettier-ignore
});

test("inspects the given function with a single argument", () => {
  assert.deepStrictEqual(inspect(function (foo: unknown) { return foo; }), {type: "function", async: false, generator: false, name: "", arguments: ["foo"]}); // prettier-ignore
  assert.deepStrictEqual(inspect(async function (foo: unknown) { return foo; }), {type: "function", async: true, generator: false, name: "", arguments: ["foo"]}); // prettier-ignore
  assert.deepStrictEqual(inspect(function* (foo: unknown) { yield foo; }), {type: "function", async: false, generator: true, name: "", arguments: ["foo"]}); // prettier-ignore
  assert.deepStrictEqual(inspect(async function* (foo: unknown) { yield foo; }), {type: "function", async: true, generator: true, name: "", arguments: ["foo"]}); // prettier-ignore
  assert.deepStrictEqual(inspect(function foo(bar: unknown) { return bar; }), {type: "function", async: false, generator: false, name: "foo", arguments: ["bar"]}); // prettier-ignore
  assert.deepStrictEqual(inspect(async function foo(bar: unknown) { return bar;}), {type: "function", async: true, generator: false, name: "foo", arguments: ["bar"]}); // prettier-ignore
  assert.deepStrictEqual(inspect(function* foo(bar: unknown) { yield bar; }), {type: "function", async: false, generator: true, name: "foo", arguments: ["bar"]}); // prettier-ignore
  assert.deepStrictEqual(inspect(async function* foo(bar: unknown) { yield bar; }), {type: "function", async: true, generator: true, name: "foo", arguments: ["bar"]}); // prettier-ignore
  assert.deepStrictEqual(inspect((foo: unknown) => foo), {type: "function", async: false, generator: false, name: "", arguments: ["foo"]}); // prettier-ignore
  assert.deepStrictEqual(inspect(async (foo: unknown) => foo), {type: "function", async: true, generator: false, name: "", arguments: ["foo"]}); // prettier-ignore
});

test("inspects the given function with multiple arguments", () => {
  assert.deepStrictEqual(inspect(function (foo: unknown, bar: unknown) { return [foo, bar]; }), {type: "function", async: false, generator: false, name: "", arguments: ["foo", "bar"]}); // prettier-ignore
  assert.deepStrictEqual(inspect(async function (foo: unknown, bar: unknown) { return [foo, bar]; }), {type: "function", async: true, generator: false, name: "", arguments: ["foo", "bar"]}); // prettier-ignore
  assert.deepStrictEqual(inspect(function* (foo: unknown, bar: unknown) { yield* [foo, bar]; }), {type: "function", async: false, generator: true, name: "", arguments: ["foo", "bar"]}); // prettier-ignore
  assert.deepStrictEqual(inspect(async function* (foo: unknown, bar: unknown) { yield* [foo, bar]; }), {type: "function", async: true, generator: true, name: "", arguments: ["foo", "bar"]}); // prettier-ignore
  assert.deepStrictEqual(inspect(function foo(bar: unknown, baz: unknown) { return [bar, baz]; }), {type: "function", async: false, generator: false, name: "foo", arguments: ["bar", "baz"]}); // prettier-ignore
  assert.deepStrictEqual(inspect(async function foo(bar: unknown, baz: unknown) { return [bar, baz];}), {type: "function", async: true, generator: false, name: "foo", arguments: ["bar", "baz"]}); // prettier-ignore
  assert.deepStrictEqual(inspect(function* foo(bar: unknown, baz: unknown) { yield* [bar, baz]; }), {type: "function", async: false, generator: true, name: "foo", arguments: ["bar", "baz"]}); // prettier-ignore
  assert.deepStrictEqual(inspect(async function* foo(bar: unknown, baz: unknown) { yield* [bar, baz]; }), {type: "function", async: true, generator: true, name: "foo", arguments: ["bar", "baz"]}); // prettier-ignore
  assert.deepStrictEqual(inspect((foo: unknown, bar: unknown) => [foo, bar]), {type: "function", async: false, generator: false, name: "", arguments: ["foo", "bar"]}); // prettier-ignore
  assert.deepStrictEqual(inspect(async (foo: unknown, bar: unknown) => [foo, bar]), {type: "function", async: true, generator: false, name: "", arguments: ["foo", "bar"]}); // prettier-ignore
});

test("inspects the given function with default values", () => {
  assert.deepStrictEqual(inspect(function (foo = false) { return foo; }), {type: "function", async: false, generator: false, name: "", arguments: undefined}); // prettier-ignore
});

test("inspects the given function with destructuring", () => {
  assert.deepStrictEqual(inspect(function ({foo}: {foo: unknown}) { return foo; }), {type: "function", async: false, generator: false, name: "", arguments: undefined}); // prettier-ignore
  assert.deepStrictEqual(inspect(function ([foo]: unknown[]) { return foo; }), {type: "function", async: false, generator: false, name: "", arguments: undefined}); // prettier-ignore
});

test("inspects the given string", () => {
  assert.deepStrictEqual(inspect("hello"), {type: "string", value: "hello"});
  assert.deepStrictEqual(inspect("fo'c'sle"), {type: "string", value: "fo'c'sle"});
  assert.deepStrictEqual(inspect('fo"c"sle'), {type: "string", value: 'fo"c"sle'});
  assert.deepStrictEqual(inspect("fo`c`sle"), {type: "string", value: "fo`c`sle"});
  assert.deepStrictEqual(inspect("01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789"), {type: "string", value: "01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789"}); // prettier-ignore
  assert.deepStrictEqual(inspect(`1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n`), {type: "string", value: `1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n`}); // prettier-ignore
  assert.deepStrictEqual(inspect(`1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n`), {type: "string", value: `1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n`}); // prettier-ignore
});

test("inspects the given object", () => {
  const symbol = Symbol("foo");
  assert.deepStrictEqual(inspectChildren({}), {type: "object", tag: "Object", children: []}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren({foo: true}), {type: "object", tag: "Object", children: [["property", "foo", {type: "boolean", value: true}]]}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren({foo: 1, bar: 2}), {type: "object", tag: "Object", children: [["property", "foo", {type: "number", value: 1}], ["property", "bar", {type: "number", value: 2}]]}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren({bar: 2, [symbol]: 1}), {type: "object", tag: "Object", children: [["property", "bar", {type: "number", value: 2}], ["symbol", symbol, {type: "number", value: 1}]]}); // prettier-ignore
});

test("inspects the given object, ignoring non-enumerable properties", () => {
  const o = {};
  Object.defineProperty(o, "foo", {enumerable: false, value: 1});
  Object.defineProperty(o, "bar", {enumerable: true, value: 2});
  assert.deepStrictEqual(inspectChildren(o), {type: "object", tag: "Object", children: [["property", "bar", {type: "number", value: 2}]]}); // prettier-ignore
});

test("inspects the given object with forbidden properties", () => {
  const o = Object.defineProperty({}, "foo", {enumerable: true, get() { throw new Error("not allowed"); }}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(o), {type: "object", tag: "Object", children: [["property", "foo", {type: "forbidden"}]]}); // prettier-ignore
});

test("inspects the given object with properties with forbidden constructors", () => {
  const o = Object.defineProperty({}, "constructor", {enumerable: false, get() { throw new Error("not allowed"); }}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren({o}), {type: "object", tag: "Object", children: [["property", "o", {type: "forbidden"}]]}); // prettier-ignore
});

test("inspects the given class instance", () => {
  class Foo {
    foo: unknown;
    constructor(foo: unknown) {
      this.foo = foo;
    }
  }
  class Bar<K, V> extends Map<K, V> {
    bar: unknown;
    constructor(entries: readonly [K, V][], bar: unknown) {
      super(entries);
      this.bar = bar;
    }
  }
  assert.deepStrictEqual(inspectChildren(new Foo(42)), {type: "object", tag: "Foo", children: [["property", "foo", {type: "number", value: 42}]]}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(new Bar([["one", 1]], 42)), {type: "map", tag: "Bar", size: 1, children: [["entry", {type: "string", value: "one"}, {type: "number", value: 1}], ["property", "bar", {type: "number", value: 42}]]}); // prettier-ignore
});

test("when inspecting an object, puts symbols at the end", () => {
  const symbol = Symbol("foo");
  assert.deepStrictEqual(inspectChildren({[symbol]: 1, bar: 2}), {type: "object", tag: "Object", children: [["property", "bar", {type: "number", value: 2}], ["symbol", symbol, {type: "number", value: 1}]]}); // prettier-ignore
});

test("inspects the given array", () => {
  const symbol = Symbol("foo");
  assert.deepStrictEqual(inspectChildren([]), {type: "array", tag: "Array", length: 0, children: []}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren([true]), {type: "array", tag: "Array", length: 1, children: [["entry", {type: "boolean", value: true}]]}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren([1, 2]), {type: "array", tag: "Array", length: 2, children: [["entry", {type: "number", value: 1}], ["entry", {type: "number", value: 2}]]}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(Array.from({length: 20}, (_, i) => i)), {type: "array", tag: "Array", length: 20, children: Array.from({length: 20}, (_, i) => ["entry", {type: "number", value: i}] as const)}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(Array.from({length: 40}, (_, i) => i)), {type: "array", tag: "Array", length: 40, children: Array.from({length: 20}, (_, i) => ["entry", {type: "number", value: i}] as const), truncated: true}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(Object.assign([1, 2], {foo: true})), {type: "array", tag: "Array", length: 2, children: [["entry", {type: "number", value: 1}], ["entry", {type: "number", value: 2}], ["property", "foo", {type: "boolean", value: true}]]}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(Object.assign([1, 2], {[symbol]: true})), {type: "array", tag: "Array", length: 2, children: [["entry", {type: "number", value: 1}], ["entry", {type: "number", value: 2}], ["symbol", symbol, {type: "boolean", value: true}]]}); // prettier-ignore
});

test("when inspecting a sparse array, uses empty entries", () => {
  assert.deepStrictEqual(inspectChildren(new Array(5)), {type: "array", tag: "Array", length: 5, children: [["empty", 5]]}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren([1,,, ]), {type: "array", tag: "Array", length: 3, children: [["entry", {type: "number", value: 1}], ["empty", 2]]}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren([1,,, 2]), {type: "array", tag: "Array", length: 4, children: [["entry", {type: "number", value: 1}], ["empty", 2], ["entry", {type: "number", value: 2}]]}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(new Array(400)), {type: "array", tag: "Array", length: 400, children: [["empty", 400]]}); // prettier-ignore
});

test("inspects the given typed array", () => {
  assert.deepStrictEqual(inspectChildren(Uint8Array.of(1, 2, 3)), {type: "array", tag: "Uint8Array", length: 3, children: [["entry", {type: "number", value: 1}], ["entry", {type: "number", value: 2}], ["entry", {type: "number", value: 3}]]}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(Int32Array.of(1, 2, 3)), {type: "array", tag: "Int32Array", length: 3, children: [["entry", {type: "number", value: 1}], ["entry", {type: "number", value: 2}], ["entry", {type: "number", value: 3}]]}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(BigInt64Array.of(1n, 2n, 3n)), {type: "array", tag: "BigInt64Array", length: 3, children: [["entry", {type: "bigint", value: 1n}], ["entry", {type: "bigint", value: 2n}], ["entry", {type: "bigint", value: 3n}]]}); // prettier-ignore
});

test("inspects the given map", () => {
  assert.deepStrictEqual(inspectChildren(new Map()), {type: "map", tag: "Map", size: 0, children: []}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(new Map([["key", 1]])), {type: "map", tag: "Map", size: 1, children: [["entry", {type: "string", value: "key"}, {type: "number", value: 1}]]}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(new Map(Array.from({length: 20}, (_, i) => [i, String.fromCharCode(i + "a".charCodeAt(0))]))), {type: "map", tag: "Map", size: 20, children: Array.from({length: 20}, (_, i) => ["entry", {type: "number", value: i}, {type: "string", value: "abcdefghijklmnopqrstuvwxyz"[i]}] as const)}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(new Map(Array.from({length: 40}, (_, i) => [i, String.fromCharCode(i + "a".charCodeAt(0))]))), {type: "map", tag: "Map", size: 40, children: Array.from({length: 20}, (_, i) => ["entry", {type: "number", value: i}, {type: "string", value: "abcdefghijklmnopqrstuvwxyz"[i]}] as const), truncated: true}); // prettier-ignore
});

test("inspects the given map with additional properties and symbols", () => {
  const symbol = Symbol("foo");
  assert.deepStrictEqual(inspectChildren(Object.assign(new Map([["key", 1]]), {foo: true})), {type: "map", tag: "Map", size: 1, children: [["entry", {type: "string", value: "key"}, {type: "number", value: 1}], ["property", "foo", {type: "boolean", value: true}]]}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(Object.assign(new Map([["key", 1]]), {[symbol]: true})), {type: "map", tag: "Map", size: 1, children: [["entry", {type: "string", value: "key"}, {type: "number", value: 1}], ["symbol", symbol, {type: "boolean", value: true}]]}); // prettier-ignore
});

test("inspects the given set", () => {
  assert.deepStrictEqual(inspectChildren(new Set()), {type: "set", tag: "Set", size: 0, children: []}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(new Set([1])), {type: "set", tag: "Set", size: 1, children: [["entry", {type: "number", value: 1}]]}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(new Set(Array.from({length: 20}, (_, i) => String.fromCharCode(i + "a".charCodeAt(0))))), {type: "set", tag: "Set", size: 20, children: Array.from({length: 20}, (_, i) => ["entry", {type: "string", value: "abcdefghijklmnopqrstuvwxyz"[i]}] as const)}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(new Set(Array.from({length: 40}, (_, i) => String.fromCharCode(i + "a".charCodeAt(0))))), {type: "set", tag: "Set", size: 40, children: Array.from({length: 20}, (_, i) => ["entry", {type: "string", value: "abcdefghijklmnopqrstuvwxyz"[i]}] as const), truncated: true}); // prettier-ignore
});

test("inspects the given set with additional properties and symbols", () => {
  const symbol = Symbol("foo");
  assert.deepStrictEqual(inspectChildren(Object.assign(new Set([1]), {foo: true})), {type: "set", tag: "Set", size: 1, children: [["entry", {type: "number", value: 1}], ["property", "foo", {type: "boolean", value: true}]]}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(Object.assign(new Set([1]), {[symbol]: true})), {type: "set", tag: "Set", size: 1, children: [["entry", {type: "number", value: 1}], ["symbol", symbol, {type: "boolean", value: true}]]}); // prettier-ignore
});

test("inspects the given element", () => {
  assert.deepStrictEqual(inspectChildren(html`<div>`), {type: "#element", tag: "div", attributes: [], children: []}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(html`<div foo>`), {type: "#element", tag: "div", attributes: [{type: "#attribute", name: "foo", value: ""}], children: []}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(html`<div foo=bar>`), {type: "#element", tag: "div", attributes: [{type: "#attribute", name: "foo", value: "bar"}], children: []}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren(html`<div>hello`), {type: "#element", tag: "div", attributes: [], children: [{type: "#text", value: "hello"}]}); // prettier-ignore
});

test("inspects the given attribute", () => {
  assert.deepStrictEqual(inspect(html`<div foo=bar>`.attributes[0]), {type: "#attribute", name: "foo", value: "bar"}); // prettier-ignore
  assert.deepStrictEqual(inspectChildren([...html`<div foo=bar baz>`.attributes]), {type: "array", tag: "Array", length: 2, children: [["entry", {type: "#attribute", name: "foo", value: "bar"}], ["entry", {type: "#attribute", name: "baz", value: ""}]]}); // prettier-ignore
});

test("inspects the given text", () => {
  assert.deepStrictEqual(inspectChildren(html`hello world`), {type: "#text", value: "hello world"}); // prettier-ignore
});

test("inspects the given comment", () => {
  assert.deepStrictEqual(inspectChildren(html`<!-- hello world -->`), {type: "#comment", value: " hello world "}); // prettier-ignore
});

test("inspects the given document", () => {
  assert.deepStrictEqual(inspectChildren(document), {type: "#document", children: [{type: "#doctype", name: "html"}, {type: "#element", tag: "html", attributes: [], children: [{type: "#element", tag: "head", attributes: [], children: []}, {type: "#element", tag: "body", attributes: [], children: []}]}]}); // prettier-ignore
});

function field(name: string, type: ChildrenInspection, nullable = false): ChildrenInspection {
  return {
    type: "object",
    tag: "Field",
    children: [
      ["property", "name", {type: "string", value: name}],
      ["property", "type", type],
      ["property", "nullable", {type: "boolean", value: nullable}],
      ["property", "metadata", {type: "map", tag: "Map", size: 0, children: []}]
    ]
  };
}

function row(object: Record<string, number>): ChildrenInspection {
  return {
    type: "object",
    tag: "Object",
    children: Object.entries(object).map(([name, value]) => ["property", name, {type: "number", value}]) // prettier-ignore
  };
}

test("inspects the given Apache Arrow table", () => {
  const length = 2000;
  const precipitation = Float32Array.from({length}, (_, i) => Math.sin(i / 100));
  const date = Array.from({length}, (_, i) => new Date(1769641173024 + 1000 * 60 * 60 * 24 * i));
  const data = Arrow.tableFromArrays({precipitation, date});
  const float32: ChildrenInspection = {type: "object", tag: "Float32", children: [["property", "typeId", {type: "number", value: 3}], ["property", "precision", {type: "number", value: 1}]]}; // prettier-ignore
  const timestamp: ChildrenInspection = {tag: "TimestampMillisecond", type: "object", children: [["property", "typeId", {type: "number", value: 10}], ["property", "unit", {type: "number", value: 1}], ["property", "timezone", {type: "undefined"}]]}; // prettier-ignore
  const fields: ChildrenInspection = {type: "array", tag: "Array", length: 2, children: [["entry", field("precipitation", float32)], ["entry", field("date", timestamp, true)]]}; // prettier-ignore
  const emptyMap: ChildrenInspection = {type: "map", tag: "Map", size: 0, children: []};
  const schema: ChildrenInspection = {type: "object", tag: "Schema", children: [["property", "fields", fields], ["property", "metadata", emptyMap], ["property", "dictionaries", emptyMap], ["property", "metadataVersion", {type: "number", value: 4}]]}; // prettier-ignore
  const children = Array.from({length: 20}, (_, i) => ["entry", row({precipitation: precipitation[i], date: +date[i]})] as const); // prettier-ignore
  const table: ChildrenInspection = {type: "arrow-table", numRows: 2000, numCols: 2, schema, children, truncated: true}; // prettier-ignore
  assert.deepStrictEqual(inspectChildren(new Arrow.Float32()), float32);
  assert.deepStrictEqual(inspectChildren(new Arrow.TimestampMillisecond()), timestamp);
  assert.deepStrictEqual(inspectChildren(data.schema.fields), fields);
  assert.deepStrictEqual(inspectChildren(data.schema), schema);
  assert.deepStrictEqual(inspectChildren(data), table);
});

test("inspects the given empty Apache Arrow table", () => {
  const data = Arrow.tableFromArrays({precipitation: [], date: []});
  const nully: ChildrenInspection = {type: "object", tag: "Null", children: [["property", "typeId", {type: "number", value: 1}]]}; // prettier-ignore
  const fields: ChildrenInspection = {type: "array", tag: "Array", length: 2, children: [["entry", field("precipitation", nully, true)], ["entry", field("date", nully, true)]]}; // prettier-ignore
  const emptyMap: ChildrenInspection = {type: "map", tag: "Map", size: 0, children: []};
  const schema: ChildrenInspection = {type: "object", tag: "Schema", children: [["property", "fields", fields], ["property", "metadata", emptyMap], ["property", "dictionaries", emptyMap], ["property", "metadataVersion", {type: "number", value: 4}]]}; // prettier-ignore
  const table: ChildrenInspection = {type: "arrow-table", numRows: 0, numCols: 2, schema, children: []}; // prettier-ignore
  assert.deepStrictEqual(inspectChildren(data.schema.fields), fields);
  assert.deepStrictEqual(inspectChildren(data.schema), schema);
  assert.deepStrictEqual(inspectChildren(data), table);
});
