/* eslint-disable no-sparse-arrays */
import * as flechette from "@uwdata/flechette";
import {tableFromArrays} from "apache-arrow";
import miserables from "./miserables.json" with {type: "json"};

class Foo {
  foo = 1;
}

class FooError extends Error {
  name = "FooError";
}

function lines(n: number) {
  return Array.from({length: n}, (_, i) => `hi ${i}`).join("\n");
}

export const undefinedValue = () => undefined;
export const nullValue = () => null;
export const booleanTrue = () => true;
export const number = () => 42;
export const numberNegativeZero = () => -0;
export const numberPi = () => Math.PI;
export const numberNaN = () => NaN;
export const bigint = () => 100n;
export const symbol = () => Symbol("foo");
export const symbolLong = () => Symbol("a".repeat(100));
export const date = () => new Date(Date.UTC(2020, 0, 1));
export const dateTime = () => new Date(Date.UTC(2020, 0, 1, 12, 34, 56));
export const dateInvalid = () => new Date(NaN);
export const regexp = () => /baz/g;
export const error = () => new Error("Danger!");
export const errorSubclass = () => new FooError("Danger!");
export const string = () => "hi";
export const stringQuotes = () => 'fo"c"sle';
export const stringLong = () => "0123456789".repeat(20);
export const string1000Lines = () => lines(1000);
export const functionNamed = () => function a() {};
export const functionArrow = () => (a: unknown) => a;
export const functionArrowArgs = () => (a: number, b: number) => a + b;
export const functionDestructuring = () => ({a}: {a: unknown}) => a;
export const functionAsync = () => async function a() {};
export const functionGenerator = () => function* a() {};
export const functionAsyncGenerator = () => async function* a() {};
export const classValue = () => class A {};
export const array = () => [1, 2, 3];
export const arrayEmpty = () => [];
export const arrayNested = () => [1, 2, 3, [2, 3]];
export const arraySparse = () => [1, , , 4, , 6];
export const arrayWithProperties = () => Object.assign([1, 2], {foo: "bar", "foo bar": 42});
export const array100 = () => Array.from({length: 100}, (_, i) => i);
export const arrayOfStrings = () => Array.from({length: 10}, (_, i) => `string ${i}`);
export const uint8Array = () => new Uint8Array([1, 2, 3]);
export const float64Array = () => new Float64Array([0.1, 0.2, 0.3]);
export const object = () => ({a: 2, [Symbol("hi")]: 3});
export const objectEmpty = () => ({});
export const objectNested = () => ({a: {b: {c: {d: 1}}}, e: [1, 2, {f: 3}]});
export const objectQuotedKeys = () => ({"foo bar": 1, "foo-bar": 2, foo_bar: 3});
export const objectMiserables = () => miserables;
export const objectForbidden = () => Object.defineProperty({}, "foo", {enumerable: true, get() { throw new Error(); }}); // prettier-ignore
export const instance = () => new Foo();
export const map = () => new Map([["foo", 1], ["bar", 2]]); // prettier-ignore
export const mapObjectKeys = () => new Map([[{a: 1}, [1, 2]], [{b: 2}, [3, 4]]]); // prettier-ignore
export const mapEmpty = () => new Map();
export const set = () => new Set(["foo", "bar"]);
export const setEmpty = () => new Set();
export const element = () => {
  const div = document.createElement("div");
  const b = document.createElement("b");
  b.textContent = "world";
  div.className = "foo bar";
  div.title = "greeting";
  div.append("hello, ", b, document.createComment("comment"));
  return div;
};
export const elementEmpty = () => document.createElement("br");
export const elementSvg = () => document.createElementNS("http://www.w3.org/2000/svg", "svg");
export const text = () => document.createTextNode("hello");
export const comment = () => document.createComment("comment");
export const documentFragment = () => {
  const fragment = document.createDocumentFragment();
  fragment.append(document.createElement("span"), "text");
  return fragment;
};
export const arrowTable = () => tableFromArrays({a: [1, 2, 3], b: ["x", "y", "z"]});
export const arrowTableEmpty = () => tableFromArrays({a: [], b: []});
export const flechetteTable = () => flechette.tableFromArrays({a: [1, 2, 3], b: ["x", "y", "z"]}); // prettier-ignore
export const flechetteTableUnsafeInt64 = () => flechette.tableFromArrays({id: [1n, 1870084251657671040n, null], x: [0.5, 1.5, 2.5]}, {types: {id: flechette.int64(), x: flechette.float64()}}); // prettier-ignore
