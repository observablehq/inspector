export function dispatch(node: Node, type: string, detail: unknown = {}): void {
  const CustomEvent = node.ownerDocument?.defaultView?.CustomEvent ?? globalThis.CustomEvent;
  node.dispatchEvent(new CustomEvent(type, {detail}));
}

export function renderName(name: string): HTMLElement {
  const span = document.createElement("span");
  span.className = "observablehq--cellname";
  span.textContent = `${name} = `;
  return span;
}
