/*globals buster:false*/	var assert = buster.assert;

buster.testCase("troopjs-data/cache/component", function (run) {
	"use strict";

	var assert = buster.referee.assert;
	var refute = buster.referee.refute;

	var CACHE = "cache";
	var INDEXED = "indexed";
	var EXPIRES = "expires";
	var TIMEOUT = "timeout";

	require( [ "troopjs-data/cache/component", "when/delay" ] , function (Cache, delay) {
		run({
			"setUp" : function () {
				// Create cache with 1 second generations
				var cache = this[CACHE] = Cache(1000);

				// Return promise of start
				return cache.start();
			},

			"tearDown" : function () {
				var me = this;

				return me[CACHE].stop().done(function () {
					// Delete cache instance
					delete me[CACHE];
				});
			},

			"with empty cache" : {
				"'whatever' is undefined" : function () {
					refute.defined(this[CACHE]["whatever"]);
				}
			},

			"with static data" : {
				"setUp" : function () {
					this[CACHE].put([{
						"id" : "one",
						"two" : {
							"id" : "two",
							"collapsed" : true
						}
					}, {
						"id" : "two"
					}]);
				},

				"'one' is defined" : function () {
					assert.defined(this[CACHE]["one"]);
				},

				"'one.two' is same as 'two'" : function () {
					var cache = this[CACHE];

					assert.same(cache["one"]["two"], cache["two"]);
				},

				"properties of 'one' are pruned after update" : function () {
					var cache = this[CACHE];
					var one = cache["one"];

					// Update cache with a non-collapsed object.
					cache.put({
						"id" : "one",
						"collapsed": false
					});

					// Two should be pruned.
					refute.defined(one["two"]);
				}
			},

			"test obj.indexed is updated for each put" : {
				"setUp" : function () {
					var me = this;

					// Set timeout
					me[TIMEOUT] = 1500;

					// Put foo in cache
					var foo = me[CACHE].put({
						"id" : "foo",
						"maxAge" : 10
					});

					// Save the last index.
					me[INDEXED] = foo[INDEXED];

					// At least 1s to get a different index
					return delay(1000);
				},

				"fresh put" : function () {
					var me = this;

					// Put bar in cache
					var bar = me[CACHE].put({
						id: "bar"
					});

					assert(bar[INDEXED] > me[INDEXED]);
				},

				"update put" : function () {
					var me = this;

					// Put foo in cache
					var foo = me[CACHE].put({
						id: "foo"
					});

					assert(foo[INDEXED] > me[INDEXED]);
				}
			}
		});
	});
});