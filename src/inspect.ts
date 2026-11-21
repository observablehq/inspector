import {getArrowCell, isArrowTable} from "./arrow.js";
import type * as Arrow from "apache-arrow";

export type Inspection =
  | UndefinedInspection
  | NullInspection
  | BooleanInspection
  | BigIntInspection
  | SymbolInspection
  | NumberInspection
  | StringInspection
  | DateInspection
  | RegExpInspection
  | ErrorInspection
  | FunctionInspection
  | ClassInspection
  | ObjectInspection
  | ArrayInspection
  | MapInspection
  | SetInspection
  | AnyNodeInspection
  | ForbiddenInspection
  | ArrowTableInspection;

type ChildNodeInspection = ElementInspection | TextInspection | CommentInspection | DocumentTypeInspection; // prettier-ignore
type AnyNodeInspection = NodeInspection | ChildNodeInspection | AttributeInspection | DocumentInspection | DocumentFragmentInspection; // prettier-ignore
type ObjectChildInspection = ObjectPropertyInspection | ObjectSymbolInspection;
type ArrayChildInspection = ArrayEntryInspection | ObjectChildInspection;
type MapChildInspection = MapEntryInspection | ObjectChildInspection;
type SetChildInspection = SetEntryInspection | ObjectChildInspection;

type UndefinedInspection = {type: "undefined"};
type NullInspection = {type: "null"};
type BooleanInspection = {type: "boolean"; value: boolean};
type BigIntInspection = {type: "bigint"; value: bigint};
type SymbolInspection = {type: "symbol"; value: symbol};
type NumberInspection = {type: "number"; value: number};
type StringInspection = {type: "string"; value: string};
type ForbiddenInspection = {type: "forbidden"};
type DateInspection = {type: "date"; value: Date};
type RegExpInspection = {type: "regexp"; value: RegExp};
type ErrorInspection = {type: "error"; value: Error};

type ArrowTableInspection = {
  type: "arrow-table";
  numRows: number;
  numCols: number;
  schema: ObjectInspection;
  children: Generator<ArrayChildInspection>;
};

type ObjectInspection = {
  type: "object";
  tag: string;
  children: Generator<ObjectChildInspection>;
};

type ArrayInspection = {
  type: "array";
  tag: string;
  length: number;
  children: Generator<ArrayChildInspection>;
};

type MapInspection = {
  type: "map";
  tag: string;
  size: number;
  children: Generator<MapChildInspection>;
};

type SetInspection = {
  type: "set";
  tag: string;
  size: number;
  children: Generator<SetChildInspection>;
};

type NodeInspection = {
  type: "#node";
  children: Generator<ChildNodeInspection>;
};

type ElementInspection = {
  type: "#element";
  tag: string;
  attributes: Generator<AttributeInspection>;
  children: Generator<ChildNodeInspection>;
};

type DocumentInspection = {
  type: "#document";
  children: Generator<ChildNodeInspection>;
};

type DocumentFragmentInspection = {
  type: "#document-fragment";
  children: Generator<ChildNodeInspection>;
};

type DocumentTypeInspection = {
  type: "#doctype";
  name: string;
};

type AttributeInspection = {
  type: "#attribute";
  name: string;
  value: string;
};

type CommentInspection = {
  type: "#comment";
  value: string | null;
};

type TextInspection = {
  type: "#text";
  value: string | null;
};

type ClassInspection = {
  type: "class";
  name: string;
};

type FunctionInspection = {
  type: "function";
  name: string;
  async: boolean;
  generator: boolean;
  arguments?: string[];
};

type ObjectPropertyInspection = readonly [type: "property", key: string, value: Inspection];
type ObjectSymbolInspection = readonly [type: "symbol", key: symbol, value: Inspection];
type ArrayEntryInspection = readonly [type: "entry", value: Inspection] | readonly [type: "empty", length: number]; // prettier-ignore
type MapEntryInspection = readonly [type: "entry", key: Inspection, value: Inspection];
type SetEntryInspection = readonly [type: "entry", value: Inspection];

const reArrowSingleArgument = /^(?:async\s*)?(\w+)\s*=>/;
const reArrowParens = /^(?:async\s*)?\(\s*(\w+(?:\s*,\s*\w+)*)?\s*\)/;
const reFunction = /^(?:async\s*)?function(?:\s*\*)?(?:\s*\w+)?\s*\(\s*(\w+(?:\s*,\s*\w+)*)?\s*\)/;

const objectToString = Object.prototype.toString;
const functionToString = Function.prototype.toString;
const getOwnPropertySymbols = Object.getOwnPropertySymbols;
const hasOwnProperty = Object.prototype.hasOwnProperty;
const toStringTag = Symbol.toStringTag;

const FORBIDDEN = {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClassConstructor = new (...args: any[]) => any;

export function inspect(value: null): Inspection & {type: "null"};
export function inspect(value: undefined): Inspection & {type: "undefined"};
export function inspect(value: bigint): Inspection & {type: "bigint"};
export function inspect(value: number): Inspection & {type: "number"};
export function inspect(value: string): Inspection & {type: "string"};
export function inspect(value: RegExp): Inspection & {type: "regexp"};
export function inspect(value: Date): Inspection & {type: "date"};
export function inspect(value: Error): Inspection & {type: "error"};
export function inspect(value: symbol): Inspection & {type: "symbol"};
export function inspect(value: boolean): Inspection & {type: "boolean"};
export function inspect(value: ClassConstructor): Inspection & {type: "class"};
export function inspect(value: Function): Inspection & {type: "function"}; // eslint-disable-line @typescript-eslint/no-unsafe-function-type
export function inspect(value: ArrayLike<unknown>): Inspection & {type: "array"};
export function inspect(value: Map<unknown, unknown>): Inspection & {type: "map"};
export function inspect(value: Set<unknown>): Inspection & {type: "set"};
export function inspect(value: Node): Inspection & AnyNodeInspection;
export function inspect(value: Element): Inspection & {type: "#element"};
export function inspect(value: Document): Inspection & {type: "#document"};
export function inspect(value: DocumentType): Inspection & {type: "#doctype"};
export function inspect(value: DocumentFragment): Inspection & {type: "#document-fragment"};
export function inspect(value: Attr): Inspection & {type: "#attribute"};
export function inspect(value: Text): Inspection & {type: "#text"};
export function inspect(value: Comment): Inspection & {type: "#comment"};
export function inspect(value: Arrow.Table): Inspection & {type: "arrow-table"};
export function inspect<T extends Inspection>(value: unknown): T;
export function inspect(value: unknown): Inspection {
  if (value === null) return {type: "null"};
  if (value === FORBIDDEN) return {type: "forbidden"};
  const type = typeof value;
  switch (type) {
    case "boolean":
      return {type, value: value as boolean};
    case "bigint":
      return {type, value: value as bigint};
    case "number":
      return {type, value: value as number}; // value === 0 && 1 / value < 0 ? "-0"
    case "symbol":
      return {type, value: value as symbol};
    case "undefined":
      return {type};
    case "function":
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      return inspectFunction(value as Function);
    case "string":
      return {type, value: value as string};
    case "object": {
      let tag: string | undefined;
      try {
        tag = objectToString.call(value);
      } catch {
        // ignore; treat as generic object
      }
      switch (tag) {
        case "[object Date]":
          return {type: "date", value: value as Date};
        case "[object RegExp]":
          return {type: "regexp", value: value as RegExp};
        case "[object Error]": // https://github.com/lodash/lodash/blob/master/isError.js#L26
        case "[object DOMException]":
          return {type: "error", value: value as Error};
        default:
          return isNode(value)
            ? inspectNode(value)
            : isMap(value)
              ? inspectMap(value)
              : isSet(value)
                ? inspectSet(value)
                : isArray(value)
                  ? inspectArray(value)
                  : isArrowTable(value)
                    ? inspectArrowTable(value)
                    : inspectObject(value!);
      }
    }
  }
  throw new Error(`unexpected type: ${type}`);
}

function isNode(value: unknown): value is Node {
  return value instanceof Node && value instanceof value.constructor;
}

function inspectNode(node: Attr): AttributeInspection;
function inspectNode(node: ChildNode): ChildNodeInspection;
function inspectNode(node: Comment): CommentInspection;
function inspectNode(node: Document): DocumentInspection;
function inspectNode(node: DocumentType): DocumentTypeInspection;
function inspectNode(node: DocumentFragment): DocumentFragmentInspection;
function inspectNode(node: Element): ElementInspection;
function inspectNode(node: Text): TextInspection;
function inspectNode(node: Node): AnyNodeInspection;
function inspectNode(node: Node): AnyNodeInspection {
  switch (node.nodeType) {
    case 1:
      return inspectElement(node as Element);
    case 2:
      return inspectAttribute(node as Attr);
    case 3:
      return inspectText(node as Text);
    case 8:
      return inspectComment(node as Comment);
    case 9:
      return inspectDocument(node as Document);
    case 10:
      return inspectDocumentType(node as DocumentType);
    case 11:
      return inspectDocumentFragment(node as DocumentFragment);
  }
  return {type: "#node", children: iterateChildNodes(node)};
}

function inspectElement(element: Element): ElementInspection {
  return {
    type: "#element",
    tag:
      element.namespaceURI === "http://www.w3.org/1999/xhtml"
        ? element.tagName.toLowerCase()
        : element.tagName,
    attributes: iterateAttributes(element),
    children: iterateChildNodes(element)
  };
}

function inspectAttribute(attribute: Attr): AttributeInspection {
  return {type: "#attribute", name: attribute.name, value: attribute.value};
}

function inspectText(text: Text): TextInspection {
  return {type: "#text", value: text.nodeValue};
}

function inspectComment(comment: Comment): CommentInspection {
  return {type: "#comment", value: comment.nodeValue};
}

function inspectDocument(document: Document): DocumentInspection {
  return {type: "#document", children: iterateChildNodes(document)};
}

function inspectDocumentType(doctype: DocumentType): DocumentTypeInspection {
  return {type: "#doctype", name: doctype.name};
}

function inspectDocumentFragment(fragment: DocumentFragment): DocumentFragmentInspection {
  return {type: "#document-fragment", children: iterateChildNodes(fragment)};
}

function* iterateAttributes(element: Element): Generator<AttributeInspection> {
  for (const attribute of element.attributes) {
    yield inspectAttribute(attribute);
  }
}

function* iterateChildNodes(node: Node): Generator<ChildNodeInspection> {
  for (const child of node.childNodes) {
    yield inspectNode(child);
  }
}

/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable no-cond-assign */
function inspectFunction(f: Function): FunctionInspection | ClassInspection {
  const s = functionToString.call(f);

  // A class, possibly named.
  // class Name
  if (/^class\b/.test(s)) return {type: "class", name: f.name};

  let async = false;
  let generator = false;
  switch (f.constructor && f.constructor.name) {
    case "AsyncFunction":
      async = true;
      break;
    case "AsyncGeneratorFunction":
      async = generator = true;
      break;
    case "GeneratorFunction":
      generator = true;
      break;
  }

  let match: RegExpExecArray | null;

  // An arrow function with a single argument?
  // foo =>
  // async foo =>
  const args = (match = reArrowSingleArgument.exec(s))
    ? [match[1]]
    : // An arrow function with parenthesized arguments>
      // (…)
      // async (…)
      (match = reArrowParens.exec(s))
      ? match[1]
        ? match[1].split(/\s*,\s*/g)
        : []
      : // A function, possibly: async, generator, anonymous, simple arguments?
        // function name(…)
        // function* name(…)
        // async function name(…)
        // async function* name(…)
        (match = reFunction.exec(s))
        ? match[1]
          ? match[1].split(/\s*,\s*/g)
          : []
        : undefined;

  return {type: "function", async, generator, name: f.name, arguments: args};
}
/* eslint-enable @typescript-eslint/no-unsafe-function-type */
/* eslint-enable no-cond-assign */

function inspectObject(object: object): ObjectInspection {
  return {
    type: "object",
    tag: tagof(object, "Object"),
    children: iterateObject(object)
  };
}

function inspectMap(map: Map<unknown, unknown>): MapInspection {
  return {
    type: "map",
    size: map.size,
    tag: tagof(map, "Map"),
    children: iterateMap(map)
  };
}

function inspectSet(set: Set<unknown>): SetInspection {
  return {
    type: "set",
    size: set.size,
    tag: tagof(set, "Set"),
    children: iterateSet(set)
  };
}

function inspectArray(array: ArrayLike<unknown>): ArrayInspection {
  return {
    type: "array",
    length: array.length,
    tag: tagof(array, "Array"),
    children: iterateArray(array)
  };
}

function inspectArrowTable(table: Arrow.Table): ArrowTableInspection {
  return {
    type: "arrow-table",
    numRows: table.numRows,
    numCols: table.numCols,
    schema: inspect(table.schema), // skipped in iterateArrowTable
    children: iterateArrowTable(table)
  };
}

function tagof(object: object, defaultTag: string): string {
  const tag = object.constructor?.name || (object as {[toStringTag]?: string})[toStringTag];
  return tag || defaultTag;
}

function* iterateSymbols(object: object): Generator<ObjectSymbolInspection> {
  for (const symbol of getOwnPropertySymbols(object)) {
    yield ["symbol", symbol, inspect(valueof(object, symbol))];
  }
}

function* iterateObject(
  object: object,
  filter: (key: string) => boolean = () => true
): Generator<ObjectChildInspection> {
  for (const key in object) {
    if (hasOwnProperty.call(object, key) && filter(key)) {
      yield ["property", key, inspect(valueof(object, key))];
    }
  }
  yield* iterateSymbols(object);
}

function* iterateArray(array: ArrayLike<unknown>): Generator<ArrayChildInspection> {
  let i0 = -1;
  let i1 = 0;
  for (const n = array.length; i1 < n; ++i1) {
    if (i1 in array) {
      if (i1 > i0 + 1) yield ["empty", i1 - i0 - 1];
      yield ["entry", inspect(valueof(array, i1))];
      i0 = i1;
    }
  }
  if (i1 > i0 + 1) yield ["empty", i1 - i0 - 1];
  yield* iterateObject(array, (key) => !isArrayIndex(key));
}

function* iterateMap(map: Map<unknown, unknown>): Generator<MapChildInspection> {
  for (const [key, value] of map) {
    yield ["entry", inspect(key), inspect(value)];
  }
  yield* iterateObject(map);
}

function* iterateSet(set: Set<unknown>): Generator<SetChildInspection> {
  for (const value of set) {
    yield ["entry", inspect(value)];
  }
  yield* iterateObject(set);
}

function* iterateArrowTable(table: Arrow.Table): Generator<ArrayChildInspection> {
  const {fields} = table.schema;
  const columns = fields.map((_, j) => table.getChildAt(j));
  for (let i = 0, n = table.numRows; i < n; ++i) {
    yield ["entry", {type: "object", tag: "Object", children: iterateArrowRow(fields, columns, i)}];
  }
  yield* iterateObject(
    table,
    (key) =>
      key !== "schema" && // lifted in inspectArrowTable
      key !== "batches" && // ignore
      !key.startsWith("_") // ignore _offsets, etc.
  );
}

// Rows are read cell-by-cell rather than by iterating over the table, since
// extracting a row throws if any of its values can’t be extracted (such as a
// Flechette Int64 that exceeds Number.MAX_SAFE_INTEGER).
function* iterateArrowRow(
  fields: Arrow.Field[],
  columns: (Arrow.Vector | null)[],
  i: number
): Generator<ObjectChildInspection> {
  for (let j = 0; j < fields.length; ++j) {
    yield ["property", fields[j].name, inspect(getArrowCell(columns[j], i))];
  }
}

function isSet(object: unknown): object is Set<unknown> {
  return object instanceof Set && object instanceof object.constructor;
}

function isMap(object: unknown): object is Map<unknown, unknown> {
  return object instanceof Map && object instanceof object.constructor;
}

function isArray(value: unknown): value is ArrayLike<unknown> {
  return Array.isArray(value) || (ArrayBuffer.isView(value) && !(value instanceof DataView));
}

// Non-integer keys in arrays, e.g. [1, 2, 0.5: "value"].
function isArrayIndex(key: string): boolean {
  return key === (Number(key) | 0) + "";
}

function valueof(object: object, key: string | symbol | number): unknown {
  try {
    const value = key in object ? (object as {[key in typeof key]: unknown})[key] : undefined;
    value?.constructor; // eslint-disable-line @typescript-eslint/no-unused-expressions -- test SecurityError
    return value;
  } catch {
    return FORBIDDEN;
  }
}
