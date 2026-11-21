import {dispatch, renderName} from "./dom.js";
import {inspect} from "./inspect.js";
import {render} from "./render.js";

export type Inspected = Element & {__inspected: unknown};

const LOCATION_MATCH = /\s+\(\d+:\d+\)$/m;

export class Inspector {
  constructor(readonly _node: Element) {
    if (!_node) throw new Error("invalid node");
    _node.classList.add("observablehq");
  }
  pending() {
    const {_node} = this;
    _node.classList.remove("observablehq--error");
    _node.classList.add("observablehq--running");
  }
  fulfilled(value: unknown, name?: string) {
    const {_node} = this;
    let node: Node;
    if (isDisplayable(value) && (!value.parentNode || value.parentNode === _node)) {
      node = value;
    } else {
      const element = render(inspect(value), {
        name,
        expanded: (_node.firstChild as Element | null)?.classList?.contains("observablehq--expanded") // prettier-ignore
      });
      element.classList.add("observablehq--inspect");
      node = element;
    }
    _node.classList.remove("observablehq--running", "observablehq--error");
    if (_node.firstChild !== node) {
      if (_node.firstChild) {
        while (_node.lastChild !== _node.firstChild) _node.removeChild(_node.lastChild!);
        _node.replaceChild(node, _node.firstChild);
      } else {
        _node.appendChild(node);
      }
    }
    (_node as Inspected).__inspected = value;
    dispatch(_node, "update");
  }
  rejected(error: unknown, name?: string) {
    const {_node} = this;
    _node.classList.remove("observablehq--running");
    _node.classList.add("observablehq--error");
    while (_node.lastChild) _node.removeChild(_node.lastChild);
    const div = document.createElement("div");
    div.className = "observablehq--inspect";
    if (name) div.appendChild(renderName(name));
    div.appendChild(document.createTextNode(String(error).replace(LOCATION_MATCH, "")));
    _node.appendChild(div);
    (_node as Inspected).__inspected = error;
    dispatch(_node, "error", {error});
  }
}

export function isInspected(element: Element): element is Inspected {
  return "__inspected" in element;
}

// Returns true if the given value is something that should be added to the DOM
// by the inspector, rather than being inspected. This deliberately excludes
// DocumentFragment since appending a fragment “dissolves” (mutates) the
// fragment, and we wish for the inspector to not have side-effects. Also,
// HTMLElement.prototype is an instanceof Element, but not an element!
function isDisplayable(value: unknown): value is Element | Text {
  return (value instanceof Element || value instanceof Text) && value instanceof value.constructor;
}
