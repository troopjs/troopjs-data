/**
 * TroopJS data/query/service
 * @license MIT http://troopjs.mit-license.org/ © Mikael Karon mailto:mikael@karon.se
 */
/*global define:false */
define([ "module", "troopjs-core/component/service", "./component", "troopjs-core/pubsub/topic", "when", "troopjs-utils/merge" ], function QueryServiceModule(module, Service, Query, Topic, when, merge) {
	/*jshint laxbreak:true */

	var ARRAY_PROTO = Array.prototype;
	var SLICE = ARRAY_PROTO.slice;
	var CONCAT = ARRAY_PROTO.concat;
	var PUSH = ARRAY_PROTO.push;
	var LENGTH = "length";
	var BATCHES = "batches";
	var INTERVAL = "interval";
	var CACHE = "cache";
	var TOPIC = "topic";
	var QUERIES = "queries";
	var RESOLVED = "resolved";
	var RAW = "raw";
	var ID = "id";
	var Q = "q";
	var CONFIG = module.config();

	var QueryService = Service.extend(function QueryService(cache) {
		var self = this;

		self[BATCHES] = [];
		self[CACHE] = cache;
	}, {
		"displayName" : "data/query/service",

		"sig/start" : function start() {
			var self = this;
			var cache = self[CACHE];

			// Set interval (if we don't have one)
			self[INTERVAL] = INTERVAL in self
				? self[INTERVAL]
				: setInterval(function scan() {
				var batches = self[BATCHES];

				// Return fast if there is nothing to do
				if (batches[LENGTH] === 0) {
					return;
				}

				// Reset batches
				self[BATCHES] = [];

				function request() {
					var q = [];
					var topics = [];
					var batch;
					var i;

					// Iterate batches
					for (i = batches[LENGTH]; i--;) {
						batch = batches[i];

						// Add batch[TOPIC] to topics
						PUSH.call(topics, batch[TOPIC]);

						// Add batch[Q] to q
						PUSH.apply(q, batch[Q]);
					}

					// Publish ajax
					return self.publish(Topic("ajax", self, topics), merge.call({
						"data": {
							"q": q.join("|")
						}
					}, CONFIG));
				}

				function done(data) {
					var batch;
					var queries;
					var id;
					var i;
					var j;

					// Add all new data to cache
					cache.put(data);

					// Iterate batches
					for (i = batches[LENGTH]; i--;) {
						batch = batches[i];
						queries = batch[QUERIES];
						id = batch[ID];

						// Iterate queries
						for (j = queries[LENGTH]; j--;) {
							// If we have a corresponding ID, fetch from cache
							if (j in id) {
								queries[j] = cache[id[j]];
							}
						}

						// Resolve batch
						batch.resolve(queries);
					}
				}

				function fail() {
					var batch;
					var i;

					// Iterate batches
					for (i = batches[LENGTH]; i--;) {
						batch = batches[i];

						// Reject (with original queries as argument)
						batch.reject(batch[QUERIES]);
					}
				}

				// Request and handle response
				return request().then(done, fail);
			}, 200);
		},

		"sig/stop" : function stop() {
			var self = this;

			// Only do this if we have an interval
			if (INTERVAL in self) {
				// Clear interval
				clearInterval(self[INTERVAL]);

				// Reset interval
				delete self[INTERVAL];
			}
		},

		"hub/query" : function hubQuery(topic /* query, query, query, .., */) {
			var self = this;
			var batches = self[BATCHES];
			var cache = self[CACHE];
			var q = [];
			var id = [];
			var ast;
			var i;
			var j;
			var iMax;
			var queries;
			var query;

			// Create deferred batch
			var batch = when.defer();

			try {
				// Slice and flatten queries
				queries = CONCAT.apply(ARRAY_PROTO, SLICE.call(arguments, 1));

				// Iterate queries
				for (i = 0, iMax = queries[LENGTH]; i < iMax; i++) {
					// Init Query
					query = Query(queries[i]);

					// Get AST
					ast = query.ast();

					// If we have an ID
					if (ast[LENGTH] > 0) {
						// Store raw ID
						id[i] = ast[0][RAW];
					}

					// Get reduced AST
					ast = query.reduce(cache).ast();

					// Step backwards through AST
					for (j = ast[LENGTH]; j-- > 0;) {
						// If this op is not resolved
						if (!ast[j][RESOLVED]) {
							// Add rewritten (and reduced) query to q
							PUSH.call(q, query.rewrite());
							break;
						}
					}
				}

				// If all queries were fully reduced, we can quick resolve
				if (q[LENGTH] === 0) {
					// Iterate queries
					for (i = 0; i < iMax; i++) {
						// If we have a corresponding ID, fetch from cache
						if (i in id) {
							queries[i] = cache[id[i]];
						}
					}

					// Resolve batch
					batch.resolve(queries);
				}
				else {
					// Store properties on batch
					batch[TOPIC] = topic;
					batch[QUERIES] = queries;
					batch[ID] = id;
					batch[Q] = q;

					// Add batch to batches
					batches.push(batch);
				}
			}
			catch (e) {
				batch.reject(e);
			}

			// Return promise
			return batch.promise;
		}
	});

	QueryService.config = function config(_config) {
		return merge.call(CONFIG, _config);
	};

	return QueryService;
});
