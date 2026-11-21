import {assert, test} from "vitest";
import {peek} from "../src/peek.js";

function peekArray<T>(iterable: Iterable<T>, n: number) {
  const [peeked, rest] = peek(iterable[Symbol.iterator](), n);
  return [peeked, [...rest]];
}

test("can peek an empty iterator", () => {
  assert.deepStrictEqual(peekArray([], 0), [[], []]);
  assert.deepStrictEqual(peekArray([], 1), [[], []]);
  assert.deepStrictEqual(peekArray([], 2), [[], []]);
});

test("can peek zero elements", () => {
  assert.deepStrictEqual(peekArray([], 0), [[], []]);
  assert.deepStrictEqual(peekArray([0], 0), [[], [0]]);
  assert.deepStrictEqual(peekArray([0, 1], 0), [[], [0, 1]]);
  assert.deepStrictEqual(peekArray([0, 1, 2], 0), [[], [0, 1, 2]]);
});

test("can peek one element", () => {
  assert.deepStrictEqual(peekArray([], 1), [[], []]);
  assert.deepStrictEqual(peekArray([0], 1), [[0], [0]]);
  assert.deepStrictEqual(peekArray([0, 1], 1), [[0], [0, 1]]);
  assert.deepStrictEqual(peekArray([0, 1, 2], 1), [[0], [0, 1, 2]]);
});

test("can peek two elements", () => {
  assert.deepStrictEqual(peekArray([], 2), [[], []]);
  assert.deepStrictEqual(peekArray([0], 2), [[0], [0]]);
  assert.deepStrictEqual(peekArray([0, 1], 2), [[0, 1], [0, 1]]); // prettier-ignore
  assert.deepStrictEqual(peekArray([0, 1, 2], 2), [[0, 1], [0, 1, 2]]); // prettier-ignore
});
