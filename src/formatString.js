import {inspect, replace} from "./inspect.js";

/* eslint-disable no-control-regex */
const NEWLINE_LIMIT = 20;

export default function formatString(string, full, expanded) {
  if (full && count(string, /["\n]/g) <= count(string, /`|\${/g)) {
    const span = document.createElement("span");
    span.className = "observablehq--string";
    span.textContent = JSON.stringify(string);
    return span;
  }

  if (full) {
    const lines = string.split('\n');
    if (lines.length > NEWLINE_LIMIT && !expanded) {
      const div = document.createElement("div");
      const span = div.appendChild(document.createElement('span'));
      const splitter = div.appendChild(document.createElement('span'));
      const truncatedCount = lines.length - NEWLINE_LIMIT;
      splitter.textContent = `Show ${truncatedCount} truncated line${truncatedCount > 1 ? 's': ''}`;
      splitter.className = "observablehq--string-expand";
      splitter.addEventListener("mouseup", function (event) {
        event.stopPropagation();
        replace(div, inspect(string, !full, true));
      });
      span.className = "observablehq--string";
      span.textContent = "`" + lines.slice(0, NEWLINE_LIMIT).join('\n');
      return div;
    }
    const span = document.createElement("span");
    span.className = "observablehq--string";
    span.textContent = "`" + templatify(string) + "`";
    return span;
  }

  const span = document.createElement("span");
  span.className = "observablehq--string";
  span.textContent = JSON.stringify(string.length > 100 ?
    `${string.slice(0, 50)}…${string.slice(-49)}` : string);
  return span;
}

function templatify(string) {
  return string.replace(/[\\`\x00-\x09\x0b-\x19]|\${/g, templatifyChar);
}

function templatifyChar(char) {
  var code = char.charCodeAt(0);
  return code < 0x10 ? "\\x0" + code.toString(16)
      : code < 0x20 ? "\\x" + code.toString(16)
      : "\\" + char;
}

function count(string, re) {
  var n = 0;
  while (re.exec(string)) ++n;
  return n;
}
