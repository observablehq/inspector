import dispatch from "./dispatch";
import inspectCollapsed from "./collapsed";
import inspectExpanded from "./expanded";
import formatDate from "./formatDate";
import formatError from "./formatError";
import formatRegExp from "./formatRegExp";
import formatString from "./formatString";
import formatSymbol from "./formatSymbol";
import inspectFunction from "./inspectFunction";
import {FORBIDDEN} from "./object";

const {prototype: {toString}} = Object;

const LOCATION_MATCH = /\s+\(\d+:\d+\)$/m;

export function inspector(node) {
  return {
    pending: () => displayPending(node),
    fulfilled: (value) => displayValue(node, value),
    rejected: (error) => displayError(node, error)
  };
}

export function inspect(value, shallow, expand) {
  let type = typeof value;
  switch (type) {
    case "boolean":
    case "number":
    case "undefined": { value += ""; break; }
    case "string": { value = formatString(value, shallow === false); break; }
    case "symbol": { value = formatSymbol(value); break; }
    case "function": { return inspectFunction(value); }
    default: {
      if (value === null) { type = null, value = "null"; break; }
      if (value instanceof Date) { type = "date", value = formatDate(value); break; }
      if (value === FORBIDDEN) { type = "forbidden", value = "[forbidden]"; break; }
      switch (toString.call(value)) {
        case "[object RegExp]": { type = "regexp", value = formatRegExp(value); break; }
        case "[object Error]": // https://github.com/lodash/lodash/blob/master/isError.js#L26
        case "[object DOMException]": { type = "error", value = formatError(value); break; }
        default: return (expand ? inspectExpanded : inspectCollapsed)(value, shallow);
      }
      break;
    }
  }
  const span = document.createElement("span");
  span.className = `O--${type}`;
  span.textContent = value;
  return span;
}

export function replace(spanOld, spanNew) {
  if (spanOld.classList.contains("O--inspect")) spanNew.classList.add("O--inspect");
  spanOld.parentNode.replaceChild(spanNew, spanOld);
  dispatch(spanNew, "load");
}

export function displayPending(node) {
  if (!node) return;
  node.classList.add("O--running");
}

export function displayValue(node, value) {
  if (!node) return;
  if (!(value instanceof Element || value instanceof Text) || (value.parentNode && value.parentNode !== node)) {
    value = inspect(value, false, node.firstChild // TODO Do this better.
        && node.firstChild.classList
        && node.firstChild.classList.contains("O--expanded"));
    value.classList.add("O--inspect");
  }
  node.className = "O";
  if (node.firstChild !== value) {
    if (node.firstChild) {
      while (node.lastChild !== node.firstChild) node.removeChild(node.lastChild);
      node.replaceChild(value, node.firstChild);
    } else {
      node.appendChild(value);
    }
  }
  dispatch(node, "update");
}

export function displayError(node, error) {
  if (!node) return;
  node.className = "O O--error";
  while (node.lastChild) node.removeChild(node.lastChild);
  var span = document.createElement("span");
  span.className = "O--inspect";
  span.textContent = (error + "").replace(LOCATION_MATCH, "");
  node.appendChild(span);
  dispatch(node, "error", {error: error});
}
