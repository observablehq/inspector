import dispatch from "./dispatch";
import {inspect} from "./inspect";

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
