define([ "../component/service", "troopjs-core/pubsub/topic", "../data/cache", "troopjs-core/util/deferred", "troopjs-core/util/merge"], function QueryModule(Service, Topic, cache, Deferred, merge) {
	var UNDEFINED = undefined;
	var ARRAY = Array;
	var ARRAY_PROTO = ARRAY.prototype;
	var SLICE = ARRAY_PROTO.slice;
	var CONCAT = ARRAY_PROTO.concat;
	var PUSH = ARRAY_PROTO.push;
	var LENGTH = "length";
	var BATCHES = "batches";
	var INTERVAL = "interval";

	return Service.extend(function QueryService() {
		this[BATCHES] = [];
	}, {
		displayName : "ef/service/query",

		"sig/start" : function start(signal, deferred) {
			var self = this;

			// Return fast if we already have an interval
			if (INTERVAL in self) {
				return;
			}

			// Set interval
			self[INTERVAL] = setInterval(function interval() {
				var batches = self[BATCHES];

				// Return fast if there is nothing to do
				if (batches[LENGTH] === 0) {
					return;
				}

				// Reset batches
				self[BATCHES] = [];

				Deferred(function deferredRequest(dfdRequest) {
					var q = [];
					var topics = [];
					var dfd;
					var i;
					var iMax;

					// Step through batches
					for (i = 0, iMax = batches[LENGTH]; i < iMax; i++) {
						// Get dfd
						dfd = batches[i];

						// Add reject to dfdRequest
						dfdRequest.fail(dfd.reject);

						// Add dfd.q to q
						PUSH.apply(q, dfd.q);

						// Add dfd.topic to topics
						PUSH.call(topics, dfd.topic);
					}

					// No data, might as well resolve
					if (q.length === 0) {
						dfdRequest.resolve([]);
					}
					// Otherwise request from backend
					else {
						// Publish ajax
						self.publish(Topic("ajax", self, topics), merge.call({
							"data": {
								"q": q.join("|")
							}
						}, self.config.api.query), dfdRequest);
					}
				})
				.done(function requestDone(data, textStatus, jqXHR) {
					var dfd;
					var guid;
					var guids;
					var queries;
					var i;
					var j;
					var iMax;
					var jMax;

					// Add all new data to cache
					cache.put(data);

					// Step through deferred
					for (i = 0, iMax = batches[LENGTH]; i < iMax; i++) {
						// Get deferred
						dfd = batches[i];

						// Get queries
						queries = dfd.queries;

						// Get guids
						guids = dfd.guids;

						// Fill query from cache
						for (j = 0, jMax = guids[LENGTH]; j < jMax; j++) {
							guid = guids[j];

							if (guid !== UNDEFINED) {
								queries[j] = cache[guid];
							}
						}

						// Resolve original deferred
						dfd.resolve.apply(dfd, queries);
					}
				})
				.fail(function requestFail() {
					var i;
					var iMax;
					var dfd;

					// Step through deferred
					for (i = 0, iMax = batches[LENGTH]; i < iMax; i++) {
						// Get deferred
						dfd = batches[i];

						// Reject (with original query as argument)
						dfd.reject.apply(dfd, dfd.queries);
					}
				});
			}, 200);

			if (deferred) {
				deferred.resolve();
			}

			return self;
		},

		"sig/stop" : function stop(signal, deferred) {
			var self = this;

			// Return fast if no interval
			if (!(INTERVAL in self)) {
				return
			}

			// Clear interval
			clearInterval(self[INTERVAL]);

			if (deferred) {
				deferred.resolve();
			}

			// Reset interval
			delete self[INTERVAL];
		},

		"hub/query" : function query(topic /* query, query, query, .., */, deferred) {
			var self = this;
			var length = arguments.length - 1;
			var batches = self[BATCHES];

			// Update (multi) query
			var queries = CONCAT.apply(ARRAY_PROTO, SLICE.call(arguments, 1, length));

			// Update deferred
			deferred = arguments[length];

			// Deferred query
			Deferred(function deferredQuery(dfd) {
				var re = /^(\w+![\w\d\-_]+)/;
				var matches;
				var query;

				// Create guids
				var guids = dfd.guids = [];
				// Create q
				var q = dfd.q = [];

				// Get queries length
				var i = queries.length;

				while (i--) {
					query = queries[i];

					// Check if this was a valid query
					if (matches = re.exec(query)) {
						// Update guids
						guids[i] = matches[1];

						// Push query to q
						q.push(query);
					}
					else {
						// Otherwise just store UNDEFINED at index
						guids[i] = UNDEFINED;
					}
				}

				// Store original topic and queries
				dfd.topic = topic;
				dfd.queries = queries;

				// Add batch to batches
				batches.push(dfd);
			})
			.then(deferred.resolve, deferred.reject);
		}
	});
});
