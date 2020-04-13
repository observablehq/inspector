import dispatch from "./dispatch.js";
import inspectName from "./inspectName.js";
import {isarray, isindex} from "./array.js";
import inspectCollapsed from "./collapsed.js";
import formatSymbol from "./formatSymbol.js";
import {inspect, replace} from "./inspect.js";
import {isown, symbolsof, tagof, valueof} from "./object.js";
import {immutableName} from "./immutable.js";

const {getPrototypeOf, getOwnPropertyDescriptors} = Object;
const objectPrototype = getPrototypeOf({});
const keysof = Object.keys;
const protokeysof = object => keysof(getOwnPropertyDescriptors(object));

export default function inspectExpanded(object, _, name, proto) {
  let arrayish = isarray(object);
  let tag, fields, next, n;

  if (typeof object === "function") {
    tag = `ƒ()`; // TODO
    fields = iterateFunction;
  } else if (object instanceof Map) {
    tag = `Map(${object.size})`;
    fields = iterateMap;
  } else if (object instanceof Set) {
    tag = `Set(${object.size})`;
    fields = iterateSet;
  } else if (arrayish) {
    tag = `${object.constructor.name}(${object.length})`;
    fields = iterateArray;
  } else if ((n = immutableName(object))) {
    tag = `Immutable.${n.name}${n.name === "Record" ? "" : `(${object.size})`}`;
    arrayish = n.arrayish;
    fields = n.arrayish
      ? iterateImArray
      : n.setish
      ? iterateImSet
      : iterateImObject;
  } else if (proto) {
    tag = tagof(object);
    fields = iterateProto;
  } else {
    tag = tagof(object);
    fields = iterateObject;
  }

  const span = document.createElement("span");
  span.className = "observablehq--expanded";
  if (name) {
    span.appendChild(inspectName(name));
  }
  const a = span.appendChild(document.createElement("a"));
  a.innerHTML = `<svg width=8 height=8 class='observablehq--caret'>
    <path d='M4 7L0 1h8z' fill='currentColor' />
  </svg>`;
  a.appendChild(document.createTextNode(`${tag}${arrayish ? " [" : " {"}`));
  a.addEventListener("mouseup", function(event) {
    event.stopPropagation();
    replace(span, inspectCollapsed(object, null, name, proto));
  });

  fields = fields(object);
  for (let i = 0; !(next = fields.next()).done && i < 20; ++i) {
    span.appendChild(next.value);
  }

  if (!next.done) {
    const a = span.appendChild(document.createElement("a"));
    a.className = "observablehq--field";
    a.style.display = "block";
    a.appendChild(document.createTextNode(`  … more`));
    a.addEventListener("mouseup", function(event) {
      event.stopPropagation();
      span.insertBefore(next.value, span.lastChild.previousSibling);
      for (let i = 0; !(next = fields.next()).done && i < 19; ++i) {
        span.insertBefore(next.value, span.lastChild.previousSibling);
      }
      if (next.done) span.removeChild(span.lastChild.previousSibling);
      dispatch(span, "load");
    });
  }

  span.appendChild(document.createTextNode(arrayish ? "]" : "}"));

  return span;
}

function* iterateMap(map) {
  for (const [key, value] of map) {
    yield formatMapField(key, value);
  }
  yield* iterateObject(map);
}

function* iterateSet(set) {
  for (const value of set) {
    yield formatSetField(value);
  }
  yield* iterateObject(set);
}

function* iterateImSet(set) {
  for (const value of set) {
    yield formatSetField(value);
  }
}

function* iterateArray(array) {
  for (let i = 0, n = array.length; i < n; ++i) {
    if (i in array) {
      yield formatField(i, valueof(array, i), "observablehq--index");
    }
  }
  for (const key in array) {
    if (!isindex(key) && isown(array, key)) {
      yield formatField(key, valueof(array, key), "observablehq--key");
    }
  }
  yield* iterateSymbols(array);
}

function* iterateImArray(array) {
  let i1 = 0;
  for (const n = array.size; i1 < n; ++i1) {
    yield formatField(i1, array.get(i1), true);
  }
}

function* iterateProto(object) {
  yield* iterateFields(object, protokeysof);
  yield* iterateSymbols(object);
  yield* iteratePrototypeOf(object);
}

function* iteratePrototypeOf(object) {
  const proto = getPrototypeOf(object);
  if (proto && proto !== objectPrototype) {
    yield formatField("<prototype>", proto, "observablehq--prototype-key", true);
  }
}

function* iterateFields(object, keysof) {
  for (const key of keysof(object)) {
    yield formatField(key, valueof(object, key), "observablehq--key");
  }
}

function* iterateSymbols(object) {
  for (const symbol of symbolsof(object)) {
    yield formatField(formatSymbol(symbol), valueof(object, symbol), "observablehq--symbol");
  }
}

function* iterateFunction(fun) {
  yield* iterateFields(fun, keysof);
  yield* iterateSymbols(fun);
  const proto = fun.prototype;
  if (proto) {
    yield formatField("prototype", proto, "observablehq--key", true);
  }
}

function* iterateObject(object) {
  yield* iterateFields(object, keysof);
  yield* iterateSymbols(object);
  yield* iteratePrototypeOf(object);
}

function* iterateImObject(object) {
  for (const [key, value] of object) {
    yield formatField(key, value, "observablehq--key");
  }
}

function formatField(key, value, className, proto) {
  const item = document.createElement("div");
  const span = item.appendChild(document.createElement("span"));
  item.className = "observablehq--field";
  span.className = className;
  span.textContent = `  ${key}`;
  item.appendChild(document.createTextNode(": "));
  item.appendChild(inspect(value, undefined, undefined, undefined, proto));
  return item;
}

function formatMapField(key, value) {
  const item = document.createElement("div");
  item.className = "observablehq--field";
  item.appendChild(document.createTextNode("  "));
  item.appendChild(inspect(key));
  item.appendChild(document.createTextNode(" => "));
  item.appendChild(inspect(value));
  return item;
}

function formatSetField(value) {
  const item = document.createElement("div");
  item.className = "observablehq--field";
  item.appendChild(document.createTextNode("  "));
  item.appendChild(inspect(value));
  return item;
}
