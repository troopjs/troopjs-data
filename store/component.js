/**
 * TroopJS data/store/component module
 * @license MIT http://troopjs.mit-license.org/ © Mikael Karon mailto:mikael@karon.se
 */
/*global define:false */
define([ "troopjs-core/component/gadget", "when", "when/apply", "poly/array" ], function StoreModule(Gadget, when, apply) {
	var UNDEFINED;
	var OBJECT_TOSTRING = Object.prototype.toString;
	var TOSTRING_ARRAY = "[object Array]";
	var TOSTRING_OBJECT = "[object Object]";
	var TOSTRING_FUNCTION = "[object Function]";
	var TOSTRING_STRING = "[object String]";
	var ARRAY_SLICE = Array.prototype.slice;
	var LENGTH = "length";
	var ADAPTERS = "adapters";
	var STORAGE = "storage";
	var BEFORE_GET = "beforeGet";
	var AFTER_PUT = "afterPut";
	var CLEAR = "clear";
	var LOCKS = "locks";

	/**
	 * Applies method to this (if it exists)
	 * @param {string} method Method name
	 * @returns {boolean|*}
	 * @private
	 */
	function applyMethod(method) {
		var me = this;

		return method in me && me[method].apply(me, ARRAY_SLICE.call(arguments, 1));
	}

	/**
	 * Puts value
	 * @param {string|null} key Key - can be dot separated for sub keys
	 * @param {*} value Value
	 * @returns {Promise} Promise of put
	 * @private
	 */
	function put(key, value) {
		var self = this;
		var node = self[STORAGE];
		var parts = key
			? key.split(".")
			: [];
		var part;
		var last = parts.pop();

		while (node && (part = parts.shift())) {
			switch (OBJECT_TOSTRING.call(node)) {
				case TOSTRING_ARRAY :
				/* falls through */

				case TOSTRING_OBJECT :
					if (part in node) {
						node = node[part];
						break;
					}
				/* falls through */

				default :
					node = node[part] = {};
			}
		}

		// Evaluate value if needed
		if (OBJECT_TOSTRING.call(value) === TOSTRING_FUNCTION) {
			value = value.call(self, {
				"get" : function () {
					return get.apply(self, arguments);
				},
				"has" : function () {
					return has.apply(self, arguments);
				}
			}, key);
		}

		return last !== UNDEFINED
			// First store the promise, then override with the true value once resolved
			? when(value, function (result) {
			return node[last] = result;
		})
			// No key provided, just return a promise of the value
			: when(value);
	}

	/**
	 * Gets value
	 * @param {string} key Key - can be dot separated for sub keys
	 * @returns {*} Value
	 * @private
	 */
	function get(key) {
		var node = this[STORAGE];
		var parts = key.split(".");
		var part;

		while (node && (part = parts.shift())) {
			switch (OBJECT_TOSTRING.call(node)) {
				case TOSTRING_ARRAY :
				/* falls through */

				case TOSTRING_OBJECT :
					if (part in node) {
						node = node[part];
						break;
					}
				/* falls through */

				default :
					node = UNDEFINED;
			}
		}

		return node;
	}

	/**
	 * Check is key exists
	 * @param key {string} key Key - can be dot separated for sub keys
	 * @returns {boolean}
	 * @private
	 */
	function has(key) {
		var node = this[STORAGE];
		var parts = key.split(".");
		var part;
		var last = parts.pop();

		while (node && (part = parts.shift())) {
			switch (OBJECT_TOSTRING.call(node)) {
				case TOSTRING_ARRAY :
				/* falls through */

				case TOSTRING_OBJECT :
					if (part in node) {
						node = node[part];
						break;
					}
				/* falls through */

				default :
					node = UNDEFINED;
			}
		}

		return node !== UNDEFINED && last in node;
	}

	return Gadget.extend(function StoreComponent(adapter) {
		if (arguments[LENGTH] === 0) {
			throw new Error("No adapter(s) provided");
		}

		var self = this;

		self[ADAPTERS] = ARRAY_SLICE.call(arguments);
		self[STORAGE] = {};
		self[LOCKS] = {};
	}, {
		"displayName" : "data/store/component",

		/**
		 * Waits for store to be "locked"
		 * @param {string} key Key
		 * @param {function} [onFulfilled] onFulfilled callback
		 * @param {function} [onRejected] onRejected callback
		 * @param {function} [onProgress] onProgress callback
		 * @returns {Promise} Promise of ready
		 */
		"lock" : function (key, onFulfilled, onRejected, onProgress) {
			var locks = this[LOCKS];

			if (OBJECT_TOSTRING.call(key) !== TOSTRING_STRING) {
				throw new Error("key has to be of type string");
			}

			return locks[key] = when(locks[key], onFulfilled, onRejected, onProgress);
		},

		/**
		 * Gets state value
		 * @param {string..} key Key - can be dot separated for sub keys
		 * @param {function} [onFulfilled] onFulfilled callback
		 * @param {function} [onRejected] onRejected callback
		 * @param {function} [onProgress] onProgress callback
		 * @returns {Promise} Promise of value
		 */
		"get" : function (key, onFulfilled, onRejected, onProgress) {
			var self = this;
			var keys = ARRAY_SLICE.call(arguments);
			var i;
			var iMax;

			// Step until we hit the end or keys[i] is not a string
			for (i = 0, iMax = keys[LENGTH]; i < iMax && OBJECT_TOSTRING.call(keys[i]) === TOSTRING_STRING; i++);

			// Update callbacks
			onFulfilled = keys[i];
			onRejected = keys[i+1];
			onProgress = keys[i+2];

			// Set the new length of keys
			keys[LENGTH] = i;

			return when
				.map(keys, function (key) {
					return when
						// Map adapters and BEFORE_GET on each adapter
						.map(self[ADAPTERS], function (adapter) {
							return when(applyMethod.call(adapter, BEFORE_GET, self, key));
						})
						// Get value from STORAGE
						.then(function () {
							return get.call(self, key);
						});
				})
				// Add callbacks
				.then(onFulfilled && apply(onFulfilled), onRejected, onProgress);
		},

		/**
		 * Puts state value
		 * @param {string} key Key - can be dot separated for sub keys
		 * @param {*} value Value
		 * @param {function} [onFulfilled] onFulfilled callback
		 * @param {function} [onRejected] onRejected callback
		 * @param {function} [onProgress] onProgress callback
		 * @returns {Promise} Promise of value
		 */
		"put" : function (key, value, onFulfilled, onRejected, onProgress) {
			var self = this;

			return when(put.call(self, key, value), function (result) {
				return when
					// Map adapters and AFTER_PUT on each adapter
					.map(self[ADAPTERS], function (adapter) {
						return when(applyMethod.call(adapter, AFTER_PUT, self, key, result));
					})
					.yield(result);
			})
				// Add callbacks
				.then(onFulfilled, onRejected, onProgress);
		},

		/**
		 * Puts state value if key is UNDEFINED
		 * @param {string} key Key - can be dot separated for sub keys
		 * @param {*} value Value
		 * @param {function} [onFulfilled] onFulfilled callback
		 * @param {function} [onRejected] onRejected callback
		 * @param {function} [onProgress] onProgress callback
		 * @returns {Promise} Promise of value
		 */
		"putIfNotHas" : function (key, value, onFulfilled, onRejected, onProgress) {
			var self = this;

			return !self.has(key)
				? self.put(key, value, onFulfilled, onRejected, onProgress)
				: when(UNDEFINED, onFulfilled, onRejected, onProgress);
		},

		/**
		 * Checks if key exists
		 * @param {string} key Key - can be dot separated for sub keys
		 * @returns {boolean} True if key exists, otherwise false
		 */
		"has" : function (key) {
			return has.call(this, key);
		},

		/**
		 * Clears all adapters
		 * @param {function} [onFulfilled] onFulfilled callback
		 * @param {function} [onRejected] onRejected callback
		 * @param {function} [onProgress] onProgress callback
		 * @returns {Promise} Promise of clear
		 */
		"clear" : function (onFulfilled, onRejected, onProgress) {
			var self = this;

			return when
				.map(self[ADAPTERS], function (adapter) {
					return when(applyMethod.call(adapter, CLEAR, self));
				})
				// Add callbacks
				.then(onFulfilled && apply(onFulfilled), onRejected, onProgress);
		}
	});
});