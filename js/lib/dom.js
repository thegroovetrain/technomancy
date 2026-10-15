// Small DOM helpers shared across tools. Loaded as a classic script, so these
// are plain globals.

// Query a required element, throwing a clear error if it is missing.
function $(selector, root) {
  var el = (root || document).querySelector(selector);
  if (!el) throw new Error("Missing element: " + selector);
  return el;
}

// Create an element with optional attributes and children.
function el(tag, attrs) {
  var node = document.createElement(tag);
  if (attrs) {
    for (var k in attrs) node.setAttribute(k, attrs[k]);
  }
  for (var i = 2; i < arguments.length; i++) node.append(arguments[i]);
  return node;
}
