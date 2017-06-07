/*eslint-disable */

// Sets to true if running inside Node.js environment with extra check for
// `process.browser` to skip Karma runner environment. Karma environment has
// `process` defined even though it runs on the browser.
const isNode = (typeof process !== 'undefined') && !process.browser;

if (isNode && process.env.NODE_ENV !== 'test') {
	// Overrides global.IncrementalDOM virutal elements with incremental dom
	// string implementation for server side rendering. At the moment it does not
	// override for Node.js tests since tests are using jsdom to simulate the
	// browser.

	const scope = global;

	(function (global, factory) {
		factory(global.IncrementalDOM = global.IncrementalDOM || {});
	})(scope, function (exports) {

    // =========================================================================

    /**
     * An array used to store the strings generated by calls to
     * elementOpen, elementOpenStart, elementOpenEnd, elementEnd and elementVoid
     */
    exports.buffer = [];

    /** @type {?Object} */
    exports.currentParent = null;

    /**
     * Gets the current Element being patched.
     * @return {!Element}
     */
    const currentElement = function () {
      return exports.currentParent;
    };

    /**
     * @return {Node} The Node that will be evaluated for the next instruction.
     */
    const currentPointer = function () {
      return {};
    };

    /**
     * Patches an Element with the the provided function. Exactly one top level
     * element call should be made corresponding to `node`.
     *
     * @param {?object} node The Element where the patch should start.
     * @param {!function(T)} fn A function containing open/close/etc. calls that
     *     describe the DOM. This should have at most one top level element call.
     * @param {T=} data An argument passed to fn to represent DOM state.
     * @return {void} Nothing.
     */
    const patch = function (node, fn, data) {
      exports.currentParent = node;
      fn(data);
      exports.currentParent.innerHTML = exports.buffer.join('');
      exports.buffer = [];
      return exports.currentParent;
    };

    const patchOuter = patch;
    const patchInner = patch;

    /**
     * Declares a virtual Text at this point in the document.
     *
     * @param {string|number|boolean} value The value of the Text.
     * @param {...(function((string|number|boolean)):string)} var_args
     *     Functions to format the value which are called only when the value has
     *     changed.
     *
     * @return {void} Nothing.
     */
    const text = function (value, var_args) {
      let formatted = value;
      for (let i = 1; i < arguments.length; i += 1) {
        const fn = arguments[i];
        formatted = fn(formatted);
      }
      exports.buffer.push(formatted);
    };

    /** @const */
    const symbols = {
      default: '__default'
    };

    /** @const */
    const attributes = {};

    /**
     * Calls the appropriate attribute mutator for this attribute.
     * @param {!Array.<string>} el Buffer representation of element attributes.
     * @param {string} name The attribute's name.
     * @param {*} value The attribute's value.
     */
    const updateAttribute = function (el, name, value) {
      const mutator = attributes[name] || attributes[symbols.default];
      mutator(el, name, value);
    };

    // Special generic mutator that's called for any attribute that does not
    // have a specific mutator.
    attributes[symbols.default] = function (el, name, value) {
      if (Array.isArray(el)) {
        el.push(` ${name}="${value}"`);
      }
    };

    /**
     * Truncates an array, removing items up until length.
     * @param {!Array<*>} arr The array to truncate.
     * @param {number} length The new length of the array.
     */
    const truncateArray = function (arr, length) {
      while (arr.length > length) {
        arr.pop();
      }
    };

    /**
     * The offset in the virtual element declaration where the attributes are
     * specified.
     * @const
     */
    const ATTRIBUTES_OFFSET = 3;

    /**
     * Builds an array of arguments for use with elementOpenStart, attr and
     * elementOpenEnd.
     * @const {!Array<*>}
     */
    const argsBuilder = [];

    /**
     * Defines a virtual attribute at this point of the DOM. This is only valid
     * when called between elementOpenStart and elementOpenEnd.
     *
     * @param {string} name The attribute's name.
     * @param {*} value The attribute's value.
     * @return {void} Nothing.
     */
    const attr = function (name, value) {
      argsBuilder.push(name);
      argsBuilder.push(value);
    };

    /**
     * Closes an open virtual Element.
     *
     * @param {string} The Element's tag.
     * @return {void} Nothing.
     */
    const elementClose = function (nameOrCtor) {
      if (typeof nameOrCtor === 'function') {
        new nameOrCtor();
        return;
      }
      exports.buffer.push(`</${nameOrCtor}>`);
    };

    /**
     * Declares a virtual Element at the current location in the document that has
     * no children.
     *
     * @param {string} The Element's tag or constructor.
     * @param {?string=} key The key used to identify this element. This can be an
     *     empty string, but performance may be better if a unique value is used
     *     when iterating over an array of items.
     * @param {?Array<*>=} statics An array of attribute name/value pairs of the
     *     static attributes for the Element. These will only be set once when the
     *     Element is created.
     * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
     *     for the Element.
     * @return {void} Nothing.
     */
    const elementVoid = function (nameOrCtor, key, statics, var_args) {
      elementOpen.apply(null, arguments);
      return elementClose(nameOrCtor);
    };

    /**
     * @param {!string} nameOrCtor The Element's tag or constructor.
     * @param {?string=} key The key used to identify this element. This can be an
     *     empty string, but performance may be better if a unique value is used
     *     when iterating over an array of items.
     * @param {?Array<*>=} statics An array of attribute name/value pairs of the
     *     static attributes for the Element. These will only be set once when the
     *     Element is created.
     * @param {...*} var_args, Attribute name/value pairs of the dynamic attributes
     *     for the Element.
     * @return {void} Nothing.
     */
    const elementOpen = function (nameOrCtor, key, statics, var_args) {
      if (typeof nameOrCtor === 'function') {
        new nameOrCtor();
        return exports.currentParent;
      }

      exports.buffer.push(`<${nameOrCtor}`);

      if (statics) {
        for (let i = 0; i < statics.length; i += 2) {
          const name = /** @type {string} */statics[i];
          const value = statics[i + 1];
          updateAttribute(exports.buffer, name, value);
        }
      }

      let i = ATTRIBUTES_OFFSET;
      let j = 0;

      for (; i < arguments.length; i += 2, j += 2) {
        const name = arguments[i];
        const value = arguments[i + 1];
        updateAttribute(exports.buffer, name, value);
      }

      exports.buffer.push('>');

      return exports.currentParent;
    };

    /**
     * Closes an open tag started with elementOpenStart.
     *
     * @return {void} Nothing.
     */
    const elementOpenEnd = function () {
      elementOpen.apply(null, argsBuilder);
      truncateArray(argsBuilder, 0);
    };

    /**
     * Declares a virtual Element at the current location in the document. This
     * corresponds to an opening tag and a elementClose tag is required. This is
     * like elementOpen, but the attributes are defined using the attr function
     * rather than being passed as arguments. Must be folllowed by 0 or more calls
     * to attr, then a call to elementOpenEnd.
     * @param {string} nameOrCtor The Element's tag or constructor.
     * @param {?string=} key The key used to identify this element. This can be an
     *     empty string, but performance may be better if a unique value is used
     *     when iterating over an array of items.
     * @param {?Array<*>=} statics An array of attribute name/value pairs of the
     *     static attributes for the Element. These will only be set once when the
     *     Element is created.
     * @return {void} Nothing.
     */
    const elementOpenStart = function (nameOrCtor, key, statics) {
      argsBuilder[0] = nameOrCtor;
      argsBuilder[1] = key;
      argsBuilder[2] = statics;
    };

    /**
     * Returns the constructred DOM string at this point.
     * @param {function} fn
     * @return {string} The constructed DOM string.
     */
    const renderToString = function (fn) {
      patch({}, fn);
      return currentElement().innerHTML;
    };

    exports.currentElement = currentElement;
    exports.currentPointer = currentPointer;
    exports.patch = patch;
    exports.patchInner = patchInner;
    exports.patchOuter = patchOuter;
    exports.text = text;
    exports.attr = attr;
    exports.elementClose = elementClose;
    exports.elementOpen = elementOpen;
    exports.elementOpenEnd = elementOpenEnd;
    exports.elementOpenStart = elementOpenStart;
    exports.elementVoid = elementVoid;
    exports.renderToString = renderToString;
    exports.symbols = symbols;
    exports.attributes = attributes;
    exports.updateAttribute = updateAttribute;

    Object.defineProperty(exports, '__esModule', { value: true });

    // =========================================================================

	});

	/* eslint-enable */
}
