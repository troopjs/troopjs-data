define([ "../component/service", "troopjs-core/pubsub/topic", "../data/cache", "troopjs-core/util/deferred", "troopjs-core/util/merge"], function QueryModule(Service, Topic, cache, Deferred, merge) {
	var ARRAY = Array;
	var ARRAY_PROTO = ARRAY.prototype;
	var SLICE = ARRAY_PROTO.slice;
	var CONCAT = ARRAY_PROTO.concat;
	var PUSH = ARRAY_PROTO.push;
	var LENGTH = "length";
	var BATCHES = "batches";
	var INTERVAL = "interval";
	var NEWLINE = "\n";
	var RE_ID = /^(\w+![\w\d\-_]+)/gm;

	return Service.extend(function QueryService() {
		this[BATCHES] = ARRAY();
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
				self[BATCHES] = ARRAY();

				// Create deferred array
				var deferred = ARRAY();

				Deferred(function deferredRequest(dfdRequest) {
					var queries = ARRAY();
					var topics = ARRAY();
					var batch;
					var dfd;
					var i;
					var iMax;

					// Step through batches
					for (i = 0, iMax = batches[LENGTH]; i < iMax; i++) {
						// Get batch
						batch = batches[i];

						// Get deferred
						dfd = batch.deferred;

						// Add reject to dfdRequest
						dfdRequest.fail(dfd.reject);

						// Add batch.query to queries
						PUSH.apply(queries, batch.query);

						// Add batch.topic to topics
						PUSH.call(topics, batch.topic);

						// Add dfd to deferred
						PUSH.call(deferred, dfd);
					}

					// Publish ajax
					self.publish(Topic("ajax", self, topics), merge.call({
						"data": {
							"q": queries.join("|")
						}
					}, self.config.api.query), dfdRequest);
				})
				.done(function requestDone(data, textStatus, jqXHR) {
					var dfd;
					var guids;
					var i;
					var j;
					var iMax;
					var jMax;

					// Add all new data to cache
					cache.put(data);

					// Step through deferred
					for (i = 0, iMax = deferred[LENGTH]; i < iMax; i++) {
						// Get deferred
						dfd = deferred[i];

						// Get guids
						guids = dfd.guids;

						// Fill guids from cache
						for (j = 0, jMax = guids[LENGTH]; j < jMax; j++) {
							guids[j] = cache[guids[j]];
						}

						// Resolve original deferred
						dfd.resolve.apply(dfd, guids);
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

		"hub/query" : function query(topic, query /*, query, query, .., */, deferred) {
			var self = this;
			var length = arguments.length - 1;
			var batches = self[BATCHES];

			// Update (multi) query
			query = CONCAT.apply(ARRAY_PROTO, SLICE.call(arguments, 1, length));

			// Update deferred
			deferred = arguments[length];

			// Deferred query
			Deferred(function deferredQuery(dfd) {
				var matches;
				var guids = dfd.guids = [];

				// Get all id's from queries
				while(matches = RE_ID.exec(query.join(NEWLINE))) {
					guids.push(matches[1]);
				}

				// Add batch to batches
				batches.push({
					topic: topic,
					query: query,
					deferred: dfd
				});
			})
			.then(deferred.resolve, deferred.reject);
		}
	});
});
