import dispatch from "./dispatch.js";
import {inspect} from "./inspect.js";
import inspectName from "./inspectName.js";

const LOCATION_MATCH = /\s+\(\d+:\d+\)$/m;

export class Inspector {
  constructor(node) {
    if (!node) throw new Error("invalid node");
    this._node = node;
    node.classList.add("observablehq");
  }
  pending() {
    const {_node} = this;
    _node.classList.remove("observablehq--error");
    _node.classList.add("observablehq--running");
  }
  fulfilled(value, name) {
    const {_node} = this;
    if (!(value instanceof Element || value instanceof Text) || (value.parentNode && value.parentNode !== _node)) {
      value = inspect(value, false, _node.firstChild // TODO Do this better.
          && _node.firstChild.classList
          && _node.firstChild.classList.contains("observablehq--expanded"), name);
      value.classList.add("observablehq--inspect");
    }
    _node.classList.remove("observablehq--running", "observablehq--error");
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
  rejected(error, name) {
    const {_node} = this;
    _node.classList.remove("observablehq--running");
    _node.classList.add("observablehq--error");
    while (_node.lastChild) _node.removeChild(_node.lastChild);
    var div = document.createElement("div");
    div.className = "observablehq--inspect";
    if (name) div.appendChild(inspectName(name));
    div.appendChild(document.createTextNode((error + "").replace(LOCATION_MATCH, "")));
    _node.appendChild(div);
    dispatch(_node, "error", {error: error});
  }
}

Inspector.into = function(container) {
  if (typeof container === "string") {
    container = document.querySelector(container);
    if (container == null) throw new Error("container not found");
  }
  return function() {
    return new Inspector(container.appendChild(document.createElement("div")));
  };
};
