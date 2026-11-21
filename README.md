# @observablehq/inspector

[![Node CI](https://github.com/observablehq/inspector/workflows/Node%20CI/badge.svg)](https://github.com/observablehq/inspector/actions?workflow=Node+CI)

This library implements the default value renderer for Observable programs. When used with the [Observable runtime](https://github.com/observablehq/runtime) as [observers](https://github.com/observablehq/runtime/blob/main/README.md#observers), inspectors can insert elements into the DOM and render interactive displays for arbitrary values.

To install this library from [npm](https://www.npmjs.com/package/@observablehq/inspector):

```
npm install @observablehq/inspector
```

This library is also available for download [from unpkg](https://unpkg.com/@observablehq/inspector/) as an [ES module](https://unpkg.com/@observablehq/inspector?module) and as a [UMD bundle](https://unpkg.com/@observablehq/inspector/dist/inspector.js).

## API Reference

### Inspectors

An inspector implements the Observable runtime’s [*Observer* interface](https://github.com/observablehq/runtime/blob/main/README.md#observers) by rendering the current value of its associated [variable](https://github.com/observablehq/runtime/blob/main/README.md#variables) to a given DOM element. Inspectors display DOM elements “as-is”, and create interactive “devtools”-style inspectors for other arbitrary values such as numbers and objects.

<a href="#Inspector" name="Inspector">#</a> new **Inspector**(*element*) [<>](https://github.com/observablehq/inspector/blob/main/src/inspector.ts "Source")

Creates a new inspector attached to the specified DOM *element*.

<a href="#inspector_pending" name="inspector_pending">#</a> *inspector*.**pending**() [<>](https://github.com/observablehq/inspector/blob/main/src/inspector.ts "Source")

Applies the `observablehq--running` class to this inspector’s *element*.

<a href="#inspector_fulfilled" name="inspector_fulfilled">#</a> *inspector*.**fulfilled**(*value*, *name*) [<>](https://github.com/observablehq/inspector/blob/main/src/inspector.ts "Source")

Inspects the specified *value*, replacing the contents of this inspector’s *element* as appropriate, and dispatching an *update* event. If the specified *value* is a DOM element or text node, and the *value* is not already attached to the DOM, it is inserted into this inspector’s *element*, replacing any existing contents. Otherwise, for other arbitrary values such as numbers, arrays, or objects, an expandable display of the specified *value* is generated into this inspector’s *element*. Applies the `observablehq` class to this inspector’s *element*, and for non-element *value*s, the `observablehq--inspect` class.

<a href="#inspector_rejected" name="inspector_rejected">#</a> *inspector*.**rejected**(*error*, *name*) [<>](https://github.com/observablehq/inspector/blob/main/src/inspector.ts "Source")

Inspects the specified *error*, replacing the contents of this inspector’s *element* as appropriate with the error’s description, and dispatching an *error* event. Applies the `observablehq` and `observablehq--error` class to this inspector’s *element*.

<a href="#isInspected" name="isInspected">#</a> **isInspected**(*element*) [<>](https://github.com/observablehq/inspector/blob/main/src/inspector.ts "Source")

Returns true if the specified *element* is attached to an inspector that has been fulfilled or rejected; the last value or error is then available as *element*.\_\_inspected.

### Inspections

Inspection is separated from display: **inspect** describes a value, iterating lazily over its properties, and the resulting *inspection* can then be displayed either as text with **format** or as DOM with **render**. Inspections are consumed as they are displayed, so an *inspection* should be passed to only one of **format** or **render**.

<a href="#inspect" name="inspect">#</a> **inspect**(*value*) [<>](https://github.com/observablehq/inspector/blob/main/src/inspect.ts "Source")

Returns an *inspection* of the specified *value*.

<a href="#format" name="format">#</a> **format**(*inspection*, *maxLength*) [<>](https://github.com/observablehq/inspector/blob/main/src/format.ts "Source")

Returns a single-line textual representation of the specified *inspection*, such as `{a: 1, b: [1, 2, 3]}`, truncated (with an ellipsis) to approximately the specified *maxLength* characters, which defaults to infinity.

<a href="#render" name="render">#</a> **render**(*inspection*, *options*) [<>](https://github.com/observablehq/inspector/blob/main/src/render.ts "Source")

Returns an interactive DOM element representing the specified *inspection*; objects can be expanded and collapsed by clicking, and long strings can be expanded to show all lines. The supported *options* are:

* *name* - if present, the name to display before the value, as in `name = value`
* *expanded* - if true, objects are initially expanded and long strings are shown in full
