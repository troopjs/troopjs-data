buster.testCase("troopjs-ef/data/cache", function (run) {
    var assert = buster.assert;
    var refute = buster.assertions.refute;

    require( [ "troopjs-ef/data/cache" ] , function (Cache) {
        run({
            "setUp" : function () {
                var cache = this.cache = Cache().start();

                console.log("new cache %s", cache);
            },

            "tearDown" : function () {
                var cache = this.cache.stop();

                console.log("delete cache %s", cache);

                delete this.cache;
            },

            "with emty cache" : {
                "'whatever' is undefined" : function () {
                    refute.defined(this.cache["whatever"]);
                }
            },

            "with static data" : {
                "setUp" : function () {
                    this.cache.put([{
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
                    assert.defined(this.cache["one"]);
                },

                "'one.two' is same as 'two'" : function () {
                    var cache = this.cache;

                    assert.same(cache["one"]["two"], cache["two"]);
                }
            },

            "with maxAged data 'one' is cached" : {
                "setUp" : function () {
                    this.msec = 1 << 16;

                    console.log("setUp");

                    this.cache.put([{
                        "id" : "one",
                        "maxAge" : 1000
                    }, {
                        "id" : "two",
                        "maxAge" : 2000,
                        "one" : {
                            "id" : "one",
                            "collapsed" : true
                        }
                    }]);
                },

                "from the start" : function () {
                    assert.defined(this.cache["one"]);
                },

                "for at least half but at most one generation" : function (done) {
                    var cache = this.cache;
                    var msec = this.msec / 2;

                    setTimeout(function () {
                        assert.defined(cache["one"], "(cached for half of one generation) 'one'");

                        setTimeout(function () {
                            refute.defined(cache["one"], "(expired after one generation) 'one'");
                            done();
                        }, msec)
                    }, msec);

                    this.timeout = msec * 2 + 100;
                }
            },

            "with maxAged data 'two' is cached" : {
                "setUp" : function () {
                    this.msec = 1 << 16;

                    console.log("with maxAged data 'two' is cached");

                    this.cache.put([{
                        "id" : "one",
                        "maxAge" : 1000
                    }, {
                        "id" : "two",
                        "maxAge" : 2000,
                        "one" : {
                            "id" : "one",
                            "collapsed" : true
                        }
                    }]);
                },

                "from the start" : function () {
                    assert.defined(this.cache["two"]);
                },

                "for at least one but at most two generations" : function (done) {
                    var cache = this.cache;
                    var msec = this.msec;

                    setTimeout(function () {
                        assert.defined(cache["two"], "(cached for one generation) 'two'");

                        setTimeout(function () {
                            refute.defined(cache["two"], "(expired after two generations) 'two'");
                            done();
                        }, msec);
                    }, msec);

                    this.timeout = msec * 2 + 100;
                }
            }
        });
    });
});