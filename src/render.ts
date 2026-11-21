import {dispatch, renderName} from "./dom.js";
import {format, formatStringLines, quoteProperty} from "./format.js";
import type {Inspection} from "./inspect.js";

export type RenderOptions = {
  /** If present, the name to show before the value, as in “name = value”. */
  name?: string;
  /** If true, objects are initially expanded and long strings show all lines. */
  expanded?: boolean;
};

type Mode = "shallow" | "collapsed" | "expanded";
type ContainerInspection = Extract<Inspection, {children: unknown}>;
type ValueInspection = Exclude<Inspection, ContainerInspection>;
type ElementType<T> = T extends Iterator<infer E> ? E : never;
type Child = ElementType<ContainerInspection["children"]>;

type Container = {
  label: string; // shown when shallow, e.g. "Array(3)"
  open: string; // shown before children, e.g. "Array(3) ["
  close: string; // shown after children, e.g. "]"
  separator: string; // shown between collapsed children, e.g. ", "
  indexed: boolean; // whether to show indexes for entries when expanded
  children: () => Generator<Child>;
};

const MAX_FIELDS = 20; // children shown before truncating (or per “more”)
const MAX_LINES = 20; // lines shown before truncating a collapsed string
const MAX_SHALLOW_LENGTH = 100; // characters shown for nested values

const CARET_COLLAPSED = `<svg width=8 height=8 class='observablehq--caret'>
    <path d='M7 4L1 8V0z' fill='currentColor' />
  </svg>`;

const CARET_EXPANDED = `<svg width=8 height=8 class='observablehq--caret'>
    <path d='M4 7L0 1h8z' fill='currentColor' />
  </svg>`;

/**
 * Renders the given inspection as an interactive DOM element. Objects can be
 * expanded and collapsed by clicking, and long strings can be expanded to show
 * all lines. The inspection’s children are consumed lazily as needed, so the
 * given inspection should not be consumed by anything else (such as format).
 */
export function render(
  inspection: Inspection,
  {name, expanded = false}: RenderOptions = {}
): HTMLElement {
  return renderInspection(inspection, expanded ? "expanded" : "collapsed", name);
}

function renderInspection(inspection: Inspection, mode: Mode, name?: string): HTMLElement {
  return "children" in inspection
    ? renderContainer(inspection, mode, name)
    : renderValue(inspection, mode, name);
}

// Renders a value nested within an expanded object. Objects are collapsed (but
// not shallow), whereas strings are shown on one line, possibly truncated.
function renderNested(inspection: Inspection): HTMLElement {
  return renderInspection(inspection, inspection.type === "string" ? "shallow" : "collapsed");
}

function renderValue(inspection: ValueInspection, mode: Mode, name?: string): HTMLElement {
  switch (inspection.type) {
    case "class":
    case "function":
      return renderFunction(inspection, name);
    case "string":
      return renderString(inspection.value, mode, name);
    case "error":
      if (mode !== "shallow" && inspection.value.stack) {
        return renderText("error", inspection.value.stack, name);
      }
      break;
  }
  const className = inspection.type.replace(/^#/, "");
  const maxLength = mode === "shallow" ? MAX_SHALLOW_LENGTH : Infinity;
  return renderText(className, format(inspection, maxLength), name);
}

function renderText(className: string, text: string, name?: string): HTMLElement {
  const span = document.createElement("span");
  if (name) span.appendChild(renderName(name));
  const value = span.appendChild(document.createElement("span"));
  value.className = `observablehq--${className}`;
  value.textContent = text;
  return span;
}

function renderFunction(
  inspection: Inspection & {type: "class" | "function"},
  name?: string
): HTMLElement {
  const span = document.createElement("span");
  span.className = "observablehq--function";
  if (name) span.appendChild(renderName(name));
  const keyword = span.appendChild(document.createElement("span"));
  keyword.className = "observablehq--keyword";
  if (inspection.type === "class") {
    keyword.textContent = "class";
  } else {
    const {async, generator, arguments: args} = inspection;
    keyword.textContent = `${async ? "async " : ""}ƒ${generator ? "*" : ""}`;
    span.appendChild(document.createTextNode(`(${args ? args.join(", ") : "…"})`));
  }
  return span;
}

function renderString(value: string, mode: Mode, name?: string): HTMLElement {
  if (mode === "shallow") {
    return renderText("string", format({type: "string", value}, MAX_SHALLOW_LENGTH), name);
  }
  const string = formatStringLines(value, mode === "expanded" ? Infinity : MAX_LINES);
  if ("lines" in string) {
    const div = document.createElement("div");
    if (name) div.appendChild(renderName(name));
    const text = div.appendChild(document.createElement("span"));
    text.className = "observablehq--string";
    text.textContent = string.value;
    const expand = div.appendChild(document.createElement("span"));
    const n = string.lines - MAX_LINES;
    expand.className = "observablehq--string-expand";
    expand.textContent = `Show ${n} truncated line${n > 1 ? "s" : ""}`;
    expand.addEventListener("mouseup", (event) => {
      event.stopPropagation();
      replace(div, renderString(value, "expanded", name));
    });
    return div;
  }
  const span = renderText("string", string.value, name);
  if (mode === "expanded" && string.value.startsWith("`")) {
    span.lastElementChild!.classList.add("observablehq--expanded");
  }
  return span;
}

function renderContainer(inspection: ContainerInspection, mode: Mode, name?: string): HTMLElement {
  const container = describe(inspection);
  const span = document.createElement("span");

  if (mode === "shallow") {
    span.className = "observablehq--shallow";
    if (name) span.appendChild(renderName(name));
    span.appendChild(document.createTextNode(container.label));
    span.addEventListener("mouseup", (event) => {
      if (hasSelection(span)) return;
      event.stopPropagation();
      replace(span, renderContainer(inspection, "collapsed"));
    });
    return span;
  }

  span.className = `observablehq--${mode}`;
  if (name) span.appendChild(renderName(name));
  const a = span.appendChild(document.createElement("a"));
  a.innerHTML = mode === "expanded" ? CARET_EXPANDED : CARET_COLLAPSED;
  a.appendChild(document.createTextNode(container.open));

  if (mode === "collapsed") {
    span.addEventListener(
      "mouseup",
      (event) => {
        if (hasSelection(span)) return;
        event.stopPropagation();
        replace(span, renderContainer(inspection, "expanded", name));
      },
      true
    );
    const children = container.children();
    let next: IteratorResult<Child>;
    for (let i = 0; !(next = children.next()).done && i < MAX_FIELDS; ++i) {
      if (i > 0) span.appendChild(document.createTextNode(container.separator));
      span.appendChild(renderCollapsedChild(next.value));
    }
    if (!next.done) span.appendChild(document.createTextNode(`${container.separator}…`));
  } else {
    a.addEventListener("mouseup", (event) => {
      event.stopPropagation();
      replace(span, renderContainer(inspection, "collapsed", name));
    });
    const fields = renderFields(container);
    let next: IteratorResult<HTMLElement>;
    for (let i = 0; !(next = fields.next()).done && i < MAX_FIELDS; ++i) {
      span.appendChild(next.value);
    }
    if (!next.done) {
      const more = span.appendChild(document.createElement("a"));
      more.className = "observablehq--field";
      more.style.display = "block";
      more.appendChild(document.createTextNode("  … more"));
      more.addEventListener("mouseup", (event) => {
        event.stopPropagation();
        span.insertBefore(next.value as HTMLElement, more);
        for (let i = 1; !(next = fields.next()).done && i < MAX_FIELDS; ++i) {
          span.insertBefore(next.value, more);
        }
        if (next.done) more.remove();
        dispatch(span, "load");
      });
    }
  }

  span.appendChild(document.createTextNode(container.close));
  return span;
}

function describe(inspection: ContainerInspection): Container {
  const children = () => replay<Child>(inspection.children);
  switch (inspection.type) {
    case "object":
      return brackets(inspection.tag, "{", "}", children);
    case "array":
      return brackets(`${inspection.tag}(${inspection.length})`, "[", "]", children, true);
    case "map":
    case "set":
      return brackets(`${inspection.tag}(${inspection.size})`, "{", "}", children);
    case "arrow-table":
      return brackets(
        `Arrow.Table(${inspection.numRows} × ${inspection.numCols})`,
        "[",
        "]",
        function* () {
          yield* children();
          yield ["property", "schema", inspection.schema] as const;
        },
        true
      );
    case "#element": {
      let open = `<${inspection.tag}`;
      for (const attribute of replay(inspection.attributes)) {
        open += ` ${format(attribute, MAX_SHALLOW_LENGTH)}`;
      }
      open += ">";
      const close = `</${inspection.tag}>`;
      const empty = children().next().done;
      return {
        label: `${open}${empty ? "" : "…"}${close}`,
        open,
        close,
        separator: "",
        indexed: false,
        children
      };
    }
    default:
      return brackets(inspection.type, "[", "]", children);
  }
}

function brackets(
  label: string,
  open: string,
  close: string,
  children: () => Generator<Child>,
  indexed = false
): Container {
  return {label, open: `${label} ${open}`, close, separator: ", ", indexed, children};
}

function renderCollapsedChild(child: Child): Node {
  if ("type" in child) return renderInspection(child, "shallow");
  switch (child[0]) {
    case "empty":
      return renderEmpty(child[1]);
    case "entry":
      return child.length === 2
        ? renderInspection(child[1], "shallow")
        : fragment(
            renderInspection(child[1], "shallow"),
            " => ",
            renderInspection(child[2], "shallow")
          );
    case "property":
      return fragment(
        renderKey("key", quoteProperty(child[1])),
        ": ",
        renderInspection(child[2], "shallow")
      );
    case "symbol":
      return fragment(
        renderKey("symbol", format({type: "symbol", value: child[1]})),
        ": ",
        renderInspection(child[2], "shallow")
      );
  }
}

function* renderFields({children, indexed}: Container): Generator<HTMLElement> {
  let index = 0;
  for (const child of children()) {
    if ("type" in child) {
      yield renderField("  ", renderNested(child));
      continue;
    }
    switch (child[0]) {
      case "empty":
        index += child[1];
        break;
      case "entry":
        if (child.length === 3) {
          yield renderField("  ", renderNested(child[1]), " => ", renderNested(child[2]));
        } else if (indexed) {
          yield renderField(renderKey("index", `  ${index++}`), ": ", renderNested(child[1]));
        } else {
          yield renderField("  ", renderNested(child[1]));
        }
        break;
      case "property":
        yield renderField(
          renderKey("key", `  ${quoteProperty(child[1])}`),
          ": ",
          renderNested(child[2])
        );
        break;
      case "symbol":
        yield renderField(
          renderKey("symbol", `  ${format({type: "symbol", value: child[1]})}`),
          ": ",
          renderNested(child[2])
        );
        break;
    }
  }
}

function renderField(...children: (Node | string)[]): HTMLElement {
  const div = document.createElement("div");
  div.className = "observablehq--field";
  div.append(...children);
  return div;
}

function renderKey(className: string, key: string): HTMLElement {
  const span = document.createElement("span");
  span.className = `observablehq--${className}`;
  span.textContent = key;
  return span;
}

function renderEmpty(length: number): HTMLElement {
  const span = document.createElement("span");
  span.className = "observablehq--empty";
  span.textContent = length === 1 ? "empty" : `empty × ${length}`;
  return span;
}

function fragment(...children: (Node | string)[]): DocumentFragment {
  const fragment = document.createDocumentFragment();
  fragment.append(...children);
  return fragment;
}

function replace(oldElement: Element, newElement: Element): void {
  if (oldElement.classList.contains("observablehq--inspect")) {
    newElement.classList.add("observablehq--inspect");
  }
  oldElement.replaceWith(newElement);
  dispatch(newElement, "load");
}

function hasSelection(element: Element): boolean {
  const selection = window.getSelection();
  return (
    selection?.type === "Range" &&
    (selection.containsNode(element, true) ||
      element.contains(selection.anchorNode) ||
      element.contains(selection.focusNode))
  );
}

type Replay = {values: unknown[]; done: boolean};

const replays = new WeakMap<Iterator<unknown>, Replay>();

/**
 * Returns a new generator that yields the same values as the given source
 * iterator, such that the source can be iterated multiple times. Values are
 * pulled from the source lazily, and cached for subsequent iterations.
 */
function* replay<T>(source: Iterator<T>): Generator<T, void, undefined> {
  let state = replays.get(source);
  if (!state) replays.set(source, (state = {values: [], done: false}));
  for (let i = 0; ; ++i) {
    if (i < state.values.length) {
      yield state.values[i] as T;
    } else if (state.done) {
      return;
    } else {
      const next = source.next();
      if (next.done) {
        state.done = true;
        return;
      }
      state.values.push(next.value);
      yield next.value;
    }
  }
}
