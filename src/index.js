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

export class Inspector {
  constructor(node) {
    this._node = node;
  }

  pending() {
    const {_node} = this;
    if (!_node) return;
    _node.classList.add("O--running");
  }

  fulfilled(value) {
    const {_node} = this;
    if (!_node) return;
    if (!(value instanceof Element || value instanceof Text) || (value.parentNode && value.parentNode !== _node)) {
      value = inspect(value, false, _node.firstChild // TODO Do this better.
          && _node.firstChild.classList
          && _node.firstChild.classList.contains("O--expanded"));
      value.classList.add("O--inspect");
    }
    _node.className = "O";
    if (_node.firstChild !== value) {
      if (_node.firstChild) {
        while (_node.lastChild !== _node.firstChild) _node.removeChild(_node.lastChild);
        _node.replaceChild(value, _node.firstChild);
      } else {
        _node.appendChild(value);
      }
    }
    dispatch(_node, "update");
  }

  rejected(error) {
    const {_node} = this;
    if (!_node) return;
    _node.className = "O O--error";
    while (_node.lastChild) _node.removeChild(_node.lastChild);
    var span = document.createElement("span");
    span.className = "O--inspect";
    span.textContent = (error + "").replace(LOCATION_MATCH, "");
    _node.appendChild(span);
    dispatch(_node, "error", {error: error});
  }
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
