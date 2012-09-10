define([ "../component/service", "../data/query", "troopjs-core/pubsub/topic", "troopjs-utils/deferred", "troopjs-utils/merge" ], function QueryServiceModule(Service, Query, Topic, Deferred, merge) {
    var UNDEFINED;
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
    var TEXT = "text";
    var ID = "id";
    var Q = "q";
    var RE = /("|')(.*?)\1/;

    return Service.extend(function QueryService(cache) {
        var me = this;

        me[BATCHES] = [];
        me[CACHE] = cache;
    }, {
        displayName : "ef/service/query",

        "sig/start" : function start(signal, deferred) {
            var me = this;
            var cache = me[CACHE];

            // Set interval (if we don't have one)
            me[INTERVAL] = INTERVAL in me
                ? me[INTERVAL]
                : setInterval(function batchInterval() {
                var batches = me[BATCHES];

                // Return fast if there is nothing to do
                if (batches[LENGTH] === 0) {
                    return;
                }

                // Reset batches
                me[BATCHES] = [];

                Deferred(function deferredRequest(dfdRequest) {
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

                    // No q, might as well resolve
                    if (q[LENGTH] === 0) {
                        dfdRequest.resolve(q);
                    }
                    // Otherwise request from backend
                    else {
                        // Publish ajax
                        me.publish(Topic("ajax", me, topics), merge.call({
                            "data": {
                                "q": q.join("|")
                            }
                        }, me.config.api.query), dfdRequest);
                    }
                })
                    .done(function doneRequest(data /* , textStatus, jqXHR */) {
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
                            batch.resolve.apply(batch, queries);
                        }
                    })
                    .fail(function failRequest() {
                        var batch;
                        var i;

                        // Iterate batches
                        for (i = batches[LENGTH]; i--;) {
                            batch = batches[i];

                            // Reject (with original queries as argument)
                            batch.reject.apply(batch, batch[QUERIES]);
                        }
                    })
                    .progress(deferred.notify);
            }, 200);

            if (deferred) {
                deferred.resolve();
            }
        },

        "sig/stop" : function stop(signal, deferred) {
            var me = this;

            // Only do this if we have an interval
            if (INTERVAL in me) {
                // Clear interval
                clearInterval(me[INTERVAL]);

                // Reset interval
                delete me[INTERVAL];
            }

            if (deferred) {
                deferred.resolve();
            }
        },

        "hub/query" : function query(topic /* query, query, query, .., */, deferred) {
            var me = this;
            var length = arguments[LENGTH] - 1;
            var batches = me[BATCHES];
            var cache = me[CACHE];

            // Slice and flatten queries
            var queries = CONCAT.apply(ARRAY_PROTO, SLICE.call(arguments, 1, length));

            // Update deferred to be the last argument
            deferred = arguments[length];

            // Deferred batch
            Deferred(function deferredBatch(batch) {
                var query;
                var q = [];
                var id = [];
                var ast;
                var i;
                var iMax;

                // Iterate queries
                for (i = 0, iMax = queries[LENGTH]; i < iMax; i++) {
                    // Init Query
                    query = Query(queries[i]);

                    // Get AST
                    ast = query.ast();

                    // Store unescaped ID
                    id[i] = ast[LENGTH] > 0
                        ? ast[0][TEXT].replace(RE, "$2")
                        : UNDEFINED;

                    // Get reduced AST
                    ast = query.reduce(cache).ast();

                    // If we're not fully reduced
                    if (ast[LENGTH] > 0) {
                        //  Add string version of reduced query to q
                        PUSH.call(q, query.rewrite());
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
                    batch.resolve.apply(batch, queries);
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
            })
            .then(deferred.resolve, deferred.reject, deferred.notify);
        }
    });
});
