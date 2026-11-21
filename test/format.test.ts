// @vitest-environment jsdom
/* eslint-disable no-sparse-arrays */

import {tableFromArrays} from "apache-arrow";
import {html} from "htl";
import {assert, test} from "vitest";
import {format as formatInspection, formatStringLines} from "../src/format.js";
import {inspect} from "../src/inspect.js";
import miserables from "./miserables.json" with {type: "json"};

function format(value: unknown, maxLength?: number): string {
  return formatInspection(inspect(value), maxLength);
}

class FooError extends Error {
  name = "FooError";
}

test("formats a function", () => {
  assert.strictEqual(format(function () {}), "ƒ()"); // prettier-ignore
  assert.strictEqual(format(async function () {}), "async ƒ()"); // prettier-ignore
  assert.strictEqual(format(function* () {}), "ƒ*()"); // prettier-ignore
  assert.strictEqual(format(async function* () {}), "async ƒ*()"); // prettier-ignore
  assert.strictEqual(format(function foo() {}), "ƒ()"); // prettier-ignore
  assert.strictEqual(format(async function foo() {}), "async ƒ()"); // prettier-ignore
  assert.strictEqual(format(function* foo() {}), "ƒ*()"); // prettier-ignore
  assert.strictEqual(format(async function* foo() {}), "async ƒ*()"); // prettier-ignore
  assert.strictEqual(format(() => {}), "ƒ()"); // prettier-ignore
  assert.strictEqual(format(async () => {}), "async ƒ()"); // prettier-ignore
  assert.strictEqual(format(class {}), "class"); // prettier-ignore
  assert.strictEqual(format(class Foo {}), "class"); // prettier-ignore
});

test("formats a function with a single argument", () => {
  assert.strictEqual(format(function (foo: unknown) { return foo; }), "ƒ(foo)"); // prettier-ignore
  assert.strictEqual(format(async function (foo: unknown) { return foo; }), "async ƒ(foo)"); // prettier-ignore
  assert.strictEqual(format(function* (foo: unknown) { yield foo; }), "ƒ*(foo)"); // prettier-ignore
  assert.strictEqual(format(async function* (foo: unknown) { yield foo; }), "async ƒ*(foo)"); // prettier-ignore
  assert.strictEqual(format(function foo(bar: unknown) { return bar; }), "ƒ(bar)"); // prettier-ignore
  assert.strictEqual(format(async function foo(bar: unknown) { return bar;}), "async ƒ(bar)"); // prettier-ignore
  assert.strictEqual(format(function* foo(bar: unknown) { yield bar; }), "ƒ*(bar)"); // prettier-ignore
  assert.strictEqual(format(async function* foo(bar: unknown) { yield bar; }), "async ƒ*(bar)"); // prettier-ignore
  assert.strictEqual(format((foo: unknown) => foo), "ƒ(foo)"); // prettier-ignore
  assert.strictEqual(format(async (foo: unknown) => foo), "async ƒ(foo)"); // prettier-ignore
});

test("formats a function with multiple arguments", () => {
  assert.strictEqual(format(function (foo: unknown, bar: unknown) { return [foo, bar]; }), "ƒ(foo, bar)"); // prettier-ignore
  assert.strictEqual(format(async function (foo: unknown, bar: unknown) { return [foo, bar]; }), "async ƒ(foo, bar)"); // prettier-ignore
  assert.strictEqual(format(function* (foo: unknown, bar: unknown) { yield* [foo, bar]; }), "ƒ*(foo, bar)"); // prettier-ignore
  assert.strictEqual(format(async function* (foo: unknown, bar: unknown) { yield* [foo, bar]; }), "async ƒ*(foo, bar)"); // prettier-ignore
  assert.strictEqual(format(function foo(bar: unknown, baz: unknown) { return [bar, baz]; }), "ƒ(bar, baz)"); // prettier-ignore
  assert.strictEqual(format(async function foo(bar: unknown, baz: unknown) { return [bar, baz];}), "async ƒ(bar, baz)"); // prettier-ignore
  assert.strictEqual(format(function* foo(bar: unknown, baz: unknown) { yield* [bar, baz]; }), "ƒ*(bar, baz)"); // prettier-ignore
  assert.strictEqual(format(async function* foo(bar: unknown, baz: unknown) { yield* [bar, baz]; }), "async ƒ*(bar, baz)"); // prettier-ignore
  assert.strictEqual(format((foo: unknown, bar: unknown) => [foo, bar]), "ƒ(foo, bar)"); // prettier-ignore
  assert.strictEqual(format((foo: unknown, bar: unknown) => [foo, bar], 10), "ƒ(foo, bar)"); // prettier-ignore
  assert.strictEqual(format((foo: unknown, bar: unknown) => [foo, bar], 5), "ƒ(foo, …)"); // prettier-ignore
  assert.strictEqual(format((foo: unknown, bar: unknown) => [foo, bar], 1), "ƒ(…)"); // prettier-ignore
  assert.strictEqual(format(async (foo: unknown, bar: unknown) => [foo, bar]), "async ƒ(foo, bar)"); // prettier-ignore
  assert.strictEqual(format(async (foo: unknown, bar: unknown) => [foo, bar], 10), "async ƒ(foo, …)"); // prettier-ignore
  assert.strictEqual(format(async (foo: unknown, bar: unknown) => [foo, bar], 5), "async ƒ(…)"); // prettier-ignore
});

test("formats a function with default values", () => {
  assert.strictEqual(format(function (foo = false) { return foo; }), "ƒ(…)"); // prettier-ignore
});

test("formats a function with destructuring", () => {
  assert.strictEqual(format(function ({foo}: {foo: unknown}) { return foo; }), "ƒ(…)"); // prettier-ignore
  assert.strictEqual(format(function ([foo]: unknown[]) { return foo; }), "ƒ(…)"); // prettier-ignore
});

test("formats a symbol", () => {
  assert.strictEqual(format(Symbol()), "Symbol()");
  assert.strictEqual(format(Symbol("foo")), "Symbol(foo)");
});

test("formats a bigint", () => {
  assert.strictEqual(format(0n), "0n");
  assert.strictEqual(format(42n), "42n");
  assert.strictEqual(format(-42n), "-42n");
});

test("formats a date", () => {
  assert.strictEqual(format(new Date(NaN)), "Invalid Date");
  assert.strictEqual(format(new Date("2024-02-03")), "2024-02-03");
  assert.strictEqual(format(new Date("2025-01-01")), "2025-01-01");
  assert.strictEqual(format(new Date("2025-01-01T12:00Z")), "2025-01-01T12:00Z");
  assert.strictEqual(format(new Date("2025-01-01T12:34Z")), "2025-01-01T12:34Z");
  assert.strictEqual(format(new Date("2025-01-01T12:34:56Z")), "2025-01-01T12:34:56Z");
  assert.strictEqual(format(new Date("2025-01-01T12:34:56.780Z")), "2025-01-01T12:34:56.780Z");
});

test("formats an error", () => {
  const e1 = new Error();
  const e2 = new Error("foo");
  const e3 = new DOMException("err");
  const e4 = new FooError("foo");
  assert.strictEqual(format(e1), String(e1));
  assert.strictEqual(format(e2), String(e2));
  assert.strictEqual(format(e3), String(e3));
  assert.strictEqual(format(e4), String(e4));
});

// test("formats a stackless error", () => {
//   const e1 = Object.assign(new Error(), {stack: undefined});
//   const e2 = Object.assign(new Error("foo"), {stack: undefined});
//   const e3 = Object.assign(new DOMException("err"), {stack: undefined});
//   const e4 = Object.assign(new FooError("err"), {stack: undefined});
//   assert.strictEqual(format(e1), "Error");
//   assert.strictEqual(format(e2), "Error: foo");
//   assert.strictEqual(format(e3), "Error: err");
//   assert.strictEqual(format(e4), "FooError: err");
// });

test("formats a regexp", () => {
  assert.strictEqual(format(/test/), "/test/");
  assert.strictEqual(format(/test/gi), "/test/gi");
  assert.strictEqual(format(new RegExp("test")), "/test/");
  assert.strictEqual(format(new RegExp("test", "gi")), "/test/gi");
});

test("formats a string", () => {
  assert.strictEqual(format("01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789", 0), '"0123…789"'); // prettier-ignore
  assert.strictEqual(format("01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789", 10), '"01234…6789"'); // prettier-ignore
  assert.strictEqual(format("01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789", 50), '"0123456789012345678901234…678901234567890123456789"'); // prettier-ignore
  assert.strictEqual(format("01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789", 100), '"01234567890123456789012345678901234567890123456789…1234567890123456789012345678901234567890123456789"'); // prettier-ignore
  assert.strictEqual(format("hello"), '"hello"');
  assert.strictEqual(format("hello world"), '"hello world"');
  assert.strictEqual(format("fo'c'sle"), `"fo'c'sle"`);
  assert.strictEqual(format('fo"c"sle'), '"fo\\"c\\"sle"');
  assert.strictEqual(format("fo`c`sle"), '"fo`c`sle"');
});

test("formats a string as lines", () => {
  assert.deepStrictEqual(formatStringLines("hello"), {value: '"hello"'});
  assert.deepStrictEqual(formatStringLines("fo'c'sle"), {value: `"fo'c'sle"`});
  assert.deepStrictEqual(formatStringLines('fo"c"sle'), {value: '`fo"c"sle`'});
  assert.deepStrictEqual(formatStringLines("fo`c`sle"), {value: '"fo`c`sle"'});
  assert.deepStrictEqual(formatStringLines("01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789"), {value: '"01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890123456789"'}); // prettier-ignore
  assert.deepStrictEqual(formatStringLines(`1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n`, 20), {value: '`1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n`'}); // prettier-ignore
  assert.deepStrictEqual(formatStringLines(`1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n`), {value: '`1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n`'}); // prettier-ignore
  assert.deepStrictEqual(formatStringLines(`1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n`, 20), {value: '`1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0', lines: 21, truncated: true}); // prettier-ignore
  assert.deepStrictEqual(formatStringLines(`1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n`), {value: '`1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n`'}); // prettier-ignore
  assert.deepStrictEqual(formatStringLines(`1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n`, 20), {value: '`1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0', lines: 25, truncated: true}); // prettier-ignore
  assert.deepStrictEqual(formatStringLines(`1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n`), {value: '`1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n5\n6\n7\n8\n9\n0\n1\n2\n3\n4\n`'}); // prettier-ignore
});

test("formats a boolean", () => {
  assert.strictEqual(format(true), "true");
  assert.strictEqual(format(false), "false");
});

test("formats a number", () => {
  assert.strictEqual(format(0), "0");
  assert.strictEqual(format(42), "42");
  assert.strictEqual(format(NaN), "NaN");
  assert.strictEqual(format(Infinity), "Infinity");
  assert.strictEqual(format(-Infinity), "-Infinity");
  assert.strictEqual(format(Math.PI), "3.141592653589793");
  assert.strictEqual(format(Number.MIN_VALUE), "5e-324");
  assert.strictEqual(format(Number.MAX_SAFE_INTEGER), "9007199254740991");
  assert.strictEqual(format(Number.MAX_VALUE), "1.7976931348623157e+308");
});

test("formats negative zero", () => {
  assert.strictEqual(format(-0), "-0");
});

test("formats null", () => {
  assert.strictEqual(format(null), "null");
});

test("formats undefined", () => {
  assert.strictEqual(format(undefined), "undefined");
});

test("formats an array", () => {
  assert.strictEqual(format([]), "[]");
  assert.strictEqual(format([1]), "[1]");
  assert.strictEqual(format([1, 2]), "[1, 2]");
  assert.strictEqual(format([1, 2, 3]), "[1, 2, 3]");
  assert.strictEqual(format([1, 2, 3, 4]), "[1, 2, 3, 4]");
  assert.strictEqual(format(new Array(21)), "Array(21) [empty × 21]");
  assert.strictEqual(format(new Array(21).fill(0), 40), "Array(21) [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, …]"); // prettier-ignore
  assert.strictEqual(format(new Array(21).fill(0), 70), "Array(21) [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, …]"); // prettier-ignore
});

test("formats a nested array", () => {
  assert.strictEqual(format([[]]), "[[]]");
  assert.strictEqual(format([[1]]), "[[1]]");
  assert.strictEqual(format([[1], [2]]), "[[1], [2]]");
  assert.strictEqual(format([[1, 2]]), "[[1, 2]]");
  assert.strictEqual(format([[new Array(21)]]), "[[Array(21) [empty × 21]]]");
});

test("formats a sparse array", () => {
  assert.strictEqual(format([1, , , , 4]), "[1, empty × 3, 4]");
  assert.strictEqual(format(new Array(100)), "Array(100) [empty × 100]");
  assert.strictEqual(format(Object.assign(new Array(100), {foo: true})), "Array(100) [empty × 100, foo: true]"); // prettier-ignore
  assert.strictEqual(format(Object.assign(new Array(100).fill(0), {foo: true}), 70), "Array(100) [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, …]"); // prettier-ignore
  assert.strictEqual(format(Object.assign(new Array(19).fill(0), {foo: true})), "[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, foo: true]"); // prettier-ignore
  assert.strictEqual(format(Object.assign(new Array(20).fill(0), {foo: true}), 70), "Array(20) [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, …]"); // prettier-ignore
  assert.strictEqual(format(Object.assign(new Array(19).fill(0), {foo: 1, bar: 2}), 60), "[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, foo: 1, …]"); // prettier-ignore
});

test("formats an array with properties", () => {
  assert.strictEqual(format(Object.assign([1, 2, 3], {foo: true})), "[1, 2, 3, foo: true]"); // prettier-ignore
  assert.strictEqual(format(Object.assign([1, 2, 3], {foo: true}), 10), "[1, 2, 3, foo: true]"); // prettier-ignore
  assert.strictEqual(format(Object.assign([1, 2, 3], {foo: true}), 7), "[1, 2, 3, …]"); // prettier-ignore
  assert.strictEqual(format(Object.assign([1, 2, 3], {foo: true}), 5), "[1, 2, …]"); // prettier-ignore
  assert.strictEqual(format(Object.assign([1, 2, 3], {foo: true}), 3), "[1, …]"); // prettier-ignore
  assert.strictEqual(format(Object.assign([1, 2, 3], {foo: true}), 1), "[…]"); // prettier-ignore
  assert.strictEqual(format(Object.assign([1, 2, 3], {foo: true}), 0), "[…]"); // prettier-ignore
});

test("formats an object", () => {
  assert.strictEqual(format({}), "{}");
  assert.strictEqual(format({foo: 1}), "{foo: 1}");
  assert.strictEqual(format({"foo bar": 1}), '{"foo bar": 1}');
  assert.strictEqual(format(Object.fromEntries(Array.from({length: 40}, (_, i) => [String.fromCharCode(i + "a".charCodeAt(0)), i])), 100), "{a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7, i: 8, j: 9, k: 10, l: 11, m: 12, n: 13, o: 14, p: 15, …}"); // prettier-ignore
  assert.strictEqual(format(miserables, 100), '{nodes: Array(77) [{id: "Myriel", group: 1}, {id: "Napoleon", …}, …], links: Array(254) [{source: "Napoleon", …}, …]}'); // prettier-ignore
});

test("formats a map", () => {
  assert.strictEqual(format(new Map()), "Map(0) {}");
  assert.strictEqual(format(new Map([["foo", 1]])), 'Map(1) {"foo" => 1}');
  assert.strictEqual(format(new Map([["foo", 1], ["bar", 2]])), 'Map(2) {"foo" => 1, "bar" => 2}'); // prettier-ignore
  assert.strictEqual(format(new Map([[1, "foo"]])), 'Map(1) {1 => "foo"}');
  assert.strictEqual(format(new Map([[1, "foo"], [2, "bar"]])), 'Map(2) {1 => "foo", 2 => "bar"}'); // prettier-ignore
  assert.strictEqual(format(new Map([[1, "foo"], [2, "bar"]]), 10), 'Map(2) {1 => "foo", …}'); // prettier-ignore
  assert.strictEqual(format(new Map([[1, "foo"], [2, "bar"]]), 7), 'Map(2) {…}'); // prettier-ignore
});

test("formats a set", () => {
  assert.strictEqual(format(new Set()), "Set(0) {}");
  assert.strictEqual(format(new Set([1])), "Set(1) {1}");
  assert.strictEqual(format(new Set([1, 2])), "Set(2) {1, 2}");
  assert.strictEqual(format(new Set(["foo"])), 'Set(1) {"foo"}');
  assert.strictEqual(format(new Set(["foo", "bar"])), 'Set(2) {"foo", "bar"}');
  assert.strictEqual(format(new Set(["foo", "bar"]), 15), 'Set(2) {"foo", "bar"}');
  assert.strictEqual(format(new Set(["foo", "bar"]), 10), 'Set(2) {"foo", …}');
  assert.strictEqual(format(new Set(["foo", "bar"]), 5), "Set(2) {…}");
  assert.strictEqual(format(new Set(["foo", "bar"]), 0), "Set(2) {…}");
});

test("formats an instance", () => {
  class Foo {}
  assert.strictEqual(format(new Foo()), "Foo {}");
  assert.strictEqual(format(Object.assign(new Foo(), {foo: 1})), "Foo {foo: 1}");
  assert.strictEqual(format(Object.assign(new Foo(), {foo: 1}), 10), "Foo {foo: 1}");
  assert.strictEqual(format(Object.assign(new Foo(), {foo: 1}), 5), "Foo {…}");
  assert.strictEqual(format(Object.assign(new Foo(), {foo: 1}), 0), "Foo {…}");
});

test("formats an element", () => {
  assert.strictEqual(format(html`<div></div>`), "<div></div>");
  assert.strictEqual(format(html`<div foo></div>`), "<div foo></div>");
  assert.strictEqual(format(html`<div foo="bar"></div>`), "<div foo=bar></div>");
  assert.strictEqual(format(html`<div foo="bar baz"></div>`), '<div foo="bar baz"></div>');
  assert.strictEqual(format(html`<div title="a long string">`, 30), '<div title="a long string"></div>'); // prettier-ignore
  assert.strictEqual(format(html`<div title="a long string">`, 20), '<div title="a lo…ing"></div>'); // prettier-ignore
  assert.strictEqual(format(html`<div title="a long string">`, 10), '<div title="a lo…ing"></div>'); // prettier-ignore
  assert.strictEqual(format(html`<div title="a long string">`, 5), '<div …></div>'); // prettier-ignore
  assert.strictEqual(format(html`<div title="a long string">`, 0), '<div …></div>'); // prettier-ignore
  assert.strictEqual(format(html`<div id=foo title="a long string">`, 40), '<div id=foo title="a lon…ring"></div>'); // prettier-ignore
  assert.strictEqual(format(html`<div id=foo title="a long string">`, 30), '<div id=foo title="a lo…ing"></div>'); // prettier-ignore
  assert.strictEqual(format(html`<div id=foo title="a long string">`, 20), '<div id=foo title="a lo…ing"></div>'); // prettier-ignore
  assert.strictEqual(format(html`<div id=foo title="a long string">`, 10), '<div id=foo …></div>'); // prettier-ignore
  assert.strictEqual(format(html`<div id=foo title="a long string">`, 5), '<div …></div>'); // prettier-ignore
  assert.strictEqual(format(html`<div id=foo title="a long string">`, 0), '<div …></div>'); // prettier-ignore
  assert.strictEqual(format(html`<div>hello</div>`), "<div>hello</div>");
});

test("formats an arrow table", () => {
  const length = 2000;
  const precipitation = Float32Array.from({length}, (_, i) => Math.sin(i / 100));
  const date = Array.from({length}, (_, i) => new Date(1769641173024 + 1000 * 60 * 60 * 24 * i));
  const table = tableFromArrays({precipitation, date});
  assert.strictEqual(format(table, 500), 'Arrow.Table(2000 × 2) [{precipitation: 0, date: 1769641173024}, {precipitation: 0.009999833069741726, date: 1769727573024}, {precipitation: 0.019998665899038315, date: 1769813973024}, {precipitation: 0.029995501041412354, date: 1769900373024}, {precipitation: 0.03998933359980583, date: 1769986773024}, … schema: Schema {fields: [Field {name: "precipitation", type: Float32 {typeId: 3, …}, …}, Field {name: "date", type: TimestampMillisecond {…}, …}], metadata: Map(0) {}, dictionaries: Map(0) {}, metadataVersion: 4}]'); // prettier-ignore
});

test("formats an empty arrow table", () => {
  const table = tableFromArrays({a: [], b: []});
  assert.strictEqual(format(table, 500), 'Arrow.Table(0 × 2) [schema: Schema {fields: [Field {name: "a", type: Null {typeId: 1}, nullable: true, …}, Field {name: "b", type: Null {typeId: 1}, nullable: true, …}], metadata: Map(0) {}, dictionaries: Map(0) {}, metadataVersion: 4}]'); // prettier-ignore
});
