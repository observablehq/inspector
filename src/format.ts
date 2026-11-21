import {format as isoformat} from "isoformat";
import type {Inspection} from "./inspect.js";
import {peek} from "./peek.js";

const regExpToString = RegExp.prototype.toString;
const errorToString = Error.prototype.toString;

function formatSymbol(symbol: symbol, maxLength: number): string {
  return `Symbol(${truncateString(symbol.description ?? "", maxLength - 8)})`;
}

export function formatNumber(number: number): string {
  return number === 0 && 1 / number < 0 ? "-0" : String(number);
}

function formatBigInt(bigint: bigint, maxLength: number): string {
  return truncateString(`${bigint}n`, maxLength);
}

function formatDate(date: Date): string {
  return isoformat(date, "Invalid Date");
}

function formatRegExp(regexp: RegExp, maxLength: number): string {
  return truncateString(regExpToString.call(regexp), maxLength);
}

function formatError(error: Error, maxLength: number): string {
  return truncateString(errorToString.call(error), maxLength); // TODO error.stack?
}

function formatFunction(f: Inspection & {type: "function"}, maxLength: number): string {
  let s = `${f.async ? "async " : ""}ƒ${f.generator ? "*" : ""}(`;
  if (f.arguments) {
    maxLength -= s.length + 1;
    let first = true;
    for (let a of f.arguments) {
      if (maxLength > 0) {
        if (first) first = false;
        else a = ", " + a;
        maxLength -= a.length;
        s += a;
      } else {
        s += first ? "…" : ", …";
        break;
      }
    }
  } else {
    s += "…";
  }
  s += ")";
  return s;
}

function formatString(string: string, maxChars: number): string {
  return JSON.stringify(truncateString(string, maxChars));
}

export type StringFormat =
  | {value: string; truncated?: false}
  | {value: string; truncated: true}
  | {value: string; truncated: true; lines: number};

export function formatStringLines(string: string, maxLines = Infinity): StringFormat {
  // String has fewer escapes displayed with double quotes?
  if (count(string, /["\n]/g) <= count(string, /`|\${/g)) {
    return {value: JSON.stringify(string)};
  }
  // String has many lines?
  if (maxLines < Infinity) {
    const lines = string.split("\n");
    if (lines.length > maxLines) {
      const value = "`" + templatify(lines.slice(0, maxLines).join("\n"));
      return {value, lines: lines.length, truncated: true};
    }
  }
  return {value: "`" + templatify(string) + "`"};
}

function templatify(string: string): string {
  // eslint-disable-next-line no-control-regex
  return string.replace(/[\\`\x00-\x09\x0b-\x19]|\${/g, templatifyChar);
}

function templatifyChar(char: string): string {
  const code = char.charCodeAt(0);
  switch (code) {
    case 0x8:
      return "\\b";
    case 0x9:
      return "\\t";
    case 0xb:
      return "\\v";
    case 0xc:
      return "\\f";
    case 0xd:
      return "\\r";
  }
  return code < 0x10
    ? "\\x0" + code.toString(16)
    : code < 0x20
      ? "\\x" + code.toString(16)
      : "\\" + char;
}

function count(string: string, re: RegExp): number {
  let n = 0;
  while (re.exec(string)) ++n;
  return n;
}

const MIN_LENGTH = 8;

export function truncateString(string: string, maxLength = Infinity): string {
  if (!(maxLength > MIN_LENGTH)) maxLength = MIN_LENGTH;
  const n = string.length;
  if (n > maxLength) {
    const l = Math.max(0, Math.floor(maxLength / 2));
    const r = n - l + 1;
    return `${string.slice(0, l)}…${string.slice(r, n)}`;
  }
  return string;
}

export function format(inspection: Inspection, maxLength = Infinity): string {
  switch (inspection.type) {
    case "null":
    case "undefined":
    case "class":
    case "forbidden":
    case "#node":
    case "#document":
    case "#document-fragment":
      return inspection.type;
    case "boolean":
      return String(inspection.value);
    case "date":
      return formatDate(inspection.value);
    case "regexp":
      return formatRegExp(inspection.value, maxLength);
    case "number":
      return formatNumber(inspection.value);
    case "symbol":
      return formatSymbol(inspection.value, maxLength);
    case "bigint":
      return formatBigInt(inspection.value, maxLength);
    case "function":
      return formatFunction(inspection, maxLength);
    case "string":
      return formatString(inspection.value, maxLength);
    case "array":
      return formatArray(inspection, maxLength);
    case "object":
      return formatObject(inspection, maxLength);
    case "arrow-table":
      return formatArrow(inspection, maxLength);
    case "map":
      return formatMap(inspection, maxLength);
    case "set":
      return formatSet(inspection, maxLength);
    case "error":
      return formatError(inspection.value, maxLength);
    case "#element":
      return formatElement(inspection, maxLength);
    case "#text":
      return truncateString(inspection.value ?? "", maxLength);
    case "#comment":
      return formatComment(inspection, maxLength);
    case "#doctype":
      return formatDoctype(inspection);
    case "#attribute":
      return formatAttribute(inspection, maxLength);
  }
  throw new Error(`unknown inspection type: ${inspection["type"]}`);
}

function formatArray(inspection: Inspection & {type: "array"}, maxLength: number): string {
  const l = `${inspection.tag === "Array" && inspection.length < 20 ? "" : `${inspection.tag}(${inspection.length}) `}[`;
  const r = "]";
  return l + formatChildren(inspection, formatArrayChild, maxLength - l.length - r.length) + r;
}

function formatObject(inspection: Inspection & {type: "object"}, maxLength: number): string {
  const l = `${inspection.tag === "Object" ? "" : `${inspection.tag} `}{`;
  const r = "}";
  return l + formatChildren(inspection, formatObjectChild, maxLength - l.length - r.length) + r;
}

function formatArrow(inspection: Inspection & {type: "arrow-table"}, maxLength: number): string {
  const l = `Arrow.Table(${inspection.numRows} × ${inspection.numCols}) [`;
  maxLength -= l.length;
  const r = `schema: ${format(inspection.schema, maxLength / 2)}]`;
  let c = formatChildren(inspection, formatArrayChild, maxLength - r.length);
  if (c) c += " ";
  return l + c + r;
}

function formatMap(inspection: Inspection & {type: "map"}, maxLength: number): string {
  const l = `${inspection.tag}(${inspection.size}) {`;
  const r = "}";
  return l + formatChildren(inspection, formatMapChild, maxLength - l.length - r.length) + r;
}

function formatSet(inspection: Inspection & {type: "set"}, maxLength: number): string {
  const l = `${inspection.tag}(${inspection.size}) {`;
  const r = "}";
  return l + formatChildren(inspection, formatSetChild, maxLength - l.length - r.length) + r;
}

function formatElement(inspection: Inspection & {type: "#element"}, maxLength: number): string {
  let l = `<${inspection.tag}`;
  maxLength -= l.length + 1;
  const [{length: numAttributes}, attributes] = peek(inspection.attributes, 2);
  const [{length: numChildren}, children] = peek(inspection.children, 2);
  const maxChildLength = numAttributes + numChildren > 1 ? Math.floor(maxLength / 2) : maxLength; // prettier-ignore
  const maxAttrLength = Math.min(maxChildLength, 200); // truncate long attributes
  let nextAttr: IteratorResult<ElementType<typeof attributes>>;
  while (!(nextAttr = attributes.next()).done && maxLength > 0) {
    const child = " " + format(nextAttr.value, Math.min(maxLength, maxAttrLength));
    maxLength -= child.length;
    l += child;
  }
  if (!nextAttr.done) l += " …";
  l += ">";
  let c = "";
  let nextChild: IteratorResult<ElementType<typeof children>>;
  while (!(nextChild = children.next()).done && maxLength > 0) {
    const child = format(nextChild.value, Math.min(maxLength, maxChildLength));
    maxLength -= child.length;
    c += child;
  }
  if (!nextChild.done) c += "…";
  const r = `</${inspection.tag}>`;
  return l + c + r;
}

function formatComment(inspection: Inspection & {type: "#comment"}, maxLength: number): string {
  return `<!--${truncateString(inspection.value ?? "", maxLength - 7)}-->`;
}

function formatDoctype(inspection: Inspection & {type: "#doctype"}): string {
  return `<!doctype ${inspection.name}>`;
}

function formatAttribute(inspection: Inspection & {type: "#attribute"}, maxLength: number): string {
  const {name, value} = inspection;
  let a = name;
  if (value) a += `=${quoteAttribute(truncateString(value, maxLength - name.length - 1))}`;
  return a;
}

function quoteAttribute(value: string): string {
  return /[\s>&]/.test(value) ? `"${value.replace(/["&]/g, entity)}"` : value;
}

type ElementType<T> = T extends Iterator<infer E> ? E : never;

function formatChildren<T>(
  {children}: {children: Generator<T>},
  formatChild: (child: T, maxLength: number) => string,
  maxLength: number
): string {
  let string = "";
  let next: IteratorResult<T>;
  let first = true;
  const [{length: numChildren}, rechildren] = peek(children, 2);
  const maxChildLength = numChildren > 1 ? Math.floor(maxLength / 2) : maxLength; // don’t let any child be more than half
  while (!(next = rechildren.next()).done && maxLength > 0) {
    let child = formatChild(next.value, Math.min(maxLength, maxChildLength));
    if (first) first = false;
    else child = ", " + child;
    maxLength -= child.length;
    string += child;
  }
  if (!next.done) {
    string += first ? "…" : ", …";
  }
  return string;
}

function formatSetChild(
  child: ElementType<(Inspection & {type: "set"})["children"]>,
  maxLength: number
): string {
  switch (child[0]) {
    case "entry":
      return format(child[1], maxLength);
    default:
      return formatObjectChild(child, maxLength);
  }
}

function formatMapChild(
  child: ElementType<(Inspection & {type: "map"})["children"]>,
  maxLength: number
): string {
  switch (child[0]) {
    case "entry": {
      const key = format(child[1], maxLength);
      const value = format(child[2], maxLength - key.length - 4);
      return `${key} => ${value}`;
    }
    default:
      return formatObjectChild(child, maxLength);
  }
}

function formatArrayChild(
  child: ElementType<(Inspection & {type: "array"})["children"]>,
  maxLength: number
): string {
  switch (child[0]) {
    case "entry":
      return format(child[1], maxLength);
    case "empty":
      return `empty × ${child[1]}`;
    default:
      return formatObjectChild(child, maxLength);
  }
}

function formatObjectChild(
  child: ElementType<(Inspection & {type: "object"})["children"]>,
  maxLength: number
): string {
  let key: string;
  switch (child[0]) {
    case "property":
      key = quoteProperty(child[1]);
      break;
    case "symbol":
      key = formatSymbol(child[1], maxLength);
      break;
  }
  return `${key}: ${format(child[2], maxLength - key.length)}`;
}

export function quoteProperty(property: string): string {
  return /^\w+$/.test(property) ? property : JSON.stringify(property);
}

function entity(character: string): string {
  return `&#${character.charCodeAt(0).toString()};`;
}
