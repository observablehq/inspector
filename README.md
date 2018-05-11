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

Or:

```js
runtime.load(notebook, library, (variable) => {
  const div = document.createElement("div");
  document.body.appendChild(div);
  return new Inspector(div);
});
```

The Inspector implements the [notebook-runtime](https://github.com/observablehq/notebook-runtime)’s *observer* interface by exposing **pending**, **fulfilled** and **rejected** methods, which are called by the runtime whenever the inspected variable is being evaluated; has been evaluated successfully, producing a value; or has failed to evaluate, producing an error.

<a href="#inspector_pending" name="inspector_pending">#</a> *inspector*.**pending**()

Called whenever the variable associated with this inspector is being evaluated. The variable may resolve synchronously or asynchronously — so the inspector is considered to be in a *pending* state until either **fulfilled** or **rejected** is subsequently called. While *pending*, this inspector adds an `Observable--running` class to the associated DOM node.

<a href="#inspector_fulfilled" name="inspector_fulfilled">#</a> *inspector*.**fulfilled**(value)

Called whenever the variable associated with this inspector has been evaluated successfully, producing a new value. This Inspector will insert Elements into the DOM, and build expandable inspectors for other JavaScript values.

<a href="#inspector_rejected" name="inspector_rejected">#</a> *inspector*.**rejected**(error)

Called whenever the variable associated with this inspector has failed to evaluate, producing an error. This inspector inserts the content of the error object into the DOM.
