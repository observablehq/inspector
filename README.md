# @observablehq/notebook-inspector

This library implements the default value rendering implementation for Observable notebooks. When plugged in to the [notebook-runtime](https://github.com/observablehq/notebook-runtime), this inspector can be used to insert DOM elements into a webpage, or render an interactive object inspector for JavaScript values.

The **notebook-inspector** may be loaded from [npm](https://www.npmjs.com/package/@observablehq/notebook-inspector), or on the web, from unpkg, as an [ES module](https://unpkg.com/@observablehq/notebook-inspector/src/index.js?module) or as a [UMD script](https://unpkg.com/@observablehq/notebook-inspector/dist/notebook-inspector.js).

## API Reference

### Inspector

<a href="#Inspector" name="Inspector">#</a> new <b>Inspector</b>(element)

Creates an *Inspector* object that can be passed as an *observer* to the **notebook-runtime**, attached to the given DOM *element*. When the runtime receives values or errors for a variable that has been computed, the inspector is responsible for updating the DOM.

```js
runtime.load(notebook, library, (variable) => {
  const element = document.getElementById(variable.name);
  return new Inspector(element);
});
```
